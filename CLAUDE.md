# 记账本 — 开发指南

## 启动命令
```bash
cd D:\desk\expense-tracker
npm run dev      # 开发服务器
npm run build    # 生产构建
npx tsc --noEmit # 类型检查
```

## 自检流程（每次任务完成后必须执行）
1. `npx tsc --noEmit` — 零错误
2. `npx vite build` — 构建通过
3. 搜索 `useStore.*=>.*\.(filter|sort|map)` — 无 Zustand selector 返回新引用
4. 新功能在实际浏览器中点击验证
5. 有 bug 先修，再继续

## 🔴 最高优先级规则

### Zustand selector 不能返回新对象/数组
- 错误: `useStore(s => s.getExpense())` — getExpense() 内部 filter+sort，每次新引用 → 无限重渲染 → 白屏
- 正确: `const all = useStore(s => s.categories); const cats = useMemo(() => all.filter(...), [all])`
- 这条规则违反的后果是致命的（白屏无报错），必须检查每一个 useStore 调用

### 项目记忆
- `memory/expense-tracker-project.md` — 完整架构、模块清单
- `memory/expense-tracker-rules.md` — 11 条开发规则 + 踩坑记录
