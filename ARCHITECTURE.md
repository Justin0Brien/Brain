# Architecture & Development Guide

## System Architecture

### Overview
The 3D Brain Viewer follows a modular, object-oriented architecture designed for extensibility and maintainability. Each module has a single responsibility and communicates through well-defined interfaces.

```
┌─────────────────────────────────────────────────────┐
│                   main.js                           │
│              (Application Entry)                    │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │   BrainViewer       │
        │   (Orchestrator)    │
        └──────────┬──────────┘
                   │
    ┌──────────────┼──────────────────┬──────────────┐
    │              │                  │              │
┌───▼────┐  ┌─────▼──────┐  ┌───────▼───┐  ┌───────▼────────┐
│ Scene  │  │  Brain     │  │  Camera   │  │   Lighting     │
│Manager │  │  Model     │  │Controller │  │   Manager      │
└───┬────┘  └─────┬──────┘  └───────┬───┘  └───────┬────────┘
    │             │                 │              │
    │       ┌─────▼──────┐         │              │
    │       │ Material   │         │              │
    │       │ Manager    │         │              │
    │       └────────────┘         │              │
    │                              │              │
    └──────────────┬───────────────┴──────────────┘
                   │
            ┌──────▼──────┐
            │  Three.js   │
            │    Scene    │
            └─────────────┘
```

## Module Responsibilities

### 1. BrainViewer (main.js)
**Role**: Application orchestrator and lifecycle manager

**Responsibilities**:
- Initialize all subsystems
- Coordinate module interactions
- Manage application lifecycle (init, animate, cleanup)
- Handle global events (window resize)
- Provide public API for external control

**Future Extensions**:
- UI panel management
- State management
- Save/load configurations
- Analytics integration

### 2. SceneManager
**Role**: Three.js scene setup and rendering

**Responsibilities**:
- Initialize WebGL renderer
- Configure scene settings (background, fog)
- Manage camera setup
- Handle rendering pipeline
- Window resize handling

**Extension Points**:
- Post-processing effects
- Multiple camera support
- Scene presets
- Render quality settings

### 3. BrainModel
**Role**: 3D model loading and manipulation

**Responsibilities**:
- Load GLTF/GLB models
- Center and scale models
- Mesh traversal and queries
- Animation playback (if present)
- Material reference management

**Extension Points**:
- Region highlighting
- Multi-model support
- Level of Detail (LOD) system
- Clipping plane integration
- Annotation system

### 4. CameraController
**Role**: Camera navigation and user interaction

**Responsibilities**:
- OrbitControls configuration
- Camera movement smoothing
- Predefined view positions
- Zoom and pan constraints

**Extension Points**:
- Camera path animations
- First-person navigation
- Stereo/VR camera modes
- Screenshot functionality

### 5. LightingManager
**Role**: Scene illumination

**Responsibilities**:
- Multiple light setup (ambient, directional, hemisphere)
- Shadow configuration
- Lighting presets
- Dynamic light adjustment

**Extension Points**:
- Per-region lighting
- Volumetric lighting
- Light animation
- HDR environment maps

### 6. MaterialManager
**Role**: Material and texture management

**Responsibilities**:
- Material presets (realistic, x-ray, etc.)
- Custom material creation
- Texture loading
- Material property updates

**Extension Points**:
- Custom shader creation
- PBR material workflows
- Texture atlasing
- Material animation

## Data Flow

### Initialization Flow
```
User Opens Page
    ↓
main.js loaded
    ↓
BrainViewer instantiated
    ↓
Create SceneManager → Initialize Three.js
    ↓
Create LightingManager → Add lights to scene
    ↓
Create MaterialManager → Prepare materials
    ↓
Create CameraController → Setup controls
    ↓
Create BrainModel → Start loading GLB
    ↓
Model loaded → Hide loading screen
    ↓
Start animation loop
```

### Animation Loop
```
requestAnimationFrame
    ↓
Update CameraController (OrbitControls)
    ↓
Update BrainModel (animations if any)
    ↓
SceneManager.render()
    ↓
Repeat
```

## Future Architecture Enhancements

### Stage 2: UI Controls
```
Add: UIManager module
    - Control panels for lighting
    - Material switcher
    - View presets
    - Settings persistence
```

### Stage 3: Slicing System
```
Add: SliceManager module
    - Clipping plane management
    - Multi-plane slicing
    - Slice plane UI controls
    - Interior structure highlighting
```

### Stage 4: Detail Management
```
Add: DetailManager module
    - LOD system
    - Progressive loading
    - Neuron-level detail
    - Memory management
```

### Stage 5: Annotation System
```
Add: AnnotationManager module
    - 3D labels
    - Measurement tools
    - Region information
    - Educational content
```

## Code Style Guidelines

### Module Pattern
Each module should follow this structure:

```javascript
export class ModuleName {
    constructor(dependencies) {
        // Initialize properties
        this.dependency = dependencies.something;
        
        // Call setup
        this.setup();
    }
    
    setup() {
        // Primary initialization logic
    }
    
    update() {
        // Per-frame updates
    }
    
    // Public API methods
    
    // Extension point stubs (commented for future)
}
```

