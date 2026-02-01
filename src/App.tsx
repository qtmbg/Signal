import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock,
  Copy,
  Send,
  Target,
  TrendingUp,
  Zap,
  ShieldAlert,
  Layers,
  Cpu,
  Activity,
} from "lucide-react";

/**
 * QTMBG — Signal OS (vFinal)
 * - Strict TS (Vercel-safe)
 * - Single typography: Sometype Mono (head + body)
 * - True white notebook paper background (no beige)
 * - Consistent grid/padding/borders across ALL views
 * - 12 questions, per-force averaging
 */

type ForceId = "essence" | "identity" | "offer" | "system" | "growth";
type StageId = "launch" | "reposition" | "scale";
type Choice = 1 | 3 | 5;

type Question = {
  id: string;
  force: ForceId;
  text: string;
  a: { v: Choice; label: string };
  b: { v: Choice; label: string };
  c: { v: Choice; label: string };
};

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

type View = "start" | "preface" | "scan" | "aha" | "result" | "email";

type State = {
  stage: StageId;
  view: View;
  qIndex: number;
  answers: Record<string, Choice>; // key = question.id
  createdAtISO: string;
  ahaShown: boolean;
  name: string;
  email: string;
  website: string;
};

const STORAGE_KEY = "qtmbg-signal-os-final";

const FORCES: Array<{
  id: ForceId;
  label: string;
  micro: string;
  icon: React.ComponentType<{ size?: number }>;
}> = [
  { id: "essence", label: "ESSENCE", micro: "What you really stand for", icon: Zap },
  { id: "identity", label: "IDENTITY", micro: "How you are perceived", icon: ShieldAlert },
  { id: "offer", label: "OFFER", micro: "What people buy + why", icon: Layers },
  { id: "system", label: "SYSTEM", micro: "How leads become cash", icon: Cpu },
  { id: "growth", label: "GROWTH", micro: "How it scales without chaos", icon: Activity },
];

const STAGES: Array<{ id: StageId; label: string; sub: string }> = [
  { id: "launch", label: "Launching", sub: "Building first demand + first offers" },
  { id: "reposition", label: "Repositioning", sub: "Good product, unclear signal or audience" },
  { id: "scale", label: "Scaling", sub: "You need throughput, not more hustle" },
];

// 12 questions (balanced, fast, non-annoying)
const QUESTIONS: Question[] = [
  // ESSENCE (3)
  {
    id: "e1",
    force: "essence",
    text: "If I land on your brand today… do I understand the *unique mechanism* you bring?",
    a: { v: 1, label: "No — it sounds like generic services." },
    b: { v: 3, label: "Somewhat — but it isn’t named or sharp." },
    c: { v: 5, label: "Yes — specific, named, repeatable." },
  },
  {
    id: "e2",
    force: "essence",
    text: "Could a stranger repeat your positioning in one sentence after 10 seconds?",
    a: { v: 1, label: "No — they would improvise it." },
    b: { v: 3, label: "Maybe — with some explaining." },
    c: { v: 5, label: "Yes — it’s obvious + sticky." },
  },
  {
    id: "e3",
    force: "essence",
    text: "Do you have one belief that clearly separates you from competitors?",
    a: { v: 1, label: "No — I try to be agreeable." },
    b: { v: 3, label: "Some — but I don’t own it publicly." },
    c: { v: 5, label: "Yes — it’s clear + consistent." },
  },

  // IDENTITY (3)
  {
    id: "i1",
    force: "identity",
    text: "Do you look and sound like a premium authority in your space?",
    a: { v: 1, label: "Not yet — it feels inconsistent or template." },
    b: { v: 3, label: "Clean — but not memorable or high-status." },
    c: { v: 5, label: "Yes — instantly premium + distinct." },
  },
  {
    id: "i2",
    force: "identity",
    text: "Does your homepage communicate credibility *before* the visitor thinks?",
    a: { v: 1, label: "No — it requires effort to trust." },
    b: { v: 3, label: "Some — but the proof is light." },
    c: { v: 5, label: "Yes — proof is immediate." },
  },
  {
    id: "i3",
    force: "identity",
    text: "Do you have one signature element that repeats across touchpoints?",
    a: { v: 1, label: "No — it changes depending on the platform." },
    b: { v: 3, label: "A bit — but not systemized." },
    c: { v: 5, label: "Yes — it’s unmistakably mine." },
  },

  // OFFER (2)
  {
    id: "o1",
    force: "offer",
    text: "Is your flagship offer obvious and easy to choose?",
    a: { v: 1, label: "No — it’s custom, confusing, or too many options." },
    b: { v: 3, label: "Kind of — but people hesitate or negotiate." },
    c: { v: 5, label: "Yes — one clear path with clean pricing." },
  },
  {
    id: "o2",
    force: "offer",
    text: "Can a buyer self-qualify in 10 seconds (for / not for / next step)?",
    a: { v: 1, label: "No — they need a call to understand." },
    b: { v: 3, label: "Some — but it’s still fuzzy." },
    c: { v: 5, label: "Yes — it’s binary + clear." },
  },

  // SYSTEM (2)
  {
    id: "s1",
    force: "system",
    text: "Is lead flow predictable and controlled (not luck-based)?",
    a: { v: 1, label: "No — feast/famine + manual chasing." },
    b: { v: 3, label: "Some — referrals + occasional wins." },
    c: { v: 5, label: "Yes — repeatable pipeline + nurture." },
  },
  {
    id: "s2",
    force: "system",
    text: "Do you have a single ‘happy path’ from viewer → lead → cash?",
    a: { v: 1, label: "No — it’s improvised each time." },
    b: { v: 3, label: "A bit — but it leaks." },
    c: { v: 5, label: "Yes — clear steps + filters." },
  },

  // GROWTH (2)
  {
    id: "g1",
    force: "growth",
    text: "Do you have one metric you track weekly that predicts revenue?",
    a: { v: 1, label: "No — I react to urgency + bank balance." },
    b: { v: 3, label: "Some — I track revenue, not leading signals." },
    c: { v: 5, label: "Yes — one north star + weekly review." },
  },
  {
    id: "g2",
    force: "growth",
    text: "Can you scale output without doubling chaos or working hours?",
    a: { v: 1, label: "No — scaling means stress." },
    b: { v: 3, label: "Some — but it breaks under load." },
    c: { v: 5, label: "Yes — throughput increases without burnout." },
  },
];

