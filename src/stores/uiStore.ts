import { create } from 'zustand';

interface UIState {
  /** Currently selected month for filtering across pages, format "YYYY-MM" */
  selectedMonth: string;
  /** Whether budget settings sheet is open */
  budgetSheetOpen: boolean;
  /** Notification snackbar */
  snackbar: { message: string; type: 'success' | 'error' | 'info' } | null;

  setSelectedMonth: (month: string) => void;
  setBudgetSheetOpen: (open: boolean) => void;
  showSnackbar: (message: string, type?: 'success' | 'error' | 'info') => void;
  hideSnackbar: () => void;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export const useUIStore = create<UIState>((set) => ({
  selectedMonth: getCurrentMonth(),
  budgetSheetOpen: false,
  snackbar: null,

  setSelectedMonth: (month) => set({ selectedMonth: month }),
  setBudgetSheetOpen: (open) => set({ budgetSheetOpen: open }),
  showSnackbar: (message, type = 'info') => set({ snackbar: { message, type } }),
  hideSnackbar: () => set({ snackbar: null }),
}));
