// ============================================================
// 首次值班引导 —— 三步带你走完一通电话
// ============================================================
// 只在第一次进入时出现：写完 localStorage 之后永不再来。
// 设计原则：
//   1. 不挡操作。遮罩只是压暗，卡片之外的区域照常可点（响铃了照样能接）。
//   2. 跟着做，而不是读完。每一步都盯着一个真实控件，做到了就自动下一步。
//   3. 目标还没出现就等它出现（比如线路墙只在响铃时才在），不弹空指引。
// ============================================================

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowRight, X } from 'lucide-react'
import { readStorage, writeStorage } from '../../utils/storage'
import './onboarding.css'

export interface CoachStep {
  /** 要圈出来的区域（CSS 选择器） */
  target: string
  title: string
  body: string
  /** 这一步算不算已经做到了 —— 做到了自动进入下一步 */
  done: () => boolean
}

const SEEN_KEY = 'dispatch120-onboarded'
const CARD_WIDTH = 320
const GAP = 12

export function OnboardingCoach({ steps, onFinish }: { steps: CoachStep[]; onFinish: () => void }) {
  const [step, setStep] = useState(0)
  const [active, setActive] = useState(() => readStorage(SEEN_KEY) !== 'done')
  const [rect, setRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const finishing = useRef(false)

  const finish = useCallback(() => {
    if (finishing.current) return
    finishing.current = true
    writeStorage(SEEN_KEY, 'done')
    setActive(false)
    onFinish()
  }, [onFinish])

  const current = steps[step]

  useEffect(() => {
    if (!active) return
    if (step >= steps.length) { finish(); return }
    const tick = window.setInterval(() => {
      const el = document.querySelector<HTMLElement>(steps[step].target)
      if (el) {
        const box = el.getBoundingClientRect()
        setRect({ top: box.top, left: box.left, width: box.width, height: box.height })
      } else {
        setRect(null)
      }
      if (steps[step].done()) setStep(value => value + 1)
    }, 300)
    return () => window.clearInterval(tick)
  }, [active, step, steps, finish])

  if (!active || !current) return null

  // 卡片位置：优先放在目标下方，下方放不下就翻到上方，左右夹在视口内
  const cardStyle: React.CSSProperties = (() => {
    if (!rect) return { left: '50%', top: 'auto', bottom: 24, transform: 'translateX(-50%)' }
    const below = rect.top + rect.height + GAP
    const fitsBelow = below + 190 < window.innerHeight
    const left = Math.min(Math.max(12, rect.left), Math.max(12, window.innerWidth - CARD_WIDTH - 12))
    return {
      left,
      top: fitsBelow ? below : Math.max(12, rect.top - GAP - 170),
      width: CARD_WIDTH,
    }
  })()

  return (
    <div className="coach-layer" role="dialog" aria-label="首次值班引导">
      {rect && (
        <div
          className="coach-ring"
          style={{ top: rect.top - 4, left: rect.left - 4, width: rect.width + 8, height: rect.height + 8 }}
          aria-hidden="true"
        />
      )}
      <div className="coach-card" style={cardStyle}>
        <span className="coach-step">{step + 1} / {steps.length}</span>
        <h3>{current.title}</h3>
        <p>{current.body}</p>
        <div className="coach-actions">
          <button type="button" className="text-button" onClick={finish}><X size={15} /> 跳过引导</button>
          {step === steps.length - 1
            ? <button type="button" className="primary" onClick={finish}>开始值班 <ArrowRight size={16} /></button>
            : <button type="button" className="secondary" onClick={() => setStep(value => value + 1)}>下一步 <ArrowRight size={16} /></button>}
        </div>
      </div>
    </div>
  )
}
