"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Phone, User, MessageSquare, CreditCard, Banknote, MessageCircle } from 'lucide-react'
// 1. تحديث مسار الـ Store الصحيح والمطابق لمجلدات مشروعك الحالية
import { useCart } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/Button'
import { formatPrice, generateWhatsAppMessage } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, getTotal, clearCart } = useCart()
    const [loading, setLoading] = useState(false)
    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        region: 'amman',
        payment: 'whatsapp',
        giftMessage: '',
        notes: '',
    })

    // حماية الصفحة: إذا كانت السلة فارغة يتم التحويل فوراً دون التسبب في خطأ رندر
    if (items.length === 0) {
        if (typeof window !== 'undefined') {
            router.push('/cart')
        }
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (loading) return
        setLoading(true)

        try {
            const supabase = createClient()
            const total = getTotal()

            // إدخال الطلب الآمن والموثق داخل جداول الـ Supabase لدعم المحاسبة والتدقيق اللوجستي
            const { data, error } = await supabase
                .from('orders')
                .insert({
                    items: items.map(item => ({
                        product_id: item.product.id,
                        name: item.product.name,
                        price: item.product.price,
                        qty: item.quantity,
                        image: item.product.image,
                        customization: item.customization || null, // تمرير التخصيص بأمان
                    })),
                    total,
                    currency: 'JOD',
                    payment_method: form.payment,
                    delivery_address: form.address,
                    delivery_region: form.region,
                    customer_phone: form.phone,
                    customer_name: form.name,
                    gift_message: form.giftMessage || null,
                    notes: form.notes || null,
                })
                .select()
                .single()

            if (error) throw error

            // التعامل الذكي والديناميكي مع بوابات الدفع المختارة
            if (form.payment === 'whatsapp') {
                const message = generateWhatsAppMessage(items, total)
                const whatsappUrl = `https://wa.me/962790000000?text=${encodeURIComponent(message)}`
                window.open(whatsappUrl, '_blank')
            } else if (form.payment === 'cliq') {
                alert('تم تسجيل طلبك بنجاح 🌸. سيتم إرسال تفاصيل الدفع المباشر عبر تطبيق CliQ إلى رقم هاتفك فوراً.')
            } else if (form.payment === 'cash') {
                alert('تم تسجيل طلبك بنجاح 🌸. سيتم الدفع نقداً عند استلام الباقة الفاخرة من السائق.')
            }

            // تفريغ السلة وتوجيه العميل بأمان إلى صفحة حسابه لتتبع حالة التنسيق والعطر
            clearCart()
            router.push(`/profile?order=${data.id}`)
        } catch (err) {
            console.error('Checkout Insertion Error:', err)
            alert('حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى أو التواصل معنا مباشرة.')
        } finally {
            setLoading(false)
        }
    }

    // خيارات الدفع المحلية المعتمدة والمتوافقة مع سلوك العميل في الأردن
    const paymentMethods = [
        { id: 'whatsapp', label: 'واتساب', icon: MessageCircle, desc: 'تأكيد فوري وفاتورة مباشرة' },
        { id: 'cliq', label: 'تطبيق CliQ', icon: Banknote, desc: 'تحويل بنكي أردني فوري' },
        { id: 'cash', label: 'كاش عند الاستلام', icon: Banknote, desc: 'الدفع نقداً لسائق فلوري' },
    ]

    return (
        <div className="min-h-screen bg-flore-bg pb-24 font-noto" dir="rtl">
            <div className="max-w-2xl mx-auto px-4 py-12">
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
                                    onChange={e => setForm({ ...form, name: e.target.value })}
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
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none transition-colors"
                                    placeholder="0790000000"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </section>

                    {/* عنوان التوصيل الجغرافي */}
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
                                    onChange={e => setForm({ ...form, region: e.target.value })}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none transition-colors cursor-pointer"
                                >
                                    <option value="amman">عمّان</option>
                                    <option value="zarqa">الزرقاء</option>
                                    <option value="irbid">إربد</option>
                                    <option value="salt">السلط</option>
                                    <option value="madaba">مأدبا</option>
                                    <option value="karak">الكرك</option>
                                    <option value="aqaba">العقبة</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-flore-text-secondary mb-1">العنوان بالتفصيل</label>
                                <textarea
                                    required
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none resize-none transition-colors"
                                    rows={2}
                                    placeholder="الشارع، رقم البناء، المعالم المميزة بالقرب من الموقع"
                                />
                            </div>
                        </div>
                    </section>

                    {/* طريقة الدفع والتحويل */}
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
                                        onClick={() => setForm({ ...form, payment: method.id })}
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

                    {/* كرت التخصيص والرسائل */}
                    <section className="bg-flore-card rounded-3xl p-6 shadow-luxury border border-flore-border">
                        <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2 text-flore-primary">
                            <MessageSquare className="h-5 w-5" />
                            رسالة كرت الإهداء المرفق (اختياري)
                        </h2>
                        <textarea
                            value={form.giftMessage}
                            onChange={e => setForm({ ...form, giftMessage: e.target.value })}
                            className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none resize-none transition-colors"
                            rows={2}
                            placeholder="اكتب الكلمات التي ترغب في صياغتها على كرت فلوري الفاخر لتقدم مع الباقة..."
                        />
                    </section>

                    {/* ملخص الحسابات ومجموع الفاتورة */}
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