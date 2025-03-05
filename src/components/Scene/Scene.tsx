"use client"

import { useRef, useEffect } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Environment, Stars, shaderMaterial, OrbitControls } from "@react-three/drei"
import { extend } from "@react-three/fiber"
import { Color } from "three"
import Player from "./Player"
import Ground from "./Ground"

const SCENE_CONFIG = {
  FOG_COLOR: "#001a2f",
  FOG_DENSITY: 0.005,
  STARS: {
    radius: 300,
    depth: 50,
    count: 5000,
    factor: 4,
    saturation: 0,
    fade: true,
    speed: 1
  },
  ENVIRONMENT: {
    files: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/M3_Drone_Shot_equirectangular-jpg_beautiful_colorful_aurora_borealis_1590129447_11909016%20(1)%20(1)-wZt8kjPRcukoLvG8o8jpg7XjTYEAMX.jpg",
    background: true,
    blur: 0.5
  },
  LIGHTS: {
    ambient: {
      intensity: 0.2
    },
    point: {
      position: [0, 0, 0],
      intensity: 2.5,
      distance: 10,
      color: "#88ffff"
    }
  },
  ORB: {
    size: 1,
    segments: 32,
    innerColor: "#ffffff",
    outerColor: "#88ffff",
    glowIntensity: 2.0,
    position: [0, 0, 0]
  }
} as const

const GlowShaderMaterial = shaderMaterial(
  {
    time: 0,
    color: new Color("#88ffff"),
    innerColor: new Color("#ffffff"),
    glowIntensity: 2.0
  },
  // Vertex shader
  `
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform vec3 color;
    uniform vec3 innerColor;
    uniform float glowIntensity;
    uniform float time;
    
    varying vec3 vNormal;
    varying vec2 vUv;
    
    void main() {
      float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
      float glow = rim * glowIntensity;
      
      // Pulse effect
      float pulse = sin(time * 2.0) * 0.5 + 0.5;
      glow *= 0.8 + pulse * 0.4;
      
      // Color gradient from inner to outer
      vec3 finalColor = mix(innerColor, color, rim);
      
      gl_FragColor = vec4(finalColor, glow);
    }
  `
)

extend({ GlowShaderMaterial })

declare global {
  namespace JSX {
    interface IntrinsicElements {
      glowShaderMaterial: any
    }
  }
}

const GlowingOrb = () => {
  const materialRef = useRef<any>()
  const meshRef = useRef<any>()
  const time = useRef(0)

  useFrame((state) => {
    if (materialRef.current) {
      time.current += 0.01
      materialRef.current.time = time.current
      materialRef.current.glowIntensity = SCENE_CONFIG.ORB.glowIntensity * (0.8 + Math.sin(time.current) * 0.2)
    }
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005
      meshRef.current.position.y = Math.sin(time.current * 0.5) * 0.1
    }
  })

  return (
    <mesh ref={meshRef} position={SCENE_CONFIG.ORB.position}>
      <sphereGeometry args={[SCENE_CONFIG.ORB.size, SCENE_CONFIG.ORB.segments, SCENE_CONFIG.ORB.segments]} />
      <glowShaderMaterial 
        ref={materialRef}
        transparent
        depthWrite={false}
        color={SCENE_CONFIG.ORB.outerColor}
        innerColor={SCENE_CONFIG.ORB.innerColor}
        glowIntensity={SCENE_CONFIG.ORB.glowIntensity}
      />
    </mesh>
  )
}

export default function Scene() {
  const { camera } = useThree()

  // Set initial camera position
  useEffect(() => {
    camera.position.set(0, 2, 5)
    camera.lookAt(0, 0, 0)
  }, [camera])

  return (
    <>
      <Environment {...SCENE_CONFIG.ENVIRONMENT} />
      <ambientLight intensity={SCENE_CONFIG.LIGHTS.ambient.intensity} />
      <pointLight
        position={SCENE_CONFIG.LIGHTS.point.position}
        intensity={SCENE_CONFIG.LIGHTS.point.intensity}
        distance={SCENE_CONFIG.LIGHTS.point.distance}
        color={SCENE_CONFIG.LIGHTS.point.color}
      />
      <Player />
      <Ground />
      <GlowingOrb />
      <Stars 
        radius={100}
        depth={50}
        count={5000}
        factor={4}
        saturation={0}
        fade
        speed={1}
      />
      <OrbitControls enableZoom={true} enablePan={true} enableRotate={true} />
    </>
  )
} 