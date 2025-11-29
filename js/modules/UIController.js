/**
 * UIController - Manages UI controls and their interactions with the 3D scene
 * 
 * Handles all UI events and updates the appropriate scene components.
 * Includes camera controls, object transforms, lighting, and materials.
 */

import * as THREE from 'three';

export class UIController {
    constructor(brainViewer) {
        this.viewer = brainViewer;
        this.elements = {};
        this.baseDistance = 5; // Will be set based on model
        this.originalScale = 1;
        this.originalMaterials = new Map();
        
        this.initElements();
        this.initEventListeners();
        this.initCollapsibleSections();
    }
    
    initElements() {
        // Camera controls
        this.elements.rotationX = document.getElementById('rotation-x');
        this.elements.rotationY = document.getElementById('rotation-y');
        this.elements.rotationZ = document.getElementById('rotation-z');
        this.elements.zoom = document.getElementById('zoom');
        this.elements.panX = document.getElementById('pan-x');
        this.elements.panY = document.getElementById('pan-y');
        this.elements.resetCamera = document.getElementById('reset-camera');
        
        // Camera value displays
        this.elements.rotationXValue = document.getElementById('rotation-x-value');
        this.elements.rotationYValue = document.getElementById('rotation-y-value');
        this.elements.rotationZValue = document.getElementById('rotation-z-value');
        this.elements.zoomValue = document.getElementById('zoom-value');
        this.elements.panXValue = document.getElementById('pan-x-value');
        this.elements.panYValue = document.getElementById('pan-y-value');
        
        // View buttons
        this.elements.viewFront = document.getElementById('view-front');
        this.elements.viewBack = document.getElementById('view-back');
        this.elements.viewLeft = document.getElementById('view-left');
        this.elements.viewRight = document.getElementById('view-right');
        this.elements.viewTop = document.getElementById('view-top');
        this.elements.viewBottom = document.getElementById('view-bottom');
        
        // Object transform controls
        this.elements.modelScale = document.getElementById('model-scale');
        this.elements.modelPosX = document.getElementById('model-pos-x');
        this.elements.modelPosY = document.getElementById('model-pos-y');
        this.elements.modelPosZ = document.getElementById('model-pos-z');
        this.elements.resetTransform = document.getElementById('reset-transform');
        
        // Object transform value displays
        this.elements.modelScaleValue = document.getElementById('model-scale-value');
        this.elements.modelPosXValue = document.getElementById('model-pos-x-value');
        this.elements.modelPosYValue = document.getElementById('model-pos-y-value');
        this.elements.modelPosZValue = document.getElementById('model-pos-z-value');
        
        // Display options
        this.elements.showAxes = document.getElementById('show-axes');
        this.elements.showGridXY = document.getElementById('show-grid-xy');
        this.elements.showGridXZ = document.getElementById('show-grid-xz');
        this.elements.showGridYZ = document.getElementById('show-grid-yz');
        this.elements.autoRotate = document.getElementById('auto-rotate');
        this.elements.showWireframe = document.getElementById('show-wireframe');
        this.elements.showBoundingBox = document.getElementById('show-bounding-box');
        
        // Lighting controls
        this.elements.lightingPreset = document.getElementById('lighting-preset');
        this.elements.ambientIntensity = document.getElementById('ambient-intensity');
        this.elements.directionalIntensity = document.getElementById('directional-intensity');
        this.elements.lightAngleH = document.getElementById('light-angle-h');
        this.elements.lightAngleV = document.getElementById('light-angle-v');
        this.elements.fillIntensity = document.getElementById('fill-intensity');
        this.elements.rimIntensity = document.getElementById('rim-intensity');
        this.elements.lightColor = document.getElementById('light-color');
        
        // Lighting value displays
        this.elements.ambientIntensityValue = document.getElementById('ambient-intensity-value');
        this.elements.directionalIntensityValue = document.getElementById('directional-intensity-value');
        this.elements.lightAngleHValue = document.getElementById('light-angle-h-value');
        this.elements.lightAngleVValue = document.getElementById('light-angle-v-value');
        this.elements.fillIntensityValue = document.getElementById('fill-intensity-value');
        this.elements.rimIntensityValue = document.getElementById('rim-intensity-value');
        
        // Material controls
        this.elements.materialPreset = document.getElementById('material-preset');
        this.elements.materialColor = document.getElementById('material-color');
        this.elements.materialRoughness = document.getElementById('material-roughness');
        this.elements.materialMetalness = document.getElementById('material-metalness');
        this.elements.materialOpacity = document.getElementById('material-opacity');
        this.elements.doubleSided = document.getElementById('double-sided');
        this.elements.flatShading = document.getElementById('flat-shading');
        this.elements.resetMaterial = document.getElementById('reset-material');
        
        // Material value displays
        this.elements.materialRoughnessValue = document.getElementById('material-roughness-value');
        this.elements.materialMetalnessValue = document.getElementById('material-metalness-value');
        this.elements.materialOpacityValue = document.getElementById('material-opacity-value');
        
        // Model info
        this.elements.modelInfo = document.getElementById('model-info');
    }
    
