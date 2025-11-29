# Quick Start Guide

## 🎉 Your 3D Brain Viewer is Ready!

This project is now fully set up and synced with GitHub. Here's everything you need to know to get started.

## 📁 Project Location
- **Local**: `/Users/justin/code/Brain`
- **GitHub**: https://github.com/Justin0Brien/Brain

## 🚀 Next Steps

### Step 1: Get a Brain Model (Required)

You need to download a 3D brain model before you can view anything. 

**Quickest Option** (5 minutes):
1. Visit [Sketchfab](https://sketchfab.com/search?q=brain+anatomy&type=models)
2. Filter by "Downloadable" and "Free"
3. Pick a brain model with good reviews
4. Download in GLB format
5. Save to: `models/brain.glb`

For more options and detailed instructions, see `MODELS.md`

### Step 2: Start the Application

**Option A: Use the helper script**
```bash
cd /Users/justin/code/Brain
./start.sh
```

**Option B: Manual start with Python**
```bash
cd /Users/justin/code/Brain
python3 -m http.server 8000
```

**Option C: Use VS Code Live Server**
- Right-click on `index.html`
- Select "Open with Live Server"

### Step 3: Open in Browser
Navigate to: `http://localhost:8000`

## 🎮 Using the Viewer

**Mouse Controls:**
- **Rotate**: Left click + drag
- **Pan**: Right click + drag (or Cmd + drag on Mac)
- **Zoom**: Scroll wheel

**Keyboard (for developers):**
Open browser console (F12) and try:
```javascript
// Change view
brainViewer.cameraController.setView('top');
brainViewer.cameraController.setView('front');

// Auto-rotate
brainViewer.cameraController.enableAutoRotate(true);

// Change lighting
brainViewer.lightingManager.setLightingPreset('dramatic');
brainViewer.lightingManager.setLightingPreset('medical');

// Change material
const mesh = brainViewer.brainModel.getMesh();
brainViewer.materialManager.applyMaterial(mesh, 'xray');
brainViewer.materialManager.applyMaterial(mesh, 'standard');

// Reset camera
brainViewer.cameraController.resetCamera();
```

## 🛠 Technology Stack

- **Three.js r160**: Industry-standard 3D graphics library
- **OrbitControls**: Smooth, intuitive camera controls
- **GLTFLoader**: Efficient 3D model loading
- **ES6 Modules**: Modern, maintainable code structure

## 📚 Documentation

- **README.md**: Main documentation and feature list
- **MODELS.md**: Guide to finding and converting brain models
- **ARCHITECTURE.md**: Technical architecture and development guide
- **This file**: Quick start and daily usage

## 🏗 Project Structure

```
Brain/
├── index.html              # Main entry point
├── css/
│   └── style.css          # Styling
├── js/
│   ├── main.js            # Application orchestrator
│   └── modules/
│       ├── SceneManager.js      # Three.js setup
│       ├── BrainModel.js        # Model loading
│       ├── CameraController.js  # Navigation
│       ├── LightingManager.js   # Scene lighting
│       └── MaterialManager.js   # Materials/textures
└── models/
    └── brain.glb          # Your 3D model (you add this)
```

## ✨ Current Features (Stage 1)

✅ Interactive 3D visualization
✅ Smooth orbit/pan/zoom controls
✅ Professional multi-light setup
✅ Modular, extensible architecture
✅ Shadow rendering
✅ Multiple material presets
✅ Predefined camera views

## 🔮 Planned Features

### Stage 2: Advanced Visualization
- UI control panels
- Lighting adjustment sliders
- Material switcher
- Opacity controls
- Color customization

### Stage 3: Cross-Sectional Slicing
- Single plane clipping
- Multi-plane slicing (sagittal, coronal, transverse)
- Interior structure highlighting
- Slice position controls

### Stage 4: Neuron-Level Detail
- Level of Detail (LOD) system
- Progressive model loading
- Zoom-based detail loading
- Neuron network visualization

### Stage 5: Advanced Features
- VR/AR support
- Region annotations
- Educational mode
- Screenshot/recording
- Measurement tools

## 🔧 Development

### Making Changes

1. **Edit code** in your preferred editor
2. **Refresh browser** to see changes (Cmd+R / Ctrl+R)
3. **Commit changes**:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push
   ```

### Adding a New Feature

1. Read `ARCHITECTURE.md` for patterns
2. Create new module in `js/modules/` if needed
3. Integrate with `BrainViewer` in `main.js`
4. Test in browser
5. Commit and push

### Testing Different Models

To test with different brain models:
1. Save new model as `models/brain.glb` (or different name)
2. Update path in `js/main.js`:
   ```javascript
   await this.brainModel.load('models/your-model.glb');
   ```

## 🐛 Troubleshooting

**Model not showing:**
- Check browser console (F12) for errors
- Verify `models/brain.glb` exists
- Ensure web server is running
- Try a different browser

**Controls not working:**
- Check console for JavaScript errors
- Verify Three.js and OrbitControls loaded (Network tab)
- Clear browser cache

**Performance issues:**
- Use a lower-polygon model (<100K polygons)
- Disable shadows temporarily in `SceneManager.js`
- Close other browser tabs
- Try a different browser (Chrome performs best)

**CORS errors:**
- Must use a web server (not file://)
- Use the provided `start.sh` script
- Or any HTTP server

## 🤝 Git Workflow

**Check status:**
```bash
git status
```

**Commit changes:**
```bash
git add .
git commit -m "Your message"
git push
```

**Pull latest:**
```bash
git pull
```

**View history:**
```bash
git log --oneline
```

## 📖 Learning Resources

### Three.js
- [Three.js Docs](https://threejs.org/docs/)
- [Three.js Examples](https://threejs.org/examples/)
- [Three.js Journey Course](https://threejs-journey.xyz/)

### Brain Anatomy
- [NIH Brain Basics](https://www.ninds.nih.gov/health-information/public-education/brain-basics)
- [Allen Brain Atlas](https://atlas.brain-map.org/)
- [Human Brain Project](https://www.humanbrainproject.eu/)

### WebGL
- [WebGL Fundamentals](https://webglfundamentals.org/)
- [Three.js Fundamentals](https://threejsfundamentals.org/)

## 💡 Tips

1. **Start Simple**: Get one good brain model working first
2. **Experiment**: Use the browser console to test features
3. **Read the Code**: All modules are well-documented
4. **Small Commits**: Commit often with descriptive messages
5. **Ask Questions**: Check Three.js forum for help

## 🎯 Your Next Actions

1. ⬜ Download a brain model (see MODELS.md)
2. ⬜ Place it at `models/brain.glb`
3. ⬜ Run `./start.sh`
4. ⬜ Open `http://localhost:8000`
5. ⬜ Explore the 3D brain!
6. ⬜ Experiment with console commands
7. ⬜ Plan your next feature addition

## 📞 Need Help?

- Check `README.md` for detailed documentation
- Read `ARCHITECTURE.md` for technical details
- See `MODELS.md` for model sources
- Open an issue on GitHub
- Check Three.js documentation

---

**Happy Brain Exploring! 🧠✨**

Repository: https://github.com/Justin0Brien/Brain
