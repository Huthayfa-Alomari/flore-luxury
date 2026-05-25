import Link from 'next/link'
import { Flower2, Instagram, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-flore-primary text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Flower2 className="h-8 w-8 text-flore-gold" />
              <div>
                <span className="font-playfair text-xl font-bold">FLORÉ</span>
                <span className="font-amiri text-sm mr-2 text-flore-gold">فلوري</span>
              </div>
            </div>
            <p className="text-white/70 text-sm leading-relaxed">
              الفخامة في كل تفصيلة. بوكيهات فاخرة بتصاميم حصرية لكل مناسبة.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-amiri text-lg font-bold mb-4">روابط سريعة</h4>
            <ul className="space-y-3">
              {[
                { href: '/catalog', label: 'المجموعة' },
                { href: '/atelier', label: 'الأتيليه' },
                { href: '/ar', label: 'تجربة AR' },
                { href: '/profile', label: 'حسابي' },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-white/70 hover:text-flore-gold transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-amiri text-lg font-bold mb-4">تواصل معنا</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-white/70 text-sm">
                <Phone className="h-4 w-4" />
                <span>+962 7X XXX XXXX</span>
              </li>
              <li className="flex items-center gap-2 text-white/70 text-sm">
                <MapPin className="h-4 w-4" />
                <span>عمّان، الأردن</span>
              </li>
              <li className="flex items-center gap-2 text-white/70 text-sm">
                <Instagram className="h-4 w-4" />
                <span>@flore.luxury</span>
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-amiri text-lg font-bold mb-4">ساعات العمل</h4>
            <ul className="space-y-2 text-white/70 text-sm">
              <li>السبت - الخميس: 9 ص - 9 م</li>
              <li>الجمعة: 2 م - 9 م</li>
              <li>التوصيل: يومياً 10 ص - 10 م</li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/50 text-sm">
          <p>© 2026 FLORÉ Luxury. جميع الحقوق محفوظة.</p>
        </div>
      </div>
    </footer>
  )
}