    initCollapsibleSections() {
        document.querySelectorAll('.section-header').forEach(header => {
            header.addEventListener('click', () => {
                const section = header.closest('.collapsible');
                section.classList.toggle('collapsed');
                
                // Update arrow
                const isCollapsed = section.classList.contains('collapsed');
                header.textContent = (isCollapsed ? '▶ ' : '▼ ') + header.textContent.substring(2);
            });
        });
    }
    
    initEventListeners() {
        // Camera rotation controls
        this.addInputListener('rotationX', () => this.handleRotationChange());
        this.addInputListener('rotationY', () => this.handleRotationChange());
        this.addInputListener('rotationZ', () => this.handleRotationChange());
        this.addInputListener('zoom', () => this.handleZoomChange());
        this.addInputListener('panX', () => this.handlePanChange());
        this.addInputListener('panY', () => this.handlePanChange());
        
        // Reset camera
        this.addClickListener('resetCamera', () => this.handleResetCamera());
        
        // View buttons
        this.addClickListener('viewFront', () => this.setView('front'));
        this.addClickListener('viewBack', () => this.setView('back'));
        this.addClickListener('viewLeft', () => this.setView('left'));
        this.addClickListener('viewRight', () => this.setView('right'));
        this.addClickListener('viewTop', () => this.setView('top'));
        this.addClickListener('viewBottom', () => this.setView('bottom'));
        
        // Object transform controls
        this.addInputListener('modelScale', () => this.handleModelScaleChange());
        this.addInputListener('modelPosX', () => this.handleModelPositionChange());
        this.addInputListener('modelPosY', () => this.handleModelPositionChange());
        this.addInputListener('modelPosZ', () => this.handleModelPositionChange());
        this.addClickListener('resetTransform', () => this.handleResetTransform());
        
        // Display options
        this.addChangeListener('showAxes', (e) => {
            if (this.viewer.gridHelper) this.viewer.gridHelper.setAxesVisible(e.target.checked);
        });
        this.addChangeListener('showGridXY', (e) => {
            if (this.viewer.gridHelper) this.viewer.gridHelper.setXYGridVisible(e.target.checked);
        });
        this.addChangeListener('showGridXZ', (e) => {
            if (this.viewer.gridHelper) this.viewer.gridHelper.setXZGridVisible(e.target.checked);
        });
        this.addChangeListener('showGridYZ', (e) => {
            if (this.viewer.gridHelper) this.viewer.gridHelper.setYZGridVisible(e.target.checked);
        });
        this.addChangeListener('autoRotate', (e) => {
            if (this.viewer.cameraController) this.viewer.cameraController.enableAutoRotate(e.target.checked);
        });
        this.addChangeListener('showWireframe', (e) => this.handleWireframeToggle(e.target.checked));
        this.addChangeListener('showBoundingBox', (e) => this.handleBoundingBoxToggle(e.target.checked));
        
        // Lighting controls
        this.addChangeListener('lightingPreset', (e) => this.handleLightingPresetChange(e.target.value));
        this.addInputListener('ambientIntensity', () => this.handleLightingChange());
        this.addInputListener('directionalIntensity', () => this.handleLightingChange());
        this.addInputListener('lightAngleH', () => this.handleLightingChange());
        this.addInputListener('lightAngleV', () => this.handleLightingChange());
        this.addInputListener('fillIntensity', () => this.handleLightingChange());
        this.addInputListener('rimIntensity', () => this.handleLightingChange());
        this.addInputListener('lightColor', () => this.handleLightingChange());
        
        // Material controls
        this.addChangeListener('materialPreset', (e) => this.handleMaterialPresetChange(e.target.value));
        this.addInputListener('materialColor', () => this.handleMaterialChange());
        this.addInputListener('materialRoughness', () => this.handleMaterialChange());
        this.addInputListener('materialMetalness', () => this.handleMaterialChange());
        this.addInputListener('materialOpacity', () => this.handleMaterialChange());
        this.addChangeListener('doubleSided', () => this.handleMaterialChange());
        this.addChangeListener('flatShading', () => this.handleMaterialChange());
        this.addClickListener('resetMaterial', () => this.handleResetMaterial());
    }
    
