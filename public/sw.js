// 1. الاستماع لحدث وصول الإشعار من السيرفر (Push Event)
self.addEventListener('push', (event) => {
  // حماية في حال وصول إشعار فارغ أو بنص غير متوافق لمنع انهيار الـ Worker
  if (!event.data) return;

  try {
    const data = event.data.json()

    event.waitUntil(
      self.registration.showNotification(data.title || 'Floré Luxury', {
        body: data.body || '',
        icon: data.icon || '/icons/icon-192x192.png',
        badge: data.badge || '/icons/icon-192x192.png',
        data: { url: data.data?.url || data.url || '/' }, // يدعم الهيكلين لضمان الأمان
        requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
        direction: 'rtl', // تضمن تنسيق النصوص العربية من اليمين لليسار بشكل فخم على الهواتف
        actions: [
          { action: 'open', title: 'عرض التفاصيل 🌸' },
          { action: 'close', title: 'تجاهل' }
        ]
      })
    )
  } catch (err) {
    console.error('Error parsing push data:', err)
  }
})

// 2. الاستماع لحدث النقر على الإشعار من قِبل العميل (Notification Click Event)
self.addEventListener('notificationclick', (event) => {
  event.notification.close() // إغلاق الإشعار فوراً من شاشة الهاتف

  // إذا اختار العميل "تجاهل" أو زر الإغلاق، نوقف التنفيذ هنا
  if (event.action === 'close') return;

  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    // البحث عن النوافذ المفتوحة للتطبيق حالياً في خلفية الهاتف
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // إذا كان التطبيق مفتوحاً بالفعل، قم بعمل Focus عليه وتوجيهه للرابط المطلوب
        for (const client of windowClients) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus()
          }
        }
        // إذا كان التطبيق مفتوحاً ولكن على صفحة أخرى، وجهه للصفحة الجديدة وعمل Focus
        if (windowClients.length > 0) {
          const client = windowClients[0]
          if ('navigate' in client && 'focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        // إذا كان التطبيق مغلقاً تماماً، افتحه في نافذة جديدة (أو داخل الـ PWA Shell)
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      })
  )
})