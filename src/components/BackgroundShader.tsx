import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

import backgroundVert from '../shaders/background.vert?raw';
import backgroundFrag from '../shaders/background.frag?raw';

interface ColorSet {
  colorA: THREE.Color;
  colorB: THREE.Color;
  colorC: THREE.Color;
}

// Extract dominant colors from an image
function extractColors(img: HTMLImageElement): ColorSet {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return {
      colorA: new THREE.Color(0.1, 0.1, 0.1),
      colorB: new THREE.Color(0.15, 0.15, 0.15),
      colorC: new THREE.Color(0.05, 0.05, 0.05),
    };
  }

  // Sample at small size for performance
  const size = 32;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;

  // Sample from different regions
  const regions = [
    { x: 0, y: 0, w: size / 2, h: size / 2 },           // top-left
    { x: size / 2, y: 0, w: size / 2, h: size / 2 },   // top-right
    { x: 0, y: size / 2, w: size, h: size / 2 },       // bottom
  ];

  const colors = regions.map(region => {
    let r = 0, g = 0, b = 0, count = 0;
    for (let y = region.y; y < region.y + region.h; y++) {
      for (let x = region.x; x < region.x + region.w; x++) {
        const i = (y * size + x) * 4;
        r += pixels[i];
        g += pixels[i + 1];
        b += pixels[i + 2];
        count++;
      }
    }
    return new THREE.Color(r / count / 255, g / count / 255, b / count / 255);
  });

  return {
    colorA: colors[0],
    colorB: colors[1],
    colorC: colors[2],
  };
}

interface ShaderPlaneProps {
  colors: ColorSet;
  targetColors: ColorSet;
  scrollY: number;
}

function ShaderPlane({ colors, targetColors, scrollY }: ShaderPlaneProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  // Animated color values
  const currentColors = useRef({
    colorA: colors.colorA.clone(),
    colorB: colors.colorB.clone(),
    colorC: colors.colorC.clone(),
  });

  const uniforms = useMemo(
    () => ({
      uColorA: { value: currentColors.current.colorA },
      uColorB: { value: currentColors.current.colorB },
      uColorC: { value: currentColors.current.colorC },
      uTime: { value: 0 },
      uScroll: { value: 0 },
      uResolution: { value: new THREE.Vector2(viewport.width, viewport.height) },
    }),
    []
  );

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta;
      // Smooth scroll value
      materialRef.current.uniforms.uScroll.value += (scrollY - materialRef.current.uniforms.uScroll.value) * 0.1;

      // Smoothly interpolate colors
      const lerpFactor = 1 - Math.pow(0.05, delta);
      currentColors.current.colorA.lerp(targetColors.colorA, lerpFactor);
      currentColors.current.colorB.lerp(targetColors.colorB, lerpFactor);
      currentColors.current.colorC.lerp(targetColors.colorC, lerpFactor);
    }
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <shaderMaterial
        ref={materialRef}
        vertexShader={backgroundVert}
        fragmentShader={backgroundFrag}
        uniforms={uniforms}
      />
    </mesh>
  );
}

interface BackgroundShaderProps {
  imageUrls: string[];
}

export function BackgroundShader({ imageUrls }: BackgroundShaderProps) {
  const [colorSets, setColorSets] = useState<ColorSet[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  const [targetColors, setTargetColors] = useState<ColorSet>({
    colorA: new THREE.Color(0.1, 0.1, 0.1),
    colorB: new THREE.Color(0.15, 0.15, 0.15),
    colorC: new THREE.Color(0.05, 0.05, 0.05),
  });

  // Load images and extract colors
  useEffect(() => {
    const loadColors = async () => {
      const sets = await Promise.all(
        imageUrls.map(
          (url) =>
            new Promise<ColorSet>((resolve) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(extractColors(img));
              img.onerror = () =>
                resolve({
                  colorA: new THREE.Color(0.1, 0.1, 0.1),
                  colorB: new THREE.Color(0.15, 0.15, 0.15),
                  colorC: new THREE.Color(0.05, 0.05, 0.05),
                });
              img.src = url;
            })
        )
      );
      setColorSets(sets);
      if (sets.length > 0) {
        setTargetColors(sets[0]);
      }
    };
    loadColors();
  }, [imageUrls]);

  // Track scroll position to determine visible project
  useEffect(() => {
    const handleScroll = () => {
      // Normalize scroll position (0 to 1 based on document height)
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const normalized = maxScroll > 0 ? window.scrollY / maxScroll : 0;
      setScrollY(normalized);

      const projectCards = document.querySelectorAll('.project-card');
      const viewportCenter = window.innerHeight / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      projectCards.forEach((card, index) => {
        const rect = card.getBoundingClientRect();
        const cardCenter = rect.top + rect.height / 2;
        const distance = Math.abs(cardCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== currentIndex && colorSets[closestIndex]) {
        setCurrentIndex(closestIndex);
        setTargetColors(colorSets[closestIndex]);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check

    return () => window.removeEventListener('scroll', handleScroll);
  }, [currentIndex, colorSets]);

  const initialColors = useMemo(
    () => ({
      colorA: new THREE.Color(0.1, 0.1, 0.1),
      colorB: new THREE.Color(0.15, 0.15, 0.15),
      colorC: new THREE.Color(0.05, 0.05, 0.05),
    }),
    []
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        pointerEvents: 'none',
      }}
    >
      <Canvas
        orthographic
        camera={{ zoom: 1, position: [0, 0, 1] }}
        gl={{ alpha: false, antialias: false }}
      >
        <ShaderPlane colors={initialColors} targetColors={targetColors} scrollY={scrollY} />
      </Canvas>
    </div>
  );
}
