# 记账本 (Expense Tracker PWA)

> 个人全栈项目 | 2026 年 6 月 | 独立开发

## 项目概述

一个**纯前端 PWA 个人记账应用**，支持多账户（微信/银行卡/支付宝）收支管理、三平台账单导入（支付宝/微信/银行）、智能分类匹配、分类记忆、自动转账检测、分类预算管控、可视化报表。零后端依赖，所有数据存储在浏览器 IndexedDB，通过 Service Worker 实现离线可用。部署于 GitHub Pages。

- **线上地址**：https://autumnpig.github.io/expense-tracker/
- **代码仓库**：https://github.com/autumnpig/expense-tracker
- **源码规模**：51 个文件，~5200 行 TypeScript/TSX

## 技术栈

| 层 | 选型 | 选型理由 |
|---|---|---|
| 框架 | React 19 + TypeScript 6.0 | 最新的 React 并发特性 + TS 6 `erasableSyntaxOnly` 严格模式 |
| 构建 | Vite 8 + Rolldown | 原生的 ESM 开发体验，HMR 毫秒级响应 |
| 样式 | Tailwind CSS v4 + shadcn/ui | v4 纯 CSS 配置，零 JS 运行时；shadcn 设计令牌体系 |
| 状态管理 | Zustand v5 | 极简 API，基于 selector 的精确订阅，无 Provider 包裹 |
| 本地存储 | Dexie.js v4 + localStorage | IndexedDB 存交易/账户/预算，localStorage 存分类记忆 |
| 路由 | React Router v7 | 懒加载页面拆分，代码分割 |
| 图表 | Recharts v3 | 声明式饼图（含百分比标签）/柱状图 |
| Excel 解析 | SheetJS (xlsx) | 支持 .xlsx/.xls/.csv，GBK/UTF-8 自动检测 |
| 离线/PWA | vite-plugin-pwa (Workbox) | 自动生成 Service Worker，预缓存所有静态资源 |
| 部署 | GitHub Pages + gh-pages | 免费静态托管 |

## 核心功能

### 1. 多账户记账
支持支出、收入、转账三种交易类型。账户（微信/银行卡/支付宝）各自维护余额，自动根据交易流水计算。转账操作通过 `fromAccountId` + `toAccountId` 实现，总资产不变。

### 2. 三平台账单导入

一键上传支付宝/微信/银行导出的 Excel/CSV 文件，自动解析、分类、去重。

**支持的格式**：
| 平台 | 格式 | 编码 | 关键字段 |
|---|---|---|---|
| 支付宝 | CSV | GBK | `商品说明` / `交易对方` / `收付款方式` |
| 微信 | XLSX | UTF-8 | `商品` / `交易类型` / `收/支` |
| 银行卡(建行) | XLS | — | `交易地点/附言` / `交易金额` / `摘要` |

**解析策略**：先试 UTF-8，失败回退 GBK；CSV 文本解析，XLS/XLSX 二进制解析；启发式表头定位（扫描前 50 行匹配列名关键词）。

**智能分类**（6 级优先级链）
1. 平台路由 — `抖音支付`→购物/退款、`微信零钱提现`→转账转入
2. 分类记忆 — localStorage 记住用户手动改过的分类，下次自动匹配（绿色边框）
3. 银行摘要映射 — `消费退货`→退款、`支付机构提现`→转账转入
4. 关键词匹配 — ~80 个中文关键词覆盖 7 大消费类别
5. 支付宝/微信分类映射 — 兜底
6. 默认 — `其他` / `其他收入`

**去重策略（简化后）**：
- 支付宝账单：`收付款方式` 含"建设银行/储蓄卡"的记录直接跳过 → 由银行账单入库
- 微信账单：`收/支="/"` 的中性交易（提现/充值/零钱通）跳过
- 不再做跨导入 DB 去重，数据源头分离

**预览功能**：拖拽上传、三色行边框（蓝=自动转账 / 绿=记忆命中 / 橙=不确定分类）、描述点击展开、旧导入检测提示清除

### 3. 自动转账检测
- **关键词触发**：`微信零钱提现`→transfer(微信→银行卡)、`支付宝提现`→transfer(支付宝→银行卡)、`财付通-微信零钱充值`→transfer(银行卡→微信)
- **同批次检测**：`detectTransfers` 贪心匹配，同日期 + 同金额（±0.5 元）+ 不同账户一进一出

### 4. 分类预算管控
每月设置总预算 + 各分类预算。仪表盘实时进度条（绿→黄→红渐变），超支分类红色警示。

### 5. 可视化报表
- **月度总览**：收/支/结余统计卡片 + 分类占比饼图（带百分比标签）+ 分类预算进度条
- **每日报告**：昨日收支明细 + 本月预算进度

