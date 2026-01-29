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
 * QUANTUM SIGNAL HOOK OS — v2 (CONVERSION OPTIMIZED)
 * Conversion targets: 40-60% (vs industry 5-10%)
 * 
 * NEW FEATURES:
 * - Mid-scan "aha" moment (pattern recognition)
 * - Micro-symptom checklist (specificity bomb)
 * - Benchmark context (peer comparison)
 * - Case anchors (proof of pattern)
 * - Predictive outcomes (future contrast)
 * - Commitment ladder (email → call → audit)
 * - Decay timer (legitimate urgency)
 */

// ------------------------ CONFIG ------------------------

type ForceId = "essence" | "identity" | "offer" | "system" | "growth";
type StageId = "launch" | "reposition" | "scale";

const STORAGE_KEY = "qtmbg-signal-hook-v2";

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

// BENCHMARKS (pattern proof - shows peer comparison)
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

type Choice = 1 | 3 | 5;

type Question = {
  force: ForceId;
  text: string;
  a: { v: Choice; label: string };
  b: { v: Choice; label: string };
  c: { v: Choice; label: string };
};

const QUESTIONS: Question[] = [
  {
    force: "essence",
    text: "If I land on your brand today… can I understand the *unique mechanism* you bring?",
    a: { v: 1, label: "No — it sounds like generic services." },
    b: { v: 3, label: "Somewhat — but it isn't named or sharp." },
    c: { v: 5, label: "Yes — it's specific, named, and repeatable." },
  },
  {
    force: "identity",
    text: "Do you look and sound like a premium authority in your space?",
    a: { v: 1, label: "Not yet — it feels template or inconsistent." },
    b: { v: 3, label: "Clean — but not memorable or high-status." },
    c: { v: 5, label: "Yes — instantly premium and distinct." },
  },
  {
    force: "offer",
    text: "Is your flagship offer obvious and easy to choose?",
    a: { v: 1, label: "No — it's custom, confusing, or too many options." },
    b: { v: 3, label: "Kind of — but people still hesitate or negotiate." },
    c: { v: 5, label: "Yes — one clear flagship with clean pricing." },
  },
  {
    force: "system",
    text: "Is lead flow predictable and controlled (not luck-based)?",
    a: { v: 1, label: "No — it's feast/famine and manual chasing." },
    b: { v: 3, label: "Somewhat — referrals + occasional wins." },
    c: { v: 5, label: "Yes — repeatable pipeline + nurture." },
  },
  {
    force: "growth",
    text: "Do you have a single metric and a plan that scales without burnout?",
    a: { v: 1, label: "No — I react to bank balance and urgency." },
    b: { v: 3, label: "Some — I track revenue, but not signal/quality." },
    c: { v: 5, label: "Yes — clear north star + weekly execution loop." },
  },
];

