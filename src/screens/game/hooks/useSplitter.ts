import { useState, useRef, useCallback } from 'react'

/**
 * 对话区 / 操作面板拖拽分割。
 * 承载原 GameScreen 的 dialogueHeight / splitHovered / splitDragRef / handleSplitterDown。
 * 行为逐字节等价于原实现。
 */
export function useSplitter() {
  const [dialogueHeight, setDialogueHeight] = useState<number | null>(null)
  const [splitHovered, setSplitHovered] = useState(false)
  const splitDragRef = useRef<{ startY: number; startH: number } | null>(null)

  const handleSplitterDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault()
    const area = (e.currentTarget as HTMLElement).previousElementSibling as HTMLElement | null
    const currentH = dialogueHeight ?? area?.getBoundingClientRect().height ?? 300
    splitDragRef.current = { startY: e.clientY, startH: currentH }

    const onMove = (ev: PointerEvent) => {
      if (!splitDragRef.current) return
      const dy = ev.clientY - splitDragRef.current.startY
      const newH = Math.max(80, Math.min(window.innerHeight - 280, splitDragRef.current.startH + dy))
      setDialogueHeight(newH)
    }
    const onUp = () => {
      splitDragRef.current = null
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }, [dialogueHeight])

  return { dialogueHeight, splitHovered, setSplitHovered, setDialogueHeight, handleSplitterDown }
}
