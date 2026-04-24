import { useState, useEffect, useRef } from 'react';

/* ── Keyframe injection ── */
const KF_ID = 'jf-pl-kf';
const KF = `
@keyframes jf-spin-slow { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
@keyframes jf-spin-rev  { from{transform:rotate(0deg)} to{transform:rotate(-360deg)} }
@keyframes jf-pulse-ring{ 0%,100%{opacity:.15;transform:scale(1)} 50%{opacity:.55;transform:scale(1.08)} }
@keyframes jf-dot-wave  { 0%,80%,100%{transform:scaleY(.35);opacity:.2} 40%{transform:scaleY(1);opacity:1} }
@keyframes jf-fade-up   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
@keyframes jf-shimmer-txt{ from{transform:translateX(-100%)} to{transform:translateX(350%)} }
@keyframes jf-bar       { from{width:0%} to{width:100%} }
@keyframes jf-float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
@keyframes jf-star-twinkle{0%,100%{opacity:.1;transform:scale(1)}50%{opacity:.9;transform:scale(1.7)}}
@keyframes jf-mtn-rise  { from{transform:translateY(40px);opacity:0} to{transform:translateY(0);opacity:1} }
@keyframes jf-letter-in { from{opacity:0;transform:translateY(24px) skewY(4deg)} to{opacity:1;transform:translateY(0) skewY(0)} }
@keyframes jf-glow-orb  { 0%,100%{opacity:.3;transform:scale(1)} 50%{opacity:.65;transform:scale(1.15)} }
@keyframes jf-video-in  { from{opacity:0;transform:scale(1.06)} to{opacity:1;transform:scale(1)} }
`;
function injectKF() {
  if (document.getElementById(KF_ID)) return;
  const s = document.createElement('style');
  s.id = KF_ID; s.textContent = KF;
  document.head.appendChild(s);
}

/* ── Brand colours ── */
const GOLD = '#C8A84B';
const GOLD_LT = '#E8C870';
const NIGHT = '#04090F';

/* ── Tiny star positions ── */
const STARS = [
  {x:'8%',y:'12%',s:1.4,d:'.3s',dur:'3.1s'},{x:'23%',y:'5%',s:1,d:'.9s',dur:'2.8s'},
  {x:'45%',y:'8%',s:1.8,d:'1.2s',dur:'4s'},{x:'67%',y:'4%',s:1,d:'.5s',dur:'3.4s'},
  {x:'83%',y:'14%',s:1.5,d:'1.5s',dur:'2.9s'},{x:'93%',y:'28%',s:1,d:'.2s',dur:'3.7s'},
  {x:'4%',y:'38%',s:1.2,d:'1s',dur:'3.2s'},{x:'95%',y:'50%',s:1.8,d:'.7s',dur:'4.1s'},
  {x:'12%',y:'68%',s:1,d:'1.3s',dur:'2.7s'},{x:'88%',y:'72%',s:1.4,d:'.4s',dur:'3.6s'},
  {x:'35%',y:'88%',s:1,d:'.8s',dur:'3s'},{x:'72%',y:'82%',s:1.2,d:'1.6s',dur:'3.8s'},
];

