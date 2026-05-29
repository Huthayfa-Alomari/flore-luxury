"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, MapPin, Phone, User, MessageSquare, CreditCard, Banknote, MessageCircle } from 'lucide-react'
import { useCart } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/Button'
import { formatPrice, generateWhatsAppMessage } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart()
  const [mounted, setMounted] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false) // الانتقال إلى الدفع في نفس الصفحة
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

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div className="min-h-screen bg-flore-bg flex items-center justify-center">
        <div className="animate-pulse font-amiri text-xl text-flore-primary">جاري تحميل السلة الفاخرة...</div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-flore-bg px-4">
        <div className="text-center">
          <ShoppingBag className="h-20 w-20 mx-auto text-flore-primary/30 mb-6" />
          <h1 className="font-amiri text-3xl font-bold text-flore-text-primary mb-4">السلة فارغة</h1>
          <p className="text-flore-text-secondary mb-8">اكتشف مجموعتنا الفاخرة واختر ما يناسبك</p>
          <Link href="/catalog">
            <Button size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              تسوق الآن
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const supabase = createClient()
      const total = getTotal()

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
      alert('حدث خطأ، يرجى المحاولة مرة أخرى')
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
      <div className="max-w-4xl mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {!showCheckout ? (
            // المرحلة الأولى: عرض منتجات السلة
            <motion.div
              key="cart-stage"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <h1 className="font-amiri text-4xl font-bold text-flore-text-primary mb-8 text-center">
                سلة المشتريات ({items.length})
              </h1>

              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.product.id} className="bg-flore-card rounded-2xl p-4 shadow-luxury flex gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0">
                      <Image src={item.product.image} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-amiri text-lg font-bold text-flore-text-primary">{item.product.name}</h3>
                          <p className="text-flore-text-secondary text-sm">{formatPrice(item.product.price)} / وحدة</p>
                        </div>
                        <button onClick={() => removeItem(item.product.id)} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 bg-flore-subtle rounded-xl">
                          <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="p-2 hover:bg-flore-gold/20 rounded-xl transition-colors">
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-8 text-center font-bold">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="p-2 hover:bg-flore-gold/20 rounded-xl transition-colors">
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="font-amiri text-xl font-bold text-flore-primary">{formatPrice(item.product.price * item.quantity)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 bg-flore-card rounded-3xl p-6 shadow-luxury">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-flore-text-secondary">المجموع</span>
                  <span className="font-amiri text-2xl font-bold text-flore-primary">{formatPrice(getTotal())}</span>
                </div>
                <div className="flex gap-3">
                  <button onClick={clearCart} className="flex-1 py-3 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 transition-colors font-medium">
                    إفراغ السلة
                  </button>
                  <Button size="lg" className="flex-[2] gap-2" onClick={() => setShowCheckout(true)}>
                    إتمـام الطلب
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ) : (
            // المرحلة الثانية: عرض فورم الـ Checkout مباشرة هنا لمنع الـ 404
            <motion.div
              key="checkout-stage"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto"
            >
              <button onClick={() => setShowCheckout(false)} className="flex items-center gap-2 text-flore-primary mb-6 hover:underline font-medium">
                <ArrowLeft className="h-4 w-4 rotate-180" /> العودة للسلة
              </button>

              <h1 className="font-amiri text-4xl font-bold text-flore-text-primary mb-8 text-center">إتمام الطلب</h1>

              <form onSubmit={handleCheckoutSubmit} className="space-y-6">
                <section className="bg-flore-card rounded-3xl p-6 shadow-luxury">
                  <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2">
                    <User className="h-5 w-5 text-flore-primary" /> معلومات التواصل
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-flore-text-secondary mb-1">الاسم الكامل</label>
                      <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none" placeholder="محمد أحمد" />
                    </div>
                    <div>
                      <label className="block text-sm text-flore-text-secondary mb-1">رقم الهاتف</label>
                      <input required type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none" placeholder="0790000000" dir="ltr" />
                    </div>
                  </div>
                </section>

                <section className="bg-flore-card rounded-3xl p-6 shadow-luxury">
                  <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-flore-primary" /> عنوان التوصيل
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-flore-text-secondary mb-1">المنطقة</label>
                      <select value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none">
                        <option value="amman">عمّان</option>
                        <option value="zarqa">الزرقاء</option>
                        <option value="irbid">إربد</option>
                        <option value="other">أخرى</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-flore-text-secondary mb-1">العنوان التفصيلي</label>
                      <textarea required value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none resize-none" rows={2} placeholder="المنطقة، الشارع، رقم البناء، الطابق" />
                    </div>
                  </div>
                </section>

                <section className="bg-flore-card rounded-3xl p-6 shadow-luxury">
                  <h2 className="font-amiri text-xl font-bold mb-4 flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-flore-primary" /> طريقة الدفع
                  </h2>
                  <div className="grid grid-cols-3 gap-3">
                    {paymentMethods.map((method) => {
                      const Icon = method.icon
                      return (
                        <button key={method.id} type="button" onClick={() => setForm({ ...form, payment: method.id })} className={`rounded-xl p-4 text-center border-2 transition-colors ${form.payment === method.id ? 'border-flore-primary bg-flore-subtle' : 'border-flore-border'}`}>
                          <Icon className="h-6 w-6 mx-auto mb-2 text-flore-primary" />
                          <p className="font-medium text-sm">{method.label}</p>
                          <p className="text-xs text-flore-text-secondary mt-1">{method.desc}</p>
                        </button>
                      )
                    })}
                  </div>
                </section>

                <motion.div className="bg-flore-primary text-white rounded-3xl p-6 shadow-luxury">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-white/80">الإجمالي النهائي</span>
                    <span className="font-amiri text-3xl font-bold">{formatPrice(getTotal())}</span>
                  </div>
                  <Button type="submit" disabled={loading} size="lg" className="w-full bg-white text-flore-primary hover:bg-flore-gold">
                    {loading ? 'جاري إرسال الطلب...' : 'تأكيد الطلب عبر واتساب'}
                  </Button>
                </motion.div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}