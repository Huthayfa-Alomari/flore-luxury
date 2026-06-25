'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import type { Product } from '@/types'

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [, setLoading] = useState(true)
  const [, setShowForm] = useState(false)
  const [, setEditingProduct] = useState<Product | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setProducts(data as Product[])
    setLoading(false)
  }

  const deleteProduct = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المنتج؟')) return
    await supabase.from('products').delete().eq('id', id)
    fetchProducts()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-amiri text-3xl font-bold text-flore-text-primary">إدارة المنتجات</h1>
          <p className="text-flore-text-secondary mt-1">إضافة وتعديل وحذف المنتجات</p>
        </div>
        <Button onClick={() => { setEditingProduct(null); setShowForm(true) }} className="gap-2">
          <Plus className="h-4 w-4" />
          منتج جديد
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="overflow-hidden">
              <div className="relative aspect-[4/3]">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
                {product.badge && (
                  <div className="absolute top-3 right-3">
                    <Badge style={{ backgroundColor: product.badge_color || '#0D5C63' }} className="text-white">
                      {product.badge}
                    </Badge>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <h3 className="font-noto font-medium mb-1">{product.name}</h3>
                <p className="text-flore-primary font-bold mb-3">{product.price} د.أ</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 gap-1"
                    onClick={() => { setEditingProduct(product); setShowForm(true) }}
                  >
                    <Pencil className="h-3 w-3" />
                    تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={() => deleteProduct(product.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}