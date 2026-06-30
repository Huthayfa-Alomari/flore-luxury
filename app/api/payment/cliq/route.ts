import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { NextResponse } from 'next/server'

// 1. تحديد الـ Schema لفحص البيانات المدخلة بصرامة
const CliQPaymentSchema = z.object({
  orderId: z.string().uuid(),
  customer_phone: z.string().min(9).max(15).optional(), // مطلوب فقط في حال كان الدفع كـ Guest
})

export async function POST(request: NextRequest) {
  const supabase = createClient()

  // جلب بيانات المستخدم المسجل إن وُجد (قد يكون null في حال الـ Guest Checkout)
  const { data: { user } } = await supabase.auth.getUser()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
  }

  // فحص صحة المدخلات عبر Zod
  const parsed = CliQPaymentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const { orderId, customer_phone } = parsed.data

  // 2. جلب بيانات الطلب من قاعدة البيانات للتحقق
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  // 3. 🛑 درع الحماية من الـ IDOR وفحص الملكية (Ownership Verification)
  if (order.user_id) {
    // الطلب تابع لمستخدم مسجل -> يجب أن يتطابق الـ user_id تماماً
    if (!user || order.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden: You do not own this order' }, { status: 403 })
    }
  } else {
    // الطلب تم كـ زائر (Guest) -> يجب التحقق من رقم الهاتف لمنع تتبع فواتير الآخرين
    if (!customer_phone || order.customer_phone !== customer_phone) {
      return NextResponse.json({ error: 'Forbidden: Invalid verification details for guest order' }, { status: 403 })
    }
  }

  // 4. فحص حالة الطلب لحماية السيرفر من الدفع المزدوج (Double Charging)
  if (order.status === 'paid') {
    return NextResponse.json({ error: 'Order is already processed and paid' }, { status: 400 })
  }

  try {
    // 💡 هنا يتم ربط الـ API الفعلي لبنك الاتحـاد أو البنك الأهلـي أو بوابة الدفع المعتمدة لـ CliQ
    console.log(`[CliQ Payment] Initiating CliQ transaction for order ${orderId} - Amount: ${order.total_price} JOD`)
    const supabase = createClient()

    // 1. التحقق من هوية المستخدم (اختياري حسب رغبتك إذا كنت تدعم الشراء كـ Guest أو فقط مسجلين)
    const { data: { user } } = await supabase.auth.getUser()

    const { orderId, phoneNumber } = await request.json()

    if (!orderId || !phoneNumber) {
      return NextResponse.json({ error: 'Order ID and Phone Number are required' }, { status: 400 })
    }

    // 2. حماية المتجر: جلب السعر الحقيقي من الـ Database لمنع التلاعب بالأسعار من المتصفح
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('total, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 })
    }

    // إذا كان الطلب مدفوعاً أو ملغياً بالفعل، نمنع إعادة الدفع
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return NextResponse.json({ error: 'This order cannot be processed for payment' }, { status: 400 })
    }

    const secureAmount = order.total // 👈 اعتماد السعر الحقيقي المحمي من قاعدة البيانات

    // 3. إرسال طلب الدفع الرسمي إلى بوابة CliQ الأردنية
    const cliqResponse = await fetch('https://api.cliq.jo/payment/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLIQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: secureAmount,
        currency: 'JOD',
        orderId: orderId,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/cliq/callback`,
        phoneNumber: phoneNumber,
        description: `FLORÉ Luxury Order #${orderId.slice(0, 8)}`,
      }),
    })

    if (!cliqResponse.ok) {
      const errorData = await cliqResponse.json().catch(() => ({}))
      return NextResponse.json({
        error: 'Failed to generate CliQ payment request',
        details: errorData.message || 'Gateway Error'
      }, { status: cliqResponse.status })
    }

    const data = await cliqResponse.json()

    // 4. تحديث الطلب في الـ Database لتسجيل رقم المعاملة للـ Audit والـ Callback لاحقاً
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_transaction_id: data.transactionId,
        payment_method: 'CliQ',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to bind transactionId to order:', updateError.message)
      // لا نوقف العملية هنا لأن رابط الدفع تم توليده بنجاح، ولكن يفضل تسجيلها بالـ Logs
    }

    // كمثال على الاستجابة الناجحة بعد التحقق من الملكية:
    return NextResponse.json({
      success: true,
      message: 'Payment verification passed. CliQ transfer initiated.',
      orderId: order.id,
      amount: order.total_price,
      currency: 'JOD'
    })
  } catch (error) {
    console.error('[CliQ Payment Error]:', error)
    return NextResponse.json({ error: 'Internal payment gateway error' }, { status: 500 })
      paymentUrl: data.paymentUrl,
      transactionId: data.transactionId,
    })

  } catch (globalError: any) {
    return NextResponse.json({
      error: 'Internal Server Error',
      details: globalError.message
    }, { status: 500 })
  }
}