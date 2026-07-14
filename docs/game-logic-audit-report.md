# BuddyGame 游戏逻辑审查报告

> 审查日期：2026-07-14
> 审查范围：`src/` 下全部游戏逻辑代码（reducer、引擎、事件、NPC、UI 交互）
> 审查方式：子智能体并行扫描 + 人工综合

---

## 摘要

本次审查发现 **3 个实际逻辑 Bug、6 个设计缺陷、4 个数据一致性问题、多个低优先级建议**。大部分问题集中在状态管理的一致性、迷你游戏的边界条件、以及事件系统的未完成实现上。

---

## 🔴 P0 — 实际逻辑 Bug

### Bug 1. HoldPressure 超时机制完全失效

**文件**：`src/components/minigames/engines/HoldPressure.tsx:34,54`

```typescript
// 第34行 — 意图是限制总游戏时间
const maxTime = s.holdSec * 3 + 6

// 第54行 — 但用在了 safeRef 上，等效于 safeRef >= holdSec*3+6，
// 而 safeRef >= s.holdSec 会先触发，导致 maxTime 从未生效
if ((safeRef.current >= s.holdSec || safeRef.current >= maxTime) && !finished.current)
```

**效果**：玩家可以无限时间停留在游戏中，只要始终不让 `safeRef >= holdSec` 即可（即永远不把血量降到 30 以下）。没有总超时限制。如果 `regainPerSec` 配置过小，玩家可能陷入死局——血量降不下去，但也永远无法结束游戏。

**修复方案**：将 `maxTime` 改为对总经过时间（elapsed time）的判断，而非对 `safeRef` 的判断。需要额外 tracking 一个 elapsed time ref。

---

### Bug 2. `specialEvents` 永不触发

**文件**：`src/game/events/triggerEngine.ts`（全文仅 24 行）

**问题**：`triggerEngine.ts` 只导出了 `canAnswerNextCall` 和 `canDispatch` 两个函数，**完全没有实现事件轮询/触发逻辑**。而 33 张卡片中大量定义了 `specialEvents` 字段：

```typescript
// 几乎每张卡片都有，例如 cardiacArrestCard.ts:48-50
specialEvents: [
  { trigger: 'time_elapsed', triggerValue: 120, eventType: 'cardiac_arrest_worsen', severity: 'critical' },
]
```

这些配置**在运行时永远不会被检查或触发**。`tick.ts:149-168` 中有检查 `time_elapsed` 事件的逻辑片段：

```typescript
// tick.ts:149-168
if (state.currentCall && state.callerState) {
  const elapsed = state.shiftElapsed - state.callStartTime
  // ... 但没有解析 specialEvents 的代码
}
```

实际去检查 `specialEvents` 的代码**不存在**。这意味着所有依赖时间触发的患者恶化事件、特殊叙事事件目前都是死代码。

**修复方案**：
1. 在 `tick.ts` 的 TICK reducer 中，每次 tick 时遍历 `state.currentCall.scenario.specialEvents`
2. 对 `trigger: 'time_elapsed'` 检查 `elapsed >= triggerValue` 且尚未触发
3. 对 `trigger: 'after_question'` 在 `askQuestion.ts` 完成时检查
4. 触发后 dispatch 对应事件（恶化状态、追加 dialogue 行等）

---

### Bug 3. CprGame 吹气过量标记永不重置

**文件**：`src/components/minigames/engines/CprGame.tsx:134-135,216`

```typescript
// 第134-135行 — 过量标记
if (f >= CPR_BLOW_OVER_THRESHOLD) {
  overBreathRef.current = true  // 设置后永不重置
}

// 第216行 — 最终罚分
const breathPenalty = overBreathRef.current ? 0.15 : 0
```

**效果**：`overBreathRef` 在第一次吹气时如果过量被设为 `true`，**整个游戏过程中永不重置**。即使玩家之后几次吹气都正常，最终得分仍然会被扣 0.15。由于游戏有多个吹气阶段（分属不同循环），这个惩罚只应在当前吹气阶段检查，而非全局累积。

**修复方案**：在每次进入新的吹气阶段（`setPhase('blowing_1')`）时重置 `overBreathRef.current = false`。

---

## 🟡 P1 — 游戏设计缺陷

### 缺陷 1. callPhase 两个状态完全不被使用

**文件**：`src/game/types/scenario.ts:11,13`

```typescript
export type CallPhase =
  | 'ringing'
  | 'connected'     // ← 从未被任何 reducer 设为这个值
  | 'questioning'
  | 'dispatching'   // ← 从未被任何 reducer 设为这个值
  | 'guidance'
  | 'closing'
  | 'completed'
```

`'connected'` 和 `'dispatching'` 定义在类型中，但整个代码库中没有任何 reducer 将 `callPhase` 设置为这两个值。

