import type { FirstAidGuidance, GuidanceStep, MiniGameSpec } from '../../types'

// Content sources and professional-review status are recorded in docs/体验迭代节点记录.md.
function choice(id: string, prompt: string, options: string[], explanation: string, reply: string): GuidanceStep {
  return { id, prompt, instruction: options[0], options, correctIndex: 0,
    feedback: { correct: explanation, incorrect: explanation, callerCorrect: reply, callerIncorrect: '这一步我还不太明白，请再核对一下正确做法。' } }
}
function operation(id: string, spec: MiniGameSpec, explanation: string): GuidanceStep {
  return { id, prompt: spec.title, instruction: spec.instruction, options: ['开始操作'], correctIndex: 0, miniGame: spec,
    feedback: { correct: explanation, incorrect: explanation, callerCorrect: spec.feedback.good, callerIncorrect: spec.feedback.bad } }
}
function order(id: string, title: string, steps: string[], reply: string): GuidanceStep {
  return operation(id, { kind: 'stepOrder', title, instruction: '组织一段清楚、可执行的电话指令。', steps, passThreshold: 0.8,
    feedback: { good: reply, bad: '顺序有些混乱，请再解释清楚。' } }, '建议顺序：' + steps.join(' → '))
}
const observe = (id: string) => choice(id, '观察变化，保持联络', ['观察是否仍有反应、呼吸是否变化并报告', '挂断电话等车来', '只盯着时间，不再观察'],
  '等待期间保持通话，及时报告意识与呼吸的变化。', '我会留在旁边，有变化马上告诉你。')
const access = (id: string) => order(id, '把接应安排说清楚', ['请另一位在场者协助接应', '向接应者说明楼栋和入口', '保持患者身边有人照看', '将最新情况交给现场人员'], '接应的人知道该去哪个入口了，我仍留在患者旁边。')