/* ══════════════════════════════════════════════════════════
   INLINE PRELOADER  — travel compass spinner
══════════════════════════════════════════════════════════ */
export function Preloader({ fullScreen = false }: { fullScreen?: boolean }) {
  useEffect(() => { injectKF(); }, []);

  const spinner = (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      {/* Compass rings */}
      <div style={{ width:64, height:64, position:'relative', perspective:240 }}>
        {/* Glow */}
        <div style={{
          position:'absolute', inset:-10, borderRadius:'50%',
          background:`radial-gradient(circle, ${GOLD}22 0%, transparent 70%)`,
          animation:'jf-pulse-ring 2.4s ease-in-out infinite',
        }} />
        {/* Core sphere */}
        <div style={{
          position:'absolute', inset:14, borderRadius:'50%',
          background:'radial-gradient(circle at 36% 30%, #1e3a6e 0%, #0a1830 60%, #040c18 100%)',
          boxShadow:`0 0 18px 3px rgba(74,143,212,.18), inset -4px -4px 10px rgba(0,0,0,.7)`,
        }} />
        {/* Gold outer ring */}
        <div style={{
          position:'absolute', inset:4, borderRadius:'50%',
          border:'1.5px solid transparent',
          borderTopColor:`${GOLD}cc`, borderRightColor:`${GOLD}44`,
          animation:'jf-spin-slow 3s linear infinite',
          transformStyle:'preserve-3d',
        }} />
        {/* White fast ring */}
        <div style={{
          position:'absolute', inset:2, borderRadius:'50%',
          border:'1px solid transparent',
          borderTopColor:'rgba(255,255,255,.7)', borderBottomColor:'rgba(255,255,255,.1)',
          transform:'rotateX(66deg)',
          animation:'jf-spin-slow 1.6s linear infinite',
          transformStyle:'preserve-3d',
        }} />
        {/* Inner dashed */}
        <div style={{
          position:'absolute', inset:9, borderRadius:'50%',
          border:'1px dashed rgba(200,168,75,.18)',
          borderRightColor:`${GOLD}88`,
          animation:'jf-spin-rev 2.2s linear infinite',
        }} />
        {/* Glowing dot */}
        <div style={{
          position:'absolute', top:4, left:'50%',
          width:5, height:5, borderRadius:'50%',
          background: GOLD_LT, boxShadow:`0 0 8px 3px ${GOLD_LT}cc`,
          transform:'translateX(-50%)',
          animation:'jf-spin-slow 1.6s linear infinite',
        }} />
      </div>

      {/* Wave dots */}
      <div style={{ display:'flex', gap:4, alignItems:'center' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{
            width:3, height:11, borderRadius:3,
            background:`linear-gradient(180deg,${GOLD_LT},#8b6a22)`,
            animation:`jf-dot-wave 1.3s ease-in-out infinite`,
            animationDelay:`${i*.13}s`,
          }} />
        ))}
      </div>

      <p style={{
        fontSize:9, fontWeight:900, letterSpacing:'0.5em',
        textTransform:'uppercase', color:`${GOLD}99`, margin:0,
        fontFamily:'Outfit,sans-serif',
      }}>Loading</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div style={{
        position:'fixed', inset:0, zIndex:200,
        background:NIGHT,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {spinner}
      </div>
    );
  }

  return (
    <div style={{ padding:'80px 0', display:'flex', alignItems:'center', justifyContent:'center', width:'100%' }}>
      {spinner}
    </div>
  );
}


