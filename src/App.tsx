'use client';

import React, { useEffect, useMemo, useState } from 'react';
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
  Sparkles,
} from 'lucide-react';

/**
 * QTMBG — Signal OS (v4)
 * Goal: Liven-like funnel mechanics (personalization → welcome container → quiz → pattern checkpoints → richer result)
 * - True white notebook paper (no beige)
 * - Striped notebook background
 * - Coherent spacing/borders/typography across all views
 * - 12 questions (~4 min)
 * - Email optional (only for export later)
 * - Primary CTA: Book call
 */

type ForceId = 'essence' | 'identity' | 'offer' | 'system' | 'growth';
type StageId = 'launch' | 'reposition' | 'scale';

type SymptomId =
  | 'not_enough_leads'
  | 'low_conversion'
  | 'price_pushback'
  | 'unclear_positioning'
  | 'inconsistent_content'
  | 'chaos_delivery';

const STORAGE_KEY = 'qtmbg-signal-os-v4';

const FORCES: Array<{
  id: ForceId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  micro: string;
}> = [
  { id: 'essence', label: 'ESSENCE', icon: Zap, micro: 'What you really stand for' },
  { id: 'identity', label: 'IDENTITY', icon: ShieldAlert, micro: 'How you are perceived' },
  { id: 'offer', label: 'OFFER', icon: Layers, micro: 'What people buy and why' },
  { id: 'system', label: 'SYSTEM', icon: Cpu, micro: 'How leads become cash' },
  { id: 'growth', label: 'GROWTH', icon: Activity, micro: 'How it scales without chaos' },
];

const STAGES: Array<{ id: StageId; label: string; sub: string }> = [
  { id: 'launch', label: 'Launching', sub: 'Building first demand + first offers' },
  { id: 'reposition', label: 'Repositioning', sub: 'Good product, unclear signal or audience' },
  { id: 'scale', label: 'Scaling', sub: 'You need throughput, not more hustle' },
];

const SYMPTOMS: Array<{ id: SymptomId; label: string; sub: string }> = [
  { id: 'not_enough_leads', label: 'Not enough leads', sub: 'Attention exists, volume doesn’t.' },
  { id: 'low_conversion', label: 'Low conversion', sub: 'People visit, hesitate, don’t commit.' },
  { id: 'price_pushback', label: 'Price pushback', sub: 'Negotiation / “too expensive” / delays.' },
  { id: 'unclear_positioning', label: 'Unclear positioning', sub: 'Hard to explain what makes you different.' },
  { id: 'inconsistent_content', label: 'Inconsistent content', sub: 'You post, but it doesn’t compound.' },
  { id: 'chaos_delivery', label: 'Delivery chaos', sub: 'Fulfillment drains you / no repeatable machine.' },
];

type Choice = 1 | 3 | 5;

type Question = {
  force: ForceId;
  text: string;
  a: { v: Choice; label: string };
  b: { v: Choice; label: string };
  c: { v: Choice; label: string };
};

