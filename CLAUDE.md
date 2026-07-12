# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目一句话

`120 调度台`（零点接线台）— 120 急救调度模拟游戏。玩家扮演调度中心接线员，按 MPDS 标准流程对来电者问询、分诊、派车、必要时进行电话急救指导（CPR 等）。React 19 + TypeScript 5.8 + Vite 6 + Vitest 3，纯 CSS 无 UI 框架。

## 常用命令

包管理器：**pnpm**（虽然存在 `package-lock.json`，主锁文件是 `pnpm-lock.yaml`；`pnpm-workspace.yaml` 也存在）。

```bash
pnpm install          # 安装依赖
pnpm dev              # 同时启动 TTS 后端 + Vite dev server (推荐)
pnpm dev:server       # 只跑 TTS 后端 (端口 8787)
pnpm dev:vite         # 只跑 Vite (TTS 不可用)
pnpm build            # tsc -b && vite build
pnpm preview          # 预览构建产物
pnpm typecheck        # tsc -b --noEmit
pnpm lint             # eslint .
pnpm test             # vitest（默认 watch 模式）
pnpm test -- --run    # vitest 跑一次即退出
pnpm test -- src/game/core/worldReducer.test.ts   # 单文件测试
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
├── useGameAudio.ts     # WebAudio oscillator 合成提示音 (无音频资源)
├── ttsClient.ts        # fetch('/api/tts') 封装, 返回 Blob + objectURL
├── ttsEmotion.ts       # stress 0-100 → emotion 4 档映射
└── ttsPlayer.ts        # 顺序播放队列 (最大并发 1, 通话结束 stop())

server/
├── tts-server.mjs      # Node native http, 零依赖代理, 流式读取火山响应
└── tts-cache.mjs       # 简易 LRU (200 条), 按 cacheKey 命中

scripts/dev.mjs         # 同时 spawn 后端 + vite, 跨平台, 零依赖
```

**情绪映射**（与后端 `EMOTION_CONTEXTS` 一一对应）：

- `0-25 镇定` — context: "保持冷静、声音平稳..."
- `25-50 紧张` — context: "声音紧张、语速偏快..."
- `50-75 恐慌` — context: "声音发颤、带着哭腔..."
- `75-100 失控` — context: "失控地大喊、带着哭腔..."

**新增/修改来电者音色**：默认所有来电者用同一 speaker (`zh_female_vv_uranus_bigtts`)，由后端 `.env` 的 `VOLCANO_TTS_DEFAULT_SPEAKER` 控制。如需按性别/年龄切换，可在前端 `ttsClient.ts` 的 `TtsRequest.speaker` 字段透传，扩展 `CallerProfile` 加 `gender`/`ageBucket` 字段。

## 顶层架构

```
src/
├── main.tsx               # createRoot + StrictMode
├── app/App.tsx            # 屏幕路由（title / level_select / game / ending / knowledge）
├── audio/
│   ├── AudioContext.tsx   # AudioProvider 包裹主内容
│   └── useGameAudio.ts    # WebAudio 频率提示音（无音频资源，合成 oscillator）
├── screens/               # 五个屏幕组件
├── game/
│   ├── types.ts           # 全部共享类型 + 常量 + PROTOCOL_REF（33 个 MPDS 协议）
│   ├── core/              # 状态机核心
│   ├── events/templates.ts# 场景选择 + getScenario()
│   ├── events/cards/      # 33 个 MPDS 场景卡片（每个 .ts 一类主诉）
│   ├── npc/personas.ts    # 来电者人物档案
│   ├── endings/endings.ts # 班次结局定义
│   └── knowledge/         # 教学参考数据（dispatcherNotes / examples / guidanceDetails）
├── components/
│   ├── hud/Hud.tsx        # 顶部状态栏
│   ├── call/CallDebrief.tsx  # 单通电话结束评分卡
│   └── minigames/
│       ├── MiniGameHost.tsx    # 按 spec.kind 分发到 7 个引擎
│       └── engines/            # RhythmPress / AimForce / HoldPressure / PositionDrag / StepOrder / LocationSelect / CprGame
├── styles/                # tokens.css / global.css / animations.css（纯 CSS 变量）
└── test/setup.ts          # jsdom + jest-dom
```

## 状态机（游戏核心）

游戏状态是单个 `WorldState` 对象，通过 `worldReducer(state: WorldState, action: GameAction): WorldState` 推进。**所有业务逻辑都应落入 reducer**，UI 只负责分发 action 和渲染。