### Naming Conventions
- **Classes**: PascalCase (e.g., `BrainModel`)
- **Methods**: camelCase (e.g., `loadModel()`)
- **Private methods**: prefix with `_` (e.g., `_internalMethod()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ZOOM`)
- **Files**: Match class name (e.g., `BrainModel.js`)

### Documentation
- JSDoc comments for all public methods
- Inline comments for complex logic
- README sections for architecture decisions
- Extension points clearly marked

## Performance Considerations

### Current Optimizations
- Anti-aliasing enabled for quality
- Shadow map resolution: 2048x2048
- Damping on camera controls
- Device pixel ratio detection

### Future Optimizations
- **Frustum culling**: For complex scenes
- **LOD system**: Multiple detail levels
- **Instancing**: For repeated structures (neurons)
- **Texture compression**: Reduce memory usage
- **Web Workers**: For heavy computations
- **Progressive loading**: Load detail on demand

## Testing Strategy

### Manual Testing (Current)
- Visual inspection in browser
- Camera control responsiveness
- Loading error handling
- Different model sizes

### Future Automated Testing
- Unit tests for each module
- Integration tests for module interactions
- Visual regression tests
- Performance benchmarks
- Cross-browser compatibility tests

## Browser Support

### Target Browsers
- Chrome 90+ (Primary)
- Firefox 88+
- Safari 14+
- Edge 90+

### WebGL Requirements
- WebGL 2.0 preferred
- WebGL 1.0 fallback

### Known Limitations
- Mobile devices: Reduced polygon count recommended
- Safari: Shadow map limitations
- Older browsers: No ES6 module support

## Development Workflow

### Adding a New Feature

1. **Plan**: Document in this file
2. **Stub**: Add extension point in relevant module
3. **Implement**: Create new module if needed
4. **Integrate**: Connect to BrainViewer orchestrator
5. **Test**: Manual testing in browser
6. **Document**: Update README and this file
7. **Commit**: Descriptive commit message

### Module Creation Template

```javascript
/**
 * NewFeatureManager - Brief description
 * 
 * Detailed description of responsibilities.
 * List of extension points for future.
 */

export class NewFeatureManager {
    constructor(scene, dependencies) {
        this.scene = scene;
        // Initialize
    }
    
    // Public API
    
    // Extension points
}
```

## Extension Examples

### Example 1: Adding a Lighting Preset

```javascript
// In LightingManager.js
setLightingPreset(presetName) {
    const presets = {
        // ... existing presets
        custom: {
            ambient: { intensity: 0.7, color: 0xffffff },
            directional: { intensity: 1.0 }
        }
    };
    // ... apply preset
}
```

### Example 2: Adding a Camera View

```javascript
// In CameraController.js
setView(viewName) {
    const views = {
        // ... existing views
        diagonal: { 
            position: [3, 3, 3], 
            target: [0, 0, 0] 
        }
    };
    // ... apply view
}
```

### Example 3: Creating a Slicing Feature

```javascript
// New file: SliceManager.js
export class SliceManager {
    constructor(scene, brainModel) {
        this.scene = scene;
        this.brainModel = brainModel;
        this.clippingPlanes = [];
    }
    
    addSlicePlane(axis, position) {
        const plane = new THREE.Plane();
        // Configure plane
        this.clippingPlanes.push(plane);
        // Update renderer
    }
}

// In main.js
this.sliceManager = new SliceManager(
    this.sceneManager.scene,
    this.brainModel
);
```

## Debugging Tips

### Console Commands
The global `brainViewer` object provides debugging access:

```javascript
// Inspect modules
console.log(brainViewer);

// Test camera views
brainViewer.cameraController.setView('top');

// Change lighting
brainViewer.lightingManager.setLightingPreset('dramatic');

// Access scene
console.log(brainViewer.sceneManager.scene);

// Get model meshes
console.log(brainViewer.brainModel.getAllMeshes());
```

### Common Issues

**Model not loading:**
- Check browser console for errors
- Verify model path is correct
- Ensure local server is running
- Check model format (should be GLB/GLTF)

**Performance issues:**
- Reduce model polygon count
- Disable shadows temporarily
- Lower shadow map resolution
- Check device pixel ratio

**Controls not working:**
- Verify OrbitControls is loaded
- Check for console errors
- Test in different browser

## Resources

### Three.js Documentation
- Official Docs: https://threejs.org/docs/
- Examples: https://threejs.org/examples/
- Forum: https://discourse.threejs.org/

### Learning Resources
- Three.js Journey: https://threejs-journey.xyz/
- Three.js Fundamentals: https://threejsfundamentals.org/

### Related Projects
- Brain Browser (Montreal Neurological Institute)
- MRIcroGL (medical imaging)
- BrainBox (collaborative neuroanatomy)

## Contributing

When contributing, please:
1. Follow the established architecture patterns
2. Document extension points
3. Update this file for significant changes
4. Test across target browsers
5. Keep modules decoupled
6. Write descriptive commit messages

## Version History

### v1.0.0 (Current)
- Initial release
- Basic 3D visualization
- Camera controls
- Modular architecture
- Extensibility framework

### Planned Versions
- v1.1.0: UI control panels
- v1.2.0: Material presets UI
- v2.0.0: Slicing functionality
- v3.0.0: Neuron-level detail
- v4.0.0: VR/AR support
