import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// تهيئة Stripe مع حماية التوافقية وإصدار مستقر
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2025-01-01' as any, // أو اتركها بدون التثبيت الصارم إذا كنت تستخدم أحدث إصدار للمكتبة
})

export async function POST(request: Request) {
    try {
        const supabase = createClient()
        const { orderId, customerEmail } = await request.json()

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
        }

        // 1. حماية المتجر: جلب تفاصيل الطلب والمنتجات الحقيقية من قاعدة البيانات لمنع تزوير الأسعار
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*, items') // نضمن جلب مصفوفة الـ items المخزنة داخل الطلب بالسعر المحمي
            .eq('id', orderId)
            .single()

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found or database error' }, { status: 404 })
        }

        // منع إعادة دفع الطلبات المنتهية
        if (order.status === 'delivered' || order.status === 'cancelled') {
            return NextResponse.json({ error: 'This order has already been processed or cancelled' }, { status: 400 })
        }

        // 2. بناء الـ Line Items بناءً على بيانات الـ DB الرسمية والآمنة
        const secureLineItems = (order.items as any[]).map((item: any) => {
            // 🚨 تصحيح مالي حاسم لـ Stripe: الدينار الأردني JOD يعتمد على 3 خانات عشرية (الضرب بـ 1000 فلس)
            const unitAmountInFils = Math.round((item.price || item.product?.price) * 1000)

            return {
                price_data: {
                    currency: 'jod',
                    product_data: {
                        name: item.product?.name || item.name || 'باقة فاخرة من FLORÉ',
                        images: item.product?.image ? [item.product.image] : [],
                        description: item.product?.description || '',
                    },
                    unit_amount: unitAmountInFils,
                },
                quantity: item.quantity || 1,
            }
        })

        // 3. إنشاء جلسة الدفع الآمنة من Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: secureLineItems,
            mode: 'payment',
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order=${orderId}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart?canceled=true`,
            customer_email: customerEmail || undefined,
            metadata: {
                orderId,
            },
        })

        // 4. ربط معرّف الجلسة بالطلب في الـ Supabase للمطابقة الفورية عبر الـ Webhook لاحقاً
        await supabase
            .from('orders')
            .update({
                payment_transaction_id: session.id,
                payment_method: 'Stripe',
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId)

        return NextResponse.json({ sessionId: session.id, url: session.url })

    } catch (globalError: any) {
        console.error('Stripe Integration Error:', globalError.message)
        return NextResponse.json({
            error: 'Internal Server Error',
            details: globalError.message
        }, { status: 500 })
    }
}