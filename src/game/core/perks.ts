export type RoguePerkId =
  | 'rapid_intake'
  | 'calm_script'
  | 'priority_channel'
  | 'field_first_aid'
  | 'address_memory'
  | 'protocol_hint'

export interface RoguePerkDef {
  id: RoguePerkId
  title: string
  category: 'time' | 'info' | 'control' | 'guidance'
  description: string
  effect: string
}

export const ROGUE_PERKS: Record<RoguePerkId, RoguePerkDef> = {
  rapid_intake: {
    id: 'rapid_intake',
    title: '快速建卡',
    category: 'time',
    description: '每通电话第一次问询不消耗通话时间。',
    effect: '首问免费',
  },
  calm_script: {
    id: 'calm_script',
    title: '冷静话术',
    category: 'control',
    description: '安抚来电者更有效，并且耗时更短。',
    effect: '安抚强化',
  },
  priority_channel: {
    id: 'priority_channel',
    title: '优先通道',
    category: 'time',
    description: '系统为所有候选道路开启优先通道，预计到达时间减少 5 秒。',
    effect: '路线 ETA -5',
  },
  field_first_aid: {
    id: 'field_first_aid',
    title: '急救容错',
    category: 'guidance',
    description: '每通电话的急救指导允许一次小失误。',
    effect: '一次容错',
  },
  address_memory: {
    id: 'address_memory',
    title: '地址联想',
    category: 'info',
    description: '首次地址问询至少获得可用的部分地址。',
    effect: '定位保底',
  },
  protocol_hint: {
    id: 'protocol_hint',
    title: '协议书签',
    category: 'info',
    description: '结算复盘会突出 MPDS 判定码是否匹配。',
    effect: '复盘强化',
  },
}

export function hasPerk(perks: RoguePerkId[], id: RoguePerkId): boolean {
  return perks.includes(id)
}

import { shuffle } from './random'

export function getPerkChoices(owned: RoguePerkId[], count = 3): RoguePerkId[] {
  const available = (Object.keys(ROGUE_PERKS) as RoguePerkId[])
    .filter(id => !owned.includes(id))

  return shuffle(available).slice(0, count)
}
