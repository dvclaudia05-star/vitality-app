import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Dumbbell, CheckCircle, Settings, TrendingUp, Activity,
  ChevronRight, ChevronLeft, Plus, Minus, X, Camera,
  Flame, Wind, LayoutList, AlertCircle, Calendar,
  BarChart2, Info, FlaskConical, Clock, AlertTriangle,
  Youtube, RotateCcw, ThumbsDown, Zap, Loader, BookOpen,
  History, Target
} from "lucide-react";

const mockDelay = (ms = 1200) => new Promise(r => setTimeout(r, ms));

const MOCK_STRATEGY = {
  overview: "A 4-phase progressive program built around your pull-up goal. We'll sequence scapular stability → lat strength → full ROM pull → max rep performance, with fat-loss cardio woven throughout.",
  phases: [
    { phase: "Phase 1 — Foundation", weeks: "Weeks 1–3", focus: "Scapular retractors, serratus anterior, deep cervical flexors", rationale: "Before loading the lats under full bodyweight, we must activate and strengthen the scapular stabilisers — lower trapezius, rhomboids, serratus anterior. Weak scapular control causes shoulder impingement under pull-up load and limits lat recruitment. Three weeks of scapular depression rows and dead hangs will build the connective tissue base and motor pattern required for Phase 2.", keyExercises: ["Dead Hang", "Scapular Pull-ups", "Band Pull-Aparts", "Lat Pulldown"] },
    { phase: "Phase 2 — Strength Build", weeks: "Weeks 4–7", focus: "Latissimus dorsi, biceps brachii, teres major", rationale: "With scapular stability established, we can now load the primary movers. Weighted lat pulldowns, assisted pull-ups, and heavy dumbbell rows will drive hypertrophy in the lats and biceps. Eccentric-focused negatives (5s down) will specifically build the strength needed for the concentric pull phase.", keyExercises: ["Assisted Pull-ups", "Eccentric Negatives", "Weighted Lat Pulldown", "Dumbbell Row"] },
    { phase: "Phase 3 — Volume & Skill", weeks: "Weeks 8–10", focus: "Full pull-up pattern, grip endurance, breathing mechanics", rationale: "Transition to full unassisted pull-ups at moderate volume. Cluster sets (3+2+2 with 20s intra-set rest) allow more total reps than straight sets, rapidly building the specific neuromuscular pattern. Grip training and breathing cues are introduced here — both limit performance at the 10-rep target.", keyExercises: ["Unassisted Pull-ups", "Cluster Sets", "Hang Board Grip", "Cable Row"] },
    { phase: "Phase 4 — Peak Performance", weeks: "Weeks 11–12", focus: "Max rep output, fatigue resistance, taper", rationale: "Reduce volume by 30%, maintain intensity. Grease-the-groove protocols (sub-maximal sets throughout the day) peak the nervous system without inducing fatigue. Final week is a taper — 2 sessions only — before the 10-rep test.", keyExercises: ["Grease-the-Groove Pull-ups", "Max Rep Test", "Light Row", "Stretch"] }
  ],
  weeklyLogic: "Three sessions per week on alternating days to allow 48h recovery between pull sessions. This frequency maximises skill acquisition for the pull-up pattern while preventing CNS fatigue. Weekend is full rest or light walking only.",
  progressionModel: "Add 1 rep per set each week on main lifts. Increase load 2.5kg when hitting top of rep range for 2 consecutive sessions. Deload week 4 and week 8.",
  watchOutAdaptations: "None flagged"
};

const MOCK_ASSESSMENTS = [
  { name: "Max Dead Hang", desc: "Grip a pull-up bar with both hands, shoulder-width apart. Hang as long as possible with arms fully extended. Stop when grip fails.", metric: "seconds", muscle: "Grip / Lats", forObj: "10 pull-ups" },
  { name: "Max Scapular Pull-ups", desc: "Dead hang position. Without bending elbows, depress and retract scapulae to raise body 2–3cm. Count max reps.", metric: "reps", muscle: "Lower trapezius / Serratus", forObj: "10 pull-ups" },
  { name: "Max Assisted Pull-ups (Band)", desc: "Use a medium resistance band looped over bar. Perform pull-ups to chin-over-bar. Count clean reps.", metric: "reps", muscle: "Latissimus dorsi / Biceps", forObj: "10 pull-ups" },
  { name: "3RM Lat Pulldown", desc: "Find the heaviest weight you can pull cleanly for exactly 3 reps with full ROM.", metric: "kg", muscle: "Latissimus dorsi", forObj: "10 pull-ups" }
];

const MOCK_PROGRAM = {
  sessionTitle: "Pull Foundation — Session 1",
  sessionFocus: "Activate scapular stabilisers, establish lat connection, and build dead hang endurance as the base for pull-up progression.",
  coachIntro: "Session 1 of your pull-up journey. Today we build the foundation — scapular control and lat activation. Every rep here directly unlocks your first unassisted pull-up. Let's go.",
  exercises: [
    { name: "Arm Circle & Shoulder Roll", muscle: "Shoulder girdle", type: "warmup", sets: 1, repsTarget: 20, restSeconds: 30, cnsLoad: 1, weightKgSuggested: 0, rationale: "Increases synovial fluid in the glenohumeral joint and warms the rotator cuff before loading.", formCues: "Full range both directions. Feel the shoulder blade move. Breathe out on each circle.", contraindication: null, youtubeQuery: "arm+circle+shoulder+warmup" },
    { name: "Band Pull-Apart", muscle: "Rear deltoid / Rhomboids", type: "warmup", sets: 2, repsTarget: 15, restSeconds: 30, cnsLoad: 1, weightKgSuggested: 0, rationale: "Activates the scapular retractors before the session. Critical pre-cursor to any pull movement.", formCues: "Keep arms straight. Squeeze shoulder blades at end range. Band at chest height.", contraindication: null, youtubeQuery: "band+pull+apart+scapula+activation" },
    { name: "Lat Pulldown", muscle: "Latissimus dorsi / Biceps", type: "strength", sets: 4, repsTarget: 10, restSeconds: 90, cnsLoad: 3, weightKgSuggested: 40, rationale: "Primary lat builder in Phase 1. Full ROM pulldown from dead hang overhead to upper chest teaches the exact lat activation pattern needed for pull-ups.", formCues: "Pull elbows to ribs, not bar to chin. Lean back 10°. Full stretch at top. Control the negative 2s.", contraindication: null, youtubeQuery: "lat+pulldown+proper+form" },
    { name: "Dumbbell Single-Arm Row", muscle: "Lats / Mid-traps / Rhomboids", type: "strength", sets: 3, repsTarget: 12, restSeconds: 75, cnsLoad: 3, weightKgSuggested: 22, rationale: "Unilateral rowing builds the lat and mid-trap strength that supports scapular stability under pull-up load.", formCues: "Row elbow to hip, not shoulder. Neutral spine. Don't rotate torso. Squeeze at top for 1s.", contraindication: null, youtubeQuery: "single+arm+dumbbell+row+form" },
    { name: "Dead Hang", muscle: "Grip / Lat / Shoulder girdle", type: "strength", sets: 3, repsTarget: 30, restSeconds: 90, cnsLoad: 2, weightKgSuggested: 0, rationale: "Builds grip endurance and decompresses the shoulder joint while training the full lat stretch position.", formCues: "Full arm extension. Active shoulder depression. Breathe steadily. Engage core.", contraindication: null, youtubeQuery: "dead+hang+pull+up+bar" },
    { name: "Scapular Pull-ups", muscle: "Lower trapezius / Serratus anterior", type: "strength", sets: 3, repsTarget: 10, restSeconds: 60, cnsLoad: 2, weightKgSuggested: 0, rationale: "Isolates the scapular depression movement — the very first part of a pull-up. Without this motor pattern, the lats never engage properly.", formCues: "Start in dead hang. No elbow bend. Just pull shoulder blades DOWN and BACK. 2s up, 2s down.", contraindication: null, youtubeQuery: "scapular+pull+ups+tutorial" },
    { name: "Bicep Curl", muscle: "Biceps brachii", type: "strength", sets: 3, repsTarget: 12, restSeconds: 60, cnsLoad: 2, weightKgSuggested: 14, rationale: "Accessory work for the elbow flexors, which contribute ~30% of pull-up force.", formCues: "Full extension at bottom. No swinging. Supinated grip throughout. Slow 3s negative.", contraindication: null, youtubeQuery: "dumbbell+bicep+curl+form" },
    { name: "Cat-Cow Spinal Mobilisation", muscle: "Thoracic spine / Lats", type: "stretch", sets: 1, repsTarget: 45, restSeconds: 0, cnsLoad: 0, weightKgSuggested: 0, rationale: "Decompresses the thoracic spine and restores lat length after pulling session.", formCues: "Full exhale on cat, full inhale on cow. Lead with tailbone. Slow and deliberate.", contraindication: null, youtubeQuery: "cat+cow+stretch+spine" },
    { name: "Doorway Lat Stretch", muscle: "Latissimus dorsi", type: "stretch", sets: 1, repsTarget: 45, restSeconds: 0, cnsLoad: 0, weightKgSuggested: 0, rationale: "Restores full lat length after loading. Shortened lats limit pull-up ROM.", formCues: "Grip doorframe at shoulder height. Sit back into hips. Feel the stretch through the ribcage to armpit.", contraindication: null, youtubeQuery: "lat+doorway+stretch" }
  ]
};

