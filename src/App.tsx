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
  Clock,
  Target,
  Send,
  TrendingUp,
} from "lucide-react";

/**
 * QUANTUM BRANDING — SIGNAL OS (Hook-First) v3
 * Goal: emotionally strong insight, NOT an “audit-lite”.
 * - Fast truth (primary leak)
 * - One Today Move + 72h Sprint (light)
 * - Deeper assets (benchmarks/case/expanded plan) gated behind Email / Audit
 * - Strict TS + SSR-safe for Next/Vercel
 */

// ------------------------ TYPES ------------------------

type ForceId = "essence" | "identity" | "offer" | "system" | "growth";
type StageId = "launch" | "reposition" | "scale";
type Choice = 1 | 3 | 5;
type View = "start" | "scan" | "aha" | "result" | "email";

type Question = {
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
  sprint72h: string[]; // intentionally light
  proofTease: string; // what they’ll get if they enter email
  auditReason: string; // why audit is a different class
};

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

// ------------------------ CONFIG ------------------------

const STORAGE_KEY = "qtmbg-signal-os-v3";

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
  { id: "launch", label: "Launching", sub: "First demand + first offers" },
  { id: "reposition", label: "Repositioning", sub: "Good work, unclear signal or audience" },
  { id: "scale", label: "Scaling", sub: "Need throughput, not more hustle" },
];

// Hook questions are designed to identify the primary leak fast.
// Scores stay internal; we show a simple “Signal Snapshot” on results.
const QUESTIONS: Question[] = [
  {
    force: "essence",
    text: "If I land on your brand today, do I instantly understand the mechanism you bring?",
    a: { v: 1, label: "No — it sounds generic or interchangeable." },
    b: { v: 3, label: "Somewhat — but it’s not named or sharp." },
    c: { v: 5, label: "Yes — it’s specific, named, and repeatable." },
  },
  {
    force: "identity",
    text: "Do you look and sound like a premium authority in your space?",
    a: { v: 1, label: "Not yet — inconsistent or “template-ish”." },
    b: { v: 3, label: "Clean — but not memorable or high-status." },
    c: { v: 5, label: "Yes — instantly premium and distinct." },
  },
  {
    force: "offer",
    text: "Is your flagship offer obvious and easy to choose?",
    a: { v: 1, label: "No — custom, confusing, or too many options." },
    b: { v: 3, label: "Kind of — people still hesitate or negotiate." },
    c: { v: 5, label: "Yes — one clear flagship with clean pricing." },
  },
  {
    force: "system",
    text: "Is lead flow predictable (not luck-based) and follow-up controlled?",
    a: { v: 1, label: "No — feast/famine and manual chasing." },
    b: { v: 3, label: "Somewhat — referrals + occasional wins." },
    c: { v: 5, label: "Yes — pipeline + nurture is repeatable." },
  },
  {
    force: "growth",
    text: "Do you have a single metric and rhythm that scales without burnout?",
    a: { v: 1, label: "No — I react to urgency and bank balance." },
    b: { v: 3, label: "Some — I track revenue but not leading signals." },
    c: { v: 5, label: "Yes — clear north star + weekly loop." },
  },
];

