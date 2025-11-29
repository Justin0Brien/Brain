#!/bin/bash

# 3D Brain Viewer - Quick Setup Script
# This script helps you get started with the Brain Viewer project

echo "================================================"
echo "  3D Brain Viewer - Setup"
echo "================================================"
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the Brain project directory"
    exit 1
fi

echo "✅ Found Brain project directory"
echo ""

# Check if models directory exists
if [ ! -d "models" ]; then
    echo "Creating models directory..."
    mkdir models
fi

# Check if brain model exists
if [ ! -f "models/brain.glb" ]; then
    echo "⚠️  No brain model found at models/brain.glb"
    echo ""
    echo "You need to download a 3D brain model. Here are your options:"
    echo ""
    echo "Option 1 (Easiest): Download from Sketchfab"
    echo "  1. Visit: https://sketchfab.com/search?q=brain+anatomy&type=models"
    echo "  2. Filter by 'Downloadable' and 'Free'"
    echo "  3. Download a model in GLB/GLTF format"
    echo "  4. Save as models/brain.glb"
    echo ""
    echo "Option 2 (Most Accurate): Download from NIH 3D Print Exchange"
    echo "  1. Visit: https://3dprint.nih.gov/"
    echo "  2. Search for 'brain'"
    echo "  3. Download STL file"
    echo "  4. Convert to GLB using Blender (see MODELS.md for instructions)"
    echo ""
    echo "For detailed instructions, see MODELS.md"
    echo ""
else
    echo "✅ Found brain model at models/brain.glb"
fi

echo ""
echo "================================================"
echo "  Starting Local Web Server"
echo "================================================"
echo ""

# Try to start a web server
if command -v python3 &> /dev/null; then
    echo "Starting Python web server on http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    echo "Once the server is running, open your browser to:"
    echo "  👉 http://localhost:8000"
    echo ""
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    echo "Starting Python web server on http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    echo "Once the server is running, open your browser to:"
    echo "  👉 http://localhost:8000"
    echo ""
    python -m SimpleHTTPServer 8000
elif command -v php &> /dev/null; then
    echo "Starting PHP web server on http://localhost:8000"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    echo "Once the server is running, open your browser to:"
    echo "  👉 http://localhost:8000"
    echo ""
    php -S localhost:8000
else
    echo "⚠️  No web server found (Python or PHP required)"
    echo ""
    echo "Please install Python or use one of these alternatives:"
    echo ""
    echo "Using Node.js:"
    echo "  npx http-server -p 8000"
    echo ""
    echo "Using VS Code:"
    echo "  Install 'Live Server' extension and click 'Go Live'"
    echo ""
    echo "Manual Python installation:"
    echo "  brew install python3  (macOS with Homebrew)"
    echo ""
fi
