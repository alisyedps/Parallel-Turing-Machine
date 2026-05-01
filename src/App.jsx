import { useState, useEffect, useRef } from "react";

/* ── API base — change this if your server runs on a different host ── */
const API = "http://localhost:5000/api";

/* ── Design tokens ─────────────────────────────────────────────────── */
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Syne:wght@500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#0a0b0e;}
.tm-root{background:#0a0b0e;color:#f1f5f9;font-family:'Syne',sans-serif;padding:1.5rem 1rem 4rem;position:relative;overflow-x:hidden;min-height:100vh;}
.tm-root::before{content:'';position:fixed;inset:0;z-index:0;background-image:linear-gradient(rgba(59,130,246,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.03) 1px,transparent 1px);background-size:40px 40px;pointer-events:none;}
.tm-root::after{content:'';position:fixed;top:-20%;left:30%;width:60vw;height:60vh;background:radial-gradient(ellipse,rgba(59,130,246,.07) 0%,transparent 70%);pointer-events:none;z-index:0;}
.inner{position:relative;z-index:1;max-width:780px;margin:0 auto;}
.badge{display:inline-flex;align-items:center;gap:6px;border:1px solid #2e3a50;background:rgba(59,130,246,.08);padding:4px 12px;border-radius:999px;font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#3b82f6;font-family:'JetBrains Mono',monospace;margin-bottom:.8rem;animation:slideDown .6s ease both;}
.badge-dot{width:6px;height:6px;border-radius:50%;background:#3b82f6;animation:pulse 2s ease infinite;}
.title{font-size:clamp(26px,5vw,38px);font-weight:800;letter-spacing:-.02em;background:linear-gradient(135deg,#f1f5f9 0%,#64748b 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:slideDown .6s .1s ease both;}
.subtitle{margin-top:6px;font-size:13px;color:#64748b;margin-bottom:1.5rem;animation:slideDown .6s .2s ease both;}
.card{background:#161a22;border:1px solid #1e2330;border-radius:16px;padding:1.25rem;margin-bottom:1rem;position:relative;overflow:hidden;}
.card::before{content:'';position:absolute;inset:0;border-radius:16px;background:linear-gradient(135deg,rgba(59,130,246,.04) 0%,transparent 60%);pointer-events:none;}
.card-lbl{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#64748b;margin-bottom:10px;font-family:'JetBrains Mono',monospace;}
.ops{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px;}
.op-btn{padding:6px 14px;border-radius:8px;font-size:12px;font-family:'Syne',sans-serif;font-weight:500;cursor:pointer;transition:all .2s;border:1px solid #1e2330;background:#111318;color:#64748b;display:flex;align-items:center;gap:5px;}
.op-btn:hover{border-color:#2e3a50;color:#f1f5f9;}
.op-btn.active{background:#3b82f6;border-color:#3b82f6;color:#fff;box-shadow:0 0 18px rgba(59,130,246,.3);}
.op-sym{font-family:'JetBrains Mono',monospace;font-size:13px;}
.inputs{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:10px;margin-bottom:16px;}
.field label{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;display:block;margin-bottom:5px;font-family:'JetBrains Mono',monospace;}
.num-in{width:100%;padding:9px 11px;border-radius:10px;border:1px solid #1e2330;background:#111318;color:#f1f5f9;font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:500;outline:none;transition:border-color .2s,box-shadow .2s;}
.num-in:focus{border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15);}
.num-in:disabled{opacity:.4;cursor:not-allowed;}
input[type=range].rng{-webkit-appearance:none;width:100%;height:4px;border-radius:99px;outline:none;cursor:pointer;background:linear-gradient(to right,#3b82f6 0%,#3b82f6 var(--p,14%),#111318 var(--p,14%),#111318 100%);}
input[type=range].rng::-webkit-slider-thumb{-webkit-appearance:none;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid #3b82f6;box-shadow:0 0 8px rgba(59,130,246,.5);transition:transform .15s;}
input[type=range].rng::-webkit-slider-thumb:hover{transform:scale(1.2);}
input[type=range].rng:disabled{opacity:.4;cursor:not-allowed;}
.run-row{display:flex;align-items:center;gap:12px;}
.run-btn{padding:10px 24px;border-radius:10px;font-size:13px;font-weight:600;font-family:'Syne',sans-serif;cursor:pointer;background:linear-gradient(135deg,#3b82f6,#06b6d4);color:#fff;border:none;box-shadow:0 4px 20px rgba(59,130,246,.35);transition:transform .15s,box-shadow .15s;display:flex;align-items:center;gap:7px;}
.run-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 6px 28px rgba(59,130,246,.45);}
.run-btn:active:not(:disabled){transform:scale(.98);}
.run-btn:disabled{opacity:.5;cursor:default;}
.tinfo{font-size:11px;color:#64748b;font-family:'JetBrains Mono',monospace;}
.tinfo strong{color:#3b82f6;}
.tape-lbl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;margin-bottom:5px;font-family:'JetBrains Mono',monospace;}
.tape-row{display:flex;flex-wrap:wrap;gap:3px;margin-bottom:12px;}
.cell{width:17px;height:21px;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:9px;font-family:'JetBrains Mono',monospace;font-weight:700;}
.c1{background:rgba(59,130,246,.18);color:#3b82f6;border:1px solid rgba(59,130,246,.32);}
.c0{background:#111318;color:#334155;border:1px solid #1e2330;}
.cx{background:rgba(16,185,129,.18);color:#10b981;border:1px solid rgba(16,185,129,.32);}
.cm{font-size:11px;color:#64748b;align-self:center;margin-left:4px;}
.pop{animation:cellPop .35s ease both;}
.answer{background:linear-gradient(135deg,rgba(59,130,246,.12),rgba(6,182,212,.07));border:1px solid rgba(59,130,246,.22);border-radius:12px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;}
.ans-eq{font-family:'JetBrains Mono',monospace;font-size:18px;font-weight:700;}
.ans-badge{margin-left:auto;font-size:10px;letter-spacing:.1em;text-transform:uppercase;background:rgba(59,130,246,.15);color:#3b82f6;padding:4px 9px;border-radius:6px;font-family:'JetBrains Mono',monospace;}
.live-badge{font-size:10px;letter-spacing:.1em;text-transform:uppercase;background:rgba(16,185,129,.15);color:#10b981;padding:4px 9px;border-radius:6px;font-family:'JetBrains Mono',monospace;}
.metrics{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin:12px 0;}
.met{background:#111318;border:1px solid #1e2330;border-radius:12px;padding:11px 13px;position:relative;overflow:hidden;}
.met::after{content:'';position:absolute;bottom:0;left:0;right:0;height:2px;border-radius:0 0 12px 12px;}
.met.bl::after{background:linear-gradient(90deg,#3b82f6,transparent);}
.met.cy::after{background:linear-gradient(90deg,#06b6d4,transparent);}
.met.gr::after{background:linear-gradient(90deg,#10b981,transparent);}
.met-lbl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;font-family:'JetBrains Mono',monospace;margin-bottom:5px;}
.met-val{font-size:20px;font-weight:700;font-family:'JetBrains Mono',monospace;}
.met-unit{font-size:11px;color:#64748b;margin-left:3px;}
.spd-row{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:5px;}
.spd-lbl{font-size:10px;letter-spacing:.12em;text-transform:uppercase;color:#64748b;font-family:'JetBrains Mono',monospace;}
.spd-val{font-size:14px;font-weight:700;font-family:'JetBrains Mono',monospace;}
.spd-track{height:8px;background:#111318;border-radius:99px;overflow:hidden;border:1px solid #1e2330;}
.spd-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#3b82f6,#06b6d4);box-shadow:0 0 8px rgba(59,130,246,.4);transition:width .8s cubic-bezier(.16,1,.3,1);}
.spd-ticks{display:flex;justify-content:space-between;margin-top:3px;}
.spd-tick{font-size:9px;color:#334155;font-family:'JetBrains Mono',monospace;}
.err-box{background:rgba(239,68,68,.1);border:1px solid rgba(239,68,68,.3);border-radius:10px;padding:12px 16px;color:#ef4444;font-size:13px;font-family:'JetBrains Mono',monospace;margin-bottom:12px;}
.spinner{width:13px;height:13px;border-radius:50%;border:2px solid rgba(255,255,255,.2);border-top-color:#fff;animation:spin .7s linear infinite;display:inline-block;}
.core-warn{font-size:11px;color:#f59e0b;font-family:'JetBrains Mono',monospace;margin-top:4px;}
@keyframes slideDown{from{opacity:0;transform:translateY(-12px)}to{opacity:1;transform:none}}
@keyframes slideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes cellPop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.2)}100%{transform:scale(1);opacity:1}}
@keyframes barGrow{from{width:0}}
@keyframes resIn{from{opacity:0;transform:scale(.97) translateY(8px)}to{opacity:1;transform:none}}
.bar-anim{animation:barGrow .6s cubic-bezier(.16,1,.3,1) both;}
.res-anim{animation:resIn .4s cubic-bezier(.16,1,.3,1) both;}
.fadein{animation:slideUp .5s ease both;}
`;

const OPS = [
  { id:1, label:"Addition",       symbol:"+" },
  { id:2, label:"Subtraction",    symbol:"−" },
  { id:3, label:"Multiplication", symbol:"×" },
  { id:4, label:"Division",       symbol:"÷" },
  { id:5, label:"Modulo",         symbol:"%" },
];

function Tape({ tape, label, animCells=false, max=72 }){
  if(!tape) return null;
  const show = tape.length > max ? tape.slice(0, max) : tape;
  return (
    <div style={{marginBottom:14}}>
      <div className="tape-lbl">{label}</div>
      <div className="tape-row">
        {show.split("").map((c,i)=>{
          const cls="cell "+(c==="1"?"c1":c==="0"?"c0":"cx")+(animCells?" pop":"");
          return <div key={i} className={cls} style={animCells?{animationDelay:`${Math.min(i*7,280)}ms`}:{}}>{c}</div>;
        })}
        {tape.length>max && <div className="cm">+{tape.length-max}</div>}
      </div>
    </div>
  );
}

function RangeField({ label, value, min, max, onChange, disabled }){
  const pct = ((value-min)/(max-min))*100;
  return (
    <div className="field">
      <label>{label} <span style={{color:"#3b82f6",fontFamily:"'JetBrains Mono',monospace"}}>{value}</span></label>
      <div style={{paddingTop:8}}>
        <input type="range" className="rng" min={min} max={max} step={1} value={value}
          disabled={disabled}
          style={{"--p":`${pct}%`}} onChange={e=>onChange(Number(e.target.value))}/>
      </div>
    </div>
  );
}

export default function App(){
  const injected = useRef(false);
  if(!injected.current){
    injected.current = true;
    const s = document.createElement("style");
    s.textContent = GLOBAL_CSS;
    document.head.appendChild(s);
  }

  const [op,       setOp]       = useState(1);
  const [a,        setA]        = useState(12);
  const [b,        setB]        = useState(5);
  const [cores,    setCores]    = useState(1);
  const [tpc,      setTpc]      = useState(1);
  const [maxCores, setMaxCores] = useState(null);  // fetched from server
  const [result,   setResult]   = useState(null);
  const [running,  setRunning]  = useState(false);
  const [error,    setError]    = useState(null);
  const [animKey,  setAnimKey]  = useState(0);
  const [serverOk, setServerOk] = useState(null); // null=checking true=ok false=down

  /* ── Fetch available cores from the server on mount ── */
  useEffect(()=>{
    fetch(`${API}/cores`)
      .then(r=>r.json())
      .then(data=>{
        setMaxCores(data.cores);
        setCores(1);
        setServerOk(true);
      })
      .catch(()=>{
        setServerOk(false);
        setMaxCores(null);
      });
  }, []);

  const total = cores * tpc;
  const opObj = OPS.find(o=>o.id===op);

  /* Clamp cores when maxCores loads */
  useEffect(()=>{
    if(maxCores && cores > maxCores) setCores(maxCores);
  }, [maxCores]);

  async function run(){
    setRunning(true);
    setError(null);
    try {
      const res = await fetch(`${API}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          a: Number(a), b: Number(b),
          operation: op,
          cores, threadsPerCore: tpc
        })
      });
      const data = await res.json();
      if(data.error){
        setError(data.error);
      } else {
        setResult(data);
        setAnimKey(k=>k+1);
      }
    } catch(e){
      setError("Cannot reach the bridge server at " + API +
               ". Make sure bridge_server.py is running.");
    } finally {
      setRunning(false);
    }
  }

  const ansStr = result
    ? result.halted
      ? "Machine halted"
      : result.answer !== null
        ? `${a} ${opObj?.symbol} ${b} = ${result.answer}`
        : result.quotient !== null
          ? `${a} ÷ ${b}  →  Q:${result.quotient}  R:${result.remainder}`
          : "Done"
    : "";

  return (
    <div className="tm-root">
      <div className="inner">

        {/* Header */}
        <div style={{marginBottom:"2rem"}}>
          <div className="badge">
            <div className="badge-dot"/>
            {serverOk === null ? "Connecting…" : serverOk ? "Live — Connected to C binary" : "Server offline"}
          </div>
          <h1 className="title">Turing Machine</h1>
          <p className="subtitle">Parallel unary tape arithmetic · OpenMP · Ubuntu</p>
        </div>

        {/* Server offline warning */}
        {serverOk === false && (
          <div className="err-box" style={{marginBottom:16}}>
            Bridge server is not running. Start it with:<br/>
            <strong>python3 bridge_server.py</strong><br/>
            Then compile the C binary:<br/>
            <strong>gcc -fopenmp -O2 -o turing_parallel turing_machine_parallel.c</strong>
          </div>
        )}

        {/* Config card */}
        <div className="card fadein" style={{animationDelay:".1s"}}>

          {/* Operation */}
          <div className="card-lbl">operation</div>
          <div className="ops">
            {OPS.map(o=>(
              <button key={o.id} className={`op-btn${op===o.id?" active":""}`} onClick={()=>setOp(o.id)}>
                <span className="op-sym">{o.symbol}</span>{o.label}
              </button>
            ))}
          </div>

          {/* Inputs */}
          <div className="inputs">
            <div className="field">
              <label>value A</label>
              <input type="number" className="num-in" value={a} min={0} max={99999}
                onChange={e=>setA(Number(e.target.value))}/>
            </div>
            <div className="field">
              <label>value B</label>
              <input type="number" className="num-in" value={b} min={0} max={99999}
                onChange={e=>setB(Number(e.target.value))}/>
            </div>
            <div>
              <RangeField label="cores" value={cores} min={1}
                max={maxCores || 8}
                onChange={v=>setCores(v)}
                disabled={!serverOk || maxCores===null}/>
              {maxCores && (
                <div className="core-warn">
                  Max allowed by your Ubuntu instance: {maxCores}
                </div>
              )}
            </div>
            <RangeField label="threads/core" value={tpc} min={1} max={8}
              onChange={setTpc} disabled={false}/>
          </div>

          {/* Run */}
          <div className="run-row">
            <button className="run-btn" onClick={run}
              disabled={running || serverOk===false}>
              {running
                ? <><span className="spinner"/>Running…</>
                : <>{a} {opObj?.symbol} {b}</>
              }
            </button>
            <span className="tinfo">
              <strong>{total}</strong> thread{total!==1?"s":""} &nbsp;·&nbsp;
              {cores} core{cores>1?"s":""}×{tpc}
              {maxCores && cores > maxCores &&
                <span style={{color:"#ef4444",marginLeft:6}}>⚠ exceeds system cores</span>}
            </span>
          </div>
        </div>

        {/* Error box */}
        {error && <div className="err-box">{error}</div>}

        {/* Result */}
        {result && !error && (
          <div key={animKey} className="card res-anim">

            <div className="answer">
              <div className="ans-eq">{ansStr}</div>
              <div className="live-badge">live · C binary</div>
              <div className="ans-badge">{result.operation}</div>
            </div>

            <Tape tape={result.initialTape} label="initial tape"/>
            <Tape tape={result.finalTape}   label="final tape" animCells/>

            {/* Metrics */}
            {result.serialTime !== null && (
              <>
                <div className="metrics">
                  <div className="met bl">
                    <div className="met-lbl">serial time</div>
                    <div className="met-val">
                      {(result.serialTime*1000).toFixed(3)}
                      <span className="met-unit">ms</span>
                    </div>
                  </div>
                  <div className="met cy">
                    <div className="met-lbl">parallel time</div>
                    <div className="met-val">
                      {(result.parallelTime*1000).toFixed(3)}
                      <span className="met-unit">ms</span>
                    </div>
                  </div>
                  <div className="met gr">
                    <div className="met-lbl">efficiency</div>
                    <div className="met-val">
                      {result.efficiency < 0.01
                     
                        ? result.efficiency?.toFixed(4) 
                        : result.efficiency?.toFixed(1)}
                      <span className="met-unit">%</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="spd-row">
                    <span className="spd-lbl">speedup</span>
                    <span className="spd-val">

                      {result.speedup < 0.01 
                        ? result.speedup?.toFixed(4) 
                        : result.speedup?.toFixed(2)}×
                    </span>
                  </div>
                  <div className="spd-track">
                    <div className="spd-fill bar-anim"
                      style={{width:`${Math.max(1, Math.min((result.speedup/result.totalThreads)*100,100))}%`}}
                  />
                  </div>
                  <div className="spd-ticks">
                    <span className="spd-tick">1×</span>
                    <span className="spd-tick">{result.totalThreads}×</span>
                  </div>
                </div>
              </>
              
            )}
          </div>
        )}

      </div>
    </div>
  );
}
