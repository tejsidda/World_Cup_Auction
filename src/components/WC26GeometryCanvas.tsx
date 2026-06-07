'use client';

import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useRef, useMemo, useEffect } from 'react';
import * as THREE from 'three';

const globalHoverState = {
  x: -1,
  y: -1,
  premium: 0
};

function bindPremiumHoverPointer() {
  const onPointerMove = (e: PointerEvent) => {
    globalHoverState.x = e.clientX / window.innerWidth;
    globalHoverState.y = 1.0 - (e.clientY / window.innerHeight);
    const target = e.target as HTMLElement;
    if (target?.closest) {
      const premium = target.closest('[data-premium="true"]');
      globalHoverState.premium = premium ? 1.0 : 0.0;
    }
  };
  window.addEventListener('pointermove', onPointerMove, { passive: true });
  return () => window.removeEventListener('pointermove', onPointerMove);
}

const GeometryShader = {
  uniforms: {
    u_time: { value: 0 },
    u_resolution: { value: new THREE.Vector2() },
    u_mouse: { value: new THREE.Vector2(-1, -1) },
    u_hover_premium: { value: 0.0 }
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
    uniform vec2 u_mouse;
    uniform float u_hover_premium;
    varying vec2 vUv;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    vec3 cGreen = vec3(0.40, 1.00, 0.00); 
    vec3 cPurple = vec3(0.50, 0.10, 1.00); 
    vec3 cTeal = vec3(0.00, 0.95, 0.90); 
    vec3 cGold = vec3(1.00, 0.85, 0.05); 
    vec3 cBlue = vec3(0.05, 0.20, 1.00); 

    vec3 getColor(float r) {
        if(r < 0.2) return cGreen;
        if(r < 0.4) return cPurple;
        if(r < 0.6) return cTeal;
        if(r < 0.8) return cGold;
        return cBlue;
    }

    void main() {
      vec2 uv = vUv;
      float aspect = u_resolution.x / max(u_resolution.y, 1.0);
      uv.x *= aspect; 
      
      float gridSize = 14.0; 
      if(u_resolution.x < 768.0) gridSize = 8.0; 

      vec2 cellUv = fract(uv * gridSize);
      vec2 cellId = floor(uv * gridSize);

      float timeOffset = random(cellId) * 10.0;
      
      float localTime = u_time * 0.65 + timeOffset; 
      
      float lStep = floor(localTime);
      float lFract = fract(localTime);
      
      float ease = smoothstep(0.65, 0.95, lFract);
      float rotAngle = (lStep + ease) * 1.5707963268;
      float scaleBump = sin(ease * 3.14159) * 0.15;
      float currentScale = 1.0 + scaleBump;
      
      vec2 cuv = cellUv - 0.5;
      float c = cos(rotAngle);
      float s = sin(rotAngle);
      mat2 rotMat = mat2(c, -s, s, c);
      cuv = rotMat * cuv;
      
      cuv /= currentScale;
      cuv += 0.5;

      float shapeType = random(cellId + vec2(2.0));
      float mask = 0.0;
      float padding = 0.08; 
      
      vec2 bounds = step(vec2(padding), cuv) * step(cuv, vec2(1.0-padding));
      float isInside = bounds.x * bounds.y;

      if (isInside > 0.5) {
          if (shapeType < 0.3) {
              mask = 1.0;
          } else if (shapeType < 0.6) {
              mask = step(length(cuv - vec2(padding)), 1.0 - padding*2.0);
          } else if (shapeType < 0.85) {
              mask = step(cuv.x + cuv.y, 1.0 + padding);
          } else {
              mask = step(0.2, fract(cuv.x * 2.5));
          }
      }

      mask *= step(0.4, random(cellId + vec2(7.0)));
      vec3 shapeColor = getColor(random(cellId + vec2(3.0)));

      // Dark background so it doesn't contrast heavily with the cards
      vec3 baseColor = vec3(0.015, 0.015, 0.02); 
      
      vec2 edges = smoothstep(0.0, 0.02, cellUv) * smoothstep(1.0, 0.98, cellUv);
      float gridLine = 1.0 - (edges.x * edges.y);
      
      // Live match ripple scanline
      float scanline = smoothstep(0.95, 1.0, sin(vUv.y * 10.0 - u_time * 3.0));
      vec3 gridColor = vec3(0.025) + vec3(scanline * 0.08);

      vec3 finalColor = mix(baseColor, gridColor, gridLine * 0.5);
      finalColor = mix(finalColor, shapeColor, mask * 0.25);

      // Asset Rarity Aura
      vec2 mousePos = u_mouse;
      mousePos.x *= aspect;
      float distToMouse = distance(uv, mousePos);
      
      float auraIntensity = smoothstep(0.4, 0.0, distToMouse) * u_hover_premium;
      float pulse = (sin(u_time * 10.0) * 0.5 + 0.5) * 0.5 + 0.5; // active pulse
      vec3 auraColor = mix(cGold, cGreen, sin(u_time * 2.0) * 0.5 + 0.5); 
      
      finalColor += auraColor * auraIntensity * pulse * 0.4; 

      float vignette = vUv.x * vUv.y * (1.0 - vUv.x) * (1.0 - vUv.y);
      vignette = clamp(pow(16.0 * vignette, 0.25), 0.0, 1.0);

      gl_FragColor = vec4(finalColor * vignette, 1.0);
    }
  `
};

function Mesh() {
  const meshRef = useRef<THREE.Mesh>(null);
  const { size } = useThree();
  const uniforms = useMemo(() => THREE.UniformsUtils.clone(GeometryShader.uniforms), []);

  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.ShaderMaterial;
      material.uniforms.u_time.value = state.clock.getElapsedTime();
      material.uniforms.u_resolution.value.set(size.width, size.height);
      
      const targetMouse = new THREE.Vector2(globalHoverState.x, globalHoverState.y);
      if (uniforms.u_mouse.value.x === -1) {
          uniforms.u_mouse.value.copy(targetMouse);
      } else {
          uniforms.u_mouse.value.lerp(targetMouse, 0.1);
      }
      
      uniforms.u_hover_premium.value += (globalHoverState.premium - uniforms.u_hover_premium.value) * 0.1;
    }
  });

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        fragmentShader={GeometryShader.fragmentShader}
        vertexShader={GeometryShader.vertexShader}
        uniforms={uniforms}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

export default function WC26GeometryCanvas() {
  useEffect(() => bindPremiumHoverPointer(), []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <Canvas camera={{ position: [0, 0, 1] }}>
        <Mesh />
      </Canvas>
    </div>
  );
}
