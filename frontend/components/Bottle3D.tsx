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

interface BottleModelWithCenterProps extends BottleModelProps {
  onCenterChange: (center: THREE.Vector3) => void;
}

function BottleModelWithCenter({ capColor, labelTexture, onCenterChange }: BottleModelWithCenterProps) {
  const gltf = useLoader(GLTFLoader, '/bottle4.glb');
  const capRef = useRef<Mesh>(null);
  const capTopRef = useRef<Mesh>(null);
  const labelRef = useRef<Mesh>(null);
  const labelOriginalMaterialRef = useRef<THREE.Material | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Reset any existing rotations first
    gltf.scene.rotation.set(0, 0, 0);
    
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
          // Store original material
          if (child.material) {
            labelOriginalMaterialRef.current = child.material;
          }
          // Make label double-sided
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.side = THREE.DoubleSide;
          }
        }
      }
    });

    // Calculate and notify center
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const center = box.getCenter(new THREE.Vector3());
    onCenterChange(center);

    setIsLoaded(true);
  }, [gltf, onCenterChange]);

  // Update cap colors
  useEffect(() => {
    if (!isLoaded) return;
    
    const capColorObj = new Color(capColor);
    const capMaterial = new THREE.MeshStandardMaterial({
      color: capColorObj,
      roughness: 0.3,
      metalness: 0.2,
    });

    if (capRef.current) {
      capRef.current.material = capMaterial.clone();
    }
    if (capTopRef.current) {
      capTopRef.current.material = capMaterial.clone();
    }
  }, [capColor, isLoaded]);

  // Update label texture
  useEffect(() => {
    if (!isLoaded || !labelRef.current) return;
    
    if (labelTexture) {
      const loader = new THREE.TextureLoader();
      loader.load(
        labelTexture,
        (texture) => {
          const LABEL_UV_WIDTH = 2000;
          const LABEL_UV_HEIGHT = 544;
          const LABEL_UV_ASPECT = LABEL_UV_WIDTH / LABEL_UV_HEIGHT;
          
          const imageWidth = texture.image.width;
          const imageHeight = texture.image.height;
          const imageAspect = imageWidth / imageHeight;
          
          texture.flipY = false;
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;
          
          let repeatX: number, repeatY: number, offsetX: number, offsetY: number;
          
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
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;
          texture.generateMipmaps = true;
          texture.anisotropy = 16;
          
          if (labelRef.current) {
            const originalMaterial = labelOriginalMaterialRef.current;
            const newMaterial = originalMaterial instanceof THREE.MeshStandardMaterial
              ? originalMaterial.clone()
              : new THREE.MeshStandardMaterial();
            
            newMaterial.map = texture;
            newMaterial.roughness = 0.3;
            newMaterial.metalness = 0.1;
            newMaterial.side = THREE.DoubleSide;
            newMaterial.transparent = false;
            newMaterial.opacity = 1.0;
            newMaterial.needsUpdate = true;
            
            labelRef.current.material = newMaterial;
          }
        },
        undefined,
        (error) => console.error('Error loading label texture:', error)
      );
    } else if (labelOriginalMaterialRef.current) {
      labelRef.current.material = labelOriginalMaterialRef.current;
    }
  }, [labelTexture, isLoaded]);

  return <primitive object={gltf.scene} />;
}

function CameraSetup({ bottleCenter }: { bottleCenter: THREE.Vector3 | null }) {
  const { camera, controls, scene } = useThree();
  const [isSetup, setIsSetup] = useState(false);

  useEffect(() => {
    if (!bottleCenter || !(camera instanceof THREE.PerspectiveCamera)) return;

    const setupCamera = () => {
      try {
        const box = new THREE.Box3().setFromObject(scene);
        
        // Don't setup if box is invalid
        if (box.isEmpty()) {
          return false;
        }
        
        const size = box.getSize(new THREE.Vector3());
        
        // Use height as primary dimension for bottles
        const height = size.y;
        
        // Calculate distance with MORE padding - increased to 3.2 for extra zoom out
        const distance = height * 3.2;

        camera.position.set(
          bottleCenter.x,
          bottleCenter.y,
          bottleCenter.z + distance
        );
        camera.lookAt(bottleCenter);
        camera.updateProjectionMatrix();

        // Update orbit controls
        if (controls && 'target' in controls) {
          (controls as any).target.copy(bottleCenter);
          (controls as any).update();
        }
        
        return true;
      } catch (error) {
        console.error('Camera setup error:', error);
        return false;
      }
    };

    // Try multiple times to ensure model is loaded
    if (!isSetup) {
      const attempt1 = setTimeout(() => {
        if (setupCamera()) setIsSetup(true);
      }, 100);
      
      const attempt2 = setTimeout(() => {
        if (setupCamera()) setIsSetup(true);
      }, 300);
      
      const attempt3 = setTimeout(() => {
        if (setupCamera()) setIsSetup(true);
      }, 600);

      return () => {
        clearTimeout(attempt1);
        clearTimeout(attempt2);
        clearTimeout(attempt3);
      };
    }
  }, [bottleCenter, camera, controls, scene, isSetup]);

  return null;
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
    if (!view || !bottleCenter) return;

    // Calculate distance - same as CameraSetup
    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const height = size.y;
    const distance = height * 3.2; // Increased for even more zoom out
    
    switch (view) {
      case 'front':
        camera.position.set(bottleCenter.x, bottleCenter.y, bottleCenter.z + distance);
        break;
      case 'back':
        camera.position.set(bottleCenter.x, bottleCenter.y, bottleCenter.z - distance);
        break;
      case 'left':
        camera.position.set(bottleCenter.x - distance, bottleCenter.y, bottleCenter.z);
        break;
      case 'right':
        camera.position.set(bottleCenter.x + distance, bottleCenter.y, bottleCenter.z);
        break;
      case 'top':
        camera.position.set(bottleCenter.x, bottleCenter.y + distance, bottleCenter.z);
        break;
      case 'bottom':
        camera.position.set(bottleCenter.x, bottleCenter.y - distance, bottleCenter.z);
        break;
    }
    
    camera.lookAt(bottleCenter);
    camera.updateProjectionMatrix();
    
    // Capture and download
    setTimeout(() => {
      const dataUrl = gl.domElement.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `bottle-${view}-view.png`;
      link.href = dataUrl;
      link.click();
      onViewChange(null);
    }, 100);
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
      >
        <color attach="background" args={[backgroundColor]} />
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[0, 0, 22]} fov={45} />
          <BottleModelWithCenter 
            capColor={capColor} 
            labelTexture={labelTexture}
            onCenterChange={setBottleCenter}
          />
          <CameraSetup bottleCenter={bottleCenter} />
          <CameraController 
            view={downloadView} 
            onViewChange={setDownloadView}
            bottleCenter={bottleCenter}
          />
          
          {/* Improved lighting setup */}
          <ambientLight intensity={0.6} />
          <directionalLight position={[5, 5, 5]} intensity={1.0} castShadow />
          <directionalLight position={[-3, 3, -3]} intensity={0.5} />
          <pointLight position={[0, 5, 0]} intensity={0.3} />
          
          <OrbitControls
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={40}
            enabled={!downloadView}
            makeDefault
          />
        </Suspense>
      </Canvas>
    </div>
  );
});

BottleViewer.displayName = 'BottleViewer';

export default BottleViewer;