// Specificity bomb stays, but we keep it short: 3 symptoms only.
const MICRO_SYMPTOMS: Record<ForceId, Record<StageId, string[]>> = {
  essence: {
    launch: [
      "Discovery calls turn into “so… what exactly do you do?”",
      "You rewrite your homepage often because nothing feels sharp",
      "You explain your value differently depending on the person",
    ],
    reposition: [
      "Referrals describe you differently than you describe yourself",
      "Competitors with worse work charge more because their signal is clearer",
      "Your best clients came from an angle you haven’t fully owned",
    ],
    scale: [
      "Your team struggles to articulate what makes you different",
      "Sales defaults to features instead of the core mechanism",
      "Expansion feels risky because the story isn’t transferable",
    ],
  },
  identity: {
    launch: [
      "You hesitate to share your website with certain prospects",
      "Your visuals feel “good enough” but not investment-grade",
      "People like your work but don’t see premium yet",
    ],
    reposition: [
      "Your brand looks smaller than your actual expertise",
      "Prospects negotiate because you don’t look expensive",
      "You outgrew your identity but didn’t refresh it",
    ],
    scale: [
      "Your brand doesn’t match the size of deals you want",
      "Enterprise prospects hesitate on perceived credibility",
      "Partnerships stall due to brand mis-match",
    ],
  },
  offer: {
    launch: [
      "People like you but say “let me think” and disappear",
      "You create custom proposals for every deal",
      "Pricing turns into negotiation too often",
    ],
    reposition: [
      "Too many offers creates decision paralysis",
      "Your best clients bought something you don’t want to keep selling",
      "Revenue exists but you don’t know what to double down on",
    ],
    scale: [
      "Offer architecture is hard to explain to your team",
      "Upsells happen by accident, not by design",
      "You leave money on the table because the path isn’t obvious",
    ],
  },
  system: {
    launch: [
      "You’re busy, but cash flow isn’t predictable",
      "Leads come from hustle, not a repeatable system",
      "Follow-up slips because everything is manual",
    ],
    reposition: [
      "You get attention but conversion is weak",
      "Prospects leak between interest and purchase",
      "Your pipeline tracking is inconsistent",
    ],
    scale: [
      "The system lives in your head, not in assets",
      "Lead quality is inconsistent (gems + tire-kickers)",
      "Pipeline is full but close rate drops as you grow",
    ],
  },
  growth: {
    launch: [
      "You react to urgency instead of leading indicators",
      "Every month feels like starting from zero",
      "You chase tactics because there’s no clear loop",
    ],
    reposition: [
      "Direction changes week to week",
      "Growth comes in spurts, not consistently",
      "You track revenue but not the signals that predict it",
    ],
    scale: [
      "Scaling feels chaotic and exhausting",
      "Adding budget doesn’t reliably increase output",
      "You can’t identify the single bottleneck fast",
    ],
  },
};

