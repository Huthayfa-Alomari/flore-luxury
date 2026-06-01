import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // 1. التحقق من هوية المستخدم (اختياري حسب رغبتك إذا كنت تدعم الشراء كـ Guest أو فقط مسجلين)
    const { data: { user } } = await supabase.auth.getUser()

    const { orderId, phoneNumber } = await request.json()

    if (!orderId || !phoneNumber) {
      return NextResponse.json({ error: 'Order ID and Phone Number are required' }, { status: 400 })
    }

    // 2. حماية المتجر: جلب السعر الحقيقي من الـ Database لمنع التلاعب بالأسعار من المتصفح
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('total, status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found in database' }, { status: 404 })
    }

    // إذا كان الطلب مدفوعاً أو ملغياً بالفعل، نمنع إعادة الدفع
    if (order.status === 'delivered' || order.status === 'cancelled') {
      return NextResponse.json({ error: 'This order cannot be processed for payment' }, { status: 400 })
    }

    const secureAmount = order.total // 👈 اعتماد السعر الحقيقي المحمي من قاعدة البيانات

    // 3. إرسال طلب الدفع الرسمي إلى بوابة CliQ الأردنية
    const cliqResponse = await fetch('https://api.cliq.jo/payment/request', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CLIQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: secureAmount,
        currency: 'JOD',
        orderId: orderId,
        callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payment/cliq/callback`,
        phoneNumber: phoneNumber,
        description: `FLORÉ Luxury Order #${orderId.slice(0, 8)}`,
      }),
    })

    if (!cliqResponse.ok) {
      const errorData = await cliqResponse.json().catch(() => ({}))
      return NextResponse.json({
        error: 'Failed to generate CliQ payment request',
        details: errorData.message || 'Gateway Error'
      }, { status: cliqResponse.status })
    }

    const data = await cliqResponse.json()

    // 4. تحديث الطلب في الـ Database لتسجيل رقم المعاملة للـ Audit والـ Callback لاحقاً
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_transaction_id: data.transactionId,
        payment_method: 'CliQ',
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Failed to bind transactionId to order:', updateError.message)
      // لا نوقف العملية هنا لأن رابط الدفع تم توليده بنجاح، ولكن يفضل تسجيلها بالـ Logs
    }

    return NextResponse.json({
      paymentUrl: data.paymentUrl,
      transactionId: data.transactionId,
    })

  } catch (globalError: any) {
    return NextResponse.json({
      error: 'Internal Server Error',
      details: globalError.message
    }, { status: 500 })
  }
}