'use client'

// إجبار Next.js على معالجة الصفحة ديناميكياً لمنع أي مشاكل أثناء الـ Build بسبب الـ 3D Canvas
export const dynamic = 'force-dynamic'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingBag, RotateCcw, Sparkles, Layers } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useCart } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

// تعريف هيكل المكونات القادمة من Supabase
interface DBComponent {
  id: string
  name: string
  type: 'base' | 'wrapping' | 'flower' | 'gift'
  price: number
  image_url: string
  model_path: string
}

// هيكل العناصر المختارة محلياً في الـ State
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
  const supabase = createClient()

  // --- الـ States الخاصة بإدارة عناصر التصميم الحية ---
  const [dbComponents, setDbComponents] = useState<DBComponent[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'base' | 'flower' | 'gift'>('base')

  // خيارات التصميم الحالية للمستخدم
  const [selectedBase, setSelectedBase] = useState<SelectedItem | null>(null)
  const [selectedWrap, setSelectedWrap] = useState<SelectedItem | null>(null)
  const [selectedFlowers, setSelectedFlowers] = useState<{ [id: string]: SelectedItem }>({})
  const [selectedGifts, setSelectedGifts] = useState<{ [id: string]: SelectedItem }>({})
  const [message, setMessage] = useState<string>('')

  // 1. جلب المكونات والأسعار من Supabase عند تحميل الصفحة
  useEffect(() => {
    const fetchComponents = async () => {
      const { data, error } = await supabase
        .from('bouquet_components')
        .select('*')
        .eq('is_active', true)

      if (data) setDbComponents(data as DBComponent[])
      setLoading(false)
    }
    fetchComponents()
  }, [])

  // 2. تصفية العناصر المعروضة بناءً على التبويب النشط
  const filteredComponents = dbComponents.filter(item => {
    if (activeTab === 'base') return item.type === 'base' || item.type === 'wrapping'
    return item.type === activeTab
  })

  // 3. حساب السعر الإجمالي بالدينار الأردني لايف (Live Price Calculation)
  const calculateTotal = useMemo(() => {
    let total = 0
    if (selectedBase) total += selectedBase.price
    if (selectedWrap) total += selectedWrap.price

    Object.values(selectedFlowers).forEach(f => { total += f.price * f.qty })
    Object.values(selectedGifts).forEach(g => { total += g.price * g.qty })

    return total
  }, [selectedBase, selectedWrap, selectedFlowers, selectedGifts])

  // --- دالات التحكم بأعداد وتغيير العناصر ---
  const handleFlowerCount = (item: DBComponent, action: 'add' | 'remove') => {
    setSelectedFlowers(prev => {
      const current = prev[item.id] || { id: item.id, name: item.name, price: Number(item.price), qty: 0 }
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
      const current = prev[item.id] || { id: item.id, name: item.name, price: Number(item.price), qty: 0 }
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
  }

  // 4. إرسال الباقة المصممة ديناميكياً لمتجر Zustand والتوجه للسلة
  const addToCart = () => {
    if (!selectedBase && Object.keys(selectedFlowers).length === 0) {
      alert('الرجاء اختيار قاعدة أو بعض الزهور أولاً لبناء باقتك الفريدة!')
      return
    }

    // بناء ديسكربشن نصي يحتوي على مكونات الباقة لإظهاره في الفاتورة والسلة
    const flowersSummary = Object.values(selectedFlowers).map(f => `${f.name} (${f.qty})`).join(', ')
    const giftsSummary = Object.values(selectedGifts).map(g => `${g.name} (${g.qty})`).join(', ')

    const descriptionParts = [
      selectedBase ? `القاعدة: ${selectedBase.name}` : '',
      selectedWrap ? `التغليف: ${selectedWrap.name}` : '',
      flowersSummary ? `الزهور: ${flowersSummary}` : '',
      giftsSummary ? `الإضافات: ${giftsSummary}` : ''
    ].filter(Boolean).join(' | ')

    // بناء كائن الـ Product المخصص بالشكل المتوافق مع متجرك
    const customProduct = {
      id: `custom-${Date.now()}`,
      name: 'باقة ورد فاخرة - تصميم مخصص',
      name_en: 'Custom Luxury Bouquet',
      category: 'custom' as const,
      price: calculateTotal,
      currency: 'JOD',
      image: selectedBase?.image_url || 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&h=600&fit=crop', // كفر افتراضي فخم في حال عدم وجود قاعدة
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

    // إرسال البيانات للـ Zustand Store
    addItem({
      product: customProduct,
      quantity: 1,
      customization: {
        flowers: Object.keys(selectedFlowers), // مصفوفة الـ IDs للزهور
        wrap: selectedWrap?.id || '',
        vase: selectedBase?.id || '',
        message,
        // تفاصيل إضافية للمحل لتجهيز الطلب بدقة من الـ Dashboard لاحقاً
        raw_details: {
          base: selectedBase,
          wrapping: selectedWrap,
          flowers: Object.values(selectedFlowers),
          gifts: Object.values(selectedGifts)
        }
      },
    })

    // الانتقال الفوري للسلة والدفع
    router.push('/cart')
  }

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="animate-pulse text-flore-primary font-amiri text-xl flex items-center gap-2">
          <Sparkles className="animate-spin text-gold" /> جاري تجهيز ورشة التصميم الفاخرة...
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* القسم الأيسر: مسرح العرض الحركي والـ 3D Canvas الافتراضي */}
      <div className="lg:col-span-7 bg-flore-card rounded-3xl overflow-hidden shadow-luxury relative min-h-[50vh] lg:min-h-0 flex flex-col">
        <div className="p-4 border-b border-flore-border flex justify-between items-center bg-white/50 backdrop-blur-md z-10">
          <div>
            <h1 className="font-amiri text-2xl font-bold text-flore-text-primary flex items-center gap-2">
              Atelier Floré <Sparkles className="h-5 w-5 text-gold" />
            </h1>
            <p className="text-xs text-flore-text-secondary font-noto">صمم تحفتك الفنية بالورد والواقع الافتراضي</p>
          </div>
          <Button variant="ghost" size="sm" onClick={resetAtelier} className="text-flore-text-secondary gap-1">
            <RotateCcw className="h-4 w-4" /> إعادة تعيين
          </Button>
        </div>

        {/* بيئة الـ 3D العرض الحية التفاعلية */}
        <div className="flex-1 bg-gradient-to-b from-flore-bg to-white relative flex items-center justify-center">
          <div className="text-center p-8 z-10">
            <Layers className="h-14 w-14 text-flore-subtle mx-auto mb-4 animate-pulse" />
            <p className="font-amiri text-lg text-flore-text-secondary">مكونات الباقة الحالية:</p>

            <div className="mt-4 space-y-1.5 text-xs text-flore-text-muted font-noto">
              {selectedBase && <p className="text-flore-primary">القاعدة: {selectedBase.name} (✓)</p>}
              {selectedWrap && <p className="text-flore-primary">التغليف: {selectedWrap.name} (✓)</p>}
              {Object.values(selectedFlowers).map(f => (
                <p key={f.id} className="font-medium">💐 {f.name} × {f.qty}</p>
              ))}
              {Object.values(selectedGifts).map(g => (
                <p key={g.id} className="font-medium text-emerald-600">🎁 {g.name} × {g.qty}</p>
              ))}
              {!selectedBase && !selectedWrap && Object.keys(selectedFlowers).length === 0 && (
                <p className="italic text-flore-text-muted">ابدأ باختيار المكونات من القائمة الجانبية لبناء شكل باقتك</p>
              )}
            </div>
          </div>

          {/* عداد السعر الحي العائم */}
          <div className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-luxury border border-flore-border">
            <span className="text-xs text-flore-text-secondary block font-noto">السعر التقديري</span>
            <span className="font-bold text-xl text-flore-primary font-noto">{calculateTotal.toFixed(2)} JOD</span>
          </div>
        </div>
      </div>

      {/* القسم الأيمن: لوحة التحكم والخيارات (Steps Sidebar) */}
      <div className="lg:col-span-5 flex flex-col gap-6">

        {/* أزرار الانتقال بين خطوات الـ Stepper */}
        <div className="flex bg-flore-card p-1.5 rounded-2xl border border-flore-border shadow-sm">
          <button
            onClick={() => setActiveTab('base')}
            className={`flex-1 py-3 text-center rounded-xl font-medium text-xs transition-all ${activeTab === 'base' ? 'bg-flore-primary text-white shadow-md' : 'text-flore-text-secondary hover:text-flore-primary'}`}
          >
            1. القاعدة والتغليف
          </button>
          <button
            onClick={() => setActiveTab('flower')}
            className={`flex-1 py-3 text-center rounded-xl font-medium text-xs transition-all ${activeTab === 'flower' ? 'bg-flore-primary text-white shadow-md' : 'text-flore-text-secondary hover:text-flore-primary'}`}
          >
            2. اختيار الورد
          </button>
          <button
            onClick={() => setActiveTab('gift')}
            className={`flex-1 py-3 text-center rounded-xl font-medium text-xs transition-all ${activeTab === 'gift' ? 'bg-flore-primary text-white shadow-md' : 'text-flore-text-secondary hover:text-flore-primary'}`}
          >
            3. الهدايا والإضافات
          </button>
        </div>

        {/* قائمة المكونات المتاحة ديناميكياً */}
        <div className="flex-1 bg-flore-card rounded-3xl p-5 border border-flore-border shadow-sm overflow-y-auto max-h-[50vh] lg:max-h-[55vh]">
          {filteredComponents.length === 0 ? (
            <p className="text-sm text-flore-text-secondary text-center py-8 font-noto">يرجى إضافة خيارات في جدول الـ Supabase لتظهر هنا.</p>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filteredComponents.map((item) => {
                const flowerQty = selectedFlowers[item.id]?.qty || 0;
                const giftQty = selectedGifts[item.id]?.qty || 0;
                const isBaseSelected = selectedBase?.id === item.id;
                const isWrapSelected = selectedWrap?.id === item.id;

                return (
                  <Card key={item.id} className={`overflow-hidden transition-all border ${isBaseSelected || isWrapSelected || flowerQty > 0 || giftQty > 0 ? 'border-flore-primary ring-1 ring-flore-primary' : 'border-flore-border'}`}>
                    <CardContent className="p-3 flex flex-col justify-between h-full">
                      <div className="aspect-square bg-flore-bg rounded-xl mb-2 overflow-hidden relative">
                        {item.image_url ? (
                          <img src={item.image_url} alt={item.name} className="object-cover w-full h-full" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-flore-text-muted">Floré Asset</div>
                        )}
                        <Badge className="absolute top-2 left-2 bg-black/70 text-white border-none text-[10px]">{item.price} JOD</Badge>
                      </div>

                      <p className="font-medium text-xs text-flore-text-primary mb-2 line-clamp-1 font-noto">{item.name}</p>

                      {/* أزرار التحكم الديناميكية حسب النوع */}
                      {item.type === 'base' && (
                        <Button size="sm" variant={isBaseSelected ? 'primary' : 'outline'} className="w-full text-xs" onClick={() => setSelectedBase({ id: item.id, name: item.name, price: Number(item.price), qty: 1, image_url: item.image_url })}>
                          {isBaseSelected ? '✓ تم الاختيار' : 'اختيار'}
                        </Button>
                      )}

                      {item.type === 'wrapping' && (
                        <Button size="sm" variant={isWrapSelected ? 'primary' : 'outline'} className="w-full text-xs" onClick={() => setSelectedWrap({ id: item.id, name: item.name, price: Number(item.price), qty: 1, image_url: item.image_url })}>
                          {isWrapSelected ? '✓ تم الاختيار' : 'اختيار التغليف'}
                        </Button>
                      )}

                      {item.type === 'flower' && (
                        <div className="flex items-center justify-between gap-1">
                          <Button size="sm" variant="outline" className="px-2 py-0 h-7" onClick={() => handleFlowerCount(item, 'remove')}>-</Button>
                          <span className="font-bold text-xs">{flowerQty}</span>
                          <Button size="sm" variant="outline" className="px-2 py-0 h-7" onClick={() => handleFlowerCount(item, 'add')}>+</Button>
                        </div>
                      )}

                      {item.type === 'gift' && (
                        <div className="flex items-center justify-between gap-1">
                          <Button size="sm" variant="outline" className="px-2 py-0 h-7" onClick={() => handleGiftCount(item, 'remove')}>-</Button>
                          <span className="font-bold text-xs">{giftQty}</span>
                          <Button size="sm" variant="outline" className="px-2 py-0 h-7" onClick={() => handleGiftCount(item, 'add')}>+</Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* كرت كتابة رسالة الإهداء قبل الانتقال للسلة */}
        <div className="bg-flore-card p-4 rounded-2xl border border-flore-border shadow-sm">
          <label className="block text-xs font-medium text-flore-text-primary mb-2 font-noto">رسالة إهداء مع الباقة (اختياري):</label>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب عبارة فخمة لتوضع على كرت الباقة..."
            className="w-full bg-white border border-flore-border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-flore-primary"
          />
        </div>

        {/* زر الإضافة للسلة النهائي والتحويل لصفحة /cart */}
        <Button size="lg" className="w-full shadow-lg gap-2 text-sm py-4" onClick={addToCart}>
          <ShoppingBag className="h-5 w-5" />
          تأكيد التصميم وإضافته للسلة
        </Button>
      </div>
    </div>
  )
}