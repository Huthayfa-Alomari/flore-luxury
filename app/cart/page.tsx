'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, MessageCircle, CreditCard, Banknote } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { generateWhatsAppMessage } from '@/lib/utils'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore()
  const [checkoutMethod, setCheckoutMethod] = useState<'whatsapp' | 'cliq' | 'cash'>('whatsapp')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const deliveryFee = 3
  const grandTotal = total + deliveryFee

  const handleWhatsAppCheckout = () => {
    const message = generateWhatsAppMessage(items, grandTotal)
    window.open(`https://wa.me/9627XXXXXXXX?text=${encodeURIComponent(message)}`, '_blank')
  }

  const handleCliqCheckout = async () => {
    setIsCheckingOut(true)
    try {
      const response = await fetch('/api/payment/cliq', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grandTotal,
          items: items.map(i => ({ name: i.product.name, price: i.product.price, qty: i.quantity })),
        }),
      })
      const data = await response.json()
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    } catch (error) {
      console.error('Payment error:', error)
    }
    setIsCheckingOut(false)
  }

  const handleCashCheckout = async () => {
    setIsCheckingOut(true)
    // Create order in Supabase
    setIsCheckingOut(false)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="bg-flore-subtle rounded-full h-24 w-24 mx-auto mb-6 flex items-center justify-center">
          <ShoppingBag className="h-10 w-10 text-flore-text-secondary" />
        </div>
        <h1 className="font-amiri text-3xl font-bold text-flore-text-primary mb-4">
          سلة التسوق فارغة
        </h1>
        <p className="text-flore-text-secondary mb-8">
          اكتشف مجموعتنا الفاخرة واختر ما يناسبك
        </p>
        <Link href="/catalog">
          <Button size="lg">تصفح المجموعة</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-amiri text-3xl md:text-4xl font-bold text-flore-text-primary mb-8">
        سلة التسوق
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={item.product.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="relative h-24 w-24 rounded-xl overflow-hidden flex-shrink-0">
                        <Image
                          src={item.product.image}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-noto font-medium text-flore-text-primary truncate">
                          {item.product.name}
                        </h3>
                        <p className="text-flore-text-secondary text-sm mt-1">
                          {item.product.price} د.أ / وحدة
                        </p>

                        {item.customization && (
                          <div className="mt-2 text-xs text-flore-text-secondary bg-flore-subtle rounded-lg p-2">
                            <p>تخصيص: {item.customization.flowers.join(', ')}</p>
                            <p>التغليف: {item.customization.wrap}</p>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-flore-border rounded-lg">
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                              className="h-8 w-8 flex items-center justify-center hover:bg-flore-subtle transition-colors"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="h-8 w-10 flex items-center justify-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                              className="h-8 w-8 flex items-center justify-center hover:bg-flore-subtle transition-colors"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-amiri font-bold text-flore-primary">
                            {item.product.price * item.quantity} د.أ
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeItem(item.product.id)}
                        className="text-flore-error hover:bg-red-50 p-2 rounded-lg transition-colors self-start"
                        aria-label="إزالة"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button variant="ghost" onClick={clearCart} className="text-flore-error gap-2">
            <Trash2 className="h-4 w-4" />
            إفراغ السلة
          </Button>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-24 h-fit">
          <Card>
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-flore-text-secondary">المجموع الفرعي</span>
                <span className="font-medium">{total} د.أ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-flore-text-secondary">رسوم التوصيل</span>
                <span className="font-medium">{deliveryFee} د.أ</span>
              </div>
              <div className="border-t border-flore-border pt-4">
                <div className="flex justify-between">
                  <span className="font-noto font-bold">الإجمالي</span>
                  <span className="font-amiri text-2xl font-bold text-flore-primary">
                    {grandTotal} د.أ
                  </span>
                </div>
              </div>

              {/* Checkout Methods */}
              <div className="space-y-3 pt-4">
                <p className="font-noto font-medium text-sm">طريقة الدفع:</p>

                <button
                  onClick={() => setCheckoutMethod('whatsapp')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    checkoutMethod === 'whatsapp'
                      ? 'border-flore-primary bg-flore-primary/5'
                      : 'border-flore-border'
                  }`}
                >
                  <MessageCircle className="h-5 w-5 text-green-600" />
                  <div className="text-right">
                    <p className="font-medium text-sm">واتساب</p>
                    <p className="text-xs text-flore-text-secondary">تواصل مباشر للتأكيد</p>
                  </div>
                </button>

                <button
                  onClick={() => setCheckoutMethod('cliq')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    checkoutMethod === 'cliq'
                      ? 'border-flore-primary bg-flore-primary/5'
                      : 'border-flore-border'
                  }`}
                >
                  <CreditCard className="h-5 w-5 text-blue-600" />
                  <div className="text-right">
                    <p className="font-medium text-sm">CliQ</p>
                    <p className="text-xs text-flore-text-secondary">دفع إلكتروني آمن</p>
                  </div>
                </button>

                <button
                  onClick={() => setCheckoutMethod('cash')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-colors ${
                    checkoutMethod === 'cash'
                      ? 'border-flore-primary bg-flore-primary/5'
                      : 'border-flore-border'
                  }`}
                >
                  <Banknote className="h-5 w-5 text-amber-600" />
                  <div className="text-right">
                    <p className="font-medium text-sm">نقداً عند الاستلام</p>
                    <p className="text-xs text-flore-text-secondary">الدفع عند التوصيل</p>
                  </div>
                </button>
              </div>

              <Button
                size="lg"
                className="w-full mt-4"
                onClick={() => {
                  if (checkoutMethod === 'whatsapp') handleWhatsAppCheckout()
                  else if (checkoutMethod === 'cliq') handleCliqCheckout()
                  else handleCashCheckout()
                }}
                disabled={isCheckingOut}
              >
                {isCheckingOut ? 'جاري المعالجة...' : 'إتمام الطلب'}
              </Button>

              <Link href="/catalog" className="block text-center">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  مواصلة التسوق
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}