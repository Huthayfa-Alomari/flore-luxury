"use client"

import Link from 'next/link'
import { Flower2, Instagram, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-flore-primary text-white py-12 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Flower2 className="h-8 w-8" />
            <span className="font-amiri text-2xl font-bold">FLORÉ</span>
          </div>
          <p className="text-white/70 text-sm leading-relaxed">
            بوكيهات فاخرة بتصاميم حصرية، توصيل سريع في عمّان والأردن
          </p>
        </div>
        <div>
          <h3 className="font-bold mb-4">روابط سريعة</h3>
          <div className="space-y-2">
            <Link href="/catalog" className="block text-white/70 hover:text-white transition-colors">المجموعة</Link>
            <Link href="/atelier" className="block text-white/70 hover:text-white transition-colors">الأتيليه</Link>
            <Link href="/ar" className="block text-white/70 hover:text-white transition-colors">تجربة AR</Link>
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-4">تواصل معنا</h3>
          <div className="space-y-2">
            <a href="tel:+962790000000" className="flex items-center gap-2 text-white/70 hover:text-white">
              <Phone className="h-4 w-4" />
              0790000000
            </a>
            <a href="#" className="flex items-center gap-2 text-white/70 hover:text-white">
              <Instagram className="h-4 w-4" />
              @flore_luxury
            </a>
          </div>
        </div>
        <div>
          <h3 className="font-bold mb-4">الموقع</h3>
          <div className="flex items-center gap-2 text-white/70">
            <MapPin className="h-4 w-4" />
            عمّان، الأردن
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-8 border-t border-white/20 text-center text-white/50 text-sm">
        © 2026 FLORÉ Luxury. جميع الحقوق محفوظة
      </div>
    </footer>
  )
}