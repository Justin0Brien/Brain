/**
 * BrainModel - Handles loading and management of the 3D brain model
 * 
 * This class provides methods to load, manipulate, and query the brain model.
 * Designed to be extensible for future features like slicing and highlighting regions.
 */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export class BrainModel {
    constructor(scene) {
        this.scene = scene;
        this.model = null;
        this.mixer = null; // For animations if the model has them
        this.clock = new THREE.Clock();
        
        // Model metrics (calculated after loading)
        this.boundingBox = null;
        this.boundingSphere = null;
        this.center = new THREE.Vector3();
        this.size = new THREE.Vector3();
        
        // Initialize loader
        this.loader = new GLTFLoader();
    }
    
    async load(modelPath) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                modelPath,
                (gltf) => {
                    this.model = gltf.scene;
                    
                    // Analyze and normalize the model
                    this.analyzeModel();
                    this.normalizeModel();
                    
                    // Enable shadows
                    this.model.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            // Store reference to mesh for future manipulation
                            child.userData.originalMaterial = child.material.clone();
                        }
                    });
                    
                    // Set up animations if present
                    if (gltf.animations && gltf.animations.length > 0) {
                        this.mixer = new THREE.AnimationMixer(this.model);
                        gltf.animations.forEach((clip) => {
                            this.mixer.clipAction(clip).play();
                        });
                    }
                    
                    // Add to scene
                    this.scene.add(this.model);
                    
                    console.log('Brain model loaded successfully');
                    console.log(`Model size: ${this.size.x.toFixed(2)} x ${this.size.y.toFixed(2)} x ${this.size.z.toFixed(2)}`);
                    console.log(`Bounding sphere radius: ${this.boundingSphere.radius.toFixed(2)}`);
                    
                    resolve(this.model);
                },
                (progress) => {
                    if (progress.total > 0) {
                        const percentComplete = (progress.loaded / progress.total) * 100;
                        console.log(`Loading: ${percentComplete.toFixed(2)}%`);
                    }
                },
                (error) => {
                    console.error('Error loading brain model:', error);
                    reject(new Error('Failed to load brain model. Please check that the model file exists at the specified path.'));
                }
            );
        });
    }
    
    /**
     * Analyze the model to determine its size and bounding volumes
     */
    analyzeModel() {
        // Calculate bounding box
        this.boundingBox = new THREE.Box3().setFromObject(this.model);
        
        // Get center and size
        this.boundingBox.getCenter(this.center);
        this.boundingBox.getSize(this.size);
        
        // Calculate bounding sphere for camera positioning
        this.boundingSphere = new THREE.Sphere();
        this.boundingBox.getBoundingSphere(this.boundingSphere);
    }
    
    /**
     * Normalize the model: center it at origin and scale to a reasonable size
     */
    normalizeModel() {
        // First, get the original bounding box
        const originalBox = new THREE.Box3().setFromObject(this.model);
        const originalCenter = new THREE.Vector3();
        const originalSize = new THREE.Vector3();
        originalBox.getCenter(originalCenter);
        originalBox.getSize(originalSize);
        
        // Determine the largest dimension
        const maxDimension = Math.max(originalSize.x, originalSize.y, originalSize.z);
        
        // Scale model so the largest dimension is approximately 4 units
        const targetSize = 4;
        const scale = targetSize / maxDimension;
        
        // Apply scale to model
        this.model.scale.set(scale, scale, scale);
        
        // Center the model at origin (account for scale)
        this.model.position.set(
            -originalCenter.x * scale,
            -originalCenter.y * scale,
            -originalCenter.z * scale
        );
        
        // Update model matrix
        this.model.updateMatrixWorld(true);
        
        // Recalculate bounding volumes from the transformed model
        this.boundingBox = new THREE.Box3().setFromObject(this.model);
        this.boundingBox.getCenter(this.center);
        this.boundingBox.getSize(this.size);
        this.boundingBox.getBoundingSphere(this.boundingSphere);
        
        // Debug: Log normalized values
        console.log('=== Model Normalization Debug ===');
        console.log(`Original size: ${originalSize.x.toFixed(2)} x ${originalSize.y.toFixed(2)} x ${originalSize.z.toFixed(2)}`);
        console.log(`Scale factor: ${scale.toFixed(4)}`);
        console.log(`Model position: (${this.model.position.x.toFixed(2)}, ${this.model.position.y.toFixed(2)}, ${this.model.position.z.toFixed(2)})`);
        console.log(`Bounding box center: (${this.center.x.toFixed(2)}, ${this.center.y.toFixed(2)}, ${this.center.z.toFixed(2)})`);
        console.log(`Bounding sphere center: (${this.boundingSphere.center.x.toFixed(2)}, ${this.boundingSphere.center.y.toFixed(2)}, ${this.boundingSphere.center.z.toFixed(2)})`);
        console.log(`Bounding sphere radius: ${this.boundingSphere.radius.toFixed(2)}`);
        console.log(`Final model size: ${this.size.x.toFixed(2)} x ${this.size.y.toFixed(2)} x ${this.size.z.toFixed(2)}`);
        
        // Ensure center is at origin for consistent view positioning
        this.center.set(0, 0, 0);
    }
    
    /**
     * Get optimal camera distance to view the entire model
     * @param {number} fov - Camera field of view in degrees
     * @returns {number} - Optimal distance from model center
     */
    getOptimalCameraDistance(fov = 75) {
        const radius = this.boundingSphere.radius;
        const fovRad = (fov * Math.PI) / 180;
        
        // Calculate distance needed to fit the bounding sphere in view
        // Add some padding (1.5x) for comfortable viewing
        const distance = (radius / Math.sin(fovRad / 2)) * 1.2;
        
        return distance;
    }
    
    /**
     * Get the model's bounding sphere for camera calculations
     */
    getBoundingSphere() {
        return this.boundingSphere;
    }
    
    /**
     * Get the model's center point
     */
    getCenter() {
        return this.center.clone();
    }
    
    /**
     * Get the model's dimensions
     */
    getSize() {
        return this.size.clone();
    }
    
    update() {
        // Update animations if present
        if (this.mixer) {
            const delta = this.clock.getDelta();
            this.mixer.update(delta);
        }
    }
    
    getMesh() {
        if (!this.model) return null;
        
        // Return the first mesh found (or could return all meshes)
        let mesh = null;
        this.model.traverse((child) => {
            if (child.isMesh && !mesh) {
                mesh = child;
            }
        });
        return mesh;
    }
    
    getAllMeshes() {
        if (!this.model) return [];
        
        const meshes = [];
        this.model.traverse((child) => {
            if (child.isMesh) {
                meshes.push(child);
            }
        });
        return meshes;
    }
    
    // Extension points for future features
    
    highlightRegion(regionName) {
        // Future: Highlight specific brain regions
        console.log(`Highlighting region: ${regionName}`);
    }
    
    setOpacity(opacity) {
        this.getAllMeshes().forEach((mesh) => {
            if (mesh.material) {
                mesh.material.transparent = true;
                mesh.material.opacity = opacity;
            }
        });
    }
    
    resetMaterial() {
        this.getAllMeshes().forEach((mesh) => {
            if (mesh.userData.originalMaterial) {
                mesh.material = mesh.userData.originalMaterial.clone();
            }
        });
    }
    
    // For future slicing feature
    createSlicePlane(position, normal) {
        // Future: Create clipping plane for cross-sections
        console.log('Slice plane creation to be implemented');
    }
}
