import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ShoppingBag, Users, TrendingUp, Package } from 'lucide-react'

export default async function AdminDashboard() {
  const supabase = createClient()

  // Fetch stats
  const { count: ordersCount } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

  const { count: totalOrders } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })

  const { count: productsCount } = await supabase
    .from('products')
    .select('*', { count: 'exact', head: true })

  const { data: revenue } = await supabase
    .from('orders')
    .select('total')
    .eq('payment_status', 'paid')

  const totalRevenue = revenue?.reduce((sum, o) => sum + (o.total || 0), 0) || 0

  const stats = [
    {
      title: 'طلبات اليوم',
      value: ordersCount || 0,
      icon: ShoppingBag,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      title: 'إجمالي الطلبات',
      value: totalOrders || 0,
      icon: Package,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      title: 'المنتجات',
      value: productsCount || 0,
      icon: TrendingUp,
      color: 'bg-green-50 text-green-600',
    },
    {
      title: 'الإيرادات',
      value: `${totalRevenue.toFixed(0)} د.أ`,
      icon: Users,
      color: 'bg-amber-50 text-amber-600',
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-amiri text-3xl font-bold text-flore-text-primary">لوحة التحكم</h1>
        <p className="text-flore-text-secondary mt-1">نظرة عامة على أداء المتجر</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-flore-text-secondary mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-flore-text-primary">{stat.value}</p>
                  </div>
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Recent Orders Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="font-amiri text-xl">آخر الطلبات</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-flore-text-secondary text-center py-8">
            اذهب إلى صفحة الطلبات لعرض التفاصيل الكاملة
          </p>
        </CardContent>
      </Card>
    </div>
  )
}