"use client"

import { useEffect, useState, useRef } from "react"
import { Canvas } from "@react-three/fiber"
import { PointerLockControls } from "@react-three/drei"
import { useRouter } from 'next/navigation'
import Scene from "./Scene"

interface SceneButtonProps {
  onClick: () => void
  children: React.ReactNode
}

const SceneButton = ({ onClick, children }: SceneButtonProps) => (
  <button
    onClick={onClick}
    className="px-4 py-2 bg-black/60 hover:bg-black/80 text-white text-sm rounded-md backdrop-blur-sm border border-white/10 transform transition-all hover:scale-105 active:scale-95"
  >
    {children}
  </button>
)

interface MenuOverlayProps {
  isVisible: boolean
  onClose: () => void
}

const MenuOverlay = ({ isVisible, onClose }: MenuOverlayProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isVisible && containerRef.current) {
      const handleMouseMove = (e: MouseEvent) => {
        if (containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          const x = (e.clientX - rect.left - rect.width / 2) / 25
          const y = (e.clientY - rect.top - rect.height / 2) / 25
          containerRef.current.style.transform = `perspective(1000px) rotateX(${-y}deg) rotateY(${x}deg)`
        }
      }
      window.addEventListener('mousemove', handleMouseMove)
      return () => window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [isVisible])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md">
      <div 
        ref={containerRef}
        className="relative bg-white/10 text-white p-8 rounded-2xl border border-white/20 max-w-xl w-full mx-4 backdrop-blur-lg transition-transform duration-300"
      >
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-8">
            <h2 className="text-3xl font-light tracking-wide text-white/90">
              About Scene
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-all hover:rotate-90 duration-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-6 text-white/80 font-light">
            <div className="space-y-4 bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-light text-white/90">Controls</h3>
              <ul className="grid grid-cols-2 gap-2">
                <li className="flex items-center gap-2">
                  <span>WASD</span> - Move
                </li>
                <li className="flex items-center gap-2">
                  <span>SPACE</span> - Jump
                </li>
                <li className="flex items-center gap-2">
                  <span>SHIFT</span> - Sprint
                </li>
                <li className="flex items-center gap-2">
                  <span>MOUSE</span> - Look
                </li>
              </ul>
            </div>

            <div className="space-y-4 bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-light text-white/90">Features</h3>
              <ul className="grid grid-cols-2 gap-2">
                <li>Dynamic lighting</li>
                <li>Physics movement</li>
                <li>Wave animations</li>
                <li>Aurora borealis</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/10">
            <p className="text-white/60 text-sm">
              Press ESC to exit. Click "Enter Scene" to begin.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const AudioPlayer = () => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.5)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [showControls, setShowControls] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    audioRef.current = new Audio('/meditation.mp3')
    audioRef.current.loop = true
    audioRef.current.volume = volume

    const audio = audioRef.current
    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)

    return () => {
      if (audio) {
        audio.removeEventListener('timeupdate', updateTime)
        audio.removeEventListener('loadedmetadata', updateDuration)
        audio.pause()
      }
    }
  }, [])

  const togglePlay = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return

    const rect = progressRef.current.getBoundingClientRect()
    const pos = (e.clientX - rect.left) / rect.width
    const newTime = pos * duration
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div 
      className="fixed top-6 right-6 z-20 flex items-center gap-4"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      {/* Volume and Progress Controls */}
      <div className={`
        flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20
        transition-all duration-300
        ${showControls ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}
      `}>
        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M12 8v8l-2.5-2.5L7 16V8l2.5 2.5L12 8z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-20 accent-white/80 cursor-pointer"
          />
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 min-w-[200px]">
          <span className="text-white/80 text-xs">{formatTime(currentTime)}</span>
          <div 
            ref={progressRef}
            onClick={handleProgressClick}
            className="flex-1 h-1 bg-white/20 rounded-full cursor-pointer relative overflow-hidden"
          >
            <div 
              className="absolute top-0 left-0 h-full bg-white/80 rounded-full"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          <span className="text-white/80 text-xs">{formatTime(duration)}</span>
        </div>
      </div>

      {/* Play/Pause Button */}
      <button
        onClick={togglePlay}
        className="p-4 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md border border-white/20 transition-all duration-300"
        title={isPlaying ? "Pause meditation music" : "Play meditation music"}
      >
        {isPlaying ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
      </button>
    </div>
  )
}

export default function SceneContainer() {
  const router = useRouter()
  const [isNewScene, setIsNewScene] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    setIsNewScene(window.location.pathname === '/scene')
  }, [])

  const handleEnterScene = () => {
    const canvasId = isNewScene ? 'canvas-new' : 'canvas'
    const canvas = document.getElementById(canvasId)
    canvas?.requestPointerLock()
  }

  return (
    <div className="w-full h-screen">
      <Canvas 
        id={isNewScene ? "canvas-new" : "canvas"} 
        shadows 
        camera={{ fov: 75, near: 0.1, far: 1000 }}
      >
        <Scene />
        <PointerLockControls selector={isNewScene ? "#canvas-new" : "#canvas"} />
      </Canvas>
      
      <AudioPlayer />
      <MenuOverlay isVisible={showMenu} onClose={() => setShowMenu(false)} />
      
      <div className="fixed bottom-6 right-6 z-10 flex gap-4">
        {isNewScene ? (
          <>
            <SceneButton onClick={() => router.push('/')}>Back</SceneButton>
            <SceneButton onClick={() => setShowMenu(true)}>About</SceneButton>
            <SceneButton onClick={handleEnterScene}>Enter</SceneButton>
          </>
        ) : (
          <>
            <SceneButton onClick={() => router.push('/scene')}>New</SceneButton>
            <SceneButton onClick={() => setShowMenu(true)}>About</SceneButton>
            <SceneButton onClick={handleEnterScene}>Enter</SceneButton>
          </>
        )}
      </div>
    </div>
  )
} 