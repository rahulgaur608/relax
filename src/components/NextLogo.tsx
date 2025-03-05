"use client"

import { Canvas } from "@react-three/fiber"
import Scene from "@/components/Scene/Scene"

export default function NextLogo() {
  return (
    <div className="w-full h-screen bg-gray-900">
      <Canvas camera={{ position: [10.047021, -0.127436, -11.137374], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  )
} 