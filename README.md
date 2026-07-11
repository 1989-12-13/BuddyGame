# 120 调度台

一款 120 急救调度模拟游戏。扮演调度中心的接线员，接听急救来电，按 MPDS 标准流程完成问询、分诊、派车与电话急救指导。

## 玩法

- 每个班次接听 5 通急救电话
- 按 5 步标准协议依次问询（位置 → 事件 → 人数 → 年龄 → 意识与呼吸）
- 问询消耗时间，压力越高的来电者回答越不可靠
- 打开 MPDS 调度卡登记信息、完成分诊判定后派车
- 部分场景派车后需进行电话急救指导（CPR 等）
- 按派车速度、信息完整度、分诊准确度评分，班次结束根据累计得分给出结局

## 快速开始

```bash
npm install
npm run dev        # 启动开发服务器
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm test           # 运行测试
npm run typecheck  # 类型检查
npm run lint       # ESLint
```

## 技术栈

- React 19 + TypeScript 5.8
- Vite 6（开发与构建）
- Vitest 3（单元测试）
- 纯 CSS（无 UI 框架）

## 项目结构

```
src/
├── main.tsx                    # 入口
├── app/App.tsx                 # 根组件（屏幕路由）
├── screens/                    # 三个屏幕
│   ├── TitleScreen.tsx
│   ├── GameScreen.tsx
│   ├── EndingScreen.tsx
│   └── LevelSelectScreen.tsx
├── game/
│   ├── types.ts                # 共享类型与常量
│   ├── core/                   # 游戏核心逻辑
│   │   ├── actions.ts          # 动作定义
│   │   ├── worldReducer.ts     # 状态机
│   │   └── worldState.ts       # 状态工厂
│   ├── events/templates.ts     # 急救场景数据
│   ├── npc/personas.ts         # 来电者人物
│   └── endings/endings.ts      # 班次结局
├── components/
│   ├── hud/Hud.tsx             # 顶部状态栏
│   └── minigames/              # 急救指导小游戏
└── styles/
    ├── tokens.css              # 设计变量
    ├── global.css              # 全局样式
    └── animations.css          # 动画定义
```
