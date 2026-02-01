'use client';

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  ShieldAlert,
  Zap,
  Layers,
  Cpu,
  Activity,
  TrendingUp,
  Clock,
  Target,
  Send,
} from "lucide-react";

/**
 * QTMBG — Signal OS (Revised v4)
 * Goal: coherent with Audit look/feel + stronger “hook loop” architecture.
 * - White notebook background (grid + ruled lines + red margin)
 * - True centered hero
 * - 12 questions (multi-question per force) with averaged scoring
 * - Ritual onboarding screen (sets depth + legitimacy)
 * - Progress indicator 1/12
 * - Clean, truthful CTAs (Validate in Audit + Export)
 * - Vercel-safe, strict TS, localStorage hydration
 */

// ------------------------ CONFIG ------------------------

type ForceId = "essence" | "identity" | "offer" | "system" | "growth";
type StageId = "launch" | "reposition" | "scale";
type Choice = 1 | 3 | 5;

const STORAGE_KEY = "qtmbg-signal-os-v4";

const FORCES: Array<{
  id: ForceId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  micro: string;
}> = [
  { id: "essence", label: "ESSENCE", icon: Zap, micro: "What you really stand for" },
  { id: "identity", label: "IDENTITY", icon: ShieldAlert, micro: "How you are perceived" },
  { id: "offer", label: "OFFER", icon: Layers, micro: "What people buy and why" },
  { id: "system", label: "SYSTEM", icon: Cpu, micro: "How leads become cash" },
  { id: "growth", label: "GROWTH", icon: Activity, micro: "How it scales without chaos" },
];

const STAGES: Array<{ id: StageId; label: string; sub: string }> = [
  { id: "launch", label: "Launching", sub: "Building first demand + first offers" },
  { id: "reposition", label: "Repositioning", sub: "Good product, unclear signal or audience" },
  { id: "scale", label: "Scaling", sub: "You need throughput, not more hustle" },
];

// BENCHMARKS (keep light: scan-level)
const BENCHMARKS: Record<ForceId, Record<StageId, { avg: number; top10: number }>> = {
  essence: {
    launch: { avg: 42, top10: 73 },
    reposition: { avg: 51, top10: 81 },
    scale: { avg: 67, top10: 87 },
  },
  identity: {
    launch: { avg: 38, top10: 70 },
    reposition: { avg: 48, top10: 78 },
    scale: { avg: 64, top10: 85 },
  },
  offer: {
    launch: { avg: 45, top10: 75 },
    reposition: { avg: 54, top10: 82 },
    scale: { avg: 70, top10: 88 },
  },
  system: {
    launch: { avg: 35, top10: 68 },
    reposition: { avg: 46, top10: 76 },
    scale: { avg: 62, top10: 84 },
  },
  growth: {
    launch: { avg: 40, top10: 72 },
    reposition: { avg: 50, top10: 80 },
    scale: { avg: 66, top10: 86 },
  },
};

type Question = {
  id: string;
  force: ForceId;
  text: string;
  a: { v: Choice; label: string };
  b: { v: Choice; label: string };
  c: { v: Choice; label: string };
};

// 12 questions: (3 ESSENCE, 2 IDENTITY, 2 OFFER, 3 SYSTEM, 2 GROWTH)
const QUESTIONS: Question[] = [
  // ESSENCE (3)
  {
    id: "E1",
    force: "essence",
    text: "If I land on your brand today… can I name the mechanism you bring (not just the category)?",
    a: { v: 1, label: "No — it reads like generic services." },
    b: { v: 3, label: "Somewhat — but it isn’t named or sharp." },
    c: { v: 5, label: "Yes — specific, named, and repeatable." },
  },
  {
    id: "E2",
    force: "essence",
    text: "Do you clearly repel the wrong buyer (so the right buyer feels seen)?",
    a: { v: 1, label: "No — I try to appeal to everyone." },
    b: { v: 3, label: "A bit — but boundaries are soft." },
    c: { v: 5, label: "Yes — strong stance + clear fit criteria." },
  },
  {
    id: "E3",
    force: "essence",
    text: "Can a client explain your value in one sentence without you present?",
    a: { v: 1, label: "No — they describe me differently each time." },
    b: { v: 3, label: "Sometimes — but it’s not consistent." },
    c: { v: 5, label: "Yes — they repeat the same line." },
  },

  // IDENTITY (2)
  {
    id: "I1",
    force: "identity",
    text: "Do you look and sound like a premium authority in your space?",
    a: { v: 1, label: "Not yet — template or inconsistent." },
    b: { v: 3, label: "Clean — but not memorable or high-status." },
    c: { v: 5, label: "Yes — instantly premium and distinct." },
  },
  {
    id: "I2",
    force: "identity",
    text: "Do you have a proof stack that makes your price feel obvious?",
    a: { v: 1, label: "No — mostly claims, little proof." },
    b: { v: 3, label: "Some proof — but it isn’t organized." },
    c: { v: 5, label: "Yes — proof is visible and structured." },
  },

  // OFFER (2)
  {
    id: "O1",
    force: "offer",
    text: "Is your flagship offer obvious and easy to choose?",
    a: { v: 1, label: "No — it’s custom, confusing, or too many options." },
    b: { v: 3, label: "Kind of — but people hesitate or negotiate." },
    c: { v: 5, label: "Yes — one clear flagship with clean pricing." },
  },
  {
    id: "O2",
    force: "offer",
    text: "Does your offer describe an 'after-state' (not a list of deliverables)?",
    a: { v: 1, label: "No — I sell tasks/time/features." },
    b: { v: 3, label: "Some — but it’s not vivid or specific." },
    c: { v: 5, label: "Yes — the transformation is concrete." },
  },

  // SYSTEM (3)
  {
    id: "S1",
    force: "system",
    text: "Is lead flow predictable and controlled (not luck-based)?",
    a: { v: 1, label: "No — feast/famine and chasing." },
    b: { v: 3, label: "Somewhat — referrals + occasional wins." },
    c: { v: 5, label: "Yes — repeatable pipeline + nurture." },
  },
  {
    id: "S2",
    force: "system",
    text: "Can a stranger buy or book the next step without DM’ing you?",
    a: { v: 1, label: "No — it requires back-and-forth." },
    b: { v: 3, label: "Sometimes — but it’s not frictionless." },
    c: { v: 5, label: "Yes — one obvious path to action." },
  },
  {
    id: "S3",
    force: "system",
    text: "Do you have follow-up automation (so leads don’t leak)?",
    a: { v: 1, label: "No — manual and inconsistent." },
    b: { v: 3, label: "Some — but gaps exist." },
    c: { v: 5, label: "Yes — systematic nurture + reminders." },
  },

  // GROWTH (2)
  {
    id: "G1",
    force: "growth",
    text: "Do you have a single metric and a weekly loop you actually run?",
    a: { v: 1, label: "No — I react to urgency and bank balance." },
    b: { v: 3, label: "Some — but consistency is weak." },
    c: { v: 5, label: "Yes — clear north star + weekly rhythm." },
  },
  {
    id: "G2",
    force: "growth",
    text: "If you doubled demand tomorrow… would delivery stay stable?",
    a: { v: 1, label: "No — it would break my life." },
    b: { v: 3, label: "Maybe — but it would get chaotic." },
    c: { v: 5, label: "Yes — it scales without chaos." },
  },
];

