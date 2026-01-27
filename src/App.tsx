import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Clipboard,
  Cpu,
  Download,
  Layers,
  Printer,
  ShieldAlert,
  Zap,
} from "lucide-react";

/**
 * QUANTUM SIGNALS OS — v4.1 (HQ-grade + Data Capture Restored)
 *
 * Fixes:
 * - Re-inject Google Sheet transmission (no-cors) in generateReport()
 * - Dedup guard to prevent double submits on refresh
 * - Offline-safe queue with retry on next load
 *
 * Stack: StackBlitz → GitHub → Vercel friendly (single file)
 */

// ----------------------------- CONFIG -----------------------------

const FORCES = [
  { id: "essence", label: "ESSENCE", room: "The Core", icon: Zap },
  { id: "identity", label: "IDENTITY", room: "The Mirror", icon: ShieldAlert },
  { id: "offer", label: "OFFER", room: "The Marketplace", icon: Layers },
  { id: "system", label: "SYSTEM", room: "The Machine", icon: Cpu },
  { id: "growth", label: "GROWTH", room: "The Horizon", icon: Activity },
];

const PRIORITY_ORDER = ["essence", "identity", "offer", "system", "growth"];

function scoreBand(pct) {
  if (pct >= 80) return "STRONG";
  if (pct >= 55) return "UNSTABLE";
  return "CRITICAL";
}

const QUIZ_QUESTIONS = [
  // Whale filter (NOT part of force scoring)
  {
    id: "revenue",
    isMeta: true,
    force: "growth",
    text: "What is your current annual revenue run rate?",
    options: [
      { value: 1, label: "Under $100k (Building)" },
      { value: 3, label: "$100k – $500k (Scaling)" },
      { value: 5, label: "$500k+ (WHALE)" },
    ],
  },

  // ESSENCE (2)
  {
    id: 1,
    force: "essence",
    text: "Do you have a documented methodology that is uniquely yours?",
    options: [
      { value: 1, label: "No. I sell general services." },
      { value: 3, label: "Process exists, but it’s not named." },
      { value: 5, label: "Yes. Named proprietary system." },
    ],
  },
  {
    id: 2,
    force: "essence",
    text: "Does your brand voice feel distinct or polite?",
    options: [
      { value: 1, label: "Polite. Sounds like competitors." },
      { value: 3, label: "Professional but safe." },
      { value: 5, label: "Distinct. It repels bad fits." },
    ],
  },

  // IDENTITY (2)
  {
    id: 3,
    force: "identity",
    text: "Does your visual identity signal premium instantly?",
    options: [
      { value: 1, label: "No. Template vibe." },
      { value: 3, label: "Clean but generic." },
      { value: 5, label: "Yes. High-status immediately." },
    ],
  },
  {
    id: 4,
    force: "identity",
    text: "Do prospects feel like you’ve read their diary?",
    options: [
      { value: 1, label: "No. I talk mostly about my solution." },
      { value: 3, label: "Sometimes, when I tell stories." },
      { value: 5, label: "Constantly. They say: “How did you know?”" },
    ],
  },

  // OFFER (2)
  {
    id: 5,
    force: "offer",
    text: "Do you have a clear flagship offer?",
    options: [
      { value: 1, label: "No. I do custom work." },
      { value: 3, label: "Packages exist but keep changing." },
      { value: 5, label: "Yes. One core mechanism sold repeatedly." },
    ],
  },
  {
    id: 6,
    force: "offer",
    text: "How often do you discount to close?",
    options: [
      { value: 1, label: "Often." },
      { value: 3, label: "Rarely." },
      { value: 5, label: "Never. The price is the price." },
    ],
  },

  // SYSTEM (2)
  {
    id: 7,
    force: "system",
    text: "Is your lead generation predictable?",
    options: [
      { value: 1, label: "No. Feast & famine." },
      { value: 3, label: "Somewhat. Mostly referrals." },
      { value: 5, label: "Yes. I control a faucet." },
    ],
  },
  {
    id: 8,
    force: "system",
    text: "Do you have an automated nurture sequence?",
    options: [
      { value: 1, label: "No. Manual follow-ups." },
      { value: 3, label: "I have a newsletter." },
      { value: 5, label: "Yes. Behavioral automation engine." },
    ],
  },

  // GROWTH (1)
  {
    id: 9,
    force: "growth",
    text: "Do you have a clear north-star metric?",
    options: [
      { value: 1, label: "I look at bank balance." },
      { value: 3, label: "I track monthly revenue." },
      { value: 5, label: "Yes. I track Signal Score / ERI." },
    ],
  },
];

