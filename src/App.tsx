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
} from "lucide-react";

/**
 * QUANTUM SIGNAL HOOK OS — v1
 * Purpose: Social hook → 90-sec scan → primary leak → route to full Audit
 * Non-goals: no dashboards, no JSON, no evidence/DoD, no "product" experience.
 * Stack: Vite + React + TS, zero styling deps (no Tailwind flash).
 */

// ------------------------ CONFIG ------------------------

type ForceId = "essence" | "identity" | "offer" | "system" | "growth";
type StageId = "launch" | "reposition" | "scale";

const STORAGE_KEY = "qtmbg-signal-hook-v1";

const FORCES: Array<{
  id: ForceId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  micro: string; // plain-language descriptor
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
    b: { v: 3, label: "Somewhat — but it isn’t named or sharp." },
    c: { v: 5, label: "Yes — it’s specific, named, and repeatable." },
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
    a: { v: 1, label: "No — it’s custom, confusing, or too many options." },
    b: { v: 3, label: "Kind of — but people still hesitate or negotiate." },
    c: { v: 5, label: "Yes — one clear flagship with clean pricing." },
  },
  {
    force: "system",
    text: "Is lead flow predictable and controlled (not luck-based)?",
    a: { v: 1, label: "No — it’s feast/famine and manual chasing." },
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

// Leak intelligence (no jargon, CEO-readable)
const LEAKS: Record<
  ForceId,
  {
    leakName: string;
    humanSymptom: string;
    whatItMeans: string;
    todayMove: string;
    weekPlan: string[];
    auditReason: string;
  }
> = {
  essence: {
    leakName: "BLURRY MECHANISM",
    humanSymptom: "People say: “Interesting… but what exactly do you do?”",
    whatItMeans:
      "Your value isn’t sharp enough to create instant trust. You might be talented, but your signal is noisy.",
    todayMove:
      "Write ONE sentence: “I help [WHO] get [OUTCOME] using [MECHANISM] in [TIME].” Put it on your hero + bio.",
    weekPlan: [
      "Day 1: Name the mechanism (2–4 words).",
      "Day 3: Rewrite hero (outcome + mechanism + proof + CTA).",
      "Day 7: Publish one contrarian belief that your mechanism proves.",
    ],
    auditReason:
      "The Audit will lock your positioning: who you repel, what you claim, and the proof structure that makes premium pricing logical.",
  },
  identity: {
    leakName: "STATUS GAP",
    humanSymptom: "You’re good, but you don’t *look* expensive yet.",
    whatItMeans:
      "Your visual + verbal identity isn’t matching the level you want to charge. This creates negotiation and doubt.",
    todayMove:
      "Remove “safe” language. Replace with proof: numbers, outcomes, constraints, and one bold line you truly believe.",
    weekPlan: [
      "Day 1: Kill template visuals (one signature element across everything).",
      "Day 3: Write one “truth bomb” post (your contrarian model).",
      "Day 7: Upgrade your top 3 assets: homepage, offer page, and one case study.",
    ],
    auditReason:
      "The Audit will identify your credibility gaps and give you a concrete proof stack and messaging hierarchy.",
  },
  offer: {
    leakName: "VALUE CONFUSION",
    humanSymptom: "People like you… but don’t buy fast.",
    whatItMeans:
      "You don’t have a single obvious flagship path. Too many options or too much custom = decision paralysis.",
    todayMove:
      "Choose one flagship. Write: “This is for X. You get Y by Z. If you’re not X, do not apply.”",
    weekPlan: [
      "Day 1: Collapse offers → 1 flagship + 1 entry or ascension step.",
      "Day 3: Rewrite pricing page (one path, one CTA).",
      "Day 7: Publish one teardown: show how your offer creates the after-state.",
    ],
    auditReason:
      "The Audit will align offer architecture, pricing logic, and conversion flow so buyers stop hesitating.",
  },
  system: {
    leakName: "PIPELINE FRICTION",
    humanSymptom: "You’re always busy… but revenue isn’t predictable.",
    whatItMeans:
      "Your conversion system leaks. You might have attention, but not a controlled path from lead to cash.",
    todayMove:
      "Write your ‘happy path’ in 6 steps: Viewer → Lead → Call → Close → Onboard → Referral.",
    weekPlan: [
      "Day 1: Install one lead capture + one follow-up email.",
      "Day 3: Add one booking filter question to repel bad fits.",
      "Day 7: Create one repeatable nurture loop (weekly proof + CTA).",
    ],
    auditReason:
      "The Audit will map the exact funnel leak: where prospects drop, why, and what to change first.",
  },
  growth: {
    leakName: "NO NORTH STAR",
    humanSymptom: "You’re making moves… but direction keeps changing.",
    whatItMeans:
      "You don’t have a clean metric + rhythm. Growth becomes reactive, emotional, and exhausting.",
    todayMove:
      "Pick ONE metric for 30 days (qualified leads/week, close rate, or LTV). Track it weekly on the same day.",
    weekPlan: [
      "Day 1: Choose one channel to dominate for 30 days.",
      "Day 3: Build one referral trigger (ask at the moment of ‘first win’).",
      "Day 7: Create a weekly review: metric → bottleneck → one fix → repeat.",
    ],
    auditReason:
      "The Audit will identify what to optimize first so you scale without chaos: signal, offer, or system.",
  },
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function pctFromChoice(v: Choice) {
  // 1/3/5 mapped to 20/60/100 for clearer user meaning (not “mathy”)
  if (v === 1) return 20;
  if (v === 3) return 60;
  return 100;
}

function sortForcesByWeakest(scores: Record<ForceId, number>) {
  const pairs = (Object.keys(scores) as ForceId[]).map((k) => [k, scores[k]] as const);
  return pairs.sort((a, b) => a[1] - b[1]);
}

function buildAuditUrl(args: {
  stage: StageId;
  name?: string;
  email?: string;
  website?: string;
  primary: ForceId;
  secondary: ForceId;
  scores: Record<ForceId, number>;
}) {
  const base = "https://audit.qtmbg.com";
  const params = new URLSearchParams();

  params.set("from", "signal");
  params.set("stage", args.stage);
  params.set("primary", args.primary);
  params.set("secondary", args.secondary);

  // keep it simple, readable, and URL-safe (no JSON)
  // format: essence-60,identity-20,offer-60,system-20,growth-60
  const compactScores = (Object.keys(args.scores) as ForceId[])
    .map((k) => `${k}-${args.scores[k]}`)
    .join(",");
  params.set("scores", compactScores);

  if (args.name) params.set("name", args.name);
  if (args.email) params.set("email", args.email);
  if (args.website) params.set("website", args.website);

  return `${base}/?${params.toString()}`;
}

// ------------------------ UI ------------------------

type View = "start" | "scan" | "result";

type Subject = {
  name: string;
  email: string;
  website: string;
  stage: StageId;
};

type State = {
  subject: Subject;
  idx: number;
  answers: Partial<Record<ForceId, Choice>>;
  view: View;
  createdAtISO: string;
};

const DEFAULT_SUBJECT: Subject = {
  name: "",
  email: "",
  website: "",
  stage: "launch",
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
        <span className="muted">Signal Hook OS</span>
      </div>
      <div className="muted tiny">90 seconds • 5 Forces • One leak</div>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="card">{children}</div>;
}

function Btn({
  children,
  onClick,
  variant = "primary",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={`btn ${variant} ${disabled ? "disabled" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  required,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  type?: string;
}) {
  return (
    <div className="field">
      <div className="label">
        {label} {required ? <span className="req">*</span> : null}
      </div>
      <input
        className="input"
        value={value}
        type={type}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
      />
    </div>
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

// ------------------------ MAIN ------------------------

export default function App() {
  const hydrated = useMemo(() => loadState(), []);
  const [state, setState] = useState<State>(() => {
    if (hydrated) return hydrated;
    return {
      subject: DEFAULT_SUBJECT,
      idx: 0,
      answers: {},
      view: "start",
      createdAtISO: new Date().toISOString(),
    };
  });

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
    // note: unanswered forces show 0; but in result we only compute after all answered
    const primary = sorted[0]?.[0] ?? "essence";
    const secondary = sorted[1]?.[0] ?? "identity";
    return { primary, secondary };
  }, [scores]);

  const canStart = state.subject.stage && true;

  const startScan = () => {
    setState((prev) => ({
      ...prev,
      view: "scan",
      idx: 0,
      answers: {},
      createdAtISO: new Date().toISOString(),
    }));
  };

  const pick = (force: ForceId, v: Choice) => {
    setState((prev) => {
      const nextAnswers = { ...prev.answers, [force]: v };
      const nextIdx = prev.idx + 1;

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

  const goBack = () => {
    setState((prev) => ({
      ...prev,
      idx: Math.max(0, prev.idx - 1),
    }));
  };

  const restart = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState({
      subject: DEFAULT_SUBJECT,
      idx: 0,
      answers: {},
      view: "start",
      createdAtISO: new Date().toISOString(),
    });
  };

  const toAudit = () => {
    const url = buildAuditUrl({
      stage: state.subject.stage,
      name: state.subject.name || undefined,
      email: state.subject.email || undefined,
      website: state.subject.website || undefined,
      primary: diagnosis.primary,
      secondary: diagnosis.secondary,
      scores,
    });
    window.location.href = url;
  };

  // ------------------------ RENDER ------------------------

  if (state.view === "start") {
    return (
      <AppShell>
        <HeaderMini />
        <div className="hero">
          <div className="h1">Find the one thing weakening your brand right now.</div>
          <div className="sub">
            This is a <b>Signal Scan</b>. Not a deep audit. 5 questions. You’ll get your primary leak and the next move.
          </div>
        </div>

        <Card>
          <div className="grid2">
            <Input
              label="Name"
              value={state.subject.name}
              onChange={(v) => setState((p) => ({ ...p, subject: { ...p.subject, name: v } }))}
              placeholder="Optional"
            />
            <Input
              label="Email"
              type="email"
              value={state.subject.email}
              onChange={(v) => setState((p) => ({ ...p, subject: { ...p.subject, email: v } }))}
              placeholder="Optional (recommended)"
            />
          </div>

          <Input
            label="Website"
            value={state.subject.website}
            onChange={(v) => setState((p) => ({ ...p, subject: { ...p.subject, website: v } }))}
            placeholder="Optional"
          />

          <StagePicker
            value={state.subject.stage}
            onChange={(s) => setState((p) => ({ ...p, subject: { ...p.subject, stage: s } }))}
          />

          <div className="ctaRow">
            <Btn variant="primary" onClick={startScan} disabled={!canStart}>
              <Zap size={16} />
              Start the Signal Scan
              <ArrowRight size={16} />
            </Btn>
            <button className="link" type="button" onClick={restart}>
              Reset
            </button>
          </div>

          <div className="tiny muted">
            You’ll get value before any “buy” is mentioned. This is designed to be useful first.
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
            <div className="kicker">Question {state.idx + 1} / {total}</div>
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

          <div className="tiny muted">
            This scan finds the <b>primary leak</b>. The Audit will tell you exactly how to fix it.
          </div>
        </Card>
      </AppShell>
    );
  }

  // RESULT
  const primary = diagnosis.primary;
  const secondary = diagnosis.secondary;
  const primaryInfo = LEAKS[primary];

  return (
    <AppShell>
      <HeaderMini />

      <div className="hero">
        <div className="kicker">Your Primary Leak</div>
        <div className="h1 leak">{primaryInfo.leakName}</div>
        <div className="sub">{primaryInfo.humanSymptom}</div>
      </div>

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
          </div>

          <div className="panel soft">
            <div className="panelTitle">Signal snapshot</div>

            <div className="bars">
              {(Object.keys(scores) as ForceId[]).map((f) => {
                const meta = FORCES.find((x) => x.id === f)!;
                const pct = scores[f];
                const isPrimary = f === primary;
                const isSecondary = f === secondary;
                const tag = isPrimary ? "PRIMARY" : isSecondary ? "SECONDARY" : bandLabel(pct);

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

            <div className="panelTitle mt">Why run the Audit now</div>
            <div className="panelText">{primaryInfo.auditReason}</div>

            <div className="ctaCol">
              <Btn variant="primary" onClick={toAudit}>
                Run the Full Brand Audit
                <ArrowRight size={16} />
              </Btn>
              <button className="link" type="button" onClick={restart}>
                New scan
              </button>
            </div>

            <div className="tiny muted">
              We pass your leak + scores into the Audit so you don’t start from zero.
            </div>
          </div>
        </div>
      </Card>
    </AppShell>
  );
}

// ------------------------ CSS (no Tailwind, no flash) ------------------------

const CSS = `
.qbg{
  min-height:100vh;
  background:#fff;
  color:#000;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
.wrap{
  max-width: 980px;
  margin: 0 auto;
  padding: 28px 18px 64px;
}
.top{
  display:flex;
  align-items:flex-end;
  justify-content:space-between;
  gap:12px;
  padding-bottom: 18px;
  border-bottom:1px solid #000;
  margin-bottom: 18px;
}
.brand{
  display:flex;
  align-items:center;
  gap:10px;
}
.pill{
  border:1px solid #000;
  padding:6px 10px;
  font-size:11px;
  letter-spacing:.18em;
  text-transform:uppercase;
}
.muted{ color:#666; }
.tiny{ font-size:11px; line-height:1.35; }
.hero{
  padding: 18px 0 18px;
}
.kicker{
  font-size:11px;
  letter-spacing:.18em;
  text-transform:uppercase;
  color:#666;
  margin-bottom:10px;
}
.h1{
  font-size: clamp(28px, 4.2vw, 54px);
  line-height: 1.02;
  letter-spacing: -0.04em;
  font-weight: 800;
}
.h1.leak{
  border:1px solid #000;
  display:inline-block;
  padding:10px 14px;
  margin-top:6px;
}
.sub{
  margin-top:12px;
  font-size:14px;
  line-height:1.5;
  color:#333;
  max-width: 820px;
}
.card{
  border:1px solid #000;
  padding: 18px;
  background:#fff;
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
  letter-spacing:.18em;
  text-transform:uppercase;
  color:#666;
  margin-bottom:8px;
}
.req{ color:#000; }
.input{
  width:100%;
  border: none;
  border-bottom:1px solid #000;
  padding:10px 2px;
  font-size:14px;
  outline:none;
}
.stageGrid{
  display:grid;
  grid-template-columns: 1fr;
  gap:10px;
}
.stage{
  border:1px solid #000;
  padding:12px;
  text-align:left;
  background:#fff;
  transition: transform .12s ease, background .12s ease, color .12s ease;
  cursor:pointer;
}
.stage:hover{ transform: translateX(3px); }
.stage.active{
  background:#000;
  color:#fff;
}
.stageTitle{
  font-weight:800;
  letter-spacing:-0.02em;
}
.btn{
  border:1px solid #000;
  padding:12px 14px;
  display:inline-flex;
  align-items:center;
  gap:10px;
  text-transform:uppercase;
  letter-spacing:.16em;
  font-size:12px;
  cursor:pointer;
  transition: background .12s ease, color .12s ease;
}
.btn.primary{
  background:#000;
  color:#fff;
}
.btn.primary:hover{
  background:#fff;
  color:#000;
}
.btn.secondary{
  background:#fff;
  color:#000;
}
.btn.secondary:hover{
  background:#000;
  color:#fff;
}
.btn.disabled{
  opacity:.35;
  cursor:not-allowed;
}
.link{
  background:transparent;
  border:none;
  padding:0;
  color:#666;
  text-decoration: underline;
  cursor:pointer;
}
.ctaRow{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
  margin-top: 6px;
}
.scanHead{
  display:flex;
  align-items:flex-start;
  justify-content:space-between;
  gap:12px;
  margin-bottom: 10px;
}
.scanLeft .kicker{
  margin-bottom:8px;
}
.forceLine{
  display:flex;
  gap:10px;
  align-items:flex-start;
}
.forceName{
  font-weight:900;
  letter-spacing:.06em;
}
.progress{
  width:100%;
  height:2px;
  background:#eee;
  margin-bottom: 16px;
}
.progressIn{
  height:2px;
  background:#000;
  transition: width .18s ease;
}
.qText{
  font-size: 20px;
  line-height: 1.25;
  letter-spacing: -0.02em;
  font-weight: 800;
  margin-bottom: 14px;
}
.choices{
  display:flex;
  flex-direction:column;
  gap:10px;
}
.choice{
  display:flex;
  align-items:center;
  gap:10px;
  width:100%;
  text-align:left;
  border:1px solid #000;
  background:#fff;
  padding:14px;
  cursor:pointer;
  transition: transform .12s ease, background .12s ease, color .12s ease;
}
.choice:hover{
  transform: translateX(4px);
  background:#000;
  color:#fff;
}
.choiceDot{
  width:26px;
  height:26px;
  display:flex;
  align-items:center;
  justify-content:center;
  border:1px solid currentColor;
}
.choiceText{
  flex:1;
  font-size: 14px;
  line-height: 1.35;
}
.chev{ opacity:.6; }
.resultGrid{
  display:grid;
  grid-template-columns: 1.05fr .95fr;
  gap:14px;
}
@media (max-width: 900px){
  .resultGrid{ grid-template-columns: 1fr; }
}
.panel{
  border:1px solid #000;
  padding:14px;
  background:#fff;
}
.panel.soft{
  background:#f7f7f7;
}
.panelTitle{
  font-size:11px;
  letter-spacing:.18em;
  text-transform:uppercase;
  color:#666;
}
.panelText{
  margin-top:10px;
  font-size:14px;
  line-height:1.55;
  color:#111;
}
.panelText.strong{
  font-weight:900;
}
.mt{ margin-top: 16px; }
.list{
  margin-top:10px;
  padding-left: 18px;
  color:#111;
  line-height:1.55;
}
.bars{
  margin-top: 12px;
  display:flex;
  flex-direction:column;
  gap:10px;
}
.barRow{
  display:flex;
  flex-direction:column;
  gap:6px;
}
.barLeft{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:12px;
}
.barName{
  font-size:12px;
  letter-spacing:.12em;
  font-weight:900;
}
.tag{
  font-size:10px;
  letter-spacing:.18em;
  text-transform:uppercase;
  color:#666;
}
.tagHard{ color:#000; font-weight:900; }
.tagWarn{ color:#000; font-weight:900; }
.barWrap{
  position:relative;
  border:1px solid #000;
  height: 22px;
  background:#fff;
}
.barIn{
  height:100%;
  background:#000;
}
.barPct{
  position:absolute;
  right:8px;
  top:50%;
  transform: translateY(-50%);
  font-size:11px;
  color:#fff;
  mix-blend-mode: difference;
  font-weight:900;
}
.ctaCol{
  display:flex;
  flex-direction:column;
  gap:10px;
  margin-top: 14px;
}
` as const;
