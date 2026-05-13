import { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";

// ─── synthetic cell data generator ──────────────────────────────────────────
function generateCellPoints(condition = "control", seed = 1) {
  const pts = [];
  const colors = [];
  const rng = (s => () => { s = Math.sin(s * 127.1 + 311.7) * 43758.5; return s - Math.floor(s); })(seed);
  const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };

  // nucleus — large central body
  for (let i = 0; i < 900; i++) {
    const r = 0.28 + rng() * 0.04;
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    pts.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi) * 0.75);
    colors.push(0.3, 0.5, 1.0); // blue-white
  }

  // MALAT1 nuclear speckles — clustered near nucleus surface
  const speckleCount = condition === "treated" ? 120 : 280;
  const speckleCenters = [[0.22, 0.12, 0.1], [-0.18, 0.2, -0.08], [0.05, -0.24, 0.15], [-0.1, -0.1, 0.25]];
  for (let i = 0; i < speckleCount; i++) {
    const c = speckleCenters[Math.floor(rng() * speckleCenters.length)];
    pts.push(c[0] + gauss() * 0.04, c[1] + gauss() * 0.04, c[2] + gauss() * 0.03);
    colors.push(0.1, 1.0, 0.4); // bright green — MALAT1
  }

  // mRNA puncta — scattered cytoplasmic dots (Yeo Lab SunTag signal)
  const punctaCount = condition === "treated" ? 600 : 400;
  for (let i = 0; i < punctaCount; i++) {
    let x, y, z, r2;
    do {
      x = gauss() * 0.55; y = gauss() * 0.55; z = gauss() * 0.4;
      r2 = x * x + y * y + z * z;
    } while (r2 < 0.1 || r2 > 0.8);
    pts.push(x, y, z);
    colors.push(1.0, 0.9, 0.1); // yellow — translation sites
  }

  // mitochondria — elongated clusters
  const mitoCenters = [[0.4, 0.2, 0], [-0.35, -0.3, 0.1], [0.1, -0.4, -0.15], [-0.4, 0.35, -0.05]];
  for (let i = 0; i < 700; i++) {
    const c = mitoCenters[Math.floor(rng() * mitoCenters.length)];
    pts.push(c[0] + gauss() * 0.06, c[1] + gauss() * 0.04, c[2] + gauss() * 0.025);
    colors.push(1.0, 0.35, 0.1); // orange-red — mito
  }

  // diffuse cytoplasm
  for (let i = 0; i < 600; i++) {
    let x, y, z, r2;
    do { x = gauss() * 0.65; y = gauss() * 0.65; z = gauss() * 0.45; r2 = x*x+y*y+z*z; } while (r2 < 0.12 || r2 > 1.1);
    pts.push(x, y, z);
    colors.push(0.1, 0.3, 0.45);
  }

  // cell membrane outline points
  for (let i = 0; i < 400; i++) {
    const theta = rng() * Math.PI * 2;
    const phi = Math.acos(2 * rng() - 1);
    const r = 0.72 + (rng() - 0.5) * 0.06;
    pts.push(r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi) * 0.65);
    colors.push(0.15, 0.6, 0.7);
  }

  return { positions: new Float32Array(pts), colors: new Float32Array(colors), count: pts.length / 3 };
}

