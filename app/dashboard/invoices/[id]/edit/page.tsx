import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchInvoiceById, fetchCustomers } from '@/app/lib/data';
import { notFound } from 'next/navigation'
 
 
export default async function Page(prop:{params: Promise<{id: string}>}) {
  const params = await prop.params
  const id = params.id
  const [invoice, customers] = await Promise.all([ // 同时执行两个方法
    fetchInvoiceById(id),
    fetchCustomers(),
  ]);
  if(!invoice){
    notFound()  
  }
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}