const MOCK_COMMENTARY = {
  commentary: "Strong session 1. You've activated the two most commonly underdeveloped muscles for pull-up performance — your lower traps and serratus anterior — which most programs skip entirely. The lat pulldown sets established your baseline pulling strength and lat connection. Critically, your dead hang time will now serve as your weekly progress marker: every 5 seconds of hang improvement translates directly to additional pull-up endurance. The scapular pull-ups may have felt unusual — that's expected on day one; the motor pattern becomes automatic by week 2. Today's volume loaded approximately 85% of your lat fibres through the lengthened range, which triggers the greatest hypertrophic stimulus. Next session we'll increase lat pulldown load by 2.5kg. Consistency from here is everything.",
  aiResponse: "Keep tracking your dead hang time each session — it's your most reliable pull-up readiness indicator. Next session aim for 35s hangs."
};

async function storeGet(key) {
  try { const r = await window.storage.get(key); return r ? JSON.parse(r.value) : null; } catch { return null; }
}
async function storeSet(key, val) {
  try { await window.storage.set(key, JSON.stringify(val)); } catch {}
}

function estimateTDEE(age, h, w) {
  if (!age || !h || !w) return null;
  return Math.round((88.4 + 13.4 * w + 4.8 * h - 5.68 * age) * 1.55);
}
function estimateSessionCals(w, durationMin, hasCardio) {
  if (!w || !durationMin) return null;
  return Math.round(w * (hasCardio ? 9 : 7) * (durationMin / 60));
}
function getWarmupCount(d) { return d <= 30 ? 1 : d <= 45 ? 2 : 3; }
function getStretchCount(d) { return d <= 30 ? 0 : d <= 45 ? 2 : 3; }

async function callClaude(systemPrompt, userPrompt, maxTokens = 1200) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-api-key": "", "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
    body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: maxTokens, system: systemPrompt, messages: [{ role: "user", content: userPrompt }] }),
  });
  const data = await res.json();
  if (data.error) throw new Error(`API error: ${data.error.type} — ${data.error.message}`);
  return data.content?.filter(b => b.type === "text").map(b => b.text).join("") || "";
}

