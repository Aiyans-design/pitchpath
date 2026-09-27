'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect,useState } from 'react';
const links=[
 {href:'/',en:'Overview',sv:'Översikt',icon:'◌'},{href:'/calendar',en:'Calendar',sv:'Kalender',icon:'⌁'},{href:'/water',en:'Water',sv:'Vatten',icon:'◍'},{href:'/nutrition',en:'Nutrition',sv:'Mat',icon:'◇'},{href:'/sleep',en:'Sleep',sv:'Sömn',icon:'◐'},{href:'/gym',en:'Gym',sv:'Gym',icon:'＋'},{href:'/individual',en:'Training',sv:'Träning',icon:'↗'},{href:'/theory',en:'Theory',sv:'Teori',icon:'▱'},{href:'/injury',en:'Recovery',sv:'Återhämtning',icon:'○'},{href:'/ai',en:'AI',sv:'AI',icon:'✦'},{href:'/progress',en:'Progress',sv:'Utveckling',icon:'↗'},{href:'/settings',en:'Settings',sv:'Inställningar',icon:'⚙'}
];
const mobileMain=[links[0],links[1],links[6],links[3],links[9]];
function Icon({icon}){return <span className="nav-icon" aria-hidden="true">{icon}</span>}
function PitchpathLogo({compact=false}){
  return <span className={`pitchpath-logo ${compact?'pitchpath-logo-compact':''}`} aria-label="Pitchpath" style={{display:'flex',alignItems:'center',gap:9,width:'auto',height:'auto',padding:0,margin:0,borderRadius:0,background:'transparent',boxShadow:'none',color:'var(--ink)'}}>
    <svg viewBox="0 0 48 48" role="img" aria-hidden="true" style={{width:compact?30:34,height:compact?30:34,display:'block',flex:'0 0 auto'}}>
      <path d="M13 35V13h10.5c6.6 0 10.5 3.5 10.5 8.8s-3.9 8.8-10.5 8.8H18" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18 25h17" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
      <path d="M31 32.5h7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"/>
      <circle cx="39.5" cy="32.5" r="2.2" fill="currentColor"/>
    </svg>
    {!compact&&<b style={{fontSize:15,fontWeight:800,letterSpacing:'-.035em',lineHeight:1}}>Pitchpath</b>}
  </span>
}
export default function Nav(){const pathname=usePathname();const [lang,setLang]=useState('en');const [more,setMore]=useState(false);useEffect(()=>{const read=()=>setLang(localStorage.getItem('pitchpath-language')||'en');read();window.addEventListener('pitchpath-preferences',read);return()=>window.removeEventListener('pitchpath-preferences',read)},[]);if(pathname==='/login'||pathname==='/onboarding')return null;const activeIndex=Math.max(0,links.findIndex(l=>pathname===l.href||(l.href!=='/'&&pathname.startsWith(l.href))));const isMobileMain=mobileMain.some(l=>l.href===links[activeIndex]?.href);return <>
<Link href="/settings" className="top-settings" aria-label={lang==='sv'?'Inställningar':'Settings'} style={{position:'fixed',top:18,right:24,zIndex:95,display:'grid',placeItems:'center',width:40,height:40,borderRadius:'50%',background:'var(--card)',border:'1px solid rgba(255,255,255,.68)',boxShadow:'0 12px 34px rgba(30,38,34,.10)',backdropFilter:'blur(18px)',color:'var(--ink)',textDecoration:'none',fontSize:15}}>⚙</Link>
<aside className="side-nav" style={{maxHeight:'calc(100vh - 28px)',overflow:'hidden'}}><div className="brand-mark" style={{height:56,display:'flex',alignItems:'center',padding:'2px 11px 10px',overflow:'visible'}}><PitchpathLogo/></div><div className="side-nav-list" style={{gap:0}}><span className="nav-slider" style={{height:44,transform:`translateY(${activeIndex*44}px)`}} />{links.map((l,i)=><Link key={l.href} href={l.href} className={`side-nav-item ${i===activeIndex?'active':''}`} style={{height:44}}><Icon icon={l.icon}/><span>{lang==='sv'?l.sv:l.en}</span></Link>)}</div></aside>
<nav className="mobile-nav"><div className="mobile-nav-track"><div className="mobile-brand"><PitchpathLogo compact/></div>{mobileMain.map(l=>{const active=pathname===l.href||(l.href!=='/'&&pathname.startsWith(l.href));return <Link key={l.href} href={l.href} className={`mobile-nav-item ${active?'active':''}`}><Icon icon={l.icon}/><span>{lang==='sv'?l.sv:l.en}</span></Link>})}<button className={`mobile-nav-item mobile-more ${!isMobileMain?'active':''}`} onClick={()=>setMore(v=>!v)}><Icon icon="•••"/><span>{lang==='sv'?'Mer':'More'}</span></button></div></nav>
{more&&<div className="mobile-more-sheet" onClick={()=>setMore(false)}><div className="mobile-more-panel" onClick={e=>e.stopPropagation()}><div className="sheet-handle"/><div className="sheet-grid">{links.filter(l=>!mobileMain.includes(l)).map(l=><Link key={l.href} href={l.href} onClick={()=>setMore(false)} className="sheet-link"><Icon icon={l.icon}/><span>{lang==='sv'?l.sv:l.en}</span></Link>)}</div></div></div>}</>}
