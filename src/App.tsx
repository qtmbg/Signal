import React, { useEffect, useMemo, useState } from "react";
import {
  Zap,
  ShieldAlert,
  Activity,
  Target,
  Cpu,
  Layers,
  Send,
  Download,
  Copy,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ExternalLink,
} from "lucide-react";

/**
 * SIGNAL APP (Paid) — Dashboard Mode
 * - No quiz.
 * - Manual scoring + Evidence + Definition of Done.
 * - Local persistence + optional HQ transmission.
 *
 * Requirements:
 * - lucide-react installed
 * - Tailwind enabled (this UI assumes Tailwind classes exist)
 */

// ----------------------------- CONFIG -----------------------------

type ForceId = "essence" | "identity" | "offer" | "system" | "growth";
type Band = "CRITICAL" | "FRICTION" | "OK" | "STRONG";

type Subject = { name: string; email: string; website: string };

type Evidence = { notes: string; links: string[] };
type DodState = { checks: Record<string, boolean>; notes: string };

type Scores = Record<ForceId, number>;

type ForceDef = {
  id: ForceId;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
  hint: string;
  kitUrl: string;
};

const FORCES: ForceDef[] = [
  {
    id: "essence",
    label: "ESSENCE",
    icon: Zap,
    hint: "Your mechanism + belief. What makes you non-copyable.",
    kitUrl: "https://www.qtmbg.com/kit#essence",
  },
  {
    id: "identity",
    label: "IDENTITY",
    icon: ShieldAlert,
    hint: "Your visible signal. Packaging, proof, signature assets.",
    kitUrl: "https://www.qtmbg.com/kit#identity",
  },
  {
    id: "offer",
    label: "OFFER",
    icon: Target,
    hint: "Your promise + scope locks. Why people pay now.",
    kitUrl: "https://www.qtmbg.com/kit#offer",
  },
  {
    id: "system",
    label: "SYSTEM",
    icon: Cpu,
    hint: "Your routing + delivery machine. No chaos, no leaks.",
    kitUrl: "https://www.qtmbg.com/kit#system",
  },
  {
    id: "growth",
    label: "GROWTH",
    icon: Activity,
    hint: "Your channel cadence + feedback loops. Expansion with control.",
    kitUrl: "https://www.qtmbg.com/kit#growth",
  },
];

const PRIORITY_ORDER: ForceId[] = ["essence", "identity", "offer", "system", "growth"];

const STORAGE_KEY = "quantum-signal-dashboard:v1";

// Vercel / Vite env var (optional)
const GOOGLE_SCRIPT_URL: string =
  (typeof import.meta !== "undefined" && (import.meta as any)?.env?.VITE_GOOGLE_SCRIPT_URL) || "";

// ----------------------------- DOD LIBRARY -----------------------------

type DodItem = { key: string; label: string };

