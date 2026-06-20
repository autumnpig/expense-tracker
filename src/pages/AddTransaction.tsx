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
  const { add } = useTransactionStore();
  const { load: loadAccounts, accounts } = useAccountStore();
  const { load: loadCategories } = useCategoryStore();

  useEffect(() => {
    if (accounts.length === 0) loadAccounts();
    loadCategories();
  }, []);

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