    // Helper methods for adding event listeners
    addInputListener(elementKey, handler) {
        if (this.elements[elementKey]) {
            this.elements[elementKey].addEventListener('input', handler);
        }
    }
    
    addClickListener(elementKey, handler) {
        if (this.elements[elementKey]) {
            this.elements[elementKey].addEventListener('click', handler);
        }
    }
    
    addChangeListener(elementKey, handler) {
        if (this.elements[elementKey]) {
            this.elements[elementKey].addEventListener('change', handler);
        }
    }
    
    /**
     * Set the base distance for zoom calculations
     */
    setBaseDistance(distance) {
        this.baseDistance = distance;
    }
    
    /**
     * Store original model scale for reset
     */
    setOriginalScale(scale) {
        this.originalScale = scale;
    }
    
    /**
     * Store original materials for reset
     */
    storeOriginalMaterials() {
        if (!this.viewer.brainModel || !this.viewer.brainModel.model) return;
        
        this.viewer.brainModel.model.traverse((child) => {
            if (child.isMesh && child.material) {
                this.originalMaterials.set(child.uuid, child.material.clone());
            }
        });
    }
    
    // ===== Camera Controls =====
    
    handleRotationChange() {
        const rotX = parseFloat(this.elements.rotationX.value);
        const rotY = parseFloat(this.elements.rotationY.value);
        const rotZ = parseFloat(this.elements.rotationZ.value);
        
        this.elements.rotationXValue.textContent = `${rotX}°`;
        this.elements.rotationYValue.textContent = `${rotY}°`;
        this.elements.rotationZValue.textContent = `${rotZ}°`;
        
        if (this.viewer.brainModel && this.viewer.brainModel.model) {
            this.viewer.brainModel.model.rotation.x = rotX * Math.PI / 180;
            this.viewer.brainModel.model.rotation.y = rotY * Math.PI / 180;
            this.viewer.brainModel.model.rotation.z = rotZ * Math.PI / 180;
        }
    }
    
    handleZoomChange() {
        const zoomPercent = parseFloat(this.elements.zoom.value);
        this.elements.zoomValue.textContent = `${zoomPercent}%`;
        
        const distance = this.baseDistance * (100 / zoomPercent);
        
        if (this.viewer.cameraController && this.viewer.sceneManager) {
            const camera = this.viewer.sceneManager.camera;
            const target = this.viewer.cameraController.getTarget();
            const direction = camera.position.clone().sub(target);
            const currentDistance = direction.length();
            
            if (currentDistance > 0.001) {
                direction.normalize();
                camera.position.copy(target).add(direction.multiplyScalar(distance));
                this.viewer.cameraController.controls.update();
            }
        }
    }
    
