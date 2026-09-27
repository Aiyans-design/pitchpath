'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/water', label: 'Water' },
];

export default function Nav() {
  const pathname = usePathname();

  // Hide the nav on the pre-app screens
  if (pathname === '/login' || pathname === '/onboarding') return null;

  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'space-around',
        background: 'var(--card)',
        padding: '10px 4px calc(10px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
        zIndex: 10,
      }}
    >
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            style={{
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 16px',
              borderRadius: 100,
              color: active ? '#fff' : 'var(--ink-soft)',
              background: active ? 'var(--pine)' : 'transparent',
              textDecoration: 'none',
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