// 12 questions (3 per “phase” feel) — still fast taps
const QUESTIONS: Question[] = [
  // ESSENCE (2)
  {
    force: 'essence',
    text: 'If I land on your brand today… can I understand the unique mechanism you bring?',
    a: { v: 1, label: 'No — it sounds like generic services.' },
    b: { v: 3, label: "Somewhat — but it isn't named or sharp." },
    c: { v: 5, label: "Yes — it's specific, named, repeatable." },
  },
  {
    force: 'essence',
    text: 'Do you have a clear point of view (a belief you’re known for)?',
    a: { v: 1, label: 'No — I avoid strong claims.' },
    b: { v: 3, label: 'Sometimes — but it isn’t consistent.' },
    c: { v: 5, label: 'Yes — people can repeat it for me.' },
  },

  // IDENTITY (2)
  {
    force: 'identity',
    text: 'Do you look and sound like a premium authority in your space?',
    a: { v: 1, label: 'Not yet — template or inconsistent.' },
    b: { v: 3, label: 'Clean — but not high-status or memorable.' },
    c: { v: 5, label: 'Yes — instantly premium and distinct.' },
  },
  {
    force: 'identity',
    text: 'Do your best prospects trust you before the first call?',
    a: { v: 1, label: 'No — calls feel like interviews.' },
    b: { v: 3, label: 'Sometimes — depends on referral.' },
    c: { v: 5, label: 'Yes — they arrive pre-sold.' },
  },

  // OFFER (2)
  {
    force: 'offer',
    text: 'Is your flagship offer obvious and easy to choose?',
    a: { v: 1, label: "No — it's custom, confusing, too many options." },
    b: { v: 3, label: 'Kind of — but people hesitate or negotiate.' },
    c: { v: 5, label: 'Yes — one clear flagship path.' },
  },
  {
    force: 'offer',
    text: 'Can a buyer self-qualify quickly (fit / price / outcome)?',
    a: { v: 1, label: 'No — I explain everything live.' },
    b: { v: 3, label: 'Somewhat — but lots of edge cases.' },
    c: { v: 5, label: 'Yes — the page does the filtering.' },
  },

  // SYSTEM (3)
  {
    force: 'system',
    text: 'Is lead flow predictable and controlled (not luck-based)?',
    a: { v: 1, label: 'No — feast/famine + manual chasing.' },
    b: { v: 3, label: 'Somewhat — referrals + occasional wins.' },
    c: { v: 5, label: 'Yes — repeatable pipeline + nurture.' },
  },
  {
    force: 'system',
    text: 'Do you have a single “happy path” from attention → cash?',
    a: { v: 1, label: "No — it's scattered across tools." },
    b: { v: 3, label: "Partly — but it isn't consistent." },
    c: { v: 5, label: 'Yes — one path, one CTA.' },
  },
  {
    force: 'system',
    text: 'Do leads get followed up without you remembering manually?',
    a: { v: 1, label: 'No — I forget / it’s chaotic.' },
    b: { v: 3, label: 'Some — a few reminders.' },
    c: { v: 5, label: 'Yes — automation + cadence.' },
  },

  // GROWTH (3)
  {
    force: 'growth',
    text: 'Do you have one metric + rhythm that drives execution weekly?',
    a: { v: 1, label: 'No — I react to urgency + bank balance.' },
    b: { v: 3, label: 'Some — I track revenue, not leading signals.' },
    c: { v: 5, label: 'Yes — one north star + weekly loop.' },
  },
  {
    force: 'growth',
    text: 'Is your growth plan stable (90 days) or changing weekly?',
    a: { v: 1, label: 'Changing weekly.' },
    b: { v: 3, label: 'Somewhat stable.' },
    c: { v: 5, label: 'Stable + deliberate.' },
  },
  {
    force: 'growth',
    text: 'Could your business grow 2× without you working 2× more?',
    a: { v: 1, label: 'No — it would break.' },
    b: { v: 3, label: 'Maybe — with stress.' },
    c: { v: 5, label: 'Yes — leverage is built in.' },
  },
];

// --- LEAK INTELLIGENCE (tight but not thin) ---
type LeakInfo = {
  leakName: string;
  humanSymptom: string;
  whatItMeans: string;
  todayMove: string;
  weekPlan: string[];
  bookCallReason: string;
};