    handlePanChange() {
        const panX = parseFloat(this.elements.panX.value) / 50;
        const panY = parseFloat(this.elements.panY.value) / 50;
        
        this.elements.panXValue.textContent = this.elements.panX.value;
        this.elements.panYValue.textContent = this.elements.panY.value;
        
        if (this.viewer.cameraController) {
            this.viewer.cameraController.setTarget({ x: panX, y: panY, z: 0 });
        }
    }
    
    handleResetCamera() {
        // Reset sliders
        this.elements.rotationX.value = 0;
        this.elements.rotationY.value = 0;
        this.elements.rotationZ.value = 0;
        this.elements.zoom.value = 100;
        this.elements.panX.value = 0;
        this.elements.panY.value = 0;
        
        // Update displays
        this.elements.rotationXValue.textContent = '0°';
        this.elements.rotationYValue.textContent = '0°';
        this.elements.rotationZValue.textContent = '0°';
        this.elements.zoomValue.textContent = '100%';
        this.elements.panXValue.textContent = '0';
        this.elements.panYValue.textContent = '0';
        
        // Reset model rotation
        if (this.viewer.brainModel && this.viewer.brainModel.model) {
            this.viewer.brainModel.model.rotation.set(0, 0, 0);
        }
        
        this.viewer.setupOptimalView();
    }
    
    setView(viewName) {
        if (!this.viewer.cameraController || !this.viewer.sceneManager) return;
        
        const camera = this.viewer.sceneManager.camera;
        const distance = this.viewer.optimalDistance || this.baseDistance;
        
        // Reset model rotation
        if (this.viewer.brainModel && this.viewer.brainModel.model) {
            this.viewer.brainModel.model.rotation.set(0, 0, 0);
        }
        
        // Reset rotation sliders
        this.elements.rotationX.value = 0;
        this.elements.rotationY.value = 0;
        this.elements.rotationZ.value = 0;
        this.elements.rotationXValue.textContent = '0°';
        this.elements.rotationYValue.textContent = '0°';
        this.elements.rotationZValue.textContent = '0°';
        
        const views = {
            front: { position: [0, 0, distance], up: [0, 1, 0] },
            back: { position: [0, 0, -distance], up: [0, 1, 0] },
            left: { position: [-distance, 0, 0], up: [0, 1, 0] },
            right: { position: [distance, 0, 0], up: [0, 1, 0] },
            top: { position: [0, distance, 0], up: [0, 0, -1] },
            bottom: { position: [0, -distance, 0], up: [0, 0, 1] }
        };
        
        const view = views[viewName];
        if (view) {
            camera.position.set(...view.position);
            camera.up.set(...view.up);
            this.viewer.cameraController.setTarget({ x: 0, y: 0, z: 0 });
            camera.lookAt(0, 0, 0);
            this.viewer.cameraController.controls.update();
        }
    }
    
    // ===== Object Transform Controls =====
    
    handleModelScaleChange() {
        const scalePercent = parseFloat(this.elements.modelScale.value);
        this.elements.modelScaleValue.textContent = `${scalePercent}%`;
        
        if (this.viewer.brainModel && this.viewer.brainModel.model) {
            const scale = this.originalScale * (scalePercent / 100);
            this.viewer.brainModel.model.scale.setScalar(scale);
        }
    }
    
    handleModelPositionChange() {
        const posX = parseFloat(this.elements.modelPosX.value) / 25;
        const posY = parseFloat(this.elements.modelPosY.value) / 25;
        const posZ = parseFloat(this.elements.modelPosZ.value) / 25;
        
        this.elements.modelPosXValue.textContent = this.elements.modelPosX.value;
        this.elements.modelPosYValue.textContent = this.elements.modelPosY.value;
        this.elements.modelPosZValue.textContent = this.elements.modelPosZ.value;
        
        if (this.viewer.brainModel && this.viewer.brainModel.model) {
            // Store original centering offset
            const model = this.viewer.brainModel.model;
            const basePos = this.viewer.brainModel.originalPosition || new THREE.Vector3();
            model.position.set(basePos.x + posX, basePos.y + posY, basePos.z + posZ);
        }
    }
    