const MICRO_SYMPTOMS: Record<ForceId, Record<StageId, string[]>> = {
  essence: {
    launch: [
      "Calls turn into 'so what exactly do you do?' interrogations",
      "You keep rewriting your homepage because it never feels sharp",
      "You explain yourself differently depending on who’s asking",
    ],
    reposition: [
      "Referrals describe you differently than you describe yourself",
      "Your best clients came from an angle you haven’t fully owned",
      "Competitors with worse work charge more because their signal is clearer",
    ],
    scale: [
      "Your team can’t articulate what makes you different",
      "Sales defaults to features instead of a named mechanism",
      "Expansion feels risky because the core story isn’t transferable",
    ],
  },
  identity: {
    launch: [
      "You hesitate to share your website with strong prospects",
      "Your visuals feel 'good enough' but not investment-grade",
      "People compliment your work but don’t see premium authority yet",
    ],
    reposition: [
      "You’ve outgrown your identity but haven’t updated it",
      "Prospects negotiate because you don’t look expensive",
      "You feel like a premium operator in a mid-tier wrapper",
    ],
    scale: [
      "Your brand doesn’t match the deal size you want to close",
      "Enterprise hesitates because you don’t look enterprise",
      "Partnerships wobble due to perceived mismatch",
    ],
  },
  offer: {
    launch: [
      "People like you but say 'let me think about it' and disappear",
      "You do custom proposals for every deal",
      "Pricing turns into negotiation too often",
    ],
    reposition: [
      "Too many offers create decision paralysis",
      "Your best clients bought something you don’t want to sell anymore",
      "Revenue exists but you don’t know what to double down on",
    ],
    scale: [
      "Offer architecture is hard to explain to your team",
      "Upsell/cross-sell happens by accident",
      "The buying path isn’t obvious, so money leaks",
    ],
  },
  system: {
    launch: [
      "You’re busy but revenue isn’t predictable",
      "Leads come from hustle, not a machine",
      "Follow-up is inconsistent because everything is manual",
    ],
    reposition: [
      "You get attention but conversions are low",
      "Leads leak between interest and purchase",
      "Your CRM is messy (or doesn’t exist)",
    ],
    scale: [
      "The system lives in your head",
      "Lead quality is inconsistent",
      "Pipeline is full but close rate drops as you grow",
    ],
  },
  growth: {
    launch: [
      "Every month feels like starting from zero",
      "You chase tactics because direction isn’t anchored",
      "You react instead of lead",
    ],
    reposition: [
      "Direction changes week to week",
      "Growth happens in spurts, not consistently",
      "You track revenue but not the signals that predict it",
    ],
    scale: [
      "Scaling feels chaotic and exhausting",
      "Adding people/budget doesn’t reliably increase output",
      "You can’t name the one bottleneck slowing everything down",
    ],
  },
};

const LEAKS: Record<ForceId, LeakInfo> = {
  essence: {
    leakName: "BLURRY MECHANISM",
    humanSymptom: `People say: "Interesting… but what exactly do you do?"`,
    whatItMeans:
      "Your work may be strong, but the signal is noisy. If the mechanism isn’t named and repeatable, trust stays slow and price stays fragile.",
    todayMove:
      `Write ONE sentence and place it on your hero + bio: "I help [WHO] get [OUTCOME] using [MECHANISM] in [TIME]."`,
    weekPlan: [
      "Name the mechanism (2–4 words).",
      "Rewrite hero: Outcome + Mechanism + Proof + One CTA.",
      "Publish one belief you own (a clear ‘this, not that’).",
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
    humanSymptom: "You’re good, but you don’t *look* expensive yet.",
    whatItMeans:
      "Your visual + verbal identity isn’t matching the level you want to charge. This creates negotiation and doubt.",
    todayMove:
      "Remove safe language. Replace with proof: constraints, outcomes, and one bold line you truly believe.",
    weekPlan: [
      "Pick one signature element and repeat it everywhere.",
      "Write one ‘truth post’ that explains your model.",
      "Upgrade homepage + offer page + one case study page.",
    ],
    ifYouDont:
      "You keep justifying your price and attracting comparison shoppers.",
    ifYouDo:
      "Price objections drop. Prospects assume premium before the call.",
    auditReason:
      "The Audit identifies credibility gaps and builds a concrete proof + messaging hierarchy.",
  },
  offer: {
    leakName: "VALUE CONFUSION",
    humanSymptom: "People like you… but don’t buy fast.",
    whatItMeans:
      "You don’t have one obvious flagship path. Too many options or too much custom creates decision paralysis.",
    todayMove:
      `Write: "This is for X. You get Y by Z. If you’re not X, don’t apply."`,
    weekPlan: [
      "Collapse to: 1 flagship + 1 entry (or ascension) step.",
      "Rewrite pricing section: one path, one CTA.",
      "Publish one teardown showing before → after via your offer.",
    ],
    ifYouDont:
      "You keep doing custom proposals and slow ‘thinking’ cycles.",
    ifYouDo:
      "Decision time compresses. Close rate rises. Scarcity becomes real.",
    auditReason:
      "The Audit aligns offer architecture, pricing logic, and conversion flow so buyers stop hesitating.",
  },
  system: {
    leakName: "PIPELINE FRICTION",
    humanSymptom: "You’re always busy… but revenue isn’t predictable.",
    whatItMeans:
      "Your conversion system leaks. You may have attention, but not a controlled path from lead to cash.",
    todayMove:
      "Write your happy path in 6 steps: Viewer → Lead → Call → Close → Onboard → Referral.",
    weekPlan: [
      "Install one capture + one follow-up email.",
      "Add one booking filter to repel bad fits.",
      "Create one weekly nurture loop: proof + CTA.",
    ],
    ifYouDont:
      "Growth stays random. You work harder to feel safe.",
    ifYouDo:
      "You can forecast revenue. The machine becomes visible and improvable.",
    auditReason:
      "The Audit maps the exact funnel leak: where prospects drop, why, and what to change first.",
  },
  growth: {
    leakName: "NO NORTH STAR",
    humanSymptom: "Direction keeps changing, even though effort is high.",
    whatItMeans:
      "Without one metric + rhythm, growth becomes emotional and chaotic.",
    todayMove:
      "Pick ONE metric for 30 days (qualified leads/week, close rate, or LTV). Review weekly on the same day.",
    weekPlan: [
      "Choose one channel to dominate for 30 days.",
      "Install one referral trigger at the ‘first win’ moment.",
      "Run a weekly review: metric → bottleneck → one fix → repeat.",
    ],
    ifYouDont:
      "You keep chasing tactics and feeling behind.",
    ifYouDo:
      "Decisions become obvious. Growth feels like momentum, not grinding.",
    auditReason:
      "The Audit identifies what to optimize first so you scale without chaos: signal, offer, or system.",
  },
};

// Benchmark numbers are illustrative—keep them stable and consistent
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

const DEFAULT_STATE: State = {
  stage: "launch",
  view: "start",
  qIndex: 0,
  answers: {},
  createdAtISO: new Date().toISOString(),
  ahaShown: false,
  name: "",
  email: "",
  website: "",
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

function safeParseState(raw: string): State | null {
  try {
    const parsed = JSON.parse(raw) as State;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

function useDecayTimer(createdAtISO: string) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const created = new Date(createdAtISO).getTime();
  const expires = created + 48 * 60 * 60 * 1000;
  const remaining = Math.max(0, expires - now);

  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const secs = Math.floor((remaining % (60 * 1000)) / 1000);

  return { hours, mins, secs, expired: remaining === 0 };
}

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <style>{CSS}</style>
      <div className="frame">{children}</div>
      <div className="footer">
        <div className="footerInner">
          <span className="footerBadge">QTMBG</span>
          <span className="footerText">Signal OS is a scan — not a full audit. Use it to convert insight into action.</span>
        </div>
      </div>
    </div>
  );
}

function TopBar({ rightText }: { rightText: string }) {
  return (
    <div className="topbar">
      <div className="brandRow">
        <div className="brandBadge">QUANTUM BRANDING</div>
        <div className="brandTitle">Signal OS</div>
      </div>
      <div className="topbarRight">{rightText}</div>
    </div>
  );
}

function PaperBlock({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`paper ${className}`}>{children}</div>;
}

function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "ghost";
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
      {icon ? <span className="btnIcon">{icon}</span> : null}
      <span className="btnText">{children}</span>
      <ArrowRight size={16} />
    </button>
  );
}

