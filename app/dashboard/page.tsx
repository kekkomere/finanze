'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const CATS_OUT = ["Cibo","Trasporti","Svago","Casa","Shopping","Salute","Abbonamenti","Altro"]
const CATS_IN = ["Lavoro","Regalo","Rimborso","Altro"]
const CAT_COLOR: Record<string,string> = {Cibo:"#F0997B",Trasporti:"#85B7EB",Svago:"#AFA9EC",Casa:"#EF9F27",Shopping:"#ED93B1",Salute:"#5DCAA5",Abbonamenti:"#B4B2A9",Lavoro:"#97C459",Regalo:"#ED93B1",Rimborso:"#5DCAA5",Altro:"#B4B2A9"}
const CAT_BG: Record<string,string> = {Cibo:"#4A1B0C",Trasporti:"#042C53",Svago:"#26215C",Casa:"#412402",Shopping:"#4B1528",Salute:"#04342C",Abbonamenti:"#2C2C2A",Lavoro:"#173404",Regalo:"#4B1528",Rimborso:"#04342C",Altro:"#2C2C2A"}
const CAT_BG_LIGHT: Record<string,string> = {Cibo:"#FAECE7",Trasporti:"#E6F1FB",Svago:"#EEEDFE",Casa:"#FAEEDA",Shopping:"#FBEAF0",Salute:"#E1F5EE",Abbonamenti:"#F1EFE8",Lavoro:"#EAF3DE",Regalo:"#FBEAF0",Rimborso:"#E1F5EE",Altro:"#F1EFE8"}

const BATTUTE_50 = [
  
"Benjamin Netanyahu ti sta osservando con invidia.",
  "Lo Stato italiano vuole già il 22% di questa roba. Goditi il resto.",
  "Meloni ha appena firmato un decreto per tassare anche questa entrata. Congratulazioni.",
  "Pasquale Manna ha guadagnato meno di te oggi. Storico.",
  "Sei ufficialmente più ricco di ieri. Durerà poco, ma goditela.",
  "Il fisco ha già aperto un occhio. Buona fortuna.",
  "Hai guadagnato. Ora il tuo cervello ti convincerà che puoi permetterti cose che non puoi.",
  "Questo è il momento in cui ti senti ricco. Dura tipo due giorni.",
  "Ora puoi abbonarti all'Onlyfans della tua celebrity crush fallita preferita"
]
const BATTUTE_200 = [
  "Pasquale Manna sta guardando il tuo saldo e piange.",
  "Complimenti. Ora vai a spenderli tutti in droga e poi piangi sul divano.",
  "Il commercialista di Meloni ha sentito una perturbazione nella forza.",
  "Stai andando forte. Peccato che Benjamin Netanyahu li vuole tutti per se.",
  "Con questi soldi potresti pagare 9 mesi di abbonamento Netflix. Oppure un abbonamento ad una onlyfanser scadente.",
  "Il governo italiano ha già un piano per come spendere questa cifra al posto tuo.",
]
const BATTUTE_USCITA = [
  "Classico. Hai lavorato una settimana per svuotare il conto in un pomeriggio.",
  "L'IVA ringrazia. Tu no.",
  "Questa spesa è stata approvata da Giorgia Meloni — lei approva qualsiasi cosa ti faccia stare peggio.",
  "Bello andarsene così. Domani ti arrabbi con te stesso, oggi è già fatto.",
  "Spesa registrata. Il tuo conto ti guarda come un cane abbandonato.",
  "Complimenti, hai appena finanziato l'economia italiana. Di niente.",
  "Questa uscita è stata silenziosa ma devastante. Come un tradimento.",
  "Soldi andati. Almeno sai di non essere un fallito, forse",
  "stai diventando povero come lo Stato Italiano bro..."
]
const BATTUTE_ROSSO = [
  "Tecnicamente sei più povero dello Stato italiano. E lo Stato italiano è messo malissimo.",
  "Pasquale Manna ha più soldi di te in questo momento. Fatti una domanda.",
  "Sei in rosso. Anche l'app sta cercando di non dirtelo in modo brutale. Ci ha provato.",
  "Il tuo conto ha mandato una mail di dimissioni. Non è andata bene.",
  "Saldo negativo registrato. Respira. Ce la fai. Forse.",
]

