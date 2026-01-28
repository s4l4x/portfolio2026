import { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useControls, folder } from 'leva';
import * as THREE from 'three';

import backgroundVert from '../shaders/background.vert?raw';
import backgroundFrag from '../shaders/background.frag?raw';

interface ColorSet {
  colorA: THREE.Color;
  colorB: THREE.Color;
  colorC: THREE.Color;
}

// Shape configurations matching the SDF sizes
interface ShapeState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  angularVel: THREE.Vector3;
  basePos: THREE.Vector3;
  radius: number; // Bounding radius for SDF approximation
}

const SHAPE_CONFIGS = [
  { basePos: [5.0, -3.0, -8.0], radius: 2.5 },      // Large sphere - far right
  { basePos: [-5.0, 2.5, -6.0], radius: 1.7 },      // Cube - far left
  { basePos: [2.0, 5.0, -5.0], radius: 1.5 },       // Cone - top
  { basePos: [-3.0, -4.0, -4.5], radius: 0.9 },     // Small sphere - bottom left
  { basePos: [0.0, -1.0, -7.0], radius: 1.5 },      // Octahedron - center
];

// SDF functions (matching shader)
function sdSphere(p: THREE.Vector3, r: number): number {
  return p.length() - r;
}

function sdBox(p: THREE.Vector3, b: THREE.Vector3): number {
  const q = new THREE.Vector3(
    Math.abs(p.x) - b.x,
    Math.abs(p.y) - b.y,
    Math.abs(p.z) - b.z
  );
  const qClamped = new THREE.Vector3(
    Math.max(q.x, 0),
    Math.max(q.y, 0),
    Math.max(q.z, 0)
  );
  return qClamped.length() + Math.min(Math.max(q.x, Math.max(q.y, q.z)), 0);
}

