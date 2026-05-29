"use client" // <--- ضروري جداً لحل مشكلة الـ useRouter والـ useCart

import { useCart } from '@/lib/store/cart-store' // <--- تصحيح مسار الـ import هنا
import { useRouter } from 'next/navigation'
// ... باقي الـ imports الخاصة بك (مثل useState, framer-motion وغيرها)

export default function AtelierPage() {
  const router = useRouter()
  const { addItem } = useCart()

  // فرضاً أن هذه هي الـ states والأوبشنز المعرفة عندك في المكون:
  // const [selectedFlowers, setSelectedFlowers] = useState<string[]>([])
  // const [selectedWrap, setSelectedWrap] = useState<string>('')
  // const [selectedVase, setSelectedVase] = useState<string>('')
  // const [message, setMessage] = useState<string>('')

  const addToCart = () => {
    const wrap = wrapOptions.find(w => w.id === selectedWrap)
    const vase = vaseOptions.find(v => v.id === selectedVase)

    // بناء المنتج المخصص لإرساله إلى السلة
    const customProduct = {
      id: `custom-${Date.now()}`,
      name: 'بوكيه مخصص',
      name_en: 'Custom Bouquet',
      category: 'custom' as const,
      price: calculateTotal(),
      currency: 'JOD',
      image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&h=600&fit=crop',
      images: [],
      description: `زهور: ${selectedFlowers.map(id => flowerTypes.find(f => f.id === id)?.name).join(', ')}`,
      description_en: null,
      badge: 'مخصص',
      badge_color: '#E7D8B9',
      in_stock: true,
      model_url: null,
      ar_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // إضافة المنتج المخصص مع الـ Customization Details لمتجر Zustand
    addItem({
      product: customProduct,
      quantity: 1,
      customization: {
        flowers: selectedFlowers,
        wrap: selectedWrap,
        vase: selectedVase,
        message,
      },
    })

    // الانتقال فوراً إلى صفحة السلة للمعاينة والدفع
    router.push('/cart')
  }

  // return ( ... كود الـ JSX الخاص بك ...)
}