/* ══════════════════════════════════════════════════════════
   SPLASH PRELOADER  — cinematic full-screen with video
══════════════════════════════════════════════════════════ */
export function SplashPreloader({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<'in'|'show'|'out'>('in');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => { injectKF(); }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('show'), 120);
    const t2 = setTimeout(() => setPhase('out'), 3200);
    const t3 = setTimeout(onDone, 3900);
    return () => [t1, t2, t3].forEach(clearTimeout);
  }, [onDone]);

  const show = phase === 'show';

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:9999,
      overflow:'hidden',
      opacity: phase === 'out' ? 0 : 1,
      transform: phase === 'in' ? 'scale(1.04)' : 'scale(1)',
      transition: phase === 'out'
        ? 'opacity .7s cubic-bezier(.4,0,1,1), transform .7s ease'
        : 'opacity .5s ease, transform .8s cubic-bezier(.2,1,.3,1)',
      pointerEvents: phase === 'out' ? 'none' : 'all',
    }}>

      {/* ── Video background ── */}
      <video
        ref={videoRef}
        autoPlay muted loop playsInline
        style={{
          position:'absolute', inset:0,
          width:'100%', height:'100%',
          objectFit:'cover',
          animation:'jf-video-in 1.4s ease forwards',
        }}
      >
        <source src="https://videos.pexels.com/video-files/1851190/1851190-hd_1920_1080_25fps.mp4" type="video/mp4" />
      </video>

      {/* ── Dark overlay gradient ── */}
      <div style={{
        position:'absolute', inset:0,
        background:`linear-gradient(
          to bottom,
          rgba(4,9,15,.72) 0%,
          rgba(4,9,15,.45) 40%,
          rgba(4,9,15,.62) 70%,
          rgba(4,9,15,.92) 100%
        )`,
      }} />

      {/* ── Dot grid texture ── */}
      <div style={{
        position:'absolute', inset:0, opacity:.028,
        backgroundImage:`radial-gradient(circle, ${GOLD} 1px, transparent 0)`,
        backgroundSize:'28px 28px',
      }} />

      {/* ── Vignette ── */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse at center, transparent 25%, rgba(4,9,15,.7) 100%)',
        pointerEvents:'none',
      }} />

      {/* ── Stars ── */}
      {STARS.map((st,i) => (
        <div key={i} style={{
          position:'absolute', left:st.x, top:st.y,
          width:st.s, height:st.s, borderRadius:'50%', background:'#fff',
          animation:`jf-star-twinkle ${st.dur} ease-in-out infinite`,
          animationDelay:st.d,
        }} />
      ))}

      {/* ── Ambient glow orbs ── */}
      <div style={{
        position:'absolute', width:700, height:700, borderRadius:'50%',
        top:'-25%', left:'-20%',
        background:`radial-gradient(circle, ${GOLD}18 0%, transparent 65%)`,
        animation:'jf-glow-orb 5s ease-in-out infinite',
      }} />
      <div style={{
        position:'absolute', width:500, height:500, borderRadius:'50%',
        bottom:'-20%', right:'-15%',
        background:'radial-gradient(circle, rgba(74,143,212,.06) 0%, transparent 65%)',
        animation:'jf-glow-orb 7s ease-in-out infinite', animationDelay:'2s',
      }} />

      {/* ══ MAIN CONTENT ══ */}
      <div style={{
        position:'relative', zIndex:10,
        height:'100%', display:'flex', flexDirection:'column',
        alignItems:'center', justifyContent:'center',
        gap:0,
        opacity:show ? 1 : 0,
        transform:show ? 'translateY(0)' : 'translateY(30px)',
        transition:'opacity .9s ease .1s, transform .9s cubic-bezier(.2,1,.3,1) .1s',
      }}>

        {/* ── SVG Logo Globe ── */}
        <div style={{
          width:130, height:130, position:'relative',
          marginBottom:32,
          animation:`jf-float 4.5s ease-in-out infinite`,
          animationDelay:'.4s',
        }}>
          {/* Atmosphere halo */}
          <div style={{
            position:'absolute', inset:-20, borderRadius:'50%',
            background:'radial-gradient(circle, rgba(74,143,212,.14) 0%, rgba(200,168,75,.06) 50%, transparent 70%)',
            animation:'jf-pulse-ring 3s ease-in-out infinite',
          }} />

          <svg viewBox="0 0 130 130" style={{ position:'absolute', inset:0, width:'100%', height:'100%' }}>
            <defs>
              <clipPath id="sp-gc"><circle cx="65" cy="65" r="58"/></clipPath>
              <radialGradient id="sp-sg" cx="36%" cy="30%" r="72%">
                <stop offset="0%"  stopColor="#1e3a6e"/>
                <stop offset="40%" stopColor="#0d2248"/>
                <stop offset="80%" stopColor="#071424"/>
                <stop offset="100%" stopColor="#040c18"/>
              </radialGradient>
              <radialGradient id="sp-atm" cx="50%" cy="50%" r="50%">
                <stop offset="78%" stopColor="rgba(74,143,212,0)"/>
                <stop offset="100%" stopColor="rgba(74,143,212,.38)"/>
              </radialGradient>
              <radialGradient id="sp-spec" cx="28%" cy="24%" r="38%">
                <stop offset="0%"  stopColor="rgba(180,210,255,.2)"/>
                <stop offset="100%" stopColor="rgba(180,210,255,0)"/>
              </radialGradient>
              <radialGradient id="sp-shd" cx="68%" cy="64%" r="58%">
                <stop offset="0%"  stopColor="rgba(0,0,0,0)"/>
                <stop offset="100%" stopColor="rgba(0,0,0,.55)"/>
              </radialGradient>
            </defs>
            {/* Sphere */}
            <circle cx="65" cy="65" r="58" fill="url(#sp-sg)"/>
            {/* Lat lines */}
            <g clipPath="url(#sp-gc)" fill="none" stroke="rgba(100,160,240,.18)" strokeWidth=".55">
              {[24,37,50,64,78,91,104].map((cy,i) => (
                <ellipse key={i} cx="65" cy={cy} rx={[26,43,56,58,54,42,25][i]} ry={[5,8,10,11,10,8,5][i]}/>
              ))}
            </g>
            {/* Long lines */}
            <g clipPath="url(#sp-gc)" fill="none" stroke="rgba(100,160,240,.11)" strokeWidth=".55">
              {[9,29,47,58].map((rx,i) => (
                <ellipse key={i} cx="65" cy="65" rx={rx} ry="58"/>
              ))}
              <ellipse cx="65" cy="65" rx="9"  ry="58" transform="rotate(55,65,65)"/>
              <ellipse cx="65" cy="65" rx="29" ry="58" transform="rotate(55,65,65)"/>
            </g>
            {/* Land */}
            <g clipPath="url(#sp-gc)" opacity=".25">
              <path d="M26 36 C21 32,15 40,17 50 C19 59,28 62,35 57 C42 52,45 44,38 37 Z" fill="#2e6b3e"/>
              <path d="M70 32 C66 29,63 35,65 43 C67 51,73 54,77 49 C81 44,80 36,74 32 Z" fill="#2e6b3e"/>
              <path d="M68 54 C64 51,62 59,65 68 C67 76,73 80,77 76 C82 70,82 62,76 56 Z" fill="#2e6b3e"/>
              <path d="M78 30 C74 26,86 24,97 29 C106 33,109 42,105 49 C101 55,92 57,86 51 C80 46,78 38,78 30 Z" fill="#2e6b3e"/>
              <path d="M95 66 C91 62,90 70,94 75 C98 80,104 79,105 73 C106 67,100 63,95 66 Z" fill="#2e6b3e"/>
            </g>
            {/* Equator accent */}
            <ellipse cx="65" cy="65" rx="58" ry="11" clipPath="url(#sp-gc)" fill="none" stroke={`${GOLD}28`} strokeWidth=".9"/>
            {/* Flight arc */}
            <path d="M7 65 Q65 7 123 65" fill="none" stroke={`${GOLD_LT}aa`} strokeWidth="1.1"
              strokeDasharray="420" strokeDashoffset="420" clipPath="url(#sp-gc)"
              style={{ animation:'jf-bar .55s 0s ease forwards',
                       ['--tw-bar-hack' as string]: '420' }}/>
            {/* Shadow / spec / atm */}
            <circle cx="65" cy="65" r="58" fill="url(#sp-shd)"/>
            <circle cx="65" cy="65" r="58" fill="url(#sp-spec)" clipPath="url(#sp-gc)"/>
            <circle cx="65" cy="65" r="58" fill="url(#sp-atm)"/>
            {/* Edge ring */}
            <circle cx="65" cy="65" r="57.5" fill="none" stroke="rgba(100,160,240,.22)" strokeWidth=".8"/>
          </svg>

          {/* 3-D orbit rings */}
          <div style={{ position:'absolute', inset:-4, perspective:400, borderRadius:'50%', transformStyle:'preserve-3d' }}>
            <div style={{
              position:'absolute', inset:6, borderRadius:'50%',
              border:'1.5px solid transparent',
              borderTopColor:'rgba(255,255,255,.78)', borderBottomColor:'rgba(255,255,255,.06)',
              animation:'jf-spin-slow 1.9s linear infinite',
              transform:'rotateX(66deg)', transformStyle:'preserve-3d',
            }}/>
            <div style={{
              position:'absolute', inset:0, borderRadius:'50%',
              border:'1px solid transparent',
              borderRightColor:`${GOLD}99`, borderLeftColor:`${GOLD}18`,
              animation:'jf-spin-rev 2.9s linear infinite',
              transform:'rotateY(72deg)', transformStyle:'preserve-3d',
            }}/>
            <div style={{
              position:'absolute', inset:-10, borderRadius:'50%',
              border:`1px dashed ${GOLD}1e`,
              borderTopColor:`${GOLD}30`,
              animation:'jf-spin-slow 6.5s linear infinite',
            }}/>
          </div>
        </div>

        {/* ── Brand name ── */}
        <div style={{ position:'relative', marginBottom:6 }}>
          <h1 style={{
            fontSize:34, fontWeight:300, letterSpacing:'.22em',
            textTransform:'uppercase', color:'#f0ead6',
            margin:0, fontFamily:"'Cormorant Garamond','Georgia',serif",
            fontStyle:'italic',
            animation:'jf-fade-up .9s .2s ease both',
          }}>
            Journey
            <span style={{
              fontStyle:'normal', fontWeight:700,
              color:GOLD_LT,
              fontFamily:"'Outfit',sans-serif",
              letterSpacing:'.12em',
            }}>Flicker</span>
          </h1>
          {/* Text shimmer */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none', borderRadius:2 }}>
            <div style={{
              position:'absolute', top:0, bottom:0, left:0, width:'22%',
              background:'linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)',
              animation:'jf-shimmer-txt 4s ease-in-out infinite', animationDelay:'1s',
            }}/>
          </div>
        </div>

        {/* ── Tagline ── */}
        <p style={{
          fontSize:8, fontWeight:900, letterSpacing:'.55em',
          textTransform:'uppercase', color:`${GOLD}80`,
          margin:'0 0 4px', fontFamily:"'Outfit',sans-serif",
          animation:'jf-fade-up .7s .5s ease both',
        }}>Digital Curator</p>

        {/* ── Gold line ── */}
        <div style={{
          width:44, height:1,
          background:`linear-gradient(90deg,transparent,${GOLD}88,transparent)`,
          margin:'10px 0 20px',
          animation:'jf-fade-up .7s .65s ease both',
        }}/>

        {/* ── Loading bars ── */}
        <div style={{ display:'flex', gap:5, alignItems:'center', marginBottom:26 }}>
          {[0,1,2,3,4].map(i => (
            <div key={i} style={{
              width:3, height:13, borderRadius:3,
              background:`linear-gradient(180deg,${GOLD_LT},#8b6420)`,
              animation:`jf-dot-wave 1.5s ease-in-out infinite`,
              animationDelay:`${i*.14}s`,
            }}/>
          ))}
        </div>

        {/* ── Italic caption ── */}
        <p style={{
          fontSize:10, fontWeight:300, letterSpacing:'.14em',
          color:'rgba(240,234,214,.22)', margin:0,
          textAlign:'center', maxWidth:280, fontStyle:'italic',
          fontFamily:"'Cormorant Garamond',Georgia,serif",
          animation:'jf-fade-up .7s .85s ease both',
        }}>
          Curating the world's most evocative territories
        </p>
      </div>

      {/* ── Compass rose (top-right corner) ── */}
      <div style={{
        position:'absolute', top:28, right:32, width:54, height:54,
        opacity: show ? .7 : 0, transition:'opacity 1s ease .6s',
      }}>
        <svg viewBox="0 0 52 52" style={{ width:'100%', height:'100%', animation:'jf-spin-slow 14s linear infinite' }}>
          <circle cx="26" cy="26" r="24" fill="none" stroke={`${GOLD}44`} strokeWidth=".5" strokeDasharray="4 3"/>
          <circle cx="26" cy="26" r="19" fill="none" stroke={`${GOLD}22`} strokeWidth=".5"/>
          <polygon points="26,2 23,20 26,17 29,20" fill={GOLD}/>
          <polygon points="26,50 23,32 26,35 29,32" fill={`${GOLD}55`}/>
          <polygon points="50,26 32,23 35,26 32,29" fill={`${GOLD}55`}/>
          <polygon points="2,26 20,23 17,26 20,29" fill={`${GOLD}55`}/>
          {[45,135,225,315].map((a,i) => (
            <polygon key={i} points="26,8 24.5,22 26,20.5 27.5,22" fill={`${GOLD}30`} transform={`rotate(${a},26,26)`}/>
          ))}
          <circle cx="26" cy="26" r="3.5" fill={GOLD}/>
          <circle cx="26" cy="26" r="1.8" fill={NIGHT}/>
        </svg>
      </div>

      {/* ── Version marker (top-left) ── */}
      <div style={{
        position:'absolute', top:30, left:32,
        fontSize:8, fontWeight:700, letterSpacing:'.35em',
        textTransform:'uppercase', color:`${GOLD}22`,
        fontFamily:"'Outfit',sans-serif",
        opacity: show ? 1 : 0, transition:'opacity .8s ease .5s',
      }}>JF · v2.0</div>

      {/* ── Mountain silhouette ── */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0,
        height:110, overflow:'hidden',
        opacity: show ? 1 : 0, transition:'opacity 1s ease .4s',
      }}>
        <svg viewBox="0 0 1440 110" preserveAspectRatio="none"
          style={{ position:'absolute', bottom:0, width:'100%', height:'100%', animation:'jf-mtn-rise 1.2s .3s ease both' }}>
          <path d="M0,110 L0,72 L90,30 L180,60 L270,20 L360,54 L450,14 L540,47 L630,22 L720,57 L810,24 L900,60 L990,16 L1080,50 L1170,20 L1260,54 L1350,34 L1440,60 L1440,110 Z"
            fill="#0a1628" opacity=".85"/>
          <path d="M0,110 L0,84 L80,58 L160,80 L240,48 L340,74 L440,43 L540,70 L640,53 L740,77 L840,44 L940,72 L1040,57 L1140,82 L1240,50 L1340,74 L1440,62 L1440,110 Z"
            fill="#060e1c"/>
          <path d="M268,20 L254,42 L282,42 Z M447,14 L433,34 L462,34 Z M628,22 L615,40 L642,40 Z M808,24 L795,44 L822,44 Z M987,16 L973,36 L1002,36 Z"
            fill={`${GOLD}22`}/>
        </svg>
      </div>

      {/* ── Horizon glow ── */}
      <div style={{
        position:'absolute', bottom:108, left:0, right:0, height:1,
        background:`linear-gradient(90deg,transparent 0%,${GOLD}14 20%,rgba(74,143,212,.18) 50%,${GOLD}14 80%,transparent 100%)`,
        opacity: show ? 1 : 0, transition:'opacity 1.2s ease .7s',
      }}/>

      {/* ── Progress bar ── */}
      <div style={{ position:'absolute', bottom:0, left:0, right:0, height:2, background:'rgba(255,255,255,.04)' }}>
        <div style={{
          height:'100%',
          background:`linear-gradient(90deg,${GOLD}44,${GOLD_LT}ee,${GOLD}44)`,
          animation:'jf-bar 3.2s cubic-bezier(.4,0,.2,1) forwards',
          boxShadow:`0 0 8px ${GOLD}88`,
        }}/>
      </div>

      {/* ── Coordinates (bottom-left) ── */}
      <div style={{
        position:'absolute', bottom:10, left:32,
        fontSize:7, fontWeight:400, letterSpacing:'.2em',
        color:`${GOLD}2e`, fontFamily:"'Outfit',monospace",
        opacity: show ? 1 : 0, transition:'opacity .8s ease .8s',
      }}>48.8566°N · 2.3522°E</div>

      {/* ── "Initialising" label (bottom-right) ── */}
      <div style={{
        position:'absolute', bottom:10, right:20,
        fontSize:8, fontWeight:900, letterSpacing:'.45em',
        textTransform:'uppercase', color:`${GOLD}33`,
        fontFamily:"'Outfit',sans-serif",
        opacity: show ? 1 : 0, transition:'opacity .8s ease .5s',
      }}>Initialising</div>

    </div>
  );
}