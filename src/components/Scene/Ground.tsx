"use client"

import { useRef, useMemo, useCallback } from "react"
import { Vector2, RepeatWrapping, Mesh } from "three"
import { useFrame, useThree } from "@react-three/fiber"
import { useTexture, Plane } from "@react-three/drei"
import { usePlane } from "@react-three/cannon"
import type { Ref } from 'react'

const TEXTURES = {
  ground: {
    colorMap: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snow007A_1K-JPG_Color-fqUbdtaLLo50sIQcICJwHUWJGdgjyI.jpg",
    displacementMap: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snow007A_1K-JPG_Displacement-w54QlVObPwnSh9THsIJMigUmExq1G7.jpg",
    normalMap: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snow007A_1K-JPG_NormalGL-WnjEjuR897euo20HyItfUbgxRaR5Sl.jpg",
    roughnessMap: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snow007A_1K-JPG_Roughness-N0xEA5cs65MfGnR8ictjHVuObjCcgs.jpg",
    aoMap: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Snow007A_1K-JPG_AmbientOcclusion-oOddkNLnaJt3y0QWhUrECeBIYwmLpe.jpg"
  }
} as const

const WAVE_CONFIG = {
  BASE_SPEED: 0.05,
  TEXTURE_REPEAT: 8,
  BASE_SCALE: 0.4,
  DISTANCE_SCALE: {
    MIN: 0.2,
    MAX: 1,
    FACTOR: 0.1
  },
  WAVE_PATTERNS: {
    primary: { freq: 1, amp: 1.2, xFactor: 0.05 },
    secondary: { freq: 4.5, amp: 0.6, zFactor: 0.08, phase: Math.PI/3 },
    tertiary: { freq: 7.2, amp: 0.4, factor: 0.1 },
    quaternary: { freq: 3.8, amp: 0.5, zFactor: 0.05 }
  }
} as const

const MATERIAL_CONFIG = {
  color: "#006994",
  roughness: 0.02,
  metalness: 0.98,
  envMapIntensity: 4.5,
  clearcoat: 1,
  clearcoatRoughness: 0.02,
  reflectivity: 1,
  transparent: true,
  opacity: 0.9,
  ior: 1.33
} as const

export default function Ground() {
  const [ref] = usePlane(() => ({
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, -0.1, 0],
    friction: 0.1,
    restitution: 0.8,
  }))

  const time = useRef(0)
  const normalScaleRef = useRef(new Vector2(0.5, 0.5))
  const { camera } = useThree()

  // Memoize texture configuration
  const textureConfig = useCallback((textures: Record<keyof typeof TEXTURES.ground, THREE.Texture>) => {
    Object.values(textures).forEach(texture => {
      texture.wrapS = texture.wrapT = RepeatWrapping
      texture.repeat.set(WAVE_CONFIG.TEXTURE_REPEAT, WAVE_CONFIG.TEXTURE_REPEAT)
    })
  }, [])

  const textures = useTexture(TEXTURES.ground, textureConfig)

  // Memoize wave calculation functions
  const calculateDistanceScale = useCallback((y: number) => (
    Math.max(
      WAVE_CONFIG.DISTANCE_SCALE.MIN,
      Math.min(WAVE_CONFIG.DISTANCE_SCALE.MAX, 1 / (y * WAVE_CONFIG.DISTANCE_SCALE.FACTOR))
    )
  ), [])

  const calculateWaves = useMemo(() => {
    const { primary, secondary, tertiary, quaternary } = WAVE_CONFIG.WAVE_PATTERNS
    
    return (time: number, pos: THREE.Vector3) => {
      const distanceScale = calculateDistanceScale(pos.y)
      
      return [
        Math.sin(time + pos.x * primary.xFactor) * primary.amp,
        Math.sin(time * secondary.freq + pos.z * secondary.zFactor + secondary.phase) * secondary.amp,
        Math.sin(time * tertiary.freq + (pos.x + pos.z) * tertiary.factor) * tertiary.amp,
        Math.cos(time * quaternary.freq + pos.z * quaternary.zFactor) * quaternary.amp
      ].reduce((sum, wave) => sum + wave * distanceScale, 0)
    }
  }, [calculateDistanceScale])

  useFrame(() => {
    time.current += WAVE_CONFIG.BASE_SPEED
    const waves = calculateWaves(time.current, camera.position)
    const scale = WAVE_CONFIG.BASE_SCALE + waves
    normalScaleRef.current.set(scale, scale)
  })

  return (
    <Plane ref={ref as Ref<Mesh>} args={[1000, 1000]} receiveShadow>
      <meshPhysicalMaterial
        {...MATERIAL_CONFIG}
        normalMap={textures.normalMap}
        normalScale={normalScaleRef.current}
        roughnessMap={textures.roughnessMap}
      />
    </Plane>
  )
} 