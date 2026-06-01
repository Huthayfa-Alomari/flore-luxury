import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// 1. تعريف واجهة حزمة السلة لحل خطأ الـ TypeScript فوراً
export interface CartItem {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image?: string
    description?: string
  }
}

// دمج كلاسات Tailwind بأمان لمنع تضارب الـ Styles
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// 2. تنسيق الأسعار بالدينار الأردني بشكل رسمي وفخم محاسبياً
export function formatPrice(price: number, currency: string = 'JOD') {
  return new Intl.NumberFormat('ar-JO', {
    style: 'currency',
    currency: currency,
    // العملة الأردنية تعتمد حسابياً على 3 خانات (فلسات)، نثبتها هنا لتطابق بوابات الدفع
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  }).format(price)
}

// تنسيق التواريخ محلياً للمملكة الأردنية الهاشمية
export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ar-JO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

// 3. توليد رسالة واتساب منسقة بدقة واحترافية وبدون أخطاء كود
export function generateWhatsAppMessage(items: CartItem[], total: number) {
  const itemsList = items.map(item => {
    const itemTotal = (item.product.price || 0) * item.quantity
    // إعادة استخدام الـ formatter لضمان فخامة العرض والتطابق المالي
    return `• ${item.product.name} (${item.quantity}x) 👈 ${formatPrice(itemTotal)}`
  }).join('\n')

  return `مرحباً FLORÉ Luxury! 👋\n\nأرغب في تأكيد طلب باقة الورد الفاخرة التالية:\n\n${itemsList}\n\n━━━━━━━━━━━━━━━\n💰 الإجمالي الكلي: ${formatPrice(total)}\n━━━━━━━━━━━━━━━\n\nيرجى مراجعة وتأكيد تفاصيل التوصيل والتحضير 🌸`
}

// دالة الـ Debounce لمنع تكرار الـ Requests العشوائية أثناء البحث أو النقر
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// تصنيفات متجر FLORÉ المعتمدة
export const categories = [
  { id: 'all', label: 'الكل', labelEn: 'All' },
  { id: 'bouquets', label: 'باقات', labelEn: 'Bouquets' },
  { id: 'preserved', label: 'محفوظة', labelEn: 'Preserved' },
  { id: 'vases', label: 'مزهريات', labelEn: 'Vases' },
  { id: 'chocolates', label: 'شوكولاتة', labelEn: 'Chocolates' },
] as const

// مصفوفة تتبع حالات الطلب اللوجستية الفاخرة للمتجر (متوافقة مع نظام الإشعارات الفورية الـ Push)
export const orderStatuses = [
  { value: 'received', label: 'تم الاستلام', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { value: 'arranging', label: 'جاري التنسيق 🌸', color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { value: 'scenting', label: 'إضافة العطر 🧪', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { value: 'sealing', label: 'التغليف الفاخر 🎁', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { value: 'departed', label: 'غادر المتجر', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { value: 'en_route', label: 'في الطريق مع السائق', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { value: 'nearby', label: 'بالقرب من موقعك 📍', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { value: 'arrived', label: 'وصل السائق لباب البيت', color: 'bg-green-50 text-green-700 border-green-200' },
  { value: 'delivered', label: 'تم التسليم بنجاح ✨', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-red-50 text-red-700 border-red-200' },
] as const