// MICRO-SYMPTOMS (kept)
const MICRO_SYMPTOMS: Record<ForceId, Record<StageId, string[]>> = {
  essence: {
    launch: [
      "Calls turn into 'so what exactly do you do?' interrogations",
      "You keep tweaking the homepage because it doesn't feel sharp",
      "You explain your value differently depending on who asks",
    ],
    reposition: [
      "Referrals describe you differently than you describe yourself",
      "Your best clients came from an angle you haven't fully owned",
      "Competitors with worse work charge more because their signal is clearer",
    ],
    scale: [
      "New hires struggle to articulate what makes you different",
      "Your team defaults to features instead of the core mechanism",
      "Expansion feels risky because the 'what we do' isn't transferable",
    ],
  },
  identity: {
    launch: [
      "You're hesitant to share your website with certain prospects",
      "Your visuals feel 'good enough' but not investment-grade",
      "People compliment your work but don't see you as premium yet",
    ],
    reposition: [
      "Your brand looks startup-y even though you're past that stage",
      "Prospects negotiate price because you don't look expensive",
      "You've outgrown your identity but haven't refreshed it",
    ],
    scale: [
      "Your brand doesn't match the size of deals you're closing",
      "Enterprise prospects hesitate because you don't look enterprise",
      "Partnerships fall through due to perceived brand mismatch",
    ],
  },
  offer: {
    launch: [
      "People like you but say 'let me think about it' and ghost",
      "You're doing custom proposals for every deal",
      "Pricing conversations become negotiations",
    ],
    reposition: [
      "Too many offers create decision paralysis",
      "Your best clients bought something you no longer want to sell",
      "Revenue is okay but you don't know what to double down on",
    ],
    scale: [
      "Your offer architecture is complex and hard to explain",
      "Upsells happen by accident, not design",
      "You're leaving money on the table because the path isn't obvious",
    ],
  },
  system: {
    launch: [
      "You're always busy but revenue isn't predictable",
      "Leads come from hustle and luck",
      "Follow-up slips because everything is manual chaos",
    ],
    reposition: [
      "You get attention but conversion is low",
      "Leads leak between awareness and purchase",
      "Your CRM is messy (or missing)",
    ],
    scale: [
      "The system lives in your head",
      "Lead quality is inconsistent",
      "Pipeline exists but close rate drops as you grow",
    ],
  },
  growth: {
    launch: [
      "You react to urgency instead of leading indicators",
      "Every month feels like starting from zero",
      "You chase tactics because there's no clear plan",
    ],
    reposition: [
      "Direction changes week to week",
      "Growth happens in spurts",
      "You track revenue but not the signals that predict it",
    ],
    scale: [
      "Scaling feels chaotic and exhausting",
      "Adding people/budget doesn't reliably increase output",
      "You can't identify the one bottleneck slowing everything down",
    ],
  },
};

// LEAK INTELLIGENCE (kept and tuned)
type LeakInfo = {
  leakName: string;
  humanSymptom: string;
  whatItMeans: string;
  todayMove: string;
  weekPlan: string[];
  ifYouDont: string;
  ifYouDo: string;
  auditReason: string;
};

