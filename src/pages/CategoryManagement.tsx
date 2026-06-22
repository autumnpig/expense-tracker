import { useState, useMemo, useEffect } from 'react';
import { useCategoryStore } from '@/stores/categoryStore';
import { getLucideIcon } from '@/lib/utils';
import PageHeader from '@/components/shared/PageHeader';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { X, Pencil, Trash2, Plus } from 'lucide-react';

const ICON_OPTIONS = [
  'utensils-crossed', 'bus', 'shopping-bag', 'gamepad-2', 'book-open',
  'stethoscope', 'gift', 'ellipsis',
  'home', 'zap', 'wifi', 'smartphone', 'coffee', 'music', 'film',
  'heart', 'pill', 'shopping-cart', 'car', 'plane', 'train',
  'dumbbell', 'graduation-cap', 'baby', 'paw-print', 'scissors',
  'briefcase', 'star', 'rotate-ccw', 'arrow-down-circle',
  'trending-up', 'dollar-sign', 'coins', 'wallet', 'piggy-bank',
  'trophy', 'award', 'handshake', 'building', 'laptop',
  'cloud', 'sun', 'moon', 'umbrella', 'camera', 'clock',
  'map-pin', 'phone', 'mail', 'message-circle', 'banknote',
];

interface EditDialogProps {
  open: boolean;
  title: string;
  initialName: string;
  initialIcon: string;
  onSave: (name: string, icon: string) => void;
  onCancel: () => void;
}

function EditDialog({ open, title, initialName, initialIcon, onSave, onCancel }: EditDialogProps) {
  const [name, setName] = useState(initialName);
  const [icon, setIcon] = useState(initialIcon);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setIcon(initialIcon);
    }
  }, [open, initialName, initialIcon]);

  if (!open) return null;

  const canSave = name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-background rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[85dvh] overflow-y-auto p-5 animate-in slide-in-from-bottom">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X size={18} />
        </button>
        <h3 className="text-lg font-semibold mb-5">{title}</h3>

        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
            分类名称
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="输入分类名称"
            autoFocus
            className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="mb-5">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            选择图标
          </label>
          <div className="grid grid-cols-7 gap-2">
            {ICON_OPTIONS.map((iconName) => {
              const IconComp = getLucideIcon(iconName);
              const isSelected = icon === iconName;
              return (
                <button
                  key={iconName}
                  onClick={() => setIcon(iconName)}
                  className={`flex items-center justify-center p-2.5 rounded-lg transition-all ${
                    isSelected
                      ? 'bg-primary/10 ring-2 ring-primary text-primary'
                      : 'bg-muted/50 hover:bg-muted text-muted-foreground'
                  }`}
                  title={iconName}
                >
                  <IconComp size={20} />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-input text-sm font-medium hover:bg-muted transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => canSave && onSave(name.trim(), icon)}
            disabled={!canSave}
            className="flex-1 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50 transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategoryManagement() {
  const categories = useCategoryStore((s) => s.categories);
  const loadCategories = useCategoryStore((s) => s.load);
  const addCategory = useCategoryStore((s) => s.add);
  const updateCategory = useCategoryStore((s) => s.update);
  const removeCategory = useCategoryStore((s) => s.remove);

  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [editDialog, setEditDialog] = useState<{
    mode: 'add' | 'edit';
    categoryId?: string;
    initialName: string;
    initialIcon: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const expenseCategories = useMemo(
    () =>
      categories
        .filter((c) => c.type === 'expense')
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const incomeCategories = useMemo(
    () =>
      categories
        .filter((c) => c.type === 'income')
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [categories],
  );

  const currentList = tab === 'expense' ? expenseCategories : incomeCategories;

  function handleAdd() {
    setEditDialog({ mode: 'add', initialName: '', initialIcon: 'ellipsis' });
  }

  function handleEdit(cat: { id: string; name: string; icon: string }) {
    setEditDialog({
      mode: 'edit',
      categoryId: cat.id,
      initialName: cat.name,
      initialIcon: cat.icon,
    });
  }

  async function handleSave(name: string, icon: string) {
    if (!editDialog) return;
    if (editDialog.mode === 'add') {
      await addCategory({
        name,
        icon,
        type: tab,
        isDefault: false,
        sortOrder: currentList.length,
      });
    } else if (editDialog.mode === 'edit' && editDialog.categoryId) {
      await updateCategory(editDialog.categoryId, { name, icon });
    }
    setEditDialog(null);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    await removeCategory(deleteTarget);
    setDeleteTarget(null);
  }

  return (
    <div>
      <PageHeader title="分类管理" showBack />

      <div className="flex mx-4 mt-3 bg-muted rounded-lg p-1">
        <button
          onClick={() => setTab('expense')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'expense'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          支出分类
        </button>
        <button
          onClick={() => setTab('income')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
            tab === 'income'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground'
          }`}
        >
          收入分类
        </button>
      </div>

      <div className="p-4 space-y-1.5">
        {currentList.map((cat) => {
          const Icon = getLucideIcon(cat.icon);
          return (
            <div
              key={cat.id}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted/50 transition-colors group"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <Icon size={18} className="text-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium">{cat.name}</span>
              {cat.isDefault && (
                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                  默认
                </span>
              )}
              <button
                onClick={() => handleEdit(cat)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-all"
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setDeleteTarget(cat.id)}
                disabled={cat.isDefault}
                className={`p-1.5 rounded-lg transition-all ${
                  cat.isDefault
                    ? 'text-muted-foreground/30 cursor-not-allowed'
                    : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100'
                }`}
                title={cat.isDefault ? '默认分类不可删除' : '删除分类'}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}

        {currentList.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">
              {tab === 'expense' ? '暂无支出分类' : '暂无收入分类'}
            </p>
          </div>
        )}

        <button
          onClick={handleAdd}
          className="w-full flex items-center justify-center gap-2 py-3 mt-3 rounded-xl border-2 border-dashed border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-colors text-sm"
        >
          <Plus size={16} />
          {tab === 'expense' ? '添加支出分类' : '添加收入分类'}
        </button>
      </div>

      <EditDialog
        open={editDialog !== null}
        title={
          editDialog?.mode === 'add'
            ? tab === 'expense'
              ? '添加支出分类'
              : '添加收入分类'
            : '编辑分类'
        }
        initialName={editDialog?.initialName ?? ''}
        initialIcon={editDialog?.initialIcon ?? 'ellipsis'}
        onSave={handleSave}
        onCancel={() => setEditDialog(null)}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="删除分类"
        message="确定要删除这个分类吗？此操作不可撤销。"
        confirmLabel="删除"
        variant="destructive"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