// Leak intelligence now focuses on: truth + today move + 72h sprint.
// Deeper breakdown promised behind email (benchmarks/case/expanded plan).
const LEAKS: Record<ForceId, LeakInfo> = {
  essence: {
    leakName: "BLURRY MECHANISM",
    humanSymptom: 'People say: “Interesting… but what exactly do you do?”',
    whatItMeans:
      "Your work may be strong, but the signal is noisy. If the mechanism isn’t named and repeatable, trust stays slow and price stays fragile.",
    todayMove:
      'Write ONE sentence and place it on your hero + bio: “I help [WHO] get [OUTCOME] using [MECHANISM] in [TIME].”',
    sprint72h: [
      "Name the mechanism (2–4 words). If you can’t name it, you don’t own it yet.",
      "Rewrite your hero: Outcome + Mechanism + Proof + One CTA.",
      "Publish one belief you own (a clear “this, not that”).",
    ],
    proofTease:
      "Full breakdown includes: a mechanism naming framework, proof-stack prompts, and positioning examples matched to your stage.",
    auditReason:
      "The Audit turns your mechanism into a blueprint: positioning boundaries, proof stack, and a flagship offer path that makes premium pricing logical.",
  },
  identity: {
    leakName: "STATUS GAP",
    humanSymptom: "You’re good, but you don’t look expensive yet.",
    whatItMeans:
      "Your visual + verbal identity isn’t matching your expertise level. That gap creates negotiation, doubt, and “shopping around.”",
    todayMove:
      "Replace soft claims with proof: outcomes, constraints, and one sharp line you truly stand behind.",
    sprint72h: [
      "Choose one signature element across assets (layout, typography rule, or tone).",
      "Write one “truth post” explaining your model in plain language.",
      "Upgrade your top 1 asset (homepage OR offer page) before posting more content.",
    ],
    proofTease:
      "Full breakdown includes: a credibility stack checklist and a messaging hierarchy to eliminate price justification.",
    auditReason:
      "The Audit designs your authority system: proof order, high-status language rules, and the exact pages/assets to upgrade first.",
  },
  offer: {
    leakName: "VALUE CONFUSION",
    humanSymptom: "People like you… but don’t buy fast.",
    whatItMeans:
      "Too much custom or too many options creates decision paralysis. Without one obvious flagship path, your close rate leaks.",
    todayMove:
      'Write this and enforce it: “This is for X. You get Y by Z. If you’re not X, do not apply.”',
    sprint72h: [
      "Collapse to one flagship + one entry/ascension step (no menu).",
      "Rewrite pricing page: one path, one CTA, clear constraints.",
      "Create one “before → after” breakdown of how the offer transforms the buyer.",
    ],
    proofTease:
      "Full breakdown includes: offer architecture templates and pricing logic that reduces hesitation.",
    auditReason:
      "The Audit outputs decisions + assets: flagship structure, pricing bands, offer page outline, and the conversion path tied to your stage.",
  },
  system: {
    leakName: "PIPELINE FRICTION",
    humanSymptom: "You’re always busy… but revenue isn’t predictable.",
    whatItMeans:
      "Attention isn’t the problem. The path is. If lead capture, follow-up, and filtering aren’t designed, results depend on luck and hustle.",
    todayMove:
      "Write your 6-step happy path: Viewer → Lead → Call → Close → Onboard → Referral. Identify the one step leaking most.",
    sprint72h: [
      "Add one capture point + one follow-up email (minimum viable nurture).",
      "Add one filter question to repel bad fits before calls.",
      "Define a weekly rhythm: proof → CTA → follow-up (repeat).",
    ],
    proofTease:
      "Full breakdown includes: funnel leak map prompts and a simple nurture sequence you can paste today.",
    auditReason:
      "The Audit maps the exact leak and prescribes the first fix with assets: copy blocks, funnel steps, and priorities (not generic advice).",
  },
  growth: {
    leakName: "NO NORTH STAR",
    humanSymptom: "You’re making moves… but direction keeps changing.",
    whatItMeans:
      "Without one leading metric and a weekly loop, growth becomes emotional. You’ll keep switching tactics before anything compounds.",
    todayMove:
      "Pick ONE metric for 30 days (qualified leads/week, close rate, or LTV). Track it weekly on the same day.",
    sprint72h: [
      "Choose one channel to dominate for 30 days (ignore everything else).",
      "Install one referral trigger at the moment of “first win.”",
      "Run a weekly review: metric → bottleneck → one fix → repeat.",
    ],
    proofTease:
      "Full breakdown includes: metric selection rules and a weekly operating loop that keeps execution stable.",
    auditReason:
      "The Audit identifies the single lever to optimize first (signal vs offer vs system) and builds a 30-day execution plan with your constraints.",
  },
};

// ------------------------ HELPERS ------------------------

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

function canUseBrowserAPIs() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function loadState(): State | null {
  if (!canUseBrowserAPIs()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as State;
  } catch {
    return null;
  }
}

