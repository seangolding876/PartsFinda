# 🚗 PartsFinda - Jamaica's Premier Auto Parts Marketplace

[![Next.js](https://img.shields.io/badge/Next.js-14.2.3-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue?logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4.5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.3-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payment%20Processing-6772E5?logo=stripe)](https://stripe.com/)

## 🌟 Overview

PartsFinda is a comprehensive auto parts marketplace designed specifically for Jamaica's automotive industry. Connect car owners with verified suppliers, process secure payments, and streamline the auto parts supply chain across the island.

## ✨ Key Features

### 🔍 **Smart Part Search**
- VIN decoder integration with NHTSA database
- Advanced filtering by make, model, year, and part type
- Visual search capabilities for hard-to-identify parts

### 💳 **Secure Payment Processing**
- Stripe integration with escrow protection
- 7-day payment hold for buyer confidence
- Multiple payment methods supported
- Automated fee distribution

### 🏪 **Supplier Management**
- Professional verification system
- Multi-tier membership plans (Free, Basic J$2,500, Premium J$5,000)
- Comprehensive onboarding flow
- Document verification and compliance

### 👥 **User Roles**
- **Buyers**: Request parts, compare quotes, secure purchasing
- **Suppliers**: Manage inventory, submit quotes, process orders
- **Admins**: Platform oversight, supplier verification, analytics

### 📱 **Mobile-First Design**
- Responsive design for all device types
- Progressive Web App capabilities
- Optimized for Jamaica's mobile-first market

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, Lucide React Icons
- **Payments**: Stripe integration with webhooks
- **Database**: Supabase (PostgreSQL)
- **Authentication**: HTTP-only cookies with JWT
- **Email**: Resend integration
- **File Storage**: Cloudinary
- **Deployment**: Netlify with auto-deploy

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Stripe account (for payments)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/partsfinda.git
cd partsfinda

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

Visit `http://localhost:3000` to see the application.

## 📋 Environment Setup

### Required Variables

```bash
# Stripe (get from https://dashboard.stripe.com/apikeys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key
STRIPE_SECRET_KEY=sk_live_your_key

# Application
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

### Optional Services

```bash
# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Email (Resend)
RESEND_API_KEY=re_your_api_key

# File Storage (Cloudinary)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
```

## 🏗️ Project Structure

```
partsfinda/
├── src/
│   ├── app/                 # Next.js 14 App Router
│   │   ├── api/            # API routes
│   │   ├── auth/           # Authentication pages
│   │   ├── admin/          # Admin dashboard
│   │   ├── seller/         # Supplier interface
│   │   └── payment/        # Payment processing
│   ├── components/         # React components
│   ├── lib/               # Utilities and configurations
│   └── middleware.ts      # Next.js middleware
├── public/                # Static assets
└── supabase/             # Database schema
```

## 💰 Business Model

### Revenue Streams
1. **Supplier Subscriptions**
   - Free: Basic listing
   - Basic (J$2,500/month): Priority listing, notifications
   - Premium (J$5,000/month): Top placement, featured badge

2. **Transaction Fees**
   - 3% platform fee on completed transactions
   - Secure escrow handling with 7-day protection period

3. **Premium Services**
   - Featured supplier placements
   - Advanced analytics and reporting
   - Dedicated account management

## 🔐 Security Features

- HTTPS enforcement
- Secure cookie handling
- JWT-based authentication
- Input validation and sanitization
- SQL injection protection
- XSS prevention
- CSRF protection

## 📈 Deployment

### Netlify (Recommended)

1. **Connect Repository**: Link your GitHub repo to Netlify
2. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. **Environment Variables**: Add all required env vars in Netlify dashboard
4. **Custom Domain**: Configure your domain in Netlify settings

### Manual Deployment

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🧪 Testing

```bash
# Run linting
npm run lint

# Type checking
npx tsc --noEmit

# Build test
npm run build
```

## 📊 API Reference

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/logout` - User logout

### Parts & Requests
- `GET /api/parts` - List available parts
- `POST /api/part-requests` - Create part request
- `GET /api/vin/{vin}` - VIN decoder lookup

### Payments
- `POST /api/payments/create-intent` - Create payment intent
- `POST /api/webhooks/stripe` - Handle Stripe webhooks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary and confidential. All rights reserved.

## 📞 Support

- **Email**: support@partsfinda.com
- **Phone**: +876 219 3329
- **Address**: Kingston, Jamaica

## 🇯🇲 Made in Jamaica

Built with ❤️ for Jamaica's automotive community, connecting car owners with trusted local suppliers nationwide.

---

**Transform Jamaica's auto parts industry with PartsFinda!**
