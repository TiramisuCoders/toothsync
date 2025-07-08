'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Sidebar() {
  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-white shadow-lg flex flex-col items-center py-8">
      <Image
        src="/images/samplefile.jpg"
        alt="ToothSync Logo"
        width={120}
        height={40}
        priority
      />
      <nav className="mt-10 flex flex-col gap-6 w-full px-6">
        <Link href="/" className="text-blue-600 font-medium hover:underline">
          Home
        </Link>
        <Link href="/about" className="text-blue-600 font-medium hover:underline">
          About
        </Link>
        <Link href="/contact" className="text-blue-600 font-medium hover:underline">
          Contact
        </Link>
      </nav>
    </aside>
  );
}
