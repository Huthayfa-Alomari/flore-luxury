'use client'

import { useState, useEffect, Suspense } from 'react'
import { motion } from 'framer-motion'
import { Eye, Smartphone, RotateCcw, Flower2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { useARSupport } from '@/hooks/useAR'
import type { Product } from '@/types'

function ModelViewer({ product }: { product: Product }) {
  useEffect(() => {
    import('@google/model-viewer')
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* @ts-ignore */}
      <model-viewer
        src={product.model_url}
        poster={product.image}
        alt={`معاينة ${product.name}`}
        camera-controls
        auto-rotate
        ar
        ar-modes="webxr scene-viewer quick-look"
        touch-action="pan-y"
        shadow-intensity="1"
        exposure="0.8"
        style={{ width: '100%', height: '100%', borderRadius: '1.5rem' }}
      >
        <button
          slot="ar-button"
          className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-flore-primary text-white px-8 py-4 rounded-xl font-noto font-medium shadow-lg hover:bg-flore-primary-dark transition-colors flex items-center gap-2"
        >
          <Smartphone className="h-5 w-5" />
          عرض في مساحتك
        </button>
      </model-viewer>
    </div>
  )
}

export default function ARPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const { isSupported, isMobile } = useARSupport()
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('ar_enabled', true)
      .eq('in_stock', true)

    if (data) {
      setProducts(data)
      setSelectedProduct(data[0])
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Flower2 className="h-12 w-12 animate-spin text-flore-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-amiri text-4xl font-bold text-flore-text-primary mb-2">
          تجربة الواقع المعزز
        </h1>
        <p className="text-flore-text-secondary">
          شاهد البوكيه في منزلك قبل الشراء
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Product Selector */}
        <div className="lg:col-span-1 space-y-4">
          <h3 className="font-amiri text-xl font-bold">اختر منتجاً</h3>
          {products.map((product) => (
            <button
              key={product.id}
              onClick={() => setSelectedProduct(product)}
              className={`w-full text-right p-4 rounded-2xl border-2 transition-all ${
                selectedProduct?.id === product.id
                  ? 'border-flore-primary bg-flore-primary/5'
                  : 'border-flore-border hover:border-flore-primary/50'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className="h-16 w-16 rounded-xl bg-cover bg-center flex-shrink-0"
                  style={{ backgroundImage: `url(${product.image})` }}
                />
                <div>
                  <p className="font-medium text-sm">{product.name}</p>
                  <p className="text-flore-primary font-bold">{product.price} د.أ</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* AR Viewer */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="relative aspect-square bg-flore-bg">
                {selectedProduct?.model_url ? (
                  <Suspense fallback={
                    <div className="h-full flex items-center justify-center">
                      <Eye className="h-12 w-12 text-flore-primary animate-pulse" />
                    </div>
                  }>
                    <ModelViewer product={selectedProduct} />
                  </Suspense>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                    <Eye className="h-16 w-16 text-flore-text-secondary mb-4" />
                    <h3 className="font-amiri text-xl font-bold mb-2">
                      النموذج ثلاثي الأبعاد غير متوفر
                    </h3>
                    <p className="text-flore-text-secondary">
                      هذا المنتج لا يحتوي على نموذج AR بعد
                    </p>
                  </div>
                )}

                {/* Fallback for non-AR devices */}
                {!isSupported && (
                  <div className="absolute inset-0 bg-flore-bg/90 flex items-center justify-center">
                    <div className="text-center p-8">
                      <Smartphone className="h-16 w-16 text-flore-primary mx-auto mb-4" />
                      <h3 className="font-amiri text-xl font-bold mb-2">
                        افتح من الهاتف المحمول
                      </h3>
                      <p className="text-flore-text-secondary max-w-sm">
                        تقنية الواقع المعزز تتطلب هاتفاً محمولاً. افتح هذا الرابط من هاتفك لتجربة المنتج في منزلك.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-flore-card rounded-2xl p-4 text-center">
              <RotateCcw className="h-6 w-6 mx-auto mb-2 text-flore-primary" />
              <p className="text-sm font-medium">تدوير 360°</p>
            </div>
            <div className="bg-flore-card rounded-2xl p-4 text-center">
              <Smartphone className="h-6 w-6 mx-auto mb-2 text-flore-primary" />
              <p className="text-sm font-medium">عرض حقيقي</p>
            </div>
            <div className="bg-flore-card rounded-2xl p-4 text-center">
              <Eye className="h-6 w-6 mx-auto mb-2 text-flore-primary" />
              <p className="text-sm font-medium">مقياس حقيقي</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}