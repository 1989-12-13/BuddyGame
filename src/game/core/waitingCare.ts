import type { WorldState } from '../types'
export interface CareCheck { id: string; after: number; message: string; options: string[]; correctIndex: number; explanation: string }
const common: CareCheck[] = [
  { id: 'access', after: 20, message: '“我担心救护车找不到入口，要不要下楼等？”', options: ['请另一位在场者接应，自己继续照护', '让患者独处，所有人下楼', '不用说明入口，救护车一定能找到'], correctIndex: 0, explanation: '安排接应时保持患者身边有人，并明确楼栋和入口。' },
  { id: 'support', after: 45, message: '“我有些累了，可以让旁边的人接着听电话吗？”', options: ['简短交代已经确认的信息后再交接电话', '直接把电话放下离开', '让对方从头猜测发生了什么'], correctIndex: 0, explanation: '换人时简要复述地点、患者情况和正在进行的照护，避免信息中断。' },
  { id: 'change', after: 65, message: '“我有点慌，现在最需要留意什么？”', options: ['只看时间', '留意反应与呼吸，变化时立即报告', '凭游戏体征条判断诊断'], correctIndex: 1, explanation: '留意能观察到的情况，变化时及时报告。模拟条不能代替现场评估。' },
  { id: 'stay-connected', after: 90, message: '“救护车还没到，我可以先挂电话吗？”', options: ['继续保持联系并报告明显变化', '立即挂断，后续不用说明', '反复拨打多个号码催促'], correctIndex: 0, explanation: '保持联系有助于持续更新现场情况，也便于确认救护车如何进入。' },
  { id: 'handoff-ready', after: 120, message: '“看到救护车后，我应该先说什么？”', options: ['先说明已确认的地点、意识呼吸和做过的操作', '只说自己的猜测诊断', '省略刚才发生的变化'], correctIndex: 0, explanation: '现场交接应优先传递已经确认的事实和实际采取的行动。' },
]
const special: Record<string, CareCheck> = {
  falls_elderly: { id: 'detail', after: 100, message: '“她一直疼，我想扶她站起来试一下。”', options: ['不用尝试站立，保持照护等待专业评估', '疼就多走几步', '用力拉直右腿'], correctIndex: 0, explanation: '疼痛与无法站立需要专业评估，不随意搬动或测试承重。' },
  chest_pain: { id: 'detail', after: 110, message: '“他担心工作，问能不能继续开会。”', options: ['走回会议室', '只要能说话就没有危险', '停止活动，保持陪伴并报告变化'], correctIndex: 2, explanation: '让患者休息，不用是否能说话来排除风险。' },
  hemorrhage: { id: 'detail', after: 120, message: '“按着很累，我想松开看看，还要继续吗？”', options: ['反复松开才知道有没有止血', '保持加压，必要时请旁人按指导接替', '拔出玻璃让血流出来'], correctIndex: 1, explanation: '保持对异物周围的压力，不反复掀开，也不拔除玻璃。' },
  stroke: { id: 'detail', after: 120, message: '“我还是记不清准确几点，随便填一个行不行？”', options: ['填一个精确时间即可', '保留估计范围，并说明最后正常的时间', '删掉所有时间记录'], correctIndex: 1, explanation: '保留时间的不确定性，交接已确认的事实。' },
  cardiac_arrest: { id: 'detail', after: 150, message: '“做按压时胸口在动，是不是已经恢复呼吸了？”', options: ['按压引起的运动不能证明自主呼吸恢复', '胸口一动就马上停手', '只要游戏评分高就可以停止'], correctIndex: 0, explanation: '按压带来的胸廓运动不等于自主呼吸恢复，按专业指导持续复苏。' },
}
export function careChecksFor(state: WorldState): CareCheck[] {
  if (!state.currentCall || !special[state.currentCall.id]) return []
  return [...common, special[state.currentCall.id]].sort((a, b) => a.after - b.after)
}
export function availableCareChecks(state: WorldState): CareCheck[] {
  if (!state.currentCall || !state.dispatchSent || !state.dispatchRecord || state.rescue.outcome || state.patientStatus?.died) return []
  const elapsed = state.shiftElapsed - state.dispatchRecord.dispatchedAt
  return careChecksFor(state).filter(check => elapsed >= check.after)
}
export function handleCareCheck(state: WorldState, id: string, selectedIndex: number): WorldState {
  if (!Number.isInteger(selectedIndex) || state.careChecks[id] !== undefined) return state
  const check = availableCareChecks(state).find(item => item.id === id)
  if (!check || selectedIndex < 0 || selectedIndex >= check.options.length) return state
  return { ...state, careChecks: { ...state.careChecks, [id]: selectedIndex }, dialogueLog: [
    ...state.dialogueLog,
    { speaker: 'caller', text: check.message, timestamp: state.shiftElapsed },
    { speaker: 'operator', text: '途中照护选择：' + check.options[selectedIndex], timestamp: state.shiftElapsed },
    { speaker: 'system', text: (selectedIndex === check.correctIndex ? '照护记录：' : '照护复核：') + check.explanation, timestamp: state.shiftElapsed },
  ] }
}
