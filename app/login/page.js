'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabaseClient';

export default function LoginPage(){
  const router=useRouter();
  const [mode,setMode]=useState('signup');
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    setMode(params.get('mode')==='login'?'login':'signup');
  },[]);

  function switchMode(next){
    setError('');
    setNotice('');
    setPassword('');
    setMode(next);
    const url=next==='login'?'/login?mode=login':'/login';
    window.history.replaceState(null,'',url);
  }

  async function handleSubmit(e){
    e.preventDefault();
    setError('');
    setNotice('');
    setLoading(true);
    const cleanEmail=email.trim().toLowerCase();
    try{
      if(mode==='signup'){
        const {data,error:authError}=await supabase.auth.signUp({email:cleanEmail,password});
        if(authError)throw authError;
        if(data.session){router.replace('/');return;}
        setNotice('Account created. Check your email to confirm the account, then log in here.');
        setPassword('');
        setMode('login');
        window.history.replaceState(null,'','/login?mode=login');
        return;
      }
      const {data,error:authError}=await supabase.auth.signInWithPassword({email:cleanEmail,password});
      if(authError)throw authError;
      if(!data.session)throw new Error('Login succeeded but no active session was returned. Please try again.');
      router.replace('/');
    }catch(err){
      const message=err?.message||'Something went wrong. Please try again.';
      setError(message.includes('Invalid login credentials')?'Email or password is incorrect.':message.includes('Email not confirmed')?'Please confirm your email first, then log in again.':message);
    }finally{setLoading(false)}
  }

  const signup=mode==='signup';
  return <main className="app-shell" style={{maxWidth:460,minHeight:'80vh',display:'grid',placeItems:'center'}}>
    <div className="card" style={{width:'100%'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}><div style={{width:42,height:42,borderRadius:14,background:'var(--pine)',color:'#fff',display:'grid',placeItems:'center',fontWeight:900}}>P</div><div><strong style={{fontSize:18}}>Pitchpath</strong><div className="muted" style={{fontSize:11}}>Your football development system</div></div></div>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',padding:4,borderRadius:18,background:'var(--stone)',marginBottom:22,gap:4}}>
        <button type="button" onClick={()=>switchMode('login')} aria-pressed={!signup} style={{border:0,borderRadius:14,padding:'11px 8px',fontWeight:850,cursor:'pointer',background:!signup?'var(--card)':'transparent',color:!signup?'var(--ink)':'var(--muted)',boxShadow:!signup?'0 2px 10px rgba(0,0,0,.08)':'none'}}>Log in</button>
        <button type="button" onClick={()=>switchMode('signup')} aria-pressed={signup} style={{border:0,borderRadius:14,padding:'11px 8px',fontWeight:850,cursor:'pointer',background:signup?'var(--card)':'transparent',color:signup?'var(--ink)':'var(--muted)',boxShadow:signup?'0 2px 10px rgba(0,0,0,.08)':'none'}}>Sign up</button>
      </div>
      <span className="pill">{signup?'CREATE PLAYER ACCOUNT':'WELCOME BACK'}</span>
      <h1 style={{fontSize:36,marginTop:10}}>{signup?'Start your Pitchpath.':'Welcome back.'}</h1>
      <p className="muted">{signup?'Create your account first. Your player profile comes next.':'Log in to continue your player development.'}</p>
      <form onSubmit={handleSubmit} style={{marginTop:22}}>
        <label className="setting-label">Email<input className="input-field" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label className="setting-label">Password<input className="input-field" type="password" autoComplete={signup?'new-password':'current-password'} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} /></label>
        {error&&<div style={{marginTop:14,padding:13,borderRadius:16,background:'rgba(169,74,66,.10)',color:'var(--danger)',fontSize:13}}>{error}</div>}
        {notice&&<div style={{marginTop:14,padding:13,borderRadius:16,background:'rgba(131,151,136,.12)',color:'var(--pine)',fontSize:13}}>{notice}</div>}
        <button type="submit" className="btn-primary" style={{width:'100%',marginTop:16}} disabled={loading}>{loading?'Connecting…':signup?'Create account':'Log in'}</button>
      </form>
      <p className="muted" style={{textAlign:'center',fontSize:12,marginTop:16,marginBottom:0}}>{signup?'Already have an account?':'New to Pitchpath?'} <button type="button" onClick={()=>switchMode(signup?'login':'signup')} style={{border:0,background:'transparent',padding:0,color:'var(--pine)',fontWeight:850,cursor:'pointer'}}>{signup?'Log in':'Sign up'}</button></p>
    </div>
  </main>;
}
