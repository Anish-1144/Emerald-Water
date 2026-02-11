'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { Mesh } from 'three';
import { useThemeStore } from '@/lib/store';

interface BottleMultiAngleViewProps {
  labelImage: string | null;
  capColor?: string;
  height?: string;
  showInstructions?: boolean;
}

function InteractiveBottleView({ labelImage, capColor }: { labelImage: string | null; capColor: string }) {
  const controlsRef = useRef<any>(null);
  const [bottleCenter, setBottleCenter] = useState<THREE.Vector3 | null>(null);
  const { camera, gl, scene } = useThree();
  const [isInitialized, setIsInitialized] = useState(false);

  // Fit camera to show full bottle
  useEffect(() => {
    if (bottleCenter && !isInitialized) {
      const fitCamera = () => {
        const box = new THREE.Box3().setFromObject(scene);
        if (!box.isEmpty() && camera instanceof THREE.PerspectiveCamera) {
          const center = bottleCenter;
          const size = box.getSize(new THREE.Vector3());
          
          const aspect = gl.domElement.width / gl.domElement.height || 1;
          const fov = camera.fov * (Math.PI / 180);
          const fovRad = fov / 2;
          
          // Use height (Y) as primary dimension for vertical bottles
          const height = size.y;
          const width = Math.max(size.x, size.z);
          
          // Calculate distance needed to fit height in viewport
          const distanceForHeight = (height / 2) / Math.tan(fovRad);
          
          // Calculate distance needed to fit width in viewport
          const horizontalFov = 2 * Math.atan(Math.tan(fovRad) * aspect);
          const distanceForWidth = (width / 2) / Math.tan(horizontalFov / 2);
          
          // Use the larger distance with more padding to make bottle appear smaller
          const baseDistance = Math.max(distanceForHeight * 1.8, distanceForWidth * 1.8);
          const cameraDistance = baseDistance;
          
          // Position camera centered to face the label side (front view)
          const targetPosition = new THREE.Vector3(
            center.x,
            center.y, // Center vertically
            center.z + cameraDistance
          );
          
          camera.position.copy(targetPosition);
          camera.lookAt(center); // Look at the center of the bottle
          camera.updateProjectionMatrix();
          
          // Update controls
          if (controlsRef.current) {
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
          }
          
          setIsInitialized(true);
        }
      };
      
      // Wait a bit for scene to fully load
      const timer = setTimeout(fitCamera, 200);
      return () => clearTimeout(timer);
    }
  }, [bottleCenter, camera, gl, scene, isInitialized]);

  return (
    <>
      <Suspense fallback={
        <mesh>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#cccccc" />
        </mesh>
      }>
        <BottleModelWithCenter 
          labelImage={labelImage} 
          capColor={capColor}
          onCenterChange={setBottleCenter}
        />
      </Suspense>
      {bottleCenter && (
        <OrbitControls
          ref={controlsRef}
          enableZoom={true}
          enablePan={false}
          minDistance={3}
          maxDistance={15}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI - Math.PI / 6}
          target={bottleCenter}
        />
      )}
    </>
  );
}

