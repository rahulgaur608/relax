"use client"

import { Canvas, useThree } from "@react-three/fiber"
import { OrbitControls, Environment } from "@react-three/drei"
import { useRef, useState, useEffect } from "react"
import * as THREE from "three"

// ... existing Next logo code ...

export default function NextLogo() {
  return (
    <div className="w-full h-screen bg-gray-900">
      <Canvas camera={{ position: [10.047021, -0.127436, -11.137374], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  )
} 