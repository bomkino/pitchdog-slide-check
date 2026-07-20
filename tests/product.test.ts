import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { assessSlide } from "../engine/one-slide-or-three/index.ts";
import { ARTEFACTS, CONSTRAINTS, FAMILIARITY, JOBS, LANES, LAYOUTS, MODES, RELATIONS, SETTINGS, TIMES } from "../src/content.ts";

test("expert mode contains substantial structured context without prose strategy boxes", () => {
  const groups = [LANES, ARTEFACTS, MODES, JOBS, SETTINGS, FAMILIARITY, RELATIONS, LAYOUTS, TIMES, CONSTRAINTS];
  assert.equal(groups.length, 10);
  assert.ok(groups.flat().length >= 55);
  for (const choice of groups.flat()) {
    assert.ok(choice.value.trim());
    assert.ok(choice.label.trim());
    assert.ok(choice.detail.trim());
  }
});

test("the deterministic engine can keep a small page and split an overloaded page", () => {
  const base = {
    clientLane: "business" as const,
    artefact: "strategy_or_decision_deck" as const,
    purpose: "secure_decision" as const,
    delivery: "self_read" as const,
    role: "statement" as const,
    layout: "title_body" as const,
    audience: { setting: "laptop" as const, tasks: ["read" as const], familiarity: "new" as const },
    language: { tag: "en-US" },
    relation: "no_speaker" as const,
  };
  const small = assessSlide({ ...base, content: { title: "The point", body: "One idea, stated plainly." }, preview: { fit: "fits", typePressure: "comfortable" } });
  assert.ok(["keep_one", "keep_one_tight"].includes(small.recommendation));
  const overloaded = assessSlide({ ...base, content: { title: "Everything", body: Array.from({ length: 16 }, (_, index) => `Paragraph ${index + 1} carries another long explanation and a separate decision people must remember.`).join("\n\n") }, preview: { fit: "overflows", typePressure: "below_selected_minimum" } });
  assert.ok(["split_two", "split_three", "edit_before_splitting", "move_detail_outside_slide"].includes(overloaded.recommendation));
});

test("the visible product has zero grain and an explicit scroll landing contract", () => {
  const visible = ["src/main.ts", "src/styles.css", "src/base.css", "index.html"].map((path) => readFileSync(path, "utf8")).join("\n");
  assert.doesNotMatch(visible, /grain-canvas|initialiseGrain|film-grain|scanline/i);
  const ui = readFileSync("src/ui.ts", "utf8");
  assert.match(ui, /history\.scrollRestoration = "manual"/);
  assert.match(ui, /requestAnimationFrame\(\(\) => \{[\s\S]*requestAnimationFrame/);
  assert.match(ui, /focus\(\{ preventScroll: true \}\)/);
});

test("the interface explains why copy is required", () => {
  const source = readFileSync("src/main.ts", "utf8");
  assert.match(source, /Why paste anything\?/);
  assert.match(source, /counts the words and blocks/i);
  assert.doesNotMatch(source, /Keep this answer|Clear this case|Are you in danger|shared device/i);
});

test("the editor shows live measurable load and fails visibly without duplicate errors", () => {
  const source = readFileSync("src/main.ts", "utf8");
  assert.match(source, /Current measurable slide load/);
  assert.match(source, /analyseText/);
  assert.match(source, /event\.metaKey \|\| event\.ctrlKey/);
  assert.match(source, /document\.querySelector\("#copy-error"\)\?\.remove\(\);[\s\S]*if \(!copy\)/);
  assert.match(source, /measurement-error/);
});

test("theme labels and the product home route remain truthful after state changes", () => {
  const ui = readFileSync("src/ui.ts", "utf8");
  const source = readFileSync("src/main.ts", "utf8");
  assert.match(ui, /setAttribute\("aria-label"/);
  assert.match(ui, /Switch to/);
  assert.match(source, /querySelector\("\.brand"\)[\s\S]*state\.phase = "landing"/);
});