function LinkBtn({ children, onClick, disabled }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" className={`linkBtn ${disabled ? "disabled" : ""}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function StagePicker({ value, onChange }: { value: StageId; onChange: (s: StageId) => void }) {
  return (
    <div className="stack">
      <div className="label">YOUR SITUATION <span className="req">*</span></div>
      <div className="stageList">
        {STAGES.map((s) => {
          const active = value === s.id;
          return (
            <button key={s.id} type="button" className={`stage ${active ? "active" : ""}`} onClick={() => onChange(s.id)}>
              <div className="stageHead">{s.label}</div>
              <div className="muted">{s.sub}</div>
            </button>
          );
        })}
      </div>
    </div>
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

function TimerStrip({ createdAtISO }: { createdAtISO: string }) {
  const { hours, mins, secs, expired } = useDecayTimer(createdAtISO);

  return (
    <div className={`timerStrip ${expired ? "expired" : ""}`}>
      <div className="timerLeft">
        <Clock size={16} />
        <span className="muted">Insights expire in</span>
      </div>
      <div className="timerRight">
        {expired ? (
          <span className="timerExpired">Expired</span>
        ) : (
          <span className="timerTime">
            {hours.toString().padStart(2, "0")}:{mins.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
          </span>
        )}
      </div>
    </div>
  );
}

function computeForceAverages(answers: Record<string, Choice>) {
  const groups: Record<ForceId, number[]> = {
    essence: [],
    identity: [],
    offer: [],
    system: [],
    growth: [],
  };

  for (const q of QUESTIONS) {
    const v = answers[q.id];
    if (v) groups[q.force].push(pctFromChoice(v));
  }

  const scores: Record<ForceId, number> = {
    essence: 0,
    identity: 0,
    offer: 0,
    system: 0,
    growth: 0,
  };

  (Object.keys(groups) as ForceId[]).forEach((f) => {
    const arr = groups[f];
    if (!arr.length) scores[f] = 0;
    else scores[f] = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
  });

  return scores;
}

function sortForcesByWeakest(scores: Record<ForceId, number>) {
  const pairs = (Object.keys(scores) as ForceId[]).map((k) => [k, scores[k]] as const);
  return pairs.sort((a, b) => a[1] - b[1]);
}

function formatResultText(state: State, scores: Record<ForceId, number>, primary: ForceId, secondary: ForceId) {
  const stageLabel = STAGES.find((s) => s.id === state.stage)?.label ?? state.stage;
  const lines = [
    `QTMBG — Signal OS`,
    `Stage: ${stageLabel}`,
    ``,
    `Primary leak: ${LEAKS[primary].leakName} (${primary.toUpperCase()})`,
    `Secondary: ${secondary.toUpperCase()}`,
    ``,
    `Scores:`,
    ...((Object.keys(scores) as ForceId[]).map((f) => `- ${f.toUpperCase()}: ${scores[f]}`)),
    ``,
    `Today move: ${LEAKS[primary].todayMove}`,
    ``,
    `7-day plan:`,
    ...LEAKS[primary].weekPlan.map((w) => `- ${w}`),
  ];
  return lines.join("\n");
}

export default function App() {
  const [state, setState] = useState<State>(DEFAULT_STATE);
  const hydratedRef = useRef(false);

  // Hydrate from localStorage (client-only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = safeParseState(raw);
        if (parsed) setState(parsed);
      }
    } catch {
      // ignore
    } finally {
      hydratedRef.current = true;
    }
  }, []);

  // Persist (only after hydration)
  useEffect(() => {
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state]);

  const total = QUESTIONS.length;

  const scores = useMemo(() => computeForceAverages(state.answers), [state.answers]);

  const diagnosis = useMemo(() => {
    const sorted = sortForcesByWeakest(scores);
    const primary = sorted[0]?.[0] ?? "essence";
    const secondary = sorted[1]?.[0] ?? "identity";
    return { primary, secondary };
  }, [scores]);

  const start = () => {
    setState((p) => ({
      ...p,
      view: "preface",
      qIndex: 0,
      answers: {},
      ahaShown: false,
      createdAtISO: new Date().toISOString(),
    }));
  };

  const resetAll = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState({ ...DEFAULT_STATE, createdAtISO: new Date().toISOString() });
  };

  const beginScan = () => {
    setState((p) => ({ ...p, view: "scan", qIndex: 0 }));
  };

  const goBack = () => {
    setState((p) => ({ ...p, qIndex: Math.max(0, p.qIndex - 1) }));
  };

  const pick = (q: Question, v: Choice) => {
    setState((p) => {
      const nextAnswers = { ...p.answers, [q.id]: v };
      const nextIndex = p.qIndex + 1;

      // AHA after 4 answers (pattern feels “real” but not too early)
      if (!p.ahaShown && nextIndex === 4) {
        return { ...p, answers: nextAnswers, qIndex: nextIndex, view: "aha" };
      }

      if (nextIndex >= total) {
        return { ...p, answers: nextAnswers, qIndex: p.qIndex, view: "result" };
      }

      return { ...p, answers: nextAnswers, qIndex: nextIndex };
    });
  };

  const continueFromAha = () => {
    setState((p) => ({ ...p, view: "scan", ahaShown: true }));
  };

  const toEmail = () => setState((p) => ({ ...p, view: "email" }));

  const submitEmail = () => {
    // wire to your backend later
    // eslint-disable-next-line no-console
    console.log("Signal OS email capture:", { email: state.email, name: state.name, website: state.website });

    alert(`Saved. You’ll receive the breakdown shortly.`);
    setState((p) => ({ ...p, view: "result" }));
  };

  const toAudit = () => {
    const params = new URLSearchParams({
      from: "signal",
      stage: state.stage,
      primary: diagnosis.primary,
      secondary: diagnosis.secondary,
      scores: (Object.keys(scores) as ForceId[]).map((k) => `${k}-${scores[k]}`).join(","),
      ...(state.name ? { name: state.name } : {}),
      ...(state.email ? { email: state.email } : {}),
      ...(state.website ? { website: state.website } : {}),
    });

    window.location.href = `https://audit.qtmbg.com/?${params.toString()}`;
  };

  const copyResult = async () => {
    const txt = formatResultText(state, scores, diagnosis.primary, diagnosis.secondary);
    try {
      await navigator.clipboard.writeText(txt);
      alert("Copied.");
    } catch {
      alert("Copy failed. Your browser may block clipboard access.");
    }
  };

  // -------------------- VIEWS --------------------

  if (state.view === "start") {
    return (
      <AppShell>
        <div className="container">
          <TopBar rightText="~3 min • 12 questions • primary leak" />

          <div className="hero heroCenter">
            <div className="kicker">SIGNAL SCAN</div>
            <h1 className="h1">Find the one thing weakening your brand right now.</h1>
            <p className="sub">
              12 questions. You get your primary leak and the next move.
              <br />
              <span className="subStrong">No email required to see results.</span>
            </p>
          </div>

          <PaperBlock>
            <StagePicker value={state.stage} onChange={(s) => setState((p) => ({ ...p, stage: s }))} />
            <div className="row rowBetween">
              <Button onClick={start} variant="primary" icon={<Zap size={16} />}>
                START THE SCAN
              </Button>
              <div className="trustLine">
                <span className="trustItem"><CheckCircle2 size={14} /> Value first</span>
                <span className="trustItem"><CheckCircle2 size={14} /> Actionable today + this week</span>
                <span className="trustItem"><CheckCircle2 size={14} /> Built for conversion, not trivia</span>
              </div>
            </div>
          </PaperBlock>
        </div>
      </AppShell>
    );
  }

  if (state.view === "preface") {
    return (
      <AppShell>
        <div className="container">
          <TopBar rightText="~3 min • 12 questions • primary leak" />

          <div className="hero heroCenter">
            <div className="kicker">BEFORE YOU START</div>
            <h1 className="h1">This is a scan. Not a diagnosis.</h1>
            <p className="sub">
              Signal OS gives you a directionally accurate read on where your brand leaks.
              <br />
              It does not replace a full audit or strategic work.
            </p>
          </div>

          <PaperBlock className="centerBlock">
            <div className="miniTitle">What you get</div>
            <div className="bullets">
              <div className="bullet"><CheckCircle2 size={16} /> Your primary leak (first thing to fix)</div>
              <div className="bullet"><CheckCircle2 size={16} /> One “today move” + a 7-day micro-plan</div>
              <div className="bullet"><CheckCircle2 size={16} /> A score snapshot across the 5 forces</div>
            </div>

            <div className="divider" />

            <div className="miniTitle">How it works</div>
            <div className="bullets">
              <div className="bullet"><CheckCircle2 size={16} /> Tap answers. No writing. No friction.</div>
              <div className="bullet"><CheckCircle2 size={16} /> Results show instantly.</div>
              <div className="bullet"><CheckCircle2 size={16} /> Email is optional (only to save/export).</div>
            </div>

            <div className="row rowCenter" style={{ marginTop: 18 }}>
              <Button onClick={beginScan} variant="primary" icon={<Target size={16} />}>
                CONTINUE
              </Button>
              <LinkBtn onClick={resetAll}>Reset</LinkBtn>
            </div>

            <div className="fine muted" style={{ marginTop: 10 }}>
              You can retake anytime. Results expire after 48 hours to keep you in action.
            </div>
          </PaperBlock>
        </div>
      </AppShell>
    );
  }

  if (state.view === "aha") {
    const interimScores = computeForceAverages(state.answers);
    const emerging = sortForcesByWeakest(interimScores)[0]?.[0] ?? "essence";
    const meta = FORCES.find((f) => f.id === emerging)!;
    const Icon = meta.icon;

    return (
      <AppShell>
        <div className="container">
          <TopBar rightText="pattern check • confirm next" />

          <PaperBlock className="ahaBlock">
            <div className="ahaHead">
              <div className="ahaIcon">
                <Target size={22} />
              </div>
              <div>
                <div className="kicker">PATTERN DETECTED</div>
                <div className="ahaTitle">A leak is emerging.</div>
              </div>
            </div>

            <div className="ahaRow">
              <div className="ahaForce">
                <Icon size={18} />
                <div>
                  <div className="ahaForceName">{meta.label}</div>
                  <div className="muted">{meta.micro}</div>
                </div>
              </div>

              <div className="ahaHint">
                Based on your first answers, this area is trending weaker. The remaining questions will confirm or correct it.
              </div>
            </div>

            <div className="row rowBetween" style={{ marginTop: 18 }}>
              <Button onClick={continueFromAha} variant="primary">
                YES — CONTINUE
              </Button>
              <Button onClick={continueFromAha} variant="ghost">
                NOT SURE — KEEP GOING
              </Button>
            </div>

            <div className="fine muted" style={{ marginTop: 10 }}>
              This is pattern recognition. Final result is computed after all answers.
            </div>
          </PaperBlock>
        </div>
      </AppShell>
    );
  }

  if (state.view === "scan") {
    const q = QUESTIONS[state.qIndex];
    const forceMeta = FORCES.find((f) => f.id === q.force)!;
    const Icon = forceMeta.icon;

    return (
      <AppShell>
        <div className="container">
          <TopBar rightText={`Question ${state.qIndex + 1} / ${total}`} />

          <div className="scanMeta">
            <div className="scanMetaLeft">
              <div className="kicker">QUESTION {state.qIndex + 1} / {total}</div>
              <div className="forceLine">
                <Icon size={18} />
                <div className="forceText">
                  <div className="forceName">{forceMeta.label}</div>
                  <div className="muted">{forceMeta.micro}</div>
                </div>
              </div>
            </div>

            <div className="scanMetaRight">
              <LinkBtn onClick={goBack} disabled={state.qIndex === 0}>Back</LinkBtn>
            </div>
          </div>

          <ProgressBar current={state.qIndex + 1} total={total} />

          <PaperBlock className="questionBlock">
            <div className="qText">{q.text}</div>

            <div className="choices">
              <button className="choice" type="button" onClick={() => pick(q, q.a.v)}>
                <span className="choiceDot"><CircleDashed size={14} /></span>
                <span className="choiceBody">
                  <span className="choiceLabel">{q.a.label}</span>
                  <span className="choiceScore">1/5</span>
                </span>
                <ChevronRight size={16} />
              </button>

              <button className="choice" type="button" onClick={() => pick(q, q.b.v)}>
                <span className="choiceDot"><CircleDashed size={14} /></span>
                <span className="choiceBody">
                  <span className="choiceLabel">{q.b.label}</span>
                  <span className="choiceScore">3/5</span>
                </span>
                <ChevronRight size={16} />
              </button>

              <button className="choice" type="button" onClick={() => pick(q, q.c.v)}>
                <span className="choiceDot"><CheckCircle2 size={14} /></span>
                <span className="choiceBody">
                  <span className="choiceLabel">{q.c.label}</span>
                  <span className="choiceScore">5/5</span>
                </span>
                <ChevronRight size={16} />
              </button>
            </div>
          </PaperBlock>
        </div>
      </AppShell>
    );
  }

  if (state.view === "email") {
    return (
      <AppShell>
        <div className="container">
          <TopBar rightText="save + export" />

          <div className="hero heroCenter">
            <div className="kicker">SAVE YOUR RESULT</div>
            <h1 className="h1">Email the breakdown to yourself.</h1>
            <p className="sub">Optional. Use this to save/export and receive the full breakdown.</p>
          </div>

          <PaperBlock>
            <div className="grid2">
              <div className="stack">
                <div className="label">EMAIL <span className="req">*</span></div>
                <input
                  className="input"
                  type="email"
                  value={state.email}
                  onChange={(e) => setState((p) => ({ ...p, email: e.target.value }))}
                  placeholder="you@domain.com"
                  autoComplete="email"
                />
              </div>
              <div className="stack">
                <div className="label">NAME (OPTIONAL)</div>
                <input
                  className="input"
                  type="text"
                  value={state.name}
                  onChange={(e) => setState((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="stack" style={{ marginTop: 14 }}>
              <div className="label">WEBSITE (OPTIONAL)</div>
              <input
                className="input"
                type="url"
                value={state.website}
                onChange={(e) => setState((p) => ({ ...p, website: e.target.value }))}
                placeholder="yoursite.com"
                autoComplete="url"
              />
            </div>

            <div className="row rowBetween" style={{ marginTop: 18 }}>
              <Button onClick={submitEmail} disabled={!state.email} icon={<Send size={16} />}>
                EMAIL ME THE BREAKDOWN
              </Button>
              <LinkBtn onClick={() => setState((p) => ({ ...p, view: "result" }))}>Skip</LinkBtn>
            </div>

            <div className="fine muted" style={{ marginTop: 10 }}>No spam. Only the breakdown. Unsubscribe anytime.</div>
          </PaperBlock>
        </div>
      </AppShell>
    );
  }

  // RESULT
  const primary = diagnosis.primary;
  const secondary = diagnosis.secondary;
  const primaryMeta = FORCES.find((f) => f.id === primary)!;
  const primaryInfo = LEAKS[primary];
  const symptoms = MICRO_SYMPTOMS[primary][state.stage];
  const benchmark = BENCHMARKS[primary][state.stage];

  const primaryScore = scores[primary];
  const gapAvg = benchmark.avg - primaryScore;
  const gapTop = benchmark.top10 - primaryScore;

  return (
    <AppShell>
      <div className="container">
        <TopBar rightText="result • primary leak" />

        <TimerStrip createdAtISO={state.createdAtISO} />

        <PaperBlock className="resultHero">
          <div className="kicker">YOUR PRIMARY LEAK</div>
          <div className="resultTitleRow">
            <h1 className="h1 h1Tight">{primaryInfo.leakName}</h1>
            <button className="copyBtn" type="button" onClick={copyResult} title="Copy result">
              <Copy size={16} />
              <span>COPY</span>
            </button>
          </div>
          <div className="sub resultSub">{primaryInfo.humanSymptom}</div>

          <div className="pillRow">
            <div className="pill">
              <div className="pillK">STAGE</div>
              <div className="pillV">{state.stage.toUpperCase()}</div>
            </div>
            <div className="pill">
              <div className="pillK">WEAKEST FORCE</div>
              <div className="pillV">{primaryMeta.label}</div>
            </div>
            <div className="pill">
              <div className="pillK">SCORE</div>
              <div className="pillV">{primaryScore}</div>
            </div>
          </div>
        </PaperBlock>

        <PaperBlock>
          <div className="labelCenter">IF THIS IS TRUE, YOU’LL RECOGNIZE THESE:</div>
          <div className="symList">
            {symptoms.map((s, i) => (
              <div className="symItem" key={i}>
                <CheckCircle2 size={16} />
                <span>{s}</span>
              </div>
            ))}
          </div>
        </PaperBlock>

        <PaperBlock>
          <div className="resultGrid">
            <div className="panel">
              <div className="labelCenter">WHAT THIS MEANS</div>
              <div className="body">{primaryInfo.whatItMeans}</div>

              <div className="spacer" />

              <div className="labelCenter">TODAY MOVE</div>
              <div className="body strong">{primaryInfo.todayMove}</div>

              <div className="spacer" />

              <div className="labelCenter">7-DAY MICRO-PLAN</div>
              <ul className="list">
                {primaryInfo.weekPlan.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>

              <div className="spacer" />

              <div className="miniBox">
                <div className="labelCenter">HOW YOU COMPARE</div>
                <div className="kv">
                  <span className="muted">Your {primaryMeta.label}:</span>
                  <span className="kvStrong">{primaryScore}</span>
                </div>
                <div className="kv">
                  <span className="muted">Stage average:</span>
                  <span className="kvStrong">{benchmark.avg}</span>
                </div>
                <div className="kv">
                  <span className="muted">Top 10%:</span>
                  <span className="kvStrong">{benchmark.top10}</span>
                </div>
                <div className="fine muted" style={{ marginTop: 10 }}>
                  You are <b>{Math.abs(gapAvg)}</b> points {gapAvg < 0 ? "above" : "below"} average and{" "}
                  <b>{Math.abs(gapTop)}</b> points from top-tier.
                </div>
              </div>

              <div className="spacer" />

              <div className="miniBox">
                <div className="labelCenter">IF YOU DON’T FIX THIS</div>
                <div className="fine">{primaryInfo.ifYouDont}</div>
              </div>

              <div className="miniBox" style={{ marginTop: 12 }}>
                <div className="labelCenter">IF YOU DO</div>
                <div className="fine">{primaryInfo.ifYouDo}</div>
              </div>

              <div className="spacer" />

              <div className="fine muted" style={{ textAlign: "center" }}>
                <b>Important:</b> This is a signal scan. Not a full audit.
              </div>
            </div>

            <div className="panel">
              <div className="labelCenter">SIGNAL SNAPSHOT</div>

              <div className="bars">
                {(Object.keys(scores) as ForceId[]).map((f) => {
                  const meta = FORCES.find((x) => x.id === f)!;
                  const pct = scores[f];
                  const isPrimary = f === primary;
                  const isSecondary = f === secondary;

                  const tag = isPrimary ? "PRIMARY LEAK" : isSecondary ? "SECONDARY" : bandLabel(pct);

                  return (
                    <div className="barRow" key={f}>
                      <div className="barHead">
                        <div className="barName">{meta.label}</div>
                        <div className={`tag ${isPrimary ? "tagPrimary" : isSecondary ? "tagSecondary" : ""}`}>
                          {tag}
                        </div>
                      </div>
                      <div className="barTrack">
                        <div className="barFill" style={{ width: `${pct}%` }} />
                        <div className="barVal">{pct}</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="spacer" />

              <div className="labelCenter">NEXT STEP OPTIONS</div>
              <div className="fine muted" style={{ textAlign: "center", marginBottom: 12 }}>
                Pick one. Don’t collect insights. Convert them into action.
              </div>

              <div className="actions">
                <button className="action" type="button" onClick={toEmail}>
                  <div className="actionIcon"><Send size={18} /></div>
                  <div className="actionBody">
                    <div className="actionTitle">Email me the deeper breakdown</div>
                    <div className="muted">Free • Save this analysis</div>
                  </div>
                  <ChevronRight size={18} />
                </button>

                <button className="action" type="button" onClick={toAudit}>
                  <div className="actionIcon"><TrendingUp size={18} /></div>
                  <div className="actionBody">
                    <div className="actionTitle">Book a 15-min leak review</div>
                    <div className="muted">Free • Confirm the leak on your site</div>
                  </div>
                  <ChevronRight size={18} />
                </button>

                <button className="action actionPrimary" type="button" onClick={toAudit}>
                  <div className="actionIcon"><Zap size={18} /></div>
                  <div className="actionBody">
                    <div className="actionTitle">Run the full Brand Audit</div>
                    <div className="muted">Diagnosis + fix plan + implementation</div>
                  </div>
                  <ArrowRight size={18} />
                </button>
              </div>

              <div className="row rowCenter" style={{ marginTop: 14 }}>
                <LinkBtn onClick={resetAll}>New scan</LinkBtn>
              </div>

              <div className="fine muted" style={{ textAlign: "center", marginTop: 10 }}>
                We pass your leak + scores into the Audit so you don’t start from zero.
              </div>
            </div>
          </div>
        </PaperBlock>
      </div>
    </AppShell>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sometype+Mono:wght@400;500;600;700&display=swap');

:root{
  --paper: #ffffff;
  --ink: #0b0b0b;
  --muted: rgba(11,11,11,.62);
  --muted2: rgba(11,11,11,.48);
  --line: rgba(11,11,11,.07);
  --line2: rgba(11,11,11,.05);
  --margin: rgba(220, 60, 60, .18);
  --stroke: rgba(11,11,11,.90);
  --strokeSoft: rgba(11,11,11,.22);
  --shadow: 0 0 0 1px rgba(11,11,11,.12);
  --pad: 24px;
  --padSm: 16px;
  --max: 1040px;
}

*{ box-sizing:border-box; }
html,body{ height:100%; }
body{
  margin:0;
  background: var(--paper);
  color: var(--ink);
  font-family: "Sometype Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
}

.page{
  min-height:100vh;
  display:flex;
  flex-direction:column;
  background-color: var(--paper);
  background-image:
    /* horizontal notebook rules */
    repeating-linear-gradient(
      to bottom,
      var(--line) 0px,
      var(--line) 1px,
      transparent 1px,
      transparent 30px
    ),
    /* subtle vertical grid */
    repeating-linear-gradient(
      to right,
      var(--line2) 0px,
      var(--line2) 1px,
      transparent 1px,
      transparent 120px
    ),
    /* margin line */
    linear-gradient(
      to right,
      transparent 0px,
      transparent 84px,
      var(--margin) 84px,
      var(--margin) 85px,
      transparent 85px
    );
}

.frame{
  flex:1;
  padding: 22px 18px 36px;
}

.container{
  width:100%;
  max-width: var(--max);
  margin: 0 auto;
}

.topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap: 12px;
  padding: 12px 0 14px;
  border-bottom: 2px solid var(--stroke);
}

.brandRow{
  display:flex;
  align-items:center;
  gap: 14px;
}

.brandBadge{
  border: 2px solid var(--stroke);
  background: var(--ink);
  color: var(--paper);
  padding: 8px 12px;
  font-size: 12px;
  letter-spacing: .18em;
  text-transform: uppercase;
  line-height:1;
}

.brandTitle{
  font-size: 18px;
  font-weight: 600;
  letter-spacing: .02em;
}

.topbarRight{
  font-size: 12px;
  color: var(--muted);
  letter-spacing: .02em;
  text-align:right;
}

.hero{
  padding: 28px 0 18px;
}

.heroCenter{
  text-align:center;
}

.kicker{
  font-size: 12px;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
}

.h1{
  margin:0;
  font-size: clamp(34px, 5.4vw, 64px);
  line-height: 1.05;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.h1Tight{
  font-size: clamp(28px, 4.6vw, 56px);
  line-height:1.05;
}

.sub{
  margin: 14px auto 0;
  max-width: 860px;
  font-size: 16px;
  color: var(--muted);
  line-height: 1.6;
}

.subStrong{
  color: var(--ink);
  font-weight: 600;
}

.paper{
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.72);
  box-shadow: var(--shadow);
  padding: var(--pad);
  margin: 14px 0;
}

.centerBlock{
  max-width: 820px;
  margin-left:auto;
  margin-right:auto;
}

.label{
  font-size: 12px;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 10px;
}

.labelCenter{
  font-size: 12px;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 14px;
  text-align:center;
}

.req{ color: var(--ink); font-weight:700; }

.stack{ margin-bottom: 14px; }

.stageList{
  display:flex;
  flex-direction:column;
  gap: 12px;
}

.stage{
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.86);
  text-align:left;
  padding: 16px;
  cursor:pointer;
  transition: transform .12s ease, background .12s ease;
  font-family: inherit;
}

.stage:hover{
  transform: translateY(-1px);
  background: rgba(255,255,255,.98);
}

.stage.active{
  background: var(--ink);
  color: var(--paper);
}

.stage.active .muted{ color: rgba(255,255,255,.68); }

.stageHead{
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.muted{ color: var(--muted); }
.fine{ font-size: 12px; line-height: 1.5; }

.row{
  display:flex;
  gap: 14px;
  align-items:center;
  flex-wrap:wrap;
}
.rowBetween{ justify-content:space-between; }
.rowCenter{ justify-content:center; }

.trustLine{
  display:flex;
  gap: 16px;
  flex-wrap:wrap;
  justify-content:flex-end;
  color: var(--muted);
  font-size: 12px;
}

.trustItem{
  display:inline-flex;
  align-items:center;
  gap: 8px;
  white-space:nowrap;
}

.btn{
  border: 2px solid var(--stroke);
  padding: 14px 16px;
  display:inline-flex;
  align-items:center;
  gap: 10px;
  cursor:pointer;
  background: var(--ink);
  color: var(--paper);
  font-family: inherit;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  font-size: 12px;
  transition: transform .12s ease, background .12s ease, color .12s ease;
}

.btn.primary:hover{ transform: translateY(-1px); }

.btn.ghost{
  background: transparent;
  color: var(--ink);
}

.btn.ghost:hover{
  background: rgba(255,255,255,.9);
  transform: translateY(-1px);
}

.btn.disabled{
  opacity:.4;
  cursor:not-allowed;
}

.btnIcon{ display:inline-flex; }
.btnText{ display:inline-flex; }

.linkBtn{
  border:none;
  background:transparent;
  color: var(--muted);
  text-decoration: underline;
  cursor:pointer;
  font-family: inherit;
  font-size: 12px;
  padding: 10px 6px;
}

.linkBtn:hover{ color: var(--ink); }
.linkBtn.disabled{ opacity:.4; cursor:not-allowed; }

.divider{
  height: 1px;
  background: var(--strokeSoft);
  margin: 16px 0;
}

.bullets{
  display:flex;
  flex-direction:column;
  gap: 10px;
}

.bullet{
  display:flex;
  align-items:flex-start;
  gap: 10px;
  color: var(--muted);
}

.bullet svg{ margin-top: 2px; color: var(--ink); }

.miniTitle{
  text-align:center;
  font-size: 12px;
  letter-spacing: .22em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 12px;
}

.progress{
  width:100%;
  height: 6px;
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.74);
  margin: 12px 0 14px;
}

.progressIn{
  height:100%;
  background: var(--ink);
  transition: width .2s ease;
}

.scanMeta{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 12px;
  margin-top: 18px;
}

.forceLine{
  display:flex;
  align-items:flex-start;
  gap: 10px;
}

.forceText{ display:flex; flex-direction:column; gap:2px; }
.forceName{ font-weight: 800; letter-spacing:.16em; font-size: 14px; }

.questionBlock{
  max-width: 880px;
  margin-left:auto;
  margin-right:auto;
}

.qText{
  font-size: 18px;
  font-weight: 700;
  line-height: 1.35;
  text-align:center;
  margin: 2px 0 18px;
}

.choices{
  display:flex;
  flex-direction:column;
  gap: 12px;
}

.choice{
  width:100%;
  display:flex;
  align-items:center;
  gap: 12px;
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.9);
  padding: 14px 14px;
  cursor:pointer;
  transition: transform .12s ease, background .12s ease;
  text-align:left;
  font-family: inherit;
}

.choice:hover{
  transform: translateY(-1px);
  background: rgba(255,255,255,.98);
}

.choiceDot{
  width: 32px;
  height: 32px;
  border: 2px solid var(--stroke);
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
}

.choiceBody{
  flex:1;
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap: 14px;
}

.choiceLabel{
  color: var(--ink);
  line-height: 1.35;
  font-size: 14px;
}

.choiceScore{
  color: var(--muted);
  font-size: 12px;
  letter-spacing: .08em;
  white-space:nowrap;
}

.timerStrip{
  margin-top: 14px;
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.72);
  box-shadow: var(--shadow);
  padding: 12px 14px;
  display:flex;
  justify-content:space-between;
  align-items:center;
  gap: 10px;
}

.timerLeft{
  display:flex;
  align-items:center;
  gap: 10px;
}

.timerRight{
  font-weight: 800;
  letter-spacing: .12em;
}

.timerTime{ color: var(--ink); }
.timerExpired{ color: rgba(220,60,60,.9); }

.resultHero{
  text-align:center;
}

.resultTitleRow{
  display:flex;
  justify-content:center;
  align-items:center;
  gap: 14px;
  flex-wrap:wrap;
}

.copyBtn{
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.9);
  color: var(--ink);
  font-family: inherit;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  font-size: 12px;
  padding: 12px 14px;
  display:inline-flex;
  align-items:center;
  gap: 10px;
  cursor:pointer;
  transition: transform .12s ease, background .12s ease;
}

.copyBtn:hover{
  transform: translateY(-1px);
  background: rgba(255,255,255,.98);
}

.resultSub{
  margin-top: 10px;
}

.pillRow{
  margin-top: 16px;
  display:flex;
  justify-content:center;
  gap: 10px;
  flex-wrap:wrap;
}

.pill{
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.88);
  padding: 10px 12px;
  min-width: 180px;
  text-align:left;
}

.pillK{
  font-size: 11px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 6px;
}

.pillV{
  font-size: 14px;
  font-weight: 800;
  letter-spacing: .08em;
}

.symList{
  max-width: 860px;
  margin: 0 auto;
  display:flex;
  flex-direction:column;
  gap: 10px;
}

.symItem{
  display:flex;
  gap: 10px;
  align-items:flex-start;
  color: var(--muted);
}

.symItem svg{ margin-top: 2px; color: var(--ink); }

.resultGrid{
  display:grid;
  grid-template-columns: 1.2fr .8fr;
  gap: 14px;
}

.panel{
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.86);
  padding: 16px;
}

.body{
  color: var(--muted);
  font-size: 14px;
  line-height: 1.6;
}

.body.strong{
  color: var(--ink);
  font-weight: 700;
}

.spacer{ height: 14px; }

.list{
  margin: 0;
  padding-left: 18px;
  color: var(--muted);
  line-height: 1.7;
  font-size: 14px;
}

.miniBox{
  border: 2px solid var(--strokeSoft);
  background: rgba(255,255,255,.92);
  padding: 14px;
}

.kv{
  display:flex;
  justify-content:space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--strokeSoft);
}

.kv:last-child{ border-bottom:none; }

.kvStrong{
  font-weight: 800;
  letter-spacing: .08em;
  color: var(--ink);
}

.bars{
  display:flex;
  flex-direction:column;
  gap: 12px;
  margin-top: 12px;
}

.barRow{ display:flex; flex-direction:column; gap: 8px; }

.barHead{
  display:flex;
  justify-content:space-between;
  gap: 10px;
  align-items:center;
}

.barName{
  font-size: 12px;
  letter-spacing: .16em;
  font-weight: 800;
}

.tag{
  font-size: 10px;
  letter-spacing: .18em;
  text-transform: uppercase;
  color: var(--muted);
  border: 1px solid var(--strokeSoft);
  padding: 4px 8px;
  background: rgba(255,255,255,.9);
}

.tagPrimary{
  background: var(--ink);
  color: var(--paper);
  border-color: var(--ink);
}

.tagSecondary{
  border-color: var(--stroke);
  color: var(--ink);
}

.barTrack{
  position:relative;
  border: 2px solid var(--stroke);
  height: 28px;
  background: rgba(255,255,255,.9);
  overflow:hidden;
}

.barFill{
  height:100%;
  background: var(--ink);
  transition: width .35s ease;
}

.barVal{
  position:absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-weight: 800;
  color: var(--paper);
  mix-blend-mode: difference;
  letter-spacing: .06em;
}

.actions{
  display:flex;
  flex-direction:column;
  gap: 12px;
}

.action{
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.92);
  padding: 14px;
  display:flex;
  align-items:center;
  gap: 12px;
  cursor:pointer;
  text-align:left;
  transition: transform .12s ease, background .12s ease;
  font-family: inherit;
}