function BottleModelWithCenter({ labelImage, capColor, onCenterChange }: { 
  labelImage: string | null; 
  capColor: string;
  onCenterChange: (center: THREE.Vector3 | null) => void;
}) {
  const gltf = useLoader(GLTFLoader, '/bottle4.glb');
  const capRef = useRef<Mesh>(null);
  const labelRef = useRef<Mesh>(null);
  const labelOriginalMaterialRef = useRef<THREE.Material | null>(null);
  const { scene } = useThree();
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Rotate the entire bottle model to show label facing camera
    gltf.scene.rotation.y = Math.PI; // 180 degrees
    
    let labelFound = false;
    
    gltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        const meshName = child.name.toLowerCase();
        
        if (meshName === 'cap' && !meshName.includes('top')) {
          capRef.current = child;
        } else if (meshName === 'label') {
          // Found label mesh - store reference and original material
          labelRef.current = child;
          labelFound = true;
          console.log('Label mesh found:', child.name, 'Position:', child.position, 'Rotation:', child.rotation);
          // Store original material to preserve properties (don't clone yet)
          if (child.material) {
            labelOriginalMaterialRef.current = child.material;
          }
          // Make label double-sided so it's visible from both sides
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.side = THREE.DoubleSide;
          }
        }
      }
    });

    if (!labelFound) {
      console.warn('Label mesh not found in model. Available meshes:');
      gltf.scene.traverse((child) => {
        if (child instanceof Mesh) {
          console.log('  -', child.name);
        }
      });
    }

    setIsLoaded(true);
  }, [gltf]);

  // Calculate and notify center
  useEffect(() => {
    if (isLoaded) {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        onCenterChange(center);
      }
    }
  }, [isLoaded, gltf.scene, onCenterChange]);

  // Apply cap color
  useEffect(() => {
    if (capRef.current && capRef.current.material instanceof THREE.MeshStandardMaterial) {
      capRef.current.material.color = new THREE.Color(capColor);
    }
  }, [capColor]);

  // Apply label texture - wait for model to be loaded first
  useEffect(() => {
    console.log('[Label Texture] Effect triggered', {
      isLoaded,
      hasLabelRef: !!labelRef.current,
      hasLabelImage: !!labelImage,
      labelImageType: typeof labelImage,
      labelImagePreview: labelImage ? labelImage.substring(0, 100) : 'null'
    });
    
    // Don't try to apply texture until model is loaded and labelRef is set
    if (!isLoaded) {
      console.log('[Label Texture] Model not loaded yet, waiting...');
      return;
    }
    
    if (!labelRef.current) {
      console.warn('[Label Texture] Label ref not set, cannot apply texture');
      return;
    }

    console.log('[Label Texture] Label mesh found:', {
      meshName: labelRef.current.name,
      position: labelRef.current.position,
      rotation: labelRef.current.rotation,
      visible: labelRef.current.visible
    });

    // Validate labelImage before attempting to load
    if (!labelImage || typeof labelImage !== 'string' || labelImage.trim() === '') {
      console.log('[Label Texture] No label image provided, using default material');
      // Reset to original material if no valid image
      if (labelRef.current && labelOriginalMaterialRef.current) {
        labelRef.current.material = labelOriginalMaterialRef.current;
      }
      return;
    }

    console.log('[Label Texture] Starting to load label texture', {
      url: labelImage.substring(0, 100),
      fullUrlLength: labelImage.length,
      isDataUrl: labelImage.startsWith('data:'),
      isHttp: labelImage.startsWith('http://'),
      isHttps: labelImage.startsWith('https://'),
      isRelative: labelImage.startsWith('/')
    });

    // Validate URL format (data URL or http/https)
    const isValidUrl = labelImage.startsWith('data:') || 
                       labelImage.startsWith('http://') || 
                       labelImage.startsWith('https://') ||
                       labelImage.startsWith('/');
    
    if (!isValidUrl) {
      console.warn('[Label Texture] Invalid label image URL format:', labelImage);
      // Reset to original material for invalid URLs
      if (labelRef.current && labelOriginalMaterialRef.current) {
        labelRef.current.material = labelOriginalMaterialRef.current;
      }
      return;
    }

    // Helper function to create texture from image
    const createTextureFromImage = (image: HTMLImageElement) => {
      if (!labelRef.current) {
        console.warn('Label ref not available');
        return;
      }
      
      try {
        // Create texture from the loaded image
        const texture = new THREE.Texture(image);
        texture.needsUpdate = true;
        
        console.log('Label texture created successfully, dimensions:', image.width, 'x', image.height);
        
        // Label UV mapping area dimensions (from canvas size)
        const LABEL_UV_WIDTH = 2081;
        const LABEL_UV_HEIGHT = 544;
        const LABEL_UV_ASPECT = LABEL_UV_WIDTH / LABEL_UV_HEIGHT; // ≈ 3.827
        
        // Get image dimensions
        const imageWidth = image.width;
        const imageHeight = image.height;
        const imageAspect = imageWidth / imageHeight;
        
        // Configure texture properties - set these BEFORE calculating repeat/offset
        texture.flipY = false;
        // Use ClampToEdgeWrapping to prevent texture bleeding
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        
        // Calculate repeat and offset to fit image to UV mapping
        let repeatX: number;
        let repeatY: number;
        let offsetX: number;
        let offsetY: number;
        
        if (imageAspect > LABEL_UV_ASPECT) {
          // Image is wider than UV area - scale to fit height, crop width
          repeatY = 1.0; // Full height
          repeatX = imageAspect / LABEL_UV_ASPECT; // Scale width proportionally
          offsetX = (1 - repeatX) / 2; // Center horizontally
          offsetY = 0; // No vertical offset
        } else {
          // Image is taller than UV area - scale to fit width, crop height
          repeatX = 1.0; // Full width
          repeatY = LABEL_UV_ASPECT / imageAspect; // Scale height proportionally
          offsetX = 0; // No horizontal offset
          offsetY = (1 - repeatY) / 2; // Center vertically
        }
        
        texture.repeat.set(repeatX, repeatY);
        texture.offset.set(offsetX, offsetY);
        
        // Use high-quality filtering for crisp images (set AFTER repeat/offset)
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = 16; // Maximum anisotropy for sharp textures
        
        console.log('Texture mapping applied:', {
          imageSize: `${imageWidth}x${imageHeight}`,
          imageAspect: imageAspect.toFixed(2),
          uvAspect: LABEL_UV_ASPECT.toFixed(2),
          repeat: `${repeatX.toFixed(3)}, ${repeatY.toFixed(3)}`,
          offset: `${offsetX.toFixed(3)}, ${offsetY.toFixed(3)}`
        });
        
        if (labelRef.current) {
          const geometry = labelRef.current.geometry;
          
          // Create new material preserving original properties if available
          const originalMaterial = labelOriginalMaterialRef.current;
          const newMaterial = originalMaterial instanceof THREE.MeshStandardMaterial
            ? originalMaterial.clone()
            : new THREE.MeshStandardMaterial();
          
          // Apply texture to material with enhanced contrast settings
          if (newMaterial instanceof THREE.MeshStandardMaterial) {
            newMaterial.map = texture;
            newMaterial.roughness = 0.3; // Lower roughness for more reflective/crisp look
            newMaterial.metalness = 0.1; // Slight metalness for better definition
            newMaterial.side = THREE.DoubleSide; // Make label visible from both sides
            // Ensure material is visible and not transparent
            newMaterial.transparent = false;
            newMaterial.opacity = 1.0;
            newMaterial.needsUpdate = true;
            const textureImage = newMaterial.map?.image;
            const imageSrc = textureImage && textureImage instanceof HTMLImageElement
              ? textureImage.src?.substring(0, 100)
              : 'N/A';
            
            console.log('[Label Texture] Material properties set:', {
              hasTexture: !!newMaterial.map,
              textureImage: imageSrc,
              side: newMaterial.side,
              roughness: newMaterial.roughness,
              metalness: newMaterial.metalness,
              opacity: newMaterial.opacity,
              transparent: newMaterial.transparent,
              needsUpdate: newMaterial.needsUpdate
            });
          }
          
          console.log('[Label Texture] Applying material to mesh...');
          labelRef.current.material = newMaterial;
          
          // Force update the label mesh
          if (labelRef.current) {
            console.log('[Label Texture] Updating mesh matrices...');
            labelRef.current.updateMatrix();
            labelRef.current.updateMatrixWorld(true);
          }
          
          // Ensure geometry UVs are updated - CRITICAL for texture to show
          if (geometry && geometry.attributes.uv) {
            console.log('[Label Texture] Updating UV attributes...');
            geometry.attributes.uv.needsUpdate = true;
            geometry.computeBoundingBox();
            console.log('[Label Texture] UV update complete, bounding box computed');
          } else {
            console.warn('[Label Texture] No UV attribute found on geometry!');
          }
          
          labelRef.current.visible = true;
          console.log('[Label Texture] ✅ Label material applied successfully to mesh:', {
            meshName: labelRef.current.name,
            visible: labelRef.current.visible,
            materialType: labelRef.current.material?.constructor?.name,
            hasTexture: !!(labelRef.current.material as any)?.map
          });
        }
      } catch (err) {
        console.error('Error creating texture from image:', err);
        // Reset to original material on error
        if (labelRef.current && labelOriginalMaterialRef.current) {
          labelRef.current.material = labelOriginalMaterialRef.current;
        }
      }
    };
    
    // Determine URL type
    const isDataUrl = labelImage.startsWith('data:');
    const isExternalUrl = labelImage.startsWith('http://') || labelImage.startsWith('https://');
    const isSameOrigin = isExternalUrl && typeof window !== 'undefined' && 
                         (labelImage.startsWith(window.location.origin) || 
                          labelImage.startsWith('/'));
    
    // Use TextureLoader directly (same as Bottle3D) - it handles CORS better
    // Don't set crossOrigin - let TextureLoader handle it internally
    console.log('[Label Texture] Creating TextureLoader and starting load...');
    const loader = new THREE.TextureLoader();
    
    loader.load(
      labelImage,
      (texture) => {
        console.log('[Label Texture] TextureLoader load success callback triggered');
        
        if (!labelRef.current) {
          console.warn('[Label Texture] Label ref not available when texture loaded');
          return;
        }
        
        console.log('[Label Texture] Texture loaded successfully', {
          hasImage: !!texture.image,
          imageWidth: texture.image?.width,
          imageHeight: texture.image?.height,
          imageSrc: texture.image?.src?.substring(0, 100)
        });
        
        try {
          // Label UV mapping area dimensions (from canvas size)
          const LABEL_UV_WIDTH = 2081;
          const LABEL_UV_HEIGHT = 544;
          const LABEL_UV_ASPECT = LABEL_UV_WIDTH / LABEL_UV_HEIGHT; // ≈ 3.827
          
          // Get image dimensions
          const imageWidth = texture.image.width;
          const imageHeight = texture.image.height;
          const imageAspect = imageWidth / imageHeight;
          
          // Configure texture properties
          texture.flipY = false;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          
          // Calculate repeat and offset to fit image to UV mapping
          let repeatX: number;
          let repeatY: number;
          let offsetX: number;
          let offsetY: number;
          
          if (imageAspect > LABEL_UV_ASPECT) {
            repeatY = 1.0;
            repeatX = imageAspect / LABEL_UV_ASPECT;
            offsetX = (1 - repeatX) / 2;
            offsetY = 0;
          } else {
            repeatX = 1.0;
            repeatY = LABEL_UV_ASPECT / imageAspect;
            offsetX = 0;
            offsetY = (1 - repeatY) / 2;
          }
          
          texture.repeat.set(repeatX, repeatY);
          texture.offset.set(offsetX, offsetY);
          
          // Use high-quality filtering
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = true;
          texture.anisotropy = 16;
          
          console.log('[Label Texture] Texture mapping calculated:', {
            imageSize: `${imageWidth}x${imageHeight}`,
            imageAspect: imageAspect.toFixed(2),
            uvAspect: LABEL_UV_ASPECT.toFixed(2),
            repeat: `${repeatX.toFixed(3)}, ${repeatY.toFixed(3)}`,
            offset: `${offsetX.toFixed(3)}, ${offsetY.toFixed(3)}`
          });
          
          const geometry = labelRef.current.geometry;
          console.log('[Label Texture] Geometry info:', {
            hasGeometry: !!geometry,
            hasUvAttribute: !!(geometry && geometry.attributes.uv),
            uvCount: geometry?.attributes.uv?.count
          });
          const originalMaterial = labelOriginalMaterialRef.current;
          const newMaterial = originalMaterial instanceof THREE.MeshStandardMaterial
            ? originalMaterial.clone()
            : new THREE.MeshStandardMaterial();
          
          if (newMaterial instanceof THREE.MeshStandardMaterial) {
            newMaterial.map = texture;
            newMaterial.roughness = 0.3;
            newMaterial.metalness = 0.1;
            newMaterial.side = THREE.DoubleSide;
            newMaterial.transparent = false;
            newMaterial.opacity = 1.0;
            newMaterial.needsUpdate = true;
            
            console.log('Label texture applied to material:', {
              hasTexture: !!newMaterial.map,
              side: newMaterial.side,
              labelPosition: labelRef.current?.position,
              labelRotation: labelRef.current?.rotation
            });
          }
          
          labelRef.current.material = newMaterial;
          
          // Force update the label mesh
          labelRef.current.updateMatrix();
          labelRef.current.updateMatrixWorld(true);
          
          // Ensure geometry UVs are updated - CRITICAL for texture to show
          if (geometry && geometry.attributes.uv) {
            geometry.attributes.uv.needsUpdate = true;
            geometry.computeBoundingBox();
          }
          
          labelRef.current.visible = true;
          console.log('Label material applied successfully to mesh:', labelRef.current.name);
        } catch (err) {
          console.error('[Label Texture] ❌ Error applying texture:', {
            error: err,
            errorMessage: err instanceof Error ? err.message : String(err),
            errorStack: err instanceof Error ? err.stack : undefined,
            labelRefExists: !!labelRef.current
          });
          if (labelRef.current && labelOriginalMaterialRef.current) {
            console.log('[Label Texture] Resetting to original material due to error');
            labelRef.current.material = labelOriginalMaterialRef.current;
          }
        }
      },
      (progress) => {
        console.log('[Label Texture] Texture loading progress:', progress);
      },
      (error) => {
        console.error('[Label Texture] ❌ TextureLoader error callback:', {
          error,
          errorType: error?.constructor?.name,
          errorMessage: (error instanceof Error ? error.message : String(error)) || 'Unknown error',
          url: labelImage.substring(0, 100)
        });
        if (labelRef.current && labelOriginalMaterialRef.current) {
          console.log('[Label Texture] Resetting to original material due to load error');
          labelRef.current.material = labelOriginalMaterialRef.current;
        }
      }
    );
  }, [labelImage, isLoaded]);

  return <primitive object={gltf.scene} />;
}

