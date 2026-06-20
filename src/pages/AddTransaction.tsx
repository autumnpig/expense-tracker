import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTransactionStore } from '@/stores/transactionStore';
import { useAccountStore } from '@/stores/accountStore';
import { useCategoryStore } from '@/stores/categoryStore';
import PageHeader from '@/components/shared/PageHeader';
import TransactionForm from '@/components/business/TransactionForm';
import type { Transaction } from '@/types';

export default function AddTransaction() {
  const navigate = useNavigate();
  const add = useTransactionStore((s) => s.add);
  const accounts = useAccountStore((s) => s.accounts);
  const loadAccounts = useAccountStore((s) => s.load);
  const loadCategories = useCategoryStore((s) => s.load);

  useEffect(() => {
    if (accounts.length === 0) loadAccounts();
    loadCategories();
  }, [accounts.length, loadAccounts, loadCategories]);

  async function handleSubmit(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) {
    await add(data);
    navigate('/', { replace: true });
  }

  return (
    <div>
      <PageHeader title="记账" showBack />
      <TransactionForm onSubmit={handleSubmit} />
    </div>
  );
}