.action:hover{
  transform: translateY(-1px);
  background: rgba(255,255,255,.98);
}

.actionPrimary{
  background: var(--ink);
  color: var(--paper);
}

.actionPrimary .muted{
  color: rgba(255,255,255,.72);
}

.actionIcon{
  width: 42px;
  height: 42px;
  border: 2px solid currentColor;
  display:flex;
  align-items:center;
  justify-content:center;
  flex-shrink:0;
}

.actionBody{ flex:1; }

.actionTitle{
  font-weight: 800;
  letter-spacing: .02em;
  margin-bottom: 4px;
}

.grid2{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.input{
  width:100%;
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.92);
  padding: 12px 12px;
  font-size: 14px;
  font-family: inherit;
  outline:none;
}

.input:focus{
  box-shadow: 0 0 0 3px rgba(11,11,11,.08);
}

.ahaBlock{
  max-width: 920px;
  margin-left:auto;
  margin-right:auto;
}

.ahaHead{
  display:flex;
  gap: 12px;
  align-items:center;
  justify-content:flex-start;
}

.ahaIcon{
  width: 48px;
  height: 48px;
  border: 2px solid var(--stroke);
  display:flex;
  align-items:center;
  justify-content:center;
  background: rgba(255,255,255,.9);
}

.ahaTitle{
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.01em;
}

