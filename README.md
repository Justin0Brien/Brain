# 3D Brain Viewer

An interactive web-based 3D brain visualization application built with Three.js. This project allows users to explore a detailed 3D brain model with intuitive controls for rotation, translation, and zooming.

## Features

### Current Features (Stage 1)
- ✅ Interactive 3D brain model visualization
- ✅ Smooth camera controls (orbit, pan, zoom)
- ✅ Professional lighting setup with multiple light sources
- ✅ Material and texture management system
- ✅ Modular, extensible architecture
- ✅ Responsive design

### Planned Features (Future Stages)
- 🔄 Advanced lighting controls (adjustable intensity, color, positioning)
- 🔄 Material/texture customization (realistic, x-ray, wireframe modes)
- 🔄 Cross-sectional slicing to reveal interior structures
- 🔄 Multi-plane slicing (sagittal, coronal, transverse)
- 🔄 Neuron-level detail viewing with progressive loading
- 🔄 Region highlighting and labeling
- 🔄 Animations and guided tours
- 🔄 VR/AR support

## Technology Stack

- **Three.js** (r160) - 3D graphics library
- **OrbitControls** - Camera manipulation
- **GLTFLoader** - 3D model loading
- **Vanilla JavaScript** - ES6+ modules
- **HTML5 & CSS3** - UI and styling

## Project Structure

```
Brain/
├── index.html                  # Main HTML entry point
├── css/
│   └── style.css              # Styling and layout
├── js/
│   ├── main.js                # Application entry point
│   └── modules/
│       ├── SceneManager.js    # Scene, camera, renderer setup
│       ├── BrainModel.js      # 3D model loading and management
│       ├── CameraController.js # Camera controls and navigation
│       ├── LightingManager.js # Scene lighting configuration
│       └── MaterialManager.js # Material and texture management
├── models/
│   └── brain.glb              # 3D brain model (you need to add this)
└── README.md                  # This file
```

## Architecture

The application follows a modular architecture with clear separation of concerns:

### Core Modules

1. **SceneManager** - Manages Three.js scene setup, camera, and renderer
   - Handles window resizing
   - Provides methods to add/remove objects from scene
   - Configures rendering settings

2. **BrainModel** - Handles the 3D brain model
   - Loads GLTF/GLB models
   - Centers and scales the model
   - Provides mesh access for manipulation
   - Extension points for region highlighting and slicing

3. **CameraController** - Manages camera movement and user interaction
   - Uses OrbitControls for intuitive navigation
   - Supports predefined views (front, top, side, etc.)
   - Extension points for camera animations

4. **LightingManager** - Controls scene lighting
   - Multi-light setup (ambient, directional, hemisphere)
   - Preset lighting configurations
   - Dynamic light adjustment

5. **MaterialManager** - Manages materials and textures
   - Multiple material presets
   - Custom material creation
   - Texture loading support
   - Extension points for custom shaders

## Getting Started

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Local web server (for loading 3D models)

### Installation

1. Clone this repository:
```bash
git clone https://github.com/yourusername/Brain.git
cd Brain
```

2. **Add a 3D brain model:**

   You need to place a 3D brain model file at `models/brain.glb`. Here are some recommended sources:

   **High-Quality Free Brain Models:**
   
   - **NIH 3D Print Exchange**: https://3dprint.nih.gov/
     - Search for "brain" - multiple detailed anatomical models
     - Download as STL and convert to GLB using Blender
   
   - **Sketchfab**: https://sketchfab.com/
     - Search for "brain anatomy" or "human brain"
     - Many free downloadable models in GLB/GLTF format
     - Filter by "Downloadable" and choose Creative Commons licenses
   
   - **TurboSquid Free Models**: https://www.turbosquid.com/
     - Search for "brain free" for free models
   
   - **CGTrader**: https://www.cgtrader.com/
     - Many free anatomical brain models
   
   - **Human Brain Project**: Various neuroanatomy resources
   
   **Recommended Model Characteristics:**
   - Format: GLB or GLTF
   - Polygons: 10K-500K (balance between detail and performance)
   - Include: Cerebrum, cerebellum, brain stem, ventricles
   - Textures: Optional but recommended for realism

3. **Start a local web server:**

   Using Python 3:
   ```bash
   python3 -m http.server 8000
   ```
   
   Using Node.js (with http-server):
   ```bash
   npx http-server -p 8000
   ```
   
   Using PHP:
   ```bash
   php -S localhost:8000
   ```

4. **Open in browser:**
   Navigate to `http://localhost:8000`

### Converting Models to GLB

If you download a model in a different format (OBJ, STL, FBX), you can convert it to GLB:

**Using Blender (Free):**
1. Download Blender: https://www.blender.org/
2. File → Import → [Your Format] (OBJ, STL, FBX)
3. File → Export → glTF 2.0 (.glb)
4. In export settings, choose "GLB" format
5. Save to `models/brain.glb`

**Online Converters:**
- https://products.aspose.app/3d/conversion
- https://imagetostl.com/convert/file/glb

## Usage

### Controls
- **Rotate**: Left mouse button + drag
- **Pan**: Right mouse button + drag
- **Zoom**: Mouse wheel scroll

### Developer API

The application exposes a global `brainViewer` object for programmatic control:

```javascript
// Access in browser console
brainViewer.cameraController.setView('top');
brainViewer.lightingManager.setLightingPreset('dramatic');
brainViewer.materialManager.setMaterialPreset(brainViewer.brainModel.getMesh(), 'xray');
brainViewer.cameraController.enableAutoRotate(true);
```

## Extension Points

The codebase is designed for easy extension. Here are the main extension points:

### Adding New Lighting Configurations
Edit `js/modules/LightingManager.js` and add presets to the `setLightingPreset()` method.

### Adding Custom Materials
Edit `js/modules/MaterialManager.js` and add materials to `createDefaultMaterials()` or use `createCustomMaterial()`.

### Implementing Slicing
Create a new `SliceManager.js` module following the existing pattern. The `BrainModel` class already has a `createSlicePlane()` method stub.

### Adding Region Highlighting
Use the `BrainModel.highlightRegion()` method stub and implement by traversing the model's meshes by name.

### Neuron-Level Detail
Create a `DetailManager.js` module that implements level-of-detail (LOD) loading for progressive enhancement.

## Performance Optimization

- Models are cached after first load
- Damping is enabled on camera controls for smooth movement
- Shadow mapping is optimized with appropriate resolution
- Renderer uses anti-aliasing for better visual quality

## Browser Compatibility

- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

## Contributing

Contributions are welcome! Please feel free to submit pull requests.

## Future Development Roadmap

### Stage 2: Advanced Visualization
- Lighting controls UI panel
- Material switching UI
- Opacity controls
- Color customization

### Stage 3: Slicing & Interior Views
- Implement clipping planes
- Multi-plane slicing UI
- Interior structure highlighting
- Region labeling system

### Stage 4: Neuron-Level Detail
- LOD (Level of Detail) system
- Progressive model loading
- Neuron network visualization
- Micro-structure rendering

### Stage 5: Enhanced Interactivity
- Region selection and information
- Guided tours and animations
- Educational mode with annotations
- Screenshot and recording capabilities

## License

MIT License - feel free to use this project for educational or commercial purposes.

## Acknowledgments

- Three.js community for excellent documentation
- Medical imaging and neuroanatomy communities for providing 3D models
- Open-source contributors

## Support

For issues, questions, or contributions, please visit the GitHub repository.
