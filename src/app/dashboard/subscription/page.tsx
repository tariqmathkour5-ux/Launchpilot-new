import { Suspense } from 'react';
import Link from 'next/link';
import {
  CreditCard, ArrowUpRight, Loader2, Receipt, AlertTriangle, CheckCircle2, Zap
} from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import SubscriptionContent from './subscription-content';

export const dynamic = 'force-dynamic';

export default function SubscriptionDashboardPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary-500" /></div>
        <Footer />
      </>
    }>
      <SubscriptionContent />
    </Suspense>
  );
}