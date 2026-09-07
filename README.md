# 120 调度台

一款面向公众的公益急救调度叙事游戏。玩家在第一次独立值班中接听五通来电，完成地点确认、情况问询、路线规划、派车、电话指导与现场交接。

## 玩法

- 固定主线依次呈现老人跌倒、胸痛、外伤出血、脑卒中疑似和心脏骤停五个场景
- 完整字幕与语音独立运行，语音失败不会阻断操作
- 已知事实自动记录，玩家判断、响应优先级和路线选择保留操作过程
- 救护车到达后由玩家确认现场交接，再进入行动复盘与公益知识卡
- 暂停、设置、后台切换和弹窗共用同一套计时规则
- 刷新后从当前来电开头重试，并保留此前完成的通话

游戏内容用于公益科普，不能替代专业急救培训。现实紧急情况请拨打 120，并听从专业调度指导。

## 快速开始

```bash
npm ci
npm run dev        # 启动开发服务器
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm test -- --run  # 运行单元与一致性测试
npm run test:e2e   # 运行 Chromium 端到端测试
npm run typecheck  # 类型检查
npm run lint       # ESLint
```

## 技术栈

- React 19 + TypeScript 5.8
- Vite 6（开发与构建）
- Vitest 3 + Playwright（单元测试与浏览器流程测试）
- Leaflet（在线地图，失败时切换为本地示意图）
- 纯 CSS（无 UI 框架）

## 项目结构

```
src/
├── main.tsx                    # 入口
├── app/App.tsx                 # 根组件（屏幕路由）
├── screens/                    # 标题、工作台、知识库与结算屏幕
│   ├── TitleScreen.tsx
│   ├── game/WorkbenchScreen.tsx
│   ├── EndingScreen.tsx
│   └── LevelSelectScreen.tsx
├── game/
│   ├── types.ts                # 共享类型与常量
│   ├── core/                   # 游戏核心逻辑
│   │   ├── actions.ts          # 动作定义
│   │   ├── worldReducer.ts     # 状态机
│   │   └── worldState.ts       # 状态工厂
│   ├── core/campaign.ts        # 五通主线编排
│   ├── events/                 # 急救场景数据
│   ├── npc/personas.ts         # 来电者人物
│   └── endings/endings.ts      # 班次结局
├── components/
│   ├── map/                    # 在线地图与离线示意图
│   └── minigames/              # 急救指导小游戏
└── styles/
    ├── tokens.css              # 设计变量
    ├── global.css              # 全局样式
    └── animations.css          # 动画定义
```
