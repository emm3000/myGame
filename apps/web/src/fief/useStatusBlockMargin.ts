import { useEffect, useState } from 'react'
import { statusBlockHeight } from '../design/tokens'

export function useStatusBlockMargin(): (block: HTMLElement | null) => void {
  const [block, setBlock] = useState<HTMLElement | null>(null)
  useEffect(() => {
    if (block === null) {
      return
    }
    const root = document.documentElement.style
    const observer = new ResizeObserver((entries) => {
      for (const { borderBoxSize } of entries) {
        for (const { blockSize } of borderBoxSize) {
          root.setProperty(statusBlockHeight, `${blockSize}px`)
        }
      }
    })
    observer.observe(block)
    return () => {
      observer.disconnect()
      root.removeProperty(statusBlockHeight)
    }
  }, [block])
  return setBlock
}
