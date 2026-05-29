import { createClient } from '@/lib/supabase/server'
import HomeContent from '@/components/home/HomeContent'

async function getFeaturedProducts() {
  const supabase = createClient()
  const { data } = await supabase
    .from('products')
    .select('*')
    .eq('in_stock', true)
    .not('badge', 'is', null)
    .order('created_at', { ascending: false })
    .limit(3)
  return data || []
}

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts()
  return <HomeContent featuredProducts={featuredProducts} />
}