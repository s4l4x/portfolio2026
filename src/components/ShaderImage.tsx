import { Suspense, useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import { ShaderType } from '../types/project';

import colorCycleVert from '../shaders/colorCycle.vert?raw';
import colorCycleFrag from '../shaders/colorCycle.frag?raw';

interface ShaderPlaneProps {
  src: string;
  shaderType: ShaderType;
  hover: boolean;
}

function ShaderPlane({ src, shaderType, hover }: ShaderPlaneProps) {
  const texture = useTexture(src);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const targetScale = useRef(1);
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

    // Smooth hover scale
    if (groupRef.current) {
      targetScale.current = hover ? 0.94 : 1;
      const currentScale = groupRef.current.scale.x;
      const newScale = currentScale + (targetScale.current - currentScale) * 0.12;
      groupRef.current.scale.set(newScale, newScale, 1);
    }
  });

  return (
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
  );
}

interface ShaderImageProps {
  src: string;
  shaderType: ShaderType;
  alt: string;
  className?: string;
  hover?: boolean;
}

export function ShaderImage({ src, shaderType, alt, className, hover = false }: ShaderImageProps) {
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
        <ShaderPlane src={src} shaderType={shaderType} hover={hover} />
      </Suspense>
    </Canvas>
  );
}