export const CAMPAIGN_GUIDANCE: Record<string, FirstAidGuidance> = {
  falls_elderly: { title: '跌倒后的照护与接应', intro: '现场没有持续危险。先让老人保持原来的姿势，听清疼痛位置，避免再次受伤。', steps: [
    choice('fall_stay', '能不能把老人抱到床上？', ['现场安全时不随意搬动，等待专业人员', '先抱到床上再询问', '扶起来走几步试试'], '怀疑骨折时不要随意移动或试走；现场存在危险时按调度指导处理。', '好，我不抱她了，就陪在她旁边。'),
    order('fall_order', '整理照护步骤', ['确认周围环境安全', '告知老人不要尝试站起', '轻声安抚并注意保暖', '观察意识和呼吸的变化'], '我把要做的事情记住了，会一步一步来。'),
    choice('fall_explain', '怎样回答家属的担心？', ['说明救护车在路上，避免承诺伤情', '保证只是扭伤', '告诉家属一定能马上恢复'], '电话里不能确定伤情。说明当前安排，避免无依据的保证。', '我明白了，等现场人员检查。'),
    observe('fall_observe'), access('fall_access'),
    choice('fall_handoff', '交接时重点报告什么？', ['跌倒经过、疼痛部位、意识呼吸与已做的照护', '只报患者年龄', '替患者确定骨折诊断'], '交接应报告事实和已经采取的行动，诊断交由专业人员。', '我会把刚才的经过告诉现场人员。'),
  ] },
  chest_pain: { title: '胸痛来电的陪伴与观察', intro: '患者目前仍有反应。让患者停止活动，在舒适的姿势下休息，并留意变化。', steps: [
    choice('chest_rest', '现在应安排什么？', ['停止活动，保持舒适姿势并有人陪伴', '走到医院锻炼一下', '用力拍打胸口'], '减少活动并保持观察，配合专业调度指导。', '我让他先别动，就在这里陪着。'),
    order('chest_report', '把描述整理成事实', ['记录患者说的胸痛表现', '确认症状开始的大致时间', '补充出汗和呼吸的变化', '向现场人员交接这些观察'], '我会把这些情况说清楚，不自己下结论。'),
    choice('chest_medicine', '朋友递来药物，如何回应？', ['核实药物与专业指导，不随意给药', '任何心脏药都可以吃', '多吃几片见效快'], '给药取决于具体情况、禁忌和专业指导，不能凭游戏判断自行用药。', '好，我先把药名告诉调度员。'),
    observe('chest_observe'), access('chest_access'),
    choice('chest_change', '如果突然叫不应、呼吸异常？', ['立即报告变化，按调度指导转入急救', '让患者自己睡一会', '只把手机放在一边'], '无反应与异常呼吸是需要立即报告的重要变化。', '我会一直留意他的反应和呼吸。'),
  ] },
  hemorrhage: { title: '玻璃割伤：保留异物、持续照护', intro: '伤口内仍有玻璃。不要拔出或压住玻璃，按指导在异物周围控制出血。', steps: [
    choice('hem_press', '第一步：避开伤口内的玻璃', ['保留玻璃，用干净布料在异物周围加压', '拔掉玻璃再按压', '直接压在露出的玻璃上'], '保留嵌入的异物，在其周围加压，避免把异物压得更深。', '我没有拔玻璃，毛巾垫在旁边按住了。'),
    order('hem_order', '整理止血照护步骤', ['先确认周围安全并做好防护', '保留嵌入伤口的玻璃', '用干净布料在异物周围加压', '保持观察并向调度员报告变化'], '我知道顺序了，不会为了看伤口反复松开。'),
    choice('hem_check', '想松开毛巾看看效果？', ['保持加压，观察可见出血并报告', '每隔几秒掀开检查', '拿掉毛巾晾一会'], '保持压力，不反复掀开敷料；出血未控制时及时报告并听从进一步指导。', '我保持按住，把看到的出血情况告诉你。'),
    choice('hem_help', '还有一位朋友能帮忙', ['让朋友准备接应，自己继续照护', '所有人一起离开找车', '让伤员自己拿着手机等'], '分工可以保证照护与接应同时进行，不让患者独处。', '朋友去门口接应了，我留在这里。'),
    observe('hem_observe'),
    order('hem_handoff', '准备出血情况交接', ['说明受伤经过和出血部位', '说明玻璃仍在伤口内', '报告已经采取的加压措施', '报告意识和呼吸的变化'], '这些我都能说明白，等现场人员接手。'),
  ] },
  stroke: { title: '疑似卒中：记录时间与变化', intro: '不要尝试通过游戏确定诊断。准确记录症状和时间，配合调度员安排。', steps: [
    choice('stroke_time', '家属说“大概二十分钟前”', ['记录为估计，并确认最后正常的时间', '直接写精确二十分钟', '认为时间不重要'], '保留估计范围，核实最后一次状态正常的时间，不把猜测写成精确事实。', '我再回想一下最后正常说话是什么时候。'),
    order('stroke_facts', '把时间线整理清楚', ['确认最后一次状态正常的时间', '记录首次发现异常的时间', '保留无法确定的信息', '把两个时间及症状交接给现场人员'], '我会把确定的和不确定的分开说。'),
    choice('stroke_water', '患者想喝水，怎么办？', ['暂不喂食喂水，听从专业指导', '先喝水试试吞咽', '喂点药压下去'], '疑似卒中可能影响吞咽，不自行喂食、喂水或给药。', '我不喂水，继续陪着他。'),
    observe('stroke_observe'), access('stroke_access'),
    choice('stroke_summary', '哪些观察适合交接？', ['面部、说话、肢体变化及发生时间', '确定的院后诊断', '没有发生过的抢救行为'], '报告看到的表现及其时间，避免自行确定诊断。', '我会说清嘴歪、话说不清和右手无力这些表现。'),
  ] },
  cardiac_arrest: { title: '心脏骤停：按压与通气配合', intro: '本场景来电者曾接受 CPR 培训，确认愿意在电话指导下实施 30:2 复苏。未受训或无法通气的施救者应按调度指导持续胸外按压。', steps: [
    choice('cpr_position', '先安排安全的按压位置', ['在安全条件下让患者仰卧于坚实平面', '扶到椅子上坐着', '让患者自己站起来'], '在安全条件下使用坚实平面，避免不必要的按压中断。', '她已经平躺在坚实的地面上了。'),
    choice('cpr_hands', '把手放在哪里？', ['掌根放在胸部中央、胸骨下半部', '手掌放在肚子上', '按在最左侧胸壁'], '成人按压位置在胸部中央、胸骨下半部。', '手的位置摆好了，我跟着你的节奏。'),
    operation('cpr_rhythm', { kind: 'rhythmPress', title: '胸外按压节奏', instruction: '按提示以每分钟 100–120 次的节奏点击。现实操作还需合适深度与充分回弹。', targetBpm: 110, bpmTolerance: 10, durationSec: 30, passThreshold: 0.5, feedback: { good: '我按着这个节奏继续。', bad: '我有些跟不上，请继续带着我。' } }, '节奏目标为每分钟 100–120 次；游戏只能表现节奏，无法测量真实按压深度。'),
    operation('cpr_breaths', { kind: 'rescueBreaths', title: '人工呼吸：两次通气', instruction: '受训施救者的节奏示意：30 次按压后，每次吹气约 1 秒，观察胸廓起伏。', passThreshold: 0.5, feedback: { good: '我理解了，每次约一秒，接着恢复按压。', bad: '请再提醒我通气时长，避免过度通气。' } }, '30 次按压后通气 2 次，每次约 1 秒，随后尽快恢复按压。'),
    operation('cpr_game', { kind: 'cpr', title: '完整 CPR 30:2 循环', instruction: '把节奏串起来：30 次按压后通气 2 次，完成 2 轮。', cycles: 2, passThreshold: 0.5, feedback: { good: '我继续做，直到现场人员接手。', bad: '我的操作还不稳定，请继续指导。' } }, '持续复苏并尽量减少中断；按压带来的胸廓运动不能当作自主呼吸恢复。'),
    choice('cpr_aed', '另一位在场者找到了 AED', ['请其按 AED 语音提示协助，避免无关中断', '关掉 AED 继续等待', '多人同时按压患者'], '有 AED 时按设备语音和调度指导操作。不要因游戏得分推断患者恢复。', '我让旁边的人听设备提示来帮忙。'),
  ] },
}

