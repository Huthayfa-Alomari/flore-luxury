'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { User, ShoppingBag, Heart, Settings, LogOut, Crown, ChevronLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { orderStatuses } from '@/lib/utils'
import type { Profile, Order } from '@/types'

export default function ProfilePage() {
  const { user, loading: authLoading, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'settings'>('orders')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user) {
      fetchProfile()
      fetchOrders()
    }
  }, [user, authLoading])

  const fetchProfile = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .single()
    if (data) setProfile(data as Profile)
    setLoading(false)
  }

  const fetchOrders = async () => {
    const { data } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
    if (data) setOrders(data as Order[])
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-flore-primary" />
      </div>
    )
  }

  if (!user) return null

  const tabs = [
    { id: 'orders', label: 'طلباتي', icon: ShoppingBag },
    { id: 'wishlist', label: 'المفضلة', icon: Heart },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ]

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-flore-card rounded-3xl p-8 shadow-luxury">
          <div className="flex items-center gap-6">
            <div className="relative h-20 w-20 rounded-full bg-flore-subtle flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <Image src={profile.avatar_url} alt="" fill className="object-cover" />
              ) : (
                <User className="h-10 w-10 text-flore-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-amiri text-2xl font-bold text-flore-text-primary">
                  {profile?.full_name || user.email?.split('@')[0] || 'مستخدم فلوري'}
                </h1>
                <Badge variant={profile?.membership === 'vip' ? 'gold' : 'secondary'} className="gap-1">
                  <Crown className="h-3 w-3" />
                  {profile?.membership === 'vip' ? 'VIP' : profile?.membership === 'golden' ? 'ذهبي' : 'كلاسيك'}
                </Badge>
              </div>
              <p className="text-flore-text-secondary text-sm">{user.email || user.phone}</p>
              <div className="flex gap-6 mt-3 text-sm">
                <div>
                  <span className="text-flore-text-secondary">الطلبات: </span>
                  <span className="font-bold text-flore-primary">{profile?.total_orders || 0}</span>
                </div>
                <div>
                  <span className="text-flore-text-secondary">إجمالي الإنفاق: </span>
                  <span className="font-bold text-flore-primary">{profile?.total_spent || 0} د.أ</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={signOut} className="text-flore-error">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-flore-primary text-white'
                  : 'bg-flore-card text-flore-text-secondary hover:text-flore-primary'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <ShoppingBag className="h-12 w-12 text-flore-text-secondary mx-auto mb-4" />
                  <p className="text-flore-text-secondary">لا توجد طلبات بعد</p>
                  <Link href="/catalog" className="mt-4 inline-block">
                    <Button>تصفح المجموعة</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => {
                const statusInfo = orderStatuses.find(s => s.value === order.status)
                return (
                  <Card key={order.id} className="overflow-hidden">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <p className="font-medium text-sm">طلب #{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-flore-text-secondary mt-1">
                            {new Date(order.created_at).toLocaleDateString('ar-JO')}
                          </p>
                        </div>
                        <Badge className={statusInfo?.color || ''}>{statusInfo?.label || order.status}</Badge>
                      </div>

                      <div className="space-y-2 mb-4">
                        {(order.items as any[]).map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-lg bg-flore-subtle overflow-hidden relative">
                              {item.image && (
                                <Image src={item.image} alt={item.name} fill className="object-cover" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-flore-text-secondary">{item.qty}x</p>
                            </div>
                            <span className="text-sm font-bold">{item.price * item.qty} د.أ</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-flore-border">
                        <span className="font-bold">{order.total} د.أ</span>
                        <Link href={`/tracking/${order.id}`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            تتبع الطلب
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'wishlist' && (
          <Card>
            <CardContent className="py-12 text-center">
              <Heart className="h-12 w-12 text-flore-text-secondary mx-auto mb-4" />
              <p className="text-flore-text-secondary">قائمة المفضلة فارغة</p>
            </CardContent>
          </Card>
        )}

        {activeTab === 'settings' && (
          <Card>
            <CardHeader>
              <CardTitle>إعدادات الحساب</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">الاسم الكامل</label>
                <Input defaultValue={profile?.full_name || ''} placeholder="اسمك الكامل" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                <Input defaultValue={profile?.phone || ''} placeholder="07X XXX XXXX" />
              </div>
              <Button>حفظ التغييرات</Button>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}