"use client"

import { useRef } from "react"
import { Plane } from "@react-three/drei"
import { useFrame } from "@react-three/fiber"
import type { Ref } from 'react'
import type { Mesh } from 'three'

const MATERIAL_CONFIG = {
  color: "#88ffff",
  emissive: "#88ffff",
  emissiveIntensity: 0.2,
  metalness: 0.9,
  roughness: 0.1,
  envMapIntensity: 1,
  clearcoat: 1,
  clearcoatRoughness: 0.1,
  transparent: true,
  opacity: 0.1,
  transmission: 0.9,
} as const

export default function Ground() {
  const meshRef = useRef<Mesh>(null)
  const materialRef = useRef<any>()
  const time = useRef(0)

  useFrame(() => {
    if (materialRef.current) {
      time.current += 0.01
      materialRef.current.emissiveIntensity = 0.2 + Math.sin(time.current) * 0.1
      materialRef.current.transmission = 0.9 + Math.sin(time.current * 0.5) * 0.1
    }
  })

  return (
    <Plane ref={meshRef} args={[100, 100]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2, 0]} receiveShadow>
      <meshPhysicalMaterial
        ref={materialRef}
        {...MATERIAL_CONFIG}
      />
    </Plane>
  )
} 