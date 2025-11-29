/**
 * VolumeRenderer - Renders volumetric brain data with slice views and 3D surface
 * 
 * Features:
 * - Orthogonal slice views (axial, coronal, sagittal)
 * - 3D surface rendering using marching cubes
 * - Interactive slice navigation
 * - Intensity windowing (contrast adjustment)
 */

import * as THREE from 'three';

export class VolumeRenderer {
    constructor(scene, niftiLoader) {
        this.scene = scene;
        this.nifti = niftiLoader;
        
        // Slice planes
        this.slices = {
            axial: null,
            coronal: null,
            sagittal: null
        };
        
        // Slice positions (in voxel coordinates)
        this.sliceIndices = {
            axial: Math.floor(niftiLoader.dimensions.z / 2),
            coronal: Math.floor(niftiLoader.dimensions.y / 2),
            sagittal: Math.floor(niftiLoader.dimensions.x / 2)
        };
        
        // 3D surface mesh
        this.surfaceMesh = null;
        
        // Visibility toggles
        this.visibility = {
            axial: true,
            coronal: true,
            sagittal: true,
            surface: true
        };
        
        // Intensity windowing
        this.windowLevel = 0.5;
        this.windowWidth = 1.0;
        
        // Surface threshold (for isosurface extraction)
        this.surfaceThreshold = 0.3;
        
        // Group for all volume objects
        this.volumeGroup = new THREE.Group();
        this.volumeGroup.name = 'volumeRenderer';
        scene.add(this.volumeGroup);
        
        // Calculate scale to normalize volume to reasonable size
        const physSize = niftiLoader.getPhysicalSize();
        const maxDim = Math.max(physSize.x, physSize.y, physSize.z);
        this.scale = 4 / maxDim; // Normalize to ~4 units
        
        this.init();
    }
    
    init() {
        this.createSlicePlanes();
        this.updateAllSlices();
    }
    
