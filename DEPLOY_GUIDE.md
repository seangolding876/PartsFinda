# 🚀 PartsFinda Auto-Deploy Setup Guide

## ✅ **CURRENT STATUS: Ready for GitHub Auto-Deploy**

Your Version 65 code is committed and ready to push to GitHub for automatic Netlify deployment.

---

## 🎯 **QUICK SETUP: 3 Simple Steps**

### **STEP 1: GitHub Repository Setup**

**Option A: Create New Repository (Recommended)**
1. Go to [github.com/new](https://github.com/new)
2. Repository name: `partsfinda-marketplace`
3. Set to **Public** (required for free Netlify auto-deploy)
4. **DON'T** check "Add README" (you already have code)
5. Click **"Create repository"**

**Option B: Use Existing Repository**
If you have an existing repository, just get the URL.

### **STEP 2: Connect Local Code to GitHub**

**Replace the placeholders below with your actual details:**

```bash
# Navigate to project
cd partsfinda

# Add your GitHub repository (REPLACE WITH YOUR INFO)
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git

# Push code to GitHub (triggers auto-deploy)
git push -u origin master
```

**Example with real values:**
```bash
git remote add origin https://github.com/johnsmith/partsfinda-marketplace.git
git push -u origin master
```

### **STEP 3: Connect Netlify Auto-Deploy**

1. **Go to [Netlify](https://app.netlify.com)**
2. **Click "New site from Git"**
3. **Choose "GitHub"**
4. **Select your repository** (`partsfinda-marketplace`)
5. **Configure build settings:**
   - Build command: `npm ci && npm run build`
   - Publish directory: `.next`
6. **Click "Deploy site"**

---

## 🔧 **AUTHENTICATION HELP**

If you get authentication errors when pushing to GitHub:

### **Method 1: Personal Access Token (Recommended)**

1. **GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)**
2. **Click "Generate new token (classic)"**
3. **Scopes:** Check `repo` (full repository access)
4. **Generate token** and copy it
5. **Use this format:**

```bash
git remote add origin https://YOUR-TOKEN@github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin master
```

### **Method 2: GitHub CLI (Alternative)**

```bash
# Install GitHub CLI if not installed
# Then authenticate
gh auth login

# Add remote and push
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO-NAME.git
git push -u origin master
```

---

## ⚡ **AUTOMATED SETUP SCRIPT**

Create a file called `setup-deploy.sh` and run it:

```bash
#!/bin/bash
echo "🚀 PartsFinda Auto-Deploy Setup"
echo "Enter your GitHub username:"
read USERNAME
echo "Enter your repository name (e.g., partsfinda-marketplace):"
read REPO
echo "Enter your Personal Access Token (optional, press enter to skip):"
read -s TOKEN

if [ -z "$TOKEN" ]; then
    REMOTE_URL="https://github.com/$USERNAME/$REPO.git"
else
    REMOTE_URL="https://$TOKEN@github.com/$USERNAME/$REPO.git"
fi

echo "Adding remote: $REMOTE_URL"
git remote add origin $REMOTE_URL
echo "Pushing to GitHub..."
git push -u origin master
echo "✅ Done! Check your Netlify dashboard for auto-deploy."
```

---

## 🔍 **TROUBLESHOOTING**

### **Problem: "Remote already exists"**
```bash
git remote remove origin
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
```

### **Problem: Authentication failed**
- Use Personal Access Token method above
- Make sure token has `repo` permissions
- Check username and repository name are correct

### **Problem: Netlify not auto-deploying**
1. Check GitHub webhook in repository Settings → Webhooks
2. Verify Netlify has access to your GitHub account
3. Manually trigger deploy in Netlify dashboard

---

## 🎯 **ENVIRONMENT VARIABLES FOR PRODUCTION**

After deployment, add these to your Netlify dashboard:

**Site settings → Environment variables:**

```env
# Stripe (for live payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
STRIPE_SECRET_KEY=sk_live_your_key_here

# Supabase (for database)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Site configuration
NEXT_PUBLIC_SITE_URL=https://your-site.netlify.app
NODE_ENV=production
```

---

## ✅ **SUCCESS CHECKLIST**

After setup, verify:

- [ ] Code pushed to GitHub successfully
- [ ] Netlify site connected to GitHub repository
- [ ] Auto-deploy triggered on push
- [ ] Environment variables configured
- [ ] Site loads correctly
- [ ] All functionality working (VIN decoder, auth, admin)

---

## 🎉 **WHAT HAPPENS NEXT**

1. **Every git push** automatically deploys to Netlify
2. **Build status** visible in Netlify dashboard
3. **Deploy previews** for pull requests
4. **Custom domain** can be added in Netlify settings
5. **SSL certificate** automatically provisioned

---

## 📞 **NEED HELP?**

If you encounter issues:

1. **Check build logs** in Netlify dashboard
2. **Verify environment variables** are set correctly
3. **Test locally** with `npm run build`
4. **GitHub repository** is public and accessible

**Your PartsFinda marketplace will be live with auto-deploy in minutes! 🚀**