function sdOctahedron(p: THREE.Vector3, s: number): number {
  const ap = new THREE.Vector3(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
  return (ap.x + ap.y + ap.z - s) * 0.57735027;
}

// Get SDF distance for a shape at origin
function getShapeSDF(shapeIndex: number, p: THREE.Vector3): number {
  switch (shapeIndex) {
    case 0: return sdSphere(p, 2.5);
    case 1: return sdBox(p, new THREE.Vector3(1.2, 1.2, 1.2));
    case 2: return sdSphere(p, 1.2); // Approximate cone with sphere
    case 3: return sdSphere(p, 0.9);
    case 4: return sdOctahedron(p, 1.5);
    default: return sdSphere(p, 1.0);
  }
}

// Sphere march from shape A toward shape B to find surface distance
function sphereMarchToSurface(shapeIndex: number, startPos: THREE.Vector3, dir: THREE.Vector3, maxDist: number): number {
  let t = 0;
  const p = new THREE.Vector3();

  for (let i = 0; i < 16; i++) {
    p.copy(dir).multiplyScalar(t).add(startPos);
    const d = getShapeSDF(shapeIndex, p);
    if (d < 0.01) return t;
    if (t > maxDist) return maxDist;
    t += d;
  }
  return t;
}

// Get accurate distance between two shapes using sphere marching
function getShapeDistance(
  indexA: number, posA: THREE.Vector3, rotA: THREE.Euler,
  indexB: number, posB: THREE.Vector3, rotB: THREE.Euler
): number {
  // Vector from A to B
  const diff = new THREE.Vector3().subVectors(posB, posA);
  const centerDist = diff.length();

  if (centerDist < 0.001) return -10; // Overlapping centers

  const dir = diff.clone().normalize();

  // Transform direction into each shape's local space for accurate SDF
  const dirLocalA = dir.clone();
  const dirLocalB = dir.clone().negate();

  // Apply inverse rotation to get local direction
  const quatA = new THREE.Quaternion().setFromEuler(rotA);
  const quatB = new THREE.Quaternion().setFromEuler(rotB);
  dirLocalA.applyQuaternion(quatA.invert());
  dirLocalB.applyQuaternion(quatB.invert());

  // March from center of A toward B
  const distA = sphereMarchToSurface(indexA, new THREE.Vector3(0, 0, 0), dirLocalA, SHAPE_CONFIGS[indexA].radius * 2);

  // March from center of B toward A
  const distB = sphereMarchToSurface(indexB, new THREE.Vector3(0, 0, 0), dirLocalB, SHAPE_CONFIGS[indexB].radius * 2);

  // Distance between surfaces
  return centerDist - distA - distB;
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

  const size = 32;
  canvas.width = size;
  canvas.height = size;
  ctx.drawImage(img, 0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;

  const regions = [
    { x: 0, y: 0, w: size / 2, h: size / 2 },
    { x: size / 2, y: 0, w: size / 2, h: size / 2 },
    { x: 0, y: size / 2, w: size, h: size / 2 },
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

  // Physics controls - uses Leva in dev, stubbed with defaults in prod
  const physics = useControls('Physics', {
    collision: folder({
      repulsionStrength: { value: 30, min: 0, max: 50, step: 1 },
      minDistance: { value: 3.0, min: 0, max: 8, step: 0.1 },
      positionCorrection: { value: 0.9, min: 0, max: 1, step: 0.05 },
      iterations: { value: 8, min: 1, max: 15, step: 1 },
    }),
    movement: folder({
      springStrength: { value: 0.3, min: 0, max: 2, step: 0.1 },
      damping: { value: 0.92, min: 0.8, max: 0.999, step: 0.001 },
      wanderRadius: { value: 1.0, min: 0, max: 5, step: 0.1 },
      wanderSpeed: { value: 0.08, min: 0, max: 0.5, step: 0.01 },
    }),
    rotation: folder({
      angularDamping: { value: 0.96, min: 0.9, max: 0.999, step: 0.001 },
      torqueOnCollision: { value: 0.2, min: 0, max: 2, step: 0.1 },
    }),
  });

  // Initialize shape states
  const shapes = useRef<ShapeState[]>(
    SHAPE_CONFIGS.map(config => ({
      position: new THREE.Vector3(...config.basePos),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        0
      ),
      rotation: new THREE.Euler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      ),
      angularVel: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3
      ),
      basePos: new THREE.Vector3(...config.basePos),
      radius: config.radius,
    }))
  );

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
      // Physics-driven positions
      uShapePos0: { value: new THREE.Vector3(...SHAPE_CONFIGS[0].basePos) },
      uShapePos1: { value: new THREE.Vector3(...SHAPE_CONFIGS[1].basePos) },
      uShapePos2: { value: new THREE.Vector3(...SHAPE_CONFIGS[2].basePos) },
      uShapePos3: { value: new THREE.Vector3(...SHAPE_CONFIGS[3].basePos) },
      uShapePos4: { value: new THREE.Vector3(...SHAPE_CONFIGS[4].basePos) },
      // Physics-driven rotations
      uShapeRot0: { value: new THREE.Vector3(0, 0, 0) },
      uShapeRot1: { value: new THREE.Vector3(0, 0, 0) },
      uShapeRot2: { value: new THREE.Vector3(0, 0, 0) },
      uShapeRot3: { value: new THREE.Vector3(0, 0, 0) },
      uShapeRot4: { value: new THREE.Vector3(0, 0, 0) },
    }),
    []
  );

  const tempVec = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, delta) => {
    if (!materialRef.current) return;

    const dt = Math.min(delta, 0.05); // Cap delta to avoid instability
    const time = performance.now() * 0.001;

    // Update physics for each shape
    for (let i = 0; i < shapes.current.length; i++) {
      const shape = shapes.current[i];

      // Wandering force toward animated target
      const scrollOffset = scrollY * (2 + i * 0.5);
      const targetX = shape.basePos.x + Math.sin(time * physics.wanderSpeed + i) * physics.wanderRadius;
      const targetY = shape.basePos.y + Math.cos(time * physics.wanderSpeed * 0.8 + i * 2) * physics.wanderRadius + scrollOffset;
      const targetZ = shape.basePos.z;

      tempVec.set(
        targetX - shape.position.x,
        targetY - shape.position.y,
        targetZ - shape.position.z
      );

      // Spring force toward target
      shape.velocity.add(tempVec.multiplyScalar(physics.springStrength * dt));

      // Damping
      shape.velocity.multiplyScalar(physics.damping);

      // Angular damping
      shape.angularVel.multiplyScalar(physics.angularDamping);

      // Update rotation
      shape.rotation.x += shape.angularVel.x * dt;
      shape.rotation.y += shape.angularVel.y * dt;
      shape.rotation.z += shape.angularVel.z * dt;
    }

    // SDF-based collision response - run multiple iterations for stability
    for (let iter = 0; iter < physics.iterations; iter++) {
      for (let i = 0; i < shapes.current.length; i++) {
        for (let j = i + 1; j < shapes.current.length; j++) {
          const shapeA = shapes.current[i];
          const shapeB = shapes.current[j];

          const dist = getShapeDistance(
            i, shapeA.position, shapeA.rotation,
            j, shapeB.position, shapeB.rotation
          );

          if (dist < physics.minDistance) {
            // Direction from A to B
            tempVec.subVectors(shapeB.position, shapeA.position);
            const len = tempVec.length();
            if (len > 0.001) {
              tempVec.normalize();

              // Strong repulsion force - exponentially stronger as shapes get closer
              const overlap = physics.minDistance - dist;
              const force = overlap * physics.repulsionStrength * (1 + overlap * 2);

              // Push shapes apart immediately (position correction)
              const correction = overlap * physics.positionCorrection;
              shapeA.position.sub(tempVec.clone().multiplyScalar(correction * 0.5));
              shapeB.position.add(tempVec.clone().multiplyScalar(correction * 0.5));

              // Also add velocity impulse
              shapeA.velocity.sub(tempVec.clone().multiplyScalar(force * dt * 0.5));
              shapeB.velocity.add(tempVec.clone().multiplyScalar(force * dt * 0.5));

              // Add torque on collision for more dynamic rotation
              const torque = physics.torqueOnCollision * overlap;
              shapeA.angularVel.x += (Math.random() - 0.5) * torque;
              shapeA.angularVel.y += (Math.random() - 0.5) * torque;
              shapeB.angularVel.x += (Math.random() - 0.5) * torque;
              shapeB.angularVel.y += (Math.random() - 0.5) * torque;
            }
          }
        }
      }
    }

    // Apply velocities and update uniforms
    for (let i = 0; i < shapes.current.length; i++) {
      const shape = shapes.current[i];
      shape.position.add(shape.velocity.clone().multiplyScalar(dt));

      // Update shader uniforms
      const posUniform = materialRef.current.uniforms[`uShapePos${i}`];
      const rotUniform = materialRef.current.uniforms[`uShapeRot${i}`];

      if (posUniform) {
        posUniform.value.copy(shape.position);
      }
      if (rotUniform) {
        rotUniform.value.set(shape.rotation.x, shape.rotation.y, shape.rotation.z);
      }
    }

    // Update other uniforms
    materialRef.current.uniforms.uTime.value += delta;
    materialRef.current.uniforms.uScroll.value +=
      (scrollY - materialRef.current.uniforms.uScroll.value) * 0.1;

    // Smoothly interpolate colors
    const lerpFactor = 1 - Math.pow(0.05, delta);
    currentColors.current.colorA.lerp(targetColors.colorA, lerpFactor);
    currentColors.current.colorB.lerp(targetColors.colorB, lerpFactor);
    currentColors.current.colorC.lerp(targetColors.colorC, lerpFactor);
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

  useEffect(() => {
    const handleScroll = () => {
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
    handleScroll();

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
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        // Extend into safe areas (notch, status bar, etc.)
        paddingTop: 'env(safe-area-inset-top)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        marginTop: 'calc(-1 * env(safe-area-inset-top))',
        marginRight: 'calc(-1 * env(safe-area-inset-right))',
        marginBottom: 'calc(-1 * env(safe-area-inset-bottom))',
        marginLeft: 'calc(-1 * env(safe-area-inset-left))',
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
