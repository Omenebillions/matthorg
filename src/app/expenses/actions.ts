'use server';

import { redirect } from 'next/navigation';

// This is a server action
export async function addExpense(formData: FormData) {
  const rawFormData = {
    description: formData.get('description'),
    amount: formData.get('amount'),
    category: formData.get('category'),
    date: formData.get('date'),
  };

  // Mutate data
  console.log('New Expense:', rawFormData);
  
  // Here you would typically save the data to a database

  // Redirect
  redirect('/expenses');
}
