// @ts-nocheck
'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ORB_DEFS = [
  {vx:1.4,vy:1.1,r:160,hue:270,alpha:0.72,hueTargets:[270,290,260,280]},
  {vx:-1.1,vy:1.6,r:120,hue:250,alpha:0.65,hueTargets:[245,255,235,250]},
  {vx:1.7,vy:-1.3,r:100,hue:200,alpha:0.62,hueTargets:[195,210,180,205]},
  {vx:-1.3,vy:-0.9,r:85,hue:185,alpha:0.58,hueTargets:[180,195,170,190]},
]

export default function RegisterPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const canvasRef = useRef(null)
  const orbsRef = useRef([])
  const router = useRouter()
  const supabase = createClient()

  useEffect(()=>{
    const canvas = canvasRef.current
    if(!canvas) return
    const ctx = canvas.getContext('2d')
    if(!ctx) return
    let animId

    function resize(){
      const c = canvasRef.current
      if(!c) return
      c.width = window.innerWidth
      c.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    orbsRef.current = ORB_DEFS.map((d,i)=>({
      ...d,
      x: window.innerWidth*(0.18+i*0.22),
      y: window.innerHeight*(0.25+(i%2)*0.5),
      hueIdx:0, hueT:0,
    }))

    function lerpHue(a,b,t){return a+(b-a)*t}

    function draw(){
      const c = canvasRef.current
      if(!c || !ctx) return
      ctx.clearRect(0,0,c.width,c.height)
      const orbs = orbsRef.current
      orbs.forEach(o=>{
        o.x+=o.vx; o.y+=o.vy
        if(o.x-o.r<0){o.x=o.r;o.vx=Math.abs(o.vx)}
        if(o.x+o.r>c.width){o.x=c.width-o.r;o.vx=-Math.abs(o.vx)}
        if(o.y-o.r<0){o.y=o.r;o.vy=Math.abs(o.vy)}
        if(o.y+o.r>c.height){o.y=c.height-o.r;o.vy=-Math.abs(o.vy)}
        o.hueT+=0.004
        if(o.hueT>=1){o.hueT=0;o.hueIdx=(o.hueIdx+1)%o.hueTargets.length}
        const nextIdx=(o.hueIdx+1)%o.hueTargets.length
        o.hue=lerpHue(o.hueTargets[o.hueIdx],o.hueTargets[nextIdx],o.hueT)
        for(let j=0;j<orbs.length;j++){
          if(orbs[j]===o)continue
          const dx=orbs[j].x-o.x,dy=orbs[j].y-o.y
          const dist=Math.sqrt(dx*dx+dy*dy)
          const minD=o.r+orbs[j].r
          if(dist<minD&&dist>0){
            const nx=dx/dist,ny=dy/dist
            const rv=(o.vx-orbs[j].vx)*nx+(o.vy-orbs[j].vy)*ny
            if(rv>0){o.vx-=rv*nx;o.vy-=rv*ny;orbs[j].vx+=rv*nx;orbs[j].vy+=rv*ny}
            const overlap=(minD-dist)/2
            o.x-=overlap*nx;o.y-=overlap*ny
            orbs[j].x+=overlap*nx;orbs[j].y+=overlap*ny
          }
        }
        const sat=o.hue>220?70:75
        const lit=o.hue>220?62:55
        const g=ctx.createRadialGradient(o.x,o.y,0,o.x,o.y,o.r)
        g.addColorStop(0,`hsla(${o.hue},${sat}%,${lit}%,${o.alpha})`)
        g.addColorStop(0.55,`hsla(${o.hue},${sat}%,${lit}%,${o.alpha*0.5})`)
        g.addColorStop(1,`hsla(${o.hue},${sat}%,${lit}%,0)`)
        ctx.beginPath();ctx.arc(o.x,o.y,o.r,0,Math.PI*2)
        ctx.fillStyle=g;ctx.fill()
      })
      animId=requestAnimationFrame(draw)
    }
    draw()
    return()=>{cancelAnimationFrame(animId);window.removeEventListener('resize',resize)}
  },[])

  async function handleRegister(e){
    e.preventDefault();setLoading(true);setError('')
    const {error} = await supabase.auth.signUp({
      email, password, options:{data:{full_name:fullName}}
    })
    if(error){setError(error.message);setLoading(false)}
    else router.push('/dashboard')
  }

  const inputStyle={
    width:'100%',padding:'12px 14px',
    background:'rgba(255,255,255,0.05)',
    border:'1px solid rgba(255,255,255,0.1)',
    borderRadius:12,fontSize:14,
    fontFamily:'Sora,sans-serif',
    color:'#fff',outline:'none',
  }
  const labelStyle={
    fontSize:9,color:'rgba(255,255,255,0.35)',
    letterSpacing:'0.1em',textTransform:'uppercase',
    display:'block',marginBottom:6,fontFamily:'Sora,sans-serif'
  }

  return(
    <div style={{position:'relative',minHeight:'100vh',background:'#08080f',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0 20px',overflow:'hidden'}}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Sora:wght@200;300;400;500;600&display=swap');`}</style>
      <canvas ref={canvasRef} style={{position:'fixed',inset:0,width:'100%',height:'100%',zIndex:0}}/>

      <div style={{position:'relative',zIndex:10,width:'100%',maxWidth:380}}>
        <div style={{textAlign:'center',marginBottom:36}}>
          <div style={{width:56,height:56,borderRadius:16,background:'rgba(127,119,221,0.88)',border:'1px solid rgba(255,255,255,0.25)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:26,fontWeight:600,color:'#fff',margin:'0 auto 14px',boxShadow:'0 4px 28px rgba(127,119,221,0.55),inset 0 1px 0 rgba(255,255,255,0.25)',fontFamily:'Sora,sans-serif'}}>M</div>
          <h1 style={{fontSize:26,fontWeight:200,color:'#fff',letterSpacing:'-0.5px',fontFamily:'Sora,sans-serif',marginBottom:6}}>manto</h1>
          <p style={{fontSize:12,color:'rgba(255,255,255,0.35)',fontFamily:'Sora,sans-serif',fontWeight:300}}>le tue finanze, senza drammi.</p>
        </div>

        <div style={{background:'rgba(255,255,255,0.055)',border:'1px solid rgba(255,255,255,0.14)',borderRadius:28,padding:'28px 24px',backdropFilter:'blur(40px)',WebkitBackdropFilter:'blur(40px)',boxShadow:'0 8px 48px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.1)'}}>
          <p style={{fontSize:10,color:'rgba(255,255,255,0.35)',letterSpacing:'0.08em',textTransform:'uppercase',marginBottom:20,fontFamily:'Sora,sans-serif'}}>crea il tuo account</p>

          <form onSubmit={handleRegister}>
            <div style={{marginBottom:14}}>
              <label style={labelStyle}>nome completo</label>
              <input type="text" value={fullName} onChange={e=>setFullName(e.target.value)} required placeholder="Mario Rossi" style={inputStyle}/>
            </div>
            <div style={{marginBottom:14}}>
              <label style={labelStyle}>email</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="tu@email.com" style={inputStyle}/>
            </div>
            <div style={{marginBottom:22}}>
              <label style={labelStyle}>password</label>
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="••••••••" style={inputStyle}/>
              <p style={{fontSize:10,color:'rgba(255,255,255,0.25)',marginTop:5,fontFamily:'Sora,sans-serif'}}>minimo 6 caratteri</p>
            </div>

            {error&&(
              <div style={{background:'rgba(240,153,123,0.1)',border:'1px solid rgba(240,153,123,0.25)',borderRadius:10,padding:'10px 14px',marginBottom:14}}>
                <p style={{fontSize:12,color:'#F0997B',fontFamily:'Sora,sans-serif'}}>{error}</p>
              </div>
            )}

            <button type="submit" disabled={loading} style={{width:'100%',padding:'13px',background:'rgba(127,119,221,0.85)',border:'1px solid rgba(175,169,236,0.3)',borderRadius:12,color:'#fff',fontSize:14,fontFamily:'Sora,sans-serif',fontWeight:500,cursor:'pointer',boxShadow:'0 4px 20px rgba(127,119,221,0.45),inset 0 1px 0 rgba(255,255,255,0.15)',opacity:loading?0.7:1,transition:'opacity 0.15s'}}>
              {loading?'registrazione in corso...':'registrati'}
            </button>
          </form>

          <div style={{borderTop:'1px solid rgba(255,255,255,0.07)',marginTop:20,paddingTop:18,textAlign:'center'}}>
            <p style={{fontSize:12,color:'rgba(255,255,255,0.3)',fontFamily:'Sora,sans-serif',fontWeight:300}}>
              hai già un account?{' '}
              <Link href="/login" style={{color:'rgba(175,169,236,0.9)',textDecoration:'none',fontWeight:500}}>accedi</Link>
            </p>
          </div>
        </div>

        <p style={{textAlign:'center',marginTop:20,fontSize:11,color:'rgba(255,255,255,0.18)',fontFamily:'Sora,sans-serif',fontWeight:300}}>fatto con troppa caffeina · manto 2025</p>
      </div>
    </div>
  )
}