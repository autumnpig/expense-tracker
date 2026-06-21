# 记账本 — 可复用开发规则

> 从实际踩坑中提炼。按严重程度分级：🔴致命 🟠严重 🟡重要 🟢良好实践

---

## 🔴 R1: Zustand Selector 不能返回新引用

**后果**：无限重渲染 → 白屏无报错（致命）

**规则**：`useStore(selector)` 返回值被 `Object.is` 比较。filter/sort/map 每次返回新引用 → 永远触发重渲染。

```typescript
// ❌ 错误
const cats = useStore(s => s.getExpense()); // .filter().sort()

// ✅ 正确
const all = useStore(s => s.categories);
const cats = useMemo(() => all.filter(...), [all]);
```

**检查**：`grep "useStore.*=>.*\.(filter|sort|map)" src/` 必须零匹配

---

## 🟠 R2: 账单文件编码必须先检测后解析

**后果**：中文 CSV 乱码，表头匹配失败 → 0 条记录

**规则**：`TextDecoder('utf-8', {fatal:true})` 先试，失败回退 `TextDecoder('gbk')`。`{fatal:true}` 是关键——不加此选项，UTF-8 对 GBK 字节静默产生乱码。

---

## 🟠 R3: 文件扩展名决定 XLSX 读取模式

**规则**：`.csv` → `XLSX.read(text, {type:'string'})`；`.xls/.xlsx` → `XLSX.read(data, {type:'array'})`

---

## 🟠 R4: 金额方向判定三逻辑不互相覆盖

**三种方向来源**：专用列（收入金额/支出金额）> 文字列（收/支）> 金额符号

**规则**：
1. 先查 `收入金额` / `支出金额` 专用列 → 设置 `typeFromAmount`
2. 再查 `收/支` / `收支` 文字列 → 设置 `typeFromColumn = true`
3. 文字列明确给出方向后，**忽略金额符号兜底**（防止覆盖）
4. 金额符号只在 `!typeFromAmount && !typeFromColumn` 时生效
5. `收/支="/"` → 微信中性交易 → `return null`

---

## 🟡 R5: 分类匹配优先级链不能乱

1. 平台路由（抖音支付→购物/退款、微信提现→转账转入）
2. **分类记忆**（localStorage 记住的手动分类）
3. 银行摘要映射
4. **关键词匹配**（~80 个中文词）← 必须在支付宝/微信映射前面
5. 支付宝/微信分类映射（兜底）
6. 默认"其他"/"其他收入"

---

## 🟡 R6: 不计收支 ≠ 交易关闭

两个独立检查，都要过滤。

---

## 🟡 R7: 批内去重不适用于银行账单

**教训**：银行账单每一行都是独立交易，不存在重复行。批内去重 ±1 元对饮水/公交等小额支付误杀严重（实测 87 条中误删 31 条）。**已移除**。

---

## 🟡 R8: descKeys 必须覆盖所有账单格式

每新增一种账单，检查其描述字段是否在 `['description','desc','note','备注','描述','交易说明','商品','商品说明','商户名称','交易对方','交易地点/附言','摘要']` 中。

---

## 🟡 R9: 跨账单去重用源头分离而非 DB 比对

支付宝 `收付款方式` 含"建设银行/储蓄卡" → 跳过（由银行账单覆盖）。比跨导入 DB 去重更简单可靠，不依赖导入顺序。

---

## 🟢 R10: 内部转账不应计入收入/支出

微信零钱提现/支付宝提现 → 自动创建 `type:'transfer'`。预览表蓝色边框。

---

## 🟢 R11: JSX map 中返回多元素用 Fragment

`.map()` 回调中需要返回两行（主行+展开行）→ 用 `<>>...</>` 包裹。

---

## 🟢 R12: Dexie schema 升级需新建 version

新增索引字段 → 新建 `this.version(N).stores({...})`，只写变更的表。

---

## 🟢 R13: 报表结余 = 收入 - 支出

不是 `calcRemainingBudget(budget, expense)`（那是预算剩余）。

---

## 🟢 R14: 每次改动后自检

```bash
npx tsc --noEmit          # 类型检查
npx vite build            # 构建
grep "useStore.*=>.*\.(filter|sort|map)" src/  # Zustand 检查
```
