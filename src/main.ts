import "./styles.css";
import { buildResult } from "./analyse.ts";
import { measureSlide } from "./measure.ts";
import { analyseText, estimateReadingTime } from "../engine/one-slide-or-three/index.ts";
import { ARTEFACTS, CONSTRAINTS, FAMILIARITY, JOBS, LANES, LAYOUTS, MODES, RELATIONS, SETTINGS, TIMES } from "./content.ts";
import type { AppState, ExpertAnswers, Ride } from "./types.ts";
import {
  announce,
  attachReveal,
  attachTilt,
  bindTheme,
  choiceGrid,
  clearSession,
  downloadText,
  escapeHTML,
  footer,
  header,
  initialiseThreadCursor,
  landAtTop,
  progress,
  readSession,
  writeSession,
  type Choice,
  type ProductMeta,
} from "./ui.ts";

const META: ProductMeta = { name: "Slide Check.", eyebrow: "One real 16:9 page", storageKey: "slide-check.theme" };
const SESSION_KEY = "slide-check.session.v1";
const app = document.querySelector<HTMLDivElement>("#app")!;
if (!app) throw new Error("Slide Check could not find its stage.");
document.body.dataset.product = "slide-check";

const fallback: AppState = {
  phase: "landing",
  step: 0,
  expert: { constraints: [] },
  draft: { title: "", copy: "", quickMode: "speaker_led" },
};
const state = readSession<AppState>(SESSION_KEY, fallback);
state.expert = { ...state.expert, constraints: state.expert.constraints ?? [] };

interface Step {
  key: keyof ExpertAnswers;
  kicker: string;
  question: string;
  note: string;
  choices: readonly Choice[];
  multiple?: boolean;
}

const STEPS: readonly Step[] = [
  { key: "lane", kicker: "The work", question: "What world does this slide belong to?", note: "This changes the useful defaults—not the worth of the idea.", choices: LANES },
  { key: "artefact", kicker: "The deck", question: "What sort of document is it inside?", note: "A sales page and a director’s treatment can carry different kinds of density.", choices: ARTEFACTS },
  { key: "delivery", kicker: "The encounter", question: "How will people meet this slide?", note: "Live slides support a voice. Read-alone pages carry their own context.", choices: MODES },
  { key: "role", kicker: "The page job", question: "What must this page do?", note: "One page can contain several things. It still needs one dominant job.", choices: JOBS },
  { key: "setting", kicker: "The smallest view", question: "Where must it still work?", note: "Choose the smallest likely condition, not the nicest monitor in the studio.", choices: SETTINGS },
  { key: "familiarity", kicker: "The audience", question: "How much do they already know?", note: "New readers need orientation. Familiar readers may genuinely benefit from compression.", choices: FAMILIARITY },
  { key: "relation", kicker: "Eyes and ears", question: "What happens while this copy is visible?", note: "People cannot deeply read one thing while listening to another. Annoying, but reliable.", choices: RELATIONS },
  { key: "layout", kicker: "The shape", question: "What is the page trying to look like?", note: "This helps us interpret blocks and hierarchy without pretending to see intention.", choices: LAYOUTS },
  { key: "time", kicker: "The clock", question: "How long do people get?", note: "A controlled read and a five-second beat are different physical problems.", choices: TIMES },
  { key: "constraints", kicker: "The honest boundary", question: "What cannot casually change?", note: "Pick all that apply. Constraints narrow the advice; they do not make the page fit by magic.", choices: CONSTRAINTS, multiple: true },
];

function save(): void { writeSession(SESSION_KEY, state); }

function render(landing: "top" | "keep" = "top"): void {
  document.title = state.phase === "result" ? `${state.result?.headline ?? "Slide checked"} — Slide Check` : "Slide Check — does this page fit?";
  const trail = state.phase === "flow" ? `Expert check · ${state.step + 1} of ${STEPS.length}` : state.phase === "editor" ? `${state.ride === "expert" ? "Expert" : "Quick"} check` : undefined;
  app.innerHTML = `${header(META, trail)}<main id="main">${page()}</main>${state.phase === "landing" || state.phase === "result" ? footer("Slide Check") : ""}`;
  bindTheme(META.storageKey);
  bindEvents();
  attachReveal();
  attachTilt();
  if (landing === "top") landAtTop();
}