function randomBattuta(tipo: 'entrata50'|'entrata200'|'uscita'|'rosso') {
  const map = {entrata50:BATTUTE_50,entrata200:BATTUTE_200,uscita:BATTUTE_USCITA,rosso:BATTUTE_ROSSO}
  const arr = map[tipo]
  return arr[Math.floor(Math.random()*arr.length)]
}

function fmt(n: number){return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n||0)}
function today(){return new Date().toISOString().split("T")[0]}
function fmtDate(d: string){if(!d)return"";return new Date(d+"T00:00:00").toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"})}

interface Account{id:string;name:string;balance:number;iban?:string;card_last4?:string;card_circuit?:string}
interface Transaction{id:string;account_id:string;amount:number;type:string;category:string;note:string;date:string}

const V = {
  purple: '#7F77DD',
  purpleLight: '#AFA9EC',
  purpleDark: '#26215C',
  purpleBg: '#EEEDFE',
  bgDark: '#0E0E12',
  surfaceDark: '#1A1A24',
  surface2Dark: '#22222E',
  borderDark: 'rgba(127,119,221,0.15)',
  bgLight: '#F7F7FB',
  surfaceLight: '#FFFFFF',
  surface2Light: '#EEEDFE',
  borderLight: 'rgba(127,119,221,0.2)',
  green: '#5DCAA5',
  greenDark: '#0F6E56',
  red: '#F0997B',
  redDark: '#993C1D',
  text: '#FFFFFF',
  textMuted: 'rgba(255,255,255,0.45)',
  textLight: '#0E0E12',
  textMutedLight: 'rgba(14,14,18,0.45)',
}

export default function Dashboard() {
  const [view, setView] = useState('home')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [battuta, setBattuta] = useState('')
  const [showBattuta, setShowBattuta] = useState(false)
  const [form, setForm] = useState({type:'uscita',amount:'',accountId:'',category:'Cibo',note:'',date:today()})
  const [formErr, setFormErr] = useState('')
  const [search, setSearch] = useState('')
  const [filterAcc, setFilterAcc] = useState('Tutti')
  const [filterType, setFilterType] = useState('Tutti')
  const [userName, setUserName] = useState('')
  const [dark, setDark] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(()=>{
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  },[])

  useEffect(()=>{loadData()},[])

  async function loadData(){
    const {data:{user}} = await supabase.auth.getUser()
    if(!user){router.push('/login');return}
    const {data:profile} = await supabase.from('profiles').select('*').eq('id',user.id).single()
    if(profile) setUserName(profile.full_name||profile.email||'')
    const {data:accs} = await supabase.from('accounts').select('*').eq('user_id',user.id).order('created_at')
    if(accs&&accs.length>0){
      setAccounts(accs)
      setForm(f=>({...f,accountId:accs[0].id}))
    } else {
      const defaultAccs=[
        {name:'BancoPosta',type:'card',balance:0,color:'#185FA5'},
        {name:'Revolut',type:'card',balance:0,color:'#0F6E56'},
        {name:'Contanti',type:'cash',balance:0,color:'#534AB7'},
      ]
      const {data:newAccs} = await supabase.from('accounts').insert(defaultAccs.map(a=>({...a,user_id:user.id}))).select()
      if(newAccs){setAccounts(newAccs);setForm(f=>({...f,accountId:newAccs[0].id}))}
    }
    const {data:txs} = await supabase.from('transactions').select('*').eq('user_id',user.id).order('date',{ascending:false})
    if(txs) setTransactions(txs)
    setLoading(false)
  }

  async function addTransaction(){
    const amount = parseFloat(form.amount)
    if(!amount||amount<=0){setFormErr('Inserisci un importo valido');return}
    const {data:{user}} = await supabase.auth.getUser()
    if(!user) return
    const {data:tx} = await supabase.from('transactions').insert({
      user_id:user.id,account_id:form.accountId,amount,type:form.type,
      category:form.category,note:form.note,date:form.date
    }).select().single()
    const delta = form.type==='entrata'?amount:-amount
    const acc = accounts.find(a=>a.id===form.accountId)
    await supabase.from('accounts').update({balance:(acc?.balance||0)+delta}).eq('id',form.accountId)
    if(tx) setTransactions(prev=>[tx,...prev])
    setAccounts(prev=>prev.map(a=>a.id===form.accountId?{...a,balance:a.balance+delta}:a))
    const newTotal = accounts.reduce((s,a)=>s+(a.id===form.accountId?a.balance+delta:a.balance),0)
    if(newTotal<0){
      setBattuta(randomBattuta('rosso'));setShowBattuta(true);setTimeout(()=>setShowBattuta(false),5000)
    } else if(form.type==='entrata'&&amount>=200){
      setBattuta(randomBattuta('entrata200'));setShowBattuta(true);setTimeout(()=>setShowBattuta(false),5000)
    } else if(form.type==='entrata'&&amount>=50){
      setBattuta(randomBattuta('entrata50'));setShowBattuta(true);setTimeout(()=>setShowBattuta(false),5000)
    } else if(form.type==='uscita'&&amount>=50){
      setBattuta(randomBattuta('uscita'));setShowBattuta(true);setTimeout(()=>setShowBattuta(false),5000)
    }
    setShowForm(false);setFormErr('')
    setForm({type:'uscita',amount:'',accountId:form.accountId,category:'Cibo',note:'',date:today()})
  }

  async function deleteTransaction(tx: Transaction){
    await supabase.from('transactions').delete().eq('id',tx.id)
    const delta = tx.type==='entrata'?-tx.amount:tx.amount
    const acc = accounts.find(a=>a.id===tx.account_id)
    await supabase.from('accounts').update({balance:(acc?.balance||0)+delta}).eq('id',tx.account_id)
    setTransactions(prev=>prev.filter(t=>t.id!==tx.id))
    setAccounts(prev=>prev.map(a=>a.id===tx.account_id?{...a,balance:a.balance+delta}:a))
  }

  async function handleLogout(){
    await supabase.auth.signOut()
    router.push('/login')
  }

  const total = accounts.reduce((s,a)=>s+a.balance,0)
  const totalIn = transactions.filter(t=>t.type==='entrata').reduce((s,t)=>s+t.amount,0)
  const totalOut = transactions.filter(t=>t.type==='uscita').reduce((s,t)=>s+t.amount,0)
  const filtered = transactions.filter(tx=>{
    const q = search.toLowerCase()
    return(!q||tx.note?.toLowerCase().includes(q)||tx.category.toLowerCase().includes(q))&&
      (filterAcc==='Tutti'||tx.account_id===filterAcc)&&
      (filterType==='Tutti'||tx.type===filterType)
  })

  const bg = dark?V.bgDark:V.bgLight
  const surface = dark?V.surfaceDark:V.surfaceLight
  const surface2 = dark?V.surface2Dark:V.surface2Light
  const border = dark?V.borderDark:V.borderLight
  const txt = dark?V.text:V.textLight
  const txtMuted = dark?V.textMuted:V.textMutedLight
  const catBgMap = dark?CAT_BG:CAT_BG_LIGHT

  const tabStyle = (v:string) => ({
    flex:1,padding:'12px 6px',border:'none',background:'transparent',
    color:view===v?V.purple:txtMuted,fontSize:13,
    fontFamily:'-apple-system,BlinkMacSystemFont,SF Pro Display,Segoe UI,sans-serif',
    cursor:'pointer',borderBottom:view===v?`2px solid ${V.purple}`:'2px solid transparent',
    marginBottom:-1,fontWeight:view===v?500:400,letterSpacing:'0.01em',transition:'all 0.2s'
  })

  const pillStyle = (active:boolean) => ({
    padding:'5px 13px',borderRadius:20,border:`1px solid ${active?V.purple:border}`,
    background:active?V.purple:'transparent',color:active?'#fff':txtMuted,
    fontSize:12,fontFamily:'-apple-system,BlinkMacSystemFont,sans-serif',
    cursor:'pointer',whiteSpace:'nowrap' as const,transition:'all 0.2s'
  })

  if(loading) return(
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:bg}}>
      <div style={{textAlign:'center'}}>
        <div style={{width:36,height:36,borderRadius:10,background:V.purple,display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,fontWeight:700,color:'#fff',margin:'0 auto 12px'}}>M</div>
        <p style={{color:txtMuted,fontSize:13,letterSpacing:'0.05em'}}>caricamento...</p>
      </div>
    </div>
  )

  return(
    <div style={{minHeight:'100vh',background:bg,color:txt,fontFamily:'-apple-system,BlinkMacSystemFont,SF Pro Display,Segoe UI,sans-serif',transition:'background 0.3s'}}>
      <div style={{maxWidth:520,margin:'0 auto',paddingBottom:'5rem'}}>

        {/* Topbar */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'24px 20px 0',marginBottom:24}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:30,height:30,borderRadius:8,background:V.purple,display:'flex',alignItems:'center',justifyContent:'center',fontSize:16,fontWeight:700,color:'#fff',letterSpacing:'-0.5px'}}>M</div>
            <span style={{fontSize:18,fontWeight:300,letterSpacing:'-0.5px',color:txt}}>manto</span>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:16}}>
            <span style={{fontSize:13,color:txtMuted}}>ciao, {userName.split(' ')[0]}</span>
            <button onClick={handleLogout} style={{fontSize:12,background:'none',border:`1px solid ${border}`,color:txtMuted,cursor:'pointer',padding:'5px 12px',borderRadius:20,fontFamily:'inherit',transition:'all 0.2s'}}>esci</button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:`1px solid ${border}`,margin:'0 20px 24px'}}>
          <button style={tabStyle('home')} onClick={()=>setView('home')}>panoramica</button>
          <button style={tabStyle('movimenti')} onClick={()=>setView('movimenti')}>movimenti</button>
        </div>

        {/* BATTUTA */}
        {showBattuta&&(
          <div style={{margin:'0 20px 20px',padding:'12px 16px',background:V.purple,borderRadius:10,fontSize:13,color:'#fff',letterSpacing:'0.01em',animation:'fadeIn 0.3s ease'}}>
            {battuta}
          </div>
        )}

        {/* HOME */}
        {view==='home'&&(
          <div style={{padding:'0 20px'}}>
            <div style={{background:surface,border:`1px solid ${border}`,borderRadius:16,padding:'24px 20px',marginBottom:20,textAlign:'center'}}>
              <p style={{fontSize:11,color:txtMuted,letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>patrimonio totale</p>
              <p style={{fontSize:42,fontWeight:300,letterSpacing:'-1.5px',lineHeight:1,color:txt}}>{fmt(total)}</p>
              <div style={{display:'flex',justifyContent:'center',gap:20,marginTop:14}}>
                <span style={{fontSize:13,color:V.green}}>+{fmt(totalIn)}</span>
                <span style={{fontSize:13,color:V.red}}>-{fmt(totalOut)}</span>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:24}}>
              {accounts.map(acc=>(
                <div key={acc.id} style={{background:surface,border:`1px solid ${border}`,borderRadius:12,padding:'14px 12px',transition:'border-color 0.2s'}}>
                  <div style={{width:5,height:5,borderRadius:'50%',background:V.purple,marginBottom:10}}/>
                  <p style={{fontSize:10,color:txtMuted,marginBottom:5,letterSpacing:'0.04em',textTransform:'uppercase'}}>{acc.name}</p>
                  <p style={{fontSize:15,fontWeight:500,letterSpacing:'-0.3px',color:txt}}>{fmt(acc.balance)}</p>
                </div>
              ))}
            </div>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <p style={{fontSize:10,color:txtMuted,letterSpacing:'0.1em',textTransform:'uppercase'}}>movimenti recenti</p>
              {transactions.length>5&&<button onClick={()=>setView('movimenti')} style={{fontSize:12,background:'none',border:'none',color:V.purple,cursor:'pointer',fontFamily:'inherit'}}>vedi tutti →</button>}
            </div>

            {transactions.length===0
              ?<div style={{textAlign:'center',padding:'40px 0',color:txtMuted,fontSize:14}}>nessun movimento ancora</div>
              :transactions.slice(0,5).map(tx=>{
                const acc=accounts.find(a=>a.id===tx.account_id)
                const isIn=tx.type==='entrata'
                return(
                  <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:`1px solid ${border}`,transition:'opacity 0.2s'}}>
                    <div style={{width:34,height:34,borderRadius:9,background:catBgMap[tx.category]||'#26215C',color:CAT_COLOR[tx.category]||'#AFA9EC',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,flexShrink:0,letterSpacing:'0.02em'}}>
                      {tx.category.substring(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:14,fontWeight:400,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:txt}}>{tx.note||tx.category}</p>
                      <p style={{fontSize:11,color:txtMuted,marginTop:3}}>{fmtDate(tx.date)} · {acc?.name||''}</p>
                    </div>
                    <p style={{fontSize:14,fontWeight:500,color:isIn?V.green:V.red,flexShrink:0,letterSpacing:'-0.3px'}}>{isIn?'+':'-'}{fmt(tx.amount)}</p>
                    <button onClick={()=>deleteTransaction(tx)} style={{background:'none',border:'none',color:txtMuted,fontSize:18,cursor:'pointer',padding:'0 2px',transition:'color 0.15s'}}>×</button>
                  </div>
                )
              })
            }
          </div>
        )}

        {/* MOVIMENTI */}
        {view==='movimenti'&&(
          <div style={{padding:'0 20px'}}>
            <input type="text" placeholder="cerca..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:'100%',padding:'11px 14px',border:`1px solid ${border}`,borderRadius:10,fontSize:14,fontFamily:'inherit',background:surface,color:txt,outline:'none',marginBottom:12,letterSpacing:'0.01em'}}/>
            <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:10,paddingBottom:2}}>
              {['Tutti','entrata','uscita'].map(t=><button key={t} style={pillStyle(filterType===t)} onClick={()=>setFilterType(t)}>{t==='Tutti'?'tutti':t==='entrata'?'entrate':'uscite'}</button>)}
            </div>
            <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:20,paddingBottom:2}}>
              <button style={pillStyle(filterAcc==='Tutti')} onClick={()=>setFilterAcc('Tutti')}>tutti i conti</button>
              {accounts.map(a=><button key={a.id} style={pillStyle(filterAcc===a.id)} onClick={()=>setFilterAcc(a.id)}>{a.name}</button>)}
            </div>
            {filtered.length===0
              ?<div style={{textAlign:'center',padding:'40px 0',color:txtMuted,fontSize:14}}>nessun movimento trovato</div>
              :filtered.map(tx=>{
                const acc=accounts.find(a=>a.id===tx.account_id)
                const isIn=tx.type==='entrata'
                return(
                  <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:`1px solid ${border}`}}>
                    <div style={{width:34,height:34,borderRadius:9,background:catBgMap[tx.category]||'#26215C',color:CAT_COLOR[tx.category]||'#AFA9EC',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:600,flexShrink:0}}>
                      {tx.category.substring(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',color:txt}}>{tx.note||tx.category}</p>
                      <p style={{fontSize:11,color:txtMuted,marginTop:3}}>{fmtDate(tx.date)} · {acc?.name||''}</p>
                    </div>
                    <p style={{fontSize:14,fontWeight:500,color:isIn?V.green:V.red,flexShrink:0}}>{isIn?'+':'-'}{fmt(tx.amount)}</p>
                    <button onClick={()=>deleteTransaction(tx)} style={{background:'none',border:'none',color:txtMuted,fontSize:18,cursor:'pointer',padding:'0 2px'}}>×</button>
                  </div>
                )
              })
            }
          </div>
        )}

        {/* FORM MODAL */}
        {showForm&&(
          <div onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center',backdropFilter:'blur(4px)'}}>
            <div style={{background:dark?V.surfaceDark:V.surfaceLight,borderRadius:'16px 16px 0 0',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',padding:'16px 20px 40px',border:`1px solid ${border}`,borderBottom:'none'}}>
              <div style={{width:36,height:4,background:border,borderRadius:2,margin:'0 auto 22px'}}/>

              <div style={{display:'flex',border:`1px solid ${border}`,borderRadius:10,overflow:'hidden',marginBottom:20}}>
                {['uscita','entrata'].map(t=>(
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t,category:t==='entrata'?'Lavoro':'Cibo'}))}
                    style={{flex:1,padding:13,border:'none',cursor:'pointer',fontSize:14,fontFamily:'inherit',fontWeight:500,
                      background:form.type===t?(t==='entrata'?'#1D9E75':'#D85A30'):(dark?V.surface2Dark:V.surface2Light),
                      color:form.type===t?'white':txtMuted,transition:'all 0.2s',letterSpacing:'0.01em'}}>
                    {t==='entrata'?'+ entrata':'- uscita'}
                  </button>
                ))}
              </div>

              {[
                {label:'importo (€)',type:'number',val:form.amount,onChange:(v:string)=>setForm(f=>({...f,amount:v})),style:{fontSize:22,fontWeight:300,letterSpacing:'-0.5px'},placeholder:'0,00'},
              ].map(f=>(
                <div key={f.label} style={{marginBottom:16}}>
                  <label style={{fontSize:10,color:txtMuted,letterSpacing:'0.08em',textTransform:'uppercase',display:'block',marginBottom:6}}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={f.val} onChange={e=>f.onChange(e.target.value)}
                    style={{width:'100%',padding:'11px 14px',border:`1px solid ${border}`,borderRadius:10,fontFamily:'inherit',background:dark?V.surface2Dark:V.surface2Light,color:txt,outline:'none',...f.style}}/>
                </div>
              ))}
              {formErr&&<p style={{fontSize:12,color:V.red,marginBottom:12}}>{formErr}</p>}

              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,color:txtMuted,letterSpacing:'0.08em',textTransform:'uppercase',display:'block',marginBottom:6}}>conto</label>
                <select value={form.accountId} onChange={e=>setForm(f=>({...f,accountId:e.target.value}))}
                  style={{width:'100%',padding:'11px 14px',border:`1px solid ${border}`,borderRadius:10,fontSize:14,fontFamily:'inherit',background:dark?V.surface2Dark:V.surface2Light,color:txt,outline:'none'}}>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,color:txtMuted,letterSpacing:'0.08em',textTransform:'uppercase',display:'block',marginBottom:8}}>categoria</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                  {(form.type==='uscita'?CATS_OUT:CATS_IN).map(cat=>(
                    <button key={cat} onClick={()=>setForm(f=>({...f,category:cat}))}
                      style={{padding:'6px 13px',borderRadius:20,border:`1px solid ${form.category===cat?V.purple:border}`,fontSize:12,fontFamily:'inherit',cursor:'pointer',
                        background:form.category===cat?V.purple:(dark?V.surface2Dark:'transparent'),
                        color:form.category===cat?'white':txtMuted,transition:'all 0.15s'}}>
                      {cat.toLowerCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontSize:10,color:txtMuted,letterSpacing:'0.08em',textTransform:'uppercase',display:'block',marginBottom:6}}>nota (opzionale)</label>
                <input type="text" placeholder="es. spesa al supermercato..." value={form.note} onChange={e=>setForm(f=>({...f,note:e.target.value}))}
                  style={{width:'100%',padding:'11px 14px',border:`1px solid ${border}`,borderRadius:10,fontSize:14,fontFamily:'inherit',background:dark?V.surface2Dark:V.surface2Light,color:txt,outline:'none'}}/>
              </div>

              <div style={{marginBottom:24}}>
                <label style={{fontSize:10,color:txtMuted,letterSpacing:'0.08em',textTransform:'uppercase',display:'block',marginBottom:6}}>data</label>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                  style={{width:'100%',padding:'11px 14px',border:`1px solid ${border}`,borderRadius:10,fontSize:14,fontFamily:'inherit',background:dark?V.surface2Dark:V.surface2Light,color:txt,outline:'none'}}/>
              </div>

              <button onClick={addTransaction}
                style={{width:'100%',padding:14,fontSize:15,fontFamily:'inherit',fontWeight:500,border:'none',borderRadius:10,
                  background:form.type==='entrata'?'#1D9E75':'#D85A30',color:'white',cursor:'pointer',letterSpacing:'0.01em',transition:'opacity 0.15s'}}>
                aggiungi {form.type}
              </button>
            </div>
          </div>
        )}

        {/* FAB */}
        <button onClick={()=>setShowForm(true)}
          style={{position:'fixed',bottom:28,right:28,width:56,height:56,borderRadius:'50%',background:V.purple,color:'white',border:'none',fontSize:28,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 24px ${V.purple}66`,cursor:'pointer',zIndex:50,fontWeight:300,transition:'transform 0.15s,box-shadow 0.15s'}}>
          +
        </button>

      </div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}