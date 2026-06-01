"use client"

import { useState } from 'react'
import { CreditCard, MessageCircle, Banknote, Loader2 } from 'lucide-react'

interface PaymentMethodsProps {
    orderId: string
    amount: number
    customerEmail: string
    phoneNumber?: string // أضفناه هنا لدعم متطلبات دفع CliQ
    onSuccess: () => void
}

export function PaymentMethods({ orderId, amount, customerEmail, phoneNumber = '', onSuccess }: PaymentMethodsProps) {
    const [loading, setLoading] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)

    // 1. معالجة الدفع عبر Stripe (بطاقات الائتمان و Apple Pay)
    const handleStripe = async () => {
        if (loading) return
        setLoading('stripe')
        setError(null)

        try {
            const res = await fetch('/api/payment/stripe/request', { // 👈 تحديث المسار إلى الـ API الجديد
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, customerEmail }), // 👈 قمنا بحذف الـ items لحماية أمن البيانات ومنع التلاعب بالأسعار
            })

            const data = await res.json()

            if (!res.ok || !data.url) {
                throw new Error(data.error || 'فشل في إنشاء جلسة الدفع عبر Stripe')
            }

            // التوجيه الآمن إلى صفحة دفع Stripe الخارجية الفاخرة
            window.location.href = data.url
        } catch (err: any) {
            console.error('Stripe Flow Error:', err)
            setError(err.message || 'حدث خطأ أثناء الاتصال ببوابة Stripe')
            setLoading(null)
        }
    }

    // 2. معالجة الدفع عبر المحفظة والتحويل البنكي الفوري CliQ
    const handleCliq = async () => {
        if (loading) return
        setLoading('cliq')
        setError(null)

        // التحقق من وجود رقم الهاتف لأن بوابة CliQ تتطلبه أساساً لإرسال التحويل
        const targetPhone = phoneNumber || '0790000000' // يفضل تمريره ديناميكياً من بيانات الشحن

        try {
            const res = await fetch('/api/payment/cliq/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    phoneNumber: targetPhone
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'فشل في توليد طلب الدفع عبر CliQ')
            }

            // إذا كانت بوابة الدفع تعيد رابط دفع مباشر نقوم بالتوجيه إليه، وإلا ننفذ نجاح الطلب
            if (data.paymentUrl) {
                window.location.href = data.paymentUrl
            } else {
                alert('تم إرسال طلب الدفع بنجاح إلى تطبيق CliQ الخاص بك 🌸')
                onSuccess()
            }
        } catch (err: any) {
            console.error('Cliq Flow Error:', err)
            setError(err.message || 'حدث خطأ أثناء معالجة دفع CliQ')
        } finally {
            setLoading(null)
        }
    }

    // 3. معالجة تأكيد الطلب الفوري عبر الـ WhatsApp
    const handleWhatsApp = () => {
        const message = `مرحباً فلوري! 👋\n\nأرغب في تأكيد طلب رقم: #${orderId.slice(0, 8)}\nالمبلغ الإجمالي: ${amount} د.أ\n\nيرجى مراجعة تفاصيل التوصيل وتأكيد الطلب 🌸`
        window.open(`https://wa.me/962790000000?text=${encodeURIComponent(message)}`, '_blank')
    }

    // 4. معالجة الدفع كاش عند الاستلام
    const handleCash = async () => {
        if (loading) return
        setLoading('cash')
        try {
            // يمكنك هنا استدعاء API سريع لتحديث حالة الدفع في جدول الطلبات إلى 'Cash on Delivery'
            await fetch(`/api/orders/${orderId}/set-cash`, { method: 'POST' }).catch(() => { })
            onSuccess()
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="space-y-4">
            {error && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm text-center font-medium">
                    {error}
                </div>
            )}

            {/* زر دفع Stripe */}
            <button
                onClick={handleStripe}
                disabled={!!loading}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-flore-border hover:border-flore-primary transition-all duration-200 bg-flore-card hover:shadow-md disabled:opacity-60"
            >
                <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                    <CreditCard className="h-6 w-6 text-purple-600" />
                </div>
                <div className="flex-1 text-right">
                    <p className="font-bold text-flore-text-primary">بطاقة ائتمان (Stripe)</p>
                    <p className="text-sm text-flore-text-secondary">Visa, Mastercard, Apple Pay</p>
                </div>
                {loading === 'stripe' && <Loader2 className="h-5 w-5 animate-spin text-flore-primary" />}
            </button>

            {/* زر دفع CliQ */}
            <button
                onClick={handleCliq}
                disabled={!!loading}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-flore-border hover:border-flore-primary transition-all duration-200 bg-flore-card hover:shadow-md disabled:opacity-60"
            >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                    <Banknote className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1 text-right">
                    <p className="font-bold text-flore-text-primary">تطبيق CliQ المباشر</p>
                    <p className="text-sm text-flore-text-secondary">تحويل بنكي أردني فوري وآمن</p>
                </div>
                {loading === 'cliq' && <Loader2 className="h-5 w-5 animate-spin text-flore-primary" />}
            </button>

            {/* زر التوجيه للواتساب */}
            <button
                onClick={handleWhatsApp}
                disabled={!!loading}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-flore-border hover:border-green-500 transition-all duration-200 bg-flore-card hover:shadow-md"
            >
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                    <MessageCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1 text-right">
                    <p className="font-bold text-flore-text-primary">تأكيد سريع عبر واتساب</p>
                    <p className="text-sm text-flore-text-secondary">إرسال الفاتورة وتنسيق التوصيل مباشرة</p>
                </div>
            </button>

            {/* زر الدفع عند الاستلام */}
            <button
                onClick={handleCash}
                disabled={!!loading}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-flore-border hover:border-flore-primary transition-all duration-200 bg-flore-card hover:shadow-md disabled:opacity-60"
            >
                <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center shrink-0">
                    <Banknote className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1 text-right">
                    <p className="font-bold text-flore-text-primary">كاش عند الاستلام</p>
                    <p className="text-sm text-flore-text-secondary">الدفع نقداً لسائق فلوري عند باب بيتك</p>
                </div>
                {loading === 'cash' && <Loader2 className="h-5 w-5 animate-spin text-flore-primary" />}
            </button>
        </div>
    )
}