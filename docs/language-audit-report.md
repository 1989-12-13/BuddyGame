# 零点接线台 — 全量中文语言审核报告

> 生成日期: 2026-07-14  
> 审核范围: `src/` 下所有中文文本（对话、UI、系统消息、知识库）  
> 审核方法: 分区域子智能体扫描 + 人工逐文件校验

---

## 目录

1. [总览与统计](#1-总览与统计)
2. [严重问题（逻辑Bug级）](#2-严重问题逻辑bug级)
3. [中等问题（语义别扭/不自然）](#3-中等问题语义别扭不自然)
4. [轻微问题（风格/一致性问题）](#4-轻微问题风格一致性问题)
5. [未覆盖的关系映射表](#5-未覆盖的关系映射表)
6. [卡片逐项评审](#6-卡片逐项评审)
7. [UI文本评审](#7-ui文本评审)
8. [知识库文本评审](#8-知识库文本评审)
9. [测试文件中的中文](#9-测试文件中的中文)
10. [修复优先级建议](#10-修复优先级建议)

---

## 1. 总览与统计

| 项目 | 数量 |
|------|------|
| 总源文件数 | ~200 |
| 含中文文本的文件 | ~180+ |
| 场景卡片文件 | 33 |
| 来电者人物 | 27 |
| MPDS协议数 | 33 |
| 急救指导场景 | 6大类 |
| 待修复严重问题 | 4 |
| 待修复中等问题 | 8 |
| 待修复轻微问题 | 12 |

---

## 2. 严重问题（逻辑Bug级）

### 2.1 `narrative.ts` — `relationshipContext()` 缺失 8 种关系映射

**文件:** `src/game/core/reducers/narrative.ts:62-73`

```typescript
function relationshipContext(relationship: string): string {
  switch (relationship) {
    case '路人':    return '我在路边看到的'
    case '同事':    return '我们正在上班'
    case '家人':
    case '家属':   return '刚才在家里还好好的'
    case '朋友':    return '我们刚才还在聊天'
    case '邻居':    return '我听到声音过来看的'
    case '伴侣':
    case '夫妻':   return '我们俩刚才还好好的'
    default:        return '刚才还好好的'    // ← 兜底太泛
  }
}
```

`personas.ts` 中实际存在的 `relationship` 值（共 14 种），但函数仅处理 7 种，**缺失 8 种**：

| 缺失值 | 出现在 | 当前表现（掉入default） |
|--------|--------|------------------------|
| `'本人'` | xu_dawei, tian_feng, gao_yan, zheng_yu | `"刚才还好好的"` — 对本人不合理 |
| `'母亲'` | liu_fang, song_na, cheng_xin, xu_mei | `"刚才还好好的"` — 太泛 |
| `'父亲'` | huang_qiang | `"刚才还好好的"` — 太泛 |
| `'儿子'` | ma_tao | `"刚才还好好的"` — 太泛 |
| `'妻子'` | wu_lili | `"刚才还好好的"` — 应同"伴侣" |
| `'丈夫'` | li_jianguo, zhao_lei | `"刚才还好好的"` — 应同"伴侣" |
| `'小孩'` | xiao_pang（恶作剧） | `"刚才还好好的"` — 和小孩语气冲突 |
| `'室友'` | lu_jie, long_jie | `"刚才还好好的"` — 太泛 |
| `'工友'` | fang_yu, lei_gang, luo_wei | `"刚才还好好的"` — 太泛 |
| `'家属'` | wei_qiang | 已映射（同 `'家人'`）✅ |

**影响:** 所有 5 个压力级别的 `generateEventNarrative()` 输出中，关系上下文都会对上述人群输出过于泛化的 "刚才还好好的"，导致语义失准。

---

### 2.2 `narrative.ts` — 当 `relationship === '本人'` 时代词冲突

**文件:** `src/game/core/reducers/narrative.ts:77-110`

当来电者就是患者本人时（如腹痛/背痛/肾绞痛等场景），各压力模板中的代词 `getPronoun(gender)` 会产生 "他/她" 与 "我" 的冲突：

```typescript
// generateEventNarrative, stress >= 50
text: `${pronoun}...我...我不知道怎么说...${chiefComplaint}...`  
// → "他...我...我不知道怎么说...我肚子疼得站不起来..."  ✗ 人称混乱

// generateEventNarrative, stress >= 25
text: `${pronoun}${chiefComplaint}...就是这样的情况...`
// → "他我肚子疼得站不起来..."  ✗ 主语冲突

// generateAgeNarrative
text: `${pronoun}25岁...`
// → "他25岁..."  ✗ 本人不应称"他"
```

**影响:** 所有含 `'本人'` 来电者的场景（`abdominalPainCard`, `backPainCard`, `urinaryCard`, `heartProblemsCard`, `psychiatricCard` 等）的叙述式回答均会出现人称混乱。

---

### 2.3 `pronouns.ts` — `getPatientDescriptor` 对 `'家属'` 输出含空括号

**文件:** `src/game/content/pronouns.ts:43-55`

```typescript
if (relationship === '家人' || relationship === '家属') 
  return `家属（${gender === '女性' ? '女' : gender === '男性' ? '男' : ''}）`
```

当 `gender === '不详'` 时，输出为 `"家属（）"`（空括号）。  
当 `gender === '男性'` 时，输出 `"家属（男）"` — 这像代码注释/系统标签，不是自然中文。

`phrases.ts:67` 中使用此值：
```typescript
guidanceIntro: (patientDesc: string) => `...请您按照我的指令来帮助${patientDesc}。`
// → "...来帮助家属（男）。"  ✗ 不自然
```

更好的输出：`"患者"`（不详时）、`"他"`（男性时）、`"她"`（女性时）或 `"您的家人"`。

---

### 2.4 `narrative.ts` — `generateAgeNarrative` 对非数字年龄产生语义错误

**文件:** `src/game/core/reducers/narrative.ts:113-119`

```typescript
const cleanAge = age.replace(/男性|女性|男|女|不详/g, '').trim()
```

恶作剧电话（`prankCallCard.ts`）的年龄字段为 `'小猫'`。清洗后仍为 `'小猫'`：

```
stress >= 75: "小猫！！反正就是这么大年纪！！你们快来啊！！"  ✗
stress >= 50: "好像是小猫...我也记不清了..."                    ✗
stress >= 25: "小猫...应该差不多是这个岁数。"                    ✗
```

虽然恶作剧电话可能不会触发步骤3的询问，但**存在误触发的风险路径**。

---

## 3. 中等问题（语义别扭/不自然）

### 3.1 `narrative.ts` — `generateAgeNarrative` 应力≥75 模板缺乏语义一致性

```typescript
if (stress >= 75) return `${cleanAge}！！反正就是这么大年纪！！你们快来啊！！`
```

对 `"25岁"` 输出：`"25岁！！反正就是这么大年纪！！你们快来啊！！"`  

"这么大年纪" 在中文中通常用于老年人（>60岁），用在 25 岁患者身上语气非常奇怪。建议改：
- 改为 `"${cleanAge}！！就是！你们快来啊！！"` 或 `"${cleanAge}！！我也说不清多大！！反正就是！你们快来啊！！"`

---

### 3.2 `askQuestion.ts` — 求助目的问题过于正式

**文件:** `src/game/core/reducers/askQuestion.ts:202`

```typescript
newDialogue.push({ speaker: 'operator', text: '您现在最需要我们协助处理什么？', timestamp: now })
```

"协助处理什么" 过于书面/正式，不符合调度员自然口语。建议改为：
- `"您现在最需要我们帮您做什么？"` 或 `"您希望我们先做什么？"`

---

### 3.3 `askQuestion.ts` — 联系电话回答描述不够自然

**文件:** `src/game/core/reducers/askQuestion.ts:183-186`

```
50≤stress<75: "就是我这个手机吧...哎我现在脑子都是乱的...你打我这个号就行...这个是...等一下我看看..."
25≤stress<50: "就我这个手机！138那个...你打过来应该看得到吧？就是现在这个号码。"
```

问题：第二阶段（25-49）的回答中 `"138那个..."` 暗示来电者在报号但未完整报出。在"紧张"（25-49）级别下更合理的回答应该是完整报号，因为玩家需要通过号码确认。建议`"就我这个手机号：138xxxx，你打过来应该看得到。"`

---

### 3.4 `calmCaller.ts` — 来电者安抚回应单一

**文件:** `src/game/core/reducers/calmCaller.ts:34`

```typescript
const callerLine: DialogueLine = {
  speaker: 'caller', text: '好...好的，我尽量...你说...',
}
```

无论安抚几次、什么压力级别，来电者始终回复同一句话。建议根据压力等级做差异化：
- 恐慌→镇定: `"好...好的，我尽量..."`  
- 镇定→紧张: `"好，你说，我听着。"`  
- 紧张→镇定: `"行，我冷静了，你问。"`

---

### 3.5 `dispatch.ts` — 分诊标签中文括号不统一

**文件:** `src/game/core/reducers/dispatch.ts:47`

```typescript
`${triage === 'red' ? '红色(濒危)' : triage === 'yellow' ? '黄色(危重)' : triage === 'green' ? '绿色(轻伤)' : '黑色'}`
```

"红色(濒危)" 使用半角括号 `()`，但项目中其他中文文本使用全角括号 `（）` 和中文间隔号 `·`。

`mpds.ts` 中 `TRIAGE_LABELS` 使用全角格式 `'红色 — 濒危'`，与此不一致。

---

### 3.6 `debrief.ts` — 判断理由推理依赖硬编码中文子串

**文件:** `src/game/core/reducers/debrief.ts:222-228`

```typescript
const q = j.question
if (q.includes('年龄')) reason = '来电者使用了不确定描述词...'
else if (q.includes('出血')) reason = '根据"非喷射、持续渗"的描述...'
else if (q.includes('意识') || q.includes('呼吸')) reason = '来电者描述显示患者有意识...'
else if (q.includes('恶作剧') || q.includes('非人体')) reason = '来电者声称患者是动物...'
else if (q.includes('协议') || q.includes('MPDS')) reason = '根据主诉描述应选择对应的 MPDS 协议编号'
```

问题：
1. **脆皮匹配** — 问题文本如有改动，匹配失效。
2. **`q.includes('出血')` 引用的 `"非喷射、持续渗"` 是某张特定卡片的描述**，不在通用问题文本中。因此 `reason` 描述与用户看到的判断问题不匹配。
3. **硬编码特定内容** 比枚举驱动的判断更容易产生不一致。

---

### 3.7 `completeMinigame.ts` — 评分显示缺少单位

**文件:** `src/game/core/reducers/completeMinigame.ts:29`

```typescript
`【实操指导：${spec.title}】${passed ? '操作到位' : '操作需改进'}（评分 ${(score * 100).toFixed(0)}）`
```

`（评分 85）` 缺少单位。虽然上下文能理解，但从 UI 显示角度看，建议加 `分`：
`（评分 ${(score * 100).toFixed(0)}分）`

---

### 3.8 `endCall.ts` — 通话总结"本通"为缩写口语，可能不够清晰

**文件:** `src/game/core/reducers/endCall.ts:131`

```typescript
`【通话结束 | 患者死亡 · 任务失败 · 本通 0 分】`
```

"本通" 是 "本通电话" 的缩略，在系统消息中显得过于口语化。建议：
- `"本通得分：0 分"` 或 `"本轮 0 分"`

---

## 4. 轻微问题（风格/一致性问题）

### 4.1 句子结尾标点不统一

在系统消息（`tick.ts`, `dispatch.ts`, `endCall.ts`）中，有些行有句号结尾，有些没有：

| 位置 | 文本 | 有/无句号 |
|------|------|----------|
| `tick.ts:43` | `【▸ 救护车已到达现场】` | ❌ |
| `tick.ts:65` | `患者心搏骤停 · 生命体征消失` | ❌ |
| `tick.ts:70` | `患者死亡 · 救援失败` | ❌ |
| `tick.ts:47` | `✓ 救治成功 · 患者获救` | ❌ |
| `dispatch.ts:72` | `⛔ 黄金抢救窗已过 · 患者生存率骤降` | ❌ |
| `dispatch.ts:74` | `⚠ 进入派车预警区间（>45s）` | ❌ |
| `endCall.ts:131` | `【通话结束 \| 患者死亡 · 任务失败 · 本通 0 分】` | ❌ |
| `narrative.ts:119` | `25岁。` | ✅ |

作为**系统事件流**（`patientEvents`），统一不加句号是可接受的风格，但 `dispatch.ts` 中的 `⚠` 事件和 `tick.ts` 中的 `患者心搏骤停` 事件缺少统一的间隔符号标准（部分用 `·` 部分用 `，`）。

### 4.2 LevelSelectScreen 分类名长度不均衡

| 分类 | 长度 |
|------|------|
| 心肺复苏 | 4字 |
| 呼吸系统 | 4字 |
| 创伤出血 | 4字 |
| 神经系统 | 4字 |
| 心血管 | 3字 |
| 消化泌尿 | 4字 |
| 内分泌过敏 | 5字 |
| 眼伤灼伤 | 4字 |
| 精神特殊 | 4字 |
| **妇儿老年** | **4字** |

"妇儿老年" 缩写度最高（涵盖妇科、儿科、老年科），"老人跌倒" 和 "不明原因发烧" 放在此类别下语义较泛。

### 4.3 `answerCall.ts` — 系统行开头用代码注释风格符号

```typescript
`【来电号码: ${scenario.phoneNumber} | 基站定位: ${scenario.baseStation} | 来电者情绪: ${callerState.stressLevel}】`
```

用 `|`（管道符）分隔，与项目中系统消息使用的 `·`（间隔号）不统一。可以将 `|` 统一为 `·`。

### 4.4 安抚后的来电者回答标点与语气匹配

`calmCaller.ts:34` — `'好...好的，我尽量...你说...'`  
省略号和逗号混用。在极度紧张场景下可以接受，但正常化后或低压力场景下应使用不同语气。

### 4.5 `narrative.ts` — `pickNarrativeAnswer` 的注释使用了英文

```typescript
// 失控（75+）：语无伦次，完全无法提供信息
// 恐慌（50-74）：有概率完全无法提供信息或只能提供部分信息
// 紧张（25-49）：只能提供部分信息
// 镇定（0-24）：能给出完整信息
```

这些注释中中英文混写（"exclusive" 隐藏在上述含义中但不在注释中显示），虽然有 `STRESS_*_MAX` 常量的引用，但注释风格统一性较好，仅作为备注明细。

### 4.6 关系类型散落在多个文件中

关系值分散于：
- `personas.ts`（定义层） — 14 种值
- `narrative.ts`（对话生成） — 处理 7 种 + default
- `pronouns.ts`（描述生成） — 处理 8 种 + default

**没有统一的"关系映射"事实源。** 这导致新增一个关系值时需要修改三个文件，极容易遗漏。

---

## 5. 未覆盖的关系映射表

### 5.1 `relationshipContext()` 缺失完整映射

```typescript
// 当前: narrative.ts:62-73
// 需新增:
case '母亲':
case '父亲':
case '儿子':    return '刚才在家里还好好的'  // 同家人
case '妻子':
case '丈夫':    return '我们俩刚才还好好的'  // 同伴侣
case '本人':    return '我正在'              // 本人场景特有
case '小孩':    return '我在'               // 恶作剧/儿童监护
case '室友':    return '我们合租'           // 类似朋友
case '工友':    return '我们在工地'         // 类似同事
```

### 5.2 `getPatientDescriptor()` 缺失完整映射

```typescript
// 当前: pronouns.ts:43-55
// 需新增:
case '母亲':    return '您母亲'
case '父亲':    return '您父亲'
case '儿子':    return '您儿子'
case '本人':    return '您自己'        // guidance 场景
case '小孩':    return '这个小朋友'    // 儿童来电者
case '室友':    return '您的室友'
case '工友':    return '您的工友'
case '妻子':    return '您妻子'         // 同伴侣
case '丈夫':    return '您丈夫'         // 同伴侣
case '家属':    return '您的家人'       // 替代"家属（男）"
```

### 5.3 `generateEventNarrative()` 需对 `'本人'` 特殊处理

当 `relationship === '本人'` 时：
- 禁用代词前缀（`${pronoun}...我...我不知道怎么说` → 直接 `"我...我不知道怎么说..."`）
- 禁用 `${pronoun}快不行了！！` → `"我快不行了！！"`
- 禁用 `${pronoun}${chiefComplaint}` → `${chiefComplaint}` 或 `"我${chiefComplaint}"`

---

## 6. 卡片逐项评审

### 6.1 卡片结构一致性

全部 33 张卡片严格遵循 `EmergencyScenario` 接口，结构一致 ✅

### 6.2 开场白（openingLine）审查

| 卡片 | 开场白 | 评价 |
|------|--------|------|
| 心脏骤停 | 喂！120吗？我老婆刚才还好好的在看电视... | ✅ 自然 |
| 脑卒中 | 喂？是120吗？我……我们老头子刚才吃饭的时候... | ✅ 自然（"老头子"口语化） |
| 胸痛 | 120吗！我朋友突然说胸口疼得厉害... | ✅ 自然 |
| 过敏 | 120吗！快来啊！我朋友不知道被什么叮了... | ✅ 自然 |
| 出血 | 120吗！我……我同事手被刀割了！血止不住！ | ✅ 自然 |
| 恶作剧 | 喂！哈哈哈哈！我们家的小猫卡在树上了... | ✅ 符合恶作剧语气 |
| 产科 | 喂？我老婆羊水破了！预产期还有两周呢！ | ✅ 自然 |
| 泌尿/肾绞痛 | 120吗？我……我腰疼得受不了了... | ✅ 自然（本人来电） |
| 背部/腰扭伤 | 120吗？我弯腰搬东西的时候突然腰就动不了了... | ✅ 自然 |

**所有开场白评审通过**，语义自然，符合人物设定。

### 6.3 MPDS 问询问题（questionText）审查

| 卡片 | 问询文本样例 | 评价 |
|------|-------------|------|
| 脑卒中 | 这些症状是什么时候开始出现的？ | ✅ |
| 胸痛 | 疼痛有没有往其他地方跑？ | ✅（口语化） |
| 出血 | 血是喷出来的还是流出来的？ | ✅ |
| 过敏 | 患者有没有呼吸困难或者喉咙发紧的感觉？ | ✅ |

**全部通过。** 问询文本设计自然，符合调度员话术。

### 6.4 急救指导反馈（feedback）审查

| 卡片 | 反馈样例 | 评价 |
|------|---------|------|
| 胸痛-正确 | 正确，半卧位有助于减轻心脏负担 | ✅ |
| 胸痛-错误 | 不对，让患者保持安静半卧位，不要走动 | ✅ |
| 胸痛-来电者正确 | 好，我让他靠着椅子坐，衣领和腰带都解开了 | ✅ 细节丰富 |
| 胸痛-来电者错误 | 他说想站起来走走看会不会好点…我刚扶他站起来他就说更晕了 | ✅ 生动 |
| 出血-来电者正确 | 好的！我用毛巾用力按住了！血好像慢一点了！ | ✅ |
| 出血-来电者错误 | 我找了一下没有大绷带，找了一个创可贴贴上去了... | ✅ |

**全部通过。** 反馈的来电者回答细节丰富，语气符合场景。

### 6.5 特殊事件对话（specialEvents.dialogue）审查

| 卡片 | 特殊事件 | 评价 |
|------|---------|------|
| 脑卒中-15s | 哎呀！老头子现在好像更严重了...你们到哪了？ | ✅ |
| 胸痛-20s | 他手捂着胸口说越来越疼了！疼得说不出话了！ | ✅ |
| 心脏骤停-20s | 她脸色越来越白了！救护车怎么还没到啊！呜呜…… | ✅ |
| 出血-25s | 他好像晕过去了！血还在流！怎么办啊！ | ✅ |

**全部通过。** 对话自然体现病情恶化。

### 6.6 结局叙事（outcomeNarrative）审查

| 卡片 | 好结局 | 坏结局 | 评价 |
|------|--------|--------|------|
| 心脏骤停 | 恢复心跳 | 脑死亡 | ✅ 简洁 |
| 胸痛 | 支架植入后恢复良好 | 心肌大面积坏死 | ✅ |
| 脑卒中 | 溶栓时间窗内得到治疗 | 永久偏瘫 | ✅ |
| 恶作剧 | 正确识别恶作剧教育来电者 | 救护车被浪费 | ✅ |

**全部通过。** 叙事简洁有力，含医学细节但不过度。

---

## 7. UI 文本评审

### 7.1 标题画面（TitleScreen.tsx）

| 文本 | 评价 |
|------|------|
| `120 <Phone /> 调度台` | ✅ 中英混排合理 |
| `接听来电 · 问询登记 · MPDS 分诊 · 快速派车` | ✅ 标语用间隔号自然 |
| `开始值班` | ✅ |
| `选关` / `知识库` | ✅ |
| `EMERGENCY DISPATCH SIMULATOR` | ✅ 英文副标题有风格意图 |

### 7.2 结局画面（EndingScreen.tsx）

| 文本 | 评价 |
|------|------|
| 金牌/银牌/铜牌调度员 | ✅ |
| `需要复训` | ✅ (fail 评级) |
| `班次总分` | ✅ |
| `救回 {savedCount} / {totalCalls} 人` | ✅ |
| `重新值班` | ✅ |

### 7.3 选关画面（LevelSelectScreen.tsx）

| 文本 | 评价 |
|------|------|
| `搜索场景名称/编号...` | ✅ placeholder |
| `← 返回` | ✅ |
| `场景选择` | ✅ |
| 分类标签（10类） | ⚠️ "妇儿老年" 缩写度较高（见4.2） |

### 7.4 游戏内 UI（QuestionPanel.tsx + TerminalForm.tsx + TerminalModal.tsx）

| 文本 | 评价 |
|------|------|
| `请问事发的确切地址是哪里？` | ✅ 已经过优化 |
| `旁边有什么明显的标志物或者店铺吗？` | ✅ 已经过优化 |
| `患者清醒吗？{pronoun}还有呼吸吗？` | ✅ 已经过优化（动态代词） |
| `询问 ({timeCost}s)` | ✅ |
| `答案不可靠` | ✅ 压力告示 |
| `🫂 安抚` | ✅ |
| `消耗2秒安抚来电者` | ✅ title |
| `关闭调度卡` | ⚠️ 混合中文+设计用语，作为 title 属性可接受 |
| `✕ 挂断` / `≡ 暂存` / `▸ 确认派车` | ✅ |
| `救护车已派出` / `预计 X 秒后到达现场` | ✅ |

---

## 8. 知识库文本评审

### 8.1 急救指导详细说明（knowledge/guidance/*.ts）

包含 **6 个分类文件**（cardiac, general, neuro, obstetric, respiratory, trauma），每文件包含：
- 步骤提示（如 `第一步：开始CPR`）
- 问询选项（如 `'确认安全后开始胸外按压'` / `'先用水泼醒他'` / `'等专业救护人员来'`）
- 详细医学解释（带病理生理学说明）
- 选项分析

**通过评审。** 内容专业准确，错误选项设计合理（如 "先用水泼醒他"、"给她喝咖啡提神" 等荒诞选项具有教育意义）。

注意点：
- 知识库中的`小游戏`步骤（如 `实操环节：CPR 30:2`）属性正确 ✅
- 选项的 `correctIndex` 全部指向正确项 ✅
- `optionAnalysis` 长度与 `options` 一致 ✅

---

## 9. 测试文件中的中文

### 9.1 cards.consistency.test.ts

中文描述:
- `'所有卡片 ID 唯一'` ✅
- `'MPDS 协议信息一致性'` ✅
- 代词检查正则: `/他|她/` — 但检查的是硬编码文本中是否存在"他/她"，不包括动态字符串。由于 narrative 动态生成使用了 `getPronoun()`，测试可能漏检动态输出的代词。

### 9.2 其他测试文件

未发现模拟对话输出的中文字符串预期值。大部分测试验证逻辑层面（状态变化、分数计算）而非对话文本内容。

**建议新增**：为 `generateEventNarrative()`、`generateAgeNarrative()`、`generateVitalsNarrative()` 编写单元测试，覆盖：
- 所有关系类型（14种）
- 所有压力等级（4级）
- `'本人'` 关系的代词特殊处理
- 恶作剧电话边界（年龄='小猫'）

---

## 10. 修复优先级建议

### P0 — 必须立即修复（语义/逻辑错误）

| 优先级 | 问题 | 涉及文件 |
|--------|------|---------|
| **P0a** | `relationshipContext()` 缺失 `'本人'`、`'母亲'`、`'父亲'`、`'儿子'`、`'妻子'`、`'丈夫'`、`'小孩'`、`'室友'`、`'工友'` 映射 | `narrative.ts:62-73` |
| **P0b** | `'本人'` 关系下代词冲突（"他我..." / "他快不行了..."） | `narrative.ts:77-110`, `narrative.ts:113-119` |
| **P0c** | `getPatientDescriptor()` 对 `'家属'`+`'不详'` 输出空括号 `"家属（）"` | `pronouns.ts:46` |
| **P0d** | `generateAgeNarrative()` 对非数字年龄（'小猫'）语义错误 | `narrative.ts:113-119` |

### P1 — 应尽快修复（语义不自然）

| 优先级 | 问题 | 涉及文件 |
|--------|------|---------|
| **P1a** | `generateAgeNarrative` stress≥75 "这么大年纪" 对年轻患者不适用 | `narrative.ts:116` |
| **P1b** | 求助目的问题过于正式 | `askQuestion.ts:202` |
| **P1c** | `calmCaller.ts` 来电者回应单一无变化 | `calmCaller.ts:34` |
| **P1d** | `debrief.ts` 判断理由硬编码子串匹配 | `debrief.ts:222-228` |
| **P1e** | 分诊标签中半角括号 vs 全角括号不统一 | `dispatch.ts:47` |
| **P1f** | `getPatientDescriptor()` + `'家属（男）'` 用于 guidanceIntro 不自然 | `pronouns.ts:46`, `phrases.ts:67` |

### P2 — 建议修复（一致性与可维护性）

| 优先级 | 问题 | 涉及文件 |
|--------|------|---------|
| **P2a** | `completeMinigame.ts` 评分缺少 `分` 单位 | `completeMinigame.ts:29` |
| **P2b** | `answerCall.ts` 系统行用 `|` 而非 `·` | `answerCall.ts:31` |
| **P2c** | 关系类型分散在 3 个文件无统一事实源 | 架构问题 |
| **P2d** | 缺少 `narrative.ts` 动态输出的单元测试 | 测试覆盖 |
| **P2e** | `endCall.ts` 中 "本通" 缩略口语 | `endCall.ts:131` |

---

## 附录 A：关联关系总图

```
personas.ts           narrative.ts          pronouns.ts           phrases.ts
(数据层)              (对话生成)            (代词/描述)           (模板复用)
  │                      │                      │                    │
  │  14种relationship    │                      │                    │
  │  ──────────────────► │  7种显式映射          │                    │
  │                      │  + 1个default         │                    │
  │                      │                      │                    │
  │  gender              │  getPronoun(gender)   │  getPronoun()      │  getPronoun() 导出
  │  ──────────────────► │  ──────────────────►  │  ────────────────► │
  │                      │                      │                    │
  │  relationship        │                      │  getPatientDesc()  │  guidanceIntro()
  │  ──────────────────► │  用于添加关系语境      │  ────────────────► │
  │                      │                      │                    │
```

## 附录 B：所有关系值追踪

| 关系值 | personas.ts | narrative.ts relationshipContext | pronouns.ts getPatientDescriptor | 备注 |
|--------|:-----------:|:-------------------------------:|:-------------------------------:|------|
| 路人 | ✅ | ✅ | ✅ | 完整覆盖 |
| 同事 | ✅ | ✅ | ✅ | 完整覆盖 |
| 家人 | ✅ | ✅ | ✅ | `narrative` + `pronouns` 都与"家属"合并处理 |
| 家属 | ✅ | ✅ (`case '家人'`) | ✅ (`case '家人'`) | ✅ 已覆盖 |
| 朋友 | ✅ | ✅ | ✅ | 完整覆盖 |
| 邻居 | ✅ | ✅ | ✅ | 完整覆盖 |
| 伴侣 | — | ✅ | ✅ | 数据层无此值（由"妻子"/"丈夫"替代）|
| 夫妻 | — | ✅ | ✅ | 数据层无此值 |
| **本人** | ✅ | ❌ (default) | ❌ (default) | **P0 缺失** |
| 母亲 | ✅ | ❌ (default) | ❌ (default) | **P0 缺失** |
| 父亲 | ✅ | ❌ (default) | ❌ (default) | **P0 缺失** |
| 儿子 | ✅ | ❌ (default) | ❌ (default) | **P0 缺失** |
| 妻子 | ✅ | ❌ (default) | ✅ (有 `'夫妻'`) | `narrative` 缺映射 |
| 丈夫 | ✅ | ❌ (default) | ✅ (有 `'夫妻'`) | `narrative` 缺映射 |
| 小孩 | ✅ | ❌ (default) | ❌ (default) | **P0 缺失** |
| 室友 | ✅ | ❌ (default) | ❌ (default) | **P0 缺失** |
| 工友 | ✅ | ❌ (default) | ❌ (default) | **P0 缺失** |

---

## 附录 C：涉及文件索引

| 文件路径 | 行数 | 内容类型 | 评估状态 |
|---------|------|---------|---------|
| `src/game/core/reducers/narrative.ts` | 166 | 叙述式对话生成 | ⚠️ P0×2, P1×1 |
| `src/game/core/reducers/askQuestion.ts` | 309 | 问询处理器 | ⚠️ P1×1 |
| `src/game/core/reducers/calmCaller.ts` | 49 | 安抚处理器 | ⚠️ P1×1 |
| `src/game/core/reducers/dispatch.ts` | 131 | 派车处理器 | ⚠️ P1×1 |
| `src/game/core/reducers/tick.ts` | 185 | 时钟处理器 | ✅ |
| `src/game/core/reducers/endCall.ts` | 211 | 通话结束 | ⚠️ P2×1 |
| `src/game/core/reducers/answerCall.ts` | 61 | 接听电话 | ⚠️ P2×1 |
| `src/game/core/reducers/completeMinigame.ts` | 70 | 小游戏完成 | ⚠️ P2×1 |
| `src/game/core/reducers/answerGuidance.ts` | 67 | 指导回答 | ✅ |
| `src/game/core/debrief.ts` | 311 | 结算报告 | ⚠️ P1×1 |
| `src/game/core/constants.ts` | 102 | 常量定义 | ✅ |
| `src/game/content/pronouns.ts` | 60 | 代词系统 | ⚠️ P0×1 |
| `src/game/content/phrases.ts` | 77 | 短语模板 | ✅ (受 P0c 间接影响) |
| `src/game/content/protocols.ts` | 48 | 协议定义 | ✅ |
| `src/game/npc/personas.ts` | 257 | 来电者数据 | ✅ (数据源) |
| `src/game/events/cards/` (33个文件) | 各~190 | 场景定义 | ✅ |
| `src/screens/TitleScreen.tsx` | 161 | 标题UI | ✅ |
| `src/screens/EndingScreen.tsx` | 126 | 结局UI | ✅ |
| `src/screens/LevelSelectScreen.tsx` | 175 | 选关UI | ⚠️ P2×1 |
| `src/game/knowledge/guidance/` (6文件) | 各~300 | 医学知识库 | ✅ |