const DOD_LIBRARY: Record<ForceId, DodItem[]> = {
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

// ----------------------------- HELPERS -----------------------------

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isBrowser() {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function safeGet(key: string) {
  if (!isBrowser()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(key: string) {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function scoreBand(score: number): Band {
  const s = clamp(Math.round(score), 0, 100);
  if (s < 40) return "CRITICAL";
  if (s < 60) return "FRICTION";
  if (s < 80) return "OK";
  return "STRONG";
}

function exportJson(filename: string, data: unknown) {
  if (!isBrowser()) return;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function defaultSubject(): Subject {
  return { name: "", email: "", website: "" };
}

function defaultScores(): Scores {
  return { essence: 50, identity: 50, offer: 50, system: 50, growth: 50 };
}

function defaultEvidence(): Record<ForceId, Evidence> {
  const out = {} as Record<ForceId, Evidence>;
  FORCES.forEach((f) => {
    out[f.id] = { notes: "", links: [""] };
  });
  return out;
}

function defaultDod(): Record<ForceId, DodState> {
  const out = {} as Record<ForceId, DodState>;
  FORCES.forEach((f) => {
    const checks: Record<string, boolean> = {};
    (DOD_LIBRARY[f.id] || []).forEach((it) => (checks[it.key] = false));
    out[f.id] = { checks, notes: "" };
  });
  return out;
}

function computePrimarySecondary(scores: Scores) {
  const sorted = (Object.entries(scores) as Array<[ForceId, number]>).sort((a, b) => {
    if (a[1] !== b[1]) return a[1] - b[1];
    return PRIORITY_ORDER.indexOf(a[0]) - PRIORITY_ORDER.indexOf(b[0]);
  });
  return {
    primaryForce: sorted[0]?.[0] || "essence",
    secondaryForce: sorted[1]?.[0] || "identity",
  };
}

// ----------------------------- UI PRIMITIVES -----------------------------

function Box(props: { children: React.ReactNode; className?: string }) {
  return <div className={`border border-black bg-white ${props.className || ""}`}>{props.children}</div>;
}

function Btn(props: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const variant = props.variant || "primary";
  const disabled = !!props.disabled;

  const base =
    "inline-flex items-center justify-center gap-2 border border-black px-4 py-2 font-mono text-xs uppercase tracking-widest transition";
  const styles: Record<string, string> = {
    primary: disabled
      ? "bg-black text-white opacity-40 cursor-not-allowed"
      : "bg-black text-white hover:bg-white hover:text-black",
    secondary: disabled
      ? "bg-white text-black opacity-40 cursor-not-allowed"
      : "bg-white text-black hover:bg-black hover:text-white",
    ghost: disabled ? "border-transparent opacity-40 cursor-not-allowed" : "border-transparent hover:underline",
  };

  return (
    <button
      type={props.type || "button"}
      disabled={disabled}
      onClick={props.onClick}
      className={`${base} ${styles[variant]} ${props.className || ""}`}
    >
      {props.children}
    </button>
  );
}

function MonoInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full border-b border-black bg-transparent py-2 font-mono text-sm placeholder:text-gray-300 focus:outline-none ${
        props.className || ""
      }`}
    />
  );
}

function MonoTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full border border-black px-3 py-2 font-mono text-sm focus:outline-none ${props.className || ""}`}
    />
  );
}

function Pill(props: { children: React.ReactNode; tone?: "dim" | "strong" }) {
  const tone = props.tone || "dim";
  const cls =
    tone === "strong"
      ? "border border-black bg-black text-white"
      : "border border-black bg-white text-black";
  return (
    <span className={`inline-flex items-center px-2 py-1 font-mono text-[10px] uppercase tracking-[0.2em] ${cls}`}>
      {props.children}
    </span>
  );
}

// ----------------------------- MAIN APP -----------------------------

type PersistedState = {
  version: "1";
  subject: Subject;
  revenuePotential: number; // 1-5
  scores: Scores;
  evidence: Record<ForceId, Evidence>;
  dod: Record<ForceId, DodState>;
  lastUpdatedISO: string;
};

function loadPersisted(): PersistedState | null {
  const raw = safeGet(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedState;
  } catch {
    return null;
  }
}

function makePersisted(overrides?: Partial<PersistedState>): PersistedState {
  const now = new Date().toISOString();
  return {
    version: "1",
    subject: defaultSubject(),
    revenuePotential: 1,
    scores: defaultScores(),
    evidence: defaultEvidence(),
    dod: defaultDod(),
    lastUpdatedISO: now,
    ...overrides,
  };
}

async function postToGoogleSheet(payload: unknown) {
  if (!GOOGLE_SCRIPT_URL) return { ok: false, reason: "missing_url" as const };

  try {
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "network" as const };
  }
}

export default function App() {
  const hydrated = useMemo(() => loadPersisted(), []);
  const [state, setState] = useState<PersistedState>(() => hydrated || makePersisted());
  const [activeForce, setActiveForce] = useState<ForceId>("essence");
  const [sendToHQ, setSendToHQ] = useState<boolean>(false);
  const [toast, setToast] = useState<string>("");

  // autosave
  useEffect(() => {
    const next = { ...state, lastUpdatedISO: new Date().toISOString() };
    safeSet(STORAGE_KEY, JSON.stringify(next));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.subject, state.revenuePotential, state.scores, state.evidence, state.dod]);

  // toast helper
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(""), 1800);
    return () => window.clearTimeout(t);
  }, [toast]);

  const bands = useMemo(() => {
    const out = {} as Record<ForceId, Band>;
    FORCES.forEach((f) => (out[f.id] = scoreBand(state.scores[f.id])));
    return out;
  }, [state.scores]);

  const { primaryForce, secondaryForce } = useMemo(() => computePrimarySecondary(state.scores), [state.scores]);

  const isWhale = state.revenuePotential >= 4;

  const reportJson = useMemo(() => {
    return {
      app: "Signal (Dashboard)",
      version: "1.0",
      createdAtISO: new Date().toISOString(),
      subject: state.subject,
      revenuePotential: state.revenuePotential,
      isWhale,
      scores: state.scores,
      bands,
      primary: primaryForce,
      secondary: secondaryForce,
      evidenceByForce: state.evidence,
      dodByForce: state.dod,
      lastUpdatedISO: state.lastUpdatedISO,
    };
  }, [bands, isWhale, primaryForce, secondaryForce, state]);

  const activeDef = useMemo(() => FORCES.find((f) => f.id === activeForce)!, [activeForce]);

  const activeDodItems = DOD_LIBRARY[activeForce] || [];

  const activeDodState = state.dod[activeForce];
  const activeEvidence = state.evidence[activeForce];

  const nextActions = useMemo(() => {
    const unchecked = activeDodItems.filter((it) => !activeDodState.checks[it.key]);
    return unchecked.slice(0, 3);
  }, [activeDodItems, activeDodState.checks]);

  const completionPct = useMemo(() => {
    const items = activeDodItems;
    if (items.length === 0) return 0;
    const done = items.filter((it) => !!activeDodState.checks[it.key]).length;
    return Math.round((done / items.length) * 100);
  }, [activeDodItems, activeDodState.checks]);

  const resetAll = () => {
    safeRemove(STORAGE_KEY);
    setState(makePersisted());
    setActiveForce("essence");
    setToast("Reset.");
  };

  const copyJson = async () => {
    if (!isBrowser()) return;
    await navigator.clipboard.writeText(JSON.stringify(reportJson, null, 2));
    setToast("Copied JSON.");
  };

  const downloadJson = () => {
    const safeName = (state.subject.name || "signal").replace(/\s+/g, "_").toLowerCase();
    exportJson(`signal_dashboard_${safeName}.json`, reportJson);
    setToast("Downloaded JSON.");
  };

  const submitHQ = async () => {
    const payload = {
      submit_id: uid(),
      timestamp_iso: new Date().toISOString(),
      subject_name: state.subject.name || "",
      subject_email: state.subject.email || "",
      subject_website: state.subject.website || "",
      revenue_potential: state.revenuePotential,
      is_whale: isWhale,

      score_essence: state.scores.essence,
      score_identity: state.scores.identity,
      score_offer: state.scores.offer,
      score_system: state.scores.system,
      score_growth: state.scores.growth,

      primary_force: primaryForce,
      secondary_force: secondaryForce,

      raw_json: JSON.stringify(reportJson),
    };

    const res = await postToGoogleSheet(payload);
    if (res.ok) setToast("Sent to HQ.");
    else setToast(GOOGLE_SCRIPT_URL ? "HQ failed." : "No HQ URL.");
  };

  const goPrevForce = () => {
    const idx = FORCES.findIndex((f) => f.id === activeForce);
    const nextIdx = clamp(idx - 1, 0, FORCES.length - 1);
    setActiveForce(FORCES[nextIdx].id);
  };

  const goNextForce = () => {
    const idx = FORCES.findIndex((f) => f.id === activeForce);
    const nextIdx = clamp(idx + 1, 0, FORCES.length - 1);
    setActiveForce(FORCES[nextIdx].id);
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Top bar */}
      <div className="border-b border-black">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center border border-black px-3 py-1 font-mono text-[10px] uppercase tracking-[0.2em]">
              Quantum Branding
            </div>
            <div>
              <div className="font-mono font-bold text-xl tracking-tight">SIGNAL</div>
              <div className="font-mono text-[11px] text-gray-500">
                Paid Dashboard • Evidence + DoD • Progress Saved
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Pill tone="dim">Primary: {primaryForce.toUpperCase()}</Pill>
            <Pill tone="dim">Secondary: {secondaryForce.toUpperCase()}</Pill>
            <Pill tone={isWhale ? "strong" : "dim"}>{isWhale ? "WHALE" : "STANDARD"}</Pill>
          </div>
        </div>
      </div>

      {/* Layout */}
      <div className="mx-auto max-w-6xl px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Setup + Force nav */}
        <div className="lg:col-span-4 space-y-6">
          <Box className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Subject</div>
              <div className="font-mono text-[10px] text-gray-400">{new Date(state.lastUpdatedISO).toLocaleString()}</div>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] mb-2">Name</label>
                <MonoInput
                  value={state.subject.name}
                  onChange={(e) => setState((s) => ({ ...s, subject: { ...s.subject, name: e.target.value } }))}
                  placeholder="ENTER IDENTIFIER"
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.2em] mb-2">Email</label>
                  <MonoInput
                    type="email"
                    value={state.subject.email}
                    onChange={(e) => setState((s) => ({ ...s, subject: { ...s.subject, email: e.target.value } }))}
                    placeholder="RECOMMENDED"
                  />
                </div>

                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-[0.2em] mb-2">Website</label>
                  <MonoInput
                    value={state.subject.website}
                    onChange={(e) => setState((s) => ({ ...s, subject: { ...s.subject, website: e.target.value } }))}
                    placeholder="OPTIONAL"
                  />
                </div>
              </div>

              <div>
                <label className="block font-mono text-[10px] uppercase tracking-[0.2em] mb-2">
                  Revenue Potential (1–5)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={state.revenuePotential}
                    onChange={(e) => setState((s) => ({ ...s, revenuePotential: Number(e.target.value) }))}
                    className="w-full"
                  />
                  <div className="w-10 text-right font-mono text-sm">{state.revenuePotential}</div>
                </div>
                <div className="mt-1 font-mono text-[11px] text-gray-500">
                  4–5 triggers whale routing (MRI/Lab priority).
                </div>
              </div>
            </div>
          </Box>

          <Box className="p-4">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Force Dashboard</div>

            <div className="mt-4 border border-black">
              {FORCES.map((f) => {
                const Icon = f.icon;
                const isActive = f.id === activeForce;
                const s = state.scores[f.id];
                const band = bands[f.id];

                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveForce(f.id)}
                    className={[
                      "w-full text-left px-4 py-3 border-b border-black last:border-b-0",
                      "transition",
                      isActive ? "bg-black text-white" : "bg-white text-black hover:bg-gray-50",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Icon size={16} />
                        <div className="font-mono text-xs uppercase tracking-widest">{f.label}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">{s}</span>
                        <span
                          className={[
                            "font-mono text-[10px] uppercase tracking-[0.2em] px-2 py-1 border",
                            isActive ? "border-white" : "border-black",
                          ].join(" ")}
                        >
                          {band}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 h-1 border border-current">
                      <div
                        className="h-full bg-current"
                        style={{ width: `${clamp(s, 0, 100)}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Btn variant="secondary" onClick={goPrevForce} className="w-[48%]">
                <ChevronLeft size={14} /> Prev
              </Btn>
              <Btn variant="secondary" onClick={goNextForce} className="w-[48%]">
                Next <ChevronRight size={14} />
              </Btn>
            </div>
          </Box>

          <Box className="p-4">
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Export</div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 font-mono text-[11px] text-gray-600">
                  <input
                    type="checkbox"
                    checked={sendToHQ}
                    onChange={(e) => setSendToHQ(e.target.checked)}
                  />
                  Send to HQ
                </label>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Btn variant="secondary" onClick={copyJson} className="w-full">
                <Copy size={14} /> Copy JSON
              </Btn>
              <Btn variant="secondary" onClick={downloadJson} className="w-full">
                <Download size={14} /> Download JSON
              </Btn>
            </div>

            <div className="mt-2">
              <Btn
                onClick={() => {
                  if (sendToHQ) submitHQ();
                  else setToast("Enable 'Send to HQ' first.");
                }}
                className="w-full"
                disabled={!sendToHQ}
              >
                <Send size={14} /> TRANSMIT
              </Btn>
              <div className="mt-2 font-mono text-[11px] text-gray-500">
                Uses VITE_GOOGLE_SCRIPT_URL (optional). This should be deliberate for a paid product.
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Btn variant="ghost" onClick={resetAll} className="text-gray-500">
                <RefreshCw size={14} /> Reset
              </Btn>
              {toast ? (
                <span className="font-mono text-[11px] text-black">{toast}</span>
              ) : (
                <span className="font-mono text-[11px] text-gray-400">Saved automatically.</span>
              )}
            </div>
          </Box>
        </div>

        {/* Right: Active force workspace */}
        <div className="lg:col-span-8 space-y-6">
          <Box className="p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="font-mono font-bold text-2xl tracking-tight">{activeDef.label}</div>
                  <Pill tone="dim">{bands[activeForce]}</Pill>
                  <Pill tone="dim">{completionPct}% DoD</Pill>
                </div>
                <div className="mt-2 font-mono text-[12px] text-gray-600">{activeDef.hint}</div>
              </div>

              <a
                href={activeDef.kitUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 border border-black px-4 py-2 font-mono text-xs uppercase tracking-widest hover:bg-black hover:text-white transition"
              >
                <ExternalLink size={14} />
                Open Kit
              </a>
            </div>

            {/* Manual score */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Manual Score (0–100)</div>
                <div className="font-mono text-sm">{state.scores[activeForce]}</div>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={state.scores[activeForce]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setState((s) => ({ ...s, scores: { ...s.scores, [activeForce]: val } }));
                  }}
                  className="w-full"
                />
              </div>

              <div className="mt-2 font-mono text-[11px] text-gray-500">
                Rule: score reflects reality today, not aspiration.
              </div>
            </div>
          </Box>

          {/* Next Actions */}
          <Box className="p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Next Actions</div>
            <div className="mt-4 grid grid-cols-1 gap-3">
              {nextActions.length === 0 ? (
                <div className="font-mono text-sm">All DoD items complete for this force.</div>
              ) : (
                nextActions.map((it) => (
                  <div key={it.key} className="flex items-start gap-3">
                    <span className="mt-1 inline-block w-2 h-2 bg-black" />
                    <div className="font-mono text-sm">{it.label}</div>
                  </div>
                ))
              )}
            </div>
          </Box>

          {/* Evidence + DoD */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Box className="p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Evidence</div>

              <div className="mt-4 space-y-3">
                {activeEvidence.links.map((link, i) => (
                  <div key={`${activeForce}_link_${i}`} className="flex items-center gap-2">
                    <input
                      value={link}
                      onChange={(e) => {
                        const nextLinks = [...activeEvidence.links];
                        nextLinks[i] = e.target.value;
                        setState((s) => ({
                          ...s,
                          evidence: { ...s.evidence, [activeForce]: { ...s.evidence[activeForce], links: nextLinks } },
                        }));
                      }}
                      placeholder="Paste link (doc, figma, landing, post, recording)"
                      className="w-full border border-black px-3 py-2 font-mono text-sm focus:outline-none"
                    />
                    <Btn
                      variant="secondary"
                      onClick={() => {
                        const nextLinks = [...activeEvidence.links, ""];
                        setState((s) => ({
                          ...s,
                          evidence: { ...s.evidence, [activeForce]: { ...s.evidence[activeForce], links: nextLinks } },
                        }));
                      }}
                    >
                      +
                    </Btn>
                    {activeEvidence.links.length > 1 && (
                      <Btn
                        variant="ghost"
                        onClick={() => {
                          const nextLinks = activeEvidence.links.filter((_, idx) => idx !== i);
                          setState((s) => ({
                            ...s,
                            evidence: { ...s.evidence, [activeForce]: { ...s.evidence[activeForce], links: nextLinks } },
                          }));
                        }}
                        className="text-gray-500"
                      >
                        −
                      </Btn>
                    )}
                  </div>
                ))}

                <MonoTextarea
                  value={activeEvidence.notes}
                  onChange={(e) => {
                    setState((s) => ({
                      ...s,
                      evidence: { ...s.evidence, [activeForce]: { ...s.evidence[activeForce], notes: e.target.value } },
                    }));
                  }}
                  placeholder="Evidence notes: what proves this force is real in the market?"
                  rows={6}
                />
              </div>
            </Box>

            <Box className="p-6">
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">Definition of Done</div>

              <div className="mt-4 space-y-3">
                {activeDodItems.map((item) => (
                  <label key={item.key} className="flex items-start gap-3 font-mono text-sm">
                    <input
                      type="checkbox"
                      checked={!!activeDodState.checks[item.key]}
                      onChange={(e) => {
                        const nextChecks = { ...activeDodState.checks, [item.key]: e.target.checked };
                        setState((s) => ({
                          ...s,
                          dod: { ...s.dod, [activeForce]: { ...s.dod[activeForce], checks: nextChecks } },
                        }));
                      }}
                      className="mt-1"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}

                <MonoTextarea
                  value={activeDodState.notes}
                  onChange={(e) => {
                    setState((s) => ({
                      ...s,
                      dod: { ...s.dod, [activeForce]: { ...s.dod[activeForce], notes: e.target.value } },
                    }));
                  }}
                  placeholder="DoD notes: what would make you say 'done' without self-deception?"
                  rows={4}
                />
              </div>
            </Box>
          </div>

          {/* Bottom guidance */}
          <Box className="p-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Layers size={16} />
                <div className="font-mono text-xs uppercase tracking-widest">Workflow Rule</div>
              </div>
              <Pill tone="dim">DoD → Evidence → Score update</Pill>
            </div>

            <div className="mt-3 font-mono text-sm text-gray-700">
              You don’t “improve the score” by feeling better. You improve it by completing DoD items and attaching proof.
              This is why Signal must not look like Audit.
            </div>
          </Box>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-black">
        <div className="mx-auto max-w-6xl px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-gray-500">
            5 Forces • Evidence • Definition of Done • Saved Progress
          </div>
          <div className="font-mono text-[10px] text-gray-400">
            Tip: keep Audit as lead-gen. Signal is the paid construction workspace.
          </div>
        </div>
      </div>
    </div>
  );
}
