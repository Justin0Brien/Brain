/**
 * UIController - Manages UI controls and their interactions with the 3D scene
 * 
 * Handles all UI events and updates the appropriate scene components.
 */

export class UIController {
    constructor(brainViewer) {
        this.viewer = brainViewer;
        this.elements = {};
        this.baseDistance = 5; // Will be set based on model
        
        this.initElements();
        this.initEventListeners();
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
        
        // Value displays
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
        
        // Display options
        this.elements.showAxes = document.getElementById('show-axes');
        this.elements.showGridXY = document.getElementById('show-grid-xy');
        this.elements.showGridXZ = document.getElementById('show-grid-xz');
        this.elements.showGridYZ = document.getElementById('show-grid-yz');
        this.elements.autoRotate = document.getElementById('auto-rotate');
        
        // Model info
        this.elements.modelInfo = document.getElementById('model-info');
    }
    
    initEventListeners() {
        // Camera rotation controls
        if (this.elements.rotationX) {
            this.elements.rotationX.addEventListener('input', (e) => this.handleRotationChange());
        }
        if (this.elements.rotationY) {
            this.elements.rotationY.addEventListener('input', (e) => this.handleRotationChange());
        }
        if (this.elements.rotationZ) {
            this.elements.rotationZ.addEventListener('input', (e) => this.handleRotationChange());
        }
        
        // Zoom control
        if (this.elements.zoom) {
            this.elements.zoom.addEventListener('input', (e) => this.handleZoomChange());
        }
        
        // Pan controls
        if (this.elements.panX) {
            this.elements.panX.addEventListener('input', (e) => this.handlePanChange());
        }
        if (this.elements.panY) {
            this.elements.panY.addEventListener('input', (e) => this.handlePanChange());
        }
        
        // Reset camera
        if (this.elements.resetCamera) {
            this.elements.resetCamera.addEventListener('click', () => this.handleResetCamera());
        }
        
        // View buttons
        if (this.elements.viewFront) {
            this.elements.viewFront.addEventListener('click', () => this.setView('front'));
        }
        if (this.elements.viewBack) {
            this.elements.viewBack.addEventListener('click', () => this.setView('back'));
        }
        if (this.elements.viewLeft) {
            this.elements.viewLeft.addEventListener('click', () => this.setView('left'));
        }
        if (this.elements.viewRight) {
            this.elements.viewRight.addEventListener('click', () => this.setView('right'));
        }
        if (this.elements.viewTop) {
            this.elements.viewTop.addEventListener('click', () => this.setView('top'));
        }
        if (this.elements.viewBottom) {
            this.elements.viewBottom.addEventListener('click', () => this.setView('bottom'));
        }
        
        // Display options
        if (this.elements.showAxes) {
            this.elements.showAxes.addEventListener('change', (e) => {
                if (this.viewer.gridHelper) {
                    this.viewer.gridHelper.setAxesVisible(e.target.checked);
                }
            });
        }
        if (this.elements.showGridXY) {
            this.elements.showGridXY.addEventListener('change', (e) => {
                if (this.viewer.gridHelper) {
                    this.viewer.gridHelper.setXYGridVisible(e.target.checked);
                }
            });
        }
        if (this.elements.showGridXZ) {
            this.elements.showGridXZ.addEventListener('change', (e) => {
                if (this.viewer.gridHelper) {
                    this.viewer.gridHelper.setXZGridVisible(e.target.checked);
                }
            });
        }
        if (this.elements.showGridYZ) {
            this.elements.showGridYZ.addEventListener('change', (e) => {
                if (this.viewer.gridHelper) {
                    this.viewer.gridHelper.setYZGridVisible(e.target.checked);
                }
            });
        }
        if (this.elements.autoRotate) {
            this.elements.autoRotate.addEventListener('change', (e) => {
                if (this.viewer.cameraController) {
                    this.viewer.cameraController.enableAutoRotate(e.target.checked);
                }
            });
        }
    }
    
    /**
     * Set the base distance for zoom calculations
     */
    setBaseDistance(distance) {
        this.baseDistance = distance;
    }
    
    /**
     * Handle rotation slider changes
     */
    handleRotationChange() {
        const rotX = parseFloat(this.elements.rotationX.value);
        const rotY = parseFloat(this.elements.rotationY.value);
        const rotZ = parseFloat(this.elements.rotationZ.value);
        
        // Update value displays
        this.elements.rotationXValue.textContent = `${rotX}°`;
        this.elements.rotationYValue.textContent = `${rotY}°`;
        this.elements.rotationZValue.textContent = `${rotZ}°`;
        
        // Apply rotation to the brain model
        if (this.viewer.brainModel && this.viewer.brainModel.model) {
            this.viewer.brainModel.model.rotation.x = rotX * Math.PI / 180;
            this.viewer.brainModel.model.rotation.y = rotY * Math.PI / 180;
            this.viewer.brainModel.model.rotation.z = rotZ * Math.PI / 180;
        }
    }
    
    /**
     * Handle zoom slider changes
     */
    handleZoomChange() {
        const zoomPercent = parseFloat(this.elements.zoom.value);
        this.elements.zoomValue.textContent = `${zoomPercent}%`;
        
        // Calculate distance based on zoom percentage
        // 100% = base distance, 10% = far, 200% = close
        const distance = this.baseDistance * (100 / zoomPercent);
        
        if (this.viewer.cameraController && this.viewer.sceneManager) {
            const camera = this.viewer.sceneManager.camera;
            const direction = camera.position.clone().normalize();
            camera.position.copy(direction.multiplyScalar(distance));
            this.viewer.cameraController.controls.update();
        }
    }
    
    /**
     * Handle pan slider changes
     */
    handlePanChange() {
        const panX = parseFloat(this.elements.panX.value) / 50;
        const panY = parseFloat(this.elements.panY.value) / 50;
        
        this.elements.panXValue.textContent = this.elements.panX.value;
        this.elements.panYValue.textContent = this.elements.panY.value;
        
        if (this.viewer.cameraController) {
            this.viewer.cameraController.setTarget({ x: panX, y: panY, z: 0 });
        }
    }
    
    /**
     * Reset camera to default view
     */
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
        
        // Reset camera
        this.viewer.setupOptimalView();
    }
    
    /**
     * Set a predefined view
     */
    setView(viewName) {
        if (!this.viewer.cameraController || !this.viewer.sceneManager) return;
        
        const camera = this.viewer.sceneManager.camera;
        const distance = this.baseDistance;
        
        // Reset model rotation first
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
    
    /**
     * Update model info display
     */
    updateModelInfo(brainModel, scaleInfo) {
        if (!this.elements.modelInfo) return;
        
        const size = brainModel.getSize();
        const sphere = brainModel.getBoundingSphere();
        
        // Estimate real-world dimensions (assuming average human brain ~150mm wide)
        // This is a rough approximation - in a real app, the model would have metadata
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
    
    /**
     * Sync UI sliders with current camera state
     */
    syncWithCamera() {
        if (!this.viewer.sceneManager) return;
        
        const camera = this.viewer.sceneManager.camera;
        const distance = camera.position.length();
        const zoomPercent = Math.round(this.baseDistance / distance * 100);
        
        this.elements.zoom.value = Math.max(10, Math.min(200, zoomPercent));
        this.elements.zoomValue.textContent = `${this.elements.zoom.value}%`;
    }
}
