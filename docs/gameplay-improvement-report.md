# BuddyGame 玩法逻辑改进报告

> 审查日期：2026-07-14 | 审查范围：问询/指导/发车/结局/NPC/场景/状态管理/音频

---

## 总览

| 级别 | 数量 | 分类 |
|------|------|------|
| 🔴 P0 实际 Bug | 4 | 状态不同步、数据流断裂、事件不触发 |
| 🟠 P1 设计缺陷 | 8 | 体验断层、策略深度不足、功能未完成 |
| 🔵 P2 平衡性问题 | 6 | 权重不当、一致性缺失 |
| ⚪ P3 低优先级 | 5 | 文本复用、边界值、死代码残留 |

---

## 🔴 P0 — 实际 Bug

### 1. derived 字段 `vitalSign` 在多个 reducer 中未同步

**位置：** `src/game/core/reducers/completeMinigame.ts:44-48`、`answerGuidance.ts:44-50`
**根因：** `PatientStatus` 中的 `vitalSign` 由 `stability` 通过 `stabilityToVitalSign()` 计算得到。但 `completeMinigame` 和 `answerGuidance` 在更新 `stability` 后**没有同步更新 `vitalSign`**。状态变为 `stability: 40`（`critical`）但 `vitalSign` 还停留在之前的级别。
**影响：** UI 显示的生命体征状态与实际患者健康状态可能不一致，Toast 提示可能延迟或错误。
**修复：** 两处 reducer 在修改 `stability` 后，追加 `vitalSign： stabilityToVitalSign(newStability)`。

### 2. `ambulanceRemaining` 与 `fleet.vehicle.eta` 双份倒计时不同步

**位置：** `src/game/types/world.ts:94`（`ambulanceRemaining` 定义）、`tick.ts:38-39`（递减 `ambulanceRemaining`）、`tick.ts:36`（`advanceFleet()` 递减 `eta`）
**根因：** 救护车到达使用两套独立计时：`state.ambulanceRemaining`（UI 展示用）和 `fleet[].vehicle.eta`（车辆状态机用）。两者在 `tick.ts` 中分别维护，没有使用同一数据源。
**影响：** UI 剩余时间和车辆实际到达可能产生秒级偏差；`ambulanceRemaining <= 0` 触发到达逻辑但 `fleet` 状态可能还未就绪。
**修复：** 统一为单一倒计时，或让 `ambulanceRemaining` 直接从 `fleet` 计算（getter 而非存储字段）。

### 3. `after_question` 类型 specialEvent 永不触发

**位置：** `src/game/events/cards/heartProblemsCard.ts:181`、`diabeticCard.ts:185` 使用了 `trigger: 'after_question'`；`src/game/core/reducers/` 下没有任何 reducer 处理此 trigger
**根因：** `askQuestion.ts` 中问询完成后没有检查当前卡片 `specialEvents` 中 `trigger === 'after_question'` 的事件。
**影响：** heartProblemsCard 和 diabeticCard 中定义的"问询后患者恶化"事件**完全不会发生**。
**修复：** 在 `askQuestion.ts` 底部追加 `after_question` 事件发射逻辑。

### 4. `specialEvents` 的 `eventType` 被完全忽略

**位置：** `src/game/core/reducers/tick.ts:150-168`
**根因：** tick.ts 处理 `time_elapsed` 事件时，只追加对话行（`dialogue`），完全无视 `eventType` 字段。卡片中定义的 `eventType: 'cardiac_arrest_worsen'`、`severity: 'critical'` 从未被读取。
**影响：** 所有"定时患者恶化"事件只作为文字描述出现，**不对游戏状态产生任何影响**（stability 不变、不触发 Toast、不改变难度）。
**修复：** 需要定义 `eventType → state mutation` 映射表，在 tick.ts 中执行对应状态变更。

---

## 🟠 P1 — 设计缺陷

### 5. stress 缺乏自然增长机制

**位置：** `src/game/core/reducers/askQuestion.ts:263-264`
**缺陷：** stress 只在"提问"时降低（通过 `stressEffect`），仅在提问超过 4 次后才有轻微惩罚（+3/问）。没有任何独立于提问的 stress 增长——不派车不涨、患者恶化不涨、长时间沉默不涨。
**影响：** NPC 只会越来越冷静。现实中的"等待焦虑""恶化的恐慌"完全缺失。推荐策略变成了"持续提问直到派车"。
**改进方向：** 在 `tick.ts` 中引入基于时间的 stress 增长（`stress += 0.2 * deltaTime`），结合 `callPhase` 和患者状态做情境化调整。

### 6. 安抚机制过强，策略深度不足

**位置：** `src/game/core/constants.ts:25-29`（`CALM_STRESS_DROP_BASE = 20`、`CALM_TIME_COST_BASE = 2`）
**缺陷：** 安抚一次降 20 stress，成本仅 2 秒。初始 stress 85 的失控 NPC，安抚 2 次（4 秒）就降至 45（紧张）。比问 MPDS 问题（5 秒）效率更高，收益更好。
**影响：** "安抚打法"成为无脑最优解，玩家没有理由在高压场景下少安抚多问询。
**改进方向：** 降低基础安抚效果（10→15），引入递减收益（同一 NPC 连续安抚效果减半），或根据场景/severity 调整安抚效果。

