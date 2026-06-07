'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LogOut, Shield } from 'lucide-react';
import { useAuth } from '@/contexts/AuthProvider';

export function AuthNav() {
  const { email, isAdmin, signOut } = useAuth();

  return (
    <nav className="sticky top-0 z-30 w-full border-b border-[#00A94F]/15 bg-black/70 backdrop-blur-xl">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14 gap-3">
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <Image
              src="https://digitalhub.fifa.com/transform/157d23bf-7e13-4d7b-949e-5d27d340987e/WC26_Logo?&io=transform:fill&quality=75"
              alt="WC26"
              width={96}
              height={32}
              className="h-7 w-auto object-contain rounded-sm"
              priority
            />
            <span className="font-display font-bold uppercase text-[13px] tracking-[0.12em] text-white/90 group-hover:text-white hidden sm:block">
              Auction
            </span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAdmin && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-[#E5A93D]/10 border border-[#E5A93D]/25 text-[#E5A93D] text-[11px] font-display font-semibold uppercase tracking-wide">
                <Shield className="w-3 h-3" />
                Admin
              </span>
            )}
            {email && (
              <span className="hidden md:inline text-[12px] font-mono text-[#888] max-w-[180px] truncate">
                {email}
              </span>
            )}
            <Link
              href="/"
              className="text-[12px] font-display font-semibold uppercase tracking-wide px-3 py-1.5 rounded-sm border bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white hover:border-white/[0.15] transition-colors"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={() => signOut()}
              className="flex items-center gap-1.5 text-[12px] font-display font-semibold uppercase tracking-wide px-3 py-1.5 rounded-sm border bg-white/[0.04] border-white/[0.08] text-white/60 hover:text-white hover:border-white/[0.15] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
