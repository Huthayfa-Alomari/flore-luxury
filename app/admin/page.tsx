"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Package, DollarSign, TrendingUp, Clock, CheckCircle, XCircle, Search, RefreshCw, Download
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDate, orderStatuses } from '@/lib/utils'
import type { Order } from '@/types'

export default function AdminDashboard() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({
    total: 0,
    revenue: 0,
    todayRevenue: 0,
    customers: 0,
    pending: 0,
    delivered: 0,
    cancelled: 0
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false) // 👈 جدار الحماية من الـ Hydration Mismatch
  const [filter, setFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    setMounted(true)
    checkAdmin()
    fetchData()
  }, [])

  const checkAdmin = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    if (!role || role.role !== 'admin') {
      router.push('/')
    }
  }

  const fetchData = async () => {
    setLoading(true)
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (ordersData) {
      setOrders(ordersData as Order[])
      calculateStats(ordersData as Order[])
    }
    setLoading(false)
  }

  const calculateStats = (orders: Order[]) => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const revenue = orders.reduce((s, o) => s + (o.total || 0), 0)
    const todayRevenue = orders
      .filter(o => {
        if (!o.created_at) return false
        return new Date(o.created_at) >= today
      })
      .reduce((s, o) => s + (o.total || 0), 0)

    setStats({
      total: orders.length,
      revenue,
      todayRevenue,
      customers: new Set(orders.map(o => o.user_id).filter(Boolean)).size,
      pending: orders.filter(o => o.status === 'received').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    })
  }

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId)

    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o))
    }
  }

  const filteredOrders = orders.filter(order => {
    if (filter !== 'all' && order.status !== filter) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        order.customer_name?.toLowerCase().includes(query) ||
        order.customer_phone?.includes(query) ||
        order.id.toLowerCase().includes(query)
      )
    }
    return true
  })

  const exportCSV = () => {
    const headers = ['ID', 'Customer', 'Phone', 'Total', 'Status', 'Date']
    const rows = filteredOrders.map(o => [
      o.id.slice(0, 8),
      o.customer_name || '-',
      o.customer_phone,
      o.total,
      o.status,
      new Date(o.created_at).toLocaleDateString('ar-JO')
    ])
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const statCards = [
    { label: 'إجمالي الطلبات', value: stats.total, icon: Package, color: 'bg-blue-100 text-blue-600', trend: '+12%' },
    { label: 'الإيرادات', value: formatPrice(stats.revenue), icon: DollarSign, color: 'bg-green-100 text-green-600', trend: '+8%' },
    { label: 'إيرادات اليوم', value: formatPrice(stats.todayRevenue), icon: TrendingUp, color: 'bg-purple-100 text-purple-600', trend: 'مباشر' },
    { label: 'معلّقة', value: stats.pending, icon: Clock, color: 'bg-orange-100 text-orange-600', trend: 'تحتاج اهتمام' },
  ]

  // 🚨 منع الرندرة الاستاتيكية المشوهة على السيرفر قبل الـ mounted والـ loading الكامل
  if (!mounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-flore-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-flore-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-flore-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-amiri text-4xl font-bold text-flore-text-primary">لوحة التحكم</h1>
            <p className="text-flore-text-secondary mt-1">نظرة عامة على أداء المتجر</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              تحديث
            </Button>
            <Button onClick={exportCSV} className="gap-2">
              <Download className="h-4 w-4" />
              تصدير CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-flore-card rounded-2xl p-6 shadow-luxury"
              >
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <p className="text-2xl font-bold text-flore-text-primary">{stat.value}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-sm text-flore-text-secondary">{stat.label}</p>
                  <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                    {stat.trend}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Charts Row */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-flore-card rounded-3xl p-6 shadow-luxury">
            <h3 className="font-amiri text-xl font-bold mb-4">توزيع حالات الطلبات</h3>
            <div className="space-y-3">
              {orderStatuses.slice(0, 6).map(status => {
                const count = orders.filter(o => o.status === status.value).length
                const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div key={status.value}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{status.label}</span>
                      <span className="font-bold">{count}</span>
                    </div>
                    <div className="h-2 bg-flore-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: status.color.includes('green') ? '#67B26F' :
                            status.color.includes('blue') ? '#3B82F6' :
                              status.color.includes('yellow') ? '#F5A623' : '#0D5C63'
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-flore-card rounded-3xl p-6 shadow-luxury">
            <h3 className="font-amiri text-xl font-bold mb-4">أحدث النشاطات</h3>
            <div className="space-y-4">
              {orders.slice(0, 5).map(order => {
                const statusInfo = orderStatuses.find(s => s.value === order.status)
                return (
                  <div key={order.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${statusInfo?.color.split(' ')[0] || 'bg-gray-300'}`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">طلب #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-flore-text-secondary">{order.customer_name || '—'}</p>
                    </div>
                    <span className="text-sm font-bold">{formatPrice(order.total)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-flore-text-secondary" />
            <input
              type="text"
              placeholder="بحث بالاسم، رقم الهاتف، أو رقم الطلب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-3 rounded-xl border-2 border-flore-border bg-flore-card focus:border-flore-primary focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'received', 'arranging', 'en_route', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${filter === status
                    ? 'bg-flore-primary text-white'
                    : 'bg-flore-card text-flore-text-secondary hover:bg-flore-subtle'
                  }`}
              >
                {status === 'all' ? 'الكل' : orderStatuses.find(s => s.value === status)?.label || status}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-flore-card rounded-3xl shadow-luxury overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-flore-subtle/50">
                <tr>
                  <th className="p-4 text-sm font-medium text-flore-text-secondary">الطلب</th>
                  <th className="p-4 text-sm font-medium text-flore-text-secondary">العميل</th>
                  <th className="p-4 text-sm font-medium text-flore-text-secondary">المنتجات</th>
                  <th className="p-4 text-sm font-medium text-flore-text-secondary">المبلغ</th>
                  <th className="p-4 text-sm font-medium text-flore-text-secondary">الحالة</th>
                  <th className="p-4 text-sm font-medium text-flore-text-secondary">التاريخ</th>
                  <th className="p-4 text-sm font-medium text-flore-text-secondary">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const statusInfo = orderStatuses.find(s => s.value === order.status)
                  return (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-t border-flore-border hover:bg-flore-subtle/30 transition-colors"
                    >
                      <td className="p-4">
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-flore-text-secondary">{order.items?.length || 0} منتج</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{order.customer_name || '—'}</p>
                        <p className="text-xs text-flore-text-secondary">{order.customer_phone}</p>
                        <p className="text-xs text-flore-text-secondary">{order.delivery_address}</p>
                      </td>
                      <td className="p-4">
                        <div className="flex -space-x-2">
                          {order.items?.slice(0, 3).map((item, i) => (
                            item.product?.image && (
                              <img
                                key={i}
                                src={item.product.image} // 👈 الإصلاح الحاسم هنا لقراءة صورة المنتج بشكل صحيح
                                alt={item.product.name}
                                className="w-8 h-8 rounded-full border-2 border-white object-cover"
                              />
                            )
                          ))}
                          {order.items?.length > 3 && (
                            <span className="w-8 h-8 rounded-full bg-flore-subtle flex items-center justify-center text-xs font-medium">
                              +{order.items.length - 3}
                            </span>
                          )}
                        </div>
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
                        <div className="flex gap-1">
                          <select
                            value={order.status}
                            onChange={(e) => updateStatus(order.id, e.target.value)}
                            className="text-xs rounded-lg border border-flore-border bg-flore-bg px-2 py-1 focus:border-flore-primary focus:outline-none"
                          >
                            {orderStatuses.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => updateStatus(order.id, 'delivered')}
                            className="p-2 rounded-lg bg-green-100 text-green-600 hover:bg-green-200"
                            title="تم التسليم"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => updateStatus(order.id, 'cancelled')}
                            className="p-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200"
                            title="إلغاء"
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {filteredOrders.length === 0 && (
            <div className="p-12 text-center text-flore-text-secondary">
              لا توجد طلبات في هذا الفلتر
            </div>
          )}
        </div>
      </div>
    </div>
  )
}