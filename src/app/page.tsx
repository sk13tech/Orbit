"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { onAuthStateChanged, signInWithPopup, signInWithRedirect, signOut, type User } from "firebase/auth";
import { auth, authReady, googleProvider, isFirebaseConfigured } from "@/lib/firebase";
import * as FS from "@/lib/firestore";
import type { SiteConfig } from "@/lib/firestore";

type Lead = FS.Lead;
type Log = FS.FollowUpLog;
interface Stats { totalLeads:number; inProgress:number; closed:number; lost:number; conversionRate:number; byProduct:{product:string;count:number}[]; dailyBreakdown:{day:string;total:number;closed:number}[]; }

const td=()=>new Date().toISOString().split("T")[0];
const ddiff=(d:string)=>Math.round((new Date(d).getTime()-new Date(td()).getTime())/864e5);
function getBadge(d:string,s:string){if(s!=="in_progress")return null;const x=ddiff(d);if(x===0)return{t:"Today",c:"bg-[#2563EB]/10 text-[#2563EB]"};if(x<0)return{t:`${-x}d late`,c:"bg-[#E85D75]/10 text-[#E85D75]"};return{t:`In ${x}d`,c:"bg-[#F5A623]/10 text-[#F5A623]"};}
const fmt=(d:string)=>d?new Date(d+"T00:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}):"";
const ini=(n:string)=>n.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2);
function avc(n:string){let h=0;for(let i=0;i<n.length;i++)h=n.charCodeAt(i)+((h<<5)-h);return["#5B8DEF","#43B88C","#F5A623","#E85D75","#6C63FF","#38BDF8","#F472B6","#A78BFA"][Math.abs(h)%8];}
function tap(s:"light"|"medium"|"heavy"="light"){try{if(typeof navigator!=="undefined"&&"vibrate" in navigator)navigator.vibrate(s==="light"?1:s==="medium"?4:8);}catch{}}
function withTap<T extends unknown[]>(fn:(...a:T)=>void,s:"light"|"medium"|"heavy"="light"){return(...a:T)=>{tap(s);fn(...a);};}
function clearClientStorage(){
  try{
    if(typeof window!=="undefined"){
      window.localStorage.clear();
      window.sessionStorage.clear();
      try{window.indexedDB.deleteDatabase("firebaseLocalStorageDb");}catch{}
    }
  }catch{}
}
function fPh(v:string){let d=v.replace(/\D/g,"");while(d.startsWith("91")&&d.length>10)d=d.slice(2);if(d.startsWith("91")&&d.length>=12)d=d.slice(2);d=d.slice(0,10);let s="+91";if(d.length>0)s+=" "+d.slice(0,5);if(d.length>5)s+=" "+d.slice(5);return{display:s,digits:d};}
function vP(d:string){if(!d.length)return{ok:false,m:""};if(d.length<10)return{ok:false,m:`${10-d.length} more digits`};if(!/^[6-9]/.test(d))return{ok:false,m:"Must start with 6-9"};return{ok:true,m:"✓ Valid"};}



/* Icons — all stroke, 1.6 weight, monochrome */
const I={
  menu:<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h16"/></svg>,
  plus:<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>,
  search:<svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>,
  x:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M18 6 6 18M6 6l12 12"/></svg>,
  phone:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.362 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>,
  chev:<svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m9 18 6-6-6-6"/></svg>,
  check:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M20 6 9 17l-5-5"/></svg>,
  trash:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/></svg>,
  edit:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  msg:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  dl:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>,
  filter:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M22 3H2l8 9.46V19l4 2v-8.54z"/></svg>,
  redo:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M1 4v6h6M23 20v-6h-6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>,
  bell:<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>,
  users:<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
  chart:<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  pct:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
  cc:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>,
  act:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
  xc:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>,
  pkg:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></svg>,
  cal:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  trophy:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0114 17v-2.34"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg>,
  doc:<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>,
  shield:<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  back:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><path d="m15 18-6-6 6-6"/></svg>,
};

const card="bg-white rounded-[20px]";
const cardSh={boxShadow:"0 1px 3px rgba(0,0,0,0.04)"};

