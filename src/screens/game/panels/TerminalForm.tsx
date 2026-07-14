import { Phone } from 'lucide-react'
import type { TerminalState, MpdsDeterminant } from '../../../game/types'
import type { TerminalField } from '../../../game/core/actions'
import { PROTOCOL_REF, TRIAGE_LABELS, TRIAGE_COLORS } from '../../../game/types'
import { styles } from '../styles'
import { SectionTitle } from './SectionTitle'
import { FieldRow } from './FieldRow'
import { StatusToggle } from './StatusToggle'
import { DeterminantSelector } from './DeterminantSelector'

/** MPDS 标准调度登记卡 — 结构化病例录入（无自动提示，玩家自主判断） */
export function TerminalForm({
  terminal,
  onChange,
  onSetStatus,
  onSetDeterminant,
  onSetDeterminantSubcode,
  onSetProtocol,
}: {
  terminal: TerminalState
  onChange: (field: TerminalField, value: string) => void
  onSetStatus: (field: 'conscious' | 'breathing', value: boolean) => void
  onSetDeterminant: (d: MpdsDeterminant) => void
  onSetDeterminantSubcode: (subcode: number) => void
  onSetProtocol: (protocol: number) => void
}) {
  return (
    <div style={styles.terminalForm}>
      {/* ====== 协议号 ====== */}
      {/* ====== Case Entry（病例录入） ====== */}

      {/* 地址 */}
      <FieldRow icon="◉" label="事件地址">
        <textarea
          style={styles.formInput}
          value={terminal.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="记录详细地址…"
          rows={2}
        />
      </FieldRow>

      {/* 联系电话 */}
      <FieldRow icon={<Phone size={13} />} label="联系电话">
        <input
          style={{ ...styles.formInput, height: 30 }}
          value={terminal.contact}
          onChange={(e) => onChange('contact', e.target.value)}
          placeholder="记录联系方式…"
        />
      </FieldRow>

      {/* 主诉 */}
      <FieldRow icon="♥" label="主诉">
        <input
          style={{ ...styles.formInput, height: 30 }}
          value={terminal.chiefComplaint}
          onChange={(e) => onChange('chiefComplaint', e.target.value)}
          placeholder="标准化主诉…"
        />
      </FieldRow>

      {/* 患者基本信息 */}
      <div style={{ display: 'flex', gap: 6 }}>
        <div style={{ flex: 1 }}>
          <FieldRow icon="○" label="年龄">
            <input
              style={{ ...styles.formInput, height: 28 }}
              value={terminal.patientAge}
              onChange={(e) => onChange('patientAge', e.target.value)}
              placeholder="…"
            />
          </FieldRow>
        </div>
        <div style={{ flex: 1 }}>
          <FieldRow icon="⚧" label="性别">
            <input
              style={{ ...styles.formInput, height: 28 }}
              value={terminal.patientGender}
              onChange={(e) => onChange('patientGender', e.target.value)}
              placeholder="…"
            />
          </FieldRow>
        </div>
      </div>

      {/* ====== 患者生命体征 — 关键问题 ====== */}
      <SectionTitle icon="♥" text="关键问题" />

      {/* 意识状态 */}
      <StatusToggle
        label="意识状态"
        field="conscious"
        value={terminal.conscious}
        trueLabel="有意识"
        falseLabel="无意识"
        colorTrue="var(--accent-green)"
        colorFalse="#ff3b3b"
        onToggle={onSetStatus}
      />

      {/* 呼吸状态 */}
      <StatusToggle
        label="呼吸状态"
        field="breathing"
        value={terminal.breathing}
        trueLabel="正常呼吸"
        falseLabel="无呼吸/异常"
        colorTrue="var(--accent-green)"
        colorFalse="#ff3b3b"
        onToggle={onSetStatus}
      />

      {/* ====== 协议号 ====== */}
      <SectionTitle icon="≡" text="MPDS 协议" />
      <FieldRow icon="#" label="协议编号">
        <input
          type="number"
          min={1}
          max={33}
          style={{ ...styles.formInput, height: 30, width: 80 }}
          value={terminal.protocolNumber ?? ''}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            if (v >= 1 && v <= 33) onSetProtocol(v)
          }}
          placeholder="?"
        />
      </FieldRow>

      {/* 协议号对照参考（折叠） */}
      <details style={{ margin: '-4px 0 8px 22px', fontSize: 11 }}>
        <summary style={{ color: 'var(--text-muted)', cursor: 'pointer', userSelect: 'none' }}>
          ¶ 协议编号对照
        </summary>
        <div style={{
          marginTop: 4,
          padding: 6,
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 4,
          maxHeight: 160,
          overflowY: 'auto',
          color: 'var(--text-secondary)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '1px 12px',
          fontSize: 10.5,
        }}>
          {PROTOCOL_REF.map(([num, name]) => (
            <div key={num} style={{ display: 'flex', gap: 4, padding: '1px 0' }}>
              <span style={{ color: 'var(--accent-blue)', fontWeight: 'bold', minWidth: 20 }}>{num}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </details>

      {/* ====== 判定码 (Determinant) ====== */}
      <SectionTitle icon="◎" text="MPDS 判定码" />
      <DeterminantSelector
        current={terminal.determinant}
        onSelect={onSetDeterminant}
      />
      {terminal.triage && (
        <FieldRow icon="▲" label="分诊等级">
          <span style={{
            fontSize: 13,
            fontWeight: 'bold',
            color: TRIAGE_COLORS[terminal.triage],
          }}>
            {TRIAGE_LABELS[terminal.triage]}
          </span>
        </FieldRow>
      )}
      <FieldRow icon="#" label="子编码">
        <div style={{ display: 'flex', gap: 4 }}>
          {[
            { n: 1, color: 'var(--danger-red)', label: '危重伤' },
            { n: 2, color: '#ff8c00', label: '重伤' },
            { n: 3, color: 'var(--accent-amber)', label: '轻伤' },
            { n: 4, color: 'var(--accent-green)', label: '非紧急' },
          ].map(({ n, color, label }) => {
            const active = terminal.determinantSubcode === n
            return (
              <button
                key={n}
                style={{
                  flex: 1,
                  padding: '6px 4px',
                  borderRadius: 4,
                  border: `2px solid ${color}`,
                  backgroundColor: active ? color : 'var(--bg-elevated)',
                  color: active ? '#fff' : color,
                  fontSize: 11,
                  fontWeight: active ? 'bold' : 'normal',
                  cursor: 'pointer',
                  textAlign: 'center' as const,
                }}
                onClick={() => onSetDeterminantSubcode(n)}
              >
                <div style={{ fontWeight: 'bold', fontSize: 13 }}>{n}</div>
                <div style={{ fontSize: 9, opacity: active ? 1 : 0.6 }}>{label}</div>
              </button>
            )
          })}
        </div>
      </FieldRow>

      {/* ====== 备注 ====== */}
      <SectionTitle icon="📝" text="事件备注" />
      <textarea
        style={styles.formInput}
        value={terminal.conditionNote}
        onChange={(e) => onChange('conditionNote', e.target.value)}
        placeholder="记录其他重要信息…"
        rows={2}
      />
    </div>
  )
}