    /**
     * Create the three orthogonal slice planes
     */
    createSlicePlanes() {
        const dims = this.nifti.dimensions;
        const voxSize = this.nifti.voxelSize;
        
        // Calculate physical dimensions
        const sizeX = dims.x * voxSize.x * this.scale;
        const sizeY = dims.y * voxSize.y * this.scale;
        const sizeZ = dims.z * voxSize.z * this.scale;
        
        // Center offset
        const cx = sizeX / 2;
        const cy = sizeY / 2;
        const cz = sizeZ / 2;
        
        // Axial slice (XY plane)
        const axialGeom = new THREE.PlaneGeometry(sizeX, sizeY);
        const axialMat = new THREE.MeshBasicMaterial({
            map: null,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        this.slices.axial = new THREE.Mesh(axialGeom, axialMat);
        this.slices.axial.name = 'axialSlice';
        this.slices.axial.rotation.x = 0;
        this.volumeGroup.add(this.slices.axial);
        
        // Coronal slice (XZ plane)
        const coronalGeom = new THREE.PlaneGeometry(sizeX, sizeZ);
        const coronalMat = new THREE.MeshBasicMaterial({
            map: null,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        this.slices.coronal = new THREE.Mesh(coronalGeom, coronalMat);
        this.slices.coronal.name = 'coronalSlice';
        this.slices.coronal.rotation.x = Math.PI / 2;
        this.volumeGroup.add(this.slices.coronal);
        
        // Sagittal slice (YZ plane)
        const sagittalGeom = new THREE.PlaneGeometry(sizeY, sizeZ);
        const sagittalMat = new THREE.MeshBasicMaterial({
            map: null,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        this.slices.sagittal = new THREE.Mesh(sagittalGeom, sagittalMat);
        this.slices.sagittal.name = 'sagittalSlice';
        this.slices.sagittal.rotation.y = Math.PI / 2;
        this.slices.sagittal.rotation.x = Math.PI / 2;
        this.volumeGroup.add(this.slices.sagittal);
        
        // Center the volume group
        this.volumeGroup.position.set(0, 0, 0);
    }
    
    /**
     * Update slice texture at given index
     */
    updateSlice(plane) {
        const index = this.sliceIndices[plane];
        const imageData = this.nifti.getSlice(plane, index);
        
        // Apply windowing
        const windowedData = this.applyWindowing(imageData);
        
        // Create canvas and texture
        const canvas = document.createElement('canvas');
        canvas.width = windowedData.width;
        canvas.height = windowedData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(windowedData, 0, 0);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        // Update material
        if (this.slices[plane].material.map) {
            this.slices[plane].material.map.dispose();
        }
        this.slices[plane].material.map = texture;
        this.slices[plane].material.needsUpdate = true;
        
        // Update position
        this.updateSlicePosition(plane);
    }
    
    /**
     * Update all slices
     */
    updateAllSlices() {
        this.updateSlice('axial');
        this.updateSlice('coronal');
        this.updateSlice('sagittal');
    }
    
    /**
     * Update slice position in 3D space
     */
    updateSlicePosition(plane) {
        const dims = this.nifti.dimensions;
        const voxSize = this.nifti.voxelSize;
        const index = this.sliceIndices[plane];
        
        // Calculate position in scaled coordinates, centered at origin
        const sizeX = dims.x * voxSize.x * this.scale;
        const sizeY = dims.y * voxSize.y * this.scale;
        const sizeZ = dims.z * voxSize.z * this.scale;
        
        switch (plane) {
            case 'axial':
                const zPos = (index / dims.z - 0.5) * sizeZ;
                this.slices.axial.position.set(0, 0, zPos);
                break;
            case 'coronal':
                const yPos = (index / dims.y - 0.5) * sizeY;
                this.slices.coronal.position.set(0, yPos, 0);
                break;
            case 'sagittal':
                const xPos = (index / dims.x - 0.5) * sizeX;
                this.slices.sagittal.position.set(xPos, 0, 0);
                break;
        }
    }
    
    /**
     * Apply intensity windowing to image data
     */
    applyWindowing(imageData) {
        const data = new Uint8ClampedArray(imageData.data);
        
        const center = this.windowLevel * 255;
        const width = this.windowWidth * 255;
        const min = center - width / 2;
        const max = center + width / 2;
        
        for (let i = 0; i < data.length; i += 4) {
            let val = data[i];
            // Apply window
            val = ((val - min) / (max - min)) * 255;
            val = Math.max(0, Math.min(255, val));
            
            data[i] = val;
            data[i + 1] = val;
            data[i + 2] = val;
        }
        
        return new ImageData(data, imageData.width, imageData.height);
    }
    
    /**
     * Set slice index for a given plane
     */
    setSliceIndex(plane, index) {
        const maxIndex = {
            axial: this.nifti.dimensions.z - 1,
            coronal: this.nifti.dimensions.y - 1,
            sagittal: this.nifti.dimensions.x - 1
        };
        
        this.sliceIndices[plane] = Math.max(0, Math.min(maxIndex[plane], index));
        this.updateSlice(plane);
    }
    
    /**
     * Set visibility of a component
     */
    setVisibility(component, visible) {
        this.visibility[component] = visible;
        
        if (component === 'surface' && this.surfaceMesh) {
            this.surfaceMesh.visible = visible;
        } else if (this.slices[component]) {
            this.slices[component].visible = visible;
        }
    }
    
    /**
     * Set window level and width for contrast adjustment
     */
    setWindowing(level, width) {
        this.windowLevel = level;
        this.windowWidth = width;
        this.updateAllSlices();
    }
    
    /**
     * Generate 3D surface using marching cubes algorithm
     */
    async generateSurface(threshold = null, onProgress = null) {
        if (threshold !== null) {
            this.surfaceThreshold = threshold;
        }
        
        console.log(`Generating surface at threshold: ${this.surfaceThreshold}`);
        
        // Remove existing surface
        if (this.surfaceMesh) {
            this.volumeGroup.remove(this.surfaceMesh);
            this.surfaceMesh.geometry.dispose();
            this.surfaceMesh.material.dispose();
            this.surfaceMesh = null;
        }
        
        // Run marching cubes in chunks to avoid blocking
        const geometry = await this.marchingCubes(onProgress);
        
        if (geometry.attributes.position.count > 0) {
            geometry.computeVertexNormals();
            
            const material = new THREE.MeshPhongMaterial({
                color: 0xffccaa,
                specular: 0x222222,
                shininess: 25,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.85
            });
            
            this.surfaceMesh = new THREE.Mesh(geometry, material);
            this.surfaceMesh.name = 'brainSurface';
            this.surfaceMesh.visible = this.visibility.surface;
            this.volumeGroup.add(this.surfaceMesh);
            
            console.log(`Surface generated: ${geometry.attributes.position.count / 3} triangles`);
        }
        
        return this.surfaceMesh;
    }
    
    /**
     * Marching cubes implementation for isosurface extraction
     */
    async marchingCubes(onProgress) {
        const dims = this.nifti.dimensions;
        const voxSize = this.nifti.voxelSize;
        const threshold = this.surfaceThreshold;
        
        // Downsample for performance (every 2nd voxel)
        const step = 2;
        
        // Marching cubes lookup tables
        const edgeTable = this.getEdgeTable();
        const triTable = this.getTriTable();
        
        const vertices = [];
        const normals = [];
        
        // Process in chunks
        const totalSlices = Math.floor((dims.z - 1) / step);
        let processedSlices = 0;
        
        for (let z = 0; z < dims.z - 1; z += step) {
            for (let y = 0; y < dims.y - 1; y += step) {
                for (let x = 0; x < dims.x - 1; x += step) {
                    // Get corner values
                    const cubeValues = [
                        this.nifti.getNormalizedVoxel(x, y, z),
                        this.nifti.getNormalizedVoxel(x + step, y, z),
                        this.nifti.getNormalizedVoxel(x + step, y + step, z),
                        this.nifti.getNormalizedVoxel(x, y + step, z),
                        this.nifti.getNormalizedVoxel(x, y, z + step),
                        this.nifti.getNormalizedVoxel(x + step, y, z + step),
                        this.nifti.getNormalizedVoxel(x + step, y + step, z + step),
                        this.nifti.getNormalizedVoxel(x, y + step, z + step)
                    ];
                    
                    // Calculate cube index
                    let cubeIndex = 0;
                    for (let i = 0; i < 8; i++) {
                        if (cubeValues[i] > threshold) {
                            cubeIndex |= (1 << i);
                        }
                    }
                    
                    // Skip if entirely inside or outside
                    if (edgeTable[cubeIndex] === 0) continue;
                    
                    // Get corner positions in world coordinates
                    const cornerPositions = this.getCubeCorners(x, y, z, step);
                    
                    // Interpolate vertices on edges
                    const edgeVertices = new Array(12).fill(null);
                    
                    if (edgeTable[cubeIndex] & 1) edgeVertices[0] = this.interpolateEdge(cornerPositions[0], cornerPositions[1], cubeValues[0], cubeValues[1], threshold);
                    if (edgeTable[cubeIndex] & 2) edgeVertices[1] = this.interpolateEdge(cornerPositions[1], cornerPositions[2], cubeValues[1], cubeValues[2], threshold);
                    if (edgeTable[cubeIndex] & 4) edgeVertices[2] = this.interpolateEdge(cornerPositions[2], cornerPositions[3], cubeValues[2], cubeValues[3], threshold);
                    if (edgeTable[cubeIndex] & 8) edgeVertices[3] = this.interpolateEdge(cornerPositions[3], cornerPositions[0], cubeValues[3], cubeValues[0], threshold);
                    if (edgeTable[cubeIndex] & 16) edgeVertices[4] = this.interpolateEdge(cornerPositions[4], cornerPositions[5], cubeValues[4], cubeValues[5], threshold);
                    if (edgeTable[cubeIndex] & 32) edgeVertices[5] = this.interpolateEdge(cornerPositions[5], cornerPositions[6], cubeValues[5], cubeValues[6], threshold);
                    if (edgeTable[cubeIndex] & 64) edgeVertices[6] = this.interpolateEdge(cornerPositions[6], cornerPositions[7], cubeValues[6], cubeValues[7], threshold);
                    if (edgeTable[cubeIndex] & 128) edgeVertices[7] = this.interpolateEdge(cornerPositions[7], cornerPositions[4], cubeValues[7], cubeValues[4], threshold);
                    if (edgeTable[cubeIndex] & 256) edgeVertices[8] = this.interpolateEdge(cornerPositions[0], cornerPositions[4], cubeValues[0], cubeValues[4], threshold);
                    if (edgeTable[cubeIndex] & 512) edgeVertices[9] = this.interpolateEdge(cornerPositions[1], cornerPositions[5], cubeValues[1], cubeValues[5], threshold);
                    if (edgeTable[cubeIndex] & 1024) edgeVertices[10] = this.interpolateEdge(cornerPositions[2], cornerPositions[6], cubeValues[2], cubeValues[6], threshold);
                    if (edgeTable[cubeIndex] & 2048) edgeVertices[11] = this.interpolateEdge(cornerPositions[3], cornerPositions[7], cubeValues[3], cubeValues[7], threshold);
                    
                    // Create triangles
                    const triangles = triTable[cubeIndex];
                    for (let i = 0; triangles[i] !== -1; i += 3) {
                        const v0 = edgeVertices[triangles[i]];
                        const v1 = edgeVertices[triangles[i + 1]];
                        const v2 = edgeVertices[triangles[i + 2]];
                        
                        if (v0 && v1 && v2) {
                            vertices.push(v0.x, v0.y, v0.z);
                            vertices.push(v1.x, v1.y, v1.z);
                            vertices.push(v2.x, v2.y, v2.z);
                        }
                    }
                }
            }
            
            // Report progress and yield
            processedSlices++;
            if (onProgress && processedSlices % 10 === 0) {
                onProgress(processedSlices / totalSlices);
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        
        return geometry;
    }
    
    /**
     * Get cube corner positions
     */
    getCubeCorners(x, y, z, step) {
        const voxSize = this.nifti.voxelSize;
        const dims = this.nifti.dimensions;
        
        // Convert to world coordinates, centered at origin
        const toWorld = (vx, vy, vz) => ({
            x: ((vx / dims.x) - 0.5) * dims.x * voxSize.x * this.scale,
            y: ((vy / dims.y) - 0.5) * dims.y * voxSize.y * this.scale,
            z: ((vz / dims.z) - 0.5) * dims.z * voxSize.z * this.scale
        });
        
        return [
            toWorld(x, y, z),
            toWorld(x + step, y, z),
            toWorld(x + step, y + step, z),
            toWorld(x, y + step, z),
            toWorld(x, y, z + step),
            toWorld(x + step, y, z + step),
            toWorld(x + step, y + step, z + step),
            toWorld(x, y + step, z + step)
        ];
    }
    
    /**
     * Interpolate vertex position on edge
     */
    interpolateEdge(p1, p2, v1, v2, threshold) {
        if (Math.abs(threshold - v1) < 0.00001) return p1;
        if (Math.abs(threshold - v2) < 0.00001) return p2;
        if (Math.abs(v1 - v2) < 0.00001) return p1;
        
        const t = (threshold - v1) / (v2 - v1);
        
        return {
            x: p1.x + t * (p2.x - p1.x),
            y: p1.y + t * (p2.y - p1.y),
            z: p1.z + t * (p2.z - p1.z)
        };
    }
    
    /**
     * Get marching cubes edge table
     */
    getEdgeTable() {
        return [
            0x0, 0x109, 0x203, 0x30a, 0x406, 0x50f, 0x605, 0x70c,
            0x80c, 0x905, 0xa0f, 0xb06, 0xc0a, 0xd03, 0xe09, 0xf00,
            0x190, 0x99, 0x393, 0x29a, 0x596, 0x49f, 0x795, 0x69c,
            0x99c, 0x895, 0xb9f, 0xa96, 0xd9a, 0xc93, 0xf99, 0xe90,
            0x230, 0x339, 0x33, 0x13a, 0x636, 0x73f, 0x435, 0x53c,
            0xa3c, 0xb35, 0x83f, 0x936, 0xe3a, 0xf33, 0xc39, 0xd30,
            0x3a0, 0x2a9, 0x1a3, 0xaa, 0x7a6, 0x6af, 0x5a5, 0x4ac,
            0xbac, 0xaa5, 0x9af, 0x8a6, 0xfaa, 0xea3, 0xda9, 0xca0,
            0x460, 0x569, 0x663, 0x76a, 0x66, 0x16f, 0x265, 0x36c,
            0xc6c, 0xd65, 0xe6f, 0xf66, 0x86a, 0x963, 0xa69, 0xb60,
            0x5f0, 0x4f9, 0x7f3, 0x6fa, 0x1f6, 0xff, 0x3f5, 0x2fc,
            0xdfc, 0xcf5, 0xfff, 0xef6, 0x9fa, 0x8f3, 0xbf9, 0xaf0,
            0x650, 0x759, 0x453, 0x55a, 0x256, 0x35f, 0x55, 0x15c,
            0xe5c, 0xf55, 0xc5f, 0xd56, 0xa5a, 0xb53, 0x859, 0x950,
            0x7c0, 0x6c9, 0x5c3, 0x4ca, 0x3c6, 0x2cf, 0x1c5, 0xcc,
            0xfcc, 0xec5, 0xdcf, 0xcc6, 0xbca, 0xac3, 0x9c9, 0x8c0,
            0x8c0, 0x9c9, 0xac3, 0xbca, 0xcc6, 0xdcf, 0xec5, 0xfcc,
            0xcc, 0x1c5, 0x2cf, 0x3c6, 0x4ca, 0x5c3, 0x6c9, 0x7c0,
            0x950, 0x859, 0xb53, 0xa5a, 0xd56, 0xc5f, 0xf55, 0xe5c,
            0x15c, 0x55, 0x35f, 0x256, 0x55a, 0x453, 0x759, 0x650,
            0xaf0, 0xbf9, 0x8f3, 0x9fa, 0xef6, 0xfff, 0xcf5, 0xdfc,
            0x2fc, 0x3f5, 0xff, 0x1f6, 0x6fa, 0x7f3, 0x4f9, 0x5f0,
            0xb60, 0xa69, 0x963, 0x86a, 0xf66, 0xe6f, 0xd65, 0xc6c,
            0x36c, 0x265, 0x16f, 0x66, 0x76a, 0x663, 0x569, 0x460,
            0xca0, 0xda9, 0xea3, 0xfaa, 0x8a6, 0x9af, 0xaa5, 0xbac,
            0x4ac, 0x5a5, 0x6af, 0x7a6, 0xaa, 0x1a3, 0x2a9, 0x3a0,
            0xd30, 0xc39, 0xf33, 0xe3a, 0x936, 0x83f, 0xb35, 0xa3c,
            0x53c, 0x435, 0x73f, 0x636, 0x13a, 0x33, 0x339, 0x230,
            0xe90, 0xf99, 0xc93, 0xd9a, 0xa96, 0xb9f, 0x895, 0x99c,
            0x69c, 0x795, 0x49f, 0x596, 0x29a, 0x393, 0x99, 0x190,
            0xf00, 0xe09, 0xd03, 0xc0a, 0xb06, 0xa0f, 0x905, 0x80c,
            0x70c, 0x605, 0x50f, 0x406, 0x30a, 0x203, 0x109, 0x0
        ];
    }
    
    /**
     * Get marching cubes triangle table (truncated for brevity, full table needed)
     */
    getTriTable() {
        // Full marching cubes triangle table - 256 entries, each with up to 16 values
        // This is a standard lookup table for the algorithm
        return [
            [-1],
            [0, 8, 3, -1],
            [0, 1, 9, -1],
            [1, 8, 3, 9, 8, 1, -1],
            [1, 2, 10, -1],
            [0, 8, 3, 1, 2, 10, -1],
            [9, 2, 10, 0, 2, 9, -1],
            [2, 8, 3, 2, 10, 8, 10, 9, 8, -1],
            [3, 11, 2, -1],
            [0, 11, 2, 8, 11, 0, -1],
            [1, 9, 0, 2, 3, 11, -1],
            [1, 11, 2, 1, 9, 11, 9, 8, 11, -1],
            [3, 10, 1, 11, 10, 3, -1],
            [0, 10, 1, 0, 8, 10, 8, 11, 10, -1],
            [3, 9, 0, 3, 11, 9, 11, 10, 9, -1],
            [9, 8, 10, 10, 8, 11, -1],
            [4, 7, 8, -1],
            [4, 3, 0, 7, 3, 4, -1],
            [0, 1, 9, 8, 4, 7, -1],
            [4, 1, 9, 4, 7, 1, 7, 3, 1, -1],
            [1, 2, 10, 8, 4, 7, -1],
            [3, 4, 7, 3, 0, 4, 1, 2, 10, -1],
            [9, 2, 10, 9, 0, 2, 8, 4, 7, -1],
            [2, 10, 9, 2, 9, 7, 2, 7, 3, 7, 9, 4, -1],
            [8, 4, 7, 3, 11, 2, -1],
            [11, 4, 7, 11, 2, 4, 2, 0, 4, -1],
            [9, 0, 1, 8, 4, 7, 2, 3, 11, -1],
            [4, 7, 11, 9, 4, 11, 9, 11, 2, 9, 2, 1, -1],
            [3, 10, 1, 3, 11, 10, 7, 8, 4, -1],
            [1, 11, 10, 1, 4, 11, 1, 0, 4, 7, 11, 4, -1],
            [4, 7, 8, 9, 0, 11, 9, 11, 10, 11, 0, 3, -1],
            [4, 7, 11, 4, 11, 9, 9, 11, 10, -1],
            [9, 5, 4, -1],
            [9, 5, 4, 0, 8, 3, -1],
            [0, 5, 4, 1, 5, 0, -1],
            [8, 5, 4, 8, 3, 5, 3, 1, 5, -1],
            [1, 2, 10, 9, 5, 4, -1],
            [3, 0, 8, 1, 2, 10, 4, 9, 5, -1],
            [5, 2, 10, 5, 4, 2, 4, 0, 2, -1],
            [2, 10, 5, 3, 2, 5, 3, 5, 4, 3, 4, 8, -1],
            [9, 5, 4, 2, 3, 11, -1],
            [0, 11, 2, 0, 8, 11, 4, 9, 5, -1],
            [0, 5, 4, 0, 1, 5, 2, 3, 11, -1],
            [2, 1, 5, 2, 5, 8, 2, 8, 11, 4, 8, 5, -1],
            [10, 3, 11, 10, 1, 3, 9, 5, 4, -1],
            [4, 9, 5, 0, 8, 1, 8, 10, 1, 8, 11, 10, -1],
            [5, 4, 0, 5, 0, 11, 5, 11, 10, 11, 0, 3, -1],
            [5, 4, 8, 5, 8, 10, 10, 8, 11, -1],
            [9, 7, 8, 5, 7, 9, -1],
            [9, 3, 0, 9, 5, 3, 5, 7, 3, -1],
            [0, 7, 8, 0, 1, 7, 1, 5, 7, -1],
            [1, 5, 3, 3, 5, 7, -1],
            [9, 7, 8, 9, 5, 7, 10, 1, 2, -1],
            [10, 1, 2, 9, 5, 0, 5, 3, 0, 5, 7, 3, -1],
            [8, 0, 2, 8, 2, 5, 8, 5, 7, 10, 5, 2, -1],
            [2, 10, 5, 2, 5, 3, 3, 5, 7, -1],
            [7, 9, 5, 7, 8, 9, 3, 11, 2, -1],
            [9, 5, 7, 9, 7, 2, 9, 2, 0, 2, 7, 11, -1],
            [2, 3, 11, 0, 1, 8, 1, 7, 8, 1, 5, 7, -1],
            [11, 2, 1, 11, 1, 7, 7, 1, 5, -1],
            [9, 5, 8, 8, 5, 7, 10, 1, 3, 10, 3, 11, -1],
            [5, 7, 0, 5, 0, 9, 7, 11, 0, 1, 0, 10, 11, 10, 0, -1],
            [11, 10, 0, 11, 0, 3, 10, 5, 0, 8, 0, 7, 5, 7, 0, -1],
            [11, 10, 5, 7, 11, 5, -1],
            [10, 6, 5, -1],
            [0, 8, 3, 5, 10, 6, -1],
            [9, 0, 1, 5, 10, 6, -1],
            [1, 8, 3, 1, 9, 8, 5, 10, 6, -1],
            [1, 6, 5, 2, 6, 1, -1],
            [1, 6, 5, 1, 2, 6, 3, 0, 8, -1],
            [9, 6, 5, 9, 0, 6, 0, 2, 6, -1],
            [5, 9, 8, 5, 8, 2, 5, 2, 6, 3, 2, 8, -1],
            [2, 3, 11, 10, 6, 5, -1],
            [11, 0, 8, 11, 2, 0, 10, 6, 5, -1],
            [0, 1, 9, 2, 3, 11, 5, 10, 6, -1],
            [5, 10, 6, 1, 9, 2, 9, 11, 2, 9, 8, 11, -1],
            [6, 3, 11, 6, 5, 3, 5, 1, 3, -1],
            [0, 8, 11, 0, 11, 5, 0, 5, 1, 5, 11, 6, -1],
            [3, 11, 6, 0, 3, 6, 0, 6, 5, 0, 5, 9, -1],
            [6, 5, 9, 6, 9, 11, 11, 9, 8, -1],
            [5, 10, 6, 4, 7, 8, -1],
            [4, 3, 0, 4, 7, 3, 6, 5, 10, -1],
            [1, 9, 0, 5, 10, 6, 8, 4, 7, -1],
            [10, 6, 5, 1, 9, 7, 1, 7, 3, 7, 9, 4, -1],
            [6, 1, 2, 6, 5, 1, 4, 7, 8, -1],
            [1, 2, 5, 5, 2, 6, 3, 0, 4, 3, 4, 7, -1],
            [8, 4, 7, 9, 0, 5, 0, 6, 5, 0, 2, 6, -1],
            [7, 3, 9, 7, 9, 4, 3, 2, 9, 5, 9, 6, 2, 6, 9, -1],
            [3, 11, 2, 7, 8, 4, 10, 6, 5, -1],
            [5, 10, 6, 4, 7, 2, 4, 2, 0, 2, 7, 11, -1],
            [0, 1, 9, 4, 7, 8, 2, 3, 11, 5, 10, 6, -1],
            [9, 2, 1, 9, 11, 2, 9, 4, 11, 7, 11, 4, 5, 10, 6, -1],
            [8, 4, 7, 3, 11, 5, 3, 5, 1, 5, 11, 6, -1],
            [5, 1, 11, 5, 11, 6, 1, 0, 11, 7, 11, 4, 0, 4, 11, -1],
            [0, 5, 9, 0, 6, 5, 0, 3, 6, 11, 6, 3, 8, 4, 7, -1],
            [6, 5, 9, 6, 9, 11, 4, 7, 9, 7, 11, 9, -1],
            [10, 4, 9, 6, 4, 10, -1],
            [4, 10, 6, 4, 9, 10, 0, 8, 3, -1],
            [10, 0, 1, 10, 6, 0, 6, 4, 0, -1],
            [8, 3, 1, 8, 1, 6, 8, 6, 4, 6, 1, 10, -1],
            [1, 4, 9, 1, 2, 4, 2, 6, 4, -1],
            [3, 0, 8, 1, 2, 9, 2, 4, 9, 2, 6, 4, -1],
            [0, 2, 4, 4, 2, 6, -1],
            [8, 3, 2, 8, 2, 4, 4, 2, 6, -1],
            [10, 4, 9, 10, 6, 4, 11, 2, 3, -1],
            [0, 8, 2, 2, 8, 11, 4, 9, 10, 4, 10, 6, -1],
            [3, 11, 2, 0, 1, 6, 0, 6, 4, 6, 1, 10, -1],
            [6, 4, 1, 6, 1, 10, 4, 8, 1, 2, 1, 11, 8, 11, 1, -1],
            [9, 6, 4, 9, 3, 6, 9, 1, 3, 11, 6, 3, -1],
            [8, 11, 1, 8, 1, 0, 11, 6, 1, 9, 1, 4, 6, 4, 1, -1],
            [3, 11, 6, 3, 6, 0, 0, 6, 4, -1],
            [6, 4, 8, 11, 6, 8, -1],
            [7, 10, 6, 7, 8, 10, 8, 9, 10, -1],
            [0, 7, 3, 0, 10, 7, 0, 9, 10, 6, 7, 10, -1],
            [10, 6, 7, 1, 10, 7, 1, 7, 8, 1, 8, 0, -1],
            [10, 6, 7, 10, 7, 1, 1, 7, 3, -1],
            [1, 2, 6, 1, 6, 8, 1, 8, 9, 8, 6, 7, -1],
            [2, 6, 9, 2, 9, 1, 6, 7, 9, 0, 9, 3, 7, 3, 9, -1],
            [7, 8, 0, 7, 0, 6, 6, 0, 2, -1],
            [7, 3, 2, 6, 7, 2, -1],
            [2, 3, 11, 10, 6, 8, 10, 8, 9, 8, 6, 7, -1],
            [2, 0, 7, 2, 7, 11, 0, 9, 7, 6, 7, 10, 9, 10, 7, -1],
            [1, 8, 0, 1, 7, 8, 1, 10, 7, 6, 7, 10, 2, 3, 11, -1],
            [11, 2, 1, 11, 1, 7, 10, 6, 1, 6, 7, 1, -1],
            [8, 9, 6, 8, 6, 7, 9, 1, 6, 11, 6, 3, 1, 3, 6, -1],
            [0, 9, 1, 11, 6, 7, -1],
            [7, 8, 0, 7, 0, 6, 3, 11, 0, 11, 6, 0, -1],
            [7, 11, 6, -1],
            [7, 6, 11, -1],
            [3, 0, 8, 11, 7, 6, -1],
            [0, 1, 9, 11, 7, 6, -1],
            [8, 1, 9, 8, 3, 1, 11, 7, 6, -1],
            [10, 1, 2, 6, 11, 7, -1],
            [1, 2, 10, 3, 0, 8, 6, 11, 7, -1],
            [2, 9, 0, 2, 10, 9, 6, 11, 7, -1],
            [6, 11, 7, 2, 10, 3, 10, 8, 3, 10, 9, 8, -1],
            [7, 2, 3, 6, 2, 7, -1],
            [7, 0, 8, 7, 6, 0, 6, 2, 0, -1],
            [2, 7, 6, 2, 3, 7, 0, 1, 9, -1],
            [1, 6, 2, 1, 8, 6, 1, 9, 8, 8, 7, 6, -1],
            [10, 7, 6, 10, 1, 7, 1, 3, 7, -1],
            [10, 7, 6, 1, 7, 10, 1, 8, 7, 1, 0, 8, -1],
            [0, 3, 7, 0, 7, 10, 0, 10, 9, 6, 10, 7, -1],
            [7, 6, 10, 7, 10, 8, 8, 10, 9, -1],
            [6, 8, 4, 11, 8, 6, -1],
            [3, 6, 11, 3, 0, 6, 0, 4, 6, -1],
            [8, 6, 11, 8, 4, 6, 9, 0, 1, -1],
            [9, 4, 6, 9, 6, 3, 9, 3, 1, 11, 3, 6, -1],
            [6, 8, 4, 6, 11, 8, 2, 10, 1, -1],
            [1, 2, 10, 3, 0, 11, 0, 6, 11, 0, 4, 6, -1],
            [4, 11, 8, 4, 6, 11, 0, 2, 9, 2, 10, 9, -1],
            [10, 9, 3, 10, 3, 2, 9, 4, 3, 11, 3, 6, 4, 6, 3, -1],
            [8, 2, 3, 8, 4, 2, 4, 6, 2, -1],
            [0, 4, 2, 4, 6, 2, -1],
            [1, 9, 0, 2, 3, 4, 2, 4, 6, 4, 3, 8, -1],
            [1, 9, 4, 1, 4, 2, 2, 4, 6, -1],
            [8, 1, 3, 8, 6, 1, 8, 4, 6, 6, 10, 1, -1],
            [10, 1, 0, 10, 0, 6, 6, 0, 4, -1],
            [4, 6, 3, 4, 3, 8, 6, 10, 3, 0, 3, 9, 10, 9, 3, -1],
            [10, 9, 4, 6, 10, 4, -1],
            [4, 9, 5, 7, 6, 11, -1],
            [0, 8, 3, 4, 9, 5, 11, 7, 6, -1],
            [5, 0, 1, 5, 4, 0, 7, 6, 11, -1],
            [11, 7, 6, 8, 3, 4, 3, 5, 4, 3, 1, 5, -1],
            [9, 5, 4, 10, 1, 2, 7, 6, 11, -1],
            [6, 11, 7, 1, 2, 10, 0, 8, 3, 4, 9, 5, -1],
            [7, 6, 11, 5, 4, 10, 4, 2, 10, 4, 0, 2, -1],
            [3, 4, 8, 3, 5, 4, 3, 2, 5, 10, 5, 2, 11, 7, 6, -1],
            [7, 2, 3, 7, 6, 2, 5, 4, 9, -1],
            [9, 5, 4, 0, 8, 6, 0, 6, 2, 6, 8, 7, -1],
            [3, 6, 2, 3, 7, 6, 1, 5, 0, 5, 4, 0, -1],
            [6, 2, 8, 6, 8, 7, 2, 1, 8, 4, 8, 5, 1, 5, 8, -1],
            [9, 5, 4, 10, 1, 6, 1, 7, 6, 1, 3, 7, -1],
            [1, 6, 10, 1, 7, 6, 1, 0, 7, 8, 7, 0, 9, 5, 4, -1],
            [4, 0, 10, 4, 10, 5, 0, 3, 10, 6, 10, 7, 3, 7, 10, -1],
            [7, 6, 10, 7, 10, 8, 5, 4, 10, 4, 8, 10, -1],
            [6, 9, 5, 6, 11, 9, 11, 8, 9, -1],
            [3, 6, 11, 0, 6, 3, 0, 5, 6, 0, 9, 5, -1],
            [0, 11, 8, 0, 5, 11, 0, 1, 5, 5, 6, 11, -1],
            [6, 11, 3, 6, 3, 5, 5, 3, 1, -1],
            [1, 2, 10, 9, 5, 11, 9, 11, 8, 11, 5, 6, -1],
            [0, 11, 3, 0, 6, 11, 0, 9, 6, 5, 6, 9, 1, 2, 10, -1],
            [11, 8, 5, 11, 5, 6, 8, 0, 5, 10, 5, 2, 0, 2, 5, -1],
            [6, 11, 3, 6, 3, 5, 2, 10, 3, 10, 5, 3, -1],
            [5, 8, 9, 5, 2, 8, 5, 6, 2, 3, 8, 2, -1],
            [9, 5, 6, 9, 6, 0, 0, 6, 2, -1],
            [1, 5, 8, 1, 8, 0, 5, 6, 8, 3, 8, 2, 6, 2, 8, -1],
            [1, 5, 6, 2, 1, 6, -1],
            [1, 3, 6, 1, 6, 10, 3, 8, 6, 5, 6, 9, 8, 9, 6, -1],
            [10, 1, 0, 10, 0, 6, 9, 5, 0, 5, 6, 0, -1],
            [0, 3, 8, 5, 6, 10, -1],
            [10, 5, 6, -1],
            [11, 5, 10, 7, 5, 11, -1],
            [11, 5, 10, 11, 7, 5, 8, 3, 0, -1],
            [5, 11, 7, 5, 10, 11, 1, 9, 0, -1],
            [10, 7, 5, 10, 11, 7, 9, 8, 1, 8, 3, 1, -1],
            [11, 1, 2, 11, 7, 1, 7, 5, 1, -1],
            [0, 8, 3, 1, 2, 7, 1, 7, 5, 7, 2, 11, -1],
            [9, 7, 5, 9, 2, 7, 9, 0, 2, 2, 11, 7, -1],
            [7, 5, 2, 7, 2, 11, 5, 9, 2, 3, 2, 8, 9, 8, 2, -1],
            [2, 5, 10, 2, 3, 5, 3, 7, 5, -1],
            [8, 2, 0, 8, 5, 2, 8, 7, 5, 10, 2, 5, -1],
            [9, 0, 1, 5, 10, 3, 5, 3, 7, 3, 10, 2, -1],
            [9, 8, 2, 9, 2, 1, 8, 7, 2, 10, 2, 5, 7, 5, 2, -1],
            [1, 3, 5, 3, 7, 5, -1],
            [0, 8, 7, 0, 7, 1, 1, 7, 5, -1],
            [9, 0, 3, 9, 3, 5, 5, 3, 7, -1],
            [9, 8, 7, 5, 9, 7, -1],
            [5, 8, 4, 5, 10, 8, 10, 11, 8, -1],
            [5, 0, 4, 5, 11, 0, 5, 10, 11, 11, 3, 0, -1],
            [0, 1, 9, 8, 4, 10, 8, 10, 11, 10, 4, 5, -1],
            [10, 11, 4, 10, 4, 5, 11, 3, 4, 9, 4, 1, 3, 1, 4, -1],
            [2, 5, 1, 2, 8, 5, 2, 11, 8, 4, 5, 8, -1],
            [0, 4, 11, 0, 11, 3, 4, 5, 11, 2, 11, 1, 5, 1, 11, -1],
            [0, 2, 5, 0, 5, 9, 2, 11, 5, 4, 5, 8, 11, 8, 5, -1],
            [9, 4, 5, 2, 11, 3, -1],
            [2, 5, 10, 3, 5, 2, 3, 4, 5, 3, 8, 4, -1],
            [5, 10, 2, 5, 2, 4, 4, 2, 0, -1],
            [3, 10, 2, 3, 5, 10, 3, 8, 5, 4, 5, 8, 0, 1, 9, -1],
            [5, 10, 2, 5, 2, 4, 1, 9, 2, 9, 4, 2, -1],
            [8, 4, 5, 8, 5, 3, 3, 5, 1, -1],
            [0, 4, 5, 1, 0, 5, -1],
            [8, 4, 5, 8, 5, 3, 9, 0, 5, 0, 3, 5, -1],
            [9, 4, 5, -1],
            [4, 11, 7, 4, 9, 11, 9, 10, 11, -1],
            [0, 8, 3, 4, 9, 7, 9, 11, 7, 9, 10, 11, -1],
            [1, 10, 11, 1, 11, 4, 1, 4, 0, 7, 4, 11, -1],
            [3, 1, 4, 3, 4, 8, 1, 10, 4, 7, 4, 11, 10, 11, 4, -1],
            [4, 11, 7, 9, 11, 4, 9, 2, 11, 9, 1, 2, -1],
            [9, 7, 4, 9, 11, 7, 9, 1, 11, 2, 11, 1, 0, 8, 3, -1],
            [11, 7, 4, 11, 4, 2, 2, 4, 0, -1],
            [11, 7, 4, 11, 4, 2, 8, 3, 4, 3, 2, 4, -1],
            [2, 9, 10, 2, 7, 9, 2, 3, 7, 7, 4, 9, -1],
            [9, 10, 7, 9, 7, 4, 10, 2, 7, 8, 7, 0, 2, 0, 7, -1],
            [3, 7, 10, 3, 10, 2, 7, 4, 10, 1, 10, 0, 4, 0, 10, -1],
            [1, 10, 2, 8, 7, 4, -1],
            [4, 9, 1, 4, 1, 7, 7, 1, 3, -1],
            [4, 9, 1, 4, 1, 7, 0, 8, 1, 8, 7, 1, -1],
            [4, 0, 3, 7, 4, 3, -1],
            [4, 8, 7, -1],
            [9, 10, 8, 10, 11, 8, -1],
            [3, 0, 9, 3, 9, 11, 11, 9, 10, -1],
            [0, 1, 10, 0, 10, 8, 8, 10, 11, -1],
            [3, 1, 10, 11, 3, 10, -1],
            [1, 2, 11, 1, 11, 9, 9, 11, 8, -1],
            [3, 0, 9, 3, 9, 11, 1, 2, 9, 2, 11, 9, -1],
            [0, 2, 11, 8, 0, 11, -1],
            [3, 2, 11, -1],
            [2, 3, 8, 2, 8, 10, 10, 8, 9, -1],
            [9, 10, 2, 0, 9, 2, -1],
            [2, 3, 8, 2, 8, 10, 0, 1, 8, 1, 10, 8, -1],
            [1, 10, 2, -1],
            [1, 3, 8, 9, 1, 8, -1],
            [0, 9, 1, -1],
            [0, 3, 8, -1],
            [-1]
        ];
    }
    
    /**
     * Get slice dimensions for UI
     */
    getSliceDimensions() {
        return {
            axial: this.nifti.dimensions.z,
            coronal: this.nifti.dimensions.y,
            sagittal: this.nifti.dimensions.x
        };
    }
    
    /**
     * Dispose of all resources
     */
    dispose() {
        // Dispose slice textures and geometries
        Object.values(this.slices).forEach(slice => {
            if (slice) {
                if (slice.material.map) slice.material.map.dispose();
                slice.material.dispose();
                slice.geometry.dispose();
            }
        });
        
        // Dispose surface mesh
        if (this.surfaceMesh) {
            this.surfaceMesh.geometry.dispose();
            this.surfaceMesh.material.dispose();
        }
        
        // Remove from scene
        this.scene.remove(this.volumeGroup);
    }
}
