// ============================================================
// MPDS 知识库 — 科普 MPDS 医疗优先调度系统
// ============================================================

import { useMemo, useState } from 'react'
import { SCENARIOS, SCENARIO_IDS } from '../game/events/templates'
import type { EmergencyScenario, MpdsDeterminant } from '../game/types'
import { MPDS_DETERMINANT_INFO } from '../game/types'
import { SCENARIO_EXAMPLES } from '../game/knowledge'

interface Props {
  onBack: () => void
}

const DET_ORDER: MpdsDeterminant[] = ['ECHO', 'DELTA', 'CHARLIE', 'BRAVO', 'ALPHA']

/** 从 determinantCode（如 "9-E-1"）中提取判定等级 */
function parseDeterminant(code: string): MpdsDeterminant {
  const map: Record<string, MpdsDeterminant> = { E: 'ECHO', D: 'DELTA', C: 'CHARLIE', B: 'BRAVO', A: 'ALPHA' }
  const parts = code.split('-')
  return map[parts[1]?.[0]?.toUpperCase() ?? ''] ?? 'ALPHA'
}

/** 病情描述字典（补充场景描述和教育内容）*/
const DISPATCHER_NOTES: Record<string, { description: string; commonCauses: string[]; dispatcherTips: string[] }> = {
  cardiac_arrest: {
    description: '心脏骤停是指心脏突然停止有效泵血，导致全身器官缺血缺氧。患者表现为无意识、无呼吸或无有效呼吸，是MPDS中最紧急的情况。',
    commonCauses: ['冠心病、心肌梗死', '严重心律失常', '电解质紊乱', '药物中毒', '外伤、溺水、触电等意外'],
    dispatcherTips: ['立即识别、立即CPR是关键', '目击者CPR可提高2-3倍生存率', '如有AED应指导使用', '按压深度5-6cm,频率100-120次/分'],
  },
  trauma_car: {
    description: '交通事故造成的多发伤，可能涉及头部、脊柱、内脏、四肢等多处损伤。需警惕颈椎损伤和内脏出血。',
    commonCauses: ['机动车碰撞', '电动车/自行车事故', '行人被撞', '高处坠落'],
    dispatcherTips: ['注意保持伤者不动，防止二次伤害', '怀疑脊柱伤时不要随意搬动', '控制外出血优先于其他操作', '注意记录事故机制便于医院准备'],
  },
  stroke: {
    description: '脑卒中（中风）是因脑部血管突然破裂或堵塞导致脑组织损伤的急症。FAST快速识别：面部(Face)下垂、手臂(Arm)无力、语言(Speech)不清、时间(Time)就是大脑。',
    commonCauses: ['高血压（最常见）', '高血脂、动脉硬化', '心房颤动（心源性栓塞）', '糖尿病', '吸烟、饮酒'],
    dispatcherTips: ['发病4.5小时内是溶栓治疗黄金窗口', '让患者平卧、头部略抬高', '不要给患者进食或饮水', '记录发病精确时间', '不要摇晃患者或让其走路'],
  },
  obstetric: {
    description: '产科急症包括早产、破水、产后出血等。经产妇产程通常比初产妇快，需做好院前接产准备。',
    commonCauses: ['足月临产', '胎膜早破', '胎盘早剥', '前置胎盘出血'],
    dispatcherTips: ['询问孕周、胎次、宫缩间隔', '准备干净的毛巾、毯子和剪刀', '指导产妇呼吸和用力', '不要阻止分娩', '胎儿娩出后注意保暖和脐带处理'],
  },
  chemical_burn: {
    description: '化学品灼伤是由腐蚀性化学物质（强酸、强碱等）接触皮肤或黏膜造成的组织损伤。持续冲洗是最关键的急救措施。',
    commonCauses: ['工业化学品接触', '实验室事故', '家用清洁剂误用', '化学品运输事故'],
    dispatcherTips: ['立即用大量清水冲洗至少20分钟', '不要中和酸碱（会产生热）', '脱去污染的衣物', '注意自身防护避免二次接触'],
  },
  drowning: {
    description: '溺水是因液体进入呼吸道导致窒息缺氧的急症。即使少量水进入肺部也会引起肺水肿和气体交换障碍。',
    commonCauses: ['游泳意外', '儿童玩水失足', '醉酒后落水', '水上运动事故'],
    dispatcherTips: ['上岸后立即评估意识和呼吸', '无呼吸无意识立即开始CPR', '先进行5次人工呼吸再胸外按压', '注意颈椎保护'],
  },
  chest_pain: {
    description: '胸痛可由心源性和非心源性多种原因引起。心梗（心肌梗死）是最危险的病因，表现为压榨样胸痛，可放射至左肩、下颌或背部。',
    commonCauses: ['急性冠脉综合征（心梗）', '心绞痛', '肺栓塞', '气胸', '肌肉骨骼痛'],
    dispatcherTips: ['让患者保持安静、半坐位', '如有阿司匹林可嚼服300mg', '记录胸痛开始时间', '含服硝酸甘油（如有医嘱）', '保持气道通畅'],
  },
  seizure: {
    description: '癫痫发作是大脑异常放电导致的短暂功能障碍。全身性发作表现为意识丧失、四肢强直后阵挛抽搐。大部分发作在3-5分钟内自行停止。',
    commonCauses: ['癫痫病史', '高热惊厥（儿童）', '脑外伤', '颅内感染', '电解质紊乱'],
    dispatcherTips: ['移开周围危险物品', '不要塞任何东西到患者口中', '不要按压患者肢体', '记录发作持续时间', '超过5分钟或连续发作立即就医'],
  },
  diabetic: {
    description: '低血糖昏迷是因血糖过低导致意识障碍的紧急情况，常见于糖尿病患者用药过量、进食不足或运动过度。与高血糖昏迷相比，低血糖发病更急。',
    commonCauses: ['胰岛素或降糖药过量', '餐前用药后未进食', '剧烈运动后未补充能量', '饮酒后'],
    dispatcherTips: ['有意识时可口服糖水或含糖饮料', '无意识时不可经口喂食', '反转身体至侧卧防误吸', '记录末次用药时间和剂量'],
  },
  anaphylaxis: {
    description: '过敏性休克是一种严重的全身性过敏反应，起病急、进展快，可导致气道水肿、血压下降，如不及时处理可能致命。',
    commonCauses: ['药物过敏（如青霉素）', '食物过敏（花生、海鲜等）', '昆虫蜇伤（蜜蜂、黄蜂）', '疫苗过敏'],
    dispatcherTips: ['肾上腺素是大腿外侧肌注的首选药物', '让患者平卧、抬高腿部', '如有肾上腺素笔立即指导使用', '注意监测意识和呼吸'],
  },
  hemorrhage: {
    description: '大出血是指血管破裂导致的快速失血，动脉出血呈喷射状、鲜红色，静脉出血呈涌出状、暗红色。失血超过1000ml可导致失血性休克。',
    commonCauses: ['利器割伤', '外伤血管破裂', '手术后出血'],
    dispatcherTips: ['直接压迫止血点是最有效的方法', '不要移除嵌入的异物', '用敷料加压包扎', '如果血透敷料不要去除，在上方再加敷料'],
  },
  overdose: {
    description: '药物过量是指服用超过治疗剂量的药物导致中毒，常见于镇静安眠药、止痛药或毒品的过量使用。可导致呼吸抑制和意识障碍。',
    commonCauses: ['镇静安眠药过量', '阿片类药物过量', '抗抑郁药过量', '故意或意外服药过量'],
    dispatcherTips: ['确认药物名称、剂量和服用时间', '保持气道通畅、侧卧防误吸', '不要催吐（意识不清时危险）', '收集药瓶信息便于医院处理'],
  },
  asthma: {
    description: '哮喘发作是气道慢性炎症急性加重，导致支气管痉挛、黏膜水肿和分泌物增多。表现为呼吸困难、喘息、胸闷和咳嗽。',
    commonCauses: ['过敏原暴露（花粉、尘螨等）', '上呼吸道感染', '运动诱发', '冷空气刺激', '情绪激动'],
    dispatcherTips: ['让患者保持端坐位（利于呼吸）', '指导使用急救吸入剂', '帮助放松肩部和颈部肌肉', '严重时每60秒仅能说单词需立即就医'],
  },
  falls_elderly: {
    description: '老年人跌倒后最危险的是髋部骨折和头部外伤。老年人骨质疏松，即使低能量跌倒也可能导致严重骨折。',
    commonCauses: ['平衡能力下降', '肌肉力量减弱', '地面湿滑', '视力问题', '降压药导致低血压'],
    dispatcherTips: ['不要随意移动伤者', '注意保暖防止低体温', '询问是否服用抗凝药物', '头部撞击需警惕迟发颅内出血'],
  },
  electrocution: {
    description: '触电是电流通过人体造成的损伤，可导致心律失常、心脏骤停、呼吸停止和严重烧伤。损伤程度取决于电压、电流路径和接触时间。',
    commonCauses: ['接触裸露电线', '电器漏电', '雷击', '工地事故'],
    dispatcherTips: ['首先确认现场安全再施救', '用干燥木棍等绝缘物分离电源', '如无意识无呼吸立即CPR', '检查进出口烧伤并保护'],
  },
  abdominal_pain: {
    description: '急性腹痛涉及多种病因，从简单消化不良到致命的腹主动脉瘤破裂。阑尾炎典型表现为转移性右下腹痛。',
    commonCauses: ['急性阑尾炎', '急性胆囊炎', '肠梗阻', '胃十二指肠穿孔', '胰腺炎', '肾结石'],
    dispatcherTips: ['不要口服任何止痛药', '不要进食饮水', '注意是否有腹肌紧张', '记录疼痛起始部位和转移情况'],
  },
  animal_bite: {
    description: '动物咬伤可导致组织撕裂、感染和狂犬病风险。狗咬伤最常见，猫咬伤更容易深部感染。',
    commonCauses: ['流浪狗咬伤', '宠物犬攻击', '猫抓咬伤'],
    dispatcherTips: ['用清水和肥皂彻底冲洗伤口', '直接压迫止血', '不要缝合伤口', '询问动物是否接种狂犬疫苗', '建议就医评估破伤风和狂犬病预防'],
  },
  assault: {
    description: '暴力袭击可导致头部外伤、软组织损伤和骨折等。头部撞击需特别警惕颅内出血。',
    commonCauses: ['街头暴力', '家庭暴力', '酒后冲突'],
    dispatcherTips: ['确保现场安全后再接触伤者', '如有意识水平改变需警惕颅内损伤', '控制外出血', '不要移动怀疑脊柱伤者'],
  },
  back_pain: {
    description: '非创伤性急性腰痛多由肌肉韧带拉伤或椎间盘问题引起，通常为良性自限性。但需警惕腹主动脉瘤破裂等致命病因。',
    commonCauses: ['腰部肌肉拉伤', '腰椎间盘突出', '骨质疏松压缩性骨折', '肾结石放射痛'],
    dispatcherTips: ['让患者保持舒适体位', '不要搬运重物', '如为撕裂样腹痛伴虚脱需紧急处理', '询问年龄和基础疾病'],
  },
  carbon_monoxide: {
    description: '一氧化碳（CO）是无色无味的有毒气体，与血红蛋白的亲和力是氧气的240倍，导致组织缺氧。煤炉取暖、燃气热水器是常见来源。',
    commonCauses: ['煤炉取暖通风不良', '燃气热水器安装不当', '汽车尾气在密闭空间', '火灾吸入'],
    dispatcherTips: ['立即打开门窗通风', '将患者移至通风处', '意识不清者侧卧防误吸', '高浓度吸氧是特效治疗'],
  },
  choking: {
    description: '气道异物阻塞是指异物卡在咽喉或气管导致无法呼吸。完全梗阻表现为不能说话、不能咳嗽、面色发紫，是致命急症。',
    commonCauses: ['儿童吞食小物件', '进食过快或大笑', '老年人吞咽功能减退'],
    dispatcherTips: ['询问"你能说话吗"判断是否完全梗阻', '完全梗阻立即海姆立克急救', '婴儿使用背击和胸压法', '不要用手指盲目掏取'],
  },
  eye_injury: {
    description: '化学物入眼是一种眼科急症，需要立即大量清水冲洗。腐蚀性化学品可导致角膜溃疡和永久性视力损伤。',
    commonCauses: ['实验室化学品飞溅', '工业事故', '家用化学品（洗洁精、漂白水等）误入'],
    dispatcherTips: ['立即冲洗至少20分钟', '冲洗时睁眼转动眼球', '不要揉搓眼睛', '去除隐形眼镜（如有）'],
  },
  severe_headache: {
    description: '突发剧烈头痛（"炸裂样"头痛）需警惕蛛网膜下腔出血等脑血管急症。与普通头痛不同，这种头痛通常患者在描述时称之为"生平最剧烈的头痛"。',
    commonCauses: ['蛛网膜下腔出血', '偏头痛', '紧张型头痛', '颅内感染'],
    dispatcherTips: ['让患者保持安静、避光', '不要口服止痛药', '询问是否伴有呕吐和意识变化', '注意有无颈部僵硬'],
  },
  heat_stroke: {
    description: '热射病是最严重的中暑类型，核心体温超过40°C，伴中枢神经系统异常（意识模糊、抽搐等）。病死率高，需要紧急降温。',
    commonCauses: ['高温高湿环境剧烈运动', '老年人在无空调环境中', '儿童被遗留在车内', '某些药物影响体温调节'],
    dispatcherTips: ['立即将患者移至阴凉处', '脱去多余衣物', '用冷水擦拭或冰袋降温', '重点降温部位：颈部、腋窝、腹股沟', '如有意识可补充含盐饮料'],
  },
  heart_problems: {
    description: '心律失常是指心脏跳动频率或节律异常，可表现为心动过速、心动过缓或心律不齐。快速心律失常可能导致血流动力学不稳定。',
    commonCauses: ['心房颤动', '室上性心动过速', '冠心病', '电解质紊乱', '甲状腺功能亢进'],
    dispatcherTips: ['让患者保持安静', '记录脉搏频率和节律', '询问是否有心脏病史', '如伴有胸痛、头晕、气短需紧急处理'],
  },
  psychiatric: {
    description: '自杀倾向（自杀企图）是精神卫生领域的急症。患者可能已经服药过量或采取其他自伤行为，需要紧急干预。',
    commonCauses: ['抑郁症发作', '双相情感障碍', '精神分裂症', '急性应激反应', '药物滥用'],
    dispatcherTips: ['保持冷静、共情的沟通态度', '确认患者位置和安全', '不要做价值评判或说教', '收集药瓶等物证', '联系家属或见证人'],
  },
  stab_gunshot: {
    description: '刀刺伤和枪伤属于穿通性创伤，可导致内部器官损伤和大出血。胸部穿通伤可能导致张力性气胸或开放性气胸。',
    commonCauses: ['暴力冲突', '意外事故', '自伤'],
    dispatcherTips: ['不要移除刺入的刀或异物', '伤口有气泡时用敷料三边密封', '直接压迫止血', '保持伤者平卧'],
  },
  unconscious_fainting: {
    description: '晕厥是一过性全脑灌注不足导致的短暂意识丧失，多数可在数秒至数分钟内自行恢复。但需警惕心源性晕厥等严重病因。',
    commonCauses: ['血管迷走性晕厥（最常见）', '体位性低血压', '心源性晕厥（心律失常）', '低血糖', '癫痫'],
    dispatcherTips: ['让患者平卧、抬高腿部', '意识恢复后不要马上站立', '询问既往史和发作前状态', '注意是否伴有抽搐或咬舌'],
  },
  sick_person: {
    description: '非特异性病患是指没有明确指向某种急症的不适状态，如持续发烧、全身乏力等。需通过问询逐步排除严重病因。',
    commonCauses: ['病毒或细菌感染', '中暑', '脱水', '不明原因发热'],
    dispatcherTips: ['监测体温', '注意是否有意识变化', '保持水分补充', '如持续发热超过3天建议就医'],
  },
  trauma: {
    description: '高处坠落伤是多发伤的典型代表，坠落高度越高、伤势越重。常见损伤包括脊柱骨折、骨盆骨折、下肢骨折和内脏损伤。',
    commonCauses: ['施工坠落', '从高处意外跌落', '跳楼自杀未遂'],
    dispatcherTips: ['不要移动伤者以防脊柱二次损伤', '控制外出血', '注意保暖', '评估意识水平'],
  },
  entrapment: {
    description: '电梯困人属于特殊救援场景，被困者可能因空间密闭、空气流通差而产生焦虑，尤其是有基础疾病或孕产妇等特殊人群。',
    commonCauses: ['电梯故障', '停电导致电梯停运'],
    dispatcherTips: ['安抚被困者情绪', '询问是否有孕妇、老人或病患', '指导保持通风处', '联系消防和电梯维修', '不要强行扒门'],
  },
  urinary: {
    description: '肾绞痛通常由输尿管结石引起，表现为突发的腰腹部剧烈绞痛，放射至会阴部，是急诊常见的疼痛急症。',
    commonCauses: ['输尿管结石', '肾结石', '尿路感染'],
    dispatcherTips: ['疼痛通常剧烈但多数可自行缓解', '收集尿液观察是否血尿', '不要盲目服用止痛药', '建议就医影像学检查'],
  },
}

