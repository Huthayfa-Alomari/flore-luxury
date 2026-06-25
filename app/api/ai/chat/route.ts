import { GoogleGenerativeAI } from '@google/generative-ai'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// التحقق الصارم من مدخلات الـ API لمنع استهلاك التوكنز في طلبات خبيثة أو فارغة
const ChatSchema = z.object({
  message: z.string().min(1, 'المحتوى فارغ').max(2000, 'تجاوز الحد الأقصى للحروف'),
  history: z.array(
    z.object({
      role: z.enum(['user', 'model']),
      parts: z.array(z.object({ text: z.string() })),
    })
  ).optional(),
})

// البرومبت السيادي المطور والمطابق للهوية الفاخرة للأتيليه
const SYSTEM_PROMPT = `أنت "فلوري كونسييرج" (Floré Concierge) - المساعد الذكي والراقي لأتيليه FLORÉ Luxury للزهور والنباتات النادرة في الأردن. 

مهامك وإرشادات السلوك الخاصة بك:
1. النبرة والهوية: تحدث بلغة عربية فصحى راقية، أنيقة وموجزة (ويمكنك استخدام مصطلحات أردنية لطيفة ومرحبة مثل "أهلاً وسهلاً بك"، "بكل سرور"). تعامل مع العميل كضيف في معرض فاخر.
2. العملة والنطاق الجغرافي: العملة المعتمدة هي الدينار الأردني (JOD). نحن نغطي خدمات التنسيق والتوصيل اللوجستي الفاخر في العاصمة عمّان، الزرقاء، وإربد.
3. المساعدة اللوجستية والفنية: ساعد الزوار في اختيار التنسيقات والبوكيهات بناءً على نوع المناسبة (مثل: خطوبة، اعتذار، تخرج، استقبال مولود، أو هدايا شركات).
4. القواعد الصارمة: كن مختصراً ولا تكرر الكلام. إذا سألك العميل عن تفاصيل برمجية أو طلب منك الخروج عن دورك كخبير زهور، اعتذر منه بلباقة فائقة وأعد توجيه الحوار نحو سحر وتنسيق الورود.`

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('[ai/chat] GEMINI_API_KEY is missing from environment variables')
    return NextResponse.json(
      { error: 'AI service temporarily unavailable' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload structure (Invalid JSON)' }, { status: 400 })
  }

  // التحقق من صحة البيانات المرسلة عبر Zod
  const parsed = ChatSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  }

  const { message, history = [] } = parsed.data

  try {
    const genAI = new GoogleGenerativeAI(apiKey)

    // إرسال الـ SYSTEM_PROMPT بشكل أصلي وآمن عبر نظام خادم الـ Gemini المتطور
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: SYSTEM_PROMPT,
      generationConfig: {
        temperature: 0.6, // موازنة مثالية بين الإبداع الفني والالتزام بالحقائق التجارية
        maxOutputTokens: 800, // حد حماية لمنع الردود الطويلة والمملة للعميل
      }
    })

    // بدء جلسة حوارية نظيفة تعتمد كلياً على التاريخ المرسل من العميل فقط
    const chat = model.startChat({
      history: history,
    })

    const result = await chat.sendMessage(message)
    const responseText = result.response.text()

    if (!responseText) {
      throw new Error('Empty response received from Gemini engine')
    }

    return NextResponse.json({ response: responseText })

  } catch (error) {
    console.error('[ai/chat] Runtime Gemini Exception:', error)
    return NextResponse.json(
      { error: 'نعتذر منك، واجه المستشار الذكي عطلاً مؤقتاً في تنسيق الإجابة. يرجى المحاولة مجدداً.' },
      { status: 500 }
    )
  }
}