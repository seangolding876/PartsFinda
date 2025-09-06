-- PartsFinda Marketplace Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE,
  full_name TEXT,
  phone TEXT,
  address TEXT,
  parish TEXT,
  avatar_url TEXT,
  is_seller BOOLEAN DEFAULT false,
  seller_verified BOOLEAN DEFAULT false,
  seller_rating DECIMAL(3,2) DEFAULT 0,
  seller_reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Vehicle makes
CREATE TABLE public.makes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Vehicle models
CREATE TABLE public.models (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  make_id UUID REFERENCES public.makes(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(make_id, name)
);

-- Parts categories
CREATE TABLE public.categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id UUID REFERENCES public.categories(id),
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Parts listing
CREATE TABLE public.parts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  make_id UUID REFERENCES public.makes(id),
  model_id UUID REFERENCES public.models(id),
  title TEXT NOT NULL,
  description TEXT,
  part_number TEXT,
  oem_number TEXT,
  condition TEXT CHECK (condition IN ('new', 'used', 'refurbished')),
  price DECIMAL(10,2) NOT NULL,
  negotiable BOOLEAN DEFAULT false,
  quantity INTEGER DEFAULT 1,
  year_from INTEGER,
  year_to INTEGER,
  images JSONB DEFAULT '[]',
  location TEXT,
  parish TEXT,
  warranty_months INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'sold', 'reserved', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Shopping cart
CREATE TABLE public.cart_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, part_id)
);

-- Orders
CREATE TABLE public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  buyer_id UUID REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  order_number TEXT UNIQUE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded')),
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  delivery_address TEXT,
  delivery_parish TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Messages
CREATE TABLE public.conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  part_id UUID REFERENCES public.parts(id),
  buyer_id UUID REFERENCES public.profiles(id),
  seller_id UUID REFERENCES public.profiles(id),
  last_message TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE,
  buyer_unread INTEGER DEFAULT 0,
  seller_unread INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(part_id, buyer_id, seller_id)
);

CREATE TABLE public.messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Parts are viewable by everyone" ON public.parts
  FOR SELECT USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Sellers can create parts" ON public.parts
  FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can view own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

-- Insert sample data
INSERT INTO public.makes (name, slug) VALUES
('Toyota', 'toyota'),
('Honda', 'honda'),
('Nissan', 'nissan'),
('Mazda', 'mazda'),
('BMW', 'bmw'),
('Mercedes-Benz', 'mercedes-benz'),
('Ford', 'ford'),
('Chevrolet', 'chevrolet');

INSERT INTO public.categories (name, slug, icon) VALUES
('Engine Parts', 'engine-parts', '🔧'),
('Brake System', 'brake-system', '🛑'),
('Electrical', 'electrical', '⚡'),
('Suspension', 'suspension', '🔩'),
('Body Parts', 'body-parts', '🚗'),
('Interior', 'interior', '🪑'),
('Wheels & Tires', 'wheels-tires', '⚙️'),
('Filters', 'filters', '🌬️');
