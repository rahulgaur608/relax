"use client"

import { useEffect, useRef } from "react"
import { useThree, useFrame } from "@react-three/fiber"
import { Environment, Stars } from "@react-three/drei"
import { Physics } from "@react-three/cannon"
import { FogExp2, Vector3 } from "three"
import Player from "./Player"
import Ground from "./Ground"

type CameraMode = 'orbit' | 'follow' | 'dramatic'

interface CameraModeConfig {
  orbit: {
    radius: number
    speed: number
    height: number
    lookAtHeight: number
  }
  follow: {
    distance: number
    height: number
    smoothness: number
    lookAtOffset: Vector3
  }
  dramatic: {
    radius: number
    height: number
    speed: number
    verticalAmplitude: number
    verticalSpeed: number
  }
}

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
    modes: {
      orbit: {
        radius: 20,
        speed: 0.03,
        height: 8,
        lookAtHeight: 3
      },
      follow: {
        distance: 15,
        height: 5,
        smoothness: 0.05,
        lookAtOffset: new Vector3(0, 2, 0)
      },
      dramatic: {
        radius: 25,
        height: 12,
        speed: 0.02,
        verticalAmplitude: 3,
        verticalSpeed: 0.3
      }
    } as CameraModeConfig,
    transitions: {
      duration: 2000,
      smoothFactor: 0.015
    },
    initialPosition: new Vector3(0, 8, 20),
    verticalAmplitude: 1.5,
    verticalSpeed: 0.5,
    tiltAngle: Math.PI * 0.05
  }
} as const

export default function Scene() {
  const { scene, camera } = useThree()
  const cameraRef = useRef({ 
    time: 0,
    verticalTime: 0,
    mode: 'orbit' as CameraMode,
    transitionStart: 0,
    transitionEnd: 0,
    lastPlayerPos: new Vector3()
  })
  
  useEffect(() => {
    scene.fog = new FogExp2(SCENE_CONFIG.FOG_COLOR, SCENE_CONFIG.FOG_DENSITY)
    camera.position.copy(SCENE_CONFIG.CAMERA.initialPosition)
    
    // Switch camera modes periodically
    const modeInterval = setInterval(() => {
      const modes: CameraMode[] = ['orbit', 'dramatic', 'follow']
      const currentIndex = modes.indexOf(cameraRef.current.mode)
      const nextIndex = (currentIndex + 1) % modes.length
      cameraRef.current.mode = modes[nextIndex]
      cameraRef.current.transitionStart = Date.now()
      cameraRef.current.transitionEnd = Date.now() + SCENE_CONFIG.CAMERA.transitions.duration
    }, 15000)

    return () => {
      scene.fog = null
      clearInterval(modeInterval)
    }
  }, [scene, camera])

  useFrame((state, delta) => {
    const { current: cam } = cameraRef
    cam.time += delta
    cam.verticalTime += delta * SCENE_CONFIG.CAMERA.verticalSpeed

    // Get current mode settings
    const mode = SCENE_CONFIG.CAMERA.modes[cam.mode]
    
    // Calculate transition progress
    const now = Date.now()
    const transitionProgress = Math.min(
      1,
      (now - cam.transitionStart) / (cam.transitionEnd - cam.transitionStart)
    )
    const ease = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t

    // Calculate target position based on current mode
    let targetPos = new Vector3()
    let lookAtPos = new Vector3()

    if (cam.mode === 'orbit') {
      const orbitMode = mode as CameraModeConfig['orbit']
      const angle = cam.time * orbitMode.speed
      targetPos.set(
        Math.sin(angle) * orbitMode.radius,
        orbitMode.height + Math.sin(cam.verticalTime) * SCENE_CONFIG.CAMERA.verticalAmplitude,
        Math.cos(angle) * orbitMode.radius
      )
      lookAtPos.set(0, orbitMode.lookAtHeight, 0)
    } 
    else if (cam.mode === 'follow') {
      const followMode = mode as CameraModeConfig['follow']
      const playerPos = cam.lastPlayerPos
      const angle = Math.atan2(camera.position.x - playerPos.x, camera.position.z - playerPos.z)
      targetPos.set(
        playerPos.x + Math.sin(angle) * followMode.distance,
        playerPos.y + followMode.height,
        playerPos.z + Math.cos(angle) * followMode.distance
      )
      lookAtPos.copy(playerPos).add(followMode.lookAtOffset)
    }
    else if (cam.mode === 'dramatic') {
      const dramaticMode = mode as CameraModeConfig['dramatic']
      const angle = cam.time * dramaticMode.speed
      const verticalOffset = Math.sin(cam.verticalTime * dramaticMode.verticalSpeed) * dramaticMode.verticalAmplitude
      targetPos.set(
        Math.sin(angle) * dramaticMode.radius,
        dramaticMode.height + verticalOffset,
        Math.cos(angle) * dramaticMode.radius
      )
      lookAtPos.set(0, dramaticMode.height * 0.3, 0)
    }

    // Apply smooth transition
    const smoothness = SCENE_CONFIG.CAMERA.transitions.smoothFactor * (1 - ease(transitionProgress))
    camera.position.lerp(targetPos, smoothness + 0.01)
    
    // Apply dynamic tilt based on movement
    const moveDirection = new Vector3().subVectors(targetPos, camera.position)
    const tiltAngle = (moveDirection.x * SCENE_CONFIG.CAMERA.tiltAngle) / 
      ((mode as any).radius || (mode as any).distance || 20)
    camera.rotation.z = tiltAngle

    // Smooth look-at
    const currentLookAt = new Vector3()
    camera.getWorldDirection(currentLookAt)
    const targetLookAt = lookAtPos.clone().sub(camera.position).normalize()
    const lookAtDelta = currentLookAt.lerp(targetLookAt, smoothness + 0.01)
    camera.lookAt(camera.position.clone().add(lookAtDelta))
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
      <Player onMove={(pos) => {
        cameraRef.current.lastPlayerPos.copy(pos)
      }} />
      <Ground />
      <Stars {...SCENE_CONFIG.STARS} />
    </Physics>
  )
} 