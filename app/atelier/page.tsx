'use client'

import { useState, useRef, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Environment, ContactShadows, Float } from '@react-three/drei'
import { motion, AnimatePresence } from 'framer-motion'
import { Flower2, Palette, Ribbon, Vase, ShoppingBag, RotateCcw, Check } from 'lucide-react'
import * as THREE from 'three'
import { useCartStore } from '@/lib/store/cart-store'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'

// Flower types with colors
const flowerTypes = [
  { id: 'rose', name: 'وردة', nameEn: 'Rose', color: '#E63946', price: 5 },
  { id: 'tulip', name: 'توليب', nameEn: 'Tulip', color: '#F4A261', price: 4 },
  { id: 'orchid', name: 'أوركيد', nameEn: 'Orchid', color: '#9D4EDD', price: 8 },
  { id: 'peony', name: 'فاوانيا', nameEn: 'Peony', color: '#F72585', price: 7 },
  { id: 'lily', name: 'زنبق', nameEn: 'Lily', color: '#FFF3B0', price: 6 },
  { id: 'sunflower', name: 'عباد الشمس', nameEn: 'Sunflower', color: '#FCBF49', price: 5 },
]

const wrapOptions = [
  { id: 'kraft', name: 'كرتوني طبيعي', price: 3, color: '#C4A77D' },
  { id: 'silk', name: 'حرير أبيض', price: 5, color: '#F8F9FA' },
  { id: 'velvet', name: 'مخمل ذهبي', price: 8, color: '#D4AF37' },
  { id: 'lace', name: 'دانتيل', price: 6, color: '#FFF0F5' },
]

const vaseOptions = [
  { id: 'none', name: 'بدون مزهرية', price: 0 },
  { id: 'glass', name: 'زجاج شفاف', price: 15 },
  { id: 'ceramic', name: 'سيراميك أبيض', price: 25 },
  { id: 'marble', name: 'رخامي', price: 40 },
]