    handleResetTransform() {
        // Reset sliders
        this.elements.modelScale.value = 100;
        this.elements.modelPosX.value = 0;
        this.elements.modelPosY.value = 0;
        this.elements.modelPosZ.value = 0;
        
        // Update displays
        this.elements.modelScaleValue.textContent = '100%';
        this.elements.modelPosXValue.textContent = '0';
        this.elements.modelPosYValue.textContent = '0';
        this.elements.modelPosZValue.textContent = '0';
        
        if (this.viewer.brainModel && this.viewer.brainModel.model) {
            const model = this.viewer.brainModel.model;
            model.scale.setScalar(this.originalScale);
            const basePos = this.viewer.brainModel.originalPosition || new THREE.Vector3();
            model.position.copy(basePos);
        }
    }
    
    // ===== Display Options =====
    
    handleWireframeToggle(show) {
        if (!this.viewer.brainModel || !this.viewer.brainModel.model) return;
        
        this.viewer.brainModel.model.traverse((child) => {
            if (child.isMesh) {
                if (show) {
                    // Add wireframe overlay
                    if (!child.userData.wireframe) {
                        const wireframeMat = new THREE.MeshBasicMaterial({
                            color: 0x00ff00,
                            wireframe: true,
                            transparent: true,
                            opacity: 0.3
                        });
                        const wireframe = new THREE.Mesh(child.geometry, wireframeMat);
                        wireframe.name = 'wireframeOverlay';
                        child.add(wireframe);
                        child.userData.wireframe = wireframe;
                    }
                } else {
                    // Remove wireframe overlay
                    if (child.userData.wireframe) {
                        child.remove(child.userData.wireframe);
                        child.userData.wireframe.geometry.dispose();
                        child.userData.wireframe.material.dispose();
                        child.userData.wireframe = null;
                    }
                }
            }
        });
    }
    
    handleBoundingBoxToggle(show) {
        const scene = this.viewer.sceneManager.scene;
        const existingBox = scene.getObjectByName('boundingBoxHelper');
        
        if (show) {
            if (!existingBox && this.viewer.brainModel && this.viewer.brainModel.model) {
                const box = new THREE.Box3().setFromObject(this.viewer.brainModel.model);
                const helper = new THREE.Box3Helper(box, 0xffff00);
                helper.name = 'boundingBoxHelper';
                scene.add(helper);
            }
        } else {
            if (existingBox) {
                scene.remove(existingBox);
            }
        }
    }
    
    // ===== Lighting Controls =====
    
    handleLightingPresetChange(preset) {
        if (!this.viewer.lightingManager) return;
        
        this.viewer.lightingManager.setLightingPreset(preset);
        
        // Update UI sliders to match preset
        const presets = {
            default: { ambient: 40, directional: 80, fill: 30, rim: 40 },
            bright: { ambient: 60, directional: 100, fill: 50, rim: 60 },
            dramatic: { ambient: 20, directional: 120, fill: 10, rim: 80 },
            medical: { ambient: 50, directional: 90, fill: 40, rim: 30 },
            soft: { ambient: 50, directional: 60, fill: 40, rim: 20 }
        };
        
        const values = presets[preset] || presets.default;
        this.elements.ambientIntensity.value = values.ambient;
        this.elements.directionalIntensity.value = values.directional;
        this.elements.fillIntensity.value = values.fill;
        this.elements.rimIntensity.value = values.rim;
        
        this.elements.ambientIntensityValue.textContent = `${values.ambient}%`;
        this.elements.directionalIntensityValue.textContent = `${values.directional}%`;
        this.elements.fillIntensityValue.textContent = `${values.fill}%`;
        this.elements.rimIntensityValue.textContent = `${values.rim}%`;
    }
    
