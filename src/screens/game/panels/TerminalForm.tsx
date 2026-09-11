import { Phone, MapPin, HeartPulse, UserRound, Hash, ListChecks, FileText, Activity, ClipboardList } from 'lucide-react'
import type { TerminalState, MpdsDeterminant } from '../../../game/types'
import type { TerminalField } from '../../../game/core/actions'
import { PROTOCOL_REF, TRIAGE_LABELS } from '../../../game/types'
import { styles } from '../styles'
import { SectionTitle } from './SectionTitle'
import { FieldRow } from './FieldRow'
import { StatusToggle } from './StatusToggle'
import { DeterminantSelector } from './DeterminantSelector'

/** MPDS 标准调度登记卡 — 结构化病例录入（无自动提示，玩家自主判断）
 * 必填项：意识状态 / 呼吸状态 / MPDS 判定码（标 *）；其它字段（地址/电话/主诉/年龄/性别/备注/协议号/子编码）可选
 */
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
  const RequiredMark = () => (
    <span style={{ color: 'var(--danger)', marginLeft: 'var(--space-2)', fontWeight: 'var(--fw-bold)' }}>*</span>
  )
  return (
    <div className="terminal-record-form" style={styles.terminalForm}>
      {/* ====== 协议号 ====== */}
      {/* ====== Case Entry（病例录入） ====== */}

      {/* 地址（可选） */}
      <FieldRow icon={<MapPin size={15} />} label="事件地址">
        <textarea
          aria-label="事件地址"
          style={styles.formInput}
          value={terminal.address}
          onChange={(e) => onChange('address', e.target.value)}
          placeholder="记录详细地址…（可选）"
          rows={2}
        />
      </FieldRow>

      {/* 联系电话（可选） */}
      <FieldRow icon={<Phone size={13} />} label="联系电话">
        <input
          aria-label="联系电话"
          style={{ ...styles.formInput, height: 30 }}
          value={terminal.contact}
          onChange={(e) => onChange('contact', e.target.value)}
          placeholder="记录联系方式…（可选）"
        />
      </FieldRow>

      {/* 主诉（可选） */}
      <FieldRow icon={<HeartPulse size={15} />} label="主诉">
        <input
          aria-label="主诉"
          style={{ ...styles.formInput, height: 30 }}
          value={terminal.chiefComplaint}
          onChange={(e) => onChange('chiefComplaint', e.target.value)}
          placeholder="标准化主诉…（可选）"
        />
      </FieldRow>

      {/* 患者基本信息（可选） */}
      <div style={{ display: 'flex', gap: 'var(--space-6)'}}>
        <div style={{ flex: 1 }}>
          <FieldRow icon={<UserRound size={15} />} label="年龄">
            <input
              aria-label="患者年龄"
              style={{ ...styles.formInput, height: 28 }}
              value={terminal.patientAge}
              onChange={(e) => onChange('patientAge', e.target.value)}
              placeholder="…"
            />
          </FieldRow>
        </div>
        <div style={{ flex: 1 }}>
          <FieldRow icon={<UserRound size={15} />} label="性别">
            <input
              aria-label="患者性别"
              style={{ ...styles.formInput, height: 28 }}
              value={terminal.patientGender}
              onChange={(e) => onChange('patientGender', e.target.value)}
              placeholder="…"
            />
          </FieldRow>
        </div>
      </div>

      {/* ====== 患者生命体征 — 关键问题（必填） ====== */}
      <SectionTitle icon={<Activity size={15} />} text="关键问题" required />

      {/* 意识状态（必填） */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)'}}>
        <span style={{ ...styles.formLabel, marginBottom: 0 }}>意识状态</span>
        <RequiredMark />
      </div>
      <StatusToggle
        ariaLabel="患者有意识吗？"
        field="conscious"
        value={terminal.conscious}
        trueLabel="有意识"
        falseLabel="无意识"
        colorTrue="var(--success)"
        colorFalse="var(--danger)"
        onToggle={onSetStatus}
      />

      {/* 呼吸状态（必填） */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)'}}>
        <span style={{ ...styles.formLabel, marginBottom: 0 }}>呼吸状态</span>
        <RequiredMark />
      </div>
      <StatusToggle
        ariaLabel="患者有正常呼吸吗？"
        field="breathing"
        value={terminal.breathing}
        trueLabel="正常呼吸"
        falseLabel="无呼吸/异常"
        colorTrue="var(--success)"
        colorFalse="var(--danger)"
        onToggle={onSetStatus}
      />

      {/* ====== 协议号（可选） ====== */}
      <SectionTitle icon={<ListChecks size={15} />} text="MPDS 协议" />
      <FieldRow icon={<Hash size={15} />} label="协议编号">
        <input
          aria-label="协议编号"
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
      <details style={{ margin: '-4px 0 var(--space-8) var(--space-20)', fontSize: 'var(--fs-small)' }}>
        <summary style={{ color: 'var(--text-3)', cursor: 'pointer', userSelect: 'none' }}>
          协议编号对照
        </summary>
        <div style={{
          marginTop: 'var(--space-4)',
          padding: 'var(--space-6)',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 'var(--radius-sm)',
          maxHeight: 160,
          overflowY: 'auto',
          color: 'var(--text-2)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 'var(--space-1) var(--space-12)',
          fontSize: 'var(--fs-small)',
        }}>
          {PROTOCOL_REF.map(([num, name]) => (
            <div key={num} style={{ display: 'flex', gap: 'var(--space-4)', padding: 'var(--space-1) 0' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 'var(--fw-bold)', minWidth: 20 }}>{num}</span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      </details>

      {/* ====== 判定码（必填） ====== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)'}}>
        <SectionTitle icon={<ClipboardList size={15} />} text="MPDS 判定码" inline />
        <RequiredMark />
      </div>
      <DeterminantSelector
        current={terminal.determinant}
        onSelect={onSetDeterminant}
      />
      {terminal.triage && (
        <FieldRow icon={<Activity size={15} />} label="分诊等级">
          <span style={{
            fontSize: 'var(--fs-body-sm)',
            fontWeight: 'var(--fw-bold)',
            color: terminal.triage === 'red' ? 'var(--danger)' : terminal.triage === 'yellow' ? 'var(--warning)' : 'var(--success)',
          }}>
            {TRIAGE_LABELS[terminal.triage]}
          </span>
        </FieldRow>
      )}
      <FieldRow icon={<Hash size={15} />} label="子编码">
        <div style={{ display: 'flex', gap: 'var(--space-4)'}}>
          {[
            { n: 1, color: 'var(--danger)', label: '危重伤' },
            { n: 2, color: 'var(--sev-4)', label: '重伤' },
            { n: 3, color: 'var(--warning)', label: '轻伤' },
            { n: 4, color: 'var(--success)', label: '非紧急' },
          ].map(({ n, color, label }) => {
            const active = terminal.determinantSubcode === n
            return (
              <button
                key={n}
                aria-pressed={active}
                style={{
                  flex: 1,
                  padding: 'var(--space-6) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${active ? color : 'var(--line)'}`,
                  backgroundColor: active ? `color-mix(in srgb, ${color} 9%, var(--bg-surface))` : 'var(--bg-surface)',
                  color: active ? color : 'var(--text-2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 'var(--space-4)',
                  fontSize: 'var(--fs-small)',
                  fontWeight: active ? 'var(--fw-bold)' : 'var(--fw-normal)',
                  cursor: 'pointer',
                  textAlign: 'center' as const,
                }}
                onClick={() => onSetDeterminantSubcode(n)}
              >
                <div style={{ fontWeight: 'var(--fw-bold)', fontSize: 'var(--fs-body-sm)' }}>{n}</div>
                <div style={{ fontSize: 'var(--fs-micro)' }}>{label}</div>
              </button>
            )
          })}
        </div>
      </FieldRow>

      {/* ====== 备注（可选） ====== */}
      <SectionTitle icon={<FileText size={15} />} text="事件备注" />
      <textarea
        aria-label="事件备注"
        style={styles.formInput}
        value={terminal.conditionNote}
        onChange={(e) => onChange('conditionNote', e.target.value)}
        placeholder="记录其他重要信息…（可选）"
        rows={2}
      />
    </div>
  )
}
