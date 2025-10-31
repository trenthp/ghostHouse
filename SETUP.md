# 🎃 Quick Setup Guide

## Step 1: Initial Setup

```bash
# Install dependencies
npm install

# Create your local .env file
cp .env.example .env
```

## Step 2: Configure Your Target Location

Edit `.env` with your Halloween house coordinates:

```
VITE_TARGET_LAT=28.4191143
VITE_TARGET_LNG=-81.4958061
VITE_TARGET_ADDRESS=Halloween House
```

**Note**: This file is in `.gitignore` - it won't be committed to GitHub, keeping your address private.

## Step 3: Development

```bash
# Start local development server
npm run dev

# Open browser to http://localhost:3000
# Allow location and camera permissions when prompted
```

## Step 4: Test on Mobile

1. **Get your local IP**: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
2. **Open on phone**: `http://YOUR_IP:3000`
3. **Allow permissions**: Location and camera
4. **Test with demo**: Click "Enable Ghosts Anywhere" to see ghosts without being at the location

## Step 5: Build for Production

```bash
npm run build

# Build outputs to 'dist' folder
```

## Deployment Options

### Option A: GitHub Pages (Free)

1. Push code to GitHub
2. Set repository secrets:
   - `VITE_TARGET_LAT`
   - `VITE_TARGET_LNG`
   - `VITE_TARGET_ADDRESS`
3. Enable GitHub Pages in settings → Actions
4. Automatic deployment on push to main branch

### Option B: Vercel (Free)

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard.

### Option C: Bluehost (Paid Hosting)

1. Build locally: `npm run build`
2. Connect via FTP (File Manager)
3. Upload contents of `dist/` folder to `public_html`
4. Set environment variables in hosting control panel

## Testing on Device

### iOS (Safari)
- iOS 14.5+
- Safari with AR support
- Allow location and camera permissions

### Android (Chrome)
- Chrome 88+
- Device with AR Core support
- Grant all permissions

### Desktop Testing
- Install [WebXR Emulator](https://github.com/immersive-web/webxr-polyfill)
- Use Chrome DevTools geolocation emulator
- See console logs for debugging

## Features to Show Off

1. **Location Detection**: Walk to/from the house and watch ghosts appear/disappear
2. **Tap to Scare**: Click/tap ghosts to scare them away
3. **Combo System**: Scare 3+ ghosts quickly for bonus multiplier
4. **High Score**: Score persists even after closing the app
5. **Demo Mode**: "Enable Ghosts Anywhere" button for testing without location

## Troubleshooting

**Q: No ghosts showing?**
A:
- Enable "Ghosts Anywhere" button
- Check browser console for errors
- Ensure camera permissions granted
- Reload the page

**Q: Location not working?**
A:
- Grant location permission
- Ensure GPS is enabled
- Test with demo mode first
- Check that coordinates in `.env` are correct

**Q: Sound not playing?**
A:
- Check device volume
- Some browsers require user interaction first
- Try in a different browser

**Q: App looks wrong on mobile?**
A:
- Reload the page
- Check Safari/Chrome version
- Try landscape orientation
- Clear browser cache

## File Structure

```
ghostHouse/
├── dist/                  # Production build (after npm run build)
├── src/
│   ├── main.js           # App entry point
│   ├── ar/               # AR functionality
│   ├── ghosts/           # Ghost logic
│   ├── audio/            # Sound effects
│   ├── location/         # GPS/geolocation
│   ├── game/             # Game state
│   └── ui/               # UI updates
├── .env                  # Your configuration (not in git!)
├── .env.example          # Template for .env
├── index.html            # Main HTML
├── package.json          # Dependencies
└── README.md             # Full documentation
```

## Next Steps

- Test on actual devices
- Share link with friends/family
- Collect feedback for improvements
- Deploy to production

Happy Halloween! 🎃👻