    handleLightingChange() {
        if (!this.viewer.lightingManager) return;
        
        const ambient = parseFloat(this.elements.ambientIntensity.value) / 100;
        const directional = parseFloat(this.elements.directionalIntensity.value) / 100;
        const angleH = parseFloat(this.elements.lightAngleH.value) * Math.PI / 180;
        const angleV = parseFloat(this.elements.lightAngleV.value) * Math.PI / 180;
        const fill = parseFloat(this.elements.fillIntensity.value) / 100;
        const rim = parseFloat(this.elements.rimIntensity.value) / 100;
        const color = this.elements.lightColor.value;
        
        // Update displays
        this.elements.ambientIntensityValue.textContent = `${this.elements.ambientIntensity.value}%`;
        this.elements.directionalIntensityValue.textContent = `${this.elements.directionalIntensity.value}%`;
        this.elements.lightAngleHValue.textContent = `${this.elements.lightAngleH.value}°`;
        this.elements.lightAngleVValue.textContent = `${this.elements.lightAngleV.value}°`;
        this.elements.fillIntensityValue.textContent = `${this.elements.fillIntensity.value}%`;
        this.elements.rimIntensityValue.textContent = `${this.elements.rimIntensity.value}%`;
        
        // Apply to lighting manager
        this.viewer.lightingManager.setAmbientIntensity(ambient);
        this.viewer.lightingManager.setDirectionalIntensity(directional);
        this.viewer.lightingManager.setFillIntensity(fill);
        this.viewer.lightingManager.setRimIntensity(rim);
        this.viewer.lightingManager.setLightColor(color);
        
        // Calculate light position from angles
        const distance = 5;
        const x = distance * Math.cos(angleV) * Math.sin(angleH);
        const y = distance * Math.sin(angleV);
        const z = distance * Math.cos(angleV) * Math.cos(angleH);
        this.viewer.lightingManager.setDirectionalPosition(x, y, z);
    }
    
    // ===== Material Controls =====
    
    handleMaterialPresetChange(preset) {
        if (!this.viewer.brainModel || !this.viewer.brainModel.model) return;
        
        const presets = {
            original: null, // Will restore original materials
            standard: { color: 0xffccaa, roughness: 0.7, metalness: 0.1, opacity: 1 },
            glossy: { color: 0xffccaa, roughness: 0.2, metalness: 0.3, opacity: 1 },
            matte: { color: 0xffccaa, roughness: 0.9, metalness: 0, opacity: 1 },
            xray: { color: 0x44aaff, roughness: 0.3, metalness: 0, opacity: 0.6 },
            wireframe: { wireframe: true }
        };
        
        if (preset === 'original') {
            this.handleResetMaterial();
            return;
        }
        
        const settings = presets[preset];
        if (!settings) return;
        
        this.viewer.brainModel.model.traverse((child) => {
            if (child.isMesh) {
                if (settings.wireframe) {
                    child.material = new THREE.MeshBasicMaterial({
                        color: 0xffffff,
                        wireframe: true
                    });
                } else {
                    child.material = new THREE.MeshStandardMaterial({
                        color: settings.color,
                        roughness: settings.roughness,
                        metalness: settings.metalness,
                        transparent: settings.opacity < 1,
                        opacity: settings.opacity,
                        side: THREE.DoubleSide
                    });
                }
            }
        });
        
        // Update UI
        if (!settings.wireframe) {
            this.elements.materialColor.value = '#' + settings.color.toString(16).padStart(6, '0');
            this.elements.materialRoughness.value = settings.roughness * 100;
            this.elements.materialMetalness.value = settings.metalness * 100;
            this.elements.materialOpacity.value = settings.opacity * 100;
            
            this.elements.materialRoughnessValue.textContent = `${Math.round(settings.roughness * 100)}%`;
            this.elements.materialMetalnessValue.textContent = `${Math.round(settings.metalness * 100)}%`;
            this.elements.materialOpacityValue.textContent = `${Math.round(settings.opacity * 100)}%`;
        }
    }
    
