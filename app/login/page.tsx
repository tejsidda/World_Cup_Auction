'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/PageHeader';
import { LogIn } from 'lucide-react';

const LoginForm = dynamic(() => import('@/components/auth/LoginForm').then((m) => m.LoginForm), {
  ssr: false,
  loading: () => (
    <div className="fifa-card backdrop-blur-md rounded-sm p-8 border-[#00A94F]/25 text-[13px] text-[#666]">
      Loading sign-in…
    </div>
  ),
});

function LoginContent() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/auction/lobby';
  const authError = searchParams.get('error');

  return (
    <div className="min-h-screen bg-[#000] text-[#EDEDED] flex flex-col items-center px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        <PageHeader
          kicker="WC26 · Sign in"
          title="Auction login"
          subtitle="Sign in with email and password for auction night."
          icon={<LogIn className="w-4 h-4" />}
        />

        {authError && (
          <p className="text-[13px] text-red-400 border border-red-500/20 bg-red-500/5 rounded-lg px-4 py-3">
            Sign-in failed. Check email/password or try again.
          </p>
        )}

        <LoginForm nextPath={nextPath} />

        <p className="text-center text-[13px] text-[#666]">
          <Link href="/" className="text-[#00A94F]/80 hover:text-[#00A94F] transition-colors">
            ← Back to dashboard
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000] flex items-center justify-center text-[#666] text-[14px]">
          Loading…
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