- **`connected` 未被使用**：ANSWER_CALL 直接从 `'ringing'` → `'questioning'`。游戏逻辑上缺失了"来电者自述开场白"的独立阶段。`GameScreen.tsx:373` 的条件 `(state.callPhase === 'questioning' || state.callPhase === 'connected')` 试图兼容 `connected` 但实际上永远不会走通。
- **`dispatching` 未被使用**：DISPATCH 直接将 `'questioning'` → `'guidance'` 或 `'closing'`。没有任何时刻处于"派车中"的中间状态。

**影响**：UI 可能缺少正确的阶段提示和过渡动画。问询阶段（questioning）承载了过多职责，使得将来拆分为独立阶段时需要重构多处。

---

### 缺陷 2. NPC 人设缺少 stress 数值系统接入

**文件**：`src/game/npc/personas.ts:8-247`

`CallerProfile` 类型只有 `tone`（静态分类：镇定/紧张/恐慌/失控），**没有 `stress` 相关字段**：

```typescript
export interface CallerProfile {
  id: string
  name: string
  relationship: string
  tone: '镇定' | '紧张' | '恐慌' | '失控'  // 静态分类，非数值
  speechStyle: string
}
```

但游戏内部有完整的 stress 数值系统（`callerState.stress`，范围 0-100），且卡片中 `mpdsQuestions` 定义了 `stressEffect`。这意味着：
- NPC 初始 stress 由 `toneToInitialStress()` 根据 `tone` 映射
- 但 NPC 人设中不存在 `stressThresholds`、`calmResistance` 等个性化参数
- 所有 NPC 在相同 stress 变化下反应完全一致，没有个性差异
- NPC 的 `calm` 行为由全局常量 `CALM_STRESS_DROP_BASE = 20` 控制，不因人而异

**影响**：所有来电者本质上只有 tone 不同，stress 动态变化行为完全一致，缺乏人物差异化。

---

### 缺陷 3. derived 字段需要手动同步，有不同步风险

**文件**：`src/game/core/worldState.ts:41,162`

两个核心 derived 字段需要手动维护一致性：

| 字段 | 派生源 | 手动维护处 |
|------|--------|-----------|
| `callerState.stressLevel` | `stressToLevel(stress)` | 3 处 |
| `patientStatus.vitalSign` | `stabilityToVitalSign(stability)` | 4 处 |

**风险**：如果有人新增了一个修改 `stress` 或 `stability` 的 reducer 但忘记同步对应的 `stressLevel`/`vitalSign`，UI 会显示过时的信息。例如 `makeJudgment.ts` 修改了 `vitalSigns.stability` 但没有同步 `patientStatus.vitalSign`，目前它修改的是 `patientStatus.stability` 而非 `vitalSigns.stability`，但字段命名相似容易混淆。

**建议**：改为 getter 函数而非缓存在 state 中，或者在 reducer 中统一通过辅助函数维护。

---

### 缺陷 4. `questionCost` 和 `shiftNumber` 死字段

**文件**：`src/game/core/worldState.ts:111`、`src/game/core/reducers/miscHandlers.ts:16`

- **`questionCost`**：在 `calmCaller.ts` 和 `askQuestion.ts` 中累加，但**从未在评分逻辑中使用**。`scoreCall()` 使用 `dispatchTime`（从接听到派车的总耗时）而非 questionCost。如果设计意图是"问太多问题扣分"，这个功能未实现。
- **`shiftNumber`**：在班次开始时递增，但**全代码库无任何读取**。既不用于结算，也不用于展示。

---

### 缺陷 5. `age` 字段格式不统一

**文件**：33 张卡片各自定义 `condition.age`

当前发现 4 种不同格式混用：

| 格式类型 | 示例 | 卡片 |
|---------|------|------|
| 精确 | `"3岁"`、`"72岁"` | chokingCard, strokeCard |
| 模糊 | `"45岁左右"`、`"25岁左右"` | cardiacArrestCard, assaultCard |
| 极模糊 | `"大概三十岁左右"` | drowningCard |
| 非人类 | `"小猫"` | prankCallCard |

**影响**：`narrative.ts` 中 `generateAgeNarrative()` 需解析 `age` 字符串插入"岁"字。当前逻辑 `const hasYear = age.includes('岁')` 能处理大部分情况，但"大概三十岁左右"已经带了"岁"，可能产生"大概三十岁左右岁"的重复输出。需验证并修复。

---

### 缺陷 6. `prank_call` 在所有知识库中缺失

**文件**：`src/game/knowledge/dispatcherNotes.ts`、`guidanceDetails.ts`、事件示例

`prank_call` 卡片在三个知识库中均无对应条目（32/33 卡有映射，恶作剧卡无映射）。虽然恶作剧电话不需要医学知识是合理的设计选择，但如果 UI 代码无条件访问 `DISPATCHER_NOTES[scenarioId]` 会得到 `undefined`，可能导致渲染空白或 crash。

需要在调用方添加保护判断，防止 `undefined` 传播。

---

## 🔵 P2 — 数据一致性问题

### 问题 1. `random.ts` 全局副作用有测试隔离风险

