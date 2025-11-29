/**
 * SceneManager - Manages the Three.js scene, camera, and renderer
 * 
 * This class encapsulates all the core Three.js setup and configuration.
 * Provides a clean interface for other modules to interact with the 3D scene.
 */

import * as THREE from 'three';

export class SceneManager {
    constructor(container) {
        this.container = container;
        
        // Initialize scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        
        // Initialize camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 5);
        
        // Initialize renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Add renderer to DOM
        this.container.appendChild(this.renderer.domElement);
        
        // Add subtle fog for depth perception (far enough to not obscure model)
        this.scene.fog = new THREE.Fog(0x0a0a0a, 50, 200);
    }
    
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // Extension point for adding custom objects
    addToScene(object) {
        this.scene.add(object);
    }
    
    removeFromScene(object) {
        this.scene.remove(object);
    }
    
    // Helper for getting scene objects
    getObjectByName(name) {
        return this.scene.getObjectByName(name);
    }
}