function saveState(s: State) {
  if (!canUseBrowserAPIs()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

function removeState() {
  if (!canUseBrowserAPIs()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

// ------------------------ TIMER ------------------------

function useDecayTimer(createdAt: string) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  const created = new Date(createdAt).getTime();
  const expires = created + 48 * 60 * 60 * 1000; // 48h
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
      <div className="wrap">{children}</div>
    </div>
  );
}

function HeaderMini() {
  return (
    <div className="top">
      <div className="brand">
        <span className="pill">Quantum Branding</span>
        <span className="muted">Signal OS</span>
      </div>
      <div className="muted tiny">90 sec • 5 Forces • Find your primary leak</div>
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

// ------------------------ DEFAULT STATE ------------------------

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

// ------------------------ MAIN APP ------------------------

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

      // AHA at question 2 (after 2 answers)
      if (nextIdx === 2 && !prev.ahaShown) {
        return {
          ...prev,
          answers: nextAnswers,
          idx: nextIdx,
          view: "aha",
        };
      }

      // completed
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
    removeState();
    setState({
      ...DEFAULT_STATE,
      createdAtISO: new Date().toISOString(),
    });
  };

  const toEmail = () => setState((prev) => ({ ...prev, view: "email" }));

  const submitEmail = () => {
    // TODO: replace with your actual endpoint (Zapier/Make/Klaviyo/your API).
    // Keep it SSR-safe:
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      console.log("Signal capture:", {
        email: state.email,
        name: state.name,
        website: state.website,
        stage: state.stage,
        primary: diagnosis.primary,
        secondary: diagnosis.secondary,
        scores,
        createdAtISO: state.createdAtISO,
      });

      window.alert(
        `Done. You’ll receive the full breakdown (deeper examples + assets) at ${state.email}.`
      );
    }

    setState((prev) => ({ ...prev, view: "result" }));
  };

  const toAudit = () => {
    if (typeof window === "undefined") return;

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

  // ------------------------ VIEWS ------------------------

  if (state.view === "start") {
    return (
      <AppShell>
        <HeaderMini />

        <div className="hero">
          <div className="h1">Find the one leak weakening your brand right now.</div>
          <div className="sub">
            90 seconds. 5 questions. You’ll get your primary leak plus the next move.
            <br />
            <b>No email required to see results.</b>
          </div>
        </div>

        <Card>
          <StagePicker value={state.stage} onChange={(s) => setState((p) => ({ ...p, stage: s }))} />

          <div className="ctaRow">
            <Btn variant="primary" onClick={startScan} icon={<Zap size={16} />}>
              Start the Signal Scan
            </Btn>
          </div>

          <div className="trust">
            <div className="trustItem">
              <CheckCircle2 size={14} />
              <span>Fast truth, no fluff</span>
            </div>
            <div className="trustItem">
              <CheckCircle2 size={14} />
              <span>Today move + 72h sprint</span>
            </div>
            <div className="trustItem">
              <CheckCircle2 size={14} />
              <span>Audit is optional (different class)</span>
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  if (state.view === "aha") {
    // “Emerging” is only a hint; we keep it humble and short.
    const sortedSoFar = sortForcesByWeakest(scores);
    const emerging = sortedSoFar[0]?.[0] ?? "essence";
    const meta = FORCES.find((f) => f.id === emerging)!;
    const Icon = meta.icon;

    return (
      <AppShell>
        <HeaderMini />

        <Card className="aha">
          <div className="ahaIcon">
            <Target size={32} />
          </div>

          <div className="ahaTitle">Pattern detected.</div>

          <div className="ahaText">
            Early signal suggests the leak may be in <strong>{meta.label}</strong>.
          </div>

          <div className="ahaForce">
            <Icon size={20} />
            <div>
              <div className="ahaForceName">{meta.label}</div>
              <div className="tiny muted">{meta.micro}</div>
            </div>
          </div>

          <div className="ahaHint">
            Keep going. The next questions confirm whether this is the real bottleneck or just noise.
          </div>

          <div className="ctaRow">
            <Btn variant="primary" onClick={continueFromAha}>
              Continue
            </Btn>
            <Btn variant="secondary" onClick={continueFromAha}>
              Continue (not sure)
            </Btn>
          </div>

          <div className="tiny muted">
            This is a lightweight scan. The Audit is where decisions + assets get built.
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

  if (state.view === "email") {
    const primary = diagnosis.primary;
    const leak = LEAKS[primary];

    return (
      <AppShell>
        <HeaderMini />

        <div className="hero">
          <div className="h1">Get the deeper breakdown (assets + examples).</div>
          <div className="sub">
            You already have your leak. This email unlocks the deeper layer:
            <br />
            <b>{leak.proofTease}</b>
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
              Email me the deeper breakdown
            </Btn>

            <button className="link" type="button" onClick={() => setState((p) => ({ ...p, view: "result" }))}>
              Skip for now
            </button>
          </div>

          <div className="tiny muted">No spam. Just the deeper layer and execution prompts.</div>
        </Card>
      </AppShell>
    );
  }

  // ------------------------ RESULT ------------------------

  const primary = diagnosis.primary;
  const secondary = diagnosis.secondary;
  const primaryInfo = LEAKS[primary];
  const symptoms = MICRO_SYMPTOMS[primary][state.stage].slice(0, 3);

  return (
    <AppShell>
      <HeaderMini />

      <DecayTimer createdAt={state.createdAtISO} />

      <div className="hero">
        <div className="kicker">Your Primary Leak</div>
        <div className="h1 leak">{primaryInfo.leakName}</div>
        <div className="sub">{primaryInfo.humanSymptom}</div>
      </div>

      {/* Specificity bomb, but light */}
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

            <div className="panelTitle mt">72h sprint (keep it simple)</div>
            <ul className="list">
              {primaryInfo.sprint72h.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>

            <div className="divider" />

            <div className="panelTitle">Important</div>
            <div className="panelText small">
              This is a <strong>signal scan</strong>, not a full audit. It tells you <strong>where you leak</strong>.
              The Audit is where we build <strong>decisions + assets</strong> so you can execute.
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

            <div className="panelTitle mt">Next step options</div>
            <div className="panelText small">
              Pick one. Don’t collect insights. Convert them into action.
            </div>

            <div className="commitLadder">
              <button className="commitStep" type="button" onClick={toEmail}>
                <div className="commitIcon">
                  <Send size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Email me the deeper breakdown</div>
                  <div className="commitSub">Free • Assets + examples matched to your stage</div>
                </div>
                <ChevronRight size={18} />
              </button>

              <button className="commitStep" type="button" onClick={toAudit}>
                <div className="commitIcon">
                  <TrendingUp size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Book a 15-min Leak Review</div>
                  <div className="commitSub">Free • Confirm the leak on your site live</div>
                </div>
                <ChevronRight size={18} />
              </button>

              <button className="commitStep primary" type="button" onClick={toAudit}>
                <div className="commitIcon">
                  <Zap size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Run the Full Brand Audit</div>
                  <div className="commitSub">Blueprint + priorities + assets to execute</div>
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

.brand{ display:flex; align-items:center; gap:12px; }

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

.hero{ padding: 24px 0; max-width: 900px; }

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

.card.symptoms{ background:#111; border-color:#333; }

.grid2{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:16px;
}
@media (max-width: 720px){ .grid2{ grid-template-columns: 1fr; } }

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

.stageGrid{ display:grid; grid-template-columns: 1fr; gap:12px; }

.stage{
  border:2px solid #f5f5f5;
  padding:16px;
  text-align:left;
  background:#0a0a0a;
  transition: all .2s cubic-bezier(.4,0,.2,1);
  cursor:pointer;
  font-family: 'Space Mono', monospace;
}
.stage:hover{ transform: translateX(4px); background:#1a1a1a; }
.stage.active{ background:#f5f5f5; color:#0a0a0a; }
.stage.active .muted{ color:#666; }

.stageTitle{ font-weight:700; letter-spacing:-0.01em; font-size:16px; }

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
.btn.primary{ background:#f5f5f5; color:#0a0a0a; }
.btn.primary:hover{
  background:#0a0a0a;
  color:#f5f5f5;
  transform:translateY(-2px);
  box-shadow: 0 8px 16px rgba(245,245,245,0.1);
}
.btn.secondary{ background:#0a0a0a; color:#f5f5f5; }
.btn.secondary:hover{ background:#f5f5f5; color:#0a0a0a; }
.btn.disabled{ opacity:.3; cursor:not-allowed; }

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

.trust{ display:flex; gap:20px; margin-top:20px; flex-wrap:wrap; }
.trustItem{ display:flex; align-items:center; gap:8px; font-size:12px; color:#ccc; }

.scanHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  margin-bottom: 12px;
}
.scanLeft .kicker{ margin-bottom:10px; }

.forceLine{ display:flex; gap:12px; align-items:flex-start; }
.forceName{ font-weight:700; letter-spacing:.08em; font-size:14px; }

.progress{ width:100%; height:3px; background:#333; margin-bottom: 20px; overflow:hidden; }
.progressIn{ height:3px; background:#f5f5f5; transition: width .3s cubic-bezier(.4,0,.2,1); }

.qText{
  font-family: 'Syne', sans-serif;
  font-size: 22px;
  line-height: 1.3;
  letter-spacing: -0.01em;
  font-weight: 600;
  margin-bottom: 20px;
  color:#f5f5f5;
}

.choices{ display:flex; flex-direction:column; gap:12px; }

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
.choice:hover{ transform: translateX(6px); background:#f5f5f5; color:#0a0a0a; }

.choiceDot{
  width:28px; height:28px;
  display:flex; align-items:center; justify-content:center;
  border:2px solid currentColor;
  flex-shrink:0;
}

.choiceText{ flex:1; font-size: 14px; line-height: 1.4; }
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
.timer.expired{ border-color:#f5f5f5; background:#f5f5f5; color:#0a0a0a; }
.timer strong{ color:#f5f5f5; font-weight:700; }
.timer.expired strong{ color:#0a0a0a; }

.ahaIcon{
  margin:0 auto 20px;
  width:64px; height:64px;
  border:2px solid #f5f5f5;
  display:flex; align-items:center; justify-content:center;
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
.ahaForceName{ font-weight:700; letter-spacing:.08em; }

.ahaHint{
  font-size:14px;
  line-height:1.5;
  color:#999;
  margin-bottom:16px;
  max-width:560px;
  margin-left:auto;
  margin-right:auto;
}

.symptoms{ animation: slideIn .4s cubic-bezier(.4,0,.2,1); }
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
.symptomList{ display:flex; flex-direction:column; gap:12px; }
.symptomItem{
  display:flex; align-items:flex-start; gap:12px;
  font-size:14px; line-height:1.5; color:#ccc;
}
.symptomItem svg{ flex-shrink:0; margin-top:2px; color:#f5f5f5; }

.resultGrid{
  display:grid;
  grid-template-columns: 1.1fr .9fr;
  gap:20px;
}
@media (max-width: 900px){
  .resultGrid{ grid-template-columns: 1fr; }
}

.panel{ border:2px solid #333; padding:20px; background:#0a0a0a; }
.panel.soft{ background:#111; }

.panelTitle{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color:#999;
  font-weight:700;
  margin-bottom:12px;
}
.panelText{ font-size:14px; line-height:1.6; color:#ccc; }
.panelText.strong{ font-weight:700; color:#f5f5f5; font-size:15px; }

.mt{ margin-top: 20px; }

.list{ padding-left: 20px; color:#ccc; line-height:1.6; font-size:14px; }
.list li{ margin-bottom:8px; }

.divider{ height:2px; background:#333; margin:20px 0; }

.bars{ margin-top: 16px; display:flex; flex-direction:column; gap:14px; }

.barRow{ display:flex; flex-direction:column; gap:8px; }

.barLeft{ display:flex; align-items:center; justify-content:space-between; gap:12px; }

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
.barIn{ height:100%; background:#f5f5f5; transition: width .6s cubic-bezier(.4,0,.2,1); }

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

.commitLadder{ display:flex; flex-direction:column; gap:12px; margin:20px 0; }

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
  width:40px; height:40px;
  border:2px solid currentColor;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.commitContent{ flex:1; }
.commitTitle{ font-weight:700; font-size:14px; margin-bottom:4px; letter-spacing:.02em; }
.commitSub{ font-size:11px; color:#999; }
.commitStep.primary .commitSub{ color:#666; }

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
