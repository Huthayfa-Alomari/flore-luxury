import { createClient } from '@/lib/supabase/server'
import HomeContent from '@/components/home/HomeContent'
import { Product } from '@/types'
import { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'الرئيسية | FLORÉ Luxury',
}

async function getFeaturedProducts(): Promise<Product[]> {
export const dynamic = 'force-dynamic';
async function getFeaturedProducts() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .not('badge', 'is', null)
    .order('created_at', { ascending: false })
    .limit(6)

  if (error) {
    console.error('[HomePage] Error fetching products:', error)
    return []
  }

  return (data as Product[]) ?? []
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts()
  return <HomeContent featuredProducts={featuredProducts} />
}