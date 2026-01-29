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
 * QTMBG — SIGNAL OS (Reframed)
 * Goals:
 * - Keep the conversion-optimized logic from your v2
 * - Fix layout harmony on all viewports (no "dead space" feeling)
 * - Remove foreign typography (no Syne/SpaceMono imports)
 * - Use brand tokens (fonts/colors/lines) so it matches qtmbg.com
 *
 * Notes:
 * - Set BRAND.fontSans / BRAND.fontMono to whatever qtmbg.com uses.
 * - If qtmbg uses a hosted font, load it at the site level (not inside this app).
 */

// ------------------------ BRAND TOKENS ------------------------

const BRAND = {
  // Set these to match qtmbg.com exactly.
  // If you don’t know the exact font names, keep these and later replace.
  fontSans:
    'ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", Arial, "Noto Sans", "Liberation Sans", sans-serif',
  fontMono:
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',

  // QTMBG tends to work best with “paper + ink” brutalism.
  bg: "#F6F2EA",
  ink: "#0A0A0A",
  muted: "#5A5A5A",
  soft: "#E7E1D7",
  line: "#0A0A0A",
  panel: "#FFFFFF",
  panel2: "#FBF8F2",

  // Accents (keep subtle)
  accent: "#0A0A0A",
};

type ForceId = "essence" | "identity" | "offer" | "system" | "growth";
type StageId = "launch" | "reposition" | "scale";

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
  { id: "launch", label: "Launching", sub: "Building first demand + first offers" },
  { id: "reposition", label: "Repositioning", sub: "Good product, unclear signal or audience" },
  { id: "scale", label: "Scaling", sub: "You need throughput, not more hustle" },
];

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
    text: "If I land on your brand today, can I understand the unique mechanism you bring?",
    a: { v: 1, label: "No — it sounds like generic services." },
    b: { v: 3, label: "Somewhat — but it isn't named or sharp." },
    c: { v: 5, label: "Yes — it's specific, named, and repeatable." },
  },
  {
    force: "identity",
    text: "Do you look and sound like a premium authority in your space?",
    a: { v: 1, label: "Not yet — it feels inconsistent." },
    b: { v: 3, label: "Clean — but not memorable or high-status." },
    c: { v: 5, label: "Yes — instantly premium and distinct." },
  },
  {
    force: "offer",
    text: "Is your flagship offer obvious and easy to choose?",
    a: { v: 1, label: "No — it's confusing or too many options." },
    b: { v: 3, label: "Kind of — but people still hesitate." },
    c: { v: 5, label: "Yes — one clear flagship with clean pricing." },
  },
  {
    force: "system",
    text: "Is lead flow predictable and controlled (not luck-based)?",
    a: { v: 1, label: "No — feast/famine and manual chasing." },
    b: { v: 3, label: "Somewhat — referrals + occasional wins." },
    c: { v: 5, label: "Yes — repeatable pipeline + nurture." },
  },
  {
    force: "growth",
    text: "Do you have a single metric and a plan that scales without burnout?",
    a: { v: 1, label: "No — I react to urgency." },
    b: { v: 3, label: "Some — I track revenue, not signal quality." },
    c: { v: 5, label: "Yes — north star + weekly execution loop." },
  },
];

