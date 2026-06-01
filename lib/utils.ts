import { CartItem } from '@/lib/store/cart-store' // 1. استيراد النوع الرسمي والوحيد هنا

// دالة تنسيق الأسعار بالدينار الأردني
export function formatPrice(price: number): string {
  return `${price.toFixed(2)} JOD`
}

// 2. تحديث الدالة لتستقبل الـ CartItem الصحيح المستورد من الـ Store
export function generateWhatsAppMessage(items: CartItem[], total: number): string {
  let message = `🌸 *طلب جديد من متجر Floré* 🌸\n\n`

  items.forEach((item, index) => {
    message += `${index + 1}. *${item.product.name}*\n`
    message += `   الكمية: ${item.quantity}\n`
    message += `   السعر: ${formatPrice(item.product.price * item.quantity)}\n`

    // إذا كان هناك تخصيص للباقة يتم إضافته للفاتورة
    if (item.customization) {
      if (item.customization.wrap) message += `   التغليف: ${item.customization.wrap}\n`
      if (item.customization.vase) message += `   المزهرية: ${item.customization.vase}\n`
      if (item.customization.message) message += `   كرت الإهداء: "${item.customization.message}"\n`
    }
    message += `---------------------------\n`
  })

  message += `\n💰 *الإجمالي الكلي:* ${formatPrice(total)}`
  message += `\n\nشكراً لاختياركم فلوري، يرجى إرسال هذه الرسالة لتأكيد الطلب وبدء التنسيق الفاخر ونقش العطر الدائم ✨.`

  return message
}