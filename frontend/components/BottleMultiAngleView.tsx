'use client';

import { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
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

  useEffect(() => {
    if (bottleCenter && !isInitialized) {
      const fitCamera = () => {
        const box = new THREE.Box3().setFromObject(scene);
        if (!box.isEmpty() && camera instanceof THREE.PerspectiveCamera) {
          const size = box.getSize(new THREE.Vector3());
          const center = box.getCenter(new THREE.Vector3());

          const aspect = gl.domElement.clientWidth / gl.domElement.clientHeight || 1;
          const fovRad = (camera.fov * Math.PI) / 180 / 2;

          const distanceForHeight = (size.y / 2) / Math.tan(fovRad);
          const horizontalFov = 2 * Math.atan(Math.tan(fovRad) * aspect);
          const distanceForWidth = (Math.max(size.x, size.z) / 2) / Math.tan(horizontalFov / 2);

          const cameraDistance = Math.max(distanceForHeight, distanceForWidth) * 1.4;

          camera.position.set(center.x, center.y, center.z + cameraDistance);
          camera.lookAt(center);
          camera.updateProjectionMatrix();

          if (controlsRef.current) {
            controlsRef.current.target.copy(center);
            controlsRef.current.update();
          }

          setIsInitialized(true);
        }
      };

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
          enableZoom={false}
          enablePan={false}
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
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    gltf.scene.rotation.y = Math.PI;

    let labelFound = false;

    gltf.scene.traverse((child) => {
      if (child instanceof Mesh) {
        const meshName = child.name.toLowerCase();

        if (meshName === 'cap' && !meshName.includes('top')) {
          capRef.current = child;
        } else if (meshName === 'label') {
          labelRef.current = child;
          labelFound = true;
          if (child.material) {
            // Clone the original material so we always have a clean reference
            labelOriginalMaterialRef.current = (child.material as THREE.Material).clone();
          }
          if (child.material instanceof THREE.MeshStandardMaterial) {
            child.material.side = THREE.DoubleSide;
          }
        }
      }
    });

    if (!labelFound) {
      console.warn('Label mesh not found in model. Available meshes:');
      gltf.scene.traverse((child) => {
        if (child instanceof Mesh) console.log('  -', child.name);
      });
    }

    setIsLoaded(true);
  }, [gltf]);

  useEffect(() => {
    if (isLoaded) {
      const box = new THREE.Box3().setFromObject(gltf.scene);
      if (!box.isEmpty()) {
        const center = box.getCenter(new THREE.Vector3());
        onCenterChange(center);
      }
    }
  }, [isLoaded, gltf.scene, onCenterChange]);

  useEffect(() => {
    if (capRef.current && capRef.current.material instanceof THREE.MeshStandardMaterial) {
      capRef.current.material.color = new THREE.Color(capColor);
    }
  }, [capColor]);

  useEffect(() => {
    if (!isLoaded || !labelRef.current) return;

    // Reset to original material when no image
    if (!labelImage || typeof labelImage !== 'string' || labelImage.trim() === '') {
      if (labelRef.current && labelOriginalMaterialRef.current) {
        labelRef.current.material = labelOriginalMaterialRef.current.clone();
      }
      return;
    }

    const trimmedUrl = labelImage.trim();
    const isDataUrl = trimmedUrl.startsWith('data:');
    const isExternalUrl =
      trimmedUrl.startsWith('http://') ||
      trimmedUrl.startsWith('https://');
    const isRelativeUrl = trimmedUrl.startsWith('/');

    if (!isDataUrl && !isExternalUrl && !isRelativeUrl) {
      console.warn('[Label Texture] Unrecognised URL format, skipping:', trimmedUrl.substring(0, 60));
      return;
    }

    let isCancelled = false;
    let ownedTexture: THREE.Texture | null = null;

    // ── Pre-flight CORS check (external URLs only) ──────────────────────────
    // This tells us immediately whether S3 is actually returning CORS headers.
    if (isExternalUrl) {
      fetch(trimmedUrl, { method: 'HEAD', mode: 'cors' })
        .then((res) => {
          const acao = res.headers.get('access-control-allow-origin');
          console.log('[Label Texture] 🔍 CORS preflight:', {
            status: res.status,
            'access-control-allow-origin': acao,
            url: trimmedUrl.substring(0, 100),
          });
          if (!acao) {
            console.warn(
              '[Label Texture] ⚠️ S3 did NOT return Access-Control-Allow-Origin. ' +
              'Check bucket CORS config and ensure the object is publicly accessible.'
            );
          }
        })
        .catch((err) => {
          console.warn('[Label Texture] ⚠️ CORS preflight fetch failed:', err?.message || err);
        });
    }

    const loader = new THREE.TextureLoader();

    // For data: URLs — no crossOrigin needed (browser handles natively).
    // For same-origin URLs — no crossOrigin needed.
    // For cross-origin URLs — MUST set crossOrigin before loading.
    if (isExternalUrl) {
      const isSameOrigin =
        typeof window !== 'undefined' &&
        trimmedUrl.startsWith(window.location.origin);
      if (!isSameOrigin) {
        loader.crossOrigin = 'anonymous';
      }
    }

    console.log('[Label Texture] ▶ Starting load:', {
      type: isDataUrl ? 'data-url' : isExternalUrl ? 'external' : 'relative',
      crossOrigin: loader.crossOrigin,
      url: trimmedUrl.substring(0, 120),
    });

    loader.load(
      trimmedUrl,
      (texture) => {
        if (isCancelled) {
          texture.dispose();
          return;
        }

        if (!labelRef.current) {
          texture.dispose();
          return;
        }

        ownedTexture = texture;

        const LABEL_UV_WIDTH = 2081;
        const LABEL_UV_HEIGHT = 544;
        const LABEL_UV_ASPECT = LABEL_UV_WIDTH / LABEL_UV_HEIGHT;

        const imageWidth = texture.image?.width ?? 1;
        const imageHeight = texture.image?.height ?? 1;
        const imageAspect = imageWidth / imageHeight;

        texture.flipY = false;
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.minFilter = THREE.LinearMipmapLinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = true;
        texture.anisotropy = 16;

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
        texture.needsUpdate = true;

        if (isCancelled || !labelRef.current) {
          texture.dispose();
          ownedTexture = null;
          return;
        }

        // Dispose of the OLD material's map before replacing
        const prevMaterial = labelRef.current.material;
        if (
          prevMaterial instanceof THREE.MeshStandardMaterial &&
          prevMaterial.map &&
          prevMaterial !== labelOriginalMaterialRef.current
        ) {
          prevMaterial.map.dispose();
          prevMaterial.dispose();
        }

        // Always clone the original so we keep its base properties (roughness map, normals, etc.)
        const newMaterial =
          labelOriginalMaterialRef.current instanceof THREE.MeshStandardMaterial
            ? (labelOriginalMaterialRef.current.clone() as THREE.MeshStandardMaterial)
            : new THREE.MeshStandardMaterial();

        newMaterial.map = texture;
        newMaterial.roughness = 0.3;
        newMaterial.metalness = 0.1;
        newMaterial.side = THREE.DoubleSide;
        newMaterial.transparent = false;
        newMaterial.opacity = 1.0;
        newMaterial.needsUpdate = true;

        labelRef.current.material = newMaterial;
        labelRef.current.visible = true;
        labelRef.current.updateMatrixWorld(true);

        const geometry = labelRef.current.geometry;
        if (geometry?.attributes.uv) {
          geometry.attributes.uv.needsUpdate = true;
          geometry.computeBoundingBox();
        }

        console.log('[Label Texture] ✅ Applied successfully');
      },
      undefined,
      (error) => {
        if (isCancelled) return;

        // Provide a more descriptive error message
        const errorMessage =
          error instanceof ErrorEvent
            ? error.message
            : error instanceof Error
            ? error.message
            : JSON.stringify(error);

        console.error('[Label Texture] ❌ Load failed:', errorMessage || error);

        // Reset to original material on failure
        if (labelRef.current && labelOriginalMaterialRef.current) {
          labelRef.current.material = labelOriginalMaterialRef.current.clone();
        }
      }
    );

    return () => {
      isCancelled = true;

      // Only dispose the texture we created in this run, not one that was already
      // handed off to a material (the material owns it now).
      if (ownedTexture && labelRef.current) {
        const currentMaterial = labelRef.current.material;
        if (
          currentMaterial instanceof THREE.MeshStandardMaterial &&
          currentMaterial.map === ownedTexture
        ) {
          // The texture is owned by the live material — leave it alone; the
          // next effect run will dispose it before creating a new one.
        } else {
          // The texture never made it onto a material (e.g. cancelled mid-load)
          ownedTexture.dispose();
        }
      }

      ownedTexture = null;
    };
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
  const backgroundColor = theme === 'dark' ? '#000000' : '#f5f5f5';

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
            Interactive 3D Preview — Drag to rotate
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
          camera={{ position: [0, 0, 12], fov: 45, near: 0.1, far: 1000 }}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ camera }) => {
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
        </div>
      )}
    </div>
  );
}