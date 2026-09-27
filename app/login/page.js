'use client';
import { useState } from 'react';
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

  async function handleSubmit(e){
    e.preventDefault();
    setError('');setNotice('');setLoading(true);
    const cleanEmail=email.trim().toLowerCase();
    try{
      if(mode==='signup'){
        const {data,error:authError}=await supabase.auth.signUp({email:cleanEmail,password});
        if(authError)throw authError;
        if(data.session){router.replace('/');return;}
        setNotice('Account created. Check your email to confirm the account, then log in here.');
        setMode('login');
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

  return <main className="app-shell" style={{maxWidth:460,minHeight:'80vh',display:'grid',placeItems:'center'}}>
    <div className="card" style={{width:'100%'}}>
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:18}}><div style={{width:42,height:42,borderRadius:14,background:'var(--pine)',color:'#fff',display:'grid',placeItems:'center',fontWeight:900}}>P</div><div><strong style={{fontSize:18}}>Pitchpath</strong><div className="muted" style={{fontSize:11}}>Your football development system</div></div></div>
      <span className="pill">{mode==='signup'?'PLAYER ACCOUNT':'WELCOME BACK'}</span>
      <h1 style={{fontSize:36,marginTop:10}}>{mode==='signup'?'Start your Pitchpath.':'Continue your Pitchpath.'}</h1>
      <p className="muted">{mode==='signup'?'Create your account first. Your player profile comes next.':'Log in and continue where you left off.'}</p>
      <form onSubmit={handleSubmit} style={{marginTop:22}}>
        <label className="setting-label">Email<input className="input-field" type="email" autoComplete="email" required value={email} onChange={e=>setEmail(e.target.value)} /></label>
        <label className="setting-label">Password<input className="input-field" type="password" autoComplete={mode==='signup'?'new-password':'current-password'} minLength={6} required value={password} onChange={e=>setPassword(e.target.value)} /></label>
        {error&&<div style={{marginTop:14,padding:13,borderRadius:16,background:'rgba(169,74,66,.10)',color:'var(--danger)',fontSize:13}}>{error}</div>}
        {notice&&<div style={{marginTop:14,padding:13,borderRadius:16,background:'rgba(131,151,136,.12)',color:'var(--pine)',fontSize:13}}>{notice}</div>}
        <button type="submit" className="btn-primary" style={{width:'100%',marginTop:16}} disabled={loading}>{loading?'Connecting…':mode==='signup'?'Create account':'Log in'}</button>
      </form>
      <button type="button" onClick={()=>{setMode(m=>m==='signup'?'login':'signup');setError('');setNotice('')}} style={{marginTop:16,width:'100%',border:0,background:'transparent',color:'var(--pine)',fontWeight:800,cursor:'pointer'}}> {mode==='signup'?'Already have an account? Log in':'Need an account? Sign up'}</button>
    </div>
  </main>;
}
