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
  snap: number;
  hover: boolean;
}

function TiledMesh({ src, snap, hover }: TiledMeshProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const texture = useTexture(src, (loadedTexture) => {
    // Configure texture on load
    loadedTexture.minFilter = THREE.LinearFilter;
    loadedTexture.magFilter = THREE.LinearFilter;
  });
  const { viewport } = useThree();
  const targetSnap = useRef(snap);
  const targetScale = useRef(1);

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

    // Smooth hover scale
    if (groupRef.current) {
      targetScale.current = hover ? 0.94 : 1;
      const currentScale = groupRef.current.scale.x;
      const newScale = currentScale + (targetScale.current - currentScale) * 0.12;
      groupRef.current.scale.set(newScale, newScale, 1);
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
  );
}

interface TiledImageProps {
  src: string;
  alt: string;
  className?: string;
  hover?: boolean;
}

export function TiledImage({ src, alt, className, hover = false }: TiledImageProps) {
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
        <TiledMesh src={src} snap={snap} hover={hover} />
      </Canvas>
    </div>
  );
}
