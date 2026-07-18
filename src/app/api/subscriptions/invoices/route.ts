import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const invoices = await prisma.invoice.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(invoices.map(inv => ({
    id: inv.id,
    invoice_number: inv.invoiceNumber,
    amount: inv.amount,
    currency: inv.currency,
    status: inv.status,
    paid_at: inv.paidAt,
    due_date: inv.dueDate,
    created_at: inv.createdAt,
    line_items: inv.lineItems,
  })));
}