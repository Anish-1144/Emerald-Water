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
    
    gltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        const meshName = child.name.toLowerCase();
        
        if (meshName === 'cap' && !meshName.includes('top')) {
          capRef.current = child;
        } else if (meshName === 'label') {
          labelRef.current = child;
          if (child.material) {
            labelOriginalMaterialRef.current = child.material;
          }
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.side = THREE.DoubleSide;
          }
        }
      }
    });

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

  // Apply label texture
  useEffect(() => {
    if (labelImage && labelRef.current) {
      const loader = new THREE.TextureLoader();
      loader.load(
        labelImage,
        (texture) => {
          texture.flipY = false;
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;
          
          if (labelRef.current) {
            const originalMaterial = labelOriginalMaterialRef.current;
            const newMaterial = originalMaterial instanceof THREE.MeshStandardMaterial
              ? originalMaterial.clone()
              : new THREE.MeshStandardMaterial();
            
            newMaterial.map = texture;
            newMaterial.needsUpdate = true;
            if (newMaterial instanceof THREE.MeshStandardMaterial) {
              newMaterial.side = THREE.DoubleSide;
            }
            labelRef.current.material = newMaterial;
          }
        },
        undefined,
        (error) => {
          console.error('Error loading label texture:', error);
        }
      );
    } else if (labelRef.current && !labelImage && labelOriginalMaterialRef.current) {
      labelRef.current.material = labelOriginalMaterialRef.current;
    }
  }, [labelImage]);

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
  
  if (!labelImage) {
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

