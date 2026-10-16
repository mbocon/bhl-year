// Local-storage state: settings, runs, logs, tests, choices, backup. Pure JS, no DOM.
import { dayInfo } from './calendar.js';

export const STORAGE_KEY = 'bhl-year-v1';
export const STATE_VERSION = 1;
const DAY_MS = 86400e3;

const newRunId = () => 'run-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function defaultSettings(runId) {
  return {
    currentDay: 1,
    currentRun: runId,
    units: 'lb',
    advanced: false,
    maxHR: null,
    age: null,
    bodyweight: null,
    lastExportAt: null,
    equipment: { box: true, rope: true, kb: false, rings: false, climbRope: false, hurdles: false, vest: false, slamBall: false, hrm: true },
  };
}

function freshState() {
  const id = newRunId();
  return {
    version: STATE_VERSION,
    settings: defaultSettings(id),
    choices: {},
    runs: [{ id, startedAt: Date.now(), endedAt: null }],
    logs: { [id]: {} },
    tests: {},
  };
}

function isValidState(obj) {
  return obj && typeof obj === 'object' && obj.version === STATE_VERSION
    && obj.settings && typeof obj.settings === 'object'
    && Array.isArray(obj.runs) && obj.runs.length > 0
    && obj.logs && typeof obj.logs === 'object';
}

function heaviest(sets) {
  let best = null;
  for (const s of sets || []) {
    if (!s || !Number.isFinite(s.w)) continue;
    if (!best || s.w > best.w) best = s;
  }
  return best;
}

export function createStore(storage = globalThis.localStorage) {
  let persistent = true;
  let state = null;

  let raw = null;
  try { raw = storage ? storage.getItem(STORAGE_KEY) : null; } catch { persistent = false; }
  if (raw) {
    try { const parsed = JSON.parse(raw); if (isValidState(parsed)) state = parsed; } catch { /* unreadable: handled below */ }
    if (!state) {
      // Never overwrite something we could not read: keep a copy and defer saving until the first real change.
      try { storage.setItem(STORAGE_KEY + '.broken', raw); } catch { /* best effort */ }
    }
  }
  const deferInitialSave = !!raw && !state;
  if (!state) state = freshState();

  const save = () => {
    if (!storage) { persistent = false; return; }
    try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { persistent = false; }
  };
  if (!deferInitialSave) save();

  const runLogs = () => (state.logs[state.settings.currentRun] ??= {});
  const now = () => Date.now();

  const history = {
    logsFor(slotKey, optionId, opts = {}) {
      const logs = runLogs();
      const limit = state.settings.currentDay;
      const out = [];
      for (const dayStr of Object.keys(logs)) {
        const day = Number(dayStr);
        if (day > limit || (day === limit && !opts.includeToday)) continue;
        for (const block of Object.values(logs[dayStr].blocks || {})) {
          if (block.slotKey !== slotKey) continue;
          if (optionId !== undefined && block.optionId !== optionId) continue;
          out.push({ day, block });
        }
      }
      return out.sort((a, b) => a.day - b.day);
    },
    lastLog(slotKey, optionId, opts) {
      const all = history.logsFor(slotKey, optionId, opts);
      return all.length ? all[all.length - 1] : null;
    },
    latestTest(testId, opts = {}) {
      const list = state.tests[testId] || [];
      let best = null;
      for (const t of list) if (!best || t.at > best.at) best = t;
      if (!best) return null;
      if (opts.maxAgeDays !== undefined && now() - best.at >= opts.maxAgeDays * DAY_MS) return null;
      return best;
    },
    liftEvidence(liftKey) {
      const kinds = { max: '1rm', single: 'single', wave: 'topset' };
      const out = [];
      const logs = runLogs();
      const limit = state.settings.currentDay;
      for (const dayStr of Object.keys(logs)) {
        const day = Number(dayStr);
        if (day >= limit) continue;
        for (const block of Object.values(logs[dayStr].blocks || {})) {
          if (block.lift !== liftKey || !kinds[block.ruleType]) continue;
          const top = heaviest(block.sets);
          if (!top) continue;
          const info = dayInfo(day);
          out.push({ kind: kinds[block.ruleType], weight: top.w, reps: top.r ?? 1, day, at: block.loggedAt || 0, week: info.week, phase: info.phase });
        }
      }
      return out.sort((a, b) => a.day - b.day);
    },
  };

  const store = {
    get state() { return state; },
    get persistent() { return persistent; },
    history,

    settings: () => state.settings,
    updateSettings(patch) {
      const eq = patch.equipment ? { ...state.settings.equipment, ...patch.equipment } : state.settings.equipment;
      state.settings = { ...state.settings, ...patch, equipment: eq };
      save();
    },
    setCurrentDay(n) { state.settings.currentDay = n; save(); },

    startRun() {
      const cur = state.runs.find(r => r.id === state.settings.currentRun);
      if (cur) cur.endedAt = now();
      const id = newRunId();
      state.runs.push({ id, startedAt: now(), endedAt: null });
      state.logs[id] = {};
      state.settings.currentRun = id;
      state.settings.currentDay = 1;
      save();
      return id;
    },

    getLog(n) { return runLogs()[n]; },
    logBlock(n, blockKey, patch) {
      const logs = runLogs();
      const day = (logs[n] ??= { completedAt: null, blocks: {} });
      const prev = day.blocks[blockKey] || {};
      day.blocks[blockKey] = { ...prev, ...patch, loggedAt: now() };
      save();
    },
    completeDay(n) {
      const logs = runLogs();
      const day = (logs[n] ??= { completedAt: null, blocks: {} });
      if (!day.completedAt) day.completedAt = now();
      if (n === state.settings.currentDay) state.settings.currentDay = Math.min(n + 1, 365);
      save();
    },
    recordTest(testId, value, n) {
      (state.tests[testId] ??= []).push({ runId: state.settings.currentRun, day: n, at: now(), value });
      save();
    },
    upsertTest(testId, value, n) {
      const list = (state.tests[testId] ??= []);
      const existing = list.find(t => t.runId === state.settings.currentRun && t.day === n);
      if (existing) { existing.value = value; existing.at = now(); save(); return; }
      store.recordTest(testId, value, n);
    },

    getChoice: slotKey => state.choices[slotKey],
    setChoice(slotKey, optionId) { state.choices[slotKey] = optionId; save(); },

    exportJSON() { return JSON.stringify(state, null, 2); },
    markExported() { state.settings.lastExportAt = now(); save(); },
    importJSON(text) {
      let parsed;
      try { parsed = JSON.parse(text); } catch { return { ok: false, error: 'Not a valid backup file.' }; }
      if (!isValidState(parsed)) return { ok: false, error: 'Backup is from a different version or is incomplete.' };
      state = parsed;
      save();
      return { ok: true };
    },
    eraseAll() { state = freshState(); save(); },
  };
  return store;
}
