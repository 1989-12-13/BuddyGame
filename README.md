# AI不眠城：黄金十二分钟

> "在城市失控前，说服一群不一定听你命令的人。"

## 产品定义

一款用 GAL/视觉小说表现层包装的 AI 驱动的应急决策游戏。

- 台风"青鸟"即将登陆
- 玩家是临时城市应急指挥官
- 4 个核心 NPC，各有独立人格与底线
- Promise Ledger：承诺会被记住，违约会有反噬
- 8 轮，8-12 分钟一局

## 技术栈

- React 19 + TypeScript
- Vite 6
- Motion for React
- Vitest + Playwright
- ESLint

## 快速开始

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run test -- --run
npm run build
```

## 项目结构

```
src/
├── app/        # App shell & routing
├── game/       # Core game engine (reducer, state, events, NPC)
├── ai/         # AI adapter (mock / HTTP / fallback)
├── components/ # UI components
├── screens/    # Full-screen views
├── styles/     # Global styles & tokens
├── data/       # Static data (NPCs, incidents, demo sequences)
└── assets/     # Images, audio
```