**文件**：`src/game/core/random.ts:11-13`

```typescript
let _rng = Math.random
export function __setRng(fn: () => number) { _rng = fn }
export function __resetRng() { _rng = Math.random }
```

`__setRng` 是全局状态修改。如果测试 A 注入 `__setRng(fnA)` 但忘记在 teardown 中 `__resetRng()`，会污染测试 B。测试文件中当前没有在 `beforeEach`/`afterEach` 中保护。

建议在所有使用 `__setRng` 的测试套件中添加 `afterEach(() => __resetRng())`。

---

### 问题 2. `getScenario()` 直接 throw 无兜底

**文件**：`src/game/events/templates.ts:97-101`

```typescript
export function getScenario(id: string): EmergencyScenario {
  const s = SCENARIOS[id]
  if (!s) throw new Error(`Unknown scenario: ${id}`)
  return s
}
```

如果意外传入了未注册的 ID（如手误或未来重构引入了新的 ID 未注册），整个游戏会崩溃。建议改为返回默认场景或让调用方处理 null。

---

### 问题 3. 对话文本分散在卡片中未集中管理

33 张卡片的 `openingLine`、`answer`、`answerVague`、`ramblingAnswer`、`panickedAnswer` 等对话文本直接硬编码在每张卡片文件内。虽然灵活性高，但导致：
- 相同 NPC 跨卡片出现时（当前不存在，但未来可能），对话文本需要复制维护
- 无法统一做语气/风格一致性检查和批量修改
- KnowledgeScreen 的 `SCENARIO_EXAMPLES` 中的现场案例与卡片中的对话可能脱节

建议在对话量增长到一定程度后，考虑将 NPC 对话抽取到独立的文本资源文件。

---

### 问题 4. `EndingScreen` 评分匹配使用硬编码子串

**文件**：`src/game/core/debrief.ts`（之前轮次已部分修复）

判断理由的推理逻辑最初使用硬编码子串匹配 `'准确性'` / `'速度'` / `'完整性'` 来归类得分理由。之前的轮次已改为通用兜底，但需确认所有边缘情况均已覆盖。

---

## ⚪ P3 — 低优先级建议

| # | 建议 | 文件 | 理由 |
|---|------|------|------|
| 1 | `rngInt(0)` 防御 | `random.ts:26` | 传 0 返回 NaN，可加 `if (max <= 0) return 0` |
| 2 | `overBreathRef` 重置已在 P0 修复 | CprGame.tsx | — |
| 3 | GameScreen handleCalm 音频中断时机 | `GameScreen.tsx:134` | `interruptCallerVoice()` 在安抚时触发，会打断来电者当前语音，可能让玩家错过重要信息 |
| 4 | `calcBpm(0)` 被防御性保护 | CprGame.tsx:104 | 已正确守卫，但值得在 calcBpm 内部也加零值保护 |
| 5 | `createCallerState()` 的 `stress=40` 默认值永不落地 | `worldState.ts:36` | 永远被调用方覆盖，可移除默认值 |
| 6 | `ringing` 状态几乎不可见 | answerCall.ts:41 | 从初始到接听之间仅有极短窗口，如果要做振铃动画可保留，否则可移除 |
| 7 | StressLevel 和 VitalSign getter 化 | worldState.ts | 改为即时计算函数而非状态字段，根除同步风险 |
| 8 | `age` 字段改为结构化对象 | 所有卡片 | `{ value: number, unit: '岁'|'月', precision: 'exact'|'approx' }` |

---

## 总结

### 必须修复（P0）
| Bug | 影响面 | 修复工时 |
|-----|--------|---------|
| HoldPressure 无超时 | 玩家可无限拖延游戏 | ~15 min |
| specialEvents 永不触发 | 所有动态事件/恶化机制失效 | ~2 hr |
| CprGame 吹气全局罚分 | 得分不合理偏低 | ~10 min |

### 强烈建议修复（P1）
| 缺陷 | 影响面 | 修复工时 |
|------|--------|---------|
| callPhase 两个死状态 | UI 阶段展示不完整 | ~30 min（含重构 UI） |
| NPC 人设缺 stress 参数 | 来电者缺乏个性化差异 | ~1 hr |
| derived 同步风险 | 状态显示可能过期 | ~45 min |
| questionCost/shiftNumber 死字段 | 代码噪音 | ~15 min |
| age 格式不统一 | 叙事文本可能产生重复 | ~20 min |
| prank_call 防护 | 防止知识库空白 | ~15 min |

### 当前安全基线
- ✅ TypeScript 类型检查 `tsc --noEmit`：零错误
- ✅ 测试 `vitest run`：903 全绿
- ✅ 生产构建 `vite build`：通过
- ✅ 代码静态分析（前 5 轮）：颜色、死代码、重复代码、命名已清理
- ✅ 键盘去重：`useKeyboard` hook 统一管理

---

*本报告基于 4 个子智能体对 100+ 文件的并行扫描和人工综合编写。*
