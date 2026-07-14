# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目一句话

`120 调度台`（零点接线台）— 120 急救调度模拟游戏。玩家扮演调度中心接线员，按 MPDS 标准流程对来电者问询、分诊、派车、必要时进行电话急救指导（CPR 等）。React 19 + TypeScript 5.8 + Vite 6 + Vitest 3，纯 CSS 无 UI 框架。

## 常用命令

包管理器：**npm**（锁文件为 `package-lock.json`）。

```bash
npm install           # 安装依赖
npm run dev           # 同时启动 TTS 后端 + Vite dev server (推荐)
npm run dev:server    # 只跑 TTS 后端 (端口 8787)
npm run dev:vite      # 只跑 Vite (TTS 不可用)
npm run build         # tsc -b && vite build
npm run preview       # 预览构建产物
npm run typecheck     # tsc -b --noEmit
npm run lint          # eslint .
npm test              # vitest（默认 watch 模式）
npx vitest run        # vitest 跑一次即退出
npx vitest run src/game/core/worldReducer.test.ts   # 单文件测试
```

路径别名：`@` → `src/`（在 `vite.config.ts` 和 `vitest.config.ts` 中配置）。

## TTS 语音合成（火山引擎 seed-tts-2.0）

来电话者 + 系统提示由 Node 后端代理调用火山引擎，按 stress 0-100 动态映射到 4 档情绪（镇定 / 紧张 / 恐慌 / 失控）。

**首次启用**：

- 复制 `.env.example` → `.env.local`
- 在 `.env.local` 填入 `VOLCANO_TTS_KEY=你的 API key`
- `pnpm dev` 一键同时启动后端 (8787) + Vite (5173)

**架构**：

```
src/audio/
├── AudioContext.tsx    # 同时暴露 play() 音效 + tts TTS 队列
├── useGameAudio.ts     # WebAudio oscillator 合成提示音 + 救护车鸣笛 (mp3)
├── ttsClient.ts        # fetch('/api/tts') 封装, 返回 Blob + objectURL
├── ttsEmotion.ts       # stress 0-100 → emotion 4 档映射
└── ttsPlayer.ts        # 顺序播放队列 (最大并发 1, 通话结束 stop())

server/
├── tts-server.mjs      # Node native http, 零依赖代理, 流式读取火山响应
└── tts-cache.mjs       # 简易 LRU (200 条), 按 cacheKey 命中

public/sounds/
└── siren.mp3           # 救护车鸣笛素材（4 秒, 派车时播放 + 渐入渐出包络）

scripts/dev.mjs         # 同时 spawn 后端 + vite, 跨平台, 零依赖
```

**情绪映射**（与后端 `EMOTION_CONTEXTS` 一一对应）：

- `0-25 镇定` — context: "保持冷静、声音平稳..."
- `25-50 紧张` — context: "声音紧张、语速偏快..."
- `50-75 恐慌` — context: "声音发颤、带着哭腔..."
- `75-100 失控` — context: "失控地大喊、带着哭腔..."

**新增/修改来电者音色**：默认所有来电者用同一 speaker (`zh_female_vv_uranus_bigtts`)，由后端 `.env` 的 `VOLCANO_TTS_DEFAULT_SPEAKER` 控制。如需按性别/年龄切换，可在前端 `ttsClient.ts` 的 `TtsRequest.speaker` 字段透传，扩展 `CallerProfile` 加 `gender`/`ageBucket` 字段。

**救护车鸣笛**（`useGameAudio.playSiren`）：
- 单次 4 秒，前 2.5s 渐入，后 1.5s 渐出至静音
- 音量系数 0.4（base × 0.4）避免刺耳
- 懒加载 mp3 + 缓存 AudioBuffer；自动 stop 上一次未结束避免重叠
- iOS autoplay 友好：play 前 `await context.resume()`

## 顶层架构

