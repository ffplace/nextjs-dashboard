'use server';

import {z} from 'zod';
import {sql} from '@vercel/postgres'
import { revalidatePath } from 'next/cache';
import {redirect} from 'next/navigation'

const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'please select a customer.'
  }),
  amount: z.coerce.number().gt(0,{message: 'please enter an amount greater than $0.'}),
  status: z.enum(['pending', 'paid'],{
    invalid_type_error: 'please select an invoice status.'
  }),
  date: z.string(),
});

const CreateInvoice = FormSchema.omit({ id: true, date: true });  
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?:string[];
  };
  message?: string| null;
}

export async function createInvoice(prevState: State, formData: FormData) {
  console.log('11111111111') //服务端组件的打印只会出现在服务终端，不会出现在前台的console
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if(!validatedFields.success){
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.'
    }
  }
  const {customerId, amount, status} = validatedFields.data;
  const amountInCents = amount*100
  const date = new Date().toISOString().split('T')[0]
  // Test it out:
  console.log(date);

  try{
    await sql`
    INSERT INTO invoices (customer_id, amount, status, date)
    VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
  `;
  }catch(error){
    return {
      message: 'Database Error: Failed to Create Invoice.'
    }
  } 

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, prevState: State, formData: FormData){
  // 设置安全校验参数
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // 给前端发回错误验证的信息
  if(!validatedFields.success){
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.'
    }
  }

  // 获取验证后的值
  const { customerId, amount, status } = validatedFields.data  
  const amountInCents = amount * 100;

  try{
    await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;
  }catch(error){
    return {
      message: 'Database Error: Failed to Update Invoice.'
    }
  }
 
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string){
  throw new Error('Failed to Delete Invoice');
  try{
    await sql`DELETE FROM invoices WHERE id = ${id}`
    return {
      message: 'deleted Invoice'
    }
  }catch(error){
    return {
      message: 'Database Error: Failed to Delete Invoice.'
    }
  }

  revalidatePath('/dashboard/invoices');
}