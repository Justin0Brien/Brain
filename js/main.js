/**
 * 3D Brain Viewer - Main Application
 * 
 * This is the entry point for the 3D brain visualization application.
 * Architecture is designed to be extensible for future features:
 * - Lighting controls (see LightingManager)
 * - Texture/material editing (see MaterialManager)
 * - Cross-sectional slicing (see SliceManager - to be implemented)
 * - Neuron-level detail (see DetailManager - to be implemented)
 */

import { SceneManager } from './modules/SceneManager.js';
import { BrainModel } from './modules/BrainModel.js';
import { CameraController } from './modules/CameraController.js';
import { LightingManager } from './modules/LightingManager.js';
import { MaterialManager } from './modules/MaterialManager.js';
import { GridHelper } from './modules/GridHelper.js';
import { UIController } from './modules/UIController.js';

class BrainViewer {
    constructor() {
        this.container = document.getElementById('viewer-container');
        this.loadingElement = document.getElementById('loading');
        
        // Initialize core managers
        this.sceneManager = new SceneManager(this.container);
        this.lightingManager = new LightingManager(this.sceneManager.scene);
        this.materialManager = new MaterialManager();
        this.cameraController = new CameraController(
            this.sceneManager.camera,
            this.sceneManager.renderer.domElement
        );
        
        // Grid helper (initialized after model loads)
        this.gridHelper = null;
        
        // UI controller (initialized after model loads)
        this.uiController = null;
        
        // Brain model instance
        this.brainModel = null;
        
        // Optimal viewing distance (set after model loads)
        this.optimalDistance = 5;
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
    }
    
    async init() {
        try {
            // Load brain model
            this.brainModel = new BrainModel(this.sceneManager.scene);
            await this.brainModel.load('models/brain.glb');
            
            // Store original position for transform reset
            this.brainModel.originalPosition = this.brainModel.model.position.clone();
            
            // Initialize grid helper based on model size (pass actual radius)
            const modelRadius = this.brainModel.getBoundingSphere().radius;
            this.gridHelper = new GridHelper(this.sceneManager.scene);
            this.gridHelper.init(modelRadius);
            
            // Position camera to show entire model
            this.setupOptimalView();
            
            // Initialize UI controller
            this.uiController = new UIController(this);
            this.uiController.setBaseDistance(this.optimalDistance);
            
            // Store original scale and materials for reset functionality
            this.uiController.setOriginalScale(this.brainModel.model.scale.x);
            this.uiController.storeOriginalMaterials();
            
            // Update model info display
            const scaleInfo = this.gridHelper.getScaleInfo(modelRadius * 2);
            this.uiController.updateModelInfo(this.brainModel, scaleInfo);
            
            // Hide loading screen
            this.loadingElement.classList.add('hidden');
            
            // Set up event listeners
            window.addEventListener('resize', this.onWindowResize);
            
            // Start animation loop
            this.animate();
            
            console.log('Brain Viewer initialized successfully');
        } catch (error) {
            console.error('Error initializing Brain Viewer:', error);
            this.showError(error.message);
        }
    }
    
    /**
     * Set up the optimal camera view based on the loaded model's size
     */
    setupOptimalView() {
        // Get optimal distance from the model
        const camera = this.sceneManager.camera;
        const distance = this.brainModel.getOptimalCameraDistance(camera.fov);
        const center = this.brainModel.getCenter();
        const boundingSphere = this.brainModel.getBoundingSphere();
        
        // Store optimal distance for UI
        this.optimalDistance = distance;
        
        console.log('=== Camera Setup Debug ===');
        console.log(`Model bounding sphere radius: ${boundingSphere.radius.toFixed(2)}`);
        console.log(`Optimal camera distance: ${distance.toFixed(2)}`);
        console.log(`Camera FOV: ${camera.fov}`);
        
        // Position camera at a slight angle for a more interesting default view
        // This shows the brain from a front-right-top perspective (standard anatomical viewing angle)
        const angleH = Math.PI * 0.15;  // Slight horizontal rotation (about 27 degrees)
        const angleV = Math.PI * 0.1;   // Slight vertical elevation (about 18 degrees)
        
        const x = distance * Math.sin(angleH) * Math.cos(angleV);
        const y = distance * Math.sin(angleV);
        const z = distance * Math.cos(angleH) * Math.cos(angleV);
        
        console.log(`Camera position: (${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)})`);
        
        camera.position.set(x, y, z);
        camera.up.set(0, 1, 0);
        
        // Update camera controller to look at model center
        this.cameraController.setTarget(center);
        
        // Update camera controller constraints based on model size
        this.cameraController.setZoomLimits(
            boundingSphere.radius * 0.5,  // Min distance: can get fairly close
            boundingSphere.radius * 5      // Max distance: can zoom out to see context
        );
        
        console.log(`Camera positioned at distance: ${distance.toFixed(2)}`);
    }
    
