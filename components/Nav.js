'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Overview', icon: '◌' },
  { href: '/calendar', label: 'Calendar', icon: '⌁' },
  { href: '/water', label: 'Water', icon: '◍' },
  { href: '/nutrition', label: 'Nutrition', icon: '◇' },
  { href: '/sleep', label: 'Sleep', icon: '◐' },
  { href: '/gym', label: 'Gym', icon: '＋' },
  { href: '/individual', label: 'Training', icon: '↗' },
  { href: '/theory', label: 'Theory', icon: '▱' },
  { href: '/injury', label: 'Recovery', icon: '○' },
  { href: '/ai', label: 'AI', icon: '✦' },
];

function NavIcon({ icon }) { return <span className="nav-icon" aria-hidden="true">{icon}</span>; }

export default function Nav() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/onboarding') return null;
  const activeIndex = Math.max(0, links.findIndex(l => pathname === l.href || (l.href !== '/' && pathname.startsWith(l.href))));

  return <>
    <aside className="side-nav" aria-label="Main navigation">
      <div className="brand-mark"><span>P</span><b>Pitchpath</b></div>
      <div className="side-nav-list">
        <span className="nav-slider" style={{ transform: `translateY(${activeIndex * 58}px)` }} aria-hidden="true" />
        {links.map((link, i) => <Link key={link.href} href={link.href} className={`side-nav-item ${i === activeIndex ? 'active' : ''}`} aria-current={i === activeIndex ? 'page' : undefined}>
          <NavIcon icon={link.icon} /><span>{link.label}</span>
        </Link>)}
      </div>
    </aside>

    <nav className="mobile-nav" aria-label="Main navigation">
      <div className="mobile-nav-track">
        <span className="mobile-slider" style={{ transform: `translateX(calc(${activeIndex} * (100% + 2px)))` }} aria-hidden="true" />
        {links.map((link, i) => <Link key={link.href} href={link.href} className={`mobile-nav-item ${i === activeIndex ? 'active' : ''}`}>
          <NavIcon icon={link.icon} /><span>{link.label}</span>
        </Link>)}
      </div>
    </nav>
  </>;
}
