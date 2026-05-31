import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { CartItem } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number, currency: string = 'JOD') {
  return new Intl.NumberFormat('ar-JO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(price)
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('ar-JO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function generateWhatsAppMessage(items: CartItem[], total: number) {
  const itemsList = items.map(item => 
    `- ${item.product.name} (${item.quantity}x) = ${item.product.price * item.quantity} د.أ`
  ).join('\n')

  return `مرحباً فلوري! 👋\n\nأرغب في طلب:\n${itemsList}\n\nالإجمالي: ${total} د.أ\n\nيرجى تأكيد الطلب`
}

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

export const categories = [
  { id: 'all', label: 'الكل', labelEn: 'All' },
  { id: 'bouquets', label: 'باقات', labelEn: 'Bouquets' },
  { id: 'preserved', label: 'محفوظة', labelEn: 'Preserved' },
  { id: 'vases', label: 'مزهريات', labelEn: 'Vases' },
  { id: 'chocolates', label: 'شوكولاتة', labelEn: 'Chocolates' },
] as const

export const orderStatuses = [
  { value: 'received', label: 'تم الاستلام', color: 'bg-blue-100 text-blue-800' },
  { value: 'arranging', label: 'جاري التنسيق', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'scenting', label: 'إضافة العطر', color: 'bg-purple-100 text-purple-800' },
  { value: 'sealing', label: 'التغليف', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'departed', label: 'غادر المتجر', color: 'bg-orange-100 text-orange-800' },
  { value: 'en_route', label: 'في الطريق', color: 'bg-teal-100 text-teal-800' },
  { value: 'nearby', label: 'بالقرب', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'arrived', label: 'وصل', color: 'bg-green-100 text-green-800' },
  { value: 'delivered', label: 'تم التسليم', color: 'bg-emerald-100 text-emerald-800' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-red-100 text-red-800' },
] as const