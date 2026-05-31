'use client'

import { useState, useEffect } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // جدار حماية لمنع تمرير الأحداث التفاعلية أثناء رندرة السيرفر الاستاتيكية
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-medium transition-colors focus:outline-none'

  const variants = {
    primary: 'bg-flore-primary text-white hover:bg-flore-primary/90',
    secondary: 'bg-flore-secondary text-flore-text-primary hover:bg-flore-secondary/90',
    outline: 'border border-flore-border bg-transparent hover:bg-black/5',
    ghost: 'bg-transparent hover:bg-black/5'
  }

  const sizes = {
    sm: 'px-3 h-9 text-xs',
    md: 'px-4 h-11 text-sm',
    lg: 'px-6 h-13 text-base',
    icon: 'h-10 w-10'
  }

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...(mounted ? props : {})} // 🚨 السحر هنا: لا تمرر الـ onClick للسيرفر إلا بعد الـ mounted!
    >
      {children}
    </button>
  )
}