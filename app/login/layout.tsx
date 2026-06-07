import type { Metadata } from 'next';
import { AuthProvider } from '@/contexts/AuthProvider';

export const metadata: Metadata = {
  title: 'Sign in · WC26',
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
