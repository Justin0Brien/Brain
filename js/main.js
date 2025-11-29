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
        
        // Brain model instance
        this.brainModel = null;
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.onWindowResize = this.onWindowResize.bind(this);
    }
    
    async init() {
        try {
            // Load brain model
            this.brainModel = new BrainModel(this.sceneManager.scene);
            await this.brainModel.load('models/brain.glb');
            
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
        this.loadingElement.innerHTML = `
            <div style="color: #ff6b6b;">
                <h2>Error Loading Brain Model</h2>
                <p>${message}</p>
                <p style="margin-top: 20px; font-size: 14px;">
                    Please ensure a brain model file is placed at: <code>models/brain.glb</code>
                </p>
            </div>
        `;
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
