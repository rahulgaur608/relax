"use client"

import { useEffect, useRef, useMemo, useCallback } from "react"
import { Vector3 } from "three"
import { useThree, useFrame } from "@react-three/fiber"
import { useSphere } from "@react-three/cannon"
import type { Ref } from 'react'
import type { Mesh } from 'three'

const CONTROLS = {
  WALK_SPEED: 15,
  RUN_SPEED: 25,
  JUMP_FORCE: 25,
  PLAYER_HEIGHT: 1.8,
  SPHERE_RADIUS: 0.3,
  INITIAL_CAMERA_TILT: 0.15,
  GROUNDED_THRESHOLD: 0.1,
  GRAVITY_FORCE: -9.8 * 3
} as const

type PlayerControls = {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  jump: boolean
  shift: boolean
}

const INITIAL_KEYS: PlayerControls = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  shift: false
}

const KEY_MAP = {
  KeyW: 'forward',
  KeyS: 'backward',
  KeyA: 'left',
  KeyD: 'right',
  Space: 'jump',
  ShiftLeft: 'shift',
  ShiftRight: 'shift'
} as const

const usePlayerControls = () => {
  const keys = useRef(INITIAL_KEYS)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent, value: boolean) => {
      const key = KEY_MAP[e.code as keyof typeof KEY_MAP]
      if (key) keys.current[key as keyof typeof INITIAL_KEYS] = value
    }

    const handleKeyDown = (e: KeyboardEvent) => handleKey(e, true)
    const handleKeyUp = (e: KeyboardEvent) => handleKey(e, false)

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  return keys
}

interface PlayerProps {
  position?: [number, number, number]
  onMove?: (position: Vector3) => void
}

export default function Player({ position = [0, 10, 0], onMove }: PlayerProps) {
  // Memoize vectors to prevent recreation on each frame
  const direction = useMemo(() => new Vector3(), [])
  const frontVector = useMemo(() => new Vector3(), [])
  const sideVector = useMemo(() => new Vector3(), [])
  
  const { camera } = useThree()

  const [ref, api] = useSphere(() => ({
    mass: 1,
    type: 'Dynamic',
    position,
    args: [CONTROLS.SPHERE_RADIUS],
    linearDamping: 0.1,
    fixedRotation: true,
  }))

  const playerControls = usePlayerControls()
  const velocity = useRef([0, 0, 0])
  const isGrounded = useRef(false)

  // Memoize the position update callback
  const updatePosition = useCallback((p: number[]) => {
    camera.position.set(
      p[0],
      p[1] + CONTROLS.PLAYER_HEIGHT - CONTROLS.SPHERE_RADIUS,
      p[2]
    )
  }, [camera])

  useEffect(() => {
    const unsubVelocity = api.velocity.subscribe((v) => (velocity.current = v))
    const unsubPosition = api.position.subscribe(updatePosition)

    camera.rotation.x = CONTROLS.INITIAL_CAMERA_TILT

    return () => {
      unsubVelocity()
      unsubPosition()
    }
  }, [api.velocity, api.position, camera, updatePosition])

  // Memoize movement calculation
  const calculateMovement = useCallback(() => {
    const { current: controls } = playerControls

    frontVector.set(
      0,
      0,
      Number(controls.backward) - Number(controls.forward)
    )
    sideVector.set(
      Number(controls.left) - Number(controls.right),
      0,
      0
    )

    return direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(controls.shift ? CONTROLS.RUN_SPEED : CONTROLS.WALK_SPEED)
      .applyEuler(camera.rotation)
  }, [direction, frontVector, sideVector, playerControls, camera.rotation])

  useFrame(() => {
    const movement = calculateMovement()
    api.velocity.set(movement.x, velocity.current[1], movement.z)

    isGrounded.current = Math.abs(velocity.current[1]) < CONTROLS.GROUNDED_THRESHOLD

    if (playerControls.current.jump && isGrounded.current) {
      api.velocity.set(velocity.current[0], CONTROLS.JUMP_FORCE, velocity.current[2])
    }

    if (!isGrounded.current) {
      api.applyForce([0, CONTROLS.GRAVITY_FORCE, 0], [0, 0, 0])
    }

    api.position.subscribe((p) => {
      updatePosition(p)
      onMove?.(new Vector3(p[0], p[1], p[2]))
    })
  })

  return <mesh ref={ref as Ref<Mesh>} castShadow receiveShadow />
} 