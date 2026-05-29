"use client"

import { useState, useEffect } from 'react' // تم إضافة useEffect هنا
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { MapPin, Phone, User, MessageSquare, CreditCard, Banknote, MessageCircle } from 'lucide-react'
import { useCart } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/Button'
import { formatPrice, generateWhatsAppMessage } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function CheckoutPage() {
    const router = useRouter()
    const { items, getTotal, clearCart } = useCart()
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false) // حماية الصفحة من الـ Hydration والـ 404 المفاجئ

    const [form, setForm] = useState({
        name: '',
        phone: '',
        address: '',
        region: 'amman',
        payment: 'whatsapp',
        giftMessage: '',
        notes: '',
    })

    // تفعيل الحالة فور التحميل على المتصفح
    useEffect(() => {
        setMounted(true)
    }, [])

    // فحص السلة والتوجيه برمجياً فقط بعد التأكد من التحميل على العميل (Client)
    useEffect(() => {
        if (mounted && items.length === 0) {
            router.push('/cart')
        }
    }, [mounted, items, router])

    // إذا لم يكتمل التحميل بعد، أو كانت السلة فارغة، نرجع واجهة تحميل بسيطة ومطابقة للسيرفر لمنع الـ 404
    if (!mounted || items.length === 0) {
        return (
            <div className="min-h-screen bg-flore-bg flex items-center justify-center">
                <div className="animate-pulse font-amiri text-xl text-flore-primary">جاري تحميل تفاصيل الطلب الفاخر...</div>
            </div>
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const supabase = createClient()
            const total = getTotal()

            // إنشاء الطلب في قاعدة بيانات Supabase
            const { data, error } = await supabase
                .from('orders')
                .insert({
                    items: items.map(item => ({
                        product_id: item.product.id,
                        name: item.product.name,
                        price: item.product.price,
                        qty: item.quantity,
                        image: item.product.image,
                        customization: item.customization,
                    })),
                    total,
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

            // معالجة طريقة الدفع المختارة
            if (form.payment === 'whatsapp') {
                const message = generateWhatsAppMessage(items, total)
                const whatsappUrl = `https://wa.me/962790000000?text=${encodeURIComponent(message)}`
                window.open(whatsappUrl, '_blank')
            } else if (form.payment === 'cliq') {
                alert('سيتم إرسال رابط CliQ للدفع على واتساب')
            }

            clearCart()
            router.push(`/profile?order=${data.id}`)
        } catch (err) {
            console.error(err)
            alert('حدث خطأ أثناء حفظ الطلب، يرجى المحاولة مرة أخرى')
        } finally {
            setLoading(false)
        }
    }

    const paymentMethods = [
        { id: 'whatsapp', label: 'واتساب', icon: MessageCircle, desc: 'تواصل مباشر للتأكيد' },
        { id: 'cliq', label: 'CliQ', icon: CreditCard, desc: 'تحويل بنكي فوري' },
        { id: 'cash', label: 'كاش', icon: Banknote, desc: 'الدفع عند الاستلام' },
    ]

    return (
        <div className="min-h-screen bg-flore-bg pb-24">
            <div className="max-w-2xl mx-auto px-4 py-12">
                <h1 className="font-amiri text-4xl font-bold text-flore-text-primary mb-8 text-center">
                    إتمام الطلب
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact Info */}
                    <section className="bg-flore-card rounded-3xl p-6 shadow-luxury">
                        <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-flore-primary" />
                            معلومات التواصل
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-flore-text-secondary mb-1">الاسم الكامل</label>
                                <input
                                    required
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none"
                                    placeholder="محمد أحمد"
                                />
                            </div>
                            <div>
                                <label className="block text-sm text-flore-text-secondary mb-1">رقم الهاتف</label>
                                <input
                                    required
                                    type="tel"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none"
                                    placeholder="0790000000"
                                    dir="ltr"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Delivery */}
                    <section className="bg-flore-card rounded-3xl p-6 shadow-luxury">
                        <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2">
                            <MapPin className="h-5 w-5 text-flore-primary" />
                            عنوان التوصيل
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm text-flore-text-secondary mb-1">المنطقة</label>
                                <select
                                    value={form.region}
                                    onChange={e => setForm({ ...form, region: e.target.value })}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none"
                                >
                                    <option value="amman">عمّان</option>
                                    <option value="zarqa">الزرقاء</option>
                                    <option value="irbid">إربد</option>
                                    <option value="other">أخرى</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm text-flore-text-secondary mb-1">العنوان التفصيلي</label>
                                <textarea
                                    required
                                    value={form.address}
                                    onChange={e => setForm({ ...form, address: e.target.value })}
                                    className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none resize-none"
                                    rows={2}
                                    placeholder="المنطقة، الشارع، رقم البناء، الطابق"
                                />
                            </div>
                        </div>
                    </section>

                    {/* Payment */}
                    <section className="bg-flore-card rounded-3xl p-6 shadow-luxury">
                        <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-flore-primary" />
                            طريقة الدفع
                        </h2>
                        <div className="grid grid-cols-3 gap-3">
                            {paymentMethods.map((method) => {
                                const Icon = method.icon
                                return (
                                    <button
                                        key={method.id}
                                        type="button"
                                        onClick={() => setForm({ ...form, payment: method.id })}
                                        className={`rounded-xl p-4 text-center border-2 transition-colors ${form.payment === method.id
                                                ? 'border-flore-primary bg-flore-subtle'
                                                : 'border-flore-border'
                                            }`}
                                    >
                                        <Icon className="h-6 w-6 mx-auto mb-2 text-flore-primary" />
                                        <p className="font-medium text-sm">{method.label}</p>
                                        <p className="text-xs text-flore-text-secondary mt-1">{method.desc}</p>
                                    </button>
                                )
                            })}
                        </div>
                    </section>

                    {/* Gift Message */}
                    <section className="bg-flore-card rounded-3xl p-6 shadow-luxury">
                        <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-flore-primary" />
                            رسالة هدية (اختياري)
                        </h2>
                        <textarea
                            value={form.giftMessage}
                            onChange={e => setForm({ ...form, giftMessage: e.target.value })}
                            className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none resize-none"
                            rows={2}
                            placeholder="اكتب رسالة جميلة..."
                        />
                    </section>

                    {/* Order Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-flore-primary text-white rounded-3xl p-6 shadow-luxury"
                    >
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-white/80">عدد المنتجات</span>
                            <span className="font-bold">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                        </div>
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-white/80">الإجمالي</span>
                            <span className="font-amiri text-3xl font-bold">
                                {formatPrice(getTotal())}
                            </span>
                        </div>
                        <Button
                            type="submit"
                            disabled={loading}
                            size="lg"
                            className="w-full bg-white text-flore-primary hover:bg-flore-gold"
                        >
                            {loading ? 'جاري إرسال الطلب...' : 'تأكيد الطلب'}
                        </Button>
                    </motion.div>
                </form>
            </div>
        </div>
    )
}