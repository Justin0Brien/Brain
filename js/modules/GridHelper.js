/**
 * GridHelper - Manages axis lines and plane grids
 * 
 * Creates XY, XZ, YZ plane grids and axis indicators with millimeter scale.
 * All grids can be toggled independently.
 */

import * as THREE from 'three';

export class GridHelper {
    constructor(scene) {
        this.scene = scene;
        
        // Grid containers
        this.grids = {
            xy: null,
            xz: null,
            yz: null
        };
        
        // Axis helper
        this.axesHelper = null;
        this.axisLabels = [];
        
        // Scale configuration (in millimeters)
        this.gridSize = 200;      // 200mm total size
        this.gridDivisions = 20;  // 10mm per division
        this.mmPerUnit = 1;       // 1 unit = 1mm (will be adjusted based on model)
        
        // Colors
        this.colors = {
            xy: 0x4444ff,  // Blue for XY (coronal)
            xz: 0x44ff44,  // Green for XZ (axial)
            yz: 0xff4444,  // Red for YZ (sagittal)
            axes: {
                x: 0xff0000,  // Red
                y: 0x00ff00,  // Green
                z: 0x0000ff   // Blue
            }
        };
    }
    
    /**
     * Initialize grids based on model size
     * @param {number} modelSize - The size of the model to scale grids to
     */
    init(modelSize) {
        // Calculate grid parameters based on model size
        // Assume model is in arbitrary units, scale to show as millimeters
        this.gridSize = modelSize * 2;
        this.gridDivisions = 20;
        
        // Create all grids
        this.createAxes();
        this.createXYGrid();
        this.createXZGrid();
        this.createYZGrid();
        
        // Set default visibility
        this.setAxesVisible(true);
        this.setXYGridVisible(false);
        this.setXZGridVisible(true);
        this.setYZGridVisible(false);
    }
    
    /**
     * Create the main axes with labels
     */
    createAxes() {
        const axisLength = this.gridSize / 2;
        
        // Create axes group
        this.axesHelper = new THREE.Group();
        this.axesHelper.name = 'axesHelper';
        
        // Create axis lines
        const axisGeometry = new THREE.BufferGeometry();
        
        // X axis (red)
        const xAxis = this.createAxisLine(
            new THREE.Vector3(-axisLength, 0, 0),
            new THREE.Vector3(axisLength, 0, 0),
            this.colors.axes.x
        );
        this.axesHelper.add(xAxis);
        
        // Y axis (green)
        const yAxis = this.createAxisLine(
            new THREE.Vector3(0, -axisLength, 0),
            new THREE.Vector3(0, axisLength, 0),
            this.colors.axes.y
        );
        this.axesHelper.add(yAxis);
        
        // Z axis (blue)
        const zAxis = this.createAxisLine(
            new THREE.Vector3(0, 0, -axisLength),
            new THREE.Vector3(0, 0, axisLength),
            this.colors.axes.z
        );
        this.axesHelper.add(zAxis);
        
        // Add tick marks and labels
        this.addAxisTicks(this.axesHelper, axisLength);
        
        // Add arrow heads
        this.addArrowHead(this.axesHelper, 'x', axisLength, this.colors.axes.x);
        this.addArrowHead(this.axesHelper, 'y', axisLength, this.colors.axes.y);
        this.addArrowHead(this.axesHelper, 'z', axisLength, this.colors.axes.z);
        
        this.scene.add(this.axesHelper);
    }
    
    /**
     * Create a single axis line
     */
    createAxisLine(start, end, color) {
        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({ 
            color: color,
            linewidth: 2,
            transparent: true,
            opacity: 0.8
        });
        return new THREE.Line(geometry, material);
    }
    
    /**
     * Add tick marks along axes
     */
    addAxisTicks(group, length) {
        const tickSize = this.gridSize / 40;
        const tickInterval = this.gridSize / this.gridDivisions;
        
        // Create tick marks
        const tickMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        
        for (let i = -this.gridDivisions / 2; i <= this.gridDivisions / 2; i++) {
            const pos = i * tickInterval;
            if (Math.abs(pos) < 0.001) continue; // Skip origin
            
            // X axis ticks
            const xTickGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(pos, -tickSize, 0),
                new THREE.Vector3(pos, tickSize, 0)
            ]);
            group.add(new THREE.Line(xTickGeom, tickMaterial));
            