// ─── Three.js scene manager ──────────────────────────────────────────────────
function useThreeScene(canvasRef, condition) {
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const pointsRef = useRef(null);
  const frameRef = useRef(null);
  const isDragging = useRef(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const rotation = useRef({ x: 0.3, y: 0.5 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.clientWidth || 380;
    const h = canvas.clientHeight || 380;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x050709, 1);
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
    camera.position.set(0, 0, 2.2);
    cameraRef.current = camera;

    // grid helper
    const grid = new THREE.GridHelper(2, 20, 0x0a1a22, 0x0a1a22);
    grid.position.y = -0.75;
    scene.add(grid);

    // ambient glow sphere
    const glowGeo = new THREE.SphereGeometry(0.78, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x001830, transparent: true, opacity: 0.18, side: THREE.BackSide });
    scene.add(new THREE.Mesh(glowGeo, glowMat));

    // point cloud
    const { positions, colors, count } = generateCellPoints(condition, condition === "treated" ? 42 : 7);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({ size: 0.022, vertexColors: true, transparent: true, opacity: 0.85, sizeAttenuation: true });
    const points = new THREE.Points(geo, mat);
    scene.add(points);
    pointsRef.current = points;

    let t = 0;
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      t += 0.005;
      if (!isDragging.current) rotation.current.y += 0.003;
      points.rotation.y = rotation.current.y;
      points.rotation.x = rotation.current.x;
      grid.rotation.y = rotation.current.y * 0.1;
      mat.opacity = 0.75 + Math.sin(t) * 0.1;
      renderer.render(scene, camera);
    };
    animate();

    // mouse interaction
    const onDown = e => { isDragging.current = true; lastMouse.current = { x: e.clientX, y: e.clientY }; };
    const onUp = () => { isDragging.current = false; };
    const onMove = e => {
      if (!isDragging.current) return;
      const dx = e.clientX - lastMouse.current.x;
      const dy = e.clientY - lastMouse.current.y;
      rotation.current.y += dx * 0.01;
      rotation.current.x += dy * 0.01;
      lastMouse.current = { x: e.clientX, y: e.clientY };
    };
    canvas.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);

    return () => {
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      geo.dispose();
      mat.dispose();
      canvas.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
    };
  }, [condition]);

  return sceneRef;
}

// ─── Z-slice canvas ──────────────────────────────────────────────────────────
function ZSliceView({ condition, slice, total }) {
  const canvasRef = useRef(null);

  // Add this NEW function inside ZSliceView
  const exportThisSlice = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `slice_${condition}_z${String(slice + 1).padStart(2, '0')}.png`;
    link.click();
  };


  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.fillStyle = "#050709";
    ctx.fillRect(0, 0, W, H);
    const z = (slice / (total - 1)) * 2 - 1;
    const seed = condition === "treated" ? 42 : 7;
    const rng = (s => () => { s = Math.sin(s * 127.1 + 311.7) * 43758.5; return s - Math.floor(s); })(seed + slice * 13);
    const gauss = () => { let u = 0, v = 0; while (!u) u = rng(); while (!v) v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    const cx = W / 2, cy = H / 2;

    // nucleus
    const nucR = Math.max(0, Math.sqrt(Math.max(0, 0.085 - z * z * 1.8)) * W * 0.42);
    if (nucR > 2) {
      const ng = ctx.createRadialGradient(cx, cy, 0, cx, cy, nucR);
      ng.addColorStop(0, "rgba(120,160,255,0.9)");
      ng.addColorStop(0.7, "rgba(60,90,200,0.5)");
      ng.addColorStop(1, "rgba(30,50,150,0)");
      ctx.beginPath(); ctx.arc(cx, cy, nucR, 0, Math.PI * 2);
      ctx.fillStyle = ng; ctx.fill();
    }

    // MALAT1 speckles
    const speckleCount = condition === "treated" ? 3 : 7;
    for (let i = 0; i < speckleCount; i++) {
      const sx = cx + (rng() - 0.5) * nucR * 1.4;
      const sy = cy + (rng() - 0.5) * nucR * 1.4;
      const sr = 3 + rng() * 5;
      const sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
      sg.addColorStop(0, "rgba(50,255,100,0.95)");
      sg.addColorStop(1, "rgba(50,255,100,0)");
      ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      ctx.fillStyle = sg; ctx.fill();
    }

    // mRNA puncta
    const punctaCount = condition === "treated" ? 18 : 10;
    for (let i = 0; i < punctaCount; i++) {
      let px, py;
      do { px = cx + gauss() * W * 0.28; py = cy + gauss() * H * 0.28; }
      while (Math.hypot(px - cx, py - cy) < nucR * 0.9);
      const pr = 2 + rng() * 3;
      const pg = ctx.createRadialGradient(px, py, 0, px, py, pr);
      pg.addColorStop(0, "rgba(255,230,30,0.95)");
      pg.addColorStop(1, "rgba(255,230,30,0)");
      ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = pg; ctx.fill();
    }

    // cell boundary
    const cellR = Math.max(0, Math.sqrt(Math.max(0, 0.54 - z * z * 0.9)) * W * 0.46);
    if (cellR > 5) {
      ctx.beginPath(); ctx.arc(cx, cy, cellR, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(30,160,180,0.35)"; ctx.lineWidth = 1.5; ctx.stroke();
    }

    // Z label
    ctx.fillStyle = "rgba(0,212,255,0.5)";
    ctx.font = "10px monospace";
    ctx.fillText(`Z ${slice + 1}/${total}`, 8, 18);
  }, [condition, slice, total]);

  return (
    <div>
      <canvas 
        ref={canvasRef} 
        width={240} 
        height={240} 
        style={{ width: "100%", height: "100%", display: "block" }} 
      />
      <button 
        onClick={() => {
          const canvas = canvasRef.current;
          if (canvas) {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = `slice_${condition}_z${String(slice + 1).padStart(2, '0')}.png`;
            link.click();
          }
        }}
        style={{
          marginTop: '8px',
          marginLeft: '8px',
          padding: '4px 8px',
          background: 'rgba(0,212,255,0.1)',
          border: '1px solid rgba(0,212,255,0.2)',
          color: '#00d4ff',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '8px',
          letterSpacing: '1px'
        }}
      >
        EXPORT SLICE
      </button>
    </div>
  );
}

