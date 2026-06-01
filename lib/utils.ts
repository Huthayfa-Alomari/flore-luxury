import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { CartItem } from '@/lib/store/cart-store';

// 1. دالة دمج كلاسات Tailwind (ضرورية جداً للمكونات)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 2. دالة تنسيق الأسعار
export function formatPrice(price: number): string {
  return `${price.toFixed(2)} JOD`;
}

// 3. دالة توليد رسالة الواتساب
export function generateWhatsAppMessage(items: CartItem[], total: number): string {
  let message = `🌸 *طلب جديد من متجر Floré* 🌸\n\n`;

  items.forEach((item, index) => {
    message += `${index + 1}. *${item.product.name}*\n`;
    message += `   الكمية: ${item.quantity}\n`;
    message += `   السعر: ${formatPrice(item.product.price * item.quantity)}\n`;

    if (item.customization) {
      if (item.customization.wrap) message += `   التغليف: ${item.customization.wrap}\n`;
      if (item.customization.vase) message += `   المزهرية: ${item.customization.vase}\n`;
      if (item.customization.message) message += `   كرت الإهداء: "${item.customization.message}"\n`;
    }
    message += `---------------------------\n`;
  });

  message += `\n💰 *الإجمالي الكلي:* ${formatPrice(total)}`;
  message += `\n\nشكراً لاختياركم فلوري، يرجى إرسال هذه الرسالة لتأكيد الطلب وبدء التنسيق الفاخر ونقش العطر الدائم ✨.`;

  return message;
}