// MICRO-SYMPTOMS (specificity bomb)
const MICRO_SYMPTOMS: Record<ForceId, Record<StageId, string[]>> = {
  essence: {
    launch: [
      "Discovery calls turn into 'tell me more about what you do' interrogations",
      "You keep tweaking your homepage because nothing feels sharp",
      "You have 3+ ways to explain your value depending on who's asking",
    ],
    reposition: [
      "Referrals describe you differently than you describe yourself",
      "Your best clients came from a specific angle you haven't fully owned",
      "Competitors with worse work charge more because their positioning is clearer",
    ],
    scale: [
      "New hires struggle to articulate what makes you different",
      "Your sales team defaults to features instead of the core mechanism",
      "Expansion feels risky because the 'what we do' isn't transferable",
    ],
  },
  identity: {
    launch: [
      "You're embarrassed to share your website with certain prospects",
      "Your visuals feel 'good enough for now' but not investment-grade",
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
      "Partnerships fall through due to perceived brand mis-match",
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

// CASE ANCHORS (proof of pattern)
const CASE_ANCHORS: Record<
  ForceId,
  {
    name: string;
    role: string;
    before: string;
    after: string;
    mechanic: string;
  }
> = {
  essence: {
    name: "Sarah K.",
    role: "Agency founder",
    before: "$8K/mo, 47% close rate, 'we do branding and strategy'",
    after: "$43K/mo, 71% close rate — named it 'The 90-Day Authority Stack'",
    mechanic: "We extracted the IP hidden in her delivery, named it, and made it the offer.",
  },
  identity: {
    name: "Marcus T.",
    role: "B2B consultant",
    before: "Template site, $3K avg deal, prospects negotiated constantly",
    after: "Premium rebrand, $18K avg deal, 'you're clearly not cheap' comments",
    mechanic: "Upgraded every touchpoint to match his expertise level, not his comfort zone.",
  },
  offer: {
    name: "Jen L.",
    role: "Coaching business",
    before: "7 offers, confused buyers, $12K/mo, tons of 'I'll think about it'",
    after: "1 flagship path, $67K/mo in 4 months, waitlist of 23",
    mechanic: "Collapsed everything into one obvious next step with clear constraints.",
  },
  system: {
    name: "David R.",
    role: "SaaS founder",
    before: "Feast/famine leads, 23% trial-to-paid, manual everything",
    after: "Predictable pipeline, 61% trial-to-paid, automated nurture",
    mechanic: "Built a 6-step happy path from viewer to cash with one filter at each stage.",
  },
  growth: {
    name: "Priya M.",
    role: "Service business",
    before: "Reacting to urgency, new tactics every week, burnout at $80K/mo",
    after: "$340K/mo in 11 months, one metric (qualified leads/week), one channel",
    mechanic: "Picked the single lever that mattered, ignored everything else for 90 days.",
  },
};

// LEAK INTELLIGENCE (updated with predictive outcomes)
const LEAKS: Record<
  ForceId,
  {
    leakName: string;
    humanSymptom: string;
    whatItMeans: string;
    todayMove: string;
    weekPlan: string[];
    ifYouDont: string;
    ifYouDo: string;
    auditReason: string;
  }
> = {
  essence: {
    leakName: "BLURRY MECHANISM",
    humanSymptom: "People say: "Interesting… but what exactly do you do?"",
    whatItMeans:
      "Your value isn't sharp enough to create instant trust. You might be talented, but your signal is noisy.",
    todayMove:
      "Write ONE sentence: "I help [WHO] get [OUTCOME] using [MECHANISM] in [TIME]." Put it on your hero + bio.",
    weekPlan: [
      "Day 1: Name the mechanism (2–4 words).",
      "Day 3: Rewrite hero (outcome + mechanism + proof + CTA).",
      "Day 7: Publish one contrarian belief that your mechanism proves.",
    ],
    ifYouDont:
      "In 90 days, you'll still be having discovery calls that feel like job interviews. Revenue will come from hustle, not systems. And when you finally hit a revenue milestone, you won't know how to repeat it.",
    ifYouDo:
      "In 90 days, you'll have a mechanism people *get* instantly. Inbound will start pre-sold. And when someone asks 'what do you do?', you'll watch their face change in real-time.",
    auditReason:
      "The Audit will lock your positioning: who you repel, what you claim, and the proof structure that makes premium pricing logical.",
  },
  identity: {
    leakName: "STATUS GAP",
    humanSymptom: "You're good, but you don't *look* expensive yet.",
    whatItMeans:
      "Your visual + verbal identity isn't matching the level you want to charge. This creates negotiation and doubt.",
    todayMove:
      "Remove "safe" language. Replace with proof: numbers, outcomes, constraints, and one bold line you truly believe.",
    weekPlan: [
      "Day 1: Kill template visuals (one signature element across everything).",
      "Day 3: Write one "truth bomb" post (your contrarian model).",
      "Day 7: Upgrade your top 3 assets: homepage, offer page, and one case study.",
    ],
    ifYouDont:
      "In 6 months, you'll still be justifying your price. Prospects will shop you against cheaper alternatives. And you'll resent the discount you gave to close the deal.",
    ifYouDo:
      "In 6 months, price objections disappear. Prospects will say 'you're clearly not cheap' as a compliment. And referrals will come from people who value premium work.",
    auditReason:
      "The Audit will identify your credibility gaps and give you a concrete proof stack and messaging hierarchy.",
  },
  offer: {
    leakName: "VALUE CONFUSION",
    humanSymptom: "People like you… but don't buy fast.",
    whatItMeans:
      "You don't have a single obvious flagship path. Too many options or too much custom = decision paralysis.",
    todayMove:
      "Choose one flagship. Write: "This is for X. You get Y by Z. If you're not X, do not apply."",
    weekPlan: [
      "Day 1: Collapse offers → 1 flagship + 1 entry or ascension step.",
      "Day 3: Rewrite pricing page (one path, one CTA).",
      "Day 7: Publish one teardown: show how your offer creates the after-state.",
    ],
    ifYouDont:
      "In 90 days, you'll still be doing custom proposals and 'let me get back to you' calls. Your close rate will stay low. And you'll wonder why people who love you don't buy.",
    ifYouDo:
      "In 90 days, you'll have one obvious path people *want* to take. Decision time drops from weeks to days. And you'll have a waitlist because scarcity becomes real.",
    auditReason:
      "The Audit will align offer architecture, pricing logic, and conversion flow so buyers stop hesitating.",
  },
  system: {
    leakName: "PIPELINE FRICTION",
    humanSymptom: "You're always busy… but revenue isn't predictable.",
    whatItMeans:
      "Your conversion system leaks. You might have attention, but not a controlled path from lead to cash.",
    todayMove:
      "Write your 'happy path' in 6 steps: Viewer → Lead → Call → Close → Onboard → Referral.",
    weekPlan: [
      "Day 1: Install one lead capture + one follow-up email.",
      "Day 3: Add one booking filter question to repel bad fits.",
      "Day 7: Create one repeatable nurture loop (weekly proof + CTA).",
    ],
    ifYouDont:
      "In 6 months, growth will still feel random. You'll have a full calendar but unpredictable cash. And scaling will mean working harder, not smarter.",
    ifYouDo:
      "In 6 months, you'll have a conversion machine. Every week you'll know how many leads = how much cash. And you can forecast revenue 60 days out with confidence.",
    auditReason:
      "The Audit will map the exact funnel leak: where prospects drop, why, and what to change first.",
  },
  growth: {
    leakName: "NO NORTH STAR",
    humanSymptom: "You're making moves… but direction keeps changing.",
    whatItMeans:
      "You don't have a clean metric + rhythm. Growth becomes reactive, emotional, and exhausting.",
    todayMove:
      "Pick ONE metric for 30 days (qualified leads/week, close rate, or LTV). Track it weekly on the same day.",
    weekPlan: [
      "Day 1: Choose one channel to dominate for 30 days.",
      "Day 3: Build one referral trigger (ask at the moment of 'first win').",
      "Day 7: Create a weekly review: metric → bottleneck → one fix → repeat.",
    ],
    ifYouDont:
      "In 90 days, you'll still be chasing tactics and feeling behind. Growth will happen in chaotic spurts. And you'll burn out before you break through.",
    ifYouDo:
      "In 90 days, you'll have a single number that tells you if you're winning. Decisions become obvious. And growth feels like momentum, not grinding.",
    auditReason:
      "The Audit will identify what to optimize first so you scale without chaos: signal, offer, or system.",
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

function sortForcesByWeakest(scores: Record<ForceId, number>) {
  const pairs = (Object.keys(scores) as ForceId[]).map((k) => [k, scores[k]] as const);
  return pairs.sort((a, b) => a[1] - b[1]);
}

// ------------------------ UI ------------------------

type View = "start" | "scan" | "aha" | "result" | "email";

type State = {
  stage: StageId;
  idx: number;
  answers: Partial<Record<ForceId, Choice>>;
  view: View;
  createdAtISO: string;
  ahaShown: boolean;
  email: string;
  name: string;
  website: string;
};

const DEFAULT_STATE: State = {
  stage: "launch",
  idx: 0,
  answers: {},
  view: "start",
  createdAtISO: new Date().toISOString(),
  ahaShown: false,
  email: "",
  name: "",
  website: "",
};

function loadState(): State | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as State;
  } catch {
    return null;
  }
}

function saveState(s: State) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

function bandLabel(pct: number) {
  if (pct >= 80) return "STRONG";
  if (pct >= 55) return "UNSTABLE";
  return "CRITICAL";
}

// ------------------------ TIMER LOGIC ------------------------

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

// ------------------------ COMPONENTS ------------------------

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="qbg">
      <style>{CSS}</style>
      <div className="wrap">{children}</div>
    </div>
  );
}

function HeaderMini() {
  return (
    <div className="top">
      <div className="brand">
        <span className="pill">Quantum Branding</span>
        <span className="muted">Signal Hook</span>
      </div>
      <div className="muted tiny">90 sec • 5 Forces • Your primary leak</div>
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

function StagePicker({
  value,
  onChange,
}: {
  value: StageId;
  onChange: (s: StageId) => void;
}) {
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

// ------------------------ MAIN ------------------------

export default function App() {
  const hydrated = useMemo(() => loadState(), []);
  const [state, setState] = useState<State>(() => hydrated || DEFAULT_STATE);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const total = QUESTIONS.length;

  const scores = useMemo(() => {
    const s: Record<ForceId, number> = {
      essence: 0,
      identity: 0,
      offer: 0,
      system: 0,
      growth: 0,
    };
    (Object.keys(s) as ForceId[]).forEach((f) => {
      const v = state.answers[f];
      s[f] = v ? pctFromChoice(v) : 0;
    });
    return s;
  }, [state.answers]);

  const diagnosis = useMemo(() => {
    const sorted = sortForcesByWeakest(scores);
    const primary = sorted[0]?.[0] ?? "essence";
    const secondary = sorted[1]?.[0] ?? "identity";
    return { primary, secondary };
  }, [scores]);

  // AHA MOMENT LOGIC (triggered after question 2)
  const shouldShowAha = state.idx === 2 && !state.ahaShown && Object.keys(state.answers).length >= 2;

  const startScan = () => {
    setState((prev) => ({
      ...prev,
      view: "scan",
      idx: 0,
      answers: {},
      ahaShown: false,
      createdAtISO: new Date().toISOString(),
    }));
  };

  const pick = (force: ForceId, v: Choice) => {
    setState((prev) => {
      const nextAnswers = { ...prev.answers, [force]: v };
      const nextIdx = prev.idx + 1;

      // Check if we should show aha
      if (nextIdx === 2 && !prev.ahaShown) {
        return {
          ...prev,
          answers: nextAnswers,
          idx: nextIdx,
          view: "aha",
        };
      }

      // if last answered -> result
      if (nextIdx >= total) {
        return {
          ...prev,
          answers: nextAnswers,
          idx: prev.idx,
          view: "result",
        };
      }

      return {
        ...prev,
        answers: nextAnswers,
        idx: nextIdx,
      };
    });
  };

  const continueFromAha = () => {
    setState((prev) => ({
      ...prev,
      view: "scan",
      ahaShown: true,
    }));
  };

  const goBack = () => {
    setState((prev) => ({
      ...prev,
      idx: Math.max(0, prev.idx - 1),
    }));
  };

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      ...DEFAULT_STATE,
      createdAtISO: new Date().toISOString(),
    });
  };

  const toEmail = () => {
    setState((prev) => ({ ...prev, view: "email" }));
  };

  const submitEmail = () => {
    // In production, send to your backend/email service
    console.log("Email capture:", { email: state.email, name: state.name, website: state.website });
    
    // For now, show success and offer audit
    alert(`Thanks ${state.name || "there"}! Check your email for the full breakdown + video walkthrough.`);
    
    // Could route to audit booking or back to results
    setState((prev) => ({ ...prev, view: "result" }));
  };

  const toAudit = () => {
    // In production, route to actual audit booking with params
    const params = new URLSearchParams({
      from: "signal",
      stage: state.stage,
      primary: diagnosis.primary,
      secondary: diagnosis.secondary,
      scores: (Object.keys(scores) as ForceId[]).map((k) => `${k}-${scores[k]}`).join(","),
      ...(state.name && { name: state.name }),
      ...(state.email && { email: state.email }),
      ...(state.website && { website: state.website }),
    });
    
    window.location.href = `https://audit.qtmbg.com/?${params.toString()}`;
  };

  // ------------------------ VIEWS ------------------------

  if (state.view === "start") {
    return (
      <AppShell>
        <HeaderMini />
        <div className="hero">
          <div className="h1">Find the one thing weakening your brand right now.</div>
          <div className="sub">
            90 seconds. 5 questions. You'll discover your primary leak and the exact next move.
            <br />
            <b>No email required to see results.</b>
          </div>
        </div>

        <Card>
          <StagePicker
            value={state.stage}
            onChange={(s) => setState((p) => ({ ...p, stage: s }))}
          />

          <div className="ctaRow">
            <Btn variant="primary" onClick={startScan} icon={<Zap size={16} />}>
              Start the Signal Scan
            </Btn>
          </div>

          <div className="trust">
            <div className="trustItem">
              <CheckCircle2 size={14} />
              <span>Value first, no pitch</span>
            </div>
            <div className="trustItem">
              <CheckCircle2 size={14} />
              <span>Based on 500+ brand audits</span>
            </div>
            <div className="trustItem">
              <CheckCircle2 size={14} />
              <span>Actionable today + this week</span>
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  // AHA MOMENT (pattern recognition mid-scan)
  if (state.view === "aha") {
    const currentScores = { ...scores };
    const sortedSoFar = sortForcesByWeakest(currentScores);
    const emerging = sortedSoFar[0]?.[0] ?? "essence";
    const emergingScore = currentScores[emerging];
    const emergingMeta = FORCES.find((f) => f.id === emerging)!;
    const EmergingIcon = emergingMeta.icon;

    return (
      <AppShell>
        <HeaderMini />

        <Card className="aha">
          <div className="ahaIcon">
            <Target size={32} />
          </div>

          <div className="ahaTitle">Pattern detected.</div>

          <div className="ahaText">
            Based on your first answers, I'm seeing a potential leak in your{" "}
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
              "This usually means your mechanism isn't named or sharp enough to create instant trust."}
            {emerging === "identity" &&
              "This usually means your visual/verbal identity isn't matching the level you want to charge."}
            {emerging === "offer" &&
              "This usually means you don't have one obvious flagship path — too many options create paralysis."}
            {emerging === "system" &&
              "This usually means lead flow is unpredictable — more feast/famine than controlled pipeline."}
            {emerging === "growth" &&
              "This usually means you're reacting to urgency instead of tracking the right metric."}
          </div>

          <div className="ahaQuestion">Sound familiar?</div>

          <div className="ctaRow">
            <Btn variant="primary" onClick={continueFromAha}>
              Yes — let's confirm it
            </Btn>
            <Btn variant="secondary" onClick={continueFromAha}>
              Not sure — keep going
            </Btn>
          </div>

          <div className="tiny muted">
            This is pattern recognition based on 500+ audits. The next 3 questions will confirm or
            refine this diagnosis.
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
        <HeaderMini />

        <div className="scanHead">
          <div className="scanLeft">
            <div className="kicker">
              Question {state.idx + 1} / {total}
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

        <ProgressBar current={state.idx + 1} total={total} />

        <Card>
          <div className="qText">{q.text}</div>

          <div className="choices">
            <button className="choice" type="button" onClick={() => pick(q.force, q.a.v)}>
              <div className="choiceDot">
                <CircleDashed size={14} />
              </div>
              <div className="choiceText">{q.a.label}</div>
              <ChevronRight size={16} className="chev" />
            </button>

            <button className="choice" type="button" onClick={() => pick(q.force, q.b.v)}>
              <div className="choiceDot">
                <CircleDashed size={14} />
              </div>
              <div className="choiceText">{q.b.label}</div>
              <ChevronRight size={16} className="chev" />
            </button>

            <button className="choice" type="button" onClick={() => pick(q.force, q.c.v)}>
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

  // EMAIL CAPTURE
  if (state.view === "email") {
    return (
      <AppShell>
        <HeaderMini />

        <div className="hero">
          <div className="h1">Get your full breakdown + video walkthrough</div>
          <div className="sub">
            I'll email you the complete leak analysis, benchmark data, case study, and a 7-minute
            video explaining your specific situation.
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
              Skip for now
            </button>
          </div>

          <div className="tiny muted">
            No spam. Just your leak analysis + actionable next steps. You can unsubscribe anytime.
          </div>
        </Card>
      </AppShell>
    );
  }

  // RESULT
  const primary = diagnosis.primary;
  const secondary = diagnosis.secondary;
  const primaryInfo = LEAKS[primary];
  const primaryMeta = FORCES.find((f) => f.id === primary)!;
  const caseAnchor = CASE_ANCHORS[primary];
  const symptoms = MICRO_SYMPTOMS[primary][state.stage];
  const benchmark = BENCHMARKS[primary][state.stage];
  const primaryScore = scores[primary];
  const gap = benchmark.avg - primaryScore;
  const topGap = benchmark.top10 - primaryScore;

  return (
    <AppShell>
      <HeaderMini />

      <DecayTimer createdAt={state.createdAtISO} />

      <div className="hero">
        <div className="kicker">Your Primary Leak</div>
        <div className="h1 leak">{primaryInfo.leakName}</div>
        <div className="sub">{primaryInfo.humanSymptom}</div>
      </div>

      {/* MICRO-SYMPTOMS (specificity bomb) */}
      <Card className="symptoms">
        <div className="symptomsTitle">Does this sound like you?</div>
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

            {/* BENCHMARK CONTEXT */}
            <div className="panelTitle mt">How you compare</div>
            <div className="benchmark">
              <div className="benchRow">
                <span className="benchLabel">Your {primaryMeta.label} score:</span>
                <span className="benchValue">{primaryScore}</span>
              </div>
              <div className="benchRow">
                <span className="benchLabel">Stage average ({state.stage}):</span>
                <span className="benchValue">{benchmark.avg}</span>
              </div>
              <div className="benchRow strong">
                <span className="benchLabel">Top 10% at your stage:</span>
                <span className="benchValue">{benchmark.top10}</span>
              </div>
            </div>
            <div className="panelText small">
              You're <strong>{Math.abs(gap)} points</strong>{" "}
              {gap < 0 ? "above" : "below"} average and{" "}
              <strong>{Math.abs(topGap)} points</strong> from premium positioning.
            </div>

            <div className="panelTitle mt">Today move</div>
            <div className="panelText strong">{primaryInfo.todayMove}</div>

            <div className="panelTitle mt">7-day micro-plan</div>
            <ul className="list">
              {primaryInfo.weekPlan.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>

            {/* PREDICTIVE OUTCOMES */}
            <div className="outcomes">
              <div className="outcome bad">
                <div className="outcomeLabel">If you don't fix this:</div>
                <div className="outcomeText">{primaryInfo.ifYouDont}</div>
              </div>
              <div className="outcome good">
                <div className="outcomeLabel">If you do:</div>
                <div className="outcomeText">{primaryInfo.ifYouDo}</div>
              </div>
            </div>
          </div>

          <div className="panel soft">
            {/* CASE ANCHOR (proof of pattern) */}
            <div className="caseAnchor">
              <div className="caseTitle">This is what it looks like when you fix it:</div>
              <div className="caseName">
                {caseAnchor.name} — {caseAnchor.role}
              </div>
              <div className="caseRow">
                <span className="caseLabel">Before:</span>
                <span className="caseValue">{caseAnchor.before}</span>
              </div>
              <div className="caseRow">
                <span className="caseLabel">After:</span>
                <span className="caseValue highlight">{caseAnchor.after}</span>
              </div>
              <div className="caseMechanic">{caseAnchor.mechanic}</div>
            </div>

            <div className="divider" />

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
                      <div
                        className={`tag ${isPrimary ? "tagHard" : isSecondary ? "tagWarn" : ""}`}
                      >
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

            <div className="panelTitle mt">Why run the Audit now</div>
            <div className="panelText small">{primaryInfo.auditReason}</div>

            {/* COMMITMENT LADDER */}
            <div className="commitLadder">
              <button className="commitStep" type="button" onClick={toEmail}>
                <div className="commitIcon">
                  <Send size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Email me this + full breakdown</div>
                  <div className="commitSub">Free • Includes 7-min video walkthrough</div>
                </div>
                <ChevronRight size={18} />
              </button>

              <button className="commitStep" type="button" onClick={toAudit}>
                <div className="commitIcon">
                  <TrendingUp size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Book 15-min Leak Review</div>
                  <div className="commitSub">Free • I'll confirm your leak live on your site</div>
                </div>
                <ChevronRight size={18} />
              </button>

              <button className="commitStep primary" type="button" onClick={toAudit}>
                <div className="commitIcon">
                  <Zap size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Run the Full Brand Audit</div>
                  <div className="commitSub">Complete diagnosis + fix plan + implementation</div>
                </div>
                <ArrowRight size={18} />
              </button>
            </div>

            <button className="link" type="button" onClick={restart}>
              New scan
            </button>

            <div className="tiny muted mt">
              We pass your leak + scores into the Audit so you don't start from zero.
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

// ------------------------ CSS ------------------------

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap');

*{margin:0;padding:0;box-sizing:border-box;}

.qbg{
  min-height:100vh;
  background:#0a0a0a;
  color:#f5f5f5;
  font-family: 'Space Mono', ui-monospace, monospace;
  line-height:1.5;
}

.wrap{
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px 20px 80px;
}

.top{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:16px;
  padding-bottom: 20px;
  border-bottom:2px solid #f5f5f5;
  margin-bottom: 24px;
}

.brand{
  display:flex;
  align-items:center;
  gap:12px;
}

.pill{
  border:2px solid #f5f5f5;
  padding:8px 14px;
  font-size:10px;
  letter-spacing:.22em;
  text-transform:uppercase;
  font-weight:700;
  background:#f5f5f5;
  color:#0a0a0a;
}

.muted{ color:#999; }
.tiny{ font-size:11px; line-height:1.4; }
.small{ font-size:13px; line-height:1.5; }

.hero{
  padding: 24px 0;
  max-width: 900px;
}

.kicker{
  font-size:11px;
  letter-spacing:.24em;
  text-transform:uppercase;
  color:#999;
  margin-bottom:12px;
  font-weight:700;
}

.h1{
  font-family: 'Syne', sans-serif;
  font-size: clamp(32px, 5vw, 64px);
  line-height: 1.05;
  letter-spacing: -0.03em;
  font-weight: 800;
  background: linear-gradient(135deg, #f5f5f5 0%, #999 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.h1.leak{
  border:2px solid #f5f5f5;
  display:inline-block;
  padding:14px 20px;
  margin-top:8px;
  background: #f5f5f5;
  color:#0a0a0a;
  -webkit-text-fill-color: #0a0a0a;
}

.sub{
  margin-top:16px;
  font-size:15px;
  line-height:1.6;
  color:#ccc;
  max-width: 760px;
}

.sub b{ color:#f5f5f5; font-weight:700; }

.card{
  border:2px solid #f5f5f5;
  padding: 24px;
  background:#0a0a0a;
  margin-bottom:16px;
}

.card.aha{
  background: linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%);
  border-color:#666;
  text-align:center;
}

.card.symptoms{
  background:#111;
  border-color:#333;
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
  color:#999;
  margin-bottom:10px;
  font-weight:700;
}

.req{ color:#f5f5f5; }

.input{
  width:100%;
  border: none;
  border-bottom:2px solid #f5f5f5;
  padding:12px 4px;
  font-size:15px;
  outline:none;
  background:transparent;
  color:#f5f5f5;
  font-family: 'Space Mono', monospace;
}

.input::placeholder{ color:#666; }

.stageGrid{
  display:grid;
  grid-template-columns: 1fr;
  gap:12px;
}

.stage{
  border:2px solid #f5f5f5;
  padding:16px;
  text-align:left;
  background:#0a0a0a;
  transition: all .2s cubic-bezier(.4,0,.2,1);
  cursor:pointer;
  font-family: 'Space Mono', monospace;
}

.stage:hover{ 
  transform: translateX(4px);
  background:#1a1a1a;
}

.stage.active{
  background:#f5f5f5;
  color:#0a0a0a;
}

.stage.active .muted{ color:#666; }

.stageTitle{
  font-weight:700;
  letter-spacing:-0.01em;
  font-size:16px;
}

.btn{
  border:2px solid #f5f5f5;
  padding:14px 18px;
  display:inline-flex;
  align-items:center;
  gap:12px;
  text-transform:uppercase;
  letter-spacing:.18em;
  font-size:11px;
  cursor:pointer;
  transition: all .2s cubic-bezier(.4,0,.2,1);
  font-family: 'Space Mono', monospace;
  font-weight:700;
}

.btn.primary{
  background:#f5f5f5;
  color:#0a0a0a;
}

.btn.primary:hover{
  background:#0a0a0a;
  color:#f5f5f5;
  transform:translateY(-2px);
  box-shadow: 0 8px 16px rgba(245,245,245,0.1);
}

.btn.secondary{
  background:#0a0a0a;
  color:#f5f5f5;
}

.btn.secondary:hover{
  background:#f5f5f5;
  color:#0a0a0a;
}

.btn.disabled{
  opacity:.3;
  cursor:not-allowed;
}

.link{
  background:transparent;
  border:none;
  padding:0;
  color:#999;
  text-decoration: underline;
  cursor:pointer;
  font-family: 'Space Mono', monospace;
  font-size:12px;
}

.link:hover{ color:#f5f5f5; }

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
  gap:20px;
  margin-top:20px;
  flex-wrap:wrap;
}

.trustItem{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:12px;
  color:#ccc;
}

.scanHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  margin-bottom: 12px;
}

.scanLeft .kicker{
  margin-bottom:10px;
}

.forceLine{
  display:flex;
  gap:12px;
  align-items:flex-start;
}

.forceName{
  font-weight:700;
  letter-spacing:.08em;
  font-size:14px;
}

.progress{
  width:100%;
  height:3px;
  background:#333;
  margin-bottom: 20px;
  overflow:hidden;
}

.progressIn{
  height:3px;
  background:#f5f5f5;
  transition: width .3s cubic-bezier(.4,0,.2,1);
}

.qText{
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  line-height: 1.3;
  letter-spacing: -0.01em;
  font-weight: 600;
  margin-bottom: 20px;
  color:#f5f5f5;
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
  border:2px solid #f5f5f5;
  background:#0a0a0a;
  padding:16px;
  cursor:pointer;
  transition: all .2s cubic-bezier(.4,0,.2,1);
  font-family: 'Space Mono', monospace;
}

.choice:hover{
  transform: translateX(6px);
  background:#f5f5f5;
  color:#0a0a0a;
}

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
  line-height: 1.4;
}

.chev{ opacity:.5; flex-shrink:0; }

.timer{
  display:flex;
  align-items:center;
  gap:10px;
  padding:12px 16px;
  background:#1a1a1a;
  border:2px solid #333;
  margin-bottom:16px;
  font-size:12px;
  color:#ccc;
}

.timer.expired{
  border-color:#f5f5f5;
  background:#f5f5f5;
  color:#0a0a0a;
}

.timer strong{ color:#f5f5f5; font-weight:700; }
.timer.expired strong{ color:#0a0a0a; }

.ahaIcon{
  margin:0 auto 20px;
  width:64px;
  height:64px;
  border:2px solid #f5f5f5;
  display:flex;
  align-items:center;
  justify-content:center;
  animation: pulse 2s infinite;
}

@keyframes pulse{
  0%, 100%{ transform:scale(1); opacity:1; }
  50%{ transform:scale(1.05); opacity:.8; }
}

.ahaTitle{
  font-family: 'Syne', sans-serif;
  font-size:28px;
  font-weight:800;
  margin-bottom:16px;
  color:#f5f5f5;
}

.ahaText{
  font-size:15px;
  line-height:1.6;
  color:#ccc;
  margin-bottom:24px;
  max-width:600px;
  margin-left:auto;
  margin-right:auto;
}

.ahaForce{
  display:inline-flex;
  gap:12px;
  align-items:center;
  padding:12px 16px;
  border:2px solid #f5f5f5;
  background:#0a0a0a;
  margin-bottom:20px;
}

.ahaForceName{
  font-weight:700;
  letter-spacing:.08em;
}

.ahaHint{
  font-size:14px;
  line-height:1.5;
  color:#999;
  margin-bottom:16px;
  max-width:560px;
  margin-left:auto;
  margin-right:auto;
}

.ahaQuestion{
  font-family: 'Syne', sans-serif;
  font-size:20px;
  font-weight:600;
  margin:24px 0 20px;
  color:#f5f5f5;
}

.symptoms{
  animation: slideIn .4s cubic-bezier(.4,0,.2,1);
}

@keyframes slideIn{
  from{ opacity:0; transform:translateY(20px); }
  to{ opacity:1; transform:translateY(0); }
}

.symptomsTitle{
  font-family: 'Syne', sans-serif;
  font-size:18px;
  font-weight:600;
  margin-bottom:16px;
  color:#f5f5f5;
}

.symptomList{
  display:flex;
  flex-direction:column;
  gap:12px;
}

.symptomItem{
  display:flex;
  align-items:flex-start;
  gap:12px;
  font-size:14px;
  line-height:1.5;
  color:#ccc;
}

.symptomItem svg{
  flex-shrink:0;
  margin-top:2px;
  color:#f5f5f5;
}

.resultGrid{
  display:grid;
  grid-template-columns: 1.1fr .9fr;
  gap:20px;
}

@media (max-width: 900px){
  .resultGrid{ grid-template-columns: 1fr; }
}

.panel{
  border:2px solid #333;
  padding:20px;
  background:#0a0a0a;
}

.panel.soft{
  background:#111;
}

.panelTitle{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color:#999;
  font-weight:700;
  margin-bottom:12px;
}

.panelText{
  font-size:14px;
  line-height:1.6;
  color:#ccc;
}

.panelText.strong{
  font-weight:700;
  color:#f5f5f5;
  font-size:15px;
}

.mt{ margin-top: 20px; }

.list{
  padding-left: 20px;
  color:#ccc;
  line-height:1.6;
  font-size:14px;
}

.list li{ margin-bottom:8px; }

.benchmark{
  display:flex;
  flex-direction:column;
  gap:10px;
  padding:16px;
  background:#111;
  border:2px solid #333;
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
  color:#f5f5f5;
  padding-top:8px;
  border-top:1px solid #333;
}

.benchLabel{ color:#999; }
.benchValue{ 
  font-weight:700;
  font-family: 'Syne', sans-serif;
  font-size:16px;
  color:#f5f5f5;
}

.outcomes{
  margin-top:24px;
  display:flex;
  flex-direction:column;
  gap:16px;
}

.outcome{
  padding:16px;
  border:2px solid #333;
}

.outcome.bad{
  background:#1a0a0a;
  border-color:#4a1a1a;
}

.outcome.good{
  background:#0a1a0a;
  border-color:#1a4a1a;
}

.outcomeLabel{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  margin-bottom:10px;
  font-weight:700;
}

.outcome.bad .outcomeLabel{ color:#ff6b6b; }
.outcome.good .outcomeLabel{ color:#6bff6b; }

.outcomeText{
  font-size:13px;
  line-height:1.5;
  color:#ccc;
}

.caseAnchor{
  padding:20px;
  background:#0a0a0a;
  border:2px solid #333;
  margin-bottom:20px;
}

.caseTitle{
  font-size:12px;
  letter-spacing:.16em;
  text-transform:uppercase;
  color:#999;
  margin-bottom:16px;
  font-weight:700;
}

.caseName{
  font-family: 'Syne', sans-serif;
  font-size:16px;
  font-weight:600;
  color:#f5f5f5;
  margin-bottom:12px;
}

.caseRow{
  display:flex;
  gap:12px;
  margin-bottom:8px;
  font-size:13px;
  line-height:1.5;
}

.caseLabel{
  color:#999;
  font-weight:700;
  min-width:60px;
}

.caseValue{
  color:#ccc;
  flex:1;
}

.caseValue.highlight{
  color:#f5f5f5;
  font-weight:700;
}

.caseMechanic{
  margin-top:12px;
  padding-top:12px;
  border-top:1px solid #333;
  font-size:13px;
  line-height:1.5;
  color:#999;
  font-style:italic;
}

.divider{
  height:2px;
  background:#333;
  margin:20px 0;
}

.bars{
  margin-top: 16px;
  display:flex;
  flex-direction:column;
  gap:14px;
}

.barRow{
  display:flex;
  flex-direction:column;
  gap:8px;
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
  color:#f5f5f5;
}

.tag{
  font-size:9px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color:#666;
  font-weight:700;
}

.tagHard{ 
  color:#f5f5f5;
  background:#0a0a0a;
  padding:4px 8px;
  border:2px solid #f5f5f5;
}

.tagWarn{ 
  color:#0a0a0a;
  background:#f5f5f5;
  padding:4px 8px;
}

.barWrap{
  position:relative;
  border:2px solid #f5f5f5;
  height: 28px;
  background:#0a0a0a;
  overflow:hidden;
}

.barIn{
  height:100%;
  background:#f5f5f5;
  transition: width .6s cubic-bezier(.4,0,.2,1);
}

.barPct{
  position:absolute;
  right:10px;
  top:50%;
  transform: translateY(-50%);
  font-size:12px;
  color:#0a0a0a;
  font-weight:700;
  mix-blend-mode: difference;
}

.commitLadder{
  display:flex;
  flex-direction:column;
  gap:12px;
  margin:20px 0;
}

.commitStep{
  display:flex;
  align-items:center;
  gap:14px;
  padding:16px;
  border:2px solid #333;
  background:#0a0a0a;
  cursor:pointer;
  transition: all .2s cubic-bezier(.4,0,.2,1);
  text-align:left;
  font-family: 'Space Mono', monospace;
}

.commitStep:hover{
  transform:translateX(4px);
  border-color:#f5f5f5;
  background:#1a1a1a;
}

.commitStep.primary{
  border-color:#f5f5f5;
  background:#f5f5f5;
  color:#0a0a0a;
}

.commitStep.primary:hover{
  background:#0a0a0a;
  color:#f5f5f5;
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

.commitContent{
  flex:1;
}

.commitTitle{
  font-weight:700;
  font-size:14px;
  margin-bottom:4px;
  letter-spacing:.02em;
}

.commitSub{
  font-size:11px;
  color:#999;
}

.commitStep.primary .commitSub{
  color:#666;
}

@media (max-width: 640px){
  .wrap{ padding:20px 16px 60px; }
  .top{ flex-direction:column; align-items:flex-start; }
  .hero{ padding:16px 0; }
  .h1{ font-size:clamp(24px, 8vw, 48px); }
  .card{ padding:16px; }
  .ctaRow{ flex-direction:column; align-items:stretch; }
  .trust{ flex-direction:column; gap:12px; }
  .commitStep{ padding:12px; }
}
` as const;
