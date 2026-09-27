'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Home' },
  { href: '/water', label: 'Water' },
  { href: '/sleep', label: 'Sleep' },
  { href: '/calendar', label: 'Calendar' },
  { href: '/nutrition', label: 'Food' },
  { href: '/gym', label: 'Gym' },
  { href: '/individual', label: 'Training' },
  { href: '/theory', label: 'Theory' },
  { href: '/injury', label: 'Injury' },
  { href: '/ai', label: 'AI' },
];

export default function Nav() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/onboarding') return null;

  return (
    <nav
      style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, display: 'flex',
        overflowX: 'auto', gap: 4, background: 'var(--card)',
        padding: '10px 8px calc(10px + env(safe-area-inset-bottom, 0px))',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.08)', zIndex: 10,
      }}
    >
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link key={link.href} href={link.href} style={{
            flex: '0 0 auto', fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 100,
            color: active ? '#fff' : 'var(--ink-soft)', background: active ? 'var(--pine)' : 'transparent',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