### 7. NPC 特性未被游戏逻辑使用

**位置：** `src/game/npc/personas.ts`（`speechStyle` 字段）、`src/game/types/caller.ts:31`（`cooperation` 字段）
**缺陷：** `speechStyle`（"语速极快、带着哭腔"等）是纯描述文本，从未被代码读取；`cooperation`（配合度）在类型中定义但所有 reducer 中从未使用。
**影响：** 28 个 NPC 在游戏机制上是同质的——只是初始 stress 不同。孩子、老人、青年的行为模式没有区别。
**改进方向：** `cooperation` 影响提问时的回答质量（低配合度时更倾向给出 `panickedAnswer`）；`speechStyle` 可影响 TTS 语速参数。

### 8. 新手引导完全缺失

**位置：** 全项目
**缺陷：** 无 tutorial、无新手引导、无首次游玩说明。玩家第一次打开游戏直接面对第一个来电。
**影响：** 玩家不知道 5 步标准协议、不知道需要填 Terminal、不知道可以安抚来电者。
**改进方向：** 至少在第一通电话中加入引导气泡（"试试点击 5 步协议中的「地址」问题"），或添加一个简短的 tutorial 场景。

### 9. 情绪爆发台词过于通用

**位置：** `src/game/core/reducers/askQuestion.ts:268-276`
**缺陷：** 所有场景、所有 NPC 共用两句情绪爆发台词。心脏骤停场景的家属和糖尿病患者的反应完全一样。
**改进方向：** 允许卡片覆盖默认情绪台词，或根据场景 `severity` 动态选择台词模板。

### 10. TTS 失败降级无声无息

**位置：** `src/audio/ttsPlayer.ts:125-134`
**缺陷：** 浏览器 autoplay 限制或网络错误导致 TTS 播放失败时，静默 `resolve()`。
**影响：** 玩家可能完全听不到语音但界面有文字，以为系统卡顿。首次交互前 TTS 被浏览器拦截是最常见场景。
**改进方向：** 检测到首次 TTS 失败时，在界面显示"点击屏幕启用语音"提示。

### 11. `interruptCallerVoice` 打断过于激进

**位置：** `src/screens/game/GameScreen.tsx:140-175` 多处
**缺陷：** 任何玩家操作（提问、填写终端、派车）都会打断正在播放的来电者语音。
**影响：** NPC 正在说重要信息时被中断，玩家错过关键线索。
**改进方向：** 区分"用户主动点击打断"（应打断）和"系统自动切换"（不应打断，让当前语音播完）。

### 12. 无通话中重试/撤销机制

**位置：** 全项目
**缺陷：** `EndingScreen` 有 `handleRestart` 全局重试，但通话中无法"重来本通电话"或"撤销上一步操作"。
**影响：** 玩家误操作后（填错判断、选错问题）只能将错就错，学习体验不佳。
**改进方向：** 至少提供"重置本通电话"功能；条件允许可加入"撤销上一步"。

---

## 🔵 P2 — 平衡性与一致性问题

### 13. 评分权重失衡：指导分 vs 判断扣分

**位置：** `src/game/core/constants.ts:92-100`
| 权重 | 分值 |
|------|------|
| 指导正确加分 | +3/步 |
| 判断错误扣分 | -8/次 |
| 信息质量加分 | ≤+5 |
| 发车速度 | ≤35 |
**问题：** 一次判断失误（-8）相当于 2.7 个指导步正确。判断错误几乎无法用指导正确弥补。这鼓励玩家"做不对就别做判断"而非"尽力而为"。
**建议：** 降低判断惩罚至 -5；提高每步指导正确价值至 +5。

### 14. `handleSetPatientStatus` 函数名与实际行为不符

**位置：** `src/game/core/reducers/miscHandlers.ts:37-42`
**问题：** 名为 `handleSetPatientStatus`，实际修改的是 `terminal.conscious`/`terminal.breathing`，而非 `patientStatus`。极易误导维护者。
**建议：** 重命名为 `handleUpdateTerminalVitals` 或类似语义。

### 15. `cardiacArrestCard` 缺少 MPDS 追问

**位置：** `src/game/events/cards/cardiacArrestCard.ts:58`
**问题：** `mpdsQuestions： []` 为空数组。心脏骤停场景在 5 步协议后没有任何 MPDS 追问。实际调度中应有"倒地多久""有无目击者""已做 CPR 吗"等关键追问。
**建议：** 补充至少 3-4 个心脏骤停场景特有的 MPDS 问题。

### 16. 问询耗时导致的"时间膨胀"

