'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect,useState } from 'react';

const links=[
 {href:'/',en:'Overview',sv:'Översikt',icon:'◌'},
 {href:'/calendar',en:'Calendar',sv:'Kalender',icon:'⌁'},
 {href:'/water',en:'Water',sv:'Vatten',icon:'◍'},
 {href:'/nutrition',en:'Nutrition',sv:'Mat',icon:'◇'},
 {href:'/sleep',en:'Sleep',sv:'Sömn',icon:'◐'},
 {href:'/gym',en:'Gym',sv:'Gym',icon:'＋'},
 {href:'/individual',en:'Training',sv:'Träning',icon:'↗'},
 {href:'/theory',en:'Theory',sv:'Teori',icon:'▱'},
 {href:'/injury',en:'Recovery',sv:'Återhämtning',icon:'○'},
 {href:'/ai',en:'AI',sv:'AI',icon:'✦'},
 {href:'/progress',en:'Progress',sv:'Utveckling',icon:'↗'},
 {href:'/settings',en:'Settings',sv:'Inställningar',icon:'⚙'}
];
const mobileMain=[links[0],links[1],links[6],links[3],links[9]];
function Icon({icon}){return <span className="nav-icon" aria-hidden="true">{icon}</span>}
export default function Nav(){const pathname=usePathname();const [lang,setLang]=useState('en');const [more,setMore]=useState(false);useEffect(()=>{const read=()=>setLang(localStorage.getItem('pitchpath-language')||'en');read();window.addEventListener('pitchpath-preferences',read);return()=>window.removeEventListener('pitchpath-preferences',read)},[]);if(pathname==='/login'||pathname==='/onboarding')return null;const activeIndex=Math.max(0,links.findIndex(l=>pathname===l.href||(l.href!=='/'&&pathname.startsWith(l.href))));const isMobileMain=mobileMain.some(l=>l.href===links[activeIndex]?.href);return <><aside className="side-nav"><div className="brand-mark"><span>P</span><b>Pitchpath</b></div><div className="side-nav-list"><span className="nav-slider" style={{transform:`translateY(${activeIndex*52}px)`}} />{links.map((l,i)=><Link key={l.href} href={l.href} className={`side-nav-item ${i===activeIndex?'active':''}`}><Icon icon={l.icon}/><span>{lang==='sv'?l.sv:l.en}</span></Link>)}</div></aside><nav className="mobile-nav"><div className="mobile-nav-track">{mobileMain.map((l,i)=>{const active=pathname===l.href||(l.href!=='/'&&pathname.startsWith(l.href));return <Link key={l.href} href={l.href} className={`mobile-nav-item ${active?'active':''}`}><Icon icon={l.icon}/><span>{lang==='sv'?l.sv:l.en}</span></Link>})}<button className={`mobile-nav-item mobile-more ${!isMobileMain?'active':''}`} onClick={()=>setMore(v=>!v)}><Icon icon="•••"/><span>{lang==='sv'?'Mer':'More'}</span></button></div></nav>{more&&<div className="mobile-more-sheet" onClick={()=>setMore(false)}><div className="mobile-more-panel" onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><div className="sheet-grid">{links.filter(l=>!mobileMain.includes(l)).map(l=><Link key={l.href} href={l.href} onClick={()=>setMore(false)} className="sheet-link"><Icon icon={l.icon}/><span>{lang==='sv'?l.sv:l.en}</span></Link>)}</div></div></div>}</>}
