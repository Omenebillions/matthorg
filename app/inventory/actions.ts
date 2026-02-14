'use server';

import { redirect } from 'next/navigation';

// This is a server action
export async function createItem(formData: FormData) {
  const rawFormData = {
    name: formData.get('name') as string,
    stockLevel: Number(formData.get('stockLevel')),
    price: Number(formData.get('price')),
    category: formData.get('category') as string,
  };

  // Mutate data
  console.log('rawFormData', rawFormData);

  // Redirect
  redirect('/inventory');
}