```
src/
├── main.tsx                # createRoot + StrictMode
├── app/App.tsx             # 屏幕路由（title / level_select / game / ending / knowledge）
├── audio/                  # 音效 + TTS（见上）
├── screens/                # 屏幕组件（GameScreen 等）
├── game/
│   ├── types/                # 共享类型（已拆分为 caller / mpds / scenario / world 子模块）
│   │   ├── index.ts          # 桶导出
│   │   ├── caller.ts         # CallerId、CallerProfile、CallerState、STRESS_INFO
│   │   ├── mpds.ts           # MpdsDeterminant、TriageLevel、PROTOCOL_REF（33 个 MPDS 协议）、TerminalState
│   │   ├── scenario.ts       # CallPhase、MPDSQuestion、JudgmentPrompt、GuidanceStep、MiniGameSpec、EmergencyScenario
│   │   └── world.ts          # WorldState、DispatchRecord、PatientStatus、RescueState、DialogueLine、EndingDef
│   ├── core/                 # 状态机核心
│   │   ├── worldReducer.ts   # 薄调度层（~100 行，所有 case 委托到 reducers/ 子模块）
│   │   ├── reducers/         # 子 reducer 处理器（每个 action type 一个文件 + 共用 helpers/narrative）
│   │   │   ├── answerCall.ts | askQuestion.ts | calmCaller.ts | makeJudgment.ts
│   │   │   ├── dispatch.ts | answerGuidance.ts | completeMinigame.ts | tick.ts
│   │   │   ├── endCall.ts | miscHandlers.ts
│   │   │   ├── helpers.ts    # 共有辅助：EventSink(createEventSink/sinkEvent)、对话/压力辅助、tone→stress
│   │   │   └── narrative.ts  # 来电者叙述式回答生成（按 stress→clear→vague 衰减）
│   │   ├── actions.ts        # GameAction 联合类型（约 20 种 action）
│   │   ├── worldState.ts     # 工厂函数（createInitialState / createCallerState）、ETA、评分 scoreCall
│   │   ├── constants.ts      # 游戏可调常量（压力阈值、情绪映射、分值权重、安抚参数）
│   │   ├── fleet.ts          # 救护车队状态机
│   │   ├── random.ts         # 随机数工具
│   │   ├── seededRandom.ts   # 确定性 PRNG（Mulberry32）
│   │   ├── debrief.ts        # 复盘/评分卡类型
│   │   └── perks.ts          # Roguelike 技能系统
│   ├── events/templates.ts   # 场景选择 + getScenario()
│   ├── events/cards/         # 33 个 MPDS 场景卡片（每个 .ts 一类主诉）
│   ├── npc/personas.ts       # 来电者人物档案
│   ├── endings/endings.ts    # 班次结局定义
│   └── knowledge/            # 教学参考数据（dispatcherNotes / examples / guidanceDetails）
├── components/
│   ├── hud/Hud.tsx        # 顶部状态栏
│   ├── call/CallDebrief.tsx  # 单通电话结束评分卡
│   └── minigames/
│       ├── MiniGameHost.tsx    # 按 spec.kind 分发到 7 个引擎
│       └── engines/
│           ├── hooks.ts          # usePauseRef / useAttemptScoring（选择题类共享）
│           ├── useGameClock.ts   # 计时引擎共享 rAF 倒计时（暂停累积，修复假暂停）
│           ├── useMiniGameFinish.ts # 完成守卫（防重复 onComplete + 延时回传）
│           ├── scoring.ts        # computePassed(score, threshold) 纯函数 + 单测
│           └── RhythmPress / QuickChoice / HoldPressure / PositionDrag / StepOrder / LocationSelect / CprGame
├── styles/                # tokens.css / global.css / animations.css（纯 CSS 变量）
└── test/setup.ts          # jsdom + jest-dom
```

## 状态机（游戏核心）

游戏状态是单个 `WorldState` 对象，通过 `worldReducer(state: WorldState, action: GameAction): WorldState` 推进。**所有业务逻辑都应落入 reducer**，UI 只负责分发 action 和渲染。

