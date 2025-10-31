# 🚀 Deployment Checklist

## Before You Deploy

- [ ] Test app locally with `npm run dev`
- [ ] Verify all ghosts spawn and respond to taps
- [ ] Check combo system works (3+ scares)
- [ ] Test on actual mobile device
- [ ] Verify sound effects play
- [ ] Check high score persistence
- [ ] Test location detection both at and away from target
- [ ] Verify "Enable Ghosts Anywhere" toggle works
- [ ] Test "Start Experience" button dismisses instructions

## Environment Variables

### Required for All Platforms
- [ ] `VITE_TARGET_LAT` - Target latitude (e.g., 28.4191143)
- [ ] `VITE_TARGET_LNG` - Target longitude (e.g., -81.4958061)
- [ ] `VITE_TARGET_ADDRESS` - Display name (e.g., Halloween House)

### Platform-Specific Setup

#### GitHub Pages
- [ ] Create repository on GitHub
- [ ] Push code to `main` branch
- [ ] Go to Settings → Secrets and variables → Actions
- [ ] Create 3 repository secrets with env variables
- [ ] Ensure `.github/workflows/deploy.yml` exists
- [ ] Enable GitHub Pages in Settings
- [ ] Verify deployment in Actions tab

#### Vercel
- [ ] Install Vercel CLI: `npm install -g vercel`
- [ ] Run: `vercel --prod`
- [ ] Add 3 environment variables in Vercel dashboard
- [ ] Verify deployment at vercel.com
- [ ] Configure custom domain if desired

#### Bluehost (or similar)
- [ ] Build project: `npm run build`
- [ ] Access cPanel File Manager or FTP
- [ ] Create `.env` file in root with 3 variables
- [ ] Upload entire `dist/` folder to `public_html`
- [ ] Verify site loads and works

## Post-Deployment Testing

- [ ] Test on iOS device (Safari)
- [ ] Test on Android device (Chrome)
- [ ] Verify geolocation works (show "at location" when nearby)
- [ ] Confirm ghosts spawn when enabled
- [ ] Check that tap interaction works on mobile
- [ ] Verify high score saves across sessions
- [ ] Test with slow network (throttle in DevTools)
- [ ] Check on different screen sizes

## Performance Checks

- [ ] Build size reasonable (~475KB gzipped)
- [ ] Page loads in <3 seconds
- [ ] FPS stays above 30 on mobile
- [ ] No console errors
- [ ] Memory usage stable (no leaks)

## Security Checklist

- [ ] `.env` file NOT visible in browser
- [ ] Address coordinates obscured from public repo
- [ ] HTTPS enabled (automatic on GitHub Pages/Vercel)
- [ ] No sensitive data in HTML/JS files
- [ ] Geolocation data only stored locally
- [ ] Camera access required explicitly

## Optional Enhancements Before Launch

- [ ] Add custom domain (GitHub Pages/Vercel)
- [ ] Configure analytics if desired
- [ ] Add social sharing feature
- [ ] Create promotional graphics
- [ ] Test with VR headsets if available
- [ ] Add PWA manifest for app install

## Monitoring After Launch

- [ ] Check deployment logs for errors
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Fix any reported issues
- [ ] Keep dependencies updated
- [ ] Monitor WebXR browser compatibility

## Quick Redeploy

If you need to update after deployment:

1. Make changes locally
2. Test with `npm run dev`
3. Build: `npm run build`
4. Push to main branch (auto-deploys on GitHub Pages)
5. Or run `vercel --prod` (for Vercel)
6. Or upload new `dist/` files (for Bluehost)

## Troubleshooting Deployment

**App shows blank screen:**
- Check browser console for JavaScript errors
- Verify environment variables are set
- Clear browser cache and reload
- Check that `index.html` loaded correctly

**Geolocation not working:**
- Verify `VITE_TARGET_LAT` and `VITE_TARGET_LNG` are set
- Check that HTTPS is enabled (required for geolocation)
- Test in incognito/private mode
- Grant location permission explicitly

**No ghosts appear:**
- Enable "Ghosts Anywhere" for testing
- Verify WebXR supported on device
- Check browser console for errors
- Ensure camera permission granted

**Deployment stuck:**
- Check GitHub Actions tab for error logs
- Review Vercel deployment logs
- Verify environment variables have no spaces
- Rebuild: `npm run build`

## Going Live Timeline

- **Day 1**: Deploy and test thoroughly
- **Day 2-6**: Monitor, fix issues, collect feedback
- **Day 7**: Announce on social media
- **Halloween Day**: Monitor for peak traffic

---

Ready to spook! 🎃👻
