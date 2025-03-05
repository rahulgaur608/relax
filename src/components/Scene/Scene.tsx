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
    initialPosition: new Vector3(0, 5, 15),
    orbitRadius: 15,
    orbitSpeed: 0.05,
    heightOffset: 5,
    lookAtOffset: new Vector3(0, 2, 0)
  }
} as const

export default function Scene() {
  const { scene, camera } = useThree()
  const cameraRef = useRef({ time: 0 })
  
  useEffect(() => {
    scene.fog = new FogExp2(SCENE_CONFIG.FOG_COLOR, SCENE_CONFIG.FOG_DENSITY)
    camera.position.copy(SCENE_CONFIG.CAMERA.initialPosition)
    return () => {
      scene.fog = null
    }
  }, [scene, camera])

  useFrame((state, delta) => {
    // Update camera position for orbital movement
    cameraRef.current.time += delta * SCENE_CONFIG.CAMERA.orbitSpeed
    const angle = cameraRef.current.time
    
    const targetX = Math.sin(angle) * SCENE_CONFIG.CAMERA.orbitRadius
    const targetZ = Math.cos(angle) * SCENE_CONFIG.CAMERA.orbitRadius
    
    // Smoothly interpolate camera position
    camera.position.x += (targetX - camera.position.x) * 0.02
    camera.position.z += (targetZ - camera.position.z) * 0.02
    camera.position.y = SCENE_CONFIG.CAMERA.heightOffset
    
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