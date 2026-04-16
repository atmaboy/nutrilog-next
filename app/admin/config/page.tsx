'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import MigrateButton from '@/components/admin/MigrateButton'
import ThemeToggle from '@/components/admin/ThemeToggle'

export default function ConfigPage() {
  const [token,setToken]=useState(''); const [limit,setLimit]=useState(''); const [apiKey,setApiKey]=useState('');
  const [newPwd,setNewPwd]=useState(''); const [mEnabled,setMEnabled]=useState(false);
  const [mTitle,setMTitle]=useState(''); const [mDesc,setMDesc]=useState(''); const [loading,setLoading]=useState<string|null>(null)

  useEffect(()=>{
    const t=document.cookie.split(';').find(c=>c.includes('nl_admin_token'))?.split('=')[1]??''
    setToken(t)
    fetch('/api/admin?action=stats',{headers:{Authorization:`Bearer ${t}`}}).then(r=>r.json()).then(d=>setLimit(String(d.globalDailyLimit??5)))
    fetch('/api/admin?action=maintenance-status').then(r=>r.json()).then(d=>{setMEnabled(d.enabled);setMTitle(d.title);setMDesc(d.description)})
  },[])

  async function save(action:string,body:Record<string,unknown>,label:string){
    setLoading(action)
    const r=await fetch(`/api/admin?action=${action}`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body)})
    const d=await r.json()
    r.ok?toast.success(`${label} berhasil disimpan`):toast.error(d.error)
    setLoading(null)
  }

  const Section=({title,children}:{title:string;children:React.ReactNode})=>(
    <div className="bg-card border rounded-xl p-5 shadow-sm">
      <h2 className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-4">{title}</h2>
      {children}
    </div>
  )

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pengaturan</h1>
        <ThemeToggle />
      </div>
      <Section title="Batas Analisa Harian">
        <div className="flex gap-2">
          <input type="number" value={limit} onChange={e=>setLimit(e.target.value)} min={1} max={9999}
            className="border rounded-xl px-3 py-2 text-sm bg-background flex-1 focus:outline-none focus:ring-2 focus:ring-ring"/>
          <button onClick={()=>save('set-limit',{dailyLimit:parseInt(limit)},'Limit')} disabled={loading==='set-limit'}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
            {loading==='set-limit'?'…':'Simpan'}
          </button>
        </div>
      </Section>
      <Section title="Anthropic API Key">
        <div className="flex gap-2">
          <input type="password" value={apiKey} onChange={e=>setApiKey(e.target.value)} placeholder="sk-ant-..."
            className="border rounded-xl px-3 py-2 text-sm bg-background flex-1 focus:outline-none focus:ring-2 focus:ring-ring"/>
          <button onClick={()=>save('set-apikey',{apiKey},'API Key')} disabled={loading==='set-apikey'}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
            {loading==='set-apikey'?'…':'Simpan'}
          </button>
        </div>
      </Section>
      <Section title="Password Admin">
        <div className="flex gap-2">
          <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="Min. 8 karakter"
            className="border rounded-xl px-3 py-2 text-sm bg-background flex-1 focus:outline-none focus:ring-2 focus:ring-ring"/>
          <button onClick={()=>save('change-pwd',{newPassword:newPwd},'Password')} disabled={loading==='change-pwd'||newPwd.length<8}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
            {loading==='change-pwd'?'…':'Ubah'}
          </button>
        </div>
      </Section>
      <Section title="Mode Maintenance">
        <div className="space-y-3">
          <button type="button" onClick={()=>setMEnabled(!mEnabled)} role="switch" aria-checked={mEnabled}
            className="flex items-center gap-3">
            <div className={`w-10 h-6 rounded-full transition-colors relative ${mEnabled?'bg-primary':'bg-muted'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${mEnabled?'translate-x-5':'translate-x-1'}`}/>
            </div>
            <span className="text-sm font-medium">{mEnabled?'Aktif — aplikasi offline':'Nonaktif'}</span>
          </button>
          <input value={mTitle} onChange={e=>setMTitle(e.target.value)} placeholder="Judul maintenance"
            className="w-full border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"/>
          <textarea value={mDesc} onChange={e=>setMDesc(e.target.value)} placeholder="Deskripsi" rows={2}
            className="w-full border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"/>
          <button onClick={()=>save('set-maintenance',{enabled:mEnabled,title:mTitle,description:mDesc},'Maintenance')} disabled={loading==='set-maintenance'}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-50">
            {loading==='set-maintenance'?'…':'Simpan Maintenance'}
          </button>
        </div>
      </Section>
      <Section title="Migrasi Data dari Supabase KV Store">
        <MigrateButton token={token}/>
      </Section>
    </div>
  )
}