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
        
        // Initialize loader
        this.loader = new GLTFLoader();
    }
    
    async load(modelPath) {
        return new Promise((resolve, reject) => {
            this.loader.load(
                modelPath,
                (gltf) => {
                    this.model = gltf.scene;
                    
                    // Center the model
                    this.centerModel();
                    
                    // Scale to appropriate size
                    this.model.scale.set(2, 2, 2);
                    
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
                    resolve(this.model);
                },
                (progress) => {
                    const percentComplete = (progress.loaded / progress.total) * 100;
                    console.log(`Loading: ${percentComplete.toFixed(2)}%`);
                },
                (error) => {
                    console.error('Error loading brain model:', error);
                    reject(new Error('Failed to load brain model. Please check that the model file exists at the specified path.'));
                }
            );
        });
    }
    
    centerModel() {
        // Calculate bounding box and center the model
        const box = new THREE.Box3().setFromObject(this.model);
        const center = box.getCenter(new THREE.Vector3());
        this.model.position.sub(center);
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
