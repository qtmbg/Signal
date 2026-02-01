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
  Copy,
} from "lucide-react";

/**
 * QTMBG — Signal OS (V4)
 * Architecture upgraded from frame-by-frame reference:
 * 1) Hook (start) → 2) Seriousness/consent → 3) Quest (progress + count)
 * 4) Micro-reveal checkpoints → 5) Shareable result
 *
 * Styling:
 * - Pure white background (no warm tint)
 * - Notebook stripes (subtle)
 * - Sometype Mono head+body
 */

type ForceId = "essence" | "identity" | "offer" | "system" | "growth";
type StageId = "launch" | "reposition" | "scale";

type Choice = 1 | 3 | 5;

type Question = {
  force: ForceId;
  text: string;
  a: { v: Choice; label: string };
  b: { v: Choice; label: string };
  c: { v: Choice; label: string };
};

type View = "start" | "consent" | "scan" | "aha" | "result" | "email";

type State = {
  stage: StageId;
  view: View;
  idx: number;
  createdAtISO: string;

  // responses aligned to QUESTIONS indices
  responses: Array<Choice | null>;

  // two checkpoint reveals (bitmask): 1=early shown, 2=mid shown
  ahaMask: number;
  ahaKind: "early" | "mid";

  email: string;
  name: string;
  website: string;
};

const STORAGE_KEY = "qtmbg-signal-os-v4";

// ------------------------ CONTENT ------------------------

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

// BENCHMARKS (kept as you had)
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

// 12 questions (quest feels real, still fast)
const QUESTIONS: Question[] = [
  // ESSENCE (2)
  {
    force: "essence",
    text: "If I land on your brand today… can I understand the unique mechanism you bring?",
    a: { v: 1, label: "No — it sounds like generic services." },
    b: { v: 3, label: "Somewhat — but it isn't named or sharp." },
    c: { v: 5, label: "Yes — it's specific, named, and repeatable." },
  },
  {
    force: "essence",
    text: "Can a stranger describe you in one sentence without you being there to explain?",
    a: { v: 1, label: "No — it depends on context, person, mood." },
    b: { v: 3, label: "Sometimes — but it's not consistent." },
    c: { v: 5, label: "Yes — they repeat the same simple line." },
  },

  // IDENTITY (2)
  {
    force: "identity",
    text: "Do you look and sound like a premium authority in your space?",
    a: { v: 1, label: "Not yet — it feels template or inconsistent." },
    b: { v: 3, label: "Clean — but not memorable or high-status." },
    c: { v: 5, label: "Yes — instantly premium and distinct." },
  },
  {
    force: "identity",
    text: "When people see your touchpoints, do they assume 'cheap' or 'serious money'?",
    a: { v: 1, label: "They could easily shop me against cheaper options." },
    b: { v: 3, label: "Mixed — depends on who it is." },
    c: { v: 5, label: "They assume premium before price is even mentioned." },
  },

  // OFFER (2)
  {
    force: "offer",
    text: "Is your flagship offer obvious and easy to choose?",
    a: { v: 1, label: "No — it's custom, confusing, or too many options." },
    b: { v: 3, label: "Kind of — but people still hesitate or negotiate." },
    c: { v: 5, label: "Yes — one clear flagship with clean pricing." },
  },
  {
    force: "offer",
    text: "Do prospects buy the next step… or do they ask for 'a call to figure it out'?",
    a: { v: 1, label: "Mostly calls — lots of back-and-forth." },
    b: { v: 3, label: "A mix — some buy, some need persuasion." },
    c: { v: 5, label: "The next step is obvious and frictionless." },
  },

  // SYSTEM (3)
  {
    force: "system",
    text: "Is lead flow predictable and controlled (not luck-based)?",
    a: { v: 1, label: "No — it's feast/famine and manual chasing." },
    b: { v: 3, label: "Somewhat — referrals + occasional wins." },
    c: { v: 5, label: "Yes — repeatable pipeline + nurture." },
  },
  {
    force: "system",
    text: "Do you have one 'happy path' from attention → cash that you can explain in 10 seconds?",
    a: { v: 1, label: "No — it's messy and changes constantly." },
    b: { v: 3, label: "Somewhat — but it's not tight." },
    c: { v: 5, label: "Yes — it's one clear path with one CTA." },
  },
  {
    force: "system",
    text: "If you stop posting for 14 days, does the pipeline keep breathing?",
    a: { v: 1, label: "No — everything goes quiet." },
    b: { v: 3, label: "Some — but it drops fast." },
    c: { v: 5, label: "Yes — nurture + assets keep converting." },
  },

  // GROWTH (3)
  {
    force: "growth",
    text: "Do you have a single metric and a plan that scales without chaos?",
    a: { v: 1, label: "No — I react to bank balance and urgency." },
    b: { v: 3, label: "Some — I track revenue, but not signal/quality." },
    c: { v: 5, label: "Yes — clear north star + weekly loop." },
  },
  {
    force: "growth",
    text: "Is your calendar running you… or are you running the calendar?",
    a: { v: 1, label: "It runs me — constant reactivity." },
    b: { v: 3, label: "Mixed — some structure, still chaotic." },
    c: { v: 5, label: "I have a repeatable rhythm and protect it." },
  },
  {
    force: "growth",
    text: "If you doubled demand tomorrow, would delivery break?",
    a: { v: 1, label: "Yes — I'd drown." },
    b: { v: 3, label: "Maybe — depends on the month." },
    c: { v: 5, label: "No — the system and offer can absorb it." },
  },
];

