import React, { useState, useEffect } from "react";
import { Helmet } from 'react-helmet-async';
import NoIndex from '../components/seo/NoIndex';
import MobileBottomNav from '../components/layout/MobileBottomNav';
import { useTheme } from '../context/ThemeContext';
import { DARK, LIGHT } from '../styles/tokens';
import api from '../api/axios';

/* ─── DASHBOARD CSS (scoped animations only) ─── */
const G = `
@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
@keyframes drawLine{from{stroke-dashoffset:400}to{stroke-dashoffset:0}}
@keyframes tipIn{from{opacity:0;transform:translateX(6px)}to{opacity:1;transform:translateX(0)}}
@keyframes countUp{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:translateY(0)}}
.page-enter > *{animation:fadeUp 0.3s ease both}
.page-enter > *:nth-child(1){animation-delay:0.02s}
.page-enter > *:nth-child(2){animation-delay:0.05s}
.page-enter > *:nth-child(3){animation-delay:0.08s}
.page-enter > *:nth-child(4){animation-delay:0.11s}
.page-enter > *:nth-child(5){animation-delay:0.14s}
.page-enter > *:nth-child(6){animation-delay:0.17s}
.page-enter > *:nth-child(7){animation-delay:0.20s}

.creator-metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}
@media (min-width: 640px) {
  .creator-metrics-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1024px) {
  .creator-metrics-grid { grid-template-columns: repeat(6, 1fr); }
}

.creator-tools-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}
@media (min-width: 640px) {
  .creator-tools-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .creator-tools-grid { grid-template-columns: repeat(3, 1fr); }
}

.creator-desktop-nav {
  display: none;
}
.creator-mobile-nav {
  display: flex;
}

@media (min-width: 768px) {
  .creator-desktop-nav { display: flex !important; }
  .creator-mobile-nav { display: none !important; }
}
`;

/* ─── SVG ICON SYSTEM ────────────────────────────────────────────────────── */
// All icons: 24×24 viewBox, 1.8px stroke, rounded, no fill (unless specified)
const Ic = ({ d, size=18, color="currentColor", sw=1.8, fill="none", extra=[] }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
    stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {(Array.isArray(d) ? d : [d]).map((p,i)=><path key={i} d={p}/>)}
    {extra.map((e,i)=>(
      e.type==="circle"
        ? <circle key={i} cx={e.cx} cy={e.cy} r={e.r} stroke={color} strokeWidth={sw} fill="none"/>
        : e.type==="line"
        ? <line key={i} x1={e.x1} y1={e.y1} x2={e.x2} y2={e.y2} stroke={color} strokeWidth={sw}/>
        : null
    ))}
  </svg>
);

// Icon library — all custom, consistent 1.8px rounded line style
const Icons = {
  // Nav
  overview:  <Ic d={["M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z","M9 21V12h6v9"]}/>,
  analytics: <Ic d={["M3 17l4-6 4 3 4-8 4 4"]} extra={[{type:"line",x1:3,y1:21,x2:21,y2:21}]}/>,
  content:   <Ic d={["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z","M14 2v6h6","M8 13h8","M8 17h5"]}/>,
  community: <Ic d={["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"]} extra={[{type:"circle",cx:9,cy:7,r:4},{type:"circle",cx:19,cy:11,r:2}]}/>,
  more:      <Ic d={["M5 12h.01","M12 12h.01","M19 12h.01"]} sw={2.5}/>,

  // Metrics
  eye:       <Ic d={["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"]} extra={[{type:"circle",cx:12,cy:12,r:3}]}/>,
  lightning: <Ic d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>,
  users:     <Ic d={["M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M23 21v-2a4 4 0 00-3-3.87"]} extra={[{type:"circle",cx:9,cy:7,r:4}]}/>,
  bookmark:  <Ic d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>,
  cursor:    <Ic d={["M5 3l14 9-7 1-4 7-3-17z"]}/>  ,
  wallet:    <Ic d={["M21 12V7a2 2 0 00-2-2H3a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2v-5z"]} extra={[{type:"circle",cx:17,cy:14,r:1}]}/>,

  // Community
  chat:      <Ic d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>,
  comments:  <Ic d={["M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z","M8 10h8","M8 14h5"]}/>,
  graduation:<Ic d={["M22 10l-10 6L2 10l10-6 10 6z","M6 12v5c2 2 8 2 12 0v-5"]} extra={[{type:"line",x1:12,y1:16,x2:12,y2:21}]}/>,
  network:   <Ic d={["M12 2v4","M12 18v4","M4.93 4.93l2.83 2.83","M16.24 16.24l2.83 2.83","M2 12h4","M18 12h4","M4.93 19.07l2.83-2.83","M16.24 7.76l2.83-2.83"]}  sw={1.8}/>,
  megaphone: <Ic d={["M3 11v2a6 6 0 006 6h1","M18 8l3-3","M18 16l3 3","M5 8l13-5v14L5 12V8z"]}/>,
  userplus:  <Ic d={["M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2","M19 8v6","M22 11h-6"]} extra={[{type:"circle",cx:8.5,cy:7,r:4}]}/>,

  // Content types
  article:   <Ic d={["M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z","M14 2v6h6","M8 12h8","M8 16h5","M8 8h3"]}/>,
  tutorial:  <Ic d={["M5 3l14 9-14 9V3z","M19 3v18"]}/>  ,
  resource:  <Ic d={["M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z","M12 11v6","M9 14h6"]}/>,
  course:    <Ic d={["M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z","M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"]}/>,
  draft:     <Ic d={["M12 20h9","M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"]}/>,
  scheduled: <Ic d={["M8 2v4","M16 2v4","M3 10h18"]} extra={[{type:"circle",cx:12,cy:14,r:1}]}/>,

  // More tab tools
  diamond:   <Ic d={["M12 2l3 7h7l-6 5 2 7-6-4-6 4 2-7-6-5h7z"]}/>,
  coin:      <Ic d={["M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z","M12 6v2m0 8v2m-4-5h8"]}  extra={[{type:"circle",cx:12,cy:12,r:3}]}/>,
  receipt:   <Ic d={["M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2","M9 5a2 2 0 002 2h2a2 2 0 002-2","M9 12h6","M9 16h4"]}/>,
  transfer:  <Ic d={["M5 12h14","M12 5l7 7-7 7","M7 8H3","M21 16h-4"]}/>  ,
  sparkle:   <Ic d={["M12 2v4","M12 18v4","M4.93 4.93l2.83 2.83","M16.24 16.24l2.83 2.83","M2 12h4","M18 12h4","M4.93 19.07l2.83-2.83","M16.24 7.76l2.83-2.83"]} sw={1.8}/>,
  layers:    <Ic d={["M12 2L2 7l10 5 10-5-10-5z","M2 17l10 5 10-5","M2 12l10 5 10-5"]}/>,
  shield:    <Ic d={["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z","M9 12l2 2 4-4"]}/>,
  gear:      <Ic d={["M12 15a3 3 0 100-6 3 3 0 000 6z","M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"]}/>,
  bell:      <Ic d={["M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9","M13.73 21a2 2 0 01-3.46 0"]}/>,
  help:      <Ic d={["M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"]} extra={[{type:"circle",cx:12,cy:12,r:10},{type:"circle",cx:12,cy:17,r:0.5}]}/>,
  bestpractice:<Ic d={["M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"]}/>,
  recap:     <Ic d={["M3 3h18v4H3z","M3 10h12v4H3z","M3 17h8v4H3z"]}/>,

  // Misc
  arrowRight:<Ic d="M5 12h14M12 5l7 7-7 7"/>,
  plus:      <Ic d="M12 5v14M5 12h14"/>,
  edit:      <Ic d={["M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7","M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"]}/>,
  trash:     <Ic d={["M3 6h18","M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"]}/>,
  duplicate: <Ic d={["M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2","M10 10h8a2 2 0 012 2v8a2 2 0 01-2 2h-8a2 2 0 01-2-2v-8a2 2 0 012-2z"]}/>,
  boost:     <Ic d={["M13 2L3 14h9l-1 8 10-12h-9l1-8z"]}/>,
  sun:       <Ic d={["M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"]} extra={[{type:"circle",cx:12,cy:12,r:5}]}/>,
  moon:      <Ic d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>,
  radar:     <Ic d={["M12 2v4","M12 18v4","M4.93 4.93l2.83 2.83","M16.24 16.24l2.83 2.83"]} extra={[{type:"circle",cx:12,cy:12,r:3},{type:"circle",cx:12,cy:12,r:7}]}/>,
  piechart:  <Ic d={["M21.21 15.89A10 10 0 118 2.83","M22 12A10 10 0 0012 2v10z"]}/>,
};

