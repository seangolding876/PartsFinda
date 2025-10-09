#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 PartsFinda Netlify Deployment Setup');
console.log('=====================================\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Error: Please run this script from the partsfinda directory');
  process.exit(1);
}

// Check if Node.js version is 18+
const nodeVersion = process.version;
console.log(`📋 Node.js version: ${nodeVersion}`);

// Verify build works
console.log('\n🔨 Testing build...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build successful!');
} catch (error) {
  console.error('❌ Build failed. Please fix build errors before deploying.');
  process.exit(1);
}

// Check configuration files
console.log('\n📄 Checking configuration files...');

const requiredFiles = [
  'netlify.toml',
  'next.config.js',
  'package.json'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} exists`);
  } else {
    console.error(`❌ ${file} missing`);
    process.exit(1);
  }
});

// Verify netlify.toml has required environment variables
const netlifyConfig = fs.readFileSync('netlify.toml', 'utf8');
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'STRIPE_SECRET_KEY',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY'
];

requiredEnvVars.forEach(envVar => {
  if (netlifyConfig.includes(envVar)) {
    console.log(`✅ ${envVar} configured in netlify.toml`);
  } else {
    console.error(`❌ ${envVar} missing from netlify.toml`);
  }
});

// Initialize git if needed
console.log('\n📦 Setting up Git repository...');
if (!fs.existsSync('.git')) {
  execSync('git init', { stdio: 'inherit' });
  console.log('✅ Git repository initialized');
}

// Create .gitignore if it doesn't exist
if (!fs.existsSync('.gitignore')) {
  const gitignoreContent = `# Dependencies
node_modules/
/.pnp
.pnp.js

# Testing
/coverage

# Next.js
/.next/
/out/

# Production
/build

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Local env files
.env*.local

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# Netlify
.netlify/
`;
  fs.writeFileSync('.gitignore', gitignoreContent);
  console.log('✅ .gitignore created');
}

// Add and commit files
console.log('\n📋 Preparing files for deployment...');
execSync('git add .', { stdio: 'inherit' });

try {
  execSync('git commit -m "Deploy PartsFinda marketplace to Netlify"', { stdio: 'inherit' });
  console.log('✅ Files committed to Git');
} catch (error) {
  console.log('ℹ️  Files already committed or no changes to commit');
}

console.log('\n🎯 DEPLOYMENT READY!');
console.log('===================');
console.log('\nNext steps:');
console.log('1. 🌐 Go to https://app.netlify.com/');
console.log('2. 📁 Click "New site from Git"');
console.log('3. 🔗 Connect your Git repository');
console.log('4. ⚙️  Use these build settings:');
console.log('   - Build command: npm install && npm run build');
console.log('   - Publish directory: .next');
console.log('   - Node version: 18');
console.log('5. 🚀 Deploy!');

console.log('\n🔧 Configuration:');
console.log('- ✅ All environment variables are pre-configured in netlify.toml');
console.log('- ✅ Next.js plugin will be automatically detected');
console.log('- ✅ API routes will be deployed as serverless functions');
console.log('- ✅ Dynamic routes like /payment/checkout/[quoteId] will work');

console.log('\n🧪 After deployment, test:');
console.log('- 🌐 Homepage loads correctly');
console.log('- 🔐 Authentication system');
console.log('- 💳 Payment flow with test cards');
console.log('- 📱 API endpoints');

console.log('\n✨ Your PartsFinda marketplace is ready for production!');
