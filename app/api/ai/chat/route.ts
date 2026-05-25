import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { messages } = body

    // In production, call OpenAI API
    // For demo, return a mock response

    const lastMessage = messages[messages.length - 1].content

    let reply = ''

    if (lastMessage.includes('خطوبة') || lastMessage.includes('مناسبة')) {
      reply = 'لمناسبة الخطوبة أنصحك بـ "الحرير المخملي" أو "صندوق الفاوانيا الملكي". كلاهما يعبر عن الفخامة والرومانسية. هل تريد إضافة شوكولاتة بلجيكية مع البوكيه؟'
    } else if (lastMessage.includes('عناية') || lastMessage.includes('محفوظة')) {
      reply = 'الزهور المحفوظة تحتاج لعناية خاصة: تجنب التعرض المباشر لأشعة الشمس، رطبيها برذاذ خفيف كل أسبوعين، ولا تضعيها في أماكن رطبة. عمرها يصل لسنة أو أكثر!'
    } else if (lastMessage.includes('توصيل') || lastMessage.includes('مدة')) {
      reply = 'التوصيل في عمّان خلال 2-4 ساعات من تأكيد الطلب. في الزرقاء وإربد خلال 24 ساعة. التوصيل مجاني للطلبات فوق 50 د.أ.'
    } else if (lastMessage.includes('خصم') || lastMessage.includes('سعر')) {
      reply = 'لدينا خصم 10% للأعضاء الذهبيين و15% للـ VIP. كما نقدم خصومات موسمية. هل تريد التسجيل في برنامج الولاء؟'
    } else {
      reply = 'شكراً لسؤالك! أنا هنا لمساعدتك في اختيار الزهور المناسبة. يمكنك سؤالي عن: أنواع البوكيهات، المناسبات المناسبة، العناية بالزهور، أو التوصيل والدفع. ما الذي تبحث عنه بالتحديد؟'
    }

    return NextResponse.json({ reply })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    )
  }
}