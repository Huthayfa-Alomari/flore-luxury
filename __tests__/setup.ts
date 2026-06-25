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
  }),
})

// 4. محاكاة ResizeObserver لمنع انهيار اختبارات المكونات ثلاثية الأبعاد أو المستجيبة
class ResizeObserverMock {
  observe() { }
  unobserve() { }
  disconnect() { }
}

global.ResizeObserver = ResizeObserverMock