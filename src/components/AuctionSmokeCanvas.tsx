'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useMemo } from 'react';
import * as THREE from 'three';

const SmokeShader = {
  uniforms: {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2() }
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float u_time;
    uniform vec2 u_resolution;
    varying vec2 vUv;

    // Pseudo-random and noise functions
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    float noise(vec2 st) {
      vec2 i = floor(st);
      vec2 f = fract(st);

      float a = random(i);
      float b = random(i + vec2(1.0, 0.0));
      float c = random(i + vec2(0.0, 1.0));
      float d = random(i + vec2(1.0, 1.0));

      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    float fbm(vec2 st) {
      float value = 0.0;
      float amplitude = 0.5;
      float frequency = 0.0;
      for (int i = 0; i < 5; i++) {
        value += amplitude * noise(st);
        st *= 2.0;
        amplitude *= 0.5;
      }
      return value;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = u_resolution.x / max(u_resolution.y, 1.0);
      uv.x *= aspect;

      // Time variables for intense, highly turbulent smoke
      float t = u_time * 0.35;
      
      vec2 q = vec2(0.);
      q.x = fbm(uv * 1.5 + vec2(t));
      q.y = fbm(uv * 1.5 + vec2(1.0));

      vec2 r = vec2(0.);
      r.x = fbm(uv * 2.0 + 1.2 * q + vec2(t * 1.5, t * 1.1));
      r.y = fbm(uv * 2.0 + 1.2 * q + vec2(t * 0.7, t * 1.7));

      float f = fbm(uv * 2.5 + r);

      // High-intensity midnight blues and rich royal purples
      vec3 colorDarkBlue = vec3(0.01, 0.02, 0.10); 
      vec3 colorDeepPurple = vec3(0.12, 0.01, 0.25); 
      vec3 colorAuraBlue = vec3(0.08, 0.15, 0.40); 
      vec3 colorBlack = vec3(0.005, 0.005, 0.015); 

      vec3 finalColor = mix(
        colorBlack,
        colorDeepPurple,
        clamp((f * f) * 5.0, 0.0, 1.0)
      );

      finalColor = mix(
        finalColor,
        colorDarkBlue,
        clamp(length(q), 0.0, 1.0) * 0.8
      );

      finalColor = mix(
        finalColor,
        colorAuraBlue,
        clamp(length(r.x), 0.0, 1.0) * f * 2.0
      );

      // Radial vignette to keep the edges completely dark
      float vignette = vUv.x * vUv.y * (1.0 - vUv.x) * (1.0 - vUv.y);
      vignette = clamp(pow(16.0 * vignette, 0.8), 0.0, 1.0);

      // Creative effect: Glowing ambient data embers floating upwards
      vec2 partUv = uv;
      partUv.y += u_time * 0.15; 
      float n1 = noise(partUv * 60.0);
      float n2 = noise(partUv * 45.0 + vec2(100.0));
      float embers = smoothstep(0.85, 0.95, n1 * n2);
      vec3 emberColor = vec3(0.2, 0.5, 1.0) * embers * 0.8; // Cool intense blue embers

      // A slow sweeping scanner aura for dynamic tension
      float scannerY = fract(-u_time * 0.2);
      float sweep = smoothstep(0.15, 0.0, abs(uv.y - scannerY));
      vec3 sweepColor = vec3(0.15, 0.05, 0.3) * sweep * f * 0.8;

      finalColor += emberColor + sweepColor;

      gl_FragColor = vec4(finalColor * vignette, 1.0);
    }
  `
};

function Mesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(() => THREE.UniformsUtils.clone(SmokeShader.uniforms), []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.u_time.value = state.clock.getElapsedTime();
      material.uniforms.u_resolution.value.set(window.innerWidth, window.innerHeight);
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        fragmentShader={SmokeShader.fragmentShader}
        vertexShader={SmokeShader.vertexShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function AuctionSmokeCanvas() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Mesh />
      </Canvas>
    </div>
  );
}
