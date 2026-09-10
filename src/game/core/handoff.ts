import type { WorldState } from '../types'

export interface HandoffFact {
  id: string
  label: string
  required: boolean
}

export function buildHandoffFacts(state: WorldState): { facts: HandoffFact[]; requiredIds: string[] } {
  if (!state.currentCall) return { facts: [], requiredIds: [] }
  const facts: HandoffFact[] = [
    { id: 'address', label: `事发位置：${state.terminal.address || '尚未确认'}`, required: !!state.terminal.address.trim() },
    { id: 'conscious', label: `意识状态：${state.terminal.conscious === null ? '尚未确认' : state.terminal.conscious ? '有反应' : '无反应'}`, required: state.terminal.conscious !== null },
    { id: 'breathing', label: `呼吸状态：${state.terminal.breathing === null ? '尚未确认' : state.terminal.breathing ? '有正常呼吸' : '无正常呼吸或异常'}`, required: state.terminal.breathing !== null },
  ]
  if (state.terminal.chiefComplaint.trim()) facts.push({ id: 'condition', label: `主要情况：${state.terminal.chiefComplaint}`, required: true })
  if (state.guidanceResults.some(result => result !== null)) {
    const completed = state.guidanceResults.filter(result => result !== null).length
    facts.push({ id: 'guidance', label: `电话指导：已记录 ${completed} 个步骤及反馈`, required: true })
  } else if (state.dispatchRecord?.routeLabel) {
    facts.push({ id: 'route', label: `到达路线：${state.dispatchRecord.routeLabel}`, required: true })
  }
  facts.push(state.terminal.contact.trim()
    ? { id: 'contact', label: `联系电话：${state.terminal.contact}`, required: false }
    : { id: 'unknown-contact', label: '联系电话：本通电话尚未核实', required: false })
  facts.push(state.terminal.patientAge.trim()
    ? { id: 'age', label: `患者年龄：${state.terminal.patientAge}`, required: false }
    : { id: 'unknown-age', label: '患者年龄：本通电话尚未核实', required: false })
  facts.push({ id: 'unknown-diagnosis', label: '院后诊断：本通电话无法确认', required: false })
  const requiredIds = facts.filter(fact => fact.required).slice(0, 5).map(fact => fact.id)
  return { facts, requiredIds }
}

export function handleSubmitHandoff(state: WorldState, factIds: string[]): WorldState {
  if (!state.currentCall || !state.rescue.outcome || state.handoff.completed || state.handoff.attempts >= 2) return state
  const { facts, requiredIds } = buildHandoffFacts(state)
  const validIds = new Set(facts.map(fact => fact.id))
  const selected = [...new Set(factIds)]
  if (selected.length !== requiredIds.length || selected.some(id => !validIds.has(id))) return state
  const selectedSet = new Set(selected)
  const correct = requiredIds.every(id => selectedSet.has(id))
  const attempts = state.handoff.attempts + 1
  const feedback = correct
    ? ['交接信息完整，可以交给现场人员。']
    : [
        ...requiredIds.filter(id => !selectedSet.has(id)).map(id => `漏交接：${facts.find(fact => fact.id === id)?.label ?? id}`),
        ...selected.filter(id => !requiredIds.includes(id)).map(id => `不应作为确定信息：${facts.find(fact => fact.id === id)?.label ?? id}`),
      ]
  return {
    ...state,
    handoff: {
      attempts,
      selectedFactIds: selected,
      firstAttemptCorrect: state.handoff.firstAttemptCorrect ?? correct,
      feedback,
      completed: correct || attempts >= 2,
    },
  }
}
