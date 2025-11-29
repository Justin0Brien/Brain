/**
 * ModelDownloader - Downloads brain models from third-party sources if not available locally
 * 
 * Provides fallback URLs for:
 * - GLB/GLTF brain surface models
 * - NIfTI volumetric brain data (MNI templates)
 */

import * as THREE from 'three';

export class ModelDownloader {
    constructor() {
        // Known sources for brain models
        this.sources = {
            // GLB brain model sources (free/open brain models)
            glb: [
                // Sketchfab free brain models (via direct download links)
                'https://raw.githubusercontent.com/nicholasreynolds/brain-models/main/brain.glb',
                // Alternative: BrainBrowser sample data
                'https://brainbrowser.cbrain.mcgill.ca/models/brain.glb'
            ],
            // MNI ICBM 152 T1 template sources
            nifti: [
                // NIST MNI mirror
                'https://www.bic.mni.mcgill.ca/~vfonov/icbm/2009/mni_icbm152_nlin_sym_09c_nifti.zip',
                // Alternative mirror
                'https://osf.io/download/5e9bf4b4f2be3c0018b1e552/' // MNI152 from OSF
            ]
        };
    }
    
    /**
     * Check if a local file exists
     */
    async fileExists(url) {
        try {
            const response = await fetch(url, { method: 'HEAD' });
            return response.ok;
        } catch {
            return false;
        }
    }
    
    /**
     * Download a GLB brain model if not present locally
     * Returns the URL to use (local or remote)
     */
    async getGLBModel(localPath = 'models/brain.glb') {
        // Check if local file exists
        if (await this.fileExists(localPath)) {
            console.log('Using local brain model:', localPath);
            return { url: localPath, isLocal: true };
        }
        
        console.log('Local brain model not found, searching for alternatives...');
        
        // Try to find a working remote source
        for (const remoteUrl of this.sources.glb) {
            try {
                console.log('Trying remote source:', remoteUrl);
                const response = await fetch(remoteUrl, { method: 'HEAD' });
                if (response.ok) {
                    console.log('Found working remote source:', remoteUrl);
                    return { url: remoteUrl, isLocal: false };
                }
            } catch (e) {
                console.log('Remote source unavailable:', remoteUrl);
            }
        }
        
        // If no remote sources work, try a generated procedural brain
        console.log('No remote models available, will generate procedural brain');
        return { url: null, isLocal: false, generateProcedural: true };
    }
    
    /**
     * Download NIfTI brain volume if not present locally
     * Returns the URL to use (local or remote)
     */
    async getNiftiVolume(localPath = 'models/mni_icbm152_nlin_sym_09c/mni_icbm152_t1_tal_nlin_sym_09c.nii.gz') {
        // Check if local file exists
        if (await this.fileExists(localPath)) {
            console.log('Using local NIfTI volume:', localPath);
            return { url: localPath, isLocal: true };
        }
        
        // Check for uncompressed version
        const uncompressedPath = localPath.replace('.nii.gz', '.nii');
        if (await this.fileExists(uncompressedPath)) {
            console.log('Using local uncompressed NIfTI:', uncompressedPath);
            return { url: uncompressedPath, isLocal: true };
        }
        
        console.log('Local NIfTI volume not found, trying remote sources...');
        
        // For NIfTI, we need to provide a CORS-friendly source
        // Most academic sources don't support CORS, so we need alternatives
        
        // Try OpenNeuro or similar CORS-enabled sources
        const corsProxyUrl = 'https://corsproxy.io/?';
        const directSources = [
            // IXI dataset sample (smaller file)
            'https://biomedic.doc.ic.ac.uk/brain-development/downloads/IXI/IXI-T1-template.nii.gz',
            // TemplateFlow sample
            'https://templateflow.s3.amazonaws.com/tpl-MNI152NLin2009cAsym/tpl-MNI152NLin2009cAsym_res-01_T1w.nii.gz'
        ];
        
        for (const sourceUrl of directSources) {
            try {
                // Try direct access first
                console.log('Trying direct source:', sourceUrl);
                const response = await fetch(sourceUrl, { method: 'HEAD', mode: 'cors' });
                if (response.ok) {
                    return { url: sourceUrl, isLocal: false };
                }
            } catch {
                // Try with CORS proxy
                try {
                    const proxiedUrl = corsProxyUrl + encodeURIComponent(sourceUrl);
                    console.log('Trying proxied source:', proxiedUrl);
                    const response = await fetch(proxiedUrl, { method: 'HEAD' });
                    if (response.ok) {
                        return { url: proxiedUrl, isLocal: false };
                    }
                } catch {
                    console.log('Proxied source unavailable');
                }
            }
        }
        
        // Return null if nothing works
        return { url: null, isLocal: false, error: 'No NIfTI sources available' };
    }
    
