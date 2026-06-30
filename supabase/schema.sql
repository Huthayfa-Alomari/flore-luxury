-- ========================================================
-- 🛑 أولاً: مرحلة التصفير الشامل والمحو (Wiping the Slate Clean)
-- ========================================================

DROP TRIGGER IF EXISTS validate_order_total_trigger ON orders CASCADE;
DROP FUNCTION IF EXISTS validate_order_total() CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;

-- ========================================================
-- 🚀 ثانياً: إعادة البناء بنظافة (Fresh Authoritative Schema)
-- ========================================================

-- 1. جدول المنتجات (باقات زهور Floré)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    in_stock BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. جدول رتب وصلاحيات المستخدمين (لإدارة إشعارات الأدمن)
CREATE TABLE user_roles (
    user_id UUID PRIMARY KEY, -- يربط مع معرف الـ User في auth.users
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. جدول اشتراكات الإشعارات (Web Push)
CREATE TABLE push_subscriptions (
    user_id UUID PRIMARY KEY,
    subscription JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. جدول الطلبات الشامل والمحمي (Orders Table)
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- يكون NULL في حال الـ Guest
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    delivery_address TEXT NOT NULL,
    delivery_notes TEXT,
    delivery_date TIMESTAMPTZ,
    payment_method TEXT NOT NULL, -- whatsapp, cliq, cash, stripe
    payment_status TEXT NOT NULL DEFAULT 'pending',
    status TEXT NOT NULL DEFAULT 'pending',
    total NUMERIC NOT NULL,
    items JSONB NOT NULL, -- مصفوفة تفاصيل باقة الورد، كميتها، وسعرها التاريخي
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ========================================================
-- 🛡️ ثالثاً: زرع التدقيق الآلي (Integrity Trigger)
-- ========================================================

CREATE OR REPLACE FUNCTION validate_order_total()
RETURNS TRIGGER AS $$
DECLARE
  item_sum NUMERIC;
BEGIN
  -- احتساب المجموع الحقيقي من داخل مصفوفة الـ JSONB في الخلفية
  SELECT COALESCE(SUM(price_at_time * qty), 0)
  INTO item_sum
  FROM jsonb_to_recordset(NEW.items) AS x(product_id UUID, price_at_time NUMERIC, qty INT);

  -- سماحية ضئيلة جداً 0.01 لتجنب مشاكل الفواصل العشرية في السيرفر
  IF ABS(COALESCE(NEW.total, 0) - item_sum) > 0.01 THEN
    RAISE EXCEPTION 'Order total mismatch: expected %, got %', item_sum, NEW.total;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ربط التريجر بالجدول ليحرس الحركات المالية قبل الإدخال أو التعديل
CREATE TRIGGER validate_order_total_trigger
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION validate_order_total();

-- ========================================================
-- 📊 رابعاً: حقن بيانات تجريبية نظيفة (Seed Data)
-- ========================================================

INSERT INTO products (name, price, in_stock) VALUES
('باقة توليب فاخرة - Floré Luxury Tulip', 45.00, true),
('باقة الجوري الأحمر الكلاسيكية', 29.99, true),
('تنسيق الأوركيد الملكي', 85.00, false); -- منتج نفذت كميته لفحص حماية الـ API