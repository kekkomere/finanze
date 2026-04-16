'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

const CATS_OUT = ["Cibo","Trasporti","Svago","Casa","Shopping","Salute","Abbonamenti","Altro"]
const CATS_IN = ["Lavoro","Regalo","Rimborso","Altro"]
const CAT_COLOR: Record<string,string> = {Cibo:"#D85A30",Trasporti:"#378ADD",Svago:"#7F77DD",Casa:"#BA7517",Shopping:"#D4537E",Salute:"#1D9E75",Abbonamenti:"#888780",Lavoro:"#3B6D11",Regalo:"#D4537E",Rimborso:"#1D9E75",Altro:"#888780"}
const CAT_BG: Record<string,string> = {Cibo:"#FAECE7",Trasporti:"#E6F1FB",Svago:"#EEEDFE",Casa:"#FAEEDA",Shopping:"#FBEAF0",Salute:"#E1F5EE",Abbonamenti:"#F1EFE8",Lavoro:"#EAF3DE",Regalo:"#FBEAF0",Rimborso:"#E1F5EE",Altro:"#F1EFE8"}
const ACC_DOT: Record<string,string> = {bancoposta:"#185FA5",revolut:"#0F6E56",contanti:"#534AB7"}
const ACC_BG: Record<string,string> = {bancoposta:"#E6F1FB",revolut:"#E1F5EE",contanti:"#EEEDFE"}

const BATTUTE_ENTRATA = [
  "Ohh guarda chi ha trovato soldi! 🎉",
  "Stai diventando ricco! (quasi)",
  "Il conto sorride, tu dovresti farlo di più",
  "Entrata registrata. Ora non sperderla subito.",
  "Bella busta! Ce la fai a non spenderla in 24 ore?",
]

function fmt(n: number) { return new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(n||0) }
function today() { return new Date().toISOString().split("T")[0] }
function fmtDate(d: string) { if(!d)return""; return new Date(d+"T00:00:00").toLocaleDateString("it-IT",{day:"2-digit",month:"short",year:"numeric"}) }
function randomBattuta() { return BATTUTE_ENTRATA[Math.floor(Math.random()*BATTUTE_ENTRATA.length)] }