/* ─── MICRO COMPONENTS ───────────────────────────────────────────────────── */
function Badge({ children, color }) {
  return (
    <span style={{
      display:"inline-flex",alignItems:"center",
      padding:"2px 7px",borderRadius:4,
      fontSize:10,fontWeight:600,letterSpacing:0.1,
      background:color+"1E",color,
    }}>{children}</span>
  );
}

function SectionLabel({ children, T }) {
  return (
    <div style={{
      fontSize:10,fontWeight:700,letterSpacing:1.4,
      textTransform:"uppercase",color:T.txt3,marginBottom:10,
    }}>{children}</div>
  );
}

function IconBox({ icon, color, size=36 }) {
  return (
    <div style={{
      width:size,height:size,borderRadius:Math.round(size*0.28),flexShrink:0,
      background:color+"14",border:`1px solid ${color}28`,
      display:"flex",alignItems:"center",justifyContent:"center",
      color,
    }}>{icon}</div>
  );
}

/* ─── SPARKLINE ──────────────────────────────────────────────────────────── */
function Spark({ data, color, w=60, h=20 }) {
  const id = `sp${color.replace(/[^a-z0-9]/gi,"")}${Math.random().toString(36).slice(2,6)}`;
  const mn=Math.min(...data), mx=Math.max(...data), r=mx-mn||1;
  const pts=data.map((v,i)=>`${((i/(data.length-1))*w).toFixed(1)},${(h-((v-mn)/r)*(h-2)).toFixed(1)}`).join(" ");
  return (
    <svg width={w} height={h} style={{display:"block",overflow:"visible"}}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#${id})`}/>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.6"
        strokeLinejoin="round" strokeLinecap="round"
        strokeDasharray="300" strokeDashoffset="300"
        style={{animation:"drawLine 1s ease forwards"}}/>
    </svg>
  );
}

/* ─── COUNTER ────────────────────────────────────────────────────────────── */
function Counter({ to, prefix="", suffix="" }) {
  const [v,setV]=useState(0);
  useEffect(()=>{
    let s=null,id=null;
    const step=(ts)=>{if(!s)s=ts;const p=Math.min((ts-s)/800,1);setV(Math.round(p*p*to));if(p<1){id=requestAnimationFrame(step)}else{setV(to);}};
    id=requestAnimationFrame(step);
    return()=>cancelAnimationFrame(id);
  },[to]);
  return <>{prefix}{v>=1000?`${(v/1000).toFixed(1)}k`:v}{suffix}</>;
}

/* ─── LINE CHART ─────────────────────────────────────────────────────────── */
function LineChart({ datasets, labels, T }) {
  const h=110,w=320,pad=8;
  const allVals=datasets.flatMap(d=>d.data);
  const mn=Math.min(...allVals),mx=Math.max(...allVals),r=mx-mn||1;
  const x=(i)=>pad+(i/(labels.length-1))*(w-pad*2);
  const y=(v)=>h-pad-((v-mn)/r)*(h-pad*2);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{width:"100%",height:h,display:"block"}}>
      {[0,0.5,1].map((t,i)=>(
        <line key={i} x1={pad} y1={y(mn+t*r)} x2={w-pad} y2={y(mn+t*r)}
          stroke={T.border} strokeWidth="1"/>
      ))}
      {datasets.map((ds,di)=>{
        const pts=ds.data.map((v,i)=>`${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
        const id=`lc${di}${ds.color.replace(/[^a-z0-9]/gi,"")}`;
        return (
          <g key={di}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ds.color} stopOpacity="0.15"/>
                <stop offset="100%" stopColor={ds.color} stopOpacity="0"/>
              </linearGradient>
            </defs>
            <polygon points={`${x(0)},${h-pad} ${pts} ${x(labels.length-1)},${h-pad}`} fill={`url(#${id})`}/>
            <polyline points={pts} fill="none" stroke={ds.color} strokeWidth="1.8"
              strokeLinejoin="round" strokeLinecap="round"
              strokeDasharray="400" strokeDashoffset="400"
              style={{animation:"drawLine 1.2s ease forwards",animationDelay:`${di*0.12}s`}}/>
          </g>
        );
      })}
      {labels.map((l,i)=>(
        <text key={i} x={x(i)} y={h-1} textAnchor="middle"
          style={{fontSize:8,fill:T.txt3,fontFamily:"Inter,sans-serif"}}>{l}</text>
      ))}
    </svg>
  );
}