const MICRO_SYMPTOMS: Record<ForceId, Record<StageId, string[]>> = {
  essence: {
    launch: [
      "Calls turn into 'so what exactly do you do?' interrogations",
      "You keep tweaking the homepage because it doesn’t feel sharp",
      "You have multiple ways to explain your value depending on who asks",
    ],
    reposition: [
      "Referrals describe you differently than you describe yourself",
      "Your best clients came from an angle you haven’t fully owned",
      "Competitors charge more because their positioning is clearer",
    ],
    scale: [
      "Team struggles to articulate what makes you different",
      "Sales defaults to features instead of the mechanism",
      "Expansion feels risky because the ‘what we do’ isn’t transferable",
    ],
  },
  identity: {
    launch: [
      "You hesitate to share your website with premium prospects",
      "Visuals feel ‘good enough’ but not investment-grade",
      "People like your work but don’t perceive premium yet",
    ],
    reposition: [
      "Brand looks smaller than the level you operate at",
      "Prospects negotiate because you don’t look expensive",
      "You outgrew your identity but didn’t refresh it",
    ],
    scale: [
      "Brand doesn’t match the size of deals you want",
      "Enterprise hesitates due to perceived mismatch",
      "Partnerships soften because perceived credibility isn’t clear",
    ],
  },
  offer: {
    launch: [
      "People like you but say ‘let me think’ then vanish",
      "Custom proposals for every deal",
      "Pricing becomes negotiation almost every time",
    ],
    reposition: [
      "Too many offers create decision paralysis",
      "Your best clients bought something you don’t want to sell now",
      "Revenue exists but you’re unsure what to scale",
    ],
    scale: [
      "Offer architecture is too complex for the team to sell cleanly",
      "Upsell/cross-sell happens by accident",
      "The path isn’t obvious so money leaks",
    ],
  },
  system: {
    launch: [
      "You’re busy but revenue isn’t predictable",
      "Leads come from hustle + luck, not a system",
      "Follow-ups slip because everything is manual",
    ],
    reposition: [
      "You get attention but conversion is low",
      "Leads leak between awareness and purchase",
      "CRM is messy or missing",
    ],
    scale: [
      "System lives in your head, not in assets",
      "Lead quality is inconsistent",
      "Close rate drops as volume increases",
    ],
  },
  growth: {
    launch: [
      "You react to cash instead of leading indicators",
      "Each month feels like starting over",
      "Shiny tactics because the plan isn’t clear",
    ],
    reposition: [
      "You move, but direction changes week to week",
      "Growth comes in spurts, not consistency",
      "You track revenue, not predictive signals",
    ],
    scale: [
      "Scaling feels chaotic and draining",
      "More budget/people doesn’t reliably increase output",
      "You can’t name the single bottleneck slowing everything down",
    ],
  },
};

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
    name: "Client A",
    role: "Agency founder",
    before: "‘We do branding and strategy’ + long calls to explain value",
    after: "Named mechanism + shorter cycles + higher close rate",
    mechanic: "Extract the IP hidden in delivery, name it, make it the offer.",
  },
  identity: {
    name: "Client B",
    role: "B2B consultant",
    before: "Template presence, constant negotiation",
    after: "Upgraded touchpoints, premium perception rises",
    mechanic: "Match identity to expertise level, not comfort zone.",
  },
  offer: {
    name: "Client C",
    role: "Service business",
    before: "Too many offers, slow decisions",
    after: "One flagship path, faster decisions",
    mechanic: "Collapse into one obvious next step with constraints.",
  },
  system: {
    name: "Client D",
    role: "Founder",
    before: "Feast/famine, manual follow-up",
    after: "Repeatable nurture + predictable pipeline",
    mechanic: "Build a simple path: viewer → lead → call → close → onboard.",
  },
  growth: {
    name: "Client E",
    role: "Operator",
    before: "Reactive growth, constant switching",
    after: "One metric + one channel focus",
    mechanic: "Pick the lever that matters, ignore the rest for 90 days.",
  },
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

