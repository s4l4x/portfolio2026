import { useRef, useEffect, useMemo, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

import tiledImageVert from '../shaders/tiledImage.vert?raw';
import tiledImageFrag from '../shaders/tiledImage.frag?raw';

const GRID_X = 12;
const GRID_Y = 9;
const TILE_COUNT = GRID_X * GRID_Y;

interface TiledMeshProps {
  src: string;
  foregroundSrc?: string;
  snap: number;
  hover: boolean;
}

function TiledMesh({ src, foregroundSrc, snap, hover }: TiledMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const fgRef = useRef<THREE.Mesh>(null);

  const texturePaths = foregroundSrc ? [src, foregroundSrc] : [src];
  const textures = useTexture(texturePaths, (loadedTextures) => {
    const textureArray = Array.isArray(loadedTextures) ? loadedTextures : [loadedTextures];
    textureArray.forEach(t => {
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
    });
  });
  const textureArray = Array.isArray(textures) ? textures : [textures];
  const texture = textureArray[0];
  const fgTexture = textureArray[1];

  const { viewport } = useThree();
  const targetSnap = useRef(snap);
  const targetScale = useRef(1);
  const targetFgScale = useRef(1);
  const targetFgY = useRef(0);

  // Calculate object-fit: cover UV transformation
  const { uvScale, uvOffset } = useMemo(() => {
    const image = texture.image as { width: number; height: number };
    const imageAspect = image.width / image.height;
    const containerAspect = viewport.width / viewport.height;

    const uvScale = new THREE.Vector2(1, 1);
    const uvOffset = new THREE.Vector2(0, 0);

    if (containerAspect > imageAspect) {
      // Container is wider - crop top/bottom
      const scale = imageAspect / containerAspect;
      uvScale.set(1, scale);
      uvOffset.set(0, (1 - scale) / 2);
    } else {
      // Container is taller - crop left/right
      const scale = containerAspect / imageAspect;
      uvScale.set(scale, 1);
      uvOffset.set((1 - scale) / 2, 0);
    }

    return { uvScale, uvOffset };
  }, [texture, viewport]);

  // Create instance attributes
  const { uvOffsets, indices } = useMemo(() => {
    const uvOffsets = new Float32Array(TILE_COUNT * 2);
    const indices = new Float32Array(TILE_COUNT);

    for (let y = 0; y < GRID_Y; y++) {
      for (let x = 0; x < GRID_X; x++) {
        const i = y * GRID_X + x;
        uvOffsets[i * 2] = x / GRID_X;
        uvOffsets[i * 2 + 1] = y / GRID_Y; // Bottom row samples from bottom of texture
        indices[i] = i;
      }
    }

    return { uvOffsets, indices };
  }, []);

  // Set up instance matrices
  useEffect(() => {
    if (!meshRef.current) return;

    const mesh = meshRef.current;
    const tileWidth = viewport.width / GRID_X;
    const tileHeight = viewport.height / GRID_Y;
    const dummy = new THREE.Object3D();

    for (let y = 0; y < GRID_Y; y++) {
      for (let x = 0; x < GRID_X; x++) {
        const i = y * GRID_X + x;

        // Position tiles in grid
        dummy.position.set(
          (x - GRID_X / 2 + 0.5) * tileWidth,
          (y - GRID_Y / 2 + 0.5) * tileHeight,
          0
        );
        dummy.scale.set(tileWidth, tileHeight, 1);
        dummy.updateMatrix();

        mesh.setMatrixAt(i, dummy.matrix);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
  }, [viewport]);

  // Uniforms
  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uTime: { value: 0 },
      uSnap: { value: snap },
      uGridSize: { value: new THREE.Vector2(GRID_X, GRID_Y) },
      uTileSize: { value: new THREE.Vector2(1 / GRID_X, 1 / GRID_Y) },
      uUvScale: { value: uvScale },
      uUvOffset: { value: uvOffset },
    }),
    [texture, uvScale, uvOffset]
  );

  // Animation loop
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const material = meshRef.current.material as THREE.ShaderMaterial;

    material.uniforms.uTime.value += delta;

    // Smooth snap transition
    targetSnap.current = snap;
    const currentSnap = material.uniforms.uSnap.value;
    material.uniforms.uSnap.value += (targetSnap.current - currentSnap) * 0.08;

    // Smooth hover scale for background
    if (groupRef.current) {
      targetScale.current = hover ? 0.94 : 1;
      const currentScale = groupRef.current.scale.x;
      const newScale = currentScale + (targetScale.current - currentScale) * 0.12;
      groupRef.current.scale.set(newScale, newScale, 1);
    }

    // Smooth hover scale/translate for foreground
    if (fgRef.current) {
      targetFgScale.current = hover ? 1.06 : 1;
      targetFgY.current = hover ? viewport.height * 0.03 : 0;

      const currentFgScale = fgRef.current.scale.x / viewport.width;
      const newFgScale = currentFgScale + (targetFgScale.current - currentFgScale) * 0.12;
      fgRef.current.scale.set(viewport.width * newFgScale, viewport.height * newFgScale, 1);

      const currentFgY = fgRef.current.position.y;
      const newFgY = currentFgY + (targetFgY.current - currentFgY) * 0.12;
      fgRef.current.position.y = newFgY;
    }
  });

  // Geometry with custom attributes
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(1, 1);

    // Add instance attributes
    geo.setAttribute(
      'aUvOffset',
      new THREE.InstancedBufferAttribute(uvOffsets, 2)
    );
    geo.setAttribute(
      'aIndex',
      new THREE.InstancedBufferAttribute(indices, 1)
    );

    return geo;
  }, [uvOffsets, indices]);

  return (
    <>
      <group ref={groupRef}>
        <instancedMesh ref={meshRef} args={[geometry, undefined, TILE_COUNT]}>
          <shaderMaterial
            vertexShader={tiledImageVert}
            fragmentShader={tiledImageFrag}
            uniforms={uniforms}
            transparent
          />
        </instancedMesh>
      </group>
      {fgTexture && (
        <mesh ref={fgRef} position={[0, 0, 2]} scale={[viewport.width, viewport.height, 1]} renderOrder={1}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={fgTexture} transparent depthWrite={false} />
        </mesh>
      )}
    </>
  );
}

interface TiledImageProps {
  src: string;
  foregroundSrc?: string;
  alt: string;
  className?: string;
  hover?: boolean;
}

export function TiledImage({ src, foregroundSrc, alt, className, hover = false }: TiledImageProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [snap, setSnap] = useState(1); // Start snapped, jostle when scrolling out

  // IntersectionObserver for snap state
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Snap when mostly visible
          if (entry.intersectionRatio > 0.6) {
            setSnap(1);
          } else if (entry.intersectionRatio < 0.3) {
            setSnap(0);
          } else {
            // Partial snap based on visibility
            setSnap(entry.intersectionRatio);
          }
        });
      },
      {
        threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0],
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', width: '100%', height: '100%' }}
      aria-label={alt}
    >
      <Canvas
        orthographic
        camera={{ zoom: 1, position: [0, 0, 5] }}
        gl={{ alpha: true, antialias: true }}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      >
        <TiledMesh src={src} foregroundSrc={foregroundSrc} snap={snap} hover={hover} />
      </Canvas>
    </div>
  );
}