function page(): string {
  if (state.phase === "flow") return flowPage();
  if (state.phase === "editor") return editorPage();
  if (state.phase === "result" && state.result) return resultPage();
  return landingPage();
}

function landingPage(): string {
  return `<section class="landing slide-landing">
    <div class="landing-copy">
      <p class="scope-tag">Any work with slides · local-first</p>
      <p class="kicker">One page. One honest answer.</p>
      <h1 data-page-heading tabindex="-1">Does this slide fit?</h1>
      <p class="landing-lede">Paste the exact words from one real 16:9 page. Get a clear keep, split, or edit decision.</p>
      <div class="landing-proof"><span>Real 16:9 preview</span><span>No idea score</span><span>Nothing leaves the browser</span></div>
      <a class="primary-action" href="#choose-a-check">Choose a check <span aria-hidden="true">↓</span></a>
    </div>
    <div class="landing-art" data-tilt="1.6" aria-hidden="true">
      <img src="/assets/hero.webp" alt="">
      <p class="landing-art__note">One page can have depth. It cannot have seventeen unrelated jobs and remain one page.</p>
    </div>
  </section>
  <section class="ride-section" id="choose-a-check">
    <div class="section-heading"><p class="kicker">Choose your level of nosiness</p><h2>Thirty seconds—or the proper look.</h2><p>The quick check measures the page. Expert mode asks for context first, then explains exactly how that context changed the call.</p></div>
    <div class="ride-grid">
      <button class="ride-card" type="button" data-ride="quick"><span class="ride-number">01</span><small>About 30 seconds</small><strong>Just check the slide.</strong><p>Choose live, read-alone, or both. Paste the visible copy. Get the physical answer.</p><em>Start quick check ↗</em></button>
      <button class="ride-card ride-card--expert" type="button" data-ride="expert"><span class="ride-number">02</span><small>About 3 minutes · 10 short choices</small><strong>Take the expert route.</strong><p>Audience, page job, layout, time, speech competition, and hard constraints. Still no essay boxes.</p><em>Start expert check ↗</em></button>
    </div>
  </section>`;
}

function flowPage(): string {
  const step = STEPS[Math.min(state.step, STEPS.length - 1)]!;
  const value = state.expert[step.key];
  const selected = typeof value === "string" ? value : undefined;
  const selectedMany = step.key === "constraints" ? state.expert.constraints : [];
  return `<section class="question-page">
    ${progress("Expert slide check", state.step, STEPS.length)}
    <div class="question-layout">
      <div class="question-copy">
        <button class="question-back" type="button" id="flow-back">← ${state.step ? "Previous question" : "Choose another route"}</button>
        <div class="question-art" aria-hidden="true"><img src="/assets/hero.webp" alt=""></div>
        <p class="scope-tag">Slide Check · expert mode</p><p class="kicker">${step.kicker}</p>
        <h1 data-page-heading tabindex="-1">${step.question}</h1><p>${step.note}</p>
      </div>
      <div class="answers-panel"><div class="answers-inner"><p class="answers-instruction">${step.multiple ? "Pick any real constraints. You can leave the lot alone." : "Pick the closest truth. You can go back."}</p>${choiceGrid(step.choices, step.multiple ? "multi-choice" : "flow-choice", selected, selectedMany)}${step.multiple ? '<button class="primary-action multi-continue" id="multi-continue" type="button">Keep going <span aria-hidden="true">↗</span></button>' : ""}</div></div>
    </div>
  </section>`;
}

function modeSwitch(): string {
  return `<div class="mode-switch" role="group" aria-label="How people meet the slide">${MODES.slice(0, 3).map((mode) => `<button type="button" data-quick-mode="${mode.value}" aria-pressed="${state.draft.quickMode === mode.value}">${mode.label}</button>`).join("")}</div>`;
}

