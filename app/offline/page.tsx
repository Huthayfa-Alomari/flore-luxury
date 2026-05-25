import Link from 'next/link'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="h-24 w-24 bg-flore-subtle rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="h-12 w-12 text-flore-text-secondary" />
        </div>
        <h1 className="font-amiri text-3xl font-bold text-flore-text-primary mb-4">
          لا يوجد اتصال بالإنترنت
        </h1>
        <p className="text-flore-text-secondary mb-8">
          يبدو أنك غير متصل. بعض الميزات قد لا تعمل. تحقق من اتصالك وحاول مرة أخرى.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => window.location.reload()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            إعادة المحاولة
          </Button>
          <Link href="/">
            <Button variant="outline">الصفحة الرئيسية</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}