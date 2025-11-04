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

### iOS Requirements
- **Device**: iPhone or iPad
- **OS**: iOS 14 or later (iOS 15+ recommended)
- **Browser**: Safari only (WebXR for AR)
- **Connection**: HTTPS required (local HTTPS works too)
- **Permissions**: Camera and Location access required

### Android
- **Chrome**: 88+
- **Edge**: 88+
- **Samsung Internet**: 14+

### Desktop
- Chrome/Edge with WebXR emulator extension
- Useful for testing without a phone

## iOS-Specific Features

The app includes iOS-specific enhancements:
- **Device Detection**: Automatically detects iOS and Safari
- **HTTPS Enforcement**: Warns if not using secure connection
- **iOS Version Checking**: Verifies iOS 14+ for WebXR support
- **Contextual Help**: iOS-specific permission instructions
- **ARKit Integration**: Leverages native ARKit on iOS

### iOS Troubleshooting

**AR Not Working on iOS?**
1. Update to iOS 14 or later
2. Use Safari browser (other browsers don't support WebXR)
3. Ensure site is loaded via HTTPS
4. Check Settings > Safari > Websites for camera/location permissions
5. Grant both camera AND location permissions
6. Reload the page after granting permissions

**Performance Tips**
- Close other apps before using AR
- Ensure good lighting for better AR tracking
- Update iOS to the latest version

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

Created with ❤️ for Halloween 2025

---

**Happy Halloween! 🎃👻**