function editorPage(): string {
  const expert = state.ride === "expert";
  return `<section class="editor-page">
    <div class="editor-intro">
      <button class="question-back" id="editor-back" type="button">← ${expert ? "Last expert question" : "Choose another check"}</button>
      <p class="scope-tag">Slide Check · ${expert ? "expert" : "quick"} mode</p>
      <h1 data-page-heading tabindex="-1">Paste one real slide.</h1>
      <p>Not the whole deck. Not a description. The exact words a person must read on this page.</p>
      ${expert ? `<details class="context-recap"><summary>Your expert context</summary><div>${expertSummary()}</div></details>` : modeSwitch()}
    </div>
    <div class="workbench">
      <div class="copy-panel">
        <div class="copy-panel__bar"><span>16:9 copy editor</span><strong>Paste here ↓</strong></div>
        <label for="slide-title">Slide title <span>optional</span></label>
        <input id="slide-title" value="${escapeHTML(state.draft.title)}" placeholder="For example: Why this, why now">
        <label for="slide-copy">Everything else visible on the slide</label>
        <textarea id="slide-copy" rows="10" placeholder="Paste the body, labels, quote, and source people must read…">${escapeHTML(state.draft.copy)}</textarea>
        <output class="live-load" aria-label="Current measurable slide load"><span id="live-load">${copyLoadText()}</span><kbd>⌘/Ctrl + Enter</kbd></output>
        <button class="primary-action" id="check-slide" type="button">Check this real page <span aria-hidden="true">↗</span></button>
        <p class="input-truth"><strong>Why paste anything?</strong> Slide Check counts the words and blocks, times the reading load, measures this rendered 16:9 page, and finds existing break points. It does not understand your secret intention or grade the idea.</p>
      </div>
      <div class="preview-stage" id="preview-stage">${preview(state.draft.title, state.draft.copy)}<p>The preview is real. The judgment stays mechanical and inspectable.</p></div>
    </div>
  </section>`;
}

function expertSummary(): string {
  const entries: [string, string | undefined][] = [
    ["World", labelFor(LANES, state.expert.lane)], ["Document", labelFor(ARTEFACTS, state.expert.artefact)],
    ["Use", labelFor(MODES, state.expert.delivery)], ["Page job", labelFor(JOBS, state.expert.role)],
    ["Smallest view", labelFor(SETTINGS, state.expert.setting)], ["Audience", labelFor(FAMILIARITY, state.expert.familiarity)],
    ["Eyes and ears", labelFor(RELATIONS, state.expert.relation)], ["Layout", labelFor(LAYOUTS, state.expert.layout)],
    ["Time", labelFor(TIMES, state.expert.time)],
  ];
  return entries.filter(([, value]) => value).map(([key, value]) => `<span><small>${key}</small><strong>${escapeHTML(value ?? "")}</strong></span>`).join("") + `<span><small>Constraints</small><strong>${state.expert.constraints.map((value) => labelFor(CONSTRAINTS, value)).filter(Boolean).join(", ") || "None"}</strong></span>`;
}

function labelFor(choices: readonly Choice[], value?: string): string | undefined { return choices.find((choice) => choice.value === value)?.label; }

function preview(title: string, copy: string): string {
  return `<div class="slide-preview" aria-label="Real 16 by 9 slide preview"><span>16:9</span>${title ? `<h2>${escapeHTML(title)}</h2>` : ""}<p>${escapeHTML(copy || "Your slide, with room to breathe.")}</p><i aria-hidden="true"></i></div>`;
}

function copyLoadText(): string {
  const locale = navigator.language || document.documentElement.lang || "en-US";
  const metrics = analyseText({ title: state.draft.title || undefined, body: state.draft.copy }, locale);
  if (!metrics.visibleWordCount) return "Waiting for one real slide.";
  const reading = estimateReadingTime(metrics.timedWordCount, { tag: locale });
  const blocks = `${metrics.explicitBlockCount} ${metrics.explicitBlockCount === 1 ? "block" : "blocks"}`;
  return typeof reading.seconds === "number"
    ? `${metrics.visibleWordCount} words · ${blocks} · about ${Math.max(1, Math.round(reading.seconds))} sec to read`
    : `${metrics.visibleWordCount} words · ${blocks} · timing needs a local read`;
}

