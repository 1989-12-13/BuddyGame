// ============================================================
// 交叉核实 — 同一事故的第二位来电者带来冲突信息
// 玩家必须决定：信哪一条，还是再追问一次。
// ============================================================

import { AlertTriangle, GitCompare, MessageSquareQuote } from 'lucide-react'
import type { ShiftLine, VerificationChoice } from '../../game/core/shift'

export function VerifyPanel({ line, onResolve }: { line: ShiftLine; onResolve: (choice: VerificationChoice) => void }) {
  const verification = line.verification
  if (!verification) return null

  return (
    <section className="verify-panel" aria-label="交叉核实">
      <header>
        <GitCompare size={18} />
        <div>
          <span className="eyebrow">同一事故 · 第二位来电者</span>
          <h3>两条描述对不上，你来判断</h3>
        </div>
      </header>

      <div className="verify-compare">
        <div className="verify-side">
          <span className="verify-tag">初报</span>
          <p>{verification.report.primary}</p>
        </div>
        <div className="verify-side is-conflict">
          <span className="verify-tag">第二位来电者</span>
          <p>{verification.report.supplement}</p>
        </div>
      </div>

      <div className="verify-actions">
        <button type="button" className="primary" onClick={() => onResolve('adopt')}>
          <MessageSquareQuote size={16} /> 采纳最新观察
        </button>
        <button type="button" className="secondary" onClick={() => onResolve('reject')}>
          <AlertTriangle size={16} /> 维持初报
        </button>
        {!verification.probed && (
          <button type="button" className="text-button" onClick={() => onResolve('probe')}>再追问一次</button>
        )}
      </div>
    </section>
  )
}
