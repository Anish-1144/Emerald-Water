'use client';

import { useRef, useEffect, Suspense, forwardRef, useImperativeHandle, useState } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import { Mesh, Color } from 'three';
import { useDesignStore } from '@/store/useDesignStore';
import { useThemeStore } from '@/lib/store';

interface BottleModelProps {
  capColor: string;
  labelTexture: string | null;
}

function SetupControls({ center }: { center: THREE.Vector3 | null }) {
  const { controls } = useThree();
  
  useEffect(() => {
    if (center && controls && 'target' in controls) {
      (controls as any).target.copy(center);
      (controls as any).update();
    }
  }, [center, controls]);
  
  return null;
}

interface BottleModelWithCenterProps extends BottleModelProps {
  onCenterChange: (center: THREE.Vector3 | null) => void;
}

function BottleModelWithCenter({ capColor, labelTexture, onCenterChange }: BottleModelWithCenterProps) {
  const gltf = useLoader(GLTFLoader, '/bottle4.glb');
  const capRef = useRef<Mesh>(null);
  const capTopRef = useRef<Mesh>(null);
  const labelRef = useRef<Mesh>(null);
  const labelOriginalMaterialRef = useRef<THREE.Material | null>(null);
  const { camera, gl } = useThree();
  const [isLoaded, setIsLoaded] = useState(false);
  const [bottleCenter, setBottleCenter] = useState<THREE.Vector3 | null>(null);

  // Notify parent of center changes
  useEffect(() => {
    onCenterChange(bottleCenter);
  }, [bottleCenter, onCenterChange]);

  useEffect(() => {
    // Rotate the entire bottle model to show label facing camera
    // Try 180 degrees around Y axis first - adjust if label is on different side
    gltf.scene.rotation.y = Math.PI; // 180 degrees
    
    // Traverse the model to find meshes
    gltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        const meshName = child.name.toLowerCase();
        
        if (meshName === 'cap' && !meshName.includes('top')) {
          capRef.current = child;
        } else if (meshName.includes('cap') && meshName.includes('top')) {
          capTopRef.current = child;
        } else if (meshName === 'label') {
          labelRef.current = child;
          console.log('Label mesh found:', child.name, 'Position:', child.position, 'Rotation:', child.rotation);
          // Store original material to preserve properties
          if (child.material) {
            labelOriginalMaterialRef.current = child.material;
          }
          // Make label double-sided so it's visible from both sides
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.side = THREE.DoubleSide;
          }
        }
        // Bottle body keeps original material/texture - no need to store ref
      }
    });

    setIsLoaded(true);
  }, [gltf]);

  // Fit camera to show full bottle (cap, label, and bottom) - only once
  useEffect(() => {
    if (!isLoaded) return;

    const fitCamera = () => {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      if (!box.isEmpty() && camera instanceof THREE.PerspectiveCamera) {
        const center = box.getCenter(new THREE.Vector3());
        setBottleCenter(center);
        const size = box.getSize(new THREE.Vector3());
        
        // Get viewport dimensions for aspect ratio calculation
        const aspect = gl.domElement.width / gl.domElement.height || 1;
        
        // Calculate distance based on height (Y dimension) to ensure full vertical visibility
        const fov = camera.fov * (Math.PI / 180);
        const fovRad = fov / 2;
        
        // Use height (Y) as primary dimension - this is critical for vertical bottles
        const height = size.y;
        const width = Math.max(size.x, size.z);
        
        // Calculate distance needed to fit height in viewport (vertical FOV)
        // For perspective camera, we need to account for the vertical field of view
        const distanceForHeight = (height / 2) / Math.tan(fovRad);
        
        // Calculate distance needed to fit width in viewport (horizontal FOV)
        // Horizontal FOV = 2 * atan(tan(vertical FOV / 2) * aspect)
        const horizontalFov = 2 * Math.atan(Math.tan(fovRad) * aspect);
        const distanceForWidth = (width / 2) / Math.tan(horizontalFov / 2);
        
        // Use the larger distance to ensure both height and width fit
        // Prioritize height to ensure top and bottom are visible
        let baseDistance = Math.max(distanceForHeight * 1.1, distanceForWidth);
        
        // Adjust padding for slightly smaller view (1.2 for balanced size)
        const cameraDistance = baseDistance * 1.2;
        
        // Position camera to face the label side (straight front view)
        // Centered position to ensure label is visible
        const targetPosition = new THREE.Vector3(
          center.x,
          center.y, // Keep camera at same height as center for symmetric vertical fit
          center.z + cameraDistance
        );
        
        camera.position.copy(targetPosition);
        camera.lookAt(center);
        camera.updateProjectionMatrix();
      }
    };

    // Try fitting with multiple attempts to ensure model is fully loaded
    fitCamera();
    const timeout1 = setTimeout(fitCamera, 300);
    const timeout2 = setTimeout(fitCamera, 600);
    const timeout3 = setTimeout(fitCamera, 1000);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
    };
  }, [gltf, camera, isLoaded]);

  // Update cap colors - only override if user has changed it
  useEffect(() => {
    if (!isLoaded) return;
    
    const capColorObj = new Color(capColor);
    if (capRef.current) {
      // Clone existing material or create new one
      const existingMaterial = capRef.current.material;
      if (existingMaterial instanceof THREE.MeshStandardMaterial) {
        capRef.current.material = existingMaterial.clone();
        const material = capRef.current.material as THREE.MeshStandardMaterial;
        material.color = capColorObj;
        material.roughness = 0.3; // Lower roughness for crisp look
        material.metalness = 0.2; // Slight metalness for better definition
      } else {
        capRef.current.material = new THREE.MeshStandardMaterial({
          color: capColorObj,
          roughness: 0.3,
          metalness: 0.2,
        });
      }
    }
    if (capTopRef.current) {
      const existingMaterial = capTopRef.current.material;
      if (existingMaterial instanceof THREE.MeshStandardMaterial) {
        capTopRef.current.material = existingMaterial.clone();
        const material = capTopRef.current.material as THREE.MeshStandardMaterial;
        material.color = capColorObj;
        material.roughness = 0.3; // Lower roughness for crisp look
        material.metalness = 0.2; // Slight metalness for better definition
      } else {
        capTopRef.current.material = new THREE.MeshStandardMaterial({
          color: capColorObj,
          roughness: 0.3,
          metalness: 0.2,
        });
      }
    }
  }, [capColor, isLoaded]);

  // Update label texture - only override if user has uploaded a texture
  useEffect(() => {
    if (!isLoaded) return;
    
    if (labelRef.current && labelTexture) {
      const loader = new THREE.TextureLoader();
      loader.load(
        labelTexture,
        (texture) => {
          // Label UV mapping area dimensions (from canvas size)
          const LABEL_UV_WIDTH = 2000;
          const LABEL_UV_HEIGHT = 544;
          const LABEL_UV_ASPECT = LABEL_UV_WIDTH / LABEL_UV_HEIGHT; // ≈ 3.676
          
          // Get image dimensions
          const imageWidth = texture.image.width;
          const imageHeight = texture.image.height;
          const imageAspect = imageWidth / imageHeight;
          
          // Try different flipY - GLB models often need false, but some need true
          texture.flipY = false;
          // Use ClampToEdgeWrapping to prevent texture bleeding
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          
          // Calculate repeat and offset to fit image to UV mapping
          // We want to cover the entire UV area while maintaining aspect ratio
          let repeatX: number;
          let repeatY: number;
          let offsetX: number;
          let offsetY: number;
          
          if (imageAspect > LABEL_UV_ASPECT) {
            // Image is wider than UV area - scale to fit height, crop width
            // Scale factor based on height
            repeatY = 1.0; // Full height
            repeatX = imageAspect / LABEL_UV_ASPECT; // Scale width proportionally
            offsetX = (1 - repeatX) / 2; // Center horizontally
            offsetY = 0; // No vertical offset
          } else {
            // Image is taller than UV area - scale to fit width, crop height
            // Scale factor based on width
            repeatX = 1.0; // Full width
            repeatY = LABEL_UV_ASPECT / imageAspect; // Scale height proportionally
            offsetX = 0; // No horizontal offset
            offsetY = (1 - repeatY) / 2; // Center vertically
          }
          
          texture.repeat.set(repeatX, repeatY);
          texture.offset.set(offsetX, offsetY);
          
          // Use high-quality filtering for crisp images
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
              console.log('Label texture applied to material:', {
                hasTexture: !!newMaterial.map,
                side: newMaterial.side,
                labelPosition: labelRef.current?.position,
                labelRotation: labelRef.current?.rotation
              });
            }
            
            labelRef.current.material = newMaterial;
            
            // Force update the label mesh
            if (labelRef.current) {
              labelRef.current.updateMatrix();
              labelRef.current.updateMatrixWorld(true);
            }
            
            // Ensure geometry UVs are updated
            if (geometry && geometry.attributes.uv) {
              geometry.attributes.uv.needsUpdate = true;
              geometry.computeBoundingBox();
            }
          }
        },
        undefined,
        (error) => {
          console.error('Error loading label texture:', error);
        }
      );
    } else if (labelRef.current && !labelTexture && labelOriginalMaterialRef.current) {
      // Restore original material when no custom texture
      labelRef.current.material = labelOriginalMaterialRef.current;
    }
  }, [labelTexture, isLoaded]);

  return (
    <>
      <primitive object={gltf.scene} />
      <SetupControls center={bottleCenter} />
    </>
  );
}

