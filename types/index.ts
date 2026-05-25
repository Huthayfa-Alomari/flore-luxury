export interface Product {
  id: string;
  name: string;
  name_en: string | null;
  category: 'bouquets' | 'preserved' | 'vases' | 'chocolates' | 'custom';
  price: number;
  currency: string;
  image: string;
  images: string[];
  description: string | null;
  description_en: string | null;
  badge: string | null;
  badge_color: string | null;
  in_stock: boolean;
  model_url: string | null;
  ar_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  customization?: {
    flowers: string[];
    wrap: string;
    vase: string;
    message?: string;
  };
}

export interface Order {
  id: string;
  user_id: string | null;
  items: CartItem[];
  total: number;
  currency: string;
  status: string;
  payment_method: string;
  payment_status: string;
  delivery_address: string;
  delivery_region: string | null;
  customer_phone: string;
  customer_name: string | null;
  gift_message: string | null;
  notes: string | null;
  driver_id: string | null;
  driver_lat: number | null;
  driver_lng: number | null;
  temperature: number | null;
  humidity: number | null;
  estimated_arrival: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  membership: 'classic' | 'golden' | 'vip';
  total_orders: number;
  total_spent: number;
  language: string;
  created_at: string;
}

export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  product: Product;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  created_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'driver' | 'customer';
  created_at: string;
}