const LEAKS: Record<ForceId, LeakInfo> = {
  essence: {
    leakName: 'BLURRY MECHANISM',
    humanSymptom: 'People say: “Interesting… but what exactly do you do?”',
    whatItMeans:
      'Your capability may be strong, but your signal is noisy. If the mechanism isn’t named and repeatable, trust stays slow and price stays fragile.',
    todayMove:
      'Write ONE sentence and place it on your hero + bio: “I help [WHO] get [OUTCOME] using [MECHANISM] in [TIME].”',
    weekPlan: [
      'Name the mechanism (2–4 words). If you can’t name it, you don’t own it yet.',
      'Rewrite hero: Outcome + Mechanism + Proof + One CTA.',
      'Publish one belief you own (clear “this / not that”).',
    ],
    bookCallReason:
      'A call confirms your mechanism on your actual site and locks the exact wording, proof stack, and repulsion points.',
  },
  identity: {
    leakName: 'STATUS GAP',
    humanSymptom: 'You’re good — but you don’t look expensive yet.',
    whatItMeans:
      'Your identity isn’t matching the level you want to charge. That creates doubt, price negotiation, and “shopping you.”',
    todayMove:
      'Replace safe language with proof: outcomes, constraints, numbers, and one bold claim you can defend.',
    weekPlan: [
      'Introduce one signature element across touchpoints (visual + verbal).',
      'Publish one authority post: your model / contrarian framework.',
      'Upgrade top 3 assets: homepage, offer page, one case study.',
    ],
    bookCallReason:
      'A call identifies the credibility gaps that cause negotiation and gives you a “proof stack order” to fix first.',
  },
  offer: {
    leakName: 'VALUE CONFUSION',
    humanSymptom: 'People like you… but don’t buy fast.',
    whatItMeans:
      'No single obvious flagship path. Too many options or too much custom creates hesitation.',
    todayMove:
      'Choose one flagship. Write: “This is for X. You get Y by Z. If you’re not X, do not apply.”',
    weekPlan: [
      'Collapse offers → 1 flagship + 1 entry step.',
      'Rewrite pricing page (one path, one CTA).',
      'Publish one teardown: show how your offer creates the after-state.',
    ],
    bookCallReason:
      'A call locks the flagship path, pricing logic, and the one CTA that converts — without bloating your offer set.',
  },
  system: {
    leakName: 'PIPELINE FRICTION',
    humanSymptom: 'You’re busy… but revenue isn’t predictable.',
    whatItMeans:
      'Your path from attention → cash leaks. You may have demand signals, but not a controlled system.',
    todayMove:
      'Write your happy path in 6 steps: Viewer → Lead → Call → Close → Onboard → Referral.',
    weekPlan: [
      'Install one lead capture + one follow-up email.',
      'Add one booking filter question to repel bad fits.',
      'Create one nurture loop (weekly proof + CTA).',
    ],
    bookCallReason:
      'A call maps the exact leak point and tells you what to change first (capture, qualification, nurture, or close).',
  },
  growth: {
    leakName: 'NO NORTH STAR',
    humanSymptom: 'You’re moving… but direction keeps changing.',
    whatItMeans:
      'No clean metric + rhythm. Growth becomes reactive, emotional, and exhausting.',
    todayMove:
      'Pick ONE metric for 30 days (qualified leads/week, close rate, or LTV). Track weekly on the same day.',
    weekPlan: [
      'Choose one channel to dominate for 30 days.',
      'Add one referral trigger at the moment of first win.',
      'Weekly review: metric → bottleneck → one fix → repeat.',
    ],
    bookCallReason:
      'A call selects the single lever that will actually move your number (signal, offer, or system) and sets a 30-day loop.',
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

type View = 'start' | 'welcome' | 'scan' | 'checkpoint' | 'result' | 'email';

type State = {
  stage: StageId;
  symptom: SymptomId | null;
  idx: number;
  answers: Partial<Record<ForceId, Choice[]>>; // store arrays so we can average per force
  view: View;
  createdAtISO: string;
  checkpointCount: number;
  email: string;
  name: string;
  website: string;
};

const DEFAULT_STATE: State = {
  stage: 'launch',
  symptom: null,
  idx: 0,
  answers: {},
  view: 'start',
  createdAtISO: new Date().toISOString(),
  checkpointCount: 0,
  email: '',
  name: '',
  website: '',
};

function loadStateSafe(): State | null {
  try {
    if (typeof window === 'undefined') return null;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as State;
  } catch {
    return null;
  }
}

function saveStateSafe(s: State) {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

// 48h decay timer (keeps urgency without being spammy)
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

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="qbg">
      <style>{CSS}</style>
      <div className="wrap">
        <div className="main">{children}</div>
        <div className="footer">
          <span className="footerTag">QTMBG</span>
          <span className="muted">Signal OS is a scan — built to create clarity and the next move.</span>
        </div>
      </div>
    </div>
  );
}

function TopBar({ rightText }: { rightText: string }) {
  return (
    <div className="top">
      <div className="brand">
        <span className="brandBox">QUANTUM BRANDING</span>
        <span className="brandName">Signal OS</span>
      </div>
      <div className="muted tiny">{rightText}</div>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function Btn({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  icon,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`btn ${variant} ${disabled ? 'disabled' : ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon}
      <span className="btnText">{children}</span>
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
        Insights expire in{' '}
        <strong>
          {hours.toString().padStart(2, '0')}:{mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
        </strong>
      </span>
    </div>
  );
}

export default function Page() {
  const [state, setState] = useState<State>(DEFAULT_STATE);

  useEffect(() => {
    const loaded = loadStateSafe();
    if (loaded) setState(loaded);
  }, []);

  useEffect(() => {
    saveStateSafe(state);
  }, [state]);

  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.view]);

  const total = QUESTIONS.length;

  // scores per force = average of answers stored for that force
  const scores = useMemo(() => {
    const s: Record<ForceId, number> = {
      essence: 0,
      identity: 0,
      offer: 0,
      system: 0,
      growth: 0,
    };

    (Object.keys(s) as ForceId[]).forEach((f) => {
      const arr = state.answers[f] ?? [];
      if (!arr.length) s[f] = 0;
      else {
        const avg = arr.reduce((sum, v) => sum + pctFromChoice(v), 0) / arr.length;
        s[f] = Math.round(avg);
      }
    });

    return s;
  }, [state.answers]);

  const diagnosis = useMemo(() => {
    const sorted = sortForcesByWeakest(scores);
    const primary = sorted[0]?.[0] ?? 'essence';
    const secondary = sorted[1]?.[0] ?? 'identity';
    return { primary, secondary };
  }, [scores]);

  const startScan = () => {
    setState((prev) => ({
      ...prev,
      view: 'welcome',
      idx: 0,
      answers: {},
      checkpointCount: 0,
      createdAtISO: new Date().toISOString(),
    }));
  };

  const goToScan = () => setState((p) => ({ ...p, view: 'scan' }));

  const pickAnswer = (force: ForceId, v: Choice) => {
    setState((prev) => {
      const existing = prev.answers[force] ?? [];
      const nextAnswers = { ...prev.answers, [force]: [...existing, v] };

      const nextIdx = prev.idx + 1;

      // show checkpoints after Q4 and Q8 (Liven-like “moment”)
      const shouldCheckpoint = (nextIdx === 4 || nextIdx === 8) && prev.checkpointCount < 2;

      if (shouldCheckpoint) {
        return {
          ...prev,
          answers: nextAnswers,
          idx: nextIdx,
          view: 'checkpoint',
          checkpointCount: prev.checkpointCount + 1,
        };
      }

      if (nextIdx >= total) {
        return {
          ...prev,
          answers: nextAnswers,
          idx: total - 1,
          view: 'result',
        };
      }

      return { ...prev, answers: nextAnswers, idx: nextIdx };
    });
  };

  const goBack = () => setState((p) => ({ ...p, idx: Math.max(0, p.idx - 1) }));

  const restart = () => {
    try {
      if (typeof window !== 'undefined') window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setState({ ...DEFAULT_STATE, createdAtISO: new Date().toISOString() });
  };

  const toEmail = () => setState((p) => ({ ...p, view: 'email' }));

  const submitEmail = () => {
    // hook to backend later
    console.log('Email capture:', { email: state.email, name: state.name, website: state.website, stage: state.stage, symptom: state.symptom });
    alert(`Thanks ${state.name || 'there'} — you’ll get the breakdown by email.`);
    setState((p) => ({ ...p, view: 'result' }));
  };

  const toAudit = () => {
    const params = new URLSearchParams({
      from: 'signal',
      stage: state.stage,
      symptom: state.symptom ?? '',
      primary: diagnosis.primary,
      secondary: diagnosis.secondary,
      scores: (Object.keys(scores) as ForceId[]).map((k) => `${k}-${scores[k]}`).join(','),
      ...(state.name && { name: state.name }),
      ...(state.email && { email: state.email }),
      ...(state.website && { website: state.website }),
    });

    if (typeof window !== 'undefined') {
      window.location.href = `https://audit.qtmbg.com/?${params.toString()}`;
    }
  };

  const toCall = () => {
    // For now route to audit with intent=call (you can handle it there)
    const params = new URLSearchParams({
      intent: 'call',
      from: 'signal',
      stage: state.stage,
      symptom: state.symptom ?? '',
      primary: diagnosis.primary,
      secondary: diagnosis.secondary,
      scores: (Object.keys(scores) as ForceId[]).map((k) => `${k}-${scores[k]}`).join(','),
      ...(state.name && { name: state.name }),
      ...(state.email && { email: state.email }),
      ...(state.website && { website: state.website }),
    });

    if (typeof window !== 'undefined') {
      window.location.href = `https://audit.qtmbg.com/?${params.toString()}`;
    }
  };

  // ---------------- VIEWS ----------------

  if (state.view === 'start') {
    return (
      <AppShell>
        <TopBar rightText="~4 min • 12 questions • primary + secondary leak" />

        <div className="hero">
          <div className="kicker center">SIGNAL SCAN</div>
          <div className="h1 center">Find the one thing weakening your brand right now.</div>
          <div className="sub center">
            You’ll answer 12 fast questions and get:
            <br />
            <b>your primary leak, your secondary leak, and a 7-day micro-plan.</b>
            <div className="fine muted" style={{ marginTop: 10 }}>
              No email required to see results.
            </div>
          </div>
        </div>

        <Card>
          <div className="field">
            <div className="label">
              Your situation <span className="req">*</span>
            </div>
            <div className="stageGrid">
              {STAGES.map((s) => {
                const active = state.stage === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`stage ${active ? 'active' : ''}`}
                    onClick={() => setState((p) => ({ ...p, stage: s.id }))}
                  >
                    <div className="stageTitle">{s.label}</div>
                    <div className="tiny muted">{s.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="field" style={{ marginTop: 18 }}>
            <div className="label">
              Your main symptom <span className="req">*</span>
            </div>
            <div className="symGrid">
              {SYMPTOMS.map((s) => {
                const active = state.symptom === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    className={`sym ${active ? 'active' : ''}`}
                    onClick={() => setState((p) => ({ ...p, symptom: s.id }))}
                  >
                    <div className="symTitle">{s.label}</div>
                    <div className="tiny muted">{s.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="ctaRow">
            <Btn
              variant="primary"
              onClick={startScan}
              disabled={!state.symptom}
              icon={<Zap size={16} />}
            >
              Start the scan
            </Btn>

            <div className="trust">
              <div className="trustItem">
                <CheckCircle2 size={14} />
                <span>Value first</span>
              </div>
              <div className="trustItem">
                <CheckCircle2 size={14} />
                <span>Built for action</span>
              </div>
              <div className="trustItem">
                <CheckCircle2 size={14} />
                <span>Not trivia</span>
              </div>
            </div>
          </div>
        </Card>
      </AppShell>
    );
  }

  if (state.view === 'welcome') {
    const symptomLabel = SYMPTOMS.find((s) => s.id === state.symptom)?.label ?? 'your symptom';

    return (
      <AppShell>
        <TopBar rightText="~4 min • 12 questions • fast taps" />

        <Card className="welcome">
          <div className="welcomeIcon">
            <Sparkles size={26} />
          </div>

          <div className="welcomeTitle">Good. Now be honest.</div>

          <div className="welcomeText">
            You selected: <b>{symptomLabel}</b>.
            <br />
            This scan is designed to find the <b>structural leak</b> behind that symptom — not to flatter you.
          </div>

          <div className="welcomeBox">
            <div className="welcomeBoxTitle">How to use this</div>
            <ul className="list">
              <li>Answer based on what your market experiences — not your intentions.</li>
              <li>If you hesitate between two options, pick the lower one.</li>
              <li>You’ll get a leak + a 7-day plan at the end.</li>
            </ul>
          </div>

          <div className="ctaRow" style={{ justifyContent: 'center' }}>
            <Btn variant="primary" onClick={goToScan} icon={<Target size={16} />}>
              Continue
            </Btn>
          </div>

          <div className="tiny muted" style={{ textAlign: 'center', marginTop: 10 }}>
            This is a scan. The Deep Audit is where we build the full fix plan.
          </div>
        </Card>
      </AppShell>
    );
  }

  if (state.view === 'checkpoint') {
    const sorted = sortForcesByWeakest(scores);
    const emerging = sorted[0]?.[0] ?? 'essence';
    const emergingMeta = FORCES.find((f) => f.id === emerging)!;
    const EmergingIcon = emergingMeta.icon;

    return (
      <AppShell>
        <TopBar rightText="Pattern checkpoint" />

        <Card className="aha">
          <div className="ahaIcon">
            <Target size={32} />
          </div>

          <div className="ahaTitle">Pattern detected.</div>

          <div className="ahaText">
            Based on your answers so far, the leak is clustering in <strong>{emergingMeta.label}</strong>.
          </div>

          <div className="ahaForce">
            <EmergingIcon size={20} />
            <div>
              <div className="ahaForceName">{emergingMeta.label}</div>
              <div className="tiny muted">{emergingMeta.micro}</div>
            </div>
          </div>

          <div className="ahaHint">
            We’re going to confirm this in the next questions.
            <br />
            If it holds, your result will include a specific 7-day plan to fix it.
          </div>

          <div className="ctaRow" style={{ justifyContent: 'center' }}>
            <Btn variant="primary" onClick={goToScan}>
              Continue
            </Btn>
          </div>

          <div className="tiny muted" style={{ textAlign: 'center' }}>
            This is why the scan feels “accurate” — it’s not random scoring.
          </div>
        </Card>
      </AppShell>
    );
  }

  if (state.view === 'scan') {
    const q = QUESTIONS[state.idx];
    const forceMeta = FORCES.find((f) => f.id === q.force)!;
    const Icon = forceMeta.icon;

    return (
      <AppShell>
        <TopBar rightText={`~4 min • Question ${state.idx + 1}/${total}`} />

        <div className="scanHead">
          <div className="scanLeft">
            <div className="kicker">QUESTION {state.idx + 1} / {total}</div>
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
            <button className="choice" type="button" onClick={() => pickAnswer(q.force, q.a.v)}>
              <div className="choiceDot">
                <CircleDashed size={14} />
              </div>
              <div className="choiceText">{q.a.label}</div>
              <ChevronRight size={16} className="chev" />
            </button>

            <button className="choice" type="button" onClick={() => pickAnswer(q.force, q.b.v)}>
              <div className="choiceDot">
                <CircleDashed size={14} />
              </div>
              <div className="choiceText">{q.b.label}</div>
              <ChevronRight size={16} className="chev" />
            </button>

            <button className="choice" type="button" onClick={() => pickAnswer(q.force, q.c.v)}>
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

  if (state.view === 'email') {
    return (
      <AppShell>
        <TopBar rightText="Export" />

        <div className="hero">
          <div className="kicker center">EXPORT</div>
          <div className="h1 center">Email the breakdown + keep it.</div>
          <div className="sub center">One useful email — your leak, your scores, and your 7-day plan.</div>
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
              onClick={submitEmail}
              disabled={!state.email}
              icon={<Send size={16} />}
            >
              Email me the breakdown
            </Btn>

            <button className="link" type="button" onClick={() => setState((p) => ({ ...p, view: 'result' }))}>
              Skip
            </button>
          </div>

          <div className="tiny muted">No spam. One analysis email.</div>
        </Card>
      </AppShell>
    );
  }

  // RESULT
  const { primary, secondary } = diagnosis;
  const primaryMeta = FORCES.find((f) => f.id === primary)!;
  const secondaryMeta = FORCES.find((f) => f.id === secondary)!;
  const primaryInfo = LEAKS[primary];
  const secondaryInfo = LEAKS[secondary];

  return (
    <AppShell>
      <TopBar rightText="Results" />

      <DecayTimer createdAt={state.createdAtISO} />

      <div className="hero">
        <div className="kicker center">YOUR PRIMARY LEAK</div>
        <div className="h1 leak center">{primaryInfo.leakName}</div>
        <div className="sub center">{primaryInfo.humanSymptom}</div>
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

            <div className="panelTitle mt">Why book a call</div>
            <div className="panelText">{primaryInfo.bookCallReason}</div>

            <div className="commitLadder">
              <button className="commitStep primary" type="button" onClick={toCall}>
                <div className="commitIcon">
                  <TrendingUp size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Book a 15-min leak review</div>
                  <div className="commitSub">Confirm the leak on your site + lock the first fix</div>
                </div>
                <ArrowRight size={18} />
              </button>

              <button className="commitStep" type="button" onClick={toAudit}>
                <div className="commitIcon">
                  <Target size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Run the Deep Audit</div>
                  <div className="commitSub">Longer diagnostic + fix plan + export</div>
                </div>
                <ChevronRight size={18} />
              </button>

              <button className="commitStep" type="button" onClick={toEmail}>
                <div className="commitIcon">
                  <Send size={18} />
                </div>
                <div className="commitContent">
                  <div className="commitTitle">Email me this result</div>
                  <div className="commitSub">Save your scores + plan</div>
                </div>
                <ChevronRight size={18} />
              </button>
            </div>

            <button className="link" type="button" onClick={restart}>
              New scan
            </button>

            <div className="tiny muted mt">
              Primary CTA is the call. Deep Audit is the next layer when they want more proof + specificity.
            </div>
          </div>

          <div className="panel soft">
            <div className="panelTitle">Signal snapshot</div>

            <div className="bars">
              {(Object.keys(scores) as ForceId[]).map((f) => {
                const meta = FORCES.find((x) => x.id === f)!;
                const pct = scores[f];
                const tag = f === primary ? 'PRIMARY' : f === secondary ? 'SECONDARY' : pct >= 80 ? 'STRONG' : pct >= 55 ? 'UNSTABLE' : 'CRITICAL';

                return (
                  <div key={f} className="barRow">
                    <div className="barLeft">
                      <div className="barName">{meta.label}</div>
                      <div className={`tag ${f === primary ? 'tagHard' : f === secondary ? 'tagWarn' : ''}`}>{tag}</div>
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

            <div className="panelTitle">Your secondary leak</div>
            <div className="panelText">
              <b>{secondaryMeta.label}:</b> {secondaryInfo.leakName}
              <div className="tiny muted" style={{ marginTop: 8 }}>
                This is the “supporting problem” that keeps the primary leak alive.
              </div>
            </div>

            <div className="miniBox" style={{ marginTop: 14 }}>
              <div className="miniTitle">Your inputs</div>
              <div className="miniLine">
                <span className="miniKey">Stage</span>
                <span className="miniVal">{STAGES.find((s) => s.id === state.stage)?.label}</span>
              </div>
              <div className="miniLine">
                <span className="miniKey">Symptom</span>
                <span className="miniVal">{SYMPTOMS.find((s) => s.id === state.symptom)?.label}</span>
              </div>
              <div className="miniLine">
                <span className="miniKey">Primary</span>
                <span className="miniVal">{primaryMeta.label}</span>
              </div>
              <div className="miniLine">
                <span className="miniKey">Secondary</span>
                <span className="miniVal">{secondaryMeta.label}</span>
              </div>
            </div>

            <div className="tiny muted mt">
              This result is intentionally sharp. The Deep Audit is where we add branching, structure, and a full fix plan.
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
  --bg: #ffffff;     /* TRUE WHITE */
  --paper: #ffffff;
  --ink: #0b0b0b;
  --muted: #6b6b6b;

  --rule: rgba(11,11,11,.55);
  --rule2: rgba(11,11,11,.10);    /* notebook lines */
  --rule3: rgba(11,11,11,.06);    /* subtle grid */
  --shadow: 0 0 0 1px rgba(11,11,11,.12);
}

*{margin:0;padding:0;box-sizing:border-box;}

.qbg{
  min-height:100svh;
  background: var(--bg);
  color: var(--ink);
  font-family: 'Sometype Mono', ui-monospace, monospace;
  line-height:1.55;
  display:flex;

  /* notebook stripes + subtle grid + left margin line */
  background-image:
    linear-gradient(to right, transparent 76px, rgba(220,38,38,.20) 76px, rgba(220,38,38,.20) 78px, transparent 78px),
    repeating-linear-gradient(to bottom, var(--rule2) 0px, var(--rule2) 1px, transparent 1px, transparent 32px),
    repeating-linear-gradient(to right, var(--rule3) 0px, var(--rule3) 1px, transparent 1px, transparent 120px);
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
  color: var(--bg);
}

.brandName{
  font-size:16px;
  letter-spacing:.02em;
  font-weight:500;
}

.muted{ color: var(--muted); }
.tiny{ font-size:12px; line-height:1.4; }
.fine{ font-size:12px; line-height: 1.5; }
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
  color: rgba(11,11,11,.78);
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
  box-shadow: var(--shadow);
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

.input::placeholder{ color: rgba(11,11,11,.35); }

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
  transition: all .14s ease;
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

/* symptoms */
.symGrid{
  display:grid;
  grid-template-columns: 1fr;
  gap:10px;
}

.sym{
  border:2px solid var(--ink);
  padding:14px;
  text-align:left;
  background: var(--paper);
  transition: all .14s ease;
  cursor:pointer;
  font-family: 'Sometype Mono', ui-monospace, monospace;
}

.sym:hover{ transform: translateY(-2px); }

.sym.active{
  background: rgba(11,11,11,.06);
  border-color: var(--ink);
}

.symTitle{ font-weight:700; font-size:14px; }
.sym .muted{ margin-top:2px; }

/* buttons */
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
  transition: all .14s ease;
  font-family: 'Sometype Mono', ui-monospace, monospace;
  font-weight:700;
}

.btnText{ transform: translateY(0.5px); }

.btn.primary{
  background: var(--ink);
  color: var(--bg);
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
  align-items:flex-start;
  justify-content:space-between;
  gap:16px;
  margin-top: 8px;
  flex-wrap:wrap;
}

.trust{
  display:flex;
  gap:16px;
  flex-wrap:wrap;
  padding-top: 10px;
}

.trustItem{
  display:flex;
  align-items:center;
  gap:8px;
  font-size:12px;
  color: rgba(11,11,11,.75);
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
  background: rgba(11,11,11,.2);
  margin-bottom: 18px;
  overflow:hidden;
}

.progressIn{
  height:3px;
  background: var(--ink);
  transition: width .18s ease;
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
  transition: all .14s ease;
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

/* timer */
.timer{
  display:flex;
  align-items:center;
  gap:10px;
  padding:12px 14px;
  background: rgba(255,255,255,.95);
  border:2px solid var(--ink);
  margin-bottom:14px;
  font-size:12px;
  color: rgba(11,11,11,.75);
  box-shadow: var(--shadow);
}

.timer.expired{
  background: var(--ink);
  color: var(--bg);
}

.timer strong{ color: var(--ink); font-weight:700; }
.timer.expired strong{ color: var(--bg); }

/* welcome */
.welcome{ text-align:center; }
.welcomeIcon{
  margin:0 auto 14px;
  width:56px;
  height:56px;
  border:2px solid var(--ink);
  display:flex;
  align-items:center;
  justify-content:center;
  background: rgba(11,11,11,.03);
}
.welcomeTitle{ font-size:28px; font-weight:700; margin-bottom:10px; }
.welcomeText{ font-size:15px; line-height:1.65; color: rgba(11,11,11,.78); max-width: 720px; margin: 0 auto 14px; }
.welcomeBox{
  text-align:left;
  border:2px solid rgba(11,11,11,.25);
  background: rgba(11,11,11,.03);
  padding:14px;
  max-width: 780px;
  margin: 0 auto 14px;
}
.welcomeBoxTitle{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(11,11,11,.65);
  font-weight:700;
  margin-bottom:10px;
}

/* checkpoint */
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
  font-weight:700;
  margin-bottom:14px;
  text-align:center;
}

.ahaText{
  font-size:15px;
  line-height:1.65;
  color: rgba(11,11,11,.78);
  margin-bottom:18px;
  max-width:640px;
  margin-left:auto;
  margin-right:auto;
  text-align:center;
}

.ahaForce{
  display:inline-flex;
  gap:12px;
  align-items:center;
  padding:12px 14px;
  border:2px solid var(--ink);
  background: var(--paper);
  margin: 0 auto 16px;
}

.ahaForceName{
  font-weight:700;
  letter-spacing:.12em;
}

.ahaHint{
  font-size:14px;
  line-height:1.55;
  color: rgba(11,11,11,.68);
  margin-bottom:14px;
  max-width:620px;
  margin-left:auto;
  margin-right:auto;
  text-align:center;
}

.resultGrid{
  display:grid;
  grid-template-columns: 1.05fr .95fr;
  gap:18px;
}

@media (max-width: 900px){
  .resultGrid{ grid-template-columns: 1fr; }
}

.panel{
  border:2px solid var(--ink);
  padding:18px;
  background: var(--paper);
  box-shadow: var(--shadow);
}

.panel.soft{
  background: rgba(255,255,255,.92);
}

.panelTitle{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(11,11,11,.65);
  font-weight:700;
  margin-bottom:10px;
}

.panelText{
  font-size:14px;
  line-height:1.65;
  color: rgba(11,11,11,.78);
}

.panelText.strong{
  font-weight:700;
  color: var(--ink);
  font-size:15px;
}

.mt{ margin-top: 18px; }

.list{
  padding-left: 18px;
  color: rgba(11,11,11,.78);
  line-height:1.65;
  font-size:14px;
}

.list li{ margin-bottom:8px; }

.divider{
  height:2px;
  background: rgba(11,11,11,.2);
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
  color: rgba(11,11,11,.45);
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
  background: rgba(11,11,11,.06);
  padding:4px 8px;
  border:2px solid rgba(11,11,11,.25);
}

.barWrap{
  position:relative;
  border:2px solid var(--ink);
  height: 26px;
  background: rgba(255,255,255,.9);
  overflow:hidden;
}

.barIn{
  height:100%;
  background: var(--ink);
  transition: width .25s ease;
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
  border:2px solid rgba(11,11,11,.35);
  background: rgba(255,255,255,.95);
  cursor:pointer;
  transition: all .14s ease;
  text-align:left;
  font-family: 'Sometype Mono', ui-monospace, monospace;
  box-shadow: var(--shadow);
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
.commitSub{ font-size:11px; color: rgba(11,11,11,.55); }
.commitStep.primary .commitSub{ color: rgba(255,255,255,.75); }

.miniBox{
  border:2px solid rgba(11,11,11,.25);
  background: rgba(11,11,11,.03);
  padding:12px;
}

.miniTitle{
  font-size:11px;
  letter-spacing:.2em;
  text-transform:uppercase;
  color: rgba(11,11,11,.65);
  font-weight:700;
  margin-bottom:10px;
}

.miniLine{
  display:flex;
  justify-content:space-between;
  gap:12px;
  padding: 8px 0;
  border-top: 1px solid rgba(11,11,11,.12);
}
.miniLine:first-of-type{ border-top:none; padding-top:0; }

.miniKey{ color: rgba(11,11,11,.55); font-weight:700; letter-spacing:.08em; font-size:12px; }
.miniVal{ color: rgba(11,11,11,.80); font-weight:600; font-size:12px; }

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
  font-weight:700;
  background: var(--ink);
  color: var(--bg);
}

@media (max-width: 640px){
  .wrap{ padding:20px 16px 18px; }
  .top{ flex-direction:column; align-items:flex-start; }
  .hero{ padding:14px 0 12px; }
  .card{ padding:16px; }
  .ctaRow{ flex-direction:column; align-items:stretch; }
  .trust{ flex-direction:column; gap:10px; padding-top: 0; }
  .commitStep{ padding:12px; }
}
` as const;