const DIAGNOSIS_MATRIX = {
  essence: {
    leak: "Signal Noise",
    symptom: "The Invisible Expert",
    room: "The Core",
    corrections: [
      "Name your mechanism in 2–4 words. Repeat it everywhere.",
      "Define your enemy: what you refuse, what you replace.",
      "Compress your above-the-fold into: Outcome • Who • Mechanism • Proof • CTA.",
    ],
    today: "Write ONE sentence: Outcome + Mechanism + Who (no adjectives).",
    week: ["Day 1: Mechanism naming", "Day 3: Hero rewrite", "Day 7: Publish manifesto"],
    metric: "5-second test: 4/5 strangers can explain what you do.",
    route: { primary: "KIT", secondary: "MRI" },
  },
  identity: {
    leak: "Status Gap",
    symptom: "Price Resistance",
    room: "The Mirror",
    corrections: [
      "Replace template signals (fonts/layout/photography) with a recognizable signature.",
      "Stop free consulting in DMs. Move to a paid diagnostic.",
      "Use proof artifacts: before/after, specificity, numbers, named outcomes.",
    ],
    today: "Create a single signature rule: type + imagery + layout rule.",
    week: ["Day 1: Visual audit", "Day 3: Proof tiles", "Day 7: Rebuild hero + credibility strip"],
    metric: "Inbound DMs shift from “How much?” to “How do I work with you?”",
    route: { primary: "MRI", secondary: "KIT" },
  },
  offer: {
    leak: "Value Vacuum",
    symptom: "Feast & Famine",
    room: "The Marketplace",
    corrections: [
      "Collapse into one flagship (one mechanism, one promise, one buyer).",
      "Stop selling time. Package transformation + constraints + outputs.",
      "Add an entry offer that points to flagship (Trojan Horse).",
    ],
    today: "Write: ‘In X time, I deliver A, B, C so you get Y.’",
    week: ["Day 1: Flagship definition", "Day 3: Pricing & scope locks", "Day 7: Trojan Horse page"],
    metric: "Close-rate at stated price (no discount) improves week-over-week.",
    route: { primary: "KIT", secondary: "LAB" },
  },
  system: {
    leak: "Friction Loss",
    symptom: "Founder Burnout",
    room: "The Machine",
    corrections: [
      "Design the Happy Path (lead → nurture → call → close → onboarding).",
      "Automate capture + routing (forms → CRM/sheet → email sequence).",
      "Productize delivery into stages, artifacts, cadence.",
    ],
    today: "Draw your Happy Path on one page: Inputs → Steps → Outputs → next CTA.",
    week: ["Day 1: Form + routing", "Day 3: Nurture sequence", "Day 7: Onboarding kit + timeline"],
    metric: "Hours worked per $ earned decreases while revenue holds or rises.",
    route: { primary: "LAB", secondary: "KIT" },
  },
  growth: {
    leak: "Velocity Drag",
    symptom: "Plateau",
    room: "The Horizon",
    corrections: [
      "Choose one channel to dominate for 30 days.",
      "Install referral engine (ask + timing + script + reward).",
      "Track LTV + CAC proxies, not vibes.",
    ],
    today: "Message 3 best clients: ask for 1 specific referral (with a one-line intro they can forward).",
    week: ["Day 1: Referral script", "Day 3: Channel audit", "Day 7: KPI dashboard (simple)"],
    metric: "Weekly qualified leads grow without extra founder hours.",
    route: { primary: "LAB", secondary: "MRI" },
  },
};

const ARTIFACTS_LIBRARY = {
  essence: {
    CRITICAL: ["Mechanism Name (2–4 words)", "One-sentence positioning", "Manifesto page"],
    UNSTABLE: ["Homepage hero rewrite", "Proof block (3 items)", "Category language cleanup"],
    STRONG: ["Long-form thesis", "Model diagram (1 slide)", "Case library (3)"],
  },
  identity: {
    CRITICAL: ["Signature visual system", "Hero image system", "Proof tiles (3)"],
    UNSTABLE: ["Photography upgrade plan", "Visual consistency pass", "Credibility strip"],
    STRONG: ["Brand world expansion", "Editorial templates", "Campaign art direction"],
  },
  offer: {
    CRITICAL: ["Flagship one-pager", "Scope locks", "Trojan Horse entry offer"],
    UNSTABLE: ["Pricing logic rewrite", "Risk reversal", "Sales page structure"],
    STRONG: ["Ascension ladder", "Retention offer", "Referral upsell"],
  },
  system: {
    CRITICAL: ["Happy Path map", "Lead capture + routing", "3-email nurture"],
    UNSTABLE: ["Onboarding kit", "Delivery SOP", "Calendar automation"],
    STRONG: ["Ops dashboard", "Client portal", "Automated reporting cadence"],
  },
  growth: {
    CRITICAL: ["30-day channel plan", "Referral script", "North Star metric definition"],
    UNSTABLE: ["Content engine schedule", "Partnership list", "Weekly KPI ritual"],
    STRONG: ["Scale playbook", "Team roles mapping", "Paid acquisition tests"],
  },
};