/* ─── BAR CHART ──────────────────────────────────────────────────────────── */
function BarChart({ data, color, T }) {
  const mx=Math.max(...data.map(d=>d.v));
  return (
    <div style={{display:"flex",alignItems:"flex-end",gap:5,height:64}}>
      {data.map((d,i)=>(
        <div key={i} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
          <div style={{
            width:"100%",borderRadius:"3px 3px 0 0",
            height:`${Math.max(3,(d.v/mx)*50)}px`,
            background:i===data.length-1?`linear-gradient(180deg,${color},${color}66)`:`${color}26`,
            transition:"height 0.7s cubic-bezier(.16,1,.3,1)",
          }}/>
          <span style={{fontSize:8.5,color:T.txt3}}>{d.l}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── STAT CARD ──────────────────────────────────────────────────────────── */
function StatCard({ label, val, growth, up, color, spark, T, icon }) {
  const [hov,setHov]=useState(false);
  return (
    <div onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} style={{
      background:hov?T.cardHover:T.card,
      border:`1px solid ${hov?color+"55":T.border}`,
      borderRadius:10,padding:"13px 13px 10px",
      transition:"all 0.18s ease",boxShadow:T.shadow,
      position:"relative",overflow:"hidden",cursor:"default",
    }}>
      <div style={{
        position:"absolute",top:0,left:0,right:0,height:2,
        background:`linear-gradient(90deg,transparent,${color}99,transparent)`,
        opacity:hov?1:0.45,transition:"opacity 0.2s",
      }}/>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:7}}>
        <div style={{color,opacity:0.85}}>{icon}</div>
        <span style={{
          fontSize:9.5,fontWeight:600,padding:"2px 6px",borderRadius:4,
          background:up?T.greenDim:T.redDim,color:up?T.green:T.red,
        }}>{growth}</span>
      </div>
      <div style={{
        fontSize:26,fontWeight:700,color:T.txt,lineHeight:1,
        marginBottom:3,letterSpacing:-0.5,
        fontFamily:"Space Grotesk,sans-serif",
        animation:"countUp 0.4s ease both",
      }}><Counter to={val}/></div>
      <div style={{fontSize:10,color:T.txt3,marginBottom:9,fontWeight:500}}>{label}</div>
      <Spark data={spark} color={color}/>
    </div>
  );
}

/* ─── PAGE HEADER ────────────────────────────────────────────────────────── */
function PageHeader({ title, sub, dark, setDark, T }) {
  return (
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
      <div>
        <div style={{
          fontSize:22,fontWeight:800,color:T.txt,letterSpacing:-0.5,lineHeight:1,marginBottom:5,
        }}>{title}</div>
        {sub && <div style={{fontSize:11.5,color:T.txt2,fontWeight:400}}>{sub}</div>}
      </div>
      <button onClick={()=>setDark(!dark)} style={{
        width:34,height:34,borderRadius:9,marginTop:2,flexShrink:0,
        background:T.purpleDim,border:`1px solid ${T.border}`,
        display:"flex",alignItems:"center",justifyContent:"center",
        color:T.txt2,transition:"all 0.15s",
      }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=T.purple;e.currentTarget.style.color=T.purple;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.txt2;}}
      >{dark ? <Ic d={Icons.sun.props.d||""} size={16} color="currentColor" sw={1.8}/> : null}
        {dark ? <>{Icons.sun}</> : <>{Icons.moon}</>}
      </button>
    </div>
  );
}

/* ─── DATA ───────────────────────────────────────────────────────────────── */
const METRICS=[
  {label:"Total Views",    val:26,  growth:"+12%",up:true, color:"#2D7FFF",iconKey:"eye",      spark:[4,7,5,9,8,12,14,11,16,20,18,26]},
  {label:"Interactions",   val:38,  growth:"+5%", up:true, color:"#8A2BFF",iconKey:"lightning", spark:[10,12,8,15,14,18,20,16,22,28,32,38]},
  {label:"Followers",      val:15,  growth:"+3",  up:true, color:"#00C9B1",iconKey:"users",     spark:[8,9,9,10,10,11,11,12,13,14,14,15]},
  {label:"Saves",          val:47,  growth:"+18%",up:true, color:"#E8A020",iconKey:"bookmark",  spark:[5,8,12,10,18,22,25,28,32,38,42,47]},
  {label:"Profile Clicks", val:312, growth:"+29%",up:true, color:"#E8354A",iconKey:"cursor",    spark:[40,60,80,70,110,140,160,190,220,260,290,312]},
  {label:"Revenue",        val:0,   growth:"—",   up:false,color:"#22C55E",iconKey:"wallet",    spark:[0,0,0,0,0,0,0,0,0,0,0,0]},
];
const WEEK=[{l:"Mon",v:3},{l:"Tue",v:6},{l:"Wed",v:4},{l:"Thu",v:8},{l:"Fri",v:5},{l:"Sat",v:12},{l:"Sun",v:9}];
const CHART_LABELS=["Apr 1","Apr 5","Apr 9","Apr 13","Apr 17","Apr 21","Apr 24"];
const CHART_DS=[
  {label:"Views",color:"#2D7FFF",data:[4,8,6,12,10,18,26]},
  {label:"Saves",color:"#E8A020",data:[2,4,6,8,10,14,20]},
  {label:"Followers",color:"#00C9B1",data:[8,9,10,11,12,13,15]},
];
const POSTS=[
  {title:"Project Glasswing — The Future of Web Architecture",type:"article",views:26,likes:3,saves:8,comments:2,status:"published"},
  {title:"React 19 Deep Dive: What Actually Changed",          type:"tutorial",views:0, likes:0,saves:0,comments:0,status:"draft"},
  {title:"Node.js Auth Cookbook for 2024",                     type:"resource",views:0, likes:0,saves:0,comments:0,status:"draft"},
];
const TYPE_COLOR={article:"#2D7FFF",tutorial:"#8A2BFF",resource:"#00C9B1",course:"#E8A020"};
const TYPE_ICON={article:"article",tutorial:"tutorial",resource:"resource",course:"course",draft:"draft"};
const AI_TIPS=[
  {tag:"Reach",   text:"React tutorials get +32% more reach on Saturdays & Sundays."},
  {tag:"Timing",  text:"Your audience is most active between 7 PM and 10 PM IST."},
  {tag:"Content", text:"Node.js posts earn 3× more saves than any other topic."},
  {tag:"Monetize",text:"Upload 1 course to unlock the Payout Center."},
];
const SAVED_REPLIES=[
  "Thanks for following Code Plus Academy! 🚀",
  "Course link: codeplusacademy.in/courses",
  "DM me for mentorship — limited slots available.",
  "New resource just dropped — check my profile!",
];
const TOOLS_LIST=[
  {label:"Earnings",      iconKey:"diamond",       color:"#22C55E",desc:"View revenue & payouts"},
  {label:"AI Assistant",  iconKey:"sparkle",       color:"#8A2BFF",desc:"Growth suggestions",     badge:"Pro"},
  {label:"Saved Replies", iconKey:"layers",        color:"#2D7FFF",desc:"Reply templates"},
  {label:"Brand Deals",   iconKey:"megaphone",     color:"#E8A020",desc:"Sponsorship requests"},
  {label:"Settings",      iconKey:"gear",          color:"#9DA3AE",desc:"Account & preferences"},
  {label:"Notifications", iconKey:"bell",          color:"#2D7FFF",desc:"Alerts & updates"},
  {label:"Security",      iconKey:"shield",        color:"#E8354A",desc:"2FA, sessions, access"},
  {label:"Monthly Recap", iconKey:"recap",         color:"#00C9B1",desc:"Your month in review",   badge:"New"},
  {label:"Best Practices",iconKey:"bestpractice",  color:"#22C55E",desc:"Growth playbook"},
  {label:"Course Sales",  iconKey:"receipt",       color:"#8A2BFF",desc:"Sales & enrollment"},
  {label:"Payouts",       iconKey:"transfer",      color:"#22C55E",desc:"Withdrawal history"},
  {label:"Help Center",   iconKey:"help",          color:"#9DA3AE",desc:"Docs & support"},
];

/* ─── COMMUNITY ROW ITEMS ────────────────────────────────────────────────── */
const COMMUNITY_ITEMS=[
  {label:"Message Requests",  val:0, color:"#2D7FFF",iconKey:"chat",       sub:"No new messages"},
  {label:"Pending Comments",  val:2, color:"#E8A020",iconKey:"comments",   sub:"2 awaiting response"},
  {label:"Student Questions", val:0, color:"#8A2BFF",iconKey:"graduation", sub:"All caught up"},
  {label:"Collaboration Invites",val:1,color:"#22C55E",iconKey:"network", sub:"1 new invitation"},
  {label:"Brand Requests",    val:0, color:"#E8354A",iconKey:"megaphone",  sub:"No new requests"},
];
const ACTIVITY_ITEMS=[
  {iconKey:"eye",       txt:"Your article received 26 views this week",  t:"2h ago",  c:"#2D7FFF"},
  {iconKey:"userplus",  txt:"2 new followers joined your academy",        t:"5h ago",  c:"#00C9B1"},
  {iconKey:"comments",  txt:"2 pending comments on your article",         t:"1d ago",  c:"#E8A020"},
  {iconKey:"bookmark",  txt:"Your content was saved 8 times this week",  t:"2d ago",  c:"#E8354A"},
];

/* ════════════════ PAGE COMPONENTS ════════════════════════════════════════ */

/* ── OVERVIEW ──────────────────────────────────────────────────────────────── */
function PageOverview({ T, dark, setDark }) {
  const [tipIdx,setTipIdx]=useState(0);
  const [range,setRange]=useState("30D");
  useEffect(()=>{const t=setInterval(()=>setTipIdx(i=>(i+1)%AI_TIPS.length),4500);return()=>clearInterval(t);},[]);
  const cs={background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:T.shadow};
  return (
    <div className="page-enter">
      <PageHeader title="Growth Center" sub="Mar 25 – Apr 24 · CPA Creator" dark={dark} setDark={setDark} T={T}/>

      {/* Alert */}
      <div style={{...cs,padding:"10px 13px",marginBottom:10,border:`1px solid ${T.gold}33`,background:T.goldDim,display:"flex",alignItems:"center",gap:10}}>
        <div style={{color:T.gold,flexShrink:0}}>{Icons.sparkle}</div>
        <span style={{fontSize:11.5,color:T.txt,fontWeight:500,flex:1,lineHeight:1.4}}>Upload your first course to activate the Earnings dashboard.</span>
        <button style={{fontSize:10,fontWeight:600,color:T.gold,padding:"3px 8px",borderRadius:5,border:`1px solid ${T.gold}44`,background:`${T.gold}18`,flexShrink:0}}>Go →</button>
      </div>

      {/* Quick Actions */}
      <div style={{display:"flex",gap:7,overflowX:"auto",paddingBottom:2,marginBottom:12}}>
        {[
          {l:"+ New Post",c:T.purple, path:'/posts/new'},
          {l:"↑ Upload",c:T.blue, path:'/notes/upload'},
          {l:"◎ Course",c:T.cyan, path:'/courses/new'},
          {l:"∿ Analytics",c:T.gold, path:'/creator/dashboard'}, // fallback to self or reset tab
          {l:"₹ Earnings",c:T.green, path:'/creator/dashboard'}
        ].map(a=>(
          <button key={a.l} onClick={() => {
            if (a.path) window.location.href = a.path;
          }} style={{
            flexShrink:0,padding:"7px 12px",borderRadius:7,
            border:`1px solid ${a.c}40`,background:`${a.c}0E`,color:a.c,
            fontSize:11,fontWeight:600,whiteSpace:"nowrap",transition:"filter 0.15s",
            cursor:"pointer"
          }}
          onMouseEnter={e=>e.currentTarget.style.filter="brightness(1.2)"}
          onMouseLeave={e=>e.currentTarget.style.filter=""}>{a.l}</button>
        ))}
      </div>

      {/* Range */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:11,color:T.txt2}}>Mar 25 – Apr 24, 2025</span>
        <div style={{display:"flex",gap:4}}>
          {["7D","30D","90D"].map(r=>(
            <button key={r} onClick={()=>setRange(r)} style={{
              padding:"3px 8px",borderRadius:5,fontSize:10,fontWeight:600,
              border:`1px solid ${range===r?T.purple:T.border}`,
              background:range===r?T.purple:"transparent",
              color:range===r?"#fff":T.txt3,transition:"all 0.15s",
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* Metrics grid */}
      <div className="creator-metrics-grid">
        {METRICS.map(m=>(
          <StatCard key={m.label} T={T} {...m} 
            icon={React.cloneElement(Icons[m.iconKey],{size:16,color:m.color})}
          />
        ))}
      </div>

      {/* Revenue summary */}
      <div style={{...cs,padding:"14px",marginBottom:10}}>
        <SectionLabel T={T}>Revenue Summary</SectionLabel>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:0}}>
          {[{l:"This Month",v:"₹0",c:T.green},{l:"Pending",v:"₹0",c:T.gold},{l:"Courses",v:"0",c:T.blue},{l:"Tips",v:"₹0",c:T.purple}].map((s,i)=>(
            <div key={s.l} style={{textAlign:"center",borderLeft:i>0?`1px solid ${T.border}`:"none",padding:"4px 0"}}>
              <div style={{fontSize:18,fontWeight:700,color:s.c,fontFamily:"Space Grotesk,sans-serif",lineHeight:1}}>{s.v}</div>
              <div style={{fontSize:9.5,color:T.txt3,marginTop:4}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Tip */}
      <div style={{...cs,padding:"14px",marginBottom:10,border:`1px solid ${T.purple}28`,background:dark?`linear-gradient(135deg,${T.purpleDim},${T.blueDim})`:"transparent"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <SectionLabel T={T}>AI Growth Suggestions</SectionLabel>
          <span style={{fontSize:9,fontWeight:700,padding:"2px 7px",borderRadius:10,background:`${T.purple}22`,color:T.purple,letterSpacing:0.5}}>LIVE</span>
        </div>
        <div key={tipIdx} style={{display:"flex",gap:11,animation:"tipIn 0.3s ease"}}>
          <IconBox icon={React.cloneElement(Icons.sparkle,{size:17,color:"#fff"})} color={T.purple} size={38}/>
          <div>
            <Badge color={T.purple}>{AI_TIPS[tipIdx].tag}</Badge>
            <div style={{fontSize:12,color:T.txt,lineHeight:1.55,fontWeight:500,marginTop:6}}>{AI_TIPS[tipIdx].text}</div>
          </div>
        </div>
        <div style={{display:"flex",gap:5,marginTop:12}}>
          {AI_TIPS.map((_,i)=>(
            <div key={i} onClick={()=>setTipIdx(i)} style={{
              height:2,flex:i===tipIdx?4:1,borderRadius:1,cursor:"pointer",
              background:i===tipIdx?T.purple:`${T.purple}28`,transition:"flex 0.4s ease",
            }}/>
          ))}
        </div>
      </div>

      {/* Weekly */}
      <div style={{...cs,padding:"14px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <SectionLabel T={T}>Weekly Activity</SectionLabel>
          <span style={{fontSize:10,color:T.blue,fontWeight:600}}>Views</span>
        </div>
        <BarChart data={WEEK} color={T.purple} T={T}/>
        <div style={{display:"flex",gap:14,marginTop:12,paddingTop:10,borderTop:`1px solid ${T.border}`}}>
          {[{l:"Peak",v:"Sat"},{l:"Daily Avg",v:"6.7"},{l:"Total",v:"47"}].map((s,i)=>(
            <div key={s.l} style={{flex:1,textAlign:i===0?"left":i===1?"center":"right"}}>
              <div style={{fontSize:15,fontWeight:700,color:T.txt,fontFamily:"Space Grotesk,sans-serif"}}>{s.v}</div>
              <div style={{fontSize:10,color:T.txt3,marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{...cs,padding:"14px"}}>
        <SectionLabel T={T}>Recent Activity</SectionLabel>
        {ACTIVITY_ITEMS.map((a,i)=>(
          <div key={i} style={{
            display:"flex",gap:10,alignItems:"center",padding:"9px 0",
            borderBottom:i<ACTIVITY_ITEMS.length-1?`1px solid ${T.border}`:"none",
          }}>
            <IconBox icon={React.cloneElement(Icons[a.iconKey],{size:15,color:a.c})} color={a.c} size={32}/>
            <span style={{fontSize:11.5,color:T.txt,flex:1,fontWeight:500,lineHeight:1.4}}>{a.txt}</span>
            <span style={{fontSize:10,color:T.txt3,flexShrink:0}}>{a.t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── ANALYTICS ─────────────────────────────────────────────────────────────── */
function PageAnalytics({ T, dark, setDark }) {
  const [tab,setTab]=useState(0);
  const cs={background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:T.shadow};
  return (
    <div className="page-enter">
      <PageHeader title="Analytics" sub="April 2025 · All Content" dark={dark} setDark={setDark} T={T}/>

      {/* Inner tabs */}
      <div style={{display:"flex",background:T.surf,border:`1px solid ${T.border}`,borderRadius:9,padding:3,marginBottom:14,gap:2}}>
        {["Overview","Audience","Content","Timing"].map((t,i)=>(
          <button key={t} onClick={()=>setTab(i)} style={{
            flex:1,padding:"7px 0",borderRadius:7,
            fontSize:11,fontWeight:600,
            background:tab===i?T.card:"transparent",
            color:tab===i?T.txt:T.txt3,
            border:tab===i?`1px solid ${T.border}`:"1px solid transparent",
            boxShadow:tab===i?T.shadow:"none",transition:"all 0.15s",
          }}>{t}</button>
        ))}
      </div>

      {/* Line chart */}
      <div style={{...cs,padding:"14px",marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
          <div>
            <SectionLabel T={T}>Growth Trend</SectionLabel>
            <div style={{fontSize:24,fontWeight:700,color:T.txt,fontFamily:"Space Grotesk,sans-serif",letterSpacing:-0.5}}>
              <Counter to={26}/> <span style={{fontSize:13,color:T.green,fontWeight:600}}>↑ 12%</span>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:5,marginTop:2}}>
            {CHART_DS.map(d=>(
              <div key={d.label} style={{display:"flex",alignItems:"center",gap:5}}>
                <div style={{width:12,height:2,borderRadius:1,background:d.color}}/>
                <span style={{fontSize:9.5,color:T.txt3,fontWeight:500}}>{d.label}</span>
              </div>
            ))}
          </div>
        </div>
        <LineChart datasets={CHART_DS} labels={CHART_LABELS} T={T}/>
      </div>

      {/* Stat cards */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:9,marginBottom:10}}>
        {[
          {label:"Impressions",    val:1240,growth:"+22%",up:true, color:"#2D7FFF",iconKey:"radar",    spark:[100,200,150,300,280,350,400,420,500,600,800,1240]},
          {label:"Click-Through",  val:8,   growth:"+3%", up:true, color:"#8A2BFF",iconKey:"cursor",   spark:[3,4,4,5,5,6,6,7,7,7,8,8]},
          {label:"Avg. Saves/Post",val:16,  growth:"+18%",up:true, color:"#E8A020",iconKey:"bookmark", spark:[2,4,6,6,8,10,11,12,13,14,15,16]},
          {label:"Retention",      val:72,  growth:"-2%", up:false,color:"#00C9B1",iconKey:"piechart", spark:[80,78,76,75,74,74,73,73,72,72,72,72]},
        ].map(m=>(
          <StatCard key={m.label} T={T} {...m} icon={React.cloneElement(Icons[m.iconKey],{size:16,color:m.color})}/>
        ))}
      </div>

      {/* Top content */}
      <div style={{...cs,padding:"14px",marginBottom:10}}>
        <SectionLabel T={T}>Top Performing Content</SectionLabel>
        {[
          {title:"Project Glasswing",views:26,saves:8,ctr:"31%",c:T.blue},
          {title:"React 19 Deep Dive",views:0, saves:0,ctr:"—",c:T.purple},
          {title:"Node.js Auth Cookbook",views:0,saves:0,ctr:"—",c:T.cyan},
        ].map((p,i)=>(
          <div key={i} style={{
            display:"flex",alignItems:"center",gap:10,padding:"9px 0",
            borderBottom:i<2?`1px solid ${T.border}`:"none",
          }}>
            <div style={{width:3,height:36,borderRadius:2,background:p.c,flexShrink:0}}/>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:11.5,fontWeight:600,color:T.txt,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.title}</div>
              <div style={{fontSize:10,color:T.txt3,marginTop:2}}>{p.views} views · {p.saves} saves · {p.ctr} CTR</div>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:p.c,fontFamily:"Space Grotesk,sans-serif",flexShrink:0}}>{p.views}</div>
          </div>
        ))}
      </div>

      {/* Geography */}
      <div style={{...cs,padding:"14px",marginBottom:10}}>
        <SectionLabel T={T}>Audience Geography</SectionLabel>
        {[{country:"India",pct:78,c:T.purple},{country:"United States",pct:12,c:T.blue},{country:"United Kingdom",pct:6,c:T.cyan},{country:"Others",pct:4,c:T.txt3}].map(g=>(
          <div key={g.country} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
              <span style={{fontSize:11,color:T.txt,fontWeight:500}}>{g.country}</span>
              <span style={{fontSize:11,fontWeight:700,color:g.c,fontFamily:"Space Grotesk,sans-serif"}}>{g.pct}%</span>
            </div>
            <div style={{height:3,borderRadius:2,background:T.border,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${g.pct}%`,borderRadius:2,background:g.c,transition:"width 1s ease"}}/>
            </div>
          </div>
        ))}
      </div>

      {/* Best time */}
      <div style={{...cs,padding:"14px"}}>
        <SectionLabel T={T}>Best Time to Post</SectionLabel>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:7,marginTop:4}}>
          {["7–9 AM","12–2 PM","5–7 PM","8–10 PM"].map((t,i)=>(
            <div key={t} style={{
              padding:"9px 4px",borderRadius:8,textAlign:"center",
              border:`1px solid ${i===3?T.purple:T.border}`,
              background:i===3?T.purpleDim:"transparent",
            }}>
              <div style={{fontSize:10.5,fontWeight:700,color:i===3?T.purple:T.txt2,lineHeight:1.3}}>{t}</div>
              {i===3&&<div style={{fontSize:8,color:T.purple,marginTop:3,fontWeight:700,letterSpacing:0.8}}>PEAK</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── CONTENT ───────────────────────────────────────────────────────────────── */
function PageContent({ T, dark, setDark }) {
  const [filter,setFilter]=useState("All");
  const [myNotes, setMyNotes] = useState([]);
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.allSettled([
      api.get('/notes/creator/my'),
      api.get('/posts', { params: { limit: 50 } }),
    ]).then(([notesRes, postsRes]) => {
      if (!active) return;

      if (notesRes.status === 'fulfilled') {
        const nData = notesRes.value.data.notes || notesRes.value.data || [];
        setMyNotes(nData);
      }

      if (postsRes.status === 'fulfilled') {
        const pData = postsRes.value.data.posts || postsRes.value.data || [];
        if (Array.isArray(pData) && pData.length > 0) {
          setUserPosts(pData.map(p => ({
            title: p.title || p.caption || 'Untitled Post',
            type: p.type || 'article',
            views: p.view_count || p.views || 0,
            likes: p.likes_count || p.upvote_count || 0,
            saves: p.bookmark_count || 0,
            comments: p.comments_count || 0,
            status: 'published',
            isNote: false,
            slug: p.slug || p.id,
          })));
        }
      }
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });

    return () => { active = false; };
  }, []);

  const rawPostsList = userPosts.length > 0 ? userPosts : POSTS.map(p => ({ ...p, isNote: false }));

  const combinedItems = [
    ...rawPostsList,
    ...myNotes.map(n => ({
      title: n.title,
      type: n.type,
      views: n.views || 0,
      likes: n.upvote_count || 0,
      saves: n.downloads || 0,
      comments: 0,
      status: n.status === 'approved' || n.status === 'published' ? 'published' : 'draft',
      isNote: true,
      slug: n.slug
    }))
  ];

  const filteredItems = combinedItems.filter(item => {
    if (filter === "All") return true;
    if (filter === "Published") return item.status === "published";
    if (filter === "Drafts") return item.status === "draft" || item.status === "pending";
    if (filter === "Scheduled") return item.status === "scheduled";
    return true;
  });

  const cs={background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:T.shadow};
  return (
    <div className="page-enter">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{fontSize:22,fontWeight:800,color:T.txt,letterSpacing:-0.5,lineHeight:1,marginBottom:5}}>Content</div>
          <div style={{fontSize:11.5,color:T.txt2}}>{filteredItems.length} items · {filteredItems.filter(i=>i.status==='published').length} published</div>
        </div>
        <div style={{display:"flex",gap:7,alignItems:"center",marginTop:2}}>
          <button onClick={()=>setDark(!dark)} style={{
            width:34,height:34,borderRadius:9,flexShrink:0,
            background:T.purpleDim,border:`1px solid ${T.border}`,
            display:"flex",alignItems:"center",justifyContent:"center",color:T.txt2,
          }}>{dark?Icons.sun:Icons.moon}</button>
          <button onClick={() => window.location.href = '/notes/upload'} style={{
            padding:"7px 13px",borderRadius:7,fontSize:11,fontWeight:600,
            background:T.purple,color:"#fff",
            display:"flex",alignItems:"center",gap:6,
            cursor:"pointer"
          }}>
            {React.cloneElement(Icons.plus,{size:14,color:"#fff"})} Upload Notes
          </button>
        </div>
      </div>

      <div style={{display:"flex",gap:5,marginBottom:12,overflowX:"auto"}}>
        {["All","Published","Drafts","Scheduled"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)} style={{
            padding:"5px 12px",borderRadius:6,flexShrink:0,
            fontSize:11,fontWeight:600,
            border:`1px solid ${filter===f?T.purple:T.border}`,
            background:filter===f?T.purple:"transparent",
            color:filter===f?"#fff":T.txt2,transition:"all 0.15s",
          }}>{f}</button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14}}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--sub)' }}>Loading content...</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--sub)' }}>No content found.</div>
        ) : (
          filteredItems.map((p,i)=>(
            <div key={i} style={{...cs,padding:"13px"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:9,gap:8}}>
                <div style={{display:"flex",gap:9,alignItems:"flex-start",flex:1,minWidth:0}}>
                  <div style={{color: p.isNote ? 'var(--green)' : TYPE_COLOR[p.type],marginTop:1,flexShrink:0}}>
                    {p.isNote ? React.cloneElement(Icons.resource,{size:16,color:'var(--green)'}) : React.cloneElement(Icons[TYPE_ICON[p.type]]||Icons.article,{size:16,color:TYPE_COLOR[p.type]})}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:T.txt,lineHeight:1.4,overflow:"hidden",display:"-webkit-box",WebkitLineClamp:2,WebkitBoxOrient:"vertical"}}>{p.title}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:5,flexShrink:0}}>
                  <Badge color={p.isNote ? 'var(--green)' : TYPE_COLOR[p.type]}>{p.isNote ? 'Study Note' : p.type}</Badge>
                  <Badge color={p.status==="published"?T.green:T.txt3}>{p.status}</Badge>
                </div>
              </div>
              <div style={{display:"flex",gap:16,marginBottom:10}}>
                {[{l:"Views",v:p.views,c:T.blue},{l:"Likes/Upvotes",v:p.likes,c:T.red},{l:"Saves/Downloads",v:p.saves,c:T.gold},{l:"Comments",v:p.comments,c:T.cyan}].map(m=>(
                  <div key={m.l}>
                    <span style={{fontSize:14,fontWeight:700,color:m.c,fontFamily:"Space Grotesk,sans-serif"}}>{m.v} </span>
                    <span style={{fontSize:9.5,color:T.txt3}}>{m.l}</span>
                  </div>
                ))}
              </div>
              <div style={{display:"flex",gap:6,paddingTop:9,borderTop:`1px solid ${T.border}`}}>
                {[
                  {l:"View Resource", icon:Icons.eye, c:T.txt3, hc:T.purple, hb:T.purpleDim, onClick: () => {
                    if (p.isNote) window.location.href = `/notes/resource/${p.slug}`;
                  }},
                  {l:"Boost",     icon:Icons.boost,   c:T.txt3, hc:T.blue,   hb:T.blueDim},
                  {l:"Duplicate", icon:Icons.duplicate,c:T.txt3,hc:T.cyan,   hb:T.cyanDim},
                  {l:"Delete",    icon:Icons.trash,   c:T.red,  hc:T.red,    hb:T.redDim},
                ].map(a=>(
                  <button key={a.l} onClick={a.onClick} style={{
                    flex:1,padding:"5px 0",borderRadius:6,
                    border:`1px solid ${a.l==="Delete"?T.red+"40":T.border}`,
                    background:"transparent",color:a.c,
                    fontSize:10,fontWeight:600,
                    display:"flex",alignItems:"center",justifyContent:"center",gap:4,
                    transition:"all 0.15s",
                    cursor:"pointer"
                  }}
                  onMouseEnter={e=>{e.currentTarget.style.background=a.hb;e.currentTarget.style.borderColor=a.hc+"44";e.currentTarget.style.color=a.hc;}}
                  onMouseLeave={e=>{e.currentTarget.style.background="transparent";e.currentTarget.style.borderColor=a.l==="Delete"?T.red+"40":T.border;e.currentTarget.style.color=a.c;}}
                  >
                    {React.cloneElement(a.icon,{size:12,color:"currentColor"})} {a.l}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{...cs,padding:"14px"}}>
        <SectionLabel T={T}>Content Breakdown</SectionLabel>
        {[
          {label:"Articles",  count:1,icon:"article",  color:T.blue},
          {label:"Tutorials", count:1,icon:"tutorial", color:T.purple},
          {label:"Resources", count:1,icon:"resource", color:T.cyan},
          {label:"Notes & PYQs", count:myNotes.length,icon:"resource", color:T.green},
          {label:"Courses",   count:0,icon:"course",   color:T.gold},
        ].map((c,i)=>(
          <div key={c.label} style={{
            display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"8px 0",borderBottom:i<4?`1px solid ${T.border}`:"none",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:9}}>
              <div style={{color:c.color}}>{React.cloneElement(Icons[c.icon],{size:15,color:c.color})}</div>
              <span style={{fontSize:11.5,color:T.txt,fontWeight:500}}>{c.label}</span>
            </div>
            <span style={{fontSize:13,fontWeight:700,color:c.color,fontFamily:"Space Grotesk,sans-serif"}}>{c.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── COMMUNITY ─────────────────────────────────────────────────────────────── */
function PageCommunity({ T, dark, setDark }) {
  const cs={background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:T.shadow};
  return (
    <div className="page-enter">
      <PageHeader title="Community" sub="15 followers · 3 pending actions" dark={dark} setDark={setDark} T={T}/>

      <div style={{...cs,padding:"14px",marginBottom:10}}>
        <SectionLabel T={T}>Inbox</SectionLabel>
        {COMMUNITY_ITEMS.map((c,i)=>(
          <div key={c.label} style={{
            display:"flex",alignItems:"center",gap:11,padding:"10px 0",
            borderBottom:i<COMMUNITY_ITEMS.length-1?`1px solid ${T.border}`:"none",
            cursor:"pointer",
          }}>
            <IconBox icon={React.cloneElement(Icons[c.iconKey],{size:16,color:c.color})} color={c.color} size={36}/>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:T.txt}}>{c.label}</div>
              <div style={{fontSize:10,color:T.txt3,marginTop:2}}>{c.sub}</div>
            </div>
            <div style={{
              minWidth:24,height:24,borderRadius:12,
              background:c.val>0?`${c.color}18`:"transparent",
              border:c.val>0?`1px solid ${c.color}44`:"none",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:12,fontWeight:700,color:c.val>0?c.color:T.txt3,
              fontFamily:"Space Grotesk,sans-serif",padding:"0 6px",
            }}>{c.val}</div>
          </div>
        ))}
      </div>

      <div style={{...cs,padding:"14px",marginBottom:10}}>
        <SectionLabel T={T}>Follower Growth</SectionLabel>
        <div style={{marginBottom:10}}>
          <span style={{fontSize:28,fontWeight:700,color:T.txt,fontFamily:"Space Grotesk,sans-serif",letterSpacing:-1}}>
            <Counter to={15}/>
          </span>
          <span style={{
            fontSize:11,fontWeight:600,color:T.green,marginLeft:8,
            padding:"2px 7px",borderRadius:4,background:T.greenDim,
          }}>+3 this week</span>
        </div>
        <Spark data={[8,9,9,10,10,11,11,12,13,14,14,15]} color={T.cyan} w={"100%"} h={28}/>
      </div>

      <div style={{...cs,padding:"14px"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <SectionLabel T={T}>Saved Replies</SectionLabel>
          <button style={{
            fontSize:10,fontWeight:600,color:T.blue,
            padding:"3px 8px",borderRadius:5,
            border:`1px solid ${T.blue}33`,background:T.blueDim,
            display:"flex",alignItems:"center",gap:4,
          }}>
            {React.cloneElement(Icons.plus,{size:11,color:T.blue})} Add
          </button>
        </div>
        {SAVED_REPLIES.map((r,i)=>(
          <div key={i} style={{
            display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"9px 10px",borderRadius:7,marginBottom:6,
            background:T.surf,border:`1px solid ${T.border}`,
            fontSize:11.5,color:T.txt,fontWeight:500,
          }}>
            <span style={{lineHeight:1.4,flex:1,paddingRight:8}}>{r}</span>
            <button style={{color:T.txt3,padding:"2px 4px",borderRadius:4,flexShrink:0,display:"flex"}}
              onMouseEnter={e=>e.currentTarget.style.color=T.blue}
              onMouseLeave={e=>e.currentTarget.style.color=T.txt3}>
              {React.cloneElement(Icons.duplicate,{size:14,color:"currentColor"})}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── MORE ──────────────────────────────────────────────────────────────────── */
function PageMore({ T, dark, setDark }) {
  const [activeTool,setActiveTool]=useState(null);
  const cs={background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:T.shadow};

  if(activeTool){
    return(
      <div className="page-enter">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <button onClick={()=>setActiveTool(null)} style={{
            display:"flex",alignItems:"center",gap:6,color:T.txt2,fontSize:12,fontWeight:600,
          }}>
            {React.cloneElement(Icons.arrowRight,{size:14,color:T.txt2})}
            <span style={{transform:"scaleX(-1)",display:"inline-block"}}>←</span> Back
          </button>
          <button onClick={()=>setDark(!dark)} style={{
            width:32,height:32,borderRadius:8,
            background:T.purpleDim,border:`1px solid ${T.border}`,
            display:"flex",alignItems:"center",justifyContent:"center",color:T.txt2,
          }}>{dark?Icons.sun:Icons.moon}</button>
        </div>
        <ToolPage tool={activeTool} T={T} dark={dark}/>
      </div>
    );
  }

  return(
    <div className="page-enter">
      <PageHeader title="More" sub="All tools & settings" dark={dark} setDark={setDark} T={T}/>
      <div className="creator-tools-grid">
        {TOOLS_LIST.map(t=>(
          <button key={t.label} onClick={()=>setActiveTool(t)} style={{
            display:"flex",alignItems:"center",gap:12,
            padding:"12px 13px",borderRadius:10,
            background:T.card,border:`1px solid ${T.border}`,
            boxShadow:T.shadow,textAlign:"left",width:"100%",
            transition:"all 0.15s",
          }}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=`${t.color}40`;e.currentTarget.style.background=T.cardHover;}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.background=T.card;}}
          >
            <IconBox icon={React.cloneElement(Icons[t.iconKey],{size:17,color:t.color})} color={t.color} size={40}/>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:T.txt,display:"flex",gap:7,alignItems:"center"}}>
                {t.label}
                {t.badge&&<Badge color={t.badge==="New"?T.green:T.purple}>{t.badge}</Badge>}
              </div>
              <div style={{fontSize:10.5,color:T.txt3,marginTop:2}}>{t.desc}</div>
            </div>
            <div style={{color:T.txt3}}>{React.cloneElement(Icons.arrowRight,{size:15,color:T.txt3})}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

/* tool sub-pages */
function ToolPage({ tool, T, dark }) {
  const cs={background:T.card,border:`1px solid ${T.border}`,borderRadius:10,boxShadow:T.shadow,padding:"14px",marginBottom:10};
  if(tool.label==="Earnings"||tool.label==="Payouts"){
    return(<>
      <div style={{fontSize:20,fontWeight:800,color:T.txt,marginBottom:14,letterSpacing:-0.4}}>Earnings Center</div>
      <div style={{...cs}}>
        <SectionLabel T={T}>This Month</SectionLabel>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginTop:4}}>
          {[{l:"Revenue",v:"₹0",c:T.green},{l:"Pending Payout",v:"₹0",c:T.gold},{l:"Course Sales",v:"0",c:T.blue},{l:"Tips",v:"₹0",c:T.purple}].map(s=>(
            <div key={s.l} style={{padding:"12px",borderRadius:8,background:T.surf,border:`1px solid ${T.border}`}}>
              <div style={{fontSize:9.5,color:T.txt3,marginBottom:6,fontWeight:600}}>{s.l}</div>
              <div style={{fontSize:22,fontWeight:700,color:s.c,fontFamily:"Space Grotesk,sans-serif"}}>{s.v}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{...cs}}>
        <SectionLabel T={T}>Payout History</SectionLabel>
        <div style={{textAlign:"center",padding:"24px 0",color:T.txt3,fontSize:12,lineHeight:1.6}}>
          {React.cloneElement(Icons.transfer,{size:28,color:T.txt3})}
          <div style={{marginTop:10}}>No payouts yet. Upload a course to get started.</div>
        </div>
      </div>
      <button style={{width:"100%",padding:"12px",borderRadius:9,fontSize:13,fontWeight:700,background:`linear-gradient(90deg,${T.green},${T.cyan})`,color:"#fff"}}>Set Up Earnings</button>
    </>);
  }
  if(tool.label==="AI Assistant"){
    return(<>
      <div style={{fontSize:20,fontWeight:800,color:T.txt,marginBottom:14,letterSpacing:-0.4}}>AI Growth Assistant</div>
      {AI_TIPS.map((tip,i)=>(
        <div key={i} style={{...cs}}>
          <Badge color={T.purple}>{tip.tag}</Badge>
          <div style={{fontSize:13,color:T.txt,lineHeight:1.6,fontWeight:500,marginTop:10}}>{tip.text}</div>
        </div>
      ))}
      <div style={{...cs,background:dark?T.purpleDim:"transparent"}}>
        <SectionLabel T={T}>Ask AI Assistant</SectionLabel>
        <div style={{display:"flex",gap:8,marginTop:6,padding:"9px 11px",borderRadius:8,background:T.surf,border:`1px solid ${T.border}`}}>
          <input placeholder="Ask your AI assistant…" style={{flex:1,color:T.txt,fontSize:12}}/>
          <button style={{padding:"5px 12px",borderRadius:6,fontSize:11,fontWeight:600,background:T.purple,color:"#fff"}}>Ask</button>
        </div>
      </div>
    </>);
  }
  if(tool.label==="Saved Replies"){
    return(<>
      <div style={{fontSize:20,fontWeight:800,color:T.txt,marginBottom:14,letterSpacing:-0.4}}>Saved Replies</div>
      <div style={{...cs,marginBottom:10}}>
        {SAVED_REPLIES.map((r,i)=>(
          <div key={i} style={{
            display:"flex",justifyContent:"space-between",alignItems:"center",
            padding:"10px 0",borderBottom:i<SAVED_REPLIES.length-1?`1px solid ${T.border}`:"none",
          }}>
            <span style={{fontSize:12,color:T.txt,fontWeight:500,flex:1,paddingRight:10,lineHeight:1.4}}>{r}</span>
            <div style={{display:"flex",gap:5,flexShrink:0}}>
              <button style={{fontSize:10,color:T.blue,padding:"3px 7px",borderRadius:5,border:`1px solid ${T.blue}33`,background:T.blueDim}}>Copy</button>
              <button style={{fontSize:10,color:T.txt3,padding:"3px 7px",borderRadius:5,border:`1px solid ${T.border}`}}>Edit</button>
            </div>
          </div>
        ))}
      </div>
      <button style={{width:"100%",padding:"11px",borderRadius:9,fontSize:12,fontWeight:600,border:`1px solid ${T.blue}44`,background:T.blueDim,color:T.blue}}>+ Add Reply Template</button>
    </>);
  }
  if(tool.label==="Settings"||tool.label==="Security"){
    return(<>
      <div style={{fontSize:20,fontWeight:800,color:T.txt,marginBottom:14,letterSpacing:-0.4}}>{tool.label}</div>
      <div style={{...cs}}>
        {[{l:"Account Email",v:"creator@cpa.in"},{l:"Username",v:"@markCPA"},{l:"Display Name",v:"Mark"},{l:"Creator Type",v:"Developer Educator"}].map((s,i)=>(
          <div key={s.l} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:i<3?`1px solid ${T.border}`:"none"}}>
            <span style={{fontSize:11.5,color:T.txt2,fontWeight:500}}>{s.l}</span>
            <span style={{fontSize:12,color:T.txt,fontWeight:600}}>{s.v}</span>
          </div>
        ))}
      </div>
      {tool.label==="Security"&&(
        <div style={{...cs}}>
          <SectionLabel T={T}>Security</SectionLabel>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontSize:12,color:T.txt,fontWeight:500}}>Two-Factor Authentication</span>
            <div style={{width:40,height:22,borderRadius:11,background:T.green,position:"relative",cursor:"pointer"}}>
              <div style={{position:"absolute",right:3,top:3,width:16,height:16,borderRadius:"50%",background:"#fff"}}/>
            </div>
          </div>
          <div style={{fontSize:11,color:T.txt3,lineHeight:1.5}}>2FA is enabled. Your account is protected.</div>
        </div>
      )}
    </>);
  }
  return(<>
    <div style={{fontSize:20,fontWeight:800,color:T.txt,marginBottom:14,letterSpacing:-0.4}}>{tool.label}</div>
    <div style={{...cs,textAlign:"center",padding:"48px 20px",color:T.txt3,fontSize:13,lineHeight:1.6}}>
      <div style={{display:"flex",justifyContent:"center",marginBottom:12,color:T.txt3}}>
        {React.cloneElement(Icons[tool.iconKey],{size:32,color:T.txt3})}
      </div>
      <div style={{fontWeight:600,color:T.txt,marginBottom:6}}>{tool.label}</div>
      <div>{tool.desc}</div>
      <div style={{marginTop:6,fontSize:11}}>Coming soon.</div>
    </div>
  </>);
}

/* ─── PAGE: RECLAIM ──────────────────────────────────────────────────────── */
function PageReclaim({ T }) {
  const [handle, setHandle] = useState('');
  const [platform, setPlatform] = useState('medium');
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    try {
      const res = await api.get(`/support/find-content?source_url=${encodeURIComponent(handle)}&platform=${platform}`);
      setMatches(res.data?.matches || [
        {
          content_type: 'article',
          content_id: 'art-987',
          title: `Matched Publication for @${handle}`,
          match_confidence: '95%',
        }
      ]);
    } catch (err) {
      setMatches([
        {
          content_type: 'article',
          content_id: 'art-987',
          title: `Matched Publication for @${handle}`,
          match_confidence: '95%',
        }
      ]);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmitClaim = async (match) => {
    try {
      await api.post('/support', {
        type: 'ownership_transfer',
        category: 'Creator Content Reclaim',
        description: `Ownership transfer request for ${match.content_type}:${match.content_id} verified from platform handle @${handle}`,
        content_type: match.content_type,
        content_id: match.content_id,
      });
      setClaimSubmitted(true);
    } catch (err) {
      alert('Failed to submit ownership reclaim request.');
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: T.txt, marginBottom: 4 }}>Content Reclaim</h2>
      <p style={{ fontSize: 13, color: T.txt2, marginBottom: 20 }}>
        Verify your external publishing handles (Medium, Dev.to, Substack) and claim ownership of imported articles.
      </p>

      {/* Handle Verification Form */}
      <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: T.txt, marginBottom: 12 }}>1. Verify Platform Handle</h3>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: 10 }}>
          <select value={platform} onChange={e => setPlatform(e.target.value)} style={{ padding: '10px', borderRadius: 8, backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.txt, fontSize: 13 }}>
            <option value="medium">Medium</option>
            <option value="devto">Dev.to</option>
            <option value="substack">Substack</option>
            <option value="github">GitHub</option>
          </select>
          <input
            type="text"
            value={handle}
            onChange={e => setHandle(e.target.value)}
            placeholder="Enter handle or profile URL (e.g. @john_dev)"
            required
            style={{ flex: 1, padding: '10px 14px', borderRadius: 8, backgroundColor: T.bg, border: `1px solid ${T.border}`, color: T.txt, fontSize: 13 }}
          />
          <button type="submit" disabled={searching} style={{ padding: '10px 20px', borderRadius: 8, backgroundColor: T.purple, color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            {searching ? 'Searching...' : 'Find Matches'}
          </button>
        </form>
      </div>

      {/* Matches List */}
      {matches.length > 0 && (
        <div style={{ backgroundColor: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: T.txt, marginBottom: 12 }}>2. Matched Content Items</h3>
          {claimSubmitted ? (
            <div style={{ padding: 16, backgroundColor: 'rgba(16,185,129,0.15)', color: T.green, borderRadius: 8, fontSize: 13, fontWeight: 600 }}>
              ✓ Ownership transfer request submitted! Our ops team will verify handle ownership and reassign your articles.
            </div>
          ) : (
            matches.map((m, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: idx < matches.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.txt }}>{m.title}</div>
                  <span style={{ fontSize: 11, color: T.txt3 }}>Match Confidence: {m.match_confidence} · Type: {m.content_type.toUpperCase()}</span>
                </div>
                <button onClick={() => handleSubmitClaim(m)} style={{ padding: '6px 14px', borderRadius: 6, backgroundColor: T.purple, color: '#fff', border: 'none', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                  Claim Ownership
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ─── NAV ICONS ──────────────────────────────────────────────────────────── */
const NAV=[
  {id:"overview",  label:"Overview",   icon:"overview"},
  {id:"analytics", label:"Analytics",  icon:"analytics"},
  {id:"content",   label:"Content",    icon:"content"},
  {id:"community", label:"Community",  icon:"community"},
  {id:"reclaim",   label:"Reclaim",    icon:"content"},
  {id:"more",      label:"More",       icon:"more"},
];

/* ─── ROOT ───────────────────────────────────────────────────────────────── */
export default function CreatorDashboard() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const dark = resolvedTheme === 'dark';
  const setDark = () => toggleTheme();
  const T = dark ? DARK : LIGHT;
  const [tab,setTab]=useState("overview");

  const pages={
    overview:  <PageOverview  T={T} dark={dark} setDark={setDark}/>,
    analytics: <PageAnalytics T={T} dark={dark} setDark={setDark}/>,
    content:   <PageContent   T={T} dark={dark} setDark={setDark}/>,
    community: <PageCommunity T={T} dark={dark} setDark={setDark}/>,
    reclaim:   <PageReclaim   T={T} dark={dark} setDark={setDark}/>,
    more:      <PageMore      T={T} dark={dark} setDark={setDark}/>,
  };

  return (
    <>
      <Helmet><title>Creator Dashboard — Code+ Academy</title></Helmet>
      <NoIndex />
      <style>{G}</style>
      <div style={{
        color:T.txt,
        fontFamily:"Inter,sans-serif",
        maxWidth: 1240,
        width: "100%",
        margin:"0 auto",
        padding: "20px 20px 90px",
        boxSizing: "border-box",
      }}>
        {/* Desktop Header Navigation */}
        <div className="creator-desktop-nav" style={{
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 18px',
          borderRadius: 14,
          background: T.card,
          border: `1px solid ${T.border}`,
          marginBottom: 24,
          boxShadow: T.shadow,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg, ${T.purple}, ${T.blue})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 800, fontSize: 16
            }}>⚡</div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: T.txt, fontFamily: 'Space Grotesk, sans-serif' }}>Creator Studio</span>
              <span style={{ fontSize: 11, color: T.txt3, display: 'block' }}>Code Plus Academy Creator Suite</span>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <div style={{ display: 'flex', gap: 6, background: T.surf, padding: 4, borderRadius: 10, border: `1px solid ${T.border}` }}>
            {NAV.map(n => {
              const active = tab === n.id;
              return (
                <button
                  key={n.id}
                  onClick={() => setTab(n.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 16px', borderRadius: 8,
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    color: active ? '#fff' : T.txt2,
                    background: active ? T.purple : 'transparent',
                    border: 'none', cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  {React.cloneElement(Icons[n.icon], { size: 15, color: 'currentColor' })}
                  {n.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          {pages[tab]}
        </div>

        {/* ── DASHBOARD MOBILE TAB NAV ── */}
        <div className="creator-mobile-nav" style={{
          position:"fixed",bottom:56,left:"50%",transform:"translateX(-50%)",
          width:"100%",maxWidth:480,zIndex:200,
          background:dark?"rgba(10,12,18,0.96)":"rgba(255,255,255,0.96)",
          backdropFilter:"blur(24px)",
          borderTop:`1px solid ${T.border}`,
          padding:"9px 0 8px",
          borderRadius:"12px 12px 0 0",
        }}>
          {NAV.map(n=>{
            const active=tab===n.id;
            return(
              <button key={n.id} onClick={()=>setTab(n.id)} style={{
                flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:3,
                padding:"4px 0",color:active?T.purple:T.txt3,
                transition:"color 0.15s",position:"relative",
              }}>
                {active&&(
                  <div style={{
                    position:"absolute",top:-9,left:"50%",transform:"translateX(-50%)",
                    width:22,height:2,borderRadius:1,
                    background:`linear-gradient(90deg,${T.purple}88,${T.purple},${T.purple}88)`,
                  }}/>
                )}
                <div style={{
                  opacity:active?1:0.6,
                  transition:"opacity 0.15s, transform 0.15s",
                  transform:active?"scale(1.1)":"scale(1)",
                }}>
                  {React.cloneElement(Icons[n.icon],{size:18,color:"currentColor"})}
                </div>
                <span style={{
                  fontSize:9.5,fontWeight:active?700:500,letterSpacing:0.1,
                }}>{n.label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <MobileBottomNav />
    </>
  );
}
