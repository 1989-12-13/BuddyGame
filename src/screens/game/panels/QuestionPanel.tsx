import { Phone } from 'lucide-react'
import type { EmergencyScenario, CalleeStressLevel } from '../../../game/types'
import { STRESS_INFO } from '../../../game/types'
import { PROTOCOL_STEPS, getVitalsStepQText } from '../../../game/content/phrases'
import { styles, CATEGORY_ICON } from '../styles'
import { AskBtnEx } from './AskBtnEx'

/** 问询按钮面板 — 5步标准协议 + 补充MPDS问询 */
export function QuestionPanel({
  call,
  askedMPDS,
  stressLevel,
  stress,
  disabled = false,
  onAsk,
  onCalm,
  onOpenTerminal,
  hasTriage,
}: {
  call: EmergencyScenario
  askedMPDS: string[]
  stressLevel: CalleeStressLevel
  stress: number
  /** 流式输出进行中，禁止操作 */
  disabled?: boolean
  onAsk: (id: string) => void
  onCalm: () => void
  onOpenTerminal: () => void
  hasTriage: boolean
}) {
  const isAsked = (id: string) => askedMPDS.includes(id)
  const si = STRESS_INFO[stressLevel]

  // --- 4步协议状态 ---
  const step1Done = isAsked('step1_location')
  const step2Done = isAsked('step2_event')
  const step3Done = isAsked('step3_age')
  const step4Done = isAsked('step4_vitals')
  const landmarkDone = isAsked('ask_landmark')
  const contactDone = isAsked('ask_contact')

  const allFourStepsDone = step1Done && step2Done && step3Done && step4Done

  // 下一步：第一个未完成的步骤
  const nextStepLabel =
    !step1Done ? 1 : !step2Done ? 2 : !step3Done ? 3 : !step4Done ? 4 : null

  // 补充MPDS问题（4步完成后方可问询）
  const supplementaryQ = call.mpdsQuestions  // 所有MPDS问题现在都是补充性质

  // 4步协议定义（耗时统一取自 getQuestionTimeCost，与实际扣时保持一致）
  // 步骤1-3 来自共享常量，步骤4（含动态人称）按当前性别生成
  const gender = call.fourElements.condition.gender
  const protocolSteps = [
    ...PROTOCOL_STEPS,
    { step: 4, id: 'step4_vitals', icon: '♥', label: '意识与呼吸', qText: getVitalsStepQText(gender), desc: '最关键的病情评估' },
  ]

  return (
    <div style={styles.questionArea}>
      {/* ====== 5步标准协议 ====== */}
      <div style={styles.qSection}>
        <div style={styles.qSectionTitle}>
          📡 标准协议
          {allFourStepsDone && <span style={{ color: 'var(--accent-green)', marginLeft: 6 }}>✓ 全部完成</span>}
        </div>

        <div style={styles.protocolStepsList}>
          {protocolSteps.map((ps) => {
            const done = isAsked(ps.id)
            const isCurrent = ps.step === nextStepLabel
            const locked = !done && !isCurrent

            return (
              <div key={ps.id} style={{
                ...styles.protocolStepRow,
                opacity: locked ? 0.45 : 1,
                borderColor: done ? 'var(--accent-green)' : isCurrent ? 'var(--accent-amber)' : 'var(--border)',
                backgroundColor: done ? 'var(--success-green-bg)' : isCurrent ? 'var(--warning-amber-bg)' : 'transparent',
              }}>
                {/* 步骤编号 */}
                <div style={{
                  ...styles.protocolStepNum,
                  backgroundColor: done ? 'var(--accent-green)' : isCurrent ? 'var(--accent-amber)' : 'var(--border)',
                  color: done ? '#fff' : isCurrent ? '#fff' : 'var(--text-secondary)',
                }}>
                  {done ? '✓' : ps.step}
                </div>

                {/* 步骤信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--fs-caption)',
                    fontWeight: done ? 'normal' : 'bold',
                    color: done ? 'var(--accent-green)' : isCurrent ? 'var(--accent-amber)' : 'var(--text-secondary)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {ps.icon} {ps.label}
                  </div>
                  <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-muted)', marginTop: 1 }}>
                    {ps.qText}
                  </div>
                </div>

                {/* 操作按钮 */}
                {done ? (
                  <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--accent-green)', fontWeight: 'var(--fw-bold)', whiteSpace: 'nowrap' }}>
                    ✓ 完成
                  </span>
                ) : isCurrent ? (
                  <button
                    style={{
                      ...styles.protocolStepBtn,
                      opacity: disabled ? 0.45 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !disabled && onAsk(ps.id)}
                    disabled={disabled}
                  >
                    询问
                  </button>
                ) : (
                  <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    🔒 等待
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ====== 补充信息（5步完成后方出现） ====== */}
      {allFourStepsDone && (
        <div style={styles.qSection}>
          <div style={styles.qSectionTitle}>📎 补充信息（按需问询）</div>
          <div style={styles.qGrid}>
            {/* 标志建筑 */}
            {!landmarkDone && (
              <AskBtnEx
                id="ask_landmark"
                label="标志建筑"
                icon="🏢"
                done={false}
                disabled={disabled}
                tier="important"
                onClick={() => onAsk('ask_landmark')}
              />
            )}
            {landmarkDone && (
              <div style={{ ...styles.qBtnSmall, borderColor: 'var(--accent-green)', color: 'var(--accent-green)', backgroundColor: 'var(--success-green-bg)' }}>
                ✓ 地址已精确
              </div>
            )}

            {/* 联系电话 */}
            {!contactDone && (
              <AskBtnEx
                id="ask_contact"
                label="联系电话"
                icon={<Phone size={10} />}
                done={false}
                disabled={disabled}
                tier="detail"
                onClick={() => onAsk('ask_contact')}
              />
            )}
            {contactDone && (
              <div style={{ ...styles.qBtnSmall, borderColor: 'var(--accent-green)', color: 'var(--accent-green)', backgroundColor: 'var(--success-green-bg)' }}>
                ✓ 已记录
              </div>
            )}

            {/* 场景专属补充MPDS问题 */}
            {supplementaryQ.map((q) => (
              <AskBtnEx
                key={q.id}
                id={q.id}
                label={q.label}
                icon={CATEGORY_ICON[q.category] || '≡'}
                done={isAsked(q.id)}
                disabled={disabled || isAsked(q.id)}
                tier={q.tier}
                onClick={() => onAsk(q.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* ====== 第一行：压力指示器 + 安抚按钮 ====== */}
      <div style={{ ...styles.bottomToolbar, justifyContent: 'flex-start', gap: 8 }}>
        <div style={{ ...styles.stressBar, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            {si.emoji} {si.label}
          </span>
          <div style={styles.stressTrack}>
            <div style={{
              ...styles.stressFill,
              width: `${stress}%`,
              backgroundColor: si.color,
            }} />
          </div>
          <span style={{ fontSize: 'var(--fs-micro)', color: si.color, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
            {stress}%
          </span>
        </div>
        <button
          style={{
            ...styles.calmBtn,
            opacity: disabled || stress < 15 ? 0.4 : 1,
            cursor: disabled || stress < 15 ? 'not-allowed' : 'pointer',
          }}
          onClick={!disabled && stress >= 15 ? onCalm : undefined}
          disabled={disabled || stress < 15}
          title="消耗2秒安抚来电者"
        >
          🫂 安抚
        </button>
      </div>

      {/* ====== 第二行：调度卡入口 ====== */}
      <div style={{ ...styles.bottomToolbar, justifyContent: 'flex-end' }}>
        <button
          style={{
            ...styles.terminalBtn,
            animation: !hasTriage ? 'pulse-alert 1.5s ease-in-out infinite' : 'none',
            borderColor: hasTriage ? 'var(--accent-green)' : 'var(--danger-red)',
            backgroundColor: hasTriage ? 'var(--success-green-bg)' : 'var(--danger-red-bg)',
          }}
          onClick={onOpenTerminal}
        >
          {hasTriage ? '✓' : '⚠'} 调度卡
          {!hasTriage && (
            <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--danger-soft)', display: 'block' }}>
              未分诊
            </span>
          )}
        </button>
      </div>
    </div>
  )
}
