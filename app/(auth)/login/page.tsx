'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [dark, setDark] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(()=>{
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(mq.matches)
    const h = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  },[])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email o password non corretti'); setLoading(false) }
    else router.push('/dashboard')
  }

  const bg = dark ? '#0E0E12' : '#F7F7FB'
  const surface = dark ? '#1A1A24' : '#FFFFFF'
  const border = dark ? 'rgba(127,119,221,0.2)' : 'rgba(127,119,221,0.25)'
  const txt = dark ? '#FFFFFF' : '#0E0E12'
  const txtMuted = dark ? 'rgba(255,255,255,0.4)' : 'rgba(14,14,18,0.4)'
  const inputBg = dark ? '#22222E' : '#F7F7FB'

  return (
    <div style={{minHeight:'100vh',background:bg,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',fontFamily:'-apple-system,BlinkMacSystemFont,SF Pro Display,Segoe UI,sans-serif',padding:'0 20px',transition:'background 0.3s'}}>

      {/* Logo */}
      <div style={{textAlign:'center',marginBottom:40}}>
        <div style={{width:60,height:60,borderRadius:16,background:'#7F77DD',display:'flex',alignItems:'center',justifyContent:'center',fontSize:30,fontWeight:700,color:'#fff',margin:'0 auto 16px',boxShadow:'0 8px 32px rgba(127,119,221,0.35)'}}>M</div>
        <h1 style={{fontSize:28,fontWeight:300,letterSpacing:'-0.8px',color:txt,marginBottom:6}}>manto</h1>
        <p style={{fontSize:14,color:txtMuted,letterSpacing:'0.01em'}}>le tue finanze, senza drammi.</p>
      </div>

      {/* Card */}
      <div style={{width:'100%',maxWidth:400,background:surface,borderRadius:20,border:`1px solid ${border}`,padding:'28px 24px',boxShadow:dark?'0 24px 64px rgba(0,0,0,0.4)':'0 24px 64px rgba(127,119,221,0.08)'}}>

        <p style={{fontSize:11,color:txtMuted,letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:20}}>accedi al tuo account</p>

        <form onSubmit={handleLogin}>
          <div style={{marginBottom:14}}>
            <label style={{fontSize:10,color:txtMuted,letterSpacing:'0.08em',textTransform:'uppercase',display:'block',marginBottom:6}}>email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tu@email.com"
              style={{width:'100%',padding:'12px 14px',border:`1px solid ${border}`,borderRadius:10,fontSize:14,fontFamily:'inherit',background:inputBg,color:txt,outline:'none',transition:'border-color 0.2s'}}/>
          </div>

          <div style={{marginBottom:24}}>
            <label style={{fontSize:10,color:txtMuted,letterSpacing:'0.08em',textTransform:'uppercase',display:'block',marginBottom:6}}>password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder="••••••••"
              style={{width:'100%',padding:'12px 14px',border:`1px solid ${border}`,borderRadius:10,fontSize:14,fontFamily:'inherit',background:inputBg,color:txt,outline:'none',transition:'border-color 0.2s'}}/>
          </div>

          {error && (
            <div style={{background:'rgba(240,153,123,0.12)',border:'1px solid rgba(240,153,123,0.3)',borderRadius:8,padding:'10px 14px',marginBottom:16}}>
              <p style={{fontSize:13,color:'#F0997B'}}>{error}</p>
            </div>
          )}

          <button type="submit" disabled={loading}
            style={{width:'100%',padding:'13px',background:'#7F77DD',color:'white',border:'none',borderRadius:10,fontSize:15,fontFamily:'inherit',fontWeight:500,cursor:'pointer',letterSpacing:'0.01em',boxShadow:'0 4px 16px rgba(127,119,221,0.4)',transition:'opacity 0.15s',opacity:loading?0.7:1}}>
            {loading ? 'accesso in corso...' : 'accedi'}
          </button>
        </form>

        <div style={{textAlign:'center',marginTop:20,paddingTop:20,borderTop:`1px solid ${border}`}}>
          <p style={{fontSize:13,color:txtMuted}}>
            non hai un account?{' '}
            <Link href="/register" style={{color:'#7F77DD',textDecoration:'none',fontWeight:500}}>registrati</Link>
          </p>
        </div>
      </div>

      <p style={{marginTop:24,fontSize:12,color:txtMuted,textAlign:'center'}}>fatto con troppa caffeina · manto 2025</p>
    </div>
  )
}