- `core/actions.ts` — 全部 `GameAction` 联合类型（约 20 种 action）。
- `core/worldState.ts` — 工厂函数（`createInitialState` / `createCallerState` / `createTerminalState`）、场景队列（`buildScenarioQueue`）、ETA 计算（`calcAmbulanceETA`）、患者生命体征（`createPatientStatus` / `stabilityToVitalSign`）、救治成功率（`calcRescueSuccessRate`）、**单通电话评分函数 `scoreCall`**。
- `core/constants.ts` — 游戏可调常量：压力阈值（`STRESS_CALM_MAX` / `STRESS_PANIC_MAX`）、安抚参数（`CALM_STRESS_DROP_BASE`）、判断/指导分值、小游戏稳定性系数。
- `core/worldReducer.ts` — 薄调度层（~100 行），仅做 `switch(action.type)` 分发，每个 case 委托到 `core/reducers/` 的独立处理器文件。处理 20 种 action：`START_SHIFT` / `ANSWER_CALL` / `ASK_QUESTION` / `CALM_CALLER` / `MAKE_JUDGMENT` / `UPDATE_TERMINAL` / `SET_PATIENT_STATUS` / `SET_MPDS_DETERMINANT` / `SET_DETERMINANT_SUBCODE` / `SET_PROTOCOL` / `SET_TRIAGE` / `SELECT_VEHICLE` / `DISPATCH` / `ANSWER_GUIDANCE` / `COMPLETE_MINIGAME` / `DISMISS_PATIENT_EVENT` / `END_CALL` / `DISMISS_DEBRIEF` / `CHOOSE_PERK` / `TICK` / `SHOW_ENDING` / `BACK_TO_TITLE`。
- `core/reducers/` — 每个 action type 一个处理器文件：
  - `answerCall.ts` — 接听电话、加载场景、初始化来电者/患者状态
  - `askQuestion.ts` — 问询逻辑、压力变更、揭示信息、生成判断选择题
  - `calmCaller.ts` — 安抚来电者（降低 stress，消耗时间）
  - `makeJudgment.ts` — 临床判断选择题处理
  - `dispatch.ts` — 派车逻辑、ETA 计算、救援闭环初始化
  - `answerGuidance.ts` — 急救指导问答步骤处理
  - `completeMinigame.ts` — 小游戏完成后的状态更新
  - `endCall.ts` — 通话结束结算、评分、通话历史归档、技能奖励
  - `tick.ts` — 时间流逝、患者稳定性衰减、救护车到达检查
  - `miscHandlers.ts` — 轻量 handler 收拢（终端更新、MPDS 判定、选择车辆、导航等）
  - `helpers.ts` — 共有辅助：`EventSink`（`createEventSink`/`sinkEvent`，事件 ID 由 `eventSeq` 单调派生）、对话/压力辅助、`toneToInitialStress`
  - `narrative.ts` — 来电者叙述式回答生成（按 stress 级别从 clear → vague 衰减）
- `core/perks.ts` — Roguelike 技能系统（技能定义与效果）
- `core/debrief.ts` — 复盘/评分卡类型
- `core/worldReducer.test.ts` — 已有覆盖（确定性 action 序列 → 状态断言）；新逻辑优先在 reducer 里加测试。

## WorldState 关键字段

- `currentCall: EmergencyScenario` — 当前通电话的完整定义（`fourElements.address/condition/contact/purpose`、`mpdsCard`、`guidance`）。
- `callerState: CallerState` — 来电者压力（0-100，>75 失控）、配合度、已揭示信息、信息质量。
- `terminal: TerminalState` — 调度卡字段（address / chiefComplaint / patientAge / protocolNumber / determinant / triage 等），玩家通过 `UPDATE_TERMINAL` 写入。
- `dialogueLog: DialogueLine[]` — 系统/接线员/来电者三方的对话流。
- `pendingJudgments: JudgmentPrompt[]` — 协议判断 + 临床判断选择题队列。
- `patientStatus: PatientStatus | null` — 患者生命体征（stability 0-100、vitalSign、decayRate），TICK 时每秒衰减。
- `rescue: RescueState` — 救护车救援闭环（idle → enroute → arrived → success/failed）。
- `dispatchRecord` / `callScores` — 派车与评分。
- `fleet: FleetState` — 救护车队状态（车辆可用性、selectedVehicleId）。
- `perks: RoguePerkId[]` — 已获得的 Roguelike 技能。

