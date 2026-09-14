// ============================================================
// MPDS 协议卡片 32 — 未知问题（有人倒下）
// 分诊级别: 轻伤（绿色）— 不应派车
// ============================================================

import type { EmergencyScenario } from '../../types'

export const prankCallCard: EmergencyScenario = {
  id: 'prank_call',
  title: '恶作剧电话',
  callerId: 'xiao_pang',
  phoneNumber: '132****0000',
  baseStation: '东城区东直门附近',
  isPrank: true,
  correctTriage: 'green', // 不应派车，正确做法是识别并拒绝

  mpdsCard: {
    number: 32,
    title: '未知问题（有人倒下）',
    chiefComplaint: '来电者称"小猫卡在树上"，非人体紧急情况',
    determinantCode: 'Ω',
    hotCold: 'COLD',
    keyQuestions: [
      '患者是谁？（人还是动物？）',
      '患者年龄？',
      '发生了什么事？',
      '需要什么帮助？',
    ],
  },

  openingLine: '喂！哈哈哈哈！我们家的小猫卡在树上了你们能来救它吗？哈哈哈哈……',

  fourElements: {
    address: {
      vague: '东城区东直门附近',
      partial: '东直门外大街',
      full: '东直门外大街XX小区',
    },
    contact: '132****0000',
    condition: {
      chiefComplaint: '小猫卡在树上',
      age: '小猫',
      gender: '不详',
      consciousness: '清醒',
      breathing: '正常',
      patientCount: '1只猫',
      additional: [
        '明显是小孩在恶作剧',
        '旁边有其他小孩的笑声',
        '口吻完全不严肃',
      ],
    },
    purpose: '救小猫',
  },

  mpdsQuestions: [
    {
      id: 'mpds_prank_patient',
      category: 'consciousness',
      tier: 'critical',
      timeCost: 2,
      stressEffect: -5,
      label: '患者是谁？',
      questionText: '请问患者是谁？有什么症状？',
      answer: '就是我们家小花（小猫）啊！它下不来了哈哈哈哈！',
      answerVague: '小花...小猫嘛...',
      ramblingAnswer: '就是我们家的猫啊！它叫小花！是一只胖橘猫！它刚才追一只鸟然后爬到树上去了，现在趴在树上喵喵叫不敢下来！你看它那么胖，卡在两个树杈中间特别搞笑！你们快派人来救它吧哈哈哈！',
      panickedAnswer: '是小花！！我们家的猫！！它卡住了！！下不来了！！它叫得好惨啊！！',
      reveals: ['chiefComplaint'],
      judgment: {
        question: '来电者称「患者是猫」且伴随笑声——你判断这是什么电话？',
        options: [
          { label: '紧急情况——立即派车', fills: [{ field: 'chiefComplaint', value: '小猫卡在树上' }], isCorrect: false },
          { label: '恶作剧电话——拒绝派车', fills: [{ field: 'chiefComplaint', value: '恶作剧电话（非人体紧急情况）' }, { field: 'conditionNote', value: '来电者称猫卡树上，伴有笑声，疑似儿童恶作剧' }], isCorrect: true },
          { label: '动物救援——转消防部门', fills: [{ field: 'chiefComplaint', value: '动物救援，转接消防' }], isCorrect: false },
          { label: '信息不足，继续追问', fills: [], isCorrect: false },
        ],
      },
    },
  ],

  guidance: null,
  specialEvents: [],

  outcomeNarrative: {
    good: '你没急着派车，先一层层把细节对下去。对方前后对不上，自己挂了。那辆车省了下来，留给了真正在等的人。',
    bad: '你没把细节对齐就派了车。车开到地方才发现根本没事，来回四十多分钟，这段时间本可以留给别人。',
    prank: '细节对下来对不上，你按假警处理了。这一通没占住任何一辆车。',
  },
}
