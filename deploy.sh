#!/bin/bash

# Halloween Ghost House AR - Deployment Script

echo "🎃 Building Halloween Ghost House AR Experience..."

# Clean previous build
rm -rf dist/

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    npm install
fi

# Build with Vite
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "📦 Deployment options:"
    echo ""
    echo "1️⃣  GitHub Pages:"
    echo "   - Push the 'dist' folder to gh-pages branch"
    echo "   - Enable GitHub Pages in repository settings"
    echo ""
    echo "2️⃣  Vercel:"
    echo "   - Run: vercel --prod"
    echo "   - Set environment variables in Vercel dashboard"
    echo ""
    echo "3️⃣  Bluehost:"
    echo "   - Upload 'dist' folder contents via FTP"
    echo "   - Place in public_html or appropriate directory"
    echo ""
    echo "Ready to deploy! 🚀"
else
    echo "❌ Build failed. Check the errors above."
    exit 1
fi
