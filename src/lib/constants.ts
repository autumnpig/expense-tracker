import type { Account, Category } from '@/types';

// ========== Default Accounts ==========
export const DEFAULT_ACCOUNTS: Omit<Account, 'id' | 'createdAt'>[] = [
  { name: '微信', icon: 'message-circle', color: '#07c160', sortOrder: 0 },
  { name: '银行卡', icon: 'credit-card', color: '#3b82f6', sortOrder: 1 },
  { name: '支付宝', icon: 'wallet', color: '#1677ff', sortOrder: 2 },
];

// ========== Default Expense Categories ==========
export const DEFAULT_EXPENSE_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: '餐饮', icon: 'utensils-crossed', type: 'expense', isDefault: true, sortOrder: 0 },
  { name: '交通', icon: 'bus', type: 'expense', isDefault: true, sortOrder: 1 },
  { name: '购物', icon: 'shopping-bag', type: 'expense', isDefault: true, sortOrder: 2 },
  { name: '娱乐', icon: 'gamepad-2', type: 'expense', isDefault: true, sortOrder: 3 },
  { name: '学习', icon: 'book-open', type: 'expense', isDefault: true, sortOrder: 4 },
  { name: '医疗', icon: 'stethoscope', type: 'expense', isDefault: true, sortOrder: 5 },
  { name: '礼物', icon: 'gift', type: 'expense', isDefault: true, sortOrder: 6 },
  { name: '其他', icon: 'ellipsis', type: 'expense', isDefault: true, sortOrder: 7 },
];

// ========== Default Income Categories ==========
export const DEFAULT_INCOME_CATEGORIES: Omit<Category, 'id' | 'createdAt'>[] = [
  { name: '工资', icon: 'briefcase', type: 'income', isDefault: true, sortOrder: 0 },
  { name: '奖金', icon: 'star', type: 'income', isDefault: true, sortOrder: 1 },
  { name: '红包', icon: 'red-envelope', type: 'income', isDefault: true, sortOrder: 2 }, // lucide doesn't have this, fallback
  { name: '退款', icon: 'rotate-ccw', type: 'income', isDefault: true, sortOrder: 3 },
  { name: '转账转入', icon: 'arrow-down-circle', type: 'income', isDefault: true, sortOrder: 4 },
  { name: '其他收入', icon: 'ellipsis', type: 'income', isDefault: true, sortOrder: 5 },
];

// ========== Budget Default ==========
export const DEFAULT_MONTHLY_BUDGET = 5000;

// ========== Category Colors for Charts ==========
export const CHART_COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
];

// ========== Nav Items ==========
export const NAV_ITEMS = [
  { label: '首页', icon: 'home', path: '/' },
  { label: '记账', icon: 'plus-circle', path: '/add' },
  { label: '报表', icon: 'bar-chart-3', path: '/reports' },
  { label: '我的', icon: 'settings', path: '/settings' },
] as const;
