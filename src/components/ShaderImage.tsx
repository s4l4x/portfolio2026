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
}

function ShaderPlane({ src, shaderType }: ShaderPlaneProps) {
  const texture = useTexture(src);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
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
  });

  return (
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
  );
}

interface ShaderImageProps {
  src: string;
  shaderType: ShaderType;
  alt: string;
  className?: string;
}

export function ShaderImage({ src, shaderType, alt, className }: ShaderImageProps) {
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
        <ShaderPlane src={src} shaderType={shaderType} />
      </Suspense>
    </Canvas>
  );
}
