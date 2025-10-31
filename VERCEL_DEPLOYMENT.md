# 🚀 Vercel Deployment Guide

Complete step-by-step guide to deploy your Halloween Ghost House AR to Vercel with a custom domain.

## Prerequisites

- GitHub account (free)
- Vercel account (free, sign up with GitHub)
- Custom domain (optional, you get a free vercel.app domain)
- Node.js installed locally

## Step 1: Push Code to GitHub

### 1a. Create GitHub Repository

1. Go to [github.com](https://github.com)
2. Click **New repository**
3. Name it: `ghostHouse`
4. **Don't** initialize with README (you have one)
5. Click **Create repository**

### 1b. Push Your Code

Run these commands in your project directory:

```bash
git remote add origin https://github.com/YOUR_USERNAME/ghostHouse.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**Verify it worked**: Visit `https://github.com/YOUR_USERNAME/ghostHouse` - you should see your code!

## Step 2: Connect Vercel to GitHub

### 2a. Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **Sign Up**
3. Choose **Continue with GitHub**
4. Authorize Vercel to access your GitHub account
5. Complete the onboarding

### 2b. Import Your Project

1. In Vercel dashboard, click **Add New** → **Project**
2. Find your `ghostHouse` repository
3. Click **Import**
4. You'll see the import settings page

## Step 3: Configure Environment Variables

### 3a. Set Environment Variables in Vercel

On the import page, scroll to **Environment Variables** section:

Click **Add** and enter these three variables:

**Variable 1:**
- Name: `VITE_TARGET_LAT`
- Value: `28.4191143`

**Variable 2:**
- Name: `VITE_TARGET_LNG`
- Value: `-81.4958061`

**Variable 3:**
- Name: `VITE_TARGET_ADDRESS`
- Value: `Halloween House`

These are encrypted and never exposed publicly!

## Step 4: Deploy

### 4a. Start Deployment

1. Click **Deploy** button
2. Vercel will build and deploy automatically
3. Wait 1-2 minutes for build to complete
4. You'll get a success message with a URL

### 4b. First URL (Automatic)

After deployment, Vercel gives you a free URL:
```
https://ghosthouse-RANDOM.vercel.app
```

**Test it**: Open this URL on your mobile device and verify:
- ✅ App loads
- ✅ Allow location permission
- ✅ Ghosts appear (or use override)
- ✅ Can tap to scare

## Step 5: Custom Domain (Optional)

### 5a. If You Have a Domain

1. In Vercel, go to your **ghostHouse project**
2. Click **Settings** tab
3. Go to **Domains** section
4. Click **Add Domain**
5. Enter your custom domain (e.g., `halloween-ghosts.com`)
6. Follow Vercel's DNS instructions

### 5b. Update Your Domain DNS

Vercel will give you DNS records to add. The steps vary by domain registrar:

**Common registrars:**
- GoDaddy, Namecheap, Google Domains, etc.

1. Log into your domain registrar
2. Find DNS Settings
3. Add the CNAME record Vercel provides
4. Wait 24-48 hours for DNS to propagate
5. Vercel auto-configures HTTPS

**Example DNS record:**
```
Type: CNAME
Name: @
Value: cname.vercel.app
```

After DNS propagates, your site works at your custom domain!

## Step 6: Set Up Auto-Deployment

Your app now auto-deploys whenever you push to GitHub!

### How It Works:

1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically rebuilds and deploys
4. New version live in 1-2 minutes

```bash
# Example workflow:
nano src/ghosts/Ghost.js  # Make a change
git add .
git commit -m "feat: update ghost colors"
git push origin main
# → Vercel auto-deploys!
```

## Monitoring Deployments

### View Deployment Status

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your `ghostHouse` project
3. See recent deployments
4. Click any deployment to see logs
5. Check for build errors or warnings

### Common Issues

If deployment fails:
1. Click the failed deployment
2. Check the **Build Logs** tab
3. Look for error messages
4. Common issues:
   - Environment variables not set → Go back to Step 3
   - Wrong Node version → Usually auto-fixed
   - Missing dependencies → Run `npm install` locally, commit `package-lock.json`

## Step 7: Verification Checklist

After deployment:

- [ ] Visit your Vercel URL on mobile
- [ ] App loads without errors
- [ ] Location permission prompt appears
- [ ] Camera permission prompt appears
- [ ] Click "Enable Ghosts Anywhere"
- [ ] Ghosts spawn and appear
- [ ] Tap a ghost → it flees
- [ ] Check stats panel updates
- [ ] Refresh page → high score persists
- [ ] Browser console has no errors

## Update Your Local .env (Important!)

Your local `.env` is still needed for `npm run dev`:

```bash
# Your local .env file (C:\Users\bette\Documents\GitHub\ghostHouse\.env)
VITE_TARGET_LAT=28.4191143
VITE_TARGET_LNG=-81.4958061
VITE_TARGET_ADDRESS=Halloween House
```

**Important**: Never commit `.env` to GitHub. It's in `.gitignore` already ✅

## Troubleshooting

### App shows blank screen on Vercel

**Solution:**
1. Hard refresh (Ctrl+Shift+R on Windows, Cmd+Shift+R on Mac)
2. Clear browser cache
3. Check Vercel deployment logs for errors
4. Verify environment variables are set

### Can't see ghosts anywhere

**Solution:**
1. Click "Enable Ghosts Anywhere" button
2. If still nothing, check browser console for errors
3. Verify WebXR is supported on your device
4. Try in Chrome/Edge (best WebXR support)

### Domain not working

**Solution:**
1. Wait 24-48 hours for DNS propagation
2. Check Vercel dashboard → Domains section
3. Verify DNS records are correctly set
4. Try clearing your browser DNS cache

### Environment variables not working

**Solution:**
1. Go to Vercel project → Settings → Environment Variables
2. Verify all 3 variables are set
3. Delete and re-add if needed
4. Redeploy: Click deployment and select "Redeploy"

## Final URLs

After setup, you'll have:

**Automatic Vercel URL:**
```
https://ghosthouse-xyz123.vercel.app
```

**Custom Domain (if you added one):**
```
https://your-custom-domain.com
```

Both work the same way and point to the same app!

## Next Steps

1. ✅ Push to GitHub
2. ✅ Deploy to Vercel
3. ✅ Test on mobile
4. ✅ (Optional) Add custom domain
5. ✅ Share with family/friends!

## Keeping It Updated

```bash
# Make local changes
npm run dev  # Test locally

# When satisfied:
git add .
git commit -m "feat: description of change"
git push origin main

# Vercel auto-deploys! ✅
```

## Support

If you get stuck:
1. Check Vercel deployment logs
2. Check browser console (F12)
3. Review DEPLOYMENT_CHECKLIST.md
4. Check README.md troubleshooting section

---

**Status**: Ready to deploy! 🚀

Happy Halloween! 🎃👻