const LEAKS: Record<ForceId, LeakInfo> = {
  essence: {
    leakName: "BLURRY MECHANISM",
    humanSymptom: 'People say: "Interesting… but what exactly do you do?"',
    whatItMeans:
      "Your value may be strong, but the signal is noisy. If the mechanism isn’t named and repeatable, trust stays slow and price stays fragile.",
    todayMove:
      'Write ONE sentence and place it on your hero + bio: "I help [WHO] get [OUTCOME] using [MECHANISM] in [TIME]."',
    weekPlan: [
      "Name the mechanism (2–4 words). If you can’t name it, you don’t own it yet.",
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
    humanSymptom: "You’re good, but you don’t look expensive yet.",
    whatItMeans:
      "Identity isn’t matching your expertise. That mismatch creates negotiation, doubt, and slower decisions.",
    todayMove:
      "Replace safe language with proof: constraints, outcomes, and one bold line you truly stand behind.",
    weekPlan: [
      "Pick one signature visual rule and apply it everywhere.",
      "Write one model post: your contrarian framework.",
      "Upgrade top assets: homepage, offer page, one case study.",
    ],
    ifYouDont:
      "You keep justifying price and getting compared to cheaper options.",
    ifYouDo:
      "Price objections soften. Premium clients self-select. Referrals come better-qualified.",
    auditReason:
      "The Audit identifies credibility gaps and installs a clear proof hierarchy across your touchpoints.",
  },
  offer: {
    leakName: "VALUE CONFUSION",
    humanSymptom: "People like you… but decisions are slow.",
    whatItMeans:
      "No single obvious flagship path. Too many options or too much custom creates paralysis.",
    todayMove:
      'Write: "This is for X. You get Y by Z. If you’re not X, do not apply."',
    weekPlan: [
      "Collapse into 1 flagship + 1 entry/ascension step.",
      "Rewrite pricing page: one path, one CTA.",
      "Publish one teardown that shows the after-state your offer creates.",
    ],
    ifYouDont:
      "You keep building proposals and hearing ‘let me think’. Close rate stays fragile.",
    ifYouDo:
      "Decision time drops. Conversion improves. Scarcity becomes real because the path is clear.",
    auditReason:
      "The Audit aligns offer architecture, pricing logic, and conversion flow so buyers stop hesitating.",
  },
  system: {
    leakName: "PIPELINE FRICTION",
    humanSymptom: "You’re busy… but cash isn’t predictable.",
    whatItMeans:
      "The path from attention → cash leaks. You might have demand, but not control.",
    todayMove:
      "Write your happy path in 6 steps: Viewer → Lead → Call → Close → Onboard → Referral.",
    weekPlan: [
      "Install one lead capture + one follow-up email.",
      "Add one booking filter question to repel bad fits.",
      "Create one weekly nurture loop: proof + CTA.",
    ],
    ifYouDont:
      "Revenue remains random. Scaling becomes ‘work more’, not ‘system better’.",
    ifYouDo:
      "You can forecast. You know what inputs create cash. You scale without chaos.",
    auditReason:
      "The Audit maps the exact leak: where prospects drop, why, and what to change first.",
  },
  growth: {
    leakName: "NO NORTH STAR",
    humanSymptom: "You’re moving… but direction keeps shifting.",
    whatItMeans:
      "No clean metric + rhythm. Growth becomes reactive and exhausting.",
    todayMove:
      "Pick ONE metric for 30 days (qualified leads/week, close rate, or LTV) and track it weekly.",
    weekPlan: [
      "Choose one channel to dominate for 30 days.",
      "Add one referral trigger at the moment of ‘first win’.",
      "Weekly review: metric → bottleneck → one fix → repeat.",
    ],
    ifYouDont:
      "You keep chasing tactics and feeling behind. Momentum stays inconsistent.",
    ifYouDo:
      "Decisions become obvious. You build compounding momentum instead of frantic output.",
    auditReason:
      "The Audit identifies what to optimize first so you scale without chaos: signal, offer, or system.",
  },
};

// ------------------------ UTIL ------------------------

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
  emailSent: boolean;
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
  emailSent: false,
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

function useDecayTimer(createdAt: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, []);
  const created = new Date(createdAt).getTime();
  const expires = created + 48 * 60 * 60 * 1000;
  const remaining = Math.max(0, expires - now);
  const hours = Math.floor(remaining / (60 * 60 * 1000));
  const mins = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000));
  const secs = Math.floor((remaining % (60 * 1000)) / 1000);
  return { hours, mins, secs, expired: remaining === 0 };
}