const LEAKS: Record<ForceId, LeakInfo> = {
  essence: {
    leakName: "BLURRY MECHANISM",
    humanSymptom: 'People say: "Interesting… but what exactly do you do?"',
    whatItMeans:
      "Your value may be real, but the signal is noisy. If the mechanism isn't named and repeatable, trust stays slow and price stays fragile.",
    todayMove:
      'Write ONE sentence and place it on your hero + bio: "I help [WHO] get [OUTCOME] using [MECHANISM] in [TIME]."',
    weekPlan: [
      "Name the mechanism (2–4 words). If you can’t name it, you don’t own it yet.",
      "Rewrite your hero: Outcome + Mechanism + Proof + One CTA.",
      "Publish one belief you own (a clear stance you can defend).",
    ],
    ifYouDont:
      "You keep explaining instead of attracting. Calls feel like interviews. Revenue stays tied to hustle.",
    ifYouDo:
      "Inbound becomes pre-sold. Pricing becomes logical. People repeat your mechanism for you.",
    auditReason:
      "The Audit validates the leak structurally and generates a fix plan (assets + 7-day execution loop).",
  },
  identity: {
    leakName: "STATUS GAP",
    humanSymptom: "You're good, but you don't look expensive yet.",
    whatItMeans:
      "Your visual + verbal identity isn’t matching the level you want to charge. That creates doubt and negotiation.",
    todayMove:
      "Replace safe language with proof: outcomes, constraints, numbers, and one bold claim you can defend.",
    weekPlan: [
      "Introduce one signature element across touchpoints (type, layout, motif).",
      "Publish one authority post (your contrarian model).",
      "Upgrade the top 3 assets: homepage, offer page, one case study.",
    ],
    ifYouDont:
      "You keep justifying price. Prospects shop you against cheaper options. Resentment builds.",
    ifYouDo:
      "Price objections drop. Prospects interpret premium as obvious. Better leads arrive.",
    auditReason:
      "The Audit maps the proof stack + messaging hierarchy and tells you what to build next.",
  },
  offer: {
    leakName: "VALUE CONFUSION",
    humanSymptom: "People like you… but don't buy fast.",
    whatItMeans:
      "No single obvious flagship path. Too many options or too much custom creates hesitation.",
    todayMove:
      'Choose one flagship. Write: "This is for X. You get Y by Z. If you’re not X, do not apply."',
    weekPlan: [
      "Collapse offers → 1 flagship + 1 entry step.",
      "Rewrite pricing page (one path, one CTA).",
      "Publish one teardown showing how the offer produces the after-state.",
    ],
    ifYouDont:
      "More proposals. More 'let me think.' Close rate stays fragile.",
    ifYouDo:
      "Decision time drops from weeks to days. Scarcity becomes real. Demand tightens.",
    auditReason:
      "The Audit identifies the structural cause of hesitation and outputs an offer path + fix plan.",
  },
  system: {
    leakName: "PIPELINE FRICTION",
    humanSymptom: "You're busy… but revenue isn't predictable.",
    whatItMeans:
      "Your path from attention → cash leaks. You may have demand signals, but not a controlled system.",
    todayMove:
      "Write your happy path in 6 steps: Viewer → Lead → Call → Close → Onboard → Referral.",
    weekPlan: [
      "Install one lead capture + one follow-up email.",
      "Add one booking filter question to repel bad fits.",
      "Create one nurture loop (weekly proof + CTA).",
    ],
    ifYouDont:
      "Growth stays random. You work harder for unstable cash. Scaling becomes heavier.",
    ifYouDo:
      "You can forecast. Inputs → outputs become visible. Control returns.",
    auditReason:
      "The Audit pinpoints where prospects drop, why, and what to change first (with a 7-day plan).",
  },
  growth: {
    leakName: "NO NORTH STAR",
    humanSymptom: "You’re moving… but direction keeps changing.",
    whatItMeans:
      "No clean metric + rhythm. Growth becomes reactive, emotional, and exhausting.",
    todayMove:
      "Pick ONE metric for 30 days (qualified leads/week, close rate, or LTV). Track weekly on the same day.",
    weekPlan: [
      "Choose one channel to dominate for 30 days.",
      "Build one referral trigger (ask at the moment of first win).",
      "Run a weekly review: metric → bottleneck → one fix → repeat.",
    ],
    ifYouDont:
      "More tactics, less momentum. Breakthrough stays out of reach.",
    ifYouDo:
      "Decisions become obvious. You build momentum without chaos.",
    auditReason:
      "The Audit tells you what to optimize first so growth becomes predictable (not emotional).",
  },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pctFromChoice(v: Choice) {
  if (v === 1) return 20;
  if (v === 3) return 60;
  return 100;
}

function bandLabel(pct: number) {
  if (pct >= 80) return "STRONG";
  if (pct >= 55) return "UNSTABLE";
  return "CRITICAL";
}

function sortForcesByWeakest(scores: Record<ForceId, number>) {
  const pairs = (Object.keys(scores) as ForceId[]).map((k) => [k, scores[k]] as const);
  return pairs.sort((a, b) => a[1] - b[1]);
}

function computeConfidence(primary: number, secondary: number) {
  const gap = secondary - primary; // higher = more decisive
  // Map a reasonable range into LOW/MED/HIGH
  if (gap >= 18) return { label: "HIGH", hint: "Clear dominant leak signal.", pct: 85 };
  if (gap >= 10) return { label: "MED", hint: "Primary leak is likely, but close contenders exist.", pct: 65 };
  return { label: "LOW", hint: "Signals are mixed. Audit will validate structurally.", pct: 45 };
}

// ------------------------ STATE ------------------------

type View = "start" | "ritual" | "scan" | "aha" | "result" | "export";

type Answer = {
  qid: string;
  force: ForceId;
  v: Choice;
};

type State = {
  stage: StageId;
  idx: number;
  answers: Answer[];
  view: View;
  createdAtISO: string;
  ahaShown: boolean;
  // optional export
  email: string;
  name: string;
  website: string;
};

const DEFAULT_STATE: State = {
  stage: "launch",
  idx: 0,
  answers: [],
  view: "start",
  createdAtISO: new Date().toISOString(),
  ahaShown: false,
  email: "",
  name: "",
  website: "",
};

function loadStateSafe(): State | null {
  try {
    if (typeof window === "undefined") return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as State;
  } catch {
    return null;
  }
}

function saveStateSafe(s: State) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

// ------------------------ TIMER ------------------------

function useDecayTimer(createdAt: string) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const created = new Date(createdAt).getTime();
  const expires = created + 48 * 60 * 60 * 1000; // 48 hours
  const remaining = Math.max(0, expires - now);

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const secs = Math.floor((remaining % (60 * 1000)) / 1000);

  return { hours, mins, secs, expired: remaining === 0 };
}

// ------------------------ UI PRIMITIVES ------------------------

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="qbg">
      <style>{CSS}</style>
      <div className="wrap">
        {children}
        <div className="footer">
          <div className="footerLeft">
            <span className="footerTag">QTMBG</span>
            <span className="muted">
              Signal OS is a scan. Audit validates structurally and outputs a fix plan.
            </span>
          </div>
          <div className="footerRight muted">© {new Date().getFullYear()}</div>
        </div>
      </div>
    </div>
  );
}

