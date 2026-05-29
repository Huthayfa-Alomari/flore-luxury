"use client"

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Users, DollarSign, TrendingUp, Eye, CheckCircle, XCircle, PlusCircle, Image as ImageIcon, Tag, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDate, orderStatuses } from '@/lib/utils'
import type { Order } from '@/types'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ total: 0, revenue: 0, customers: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'orders' | 'add-product'>('orders') // التبديل بين الطلبات وإضافة منتج
  const [productMessage, setProductMessage] = useState('')
  const [productLoading, setProductLoading] = useState(false)

  // حقول فورم إضافة منتج جديد
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    image: '',
    description: '',
    category: 'bouquets'
  })

  const supabase = createClient()

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [])

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
    setLoading(false)
  }

  const fetchStats = async () => {
    const { data: ordersData } = await supabase.from('orders').select('total, status')
    const { data: usersData } = await supabase.from('profiles').select('id', { count: 'exact' })

    if (ordersData) {
      const revenue = ordersData.reduce((s, o) => s + (o.total || 0), 0)
      const pending = ordersData.filter(o => o.status === 'received').length
      setStats({
        total: ordersData.length,
        revenue,
        customers: usersData?.length || 0,
        pending,
      })
    }
  }

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)

    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o))
      // تحديث الإحصائيات بعد تغيير الحالة
      fetchStats()
    }
  }

  // معالجة إضافة منتج جديد
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    setProductLoading(true)
    setProductMessage('')

    try {
      const { error } = await supabase
        .from('products')
        .insert([
          {
            name: productForm.name,
            price: parseFloat(productForm.price),
            image: productForm.image,
            description: productForm.description,
            category: productForm.category,
          }
        ])

      if (error) throw error

      setProductMessage('✨ تم إضافة المنتج الفاخر بنجاح إلى معروضات Floré!')
      setProductForm({ name: '', price: '', image: '', description: '', category: 'bouquets' })
    } catch (err: any) {
      console.error(err)
      setProductMessage(`❌ خطأ في الإضافة: ${err.message || 'يرجى المحاولة مرة أخرى'}`)
    } finally {
      setProductLoading(false)
    }
  }

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter)

  const statCards = [
    { label: 'إجمالي الطلبات', value: stats.total, icon: Package, color: 'bg-blue-100 text-blue-600' },
    { label: 'الإيرادات', value: formatPrice(stats.revenue), icon: DollarSign, color: 'bg-green-100 text-green-600' },
    { label: 'العملاء', value: stats.customers, icon: Users, color: 'bg-purple-100 text-purple-600' },
    { label: 'معلّقة', value: stats.pending, icon: TrendingUp, color: 'bg-orange-100 text-orange-600' },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-flore-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-flore-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-flore-bg p-4 md:p-8 pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="font-amiri text-4xl font-bold text-flore-text-primary">
            لوحة تحكم المسؤول
          </h1>

          {/* أزرار التبديل الفاخرة بين الأقسام */}
          <div className="flex bg-flore-card p-1 rounded-2xl shadow-luxury border border-flore-border w-full md:w-auto">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === 'orders' ? 'bg-flore-primary text-white shadow-sm' : 'text-flore-text-secondary hover:text-flore-text-primary'
                }`}
            >
              إدارة الطلبات
            </button>
            <button
              onClick={() => setActiveTab('add-product')}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'add-product' ? 'bg-flore-primary text-white shadow-sm' : 'text-flore-text-secondary hover:text-flore-text-primary'
                }`}
            >
              <PlusCircle className="h-4 w-4" />
              إضافة منتج جديد
            </button>
          </div>
        </div>

        {/* ملخص الإحصائيات السريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-flore-card rounded-2xl p-6 shadow-luxury border border-flore-border/40"
              >
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-flore-text-primary">{stat.value}</p>
                <p className="text-sm text-flore-text-secondary mt-1">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'orders' ? (
            // قسم عرض وإدارة الطلبات
            <motion.div
              key="orders-tab"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              {/* الفلاتر */}
              <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-none">
                {['all', 'received', 'arranging', 'en_route', 'delivered'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilter(status)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === status ? 'bg-flore-primary text-white' : 'bg-flore-card text-flore-text-secondary hover:bg-flore-subtle'
                      }`}
                  >
                    {status === 'all' ? 'الكل' : orderStatuses.find(s => s.value === status)?.label || status}
                  </button>
                ))}
              </div>

              {/* الجدول */}
              <div className="bg-flore-card rounded-3xl shadow-luxury overflow-hidden border border-flore-border/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-right border-collapse">
                    <thead className="bg-flore-subtle/50">
                      <tr>
                        <th className="p-4 text-sm font-medium text-flore-text-secondary border-b border-flore-border">الطلب</th>
                        <th className="p-4 text-sm font-medium text-flore-text-secondary border-b border-flore-border">العميل</th>
                        <th className="p-4 text-sm font-medium text-flore-text-secondary border-b border-flore-border">المبلغ</th>
                        <th className="p-4 text-sm font-medium text-flore-text-secondary border-b border-flore-border">الحالة</th>
                        <th className="p-4 text-sm font-medium text-flore-text-secondary border-b border-flore-border">التاريخ</th>
                        <th className="p-4 text-sm font-medium text-flore-text-secondary border-b border-flore-border">إجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map((order) => {
                        const statusInfo = orderStatuses.find(s => s.value === order.status)
                        return (
                          <tr key={order.id} className="border-b border-flore-border hover:bg-flore-subtle/30 transition-colors">
                            <td className="p-4">
                              <p className="font-medium text-flore-text-primary">#{order.id.slice(0, 8)}</p>
                              <p className="text-xs text-flore-text-secondary">{order.items?.length || 0} منتج</p>
                            </td>
                            <td className="p-4">
                              <p className="font-medium text-flore-text-primary">{order.customer_name || '—'}</p>
                              <p className="text-xs text-flore-text-secondary" dir="ltr">{order.customer_phone}</p>
                            </td>
                            <td className="p-4 font-bold text-flore-primary">
                              {formatPrice(order.total)}
                            </td>
                            <td className="p-4">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${statusInfo?.color || ''}`}>
                                {statusInfo?.label || order.status}
                              </span>
                            </td>
                            <td className="p-4 text-sm text-flore-text-secondary">
                              {formatDate(order.created_at)}
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => updateStatus(order.id, 'delivered')}
                                  className="p-2 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                                  title="تم التسليم"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => updateStatus(order.id, 'cancelled')}
                                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  title="إلغاء الطلب"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                                <button className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors" title="عرض التفاصيل">
                                  <Eye className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
                {filteredOrders.length === 0 && (
                  <div className="p-12 text-center text-flore-text-secondary font-medium">
                    لا توجد طلبات في هذا الفلتر حالياً
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            // قسم إضافة زهور ومنتجات جديدة للمتجر
            <motion.div
              key="add-product-tab"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="max-w-2xl mx-auto"
            >
              <div className="bg-flore-card rounded-3xl p-8 shadow-luxury border border-flore-border">
                <h2 className="font-amiri text-2xl font-bold text-flore-text-primary mb-6 text-center">
                  إضافة باقة زهور فاخرة جديدة
                </h2>

                {productMessage && (
                  <div className={`p-4 rounded-xl mb-6 text-center font-medium text-sm ${productMessage.startsWith('✨') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {productMessage}
                  </div>
                )}

                <form onSubmit={handleAddProduct} className="space-y-5">
                  <div>
                    <label className="block text-sm text-flore-text-secondary mb-1">اسم الباقة / المنتج</label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        value={productForm.name}
                        onChange={e => setProductForm({ ...productForm, name: e.target.value })}
                        className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 pr-10 focus:border-flore-primary focus:outline-none"
                        placeholder="مثال: باقة الأوركيد الملكية"
                      />
                      <Tag className="absolute right-3 top-3.5 h-5 w-5 text-flore-primary/50" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-flore-text-secondary mb-1">السعر (دينار أردني)</label>
                      <input
                        required
                        type="number"
                        step="0.01"
                        value={productForm.price}
                        onChange={e => setProductForm({ ...productForm, price: e.target.value })}
                        className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-flore-text-secondary mb-1">التصنيف</label>
                      <select
                        value={productForm.category}
                        onChange={e => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 focus:border-flore-primary focus:outline-none"
                      >
                        <option value="bouquets">باقات جاهزة</option>
                        <option value="luxury">مجموعة فاخرة</option>
                        <option value="occasions">مناسبات</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-flore-text-secondary mb-1">رابط صورة الباقة (URL)</label>
                    <div className="relative">
                      <input
                        required
                        type="text"
                        value={productForm.image}
                        onChange={e => setProductForm({ ...productForm, image: e.target.value })}
                        className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 pr-10 focus:border-flore-primary focus:outline-none"
                        placeholder="https://images.unsplash.com/photo-..."
                        dir="ltr"
                      />
                      <ImageIcon className="absolute right-3 top-3.5 h-5 w-5 text-flore-primary/50" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-flore-text-secondary mb-1">الوصف والمكونات</label>
                    <div className="relative">
                      <textarea
                        required
                        value={productForm.description}
                        onChange={e => setProductForm({ ...productForm, description: e.target.value })}
                        className="w-full rounded-xl border-2 border-flore-border bg-flore-bg p-3 pr-10 focus:border-flore-primary focus:outline-none resize-none"
                        rows={3}
                        placeholder="تفاصيل الزهور، ألوان التغليف، ومناسبتها..."
                      />
                      <FileText className="absolute right-3 top-3.5 h-5 w-5 text-flore-primary/50" />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={productLoading}
                    size="lg"
                    className="w-full gap-2 mt-2 bg-flore-primary text-white hover:bg-flore-gold"
                  >
                    <PlusCircle className="h-5 w-5" />
                    {productLoading ? 'جاري نشر المنتج...' : 'نشر الباقة في المتجر فواً'}
                  </Button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}