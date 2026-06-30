"use client"

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'

type Flower = {
  id: string
  name: string
  price: number
  image: string | null
  color: string | null
  in_stock: boolean
}

type Wrap = {
  id: string
  name: string
  price: number
  color: string | null
  in_stock: boolean
}

type Vase = {
  id: string
  name: string
  price: number
  image: string | null
  in_stock: boolean
}

export default function AtelierPage() {
  const supabase = createClient()

  const [flowers, setFlowers] = useState<Flower[]>([])
  const [wraps, setWraps] = useState<Wrap[]>([])
  const [vases, setVases] = useState<Vase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedFlowers, setSelectedFlowers] = useState<Record<string, number>>({})
  const [selectedWrap, setSelectedWrap] = useState<string | null>(null)
  const [selectedVase, setSelectedVase] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      try {
        const [{ data: f, error: ef }, { data: w, error: ew }, { data: v, error: ev }] = await Promise.all([
          supabase.from('flower_types').select('*').eq('in_stock', true),
          supabase.from('wrap_options').select('*').eq('in_stock', true),
          supabase.from('vase_options').select('*').eq('in_stock', true),
        ])

        if (ef) throw ef
        if (ew) throw ew
        if (ev) throw ev

        if (f) setFlowers(f)
        if (w) setWraps(w)
        if (v) setVases(v)
      } catch (err: any) {
        setError(err.message || 'حدث خطأ في تحميل البيانات')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [supabase])

  // 1️⃣ Memoization (Performance Adjustments)
  const totalPrice = useMemo(() => {
    const flowersTotal = Object.entries(selectedFlowers).reduce((sum, [id, qty]) => {
      const flower = flowers.find(f => f.id === id)
      return sum + ((flower?.price || 0) * qty)
    }, 0)

    const wrap = wraps.find(w => w.id === selectedWrap)
    const vase = vases.find(v => v.id === selectedVase)

    return flowersTotal + (wrap?.price || 0) + (vase?.price || 0)
  }, [selectedFlowers, flowers, wraps, selectedWrap, vases, selectedVase])

  const totalSelectedFlowersCount = useMemo(() => {
    return Object.values(selectedFlowers).reduce((a, b) => a + b, 0)
  }, [selectedFlowers])

  const updateFlowerQty = (id: string, amount: number) => {
    setSelectedFlowers(prev => {
      const currentQty = prev[id] || 0
      const newQty = currentQty + amount

      const updated = { ...prev }
      if (newQty <= 0) {
        delete updated[id]
      } else {
        updated[id] = newQty
      }
      return updated
    })
  }

  const addToCart = () => {
    if (totalSelectedFlowersCount === 0) {
      alert('اختر زهرة واحدة على الأقل لتصميم باقتك')
      return
    }

    const dbItems = [
      ...Object.entries(selectedFlowers).map(([id, qty]) => ({
        product_id: id,
        type: 'flower',
        qty: qty
      })),
      ...(selectedWrap ? [{ product_id: selectedWrap, type: 'wrap', qty: 1 }] : []),
      ...(selectedVase ? [{ product_id: selectedVase, type: 'vase', qty: 1 }] : [])
    ]

    const cartItem = {
      type: 'custom_bouquet',
      items: dbItems,
      total: totalPrice,
      display: {
        flowers: Object.entries(selectedFlowers).map(([id, qty]) => ({ ...flowers.find(f => f.id === id), qty })),
        wrap: wraps.find(w => w.id === selectedWrap),
        vase: vases.find(v => v.id === selectedVase)
      }
    }

    console.log('Added to cart:', cartItem)
    alert(`تمت الإضافة للسلة بنجاح! الإجمالي: ${totalPrice} د.أ`)
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-flore-bg">
      <div className="text-flore-gold text-xl animate-pulse">جاري التحميل...</div>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-flore-bg">
      <div className="text-red-500 text-xl">{error}</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-flore-bg">
      <div className="max-w-4xl mx-auto p-6 pb-32">
        <h1 className="text-3xl font-bold text-center mb-2 text-flore-gold">أتيليه فلوري</h1>
        <p className="text-center text-gray-500 mb-8">صمم باقتك الخاصة واقفل تفاصيلها</p>

        {/* الزهور */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            اختر الزهور
            <span className="text-sm font-normal text-gray-400">({totalSelectedFlowersCount} محددة)</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {flowers.map(flower => {
              const qty = selectedFlowers[flower.id] || 0
              return (
                <div
                  key={flower.id}
                  className={`p-4 rounded-xl border-2 transition-all text-right flex flex-col justify-between ${qty > 0 ? 'border-flore-gold bg-flore-gold/5 shadow-md' : 'border-gray-200'
                    }`}
                >
                  <div>
                    {flower.image && (
                      <img
                        src={flower.image}
                        alt={flower.name}
                        className="w-full h-32 object-cover rounded-lg mb-2"
                      />
                    )}
                    <p className="font-medium">{flower.name}</p>
                    <p className="text-flore-gold font-bold">{flower.price} د.أ</p>
                  </div>

                  <div className="flex items-center justify-between mt-3 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => updateFlowerQty(flower.id, 1)}
                      className="bg-white text-black px-3 py-1 rounded shadow hover:bg-gray-50 font-bold"
                    >
                      +
                    </button>
                    <span className="font-semibold px-2">{qty}</span>
                    <button
                      onClick={() => updateFlowerQty(flower.id, -1)}
                      disabled={qty === 0}
                      className="bg-white text-black px-3 py-1 rounded shadow hover:bg-gray-50 font-bold disabled:opacity-30"
                    >
                      -
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* التغليف */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">اختر التغليف</h2>
          <div className="flex gap-3 flex-wrap">
            {wraps.map(wrap => (
              <button
                key={wrap.id}
                onClick={() => setSelectedWrap(selectedWrap === wrap.id ? null : wrap.id)}
                className={`px-6 py-3 rounded-lg border-2 transition-all hover:shadow-md ${selectedWrap === wrap.id
                    ? 'border-flore-gold bg-flore-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <span className="font-medium">{wrap.name}</span>
                <span className="text-flore-gold mr-2">+{wrap.price} د.أ</span>
              </button>
            ))}
          </div>
        </section>

        {/* المزهرية */}
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-4">اختر المزهرية</h2>
          <div className="flex gap-3 flex-wrap">
            {vases.map(vase => (
              <button
                key={vase.id}
                onClick={() => setSelectedVase(selectedVase === vase.id ? null : vase.id)}
                className={`px-6 py-3 rounded-lg border-2 transition-all hover:shadow-md ${selectedVase === vase.id
                    ? 'border-flore-gold bg-flore-gold/10 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <span className="font-medium">{vase.name}</span>
                <span className="text-flore-gold mr-2">+{vase.price} د.أ</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      {/* الإجمالي - sticky bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-4xl mx-auto p-4 flex justify-between items-center">
          <div>
            <p className="text-gray-500 text-sm">الإجمالي</p>
            <p className="text-3xl font-bold text-flore-gold">{totalPrice} د.أ</p>
          </div>
          <button
            onClick={addToCart}
            disabled={totalSelectedFlowersCount === 0}
            className="bg-flore-gold text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            أضف إلى السلة
          </button>
        </div>
      </div>
    </div>
  )
}