function resultPage(): string {
  const result = state.result!;
  const metrics = result.raw.metrics;
  const seconds = result.raw.readingTime.seconds;
  return `<section class="result-page slide-result-page">
    <div class="result-hero">
      <div class="result-art" data-tilt="1.2" aria-hidden="true"><img src="/assets/hero.webp" alt=""></div>
      <p class="scope-tag">The straight answer · ${state.ride === "expert" ? "expert context applied" : "quick physical check"}</p>
      <h1 data-page-heading tabindex="-1">${escapeHTML(result.headline)}</h1><p>${escapeHTML(result.body)}</p>
      <div class="result-actions"><button class="primary-action" id="edit-slide" type="button">Edit this slide <span aria-hidden="true">↗</span></button><button class="text-action" id="download-result" type="button">Download the verdict</button>${state.ride === "quick" ? '<button class="text-action" id="go-expert" type="button">Check with more context</button>' : ""}<button class="text-action" id="start-over" type="button">Start over</button></div>
    </div>
    <section class="result-workbench">
      <div>${preview(state.draft.title, state.draft.copy)}</div>
      <div class="verdict-card">
        <p class="kicker">The page in numbers</p>
        <dl class="metric-grid"><div><dt>Words</dt><dd>${metrics.visibleWordCount}</dd></div><div><dt>Blocks</dt><dd>${metrics.explicitBlockCount}</dd></div><div><dt>Reading</dt><dd>${typeof seconds === "number" ? `${Math.max(1, Math.round(seconds))} sec` : "Context needed"}</dd></div><div><dt>Physical fit</dt><dd>${humanFit(result.raw.checks.physicalFit)}</dd></div></dl>
        <p class="result-boundary">Measured: words, blocks, time, and rendered fit. Not measured: truth, taste, persuasion, or whether somebody will love it.</p>
      </div>
    </section>
    <section class="result-details">
      ${result.raw.splitPlans.length ? `<details open><summary>Possible break points</summary><p>These are existing paragraph, bullet-group, or sentence boundaries—not automatic rewrites.</p><ol>${result.raw.splitPlans.slice(0, 3).map((plan) => `<li><strong>${plan.slideCount} slides</strong> · ${plan.boundaryIndices.length} ${plan.boundaryIndices.length === 1 ? "reviewable break" : "reviewable breaks"}</li>`).join("")}</ol></details>` : ""}
      ${result.context.length ? `<details open><summary>What your expert answers changed</summary><ul>${result.context.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul></details>` : ""}
      ${result.craft.length ? `<details><summary>The transparent craft check</summary><div class="craft-grid">${result.craft.map((item) => `<article class="craft-card craft-card--${item.state}"><span>${item.state === "good" ? "Good" : item.state === "watch" ? "Look again" : "Unknown"}</span><h3>${escapeHTML(item.label)}</h3><p>${escapeHTML(item.detail)}</p></article>`).join("")}</div></details>` : ""}
      <details><summary>Assumptions and limits</summary><ul>${result.raw.limitations.map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul></details>
    </section>
  </section>`;
}

function humanFit(value: string): string {
  return value === "pass" ? "Comfortable" : value === "tight" ? "Tight" : value === "fail" ? "Overflowing" : "Not measured";
}

function setExpert(key: keyof ExpertAnswers, value: string): void {
  if (key === "lane") state.expert.lane = value as ExpertAnswers["lane"];
  else if (key === "artefact") state.expert.artefact = value as ExpertAnswers["artefact"];
  else if (key === "delivery") state.expert.delivery = value as ExpertAnswers["delivery"];
  else if (key === "role") state.expert.role = value as ExpertAnswers["role"];
  else if (key === "setting") state.expert.setting = value as ExpertAnswers["setting"];
  else if (key === "familiarity") state.expert.familiarity = value as ExpertAnswers["familiarity"];
  else if (key === "relation") state.expert.relation = value as ExpertAnswers["relation"];
  else if (key === "layout") state.expert.layout = value as ExpertAnswers["layout"];
  else if (key === "time") state.expert.time = value as ExpertAnswers["time"];
}

function bindEvents(): void {
  document.querySelector(".brand")?.addEventListener("click", (event) => {
    event.preventDefault(); state.phase = "landing"; state.ride = undefined; state.result = undefined; save(); render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-ride]").forEach((button) => button.addEventListener("click", () => {
    state.ride = button.dataset.ride as Ride;
    state.phase = state.ride === "expert" ? "flow" : "editor";
    state.step = 0;
    state.result = undefined;
    if (state.ride === "expert") state.expert = { constraints: [] };
    save(); render();
  }));
  document.querySelector("#flow-back")?.addEventListener("click", () => {
    if (state.step === 0) { state.phase = "landing"; state.ride = undefined; }
    else state.step -= 1;
    save(); render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-flow-choice]").forEach((button) => button.addEventListener("click", () => {
    const step = STEPS[state.step]!;
    setExpert(step.key, button.dataset.flowChoice ?? "");
    if (state.step >= STEPS.length - 1) state.phase = "editor"; else state.step += 1;
    save(); render();
  }));
  document.querySelectorAll<HTMLButtonElement>("[data-multi-choice]").forEach((button) => button.addEventListener("click", () => {
    const value = button.dataset.multiChoice ?? "";
    const selected = new Set(state.expert.constraints);
    if (value === "none") { selected.clear(); if (button.getAttribute("aria-pressed") !== "true") selected.add("none"); }
    else { selected.delete("none"); if (selected.has(value)) selected.delete(value); else selected.add(value); }
    state.expert.constraints = [...selected]; save(); render("keep");
  }));
  document.querySelector("#multi-continue")?.addEventListener("click", () => {
    if (!state.expert.constraints.length) state.expert.constraints = ["none"];
    state.phase = "editor"; save(); render();
  });
  document.querySelector("#editor-back")?.addEventListener("click", () => {
    state.phase = state.ride === "expert" ? "flow" : "landing";
    if (state.ride === "expert") state.step = STEPS.length - 1;
    else state.ride = undefined;
    save(); render();
  });
  document.querySelectorAll<HTMLButtonElement>("[data-quick-mode]").forEach((button) => button.addEventListener("click", () => {
    state.draft.quickMode = button.dataset.quickMode as AppState["draft"]["quickMode"];
    save(); render("keep");
  }));
  const titleInput = document.querySelector<HTMLInputElement>("#slide-title");
  const copyInput = document.querySelector<HTMLTextAreaElement>("#slide-copy");
  titleInput?.addEventListener("input", () => { state.draft.title = titleInput.value; state.result = undefined; save(); updatePreview(); updateCopyLoad(); });
  copyInput?.addEventListener("input", () => { state.draft.copy = copyInput.value; state.result = undefined; save(); copyInput.removeAttribute("aria-invalid"); document.querySelector("#copy-error")?.remove(); document.querySelector("#measurement-error")?.remove(); updatePreview(); updateCopyLoad(); });
  copyInput?.addEventListener("keydown", (event) => { if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void checkSlide(); } });
  document.querySelector("#check-slide")?.addEventListener("click", () => void checkSlide());
  document.querySelector("#edit-slide")?.addEventListener("click", () => { state.phase = "editor"; state.result = undefined; save(); render(); });
  document.querySelector("#go-expert")?.addEventListener("click", () => { state.ride = "expert"; state.phase = "flow"; state.step = 0; state.result = undefined; state.expert = { constraints: [] }; save(); render(); });
  document.querySelector("#start-over")?.addEventListener("click", () => { Object.assign(state, structuredClone(fallback)); clearSession(SESSION_KEY); render(); });
  document.querySelector("#download-result")?.addEventListener("click", () => { downloadText("slide-check-verdict.md", resultMarkdown()); announce("Verdict downloaded."); });
}

