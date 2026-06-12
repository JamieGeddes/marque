import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { useAppStore } from '../store/useAppStore'
import { mobileInput } from '../lib/mobileInput'
import { useIsTouchDevice } from '../hooks/useIsTouchDevice'

const STICK_RADIUS = 48

export function MobileControls() {
  const isTouch = useIsTouchDevice()
  const phase = useAppStore((s) => s.phase)
  const stickOrigin = useRef<{ x: number; y: number } | null>(null)
  const lastLook = useRef<{ x: number; y: number } | null>(null)
  const [thumb, setThumb] = useState<{ x: number; y: number }>({ x: 0, y: 0 })

  if (!isTouch || phase !== 'walking') return null

  const onStickDown = (e: PointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    stickOrigin.current = { x: e.clientX, y: e.clientY }
  }
  const onStickMove = (e: PointerEvent) => {
    if (!stickOrigin.current) return
    let dx = e.clientX - stickOrigin.current.x
    let dy = e.clientY - stickOrigin.current.y
    const len = Math.hypot(dx, dy)
    if (len > STICK_RADIUS) {
      dx = (dx / len) * STICK_RADIUS
      dy = (dy / len) * STICK_RADIUS
    }
    setThumb({ x: dx, y: dy })
    mobileInput.moveX = dx / STICK_RADIUS
    mobileInput.moveY = -dy / STICK_RADIUS
  }
  const onStickUp = () => {
    stickOrigin.current = null
    setThumb({ x: 0, y: 0 })
    mobileInput.moveX = 0
    mobileInput.moveY = 0
  }

  const onLookDown = (e: PointerEvent) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    lastLook.current = { x: e.clientX, y: e.clientY }
  }
  const onLookMove = (e: PointerEvent) => {
    if (!lastLook.current) return
    mobileInput.lookX += e.clientX - lastLook.current.x
    mobileInput.lookY += e.clientY - lastLook.current.y
    lastLook.current = { x: e.clientX, y: e.clientY }
  }
  const onLookUp = () => {
    lastLook.current = null
  }

  return (
    <div className="touch-layer">
      <div
        className="touch-look"
        onPointerDown={onLookDown}
        onPointerMove={onLookMove}
        onPointerUp={onLookUp}
        onPointerCancel={onLookUp}
      />
      <div
        className="touch-stick"
        onPointerDown={onStickDown}
        onPointerMove={onStickMove}
        onPointerUp={onStickUp}
        onPointerCancel={onStickUp}
      >
        <div
          className="touch-stick__thumb"
          style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }}
        />
      </div>
    </div>
  )
}
