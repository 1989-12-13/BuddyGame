# AI 不眠城：黄金十二分钟

一款 120 急救调度模拟游戏。你扮演 120 急救中心的夜班接线员，接听一通通急救电话，在压力下完成 MPDS（医疗优先调度系统）标准协议：问询、分诊、派车、急救指导。每通电话的派车速度、信息完整度、分诊准确度都会被评分，最终决定你的班次结局。

## 技术栈

- React 19 + TypeScript 5.8
- Vite 6（开发与构建）
- Vitest 3（单元测试）
- 纯 CSS（无 UI 框架，深色调度中心主题）

## 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run preview  # 预览构建产物
npm test         # 运行测试
npm run typecheck # 类型检查
npm run lint     # ESLint
```

## 玩法循环

- 每个班次 5 通电话，从场景池随机抽取
- 每通电话需依次完成 5 步标准协议（位置、事件、人数、年龄、意识与呼吸）
- 问询会消耗时间，来电者压力越高回答越失真
- 在合适时机打开 MPDS 调度卡，完成分诊判定后派车
- 部分场景派车后需进行电话急救指导（如 CPR）
- 5 通电话结束后，按累计得分（满分 500）给出结局

## 项目结构

核心主干（实际运行的代码）：

```
index.html              # HTML 入口
src/main.tsx            # React 挂载点
src/app/App.tsx         # 根组件（title/game/ending 屏幕路由）
src/screens/            # 三个屏幕：TitleScreen / GameScreen / EndingScreen
src/game/types.ts       # 全局类型与常量合约
src/game/core/
  actions.ts            # GameAction 联合类型（所有状态机动作）
  worldReducer.ts       # 核心状态机（857 行，处理全部游戏逻辑）
  worldState.ts         # 初始状态工厂 + 派车ETA + 评分函数
src/game/events/
  templates.ts          # 预编急救场景数据（6 个场景）
src/game/npc/
  personas.ts           # 来电者人物画像
src/game/endings/
  endings.ts            # 4 个班次结局
src/components/hud/Hud.tsx  # 顶部 HUD（班次/得分/救护车状态）
```

更深入的讲解见 `.context/` 目录下的文档。

## 背景

本项目基于"腾讯云 CodeBuddy Hackathon"挑战，从零搭建。初始设计为更复杂的 AI 叙事游戏，后聚焦为 120 急救调度模拟器，部分早期模块以 stub 形式保留。
