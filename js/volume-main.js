/**
 * VolumetricBrainViewer - Main application for MRI volumetric visualization
 * 
 * Features:
 * - Load and display NIfTI brain images
 * - Interactive slice navigation (axial, coronal, sagittal)
 * - 3D surface extraction using marching cubes
 * - Intensity windowing controls
 * - Automatic download from third-party sources if local data missing
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { NiftiLoader } from './modules/NiftiLoader.js';
import { VolumeRenderer } from './modules/VolumeRenderer.js';
import { ModelDownloader } from './modules/ModelDownloader.js';

class VolumetricBrainViewer {
    constructor() {
        this.container = document.getElementById('viewer-container');
        this.loadingDiv = document.getElementById('loading');
        this.loadingText = document.getElementById('loading-text');
        this.downloader = new ModelDownloader();
        
        // Three.js components
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        
        // Volume data
        this.niftiLoader = null;
        this.volumeRenderer = null;
        
        // Axis helper
        this.axisGroup = null;
        
        this.init();
    }
    
    async init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupControls();
        this.setupLighting();
        this.createAxisHelper();
        
        // Load the brain volume
        await this.loadVolume();
        
        // Setup UI after volume is loaded
        this.setupUI();
        
        // Hide loading
        this.loadingDiv.classList.add('hidden');
        
        // Start animation
        this.animate();
        
        // Handle resize
        window.addEventListener('resize', () => this.onResize());
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a15);
        this.scene.fog = new THREE.Fog(0x0a0a15, 15, 30);
    }
    
    setupCamera() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
        this.camera.position.set(0, 0, 8);
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        this.controls.target.set(0, 0, 0);
    }
    
    setupLighting() {
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);
        
        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 5, 5);
        this.scene.add(mainLight);
        
        // Fill light
        const fillLight = new THREE.DirectionalLight(0x8899ff, 0.3);
        fillLight.position.set(-3, 2, -3);
        this.scene.add(fillLight);
        
        // Rim light
        const rimLight = new THREE.DirectionalLight(0xffaa88, 0.3);
        rimLight.position.set(0, -3, 5);
        this.scene.add(rimLight);
    }
    
    createAxisHelper() {
        this.axisGroup = new THREE.Group();
        this.axisGroup.name = 'axisHelper';
        
        const axisLength = 3;
        const colors = {
            x: 0xff4444, // Red
            y: 0x44ff44, // Green  
            z: 0x4444ff  // Blue
        };
        
        // X axis (Red - Left/Right)
        const xMat = new THREE.LineBasicMaterial({ color: colors.x });
        const xGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-axisLength, 0, 0),
            new THREE.Vector3(axisLength, 0, 0)
        ]);
        const xAxis = new THREE.Line(xGeom, xMat);
        this.axisGroup.add(xAxis);
        
        // Y axis (Green - Anterior/Posterior)
        const yMat = new THREE.LineBasicMaterial({ color: colors.y });
        const yGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -axisLength, 0),
            new THREE.Vector3(0, axisLength, 0)
        ]);
        const yAxis = new THREE.Line(yGeom, yMat);
        this.axisGroup.add(yAxis);
        
        // Z axis (Blue - Superior/Inferior)
        const zMat = new THREE.LineBasicMaterial({ color: colors.z });
        const zGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -axisLength),
            new THREE.Vector3(0, 0, axisLength)
        ]);
        const zAxis = new THREE.Line(zGeom, zMat);
        this.axisGroup.add(zAxis);
        
        // Add axis labels
        this.addAxisLabels();
        
        this.scene.add(this.axisGroup);
    }
    
    addAxisLabels() {
        // Create simple sprite labels for axes
        const createLabel = (text, position, color) => {
            const canvas = document.createElement('canvas');
            canvas.width = 64;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = color;
            ctx.font = 'bold 48px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 32, 32);
            
            const texture = new THREE.CanvasTexture(canvas);
            const material = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(material);
            sprite.position.copy(position);
            sprite.scale.set(0.5, 0.5, 1);
            return sprite;
        };
        
        this.axisGroup.add(createLabel('R', new THREE.Vector3(3.3, 0, 0), '#ff4444'));
        this.axisGroup.add(createLabel('L', new THREE.Vector3(-3.3, 0, 0), '#ff4444'));
        this.axisGroup.add(createLabel('A', new THREE.Vector3(0, 3.3, 0), '#44ff44'));
        this.axisGroup.add(createLabel('P', new THREE.Vector3(0, -3.3, 0), '#44ff44'));
        this.axisGroup.add(createLabel('S', new THREE.Vector3(0, 0, 3.3), '#4444ff'));
        this.axisGroup.add(createLabel('I', new THREE.Vector3(0, 0, -3.3), '#4444ff'));
    }
    
    async loadVolume() {
        const localPath = 'models/mni_icbm152_nlin_sym_09c/mni_icbm152_t1_tal_nlin_sym_09c.nii.gz';
        
        try {
            this.updateLoadingText('Checking for brain volume data...');
            
            // Try to find a valid volume source
            const volumeSource = await this.downloader.getNiftiVolume(localPath);
            
            if (!volumeSource.url) {
                // No volume available - show instructions
                this.showDownloadInstructions();
                return;
            }
            
            this.updateLoadingText('Loading NIfTI brain volume...');
            console.log(`Loading volume from: ${volumeSource.url}`);
            
            this.niftiLoader = new NiftiLoader();
            await this.niftiLoader.load(volumeSource.url);
            
            this.updateLoadingText('Creating volume renderer...');
            this.volumeRenderer = new VolumeRenderer(this.scene, this.niftiLoader);
            
            // Update volume info display
            this.updateVolumeInfo();
            
            // Update slice controls with actual dimensions
            this.updateSliceControlRanges();
            
            // Generate initial surface (at default threshold)
            this.updateLoadingText('Generating 3D brain surface...');
            await this.volumeRenderer.generateSurface(0.3, (progress) => {
                this.updateLoadingText(`Generating surface: ${Math.floor(progress * 100)}%`);
            });
            
            console.log('Volume loaded successfully');
            
        } catch (error) {
            console.error('Failed to load volume:', error);
            this.showDownloadInstructions(error.message);
        }
    }
    
    /**
     * Show download instructions when no volume data is available
     */
    showDownloadInstructions(errorMsg = null) {
        this.loadingDiv.innerHTML = `
            <div class="download-instructions">
                <h2>🧠 MRI Volume Data Required</h2>
                ${errorMsg ? `<p class="error-msg">Error: ${errorMsg}</p>` : ''}
                <p>The volumetric brain viewer requires NIfTI format MRI data.</p>
                <h3>Option 1: Download MNI Template (Recommended)</h3>
                <ol>
                    <li>Visit the <a href="https://www.bic.mni.mcgill.ca/ServicesAtlases/ICBM152NLin2009" target="_blank">MNI ICBM 152 Atlas</a></li>
                    <li>Download "ICBM 2009c Nonlinear Symmetric" → NIfTI format (~55MB)</li>
                    <li>Extract the ZIP file to: <code>models/mni_icbm152_nlin_sym_09c/</code></li>
                    <li><button onclick="location.reload()" class="btn-primary">Refresh Page</button></li>
                </ol>
                <h3>Option 2: Use Any NIfTI Brain Scan</h3>
                <p>Place any .nii or .nii.gz file in the models folder and update the path in the code.</p>
                <h3>Free Brain Data Sources:</h3>
                <ul>
                    <li><a href="https://openneuro.org/" target="_blank">OpenNeuro</a> - Open MRI datasets</li>
                    <li><a href="https://brain-development.org/ixi-dataset/" target="_blank">IXI Dataset</a> - Normal brain MRI</li>
                    <li><a href="https://www.oasis-brains.org/" target="_blank">OASIS</a> - Aging brain studies</li>
                </ul>
                <p><a href="index.html" class="nav-link">← Back to Surface Model Viewer</a></p>
            </div>
        `;
        
        // Add styles for the instructions
        const style = document.createElement('style');
        style.textContent = `
            .download-instructions {
                max-width: 600px;
                padding: 30px;
                background: rgba(30, 35, 50, 0.95);
                border-radius: 12px;
                text-align: left;
            }
            .download-instructions h2 {
                color: #6af;
                margin-bottom: 15px;
            }
            .download-instructions h3 {
                color: #aaa;
                margin: 20px 0 10px;
                font-size: 14px;
            }
            .download-instructions p {
                color: #888;
                line-height: 1.6;
            }
            .download-instructions .error-msg {
                color: #f66;
                background: rgba(255,100,100,0.1);
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 15px;
            }
            .download-instructions ol, .download-instructions ul {
                color: #ccc;
                margin-left: 20px;
                line-height: 1.8;
            }
            .download-instructions a {
                color: #6af;
            }
            .download-instructions code {
                background: #1a1a2a;
                padding: 2px 6px;
                border-radius: 3px;
                font-family: monospace;
            }
            .download-instructions .btn-primary {
                margin-top: 10px;
            }
        `;
        document.head.appendChild(style);
    }
    
    updateLoadingText(text) {
        if (this.loadingText) {
            this.loadingText.textContent = text;
        }
    }
    
    updateVolumeInfo() {
        const infoDiv = document.getElementById('volume-info');
        if (!infoDiv || !this.niftiLoader) return;
        
        const dims = this.niftiLoader.dimensions;
        const voxSize = this.niftiLoader.voxelSize;
        const physSize = this.niftiLoader.getPhysicalSize();
        
        infoDiv.innerHTML = `
            <p><strong>Dimensions:</strong> ${dims.x} × ${dims.y} × ${dims.z}</p>
            <p><strong>Voxel Size:</strong> ${voxSize.x.toFixed(1)} × ${voxSize.y.toFixed(1)} × ${voxSize.z.toFixed(1)} mm</p>
            <p><strong>Physical Size:</strong> ${physSize.x.toFixed(0)} × ${physSize.y.toFixed(0)} × ${physSize.z.toFixed(0)} mm</p>
            <p><strong>Total Voxels:</strong> ${(dims.x * dims.y * dims.z / 1e6).toFixed(1)}M</p>
        `;
    }
    
    updateSliceControlRanges() {
        if (!this.volumeRenderer) return;
        
        const dims = this.volumeRenderer.getSliceDimensions();
        
        const axialSlider = document.getElementById('slice-axial');
        const coronalSlider = document.getElementById('slice-coronal');
        const sagittalSlider = document.getElementById('slice-sagittal');
        
        if (axialSlider) {
            axialSlider.max = dims.axial - 1;
            axialSlider.value = Math.floor(dims.axial / 2);
        }
        if (coronalSlider) {
            coronalSlider.max = dims.coronal - 1;
            coronalSlider.value = Math.floor(dims.coronal / 2);
        }
        if (sagittalSlider) {
            sagittalSlider.max = dims.sagittal - 1;
            sagittalSlider.value = Math.floor(dims.sagittal / 2);
        }
    }
    
    setupUI() {
        // Collapsible sections
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const targetId = header.dataset.target;
                const content = document.getElementById(targetId);
                if (content) {
                    content.classList.toggle('collapsed');
                    header.textContent = header.textContent.replace(/^[▼▶]/, 
                        content.classList.contains('collapsed') ? '▶' : '▼');
                }
            });
        });
        
        // Slice controls
        this.setupSliceControls();
        
        // Visibility controls
        this.setupVisibilityControls();
        
        // Windowing controls
        this.setupWindowingControls();
        
        // Surface controls
        this.setupSurfaceControls();
        
        // Camera controls
        this.setupCameraControls();
    }
    
    setupSliceControls() {
        const planes = ['axial', 'coronal', 'sagittal'];
        
        planes.forEach(plane => {
            const slider = document.getElementById(`slice-${plane}`);
            const valueDisplay = document.getElementById(`slice-${plane}-value`);
            
            if (slider) {
                slider.addEventListener('input', () => {
                    const index = parseInt(slider.value);
                    if (this.volumeRenderer) {
                        this.volumeRenderer.setSliceIndex(plane, index);
                    }
                    if (valueDisplay) {
                        valueDisplay.textContent = index;
                    }
                });
            }
        });
        
        // Reset slices button
        const resetBtn = document.getElementById('reset-slices');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (!this.volumeRenderer) return;
                const dims = this.volumeRenderer.getSliceDimensions();
                
                planes.forEach(plane => {
                    const slider = document.getElementById(`slice-${plane}`);
                    const valueDisplay = document.getElementById(`slice-${plane}-value`);
                    const center = Math.floor(dims[plane] / 2);
                    
                    if (slider) {
                        slider.value = center;
                        this.volumeRenderer.setSliceIndex(plane, center);
                    }
                    if (valueDisplay) {
                        valueDisplay.textContent = center;
                    }
                });
            });
        }
    }
    
    setupVisibilityControls() {
        const controls = [
            { id: 'show-axial', component: 'axial' },
            { id: 'show-coronal', component: 'coronal' },
            { id: 'show-sagittal', component: 'sagittal' },
            { id: 'show-surface', component: 'surface' }
        ];
        
        controls.forEach(({ id, component }) => {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.addEventListener('change', () => {
                    if (this.volumeRenderer) {
                        this.volumeRenderer.setVisibility(component, checkbox.checked);
                    }
                });
            }
        });
        
        // Axes visibility
        const axesCheckbox = document.getElementById('show-axes');
        if (axesCheckbox) {
            axesCheckbox.addEventListener('change', () => {
                if (this.axisGroup) {
                    this.axisGroup.visible = axesCheckbox.checked;
                }
            });
        }
    }
    
    setupWindowingControls() {
        const levelSlider = document.getElementById('window-level');
        const widthSlider = document.getElementById('window-width');
        const levelValue = document.getElementById('window-level-value');
        const widthValue = document.getElementById('window-width-value');
        const presetSelect = document.getElementById('window-preset');
        
        const updateWindowing = () => {
            if (!this.volumeRenderer) return;
            const level = parseInt(levelSlider.value) / 100;
            const width = parseInt(widthSlider.value) / 100;
            this.volumeRenderer.setWindowing(level, width);
            
            if (levelValue) levelValue.textContent = `${levelSlider.value}%`;
            if (widthValue) widthValue.textContent = `${widthSlider.value}%`;
        };
        
        if (levelSlider) levelSlider.addEventListener('input', updateWindowing);
        if (widthSlider) widthSlider.addEventListener('input', updateWindowing);
        
        // Window presets
        const presets = {
            default: { level: 50, width: 100 },
            brain: { level: 40, width: 80 },
            bone: { level: 70, width: 150 },
            soft: { level: 35, width: 60 }
        };
        
        if (presetSelect) {
            presetSelect.addEventListener('change', () => {
                const preset = presets[presetSelect.value];
                if (preset) {
                    if (levelSlider) levelSlider.value = preset.level;
                    if (widthSlider) widthSlider.value = preset.width;
                    updateWindowing();
                }
            });
        }
    }
    
    setupSurfaceControls() {
        const thresholdSlider = document.getElementById('surface-threshold');
        const thresholdValue = document.getElementById('surface-threshold-value');
        const colorPicker = document.getElementById('surface-color');
        const opacitySlider = document.getElementById('surface-opacity');
        const opacityValue = document.getElementById('surface-opacity-value');
        const generateBtn = document.getElementById('generate-surface');
        const progressBar = document.getElementById('surface-progress');
        
        // Update threshold display
        if (thresholdSlider && thresholdValue) {
            thresholdSlider.addEventListener('input', () => {
                thresholdValue.textContent = `${thresholdSlider.value}%`;
            });
        }
        
        // Update opacity display and apply
        if (opacitySlider && opacityValue) {
            opacitySlider.addEventListener('input', () => {
                opacityValue.textContent = `${opacitySlider.value}%`;
                if (this.volumeRenderer && this.volumeRenderer.surfaceMesh) {
                    this.volumeRenderer.surfaceMesh.material.opacity = parseInt(opacitySlider.value) / 100;
                }
            });
        }
        
        // Update color
        if (colorPicker) {
            colorPicker.addEventListener('input', () => {
                if (this.volumeRenderer && this.volumeRenderer.surfaceMesh) {
                    this.volumeRenderer.surfaceMesh.material.color.set(colorPicker.value);
                }
            });
        }
        
        // Generate surface button
        if (generateBtn) {
            generateBtn.addEventListener('click', async () => {
                if (!this.volumeRenderer) return;
                
                generateBtn.disabled = true;
                if (progressBar) {
                    progressBar.classList.remove('hidden');
                    progressBar.querySelector('.progress-fill').style.width = '0%';
                    progressBar.querySelector('.progress-text').textContent = '0%';
                }
                
                const threshold = parseInt(thresholdSlider.value) / 100;
                
                try {
                    await this.volumeRenderer.generateSurface(threshold, (progress) => {
                        if (progressBar) {
                            const percent = Math.floor(progress * 100);
                            progressBar.querySelector('.progress-fill').style.width = `${percent}%`;
                            progressBar.querySelector('.progress-text').textContent = `${percent}%`;
                        }
                    });
                    
                    // Apply current color and opacity
                    if (this.volumeRenderer.surfaceMesh) {
                        if (colorPicker) {
                            this.volumeRenderer.surfaceMesh.material.color.set(colorPicker.value);
                        }
                        if (opacitySlider) {
                            this.volumeRenderer.surfaceMesh.material.opacity = parseInt(opacitySlider.value) / 100;
                        }
                    }
                } catch (error) {
                    console.error('Surface generation failed:', error);
                }
                
                generateBtn.disabled = false;
                if (progressBar) {
                    setTimeout(() => progressBar.classList.add('hidden'), 1000);
                }
            });
        }
    }
    
    setupCameraControls() {
        const distance = 8;
        
        const views = {
            'view-front': { pos: [0, 0, distance], up: [0, 1, 0] },
            'view-back': { pos: [0, 0, -distance], up: [0, 1, 0] },
            'view-left': { pos: [-distance, 0, 0], up: [0, 1, 0] },
            'view-right': { pos: [distance, 0, 0], up: [0, 1, 0] },
            'view-top': { pos: [0, distance, 0], up: [0, 0, -1] },
            'view-bottom': { pos: [0, -distance, 0], up: [0, 0, 1] }
        };
        
        Object.entries(views).forEach(([id, { pos, up }]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.camera.position.set(...pos);
                    this.camera.up.set(...up);
                    this.camera.lookAt(0, 0, 0);
                    this.controls.update();
                });
            }
        });
        
        // Auto rotate
        const autoRotateCheckbox = document.getElementById('auto-rotate');
        if (autoRotateCheckbox) {
            autoRotateCheckbox.addEventListener('change', () => {
                this.controls.autoRotate = autoRotateCheckbox.checked;
                this.controls.autoRotateSpeed = 1.0;
            });
        }
        
        // Reset camera
        const resetBtn = document.getElementById('reset-camera');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.camera.position.set(0, 0, 8);
                this.camera.up.set(0, 1, 0);
                this.controls.target.set(0, 0, 0);
                this.controls.update();
            });
        }
    }
    
    onResize() {
        const width = this.container.clientWidth;
        const height = this.container.clientHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Start the application
window.addEventListener('DOMContentLoaded', () => {
    window.viewer = new VolumetricBrainViewer();
});
