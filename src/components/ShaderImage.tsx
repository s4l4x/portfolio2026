import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ShaderType } from '../types/project';

import colorCycleVert from '../shaders/colorCycle.vert?raw';
import colorCycleFrag from '../shaders/colorCycle.frag?raw';

interface ShaderPlaneProps {
  src: string;
  foregroundSrc?: string;
  shaderType: ShaderType;
  hover: boolean;
}

function ShaderPlane({ src, foregroundSrc, shaderType, hover }: ShaderPlaneProps) {
  const texturePaths = foregroundSrc ? [src, foregroundSrc] : [src];
  const textures = useTexture(texturePaths);
  const textureArray = Array.isArray(textures) ? textures : [textures];
  const texture = textureArray[0];
  const fgTexture = textureArray[1];

  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const fgRef = useRef<THREE.Mesh>(null);
  const targetScale = useRef(1);
  const targetFgScale = useRef(1);
  const targetFgY = useRef(0);
  const { viewport } = useThree();

  const uniforms = useMemo(
    () => ({
      uTexture: { value: texture },
      uTime: { value: 0 },
    }),
    [texture]
  );

  const shaders = useMemo(() => {
    switch (shaderType) {
      case 'colorCycle':
        return { vertex: colorCycleVert, fragment: colorCycleFrag };
      default:
        return { vertex: colorCycleVert, fragment: colorCycleFrag };
    }
  }, [shaderType]);

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
    }

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

  return (
    <>
      <group ref={groupRef}>
        <mesh scale={[viewport.width, viewport.height, 1]}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            ref={materialRef}
            vertexShader={shaders.vertex}
            fragmentShader={shaders.fragment}
            uniforms={uniforms}
            transparent
          />
        </mesh>
      </group>
      {fgTexture && (
        <mesh ref={fgRef} position={[0, 0, 0.5]} scale={[viewport.width, viewport.height, 1]} renderOrder={1}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={fgTexture} transparent depthWrite={false} />
        </mesh>
      )}
    </>
  );
}

interface ShaderImageProps {
  src: string;
  foregroundSrc?: string;
  shaderType: ShaderType;
  alt: string;
  className?: string;
  hover?: boolean;
}

export function ShaderImage({ src, foregroundSrc, shaderType, alt, className, hover = false }: ShaderImageProps) {
  return (
    <Canvas
      className={className}
      orthographic
      camera={{ zoom: 1, position: [0, 0, 1] }}
      style={{ width: '100%', height: '100%' }}
      gl={{ alpha: true, antialias: true }}
      aria-label={alt}
    >
      <Suspense fallback={null}>
        <ShaderPlane src={src} foregroundSrc={foregroundSrc} shaderType={shaderType} hover={hover} />
      </Suspense>
    </Canvas>
  );
}