interface Account { id: string; name: string; balance: number; iban?: string; card_last4?: string; card_circuit?: string }
interface Transaction { id: string; account_id: string; amount: number; type: string; category: string; note: string; date: string }

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
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (profile) setUserName(profile.full_name || profile.email || '')

    const { data: accs } = await supabase.from('accounts').select('*').eq('user_id', user.id).order('created_at')
    if (accs && accs.length > 0) {
      setAccounts(accs)
      setForm(f => ({...f, accountId: accs[0].id}))
    } else {
      const defaultAccs = [
        {name:'BancoPosta',type:'card',balance:0,color:'#185FA5'},
        {name:'Revolut',type:'card',balance:0,color:'#0F6E56'},
        {name:'Contanti',type:'cash',balance:0,color:'#534AB7'},
      ]
      const { data: newAccs } = await supabase.from('accounts').insert(defaultAccs.map(a=>({...a,user_id:user.id}))).select()
      if (newAccs) { setAccounts(newAccs); setForm(f=>({...f,accountId:newAccs[0].id})) }
    }

    const { data: txs } = await supabase.from('transactions').select('*').eq('user_id', user.id).order('date', {ascending:false})
    if (txs) setTransactions(txs)
    setLoading(false)
  }

  async function addTransaction() {
    const amount = parseFloat(form.amount)
    if (!amount || amount <= 0) { setFormErr('Inserisci un importo valido'); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: tx } = await supabase.from('transactions').insert({
      user_id: user.id, account_id: form.accountId, amount, type: form.type,
      category: form.category, note: form.note, date: form.date
    }).select().single()

    const delta = form.type === 'entrata' ? amount : -amount
    await supabase.from('accounts').update({balance: (accounts.find(a=>a.id===form.accountId)?.balance||0) + delta})
      .eq('id', form.accountId)

    if (tx) setTransactions(prev => [tx, ...prev])
    setAccounts(prev => prev.map(a => a.id === form.accountId ? {...a, balance: a.balance + delta} : a))

    if (form.type === 'entrata' && amount >= 50) {
      setBattuta(randomBattuta())
      setShowBattuta(true)
      setTimeout(() => setShowBattuta(false), 4000)
    }

    setShowForm(false)
    setFormErr('')
    setForm({type:'uscita',amount:'',accountId:form.accountId,category:'Cibo',note:'',date:today()})
  }

  async function deleteTransaction(tx: Transaction) {
    await supabase.from('transactions').delete().eq('id', tx.id)
    const delta = tx.type === 'entrata' ? -tx.amount : tx.amount
    await supabase.from('accounts').update({balance: (accounts.find(a=>a.id===tx.account_id)?.balance||0) + delta}).eq('id', tx.account_id)
    setTransactions(prev => prev.filter(t => t.id !== tx.id))
    setAccounts(prev => prev.map(a => a.id === tx.account_id ? {...a, balance: a.balance + delta} : a))
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const total = accounts.reduce((s,a) => s + a.balance, 0)
  const totalIn = transactions.filter(t=>t.type==='entrata').reduce((s,t)=>s+t.amount,0)
  const totalOut = transactions.filter(t=>t.type==='uscita').reduce((s,t)=>s+t.amount,0)
  const filtered = transactions.filter(tx => {
    const q = search.toLowerCase()
    return (!q || tx.note?.toLowerCase().includes(q) || tx.category.toLowerCase().includes(q)) &&
      (filterAcc==='Tutti' || tx.account_id===filterAcc) &&
      (filterType==='Tutti' || tx.type===filterType)
  })

  const s = { fontFamily:'Georgia,serif', minHeight:'100vh', background:'#FAFAF8', color:'#1A1917' }
  const tabS = (v:string) => ({ flex:1,padding:'12px 6px',border:'none',background:'transparent',
    color:view===v?'#1A1917':'#6B6963',fontSize:13,fontFamily:'Georgia,serif',cursor:'pointer',
    borderBottom:view===v?'2px solid #1A1917':'2px solid transparent',marginBottom:-1,
    fontStyle:view===v?'italic':'normal' as const })
  const pillS = (active:boolean) => ({ padding:'5px 13px',borderRadius:20,border:'1px solid #D0CEC5',
    background:active?'#1A1917':'transparent',color:active?'#FAFAF8':'#6B6963',
    fontSize:12,fontFamily:'Georgia,serif',cursor:'pointer',whiteSpace:'nowrap' as const })

  if (loading) return <div style={{...s,display:'flex',alignItems:'center',justifyContent:'center'}}><p style={{color:'#A8A49E',fontStyle:'italic'}}>Caricamento...</p></div>

  return (
    <div style={s}>
      <div style={{maxWidth:520,margin:'0 auto',paddingBottom:'5rem'}}>

        {/* Topbar */}
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'20px 20px 0',marginBottom:24}}>
          <h1 style={{fontSize:20,fontWeight:'normal',letterSpacing:'-0.02em'}}>Ciao, {userName.split(' ')[0]} 👋</h1>
          <button onClick={handleLogout} style={{fontSize:12,background:'none',border:'none',color:'#A8A49E',cursor:'pointer',fontFamily:'Georgia,serif'}}>Esci</button>
        </div>

        {/* Tabs */}
        <div style={{display:'flex',borderBottom:'1px solid #E5E3DC',margin:'0 20px 24px'}}>
          <button style={tabS('home')} onClick={()=>setView('home')}>Panoramica</button>
          <button style={tabS('movimenti')} onClick={()=>setView('movimenti')}>Movimenti</button>
        </div>

        {/* HOME */}
        {view==='home' && (
          <div style={{padding:'0 20px'}}>
            <div style={{textAlign:'center',marginBottom:28,padding:'28px 20px',background:'white',border:'1px solid #E5E3DC',borderRadius:12}}>
              <p style={{fontSize:11,color:'#A8A49E',letterSpacing:'0.1em',textTransform:'uppercase',marginBottom:8}}>Patrimonio totale</p>
              <p style={{fontSize:44,letterSpacing:'-0.03em',lineHeight:1}}>{fmt(total)}</p>
              <div style={{display:'flex',justifyContent:'center',gap:24,marginTop:14}}>
                <span style={{fontSize:13,color:'#0F6E56'}}>+{fmt(totalIn)} entrate</span>
                <span style={{fontSize:13,color:'#993C1D'}}>-{fmt(totalOut)} uscite</span>
              </div>
            </div>

            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:24}}>
              {accounts.map(acc => (
                <div key={acc.id} style={{background:'white',border:'1px solid #E5E3DC',borderRadius:8,padding:'14px 12px'}}>
                  <div style={{width:6,height:6,borderRadius:'50%',background:ACC_DOT[acc.name.toLowerCase()]||'#888',marginBottom:10}}/>
                  <p style={{fontSize:11,color:'#6B6963',marginBottom:5}}>{acc.name}</p>
                  <p style={{fontSize:16,letterSpacing:'-0.02em'}}>{fmt(acc.balance)}</p>
                </div>
              ))}
            </div>

            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <p style={{fontSize:11,color:'#A8A49E',letterSpacing:'0.1em',textTransform:'uppercase'}}>Movimenti recenti</p>
              {transactions.length>5 && <button onClick={()=>setView('movimenti')} style={{fontSize:12,background:'none',border:'none',color:'#A8A49E',cursor:'pointer',fontFamily:'Georgia,serif',fontStyle:'italic'}}>Vedi tutti →</button>}
            </div>

            {transactions.length===0
              ? <div style={{textAlign:'center',padding:'40px 0',color:'#A8A49E',fontStyle:'italic',fontSize:14}}>Nessun movimento ancora</div>
              : transactions.slice(0,5).map(tx => {
                const acc = accounts.find(a=>a.id===tx.account_id)
                const isIn = tx.type==='entrata'
                return (
                  <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #E5E3DC'}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:CAT_BG[tx.category]||'#F1EFE8',color:CAT_COLOR[tx.category]||'#888',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:'bold',flexShrink:0}}>
                      {tx.category.substring(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tx.note||tx.category}</p>
                      <p style={{fontSize:11,color:'#A8A49E',marginTop:3}}>{fmtDate(tx.date)} · {acc?.name||''}</p>
                    </div>
                    <p style={{fontSize:14,fontStyle:'italic',color:isIn?'#0F6E56':'#993C1D',flexShrink:0}}>{isIn?'+':'-'}{fmt(tx.amount)}</p>
                    <button onClick={()=>deleteTransaction(tx)} style={{background:'none',border:'none',color:'#A8A49E',fontSize:18,cursor:'pointer',padding:'0 2px'}}>×</button>
                  </div>
                )
              })
            }
          </div>
        )}

        {/* MOVIMENTI */}
        {view==='movimenti' && (
          <div style={{padding:'0 20px'}}>
            <input type="text" placeholder="Cerca..." value={search} onChange={e=>setSearch(e.target.value)}
              style={{width:'100%',padding:'11px 14px',border:'1px solid #D0CEC5',borderRadius:8,fontSize:14,fontFamily:'Georgia,serif',marginBottom:12,background:'white',color:'#1A1917',outline:'none'}}/>
            <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:10,paddingBottom:2}}>
              {['Tutti','entrata','uscita'].map(t=><button key={t} style={pillS(filterType===t)} onClick={()=>setFilterType(t)}>{t==='Tutti'?'Tutti':t==='entrata'?'Entrate':'Uscite'}</button>)}
            </div>
            <div style={{display:'flex',gap:6,overflowX:'auto',marginBottom:20,paddingBottom:2}}>
              <button style={pillS(filterAcc==='Tutti')} onClick={()=>setFilterAcc('Tutti')}>Tutti i conti</button>
              {accounts.map(a=><button key={a.id} style={pillS(filterAcc===a.id)} onClick={()=>setFilterAcc(a.id)}>{a.name}</button>)}
            </div>
            {filtered.length===0
              ? <div style={{textAlign:'center',padding:'40px 0',color:'#A8A49E',fontStyle:'italic',fontSize:14}}>Nessun movimento trovato</div>
              : filtered.map(tx => {
                const acc = accounts.find(a=>a.id===tx.account_id)
                const isIn = tx.type==='entrata'
                return (
                  <div key={tx.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 0',borderBottom:'1px solid #E5E3DC'}}>
                    <div style={{width:34,height:34,borderRadius:'50%',background:CAT_BG[tx.category]||'#F1EFE8',color:CAT_COLOR[tx.category]||'#888',display:'flex',alignItems:'center',justifyContent:'center',fontSize:11,fontWeight:'bold',flexShrink:0}}>
                      {tx.category.substring(0,2).toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:14,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{tx.note||tx.category}</p>
                      <p style={{fontSize:11,color:'#A8A49E',marginTop:3}}>{fmtDate(tx.date)} · {acc?.name||''}</p>
                    </div>
                    <p style={{fontSize:14,fontStyle:'italic',color:isIn?'#0F6E56':'#993C1D',flexShrink:0}}>{isIn?'+':'-'}{fmt(tx.amount)}</p>
                    <button onClick={()=>deleteTransaction(tx)} style={{background:'none',border:'none',color:'#A8A49E',fontSize:18,cursor:'pointer',padding:'0 2px'}}>×</button>
                  </div>
                )
              })
            }
          </div>
        )}

        {/* FORM MODAL */}
        {showForm && (
          <div onClick={e=>{if(e.target===e.currentTarget)setShowForm(false)}}
            style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.38)',zIndex:100,display:'flex',alignItems:'flex-end',justifyContent:'center'}}>
            <div style={{background:'#FAFAF8',borderRadius:'12px 12px 0 0',width:'100%',maxWidth:520,maxHeight:'90vh',overflowY:'auto',padding:'16px 20px 40px'}}>
              <div style={{width:36,height:4,background:'#D0CEC5',borderRadius:2,margin:'0 auto 22px'}}/>

              <div style={{display:'flex',border:'1px solid #D0CEC5',borderRadius:8,overflow:'hidden',marginBottom:20}}>
                {['uscita','entrata'].map(t=>(
                  <button key={t} onClick={()=>setForm(f=>({...f,type:t,category:t==='entrata'?'Lavoro':'Cibo'}))}
                    style={{flex:1,padding:13,border:'none',cursor:'pointer',fontSize:14,fontFamily:'Georgia,serif',fontStyle:'italic',
                      background:form.type===t?(t==='entrata'?'#1D9E75':'#D85A30'):'transparent',
                      color:form.type===t?'white':'#6B6963'}}>
                    {t==='entrata'?'+ Entrata':'- Uscita'}
                  </button>
                ))}
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,color:'#6B6963',letterSpacing:'0.06em',textTransform:'uppercase',display:'block',marginBottom:6}}>Importo (€)</label>
                <input type="number" step="0.01" min="0" placeholder="0,00" value={form.amount}
                  onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                  style={{width:'100%',padding:'11px 14px',border:'1px solid #D0CEC5',borderRadius:8,fontSize:22,fontFamily:'Georgia,serif',background:'white',color:'#1A1917',outline:'none'}}/>
                {formErr && <p style={{fontSize:12,color:'#993C1D',marginTop:5}}>{formErr}</p>}
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,color:'#6B6963',letterSpacing:'0.06em',textTransform:'uppercase',display:'block',marginBottom:6}}>Conto</label>
                <select value={form.accountId} onChange={e=>setForm(f=>({...f,accountId:e.target.value}))}
                  style={{width:'100%',padding:'11px 14px',border:'1px solid #D0CEC5',borderRadius:8,fontSize:14,fontFamily:'Georgia,serif',background:'white',color:'#1A1917',outline:'none'}}>
                  {accounts.map(a=><option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,color:'#6B6963',letterSpacing:'0.06em',textTransform:'uppercase',display:'block',marginBottom:8}}>Categoria</label>
                <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                  {(form.type==='uscita'?CATS_OUT:CATS_IN).map(cat=>(
                    <button key={cat} onClick={()=>setForm(f=>({...f,category:cat}))}
                      style={{padding:'6px 13px',borderRadius:20,border:'1px solid #D0CEC5',fontSize:12.5,fontFamily:'Georgia,serif',cursor:'pointer',
                        background:form.category===cat?(CAT_COLOR[cat]||'#888'):'transparent',
                        color:form.category===cat?'white':'#6B6963'}}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{marginBottom:16}}>
                <label style={{fontSize:11,color:'#6B6963',letterSpacing:'0.06em',textTransform:'uppercase',display:'block',marginBottom:6}}>Nota (opzionale)</label>
                <input type="text" placeholder="Es. Spesa al supermercato..." value={form.note}
                  onChange={e=>setForm(f=>({...f,note:e.target.value}))}
                  style={{width:'100%',padding:'11px 14px',border:'1px solid #D0CEC5',borderRadius:8,fontSize:14,fontFamily:'Georgia,serif',background:'white',color:'#1A1917',outline:'none'}}/>
              </div>

              <div style={{marginBottom:24}}>
                <label style={{fontSize:11,color:'#6B6963',letterSpacing:'0.06em',textTransform:'uppercase',display:'block',marginBottom:6}}>Data</label>
                <input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                  style={{width:'100%',padding:'11px 14px',border:'1px solid #D0CEC5',borderRadius:8,fontSize:14,fontFamily:'Georgia,serif',background:'white',color:'#1A1917',outline:'none'}}/>
              </div>

              <button onClick={addTransaction}
                style={{width:'100%',padding:14,fontSize:15,fontFamily:'Georgia,serif',fontStyle:'italic',border:'none',borderRadius:8,
                  background:form.type==='entrata'?'#1D9E75':'#D85A30',color:'white',cursor:'pointer'}}>
                Aggiungi {form.type}
              </button>
            </div>
          </div>
        )}

        {/* FAB */}
        <button onClick={()=>setShowForm(true)}
          style={{position:'fixed',bottom:28,right:28,width:56,height:56,borderRadius:'50%',background:'#1A1917',color:'white',border:'none',fontSize:28,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 4px 20px rgba(0,0,0,0.2)',cursor:'pointer',zIndex:50}}>
          +
        </button>

        {/* BATTUTA */}
        {showBattuta && (
          <div style={{position:'fixed',bottom:100,left:'50%',transform:'translateX(-50%)',background:'#1A1917',color:'white',padding:'12px 20px',borderRadius:12,fontSize:14,fontFamily:'Georgia,serif',fontStyle:'italic',zIndex:200,whiteSpace:'nowrap',boxShadow:'0 4px 20px rgba(0,0,0,0.2)'}}>
            {battuta}
          </div>
        )}
      </div>
    </div>
  )
}