### 6. 数据管理
- 导出 Excel / JSON 备份 / JSON 恢复
- 按 `importedFrom` 批量删除（重导文件时清除旧数据）
- 所有数据纯本地，不经过任何服务器

## 技术挑战与解决方案

### 挑战 1：Zustand Selector 导致无限重渲染 → 白屏
（略，见旧版）

### 挑战 2：Tailwind CSS v4 颜色令牌迁移
（略，见旧版）

### 挑战 3：TypeScript 6.0 严格模式适配
（略，见旧版）

### 挑战 4：Lucide 图标 kebab→PascalCase 转换
（略，见旧版）

### 挑战 5：转账自动检测算法
（略，见旧版）

### 挑战 6：PWA 离线 + GitHub Pages 部署
（略，见旧版）

### 挑战 7：多格式账单解析（编码 + 二进制 + 列名）

**编码检测**：支付宝 CSV 是 GBK 编码。`TextDecoder('utf-8', {fatal:true})` 先试，抛异常则回退 `TextDecoder('gbk')`（Code Page 936）。注意 `{fatal:true}` 是关键——不加此选项，UTF-8 对 GBK 字节序列静默产生乱码而非抛异常。

**二进制 vs 文本**：GBK 检测只能处理文本。`.xls` 是 BIFF 二进制格式，用字符串模式`XLSX.read(text, {type:'string'})` 会乱码。修复：按扩展名分支 — `.csv` → `type:'string'`；`.xls/.xlsx` → `type:'array'`。

**列名匹配**：三种账单字段名完全不同。parseRow 需要 `normalized`（trim + lowercase）和原始 `row` 两轮查找，且 descKeys 必须覆盖所有格式（支付宝 `商品说明`、微信 `商品`、建行 `交易地点/附言`、银行 `摘要`）。

### 挑战 8：智能分类匹配引擎

6 级优先级链（见核心功能 §2）。最关键的设计决策：

**关键词 > 平台自带分类**：支付宝把"南信大食堂"标为"教育培训"，关键词 `食堂` 命中 餐饮 → 正确覆盖。关键词匹配排在 Alipay/微信映射前面。

**平台路由区分收支**：`抖音支付` + 支出 = 购物，`抖音支付` + 收入 = 退款。

**微信交易类型映射**：`微信红包` / `零钱提现` / `转账` / `零钱通` 各有对应分类。

### 挑战 9：金额方向判定（三套逻辑冲突）

三种账单用三种不同方式表达收支方向：

| 账单 | 方向表达 | 列名 |
|---|---|---|
| 支付宝 | 收/支 文字列 | `收/支` = "支出"/"收入" |
| 微信 | 收/支 文字列 | `收/支` = "支出"/"收入"/"/" |
| 银行 | 金额正负号 | `交易金额` = -50.00(支出) / 50.00(收入) |

三套逻辑在 parseRow 里会互相打架。具体 bug：

**Bug A — 金额符号覆盖文字判断**：微信 `收/支="支出"` 正确设为 expense，但金额是正数（`amountSign>0`），后面的兜底逻辑 `if (amountSign>0) type='income'` 又把结果覆盖了。

**解法**：引入 `typeFromColumn` 标志。文字列明确给出方向时，跳过金额符号兜底。

**Bug B — 银行没有收/支列**：建行只有 `交易金额`，全靠金额正负号判断方向。早期代码对所有金额 `Math.abs()` 丢了符号 → 全部变成默认 expense。

**解法**：保留 `amountSign`，在无专用列且无文字列时才用符号兜底。

**Bug C — 微信中性交易**：微信 `收/支="/"` 表示零钱提现/充值/零钱通，不产生收支。早期被默认为 expense 导入。

**解法**：检测 `rawV === '/'` → `return null` 跳过。

### 挑战 10：跨账单去重的简化

**初始方案**：跨导入 DB 去重，金额 ±1 元 + 双向证据（支付宝 `收付款方式` ↔ 银行 `交易地点`）。复杂且用户不可见。

**最终方案**：源头分离。
- 支付宝账单：`收付款方式` 含"建设银行/储蓄卡" → 跳过（由银行账单覆盖）
- 用户全部支付宝交易都用银行卡付款 → 支付宝导入 0 条，全部走银行
- 不需要跨导入去重逻辑

**清理旧数据**：导入页检测文件是否曾导入过（`importedFrom` 索引），弹出提示"清除旧记录后重新导入"。

### 挑战 11：分类记忆系统

用户手动纠正的分类 → 自动存 localStorage → 下次同描述自动匹配。

**存储**：`{ [description]: categoryId }` 映射表，上限 500 条防爆。精确匹配 + 前缀匹配（前 20 字符）。

**UI 反馈**：记忆命中的记录在预览表显示绿色左边框（区别于蓝=转账、橙=不确定）。

## 踩坑记录