function updatePreview(): void {
  const host = document.querySelector<HTMLElement>("#preview-stage");
  if (!host) return;
  const title = host.querySelector<HTMLElement>(".slide-preview h2");
  const copy = host.querySelector<HTMLElement>(".slide-preview p");
  if (state.draft.title) {
    if (title) title.textContent = state.draft.title;
    else host.querySelector(".slide-preview span")?.insertAdjacentHTML("afterend", `<h2>${escapeHTML(state.draft.title)}</h2>`);
  } else title?.remove();
  if (copy) copy.textContent = state.draft.copy.trim() || "Your slide, with room to breathe.";
}

function updateCopyLoad(): void {
  const output = document.querySelector<HTMLElement>("#live-load");
  if (output) output.textContent = copyLoadText();
}

async function checkSlide(): Promise<void> {
  const copyInput = document.querySelector<HTMLTextAreaElement>("#slide-copy");
  const copy = copyInput?.value.trim() ?? state.draft.copy.trim();
  document.querySelector("#copy-error")?.remove();
  document.querySelector("#measurement-error")?.remove();
  if (!copy) {
    copyInput?.setAttribute("aria-invalid", "true");
    const error = document.createElement("p");
    error.id = "copy-error"; error.className = "input-error"; error.setAttribute("role", "alert"); error.textContent = "Paste the visible slide copy first.";
    copyInput?.insertAdjacentElement("afterend", error); copyInput?.focus(); announce(error.textContent); return;
  }
  state.draft.copy = copy;
  state.draft.title = document.querySelector<HTMLInputElement>("#slide-title")?.value.trim() ?? state.draft.title.trim();
  const button = document.querySelector<HTMLButtonElement>("#check-slide");
  if (button) { button.disabled = true; button.setAttribute("aria-busy", "true"); button.textContent = "Measuring the real page…"; }
  try {
    const measurement = await measureSlide(state.draft.title, state.draft.copy);
    state.result = buildResult(state, measurement);
    state.phase = "result";
    save(); render(); announce(state.result.headline);
  } catch {
    if (button) {
      button.disabled = false; button.removeAttribute("aria-busy"); button.innerHTML = 'Try the check again <span aria-hidden="true">↗</span>';
      const error = document.createElement("p"); error.id = "measurement-error"; error.className = "input-error"; error.setAttribute("role", "alert"); error.textContent = "The preview missed its cue. Your copy is safe—try once more.";
      button.insertAdjacentElement("afterend", error);
    }
    announce("The preview missed its cue. Your copy is safe—try once more.");
  }
}

