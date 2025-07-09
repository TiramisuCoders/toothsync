import '../styles/globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'ToothSync',
  description: 'Digital clinical system for dentistry laboratories',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