function HeaderBar() {
  return (
    <div className="top">
      <div className="brand">
        <span className="brandBox">QUANTUM BRANDING</span>
        <span className="brandName">Signal OS</span>
      </div>
      <div className="topMeta muted">~3–5 min • 12 questions • primary leak</div>
    </div>
  );
}

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function Btn({
  children,
  onClick,
  variant = "primary",
  disabled = false,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`btn ${variant} ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span>{children}</span>
      <ArrowRight size={16} />
    </button>
  );
}

function ProgressPill({ current, total }: { current: number; total: number }) {
  return (
    <div className="pill muted">
      <span className="pillStrong">{current}</span>
      <span className="pillSep">/</span>
      <span>{total}</span>
    </div>
  );
}

function DecayTimer({ createdAt }: { createdAt: string }) {
  const { hours, mins, secs, expired } = useDecayTimer(createdAt);

  if (expired) {
    return (
      <div className="timer expired">
        <Clock size={14} />
        <span>Analysis expired — retake scan for fresh insights</span>
      </div>
    );
  }

  return (
    <div className="timer">
      <Clock size={14} />
      <span>
        Insights expire in{" "}
        <strong>
          {hours.toString().padStart(2, "0")}:{mins.toString().padStart(2, "0")}:
          {secs.toString().padStart(2, "0")}
        </strong>
      </span>
    </div>
  );
}

function StagePicker({ value, onChange }: { value: StageId; onChange: (s: StageId) => void }) {
  return (
    <div className="field">
      <div className="label">
        Your situation <span className="req">*</span>
      </div>
      <div className="stageGrid">
        {STAGES.map((s) => {
          const active = value === s.id;
          return (
            <button
              key={s.id}
              type="button"
              className={`stage ${active ? "active" : ""}`}
              onClick={() => onChange(s.id)}
            >
              <div className="stageTitle">{s.label}</div>
              <div className="tiny muted">{s.sub}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ------------------------ MAIN ------------------------

export default function Page() {
  const [state, setState] = useState<State>(DEFAULT_STATE);

  // Hydrate
  useEffect(() => {
    const loaded = loadStateSafe();
    if (loaded) setState(loaded);
  }, []);

  useEffect(() => {
    saveStateSafe(state);
  }, [state]);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.view, state.idx]);

  const total = QUESTIONS.length;

  // Aggregate scoring by force (avg of its answered questions)
  const scores = useMemo(() => {
    const bucket: Record<ForceId, number[]> = {
      essence: [],
      identity: [],
      offer: [],
      system: [],
      growth: [],
    };

    for (const a of state.answers) {
      bucket[a.force].push(pctFromChoice(a.v));
    }

    const out: Record<ForceId, number> = {
      essence: 0,
      identity: 0,
      offer: 0,
      system: 0,
      growth: 0,
    };

    (Object.keys(out) as ForceId[]).forEach((f) => {
      const arr = bucket[f];
      if (!arr.length) out[f] = 0;
      else out[f] = Math.round(arr.reduce((x, y) => x + y, 0) / arr.length);
    });

    return out;
  }, [state.answers]);

  const diagnosis = useMemo(() => {
    const sorted = sortForcesByWeakest(scores);
    const primary = sorted[0]?.[0] ?? "essence";
    const secondary = sorted[1]?.[0] ?? "identity";
    return { primary, secondary };
  }, [scores]);

  const confidence = useMemo(() => {
    const sorted = sortForcesByWeakest(scores);
    const primaryScore = sorted[0]?.[1] ?? 0;
    const secondaryScore = sorted[1]?.[1] ?? 0;
    return computeConfidence(primaryScore, secondaryScore);
  }, [scores]);

  const resetAll = () => {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState({ ...DEFAULT_STATE, createdAtISO: new Date().toISOString() });
  };

  const begin = () => {
    // Start → Ritual (sets legitimacy)
    setState((p) => ({
      ...p,
      view: "ritual",
      idx: 0,
      answers: [],
      ahaShown: false,
      createdAtISO: new Date().toISOString(),
    }));
  };

  const startScan = () => {
    setState((p) => ({ ...p, view: "scan", idx: 0 }));
  };

  const pick = (q: Question, v: Choice) => {
    setState((prev) => {
      const nextAnswers = prev.answers.filter((a) => a.qid !== q.id);
      nextAnswers.push({ qid: q.id, force: q.force, v });

      const nextIdx = prev.idx + 1;

      // AHA moment after 4 answers (fast pattern recognition, not too early)
      if (nextIdx === 4 && !prev.ahaShown) {
        return { ...prev, answers: nextAnswers, idx: nextIdx, view: "aha" };
      }

      if (nextIdx >= total) {
        return { ...prev, answers: nextAnswers, idx: total - 1, view: "result" };
      }

      return { ...prev, answers: nextAnswers, idx: nextIdx, view: "scan" };
    });
  };

  const goBack = () => {
    setState((p) => ({ ...p, idx: Math.max(0, p.idx - 1) }));
  };

  const continueFromAha = () => {
    setState((p) => ({ ...p, view: "scan", ahaShown: true }));
  };

  const toExport = () => setState((p) => ({ ...p, view: "export" }));

  const submitExport = () => {
    // Placeholder hook. You’ll wire backend later.
    // Keep on-screen value-first: export is optional.
    console.log("Signal export:", {
      email: state.email,
      name: state.name,
      website: state.website,
      stage: state.stage,
      scores,
      diagnosis,
    });
    alert(`Saved, ${state.name || "operator"}. You'll receive your Signal breakdown.`);
    setState((p) => ({ ...p, view: "result" }));
  };

  const toAudit = () => {
    // Pass a clean contract to Audit
    const params = new URLSearchParams({
      from: "signal",
      stage: state.stage,
      primary: diagnosis.primary,
      secondary: diagnosis.secondary,
      confidence: confidence.label,
      scores: (Object.keys(scores) as ForceId[]).map((k) => `${k}-${scores[k]}`).join(","),
      ...(state.name ? { name: state.name } : {}),
      ...(state.email ? { email: state.email } : {}),
      ...(state.website ? { website: state.website } : {}),
    });

    if (typeof window !== "undefined") {
      window.location.href = `https://audit.qtmbg.com/?${params.toString()}`;
    }
  };

  // ------------------------ VIEWS ------------------------

  if (state.view === "start") {
    return (
      <AppShell>
        <HeaderBar />

        <div className="hero">
          <div className="kicker center">SIGNAL SCAN</div>
          <div className="h1 center">Find the one thing weakening your brand right now.</div>
          <div className="sub center">
            12 questions. You get your primary leak and the next move.
            <br />
            <b>No email required to see results.</b>
          </div>
        </div>

        <Card>
          <StagePicker value={state.stage} onChange={(s) => setState((p) => ({ ...p, stage: s }))} />

          <div className="startRow">
            <Btn variant="primary" onClick={begin} icon={<Zap size={16} />}>
              Start the scan
            </Btn>

            <div className="trustInline">
              <div className="trustItem">
                <CheckCircle2 size={14} />
                <span>Value first</span>
              </div>
              <div className="trustItem">
                <CheckCircle2 size={14} />
                <span>Actionable today + this week</span>
              </div>
              <div className="trustItem">
                <CheckCircle2 size={14} />
                <span>Built for conversion, not trivia</span>
              </div>
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  if (state.view === "ritual") {
    return (
      <AppShell>
        <HeaderBar />

        <Card className="ritual">
          <div className="ritualIcon">
            <Target size={28} />
          </div>

          <div className="ritualTitle">Operator briefing.</div>

          <div className="ritualText">
            This scan is designed to locate your <b>primary leak</b> — the structural weakness causing the symptoms you feel
            (ghosting, negotiation, feast/famine, scattered growth).
            <br />
            <br />
            You’ll answer fast. The output is <b>one leak + one next move</b>.
            Audit is where we validate and generate the full fix plan.
          </div>

          <div className="ritualRules">
            <div className="ruleItem">
              <CheckCircle2 size={14} />
              <span>Answer based on your current reality (not what you wish).</span>
            </div>
            <div className="ruleItem">
              <CheckCircle2 size={14} />
              <span>Go with the first honest response. Don’t overthink.</span>
            </div>
            <div className="ruleItem">
              <CheckCircle2 size={14} />
              <span>No email required to see the leak.</span>
            </div>
          </div>

          <div className="ctaRow">
            <Btn variant="primary" onClick={startScan} icon={<ArrowRight size={16} />}>
              Begin
            </Btn>
            <button className="link" type="button" onClick={resetAll}>
              Reset
            </button>
          </div>

          <div className="tiny muted">
            You can export the breakdown later (optional).
          </div>
        </Card>
      </AppShell>
    );
  }

  if (state.view === "aha") {
    const sorted = sortForcesByWeakest(scores);
    const emerging = sorted[0]?.[0] ?? "essence";
    const emergingMeta = FORCES.find((f) => f.id === emerging)!;
    const EmergingIcon = emergingMeta.icon;

    return (
      <AppShell>
        <HeaderBar />

        <Card className="aha">
          <div className="ahaTop">
            <div className="ahaLeft">
              <div className="kicker">PATTERN DETECTED</div>
              <div className="ahaTitle">Early signal emerging.</div>
              <div className="ahaText">
                Based on your first answers, I’m seeing a likely leak in your{" "}
                <strong>{emergingMeta.label}</strong>.
              </div>
            </div>
            <div className="ahaRight">
              <ProgressPill current={Math.min(state.idx, total)} total={total} />
            </div>
          </div>

          <div className="ahaForce">
            <EmergingIcon size={20} />
            <div>
              <div className="ahaForceName">{emergingMeta.label}</div>
              <div className="tiny muted">{emergingMeta.micro}</div>
            </div>
          </div>

          <div className="ahaHint">
            {emerging === "essence" &&
              "Usually: your mechanism isn’t named sharply enough to create instant trust."}
            {emerging === "identity" &&
              "Usually: your identity doesn’t match the level you want to charge."}
            {emerging === "offer" &&
              "Usually: you don’t have one obvious flagship path — options create paralysis."}
            {emerging === "system" &&
              "Usually: lead flow is unpredictable — more feast/famine than controlled pipeline."}
            {emerging === "growth" &&
              "Usually: you’re reacting to urgency instead of tracking one metric."}
          </div>

          <div className="ahaQuestion">Sound familiar?</div>

          <div className="ctaRow">
            <Btn variant="primary" onClick={continueFromAha}>
              Yes — confirm it
            </Btn>
            <Btn variant="secondary" onClick={continueFromAha}>
              Not sure — keep going
            </Btn>
          </div>

          <div className="tiny muted">
            This is pattern recognition. The remaining questions confirm or refine the diagnosis.
          </div>
        </Card>
      </AppShell>
    );
  }

  if (state.view === "scan") {
    const q = QUESTIONS[state.idx];
    const forceMeta = FORCES.find((f) => f.id === q.force)!;
    const Icon = forceMeta.icon;

    return (
      <AppShell>
        <HeaderBar />

        <div className="scanHead">
          <div className="scanLeft">
            <div className="scanKicker">
              <span className="muted">Signal scan</span>
              <span className="dot">•</span>
              <ProgressPill current={state.idx + 1} total={total} />
            </div>

            <div className="forceLine">
              <Icon size={18} />
              <div>
                <div className="forceName">{forceMeta.label}</div>
                <div className="tiny muted">{forceMeta.micro}</div>
              </div>
            </div>
          </div>

          <div className="scanRight">
            <button className="link" type="button" onClick={goBack} disabled={state.idx === 0}>
              Back
            </button>
          </div>
        </div>

        <Card>
          <div className="qText">{q.text}</div>

          <div className="choices">
            <button className="choice" type="button" onClick={() => pick(q, q.a.v)}>
              <div className="choiceDot">
                <CircleDashed size={14} />
              </div>
              <div className="choiceText">{q.a.label}</div>
              <ChevronRight size={16} className="chev" />
            </button>

            <button className="choice" type="button" onClick={() => pick(q, q.b.v)}>
              <div className="choiceDot">
                <CircleDashed size={14} />
              </div>
              <div className="choiceText">{q.b.label}</div>
              <ChevronRight size={16} className="chev" />
            </button>

            <button className="choice" type="button" onClick={() => pick(q, q.c.v)}>
              <div className="choiceDot">
                <CheckCircle2 size={14} />
              </div>
              <div className="choiceText">{q.c.label}</div>
              <ChevronRight size={16} className="chev" />
            </button>
          </div>
        </Card>
      </AppShell>
    );
  }

  if (state.view === "export") {
    return (
      <AppShell>
        <HeaderBar />

        <div className="hero">
          <div className="kicker center">EXPORT</div>
          <div className="h1 center">Email the breakdown + keep it.</div>
          <div className="sub center">
            One useful email: your primary leak, signal snapshot, benchmarks, and the next move.
          </div>
        </div>

        <Card>
          <div className="field">
            <div className="label">
              Email <span className="req">*</span>
            </div>
            <input
              className="input"
              type="email"
              value={state.email}
              onChange={(e) => setState((p) => ({ ...p, email: e.target.value }))}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>

          <div className="grid2">
            <div className="field">
              <div className="label">Name (optional)</div>
              <input
                className="input"
                type="text"
                value={state.name}
                onChange={(e) => setState((p) => ({ ...p, name: e.target.value }))}
                placeholder="Your name"
                autoComplete="name"
              />
            </div>

            <div className="field">
              <div className="label">Website (optional)</div>
              <input
                className="input"
                type="url"
                value={state.website}
                onChange={(e) => setState((p) => ({ ...p, website: e.target.value }))}
                placeholder="yoursite.com"
                autoComplete="url"
              />
            </div>
          </div>

          <div className="ctaRow">
            <Btn
              variant="primary"
              onClick={submitExport}
              disabled={!state.email}
              icon={<Send size={16} />}
            >
              Email me the breakdown
            </Btn>

            <button className="link" type="button" onClick={() => setState((p) => ({ ...p, view: "result" }))}>
              Skip
            </button>
          </div>

          <div className="tiny muted">No spam. One useful email with your analysis.</div>
        </Card>
      </AppShell>
    );
  }

  // ------------------------ RESULT ------------------------

  const primary = diagnosis.primary;
  const secondary = diagnosis.secondary;

  const primaryInfo = LEAKS[primary];
  const primaryMeta = FORCES.find((f) => f.id === primary)!;

  const symptoms = MICRO_SYMPTOMS[primary][state.stage];
  const benchmark = BENCHMARKS[primary][state.stage];

  const primaryScore = scores[primary];
  const gap = benchmark.avg - primaryScore;
  const topGap = benchmark.top10 - primaryScore;

  return (
    <AppShell>
      <HeaderBar />

      <DecayTimer createdAt={state.createdAtISO} />

      <div className="hero">
        <div className="kicker center">YOUR PRIMARY LEAK</div>
        <div className="h1 leak center">{primaryInfo.leakName}</div>
        <div className="sub center">{primaryInfo.humanSymptom}</div>

        <div className="metaRow">
          <div className="metaItem">
            <span className="metaLabel">Confidence</span>
            <span className="metaValue">{confidence.label}</span>
            <span className="metaHint muted">{confidence.hint}</span>
          </div>
          <div className="metaItem">
            <span className="metaLabel">Stage</span>
            <span className="metaValue">{state.stage.toUpperCase()}</span>
          </div>
          <div className="metaItem">
            <span className="metaLabel">Secondary</span>
            <span className="metaValue">{secondary.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <Card className="symptoms">
        <div className="symptomsTitle">If this is true, you’ll recognize these:</div>
        <div className="symptomList">
          {symptoms.map((s, i) => (
            <div key={i} className="symptomItem">
              <CheckCircle2 size={16} />
              <span>{s}</span>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <div className="resultGrid">
          <div className="panel">
            <div className="panelTitle">What this means</div>
            <div className="panelText">{primaryInfo.whatItMeans}</div>

            <div className="panelTitle mt">Today move</div>
            <div className="panelText strong">{primaryInfo.todayMove}</div>

            <div className="panelTitle mt">7-day micro-plan</div>
            <ul className="list">
              {primaryInfo.weekPlan.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>

            <div className="panelTitle mt">How you compare</div>
            <div className="benchmark">
              <div className="benchRow">
                <span className="benchLabel">Your {primaryMeta.label}:</span>
                <span className="benchValue">{primaryScore}</span>
              </div>
              <div className="benchRow">
                <span className="benchLabel">Stage average:</span>
                <span className="benchValue">{benchmark.avg}</span>
              </div>
              <div className="benchRow strong">
                <span className="benchLabel">Top 10%:</span>
                <span className="benchValue">{benchmark.top10}</span>
              </div>
            </div>

            <div className="panelText small">
              You are <strong>{Math.abs(gap)} points</strong> {gap < 0 ? "above" : "below"} average and{" "}
              <strong>{Math.abs(topGap)} points</strong> from premium positioning.
            </div>

            <div className="outcomes">
              <div className="outcome bad">
                <div className="outcomeLabel">If you don’t fix this:</div>
                <div className="outcomeText">{primaryInfo.ifYouDont}</div>
              </div>
              <div className="outcome good">
                <div className="outcomeLabel">If you do:</div>
                <div className="outcomeText">{primaryInfo.ifYouDo}</div>
              </div>
            </div>

            <div className="panelTitle mt">Important</div>
            <div className="panelText small">
              Signal OS tells you <b>where</b> you leak. Audit tells you <b>why</b> and outputs the fix plan (assets + 7-day loop).
            </div>
          </div>

          <div className="panel soft">
            <div className="panelTitle">Signal snapshot</div>
            <div className="bars">
              {(Object.keys(scores) as ForceId[]).map((f) => {
                const meta = FORCES.find((x) => x.id === f)!;
                const pct = scores[f];
                const isPrimary = f === primary;
                const isSecondary = f === secondary;
                const tag = isPrimary ? "PRIMARY LEAK" : isSecondary ? "SECONDARY" : bandLabel(pct);

                return (
                  <div key={f} className="barRow">
                    <div className="barLeft">
                      <div className="barName">{meta.label}</div>
                      <div className={`tag ${isPrimary ? "tagHard" : isSecondary ? "tagWarn" : ""}`}>
                        {tag}
                      </div>
                    </div>
                    <div className="barWrap">
                      <div className="barIn" style={{ width: `${pct}%` }} />
                      <div className="barPct">{pct}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="divider" />

            <div className="panelTitle">Next step</div>
            <div className="panelText small">{primaryInfo.auditReason}</div>

            <div className="commitLadder">
              <button className="commitStep" type="button" onClick={toExport}>
                <div className="commitIcon">
                  <Send size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Email me the breakdown</div>
                  <div className="commitSub">Optional • Save this analysis</div>
                </div>
                <ChevronRight size={18} />
              </button>

              <button className="commitStep primary" type="button" onClick={toAudit}>
                <div className="commitIcon">
                  <TrendingUp size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Validate structurally in Audit</div>
                  <div className="commitSub">Deeper diagnostic • Fix plan artifact</div>
                </div>
                <ArrowRight size={18} />
              </button>
            </div>

            <button className="link" type="button" onClick={resetAll}>
              New scan
            </button>

            <div className="tiny muted mt">
              We pass your stage + leak + scores into Audit so you don’t start from zero.
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

// ------------------------ CSS ------------------------

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sometype+Mono:wght@400;500;600;700&display=swap');

:root{
  --bg: #ffffff;
  --paper: #ffffff;
  --ink: #0a0a0a;
  --muted: #6d6d6d;

  --rule: rgba(10,10,10,.35);
  --rule2: rgba(10,10,10,.10);

  --max: 1126px;
  --padX: 26px;

  --radius: 0px;
}

*{margin:0;padding:0;box-sizing:border-box;}

.qbg{
  min-height:100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Sometype Mono', ui-monospace, monospace;
  line-height:1.55;
  position:relative;

  /* Notebook: faint grid + ruled lines */
  background-image:
    linear-gradient(to right, var(--rule2) 1px, transparent 1px),
    linear-gradient(to bottom, var(--rule2) 1px, transparent 1px),
    repeating-linear-gradient(to bottom, rgba(10,10,10,.08) 0px, rgba(10,10,10,.08) 1px, transparent 1px, transparent 36px);
  background-size: 48px 48px, 48px 48px, auto;
}

/* Red margin line */
.qbg:before{
  content:"";
  position:fixed;
  top:0; bottom:0;
  left:72px;
  width:2px;
  background: rgba(220, 38, 38, .35);
  pointer-events:none;
  z-index:0;
}

.wrap{
  width:100%;
  max-width: var(--max);
  margin: 0 auto;
  padding: 18px var(--padX) 22px;
  position:relative;
  z-index:1;
  display:flex;
  flex-direction:column;
  min-height:100vh;
}

.muted{ color: var(--muted); }
.tiny{ font-size:12px; line-height:1.4; }
.small{ font-size:13px; line-height:1.55; }
.center{ text-align:center; }

.top{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  padding: 10px 0 14px;
  border-bottom:2px solid var(--ink);
  margin-bottom: 22px;
}

.brand{
  display:flex;
  align-items:center;
  gap:14px;
}

.brandBox{
  border:2px solid var(--ink);
  padding:8px 12px;
  font-size:10px;
  letter-spacing:.22em;
  text-transform:uppercase;
  font-weight:700;
  background: var(--ink);
  color: var(--bg);
}

.brandName{
  font-size:16px;
  letter-spacing:.02em;
  font-weight:600;
}

.topMeta{
  font-size:12px;
  letter-spacing:.06em;
}

.hero{
  padding: 8px 0 18px;
  max-width: 980px;
  margin: 0 auto;
  text-align:center;
}

.kicker{
  font-size:11px;
  letter-spacing:.24em;
  text-transform:uppercase;
  color: var(--muted);
  margin-bottom:12px;
  font-weight:700;
}

.h1{
  font-size: clamp(32px, 5vw, 64px);
  line-height: 1.04;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.h1.leak{
  border:2px solid var(--ink);
  display:inline-block;
  padding:14px 18px;
  margin-top:6px;
  background: var(--ink);
  color: var(--bg);
}

.sub{
  margin-top:14px;
  font-size:15px;
  line-height:1.65;
  color: rgba(10,10,10,.78);
  max-width: 760px;
  margin-left:auto;
  margin-right:auto;
}

.sub b{ color: var(--ink); font-weight:700; }

.card{
  border:2px solid var(--ink);
  padding: 22px;
  background: rgba(255,255,255,.92);
  margin-bottom:16px;
}

.card.symptoms{
  background: rgba(255,255,255,.86);
}

.card.ritual{
  background: rgba(255,255,255,.95);
}

.field{ margin-bottom: 16px; }

.label{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: var(--muted);
  margin-bottom:10px;
  font-weight:700;
}

.req{ color: var(--ink); }

.input{
  width:100%;
  border:none;
  border-bottom:2px solid var(--ink);
  padding:12px 4px;
  font-size:15px;
  outline:none;
  background:transparent;
  color: var(--ink);
  font-family: 'Sometype Mono', ui-monospace, monospace;
}

.input::placeholder{ color: rgba(10,10,10,.35); }

.grid2{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:16px;
}
@media (max-width: 720px){
  .grid2{ grid-template-columns: 1fr; }
}

.stageGrid{
  display:grid;
  grid-template-columns: 1fr;
  gap:12px;
}

.stage{
  border:2px solid var(--ink);
  padding:16px;
  text-align:left;
  background: rgba(255,255,255,.96);
  transition: all .18s cubic-bezier(.4,0,.2,1);
  cursor:pointer;
  font-family: 'Sometype Mono', ui-monospace, monospace;
}

.stage:hover{ transform: translateY(-2px); }

.stage.active{
  background: var(--ink);
  color: var(--bg);
}
.stage.active .muted{ color: rgba(255,255,255,.75); }

.stageTitle{
  font-weight:700;
  letter-spacing:-0.01em;
  font-size:16px;
}

.btn{
  border:2px solid var(--ink);
  padding:14px 18px;
  display:inline-flex;
  align-items:center;
  gap:12px;
  text-transform:uppercase;
  letter-spacing:.18em;
  font-size:11px;
  cursor:pointer;
  transition: all .18s cubic-bezier(.4,0,.2,1);
  font-family: 'Sometype Mono', ui-monospace, monospace;
  font-weight:700;
  background: var(--paper);
  color: var(--ink);
}

.btn.primary{
  background: var(--ink);
  color: var(--bg);
}
.btn.primary:hover{ transform: translateY(-2px); }
.btn.secondary:hover{ transform: translateY(-2px); }
.btn.disabled{ opacity:.35; cursor:not-allowed; }

.link{
  background:transparent;
  border:none;
  padding:0;
  color: var(--muted);
  text-decoration: underline;
  cursor:pointer;
  font-family: 'Sometype Mono', ui-monospace, monospace;
  font-size:12px;
}
.link:hover{ color: var(--ink); }
.link:disabled{ opacity:.35; cursor:not-allowed; }

.startRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  margin-top: 10px;
  flex-wrap:wrap;
}

.trustInline{
  display:flex;
  align-items:center;
  justify-content:flex-end;
  gap:18px;
  flex-wrap:wrap;
}

.trustItem{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:12px;
  color: rgba(10,10,10,.70);
}

.scanHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  margin-bottom: 12px;
}

.scanKicker{
  display:flex;
  align-items:center;
  gap:10px;
  font-size:12px;
  letter-spacing:.04em;
  margin-bottom:10px;
}

.dot{
  opacity:.5;
}

.pill{
  border:2px solid rgba(10,10,10,.25);
  padding:6px 10px;
  font-size:12px;
  background: rgba(255,255,255,.9);
}
.pillStrong{ font-weight:700; color: var(--ink); }
.pillSep{ opacity:.55; padding:0 6px; }

.forceLine{
  display:flex;
  gap:12px;
  align-items:flex-start;
}

.forceName{
  font-weight:700;
  letter-spacing:.14em;
  font-size:14px;
}

.qText{
  font-size: 22px;
  line-height: 1.35;
  letter-spacing: -0.01em;
  font-weight: 700;
  margin-bottom: 18px;
  color: var(--ink);
}

.choices{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.choice{
  display:flex;
  align-items:center;
  gap:12px;
  width:100%;
  text-align:left;
  border:2px solid var(--ink);
  background: rgba(255,255,255,.96);
  padding:16px;
  cursor:pointer;
  transition: all .18s cubic-bezier(.4,0,.2,1);
  font-family: 'Sometype Mono', ui-monospace, monospace;
}

.choice:hover{ transform: translateY(-2px); }

.choiceDot{
  width:28px;
  height:28px;
  display:flex;
  align-items:center;
  justify-content:center;
  border:2px solid currentColor;
  flex-shrink:0;
}

.choiceText{
  flex:1;
  font-size: 14px;
  line-height: 1.45;
}

.chev{ opacity:.55; flex-shrink:0; }

.timer{
  display:flex;
  align-items:center;
  gap:10px;
  padding:12px 14px;
  background: rgba(255,255,255,.95);
  border:2px solid var(--ink);
  margin-bottom:14px;
  font-size:12px;
  color: rgba(10,10,10,.72);
}
.timer.expired{
  background: var(--ink);
  color: var(--bg);
}
.timer strong{ color: var(--ink); font-weight:700; }
.timer.expired strong{ color: var(--bg); }

.ritualIcon{
  width:56px;
  height:56px;
  border:2px solid var(--ink);
  display:flex;
  align-items:center;
  justify-content:center;
  margin-bottom:14px;
}

.ritualTitle{
  font-size:26px;
  font-weight:700;
  margin-bottom:12px;
}

.ritualText{
  font-size:14px;
  line-height:1.7;
  color: rgba(10,10,10,.78);
  margin-bottom:16px;
  max-width:820px;
}

.ritualRules{
  border-top:2px solid rgba(10,10,10,.15);
  padding-top:14px;
  display:flex;
  flex-direction:column;
  gap:10px;
  margin-bottom:16px;
}

.ruleItem{
  display:flex;
  align-items:flex-start;
  gap:10px;
  font-size:13px;
  color: rgba(10,10,10,.75);
}
.ruleItem svg{ flex-shrink:0; margin-top:2px; }

.ctaRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  margin-top: 8px;
  flex-wrap:wrap;
}

.ahaTop{
  display:flex;
  justify-content:space-between;
  gap:16px;
  align-items:flex-start;
  margin-bottom:14px;
}

.ahaTitle{
  font-size:28px;
  font-weight:700;
  margin-bottom:10px;
}

.ahaText{
  font-size:14px;
  line-height:1.65;
  color: rgba(10,10,10,.78);
  max-width:720px;
}

.ahaForce{
  display:inline-flex;
  gap:12px;
  align-items:center;
  padding:12px 14px;
  border:2px solid var(--ink);
  background: rgba(255,255,255,.96);
  margin: 10px 0 14px;
}

.ahaForceName{
  font-weight:700;
  letter-spacing:.12em;
}

.ahaHint{
  font-size:13px;
  line-height:1.6;
  color: rgba(10,10,10,.68);
  margin-bottom:14px;
  max-width:780px;
}

.ahaQuestion{
  font-size:16px;
  font-weight:700;
  margin: 8px 0 14px;
}

.symptomsTitle{
  font-size:12px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(10,10,10,.68);
  font-weight:700;
  margin-bottom:14px;
}

.symptomList{
  display:flex;
  flex-direction:column;
  gap:10px;
}

.symptomItem{
  display:flex;
  align-items:flex-start;
  gap:12px;
  font-size:14px;
  line-height:1.55;
  color: rgba(10,10,10,.78);
}
.symptomItem svg{ flex-shrink:0; margin-top:2px; }

.resultGrid{
  display:grid;
  grid-template-columns: 1.1fr .9fr;
  gap:18px;
}
@media (max-width: 900px){
  .resultGrid{ grid-template-columns: 1fr; }
}

.panel{
  border:2px solid var(--ink);
  padding:18px;
  background: rgba(255,255,255,.96);
}
.panel.soft{
  background: rgba(255,255,255,.88);
}

.panelTitle{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(10,10,10,.65);
  font-weight:700;
  margin-bottom:10px;
}

.panelText{
  font-size:14px;
  line-height:1.65;
  color: rgba(10,10,10,.78);
}
.panelText.strong{
  font-weight:700;
  color: var(--ink);
  font-size:15px;
}

.mt{ margin-top: 18px; }

.list{
  padding-left: 18px;
  color: rgba(10,10,10,.78);
  line-height:1.65;
  font-size:14px;
}
.list li{ margin-bottom:8px; }

.benchmark{
  display:flex;
  flex-direction:column;
  gap:10px;
  padding:14px;
  background: rgba(255,255,255,.8);
  border:2px solid rgba(10,10,10,.22);
  margin-bottom:12px;
}

.benchRow{
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:13px;
}
.benchRow.strong{
  font-weight:700;
  padding-top:8px;
  border-top:1px solid rgba(10,10,10,.2);
}
.benchLabel{ color: rgba(10,10,10,.62); }
.benchValue{ font-weight:700; font-size:16px; color: var(--ink); }

.outcomes{
  margin-top:18px;
  display:flex;
  flex-direction:column;
  gap:12px;
}

.outcome{
  padding:14px;
  border:2px solid rgba(10,10,10,.30);
  background: rgba(255,255,255,.85);
}

.outcomeLabel{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  margin-bottom:8px;
  font-weight:700;
  color: rgba(10,10,10,.65);
}
.outcomeText{
  font-size:13px;
  line-height:1.55;
  color: rgba(10,10,10,.78);
}

.divider{
  height:2px;
  background: rgba(10,10,10,.18);
  margin:16px 0;
}

.bars{
  margin-top: 14px;
  display:flex;
  flex-direction:column;
  gap:12px;
}

.barLeft{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}

.barName{
  font-size:12px;
  letter-spacing:.14em;
  font-weight:700;
  color: var(--ink);
}

.tag{
  font-size:9px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(10,10,10,.45);
  font-weight:700;
}

.tagHard{
  color: var(--bg);
  background: var(--ink);
  padding:4px 8px;
  border:2px solid var(--ink);
}
.tagWarn{
  color: var(--ink);
  background: rgba(10,10,10,.06);
  padding:4px 8px;
  border:2px solid rgba(10,10,10,.22);
}

.barWrap{
  position:relative;
  border:2px solid var(--ink);
  height: 26px;
  background: rgba(255,255,255,.96);
  overflow:hidden;
}

.barIn{
  height:100%;
  background: var(--ink);
  transition: width .5s cubic-bezier(.4,0,.2,1);
}

.barPct{
  position:absolute;
  right:10px;
  top:50%;
  transform: translateY(-50%);
  font-size:12px;
  color: var(--bg);
  font-weight:700;
  mix-blend-mode: difference;
}

.commitLadder{
  display:flex;
  flex-direction:column;
  gap:12px;
  margin:16px 0 10px;
}

.commitStep{
  display:flex;
  align-items:center;
  gap:14px;
  padding:14px;
  border:2px solid rgba(10,10,10,.30);
  background: rgba(255,255,255,.94);
  cursor:pointer;
  transition: all .18s cubic-bezier(.4,0,.2,1);
  text-align:left;
  font-family: 'Sometype Mono', ui-monospace, monospace;
}

.commitStep:hover{
  transform: translateY(-2px);
  border-color: var(--ink);
}

.commitStep.primary{
  border-color: var(--ink);
  background: var(--ink);
  color: var(--bg);
}

.commitIcon{
  width:40px;
  height:40px;
  border:2px solid currentColor;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
}

.commitContent{ flex:1; }
.commitTitle{ font-weight:700; font-size:14px; margin-bottom:4px; }
.commitSub{ font-size:11px; color: rgba(10,10,10,.55); }
.commitStep.primary .commitSub{ color: rgba(255,255,255,.75); }

.metaRow{
  margin-top: 14px;
  display:flex;
  justify-content:center;
  gap:14px;
  flex-wrap:wrap;
}

.metaItem{
  border:2px solid rgba(10,10,10,.20);
  background: rgba(255,255,255,.92);
  padding:10px 12px;
  min-width: 200px;
  text-align:left;
}

.metaLabel{
  display:block;
  font-size:10px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(10,10,10,.55);
  font-weight:700;
  margin-bottom:6px;
}

.metaValue{
  display:block;
  font-weight:700;
  font-size:14px;
}

.metaHint{
  display:block;
  margin-top:6px;
  font-size:12px;
  line-height:1.45;
}

.footer{
  margin-top:auto;
  padding-top: 14px;
  border-top:2px solid var(--ink);
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}

.footerLeft{
  display:flex;
  align-items:center;
  gap:12px;
  flex-wrap:wrap;
}

.footerTag{
  border:2px solid var(--ink);
  padding:6px 10px;
  font-size:10px;
  letter-spacing:.22em;
  text-transform:uppercase;
  font-weight:700;
  background: var(--ink);
  color: var(--bg);
}

@media (max-width: 780px){
  .wrap{ padding: 16px 16px 20px; }
  .qbg:before{ left: 44px; opacity:.25; }
  .top{ flex-direction:column; align-items:flex-start; }
  .startRow{ align-items:stretch; }
  .trustInline{ justify-content:flex-start; }
  .card{ padding:16px; }
  .ctaRow{ flex-direction:column; align-items:stretch; }
}
` as const;
