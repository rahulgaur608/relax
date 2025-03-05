"use client"

import { useEffect } from "react"
import { useThree } from "@react-three/fiber"
import { Environment, Stars } from "@react-three/drei"
import { Physics } from "@react-three/cannon"
import { FogExp2 } from "three"
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
  }
} as const

export default function Scene() {
  const { scene } = useThree()
  
  useEffect(() => {
    scene.fog = new FogExp2(SCENE_CONFIG.FOG_COLOR, SCENE_CONFIG.FOG_DENSITY)
    return () => {
      scene.fog = null
    }
  }, [scene])

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