export default function App(){
  const [user,setUser]=useState<User|null>(null);
  const [authLoading,setAuthLoading]=useState(true);
  const [signingIn,setSigningIn]=useState(false);

  useEffect(()=>{
    if(!auth){setAuthLoading(false);return;}
    const unsub=onAuthStateChanged(auth,(u)=>{
      setUser(u);
      setAuthLoading(false);
      setSigningIn(false);
    });
    if(auth.currentUser){
      setUser(auth.currentUser);
      setAuthLoading(false);
      setSigningIn(false);
    }
    return ()=>unsub();
  },[]);

  const signIn=async()=>{
    if(!auth||!googleProvider||signingIn)return;
    setSigningIn(true);
    try{
      const result=await signInWithPopup(auth,googleProvider);
      if(result?.user){
        setUser(result.user);
        setSigningIn(false);
        return;
      }
    }catch(e){
      console.error("Popup sign-in error:",e);
      try{
        await signInWithRedirect(auth,googleProvider);
        return;
      }catch(e2){
        console.error("Redirect fallback error:",e2);
      }
    }
    setSigningIn(false);
  };
  const logOut=async()=>{
    if(auth){
      try{await signOut(auth);}catch(e){console.error(e);}
      clearClientStorage();
      setUser(null);
      setSigningIn(false);
    }
  };
  const closeNav=()=>{setNavClosing(true);setTimeout(()=>{setNav(false);setNavClosing(false);},250);};

  const [cfg,setCfg]=useState<SiteConfig>({siteName:"Orbit",contactEmail:"sitaenterprisespvtltd@gmail.com",logoUrl:"/logo.png"});
  const logoSrc = /^(https?:\/\/|\/)/.test(cfg.logoUrl) ? cfg.logoUrl : "/logo.png";
  const [tab,setTab]=useState<"alerts"|"leads"|"stats">("alerts");
  const [sub,setSub]=useState<"active"|"won"|"lost">("active");
  const [nav,setNav]=useState(false);
  const [navClosing,setNavClosing]=useState(false);
  const [showSignOut,setShowSignOut]=useState(false);
  const [form,setForm]=useState(false);
  const [editing,setEditing]=useState<Lead|null>(null);
  const [logSheet,setLogSheet]=useState(false);
  const [logLead,setLogLead]=useState<Lead|null>(null);
  const [logs,setLogs]=useState<Log[]>([]);
  const [addLog,setAddLog]=useState(false);
  const [remark,setRemark]=useState("");
  const [q,setQ]=useState("");
  const [filt,setFilt]=useState(false);
  const [df,setDf]=useState("");
  const [dt,setDt]=useState("");
  const [exp,setExp]=useState<string|null>(null);
  const [del,setDel]=useState<Lead|null>(null);
  const [lds,setLds]=useState<Lead[]>([]);
  const [fu,setFu]=useState({todayLeads:[] as Lead[],overdueLeads:[] as Lead[],upcomingLeads:[] as Lead[],totalFollowups:0});
  const [stats,setStats]=useState<Stats|null>(null);
  const [lc,setLc]=useState<Record<string,number>>({});
  const [ph,setPh]=useState("");const [phD,setPhD]=useState("");const [nm,setNm]=useState("");const [vd,setVd]=useState(td());const [ed,setEd]=useState("");const [pr,setPr]=useState("");const [nt,setNt]=useState("");const [sv,setSv]=useState(false);
  const tmr=useRef<ReturnType<typeof setTimeout>|null>(null);

  useEffect(()=>{FS.getSiteConfig().then(setCfg).catch(()=>{});},[]);
  useEffect(()=>{if(!user)return;la();},[user]);// eslint-disable-line
  const la=useCallback(()=>{if(!user)return;fl();ff();fst();fc();},[user]);// eslint-disable-line
  const fl=useCallback((s?:string)=>{if(!user)return;FS.getLeads(user.uid,s).then(setLds).catch(console.error);},[user]);
  const ff=useCallback(()=>{if(!user)return;FS.getFollowups(user.uid).then(setFu).catch(console.error);},[user]);
  const fst=useCallback(()=>{if(!user)return;FS.getStats(user.uid).then(setStats).catch(console.error);},[user]);
  const fc=useCallback(()=>{if(!user)return;FS.getLeads(user.uid).then(leads=>{const ids=leads.map(l=>l.id);FS.getLogCounts(ids).then(setLc).catch(console.error);}).catch(console.error);},[user]);
  const doSearch=useCallback(()=>{fl(q);},[q,fl]);
  useEffect(()=>{if(df||dt)fl(q);},[df,dt]);// eslint-disable-line
  const openNew=()=>{setEditing(null);setPh("");setPhD("");setNm("");setVd(td());setEd("");setPr("");setNt("");setForm(true);};
  const openEdit=(l:Lead)=>{setEditing(l);const d=l.phone.replace(/\D/g,"");const dg=d.startsWith("91")?d.slice(2):d;setPh(fPh(dg).display);setPhD(dg);setNm(l.name);setVd(l.dateOfVisit);setEd(l.expectedPurchaseDate);setPr(l.product);setNt(l.notes||"");setForm(true);};
  const hP=(v:string)=>{
    let raw=v.replace(/\D/g,"");
    // Always strip leading "91" country code — user sees "+91" prefix already
    if(raw.startsWith("91"))raw=raw.slice(2);
    raw=raw.slice(0,10);
    let display="+91";
    if(raw.length>0)display+=" "+raw.slice(0,5);
    if(raw.length>5)display+=" "+raw.slice(5);
    setPh(display);setPhD(raw);
  };
  const save=async()=>{if(!nm||!phD||!pr||!vP(phD).ok||!user)return;setSv(true);const body={name:nm,phone:fPh(phD).display,product:pr,dateOfVisit:vd,expectedPurchaseDate:ed,notes:nt||null};try{if(editing)await FS.updateLead(editing.id,body);else await FS.createLead(user.uid,body);setForm(false);la();}finally{setSv(false);}};
  const setSt=async(id:string,s:string)=>{
    const updates: Record<string,unknown> = {status:s};
    if(s==="closed") updates.notes="Closed lead";
    await FS.updateLead(id,updates);la();
  };
  const rm=async(id:string)=>{await FS.deleteLead(id);setDel(null);setExp(null);la();};
  const openLogs=async(l:Lead)=>{setLogLead(l);setLogSheet(true);setAddLog(false);setRemark("");const logs=await FS.getLogs(l.id);setLogs(logs);};
  const savLog=async()=>{if(!remark||!logLead)return;const n=await FS.createLog(logLead.id,remark);setLogs(p=>[n,...p]);setLc(p=>({...p,[logLead.id]:(p[logLead.id]||0)+1}));setRemark("");setAddLog(false);};
  const csv=async()=>{
    if(!user)return;
    try{
      const leads=await FS.getLeads(user.uid);
      const esc=(v:string)=>{let s=v.replace(/"/g,'""');if(/^[=+\-@\t\r]/.test(s))s="'"+s;return'"'+s+'"';};
      const header="Name,Phone,Product,Status,Date of Visit,Expected Purchase Date,Created";
      const rows=leads.map(l=>[esc(l.name),esc(l.phone),esc(l.product),esc(l.status),esc(l.dateOfVisit),esc(l.expectedPurchaseDate),esc(l.createdAt.split("T")[0])].join(","));
      const content="\uFEFF"+header+"\n"+rows.join("\n");
      const blob=new Blob([content],{type:"text/csv;charset=utf-8;"});
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a");
      a.href=url;
      a.download="orbit-leads.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(()=>URL.revokeObjectURL(url),100);
    }catch(e){console.error("Export failed:",e);}
  };
  const actv=lds.filter(l=>l.status==="in_progress");const won=lds.filter(l=>l.status==="closed");const lost=lds.filter(l=>l.status==="lost");const cur=sub==="active"?actv:sub==="won"?won:lost;

  /* ── Premium Card Styles ── */
  const C="bg-white rounded-3xl";
  const CS={boxShadow:"0 2px 12px rgba(0,0,0,0.04)"};

  /* ── Accent Colors ── */
  const ac={blue:"#3B5BDB",green:"#2B8A3E",red:"#E03131",amber:"#E67700",purple:"#7048E8",teal:"#0C8599"};

  /* ── Action Pill ── */
  const Pill=({children,onClick,href,c="#3B5BDB"}:{children:React.ReactNode;onClick?:()=>void;href?:string;c?:string})=>{
    const cls="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[13px] font-semibold active:scale-[0.96] transition-transform";
    const h=onClick?withTap(onClick):undefined;
    // Only allow tel: and https: protocols — block javascript:, data:, etc.
    const safeHref=href&&/^(tel:|https:)/.test(href)?href:undefined;
    if(safeHref)return<a href={safeHref} rel="noopener noreferrer" className={cls} style={{color:c,backgroundColor:c+"12"}} onClick={()=>tap()}>{children}</a>;
    if(href&&!safeHref)return<button className={cls} style={{color:c,backgroundColor:c+"12"}}>{children}</button>;
    return<button onClick={h} className={cls} style={{color:c,backgroundColor:c+"12"}}>{children}</button>;
  };

  /* ── Alert Card (premium) ── */
  const AC=({lead}:{lead:Lead})=>{const b=getBadge(lead.expectedPurchaseDate,lead.status);return(
    <div className={`${C} p-5 mb-3`} style={CS}>
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[13px] font-bold shrink-0" style={{backgroundColor:avc(lead.name)+"15",color:avc(lead.name)}}>{ini(lead.name)}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="font-semibold text-[16px] text-[#1A1A1A] truncate">{lead.name}</span>
            {b&&<span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl shrink-0 ${b.c}`}>{b.t}</span>}
          </div>
          <p className="text-[#6B7280] text-[14px] font-medium">{lead.product}</p>
          <div className="flex items-center gap-2 mt-1.5 text-[13px] text-[#9CA3AF]">
            {I.phone}<span>{lead.phone}</span>
            {lead.notes&&<><span className="text-[#D1D5DB]">·</span><span className="truncate">{lead.notes}</span></>}
          </div>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Pill href={`tel:${lead.phone.replace(/\s/g,"")}`} c={ac.green}>{I.phone} Call</Pill>
            <Pill onClick={()=>openLogs(lead)} c={ac.blue}>{I.msg} {lc[lead.id]||"Log"}</Pill>
            <Pill onClick={()=>openEdit(lead)} c={ac.amber}>{I.edit} Edit</Pill>
            <Pill onClick={()=>setSt(lead.id,"closed")} c={ac.teal}>{I.check} Close</Pill>
          </div>
        </div>
      </div>
    </div>
  );};

  /* ── Lead Card (premium) ── */
  const LC=({lead}:{lead:Lead})=>{const b=getBadge(lead.expectedPurchaseDate,lead.status);const isE=exp===lead.id;return(
    <div className={`${C} mb-3 overflow-hidden`} style={CS}>
      <div className="p-5 cursor-pointer active:bg-[#FAFBF8] transition-colors" onClick={withTap(()=>setExp(isE?null:lead.id))}>
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-[13px] font-bold shrink-0" style={{backgroundColor:avc(lead.name)+"15",color:avc(lead.name)}}>{ini(lead.name)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-[16px] text-[#1A1A1A] truncate">{lead.name}</span>
              <div className="flex items-center gap-2 shrink-0">
                {b&&<span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${b.c}`}>{b.t}</span>}
                <span className={`text-[#D1D5DB] transition-transform duration-200 ${isE?"rotate-90":""}`}>{I.chev}</span>
              </div>
            </div>
            <p className="text-[#6B7280] text-[14px] font-medium mt-0.5">{lead.product} <span className="text-[#D1D5DB]">·</span> {fmt(lead.dateOfVisit)}</p>
          </div>
        </div>
      </div>
      {isE&&(
        <div className="px-5 pb-5 border-t border-[#F3F4F0] pt-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4 text-[14px]">
            {[{l:"Phone",v:lead.phone},{l:"Visit",v:fmt(lead.dateOfVisit)},{l:"Expected",v:fmt(lead.expectedPurchaseDate)},{l:"Product",v:lead.product},...(lead.notes?[{l:"Notes",v:lead.notes}]:[])].map(r=>(
              <div key={r.l} className={r.l==="Notes"?"col-span-2":""}><p className="text-[12px] text-[#9CA3AF] font-medium mb-0.5">{r.l}</p><p className="text-[#1A1A1A] truncate">{r.v}</p></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Pill onClick={()=>openEdit(lead)} c={ac.amber}>{I.edit} Edit</Pill>
            <Pill href={`tel:${lead.phone.replace(/\s/g,"")}`} c={ac.green}>{I.phone} Call</Pill>
            <Pill onClick={()=>openLogs(lead)} c={ac.blue}>{I.msg} {lc[lead.id]?`${lc[lead.id]}`:"Log"}</Pill>
            {lead.status==="in_progress"&&<><Pill onClick={()=>setSt(lead.id,"closed")} c={ac.green}>{I.check} Won</Pill><Pill onClick={()=>setSt(lead.id,"lost")} c={ac.red}>{I.x} Lost</Pill></>}
            {(lead.status==="closed"||lead.status==="lost")&&<Pill onClick={()=>setSt(lead.id,"in_progress")} c={ac.blue}>{I.redo} Reopen</Pill>}
            <button onClick={withTap(()=>setDel(lead),"medium")} className="p-2.5 rounded-2xl text-[#E03131] active:scale-90 transition-transform" style={{backgroundColor:"#E0313112"}}>{I.trash}</button>
          </div>
        </div>
      )}
    </div>
  );};

  /* ── Stats ── (keep existing from Si icons + SV function) */
  const Si={
    users:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>,
    pct:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d="M19 5 5 19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>,
    cc:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4 12 14.01l-3-3"/></svg>,
    act:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>,
    xc:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/></svg>,
    pkg:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.27 6.96 12 12.01l8.73-5.05M12 22.08V12"/></svg>,
    cal:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
    trophy:<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 010-5H6M18 9h1.5a2.5 2.5 0 000-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22h10c0-2-.85-3.25-2.03-3.79A1.07 1.07 0 0114 17v-2.34"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg>,
  };
  const SV=()=>{
    if(!stats)return<div className={`${C} p-16 text-center text-[#9CA3AF] text-[15px]`} style={CS}>Loading...</div>;
    const t=stats.totalLeads||1;const wP=Math.round((stats.closed/t)*100);const aP=Math.round((stats.inProgress/t)*100);const lP=Math.round((stats.lost/t)*100);
    const mxP=stats.byProduct[0]?.count||1;const mxD=Math.max(...stats.dailyBreakdown.map(d=>d.total),1);const circ=2*Math.PI*46;
    const sC=["#3B5BDB","#2B8A3E","#E67700","#E03131","#7048E8","#0C8599","#D6336C","#1098AD"];
    return(
      <div className="space-y-4">
        {/* Hero header */}
        <div className={`${C} p-6`} style={CS}>
          <div className="flex items-center justify-between mb-5">
            <div><p className="text-[13px] text-[#9CA3AF] font-semibold">Overview</p><h1 className="text-[26px] font-extrabold text-[#1A1A1A] tracking-tight mt-0.5">Dashboard</h1></div>
            <button onClick={withTap(csv)} className="w-11 h-11 rounded-2xl bg-[#3B5BDB]/10 flex items-center justify-center text-[#3B5BDB] active:scale-90 transition-transform">{I.dl}</button>
          </div>
          <div className="flex gap-3 overflow-x-auto -mx-1 px-1 pb-1" style={{scrollbarWidth:"none"}}>
            {[{v:stats.totalLeads,l:"Total",ic:Si.users,c:"#3B5BDB"},{v:`${stats.conversionRate}%`,l:"Convert",ic:Si.pct,c:"#E67700"},{v:stats.closed,l:"Closed",ic:Si.cc,c:"#2B8A3E"},{v:stats.inProgress,l:"Active",ic:Si.act,c:"#7048E8"},{v:stats.lost,l:"Lost",ic:Si.xc,c:"#E03131"}].map(s=>(
              <div key={s.l} className="shrink-0 rounded-2xl px-4 py-3.5 min-w-[115px]" style={{backgroundColor:s.c+"0A"}}>
                <div className="flex items-center gap-1.5 mb-2"><span style={{color:s.c}}>{s.ic}</span><span className="text-[12px] font-medium" style={{color:s.c+"99"}}>{s.l}</span></div>
                <p className="text-[22px] font-extrabold tracking-tight leading-none" style={{color:s.c}}>{s.v}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Win Rate */}
        <div className={`${C} p-6`} style={CS}><div className="flex items-center justify-between"><div><div className="flex items-center gap-1.5 mb-1"><span className="text-[#2B8A3E]">{Si.trophy}</span><span className="text-[12px] text-[#9CA3AF] font-medium">Win Rate</span></div><p className="text-[38px] font-extrabold text-[#1A1A1A] leading-none tracking-tight">{wP}<span className="text-[20px] text-[#D1D5DB]">%</span></p><p className="text-[13px] text-[#9CA3AF] mt-2">{stats.closed} won · {stats.lost} lost</p></div><div className="flex items-end gap-2.5 h-16"><div className="flex flex-col items-center gap-1"><div className="w-10 bg-[#2B8A3E] rounded-xl" style={{height:`${Math.max(stats.closed/(stats.closed+stats.lost||1)*56,5)}px`}}/><span className="text-[10px] text-[#9CA3AF]">W</span></div><div className="flex flex-col items-center gap-1"><div className="w-10 bg-[#E03131] rounded-xl" style={{height:`${Math.max(stats.lost/(stats.closed+stats.lost||1)*56,5)}px`}}/><span className="text-[10px] text-[#9CA3AF]">L</span></div></div></div></div>
        {/* 7 Days */}
        <div className={`${C} p-6`} style={CS}><div className="flex items-center gap-2 mb-5"><span className="text-[#3B5BDB]">{Si.cal}</span><h3 className="text-[16px] font-bold text-[#1A1A1A]">Last 7 Days</h3></div><div className="flex items-end justify-between gap-2" style={{height:110}}>{stats.dailyBreakdown.map(d=>{const h=mxD>0?Math.max((d.total/mxD)*100,8):8;return(<div key={d.day} className="flex-1 flex flex-col items-center gap-1.5">{d.total>0&&<span className="text-[12px] font-bold text-[#1A1A1A]">{d.total}</span>}<div className="w-full flex justify-center" style={{height:76}}><div className="w-full max-w-[30px] self-end" style={{height:`${h}%`,backgroundColor:d.total>0?"#3B5BDB":"#ECEEE8",borderRadius:10}}/></div><span className="text-[11px] text-[#9CA3AF] font-medium">{d.day.slice(0,3)}</span></div>);})}</div>{stats.dailyBreakdown.some(d=>d.closed>0)&&(<div className="mt-4 pt-4 border-t border-[#F3F4F0] flex flex-wrap gap-3">{stats.dailyBreakdown.filter(d=>d.closed>0).map(d=>(<span key={d.day} className="text-[12px] text-[#9CA3AF]">{d.day.slice(0,3)}: <span className="font-bold text-[#2B8A3E]">{d.closed} won</span></span>))}</div>)}</div>
        {/* Pipeline */}
        <div className={`${C} p-6`} style={CS}><h3 className="text-[16px] font-bold text-[#1A1A1A] mb-5">Pipeline</h3><div className="flex items-center gap-5"><div className="relative w-[110px] h-[110px] shrink-0"><svg viewBox="0 0 100 100" className="w-full h-full" style={{transform:"rotate(-90deg)"}}><circle cx="50" cy="50" r="46" fill="none" stroke="#F3F4F0" strokeWidth="6"/>{stats.inProgress>0&&<circle cx="50" cy="50" r="46" fill="none" stroke="#3B5BDB" strokeWidth="6" strokeDasharray={`${(aP/100)*circ} ${circ}`} strokeDashoffset="0" strokeLinecap="round"/>}{stats.closed>0&&<circle cx="50" cy="50" r="46" fill="none" stroke="#2B8A3E" strokeWidth="6" strokeDasharray={`${(wP/100)*circ} ${circ}`} strokeDashoffset={`${-(aP/100)*circ}`} strokeLinecap="round"/>}{stats.lost>0&&<circle cx="50" cy="50" r="46" fill="none" stroke="#E03131" strokeWidth="6" strokeDasharray={`${(lP/100)*circ} ${circ}`} strokeDashoffset={`${-((aP+wP)/100)*circ}`} strokeLinecap="round"/>}</svg><div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[24px] font-extrabold text-[#1A1A1A]">{stats.totalLeads}</span><span className="text-[10px] text-[#9CA3AF] font-medium">Total</span></div></div><div className="flex-1 space-y-3">{[{l:"Active",v:stats.inProgress,p:aP,c:"#3B5BDB"},{l:"Won",v:stats.closed,p:wP,c:"#2B8A3E"},{l:"Lost",v:stats.lost,p:lP,c:"#E03131"}].map(r=>(<div key={r.l}><div className="flex justify-between text-[13px] mb-1.5"><span className="text-[#6B7280] font-medium">{r.l}</span><span className="font-bold" style={{color:r.c}}>{r.v} <span className="text-[11px] font-normal text-[#9CA3AF]">{r.p}%</span></span></div><div className="h-[5px] bg-[#F3F4F0] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${r.p||0}%`,backgroundColor:r.c}}/></div></div>))}</div></div></div>
        {/* Product */}
        {stats.byProduct.length>0&&(<div className={`${C} p-6`} style={CS}><div className="flex items-center gap-2 mb-5"><span className="text-[#7048E8]">{Si.pkg}</span><h3 className="text-[16px] font-bold text-[#1A1A1A]">By Product</h3></div><div className="space-y-4">{stats.byProduct.map((p,i)=>{const c=sC[i%sC.length];return(<div key={p.product} className="flex items-center gap-3"><div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-[12px] font-bold shrink-0" style={{backgroundColor:c}}>{i+1}</div><div className="flex-1 min-w-0"><div className="flex justify-between items-center mb-1.5"><span className="text-[14px] font-medium text-[#1A1A1A] truncate">{p.product}</span><span className="text-[15px] font-extrabold" style={{color:c}}>{p.count}</span></div><div className="h-[5px] bg-[#F3F4F0] rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${(p.count/mxP)*100}%`,backgroundColor:c}}/></div></div></div>);})}</div></div>)}
        <button onClick={withTap(csv)} className="w-full py-4 bg-[#1A1A1A] text-white rounded-2xl text-[15px] font-bold flex items-center justify-center gap-2.5 active:scale-[0.98] transition-transform">{I.dl} Export Report</button>
      </div>);};

  /* ═══ AUTH SCREENS ═══ */
  if(authLoading) return(
    <div className="min-h-screen bg-[#F4F5F0] flex items-center justify-center">
      <div className="text-center"><span className="text-[18px] font-bold text-[#1A1A1A]">Orbit</span><p className="text-[14px] text-[#9CA3AF] mt-2">Loading...</p></div>
    </div>
  );

  /* Login popup icon */
  const GoogleIcon=<svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>;

  /* ═══ MAIN APP ═══ */
  return(
    <div className="min-h-screen bg-[#F4F5F0]">
      <div className="max-w-lg mx-auto pb-10">
        {/* Header */}
        <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm px-5 py-3.5 flex items-center justify-between" style={{boxShadow:"0 1px 0 #ECEEE8"}}>
          <button onClick={withTap(()=>setNav(true))} className="p-2 -ml-2 rounded-xl text-[#1A1A1A] active:scale-90 transition-transform">{I.menu}</button>
          <span className="text-[17px] font-bold text-[#1A1A1A] tracking-tight">{cfg.siteName}</span>
          <button onClick={withTap(openNew)} className="w-9 h-9 bg-[#1A1A1A] text-white rounded-2xl flex items-center justify-center active:scale-90 transition-transform">
            {I.plus}
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className={`${C} px-4 py-3 flex items-center gap-3`} style={CS}>
            <span className="text-[#9CA3AF]">{I.search}</span>
            <input type="text" placeholder="Search leads..." value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();tap();if(tab!=="leads")setTab("leads");doSearch();}}} className="flex-1 bg-transparent text-[15px] text-[#1A1A1A] focus:outline-none placeholder-[#D1D5DB] font-medium"/>
            {q?<button onClick={withTap(()=>{setQ("");fl();})} className="flex items-center gap-1 text-[#9CA3AF] text-[12px] font-medium px-2 py-1 rounded-lg bg-[#F4F5F0] active:scale-95 transition-transform">{I.x} Clear</button>
            :<button onClick={withTap(()=>{if(q){if(tab!=="leads")setTab("leads");doSearch();}})} className="text-[#D1D5DB]">{I.chev}</button>}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className={`${C} p-1.5 flex gap-1`} style={CS}>
            {(["alerts","leads","stats"] as const).map(t=>(
              <button key={t} onClick={withTap(()=>setTab(t))} className={`flex-1 py-3 rounded-2xl text-[14px] font-semibold relative active:scale-[0.97] transition-transform ${tab===t?"bg-[#1A1A1A] text-white":"text-[#9CA3AF]"}`}>
                {t==="alerts"?"Alerts":t==="leads"?"Leads":"Stats"}
                {t==="alerts"&&fu.totalFollowups>0&&<span className="absolute -top-1.5 right-1.5 bg-[#3B5BDB] text-white text-[10px] min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center font-bold">{fu.totalFollowups}</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="px-4">
          {/* ALERTS */}
          {tab==="alerts"&&(
            <div>
              <p className="text-[13px] text-[#9CA3AF] mb-4 font-medium">{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
              {[{t:"Overdue",d:fu.overdueLeads,c:ac.red},{t:"Follow Up Today",d:fu.todayLeads,c:ac.blue},{t:"Upcoming",d:fu.upcomingLeads,c:ac.amber}].map(s=>(
                <div key={s.t} className="mb-5">
                  <div className="flex items-center justify-between mb-3"><h3 className="text-[15px] font-bold text-[#1A1A1A]">{s.t}</h3><span className="text-[12px] font-bold px-2.5 py-1 rounded-xl" style={{backgroundColor:s.c+"12",color:s.c}}>{s.d.length}</span></div>
                  {s.d.length===0?<div className={`${C} p-8 text-center text-[#D1D5DB] text-[14px] font-medium`} style={CS}>No leads</div>:s.d.map(l=><AC key={l.id} lead={l}/>)}
                </div>
              ))}
            </div>
          )}

          {/* LEADS */}
          {tab==="leads"&&(
            <div>
              <div className="flex gap-2 mb-4">
                <button onClick={withTap(()=>setFilt(!filt))} className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-semibold active:scale-[0.96] transition-transform ${filt?"bg-[#1A1A1A] text-white":"bg-white text-[#1A1A1A]"}`} style={!filt?CS:{}}>{I.filter} Filter</button>
                <button onClick={withTap(csv)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[13px] font-semibold bg-white text-[#1A1A1A] active:scale-[0.96] transition-transform" style={CS}>{I.dl} Export</button>
              </div>
              {filt&&(
                <div className={`${C} p-4 mb-4 flex gap-3`} style={CS}>
                  <div className="flex-1"><label className="text-[12px] text-[#9CA3AF] font-medium block mb-1.5">From</label><input type="date" value={df} onChange={e=>setDf(e.target.value)} className="w-full px-3 py-2.5 bg-[#F4F5F0] rounded-xl text-[14px] focus:outline-none"/></div>
                  <div className="flex-1"><label className="text-[12px] text-[#9CA3AF] font-medium block mb-1.5">To</label><input type="date" value={dt} onChange={e=>setDt(e.target.value)} className="w-full px-3 py-2.5 bg-[#F4F5F0] rounded-xl text-[14px] focus:outline-none"/></div>
                  {(df||dt)&&<button onClick={()=>{setDf("");setDt("");}} className="self-end text-[#D1D5DB] pb-2">{I.x}</button>}
                </div>
              )}
              <div className={`${C} p-1.5 flex gap-1 mb-4`} style={CS}>
                {(["active","won","lost"] as const).map(s=>{
                  const cnt=s==="active"?actv.length:s==="won"?won.length:lost.length;
                  const c=s==="active"?ac.blue:s==="won"?ac.green:ac.red;
                  return<button key={s} onClick={withTap(()=>setSub(s))} className={`flex-1 py-2.5 rounded-2xl text-[13px] font-semibold flex items-center justify-center gap-1.5 active:scale-[0.97] transition-transform ${sub===s?"bg-[#1A1A1A] text-white":"text-[#9CA3AF]"}`}>
                    {sub!==s&&<span className="w-1.5 h-1.5 rounded-full" style={{backgroundColor:c}}/>}{s==="active"?"Active":s==="won"?"Won":"Lost"} ({cnt})
                  </button>;
                })}
              </div>
              {cur.length===0?<div className={`${C} p-10 text-center`} style={CS}>
                <div className="w-12 h-12 rounded-2xl bg-[#F4F5F0] flex items-center justify-center mx-auto mb-3 text-[#D1D5DB]">{I.users}</div>
                <p className="text-[15px] font-semibold text-[#1A1A1A] mb-1">No leads yet</p>
                <p className="text-[13px] text-[#9CA3AF] mb-4">Tap + to add your first lead</p>
                <button onClick={withTap(openNew)} className="px-5 py-2.5 bg-[#1A1A1A] text-white rounded-2xl text-[13px] font-semibold active:scale-[0.97] transition-transform flex items-center gap-2 mx-auto">
                  {I.plus}
                  Add Lead
                </button>
              </div>:cur.map(l=><LC key={l.id} lead={l}/>)}
            </div>
          )}
          {tab==="stats"&&<SV/>}
        </div>
      </div>

      {/* Nav */}
      {nav&&(<div className={`fixed inset-0 z-50 ${navClosing?"a-fadeOut":"a-fadeIn"}`}><div className="absolute inset-0 overlay" onClick={closeNav}/><div className={`absolute left-0 top-0 bottom-0 w-[280px] bg-white flex flex-col ${navClosing?"a-slideOut":"a-slideIn"}`} style={{boxShadow:"4px 0 32px rgba(0,0,0,0.06)"}}>
        <div className="px-5 pt-5 pb-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl overflow-hidden" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.06)"}}><img src={logoSrc} alt={cfg.siteName} className="w-full h-full object-cover" referrerPolicy="no-referrer"/></div><div><span className="text-[16px] font-bold text-[#1A1A1A] block leading-tight">{cfg.siteName}</span><span className="text-[12px] text-[#9CA3AF]">Lead Management</span></div></div><button onClick={withTap(closeNav)} className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#9CA3AF] active:scale-90 transition-transform" style={{boxShadow:"0 1px 4px rgba(0,0,0,0.08)"}}>{I.back}</button></div>
        <div className="mx-5 h-px bg-[#F3F4F0]"/>
        <div className="px-5 pt-5 flex-1">
          <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-[0.12em] mb-4">Menu</p>
          <nav className="space-y-1">{[{k:"alerts" as const,l:"Notifications",ic:I.bell,badge:fu.totalFollowups},{k:"leads" as const,l:"Leads",ic:I.users},{k:"stats" as const,l:"Analytics",ic:I.chart}].map(n=>(<button key={n.k} onClick={withTap(()=>{setTab(n.k);closeNav();})} className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-[15px] active:bg-[#FAFBF8] transition-colors ${tab===n.k?"text-[#1A1A1A] font-semibold":"text-[#9CA3AF]"}`}><span className={tab===n.k?"text-[#1A1A1A]":"text-[#D1D5DB]"}>{n.ic}</span><span className="flex-1 text-left">{n.l}</span>{n.badge!==undefined&&n.badge>0&&<span className="bg-[#3B5BDB] text-white text-[11px] font-bold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">{n.badge}</span>}</button>))}</nav>
          <div className="h-px bg-[#F3F4F0] my-5"/>
          <p className="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-[0.12em] mb-4">Legal</p>
          <a href="/terms" className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-[15px] text-[#9CA3AF] active:bg-[#FAFBF8]"><span className="text-[#D1D5DB]">{I.doc}</span>Terms of Use</a>
          <a href="/privacy" className="flex items-center gap-3.5 px-3 py-3 rounded-xl text-[15px] text-[#9CA3AF] active:bg-[#FAFBF8]"><span className="text-[#D1D5DB]">{I.shield}</span>Privacy Policy</a>
        </div>
        {/* Profile + Logout */}
        <div className="px-5 py-4 mt-auto">
          <div className="h-px bg-[#F3F4F0] mb-4"/>
          {user&&(
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 bg-[#F4F5F0]">
                {user.photoURL&&/^https:\/\/(lh3\.googleusercontent\.com|.*\.google\.com)\//.test(user.photoURL)?<img src={user.photoURL} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer"/>:
                <div className="w-full h-full flex items-center justify-center text-[#9CA3AF]"><svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-[#1A1A1A] truncate">{user.displayName||"User"}</p>
                <p className="text-[12px] text-[#9CA3AF] truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button onClick={withTap(()=>setShowSignOut(true),"medium")} className="w-full py-3 flex items-center justify-center gap-2 text-[#E03131] text-[14px] font-semibold rounded-2xl active:scale-[0.98] transition-transform" style={{backgroundColor:"#E0313108"}}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Sign Out
          </button>
          <p className="text-[11px] text-[#D1D5DB] text-center mt-3">{cfg.siteName} v1.0</p>
        </div>
      </div></div>)}

      {/* Sign Out Confirm */}
      {showSignOut&&(
        <div className="fixed inset-0 z-[55] flex items-center justify-center p-5 a-fadeIn">
          <div className="absolute inset-0 overlay" onClick={()=>setShowSignOut(false)}/>
          <div className="relative bg-white rounded-3xl p-7 w-full max-w-xs text-center a-scaleIn" style={CS}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{backgroundColor:"#E0313112",color:"#E03131"}}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            </div>
            <p className="font-bold text-[18px] text-[#1A1A1A] mb-1">Sign out?</p>
            <p className="text-[14px] text-[#6B7280] mb-6">You will need to sign in again to access your leads.</p>
            <div className="space-y-2">
              <button onClick={withTap(()=>{setShowSignOut(false);closeNav();logOut();},"heavy")} className="w-full py-3.5 text-white text-[16px] font-bold rounded-2xl bg-[#E03131] active:scale-[0.98] transition-transform">Sign Out</button>
              <button onClick={withTap(()=>setShowSignOut(false))} className="w-full py-3.5 text-[#6B7280] text-[16px] font-medium rounded-2xl active:scale-[0.98] transition-transform">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {form&&(<div className="fixed inset-0 z-50 a-fadeIn"><div className="absolute inset-0 overlay" onClick={()=>setForm(false)}/><div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto a-slideUp"><div className="max-w-lg mx-auto p-5">
        <div className="flex justify-center mb-3"><div className="w-10 h-1 bg-[#ECEEE8] rounded-full"/></div>
        <div className="flex items-center justify-between mb-5"><button onClick={withTap(()=>setForm(false))} className="text-[#9CA3AF] text-[15px] font-medium">Cancel</button><h2 className="font-bold text-[17px] text-[#1A1A1A]">{editing?"Edit Lead":"New Lead"}</h2><button onClick={withTap(save,"medium")} disabled={sv} className="text-[#3B5BDB] font-bold text-[15px]">{sv?"...":"Save"}</button></div>
        <div className={`${C} p-4 divide-y divide-[#F3F4F0] mb-4`} style={CS}>
          {[{l:"Phone",el:<><input type="tel" value={ph||"+91"} onChange={e=>hP(e.target.value)} className="w-full bg-transparent text-[16px] text-[#1A1A1A] focus:outline-none text-right font-medium" placeholder="+91 XXXXX XXXXX"/>{phD&&<p className={`text-[11px] mt-1 text-right font-medium ${vP(phD).ok?"text-[#2B8A3E]":"text-[#E67700]"}`}>{vP(phD).m}</p>}</>},{l:"Name *",el:<input type="text" value={nm} onChange={e=>setNm(e.target.value)} placeholder="Full name" className="w-full bg-transparent text-[16px] text-[#1A1A1A] focus:outline-none text-right font-medium placeholder-[#D1D5DB]"/>},{l:"Visit",el:<input type="date" value={vd} onChange={e=>setVd(e.target.value)} className="bg-transparent text-[16px] text-[#1A1A1A] focus:outline-none ml-auto block font-medium"/>},{l:"Expected *",el:<input type="date" value={ed} onChange={e=>setEd(e.target.value)} className="bg-transparent text-[16px] text-[#1A1A1A] focus:outline-none ml-auto block font-medium"/>},{l:"Product *",el:<input type="text" value={pr} onChange={e=>setPr(e.target.value)} placeholder="Product or service" className="w-full bg-transparent text-[16px] text-[#1A1A1A] focus:outline-none text-right font-medium placeholder-[#D1D5DB]"/>}].map(f=>(
            <div key={f.l} className="flex items-center justify-between py-4 gap-4"><label className="text-[15px] text-[#6B7280] shrink-0">{f.l}</label><div className="flex-1 min-w-0">{f.el}</div></div>
          ))}
        </div>
        <div className={`${C} p-4 mb-5`} style={CS}><label className="text-[15px] text-[#6B7280] block mb-2">Notes</label><textarea value={nt} onChange={e=>setNt(e.target.value)} placeholder="Optional notes..." rows={3} className="w-full bg-transparent text-[16px] text-[#1A1A1A] focus:outline-none resize-none font-medium placeholder-[#D1D5DB]"/></div>
        <div className="h-4"/>
      </div></div></div>)}

      {/* Logs */}
      {logSheet&&logLead&&(<div className="fixed inset-0 z-50 a-fadeIn"><div className="absolute inset-0 overlay" onClick={()=>setLogSheet(false)}/><div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl max-h-[88vh] overflow-y-auto a-slideUp"><div className="max-w-lg mx-auto p-5">
        <div className="flex justify-center mb-3"><div className="w-10 h-1 bg-[#ECEEE8] rounded-full"/></div>
        <div className="flex items-center justify-between mb-4"><button onClick={withTap(()=>setLogSheet(false))} className="text-[#9CA3AF] text-[15px] font-medium">Close</button><h2 className="font-bold text-[17px] text-[#1A1A1A]">Follow-up Logs</h2><button onClick={withTap(()=>{setAddLog(true);setRemark("");})} className="text-[#3B5BDB] font-bold text-[15px]">+ Add</button></div>
        <div className={`${C} p-4 mb-4 flex items-center gap-3`} style={CS}><div className="w-10 h-10 rounded-2xl flex items-center justify-center text-[13px] font-bold" style={{backgroundColor:avc(logLead.name)+"15",color:avc(logLead.name)}}>{ini(logLead.name)}</div><div><p className="font-semibold text-[15px] text-[#1A1A1A]">{logLead.name}</p><p className="text-[13px] text-[#6B7280]">{logLead.product}</p></div></div>
        {addLog&&(<div className={`${C} p-4 mb-4`} style={CS}><p className="text-[12px] text-[#9CA3AF] font-medium mb-2">{fmt(td())} · auto</p><textarea value={remark} onChange={e=>setRemark(e.target.value)} placeholder="Enter remark..." rows={3} autoFocus className="w-full bg-[#F4F5F0] rounded-xl px-4 py-3 text-[15px] text-[#1A1A1A] focus:outline-none resize-none placeholder-[#D1D5DB] font-medium"/><div className="flex gap-3 mt-3"><button onClick={withTap(()=>setAddLog(false))} className="flex-1 py-3 text-[#9CA3AF] text-[14px] font-medium rounded-xl">Cancel</button><button onClick={withTap(savLog,"medium")} className="flex-1 py-3 bg-[#1A1A1A] text-white rounded-xl text-[14px] font-bold active:scale-[0.98] transition-transform">Save</button></div></div>)}
        <div className="pb-6">
          {logs.length===0&&!addLog?<div className="text-center py-12"><p className="text-[#D1D5DB] text-[15px] font-medium mb-4">No logs yet</p><button onClick={withTap(()=>{setAddLog(true);setRemark("");})} className="px-5 py-3 bg-[#1A1A1A] text-white rounded-2xl text-[14px] font-bold active:scale-[0.97] transition-transform">Add First Log</button></div>
          :<div className="relative">{logs.length>0&&<div className="absolute left-[8px] top-3 bottom-3 w-0.5 bg-[#F3F4F0] rounded-full"/>}<div className="space-y-4">{logs.map(log=>(<div key={log.id} className="flex gap-4 relative"><div className="w-4 h-4 rounded-full bg-[#3B5BDB] shrink-0 mt-0.5 z-10 border-[3px] border-white"/><div className="flex-1"><p className="text-[11px] text-[#3B5BDB] font-bold">{fmt(log.date)}</p><div className={`${C} p-3.5 mt-1.5`} style={CS}><p className="text-[14px] text-[#1A1A1A] leading-relaxed">{log.remark}</p></div></div></div>))}</div></div>}
        </div>
      </div></div></div>)}

      {/* Delete */}
      {del&&(<div className="fixed inset-0 z-50 flex items-center justify-center p-5 a-fadeIn"><div className="absolute inset-0 overlay" onClick={()=>setDel(null)}/><div className="relative bg-white rounded-3xl p-7 w-full max-w-xs text-center a-scaleIn" style={CS}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[#E03131] mx-auto mb-4" style={{backgroundColor:"#E0313112"}}>{I.trash}</div>
        <p className="font-bold text-[18px] text-[#1A1A1A] mb-1">Delete Lead?</p>
        <p className="text-[14px] text-[#6B7280] mb-6">This removes the lead and all logs.</p>
        <div className="space-y-2"><button onClick={withTap(()=>rm(del.id),"heavy")} className="w-full py-3.5 text-white text-[16px] font-bold rounded-2xl bg-[#E03131] active:scale-[0.98] transition-transform">Delete</button><button onClick={withTap(()=>setDel(null))} className="w-full py-3.5 text-[#6B7280] text-[16px] font-medium rounded-2xl active:scale-[0.98] transition-transform">Cancel</button></div>
      </div></div>)}

      {/* ═══ Login Popup ═══ */}
      {!user&&!authLoading&&!isFirebaseConfigured&&(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5" style={{background:"rgba(244,245,240,0.4)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}>
          <div className="bg-white w-full max-w-[300px] text-center" style={{borderRadius:32,padding:"40px 32px 32px",boxShadow:"0 16px 64px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)"}}>
            <div className="mx-auto mb-6 w-14 h-14 rounded-2xl overflow-hidden"><img src={logoSrc} alt={cfg.siteName} className="w-full h-full object-cover" referrerPolicy="no-referrer"/></div>
            <h2 className="text-[18px] font-bold text-[#1A1A1A] tracking-tight mb-2">Setup Required</h2>
            <p className="text-[13px] text-[#6B7280] leading-relaxed mb-4">Firebase is not configured. Add environment variables in Vercel and redeploy.</p>
            <div className="bg-[#F4F5F0] rounded-2xl p-3 text-left text-[11px] text-[#6B7280] font-mono space-y-0.5">
              <p>NEXT_PUBLIC_FIREBASE_API_KEY</p>
              <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID</p>
              <p>NEXT_PUBLIC_FIREBASE_APP_ID</p>
            </div>
          </div>
        </div>
      )}
      {!user&&!authLoading&&isFirebaseConfigured&&(
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-5 a-fadeIn" style={{background:"rgba(244,245,240,0.4)",backdropFilter:"blur(16px)",WebkitBackdropFilter:"blur(16px)"}}>
          <div className="bg-white w-full max-w-[300px] a-scaleIn text-center" style={{borderRadius:32,padding:"40px 32px 32px",boxShadow:"0 16px 64px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.03)"}}>
            <div className="mx-auto mb-6 w-14 h-14 rounded-2xl overflow-hidden">
<img src={logoSrc} alt={cfg.siteName} className="w-full h-full object-cover" referrerPolicy="no-referrer"/>
            </div>
            <h2 className="text-[20px] font-bold text-[#1A1A1A] tracking-tight leading-tight">Welcome back</h2>
            <p className="text-[13px] text-[#9CA3AF] mt-1.5 mb-7">Sign in to continue to {cfg.siteName}</p>
            <button onClick={signIn} disabled={signingIn} className="w-full py-3.5 rounded-2xl text-[14px] font-semibold text-[#1A1A1A] flex items-center justify-center gap-2.5 active:scale-[0.97] transition-transform disabled:opacity-50" style={{border:"1px solid #E8E8E8",background:"#fff"}}>
              {signingIn?<span className="text-[#9CA3AF]">Signing in...</span>:<>{GoogleIcon} Continue with Google</>}
            </button>
            <p className="text-[10px] text-[#BFBFBF] mt-5 leading-relaxed">
              By continuing you agree to the<br/>
              <a href="/terms" className="text-[#1A1A1A] font-medium">Terms</a>
              {" and "}
              <a href="/privacy" className="text-[#1A1A1A] font-medium">Privacy Policy</a>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
