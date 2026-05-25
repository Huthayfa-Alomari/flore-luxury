import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orderId, lat, lng, temperature, humidity } = body

    // Use service role for driver updates
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('orders')
      .update({
        driver_lat: lat,
        driver_lng: lng,
        temperature,
        humidity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update delivery location' },
      { status: 500 }
    )
  }
}