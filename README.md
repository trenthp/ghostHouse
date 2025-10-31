# 🎃 Halloween Ghost House AR Experience

An immersive WebXR application that displays ghosts flying around a specific house location on Halloween. View ghosts through your phone's camera in AR and interact with them!

## Features

- 🌍 **Geolocation-based AR**: Ghosts appear when you're near the target house (50 meters)
- 👻 **3D Ghost Models**: Custom-designed 3D ghosts with glowing eyes and animations
- 📱 **Mobile WebXR**: Works on iOS and Android devices with AR support
- 🎮 **Interactive Gameplay**:
  - Tap to scare ghosts and earn points
  - Combo system for consecutive scares
  - High score tracking
  - Ghost spawning mechanics
- 🔊 **Sound Effects**: Audio feedback for interactions
- 🎨 **Halloween Theme**: Spooky visuals and effects
- 🔐 **Secure Location**: Address obscured in public repository using environment variables

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/ghostHouse.git
cd ghostHouse

# Install dependencies
npm install

# Create .env file from template
cp .env.example .env

# Edit .env with your target coordinates
# VITE_TARGET_LAT=28.4191143
# VITE_TARGET_LNG=-81.4958061
# VITE_TARGET_ADDRESS=Halloween House
```

### Development

```bash
# Start dev server (runs on http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Deployment

### GitHub Pages

1. Build the project: `npm run build`
2. Deploy the `dist` folder to gh-pages branch
3. Enable GitHub Pages in repository settings

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard:
- `VITE_TARGET_LAT`
- `VITE_TARGET_LNG`
- `VITE_TARGET_ADDRESS`

### Bluehost

1. Build: `npm run build`
2. Upload `dist` folder contents via FTP to `public_html`
3. Set environment variables in hosting control panel

## How to Play

1. **Open the app** on a mobile device with WebXR support
2. **Allow location access** when prompted
3. **Navigate to the target house** (or tap "Enable Ghosts Anywhere" for demo)
4. **Point your camera around** to see ghosts flying in AR
5. **Tap ghosts** to scare them away and earn points
6. **Build combos** for consecutive scares

## Game Mechanics

### Scoring
- **Scares**: +1 point for each ghost scared
- **Combo**: Scare multiple ghosts within 5 seconds for multiplier
- **High Score**: Automatically saved to device

### Ghost Behavior
- **Flying**: Ghosts wander randomly in the AR space
- **Spawning**: New ghosts spawn as old ones flee
- **Fleeing**: Scared ghosts flee rapidly from player
- **Despawning**: Ghosts disappear when too far away

## Technical Stack

- **Three.js**: 3D graphics rendering
- **WebXR API**: AR camera access
- **Vite**: Build tool and dev server
- **Web Audio API**: Sound effects
- **Geolocation API**: GPS tracking
- **LocalStorage**: High score persistence

## Browser Support

- **iOS**: Safari 14.5+ (with AR support)
- **Android**: Chrome 88+, Edge 88+, Samsung Internet 14+
- **Desktop**: Chrome/Edge with WebXR emulator extension

## Project Structure

```
ghostHouse/
├── src/
│   ├── main.js              # Application entry point
│   ├── ar/
│   │   └── ARManager.js     # WebXR session management
│   ├── ghosts/
│   │   ├── Ghost.js         # Individual ghost class
│   │   └── GhostManager.js  # Ghost spawning and control
│   ├── audio/
│   │   └── AudioManager.js  # Sound effects
│   ├── location/
│   │   └── LocationManager.js # Geolocation tracking
│   ├── game/
│   │   └── GameManager.js   # Game state and scoring
│   └── ui/
│       └── UIManager.js     # UI updates and display
├── index.html               # Main HTML file
├── .env.example            # Environment template
├── .env                    # Local configuration (not in git)
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
├── vercel.json             # Vercel deployment config
└── README.md               # This file
```

## Environment Variables

Create a `.env` file in the root directory:

```
VITE_TARGET_LAT=28.4191143
VITE_TARGET_LNG=-81.4958061
VITE_TARGET_ADDRESS=Halloween House
```

**Note**: The `.env` file is in `.gitignore` to protect sensitive location data.

## Privacy & Security

- Location data is only used locally for distance calculation
- No data is sent to external servers
- Address is obscured through environment variables
- Geolocation requires user permission
- All processing happens on the client device

## Troubleshooting

### No ghosts appearing?
- Ensure WebXR is enabled on your device
- Check that you're near the target address (50m radius)
- Try tapping "Enable Ghosts Anywhere" button for demo mode
- Check browser console for errors

### AR camera not working?
- Grant camera permissions to the website
- Ensure your device has AR capabilities
- Try reloading the page
- Check if your browser version supports WebXR

### Sound not working?
- Check device volume settings
- Ensure your browser hasn't muted audio
- Some browsers require user interaction before audio plays

### Location not detecting?
- Enable location services on your device
- Grant location permission to the website
- Ensure GPS is enabled
- Try opening the page in a private/incognito window

## Browser Emulation

For testing without a phone:
1. Install [WebXR Emulator extension](https://github.com/immersive-web/webxr-polyfill)
2. Use Chrome DevTools geolocation emulator
3. See console messages for debugging

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT License - feel free to use for Halloween events!

## Credits

Created with ❤️ for Halloween 2024

---

**Happy Halloween! 🎃👻**
