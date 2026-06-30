import { expect } from 'vitest'

// @ts-expect-error - تجاوز مشكلة تتبع المسار الفرعي للحزمة وقت الـ Compile (ستعمل بنجاح وقت التشغيل)
import * as matchers from '@testing-library/jest-dom/matchers'

// 1. تمديد قدرات الفحص لـ Vitest عند التشغيل الفعلي للاختبارات
expect.extend(matchers)

// 2. حقن دوال الفحص مباشرة داخل موديول Vitest الموثق والظاهر للـ Compiler
declare module 'vitest' {
  interface Assertion<T = any> {
    toBeInTheDocument(): void
    toBeVisible(): void
    toBeDisabled(): void
    toHaveClass(...classNames: string[]): void
    toHaveAttribute(attr: string, value?: any): void
    toHaveTextContent(text: string | RegExp): void
    toHaveValue(value: any): void
  }
  interface AsymmetricMatchersContaining {
    toBeInTheDocument(): void
    toBeVisible(): void
    toBeDisabled(): void
    toHaveClass(...classNames: string[]): void
    toHaveAttribute(attr: string, value?: any): void
    toHaveTextContent(text: string | RegExp): void
    toHaveValue(value: any): void
  }
}

// 3. محاكاة واجهة matchMedia للمتصفح (ضرورية لحماية حركات Framer Motion الفاخرة أثناء الفحص)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => true,
// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock Supabase
vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getUser: vi.fn(() => Promise.resolve({ data: { user: null } })),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(() => ({ subscription: { unsubscribe: vi.fn() } })),
    },
    from: vi.fn(function(this: any) {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockReturnThis(),
        single: vi.fn(() => Promise.resolve({ data: null, error: null })),
      }
    }),
  }),
})

// 4. محاكاة ResizeObserver لمنع انهيار اختبارات المكونات ثلاثية الأبعاد أو المستجيبة
class ResizeObserverMock {
  observe() { }
  unobserve() { }
  disconnect() { }
}

global.ResizeObserver = ResizeObserverMock
// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'light', setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}))