    animate() {
        requestAnimationFrame(this.animate);
        
        // Update camera controls
        this.cameraController.update();
        
        // Update brain model if it has animations
        if (this.brainModel) {
            this.brainModel.update();
        }
        
        // Render scene
        this.sceneManager.render();
    }
    
    onWindowResize() {
        this.sceneManager.onWindowResize();
    }
    
    showError(message) {
        const isProcedural = this.brainModel && this.brainModel.isProcedural;
        
        if (isProcedural) {
            // Using procedural brain - show info but allow continuing
            console.log('Using procedurally generated brain model');
            return;
        }
        
        this.loadingElement.innerHTML = `
            <div class="download-instructions">
                <h2>🧠 Brain Model Required</h2>
                <p class="error-msg">${message}</p>
                <p>No brain model was found. The viewer will use a procedurally generated brain.</p>
                
                <h3>For Better Quality: Download a Real Brain Model</h3>
                <ol>
                    <li>Visit <a href="https://sketchfab.com/search?q=brain+anatomy&type=models&licenses=cc0&licenses=by&licenses=by-nc" target="_blank">Sketchfab</a> (filter by free licenses)</li>
                    <li>Download a brain model in <strong>GLB</strong> or <strong>GLTF</strong> format</li>
                    <li>Save it as <code>models/brain.glb</code></li>
                    <li><button onclick="location.reload()" class="btn-primary">Refresh Page</button></li>
                </ol>
                
                <h3>Alternative Sources:</h3>
                <ul>
                    <li><a href="https://www.turbosquid.com/Search/3D-Models/free/brain" target="_blank">TurboSquid</a> - Free 3D models</li>
                    <li><a href="https://free3d.com/3d-models/brain" target="_blank">Free3D</a> - Brain models</li>
                    <li><a href="https://www.cgtrader.com/free-3d-models/brain" target="_blank">CGTrader</a> - Free assets</li>
                </ul>
                
                <p style="margin-top: 20px;">
                    <button onclick="document.getElementById('loading').classList.add('hidden')" class="btn-secondary">
                        Continue with Procedural Brain
                    </button>
                </p>
                <p><a href="volume.html" class="nav-link">Or try the Volumetric MRI Viewer →</a></p>
            </div>
        `;
        
        // Add styles
        const style = document.createElement('style');
        style.textContent = `
            .download-instructions {
                max-width: 550px;
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
                font-size: 13px;
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
                display: inline-block;
                margin-top: 10px;
                padding: 8px 16px;
                background: linear-gradient(135deg, #4a6cf7, #6a8bff);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            .download-instructions .btn-secondary {
                display: inline-block;
                padding: 8px 16px;
                background: #2a2a3a;
                color: #aaa;
                border: 1px solid #444;
                border-radius: 4px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Extension points for future features
    
    enableSlicing() {
        // Future: Initialize SliceManager
        console.log('Slicing feature to be implemented');
    }
    
    enableNeuronView() {
        // Future: Initialize DetailManager for neuron-level viewing
        console.log('Neuron-level view to be implemented');
    }
    
    updateLighting(settings) {
        this.lightingManager.updateLighting(settings);
    }
    
    updateMaterial(settings) {
        if (this.brainModel) {
            this.materialManager.applyMaterial(this.brainModel.getMesh(), settings);
        }
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const viewer = new BrainViewer();
    viewer.init();
    
    // Make viewer globally accessible for debugging and future UI controls
    window.brainViewer = viewer;
});
