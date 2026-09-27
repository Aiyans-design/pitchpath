'use client';
import { useEffect } from 'react';

export default function ThemeBoot(){
  useEffect(()=>{
    const apply=()=>{
      const theme=localStorage.getItem('pitchpath-theme')||'light';
      document.documentElement.dataset.theme=theme;
      document.documentElement.lang=localStorage.getItem('pitchpath-language')||'en';
    };
    apply();
    window.addEventListener('pitchpath-preferences',apply);
    return ()=>window.removeEventListener('pitchpath-preferences',apply);
  },[]);
  return null;
}
