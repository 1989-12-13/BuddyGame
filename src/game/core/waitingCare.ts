import type { WorldState } from '../types'
export interface CareCheck { id: string; after: number; message: string; options: string[]; correctIndex: number; explanation: string }
const common: CareCheck[] = [
  { id: 'access', after: 20, message: '“救护车会不会找不着我们这栋啊？我要不要下去迎一下？”', options: ['请另一位在场者接应，自己继续照护', '让患者独处，所有人下楼', '不用说明入口，救护车一定能找到'], correctIndex: 0, explanation: '安排接应时患者身边得留人，楼栋和入口也要说清楚。' },
  { id: 'support', after: 45, message: '“我手有点发软了，能不能让旁边的人接着听电话？”', options: ['简短交代已经确认的信息后再交接电话', '直接把电话放下离开', '让对方从头猜测发生了什么'], correctIndex: 0, explanation: '换人时把地点、患者情况和正在做的事过一遍，中间别断。' },
  { id: 'change', after: 65, message: '“我越等越慌，这会儿最该盯着什么？”', options: ['只看时间', '留意反应与呼吸，变化时立即报告', '盯住屏幕上跳动的数字'], correctIndex: 1, explanation: '盯住你能亲眼看见、亲耳听到的变化，有动静马上说。数字替代不了亲眼看到的人。' },
  { id: 'stay-connected', after: 90, message: '“车还没影儿呢，我能先把电话挂了忙别的吗？”', options: ['继续保持联系并报告明显变化', '立即挂断，后续不用说明', '反复拨打多个号码催促'], correctIndex: 0, explanation: '电话别挂，现场一有变化你随时能说，也方便给救护车指路。' },
  { id: 'handoff-ready', after: 120, message: '“我看见救护车了！他们跑过来我先说啥？”', options: ['先说明已确认的地点、意识呼吸和做过的操作', '只说自己的猜测诊断', '省略刚才发生的变化'], correctIndex: 0, explanation: '先给确定的事实和实际做过的事，猜测留到最后再说。' },
]
const special: Record<string, CareCheck> = {
  falls_elderly: { id: 'detail', after: 100, message: '“她一直喊疼，我扶她站起来试试行不行？”', options: ['不用尝试站立，保持照护等待专业评估', '疼就多走几步', '用力拉直右腿'], correctIndex: 0, explanation: '疼得站不起来就该等专业的人来看，别硬搬也别让她试承重。' },
  chest_pain: { id: 'detail', after: 110, message: '“他自己说没事了，问能不能回去接着开会。”', options: ['走回会议室', '只要能说话就没有危险', '停止活动，保持陪伴并报告变化'], correctIndex: 2, explanation: '别让他动，能不能说话不能拿来排除危险。' },
  hemorrhage: { id: 'detail', after: 120, message: '“按得胳膊都酸了，我松手掀开看一眼行不行？”', options: ['反复松开才知道有没有止血', '保持加压，必要时请旁人按指导接替', '拔出玻璃让血流出来'], correctIndex: 1, explanation: '别反复掀开看，手酸了就换个人接着按，玻璃也不能拔。' },
  stroke: { id: 'detail', after: 120, message: '“我实在想不起来准确几点，随便报一个时间行不行？”', options: ['填一个精确时间即可', '保留估计范围，并说明最后正常的时间', '删掉所有时间记录'], correctIndex: 1, explanation: '说不准就说不准，把范围和你最后一次看见他正常的时间说清楚。' },
  cardiac_arrest: { id: 'detail', after: 150, message: '“我按的时候他胸口在动！是不是自己喘上气了？”', options: ['按压引起的运动不能证明自主呼吸恢复', '胸口一动就马上停手', '停下来观察一会儿再说'], correctIndex: 0, explanation: '那是我按压带起来的，不等于他自己喘上气了。别停，接着按。' },
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