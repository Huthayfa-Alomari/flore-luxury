'use client'

import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/Button'
import { useARSupport } from '@/hooks/useAR'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement> & {
        src: string;
        poster?: string;
        alt?: string;
        'camera-controls'?: boolean;
        'auto-rotate'?: boolean;
        ar?: boolean;
        'ar-modes'?: string;
        'touch-action'?: string;
        'shadow-intensity'?: string;
        exposure?: string;
      }, HTMLElement>;
    }
  }
}

interface ARFlowerViewerProps {
  modelUrl: string | null
  posterUrl: string
  onClose: () => void
}

export function ARFlowerViewer({ modelUrl, posterUrl, onClose }: ARFlowerViewerProps) {
  const viewerRef = useRef<HTMLElement>(null)
  const { isSupported, isMobile } = useARSupport()
  const [isMounted, setIsMounted] = useState(false) // حماية إضافية للـ SSR

  useEffect(() => {
    setIsMounted(true)

    if (typeof window !== 'undefined' && !customElements.get('model-viewer')) {
      import('@google/model-viewer')
        .then(() => {
          console.log('Model Viewer registered successfully')
        })
        .catch((error) => {
          console.error('Error loading model-viewer:', error)
        })
    }
  }, [])

  if (!modelUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-flore-card rounded-3xl p-8 max-w-md w-full text-center">
          <p className="font-noto text-lg text-flore-text-secondary">
            نموذج ثلاثي الأبعاد غير متوفر لهذا المنتج
          </p>
          <Button onClick={onClose} className="mt-4">
            إغلاق
          </Button>
        </div>
      </div>
    )
  }

  // منع رندر الـ Custom Element تماماً على السيرفر لتفادي أي تعليق (Timeout) أثناء الـ Build
  if (!isMounted) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-flore-card rounded-3xl overflow-hidden max-w-2xl w-full shadow-2xl"
      >
        <div className="flex items-center justify-between p-4 border-b border-flore-border">
          <h3 className="font-amiri text-xl font-bold text-flore-text-primary">
            معاينة الواقع المعزز
          </h3>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="relative aspect-square bg-flore-bg">
          <model-viewer
            ref={viewerRef}
            src={modelUrl}
            poster={posterUrl}
            alt="معاينة المنتج ثلاثية الأبعاد"
            camera-controls
            auto-rotate
            ar
            ar-modes="webxr scene-viewer quick-look"
            touch-action="pan-y"
            shadow-intensity="1"
            exposure="0.8"
            style={{ width: '100%', height: '100%' }}
          >
            {/* تم إزالة الـ button المباشر كـ Slot واستبداله بعنصر div عادي لتفادي مشاكل الـ Event Handlers المتعارضة أثناء معالجة الخصائص */}
            <div
              slot="ar-button"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-flore-primary text-white px-6 py-3 rounded-xl font-noto text-sm shadow-lg hover:bg-flore-primary-dark transition-colors cursor-pointer"
            >
              عرض في مساحتك
            </div>
          </model-viewer>

          {!isSupported && (
            <div className="absolute inset-0 bg-flore-bg/90 flex items-center justify-center">
              <div className="text-center p-6">
                <p className="font-noto text-lg text-flore-text-primary mb-2">
                  الواقع المعزز غير مدعوم على هذا الجهاز
                </p>
                <p className="text-sm text-flore-text-secondary">
                  جرّب من هاتفك المحمول للحصول على أفضل تجربة
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 text-center">
          <p className="text-sm text-flore-text-secondary">
            {isMobile
              ? 'اضغط على "عرض في مساحتك" لتجربة المنتج في منزلك'
              : 'استخدم هاتفك المحمول لتجربة الواقع المعزز'
            }
          </p>
        </div>
      </motion.div>
    </div>
  )
}