.ahaRow{
  margin-top: 14px;
  display:grid;
  grid-template-columns: 320px 1fr;
  gap: 14px;
  align-items:start;
}

.ahaForce{
  border: 2px solid var(--stroke);
  background: rgba(255,255,255,.92);
  padding: 14px;
  display:flex;
  gap: 10px;
  align-items:flex-start;
}

.ahaForceName{
  font-weight: 900;
  letter-spacing: .18em;
  font-size: 13px;
}

.ahaHint{
  border: 2px solid var(--strokeSoft);
  background: rgba(255,255,255,.88);
  padding: 14px;
  color: var(--muted);
  line-height: 1.6;
  font-size: 14px;
}

.footer{
  border-top: 2px solid var(--stroke);
  padding: 14px 18px;
  background: rgba(255,255,255,.72);
}

.footerInner{
  max-width: var(--max);
  margin: 0 auto;
  display:flex;
  gap: 12px;
  align-items:center;
  justify-content:flex-start;
}

.footerBadge{
  border: 2px solid var(--stroke);
  background: var(--ink);
  color: var(--paper);
  padding: 6px 10px;
  font-size: 12px;
  letter-spacing: .18em;
  text-transform: uppercase;
  line-height: 1;
}

.footerText{
  color: var(--muted);
  font-size: 12px;
}

@media (max-width: 980px){
  .resultGrid{ grid-template-columns: 1fr; }
  .ahaRow{ grid-template-columns: 1fr; }
  .pill{ min-width: 160px; }
}

@media (max-width: 720px){
  .grid2{ grid-template-columns: 1fr; }
  .paper{ padding: var(--padSm); }
  .trustLine{ justify-content:flex-start; }
  .brandTitle{ font-size: 16px; }
  .topbarRight{ display:none; }
}
` as const;