export function KnowledgeScreen({ onBack }: Props) {
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const scenarios = useMemo(() => {
    const list = SCENARIO_IDS
      .map((id) => SCENARIOS[id])
      .filter((s) => !s.isPrank)
      .sort((a, b) => a.mpdsCard.number - b.mpdsCard.number)

    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (s) =>
        s.title.includes(q) ||
        s.mpdsCard.title.includes(q) ||
        s.mpdsCard.chiefComplaint.includes(q) ||
        String(s.mpdsCard.number).includes(q),
    )
  }, [search])

  const grouped = useMemo(() => {
    const groups: Record<string, EmergencyScenario[]> = {}
    for (const det of DET_ORDER) groups[det] = []
    for (const s of scenarios) {
      const det = parseDeterminant(s.mpdsCard.determinantCode)
      if (groups[det]) groups[det].push(s)
    }
    return groups
  }, [scenarios])

  // 当前选中的场景（用于弹窗）
  const selected = selectedId ? SCENARIOS[selectedId] ?? null : null
  const selectedNotes = selected ? DISPATCHER_NOTES[selected.id] ?? null : null

  return (
    <div style={styles.container}>
      {/* 头部 */}
      <div style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>← 返回</button>
        <h1 style={styles.title}>MPDS 知识库</h1>
        <div style={{ width: 60 }} />
      </div>

      {/* 搜索 */}
      <div style={styles.searchBar}>
        <input
          style={styles.searchInput}
          placeholder="搜索协议编号、名称、主诉..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button style={styles.clearBtn} onClick={() => setSearch('')}>✕</button>
        )}
      </div>

      {/* 判定等级图例 */}
      <div style={styles.legend}>
        <span style={styles.legendTitle}>MPDS 判定等级：</span>
        {DET_ORDER.map((det) => {
          const info = MPDS_DETERMINANT_INFO[det]
          return (
            <span key={det} style={{ ...styles.legendTag, color: info.color, borderColor: info.color }}>
              ● {det[0]}{det.slice(1).toLowerCase()} {info.label.split('—')[1]?.trim()}
            </span>
          )
        })}
      </div>

      {/* 场景列表 */}
      <div style={styles.scrollArea}>
        {DET_ORDER.map((det) => {
          const items = grouped[det] ?? []
          if (items.length === 0) return null
          const info = MPDS_DETERMINANT_INFO[det]
          return (
            <div key={det} style={styles.section}>
              <h2 style={{ ...styles.sectionTitle, color: info.color, borderLeftColor: info.color }}>
                {det[0]}-{det.slice(1).toLowerCase()} {info.label}
              </h2>
              <div style={styles.cardGrid}>
                {items.map((s) => (
                  <div
                    key={s.id}
                    style={styles.card}
                    onClick={() => setSelectedId(s.id)}
                  >
                    <div style={styles.cardTitle}>{s.title}</div>
                    <div style={styles.cardBottom}>
                      <span style={{ ...styles.protocolBadge, backgroundColor: `${info.color}15`, color: info.color }}>
                        #{s.mpdsCard.number}
                      </span>
                      <span style={styles.cardMiddle} />
                      <span style={{ ...styles.detBadge, backgroundColor: info.color, color: '#fff' }}>
                        {s.mpdsCard.determinantCode}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* ====== 详情弹窗 ====== */}
      {selected && selectedNotes && (
        <div style={styles.modalOverlay} onClick={() => setSelectedId(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            {/* 弹窗头部 */}
            <div style={{ ...styles.modalHeader, borderBottomColor: MPDS_DETERMINANT_INFO[parseDeterminant(selected.mpdsCard.determinantCode)].color }}>
              <div style={styles.modalHeaderLeft}>
                <span style={styles.modalProtocolBadge}>#{selected.mpdsCard.number}</span>
                <div>
                  <div style={styles.modalTitle}>{selected.title}</div>
                  <div style={styles.modalSubtitle}>{selected.mpdsCard.chiefComplaint}</div>
                </div>
              </div>
              <button style={styles.modalCloseBtn} onClick={() => setSelectedId(null)}>✕</button>
            </div>

            {/* 弹窗内容 */}
            <div style={styles.modalBody}>
              <DetailSection icon="📋" title="病情概述">
                <p style={styles.paragraph}>{selectedNotes.description}</p>
              </DetailSection>

              {/* 现场案例 */}
              {(() => {
                const ex = SCENARIO_EXAMPLES[selected.id]
                if (!ex) return null
                return (
                  <DetailSection icon="🚑" title="现场案例">
                    <ul style={styles.list}>
                      {ex.examples.map((e, i) => (
                        <li key={i} style={{
                          ...styles.listItem,
                          fontWeight: i === ex.gameIndex ? 700 : 400,
                          color: i === ex.gameIndex ? '#1e293b' : '#475569',
                        }}>
                          {e}
                        </li>
                      ))}
                    </ul>
                  </DetailSection>
                )
              })()}

              <DetailSection icon="🔍" title="常见原因">
                <ul style={styles.list}>
                  {selectedNotes.commonCauses.map((c, i) => (
                    <li key={i} style={styles.listItem}>{c}</li>
                  ))}
                </ul>
              </DetailSection>

              <DetailSection icon="💡" title="调度员注意事项">
                <ul style={styles.list}>
                  {selectedNotes.dispatcherTips.map((t, i) => (
                    <li key={i} style={styles.listItem}>{t}</li>
                  ))}
                </ul>
              </DetailSection>

              <DetailSection icon="❓" title="MPDS 关键问询">
                <ul style={styles.list}>
                  {selected.mpdsCard.keyQuestions.map((q, i) => (
                    <li key={i} style={styles.listItem}>{q}</li>
                  ))}
                </ul>
              </DetailSection>

              {selected.guidance && (
                <DetailSection icon="🩺" title={`急救指导：${selected.guidance.title}`}>
                  <p style={styles.paragraph}>{selected.guidance.intro}</p>
                  <ol style={styles.list}>
                    {selected.guidance.steps.map((step, i) => (
                      <li key={i} style={{ ...styles.listItem, marginBottom: 6 }}>
                        <strong>{step.prompt}</strong>
                        <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                          {step.options.map((o, j) => `${j === step.correctIndex ? '✅ ' : ''}${o}`).join(' · ')}
                        </div>
                      </li>
                    ))}
                  </ol>
                </DetailSection>
              )}

              <DetailSection icon="🏷️" title="判定信息">
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>判定码</span>
                  <span style={{ ...styles.infoValue, fontFamily: 'monospace', fontWeight: 'bold', color: MPDS_DETERMINANT_INFO[parseDeterminant(selected.mpdsCard.determinantCode)].color }}>
                    {selected.mpdsCard.determinantCode}
                  </span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>协议编号</span>
                  <span style={styles.infoValue}>{selected.mpdsCard.number}</span>
                </div>
                <div style={styles.infoRow}>
                  <span style={styles.infoLabel}>分诊建议</span>
                  <span style={styles.infoValue}>{MPDS_DETERMINANT_INFO[parseDeterminant(selected.mpdsCard.determinantCode)].label}</span>
                </div>
              </DetailSection>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function DetailSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={styles.detailSection}>
      <div style={styles.detailSectionTitle}>{icon} {title}</div>
      {children}
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100vw',
    height: '100vh',
    backgroundColor: '#f0f4f8',
    display: 'flex',
    flexDirection: 'column',
    color: '#334155',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderBottom: '1px solid #e2e8f0',
    backgroundColor: '#ffffff',
  },
  backBtn: {
    padding: '6px 14px',
    fontSize: 13,
    color: '#64748b',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    cursor: 'pointer',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
    margin: 0,
    letterSpacing: 2,
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    margin: '10px 20px',
    position: 'relative',
  },
  searchInput: {
    flex: 1,
    padding: '8px 12px',
    fontSize: 13,
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    color: '#334155',
    outline: 'none',
  },
  clearBtn: {
    position: 'absolute',
    right: 8,
    background: 'none',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    fontSize: 14,
  },
  legend: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 20px',
    flexWrap: 'wrap',
    fontSize: 11,
  },
  legendTitle: { color: '#94a3b8', marginRight: 4, fontWeight: 'bold' },
  legendTag: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    padding: '2px 8px',
    borderRadius: 4,
    border: '1px solid',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 20px 30px',
  },
  section: { marginTop: 16 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    margin: '0 0 8px',
    paddingLeft: 10,
    borderLeft: '3px solid',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: 6,
  },
  card: {
    padding: '12px',
    backgroundColor: '#ffffff',
    border: '1px solid #e2e8f0',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 72,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#334155',
  },
  cardBottom: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  cardMiddle: {
    flex: 1,
  },
  protocolBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    padding: '2px 8px',
    borderRadius: 4,
  },
  detBadge: {
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: 'monospace',
    padding: '2px 6px',
    borderRadius: 4,
  },
  chiefComplaint: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
    lineHeight: 1.4,
  },

  // ---------- 弹窗 ----------
  modalOverlay: {
    position: 'fixed' as const,
    inset: 0,
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backdropFilter: 'blur(2px)',
  },
  modal: {
    width: 560,
    maxHeight: '85vh',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column' as const,
    overflow: 'hidden',
    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '14px 18px',
    backgroundColor: '#f8fafc',
    borderBottom: '3px solid',
  },
  modalHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  modalProtocolBadge: {
    fontSize: 18,
    fontWeight: 900,
    fontFamily: 'monospace',
    color: '#3b82f6',
    backgroundColor: '#eff6ff',
    padding: '4px 10px',
    borderRadius: 6,
    lineHeight: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: '4px 10px',
    backgroundColor: 'transparent',
    color: '#94a3b8',
    border: '1px solid #e2e8f0',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 1,
  },
  modalBody: {
    flex: 1,
    padding: '14px 18px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: 14,
  },

  // ---------- 详情区块 ----------
  detailSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#64748b',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: 3,
  },
  paragraph: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.8,
    margin: 0,
  },
  list: {
    margin: 0,
    paddingLeft: 18,
  },
  listItem: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 1.7,
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '2px 0',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94a3b8',
    minWidth: 64,
  },
  infoValue: {
    fontSize: 13,
    color: '#475569',
  },
}
