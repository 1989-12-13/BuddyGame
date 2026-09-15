# 热线 120

一款面向公众的公益急救调度叙事游戏。玩家以 120 接线员身份值班，接听一通通来电——确认地点、问询病情、判断分诊优先级、规划路线、派车、在救护车抵达前进行电话急救指导，直至现场交接。

## 玩法

- **并发值班**：三条线路、两辆车同时运转。一次只处理一条线，其余线路会响铃、会超时、会转留言回拨
- **动态班次**：班次没有固定通数，何时收班由表现驱动的热度模型决定——撑过峰值段圆满交班，连续漏接或患者死亡会被换下来
- **33 类主诉场景**：覆盖心搏骤停、创伤、卒中、产科、烧伤、溺水、窒息、过敏、糖尿病急症、中暑、一氧化碳中毒、精神危机等 33 类急救场景，另有恶作剧 / 核实来电等特殊通话
- **场景练习**：可单独重玩任意一个场景
- **五维评价**：每通电话从接线态度、指导技术、知识储备、时间把控、救援成效五个维度评分（D–S 级）
- **Rogue Perk**：班次内可获工作辅助（快速建卡、冷静话术、优先通道、现场急救、地址记忆、协议提示），带入下一通电话
- **完整字幕与可选语音**：游戏以字幕为核心，语音为可选增强。未配置 TTS 时自动降级为纯字幕模式，不影响操作
- **急救指导小游戏**：派车后按场景推送对应的电话指导操作（CPR 节律、止血、侧卧位、海姆立克等）
- **地图与登记表**：桌面端为左右抽屉模式（梯形把手展开），窄屏为标签页切换

游戏内容用于公益科普，不能替代专业急救培训。现实紧急情况请拨打 120，并听从专业调度指导。

## TTS 语音（可选）

游戏内置火山引擎（ByteDance）TTS 语音管线，为来电者台词按情绪（镇定 / 紧张 / 恐慌 / 失控）合成配音。**未配置时游戏以纯字幕模式运行，所有操作不受影响。**

如需启用：

1. 在项目根目录创建 `.env.local`，填入火山引擎 TTS API Key：
   ```
   VOLCANO_TTS_KEY=your_api_key_here
   ```
2. 可选配置：
   ```
   VOLCANO_TTS_RESOURCE=seed-tts-2.0        # 音色资源 ID
   VOLCANO_TTS_DEFAULT_SPEAKER=zh_female_vv_uranus_bigtts  # 默认说话人
   ```
3. 使用 `npm run dev`（而非 `npm run dev:vite`）启动——前者会同时拉起 TTS 代理服务器（`server/tts-server.mjs`，默认端口 8787）

工作原理：前端 `src/audio/ttsClient.ts` → Vite proxy `/api/tts` → `server/tts-server.mjs` → 火山引擎 API。合成结果带 LRU 缓存（200 条），相同台词不会重复请求。

## 快速开始

```bash
npm ci
npm run dev          # 启动开发服务器（含 TTS）
npm run dev:vite     # 仅启动 Vite（不含 TTS）
npm run build        # 生产构建
npm run preview      # 预览构建产物
npm test -- --run    # 运行单元与一致性测试
npm run test:e2e     # 运行 Chromium 端到端测试
npm run typecheck    # 类型检查
npm run lint         # ESLint
```

## 技术栈

- React 19 + TypeScript 5.8
- Vite 6（开发与构建）
- Vitest 3 + Playwright（单元测试与浏览器流程测试）
- Leaflet / React-Leaflet（在线地图，失败时切换为本地示意图）
- Motion（动画）
- 纯 CSS（无 UI 框架）

## 项目结构

```
src/
├── main.tsx                      # 入口
├── app/App.tsx                   # 根组件（屏幕路由）
├── screens/
│   ├── DispatchTitle.tsx          # 标题画面
│   ├── game/
│   │   ├── ShiftScreen.tsx        # 班次层（并发多线协调）
│   │   ├── WorkbenchScreen.tsx    # 工作台（通话 / 抽屉 / 登记）
│   │   ├── LineRack.tsx           # 线路列表
│   │   ├── Transcript.tsx         # 通话实录
│   │   ├── QuestionDock.tsx       # 问询选项
│   │   ├── JudgmentFloat.tsx      # 判断弹卡
│   │   ├── DispatchAction.tsx     # 派车操作
│   │   ├── VerifyPanel.tsx        # 核实面板
│   │   ├── WaitingCarePanel.tsx   # 等待期照护
│   │   ├── HandoffPanel.tsx       # 现场交接
│   │   ├── PatientVitals.tsx      # 患者体征
│   │   ├── TaskCard.tsx           # 登记表
│   │   └── OnboardingCoach.tsx    # 新手引导
│   ├── LevelSelectScreen.tsx      # 场景练习选关
│   ├── KnowledgeScreen.tsx        # 急救知识库
│   └── EndingScreen.tsx          # 班次结算
├── game/
│   ├── types.ts / types/           # 共享类型与常量
│   ├── core/
│   │   ├── actions.ts             # 动作定义
│   │   ├── worldReducer.ts        # 单通状态机
│   │   ├── shift.ts               # 班次协调器
│   │   ├── evaluation.ts          # 五维评价
│   │   ├── perks.ts               # Rogue Perk
│   │   ├── routing.ts             # 路线规划
│   │   ├── dispatchPlanning.ts    # 派车条件
│   │   ├── pacing.ts              # 热度与节奏
│   │   ├── fleet.ts               # 车辆管理
│   │   ├── rescueResolution.ts    # 救援结算
│   │   └── reducers/              # reducer 子模块
│   ├── events/
│   │   ├── cards/                 # 33 类场景卡片
│   │   └── templates.ts           # 场景注册表
│   ├── knowledge/                 # 急救知识库
│   │   ├── notes/                 # 分诊笔记
│   │   └── guidance/              # 指导细节
│   └── npc/personas.ts            # 来电者人物
├── components/
│   ├── map/                       # 在线地图与离线示意图
│   ├── minigames/                 # 急救指导小游戏（CPR、止血等）
│   ├── call/                      # 通话复盘卡
│   ├── guidance/                  # 指导面板
│   ├── feedback/                  # 救援进度 toast
│   └── ui/                        # 通用组件
└── styles/
    ├── tokens.css                 # 设计变量
    ├── global.css                 # 全局样式
    └── animations.css             # 动画定义
```
