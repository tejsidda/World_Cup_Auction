'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';
import { AuthNav } from '@/components/auth/AuthNav';
import { LobbyView } from '@/components/lobby/LobbyView';

export default function AuctionLobbyPage() {
  const { loading, userId } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userId) {
      router.replace('/login?next=/auction/lobby');
    }
  }, [loading, userId, router]);

  if (loading || !userId) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center text-[#666] text-[14px] gap-2">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading session…
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000] text-[#EDEDED]">
      <AuthNav />
      <main className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10">
        <LobbyView />
      </main>
    </div>
  );
}
