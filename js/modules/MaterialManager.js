/**
 * MaterialManager - Manages materials and textures for the brain model
 * 
 * Provides methods to change material properties for different visualization needs.
 * Extensible for custom shaders and advanced material effects.
 */

export class MaterialManager {
    constructor() {
        this.materials = {};
        this.createDefaultMaterials();
    }
    
    createDefaultMaterials() {
        // Standard brain material
        this.materials.standard = new THREE.MeshStandardMaterial({
            color: 0xffccaa,
            roughness: 0.7,
            metalness: 0.1,
            side: THREE.DoubleSide
        });
        
        // Glossy material
        this.materials.glossy = new THREE.MeshStandardMaterial({
            color: 0xffccaa,
            roughness: 0.2,
            metalness: 0.3,
            side: THREE.DoubleSide
        });
        
        // Matte material
        this.materials.matte = new THREE.MeshLambertMaterial({
            color: 0xffccaa,
            side: THREE.DoubleSide
        });
        
        // X-ray style material
        this.materials.xray = new THREE.MeshPhongMaterial({
            color: 0x44aaff,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide,
            shininess: 100
        });
        
        // Wireframe material
        this.materials.wireframe = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true
        });
    }
    
    applyMaterial(mesh, materialName) {
        if (!mesh || !this.materials[materialName]) {
            console.warn(`Material "${materialName}" not found`);
            return;
        }
        
        mesh.material = this.materials[materialName];
    }
    
    // Create custom material
    createCustomMaterial(settings) {
        const material = new THREE.MeshStandardMaterial({
            color: settings.color || 0xffffff,
            roughness: settings.roughness !== undefined ? settings.roughness : 0.5,
            metalness: settings.metalness !== undefined ? settings.metalness : 0.5,
            transparent: settings.transparent || false,
            opacity: settings.opacity !== undefined ? settings.opacity : 1.0,
            side: THREE.DoubleSide
        });
        
        return material;
    }
    
    // Update existing material properties
    updateMaterialProperties(mesh, properties) {
        if (!mesh || !mesh.material) return;
        
        Object.keys(properties).forEach((key) => {
            if (mesh.material[key] !== undefined) {
                mesh.material[key] = properties[key];
            }
        });
        
        mesh.material.needsUpdate = true;
    }
    
    // Extension point for texture loading
    loadTexture(texturePath) {
        const loader = new THREE.TextureLoader();
        return new Promise((resolve, reject) => {
            loader.load(
                texturePath,
                (texture) => resolve(texture),
                undefined,
                (error) => reject(error)
            );
        });
    }
    
    async applyTexture(mesh, texturePath, textureType = 'map') {
        try {
            const texture = await this.loadTexture(texturePath);
            mesh.material[textureType] = texture;
            mesh.material.needsUpdate = true;
        } catch (error) {
            console.error('Error loading texture:', error);
        }
    }
    
    // Extension point for custom shaders
    createCustomShader(vertexShader, fragmentShader, uniforms = {}) {
        return new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms,
            side: THREE.DoubleSide
        });
    }
    
    // Preset material configurations
    setMaterialPreset(mesh, presetName) {
        const presets = {
            realistic: {
                roughness: 0.7,
                metalness: 0.1,
                color: 0xffccaa
            },
            scientific: {
                roughness: 0.4,
                metalness: 0.0,
                color: 0xf5f5dc
            },
            artistic: {
                roughness: 0.3,
                metalness: 0.5,
                color: 0xff88aa
            },
            xray: {
                transparent: true,
                opacity: 0.5,
                color: 0x44aaff,
                roughness: 0.2,
                metalness: 0.8
            }
        };
        
        const preset = presets[presetName];
        if (preset) {
            this.updateMaterialProperties(mesh, preset);
        }
    }
}
