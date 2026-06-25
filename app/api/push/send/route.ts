import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { z } from 'zod'

const SendSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(500),
  url: z.string().url().optional(),
})

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = SendSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const { userId: targetUserId, title, body: messageBody, url } = parsed.data

  // Authorization: users can only send to themselves, admins can send to anyone
  if (targetUserId !== user.id) {
    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!role || role.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: can only send notifications to yourself' },
        { status: 403 }
      )
    }
  }

  // Get push subscription for target user
  const { data: subscription, error: subError } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', targetUserId)
    .single()

  if (subError || !subscription) {
    return NextResponse.json({ error: 'No subscription found for user' }, { status: 404 })
  }

  webpush.setVapidDetails(
    'mailto:admin@flore.jo',
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  )

  const payload = JSON.stringify({
    title,
    body: messageBody,
    url: url || '/',
  })

  try {
    await webpush.sendNotification(subscription.subscription, payload)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[push/send] WebPush error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}