// MICRO-SYMPTOMS (kept)
const MICRO_SYMPTOMS: Record<ForceId, Record<StageId, string[]>> = {
  essence: {
    launch: [
      "Calls turn into 'so what exactly do you do?' interrogations",
      "You keep tweaking the homepage because it doesn't feel sharp",
      "You have multiple ways to explain your value depending on who asks",
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
      "You're doing custom proposals for every single deal",
      "Pricing conversations turn into negotiations every time",
    ],
    reposition: [
      "You have too many offers and people get decision paralysis",
      "Your best clients bought something you no longer want to sell",
      "Revenue is good but you're not sure which offer to double down on",
    ],
    scale: [
      "Your offer architecture is complex and hard to explain to your team",
      "Cross-sell/upsell happens by accident, not by design",
      "You're leaving money on the table because the path isn't obvious",
    ],
  },
  system: {
    launch: [
      "You're always busy but revenue isn't predictable",
      "Leads come from hustle and luck, not a repeatable system",
      "You forget to follow up because everything is manual chaos",
    ],
    reposition: [
      "You get attention but conversion rates are embarrassingly low",
      "Leads leak out between awareness and purchase",
      "Your CRM is a mess (or you don't have one)",
    ],
    scale: [
      "Your team can't scale the system because it lives in your head",
      "Lead quality is inconsistent—some gems, mostly tire-kickers",
      "Pipeline is full but close rate is dropping as you grow",
    ],
  },
  growth: {
    launch: [
      "You react to bank balance instead of leading indicators",
      "Every month feels like starting from zero",
      "You chase shiny tactics because there's no clear plan",
    ],
    reposition: [
      "You're making moves but direction keeps changing week to week",
      "Growth happens in spurts, not consistently",
      "You track revenue but not the signals that predict it",
    ],
    scale: [
      "You're scaling but it feels chaotic and exhausting",
      "Adding people/budget doesn't reliably increase output",
      "You can't identify the one bottleneck slowing everything down",
    ],
  },
};

// LEAK INTELLIGENCE (kept)
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
      "Your value may be strong, but the signal is noisy. If the mechanism isn't named and repeatable, trust stays slow and price stays fragile.",
    todayMove:
      'Write ONE sentence and place it on your hero + bio: "I help [WHO] get [OUTCOME] using [MECHANISM] in [TIME]."',
    weekPlan: [
      "Name the mechanism (2–4 words). If you can’t name it, you don’t own it yet.",
      "Rewrite the hero: Outcome + Mechanism + Proof + One CTA.",
      "Publish one belief you own (a clear 'this, not that').",
    ],
    ifYouDont:
      "You keep explaining instead of attracting. Calls feel like interviews. Revenue stays tied to hustle.",
    ifYouDo:
      "Inbound becomes pre-sold. Pricing becomes logical. People repeat your mechanism for you.",
    auditReason:
      "The Audit locks positioning: claims, repulsion, proof stack, and the assets that justify premium pricing.",
  },
  identity: {
    leakName: "STATUS GAP",
    humanSymptom: "You're good, but you don't look expensive yet.",
    whatItMeans:
      "Your visual + verbal identity isn’t matching the level you want to charge. That creates doubt and negotiation.",
    todayMove:
      "Remove safe language. Replace with proof: outcomes, constraints, numbers, and one bold claim you can defend.",
    weekPlan: [
      "Kill generic visuals (introduce one signature element across touchpoints).",
      "Publish one authority post (your contrarian model).",
      "Upgrade the top 3 assets: homepage, offer page, one case study.",
    ],
    ifYouDont:
      "You keep justifying price. Prospects shop you against cheaper options. Resentment builds.",
    ifYouDo:
      "Price objections drop. Prospects interpret premium as obvious. Better leads arrive.",
    auditReason:
      "The Audit identifies credibility gaps and gives you a proof stack + messaging hierarchy.",
  },
  offer: {
    leakName: "VALUE CONFUSION",
    humanSymptom: "People like you… but don't buy fast.",
    whatItMeans:
      "No single obvious flagship path. Too many options or too much custom creates hesitation.",
    todayMove:
      'Choose one flagship. Write: "This is for X. You get Y by Z. If you’re not X, do not apply."',
    weekPlan: [
      "Collapse offers → 1 flagship + 1 entry or ascension step.",
      "Rewrite pricing page (one path, one CTA).",
      "Publish one teardown: show how your offer creates the after-state.",
    ],
    ifYouDont:
      "More proposals. More 'let me think.' Close rate stays fragile.",
    ifYouDo:
      "Decision time drops from weeks to days. Scarcity becomes real. Demand tightens.",
    auditReason:
      "The Audit aligns offer architecture, pricing logic, and conversion flow so buyers stop hesitating.",
  },
  system: {
    leakName: "PIPELINE FRICTION",
    humanSymptom: "You're busy… but revenue isn't predictable.",
    whatItMeans:
      "Your path from attention → cash leaks. You might have demand signals, but not a controlled system.",
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
      "You can forecast. You know inputs → outputs. You regain control.",
    auditReason:
      "The Audit maps the exact funnel leak: where prospects drop, why, and what to change first.",
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
      "Create a weekly review: metric → bottleneck → one fix → repeat.",
    ],
    ifYouDont:
      "More tactics, less momentum. Breakthrough stays out of reach.",
    ifYouDo:
      "Decisions become obvious. You build momentum without chaos.",
    auditReason:
      "The Audit identifies what to optimize first so you scale without chaos: signal, offer, or system.",
  },
};