            // Y axis ticks
            const yTickGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-tickSize, pos, 0),
                new THREE.Vector3(tickSize, pos, 0)
            ]);
            group.add(new THREE.Line(yTickGeom, tickMaterial));
            
            // Z axis ticks
            const zTickGeom = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, -tickSize, pos),
                new THREE.Vector3(0, tickSize, pos)
            ]);
            group.add(new THREE.Line(zTickGeom, tickMaterial));
        }
    }
    
    /**
     * Add arrow head to axis
     */
    addArrowHead(group, axis, length, color) {
        const coneGeometry = new THREE.ConeGeometry(this.gridSize / 50, this.gridSize / 20, 8);
        const coneMaterial = new THREE.MeshBasicMaterial({ color: color });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        
        switch (axis) {
            case 'x':
                cone.position.set(length, 0, 0);
                cone.rotation.z = -Math.PI / 2;
                break;
            case 'y':
                cone.position.set(0, length, 0);
                break;
            case 'z':
                cone.position.set(0, 0, length);
                cone.rotation.x = Math.PI / 2;
                break;
        }
        
        group.add(cone);
    }
    
    /**
     * Create XY plane grid (coronal view - front/back)
     */
    createXYGrid() {
        this.grids.xy = this.createPlaneGrid(this.colors.xy, 'xy');
        this.grids.xy.name = 'gridXY';
        // Position behind the model
        this.grids.xy.position.z = -this.gridSize / 4;
        this.scene.add(this.grids.xy);
    }
    
    /**
     * Create XZ plane grid (axial view - top/bottom)
     */
    createXZGrid() {
        this.grids.xz = this.createPlaneGrid(this.colors.xz, 'xz');
        this.grids.xz.name = 'gridXZ';
        this.grids.xz.rotation.x = Math.PI / 2;
        // Position below the model
        this.grids.xz.position.y = -this.gridSize / 4;
        this.scene.add(this.grids.xz);
    }
    
    /**
     * Create YZ plane grid (sagittal view - left/right)
     */
    createYZGrid() {
        this.grids.yz = this.createPlaneGrid(this.colors.yz, 'yz');
        this.grids.yz.name = 'gridYZ';
        this.grids.yz.rotation.y = Math.PI / 2;
        // Position to the left of the model
        this.grids.yz.position.x = -this.gridSize / 4;
        this.scene.add(this.grids.yz);
    }
    
    /**
     * Create a plane grid with the given color
     */
    createPlaneGrid(color, plane) {
        const group = new THREE.Group();
        
        // Create main grid
        const gridHelper = new THREE.GridHelper(
            this.gridSize, 
            this.gridDivisions,
            color,
            color
        );
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        
        // Rotate for XY plane (GridHelper creates XZ by default)
        if (plane === 'xy' || plane === 'yz') {
            gridHelper.rotation.x = Math.PI / 2;
        }
        
        group.add(gridHelper);
        
        // Add subdivisions (finer grid)
        const subGridHelper = new THREE.GridHelper(
            this.gridSize,
            this.gridDivisions * 5,
            color,
            color
        );
        subGridHelper.material.transparent = true;
        subGridHelper.material.opacity = 0.1;
        
        if (plane === 'xy' || plane === 'yz') {
            subGridHelper.rotation.x = Math.PI / 2;
        }
        
        group.add(subGridHelper);
        
        return group;
    }
    
    /**
     * Get scale info in millimeters
     */
    getScaleInfo(modelSize) {
        const mmPerDivision = (modelSize * 2 / this.gridDivisions);
        return {
            totalSize: modelSize * 2,
            divisions: this.gridDivisions,
            mmPerDivision: mmPerDivision,
            unitLabel: 'mm'
        };
    }
    
    // Visibility controls
    
    setAxesVisible(visible) {
        if (this.axesHelper) {
            this.axesHelper.visible = visible;
        }
    }
    
    setXYGridVisible(visible) {
        if (this.grids.xy) {
            this.grids.xy.visible = visible;
        }
    }
    
    setXZGridVisible(visible) {
        if (this.grids.xz) {
            this.grids.xz.visible = visible;
        }
    }
    
    setYZGridVisible(visible) {
        if (this.grids.yz) {
            this.grids.yz.visible = visible;
        }
    }
    
    /**
     * Update grid positions based on new model size
     */
    updateForModelSize(modelSize) {
        // Remove existing grids
        this.dispose();
        
        // Recreate with new size
        this.gridSize = modelSize * 2;
        this.createAxes();
        this.createXYGrid();
        this.createXZGrid();
        this.createYZGrid();
    }
    
    /**
     * Clean up resources
     */
    dispose() {
        if (this.axesHelper) {
            this.scene.remove(this.axesHelper);
            this.axesHelper = null;
        }
        
        Object.keys(this.grids).forEach(key => {
            if (this.grids[key]) {
                this.scene.remove(this.grids[key]);
                this.grids[key] = null;
            }
        });
    }
}
