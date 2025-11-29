/**
 * LightingManager - Manages scene lighting
 * 
 * Provides methods to adjust lighting for optimal brain visualization.
 * Extensible for advanced lighting effects and configurations.
 */

import * as THREE from 'three';

export class LightingManager {
    constructor(scene) {
        this.scene = scene;
        this.lights = {};
        
        this.setupDefaultLighting();
    }
    
    setupDefaultLighting() {
        // Ambient light for overall illumination
        this.lights.ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(this.lights.ambient);
        
        // Main directional light (key light)
        this.lights.directional = new THREE.DirectionalLight(0xffffff, 0.8);
        this.lights.directional.position.set(5, 5, 5);
        this.lights.directional.castShadow = true;
        
        // Configure shadow properties
        this.lights.directional.shadow.mapSize.width = 2048;
        this.lights.directional.shadow.mapSize.height = 2048;
        this.lights.directional.shadow.camera.near = 0.5;
        this.lights.directional.shadow.camera.far = 50;
        this.scene.add(this.lights.directional);
        
        // Fill light (softer, from opposite side)
        this.lights.fill = new THREE.DirectionalLight(0x8888ff, 0.3);
        this.lights.fill.position.set(-5, 0, -5);
        this.scene.add(this.lights.fill);
        
        // Rim light (for edge highlighting)
        this.lights.rim = new THREE.DirectionalLight(0xffffff, 0.4);
        this.lights.rim.position.set(0, -5, 0);
        this.scene.add(this.lights.rim);
        
        // Hemisphere light for color gradient
        this.lights.hemisphere = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
        this.scene.add(this.lights.hemisphere);
    }
    
    // Methods for adjusting individual lights
    
    setAmbientIntensity(intensity) {
        if (this.lights.ambient) {
            this.lights.ambient.intensity = intensity;
        }
    }
    
    setAmbientColor(color) {
        if (this.lights.ambient) {
            this.lights.ambient.color.set(color);
        }
    }
    
    setDirectionalIntensity(intensity) {
        if (this.lights.directional) {
            this.lights.directional.intensity = intensity;
        }
    }
    
    setDirectionalPosition(x, y, z) {
        if (this.lights.directional) {
            this.lights.directional.position.set(x, y, z);
        }
    }
    
    // Preset lighting configurations
    
    setLightingPreset(presetName) {
        const presets = {
            default: {
                ambient: { intensity: 0.4, color: 0xffffff },
                directional: { intensity: 0.8 },
                fill: { intensity: 0.3 },
                rim: { intensity: 0.4 }
            },
            bright: {
                ambient: { intensity: 0.6, color: 0xffffff },
                directional: { intensity: 1.0 },
                fill: { intensity: 0.5 },
                rim: { intensity: 0.6 }
            },
            dramatic: {
                ambient: { intensity: 0.2, color: 0xffffff },
                directional: { intensity: 1.2 },
                fill: { intensity: 0.1 },
                rim: { intensity: 0.8 }
            },
            medical: {
                ambient: { intensity: 0.5, color: 0xf0f0ff },
                directional: { intensity: 0.9 },
                fill: { intensity: 0.4 },
                rim: { intensity: 0.3 }
            }
        };
        
        const preset = presets[presetName] || presets.default;
        
        if (preset.ambient && this.lights.ambient) {
            this.lights.ambient.intensity = preset.ambient.intensity;
            this.lights.ambient.color.set(preset.ambient.color);
        }
        
        if (preset.directional && this.lights.directional) {
            this.lights.directional.intensity = preset.directional.intensity;
        }
        
        if (preset.fill && this.lights.fill) {
            this.lights.fill.intensity = preset.fill.intensity;
        }
        
        if (preset.rim && this.lights.rim) {
            this.lights.rim.intensity = preset.rim.intensity;
        }
    }
    
    // Extension point for custom lighting effects
    
    addPointLight(position, color = 0xffffff, intensity = 1, distance = 0) {
        const light = new THREE.PointLight(color, intensity, distance);
        light.position.set(...position);
        this.scene.add(light);
        return light;
    }
    
    addSpotlight(position, target, color = 0xffffff, intensity = 1) {
        const light = new THREE.SpotLight(color, intensity);
        light.position.set(...position);
        light.target.position.set(...target);
        light.castShadow = true;
        this.scene.add(light);
        this.scene.add(light.target);
        return light;
    }
    
    updateLighting(settings) {
        // Generic method for updating lighting from UI controls
        if (settings.ambientIntensity !== undefined) {
            this.setAmbientIntensity(settings.ambientIntensity);
        }
        if (settings.directionalIntensity !== undefined) {
            this.setDirectionalIntensity(settings.directionalIntensity);
        }
        if (settings.preset) {
            this.setLightingPreset(settings.preset);
        }
    }
}