## MPDS 协议参考

`PROTOCOL_REF` 在 `src/game/types/mpds.ts` 中导出，是一个 `[number, name][]` 元组，覆盖 33 种主诉。`dispatcherNotes.ts` / `examples.ts` / `guidanceDetails.ts` 三个知识库文件按协议 key 提供教学描述、临床要点和电话指导脚本。**新增主诉**时需同步：场景卡片（`events/cards/`）+ 调度员笔记 + 范例 + 指导详情。

## 屏幕路由

`App.tsx` 用单一 `useState<'title'|'level_select'|'game'|'ending'|'knowledge'>` 切换屏幕，并通过 `gameKey` 强制 `GameScreen` 重新挂载以重置内部状态。`AudioProvider` 包裹主内容，确保屏幕切换不打断音频引擎。

## 屏幕布局（重构后）

```
┌──────────────────────────────────────────────────┐
│  Hud (Hud.tsx)                                    │  36-40px
│  通话计时 / 通话编号 / 体征 / 情绪 / 得分 / 车辆 / ETA
├─────┬──────────────────────────────┬─────────────┤
│ L   │                              │   Drawer    │
│ e   │                              │  (600px)    │
│ f   │     CityMap (Leaflet)        │  current /  │
│ t   │  - 救护车 en_route→on_scene  │   history   │
│ s   │  - 跨通话车辆 dim 处理       │  + history  │
│ i   │  - 点击救护车 → 历史对话     │    badge    │
│ d   │                              │             │
│ e   │                              │             │
│ r   │                              │             │
│420px│                              │             │
│ 调度│                              │             │
│ 终端│                              │             │
│ (左)│                              │             │
└─────┴──────────────────────────────┴─────────────┘
```

- **Top**: `Hud` — 唯一顶栏；通话计时 + 通话编号 + 通话中显示的体征/情绪 + 得分 + 车辆 + 派车 ETA
- **左侧**: `TerminalModal` (现 leftsider 420px) — 调度终端，新通话自动展开，dispatch 后自动折叠
- **中央**: `CityMap` Leaflet 地图，跨通话显示所有 mission 车辆
- **右侧**: `CallDrawer` (现 600px 宽) — 三种模式：
  - `current`（默认）：当前通话对话 + 行动按钮
  - `history:{callId}`：玩家点击地图救护车后，drawer 整体替换为该任务历史对话
  - 折叠态 72px 仍有 mini 信息（生命条 + 通话计时）

> v3 起删除 `CallInfoBar`：原"电话 / 地址 / 状态 / 分诊"已由右侧 CallDrawer 的 PhoneHeader/对话流承载；"体征 / 情绪"挪入 Hud；"派车 ETA"原也存在于 Hud，保持在 Hud。"班次"计时器因与"通话"语义近似且玩家易混淆，移除；班次进度改由通话编号 1/5 体现。

## 评分与结局

- 单通：`scoreCall()` 产出 `CallScore = { speed(0-35) + info(0-30) + triage(0-20) + decision(0-5) + guidance(0-10) }`，满 100。
- 班次：5 通电话累计；`SHOW_ENDING` 根据总分选择 `endings/endings.ts` 中的结局定义。

## 急救指导小游戏

`MiniGameHost.tsx` 按 `MiniGameSpec.kind`（联合 7 种）分发到独立引擎组件。引擎统一契约：

