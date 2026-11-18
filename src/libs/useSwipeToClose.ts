'use client'

import { type CSSProperties, type RefObject, type TouchEvent, useRef, useState } from 'react'

const START_THRESHOLD = 8
const CLOSE_DISTANCE = 110
const CLOSE_VELOCITY = 0.5

interface SwipeToCloseOptions {
  onClose: () => void
  scrollRef: RefObject<HTMLElement | null>
}

export function useSwipeToClose({ onClose, scrollRef }: SwipeToCloseOptions) {
  const startY = useRef<number | null>(null)
  const startTime = useRef(0)
  const offsetRef = useRef(0)
  const [offset, setOffset] = useState(0)

  function reset() {
    startY.current = null
    offsetRef.current = 0
    setOffset(0)
  }

  function handleTouchStart(event: TouchEvent) {
    const scroller = scrollRef.current
    const insideScroller = scroller?.contains(event.target as Node) ?? false
    if (insideScroller && scroller && scroller.scrollTop > 0) {
      startY.current = null
      return
    }
    startY.current = event.touches[0].clientY
    startTime.current = event.timeStamp
    offsetRef.current = 0
  }

  function handleTouchMove(event: TouchEvent) {
    if (startY.current === null) return
    const scroller = scrollRef.current
    if (scroller && scroller.scrollTop > 0) {
      reset()
      return
    }
    const distance = event.touches[0].clientY - startY.current
    if (distance < START_THRESHOLD) {
      if (offsetRef.current !== 0) {
        offsetRef.current = 0
        setOffset(0)
      }
      return
    }
    offsetRef.current = distance - START_THRESHOLD
    setOffset(offsetRef.current)
  }

  function handleTouchEnd(event: TouchEvent) {
    if (startY.current === null) return
    const elapsed = Math.max(event.timeStamp - startTime.current, 1)
    const velocity = offsetRef.current / elapsed
    const shouldClose =
      offsetRef.current > CLOSE_DISTANCE || (velocity > CLOSE_VELOCITY && offsetRef.current > 40)
    reset()
    if (shouldClose) onClose()
  }

  const sheetStyle: CSSProperties | undefined =
    offset > 0 ? { transform: `translateY(${offset}px)` } : undefined

  return {
    dragging: offset > 0,
    sheetStyle,
    sheetHandlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
      onTouchCancel: reset,
    },
  }
}
