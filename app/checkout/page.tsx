"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, User, MessageSquare, CreditCard, Banknote, MessageCircle, ArrowLeft } from 'lucide-react'
import { useCart } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/Button'
import { formatPrice, generateWhatsAppMessage } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, getTotal, clearCart } = useCart()
    const [loading, setLoading] = useState(false)
    const [userId, setUserId] = useState<string | null>(null)
    const [mounted, setMounted] = useState(false)
    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        region: 'amman',
        payment: 'whatsapp',
        giftMessage: '',
        notes: '',
    })

    const supabase = createClient()

    // التحقق من حالة الجلسة وحماية الصفحة من السلة الفارغة بأمان
    useEffect(() => {
        setMounted(true)

        if (items.length === 0) {
            router.push('/cart')
            return
        }

        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session?.user) {
                setUserId(session.user.id)

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name, phone')
                    .eq('id', session.user.id)
                    .single()

                if (profile) {
                    setForm(prev => ({
                        ...prev,
                        name: profile.full_name || '',
                        phone: profile.phone || '',
                    }))
                }
            }
        }
        checkSession()
    }, [items.length, router, supabase.auth])

    if (!mounted) {
        return (
            <div className="min-h-screen bg-flore-bg flex items-center justify-center">
                <div className="animate-pulse font-amiri text-xl text-flore-primary">جاري تحميل صفحة الدفع...</div>
            </div>
        )
    }

    if (items.length === 0) return null

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return
        setLoading(true)

        try {
            // 1. إرسال الطلب للسيرفر للتحقق من الأسعار والحسابات بشكل آمن
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(item => ({
                        product_id: item.product.id,
                        qty: item.quantity,
                        customization: item.customization || null,
                    })),
                    customer_name: form.name,
                    customer_phone: form.phone,
                    delivery_address: form.address,
                    delivery_region: form.region.toLowerCase(),
                    gift_message: form.giftMessage || null,
                    delivery_notes: form.notes || null,
                    payment_method: form.payment.toLowerCase(),
                }),
            })

            if (!response.ok) {
                const err = await response.json()
                throw new Error(err.error || 'Failed to create order')
            }

            // 2. استقبال المعرف الموثق للطلب والمجموع من السيرفر
            const { orderId, total: serverTotal } = await response.json()
            const orderTotal = serverTotal || getTotal()

            // 3. التوجيه ومعالجة بوابات الدفع بناءً على رد السيرفر الآمن
            if (form.payment === 'whatsapp') {
                const message = generateWhatsAppMessage(items, orderTotal)
                const whatsappUrl = `https://wa.me/962790000000?text=${encodeURIComponent(message)}`
                window.open(whatsappUrl, '_blank')

                clearCart()
                if (userId) {
                    router.push(`/profile?order=${orderId}`)
                } else {
                    router.push(`/tracking/${orderId}`)
                }
            } else if (form.payment === 'cliq') {
                const cliqRes = await fetch('/api/payment/cliq', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: orderId,
                        phoneNumber: form.phone,
                    }),
                })

                const cliqData = await cliqRes.json()

                if (!cliqRes.ok) {
                    throw new Error(cliqData.error || 'Failed to initialize CliQ payment')
                }

                clearCart()
                if (cliqData.paymentUrl) {
                    window.location.href = cliqData.paymentUrl
                } else {
                    alert('تم تسجيل طلبك بنجاح 🌸. سيتم إرسال تفاصيل الدفع المباشر عبر تطبيق CliQ إلى رقم هاتفك فوراً.')
                    if (userId) {
                        router.push(`/profile?order=${orderId}`)
                    } else {
                        router.push(`/tracking/${orderId}`)
                    }
                }
            } else if (form.payment === 'cash') {
                alert('تم تسجيل طلبك بنجاح 🌸. سيتم الدفع نقداً عند استلام الباقة الفاخرة من السائق.')
                clearCart()
                if (userId) {
                    router.push(`/profile?order=${orderId}`)
                } else {
                    router.push(`/tracking/${orderId}`)
                }
            }
        } catch (err: any) {
            console.error('Checkout Processing Error:', err)
            alert(err.message || 'حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.')
        } finally {
            setLoading(false)
        }
    }

    const paymentMethods = [
        { id: 'whatsapp', label: 'واتساب', icon: MessageCircle, desc: 'تأكيد فوري وفاتورة مباشرة' },
        { id: 'cliq', label: 'تطبيق CliQ', icon: Banknote, desc: 'تحويل بنكي أردني فوري' },
        { id: 'cash', label: 'كاش عند الاستلام', icon: Banknote, desc: 'الدفع نقداً لسائق فلوري' },
    ]

    return (
        <div className="min-h-screen bg-flore-bg pb-24 font-noto text-right" dir="rtl">
            <div className="max-w-2xl mx-auto px-4 py-12">
                <button
                    onClick={() => router.push('/cart')}
                    className="flex items-center gap-2 text-flore-primary mb-6 hover:underline font-medium"
                >
                    <ArrowLeft className="h-4 w-4 rotate-180" /> العودة للسلة
                </button>

                <h1 className="font-amiri text-4xl font-bold text-flore-text-primary mb-3 text-center">
                    إتمام الطلب الفاخر
                </h1>
                <p className="text-center text-flore-text-secondary mb-8 text-sm">
                    مراجعة آمنة وموثقة للطلب | جميع الأسعار بالدينار الأردني (JOD)
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* معلومات التواصل */}
                    <section className="bg-flore-card rounded-3xl p-6 shadow-luxury border border-flore-border">
                        <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2 text-flore-primary">
                            <User className="h-5 w-5" />
                            معلومات التواصل
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-flore-text-secondary mb-1">الاسم الكامل</label>
                                <input
                                    required
                                    type="text"
                                    value={form.name}
                                    onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none transition-colors"
                                    placeholder="محمد أحمد"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-flore-text-secondary mb-1">رقم الهاتف (لتأكيد الطلب والتوصيل)</label>
                                <input
                                    required
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => setForm(prev => ({ ...prev, phone: e.target.value }))}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none transition-colors"
                                    placeholder="0790000000"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </section>

                    {/* وجهة التوصيل اللوجستية */}
                    <section className="bg-flore-card rounded-3xl p-6 shadow-luxury border border-flore-border">
                        <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2 text-flore-primary">
                            <MapPin className="h-5 w-5" />
                            وجهة التوصيل اللوجستية
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-flore-text-secondary mb-1">المنطقة / المحافظة</label>
                                <select
                                    value={form.region}
                                    onChange={e => setForm(prev => ({ ...prev, region: e.target.value }))}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none transition-colors cursor-pointer"
                                >
                                    <option value="amman">عمّان</option>
                                    <option value="zarqa">الزرقاء</option>
                                    <option value="irbid">إربد</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-flore-text-secondary mb-1">العنوان بالتفصيل</label>
                                <textarea
                                    required
                                    value={form.address}
                                    onChange={e => setForm(prev => ({ ...prev, address: e.target.value }))}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none resize-none transition-colors"
                                    rows={2}
                                    placeholder="الشارع، رقم البناء، المعالم المميزة بالقرب من الموقع"
                                />
                            </div>
                        </div>
                    </section>

                    {/* طريقة الدفع */}
                    <section className="bg-flore-card rounded-3xl p-6 shadow-luxury border border-flore-border">
                        <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2 text-flore-primary">
                            <CreditCard className="h-5 w-5" />
                            اعتماد طريقة الدفع
                        </h2>
                        <div className="grid grid-cols-3 gap-3">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon
                                const isSelected = form.payment === method.id
                                return (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setForm(prev => ({ ...prev, payment: method.id }))}
                                        className={`rounded-2xl p-4 text-center border-2 transition-all duration-200 flex flex-col items-center justify-center ${isSelected
                                            ? 'border-flore-primary bg-purple-50/40 shadow-sm scale-[1.02]'
                                            : 'border-flore-border bg-flore-card hover:border-flore-primary/50'
                                            }`}
                                    >
                                        <Icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-flore-primary' : 'text-flore-text-secondary'}`} />
                                        <p className={`font-bold text-xs md:text-sm ${isSelected ? 'text-flore-primary' : 'text-flore-text-primary'}`}>{method.label}</p>
                                        <p className="text-[10px] text-flore-text-secondary mt-1 hidden md:block">{method.desc}</p>
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {/* كرت الإهداء */}
                    <section className="bg-flore-card rounded-3xl p-6 shadow-luxury border border-flore-border">
                        <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2 text-flore-primary">
                            <MessageSquare className="h-5 w-5" />
                            رسالة كرت الإهداء المرفق (اختياري)
                        </h2>
                        <textarea
                            value={form.giftMessage}
                            onChange={e => setForm(prev => ({ ...prev, giftMessage: e.target.value }))}
                            className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none resize-none transition-colors"
                            rows={2}
                            placeholder="اكتب الكلمات التي ترغب في صياغتها على كرت فلوري الفاخر لتقدم مع الباقة..."
                        />
                    </section>

                    {/* ملاحظات التنسيق والتوصيل */}
                    <section className="bg-flore-card rounded-3xl p-6 shadow-luxury border border-flore-border">
                        <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2 text-flore-primary">
                            <MessageCircle className="h-5 w-5" />
                            ملاحظات خاصة بالتوصيل أو التنسيق (اختياري)
                        </h2>
                        <textarea
                            value={form.notes}
                            onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                            className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none resize-none transition-colors"
                            rows={2}
                            placeholder="مثال: يرجى الاتصال قبل الوصول، أو تفضيل ألوان معينة للتغليف الخارجي..."
                        />
                    </section>

                    {/* ملخص الحسابات والـ Submit */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-flore-primary text-white rounded-3xl p-6 shadow-luxury"
                    >
                        <div className="flex justify-between items-center mb-3 text-sm">
                            <span className="text-white/80">مجموع باقات الزهور</span>
                            <span className="font-bold text-base">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-white/80 text-sm">القيمة الإجمالية الصافية</span>
                            <span className="font-amiri text-3xl font-bold tracking-wide">
                                {formatPrice(getTotal())}
                            </span>
                        </div>
                        <p className="text-white/60 text-[11px] mb-6">شامل رسوم التنسيق والتحضير الفاخر داخل الأتيليه</p>

                        <Button
                            type="submit"
                            disabled={loading}
                            size="lg"
                            className="w-full bg-white text-flore-primary hover:bg-purple-50 transition-all font-bold text-base py-4 rounded-xl shadow-md"
                        >
                            {loading ? 'جاري توثيق وإرسال طلبك...' : 'تأكيد وإرسال الطلب الآمن'}
                        </Button>
                    </motion.div>
                </form>
            </div>
        </div>
    )
}