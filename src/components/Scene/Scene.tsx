"use client"

import { useEffect, useRef } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import { Environment, Stars } from "@react-three/drei"
import { Physics } from "@react-three/cannon"
import { FogExp2, Vector3 } from "three"
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
    blur: 0
  },
  LIGHTS: {
    ambient: {
      intensity: 0.5
    },
    directional: {
      position: [10, 10, 10],
      intensity: 2,
      shadowMapSize: 2048
    }
  },
  CAMERA: {
    initialPosition: new Vector3(0, 8, 20),
    orbitRadius: 20,
    orbitSpeed: 0.03,
    heightOffset: 8,
    verticalAmplitude: 1.5,
    verticalSpeed: 0.5,
    smoothFactor: 0.015,
    lookAtOffset: new Vector3(0, 3, 0),
    tiltAngle: Math.PI * 0.05
  }
} as const

export default function Scene() {
  const { scene, camera } = useThree()
  const cameraRef = useRef({ 
    time: 0,
    verticalTime: 0 
  })
  
  useEffect(() => {
    scene.fog = new FogExp2(SCENE_CONFIG.FOG_COLOR, SCENE_CONFIG.FOG_DENSITY)
    camera.position.copy(SCENE_CONFIG.CAMERA.initialPosition)
    return () => {
      scene.fog = null
    }
  }, [scene, camera])

  useFrame((state, delta) => {
    // Update time for both orbital and vertical movement
    cameraRef.current.time += delta * SCENE_CONFIG.CAMERA.orbitSpeed
    cameraRef.current.verticalTime += delta * SCENE_CONFIG.CAMERA.verticalSpeed
    
    const angle = cameraRef.current.time
    const verticalOffset = Math.sin(cameraRef.current.verticalTime) * SCENE_CONFIG.CAMERA.verticalAmplitude
    
    // Calculate target position with orbital and vertical movement
    const targetX = Math.sin(angle) * SCENE_CONFIG.CAMERA.orbitRadius
    const targetZ = Math.cos(angle) * SCENE_CONFIG.CAMERA.orbitRadius
    const targetY = SCENE_CONFIG.CAMERA.heightOffset + verticalOffset
    
    // Smoothly interpolate camera position
    camera.position.x += (targetX - camera.position.x) * SCENE_CONFIG.CAMERA.smoothFactor
    camera.position.z += (targetZ - camera.position.z) * SCENE_CONFIG.CAMERA.smoothFactor
    camera.position.y += (targetY - camera.position.y) * SCENE_CONFIG.CAMERA.smoothFactor
    
    // Add slight tilt based on position
    const tiltAngle = Math.sin(angle) * SCENE_CONFIG.CAMERA.tiltAngle
    camera.rotation.z = tiltAngle
    
    // Smoothly look at center point with offset
    camera.lookAt(SCENE_CONFIG.CAMERA.lookAtOffset)
  })

  return (
    <Physics gravity={[0, -9.8, 0]}>
      <Environment {...SCENE_CONFIG.ENVIRONMENT} />
      <ambientLight intensity={SCENE_CONFIG.LIGHTS.ambient.intensity} />
      <directionalLight
        position={SCENE_CONFIG.LIGHTS.directional.position}
        intensity={SCENE_CONFIG.LIGHTS.directional.intensity}
        castShadow
        shadow-mapSize-width={SCENE_CONFIG.LIGHTS.directional.shadowMapSize}
        shadow-mapSize-height={SCENE_CONFIG.LIGHTS.directional.shadowMapSize}
      />
      <Player />
      <Ground />
      <Stars {...SCENE_CONFIG.STARS} />
    </Physics>
  )
} 