const DOD_LIBRARY = {
  essence: [
    { key: "mech_named", label: "Mechanism named (2–4 words) and repeated consistently" },
    { key: "one_sentence", label: "One-sentence positioning locked (Outcome + Who + Mechanism)" },
    { key: "enemy_defined", label: "Enemy defined (what you refuse / replace)" },
  ],
  identity: [
    { key: "signature_system", label: "Signature visual system (type + layout + imagery rule)" },
    { key: "premium_assets", label: "Premium assets installed where it matters" },
    { key: "proof_tiles", label: "Proof tiles: 3 concrete outcomes above the fold" },
  ],
  offer: [
    { key: "flagship_locked", label: "Flagship locked (one buyer, one promise, one mechanism)" },
    { key: "scope_locks", label: "Scope locks: inputs + outputs + timeline defined" },
    { key: "entry_offer", label: "Entry offer points to flagship" },
  ],
  system: [
    { key: "happy_path", label: "Happy Path drawn (lead → close → delivery)" },
    { key: "routing", label: "Routing automated (form → sheet/CRM → email)" },
    { key: "nurture", label: "Nurture sequence live (min 3 emails)" },
  ],
  growth: [
    { key: "north_star", label: "North Star metric defined (and tracked weekly)" },
    { key: "referral_engine", label: "Referral engine installed (timing + script)" },
    { key: "channel_focus", label: "One-channel focus for 30 days (clear cadence)" },
  ],
};

const STORAGE_KEY = "quantum-signals-os-v4";
const SUBMIT_DEDUP_KEY = "quantum-signals-os-v4:last-submit-id";
const SUBMIT_QUEUE_KEY = "quantum-signals-os-v4:submit-queue";

// ✅ Prefer env var for Vercel (Vite-style). Fallback to manual string if needed.
const GOOGLE_SCRIPT_URL =
  (typeof import.meta !== "undefined" && import.meta?.env?.VITE_GOOGLE_SCRIPT_URL) || "";