function parseJSON(text) {
  if (!text) return null;
  try { return JSON.parse(text.replace(/```json\s*|```\s*/g, "").trim()); } catch {}
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) try { return JSON.parse(objMatch[0]); } catch {}
  const arrMatch = text.match(/\[[\s\S]*\]/);
  if (arrMatch) try { return JSON.parse(arrMatch[0]); } catch {}
  const candidate = objMatch?.[0] || arrMatch?.[0];
  if (candidate) try { return JSON.parse(candidate.replace(/,\s*([}\]])/g, "$1").replace(/'/g, '"')); } catch {}
  try {
    const start = text.search(/[\[{]/), end = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
    if (start !== -1 && end > start) return JSON.parse(text.slice(start, end + 1));
  } catch {}
  return null;
}

const SC = ({ children, className = "" }) => <div className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 ${className}`}>{children}</div>;
const ST = ({ children }) => <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3">{children}</p>;
const TabBtn = ({ id, icon: Icon, label, active, onClick, badge }) => (
  <button onClick={() => onClick(id)} className={`relative flex flex-col items-center justify-center flex-1 py-1.5 transition-all text-[8px] font-black uppercase tracking-widest border-t-2 ${active ? "text-indigo-600 border-indigo-600" : "text-slate-400 border-transparent"}`}>
    <Icon size={16} /><span className="mt-0.5">{label}</span>
    {badge > 0 && <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-rose-500 text-white rounded-full text-[7px] font-black flex items-center justify-center">{badge}</span>}
  </button>
);

function RestTimer({ seconds }) {
  const [remaining, setRemaining] = useState(seconds);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (running && remaining > 0) { ref.current = setInterval(() => setRemaining(r => r - 1), 1000); }
    else { clearInterval(ref.current); if (remaining === 0) setRunning(false); }
    return () => clearInterval(ref.current);
  }, [running, remaining]);
  const pct = ((seconds - remaining) / seconds) * 100;
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3 border border-slate-100">
      <div className="relative w-12 h-12 shrink-0">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 44 44">
          <circle cx="22" cy="22" r="18" stroke="#e2e8f0" strokeWidth="4" fill="transparent" />
          <circle cx="22" cy="22" r="18" stroke={remaining === 0 ? "#10b981" : "#6366f1"} strokeWidth="4" fill="transparent" strokeDasharray={113} strokeDashoffset={113 - 113 * pct / 100} strokeLinecap="round" className="transition-all duration-1000" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-slate-700">{remaining === 0 ? "✓" : `${remaining}s`}</span>
      </div>
      <div className="flex-1">
        <p className="text-[9px] font-black text-slate-500 uppercase mb-1.5">Rest — {seconds}s recommended</p>
        <div className="flex gap-2">
          {!running && remaining > 0 && <button onClick={() => setRunning(true)} className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[11px] font-black">Start</button>}
          {running && <button onClick={() => setRunning(false)} className="px-3 py-1 bg-slate-200 text-slate-600 rounded-lg text-[11px] font-black">Pause</button>}
          <button onClick={() => { setRemaining(seconds); setRunning(false); }} className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[11px] font-black flex items-center gap-1"><RotateCcw size={9} />Reset</button>
        </div>
      </div>
    </div>
  );
}

function Spinner({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-indigo-100 rounded-full" />
        <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <Zap size={20} className="absolute inset-0 m-auto text-indigo-600" />
      </div>
      <p className="text-sm font-bold text-slate-600 text-center px-8 leading-relaxed">{message}</p>
    </div>
  );
}

const typeStyle = t => ({ warmup: { border: "border-l-amber-400", tag: "bg-amber-50 border-amber-200 text-amber-700" }, cardio: { border: "border-l-rose-500", tag: "bg-rose-50 border-rose-200 text-rose-700" }, stretch: { border: "border-l-teal-400", tag: "bg-teal-50 border-teal-200 text-teal-700" }, strength: { border: "border-l-indigo-500", tag: "bg-indigo-50 border-indigo-200 text-indigo-700" } }[t] || { border: "border-l-slate-300", tag: "bg-slate-50 border-slate-200 text-slate-600" });
const typeLabel = t => ({ warmup: "🔥 Warm-up", cardio: "💨 Cardio", stretch: "🧘 Stretch", strength: "💪 Strength" }[t] || t);

const DAYS = ["Day 1","Day 2","Day 3","Day 4","Day 5","Day 6","Day 7"];
const WATCHOUTS_PRESETS = ["Lower back pain","Impinged shoulder","Rotator cuff","Knee pain","Elbow pain","Wrist pain","Herniated disc","Hip pain","Ankle instability","High blood pressure"];
const DURATION_OPTIONS = [20,30,45,60,75,90];

export default function PersonalTrainerApp() {
  const [objectives, setObjectives] = useState(["", "", ""]);
  const [equipment, setEquipment] = useState(new Set());
  const [customEquipment, setCustomEquipment] = useState("");
  const [gymPhotoName, setGymPhotoName] = useState(null);
  const [watchOuts, setWatchOuts] = useState(new Set());
  const [customWatchOut, setCustomWatchOut] = useState("");
  const [age, setAge] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [weightKg, setWeightKg] = useState("");
  const [sessionsConfig, setSessionsConfig] = useState(DAYS.map(d => ({ day: d, duration: 45, include: false })));
  const [sessionComponents, setSessionComponents] = useState({ warmup: true, cardio: false, stretch: true });
  const [strategy, setStrategy] = useState(null);
  const [todayProgram, setTodayProgram] = useState(null);
  const [assessments, setAssessments] = useState(null);
  const [sessionCommentary, setSessionCommentary] = useState(null);
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [loadingProgram, setLoadingProgram] = useState(false);
  const [loadingCommentary, setLoadingCommentary] = useState(false);
  const [currentExIdx, setCurrentExIdx] = useState(0);
  const [allLogs, setAllLogs] = useState({});
  const [pendingReps, setPendingReps] = useState(10);
  const [pendingWeight, setPendingWeight] = useState(null);
  const [showTimer, setShowTimer] = useState(false);
  const [feedbackTab, setFeedbackTab] = useState(false);
  const [exFeedbacks, setExFeedbacks] = useState({});
  const [sessionHistory, setSessionHistory] = useState([]);
  const [diagResults, setDiagResults] = useState({});
  const [coachNote, setCoachNote] = useState("");
  const [storageReady, setStorageReady] = useState(false);
  const [activeTab, setActiveTab] = useState("setup");
  const [mockMode, setMockMode] = useState(true);
  const [apiError, setApiError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    (async () => {
      const profile = await storeGet("vitality:profile");
      if (profile) {
        if (profile.objectives) setObjectives(profile.objectives);
        if (profile.equipment) setEquipment(new Set(profile.equipment));
        if (profile.watchOuts) setWatchOuts(new Set(profile.watchOuts));
        if (profile.age) setAge(profile.age);
        if (profile.heightCm) setHeightCm(profile.heightCm);
        if (profile.weightKg) setWeightKg(profile.weightKg);
        if (profile.sessionsConfig) setSessionsConfig(profile.sessionsConfig);
        if (profile.sessionComponents) setSessionComponents(profile.sessionComponents);
      }
      const hist = await storeGet("vitality:history"); if (hist) setSessionHistory(hist);
      const diag = await storeGet("vitality:diagnostics"); if (diag) setDiagResults(diag);
      const strat = await storeGet("vitality:strategy"); if (strat) setStrategy(strat);
      const assess = await storeGet("vitality:assessments"); if (assess) setAssessments(assess);
      setStorageReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!storageReady) return;
    storeSet("vitality:profile", { objectives, equipment: [...equipment], watchOuts: [...watchOuts], age, heightCm, weightKg, sessionsConfig, sessionComponents });
  }, [objectives, equipment, watchOuts, age, heightCm, weightKg, sessionsConfig, sessionComponents, storageReady]);

  useEffect(() => { if (!storageReady) return; storeSet("vitality:diagnostics", diagResults); }, [diagResults, storageReady]);

  const activeObjectives = objectives.filter(o => o.trim() !== "");
  const activeSessions = sessionsConfig.filter(s => s.include);
  const sessionDuration = activeSessions[0]?.duration || 45;
  const hasCardio = todayProgram?.exercises?.some(e => e.type === "cardio") ?? sessionComponents.cardio;
  const estCals = estimateSessionCals(+weightKg, sessionDuration, hasCardio);
  const tdee = estimateTDEE(+age, +heightCm, +weightKg);
  const currentEx = todayProgram?.exercises?.[currentExIdx] ?? null;
  const pastLogs = currentEx ? (allLogs[currentEx.name] || []) : [];
  const lastLog = pastLogs[pastLogs.length - 1];
  const recommendedWeight = lastLog ? (lastLog.reps >= (currentEx?.repsTarget || 10) ? +(lastLog.weight + 2.5).toFixed(1) : lastLog.weight) : null;

  const historyWeight = useMemo(() => {
    if (!currentEx) return null;
    for (let i = sessionHistory.length - 1; i >= 0; i--) {
      const h = sessionHistory[i];
      if (h.logs?.[currentEx.name]) { const sets = h.logs[currentEx.name]; return sets[sets.length - 1]?.weight || null; }
    }
    return null;
  }, [sessionHistory, currentEx]);

  const displayWeight = pendingWeight !== null ? pendingWeight : recommendedWeight !== null ? recommendedWeight : historyWeight !== null ? +(historyWeight + 2.5).toFixed(1) : currentEx?.weightKgSuggested || 10;
  const totalSets = Object.values(allLogs).flat().length;
  const totalVolume = Object.values(allLogs).flat().reduce((a, l) => a + (l.reps || 0) * (l.weight || 0), 0);

  const buildContext = useCallback(() => ({
    objectives: activeObjectives, equipment: [...equipment], watchOuts: [...watchOuts],
    age: +age || null, heightCm: +heightCm || null, weightKg: +weightKg || null,
    sessionsPerWeek: activeSessions.length, sessionDuration, sessionComponents,
    warmupCount: getWarmupCount(sessionDuration), stretchCount: getStretchCount(sessionDuration),
    diagnosticResults: diagResults,
    recentHistory: sessionHistory.slice(-5).map(h => ({ date: h.date, objectives: h.objectives, totalSets: Object.values(h.logs || {}).flat().length, exercises: Object.entries(h.logs || {}).map(([name, sets]) => ({ name, sets: sets.length, maxWeight: Math.max(...sets.map(s => s.weight || 0)) })), problems: h.feedbacks || [], notes: h.notes || "" })),
    sessionNumber: sessionHistory.length + 1,
  }), [activeObjectives, equipment, watchOuts, age, heightCm, weightKg, activeSessions, sessionDuration, sessionComponents, diagResults, sessionHistory]);

  const generateStrategy = useCallback(async () => {
    setLoadingStrategy(true);
    if (mockMode) {
      await mockDelay(1400);
      setStrategy(MOCK_STRATEGY);
      await storeSet("vitality:strategy", MOCK_STRATEGY);
      setAssessments(MOCK_ASSESSMENTS);
      await storeSet("vitality:assessments", MOCK_ASSESSMENTS);
      setLoadingStrategy(false); setActiveTab("strategy"); return;
    }
    const ctx = buildContext();
    const system = `You are an elite personal trainer AI. Respond ONLY with valid JSON, no markdown, no extra text.`;
    const raw = await callClaude(system, `Design a complete training strategy. Return JSON: {"overview":"...","phases":[{"phase":"...","weeks":"...","focus":"...","rationale":"...","keyExercises":["..."]}],"weeklyLogic":"...","progressionModel":"...","watchOutAdaptations":"..."}\nAthlete: ${JSON.stringify(ctx)}`, 1500);
    const parsed = parseJSON(raw);
    if (parsed) { setStrategy(parsed); await storeSet("vitality:strategy", parsed); }
    const aRaw = await callClaude(system, `Generate baseline assessment tests. Return JSON array: [{"name":"...","desc":"...","metric":"reps|kg|seconds","muscle":"...","forObj":"..."}]\nObjectives: ${JSON.stringify(activeObjectives)}\nWatch-outs: ${JSON.stringify([...watchOuts])}`, 1000);
    const aParsed = parseJSON(aRaw);
    if (Array.isArray(aParsed)) { setAssessments(aParsed); await storeSet("vitality:assessments", aParsed); }
    else if (aParsed?.tests) { setAssessments(aParsed.tests); await storeSet("vitality:assessments", aParsed.tests); }
    setLoadingStrategy(false); setActiveTab("strategy");
  }, [buildContext, activeObjectives, watchOuts, mockMode]);

  const generateProgram = useCallback(async () => {
    setLoadingProgram(true); setTodayProgram(null); setCurrentExIdx(0); setAllLogs({}); setPendingWeight(null); setShowTimer(false); setFeedbackTab(false); setExFeedbacks({}); setSessionCommentary(null);
    if (mockMode) { await mockDelay(1600); setTodayProgram(MOCK_PROGRAM); setLoadingProgram(false); setActiveTab("program"); return; }
    const ctx = buildContext();
    const warmN = getWarmupCount(sessionDuration), stretchN = getStretchCount(sessionDuration);
    const strengthN = sessionDuration <= 30 ? 4 : sessionDuration <= 45 ? 6 : sessionDuration <= 60 ? 8 : 10;
    const cardioN = sessionComponents.cardio ? 2 : 0;
    const system = `You are an elite personal trainer AI. Respond ONLY with valid JSON, no markdown, no extra text.`;
    const prompt = `Design today's session #${ctx.sessionNumber}. Warmup: ${warmN}, Strength: ${strengthN}, Cardio: ${cardioN}, Stretch: ${stretchN}. Return JSON: {"sessionTitle":"...","sessionFocus":"...","exercises":[{"name":"...","muscle":"...","type":"warmup|strength|cardio|stretch","sets":3,"repsTarget":10,"restSeconds":90,"cnsLoad":3,"weightKgSuggested":15,"rationale":"...","formCues":"...","contraindication":null,"youtubeQuery":"..."}],"coachIntro":"..."}\nAthlete: ${JSON.stringify(ctx)}`;
    let raw = "";
    try { raw = await callClaude(system, prompt, 2500); } catch (err) { setApiError(err.message); setLoadingProgram(false); return; }
    const parsed = parseJSON(raw);
    let program = null;
    if (parsed) {
      if (Array.isArray(parsed)) program = { sessionTitle: "Today's Session", sessionFocus: "", exercises: parsed, coachIntro: "" };
      else if (Array.isArray(parsed.exercises)) program = parsed;
      else if (parsed.session && Array.isArray(parsed.session.exercises)) program = parsed.session;
    }
    if (program) { setApiError(null); setTodayProgram(program); setLoadingProgram(false); setActiveTab("program"); }
    else { setApiError(`Parse failed. Raw (first 400 chars): ${raw.slice(0, 400)}`); setLoadingProgram(false); }
  }, [buildContext, sessionDuration, sessionComponents, mockMode]);

  const generateCommentary = useCallback(async () => {
    setLoadingCommentary(true);
    if (mockMode) {
      await mockDelay(1200); setSessionCommentary(MOCK_COMMENTARY); setLoadingCommentary(false);
      const entry = { date: new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }), objectives: activeObjectives, logs: allLogs, feedbacks: Object.entries(exFeedbacks).map(([ex, fb]) => `${ex}: ${fb}`), notes: coachNote, commentary: MOCK_COMMENTARY.commentary, totalVolume: Math.round(totalVolume), totalSets, estCals };
      const nh = [...sessionHistory, entry]; setSessionHistory(nh); await storeSet("vitality:history", nh); return;
    }
    const pbs = [];
    for (const [name, sets] of Object.entries(allLogs)) {
      const maxW = Math.max(...sets.map(s => s.weight || 0));
      for (const h of sessionHistory) { if (h.logs?.[name]) { const prevMax = Math.max(...h.logs[name].map(s => s.weight || 0)); if (maxW > prevMax) pbs.push({ exercise: name, prev: prevMax, now: maxW }); } }
    }
    const system = `You are an elite personal trainer AI. Respond ONLY with valid JSON, no markdown.`;
    const raw = await callClaude(system, `Write session debrief. Return JSON: {"commentary":"120-180 words...","aiResponse":"30-40 words..."}\nData: objectives=${JSON.stringify(activeObjectives)}, logs=${JSON.stringify(Object.entries(allLogs).map(([n,s])=>({name:n,sets:s.length,maxW:Math.max(...s.map(x=>x.weight||0))})))}, pbs=${JSON.stringify(pbs)}, notes="${coachNote}", kcal=${estCals}, volume=${Math.round(totalVolume)}, session#${sessionHistory.length+1}`, 800);
    const parsed = parseJSON(raw);
    setSessionCommentary(parsed || { commentary: "Session logged. Keep the consistency going.", aiResponse: "" });
    setLoadingCommentary(false);
    const entry = { date: new Date().toLocaleDateString("en-GB", { day:"2-digit", month:"short", year:"numeric" }), objectives: activeObjectives, logs: allLogs, feedbacks: Object.entries(exFeedbacks).map(([ex, fb]) => `${ex}: ${fb}`), notes: coachNote, commentary: parsed?.commentary || "", totalVolume: Math.round(totalVolume), totalSets, estCals };
    const nh = [...sessionHistory, entry]; setSessionHistory(nh); await storeSet("vitality:history", nh);
  }, [buildContext, allLogs, activeObjectives, coachNote, estCals, totalVolume, totalSets, sessionHistory, exFeedbacks, mockMode]);

  const setObjAt = (i, v) => setObjectives(p => { const n = [...p]; n[i] = v; return n; });
  const toggleEquip = e => setEquipment(p => { const n = new Set(p); n.has(e) ? n.delete(e) : n.add(e); return n; });
  const addCustomEquip = () => { if (customEquipment.trim()) { setEquipment(p => new Set([...p, customEquipment.trim()])); setCustomEquipment(""); } };
  const toggleWO = w => setWatchOuts(p => { const n = new Set(p); n.has(w) ? n.delete(w) : n.add(w); return n; });
  const addCustomWO = () => { if (customWatchOut.trim()) { setWatchOuts(p => new Set([...p, customWatchOut.trim()])); setCustomWatchOut(""); } };
  const toggleDay = i => setSessionsConfig(p => { const off = p[i].include; return p.map((s, idx) => idx === i ? { ...s, include: !s.include } : (off && idx > i ? { ...s, include: false } : s)); });
  const setDayDur = (i, d) => setSessionsConfig(p => p.map((s, idx) => idx === i ? { ...s, duration: d } : s));
  const logSet = () => { if (!currentEx) return; setAllLogs(p => ({ ...p, [currentEx.name]: [...(p[currentEx.name] || []), { reps: pendingReps, weight: displayWeight, ts: Date.now() }] })); setPendingWeight(null); setShowTimer(true); };
  const nextEx = () => { if (!todayProgram) return; currentExIdx < todayProgram.exercises.length - 1 ? (setCurrentExIdx(i => i + 1), setPendingWeight(null), setShowTimer(false), setFeedbackTab(false)) : setActiveTab("summary"); };
  const prevEx = () => { if (currentExIdx > 0) { setCurrentExIdx(i => i - 1); setPendingWeight(null); setShowTimer(false); setFeedbackTab(false); } };

  const TABS = [
    { id: "setup", icon: Settings, label: "Setup" }, { id: "strategy", icon: TrendingUp, label: "Plan" },
    { id: "assess", icon: FlaskConical, label: "Assess" }, { id: "program", icon: LayoutList, label: "Today" },
    { id: "workout", icon: Dumbbell, label: "Train" }, { id: "summary", icon: BarChart2, label: "Log", badge: sessionHistory.length },
  ];

  return (
    <div className="flex flex-col max-w-sm mx-auto bg-slate-50 text-slate-900 shadow-2xl overflow-hidden" style={{ height: "720px", fontFamily: "Georgia,serif" }}>
      <header className="bg-slate-900 text-white px-4 py-3 flex justify-between items-center shrink-0">
        <div>
          <p className="text-[7px] tracking-[0.3em] text-slate-500 uppercase">AI Personal Trainer</p>
          <h1 className="text-base font-black tracking-tight leading-none">VITALITY</h1>
        </div>
        <div className="flex items-center gap-2">
          {sessionHistory.length > 0 && <span className="text-[7px] bg-indigo-600 text-white px-2 py-0.5 rounded-full font-black">Session {sessionHistory.length + 1}</span>}
          {watchOuts.size > 0 && <span className="text-[7px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black">⚠ {watchOuts.size}</span>}
          <button onClick={() => setMockMode(m => !m)} className={`flex items-center gap-1 px-2 py-1 rounded-full text-[8px] font-black transition-all border ${mockMode ? "bg-amber-400 text-amber-900 border-amber-300" : "bg-emerald-500 text-white border-emerald-400"}`}>
            <span className={`w-2 h-2 rounded-full ${mockMode ? "bg-amber-700" : "bg-white"}`} />
            {mockMode ? "DEMO" : "LIVE"}
          </button>
        </div>
      </header>
      <div className={`text-center text-[8px] font-black px-3 py-0.5 tracking-widest shrink-0 ${mockMode ? "bg-amber-400 text-amber-900" : "bg-emerald-500 text-white"}`}>
        {mockMode ? "⚡ DEMO MODE — tap DEMO to switch to LIVE AI" : "🟢 LIVE — using Anthropic API"}
      </div>

      <main className="flex-1 overflow-y-auto">
        {activeTab === "setup" && (
          <div className="p-4 space-y-5">
            <section>
              <ST>Your 3 Objectives — be specific</ST>
              <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">Specific goals = specific programs. The AI uses these to design every exercise, phase, and progression.</p>
              <form autoComplete="off" onSubmit={e => e.preventDefault()} className="space-y-2">
                {[0,1,2].map(i => (
                  <div key={i} className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">{i+1}</span>
                    <input type="search" name={`obj-${i}`} autoComplete="off" value={objectives[i]} onChange={e => setObjAt(i, e.target.value)}
                      placeholder={["e.g. Do 10 unbroken pull-ups","e.g. Lose 6kg in 12 weeks","e.g. Run 5k in 25 min (optional)"][i]}
                      className="w-full pl-7 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 placeholder:text-slate-300" />
                  </div>
                ))}
              </form>
            </section>

            <section>
              <ST>Physical Stats</ST>
              <SC className="p-3">
                <div className="grid grid-cols-3 gap-2">
                  {[{l:"Age (yrs)",v:age,s:setAge,p:"32"},{l:"Height cm",v:heightCm,s:setHeightCm,p:"178"},{l:"Weight kg",v:weightKg,s:setWeightKg,p:"80"}].map(f => (
                    <div key={f.l}>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">{f.l}</p>
                      <input type="number" value={f.v} onChange={e => f.s(e.target.value)} placeholder={f.p} className="w-full px-2 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400 text-center" />
                    </div>
                  ))}
                </div>
                {tdee && <p className="text-[10px] text-indigo-600 mt-2 font-semibold">Estimated TDEE: ~{tdee.toLocaleString()} kcal/day</p>}
              </SC>
            </section>

            <section>
              <ST>Known Watch-outs & Injuries</ST>
              <p className="text-[10px] text-slate-400 mb-2">The AI will substitute conflicting exercises automatically.</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {WATCHOUTS_PRESETS.map(w => (
                  <button key={w} onClick={() => toggleWO(w)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${watchOuts.has(w) ? "bg-rose-600 text-white border-rose-600" : "bg-white text-slate-600 border-slate-200"}`}>
                    {watchOuts.has(w) ? "⚠ " : ""}{w}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" value={customWatchOut} onChange={e => setCustomWatchOut(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomWO()} placeholder="Add other watch-out..." className="flex-1 px-3 py-2 rounded-xl border border-dashed border-rose-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-rose-300" />
                <button onClick={addCustomWO} className="bg-rose-500 text-white px-3 rounded-xl text-xs font-bold">Add</button>
              </div>
            </section>

            <section>
              <ST>Equipment Available</ST>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {["Dumbbells","Barbell","Bench","Pull-up Bar","Resistance Bands","Kettlebell","Cable Machine","Squat Rack","TRX","Jump Rope","Rowing Machine","No Equipment"].map(eq => (
                  <button key={eq} onClick={() => toggleEquip(eq)} className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all ${equipment.has(eq) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-600 border-slate-200"}`}>{eq}</button>
                ))}
              </div>
              <div className="flex gap-2 mt-1">
                <input type="text" value={customEquipment} onChange={e => setCustomEquipment(e.target.value)} onKeyDown={e => e.key === "Enter" && addCustomEquip()} placeholder="Add custom equipment..." className="flex-1 px-3 py-2 rounded-xl border border-dashed border-slate-300 bg-white text-xs focus:outline-none" />
                <button onClick={addCustomEquip} className="bg-indigo-600 text-white px-3 rounded-xl text-xs font-bold">Add</button>
              </div>
              <button onClick={() => fileInputRef.current?.click()} className="mt-2 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-slate-300 bg-white text-xs text-slate-500 hover:border-indigo-300 transition-colors">
                <Camera size={13} />{gymPhotoName ? `📸 ${gymPhotoName}` : "Upload gym photo"}
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => setGymPhotoName(e.target.files?.[0]?.name || null)} />
            </section>

            <section>
              <ST>Training Days — unlock sequentially</ST>
              <p className="text-[10px] text-slate-400 mb-2 leading-relaxed">Select Day 1 first, set its duration, then Day 2 unlocks — and so on up to Day 7.</p>
              <div className="space-y-2">
                {sessionsConfig.map((s, i) => {
                  const locked = i > 0 && !sessionsConfig[i - 1].include;
                  return (
                    <div key={s.day} className={`rounded-xl px-3 py-2 border transition-all ${locked ? "border-slate-100 bg-white opacity-30 pointer-events-none" : s.include ? "border-indigo-200 bg-indigo-50" : "border-slate-200 bg-white"}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleDay(i)} className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${s.include ? "border-indigo-600 bg-indigo-600" : "border-slate-300"}`}>
                            {s.include && <CheckCircle size={11} className="text-white" />}
                          </button>
                          <span className={`text-sm font-bold ${s.include ? "text-indigo-700" : "text-slate-500"}`}>{s.day}</span>
                          {locked && <span className="text-[8px] text-slate-300 font-bold uppercase tracking-wide">locked</span>}
                        </div>
                        {s.include && (
                          <select value={s.duration} onChange={e => setDayDur(i, +e.target.value)} className="text-xs font-bold bg-white border border-indigo-200 rounded-lg px-2 py-1 text-indigo-700 focus:outline-none">
                            {DURATION_OPTIONS.map(d => <option key={d} value={d}>{d} min</option>)}
                          </select>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <ST>Include in Every Session</ST>
              <div className="flex gap-2">
                {[{key:"warmup",label:"Warm-up",icon:Flame,on:"border-amber-400 bg-amber-50 text-amber-700",off:"border-slate-200 bg-white text-slate-400"},{key:"cardio",label:"Cardio",icon:Wind,on:"border-rose-400 bg-rose-50 text-rose-700",off:"border-slate-200 bg-white text-slate-400"},{key:"stretch",label:"Stretch",icon:Activity,on:"border-teal-400 bg-teal-50 text-teal-700",off:"border-slate-200 bg-white text-slate-400"}].map(({ key, label, icon: Icon, on, off }) => (
                  <button key={key} onClick={() => setSessionComponents(p => ({ ...p, [key]: !p[key] }))} className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${sessionComponents[key] ? on : off}`}>
                    <Icon size={14} />{label}
                  </button>
                ))}
              </div>
            </section>

            <button onClick={generateStrategy} disabled={loadingStrategy || activeObjectives.length === 0} className="w-full py-3.5 rounded-2xl text-white font-black text-sm bg-indigo-600 shadow-lg active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {loadingStrategy ? <><Loader size={16} className="animate-spin" />Generating Strategy...</> : "GENERATE MY PROGRAM →"}
            </button>
            {activeObjectives.length === 0 && <p className="text-center text-[10px] text-slate-400">Add at least one objective above</p>}
          </div>
        )}

        {activeTab === "strategy" && (
          <div className="p-4 space-y-4">
            {loadingStrategy ? <Spinner message="Building your personalised strategy..." /> : !strategy ? (
              <div className="text-center py-16 text-slate-400"><TrendingUp size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Generate your strategy in Setup.</p><button onClick={() => setActiveTab("setup")} className="mt-4 text-indigo-600 font-bold text-sm">→ Setup</button></div>
            ) : (<>
              <div className="bg-indigo-900 text-white p-5 rounded-3xl">
                <p className="text-[7px] tracking-widest text-indigo-400 uppercase mb-2">AI-Generated Strategy</p>
                <div className="flex flex-wrap gap-1.5 mb-3">{activeObjectives.map((o, i) => <span key={i} className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${i === 0 ? "bg-indigo-400 text-white" : "bg-indigo-800 text-indigo-200"}`}>{i === 0 ? "★ " : ""}{o}</span>)}</div>
                <p className="text-indigo-100 text-[11px] leading-relaxed">{strategy.overview}</p>
              </div>
              <div className="space-y-3">
                {strategy.phases?.map((ph, i) => (
                  <SC key={i}><div className="flex items-start gap-3"><div className="w-8 h-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black text-sm shrink-0">{i+1}</div><div className="flex-1"><p className="font-black text-slate-800 text-sm">{ph.phase}</p><p className="text-[9px] text-indigo-500 font-bold mb-1">{ph.weeks} · {ph.focus}</p><p className="text-[10px] text-slate-600 leading-relaxed mb-2">{ph.rationale}</p><div className="flex flex-wrap gap-1">{ph.keyExercises?.map((ex, j) => <span key={j} className="text-[9px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100 font-semibold">{ex}</span>)}</div></div></div></SC>
                ))}
              </div>
              <SC><ST>Weekly Structure</ST><p className="text-[11px] text-slate-600 leading-relaxed">{strategy.weeklyLogic}</p></SC>
              <SC><ST>Progression Model</ST><p className="text-[11px] text-slate-600 leading-relaxed">{strategy.progressionModel}</p></SC>
              {strategy.watchOutAdaptations && strategy.watchOutAdaptations !== "None flagged" && <SC><ST>Watch-out Adaptations</ST><div className="flex items-start gap-2"><AlertTriangle size={14} className="text-rose-500 shrink-0 mt-0.5" /><p className="text-[11px] text-slate-600 leading-relaxed">{strategy.watchOutAdaptations}</p></div></SC>}
              <button onClick={() => setActiveTab("assess")} className="w-full py-3 rounded-2xl text-white font-black text-sm bg-emerald-500 active:scale-95 transition-transform">TAKE BASELINE ASSESSMENT →</button>
            </>)}
          </div>
        )}

        {activeTab === "assess" && (
          <div className="p-4 space-y-4">
            <div className="bg-slate-900 text-white p-4 rounded-2xl">
              <p className="text-[7px] tracking-widest text-slate-500 uppercase mb-1">Baseline Assessment</p>
              <h2 className="font-black text-base">Establish Your Starting Point</h2>
              <p className="text-slate-300 text-[10px] mt-1 leading-relaxed">AI-generated tests specific to your objectives. Results calibrate all weight recommendations.</p>
            </div>
            {!assessments ? (
              <div className="text-center py-8 text-slate-400"><Info size={28} className="mx-auto mb-2 opacity-30" /><p className="text-sm">Generate your strategy first.</p><button onClick={() => setActiveTab("setup")} className="mt-3 text-indigo-600 font-bold text-sm">→ Setup</button></div>
            ) : assessments.map((test, i) => (
              <SC key={i}>
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 pr-2">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5"><p className="font-black text-sm text-slate-800">{test.name}</p>{test.forObj && <span className="text-[8px] bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full font-bold">{test.forObj}</span>}</div>
                    <p className="text-[10px] text-slate-400 leading-relaxed">{test.desc}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">Muscle: <span className="font-semibold">{test.muscle}</span></p>
                  </div>
                  <span className="text-[9px] bg-indigo-100 text-indigo-600 font-bold px-2 py-0.5 rounded-full shrink-0">{test.metric}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" value={diagResults[test.name] ?? ""} onChange={e => setDiagResults(p => ({ ...p, [test.name]: e.target.value }))} placeholder={`Result in ${test.metric}`} className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                  {diagResults[test.name] && <CheckCircle size={18} className="text-emerald-500 shrink-0" />}
                </div>
              </SC>
            ))}
            {assessments && Object.keys(diagResults).length > 0 && <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3"><p className="font-black text-emerald-700 text-sm">✓ {Object.keys(diagResults).length}/{assessments.length} recorded</p><p className="text-emerald-600 text-[10px] mt-0.5">Retest every 4 weeks.</p></div>}
            <button onClick={generateProgram} disabled={loadingProgram} className="w-full py-3 rounded-2xl text-white font-black text-sm bg-indigo-600 active:scale-95 transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {loadingProgram ? <><Loader size={16} className="animate-spin" />Building Program...</> : "GENERATE TODAY'S SESSION →"}
            </button>
            {apiError && <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3"><p className="text-[9px] font-black text-rose-600 uppercase mb-1">⚠ Error</p><p className="text-[10px] text-rose-700 leading-relaxed break-all">{apiError}</p></div>}
          </div>
        )}

        {activeTab === "program" && (
          <div className="p-4 space-y-3">
            {apiError && <div className="bg-rose-50 border border-rose-300 rounded-2xl p-3"><p className="text-[9px] font-black text-rose-600 uppercase mb-1">⚠ API / Parse Error</p><p className="text-[10px] text-rose-700 leading-relaxed break-all">{apiError}</p><button onClick={() => setApiError(null)} className="mt-2 text-[10px] text-rose-500 font-bold underline">Dismiss</button></div>}
            {loadingProgram ? <Spinner message="Designing today's session..." /> : !todayProgram ? (
              <div className="text-center py-12 text-slate-400"><LayoutList size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">No program yet.</p><button onClick={generateProgram} className="mt-3 text-indigo-600 font-bold text-sm">→ Generate Session</button></div>
            ) : (<>
              <div className="bg-indigo-900 text-white p-4 rounded-2xl">
                <p className="text-[7px] tracking-widest text-indigo-400 uppercase mb-1">Session {sessionHistory.length + 1}</p>
                <h2 className="text-lg font-black leading-tight">{todayProgram.sessionTitle}</h2>
                <p className="text-indigo-200 text-[11px] mt-1 leading-relaxed">{todayProgram.sessionFocus}</p>
                {estCals && <p className="text-emerald-400 font-black text-sm mt-2">~{estCals} kcal · {sessionDuration} min</p>}
              </div>
              {todayProgram.coachIntro && <SC><p className="text-[11px] text-slate-600 italic leading-relaxed">"{todayProgram.coachIntro}"</p></SC>}
              <div className="space-y-2">
                {todayProgram.exercises.map((ex, idx) => {
                  const done = (allLogs[ex.name] || []).length > 0, isCurrent = idx === currentExIdx, ts = typeStyle(ex.type);
                  return (
                    <div key={idx} onClick={() => { setCurrentExIdx(idx); setFeedbackTab(false); setShowTimer(false); setActiveTab("workout"); }} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${isCurrent ? "border-indigo-400 bg-indigo-50 shadow-sm" : done ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-white"}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${done ? "bg-emerald-500 text-white" : isCurrent ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>{done ? "✓" : idx + 1}</div>
                      <div className="flex-1 min-w-0"><p className="font-bold text-sm text-slate-800 truncate">{ex.name}</p><p className="text-[10px] text-slate-400">{ex.muscle} · {ex.sets}×{ex.repsTarget} · {ex.restSeconds}s rest</p></div>
                      <div className="flex flex-col items-end gap-1"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${ts.tag}`}>{typeLabel(ex.type)}</span>{ex.weightKgSuggested > 0 && ex.type === "strength" && <span className="text-[8px] text-indigo-500 font-bold">{ex.weightKgSuggested}kg</span>}</div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2">
                <button onClick={generateProgram} disabled={loadingProgram} className="flex-1 py-2.5 rounded-xl border border-indigo-200 text-indigo-600 font-bold text-sm flex items-center justify-center gap-1"><RotateCcw size={13} /> Regenerate</button>
                <button onClick={() => { setCurrentExIdx(0); setFeedbackTab(false); setShowTimer(false); setActiveTab("workout"); }} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform">START → <ChevronRight size={14} /></button>
              </div>
            </>)}
          </div>
        )}

        {activeTab === "workout" && (
          <div className="p-4 space-y-3">
            {!todayProgram ? (
              <div className="text-center py-16 text-slate-400"><Dumbbell size={36} className="mx-auto mb-3 opacity-30" /><p className="text-sm">Generate a session first.</p><button onClick={() => setActiveTab("assess")} className="mt-4 text-indigo-600 font-bold text-sm">→ Generate</button></div>
            ) : !currentEx ? (
              <div className="text-center py-16 text-slate-400"><CheckCircle size={36} className="mx-auto mb-3 text-emerald-400" /><p className="text-sm font-bold">All exercises complete!</p><button onClick={() => setActiveTab("summary")} className="mt-4 text-indigo-600 font-bold text-sm">→ View Summary</button></div>
            ) : (() => {
              const ts = typeStyle(currentEx.type), isTimedEx = currentEx.type === "cardio" || currentEx.type === "stretch";
              return (<>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${((currentExIdx + 1) / todayProgram.exercises.length) * 100}%` }} /></div>
                  <span className="text-[10px] text-slate-400 font-bold shrink-0">{currentExIdx + 1}/{todayProgram.exercises.length}</span>
                </div>
                <div className="flex gap-1.5">
                  <button onClick={() => setFeedbackTab(false)} className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all ${!feedbackTab ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"}`}>Exercise</button>
                  <button onClick={() => setFeedbackTab(true)} className={`flex items-center justify-center gap-1 flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all ${feedbackTab ? "bg-rose-500 text-white" : "bg-slate-100 text-slate-500"}`}><ThumbsDown size={11} /> Problem?</button>
                </div>
                {!feedbackTab ? (
                  <div className={`rounded-3xl p-4 shadow-md border-l-4 ${ts.border} bg-white`}>
                    <div className="flex justify-between items-center mb-1"><span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${ts.tag}`}>{typeLabel(currentEx.type)}</span><span className="text-[10px] text-slate-400">{currentEx.muscle}</span></div>
                    <h3 className="font-black text-lg mt-1 text-slate-800 leading-tight">{currentEx.name}</h3>
                    <p className="text-[11px] text-slate-500 mb-3">{currentEx.sets} sets · {currentEx.repsTarget} {isTimedEx ? "sec" : "reps"} · {currentEx.restSeconds}s rest</p>
                    <div className="aspect-video rounded-2xl mb-3 bg-gradient-to-br from-slate-100 to-indigo-100 flex flex-col items-center justify-center">
                      <Dumbbell size={32} className="text-indigo-200 mb-2" />
                      <a href={`https://www.youtube.com/results?search_query=${currentEx.youtubeQuery || currentEx.name.replace(/ /g,"+")}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-red-600 text-white px-3 py-1.5 rounded-full text-[10px] font-black"><Youtube size={11} /> Watch on YouTube</a>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3 mb-3"><p className="text-[9px] font-black text-slate-400 uppercase mb-1">Form Cues</p><p className="text-[10px] text-slate-600 leading-relaxed">{currentEx.formCues}</p></div>
                    <div className="bg-indigo-50 rounded-xl p-3 mb-3 border border-indigo-100"><p className="text-[9px] font-black text-indigo-500 uppercase mb-1">Why Today</p><p className="text-[10px] text-indigo-800 leading-relaxed">{currentEx.rationale}</p></div>
                    {historyWeight && <div className="bg-emerald-50 rounded-xl p-2.5 mb-3 border border-emerald-100 flex items-center gap-2"><History size={12} className="text-emerald-600 shrink-0" /><p className="text-[10px] text-emerald-700">Last logged: <strong>{historyWeight}kg</strong> — today's suggestion: <strong>{displayWeight}kg</strong></p></div>}
                    {currentEx.type === "strength" && (<>
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-slate-50 rounded-xl p-3"><p className="text-[9px] text-slate-400 uppercase font-black mb-1">Reps</p><div className="flex items-center gap-1"><button onClick={() => setPendingReps(r => Math.max(1, r - 1))} className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><Minus size={9} /></button><span className="font-black text-xl flex-1 text-center">{pendingReps}</span><button onClick={() => setPendingReps(r => r + 1)} className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><Plus size={9} /></button></div></div>
                        <div className="bg-slate-50 rounded-xl p-3"><p className="text-[9px] uppercase font-black mb-0.5 text-slate-400">kg {recommendedWeight && <span className="text-indigo-500 normal-case">→{recommendedWeight}rec</span>}</p><div className="flex items-center gap-1"><button onClick={() => setPendingWeight(w => +(Math.max(0,(w ?? displayWeight)-2.5).toFixed(1)))} className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><Minus size={9} /></button><span className="font-black text-xl flex-1 text-center">{displayWeight}</span><button onClick={() => setPendingWeight(w => +((w ?? displayWeight)+2.5).toFixed(1))} className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center"><Plus size={9} /></button></div></div>
                      </div>
                      {pastLogs.length > 0 && <div className="mb-2 space-y-1">{pastLogs.map((l, i) => <div key={i} className="flex justify-between text-[10px] text-slate-500 bg-slate-50 rounded-lg px-2 py-1"><span>Set {i+1}</span><span className="font-bold">{l.reps} reps × {l.weight} kg</span></div>)}</div>}
                      <button onClick={logSet} className="w-full py-2.5 rounded-xl text-white font-black text-sm bg-emerald-500 active:scale-95 transition-transform mb-2">LOG SET {pastLogs.length > 0 && `(${pastLogs.length} done)`}</button>
                    </>)}
                    {currentEx.restSeconds > 0 && (showTimer || isTimedEx) && <RestTimer key={`${currentEx.name}-${pastLogs.length}`} seconds={currentEx.restSeconds} />}
                  </div>
                ) : (
                  <div className="bg-rose-50 border border-rose-200 rounded-3xl p-4">
                    <div className="flex items-center gap-2 mb-3"><AlertTriangle size={16} className="text-rose-600" /><h3 className="font-black text-base text-rose-700">Exercise Feedback</h3></div>
                    <p className="text-[10px] text-rose-600 mb-3">Flag an issue with <strong>{currentEx.name}</strong>. Saved — AI will adapt next session.</p>
                    <div className="space-y-2">
                      {["Lower back pain","Shoulder discomfort","Knee pain","Wrist pain","Hip pain","Too heavy — reduce 15%","Skip for today — replace next session"].map(issue => (
                        <button key={issue} onClick={() => { setExFeedbacks(p => ({ ...p, [currentEx.name]: issue })); if (issue.includes("reduce")) { setPendingWeight(+(displayWeight * 0.85).toFixed(1)); } setFeedbackTab(false); }} className="w-full text-left px-3 py-2.5 bg-white border border-rose-200 rounded-xl text-sm font-semibold text-rose-700 hover:bg-rose-100 transition-colors">{issue}</button>
                      ))}
                    </div>
                    {exFeedbacks[currentEx.name] && <p className="text-[10px] text-rose-600 mt-3 font-semibold">✓ Logged: {exFeedbacks[currentEx.name]}</p>}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={prevEx} disabled={currentExIdx === 0} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-sm flex items-center justify-center gap-1 disabled:opacity-30"><ChevronLeft size={14} /> Prev</button>
                  <button onClick={nextEx} className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform">{currentExIdx === todayProgram.exercises.length - 1 ? "Finish ✓" : "Next"} <ChevronRight size={14} /></button>
                </div>
              </>);
            })()}
          </div>
        )}

        {activeTab === "summary" && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-3xl text-center">
              <CheckCircle size={30} className="mx-auto mb-2 text-emerald-400" />
              <h2 className="text-xl font-black">Session Log</h2>
              <p className="text-slate-300 text-xs mt-1">{totalSets > 0 ? `${totalSets} sets · ${Math.round(totalVolume).toLocaleString()} kg volume` : "No sets logged yet."}</p>
              {estCals && <p className="text-emerald-400 text-sm font-black mt-1">~{estCals} kcal burned</p>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[{label:"Sets",value:totalSets,icon:Activity},{label:"Volume",value:`${Math.round(totalVolume).toLocaleString()} kg`,icon:TrendingUp},{label:"Exercises",value:Object.keys(allLogs).length,icon:LayoutList},{label:"Sessions Total",value:sessionHistory.length+1,icon:Calendar}].map(({ label, value, icon: Icon }) => (
                <SC key={label} className="flex flex-col gap-1.5 p-3"><Icon size={14} className="text-indigo-400" /><p className="text-2xl font-black text-slate-800">{value}</p><p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">{label}</p></SC>
              ))}
            </div>
            {Object.keys(allLogs).length > 0 && <SC><ST>Today's Breakdown</ST><div className="space-y-3">{Object.entries(allLogs).map(([name, sets]) => (<div key={name}><div className="flex justify-between items-center mb-1"><span className="text-sm font-black text-slate-700 truncate">{name}</span><span className="text-[10px] text-slate-400 shrink-0 ml-1">{sets.length} sets</span></div><div className="flex gap-1.5 flex-wrap">{sets.map((s, i) => <span key={i} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-semibold border border-indigo-100">{s.reps}×{s.weight}kg</span>)}</div></div>))}</div></SC>}
            {sessionCommentary ? (
              <SC><ST>Coach Commentary</ST><p className="text-[11px] text-slate-700 leading-relaxed">{sessionCommentary.commentary}</p>{sessionCommentary.aiResponse && coachNote.length > 5 && <div className="mt-3 bg-indigo-50 border border-indigo-100 rounded-xl p-3"><p className="text-[9px] font-black text-indigo-600 uppercase mb-1">Response to Your Notes</p><p className="text-[10px] text-indigo-800 leading-relaxed">{sessionCommentary.aiResponse}</p></div>}</SC>
            ) : totalSets > 0 && (
              <button onClick={generateCommentary} disabled={loadingCommentary} className="w-full py-3 rounded-2xl text-white font-black text-sm bg-indigo-600 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
                {loadingCommentary ? <><Loader size={16} className="animate-spin" />Generating Commentary...</> : "GENERATE SESSION COMMENTARY →"}
              </button>
            )}
            <SC><ST>Session Notes</ST><textarea value={coachNote} onChange={e => setCoachNote(e.target.value)} placeholder="How did it feel? Pain, fatigue, breakthroughs?" rows={3} className="w-full text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-300 leading-relaxed placeholder:text-slate-300" /></SC>
            {sessionHistory.length > 0 && <SC><ST>Session History ({sessionHistory.length} sessions)</ST><div className="space-y-2">{sessionHistory.slice(-5).reverse().map((h, i) => (<div key={i} className="flex justify-between items-start text-sm border-b border-slate-50 pb-2 last:border-0 last:pb-0"><div><p className="font-bold text-slate-700 text-xs">{h.date}</p><p className="text-[10px] text-slate-400">{h.totalSets} sets · {h.totalVolume?.toLocaleString()} kg</p></div><span className="text-[9px] text-emerald-600 font-bold">{h.estCals ? `~${h.estCals} kcal` : ""}</span></div>))}</div></SC>}
            <button onClick={generateProgram} disabled={loadingProgram} className="w-full py-3 rounded-2xl text-white font-black text-sm bg-indigo-600 active:scale-95 transition-transform flex items-center justify-center gap-2 disabled:opacity-50">
              {loadingProgram ? <><Loader size={16} className="animate-spin" />Building Session...</> : "GENERATE NEXT SESSION →"}
            </button>
          </div>
        )}
      </main>

      <nav className="bg-white border-t border-slate-200 flex justify-around items-center px-1 py-1 shrink-0">
        {TABS.map(t => <TabBtn key={t.id} {...t} active={activeTab === t.id} onClick={setActiveTab} badge={t.badge} />)}
      </nav>
    </div>
  );
}
