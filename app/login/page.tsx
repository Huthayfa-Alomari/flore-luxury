'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Flower2, Mail, Phone, ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

export default function LoginPage() {
  const [method, setMethod] = useState<'email' | 'phone'>('email')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('تم إرسال رابط تسجيل الدخول إلى بريدك الإلكتروني')
    }
    setLoading(false)
  }

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!otpSent) {
      const { error } = await supabase.auth.signInWithOtp({
        phone: `+962${phone.replace(/^0/, '')}`,
      })

      if (error) {
        setMessage(error.message)
      } else {
        setOtpSent(true)
        setMessage('تم إرسال رمز التحقق إلى هاتفك')
      }
    } else {
      const { error } = await supabase.auth.verifyOtp({
        phone: `+962${phone.replace(/^0/, '')}`,
        token: otp,
        type: 'sms',
      })

      if (error) {
        setMessage(error.message)
      } else {
        router.push('/profile')
        router.refresh()
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <Card className="overflow-hidden">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-16 w-16 bg-flore-subtle rounded-full flex items-center justify-center mb-4">
              <Flower2 className="h-8 w-8 text-flore-primary" />
            </div>
            <CardTitle className="font-amiri text-2xl">مرحباً بك في فلوري</CardTitle>
            <p className="text-flore-text-secondary text-sm mt-1">
              سجل الدخول للوصول إلى حسابك
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Method Toggle */}
            <div className="flex rounded-xl bg-flore-subtle p-1">
              <button
                onClick={() => { setMethod('email'); setOtpSent(false); setMessage('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  method === 'email' ? 'bg-white text-flore-primary shadow-sm' : 'text-flore-text-secondary'
                }`}
              >
                <Mail className="h-4 w-4 inline ml-1" />
                البريد
              </button>
              <button
                onClick={() => { setMethod('phone'); setOtpSent(false); setMessage('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
                  method === 'phone' ? 'bg-white text-flore-primary shadow-sm' : 'text-flore-text-secondary'
                }`}
              >
                <Phone className="h-4 w-4 inline ml-1" />
                الهاتف
              </button>
            </div>

            {/* Forms */}
            {method === 'email' ? (
              <form onSubmit={handleEmailLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">البريد الإلكتروني</label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'إرسال رابط تسجيل الدخول'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">رقم الهاتف</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-flore-text-secondary text-sm">
                      +962
                    </span>
                    <Input
                      type="tel"
                      placeholder="7X XXX XXXX"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      disabled={otpSent}
                      dir="ltr"
                      className="pl-16"
                    />
                  </div>
                </div>

                {otpSent && (
                  <div>
                    <label className="block text-sm font-medium mb-2">رمز التحقق</label>
                    <Input
                      type="text"
                      placeholder="123456"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      maxLength={6}
                      dir="ltr"
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : otpSent ? (
                    'تحقق من الرمز'
                  ) : (
                    'إرسال رمز التحقق'
                  )}
                </Button>
              </form>
            )}

            {message && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`text-sm text-center p-3 rounded-xl ${
                  message.includes('خطأ') || message.includes('error')
                    ? 'bg-red-50 text-red-600'
                    : 'bg-green-50 text-green-600'
                }`}
              >
                {message}
              </motion.p>
            )}

            <div className="text-center">
              <Link href="/catalog">
                <Button variant="ghost" size="sm" className="gap-2 text-flore-text-secondary">
                  <ArrowLeft className="h-4 w-4" />
                  العودة للتسوق
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}