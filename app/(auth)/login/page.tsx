'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email o password non corretti')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#FAFAF8',fontFamily:'Georgia,serif'}}>
      <div style={{width:'100%',maxWidth:400,padding:'2rem',background:'white',borderRadius:12,border:'1px solid #E5E3DC'}}>
        <h1 style={{fontSize:22,fontWeight:'normal',marginBottom:8,letterSpacing:'-0.02em'}}>Bentornato</h1>
        <p style={{fontSize:13,color:'#A8A49E',marginBottom:24}}>Accedi al tuo account</p>

        <form onSubmit={handleLogin}>
          <div style={{marginBottom:16}}>
            <label style={{fontSize:11,color:'#6B6963',letterSpacing:'0.06em',textTransform:'uppercase',display:'block',marginBottom:6}}>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required
              style={{width:'100%',padding:'11px 14px',border:'1px solid #D0CEC5',borderRadius:8,fontSize:14,fontFamily:'Georgia,serif',outline:'none'}}/>
          </div>

          <div style={{marginBottom:24}}>
            <label style={{fontSize:11,color:'#6B6963',letterSpacing:'0.06em',textTransform:'uppercase',display:'block',marginBottom:6}}>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required
              style={{width:'100%',padding:'11px 14px',border:'1px solid #D0CEC5',borderRadius:8,fontSize:14,fontFamily:'Georgia,serif',outline:'none'}}/>
          </div>

          {error && <p style={{fontSize:12,color:'#993C1D',marginBottom:16}}>{error}</p>}

          <button type="submit" disabled={loading}
            style={{width:'100%',padding:14,background:'#1A1917',color:'white',border:'none',borderRadius:8,fontSize:15,fontFamily:'Georgia,serif',fontStyle:'italic',cursor:'pointer'}}>
            {loading ? 'Accesso...' : 'Accedi'}
          </button>
        </form>

        <p style={{textAlign:'center',marginTop:20,fontSize:13,color:'#6B6963'}}>
          Non hai un account?{' '}
          <Link href="/register" style={{color:'#1A1917'}}>Registrati</Link>
        </p>
      </div>
    </div>
  )
}
