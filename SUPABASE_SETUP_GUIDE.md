# 🗄️ PartsFinda Supabase Database Setup

## Complete Setup Instructions

### Step 1: Access Supabase Dashboard
1. Go to: https://supabase.com/dashboard
2. Sign in to your account
3. Select your **PartsFinda** project

### Step 2: Set Up Database Schema

#### 2.1 Open SQL Editor
1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**

#### 2.2 Run Database Schema
1. **Copy the entire contents** of `database-setup.sql`
2. **Paste** into the SQL Editor
3. **Click "Run"** (bottom right)
4. ✅ You should see: **"Success. No rows returned"**

This creates:
- User profiles table
- Vehicle makes and models
- Parts categories
- Parts listings table
- Shopping cart system
- Orders and order items
- Messages and conversations
- All necessary indexes and policies

#### 2.3 Add Sample Data
1. **Create another new query**
2. **Copy the entire contents** of `sample-data.sql`
3. **Paste** into the SQL Editor
4. **Click "Run"**
5. ✅ You should see rows inserted successfully

This adds:
- 8 popular car makes (Toyota, Honda, BMW, etc.)
- 40+ vehicle models
- 8 parts categories
- 4 sample seller profiles
- 8 example parts listings

### Step 3: Configure Authentication

#### 3.1 Enable Authentication Providers
1. Go to **"Authentication" → "Providers"**
2. **Enable:**
   - ✅ Email (default)
   - ✅ Google (optional)
   - ✅ Facebook (optional)

#### 3.2 Set Site URL
1. Go to **"Authentication" → "URL Configuration"**
2. **Site URL:** `https://partsfinda.com`
3. **Redirect URLs:**
   ```
   https://partsfinda.com/auth/callback
   https://partsfinda.com/auth/confirm
   ```

#### 3.3 Configure Email Templates (Optional)
1. Go to **"Authentication" → "Email Templates"**
2. Customize:
   - Welcome email
   - Password reset email
   - Email confirmation

### Step 4: Set Up Storage for Images

#### 4.1 Create Storage Bucket
1. Go to **"Storage"** in the sidebar
2. **Click "New Bucket"**
3. **Name:** `parts-images`
4. **Public:** ✅ Yes (for part images)
5. **Click "Create Bucket"**

#### 4.2 Set Storage Policies
1. **Click** on the `parts-images` bucket
2. **Go to "Policies" tab**
3. **Add new policy:**
   ```sql
   -- Allow public read access to images
   CREATE POLICY "Public read access" ON storage.objects
   FOR SELECT USING (bucket_id = 'parts-images');

   -- Allow authenticated users to upload
   CREATE POLICY "Authenticated upload" ON storage.objects
   FOR INSERT WITH CHECK (bucket_id = 'parts-images' AND auth.role() = 'authenticated');
   ```

### Step 5: Environment Variables

#### 5.1 Get Your Supabase Credentials
1. Go to **"Settings" → "API"**
2. **Copy these values:**
   - **Project URL:** `https://[your-project].supabase.co`
   - **Anon Key:** `eyJ0eXAiOiJKV1QiLCJhbGciOi...`

#### 5.2 Add to Netlify Environment Variables
After deployment, go to Netlify and add:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://fnhuxuwqcbynqcnomtpz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 6: Test Database Connection

#### 6.1 Test Data Query
In SQL Editor, run:
```sql
-- Test query to verify setup
SELECT
  p.title,
  m.name as make,
  mod.name as model,
  c.name as category,
  p.price
FROM parts p
JOIN makes m ON p.make_id = m.id
JOIN models mod ON p.model_id = mod.id
JOIN categories c ON p.category_id = c.id
LIMIT 5;
```

✅ **Expected result:** 5 sample parts with details

#### 6.2 Test Authentication
1. Go to **"Authentication" → "Users"**
2. You should see an empty users table
3. After your site is live, test user registration

### Step 7: Verify Setup Checklist

- [ ] Database schema created (all tables)
- [ ] Sample data inserted successfully
- [ ] Authentication providers enabled
- [ ] Site URL configured correctly
- [ ] Storage bucket created
- [ ] Environment variables ready
- [ ] Test queries work

## 🎉 Database Setup Complete!

Your Supabase database is now ready for production use with:
- **Complete schema** for marketplace functionality
- **Sample data** for immediate testing
- **Authentication** configured
- **Storage** ready for part images
- **Security policies** in place

Next: Deploy your site and test the live connection!