// ----------------------------- HELPERS -----------------------------

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function safeGet(key) {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(key) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function loadState() {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  safeSet(STORAGE_KEY, JSON.stringify(state));
}

function exportJson(filename, data) {
  if (!isBrowser()) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function defaultEvidence() {
  return Object.fromEntries(
    FORCES.map((f) => [
      f.id,
      {
        notes: "",
        links: [""],
      },
    ])
  );
}

function defaultDodState() {
  return Object.fromEntries(
    FORCES.map((f) => [
      f.id,
      {
        checks: Object.fromEntries((DOD_LIBRARY[f.id] || []).map((it) => [it.key, false])),
        notes: "",
      },
    ])
  );
}

const SCORED_QUESTIONS = QUIZ_QUESTIONS.filter((q) => !q.isMeta);

function computeScoresPreview(nextAnswersById) {
  const raw = Object.fromEntries(FORCES.map((f) => [f.id, 0]));
  const max = Object.fromEntries(
    FORCES.map((f) => {
      const count = SCORED_QUESTIONS.filter((q) => q.force === f.id).length;
      return [f.id, count * 5];
    })
  );

  for (const q of SCORED_QUESTIONS) {
    const v = nextAnswersById[q.id];
    const safe = typeof v === "number" ? v : 0;
    raw[q.force] += safe;
  }

  const pct = Object.fromEntries(
    FORCES.map((f) => {
      const denom = max[f.id] || 1;
      const p = Math.round((raw[f.id] / denom) * 100);
      return [f.id, clamp(p, 0, 100)];
    })
  );

  return { raw, max, pct };
}

function computeArtifactsByForce(scoresPct) {
  const out = {};
  for (const f of FORCES) {
    const band = scoreBand(scoresPct[f.id] ?? 0);
    out[f.id] = ARTIFACTS_LIBRARY[f.id]?.[band] || [];
  }
  return out;
}

function computePrimarySecondary(scoresPct) {
  const sorted = Object.entries(scoresPct).sort((a, b) => {
    if (a[1] !== b[1]) return a[1] - b[1];
    return PRIORITY_ORDER.indexOf(a[0]) - PRIORITY_ORDER.indexOf(b[0]);
  });
  return {
    primaryForce: sorted[0]?.[0] || "essence",
    secondaryForce: sorted[1]?.[0] || "identity",
  };
}

function computeRouting({ isWhale, primaryForce }) {
  if (isWhale) {
    if (primaryForce === "system" || primaryForce === "growth") return { primary: "LAB", secondary: "MRI" };
    return { primary: "MRI", secondary: "LAB" };
  }
  return { primary: "KIT", secondary: "MRI" };
}

function computeReport({ answersById, subject, evidenceByForce, dodByForce }) {
  const createdAt = new Date();
  const revenueScore = answersById["revenue"] || 1;
  const isWhale = revenueScore >= 5;

  const scoresPack = computeScoresPreview(answersById);
  const scores = scoresPack.pct;

  const { primaryForce, secondaryForce } = computePrimarySecondary(scores);
  const primaryDef = DIAGNOSIS_MATRIX[primaryForce];
  const secondaryDef = DIAGNOSIS_MATRIX[secondaryForce];

  const artifactsByForce = computeArtifactsByForce(scores);
  const route = computeRouting({ isWhale, primaryForce });

  return {
    app: "Quantum Signals OS",
    version: "4.1",
    createdAtISO: createdAt.toISOString(),
    subject,
    isWhale,
    answersById,
    scores,
    bands: Object.fromEntries(FORCES.map((f) => [f.id, scoreBand(scores[f.id] ?? 0)])),
    primary: {
      force: primaryForce,
      band: scoreBand(scores[primaryForce] ?? 0),
      ...primaryDef,
    },
    secondary: {
      force: secondaryForce,
      band: scoreBand(scores[secondaryForce] ?? 0),
      leak: secondaryDef.leak,
      symptom: secondaryDef.symptom,
      room: secondaryDef.room,
    },
    route,
    evidenceByForce,
    dodByForce,
    artifactsByForce,
  };
}

// ----------------------------- UI PRIMITIVES -----------------------------

const Box = ({ children, className = "" }) => (
  <div className={`border border-black bg-white ${className}`}>{children}</div>
);

const Btn = ({ children, onClick, variant = "primary", className = "", disabled = false }) => {
  const base =
    "inline-flex items-center justify-center gap-2 border border-black px-4 py-2 font-mono text-xs uppercase tracking-widest transition";
  const styles = {
    primary: disabled
      ? "bg-black text-white opacity-40 cursor-not-allowed"
      : "bg-black text-white hover:bg-white hover:text-black",
    secondary: disabled
      ? "bg-white text-black opacity-40 cursor-not-allowed"
      : "bg-white text-black hover:bg-black hover:text-white",
    ghost: disabled ? "opacity-40 cursor-not-allowed" : "border-transparent hover:underline",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const MonoInput = (props) => (
  <input
    {...props}
    className={`w-full border-b border-black bg-transparent py-2 font-mono text-sm placeholder:text-gray-300 focus:outline-none ${
      props.className || ""
    }`}
  />
);

function Progress({ current, total }) {
  const pct = total ? (current / total) * 100 : 0;
  return (
    <div className="w-full h-px bg-gray-200">
      <div className="h-px bg-black transition-all duration-300" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ForceBars({ scores, compact = false }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-5 border border-black ${compact ? "text-[10px]" : ""}`}>
      {FORCES.map((f, i) => {
        const pct = clamp(scores?.[f.id] ?? 0, 0, 100);
        const Icon = f.icon;
        const band = scoreBand(pct);

        return (
          <div
            key={f.id}
            className={[
              "p-4 md:p-6 flex flex-col items-center justify-between gap-3",
              "border-b md:border-b-0",
              i !== FORCES.length - 1 ? "md:border-r border-black" : "",
            ].join(" ")}
          >
            <div className="text-xs font-bold uppercase tracking-widest text-center h-8 flex items-center">
              {f.label}
            </div>

            <div className="relative w-16 h-28 md:h-32 bg-white border border-black flex items-end">
              <div
                className={["w-full transition-all duration-700", band === "CRITICAL" ? "bg-black/20" : "bg-black"].join(
                  " "
                )}
                style={{ height: `${pct}%` }}
              />
              {band === "CRITICAL" && <div className="absolute inset-0 border border-dashed border-black" />}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-mono font-bold">
                {pct}
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-500">
              <Icon size={16} />
              <span className="font-mono text-[10px] uppercase tracking-[0.2em]">{band}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ----------------------------- SCREENS -----------------------------

function StartScreen({ initial, onStart, onResume, onReset }) {
  const [subject, setSubject] = useState(initial?.subject || { name: "", email: "", website: "" });
  const canStart = subject.name.trim().length > 0;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-white">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <div className="inline-block border border-black px-3 py-1 text-[10px] uppercase tracking-[0.2em]">
            Quantum Branding
          </div>
          <h1 className="mt-4 text-4xl font-mono font-bold tracking-tighter">SIGNAL AUDIT</h1>
          <p className="mt-2 font-mono text-xs text-gray-500">System v4.1 • Evidence + DoD + HQ Data</p>
        </div>

        <Box className="p-6">
          <div className="space-y-6">
            <div>
              <label className="block font-mono text-[10px] uppercase tracking-[0.2em] mb-2">Subject Name</label>
              <MonoInput
                value={subject.name}
                onChange={(e) => setSubject((s) => ({ ...s, name: e.target.value }))}
                placeholder="ENTER IDENTIFIER"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] mb-2">Email</label>
                <MonoInput
                  type="email"
                  value={subject.email}
                  onChange={(e) => setSubject((s) => ({ ...s, email: e.target.value }))}
                  placeholder="RECOMMENDED"
                />
              </div>
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] mb-2">Website</label>
                <MonoInput
                  value={subject.website}
                  onChange={(e) => setSubject((s) => ({ ...s, website: e.target.value }))}
                  placeholder="OPTIONAL"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Btn onClick={() => onStart(subject)} className="w-full" disabled={!canStart}>
                <Zap size={14} />
                INITIALIZE SCAN
              </Btn>

              {initial?.inProgress && (
                <Btn onClick={onResume} variant="secondary" className="w-full">
                  <ArrowRight size={14} />
                  RESUME SESSION
                </Btn>
              )}

              {initial?.inProgress && (
                <Btn onClick={onReset} variant="ghost" className="w-full text-gray-400">
                  RESET
                </Btn>
              )}
            </div>
          </div>
        </Box>

        <p className="mt-8 text-center font-mono text-[10px] text-gray-400">
          5 Forces • Whale Filter • Evidence • Definition of Done • HQ Transmission
        </p>
      </div>
    </div>
  );
}

function QuizScreen({ idx, answersById, onPickAndNext, onBack, scoresPreview }) {
  const q = QUIZ_QUESTIONS[idx];
  const total = QUIZ_QUESTIONS.length;
  const current = idx + 1;
  const picked = answersById[q.id];

  return (
    <div className="min-h-screen max-w-6xl mx-auto p-6 md:p-10 bg-white">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="border border-black p-6">
          <div className="flex items-center justify-between gap-4 mb-6">
            <Btn variant="secondary" onClick={onBack} disabled={idx === 0}>
              <ArrowLeft size={14} />
              Back
            </Btn>

            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
              Signal {current} / {total} • {q.isMeta ? "FILTER" : q.force.toUpperCase()}
            </div>
          </div>

          <Progress current={current} total={total} />

          <div className="py-10">
            <h2 className="text-2xl md:text-3xl font-mono leading-tight mb-10">{q.text}</h2>

            <div className="space-y-4">
              {q.options.map((opt) => {
                const active = picked === opt.value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => onPickAndNext(q.id, opt.value)}
                    className={[
                      "w-full text-left border border-black p-5 font-mono text-sm md:text-base transition hover:translate-x-1",
                      active ? "bg-black text-white" : "bg-white text-black hover:bg-black hover:text-white",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span>{opt.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            <p className="mt-8 font-mono text-[10px] text-gray-400">
              Answer fast. This is diagnostic, not moral.
            </p>
          </div>
        </div>

        <div className="border border-black p-4">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3">Live Scores</div>
          <ForceBars scores={scoresPreview || {}} compact />
          <div className="mt-4 text-[10px] font-mono text-gray-500">
            Lowest force becomes the primary leak. No hacks. No “feels”.
          </div>
        </div>
      </div>
    </div>
  );
}

function EvidenceDodScreen({
  subject,
  scores,
  artifactsByForce,
  evidenceByForce,
  setEvidenceByForce,
  dodByForce,
  setDodByForce,
  onBackToQuiz,
  onGenerateReport,
}) {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="font-mono font-bold tracking-tighter text-xl">EVIDENCE + DEFINITION OF DONE</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">
            {subject?.name || "—"} • Artifacts to build • Proof to collect
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Btn variant="secondary" onClick={onBackToQuiz}>
            <ArrowLeft size={14} />
            Back
          </Btn>
          <Btn onClick={onGenerateReport}>
            <Zap size={14} />
            Generate Report
          </Btn>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
        <section>
          <div className="flex items-end justify-between border-b border-black pb-2 mb-4">
            <h2 className="font-mono font-bold uppercase tracking-widest text-sm">Force Snapshot</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">0 — 100</span>
          </div>
          <ForceBars scores={scores || {}} />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {FORCES.map((f) => {
            const band = scoreBand(scores?.[f.id] ?? 0);
            const ev = evidenceByForce?.[f.id] || { notes: "", links: [""] };
            const dod = dodByForce?.[f.id] || { checks: {}, notes: "" };
            const artifacts = artifactsByForce?.[f.id] || [];

            return (
              <Box key={f.id} className="p-6">
                <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-3 mb-4">
                  <div>
                    <div className="font-mono font-bold tracking-tight text-lg">{f.label}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                      Band: <span className="text-black">{band}</span> • Room: {f.room}
                    </div>
                  </div>
                  <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
                    Score: {scores?.[f.id] ?? 0}
                  </div>
                </div>

                <div className="space-y-5">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">
                      Required Artifacts
                    </div>
                    <ul className="space-y-2">
                      {artifacts.map((a, i) => (
                        <li key={i} className="font-mono text-sm border-b border-gray-100 pb-2">
                          {a}
                        </li>
                      ))}
                      {artifacts.length === 0 && (
                        <li className="font-mono text-sm text-gray-500">No artifacts configured.</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">
                      Evidence (links)
                    </div>
                    <div className="space-y-2">
                      {ev.links.map((link, i) => (
                        <input
                          key={i}
                          value={link}
                          onChange={(e) => {
                            const next = { ...evidenceByForce };
                            const links = [...(next[f.id]?.links || [""])];
                            links[i] = e.target.value;
                            next[f.id] = { ...(next[f.id] || { notes: "" }), links };
                            setEvidenceByForce(next);
                          }}
                          placeholder="https://..."
                          className="w-full border border-black px-3 py-2 font-mono text-sm focus:outline-none"
                        />
                      ))}
                      <div className="flex gap-2">
                        <Btn
                          variant="secondary"
                          onClick={() => {
                            const next = { ...evidenceByForce };
                            const links = [...(next[f.id]?.links || [""]), ""];
                            next[f.id] = { ...(next[f.id] || { notes: "" }), links };
                            setEvidenceByForce(next);
                          }}
                        >
                          + Add Link
                        </Btn>
                        {ev.links.length > 1 && (
                          <Btn
                            variant="secondary"
                            onClick={() => {
                              const next = { ...evidenceByForce };
                              const links = [...(next[f.id]?.links || [""])];
                              links.pop();
                              next[f.id] = { ...(next[f.id] || { notes: "" }), links };
                              setEvidenceByForce(next);
                            }}
                          >
                            − Remove
                          </Btn>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <textarea
                        value={ev.notes}
                        onChange={(e) => {
                          const next = { ...evidenceByForce };
                          next[f.id] = { ...(next[f.id] || { links: [""] }), notes: e.target.value };
                          setEvidenceByForce(next);
                        }}
                        placeholder="Evidence notes (what proves this force is real?)"
                        className="w-full border border-black px-3 py-2 font-mono text-sm h-24 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-2">
                      Definition of Done
                    </div>
                    <div className="space-y-2">
                      {(DOD_LIBRARY[f.id] || []).map((item) => (
                        <label key={item.key} className="flex items-start gap-3 font-mono text-sm">
                          <input
                            type="checkbox"
                            checked={!!dod.checks[item.key]}
                            onChange={(e) => {
                              const next = { ...dodByForce };
                              const checks = { ...(next[f.id]?.checks || {}) };
                              checks[item.key] = e.target.checked;
                              next[f.id] = { ...(next[f.id] || { notes: "" }), checks };
                              setDodByForce(next);
                            }}
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>

                    <div className="mt-3">
                      <textarea
                        value={dod.notes}
                        onChange={(e) => {
                          const next = { ...dodByForce };
                          next[f.id] = { ...(next[f.id] || { checks: {} }), notes: e.target.value };
                          setDodByForce(next);
                        }}
                        placeholder="DoD notes (what would make you say: 'done')"
                        className="w-full border border-black px-3 py-2 font-mono text-sm h-20 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </Box>
            );
          })}
        </section>
      </main>
    </div>
  );
}

function ReportScreen({ report, onRestart }) {
  const subject = report.subject || {};
  const scores = report.scores || {};
  const primary = report.primary;
  const secondary = report.secondary;

  const handleCopy = async () => {
    if (!isBrowser()) return;
    await navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    alert("Copied report JSON.");
  };

  const handleDownload = () => {
    const safeName = (subject.name || "subject").replace(/\s+/g, "_").toLowerCase();
    exportJson(`quantum_signals_${safeName}.json`, report);
  };

  const routePrimaryUrl =
    report.route.primary === "KIT"
      ? `https://www.qtmbg.com/kit#${primary.force}`
      : report.route.primary === "MRI"
      ? "https://www.qtmbg.com/mri"
      : "https://www.qtmbg.com/lab";

  const routeSecondaryUrl =
    report.route.secondary === "KIT"
      ? `https://www.qtmbg.com/kit#${primary.force}`
      : report.route.secondary === "MRI"
      ? "https://www.qtmbg.com/mri"
      : "https://www.qtmbg.com/lab";

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-black p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 print:hidden">
        <div>
          <div className="font-mono font-bold tracking-tighter text-xl">SIGNAL AUDIT REPORT</div>
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">
            {subject.name || "—"} • {new Date(report.createdAtISO).toLocaleString()}
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Btn variant="secondary" onClick={() => window.print()}>
            <Printer size={14} />
            PDF
          </Btn>
          <Btn variant="secondary" onClick={handleCopy}>
            <Clipboard size={14} />
            Copy JSON
          </Btn>
          <Btn variant="secondary" onClick={handleDownload}>
            <Download size={14} />
            Download JSON
          </Btn>
          <Btn onClick={onRestart}>
            <Zap size={14} />
            NEW SCAN
          </Btn>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 md:p-10 space-y-10">
        <section className="text-center py-6">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-3">
            Primary Signal Leak Detected
          </div>
          <h1 className="text-4xl md:text-6xl font-mono font-bold tracking-tighter">{primary.leak.toUpperCase()}</h1>
          <div className="mt-4 inline-block border border-black px-4 py-2 font-mono text-xs uppercase tracking-[0.2em]">
            Symptom: {primary.symptom} • Room: {primary.room}
          </div>
          <div className="mt-3 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
            Severity: <span className="text-black">{primary.band}</span> • Secondary:{" "}
            <span className="text-black">
              {secondary.leak} ({secondary.force.toUpperCase()})
            </span>
          </div>
        </section>

        <section>
          <div className="flex items-end justify-between border-b border-black pb-2 mb-4">
            <h2 className="font-mono font-bold uppercase tracking-widest text-sm">Force Analysis</h2>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">0 — 100</span>
          </div>
          <ForceBars scores={scores} />
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Box className="p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-4">
              Required Corrections
            </div>
            <ul className="space-y-3">
              {primary.corrections.map((c, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <div className="font-mono font-bold text-xs">{String(i + 1).padStart(2, "0")}</div>
                  <div className="font-mono text-sm border-b border-gray-200 pb-2 w-full">{c}</div>
                </li>
              ))}
            </ul>
          </Box>

          <Box className="p-6 bg-gray-50">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-4">Execution Protocol</div>

            <div className="space-y-4">
              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-gray-500">Action Today</div>
                <div className="mt-2 font-mono text-sm font-bold">{primary.today}</div>
              </div>

              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-gray-500">7-Day Plan</div>
                <ol className="mt-2 space-y-1">
                  {primary.week.map((w, i) => (
                    <li key={i} className="font-mono text-sm">
                      <span className="font-mono font-bold text-xs mr-2">{String(i + 1).padStart(2, "0")}</span>
                      {w}
                    </li>
                  ))}
                </ol>
              </div>

              <div>
                <div className="font-mono text-xs uppercase tracking-widest text-gray-500">Metric</div>
                <div className="mt-2 font-mono text-sm">{primary.metric}</div>
              </div>
            </div>
          </Box>
        </section>

        <section className="border-t border-black pt-8 pb-2 print:hidden">
          <div className="text-center">
            <div className="font-mono text-xs uppercase tracking-[0.2em] text-gray-500">Recommended Protocol</div>

            <p className="mt-3 font-mono text-sm text-gray-600 max-w-3xl mx-auto mb-8">
              {report.isWhale
                ? "WHALE DETECTED: This level requires intervention while moving. Priority is architecture + constraints, not more templates."
                : "NON-WHALE: Install the OS first. Templates + constraints now, precision diagnosis later if needed."}
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Btn onClick={() => (window.location.href = routePrimaryUrl)}>OPEN {report.route.primary}</Btn>
              <Btn variant="secondary" onClick={() => (window.location.href = routeSecondaryUrl)}>
                OPEN {report.route.secondary}
              </Btn>
            </div>

            <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
              Primary Route: <span className="text-black">{report.route.primary}</span> • Secondary Route:{" "}
              <span className="text-black">{report.route.secondary}</span>
            </div>
          </div>
        </section>

        <section className="border-t border-black pt-8">
          <div className="font-mono font-bold uppercase tracking-widest text-sm mb-4">Artifacts Map</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FORCES.map((f) => {
              const band = report.bands?.[f.id];
              const artifacts = report.artifactsByForce?.[f.id] || [];
              return (
                <Box key={f.id} className="p-6">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
                    <div className="font-mono font-bold">{f.label}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">{band}</div>
                  </div>
                  <ul className="space-y-2">
                    {artifacts.map((a, i) => (
                      <li key={i} className="font-mono text-sm border-b border-gray-100 pb-2">
                        {a}
                      </li>
                    ))}
                    {artifacts.length === 0 && <li className="font-mono text-sm text-gray-500">—</li>}
                  </ul>
                </Box>
              );
            })}
          </div>
        </section>

        <div className="hidden print:block text-center pt-8 font-mono text-[10px] text-gray-400">
          GENERATED BY QUANTUM SIGNALS OS • THEQUANTUMBRANDING.COM
        </div>
      </main>
    </div>
  );
}

// ----------------------------- MAIN APP -----------------------------

export default function App() {
  // Tailwind CDN injection (portable for StackBlitz demos)
  useEffect(() => {
    if (!isBrowser()) return;
    const scriptId = "tailwind-cdn";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.tailwindcss.com";
      document.head.appendChild(script);
    }
  }, []);

  // Retry any queued submissions on load
  useEffect(() => {
    if (!isBrowser()) return;
    const raw = safeGet(SUBMIT_QUEUE_KEY);
    if (!raw) return;

    let queue = [];
    try {
      queue = JSON.parse(raw) || [];
    } catch {
      queue = [];
    }

    if (!Array.isArray(queue) || queue.length === 0) return;

    // best-effort flush (no-cors => cannot confirm success; we still attempt)
    const flush = async () => {
      if (!GOOGLE_SCRIPT_URL) return;
      const remaining = [];
      for (const item of queue) {
        try {
          await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(item),
          });
          // assume success (no-cors)
        } catch {
          remaining.push(item);
        }
      }
      if (remaining.length === 0) safeRemove(SUBMIT_QUEUE_KEY);
      else safeSet(SUBMIT_QUEUE_KEY, JSON.stringify(remaining));
    };

    flush();
  }, []);

  const hydrated = useMemo(() => loadState(), []);
  const [view, setView] = useState(() => (hydrated?.report ? "report" : "start"));

  const [subject, setSubject] = useState(hydrated?.subject || null);
  const [answersById, setAnswersById] = useState(hydrated?.answersById || {});
  const [idx, setIdx] = useState(hydrated?.idx || 0);

  const [scoresPreview, setScoresPreview] = useState(hydrated?.scoresPreview || null);

  const [evidenceByForce, setEvidenceByForce] = useState(hydrated?.evidenceByForce || defaultEvidence());
  const [dodByForce, setDodByForce] = useState(hydrated?.dodByForce || defaultDodState());
  const [artifactsByForce, setArtifactsByForce] = useState(hydrated?.artifactsByForce || null);

  const [report, setReport] = useState(hydrated?.report || null);

  const total = QUIZ_QUESTIONS.length;

  useEffect(() => {
    saveState({
      subject,
      answersById,
      idx,
      scoresPreview,
      evidenceByForce,
      dodByForce,
      artifactsByForce,
      report,
      inProgress: view !== "start" && !report,
    });
  }, [subject, answersById, idx, scoresPreview, evidenceByForce, dodByForce, artifactsByForce, report, view]);

  const start = (s) => {
    setSubject(s);
    setAnswersById({});
    setIdx(0);
    setScoresPreview(null);
    setEvidenceByForce(defaultEvidence());
    setDodByForce(defaultDodState());
    setArtifactsByForce(null);
    setReport(null);
    setView("quiz");
  };

  const resume = () => setView("quiz");

  const reset = () => {
    safeRemove(STORAGE_KEY);
    setSubject(null);
    setAnswersById({});
    setIdx(0);
    setScoresPreview(null);
    setEvidenceByForce(defaultEvidence());
    setDodByForce(defaultDodState());
    setArtifactsByForce(null);
    setReport(null);
    setView("start");
  };

  const computeScoresPreviewLocal = (nextAnswers) => computeScoresPreview(nextAnswers).pct;

  // --- DATA SUBMISSION ENGINE ---
  const submitToGoogleSheet = async (reportData) => {
    if (!GOOGLE_SCRIPT_URL || !isBrowser()) return;

    // Dedup: prevent resubmitting same report multiple times
    const submitId = `${reportData.createdAtISO}::${reportData.subject?.email || reportData.subject?.name || "anon"}`;
    const last = safeGet(SUBMIT_DEDUP_KEY);
    if (last && last === submitId) return;

    // Payload optimized for Google Sheet readability
    const payload = {
      timestamp: new Date().toISOString(),
      app: reportData.app,
      version: reportData.version,
      createdAtISO: reportData.createdAtISO,

      client_name: reportData.subject?.name || "",
      client_email: reportData.subject?.email || "",
      client_website: reportData.subject?.website || "",

      isWhale: reportData.isWhale ? "YES" : "NO",
      revenue_tier: reportData.answersById?.revenue || 1,

      primary_force: reportData.primary?.force || "",
      secondary_force: reportData.secondary?.force || "",
      symptom: reportData.primary?.symptom || "",
      leak: reportData.primary?.leak || "",

      score_essence: reportData.scores?.essence ?? 0,
      score_identity: reportData.scores?.identity ?? 0,
      score_offer: reportData.scores?.offer ?? 0,
      score_system: reportData.scores?.system ?? 0,
      score_growth: reportData.scores?.growth ?? 0,

      // Keep full JSON as a single cell if you want later deep analysis
      raw_json: JSON.stringify(reportData),
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", // required for most Apps Script web apps
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      safeSet(SUBMIT_DEDUP_KEY, submitId);
      // no-cors => cannot read response, assume sent
    } catch (e) {
      // Queue for retry later
      let queue = [];
      try {
        queue = JSON.parse(safeGet(SUBMIT_QUEUE_KEY) || "[]");
      } catch {
        queue = [];
      }
      queue.push(payload);
      safeSet(SUBMIT_QUEUE_KEY, JSON.stringify(queue));
    }
  };

  // TECHNICAL FIX: no async race at final question
  const pickAndNext = (questionId, value) => {
    const nextAnswers = { ...answersById, [questionId]: value };
    setAnswersById(nextAnswers);

    const nextScores = computeScoresPreviewLocal(nextAnswers);
    setScoresPreview(nextScores);
    setArtifactsByForce(computeArtifactsByForce(nextScores));

    if (idx >= total - 1) {
      setView("evidence");
      return;
    }

    setIdx((i) => i + 1);
  };

  const back = () => setIdx((i) => Math.max(0, i - 1));
  const backToQuizFromEvidence = () => setView("quiz");

  const generateReport = () => {
    const r = computeReport({
      answersById,
      subject,
      evidenceByForce,
      dodByForce,
    });

    // 🔥 FIRE THE SIGNAL (HQ data capture)
    submitToGoogleSheet(r);

    setReport(r);
    setView("report");
  };

  const restart = () => {
    setAnswersById({});
    setIdx(0);
    setScoresPreview(null);
    setEvidenceByForce(defaultEvidence());
    setDodByForce(defaultDodState());
    setArtifactsByForce(null);
    setReport(null);
    setView("start");
  };

  const initial = {
    subject: hydrated?.subject || null,
    inProgress: !!hydrated?.inProgress && !hydrated?.report,
  };

  if (view === "start") {
    return <StartScreen initial={initial} onStart={start} onResume={resume} onReset={reset} />;
  }

  if (view === "quiz") {
    return (
      <QuizScreen
        idx={idx}
        answersById={answersById}
        onPickAndNext={pickAndNext}
        onBack={back}
        scoresPreview={scoresPreview || {}}
      />
    );
  }

  if (view === "evidence") {
    const liveScores = scoresPreview || computeScoresPreviewLocal(answersById);
    const liveArtifacts = artifactsByForce || computeArtifactsByForce(liveScores);

    return (
      <EvidenceDodScreen
        subject={subject}
        scores={liveScores}
        artifactsByForce={liveArtifacts}
        evidenceByForce={evidenceByForce}
        setEvidenceByForce={setEvidenceByForce}
        dodByForce={dodByForce}
        setDodByForce={setDodByForce}
        onBackToQuiz={backToQuizFromEvidence}
        onGenerateReport={generateReport}
      />
    );
  }

  if (view === "report" && report) {
    return <ReportScreen report={report} onRestart={restart} />;
  }

  return null;
}
