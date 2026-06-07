import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthProvider';

export const metadata: Metadata = {
  title: 'Auction Lobby · WC26',
};

export default function AuctionLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