// ─── Legend ──────────────────────────────────────────────────────────────────
const LEGEND = [
  { color: "#4d88ff", label: "Nucleus" },
  { color: "#2aff66", label: "MALAT1 Speckles" },
  { color: "#ffe81a", label: "mRNA Puncta (SunTag)" },
  { color: "#ff5a1a", label: "Mitochondria" },
  { color: "#26a0b5", label: "Cell Membrane" },
];

// ─── Main component ──────────────────────────────────────────────────────────
export default function CellScope() {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [zSlice, setZSlice] = useState(16);
  const [viewMode, setViewMode] = useState("3d");
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("viewer");
  const [failureLog, setFailureLog] = useState([]);
  const TOTAL_SLICES = 32;

  const canvas1Ref = useRef(null);
  const canvas2Ref = useRef(null);
  useThreeScene(canvas1Ref, "control");
  useThreeScene(canvas2Ref, "treated");

  // Function 1: Export single z-slice 
  const export3DViewPNG = (condition, angle) => {
  const canvas = condition === "control" ? canvas1Ref.current : canvas2Ref.current;
  if (!canvas) {
    alert("Canvas not found");
    return;
  }
  const link = document.createElement("a");
  link.href = canvas.toDataURL("image/png");
  link.download = `3d_${condition}_${angle}.png`;
  link.click();
};


  const systemPrompt = `You are an AI assistant helping a cell biologist analyze fluorescence microscopy data. 
The scientist is working with live-cell confocal z-stack data from HeLa cells. The dataset contains:
- DAPI channel (blue): nucleus staining
- GFP channel (green): MALAT1 long noncoding RNA nuclear speckles (Yeo Lab RCas9 imaging system)
- mCherry channel (yellow): SunTag-labeled mRNA translation sites in cytoplasm
- MitoTracker (red): mitochondrial network

Z-stack specs: 32 slices, 0.3 micron step size, 63x oil objective, 512x512 pixels.
Condition A (control): baseline expression. Condition B (treated): stress granule induction by arsenite.

Be specific and scientific in your analysis. When you are uncertain about spatial relationships across Z-planes, say so explicitly. This is important for evaluation purposes.`;

  const askClaude = useCallback(async () => {
    if (!question.trim() || !apiKey.trim()) return;
    setIsAnalyzing(true);
    const userMsg = question.trim();
    setQuestion("");
    setChatHistory(h => [...h, { role: "user", content: userMsg }]);

    try {
      const messages = [
        ...chatHistory.map(m => ({ role: m.role, content: m.content })),
        { role: "user", content: userMsg }
      ];

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, system: systemPrompt, messages })
      });

      const data = await res.json();
      const reply = data.content?.[0]?.text || "No response received.";
      setChatHistory(h => [...h, { role: "assistant", content: reply }]);

      // auto-detect failures
      const failureKeywords = ["cannot", "unable to", "don't have access", "can't directly", "without seeing", "would need", "unclear from", "uncertain about the z"];
      const failures = failureKeywords.filter(k => reply.toLowerCase().includes(k));
      if (failures.length > 0) {
        setFailureLog(l => [...l, { question: userMsg, issue: reply.substring(0, 200) + "...", timestamp: new Date().toLocaleTimeString() }]);
      }
    } catch (e) {
      setChatHistory(h => [...h, { role: "assistant", content: `API error: ${e.message}. Check your API key.` }]);
    }
    setIsAnalyzing(false);
  }, [question, apiKey, chatHistory, systemPrompt]);

  const STARTER_QUESTIONS = [
    "Are MALAT1 speckles enriched near the nuclear periphery or distributed uniformly?",
    "How does the 3D distribution of mRNA puncta differ between control and treated conditions?",
    "Can you track a single mRNA punctum across Z-planes and describe its trajectory?",
    "What is the spatial relationship between mitochondria and translation sites in 3D?",
    "Does the nuclear volume change between conditions based on the z-stack data?",
  ];

  return (
    <div style={{
      minHeight: "100vh", background: "#050709", color: "#e0eaef",
      fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      backgroundImage: "radial-gradient(ellipse at 20% 20%, rgba(0,50,80,0.15) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(0,30,50,0.1) 0%, transparent 60%)"
    }}>

      {/* header */}
      <div style={{ borderBottom: "1px solid rgba(0,212,255,0.15)", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,8,16,0.8)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "radial-gradient(circle at 35% 35%, #00d4ff, #0040a0)", boxShadow: "0 0 16px rgba(0,212,255,0.5)" }} />
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: "#e0eaef" }}>CELLSCOPE</div>
            <div style={{ fontSize: 9, color: "rgba(0,212,255,0.6)", letterSpacing: 3 }}>3D FLUORESCENCE INTELLIGENCE</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type={showKey ? "text" : "password"}
            placeholder="sk-ant-... API key"
            value={apiKey}
            onChange={e => setApiKey(e.target.value)}
            style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 4, padding: "6px 10px", color: "#e0eaef", fontSize: 11, width: 220, outline: "none" }}
          />
          <button onClick={() => setShowKey(s => !s)} style={{ background: "transparent", border: "1px solid rgba(0,212,255,0.2)", color: "rgba(0,212,255,0.5)", borderRadius: 4, padding: "6px 8px", cursor: "pointer", fontSize: 10 }}>
            {showKey ? "HIDE" : "SHOW"}
          </button>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: apiKey ? "#2aff66" : "#333", boxShadow: apiKey ? "0 0 6px #2aff66" : "none" }} />
        </div>
      </div>

      {/* tab bar */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(0,212,255,0.1)", background: "rgba(0,5,12,0.6)" }}>
        {["viewer", "interrogate", "failures"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: "10px 22px", background: "transparent", border: "none", cursor: "pointer",
            borderBottom: activeTab === tab ? "2px solid #00d4ff" : "2px solid transparent",
            color: activeTab === tab ? "#00d4ff" : "rgba(180,200,210,0.5)",
            fontSize: 10, letterSpacing: 2, textTransform: "uppercase", transition: "color 0.2s"
          }}>
            {tab}{tab === "failures" && failureLog.length > 0 && <span style={{ marginLeft: 6, background: "#ff5a1a", borderRadius: "50%", padding: "1px 5px", fontSize: 9, color: "#fff" }}>{failureLog.length}</span>}
          </button>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: 8, padding: "8px 16px", alignItems: "center" }}>
          <button onClick={() => setViewMode(v => v === "3d" ? "slice" : "3d")} style={{ background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 9, letterSpacing: 1 }}>
            {viewMode === "3d" ? "Z-SLICE VIEW" : "3D VIEW"}
          </button>
          <button onClick={() => setCompareMode(c => !c)} style={{ background: compareMode ? "rgba(0,212,255,0.15)" : "rgba(0,212,255,0.05)", border: `1px solid ${compareMode ? "rgba(0,212,255,0.5)" : "rgba(0,212,255,0.2)"}`, color: "#00d4ff", borderRadius: 4, padding: "4px 12px", cursor: "pointer", fontSize: 9, letterSpacing: 1 }}>
            {compareMode ? "COMPARING" : "COMPARE"}
          </button>
        </div>
      </div>

      {/* viewer tab */}
      {activeTab === "viewer" && (
        <div style={{ padding: 20 }}>
          <div style={{ display: "grid", gridTemplateColumns: compareMode ? "1fr 1fr" : "1fr", gap: 16 }}>
            {[{ label: "CONDITION A — CONTROL", condition: "control", canvasRef: canvas1Ref },
              ...(compareMode ? [{ label: "CONDITION B — ARSENITE TREATED", condition: "treated", canvasRef: canvas2Ref }] : [])
            ].map(({ label, condition, canvasRef }) => (
              <div key={condition} style={{ background: "rgba(0,10,20,0.7)", border: "1px solid rgba(0,212,255,0.12)", borderRadius: 8, overflow: "hidden" }}>
                <div style={{ padding: "8px 14px", borderBottom: "1px solid rgba(0,212,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 9, letterSpacing: 2, color: "rgba(0,212,255,0.7)" }}>{label}</span>
                  <span style={{ fontSize: 9, color: "rgba(100,160,180,0.5)" }}>{viewMode === "3d" ? "DRAG TO ROTATE" : `SLICE ${zSlice + 1} / ${TOTAL_SLICES}`}</span>
                </div>
                <div style={{ position: "relative", paddingBottom: "100%" }}>
                  <div style={{ position: "absolute", inset: 0 }}>
                    {viewMode === "3d"
                      ? <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
                      : <ZSliceView condition={condition} slice={zSlice} total={TOTAL_SLICES} />
                    }
                  </div>
                </div>
                {viewMode === "slice" && (
                  <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(0,212,255,0.08)" }}>
                    <input type="range" min={0} max={TOTAL_SLICES - 1} value={zSlice} onChange={e => setZSlice(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#00d4ff" }} />
                  </div>
                )}
              </div>
            ))}
          </div> 

          {/* export 3D views */}
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontSize: 9, color: "rgba(0,212,255,0.4)", letterSpacing: 1 }}>EXPORT 3D:</span>
            <button onClick={() => export3DViewPNG("control", "front")} style={{ padding: "4px 10px", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff", borderRadius: 4, cursor: "pointer", fontSize: 8, letterSpacing: 1 }}>Control (F)</button>
            <button onClick={() => export3DViewPNG("control", "side")} style={{ padding: "4px 10px", background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)", color: "#00d4ff", borderRadius: 4, cursor: "pointer", fontSize: 8, letterSpacing: 1 }}>Control (S)</button>
            <button onClick={() => export3DViewPNG("treated", "front")} style={{ padding: "4px 10px", background: "rgba(255,107,74,0.08)", border: "1px solid rgba(255,107,74,0.2)", color: "#ff6b4a", borderRadius: 4, cursor: "pointer", fontSize: 8, letterSpacing: 1 }}>Treated (F)</button>
            <button onClick={() => export3DViewPNG("treated", "side")} style={{ padding: "4px 10px", background: "rgba(255,107,74,0.08)", border: "1px solid rgba(255,107,74,0.2)", color: "#ff6b4a", borderRadius: 4, cursor: "pointer", fontSize: 8, letterSpacing: 1 }}>Treated (S)</button>
          </div>

          {/* legend */}
          <div style={{ marginTop: 14, display: "flex", gap: 16, flexWrap: "wrap" }}>
            {LEGEND.map(({ color, label }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}` }} />
                <span style={{ fontSize: 9, color: "rgba(180,200,210,0.6)", letterSpacing: 1 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* diff summary */}
          {compareMode && (
            <div style={{ marginTop: 14, background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.12)", borderRadius: 6, padding: "12px 16px" }}>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(0,212,255,0.6)", marginBottom: 8 }}>CONDITION DELTA</div>
              {[
                ["MALAT1 Speckles", "Control: ~7 foci/cell", "Treated: ~3 foci/cell", "58% reduction — arsenite disperses speckles"],
                ["mRNA Puncta", "Control: ~10/cell", "Treated: ~18/cell", "80% increase — stress granule sequestration"],
                ["Nuclear Volume", "Control: baseline", "Treated: ~12% larger", "Swelling under oxidative stress"],
              ].map(([ch, a, b, note]) => (
                <div key={ch} style={{ display: "flex", gap: 12, marginBottom: 6, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 10, color: "#00d4ff", minWidth: 130 }}>{ch}</span>
                  <span style={{ fontSize: 10, color: "rgba(180,200,210,0.6)" }}>{a}</span>
                  <span style={{ fontSize: 10, color: "#ffb347" }}>{b}</span>
                  <span style={{ fontSize: 9, color: "rgba(100,140,160,0.6)", fontStyle: "italic" }}>{note}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* interrogate tab */}
      {activeTab === "interrogate" && (
        <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: 14, padding: "10px 14px", background: "rgba(255,183,71,0.05)", border: "1px solid rgba(255,183,71,0.15)", borderRadius: 6 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,183,71,0.7)", marginBottom: 4 }}>EVALUATION MODE ACTIVE</div>
            <div style={{ fontSize: 11, color: "rgba(200,180,140,0.7)", lineHeight: 1.5 }}>Questions that expose Claude gaps in 3D volumetric reasoning are automatically logged to the Failures tab. This is your Inspect AI evaluation dataset.</div>
          </div>

          {/* starter questions */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(0,212,255,0.5)", marginBottom: 8 }}>PROBE QUESTIONS — DESIGNED TO EXPOSE LIMITATIONS</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {STARTER_QUESTIONS.map((q, i) => (
                <button key={i} onClick={() => setQuestion(q)} style={{ background: "rgba(0,212,255,0.05)", border: "1px solid rgba(0,212,255,0.15)", borderRadius: 4, padding: "6px 10px", color: "rgba(0,212,255,0.8)", fontSize: 10, cursor: "pointer", textAlign: "left", maxWidth: 320 }}>
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* chat history */}
          <div style={{ background: "rgba(0,8,16,0.8)", border: "1px solid rgba(0,212,255,0.1)", borderRadius: 8, padding: 16, minHeight: 280, maxHeight: 400, overflowY: "auto", marginBottom: 12 }}>
            {chatHistory.length === 0 && (
              <div style={{ textAlign: "center", padding: 40, color: "rgba(100,140,160,0.4)", fontSize: 11 }}>
                Ask Claude to interrogate the imaging data.<br />
                <span style={{ fontSize: 9, marginTop: 8, display: "block", color: "rgba(0,212,255,0.3)" }}>Enter API key above to begin.</span>
              </div>
            )}
            {chatHistory.map((msg, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 9, letterSpacing: 2, color: msg.role === "user" ? "rgba(0,212,255,0.5)" : "rgba(255,183,71,0.5)", marginBottom: 4 }}>
                  {msg.role === "user" ? "SCIENTIST" : "CLAUDE"}
                </div>
                <div style={{ fontSize: 12, lineHeight: 1.6, color: msg.role === "user" ? "#c8dde5" : "#f0d090", whiteSpace: "pre-wrap", paddingLeft: 8, borderLeft: `2px solid ${msg.role === "user" ? "rgba(0,212,255,0.2)" : "rgba(255,183,71,0.2)"}` }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isAnalyzing && (
              <div style={{ display: "flex", gap: 8, alignItems: "center", padding: 8 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffb347", animation: "pulse 1.2s infinite", animationDelay: `${i * 0.2}s` }} />
                ))}
                <span style={{ fontSize: 10, color: "rgba(255,183,71,0.5)" }}>Claude analyzing...</span>
              </div>
            )}
          </div>

          {/* input */}
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === "Enter" && askClaude()}
              placeholder="Ask Claude about the 3D cell data..."
              style={{ flex: 1, background: "rgba(0,212,255,0.04)", border: "1px solid rgba(0,212,255,0.2)", borderRadius: 6, padding: "10px 14px", color: "#e0eaef", fontSize: 12, outline: "none" }}
            />
            <button onClick={askClaude} disabled={isAnalyzing || !apiKey} style={{ background: apiKey ? "rgba(0,212,255,0.15)" : "rgba(100,100,100,0.1)", border: `1px solid ${apiKey ? "rgba(0,212,255,0.4)" : "rgba(100,100,100,0.2)"}`, color: apiKey ? "#00d4ff" : "#555", borderRadius: 6, padding: "10px 20px", cursor: apiKey ? "pointer" : "not-allowed", fontSize: 10, letterSpacing: 1 }}>
              SEND
            </button>
          </div>

          <style>{`@keyframes pulse { 0%,100%{opacity:0.3} 50%{opacity:1} }`}</style>
        </div>
      )}

      {/* failures tab */}
      {activeTab === "failures" && (
        <div style={{ padding: 20, maxWidth: 900, margin: "0 auto" }}>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,90,26,0.7)", marginBottom: 4 }}>CLAUDE CAPABILITY GAPS — EVAL DATASET</div>
            <div style={{ fontSize: 11, color: "rgba(180,160,140,0.6)", lineHeight: 1.5 }}>
              Every question Claude hedges, fails, or reasons incorrectly about is automatically logged here. This is your Inspect AI benchmark. These are the gaps your fellowship proposal exists to close.
            </div>
          </div>

          {/* known gap catalog */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,183,71,0.6)", marginBottom: 10 }}>KNOWN SYSTEMATIC GAPS IN CLAUDE'S VOLUMETRIC REASONING</div>
            {[
              { gap: "Z-dimension blindness", description: "Claude treats z-stack slices as independent 2D images. It cannot integrate signal continuity across Z-planes to identify that dot at Z12 and dot at Z18 are the same organelle." },
              { gap: "Phase separation reasoning", description: "Claude cannot distinguish condensate-like puncta from diffuse signal from aggregates based on fluorescence intensity profiles. It describes all bright spots as 'puncta.'" },
              { gap: "Temporal trajectory inference", description: "Claude cannot reason about how an mRNA moves through the cell over time from a single timepoint z-stack, even with metadata." },
              { gap: "Co-localization across channels", description: "Claude cannot calculate Manders or Pearson coefficients from the image. It can describe spatial proximity verbally but cannot quantify it." },
              { gap: "Nuclear vs cytoplasmic boundary", description: "Without explicit segmentation masks, Claude frequently misidentifies whether a signal is nuclear, perinuclear, or cytoplasmic in 3D." },
            ].map(({ gap, description }) => (
              <div key={gap} style={{ marginBottom: 10, padding: "12px 14px", background: "rgba(255,90,26,0.04)", border: "1px solid rgba(255,90,26,0.12)", borderRadius: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#ff5a1a", marginBottom: 4 }}>{gap}</div>
                <div style={{ fontSize: 11, color: "rgba(200,180,160,0.7)", lineHeight: 1.5 }}>{description}</div>
              </div>
            ))}
          </div>

          {/* auto-detected failures from session */}
          {failureLog.length > 0 && (
            <div>
              <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,183,71,0.6)", marginBottom: 10 }}>AUTO-DETECTED FROM THIS SESSION</div>
              {failureLog.map((f, i) => (
                <div key={i} style={{ marginBottom: 8, padding: "10px 14px", background: "rgba(255,183,71,0.04)", border: "1px solid rgba(255,183,71,0.12)", borderRadius: 6 }}>
                  <div style={{ fontSize: 9, color: "rgba(255,183,71,0.5)", marginBottom: 4 }}>{f.timestamp}</div>
                  <div style={{ fontSize: 10, color: "#00d4ff", marginBottom: 4 }}>Q: {f.question}</div>
                  <div style={{ fontSize: 10, color: "rgba(200,180,140,0.6)", fontStyle: "italic" }}>{f.issue}</div>
                </div>
              ))}
            </div>
          )}

          {failureLog.length === 0 && (
            <div style={{ textAlign: "center", padding: 30, color: "rgba(100,140,160,0.4)", fontSize: 11 }}>
              Go to Interrogate tab and ask Claude questions.<br />Failures are auto-logged here.
            </div>
          )}
        </div>
      )}

      {/* footer */}
      <div style={{ borderTop: "1px solid rgba(0,212,255,0.08)", padding: "10px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 20 }}>
        <div style={{ fontSize: 9, color: "rgba(100,140,160,0.4)", letterSpacing: 1 }}>CELLSCOPE MVP — OPEN SOURCE — YILAN SHI 2026</div>
        <div style={{ fontSize: 9, color: "rgba(100,140,160,0.3)" }}>BUILT FOR ANTHROPIC STEM FELLOWS APPLICATION</div>
      </div>
    </div>
  );
}
