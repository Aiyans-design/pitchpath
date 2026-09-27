'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/', label: 'Overview', icon: '◒' },
  { href: '/calendar', label: 'Calendar', icon: '▦' },
  { href: '/water', label: 'Water', icon: '◌' },
  { href: '/nutrition', label: 'Nutrition', icon: '◇' },
  { href: '/sleep', label: 'Sleep', icon: '☾' },
  { href: '/gym', label: 'Gym', icon: '＋' },
  { href: '/individual', label: 'Training', icon: '↗' },
  { href: '/theory', label: 'Theory', icon: '▤' },
  { href: '/injury', label: 'Injury', icon: '♡' },
  { href: '/ai', label: 'Pitchpath AI', icon: '✦' },
];

export default function Nav() {
  const pathname = usePathname();
  if (pathname === '/login' || pathname === '/onboarding') return null;

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="bottom-nav-inner">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <Link key={link.href} href={link.href} className={`nav-item ${active ? 'active' : ''}`}>
              <span className="nav-icon" aria-hidden="true">{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          );
        })}
      </div>
      <style jsx>{`
        .bottom-nav{position:fixed;left:0;right:0;bottom:0;z-index:50;padding:10px 10px calc(10px + env(safe-area-inset-bottom));pointer-events:none}
        .bottom-nav-inner{width:min(1100px,100%);margin:auto;display:flex;gap:5px;overflow-x:auto;padding:7px;background:rgba(255,252,249,.86);border:1px solid rgba(255,255,255,.8);border-radius:24px;box-shadow:0 14px 45px rgba(54,65,59,.18);backdrop-filter:blur(22px);pointer-events:auto;scrollbar-width:none}
        .bottom-nav-inner::-webkit-scrollbar{display:none}
        .nav-item{flex:1 0 76px;min-width:76px;text-decoration:none;color:var(--ink-soft);font-size:10px;font-weight:750;text-align:center;padding:8px 6px;border-radius:17px;transition:all .2s ease;white-space:nowrap}
        .nav-item:hover{background:rgba(131,151,136,.09);transform:translateY(-1px)}
        .nav-item.active{color:#fff;background:var(--pine);box-shadow:0 7px 18px rgba(115,135,123,.24)}
        .nav-icon{display:block;font-size:17px;line-height:18px;margin-bottom:3px}
        @media(max-width:700px){.nav-item{flex-basis:68px;min-width:68px;font-size:9px}.nav-icon{font-size:16px}}
      `}</style>
    </nav>
  );
}