### Zustand & React
1. **Zustand selector 不能返回 filter/map/sort 结果** — 新引用 → 无限重渲染 → 白屏

### Tailwind & TypeScript
2. **Tailwind v4 `bg-background` 需要 `@theme` 映射**
3. **TS 6.0 `erasableSyntaxOnly` + `verbatimModuleSyntax`** — 必须显式 `import type`
4. **lucide-react PascalCase vs kebab-case** — 需要转换层

### 部署
5. **GitHub Pages 需同步 base / basename / PWA start_url 三个前缀**
6. **Vercel 在中国大陆被墙**

### 账单解析
7. **SheetJS key 不区分中英文大小写** — lowercase + trim 两轮
8. **GBK 编码检测** — `TextDecoder('utf-8', {fatal:true})` 先试
9. **XLS 是二进制** — 按扩展名选 `type:'string'` 或 `type:'array'`
10. **金额符号被 Math.abs 丢弃** — 保留 amountSign 兜底
11. **不同账单字段互补** — descKeys 必须覆盖全部格式
12. **关键词 > 平台分类** — 食堂被标"教育"的 bug
13. **不计收支 ≠ 交易关闭** — 两个独立过滤
14. **微信收/支="/"** — 中性交易跳过，不是默认支出
15. **金额符号兜底覆盖文字判断** — `typeFromColumn` 标志阻止覆盖

### 去重策略
16. **批内去重 ±1 元太宽** — 小额支付造成大量误杀，已移除
17. **跨账单源头分离** — 支付宝银行卡付款直接跳过，不做 DB 去重

### 转账检测
18. **提现不是收入** — `微信零钱提现` → transfer，不占收支统计
19. **同批次 vs 跨文件** — 跨文件转账通过关键词在 `handleFile` 阶段标记

### 报表
20. **结余 = 收入-支出，不是预算-支出** — `reportGenerator.ts` 用错函数

### DB Schema
21. **`importedFrom` 需要索引** — Dexie v2 schema upgrade 添加，否则 `where().equals()` 报错

## 项目架构

```
src/
├── components/
│   ├── shared/          # 通用组件
│   │   ├── PieChart.tsx          Recharts 饼图（百分比标签）
│   │   ├── AmountInput.tsx       金额输入
│   │   ├── BottomNav.tsx         底部导航
│   │   └── ...
│   └── business/        # 业务组件
│       ├── ImportPreviewTable.tsx 预览表（三色边框：蓝/绿/橙）
│       ├── DailyReportCard.tsx   每日报告
│       └── ...
├── pages/               # 8 个页面（React.lazy）
│   ├── ImportBill.tsx   账单导入（拖拽/过滤/分类/记忆/转账）
│   ├── Reports.tsx      报表（收支结余 + 饼图 + 预算）
│   └── ...
├── stores/              # 5 个 Zustand store
│   └── transactionStore.ts  removeByImportedFrom / countByImportedFrom
├── services/            # 7 个服务模块
│   ├── importParser.ts       解析 + 类型检测 + 中性交易过滤
│   ├── categoryMatcher.ts    6 级优先级链 + 平台路由
│   ├── categoryMemory.ts    localStorage 分类记忆
│   ├── transferDetector.ts  转账自动检测
│   ├── reportGenerator.ts   日报/月报
│   ├── budgetCalculator.ts  预算计算
│   └── exportService.ts     Excel/JSON 导出导入
├── db/
│   └── database.ts      Dexie v2 schema（含 importedFrom 索引）
├── types/index.ts       8 个 interface
└── index.css            Tailwind v4 @theme
```

## 设计决策

### 为什么纯前端？
用户记账数据属于高度隐私信息。纯前端 + IndexedDB 意味着数据永不离开设备，架构层面杜绝隐私泄露。

### 为什么 Zustand？
API 极简（一个 `create` 搞定），selector 精确订阅避免不必要渲染，无需 Provider 包裹。

### 为什么 Dexie.js？
原生 IndexedDB API 过于底层。Dexie 提供 Promise 风格链式 API，支持复合索引和批量操作。

### 为什么可选字段而非 Union Type？
Transaction 有三种形态（支出/收入/转账），理论上该用 discriminated union。但 Dexie 和 Zustand 对联合类型支持不友好，可选字段大幅简化存储层。

### 为什么源头分离而非跨导入去重？
支付宝记录如果走银行卡付款，银行账单里会有同一笔交易。在支付宝侧直接过滤比导入后再去重更简单可靠，且不依赖导入顺序。

## 本地开发

```bash
git clone https://github.com/autumnpig/expense-tracker.git
cd expense-tracker
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build
npm run serve      # 预览构建产物
```

## 部署

```bash
npm run build
npx gh-pages -d dist
# → https://autumnpig.github.io/expense-tracker/
```
