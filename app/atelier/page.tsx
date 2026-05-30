'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShoppingBag, RotateCcw, Sparkles, Layers } from 'lucide-react'
import { toast } from 'sonner' // أو الـ toast المعتمد في مشروعك (مثل react-hot-toast)
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/store/cart-store'

// إنشاء السيرفيس خارج الـ Component لمنع تكرار الإنشاء في كل Render
const supabaseClient = createClient()

interface DBComponent {
  id: string
  name: string
  type: 'base' | 'wrapping' | 'flower' | 'gift'
  price: number // تم التأكيد عليه كـ number بعد المعالجة
  image_url: string
  model_path: string
}

interface SelectedItem {
  id: string
  name: string
  price: number
  qty: number
  image_url?: string
}

export default function AtelierPage() {
  const router = useRouter()
  const { addItem } = useCart()

  // تأمين الـ Mounting لمنع مشاكل الـ Hydration
  const [isMounted, setIsMounted] = useState(false)
  const [dbComponents, setDbComponents] = useState<DBComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'base' | 'flower' | 'gift'>('base')

  // خيارات التصميم الحالية
  const [selectedBase, setSelectedBase] = useState<SelectedItem | null>(null)
  const [selectedWrap, setSelectedWrap] = useState<SelectedItem | null>(null)
  const [selectedFlowers, setSelectedFlowers] = useState<{ [id: string]: SelectedItem }>({})
  const [selectedGifts, setSelectedGifts] = useState<{ [id: string]: SelectedItem }>({})
  const [message, setMessage] = useState<string>('')

  // جلب البيانات ومعالجتها فوراً (تنظيف نوع البيانات للسعر)
  useEffect(() => {
    setIsMounted(true)
    const fetchComponents = async () => {
      try {
        const { data, error } = await supabaseClient
          .from('bouquet_components')
          .select('*')
          .eq('is_active', true)

        if (error) throw error

        if (data) {
          // تحويل الأسعار لـ Number مرة واحدة هنا لراحة البال في باقي الكود
          const formattedData: DBComponent[] = data.map((item) => ({
            ...item,
            price: Number(item.price) || 0
          }))
          setDbComponents(formattedData)
        }
      } catch (err) {
        console.error('Error fetching atelier components:', err)
        toast.error('حدث خطأ أثناء تحميل مكونات الورشة الرقمية.')
      } finally {
        setLoading(false)
      }
    }
    fetchComponents()
  }, [])

  // تصفية العناصر المعروضة بناءً على التبويب النشط
  const filteredComponents = useMemo(() => {
    return dbComponents.filter(item => {
      if (activeTab === 'base') return item.type === 'base' || item.type === 'wrapping'
      return item.type === activeTab
    })
  }, [dbComponents, activeTab])

  // حساب السعر الإجمالي لايف (بدون تكرار دالة Number)
  const calculateTotal = useMemo(() => {
    let total = 0
    if (selectedBase) total += selectedBase.price
    if (selectedWrap) total += selectedWrap.price

    Object.values(selectedFlowers).forEach(f => { total += f.price * f.qty })
    Object.values(selectedGifts).forEach(g => { total += g.price * g.qty })

    return total
  }, [selectedBase, selectedWrap, selectedFlowers, selectedGifts])

  // دالات التحكم بأعداد وتغيير العناصر
  const handleFlowerCount = (item: DBComponent, action: 'add' | 'remove') => {
    setSelectedFlowers(prev => {
      const current = prev[item.id] || { id: item.id, name: item.name, price: item.price, qty: 0 }
      const updated = { ...prev }

      if (action === 'add') {
        updated[item.id] = { ...current, qty: current.qty + 1 }
      } else {
        if (current.qty <= 1) delete updated[item.id]
        else updated[item.id] = { ...current, qty: current.qty - 1 }
      }
      return updated
    })
  }

  const handleGiftCount = (item: DBComponent, action: 'add' | 'remove') => {
    setSelectedGifts(prev => {
      const current = prev[item.id] || { id: item.id, name: item.name, price: item.price, qty: 0 }
      const updated = { ...prev }

      if (action === 'add') {
        updated[item.id] = { ...current, qty: current.qty + 1 }
      } else {
        if (current.qty <= 1) delete updated[item.id]
        else updated[item.id] = { ...current, qty: current.qty - 1 }
      }
      return updated
    })
  }

  const resetAtelier = () => {
    setSelectedBase(null)
    setSelectedWrap(null)
    setSelectedFlowers({})
    setSelectedGifts({})
    setMessage('')
    toast.success('تم إعادة تعيين لوحة التصميم.')
  }

  const addToCart = async () => {
    if (!selectedBase && Object.keys(selectedFlowers).length === 0) {
      toast.error('الرجاء اختيار قاعدة أو بعض الزهور أولاً لبناء باقتك الفريدة!')
      return
    }

    try {
      const flowersSummary = Object.values(selectedFlowers).map(f => `${f.name} (${f.qty})`).join(', ')
      const giftsSummary = Object.values(selectedGifts).map(g => `${g.name} (${g.qty})`).join(', ')

      const descriptionParts = [
        selectedBase ? `القاعدة: ${selectedBase.name}` : '',
        selectedWrap ? `التغليف: ${selectedWrap.name}` : '',
        flowersSummary ? `الزهور: ${flowersSummary}` : '',
        giftsSummary ? `الإضافات: ${giftsSummary}` : ''
      ].filter(Boolean).join(' | ')

      const customProduct = {
        id: `custom-${Date.now()}`,
        name: 'باقة ورد فاخرة - تصميم مخصص',
        name_en: 'Custom Luxury Bouquet',
        category: 'custom' as const,
        price: calculateTotal,
        currency: 'JOD',
        image: selectedBase?.image_url || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&h=600&fit=crop',
        images: [],
        description: descriptionParts,
        description_en: null,
        badge: 'تصميم حي',
        badge_color: '#E7D8B9',
        in_stock: true,
        model_url: null,
        ar_enabled: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // إضافة لـ Zustand Store مع الحماية بـ Try/Catch
      await addItem({
        product: customProduct,
        quantity: 1,
        customization: {
          flowers: Object.keys(selectedFlowers),
          wrap: selectedWrap?.id || '',
          vase: selectedBase?.id || '',
          message,
          raw_details: {
            base: selectedBase,
            wrapping: selectedWrap,
            flowers: Object.values(selectedFlowers),
            gifts: Object.values(selectedGifts)
          }
        },
      })

      toast.success('تمت إضافة تحفتك الفنية إلى السلة بنجاح!')
      router.push('/cart')
    } catch (err) {
      console.error('Error adding custom design to cart:', err)
      toast.error('فشل حفظ التصميم وإضافته للسلة، يرجى المحاولة مجدداً.')
    }
  }

  if (!isMounted || loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-flore-primary font-amiri text-xl flex items-center gap-2">
          <Sparkles className="animate-spin text-amber-500" /> جاري تجهيز ورشة التصميم الفاخرة...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen grid grid-cols-1 lg:grid-cols-12 gap-8" dir="rtl">

      {/* القسم الأيسر: مسرح العرض والمكونات الحالية */}
      <div className="lg:col-span-7 bg-white rounded-3xl overflow-hidden shadow-md border border-flore-border relative min-h-[50vh] lg:min-h-0 flex flex-col">
        <div className="p-4 border-b border-flore-border flex justify-between items-center bg-white/50 backdrop-blur-md z-10">
          <div>
            <h1 className="font-amiri text-2xl font-bold text-flore-text-primary flex items-center gap-2">
              Atelier Floré <Sparkles className="h-5 w-5 text-amber-500" />
            </h1>
            <p className="text-xs text-flore-text-secondary font-noto">صمم تحفتك الفنية بالورد والواقع الافتراضي</p>
          </div>
          <button
            onClick={resetAtelier}
            className="flex items-center gap-1 text-xs font-medium text-flore-text-secondary hover:text-flore-primary transition-colors bg-flore-bg px-3 py-1.5 rounded-xl border border-flore-border"
          >
            <RotateCcw className="h-3.5 w-3.5" /> إعادة تعيين
          </button>
        </div>

        {/* بيئة العرض التفاعلية */}
        <div className="flex-1 bg-gradient-to-b from-flore-bg to-white relative flex items-center justify-center p-6">
          <div className="text-center z-10 max-w-md w-full bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-flore-border/40">
            <Layers className="h-10 w-10 text-flore-primary/60 mx-auto mb-3 animate-pulse" />
            <p className="font-amiri text-base font-bold text-flore-text-primary mb-3">مكونات الباقة الحالية:</p>

            <div className="space-y-2 text-xs text-flore-text-secondary font-noto">
              {selectedBase && <p className="text-flore-primary font-medium">✓ القاعدة: {selectedBase.name}</p>}
              {selectedWrap && <p className="text-flore-primary font-medium">✓ التغليف: {selectedWrap.name}</p>}
              {Object.values(selectedFlowers).map(f => (
                <p key={f.id} className="font-medium bg-flore-primary/5 py-1 px-2 rounded-lg">💐 {f.name} × {f.qty}</p>
              ))}
              {Object.values(selectedGifts).map(g => (
                <p key={g.id} className="font-medium text-emerald-700 bg-emerald-50 py-1 px-2 rounded-lg">🎁 {g.name} × {g.qty}</p>
              ))}
              {!selectedBase && !selectedWrap && Object.keys(selectedFlowers).length === 0 && (
                <p className="italic text-flore-text-muted">ابدأ باختيار المكونات من القائمة الجانبية لبناء شكل باقتك</p>
              )}
            </div>
          </div>

          <div className="absolute bottom-6 right-6 bg-white/95 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-sm border border-flore-border">
            <span className="text-[10px] text-flore-text-secondary block font-noto">السعر التقديري</span>
            <span className="font-bold text-lg text-flore-primary font-noto">{calculateTotal.toFixed(2)} د.أ</span>
          </div>
        </div>
      </div>

      {/* القسم الأيمن: لوحة التحكم والخيارات */}
      <div className="lg:col-span-5 flex flex-col gap-6">

        {/* أزرار الانتقال بين خطوات الـ Stepper */}
        <div className="flex bg-white p-1.5 rounded-2xl border border-flore-border shadow-sm">
          {(['base', 'flower', 'gift'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-center rounded-xl font-medium text-xs transition-all ${activeTab === tab
                  ? 'bg-flore-primary text-white shadow-sm font-bold'
                  : 'text-flore-text-secondary hover:text-flore-primary hover:bg-flore-bg'
                }`}
            >
              {tab === 'base' && '1. القاعدة والتغليف'}
              {tab === 'flower' && '2. اختيار الورد'}
              {tab === 'gift' && '3. الهدايا والإضافات'}
            </button>
          ))}
        </div>

        {/* قائمة المكونات المتاحة ديناميكياً */}
        <div className="flex-1 bg-white rounded-3xl p-4 border border-flore-border shadow-sm overflow-y-auto max-h-[50vh] lg:max-h-[55vh]">
          {filteredComponents.length === 0 ? (
            <p className="text-sm text-flore-text-secondary text-center py-8 font-noto">يرجى إضافة خيارات في لوحة التحكم لتظهر هنا.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {filteredComponents.map((item) => {
                const flowerQty = selectedFlowers[item.id]?.qty || 0;
                const giftQty = selectedGifts[item.id]?.qty || 0;
                const isBaseSelected = selectedBase?.id === item.id;
                const isWrapSelected = selectedWrap?.id === item.id;
                const isAnySelected = isBaseSelected || isWrapSelected || flowerQty > 0 || giftQty > 0;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-2xl overflow-hidden p-3 flex flex-col justify-between h-full border transition-all ${isAnySelected ? 'border-flore-primary ring-1 ring-flore-primary/30' : 'border-flore-border'
                      }`}
                  >
                    <div>
                      <div className="aspect-square bg-flore-bg rounded-xl mb-2 overflow-hidden relative">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.name}
                            fill
                            sizes="(max-width: 768px) 50vw, 25vw"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-flore-text-muted">Asset</div>
                        )}
                        <span className="absolute top-1.5 left-1.5 bg-black/70 text-white font-noto font-bold text-[9px] px-2 py-0.5 rounded-lg z-10">
                          {item.price} د.أ
                        </span>
                      </div>
                      <p className="font-medium text-xs text-flore-text-primary mb-3 line-clamp-1 font-noto">{item.name}</p>
                    </div>

                    <div className="mt-auto">
                      {item.type === 'base' && (
                        <button
                          className={`w-full py-1.5 rounded-xl font-noto text-xs font-medium border transition-colors ${isBaseSelected ? 'bg-flore-primary text-white border-flore-primary' : 'bg-transparent text-flore-primary border-flore-primary/30 hover:bg-flore-primary/5'
                            }`}
                          onClick={() => setSelectedBase({ id: item.id, name: item.name, price: item.price, qty: 1, image_url: item.image_url })}
                        >
                          {isBaseSelected ? '✓ تم الاختيار' : 'اختيار'}
                        </button>
                      )}

                      {item.type === 'wrapping' && (
                        <button
                          className={`w-full py-1.5 rounded-xl font-noto text-xs font-medium border transition-colors ${isWrapSelected ? 'bg-flore-primary text-white border-flore-primary' : 'bg-transparent text-flore-primary border-flore-primary/30 hover:bg-flore-primary/5'
                            }`}
                          onClick={() => setSelectedWrap({ id: item.id, name: item.name, price: item.price, qty: 1, image_url: item.image_url })}
                        >
                          {isWrapSelected ? '✓ تم الاختيار' : 'اختيار التغليف'}
                        </button>
                      )}

                      {item.type === 'flower' && (
                        <div className="flex items-center justify-between gap-1 bg-flore-bg rounded-xl p-1 border border-flore-border/60">
                          <button className="px-2.5 py-0.5 font-bold text-sm text-flore-text-secondary hover:text-flore-primary" onClick={() => handleFlowerCount(item, 'remove')}>-</button>
                          <span className="font-bold text-xs font-noto">{flowerQty}</span>
                          <button className="px-2.5 py-0.5 font-bold text-sm text-flore-text-secondary hover:text-flore-primary" onClick={() => handleFlowerCount(item, 'add')}>+</button>
                        </div>
                      )}

                      {item.type === 'gift' && (
                        <div className="flex items-center justify-between gap-1 bg-flore-bg rounded-xl p-1 border border-flore-border/60">
                          <button className="px-2.5 py-0.5 font-bold text-sm text-flore-text-secondary hover:text-flore-primary" onClick={() => handleGiftCount(item, 'remove')}>-</button>
                          <span className="font-bold text-xs font-noto">{giftQty}</span>
                          <button className="px-2.5 py-0.5 font-bold text-sm text-flore-text-secondary hover:text-flore-primary" onClick={() => handleGiftCount(item, 'add')}>+</button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* كرت كتابة رسالة الإهداء */}
        <div className="bg-white p-4 rounded-2xl border border-flore-border shadow-sm">
          <label className="block text-xs font-medium text-flore-text-primary mb-2 font-noto">رسالة إهداء مع الباقة (اختياري):</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب عبارة فخمة لتوضع على كرت الباقة..."
            className="w-full bg-flore-bg border border-flore-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-flore-primary font-noto"
          />
        </div>

        {/* زر الإضافة للسلة النهائي */}
        <button
          onClick={addToCart}
          className="w-full bg-flore-primary text-white font-noto font-bold text-sm py-3.5 rounded-2xl shadow-md hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <ShoppingBag className="h-4 w-4" />
          تأكيد التصميم وإضافته للسلة
        </button>
      </div>
    </div>
  )
}