# Brain Model Sources

This document provides detailed information about where to find high-quality 3D brain models for this project.

## Quick Start

For immediate testing, here are the fastest options:

### 1. Sketchfab (Easiest - Ready-to-use GLB)
**Link**: https://sketchfab.com/3d-models/brain-94f8c106be084c15ac20229ee87b8c68
- Pre-converted GLB format
- Free to download (CC license)
- Good anatomical detail
- Click "Download 3D Model" → Select "glTF" format

### 2. NIH 3D Print Exchange (Most Anatomically Accurate)
**Link**: https://3dprint.nih.gov/discover/3dpx-013482
- "Human Brain" model by NIH
- Extremely detailed and scientifically accurate
- Download as STL → Convert to GLB using Blender (instructions below)

### 3. Human Connectome Project
**Link**: https://www.humanconnectome.org/software/connectome-workbench
- Research-grade brain models
- Requires Workbench software to export
- Most detailed cortical surface models available

## Detailed Model Options

### Option A: Simple Anatomical Brain

**Source**: Sketchfab
**Search Query**: "human brain anatomy downloadable"
**Recommended Models**:
1. "Realistic Human Brain" by Nicoleta
2. "Brain Anatomy" by Smashbox Studios
3. "Human Brain Low Poly" by Various Artists

**Pros**: 
- Ready to use (GLB format)
- Good for general visualization
- Free downloads available

**Cons**: 
- May lack fine anatomical detail
- Varying levels of accuracy

### Option B: Scientific/Medical Grade

**Source**: NIH 3D Print Exchange
**Link**: https://3dprint.nih.gov/
**Search**: "brain"

**Available Models**:
1. **Complete Brain with Ventricles**
   - Most comprehensive
   - Shows internal structures
   - ~200K polygons

2. **Cerebrum Only**
   - Focuses on cortex
   - High detail on gyri and sulci
   - ~150K polygons

3. **Brain Regions Separated**
   - Individual brain regions
   - Good for educational purposes
   - Can highlight specific areas

**Pros**:
- Scientifically accurate
- Free for any use
- High detail

**Cons**:
- Requires conversion from STL to GLB
- Larger file sizes

### Option C: Research-Grade (Advanced)

**Sources**:
1. **Allen Brain Atlas**
   - https://atlas.brain-map.org/
   - Download mesh data
   - Requires processing

2. **BrainVisa/Anatomist**
   - http://brainvisa.info/
   - Surface mesh extraction
   - Requires software installation

3. **FreeSurfer**
   - https://surfer.nmr.mgh.harvard.edu/
   - Generate from MRI data
   - Highly customizable

**Pros**:
- Highest scientific accuracy
- Can be customized
- Based on real brain scans

**Cons**:
- Requires significant processing
- Steeper learning curve
- Large file sizes

## Format Recommendations

### Preferred Format: GLB (GL Transmission Format Binary)
- Single file containing model, textures, materials
- Optimized for web
- Best performance in Three.js
- Recommended polygon count: 50K-200K for balance

### Alternative Format: GLTF (GL Transmission Format JSON)
- Separate files for model and textures
- More flexible for editing
- Can be compressed to GLB

### Formats to Avoid (Need Conversion)
- **OBJ**: Old format, no animation support
- **STL**: No color/texture, designed for 3D printing
- **FBX**: Autodesk proprietary, conversion issues

## Converting Models to GLB

### Using Blender (Recommended - Free)

1. **Download Blender**: https://www.blender.org/download/

2. **Import your model**:
   ```
   File → Import → [Select format: STL/OBJ/FBX]
   Navigate to your brain model file
   Click "Import"
   ```

3. **Optimize the model** (optional but recommended):
   - Select the model (click on it)
   - Tab into Edit Mode
   - Mesh → Clean Up → Merge by Distance (removes duplicate vertices)
   - Modifiers → Add Modifier → Decimate (if too many polygons)
     - Set Ratio to 0.5 for 50% reduction
     - Apply modifier

4. **Export as GLB**:
   ```
   File → Export → glTF 2.0 (.glb/.gltf)
   Format: Select "glTF Binary (.glb)"
   Include: 
     ☑ Selected Objects (if you selected your model)
     ☑ Apply Modifiers
     ☑ Compression
   Output: Navigate to your Brain/models/ folder
   Filename: brain.glb
   Export glTF 2.0
   ```

### Using Online Converters (Quick but Less Control)

1. **Aspose 3D Converter**
   - Link: https://products.aspose.app/3d/conversion
   - Upload STL/OBJ → Convert to GLB
   - Free, no registration

2. **AnyConv**
   - Link: https://anyconv.com/3d-converter/
   - Supports many formats
   - Fast conversion

3. **ImageToSTL**
   - Link: https://imagetostl.com/convert/file/glb
   - Simple interface
   - Good for single files

## Recommended Starting Model

For immediate testing and development, I recommend:

**"Brain" by Alexey Samokhin on Sketchfab**
- Direct GLB download
- Good anatomical accuracy
- Optimized polygon count (~80K)
- Free under CC BY license

**How to get it**:
1. Visit: https://sketchfab.com/search?q=brain+anatomy&type=models
2. Filter by "Downloadable" and "Free"
3. Choose a model with good reviews
4. Click "Download 3D Model"
5. Select "glTF" format (either GLB or GLTF works)
6. Save to `Brain/models/brain.glb`

## Testing Without a Model

The application will show an error message if no model is found. For initial testing without a model, you can temporarily modify `js/modules/BrainModel.js` to add a placeholder:

```javascript
// In BrainModel.js, modify the load() method to add a fallback:
// Create a simple sphere as placeholder
const geometry = new THREE.SphereGeometry(1, 32, 32);
const material = new THREE.MeshStandardMaterial({ color: 0xffccaa });
const sphere = new THREE.Mesh(geometry, material);
this.model = new THREE.Group();
this.model.add(sphere);
this.scene.add(this.model);
```

## Model Quality Checklist

When selecting a brain model, ensure it has:

- ☑ **Anatomical accuracy**: Major structures are correctly proportioned
- ☑ **Appropriate detail**: 50K-200K polygons for web performance
- ☑ **Clean mesh**: No holes or inverted faces
- ☑ **Proper scale**: Should be approximately 2-3 units in size
- ☑ **Optional textures**: Color or normal maps enhance realism
- ☑ **License**: Verify usage rights (most medical/scientific models are free)

## Future Enhancement: Multiple Models

For future stages, consider maintaining multiple models:

1. **Low-detail model** (10K polygons): Initial view and mobile
2. **Medium-detail model** (100K polygons): Desktop default
3. **High-detail model** (500K+ polygons): Zoomed-in views
4. **Micro-structure model**: Individual neurons (loaded on demand)

Implement progressive loading based on zoom level for optimal performance.