export default function BottleMultiAngleView({ 
  labelImage, 
  capColor = '#ffffff',
  height = '500px',
  showInstructions = true
}: BottleMultiAngleViewProps) {
  const { theme } = useThemeStore();
  
  // Set background color based on theme
  const backgroundColor = theme === 'dark' ? '#000000' : '#f5f5f5'; // Black for dark, soft white for light
  
  // Validate labelImage before rendering
  if (!labelImage || typeof labelImage !== 'string' || labelImage.trim() === '') {
    return (
      <div className="text-center py-8" style={{ color: 'var(--text-muted)' }}>
        <p>No label image available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {showInstructions && (
        <div className="mb-4">
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            Interactive 3D Preview - Drag to rotate, scroll to zoom
          </p>
        </div>
      )}
      <div 
        className="w-full rounded-lg border overflow-hidden" 
        style={{ 
          borderColor: 'var(--border-color)',
          height: height,
          minHeight: '400px',
          backgroundColor: backgroundColor
        }}
      >
        <Canvas
          style={{ width: '100%', height: '100%' }}
          camera={{ position: [0, 1, 7], fov: 120 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ camera }) => {
            // Ensure camera looks at center
            camera.lookAt(0, 0, 0);
          }}
        >
          <color attach="background" args={[backgroundColor]} />
          <ambientLight intensity={theme === 'dark' ? 0.8 : 0.6} />
          <directionalLight position={[10, 10, 5]} intensity={theme === 'dark' ? 1.2 : 1} />
          <directionalLight position={[-10, -10, -5]} intensity={theme === 'dark' ? 0.6 : 0.5} />
          <pointLight position={[0, 10, 0]} intensity={theme === 'dark' ? 0.4 : 0.3} />
          <InteractiveBottleView labelImage={labelImage} capColor={capColor} />
        </Canvas>
      </div>
      {showInstructions && (
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Drag to rotate</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Scroll to zoom</p>
          </div>
        </div>
      )}
    </div>
  );
}