    /**
     * Show download instructions to user
     */
    showDownloadInstructions(type = 'glb') {
        const instructions = {
            glb: `
                <div class="download-instructions">
                    <h3>Brain Model Required</h3>
                    <p>No brain model was found. Please download one:</p>
                    <ol>
                        <li>Visit <a href="https://sketchfab.com/search?q=brain&type=models&sort_by=-likeCount" target="_blank">Sketchfab</a></li>
                        <li>Download a free brain model in GLB/GLTF format</li>
                        <li>Save it as <code>models/brain.glb</code></li>
                        <li>Refresh this page</li>
                    </ol>
                    <p>Or use a procedurally generated brain below.</p>
                </div>
            `,
            nifti: `
                <div class="download-instructions">
                    <h3>MRI Volume Required</h3>
                    <p>No brain volume was found. Please download the MNI template:</p>
                    <ol>
                        <li>Visit <a href="https://www.bic.mni.mcgill.ca/ServicesAtlases/ICBM152NLin2009" target="_blank">MNI ICBM 152</a></li>
                        <li>Download "ICBM 2009c Nonlinear Symmetric" NIfTI package</li>
                        <li>Extract to <code>models/mni_icbm152_nlin_sym_09c/</code></li>
                        <li>Refresh this page</li>
                    </ol>
                </div>
            `
        };
        
        return instructions[type] || instructions.glb;
    }
}

/**
 * Generate a procedural brain-like mesh when no model is available
 */
export function generateProceduralBrain() {
    const group = new THREE.Group();
    
    // Create brain hemispheres using deformed spheres
    const brainMaterial = new THREE.MeshPhongMaterial({
        color: 0xffccaa,
        specular: 0x222222,
        shininess: 10,
        side: THREE.DoubleSide
    });
    
    // Left hemisphere
    const leftGeom = new THREE.SphereGeometry(1.8, 64, 64);
    deformBrainGeometry(leftGeom, -0.3);
    const leftHemi = new THREE.Mesh(leftGeom, brainMaterial);
    leftHemi.position.x = -0.5;
    leftHemi.scale.set(0.9, 1.1, 1.3);
    group.add(leftHemi);
    
    // Right hemisphere
    const rightGeom = new THREE.SphereGeometry(1.8, 64, 64);
    deformBrainGeometry(rightGeom, 0.3);
    const rightHemi = new THREE.Mesh(rightGeom, brainMaterial.clone());
    rightHemi.position.x = 0.5;
    rightHemi.scale.set(0.9, 1.1, 1.3);
    group.add(rightHemi);
    
    // Cerebellum
    const cerebellumGeom = new THREE.SphereGeometry(0.8, 32, 32);
    const cerebellum = new THREE.Mesh(cerebellumGeom, brainMaterial.clone());
    cerebellum.position.set(0, -0.8, -1.2);
    cerebellum.scale.set(1.5, 0.8, 1);
    group.add(cerebellum);
    
    // Brain stem
    const stemGeom = new THREE.CylinderGeometry(0.3, 0.4, 1, 16);
    const stem = new THREE.Mesh(stemGeom, brainMaterial.clone());
    stem.position.set(0, -1.5, -0.8);
    stem.rotation.x = Math.PI * 0.15;
    group.add(stem);
    
    return group;
}

function deformBrainGeometry(geometry, offsetX) {
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();
    
    for (let i = 0; i < positions.count; i++) {
        vertex.fromBufferAttribute(positions, i);
        
        // Add noise-based deformation for sulci/gyri appearance
        const noise = Math.sin(vertex.x * 8 + offsetX) * 
                     Math.sin(vertex.y * 6) * 
                     Math.sin(vertex.z * 7) * 0.08;
        
        // Flatten the medial side (between hemispheres)
        const medialFactor = Math.max(0, 1 - Math.abs(vertex.x + offsetX) * 2);
        vertex.x *= (1 - medialFactor * 0.3);
        
        // Apply sulci deformation
        const length = vertex.length();
        vertex.normalize().multiplyScalar(length + noise);
        
        positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    
    geometry.computeVertexNormals();
}