// ------------------------ UTILS ------------------------

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
  const expires = created + 48 * 60 * 60 * 1000;
  const remaining = Math.max(0, expires - now);

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const secs = Math.floor((remaining % (60 * 1000)) / 1000);

  return { hours, mins, secs, expired: remaining === 0 };
}

// ------------------------ UI ATOMS ------------------------

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="qbg">
      <style>{CSS}</style>

      <div className="wrap">
        <div className="main">{children}</div>

        <div className="footer">
          <span className="footerTag">QTMBG</span>
          <span className="muted">
            Signal OS is a scan — not a full audit. Use it to convert insight into action.
          </span>
        </div>
      </div>
    </div>
  );
}

function HeaderMini() {
  return (
    <div className="top">
      <div className="brand">
        <span className="brandBox">QUANTUM BRANDING</span>
        <span className="brandName">Signal OS</span>
      </div>
      <div className="muted tiny">~3 min • 12 questions • primary leak</div>
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
      {children}
      <ArrowRight size={16} />
    </button>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = clamp((current / total) * 100, 0, 100);
  return (
    <div className="progress">
      <div className="progressIn" style={{ width: `${pct}%` }} />
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

// ------------------------ MAIN PAGE ------------------------

export default function Page() {
  const total = QUESTIONS.length;

  const DEFAULT_STATE: State = {
    stage: "launch",
    view: "start",
    idx: 0,
    createdAtISO: new Date().toISOString(),
    responses: Array.from({ length: total }, () => null),
    ahaMask: 0,
    ahaKind: "early",
    email: "",
    name: "",
    website: "",
  };

  const [state, setState] = useState<State>(DEFAULT_STATE);

  // hydrate from localStorage
  useEffect(() => {
    const loaded = loadStateSafe();
    if (loaded && Array.isArray(loaded.responses) && loaded.responses.length === total) {
      setState(loaded);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    saveStateSafe(state);
  }, [state]);

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.view, state.idx]);

  const scoresAll = useMemo(() => {
    const buckets: Record<ForceId, number[]> = {
      essence: [],
      identity: [],
      offer: [],
      system: [],
      growth: [],
    };

    for (let i = 0; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      const r = state.responses[i];
      if (r) buckets[q.force].push(pctFromChoice(r));
    }

    const out: Record<ForceId, number> = {
      essence: 0,
      identity: 0,
      offer: 0,
      system: 0,
      growth: 0,
    };

    (Object.keys(out) as ForceId[]).forEach((f) => {
      const arr = buckets[f];
      if (!arr.length) out[f] = 0;
      else out[f] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    });

    return out;
  }, [state.responses]);

  const scoresSoFar = useMemo(() => {
    const buckets: Record<ForceId, number[]> = {
      essence: [],
      identity: [],
      offer: [],
      system: [],
      growth: [],
    };

    for (let i = 0; i < state.idx; i++) {
      const q = QUESTIONS[i];
      const r = state.responses[i];
      if (r) buckets[q.force].push(pctFromChoice(r));
    }

    const out: Record<ForceId, number> = {
      essence: 0,
      identity: 0,
      offer: 0,
      system: 0,
      growth: 0,
    };

    (Object.keys(out) as ForceId[]).forEach((f) => {
      const arr = buckets[f];
      if (!arr.length) out[f] = 0;
      else out[f] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
    });

    return out;
  }, [state.responses, state.idx]);

  const diagnosis = useMemo(() => {
    const pairs = (Object.keys(scoresAll) as ForceId[]).map((k) => [k, scoresAll[k]] as const);
    const sorted = pairs.sort((a, b) => a[1] - b[1]);
    const primary = sorted[0]?.[0] ?? "essence";
    const secondary = sorted[1]?.[0] ?? "identity";
    return { primary, secondary };
  }, [scoresAll]);

  const startScan = () => {
    setState((prev) => ({
      ...prev,
      view: "consent",
      idx: 0,
      responses: Array.from({ length: total }, () => null),
      ahaMask: 0,
      createdAtISO: new Date().toISOString(),
    }));
  };

  const acceptConsent = () => {
    setState((prev) => ({ ...prev, view: "scan", idx: 0 }));
  };

  const pick = (v: Choice) => {
    setState((prev) => {
      const nextResponses = [...prev.responses];
      nextResponses[prev.idx] = v;

      const nextIdx = prev.idx + 1;

      // Checkpoints like the reference quiz:
      // Early checkpoint after Q3 (index becomes 3)
      // Mid checkpoint after Q8 (index becomes 8)
      if (nextIdx === 3 && (prev.ahaMask & 1) === 0) {
        return {
          ...prev,
          responses: nextResponses,
          idx: nextIdx,
          view: "aha",
          ahaKind: "early",
        };
      }
      if (nextIdx === 8 && (prev.ahaMask & 2) === 0) {
        return {
          ...prev,
          responses: nextResponses,
          idx: nextIdx,
          view: "aha",
          ahaKind: "mid",
        };
      }

      if (nextIdx >= total) {
        return { ...prev, responses: nextResponses, idx: total, view: "result" };
      }

      return { ...prev, responses: nextResponses, idx: nextIdx };
    });
  };

  const continueFromAha = () => {
    setState((prev) => {
      const bit = prev.ahaKind === "early" ? 1 : 2;
      return { ...prev, view: "scan", ahaMask: prev.ahaMask | bit };
    });
  };

  const goBack = () => {
    setState((prev) => ({ ...prev, idx: Math.max(0, prev.idx - 1) }));
  };

  const restart = () => {
    try {
      if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState({
      ...DEFAULT_STATE,
      createdAtISO: new Date().toISOString(),
      responses: Array.from({ length: total }, () => null),
    });
  };

  const toEmail = () => setState((prev) => ({ ...prev, view: "email" }));

  const submitEmail = () => {
    console.log("Email capture:", { email: state.email, name: state.name, website: state.website });
    alert(`Thanks ${state.name || "there"}! You'll get the breakdown by email.`);
    setState((prev) => ({ ...prev, view: "result" }));
  };

  const toAudit = () => {
    const params = new URLSearchParams({
      from: "signal",
      stage: state.stage,
      primary: diagnosis.primary,
      secondary: diagnosis.secondary,
      scores: (Object.keys(scoresAll) as ForceId[]).map((k) => `${k}-${scoresAll[k]}`).join(","),
      ...(state.name && { name: state.name }),
      ...(state.email && { email: state.email }),
      ...(state.website && { website: state.website }),
    });

    if (typeof window !== "undefined") {
      window.location.href = `https://audit.qtmbg.com/?${params.toString()}`;
    }
  };

  const copySummary = async () => {
    const { primary } = diagnosis;
    const primaryInfo = LEAKS[primary];
    const text =
      `QTMBG — Signal OS\n` +
      `Stage: ${state.stage}\n` +
      `Primary leak: ${primaryInfo.leakName}\n` +
      `${primaryInfo.humanSymptom}\n\n` +
      `Today move: ${primaryInfo.todayMove}\n`;

    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        alert("Copied.");
      } else {
        alert("Copy not supported on this device.");
      }
    } catch {
      alert("Copy failed.");
    }
  };

  // ------------------------ VIEWS ------------------------

  if (state.view === "start") {
    return (
      <AppShell>
        <HeaderMini />

        <div className="hero">
          <div className="kicker center">SIGNAL SCAN</div>
          <div className="h1 center">Find the one thing weakening your brand right now.</div>
          <div className="sub center">
            Takes ~3 minutes. 12 questions.
            <br />
            You get your primary leak + the next move.
            <br />
            <b>No email required to see results.</b>
          </div>
        </div>

        <Card>
          <StagePicker value={state.stage} onChange={(s) => setState((p) => ({ ...p, stage: s }))} />

          <div className="ctaRow">
            <Btn variant="primary" onClick={startScan} icon={<Zap size={16} />}>
              Start the scan
            </Btn>
          </div>

          <div className="trust">
            <div className="trustItem">
              <CheckCircle2 size={14} />
              <span>Fast + decisive</span>
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
        </Card>
      </AppShell>
    );
  }

  if (state.view === "consent") {
    return (
      <AppShell>
        <HeaderMini />

        <div className="hero">
          <div className="kicker center">BEFORE YOU START</div>
          <div className="h1 center">This is a scan. Not a diagnosis.</div>
          <div className="sub center">
            Signal OS gives you a directionally accurate read on where your brand leaks.
            <br />
            It does not replace a full audit or strategic work.
          </div>
        </div>

        <Card className="consent">
          <div className="consentGrid">
            <div className="consentItem">
              <div className="consentTitle">What you get</div>
              <ul className="list">
                <li>Your primary leak (the first thing to fix).</li>
                <li>One “today move” and a 7-day micro-plan.</li>
                <li>A score snapshot across the 5 forces.</li>
              </ul>
            </div>

            <div className="consentItem">
              <div className="consentTitle">How it works</div>
              <ul className="list">
                <li>Tap answers. No writing. No friction.</li>
                <li>Your results show instantly.</li>
                <li>Email is optional (only to save/export).</li>
              </ul>
            </div>
          </div>

          <div className="ctaRow">
            <Btn variant="primary" onClick={acceptConsent} icon={<Target size={16} />}>
              Continue
            </Btn>
            <button className="link" type="button" onClick={restart}>
              Reset
            </button>
          </div>

          <div className="tiny muted">
            You can retake anytime. Results expire after 48 hours to keep you in action.
          </div>
        </Card>
      </AppShell>
    );
  }

  if (state.view === "aha") {
    // compute weakest force so far (based on answered questions only)
    const pairs = (Object.keys(scoresSoFar) as ForceId[]).map((k) => [k, scoresSoFar[k]] as const);
    const sorted = pairs.sort((a, b) => a[1] - b[1]);
    const emerging = sorted[0]?.[0] ?? "essence";
    const emergingMeta = FORCES.find((f) => f.id === emerging)!;
    const EmergingIcon = emergingMeta.icon;

    return (
      <AppShell>
        <HeaderMini />

        <Card className="aha">
          <div className="ahaIcon">
            <Target size={32} />
          </div>

          <div className="ahaTitle">
            {state.ahaKind === "early" ? "Pattern emerging." : "Signal is clarifying."}
          </div>

          <div className="ahaText">
            Based on what you’ve answered so far, your most likely leak is in{" "}
            <strong>{emergingMeta.label}</strong>.
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
              "This usually means your mechanism is not named clearly enough for instant trust."}
            {emerging === "identity" &&
              "This usually means your status signal doesn’t match the level you want to charge."}
            {emerging === "offer" &&
              "This usually means there is no single obvious flagship next step."}
            {emerging === "system" &&
              "This usually means leads are inconsistent because the path leaks."}
            {emerging === "growth" &&
              "This usually means you don’t have one metric + rhythm anchoring decisions."}
          </div>

          <div className="ahaQuestion">Sound familiar?</div>

          <div className="ctaRow">
            <Btn variant="primary" onClick={continueFromAha}>
              Yes — keep going
            </Btn>
            <Btn variant="secondary" onClick={continueFromAha}>
              Not sure — keep going
            </Btn>
          </div>

          <div className="tiny muted">
            This is a checkpoint reveal (like a real diagnostic). Next questions confirm or correct it.
          </div>
        </Card>
      </AppShell>
    );
  }

  if (state.view === "scan") {
    const safeIdx = clamp(state.idx, 0, total - 1);
    const q = QUESTIONS[safeIdx];
    const forceMeta = FORCES.find((f) => f.id === q.force)!;
    const Icon = forceMeta.icon;

    return (
      <AppShell>
        <HeaderMini />

        <div className="scanHead">
          <div className="scanLeft">
            <div className="kicker">
              Question {safeIdx + 1} / {total}
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
            <button className="link" type="button" onClick={goBack} disabled={safeIdx === 0}>
              Back
            </button>
          </div>
        </div>

        <ProgressBar current={safeIdx + 1} total={total} />

        <Card>
          <div className="qText">{q.text}</div>

          <div className="choices">
            <button className="choice" type="button" onClick={() => pick(q.a.v)}>
              <div className="choiceDot">
                <CircleDashed size={14} />
              </div>
              <div className="choiceText">{q.a.label}</div>
              <ChevronRight size={16} className="chev" />
            </button>

            <button className="choice" type="button" onClick={() => pick(q.b.v)}>
              <div className="choiceDot">
                <CircleDashed size={14} />
              </div>
              <div className="choiceText">{q.b.label}</div>
              <ChevronRight size={16} className="chev" />
            </button>

            <button className="choice" type="button" onClick={() => pick(q.c.v)}>
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

  if (state.view === "email") {
    return (
      <AppShell>
        <HeaderMini />

        <div className="hero">
          <div className="kicker center">EXPORT</div>
          <div className="h1 center">Email the breakdown + keep it.</div>
          <div className="sub center">
            I’ll send your leak analysis, benchmarks, and a clean next-step plan.
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
              placeholder="your@email.com"
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
              onClick={submitEmail}
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

  // RESULT VIEW
  const primary = diagnosis.primary;
  const secondary = diagnosis.secondary;

  const primaryInfo = LEAKS[primary];
  const primaryMeta = FORCES.find((f) => f.id === primary)!;

  const symptoms = MICRO_SYMPTOMS[primary][state.stage];
  const benchmark = BENCHMARKS[primary][state.stage];

  const primaryScore = scoresAll[primary];
  const gap = benchmark.avg - primaryScore;
  const topGap = benchmark.top10 - primaryScore;

  return (
    <AppShell>
      <HeaderMini />

      <DecayTimer createdAt={state.createdAtISO} />

      {/* Shareable hero card */}
      <Card className="shareCard">
        <div className="shareTop">
          <div>
            <div className="kicker">YOUR PRIMARY LEAK</div>
            <div className="h2">{primaryInfo.leakName}</div>
            <div className="shareSub">{primaryInfo.humanSymptom}</div>
          </div>

          <button className="copyBtn" type="button" onClick={copySummary} title="Copy summary">
            <Copy size={16} />
            Copy
          </button>
        </div>

        <div className="shareMeta">
          <div className="metaPill">
            <span className="metaLabel">STAGE</span>
            <span className="metaValue">{state.stage.toUpperCase()}</span>
          </div>
          <div className="metaPill">
            <span className="metaLabel">WEAKEST FORCE</span>
            <span className="metaValue">{primaryMeta.label}</span>
          </div>
          <div className="metaPill">
            <span className="metaLabel">SCORE</span>
            <span className="metaValue">{primaryScore}</span>
          </div>
        </div>
      </Card>

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
              Signal tells you where you leak. The Audit is where we build decisions + assets you can execute.
            </div>
          </div>

          <div className="panel soft">
            <div className="panelTitle">Signal snapshot</div>
            <div className="bars">
              {(Object.keys(scoresAll) as ForceId[]).map((f) => {
                const meta = FORCES.find((x) => x.id === f)!;
                const pct = scoresAll[f];
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

            <div className="panelTitle mt">Next step options</div>
            <div className="panelText small">{primaryInfo.auditReason}</div>

            <div className="commitLadder">
              <button className="commitStep" type="button" onClick={toEmail}>
                <div className="commitIcon">
                  <Send size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Email me the deeper breakdown</div>
                  <div className="commitSub">Free • Save this analysis</div>
                </div>
                <ChevronRight size={18} />
              </button>

              <button className="commitStep" type="button" onClick={toAudit}>
                <div className="commitIcon">
                  <TrendingUp size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Run the full Brand Audit</div>
                  <div className="commitSub">Diagnosis + fix plan + implementation</div>
                </div>
                <ArrowRight size={18} />
              </button>
            </div>

            <button className="link" type="button" onClick={restart}>
              New scan
            </button>

            <div className="tiny muted mt">
              We pass your leak + scores into the Audit so you don’t start from zero.
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
  --bg: #ffffff;          /* pure white */
  --paper: #ffffff;
  --ink: #0a0a0a;
  --muted: #6f6f6f;
  --line: rgba(10,10,10,.06);   /* notebook ruled lines */
  --margin: rgba(10,10,10,.10); /* margin line */
}

*{margin:0;padding:0;box-sizing:border-box;}

.qbg{
  min-height:100vh;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Sometype Mono', ui-monospace, monospace;
  line-height:1.55;
  display:flex;

  /* notebook stripes */
  background-image:
    repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 28px,
      var(--line) 29px
    ),
    linear-gradient(
      to right,
      transparent 0px,
      transparent 84px,
      var(--margin) 84px,
      var(--margin) 86px,
      transparent 86px
    );
}

.wrap{
  width:100%;
  max-width: 1100px;
  margin: 0 auto;
  padding: 26px 20px 22px;
  display:flex;
  flex-direction:column;
  flex:1;
}

.main{ flex:1; }

.top{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:16px;
  padding-bottom: 18px;
  border-bottom:2px solid var(--ink);
  margin-bottom: 22px;
}

.brand{
  display:flex;
  align-items:center;
  gap:12px;
}

.brandBox{
  border:2px solid var(--ink);
  padding:8px 12px;
  font-size:10px;
  letter-spacing:.22em;
  text-transform:uppercase;
  font-weight:700;
  background: var(--ink);
  color: #ffffff;
}

.brandName{
  font-size:16px;
  letter-spacing:.02em;
  font-weight:500;
}

.muted{ color: var(--muted); }
.tiny{ font-size:12px; line-height:1.4; }
.small{ font-size:13px; line-height:1.55; }

.hero{
  padding: 18px 0 16px;
  max-width: 980px;
  margin: 0 auto;
  text-align:center;
}

.center{ text-align:center; }

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

.h2{
  font-size: clamp(26px, 3.2vw, 44px);
  line-height: 1.06;
  letter-spacing: -0.02em;
  font-weight: 800;
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
  background: var(--paper);
  margin-bottom:16px;
}

.card.aha{ background: var(--paper); }

.card.symptoms{
  background: rgba(255,255,255,.92);
}

.grid2{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:16px;
}

@media (max-width: 720px){
  .grid2{ grid-template-columns: 1fr; }
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

.stageGrid{
  display:grid;
  grid-template-columns: 1fr;
  gap:12px;
}

.stage{
  border:2px solid var(--ink);
  padding:16px;
  text-align:left;
  background: var(--paper);
  transition: all .18s cubic-bezier(.4,0,.2,1);
  cursor:pointer;
  font-family: 'Sometype Mono', ui-monospace, monospace;
}

.stage:hover{ transform: translateY(-2px); }

.stage.active{
  background: var(--ink);
  color: #ffffff;
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
}

.btn.primary{
  background: var(--ink);
  color: #ffffff;
}

.btn.primary:hover{ transform: translateY(-2px); }

.btn.secondary{
  background: var(--paper);
  color: var(--ink);
}

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

.ctaRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:16px;
  margin-top: 8px;
  flex-wrap:wrap;
}

.trust{
  display:flex;
  gap:18px;
  margin-top:18px;
  flex-wrap:wrap;
}

.trustItem{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:12px;
  color: rgba(10,10,10,.75);
}

.scanHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  margin-bottom: 12px;
}

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

.progress{
  width:100%;
  height:3px;
  background: rgba(10,10,10,.2);
  margin-bottom: 18px;
  overflow:hidden;
}

.progressIn{
  height:3px;
  background: var(--ink);
  transition: width .25s cubic-bezier(.4,0,.2,1);
}

.qText{
  font-size: 22px;
  line-height: 1.35;
  letter-spacing: -0.01em;
  font-weight: 600;
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
  background: var(--paper);
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
  background: rgba(255,255,255,.96);
  border:2px solid var(--ink);
  margin-bottom:14px;
  font-size:12px;
  color: rgba(10,10,10,.75);
}

.timer.expired{
  background: var(--ink);
  color: #ffffff;
}

.timer strong{ color: var(--ink); font-weight:800; }
.timer.expired strong{ color: #ffffff; }

.ahaIcon{
  margin:0 auto 18px;
  width:64px;
  height:64px;
  border:2px solid var(--ink);
  display:flex;
  align-items:center;
  justify-content:center;
}

.ahaTitle{
  font-size:28px;
  font-weight:800;
  margin-bottom:14px;
}

.ahaText{
  font-size:15px;
  line-height:1.65;
  color: rgba(10,10,10,.78);
  margin-bottom:18px;
  max-width:640px;
  margin-left:auto;
  margin-right:auto;
}

.ahaForce{
  display:inline-flex;
  gap:12px;
  align-items:center;
  padding:12px 14px;
  border:2px solid var(--ink);
  background: var(--paper);
  margin-bottom:16px;
}

.ahaForceName{ font-weight:800; letter-spacing:.12em; }

.ahaHint{
  font-size:14px;
  line-height:1.55;
  color: rgba(10,10,10,.68);
  margin-bottom:14px;
  max-width:620px;
  margin-left:auto;
  margin-right:auto;
}

.ahaQuestion{
  font-size:18px;
  font-weight:700;
  margin:18px 0 16px;
}

.symptomsTitle{
  font-size:12px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(10,10,10,.68);
  font-weight:800;
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
  background: var(--paper);
}

.panel.soft{
  background: rgba(255,255,255,.92);
}

.panelTitle{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(10,10,10,.65);
  font-weight:800;
  margin-bottom:10px;
}

.panelText{
  font-size:14px;
  line-height:1.65;
  color: rgba(10,10,10,.78);
}

.panelText.strong{
  font-weight:800;
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
  background: rgba(255,255,255,.85);
  border:2px solid rgba(10,10,10,.25);
  margin-bottom:12px;
}

.benchRow{
  display:flex;
  justify-content:space-between;
  align-items:center;
  font-size:13px;
}

.benchRow.strong{
  font-weight:800;
  padding-top:8px;
  border-top:1px solid rgba(10,10,10,.2);
}

.benchLabel{ color: rgba(10,10,10,.62); }
.benchValue{ font-weight:800; font-size:16px; color: var(--ink); }

.outcomes{
  margin-top:18px;
  display:flex;
  flex-direction:column;
  gap:12px;
}

.outcome{
  padding:14px;
  border:2px solid rgba(10,10,10,.35);
  background: rgba(255,255,255,.90);
}

.outcomeLabel{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  margin-bottom:8px;
  font-weight:800;
  color: rgba(10,10,10,.65);
}

.outcomeText{
  font-size:13px;
  line-height:1.55;
  color: rgba(10,10,10,.78);
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
  font-weight:800;
  color: var(--ink);
}

.tag{
  font-size:9px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(10,10,10,.45);
  font-weight:800;
}

.tagHard{
  color: #ffffff;
  background: var(--ink);
  padding:4px 8px;
  border:2px solid var(--ink);
}

.tagWarn{
  color: var(--ink);
  background: rgba(10,10,10,.08);
  padding:4px 8px;
  border:2px solid rgba(10,10,10,.25);
}

.barWrap{
  position:relative;
  border:2px solid var(--ink);
  height: 26px;
  background: rgba(255,255,255,.95);
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
  color: #ffffff;
  font-weight:800;
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
  border:2px solid rgba(10,10,10,.35);
  background: rgba(255,255,255,.95);
  cursor:pointer;
  transition: all .18s cubic-bezier(.4,0,.2,1);
  text-align:left;
  font-family: 'Sometype Mono', ui-monospace, monospace;
}

.commitStep:hover{
  transform: translateY(-2px);
  border-color: var(--ink);
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
.commitTitle{ font-weight:800; font-size:14px; margin-bottom:4px; }
.commitSub{ font-size:11px; color: rgba(10,10,10,.55); }

.footer{
  margin-top: 18px;
  padding-top: 14px;
  border-top:2px solid var(--ink);
  display:flex;
  align-items:center;
  gap:12px;
}

.footerTag{
  border:2px solid var(--ink);
  padding:6px 10px;
  font-size:10px;
  letter-spacing:.22em;
  text-transform:uppercase;
  font-weight:800;
  background: var(--ink);
  color: #ffffff;
}

/* Consent layout */
.consentGrid{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:18px;
  margin-bottom: 10px;
}
@media (max-width: 780px){
  .consentGrid{ grid-template-columns: 1fr; }
}
.consentTitle{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(10,10,10,.65);
  font-weight:800;
  margin-bottom:10px;
}

/* Shareable card */
.shareCard{
  background: #ffffff;
}
.shareTop{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
}
.shareSub{
  margin-top:10px;
  font-size:14px;
  line-height:1.6;
  color: rgba(10,10,10,.75);
  max-width: 760px;
}
.copyBtn{
  display:inline-flex;
  align-items:center;
  gap:10px;
  border:2px solid var(--ink);
  padding:10px 12px;
  background:#fff;
  cursor:pointer;
  font-family: 'Sometype Mono', ui-monospace, monospace;
  font-size:11px;
  letter-spacing:.18em;
  text-transform:uppercase;
  font-weight:800;
  transition: all .18s cubic-bezier(.4,0,.2,1);
}
.copyBtn:hover{ transform: translateY(-2px); }

.shareMeta{
  margin-top:14px;
  display:flex;
  gap:10px;
  flex-wrap:wrap;
}
.metaPill{
  border:2px solid rgba(10,10,10,.35);
  padding:10px 12px;
  background: rgba(255,255,255,.95);
  display:flex;
  gap:10px;
  align-items:center;
}
.metaLabel{
  font-size:10px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(10,10,10,.55);
  font-weight:800;
}
.metaValue{
  font-size:12px;
  font-weight:800;
  color: var(--ink);
}

/* Mobile tweaks */
@media (max-width: 640px){
  .wrap{ padding:20px 16px 18px; }
  .top{ flex-direction:column; align-items:flex-start; }
  .hero{ padding:14px 0 12px; }
  .card{ padding:16px; }
  .ctaRow{ flex-direction:column; align-items:stretch; }
  .trust{ flex-direction:column; gap:10px; }
  .shareTop{ flex-direction:column; }
  .copyBtn{ width: 100%; justify-content:center; }
  /* remove margin line on very small screens */
  .qbg{
    background-image:
      repeating-linear-gradient(
        to bottom,
        transparent 0px,
        transparent 26px,
        var(--line) 27px
      );
  }
}
` as const;