function resultMarkdown(): string {
  const result = state.result;
  if (!result) return "# Slide Check\n\nNo result yet.\n";
  const context = result.context.length ? `\n\n## What the expert context changed\n\n${result.context.map((item) => `- ${item}`).join("\n")}` : "";
  const craft = result.craft.length ? `\n\n## Transparent craft check\n\n${result.craft.map((item) => `- **${item.label}:** ${item.detail}`).join("\n")}` : "";
  const checkedSlide = `## Checked slide\n\n${state.draft.title ? `**Title:** ${state.draft.title}\n\n` : ""}${state.draft.copy}`;
  return `# ${result.headline}\n\n${result.body}\n\n${checkedSlide}\n\n## The page in numbers\n\n- Words: ${result.raw.metrics.visibleWordCount}\n- Text blocks: ${result.raw.metrics.explicitBlockCount}\n- Reading: ${typeof result.raw.readingTime.seconds === "number" ? `${Math.max(1, Math.round(result.raw.readingTime.seconds))} seconds` : "Context needed"}\n- Physical fit: ${humanFit(result.raw.checks.physicalFit)}${context}${craft}\n\n## Assumptions and limits\n\n${result.raw.limitations.map((item) => `- ${item}`).join("\n")}\n\n## What the tool did not judge\n\nTruth, taste, originality, persuasion, and whether the idea has soul.\n\nGenerated locally by Slide Check from pitch.dog.\n`;
}

initialiseThreadCursor();
render();
