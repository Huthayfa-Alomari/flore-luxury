import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// تأكد من إعداد هذه المتغيرات في لوحة تحكم Vercel (Environment Variables) بأسمائها السرية
webpush.setVapidDetails(
  'mailto:admin@flore.jo',
  process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!, // 👈 يدعم الحالتين لضمان عدم توقف الـ Build
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const { userId, title, body, url } = await request.json()

    // التحقق من وصول البيانات الأساسية للإشعار
    if (!title || !body) {
      return NextResponse.json({ error: 'Title and Body are required' }, { status: 400 })
    }

    // جلب كل الأجهزة المسجلة لهذا المستخدم
    const { data: subscriptions, error: dbError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', userId)

    if (dbError) {
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No active subscriptions found for this user.' })
    }

    // بناء نص ومحتوى الإشعار الفاخر للمتجر
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icons/icon-192x192.png', // 👈 تأكد من تطابق المسار مع مجلد الـ PWA الجديد public/icons
      badge: '/icons/icon-192x192.png', // يمكنك استخدام نفس الأيقونة كـ Badge مؤقتاً
      data: {
        url: url || '/',
      },
      requireInteraction: true, // يضمن بقاء الإشعار على شاشة الجوال حتى يتفاعل معه العميل
    })

    // إرسال الإشعارات بالتوازي لكل أجهزة المستخدم (جوال، لابتوب.. إلخ)
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        // التحقق من سلامة هيكل المفاتيح بالـ Database لمنع الـ Crash
        if (!sub.endpoint || !sub.p256dh || !sub.auth) return null;

        return webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
          .then(() => true)
          .catch(async (err) => {
            // 410 (Gone) أو 404 (Not Found) تعني أن المستخدم قام بإلغاء التثبيت أو أن التوكن انتهى
            if (err.statusCode === 410 || err.statusCode === 404) {
              await supabase
                .from('push_subscriptions')
                .delete()
                .eq('id', sub.id)
            }
            return null
          })
      })
    )

    // حساب عدد الإشعارات التي وصلت للأجهزة بنجاح
    const successfulSends = results.filter(Boolean).length

    return NextResponse.json({ sent: successfulSends })

  } catch (globalError: any) {
    return NextResponse.json({ error: 'Internal Server Error', details: globalError.message }, { status: 500 })
  }
}