import { Phone } from 'lucide-react'
import type { EmergencyScenario, CalleeStressLevel, StressTier } from '../../../game/types'
import { STRESS_INFO, stressToLevel } from '../../../game/types'
import { PROTOCOL_STEPS, getVitalsStepQText } from '../../../game/content/phrases'
import { styles, CATEGORY_ICON } from '../styles'
import { AskBtnEx } from './AskBtnEx'

/** 检查脚本中该问题在当前情绪档位下是否信息缺失（空数组） */
function isScriptInfoMissing(call: EmergencyScenario, questionId: string, stress: number): boolean {
  const scripted = call.script?.[questionId]
  if (!scripted) return false
  const tier: StressTier = stressToLevel(stress)
  const lines = scripted.caller[tier]
  // 空数组 = 信息缺失；undefined = 没定义该档位（会 fallback 到 calm，不算缺失）
  return Array.isArray(lines) && lines.length === 0
}

/** 检查该问题是否已有效完成（在 askedMPDS 中且当前档位下不缺失） */
function isEffectivelyDone(call: EmergencyScenario, questionId: string, askedMPDS: string[], stress: number): boolean {
  if (!askedMPDS.includes(questionId)) return false
  // 即使已问过，如果当前情绪升到更高档位导致信息缺失，仍需重新确认
  // 但已问过的不会重新变缺失——因为 fillTerminal 已经填了
  return true
}

interface QuestionPanelProps {
  call: EmergencyScenario
  askedMPDS: string[]
  stressLevel: CalleeStressLevel
  stress: number
  /** 流式输出进行中，禁止操作 */
  disabled?: boolean
  onAsk: (id: string) => void
  onCalm: () => void
}

export function QuestionPanel({
  call,
  askedMPDS,
  stressLevel,
  stress,
  disabled = false,
  onAsk,
  onCalm,
}: QuestionPanelProps) {
  const isAsked = (id: string) => isEffectivelyDone(call, id, askedMPDS, stress)
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
          {allFourStepsDone && <span style={{ color: 'var(--success)', marginLeft: 'var(--space-6)'}}>✓ 全部完成</span>}
        </div>

        <div style={styles.protocolStepsList}>
          {protocolSteps.map((ps) => {
            const done = isAsked(ps.id)
            const askedButMissing = askedMPDS.includes(ps.id) && !done
            const isCurrent = ps.step === nextStepLabel || askedButMissing
            const locked = !done && !isCurrent

            return (
              <div key={ps.id} style={{
                ...styles.protocolStepRow,
                opacity: locked ? 0.45 : 1,
                borderColor: done ? 'var(--success)' : askedButMissing ? 'var(--danger, #e53e3e)' : isCurrent ? 'var(--warning)' : 'var(--line)',
                backgroundColor: done ? 'var(--success-bg)' : askedButMissing ? 'rgba(229,62,62,0.08)' : isCurrent ? 'var(--warning-bg)' : 'transparent',
              }}>
                {/* 步骤编号 */}
                <div style={{
                  ...styles.protocolStepNum,
                  backgroundColor: done ? 'var(--success)' : askedButMissing ? 'var(--danger, #e53e3e)' : isCurrent ? 'var(--warning)' : 'var(--line)',
                  color: done ? 'var(--on-accent)' : askedButMissing ? 'var(--on-accent)' : isCurrent ? 'var(--on-accent)' : 'var(--text-2)',
                }}>
                  {done ? '✓' : askedButMissing ? '!' : ps.step}
                </div>

                {/* 步骤信息 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--fs-caption)',
                    fontWeight: done ? 'normal' : 'bold',
                    color: done ? 'var(--success)' : askedButMissing ? 'var(--danger, #e53e3e)' : isCurrent ? 'var(--warning)' : 'var(--text-2)',
                    textDecoration: done ? 'line-through' : 'none',
                  }}>
                    {ps.icon} {ps.label}
                  </div>
                  <div style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-3)', marginTop: 'var(--space-1)'}}>
                    {askedButMissing ? '⚠ 信息不全，需重新确认' : ps.qText}
                  </div>
                </div>

                {/* 操作按钮 */}
                {done ? (
                  <span style={{ fontSize: 'var(--fs-caption)', color: 'var(--success)', fontWeight: 'var(--fw-bold)', whiteSpace: 'nowrap' }}>
                    ✓ 完成
                  </span>
                ) : isCurrent ? (
                  <button
                    style={{
                      ...styles.protocolStepBtn,
                      opacity: disabled ? 0.45 : 1,
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      ...(askedButMissing ? { borderColor: 'var(--danger, #e53e3e)', color: 'var(--danger, #e53e3e)' } : {}),
                    }}
                    onClick={() => !disabled && onAsk(ps.id)}
                    disabled={disabled}
                  >
                    {askedButMissing ? '重新确认' : '询问'}
                  </button>
                ) : (
                  <span style={{ fontSize: 'var(--fs-micro)', color: 'var(--text-3)', whiteSpace: 'nowrap' }}>
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
              <div style={{ ...styles.qBtnSmall, borderColor: 'var(--success)', color: 'var(--success)', backgroundColor: 'var(--success-bg)' }}>
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
              <div style={{ ...styles.qBtnSmall, borderColor: 'var(--success)', color: 'var(--success)', backgroundColor: 'var(--success-bg)' }}>
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

      {/* ====== 底部工具栏：压力指示器 + 安抚按钮（调度卡入口已迁移到左侧设置面板下方） ====== */}
      <div style={styles.bottomToolbar}>
        <div style={{ ...styles.stressBar, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 'var(--fs-small)', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
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
          安抚
        </button>
      </div>
    </div>
  )
}
