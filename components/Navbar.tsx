'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Flower2, Search, ShoppingBag, User, Menu, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useCart } from '@/lib/store/cart-store'
import { ThemeToggle } from './ThemeToggle'

const navLinks = [
  { href: '/', label: 'الرئيسية' },
  { href: '/catalog', label: 'المجموعة' },
  { href: '/atelier', label: 'الأتيليه' },
  { href: '/ar', label: 'تجربة AR' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { user } = useAuth()

  // 💡 الحل: نقرأ الـ store كاملاً هنا بدون استدعاء دالة getCount مباشرة في السيرفر
  const cartStore = useCart()
  const [itemCount, setItemCount] = useState(0)

  useEffect(() => {
    setMounted(true)
    // 💡 لا يتم حساب المشتريات إلا بعد التأكد من التحميل الكامل على المتصفح (Client-side)
    setItemCount(cartStore.getCount())
  }, [cartStore])

  // 🚨 جدار الحماية: منع الـ Server من رندرة المكون تفاعلياً بهيدريشن ناقص أثناء الـ Build
  if (!mounted) {
    return (
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 border-b border-flore-border h-20">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Flower2 className="h-8 w-8 text-flore-primary" />
            <span className="font-playfair text-xl font-bold text-flore-primary">FLORÉ</span>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-white/80 border-b border-flore-border transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <Flower2 className="h-8 w-8 text-flore-primary transition-transform group-hover:rotate-12" />
              <div className="flex flex-col">
                <span className="font-playfair text-xl font-bold text-flore-primary tracking-wider">
                  FLORÉ
                </span>
                <span className="font-amiri text-sm text-flore-text-secondary -mt-1">
                  فلوري
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`font-noto text-sm font-medium transition-colors hover:text-flore-primary ${pathname === link.href ? 'text-flore-primary' : 'text-flore-text-secondary'
                    }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Search Input Overlay */}
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 200, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <input
                      type="text"
                      placeholder="بحث..."
                      className="w-full h-10 px-4 rounded-xl border border-flore-border bg-flore-card text-sm focus:outline-none focus:ring-2 focus:ring-flore-primary/30"
                      autoFocus
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Search Button */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 rounded-xl hover:bg-black/5 transition-colors text-flore-text-primary"
                aria-label="بحث"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 rounded-xl hover:bg-black/5 transition-colors text-flore-text-primary">
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute top-0 right-0 h-5 w-5 rounded-full bg-flore-primary text-white text-xs flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Link>

              {/* User */}
              <Link href={user ? '/profile' : '/login'} className="p-2 rounded-xl hover:bg-black/5 transition-colors text-flore-text-primary">
                <User className="h-5 w-5" />
              </Link>

              <ThemeToggle />

              {/* Mobile Menu Button */}
              <button
                className="p-2 rounded-xl hover:bg-black/5 transition-colors text-flore-text-primary md:hidden"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="القائمة"
              >
                {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-40 bg-flore-bg pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className="font-amiri text-2xl text-flore-text-primary hover:text-flore-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-flore-border pt-6 mt-4">
                {user ? (
                  <Link href="/profile" onClick={() => setIsOpen(false)}>
                    <span className="block w-full text-center border border-flore-border rounded-xl py-3 text-sm font-medium hover:bg-black/5 transition-colors">
                      حسابي
                    </span>
                  </Link>
                ) : (
                  <div className="flex gap-3">
                    <Link href="/login" className="flex-1" onClick={() => setIsOpen(false)}>
                      <span className="block w-full text-center bg-flore-primary text-white rounded-xl py-3 text-sm font-medium hover:bg-flore-primary-dark transition-colors">
                        تسجيل الدخول
                      </span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}