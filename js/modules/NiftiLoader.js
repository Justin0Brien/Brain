/**
 * NiftiLoader - Loads and parses NIfTI-1 format brain images
 * 
 * NIfTI (Neuroimaging Informatics Technology Initiative) is a standard
 * format for storing volumetric brain imaging data.
 */

import * as THREE from 'three';

export class NiftiLoader {
    constructor() {
        this.header = null;
        this.imageData = null;
        this.dimensions = { x: 0, y: 0, z: 0 };
        this.voxelSize = { x: 1, y: 1, z: 1 };
        this.dataMin = 0;
        this.dataMax = 0;
    }
    
    /**
     * Load a NIfTI file from URL
     * @param {string} url - Path to the .nii or .nii.gz file
     * @returns {Promise} Resolves when loading is complete
     */
    async load(url) {
        console.log(`Loading NIfTI file: ${url}`);
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to load NIfTI file: ${response.statusText}`);
        }
        
        let arrayBuffer = await response.arrayBuffer();
        
        // Check if gzipped (starts with 0x1f 0x8b)
        const bytes = new Uint8Array(arrayBuffer);
        if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
            console.log('Decompressing gzipped NIfTI...');
            arrayBuffer = await this.decompress(arrayBuffer);
        }
        
        this.parseNifti(arrayBuffer);
        
        console.log(`NIfTI loaded: ${this.dimensions.x} x ${this.dimensions.y} x ${this.dimensions.z}`);
        console.log(`Voxel size: ${this.voxelSize.x} x ${this.voxelSize.y} x ${this.voxelSize.z} mm`);
        console.log(`Data range: ${this.dataMin.toFixed(2)} - ${this.dataMax.toFixed(2)}`);
        
        return this;
    }
    
    /**
     * Decompress gzipped data using DecompressionStream
     */
    async decompress(compressedBuffer) {
        // Use the native DecompressionStream API
        const ds = new DecompressionStream('gzip');
        const writer = ds.writable.getWriter();
        const reader = ds.readable.getReader();
        
        // Write compressed data
        writer.write(compressedBuffer);
        writer.close();
        
        // Read decompressed chunks
        const chunks = [];
        let totalLength = 0;
        
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
            totalLength += value.length;
        }
        
        // Combine chunks into single buffer
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }
        
        return result.buffer;
    }
    
    /**
     * Parse NIfTI-1 header and image data
     */
    parseNifti(buffer) {
        const dataView = new DataView(buffer);
        
        // NIfTI-1 header is 348 bytes
        const headerSize = dataView.getInt32(0, true);
        
        // Check for valid NIfTI magic number
        const magic = String.fromCharCode(
            dataView.getUint8(344),
            dataView.getUint8(345),
            dataView.getUint8(346),
            dataView.getUint8(347)
        );
        
        if (magic !== 'n+1\0' && magic !== 'ni1\0') {
            throw new Error('Invalid NIfTI file: bad magic number');
        }
        
        this.header = {
            sizeof_hdr: headerSize,
            dim: [],
            datatype: dataView.getInt16(70, true),
            bitpix: dataView.getInt16(72, true),
            pixdim: [],
            vox_offset: dataView.getFloat32(108, true),
            scl_slope: dataView.getFloat32(112, true),
            scl_inter: dataView.getFloat32(116, true),
            qform_code: dataView.getInt16(252, true),
            sform_code: dataView.getInt16(254, true)
        };
        
        // Read dimensions (dim[0] = number of dimensions, dim[1-7] = sizes)
        for (let i = 0; i < 8; i++) {
            this.header.dim.push(dataView.getInt16(40 + i * 2, true));
        }
        
        // Read voxel sizes
        for (let i = 0; i < 8; i++) {
            this.header.pixdim.push(dataView.getFloat32(76 + i * 4, true));
        }
        
        // Set dimensions
        this.dimensions.x = this.header.dim[1];
        this.dimensions.y = this.header.dim[2];
        this.dimensions.z = this.header.dim[3];
        
        // Set voxel sizes
        this.voxelSize.x = Math.abs(this.header.pixdim[1]);
        this.voxelSize.y = Math.abs(this.header.pixdim[2]);
        this.voxelSize.z = Math.abs(this.header.pixdim[3]);
        
        // Handle scale slope/intercept
        if (this.header.scl_slope === 0) {
            this.header.scl_slope = 1;
        }
        
        // Read image data
        const voxOffset = Math.max(352, this.header.vox_offset);
        const numVoxels = this.dimensions.x * this.dimensions.y * this.dimensions.z;
        
        this.imageData = this.readImageData(buffer, voxOffset, numVoxels);
        
        // Calculate min/max
        this.dataMin = Infinity;
        this.dataMax = -Infinity;
        for (let i = 0; i < this.imageData.length; i++) {
            const val = this.imageData[i];
            if (val < this.dataMin) this.dataMin = val;
            if (val > this.dataMax) this.dataMax = val;
        }
    }
    
    /**
     * Read image data based on datatype
     */
    readImageData(buffer, offset, numVoxels) {
        const dataView = new DataView(buffer, offset);
        const data = new Float32Array(numVoxels);
        
        const slope = this.header.scl_slope;
        const inter = this.header.scl_inter;
        
        switch (this.header.datatype) {
            case 2: // UINT8
                for (let i = 0; i < numVoxels; i++) {
                    data[i] = dataView.getUint8(i) * slope + inter;
                }
                break;
            case 4: // INT16
                for (let i = 0; i < numVoxels; i++) {
                    data[i] = dataView.getInt16(i * 2, true) * slope + inter;
                }
                break;
            case 8: // INT32
                for (let i = 0; i < numVoxels; i++) {
                    data[i] = dataView.getInt32(i * 4, true) * slope + inter;
                }
                break;
            case 16: // FLOAT32
                for (let i = 0; i < numVoxels; i++) {
                    data[i] = dataView.getFloat32(i * 4, true) * slope + inter;
                }
                break;
            case 64: // FLOAT64
                for (let i = 0; i < numVoxels; i++) {
                    data[i] = dataView.getFloat64(i * 8, true) * slope + inter;
                }
                break;
            case 256: // INT8
                for (let i = 0; i < numVoxels; i++) {
                    data[i] = dataView.getInt8(i) * slope + inter;
                }
                break;
            case 512: // UINT16
                for (let i = 0; i < numVoxels; i++) {
                    data[i] = dataView.getUint16(i * 2, true) * slope + inter;
                }
                break;
            default:
                console.warn(`Unknown datatype: ${this.header.datatype}, treating as UINT8`);
                for (let i = 0; i < numVoxels; i++) {
                    data[i] = dataView.getUint8(i) * slope + inter;
                }
        }
        
        return data;
    }
    
    /**
     * Get voxel value at coordinates
     */
    getVoxel(x, y, z) {
        if (x < 0 || x >= this.dimensions.x ||
            y < 0 || y >= this.dimensions.y ||
            z < 0 || z >= this.dimensions.z) {
            return 0;
        }
        
        const idx = x + y * this.dimensions.x + z * this.dimensions.x * this.dimensions.y;
        return this.imageData[idx];
    }
    
    /**
     * Get normalized voxel value (0-1)
     */
    getNormalizedVoxel(x, y, z) {
        const val = this.getVoxel(x, y, z);
        return (val - this.dataMin) / (this.dataMax - this.dataMin);
    }
    
    /**
     * Extract a 2D slice from the volume
     * @param {string} plane - 'axial', 'coronal', or 'sagittal'
     * @param {number} index - Slice index
     * @returns {ImageData} The slice as ImageData
     */
    getSlice(plane, index) {
        let width, height, data;
        
        switch (plane) {
            case 'axial': // XY plane at Z
                width = this.dimensions.x;
                height = this.dimensions.y;
                data = new Uint8ClampedArray(width * height * 4);
                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const val = Math.floor(this.getNormalizedVoxel(x, y, index) * 255);
                        const idx = (y * width + x) * 4;
                        data[idx] = val;
                        data[idx + 1] = val;
                        data[idx + 2] = val;
                        data[idx + 3] = 255;
                    }
                }
                break;
                
            case 'coronal': // XZ plane at Y
                width = this.dimensions.x;
                height = this.dimensions.z;
                data = new Uint8ClampedArray(width * height * 4);
                for (let z = 0; z < height; z++) {
                    for (let x = 0; x < width; x++) {
                        const val = Math.floor(this.getNormalizedVoxel(x, index, z) * 255);
                        const idx = ((height - 1 - z) * width + x) * 4;
                        data[idx] = val;
                        data[idx + 1] = val;
                        data[idx + 2] = val;
                        data[idx + 3] = 255;
                    }
                }
                break;
                
            case 'sagittal': // YZ plane at X
                width = this.dimensions.y;
                height = this.dimensions.z;
                data = new Uint8ClampedArray(width * height * 4);
                for (let z = 0; z < height; z++) {
                    for (let y = 0; y < width; y++) {
                        const val = Math.floor(this.getNormalizedVoxel(index, y, z) * 255);
                        const idx = ((height - 1 - z) * width + y) * 4;
                        data[idx] = val;
                        data[idx + 1] = val;
                        data[idx + 2] = val;
                        data[idx + 3] = 255;
                    }
                }
                break;
        }
        
        return new ImageData(data, width, height);
    }
    
    /**
     * Get the physical size of the volume in mm
     */
    getPhysicalSize() {
        return {
            x: this.dimensions.x * this.voxelSize.x,
            y: this.dimensions.y * this.voxelSize.y,
            z: this.dimensions.z * this.voxelSize.z
        };
    }
}