- `actions.ts` — 全部 `GameAction` 联合类型（约 17 种）。
- `worldState.ts` — 工厂函数（`createInitialState` / `createCallerState` / `createTerminalState`）、场景队列（`buildScenarioQueue`）、ETA 计算、**单通电话评分函数 `scoreCall`**。
- `worldReducer.ts` — 唯一的状态转换器：处理 `START_SHIFT` / `ANSWER_CALL` / `ASK_QUESTION` / `CALM_CALLER` / `MAKE_JUDGMENT` / `UPDATE_TERMINAL` / `SET_PATIENT_STATUS` / `SET_MPDS_DETERMINANT` / `SET_TRIAGE` / `DISPATCH` / `ANSWER_GUIDANCE` / `COMPLETE_MINIGAME` / `END_CALL` / `TICK` / `SHOW_ENDING` / `BACK_TO_TITLE`。文件较大（~40KB），包含来电者回答的叙述式生成（按 stress 级别从 clear → vague 衰减）。
- `worldReducer.test.ts` — 已有的覆盖（确定性 action 序列 → 状态断言）；新逻辑优先在 reducer 里加测试。

## WorldState 关键字段

- `currentCall: EmergencyScenario` — 当前通电话的完整定义（`fourElements.address/condition/contact/purpose`、`mpdsCard`、`guidance`）。
- `callerState: CallerState` — 来电者压力（0-100，>75 失控）、配合度、已揭示信息、信息质量。
- `terminal: TerminalState` — 调度卡字段（address / chiefComplaint / patientAge / protocolNumber / determinant / triage 等），玩家通过 `UPDATE_TERMINAL` 写入。
- `dialogueLog: DialogueLine[]` — 系统/接线员/来电者三方的对话流。
- `pendingJudgments: JudgmentPrompt[]` — 协议判断 + 临床判断选择题队列。
- `dispatchRecord` / `callScores` — 派车与评分。

## MPDS 协议参考

`PROTOCOL_REF` 在 `src/game/types.ts` 顶部，是一个 `[number, name][]` 元组，覆盖 33 种主诉。`dispatcherNotes.ts` / `examples.ts` / `guidanceDetails.ts` 三个知识库文件按协议 key 提供教学描述、临床要点和电话指导脚本。**新增主诉**时需同步：场景卡片（`events/cards/`）+ 调度员笔记 + 范例 + 指导详情。

## 屏幕路由

`App.tsx` 用单一 `useState<'title'|'level_select'|'game'|'ending'|'knowledge'>` 切换屏幕，并通过 `gameKey` 强制 `GameScreen` 重新挂载以重置内部状态。`AudioProvider` 包裹主内容，确保屏幕切换不打断音频引擎。

## 评分与结局

- 单通：`scoreCall()` 产出 `CallScore = { speed(0-35) + info(0-30) + triage(0-20) + decision(0-5) + guidance(0-10) }`，满 100。
- 班次：5 通电话累计；`SHOW_ENDING` 根据总分选择 `endings/endings.ts` 中的结局定义。

## 急救指导小游戏

`MiniGameHost.tsx` 按 `MiniGameSpec.kind`（联合 7 种）分发到独立引擎组件。引擎统一契约：

```ts
interface MiniGameProps {
  spec: MiniGameSpec
  onComplete: (score: number, passed: boolean) => void
}
```

每个引擎自管理计时 / 动画 / 评分逻辑，最终调用 `onComplete(score, passed)`。`passThreshold` 在 spec 中定义。

## 测试

- Vitest + jsdom 环境，setup 文件加载 `@testing-library/jest-dom`。
- 现有覆盖：`worldReducer.test.ts`（核心逻辑）、`App.test.tsx`、`GameScreen.test.ts`（与 `screens/GameScreen.test.ts` 共存，注意区别）。
- 跑单测：`pnpm test -- src/game/core/worldReducer.test.ts --run` 或 `pnpm test -- -t "test name"`。

## 构建与样式

- Vite 6，alias `@` → `src/`。
- 无 UI 框架、无 CSS-in-JS。颜色 / 间距集中在 `src/styles/tokens.css`，动画在 `animations.css`。
- 内联 `React.CSSProperties` 用于组件局部样式（如 `MiniGameHost.tsx`），是项目惯例。

## 关键约定

- **新功能落点**：业务逻辑 → reducer / `worldState.ts`；数据 → `game/events/cards/` 或 `game/knowledge/`；UI → `screens/` 或 `components/`。
- **不使用 React Context 共享游戏状态**：所有游戏状态经由 `useReducer` 在 `GameScreen.tsx` 内部持有（screen-level），屏幕切换通过 `gameKey` 整体重置。
- **随机数**：当前生产代码使用 `Math.random()`；测试代码不依赖随机输出。`core/seededRandom.ts` 提供 Mulberry32 PRNG 以备需要确定性复现的场合。
- **类型先行**：所有 action / state 字段均在 `types.ts` 集中定义；新增 action 先扩展联合类型再实现 case。
- **文件大小**：参考根目录用户 CLAUDE.md 的 `Keep files ≤ 500 lines` 约束；`worldReducer.ts` 已偏大，新增 case 优先评估是否能拆分子 reducer。

## 探索代码的优先工具

- **CodeGraph**（`.codegraph/` 存在 + `.mcp.json` 配置了 MCP server）：用 `mcp__codegraph__codegraph_explore` 一调用获取相关符号的逐行源码 + 调用路径 + 影响面，优先于 `grep`/`Read`。
- `rtk` 已安装（Rust Token Killer），Bash 命令会被 hook 自动改写以节省 token。