// 3D Flower Component
function Flower3D({ position, color, type }: { position: [number, number, number]; color: string; type: string }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5 + position[0]) * 0.1
    }
  })

  return (
    <Float speed={2} rotationIntensity={0.3} floatIntensity={0.5}>
      <group position={position}>
        {/* Stem */}
        <mesh position={[0, -1, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 2, 8]} />
          <meshStandardMaterial color="#2D6A4F" />
        </mesh>

        {/* Flower Head */}
        <mesh ref={meshRef} position={[0, 0.2, 0]}>
          <sphereGeometry args={[0.25, 16, 16]} />
          <meshStandardMaterial color={color} roughness={0.4} />
        </mesh>

        {/* Petals */}
        {[...Array(5)].map((_, i) => (
          <mesh key={i} position={[
            Math.cos((i / 5) * Math.PI * 2) * 0.2,
            0.2,
            Math.sin((i / 5) * Math.PI * 2) * 0.2
          ]} rotation={[0, (i / 5) * Math.PI * 2, 0.3]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial color={color} transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
    </Float>
  )
}

// 3D Bouquet Scene
function BouquetScene({ flowers, wrapColor }: { flowers: any[]; wrapColor: string }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />

      {flowers.map((flower, i) => (
        <Flower3D
          key={`${flower.id}-${i}`}
          position={[
            Math.sin((i / Math.max(flowers.length, 1)) * Math.PI * 2) * 0.5,
            i * 0.1,
            Math.cos((i / Math.max(flowers.length, 1)) * Math.PI * 2) * 0.5
          ]}
          color={flower.color}
          type={flower.id}
        />
      ))}

      {/* Wrap */}
      <mesh position={[0, -0.5, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.8, 1.5, 32, 1, true]} />
        <meshStandardMaterial color={wrapColor} side={THREE.DoubleSide} roughness={0.8} />
      </mesh>

      <ContactShadows position={[0, -1.5, 0]} opacity={0.4} scale={10} blur={2} far={4} />
      <Environment preset="studio" />
      <OrbitControls enablePan={false} minDistance={3} maxDistance={8} />
    </>
  )
}

export default function AtelierPage() {
  const [selectedFlowers, setSelectedFlowers] = useState<string[]>([])
  const [selectedWrap, setSelectedWrap] = useState('kraft')
  const [selectedVase, setSelectedVase] = useState('none')
  const [showSummary, setShowSummary] = useState(false)
  const addItem = useCartStore((state) => state.addItem)

  const addFlower = (flowerId: string) => {
    if (selectedFlowers.length < 12) {
      setSelectedFlowers([...selectedFlowers, flowerId])
    }
  }

  const removeFlower = (index: number) => {
    setSelectedFlowers(selectedFlowers.filter((_, i) => i !== index))
  }

  const clearAll = () => {
    setSelectedFlowers([])
    setSelectedWrap('kraft')
    setSelectedVase('none')
  }

  const calculateTotal = () => {
    const flowersTotal = selectedFlowers.reduce((sum, id) => {
      const flower = flowerTypes.find(f => f.id === id)
      return sum + (flower?.price || 0)
    }, 0)
    const wrapPrice = wrapOptions.find(w => w.id === selectedWrap)?.price || 0
    const vasePrice = vaseOptions.find(v => v.id === selectedVase)?.price || 0
    return flowersTotal + wrapPrice + vasePrice
  }

  const handleAddToCart = () => {
    const flowerNames = selectedFlowers.map(id => flowerTypes.find(f => f.id === id)?.name).filter(Boolean)

    // Create a custom product for the cart
    const customProduct = {
      id: `custom-${Date.now()}`,
      name: `بوكيه مخصص (${selectedFlowers.length} زهور)`,
      name_en: `Custom Bouquet (${selectedFlowers.length} flowers)`,
      category: 'custom' as const,
      price: calculateTotal(),
      currency: 'JOD',
      image: 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&h=600&fit=crop',
      images: [],
      description: `بوكيه مخصص: ${flowerNames.join('، ')}`,
      description_en: null,
      badge: 'مخصص',
      badge_color: '#C9A962',
      in_stock: true,
      model_url: null,
      ar_enabled: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    addItem(customProduct, 1, {
      flowers: flowerNames as string[],
      wrap: wrapOptions.find(w => w.id === selectedWrap)?.name || '',
      vase: vaseOptions.find(v => v.id === selectedVase)?.name || '',
    })

    setShowSummary(true)
  }

  const wrapColor = wrapOptions.find(w => w.id === selectedWrap)?.color || '#C4A77D'
  const flowerObjects = selectedFlowers.map(id => flowerTypes.find(f => f.id === id)).filter(Boolean)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="font-amiri text-4xl font-bold text-flore-text-primary mb-2">
          أتيليه فلوري
        </h1>
        <p className="text-flore-text-secondary">
          صمم باقتك الخاصة بأزهارك المفضلة
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* 3D Preview */}
        <div className="space-y-4">
          <div className="bg-flore-card rounded-3xl overflow-hidden shadow-luxury aspect-square">
            <Suspense fallback={
              <div className="h-full flex items-center justify-center">
                <Flower2 className="h-12 w-12 text-flore-primary animate-spin" />
              </div>
            }>
              <Canvas camera={{ position: [0, 2, 5], fov: 45 }}>
                <BouquetScene flowers={flowerObjects} wrapColor={wrapColor} />
              </Canvas>
            </Suspense>
          </div>
          <p className="text-center text-sm text-flore-text-secondary">
            اسحب للتدوير · تكبير/تصغير بالعجلة
          </p>
        </div>

        {/* Controls */}
        <div className="space-y-6">
          {/* Flowers */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-amiri text-xl font-bold flex items-center gap-2">
                  <Flower2 className="h-5 w-5" />
                  اختر الزهور ({selectedFlowers.length}/12)
                </h3>
                <Button variant="ghost" size="sm" onClick={clearAll} className="gap-1">
                  <RotateCcw className="h-4 w-4" />
                  إعادة
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {flowerTypes.map((flower) => (
                  <button
                    key={flower.id}
                    onClick={() => addFlower(flower.id)}
                    disabled={selectedFlowers.length >= 12}
                    className="p-3 rounded-xl border-2 border-flore-border hover:border-flore-primary transition-colors text-center disabled:opacity-50"
                  >
                    <div
                      className="h-8 w-8 rounded-full mx-auto mb-2"
                      style={{ backgroundColor: flower.color }}
                    />
                    <p className="text-xs font-medium">{flower.name}</p>
                    <p className="text-xs text-flore-text-secondary">{flower.price} د.أ</p>
                  </button>
                ))}
              </div>

              {/* Selected flowers list */}
              {selectedFlowers.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {selectedFlowers.map((id, i) => {
                    const flower = flowerTypes.find(f => f.id === id)
                    return (
                      <button
                        key={i}
                        onClick={() => removeFlower(i)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs bg-flore-subtle hover:bg-red-100 transition-colors"
                      >
                        {flower?.name}
                        <span className="text-red-500">×</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Wrap */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-amiri text-xl font-bold flex items-center gap-2 mb-4">
                <Ribbon className="h-5 w-5" />
                التغليف
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {wrapOptions.map((wrap) => (
                  <button
                    key={wrap.id}
                    onClick={() => setSelectedWrap(wrap.id)}
                    className={`p-3 rounded-xl border-2 transition-colors text-right ${
                      selectedWrap === wrap.id ? 'border-flore-primary bg-flore-primary/5' : 'border-flore-border'
                    }`}
                  >
                    <div
                      className="h-6 w-full rounded mb-2"
                      style={{ backgroundColor: wrap.color }}
                    />
                    <p className="text-sm font-medium">{wrap.name}</p>
                    <p className="text-xs text-flore-text-secondary">{wrap.price} د.أ</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Vase */}
          <Card>
            <CardContent className="p-6">
              <h3 className="font-amiri text-xl font-bold flex items-center gap-2 mb-4">
                <Vase className="h-5 w-5" />
                المزهرية (اختياري)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {vaseOptions.map((vase) => (
                  <button
                    key={vase.id}
                    onClick={() => setSelectedVase(vase.id)}
                    className={`p-3 rounded-xl border-2 transition-colors text-right ${
                      selectedVase === vase.id ? 'border-flore-primary bg-flore-primary/5' : 'border-flore-border'
                    }`}
                  >
                    <p className="text-sm font-medium">{vase.name}</p>
                    <p className="text-xs text-flore-text-secondary">
                      {vase.price === 0 ? 'مجاناً' : `${vase.price} د.أ`}
                    </p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Total & Add to Cart */}
          <div className="bg-flore-card rounded-3xl p-6 shadow-luxury">
            <div className="flex items-center justify-between mb-4">
              <span className="font-noto font-medium">الإجمالي:</span>
              <span className="font-amiri text-3xl font-bold text-flore-primary">
                {calculateTotal()} د.أ
              </span>
            </div>
            <Button
              size="lg"
              className="w-full gap-2"
              onClick={handleAddToCart}
              disabled={selectedFlowers.length === 0}
            >
              <ShoppingBag className="h-5 w-5" />
              أضف للسلة
            </Button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowSummary(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-flore-card rounded-3xl p-8 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-amiri text-2xl font-bold mb-2">تمت الإضافة للسلة</h3>
              <p className="text-flore-text-secondary mb-6">
                بوكيهك المخصص أصبح في سلة التسوق
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setShowSummary(false)}>
                  مواصلة التصميم
                </Button>
                <Button className="flex-1" onClick={() => window.location.href = '/cart'}>
                  الذهاب للسلة
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}