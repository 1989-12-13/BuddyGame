import { useRef, useState } from 'react'
import { ArrowUp, Check, Undo2 } from 'lucide-react'
import type { MiniGameProps, StepOrderSpec } from '../../../game/types'
import { shuffle } from '../../../game/core/random'

export function StepOrder(props: MiniGameProps) {
  if (props.spec.kind !== 'stepOrder') return null
  return <OrderEngine {...props} spec={props.spec} />
}
function OrderEngine({ spec, paused, onComplete }: Omit<MiniGameProps, 'spec'> & { spec: StepOrderSpec }) {
  const [choices] = useState(() => shuffle(spec.steps.map((text, id) => ({ text, id }))))
  const [order, setOrder] = useState<number[]>([])
  const submitted = useRef(false)
  function submit() {
    if (paused || submitted.current || order.length !== spec.steps.length) return
    submitted.current = true
    const score = order.filter((id, index) => id === index).length / Math.max(1, order.length)
    onComplete(score, score >= spec.passThreshold)
  }
  return <section className="order-game" aria-label="急救步骤排序">
    <p>把指令排成来电者能够照做的顺序，检查后提交。</p>
    <ol aria-label="已排好的步骤">{order.map((id, index) => <li key={id}><span>{index + 1}</span>{spec.steps[id]}</li>)}</ol>
    {!order.length && <p className="helper">先选择你认为应当最先执行的步骤。</p>}
    <div className="order-options">{choices.map(({ text, id }) => <button className="secondary" key={id} disabled={paused || submitted.current || order.includes(id)} onClick={() => setOrder(current => current.includes(id) ? current : [...current, id])}>{order.includes(id) ? <Check size={18} /> : <ArrowUp size={18} />}{text}</button>)}</div>
    <div className="dialog-actions"><button className="secondary" disabled={paused || submitted.current || !order.length} onClick={() => setOrder(current => current.slice(0, -1))}><Undo2 size={16} />撤销上一步</button><button className="primary" disabled={paused || submitted.current || order.length !== spec.steps.length} onClick={submit}>确认操作顺序</button></div>
  </section>
}