```ts
interface MiniGameProps {
  spec: MiniGameSpec
  onComplete: (score: number, passed: boolean) => void
  paused?: boolean            // 浮层折叠时冻结计时/输入
}
```

每个引擎自管理动画 / 评分逻辑，最终调用 `onComplete(score, passed)`。`passThreshold` 在 spec 中定义。共享逻辑抽出到 `engines/` 的 hook：

- `useGameClock(durationSec, pausedRef, { onTick, onFinish })` — 计时类引擎（RhythmPress）复用的 rAF 倒计时，含正确的暂停累积（修复旧版 `pausedAccumRef` 永不赋值导致的「假暂停」）。
- `useMiniGameFinish(onComplete, delayMs)` — 所有引擎统一的完成守卫：防重复回传 + 延时回传，各引擎保留原有延时值（700/600/500/1000/1500ms）。
- `scoring.ts#computePassed(score, threshold)` — 通过判定的纯函数，已配 `scoring.test.ts`。
- `hooks.ts#useAttemptScoring` — QuickChoice / LocationSelect 选择题类共享（含尝试次数计分）。

## 测试

- Vitest + jsdom 环境，setup 文件加载 `@testing-library/jest-dom`。
- 现有覆盖：`worldReducer.test.ts`（核心逻辑）、`App.test.tsx`、`GameScreen.test.ts`（与 `screens/GameScreen.test.ts` 共存，注意区别）。
- 跑单测：`npm test -- --run`；针对单个文件：`npm test -- src/game/core/worldReducer.test.ts --run`；按名字：`npm test -- -t "test name" --run`。

## 构建与样式

- Vite 6，alias `@` → `src/`。
- 无 UI 框架、无 CSS-in-JS。颜色 / 间距集中在 `src/styles/tokens.css`，动画在 `animations.css`。
- 内联 `React.CSSProperties` 用于组件局部样式（如 `MiniGameHost.tsx`、`Hud.tsx`），是项目惯例。
- 动效统一用 `motion/react`（AnimatePresence + motion.aside / motion.div），spring 曲线 + 0.18-0.22s 时长。

## 关键约定

- **新功能落点**：业务逻辑 → `core/reducers/` 对应处理器文件；数据 → `game/events/cards/` 或 `game/knowledge/`；UI → `screens/` 或 `components/`；可调参数 → `core/constants.ts`。
- **不使用 React Context 共享游戏状态**：所有游戏状态经由 `useReducer` 在 `GameScreen.tsx` 内部持有（screen-level），屏幕切换通过 `gameKey` 整体重置。
- **随机数**：当前生产代码使用 `Math.random()`；测试代码不依赖随机输出。`core/seededRandom.ts` 提供 Mulberry32 PRNG 以备需要确定性复现的场合。
- **类型先行**：所有 action / state 字段均在 `types/` 子模块中定义，通过 `types/index.ts` 桶导出；新增 action 先扩展 `actions.ts` 的联合类型，再在 `worldReducer.ts` 加 case，并在 `core/reducers/` 新建处理器文件。
- **文件大小**：`worldReducer.ts` 已从 ~40KB 瘦身至 ~100 行的薄调度层，所有业务逻辑落到 `core/reducers/` 的独立文件中。新增 action 时在 `core/reducers/` 新建文件，不修改 `worldReducer.ts`（仅加一行 case 分发），保持每个文件 ≤500 行。
- **reducer 处理器命名**：新建文件以 action type 的 camelCase 命名（如 `askQuestion.ts`、`answerGuidance.ts`），导出 `handleXxx` 函数。轻量 handler（≤15 行）收拢到 `miscHandlers.ts`。

## 探索代码的优先工具

- **CodeGraph**（`.codegraph/` 存在 + `.mcp.json` 配置了 MCP server）：用 `mcp__codegraph__codegraph_explore` 一调用获取相关符号的逐行源码 + 调用路径 + 影响面，优先于 `grep`/`Read`。
- `rtk` 已安装（Rust Token Killer），Bash 命令会被 hook 自动改写以节省 token。
