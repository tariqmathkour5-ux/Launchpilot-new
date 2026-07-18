import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import CompanySidebar from '@/components/company/CompanySidebar';
import { prisma } from '@/lib/prisma';

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/auth/signin');

  // Check if user belongs to a company
  const memberships = await prisma.$queryRaw<Array<{ company_id: string }>>`
    SELECT company_id FROM company_members WHERE user_id = ${session.user.id} AND status = 'active' LIMIT 1
  `;

  // Allow admins through regardless
  const userRows = await prisma.$queryRaw<Array<{ role: string }>>`
    SELECT "legacyRole" as role FROM "User" WHERE id = ${session.user.id}
  `;

  const isAdmin = userRows[0]?.role === 'ADMIN';

  if (!memberships[0] && !isAdmin) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-secondary-50">
      <CompanySidebar />
      <main className="ml-64 min-h-screen transition-all duration-300">
        {children}
      </main>
    </div>
  );
}