    handleMaterialChange() {
        if (!this.viewer.brainModel || !this.viewer.brainModel.model) return;
        
        const color = this.elements.materialColor.value;
        const roughness = parseFloat(this.elements.materialRoughness.value) / 100;
        const metalness = parseFloat(this.elements.materialMetalness.value) / 100;
        const opacity = parseFloat(this.elements.materialOpacity.value) / 100;
        const doubleSided = this.elements.doubleSided.checked;
        const flatShading = this.elements.flatShading.checked;
        
        // Update displays
        this.elements.materialRoughnessValue.textContent = `${this.elements.materialRoughness.value}%`;
        this.elements.materialMetalnessValue.textContent = `${this.elements.materialMetalness.value}%`;
        this.elements.materialOpacityValue.textContent = `${this.elements.materialOpacity.value}%`;
        
        this.viewer.brainModel.model.traverse((child) => {
            if (child.isMesh && child.material && !child.material.wireframe) {
                child.material.color.set(color);
                child.material.roughness = roughness;
                child.material.metalness = metalness;
                child.material.opacity = opacity;
                child.material.transparent = opacity < 1;
                child.material.side = doubleSided ? THREE.DoubleSide : THREE.FrontSide;
                child.material.flatShading = flatShading;
                child.material.needsUpdate = true;
            }
        });
    }
    
    handleResetMaterial() {
        if (!this.viewer.brainModel || !this.viewer.brainModel.model) return;
        
        // Restore original materials
        this.viewer.brainModel.model.traverse((child) => {
            if (child.isMesh) {
                const originalMat = this.originalMaterials.get(child.uuid);
                if (originalMat) {
                    child.material = originalMat.clone();
                }
            }
        });
        
        // Reset UI
        this.elements.materialPreset.value = 'original';
        this.elements.materialColor.value = '#ffccaa';
        this.elements.materialRoughness.value = 70;
        this.elements.materialMetalness.value = 10;
        this.elements.materialOpacity.value = 100;
        this.elements.doubleSided.checked = true;
        this.elements.flatShading.checked = false;
        
        this.elements.materialRoughnessValue.textContent = '70%';
        this.elements.materialMetalnessValue.textContent = '10%';
        this.elements.materialOpacityValue.textContent = '100%';
    }
    
    // ===== Model Info =====
    
    updateModelInfo(brainModel, scaleInfo) {
        if (!this.elements.modelInfo) return;
        
        const size = brainModel.getSize();
        const sphere = brainModel.getBoundingSphere();
        
        const scaleFactor = 150 / Math.max(size.x, size.y, size.z);
        
        this.elements.modelInfo.innerHTML = `
            <p><span class="label">Dimensions:</span></p>
            <p><span class="value">${(size.x * scaleFactor).toFixed(1)} × ${(size.y * scaleFactor).toFixed(1)} × ${(size.z * scaleFactor).toFixed(1)} mm</span></p>
            <p><span class="label">Grid spacing:</span></p>
            <p><span class="value">${(scaleInfo.mmPerDivision * scaleFactor).toFixed(1)} mm</span></p>
            <p><span class="label">Volume (approx):</span></p>
            <p><span class="value">${((4/3) * Math.PI * Math.pow(sphere.radius * scaleFactor / 2, 3) / 1000).toFixed(0)} cm³</span></p>
        `;
    }
    
    syncWithCamera() {
        if (!this.viewer.sceneManager) return;
        
        const camera = this.viewer.sceneManager.camera;
        const distance = camera.position.length();
        const zoomPercent = Math.round(this.baseDistance / distance * 100);
        
        this.elements.zoom.value = Math.max(10, Math.min(200, zoomPercent));
        this.elements.zoomValue.textContent = `${this.elements.zoom.value}%`;
    }
}
