import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { PROTOCOL_REF } from '../../../game/types'
import { Z_POPOVER } from '../../../game/core/zIndex'

const MENU_MAX_HEIGHT = 264
const MENU_MIN_WIDTH = 250

interface MenuPosition {
  top?: number
  bottom?: number
  left: number
  width: number
}

/**
 * 协议编号选择器 — 输入框 + 右侧下拉箭头。
 * 对照表以浮层形式贴在输入框下方（不推动下方内容），输入数字时按前缀过滤。
 */
export function ProtocolPicker({ value, onChange }: { value: number | null; onChange: (next: number | null) => void }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const controlRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<string | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [position, setPosition] = useState<MenuPosition | null>(null)

  const display = draft ?? (value !== null ? String(value) : '')
  const filter = draft ?? ''
  const options = filter ? PROTOCOL_REF.filter(([num]) => String(num).startsWith(filter)) : PROTOCOL_REF
  const selectedName = value !== null ? PROTOCOL_REF.find(([num]) => num === value)?.[1] : undefined

  // 浮层用 fixed 定位并挂到 body，避免被右栏面板的 overflow 裁切
  const updatePosition = useCallback(() => {
    const root = rootRef.current
    const control = controlRef.current
    if (!root || !control) return
    const rootRect = root.getBoundingClientRect()
    const rect = control.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const openUp = spaceBelow < MENU_MAX_HEIGHT + 24 && rect.top > spaceBelow
    setPosition({
      left: rootRect.left,
      width: Math.max(rootRect.width, MENU_MIN_WIDTH),
      ...(openUp ? { bottom: window.innerHeight - rect.top + 4 } : { top: rect.bottom + 4 }),
    })
  }, [])

  useEffect(() => {
    if (!open) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    document.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('scroll', updatePosition, true)
    }
  }, [open, updatePosition])

  // 点击选择器之外收起
  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  // 打开时把高亮对准当前值
  useEffect(() => {
    if (!open) return
    const index = options.findIndex(([num]) => num === value)
    setActiveIndex(index >= 0 ? index : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // 列表变短时收敛高亮
  useEffect(() => {
    setActiveIndex(index => Math.min(index, Math.max(0, options.length - 1)))
  }, [options.length])

  // 高亮项滚进可视区
  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('.protocol-option.active')?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, open, options.length])

  const pick = (num: number) => {
    onChange(num)
    setDraft(null)
    setOpen(false)
  }

  const handleInput = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 2)
    if (digits === '') {
      setDraft('')
      onChange(null)
      return
    }
    const num = Number(digits)
    // 非法值（0 或 >33）直接忽略，输入框保持上一个合法值
    if (num >= 1 && num <= 33) {
      setDraft(digits)
      onChange(num)
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) { setOpen(true); return }
      setActiveIndex(index => Math.min(index + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (open) setActiveIndex(index => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      if (open && options[activeIndex]) {
        event.preventDefault()
        pick(options[activeIndex][0])
      }
    } else if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        setOpen(false)
      }
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  const activeOption = options[activeIndex]
  const activeId = open && activeOption ? `protocol-option-${activeOption[0]}` : undefined

  return (
    <div className="protocol-picker" ref={rootRef}>
      <div className="protocol-control" ref={controlRef}>
        <input
          className="protocol-input"
          aria-label="协议编号"
          role="combobox"
          aria-expanded={open}
          aria-controls="protocol-listbox"
          aria-activedescendant={activeId}
          aria-autocomplete="list"
          type="text"
          inputMode="numeric"
          maxLength={2}
          value={display}
          onChange={event => handleInput(event.target.value)}
          onKeyDown={onKeyDown}
        />
        {selectedName && <span className="protocol-name" title={selectedName}>{selectedName}</span>}
        <button
          type="button"
          className="protocol-toggle"
          aria-label={open ? '收起协议编号对照' : '展开协议编号对照'}
          aria-expanded={open}
          title={open ? '收起协议编号对照' : '展开协议编号对照'}
          onClick={() => setOpen(current => !current)}
        >
          {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        </button>
      </div>
      {open && position && createPortal(
        <ul
          className="protocol-menu"
          id="protocol-listbox"
          role="listbox"
          aria-label="MPDS 协议编号对照"
          ref={menuRef}
          style={{ position: 'fixed', zIndex: Z_POPOVER, maxHeight: MENU_MAX_HEIGHT, ...position }}
        >
          {options.length === 0 && <li className="protocol-empty">没有匹配的协议</li>}
          {options.map(([num, name], index) => (
            <li
              key={num}
              id={`protocol-option-${num}`}
              role="option"
              aria-selected={num === value}
              className={`protocol-option ${index === activeIndex ? 'active' : ''} ${num === value ? 'selected' : ''}`}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => pick(num)}
            >
              <b>{num}</b>
              <span>{name}</span>
              {num === value && <Check size={13} className="protocol-check" />}
            </li>
          ))}
        </ul>,
        document.body,
      )}
    </div>
  )
}
