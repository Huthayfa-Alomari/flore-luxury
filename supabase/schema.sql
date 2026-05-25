-- ============================================================
-- FLORÉ Luxury — Complete Supabase Schema
-- Copy everything below into Supabase SQL Editor and run
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PRODUCTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  name_en TEXT,
  category TEXT NOT NULL CHECK (category IN ('bouquets','preserved','vases','chocolates','custom')),
  price NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'JOD',
  image TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  description TEXT,
  description_en TEXT,
  badge TEXT,
  badge_color TEXT,
  in_stock BOOLEAN DEFAULT TRUE,
  model_url TEXT,
  ar_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. PROFILES TABLE (extends auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  phone TEXT UNIQUE,
  avatar_url TEXT,
  membership TEXT DEFAULT 'classic' CHECK (membership IN ('classic','golden','vip')),
  total_orders INT DEFAULT 0,
  total_spent NUMERIC(10,2) DEFAULT 0,
  language TEXT DEFAULT 'ar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. ORDERS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  items JSONB NOT NULL,
  total NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'JOD',
  status TEXT DEFAULT 'received' CHECK (status IN (
    'received','arranging','scenting','sealing','departed',
    'en_route','nearby','arrived','delivered','cancelled'
  )),
  payment_method TEXT DEFAULT 'whatsapp' CHECK (payment_method IN ('whatsapp','cliq','cash')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending','paid','failed')),
  delivery_address TEXT NOT NULL,
  delivery_region TEXT CHECK (delivery_region IN ('amman','zarqa','irbid','other')),
  customer_phone TEXT NOT NULL,
  customer_name TEXT,
  gift_message TEXT,
  notes TEXT,
  driver_id UUID REFERENCES auth.users(id),
  driver_lat NUMERIC,
  driver_lng NUMERIC,
  temperature NUMERIC,
  humidity NUMERIC,
  estimated_arrival TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. ORDER STATUS HISTORY
-- ============================================================
CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. WISHLIST TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  product_id UUID REFERENCES products(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- ============================================================
-- 6. PUSH NOTIFICATION SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, endpoint)
);

-- ============================================================
-- 7. USER ROLES (admin/driver/customer)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  role TEXT NOT NULL CHECK (role IN ('admin','driver','customer')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, phone, language)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'language', 'ar')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (order_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_order_status_change ON orders;
CREATE TRIGGER on_order_status_change
  AFTER UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION log_order_status_change();

-- ============================================================
-- REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Products are publicly viewable" ON products;
DROP POLICY IF EXISTS "Users manage own profile" ON profiles;
DROP POLICY IF EXISTS "Users see own orders" ON orders;
DROP POLICY IF EXISTS "Users create own orders" ON orders;
DROP POLICY IF EXISTS "Users manage own wishlist" ON wishlist;
DROP POLICY IF EXISTS "Users manage own push subs" ON push_subscriptions;
DROP POLICY IF EXISTS "Roles are managed by admins" ON user_roles;
DROP POLICY IF EXISTS "Order history viewable by participants" ON order_status_history;

-- Create policies
CREATE POLICY "Products are publicly viewable" ON products FOR SELECT USING (TRUE);

CREATE POLICY "Users manage own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users see own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own wishlist" ON wishlist
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own push subs" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Roles are managed by admins" ON user_roles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Order history viewable by participants" ON order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE id = order_status_history.order_id AND user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- SEED DATA: 9 Premium Products
-- ============================================================
INSERT INTO products (name, name_en, category, price, image, badge, badge_color, model_url, ar_enabled) VALUES
('الحرير المخملي', 'Blush Silk Velvet', 'bouquets', 45.00, 'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=500&h=600&fit=crop', 'الأكثر مبيعاً', '#E7D8B9', '/models/blush-velvet.glb', TRUE),
('زهرة العنبر الذهبية', 'Golden Amber Rose', 'bouquets', 65.00, 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&h=600&fit=crop', 'جديد', '#0D5C63', '/models/golden-amber.glb', TRUE),
('أوركيد منتصف الليل', 'Midnight Orchid', 'preserved', 85.00, 'https://images.unsplash.com/photo-1487070183336-b863922373d4?w=500&h=600&fit=crop', NULL, NULL, NULL, FALSE),
('صندوق الفاوانيا الملكي', 'Royal Peony Box', 'bouquets', 120.00, 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=500&h=600&fit=crop', 'VIP', '#C9A962', '/models/royal-peony.glb', TRUE),
('تنسيق المزهرية الكريستالية', 'Crystal Vase Arrangement', 'vases', 95.00, 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=500&h=600&fit=crop', NULL, NULL, '/models/crystal-vase.glb', TRUE),
('زهور الشوكولاتة البلجيكية', 'Belgian Chocolate Roses', 'chocolates', 55.00, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&h=600&fit=crop', 'مميز', '#F5E6E8', NULL, FALSE),
('قبة الوردة الأبدية', 'Eternal Rose Dome', 'preserved', 150.00, 'https://images.unsplash.com/photo-1490750967868-88aa4f44d63d?w=500&h=600&fit=crop', 'هدية مثالية', '#C9A962', '/models/eternal-dome.glb', TRUE),
('حدائق التوليب الهولندي', 'Sunset Tulip Garden', 'bouquets', 70.00, 'https://images.unsplash.com/photo-1462275646964-a0e3f2d3988e?w=500&h=600&fit=crop', NULL, NULL, NULL, FALSE),
('مزهرية السيراميك الرخامية', 'Marble Ceramic Vase', 'vases', 80.00, 'https://images.unsplash.com/photo-1612196808214-b7e239e5bbae?w=500&h=600&fit=crop', NULL, NULL, '/models/marble-vase.glb', TRUE);

-- ============================================================
-- CREATE FIRST ADMIN (run this after creating a user via auth)
-- ============================================================
-- Replace 'USER_UUID_HERE' with the actual user UUID from auth.users
-- INSERT INTO user_roles (user_id, role) VALUES ('USER_UUID_HERE', 'admin');

-- To find your user UUID, run:
-- SELECT id, email FROM auth.users LIMIT 5;

-- ============================================================
-- DONE! Schema is ready.
-- ============================================================