function CameraController({ 
  view, 
  onViewChange,
  bottleCenter
}: { 
  view: string | null; 
  onViewChange: (view: string | null) => void;
  bottleCenter: THREE.Vector3 | null;
}) {
  const { camera, gl, scene } = useThree();

  useEffect(() => {
    if (view && bottleCenter) {
      // Calculate optimal distance based on bottle size
      const box = new THREE.Box3().setFromObject(scene);
      if (!box.isEmpty() && camera instanceof THREE.PerspectiveCamera) {
        const size = box.getSize(new THREE.Vector3());
        const maxSize = Math.max(size.x, size.y, size.z);
        const aspect = gl.domElement.width / gl.domElement.height || 1;
        const fov = camera.fov * (Math.PI / 180);
        const fovRad = fov / 2;
        const distance = (maxSize / 2) / Math.tan(fovRad) * 1.2;
        
        switch (view) {
          case 'front':
            camera.position.set(bottleCenter.x, bottleCenter.y, bottleCenter.z + distance);
            camera.lookAt(bottleCenter);
            break;
          case 'back':
            camera.position.set(bottleCenter.x, bottleCenter.y, bottleCenter.z - distance);
            camera.lookAt(bottleCenter);
            break;
          case 'left':
            camera.position.set(bottleCenter.x - distance, bottleCenter.y, bottleCenter.z);
            camera.lookAt(bottleCenter);
            break;
          case 'right':
            camera.position.set(bottleCenter.x + distance, bottleCenter.y, bottleCenter.z);
            camera.lookAt(bottleCenter);
            break;
          case 'top':
            camera.position.set(bottleCenter.x, bottleCenter.y + distance, bottleCenter.z);
            camera.lookAt(bottleCenter);
            break;
          case 'bottom':
            camera.position.set(bottleCenter.x, bottleCenter.y - distance, bottleCenter.z);
            camera.lookAt(bottleCenter);
            break;
          default:
            camera.position.set(bottleCenter.x, bottleCenter.y, bottleCenter.z + distance);
            camera.lookAt(bottleCenter);
        }
      } else {
        // Fallback to fixed distance if bottle center not available
        const distance = 5;
        switch (view) {
          case 'front':
            camera.position.set(0, 0, distance);
            camera.lookAt(0, 0, 0);
            break;
          case 'back':
            camera.position.set(0, 0, -distance);
            camera.lookAt(0, 0, 0);
            break;
          case 'left':
            camera.position.set(-distance, 0, 0);
            camera.lookAt(0, 0, 0);
            break;
          case 'right':
            camera.position.set(distance, 0, 0);
            camera.lookAt(0, 0, 0);
            break;
          case 'top':
            camera.position.set(0, distance, 0);
            camera.lookAt(0, 0, 0);
            break;
          case 'bottom':
            camera.position.set(0, -distance, 0);
            camera.lookAt(0, 0, 0);
            break;
        }
      }
      
      camera.updateProjectionMatrix();
      
      // Wait for render then download and reset with contrast enhancement
      setTimeout(() => {
        const canvas = gl.domElement;
        const width = canvas.width;
        const height = canvas.height;
        
        // Create a temporary canvas for image processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        
        if (tempCtx) {
          // Draw the original image
          tempCtx.drawImage(canvas, 0, 0);
          
          // Get image data
          const imageData = tempCtx.getImageData(0, 0, width, height);
          const data = imageData.data;
          
          // Apply contrast enhancement
          const contrast = 1.3; // Increase contrast by 30%
          const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
          
          for (let i = 0; i < data.length; i += 4) {
            // Apply contrast to RGB channels
            data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));     // R
            data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128)); // G
            data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128)); // B
            // Alpha channel stays the same
          }
          
          // Put processed image data back
          tempCtx.putImageData(imageData, 0, 0);
          
          // Convert to data URL and download
          const dataUrl = tempCanvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `bottle-${view}-view.png`;
          link.href = dataUrl;
          link.click();
        } else {
          // Fallback to original if processing fails
          const dataUrl = gl.domElement.toDataURL('image/png');
          const link = document.createElement('a');
          link.download = `bottle-${view}-view.png`;
          link.href = dataUrl;
          link.click();
        }
        
        onViewChange(null);
      }, 500);
    }
  }, [view, camera, gl, onViewChange, bottleCenter, scene]);

  return null;
}