**位置：** `src/game/core/reducers/askQuestion.ts:293`
**问题：** 每次提问累加 `timeCost`（1-5 秒）到 `shiftElapsed`。玩家问得越多，`shiftElapsed` 增长越快，最终得分越差。这是设计意图，但惩罚力度偏高——细致问询的玩家几乎必然速度分不及格。
**建议：** 考虑将问询时间成本从速度分中分离（单独计入"效率"维度），或降低 `timeCost` 的累加速度。

### 17. `dispatchTiming` 与 `constants` 语义冲突

**位置：** `src/game/core/constants.ts:57`（`DISPATCH_CRITICAL_TIME = 60`）、`dispatchTiming.ts:6`（`> 60 → overtime`）
**问题：** `DISPATCH_BRONZE_TIME = 60`（青铜档上限），`DISPATCH_CRITICAL_TIME = 60`（临界时间）。刚好 60 秒发车时评分给 20 分（青铜），但计时系统标记为"严重超时"红色警告，体验矛盾。
**建议：** 将 `DISPATCH_CRITICAL_TIME` 改为 45 秒（= 白银档上限），`DISPATCH_BRONZE_TIME` 保持 60 秒。让警告与评分档位对齐。

### 18. Tone 分布不均

**位置：** `src/game/npc/personas.ts`
**问题：** 28 个 NPC 中：0 个"镇定"（恶作剧小朋友是"戏谑"而非镇定）、11 个"紧张"、10 个"恐慌"、5 个"失控"。缺少轻松/镇定类场景。
**建议：** 新增 2-3 个镇定型 NPC（如退休医护、退伍军人），放在 green 类场景中，丰富压力梯度。

---

## ⚪ P3 — 低优先级 / 雕琢项

### 19. `INFO_QUALITY_MAX_BONUS = 5` 常量未使用

**位置：** `src/game/core/constants.ts:92` 定义，`endCall.ts:64` 硬编码 `Math.min（5， clearCount）`
**建议：** 引用常量替换硬编码。

### 20. 知识系统详情未在游戏过程中展示

**位置：** `src/game/knowledge/guidanceDetails.ts:11-13`
**建议：** 在 `GuidancePanel` 的折叠区展示 `explanation` 和 `optionAnalysis`，让玩家在指导步骤中看到临床解释。

### 21. 部分 Green 场景临床紧迫性高

**位置：** `sickPersonCard`、`abdominalPainCard`、`backPainCard`、`severeHeadacheCard`
**建议：** 增加这些场景的变体——部分为 green（常见病），部分为 yellow（怀疑危险病因），但现有分诊级别不变，仅通过 `specialEvents` 在问询后动态升级。

### 22. 地址不完整不影响发车时间，只影响 ETA

**位置：** `src/game/core/reducers/dispatch.ts:27-30`
**建议：** 文档说明此设计意图（速度分只考核派车速度而不考核地址完整度），或在结算反馈中提示玩家"地址模糊不影响派车速度"。

### 23. `prerequisites` 字段已定义但未实现

**位置：** `src/game/types/scenario.ts:43`
**建议：** 要么实现前置条件校验逻辑，要么移除该字段避免误导。

---

## 优先修复建议

根据修复成本与玩家体验收益，推荐分三阶段实施：

### 第一梯队（Bug 修复，预计 1.5 小时）

| 项目 | 工作量 | 复杂度 |
|------|--------|--------|
| ① `vitalSign` 同步修复（2 个 reducer） | ~20 行 | 低 |
| ② `after_question` 事件实现 | ~30 行 | 中 |
| ③ `ambulanceRemaining` 统一数据源 | ~15 行 | 低 |
| ④ `dispatchTiming` 临界值对齐 | ~5 行 | 极低 |

### 第二梯队（设计优化，预计 3-4 小时）

| 项目 | 工作量 | 复杂度 |
|------|--------|--------|
| ⑤ stress 自然增长 + `tick.ts` 集成 | ~40 行 | 中 |
| ⑥ 安抚机制递减收益 | ~20 行 | 低 |
| ⑦ `handleSetPatientStatus` 重命名 | ~10 行 | 极低 |
| ⑧ NPC `cooperation` 接入回答选择逻辑 | ~50 行 | 中 |

### 第三梯队（体验改善，长期）

- 新手引导系统
- NPC 差异化（`speechStyle` → TTS 语速、`cooperation` → 回答质量）
- TTS 失败提示 UI
- 通话中重试功能
- 情绪台词场景化
- 评分权重调优
- `cardiacArrestCard` 补充 MPDS 问题

---

## 未变动项（当前设计合理）

- **prank_call 判定**：恶作剧场景的判断选择逻辑完整，不需修改
- **outcomeNarrative**：所有卡片的三种结局文字完整，无缺失
- **知识系统配对**：32 个非恶作剧场景全部有对应的 `DISPATCHER_NOTES` 和 `GUIDANCE_DETAILS`
- **音频资源管理**：`revokeObjectURL` 和 `close()` 清理正确，无泄漏
- **问询 5 步标准协议**：`step1-4` 的强制流程正确，新玩家虽可能困惑但逻辑完整