// ------------------------ UI ------------------------

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="qbg">
      <style>{CSS}</style>
      <div className="wrap">
        <div className="content">{children}</div>
        <div className="footer">
          <div className="footerRail" />
          <div className="footerMeta">
            <span className="footerTag">QTMBG</span>
            <span className="footerText">
              Signal OS is a scan, not a full audit. Use it to convert insight into action.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function HeaderMini() {
  return (
    <div className="top">
      <div className="brand">
        <span className="pill">QUANTUM BRANDING</span>
        <span className="muted">Signal OS</span>
      </div>
      <div className="muted tiny">90 sec • 5 forces • primary leak</div>
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
      <span className="btnText">{children}</span>
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
        <span>Insights expired — retake scan for a fresh read</span>
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

  const startScan = () => {
    setState((prev) => ({
      ...prev,
      view: "scan",
      idx: 0,
      answers: {},
      ahaShown: false,
      createdAtISO: new Date().toISOString(),
      emailSent: false,
    }));
  };

  const pick = (force: ForceId, v: Choice) => {
    setState((prev) => {
      const nextAnswers = { ...prev.answers, [force]: v };
      const nextIdx = prev.idx + 1;

      if (nextIdx === 2 && !prev.ahaShown) {
        return { ...prev, answers: nextAnswers, idx: nextIdx, view: "aha" };
      }

      if (nextIdx >= total) {
        return { ...prev, answers: nextAnswers, idx: prev.idx, view: "result" };
      }

      return { ...prev, answers: nextAnswers, idx: nextIdx };
    });
  };

  const continueFromAha = () => setState((p) => ({ ...p, view: "scan", ahaShown: true }));

  const goBack = () => setState((p) => ({ ...p, idx: Math.max(0, p.idx - 1) }));

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({ ...DEFAULT_STATE, createdAtISO: new Date().toISOString() });
  };

  const toEmail = () => setState((p) => ({ ...p, view: "email" }));

  const submitEmail = () => {
    // Replace with real API call later.
    setState((p) => ({ ...p, emailSent: true }));
    setTimeout(() => {
      setState((p) => ({ ...p, view: "result" }));
    }, 700);
  };

  const toAudit = () => {
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
          <div className="kicker">Signal Scan</div>
          <div className="h1">Find the one thing weakening your brand right now.</div>
          <div className="sub">
            90 seconds. 5 questions. You get your primary leak and the next move.
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
        </Card>
      </AppShell>
    );
  }

  if (state.view === "aha") {
    const sortedSoFar = sortForcesByWeakest({ ...scores });
    const emerging = sortedSoFar[0]?.[0] ?? "essence";
    const emergingMeta = FORCES.find((f) => f.id === emerging)!;
    const EmergingIcon = emergingMeta.icon;

    return (
      <AppShell>
        <HeaderMini />

        <Card className="aha">
          <div className="ahaIcon">
            <Target size={22} />
          </div>

          <div className="ahaTitle">Pattern detected.</div>
          <div className="ahaText">
            Based on your first answers, your signal likely leaks in <strong>{emergingMeta.label}</strong>.
          </div>

          <div className="ahaForce">
            <EmergingIcon size={18} />
            <div>
              <div className="ahaForceName">{emergingMeta.label}</div>
              <div className="tiny muted">{emergingMeta.micro}</div>
            </div>
          </div>

          <div className="ahaHint">
            {emerging === "essence" && "Usually: mechanism isn’t named or sharp enough to create instant trust."}
            {emerging === "identity" && "Usually: identity doesn’t match the level you want to charge."}
            {emerging === "offer" && "Usually: no obvious flagship path, too much choice."}
            {emerging === "system" && "Usually: lead flow is not controlled, too much luck."}
            {emerging === "growth" && "Usually: no metric rhythm, decisions stay reactive."}
          </div>

          <div className="ctaRow">
            <Btn variant="primary" onClick={continueFromAha}>
              Confirm it
            </Btn>
            <Btn variant="secondary" onClick={continueFromAha}>
              Keep going
            </Btn>
          </div>

          <div className="tiny muted">
            The next questions confirm or refine the diagnosis.
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
              <Icon size={16} />
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
    return (
      <AppShell>
        <HeaderMini />

        <div className="hero">
          <div className="kicker">Optional</div>
          <div className="h1">Email the full breakdown</div>
          <div className="sub">
            Get the complete leak analysis + benchmarks + a short walkthrough video.
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
              disabled={!state.email || state.emailSent}
              icon={<Send size={16} />}
            >
              {state.emailSent ? "Sent" : "Send it"}
            </Btn>

            <button className="link" type="button" onClick={() => setState((p) => ({ ...p, view: "result" }))}>
              Skip
            </button>
          </div>

          <div className="tiny muted">
            No spam. Only the breakdown. Unsubscribe anytime.
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
        <div className="leakBox">{primaryInfo.leakName}</div>
        <div className="sub">{primaryInfo.humanSymptom}</div>
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
              This is a signal scan. Not a full audit. It tells you where you leak. The Audit is where we build decisions + assets.
            </div>
          </div>

          <div className="panel soft">
            <div className="caseAnchor">
              <div className="caseTitle">What fixing it looks like:</div>
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
                      <div className={`tag ${isPrimary ? "tagHard" : isSecondary ? "tagWarn" : ""}`}>{tag}</div>
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
                  <div className="commitTitle">Email me the breakdown</div>
                  <div className="commitSub">Free • Save this analysis</div>
                </div>
                <ChevronRight size={18} />
              </button>

              <button className="commitStep" type="button" onClick={toAudit}>
                <div className="commitIcon">
                  <TrendingUp size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Book a 15-min leak review</div>
                  <div className="commitSub">Free • Confirm the leak on your site</div>
                </div>
                <ChevronRight size={18} />
              </button>

              <button className="commitStep primary" type="button" onClick={toAudit}>
                <div className="commitIcon">
                  <Zap size={18} />
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
:root{
  --bg:${BRAND.bg};
  --ink:${BRAND.ink};
  --muted:${BRAND.muted};
  --soft:${BRAND.soft};
  --line:${BRAND.line};
  --panel:${BRAND.panel};
  --panel2:${BRAND.panel2};
  --sans:${BRAND.fontSans};
  --mono:${BRAND.fontMono};
}

*{margin:0;padding:0;box-sizing:border-box;}

.qbg{
  min-height:100vh;
  color:var(--ink);
  background: var(--bg);
  font-family: var(--sans);
  line-height:1.5;

  /* subtle specimen grid so “empty space” feels designed */
  background-image:
    linear-gradient(to right, rgba(10,10,10,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(10,10,10,0.05) 1px, transparent 1px);
  background-size: 56px 56px;
}

.wrap{
  max-width: 1120px;
  margin: 0 auto;
  padding: 28px 18px 18px;

  /* full-height layout: eliminates “dead space” feeling */
  min-height: 100vh;
  display:flex;
  flex-direction:column;
}

.content{
  flex:1;
}

.top{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:16px;
  padding-bottom: 14px;
  border-bottom:1px solid var(--line);
  margin-bottom: 18px;
}

.brand{ display:flex; align-items:center; gap:12px; }
.pill{
  border:1px solid var(--line);
  padding:7px 10px;
  font-size:10px;
  letter-spacing:.22em;
  text-transform:uppercase;
  font-weight:700;
  background:var(--ink);
  color:var(--bg);
  font-family: var(--mono);
}

.muted{ color:var(--muted); }
.tiny{ font-size:11px; line-height:1.4; }
.small{ font-size:13px; line-height:1.5; }
.mt{ margin-top: 16px; }

.hero{ padding: 18px 0; max-width: 920px; }

.kicker{
  font-size:11px;
  letter-spacing:.24em;
  text-transform:uppercase;
  color:var(--muted);
  margin-bottom:10px;
  font-weight:700;
  font-family: var(--mono);
}

.h1{
  font-size: clamp(26px, 3.6vw, 44px);
  line-height: 1.1;
  letter-spacing: -0.02em;
  font-weight: 700;
}

.sub{
  margin-top:12px;
  font-size:15px;
  line-height:1.65;
  color:var(--muted);
  max-width: 760px;
}

.sub b{ color:var(--ink); font-weight:700; }

.leakBox{
  display:inline-block;
  margin-top:6px;
  border:1px solid var(--line);
  background: var(--ink);
  color: var(--bg);
  padding: 10px 14px;
  font-family: var(--mono);
  letter-spacing: .08em;
  text-transform: uppercase;
  font-weight: 800;
}

.card{
  border:1px solid var(--line);
  padding: 18px;
  background: var(--panel);
  margin-bottom:14px;
}

.card.aha{ background: var(--panel2); }

.card.symptoms{
  background: var(--panel2);
}

.grid2{
  display:grid;
  grid-template-columns: 1fr 1fr;
  gap:14px;
}

@media (max-width: 720px){
  .grid2{ grid-template-columns: 1fr; }
}

.field{ margin-bottom: 14px; }

.label{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color:var(--muted);
  margin-bottom:10px;
  font-weight:700;
  font-family: var(--mono);
}

.req{ color:var(--ink); }

.input{
  width:100%;
  border:1px solid var(--line);
  padding:12px 10px;
  font-size:15px;
  outline:none;
  background:transparent;
  color:var(--ink);
  font-family: var(--sans);
}

.input::placeholder{ color:rgba(10,10,10,.45); }

.stageGrid{
  display:grid;
  grid-template-columns: 1fr;
  gap:10px;
}

.stage{
  border:1px solid var(--line);
  padding:14px;
  text-align:left;
  background:transparent;
  cursor:pointer;
  font-family: var(--sans);
}

.stage:hover{ background: var(--panel2); }

.stage.active{
  background: var(--ink);
  color: var(--bg);
}

.stage.active .muted{ color: rgba(246,242,234,.75); }

.stageTitle{
  font-weight:700;
  letter-spacing:-0.01em;
  font-size:16px;
}

.btn{
  border:1px solid var(--line);
  padding:12px 14px;
  display:inline-flex;
  align-items:center;
  gap:10px;
  letter-spacing:.18em;
  font-size:11px;
  cursor:pointer;
  font-family: var(--mono);
  font-weight:700;
  text-transform: uppercase;
}

.btnText{ letter-spacing:.16em; }

.btn.primary{
  background:var(--ink);
  color:var(--bg);
}

.btn.primary:hover{ opacity:.92; }

.btn.secondary{
  background:transparent;
  color:var(--ink);
}

.btn.secondary:hover{ background: var(--panel2); }

.btn.disabled{
  opacity:.35;
  cursor:not-allowed;
}

.link{
  background:transparent;
  border:none;
  padding:0;
  color:var(--muted);
  text-decoration: underline;
  cursor:pointer;
  font-family: var(--mono);
  font-size:12px;
}

.link:hover{ color:var(--ink); }

.ctaRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:14px;
  margin-top: 6px;
  flex-wrap:wrap;
}

.trust{
  display:flex;
  gap:18px;
  margin-top:16px;
  flex-wrap:wrap;
}

.trustItem{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:12px;
  color:var(--muted);
  font-family: var(--mono);
}

.scanHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  margin-bottom: 12px;
}

.forceLine{ display:flex; gap:10px; align-items:flex-start; }
.forceName{
  font-weight:800;
  letter-spacing:.12em;
  font-size:12px;
  font-family: var(--mono);
}

.progress{
  width:100%;
  height:2px;
  background: rgba(10,10,10,.12);
  margin-bottom: 16px;
  overflow:hidden;
}

.progressIn{
  height:2px;
  background: var(--ink);
  transition: width .25s ease;
}

.qText{
  font-size: 18px;
  line-height: 1.35;
  letter-spacing: -0.01em;
  font-weight: 700;
  margin-bottom: 16px;
}

.choices{ display:flex; flex-direction:column; gap:10px; }

.choice{
  display:flex;
  align-items:center;
  gap:12px;
  width:100%;
  text-align:left;
  border:1px solid var(--line);
  background:transparent;
  padding:14px;
  cursor:pointer;
  font-family: var(--sans);
}

.choice:hover{ background: var(--panel2); }

.choiceDot{
  width:28px;
  height:28px;
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid var(--line);
  flex-shrink:0;
}

.choiceText{ flex:1; font-size:14px; line-height: 1.4; }
.chev{ opacity:.5; flex-shrink:0; }

.timer{
  display:flex;
  align-items:center;
  gap:10px;
  padding:10px 12px;
  background: var(--panel);
  border:1px solid var(--line);
  margin-bottom:14px;
  font-size:12px;
  color:var(--muted);
  font-family: var(--mono);
}

.timer.expired{
  background: var(--ink);
  color: var(--bg);
}

.timer strong{ color:var(--ink); font-weight:800; }
.timer.expired strong{ color:var(--bg); }

.ahaIcon{
  margin:0 auto 14px;
  width:54px; height:54px;
  border:1px solid var(--line);
  display:flex; align-items:center; justify-content:center;
}

.ahaTitle{
  font-size:20px;
  font-weight:800;
  margin-bottom:10px;
}

.ahaText{
  font-size:14px;
  line-height:1.6;
  color:var(--muted);
  margin-bottom:14px;
}

.ahaForce{
  display:inline-flex;
  gap:10px;
  align-items:center;
  padding:10px 12px;
  border:1px solid var(--line);
  background: transparent;
  margin-bottom:12px;
}

.ahaForceName{ font-weight:800; letter-spacing:.12em; font-family: var(--mono); font-size:12px; }
.ahaHint{ font-size:13px; color:var(--muted); margin-bottom: 10px; }

.symptomsTitle{
  font-size:12px;
  letter-spacing:.18em;
  text-transform:uppercase;
  color:var(--muted);
  font-weight:800;
  margin-bottom:12px;
  font-family: var(--mono);
}

.symptomList{ display:flex; flex-direction:column; gap:10px; }
.symptomItem{
  display:flex;
  align-items:flex-start;
  gap:10px;
  font-size:13px;
  line-height:1.5;
  color:var(--muted);
}
.symptomItem svg{ flex-shrink:0; margin-top:2px; }

.resultGrid{
  display:grid;
  grid-template-columns: 1.1fr .9fr;
  gap:16px;
}
@media (max-width: 900px){ .resultGrid{ grid-template-columns: 1fr; } }

.panel{
  border:1px solid var(--line);
  padding:16px;
  background: var(--panel);
}
.panel.soft{ background: var(--panel2); }

.panelTitle{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color:var(--muted);
  font-weight:800;
  margin-bottom:10px;
  font-family: var(--mono);
}

.panelText{ font-size:13px; line-height:1.65; color:var(--muted); }
.panelText.strong{ font-weight:800; color:var(--ink); }

.list{ padding-left: 18px; color:var(--muted); line-height:1.65; font-size:13px; }
.list li{ margin-bottom:7px; }

.benchmark{
  display:flex; flex-direction:column; gap:8px;
  padding:12px;
  background: transparent;
  border:1px solid var(--line);
  margin-bottom:10px;
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
.benchLabel{ color:var(--muted); }
.benchValue{ font-weight:900; font-family: var(--mono); color:var(--ink); }

.outcomes{
  margin-top:14px;
  display:flex;
  flex-direction:column;
  gap:10px;
}
.outcome{ padding:12px; border:1px solid var(--line); background: transparent; }
.outcomeLabel{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  margin-bottom:8px;
  font-weight:900;
  font-family: var(--mono);
}
.outcomeText{ font-size:13px; line-height:1.6; color:var(--muted); }

.caseAnchor{
  padding:14px;
  background: transparent;
  border:1px solid var(--line);
  margin-bottom:14px;
}

.caseTitle{
  font-size:11px;
  letter-spacing:.18em;
  text-transform:uppercase;
  color:var(--muted);
  margin-bottom:12px;
  font-weight:900;
  font-family: var(--mono);
}
.caseName{ font-size:14px; font-weight:800; margin-bottom:10px; }
.caseRow{ display:flex; gap:10px; margin-bottom:8px; font-size:13px; line-height:1.5; }
.caseLabel{ color:var(--muted); font-weight:900; min-width:60px; font-family: var(--mono); }
.caseValue{ color:var(--muted); flex:1; }
.caseValue.highlight{ color:var(--ink); font-weight:900; }
.caseMechanic{ margin-top:10px; padding-top:10px; border-top:1px solid rgba(10,10,10,.2); font-size:13px; color:var(--muted); }

.divider{ height:1px; background: rgba(10,10,10,.2); margin:14px 0; }

.bars{ margin-top: 12px; display:flex; flex-direction:column; gap:12px; }
.barLeft{ display:flex; align-items:center; justify-content:space-between; gap:12px; }
.barName{ font-size:12px; letter-spacing:.16em; font-weight:900; font-family: var(--mono); }
.tag{ font-size:9px; letter-spacing:.2em; text-transform:uppercase; color:var(--muted); font-weight:900; font-family: var(--mono); }
.tagHard{ color:var(--bg); background: var(--ink); padding:4px 8px; }
.tagWarn{ color:var(--ink); background: var(--soft); padding:4px 8px; }

.barWrap{
  position:relative;
  border:1px solid var(--line);
  height: 26px;
  background: transparent;
  overflow:hidden;
}
.barIn{ height:100%; background: var(--ink); transition: width .45s ease; }
.barPct{
  position:absolute;
  right:10px;
  top:50%;
  transform: translateY(-50%);
  font-size:12px;
  color: var(--bg);
  font-weight:900;
  font-family: var(--mono);
  mix-blend-mode: difference;
}

.commitLadder{ display:flex; flex-direction:column; gap:10px; margin:14px 0; }

.commitStep{
  display:flex;
  align-items:center;
  gap:12px;
  padding:14px;
  border:1px solid var(--line);
  background: transparent;
  cursor:pointer;
  text-align:left;
  font-family: var(--sans);
}
.commitStep:hover{ background: var(--panel2); }
.commitStep.primary{ background: var(--ink); color: var(--bg); }
.commitStep.primary:hover{ opacity:.92; }

.commitIcon{
  width:40px; height:40px;
  border:1px solid currentColor;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0;
}
.commitContent{ flex:1; }
.commitTitle{ font-weight:900; font-size:13px; margin-bottom:4px; }
.commitSub{ font-size:11px; color: var(--muted); }
.commitStep.primary .commitSub{ color: rgba(246,242,234,.75); }

.footer{
  margin-top: 16px;
  padding-bottom: 10px;
}
.footerRail{
  height:1px;
  background: var(--line);
  margin-bottom: 10px;
}
.footerMeta{
  display:flex;
  align-items:flex-start;
  gap:10px;
}
.footerTag{
  font-family: var(--mono);
  font-size:10px;
  letter-spacing:.22em;
  font-weight:900;
  padding:6px 8px;
  border:1px solid var(--line);
  background: var(--panel);
}
.footerText{
  font-size:12px;
  color: var(--muted);
  line-height:1.5;
  max-width: 720px;
}

@media (max-width: 640px){
  .wrap{ padding:18px 14px 14px; }
  .top{ flex-direction:column; align-items:flex-start; }
  .ctaRow{ flex-direction:column; align-items:stretch; }
  .trust{ flex-direction:column; gap:10px; }
  .resultGrid{ grid-template-columns: 1fr; }
}
`;
