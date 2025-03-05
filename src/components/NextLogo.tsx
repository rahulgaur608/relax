"use client"

import { Canvas } from "@react-three/fiber"
import { type FC } from 'react'
import dynamic from 'next/dynamic'

const Scene = dynamic(() => import('@/components/Scene/Scene'), { ssr: false })

const NextLogo: FC = () => {
  return (
    <div className="w-full h-screen bg-gray-900">
      <Canvas camera={{ position: [10.047021, -0.127436, -11.137374], fov: 50 }}>
        <Scene />
      </Canvas>
    </div>
  )
}

export default NextLogo 