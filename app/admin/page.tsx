"use client"

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Package, Users, DollarSign, TrendingUp, Eye, CheckCircle, XCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { formatPrice, formatDate, orderStatuses } from '@/lib/utils'
import type { Order } from '@/types'

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [stats, setStats] = useState({ total: 0, revenue: 0, customers: 0, pending: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-flore-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-flore-bg p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-amiri text-4xl font-bold text-flore-text-primary mb-8">
          لوحة التحكم
        </h1>

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
                <p className="text-sm text-flore-text-secondary">{stat.label}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {['all', 'received', 'arranging', 'en_route', 'delivered'].map((status) => (
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

        {/* Orders Table */}
        <div className="bg-flore-card rounded-3xl shadow-luxury overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-flore-subtle/50">
                <tr>
                  <th className="p-4 text-sm font-medium text-flore-text-secondary">الطلب</th>
                  <th className="p-4 text-sm font-medium text-flore-text-secondary">العميل</th>
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
                    <tr key={order.id} className="border-t border-flore-border hover:bg-flore-subtle/30">
                      <td className="p-4">
                        <p className="font-medium">#{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-flore-text-secondary">{order.items.length} منتج</p>
                      </td>
                      <td className="p-4">
                        <p className="font-medium">{order.customer_name || '—'}</p>
                        <p className="text-xs text-flore-text-secondary">{order.customer_phone}</p>
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
                          <button className="p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200" title="عرض">
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
            <div className="p-12 text-center text-flore-text-secondary">
              لا توجد طلبات في هذا الفلتر
            </div>
          )}
        </div>
      </div>
    </div>
  )
}