export interface BottleViewerRef {
  downloadView: (view: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom') => void;
}

const BottleViewer = forwardRef<BottleViewerRef>((props, ref) => {
  const capColor = useDesignStore((state) => state.capColor);
  const labelTexture = useDesignStore((state) => state.labelTexture);
  const { theme } = useThemeStore();
  const [downloadView, setDownloadView] = useState<string | null>(null);
  const [bottleCenter, setBottleCenter] = useState<THREE.Vector3 | null>(null);

  useImperativeHandle(ref, () => ({
    downloadView: (view: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom') => {
      setDownloadView(view);
    },
  }));

  // Get background color based on theme
  const backgroundColor = theme === 'light' ? '#ededed' : '#1E1E1E';

  return (
    <div 
      className="w-full h-full transition-colors"
      style={{ backgroundColor }}
    >
      <Canvas
        gl={{ 
          preserveDrawingBuffer: true,
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance'
        }}
        camera={{ position: [0, 1, 7], fov: 85 }}
      >
        <color attach="background" args={[backgroundColor]} />
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 1, 7]} fov={85} />
          <BottleModelWithCenter 
            capColor={capColor} 
            labelTexture={labelTexture}
            onCenterChange={setBottleCenter}
          />
          <CameraController 
            view={downloadView} 
            onViewChange={setDownloadView}
            bottleCenter={bottleCenter}
          />
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={2.5} />
          <directionalLight position={[-5, 5, -5]} intensity={1.8} />
          <directionalLight position={[0, 10, 0]} intensity={1.2} />
          <pointLight position={[0, 5, 5]} intensity={0.8} />
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={0.3}
            maxDistance={20}
            minPolarAngle={0}
            maxPolarAngle={Math.PI}
            enabled={!downloadView}
            zoomSpeed={1.5}
            panSpeed={0.8}
            rotateSpeed={0.5}
            makeDefault
            target={[0, 0, 0]}
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

BottleViewer.displayName = 'BottleViewer';

export default BottleViewer;
