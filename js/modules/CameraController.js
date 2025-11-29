/**
 * CameraController - Manages camera movement and user interaction
 * 
 * Uses OrbitControls for intuitive 3D navigation.
 * Extensible for custom camera behaviors and animation paths.
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export class CameraController {
    constructor(camera, domElement) {
        this.camera = camera;
        this.domElement = domElement;
        
        // Initialize OrbitControls
        this.controls = new OrbitControls(this.camera, this.domElement);
        
        // Configure controls
        this.setupControls();
    }
    
    setupControls() {
        // Enable damping for smooth movement
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        
        // Set rotation speed
        this.controls.rotateSpeed = 0.8;
        
        // Set zoom limits
        this.controls.minDistance = 2;
        this.controls.maxDistance = 20;
        
        // Enable panning
        this.controls.enablePan = true;
        this.controls.panSpeed = 0.8;
        
        // Set zoom speed
        this.controls.zoomSpeed = 1.2;
        
        // Constrain vertical rotation
        this.controls.minPolarAngle = 0; // radians
        this.controls.maxPolarAngle = Math.PI; // radians
        
        // Auto-rotate (disabled by default)
        this.controls.autoRotate = false;
        this.controls.autoRotateSpeed = 0.5;
    }
    
    update() {
        this.controls.update();
    }
    
    // Convenience methods for camera manipulation
    
    /**
     * Set the target point the camera looks at
     * @param {THREE.Vector3|Object} target - The point to look at (Vector3 or {x, y, z})
     */
    setTarget(target) {
        if (target.isVector3) {
            this.controls.target.copy(target);
        } else {
            this.controls.target.set(target.x || 0, target.y || 0, target.z || 0);
        }
        this.controls.update();
    }
    
    /**
     * Get the current target
     */
    getTarget() {
        return this.controls.target.clone();
    }
    
    /**
     * Set zoom (distance) limits based on model size
     * @param {number} minDistance - Minimum distance from target
     * @param {number} maxDistance - Maximum distance from target
     */
    setZoomLimits(minDistance, maxDistance) {
        this.controls.minDistance = minDistance;
        this.controls.maxDistance = maxDistance;
    }
    
    enableAutoRotate(enable = true) {
        this.controls.autoRotate = enable;
    }
    
    setAutoRotateSpeed(speed) {
        this.controls.autoRotateSpeed = speed;
    }
    
    resetCamera() {
        this.camera.position.set(0, 0, 5);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }
    
    focusOnPoint(point, distance = 5) {
        // Smoothly move camera to focus on a specific point
        const direction = new THREE.Vector3()
            .subVectors(this.camera.position, point)
            .normalize()
            .multiplyScalar(distance);
        
        this.camera.position.copy(point).add(direction);
        this.controls.target.copy(point);
        this.controls.update();
    }
    
    // Extension point for camera animations
    animateCameraTo(targetPosition, targetLookAt, duration = 1000) {
        // Future: Implement smooth camera transitions using GSAP or Tween.js
        console.log('Camera animation to be implemented');
    }
    
    // Extension point for predefined views
    setView(viewName) {
        const views = {
            front: { position: [0, 0, 5], target: [0, 0, 0] },
            back: { position: [0, 0, -5], target: [0, 0, 0] },
            left: { position: [-5, 0, 0], target: [0, 0, 0] },
            right: { position: [5, 0, 0], target: [0, 0, 0] },
            top: { position: [0, 5, 0], target: [0, 0, 0] },
            bottom: { position: [0, -5, 0], target: [0, 0, 0] }
        };
        
        if (views[viewName]) {
            const view = views[viewName];
            this.camera.position.set(...view.position);
            this.controls.target.set(...view.target);
            this.controls.update();
        }
    }
}
