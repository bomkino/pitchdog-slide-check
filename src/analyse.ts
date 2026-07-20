import { assessSlide, type SlideAssessmentInput, type PreviewMeasurement } from "../engine/one-slide-or-three/index.ts";
import type { AppState, CraftObservation, SlideResult } from "./types.ts";

const RECOMMENDATIONS = {
  confirm_visual_only: ["Keep it visual—on purpose.", "There is almost no readable copy here. Make sure that is the job, not missing context."],
  add_required_source: ["Add the source before judging the slide.", "The required source is part of the page. Put it in before the rest of the check gets a vote."],
  keep_one: ["Keep it on one slide.", "The page has room to breathe in this use. Do not punish the empty space."],
  keep_one_tight: ["Keep it on one slide.", "It fits, but the hierarchy and time now matter. Tight is not the same as broken."],
  split_two: ["Make it two slides.", "Two readable beats are fighting for the same page. Give each one a clean job."],
  split_three: ["Make it three slides.", "The copy already contains three reviewable beats. Let sequence do the work."],
  edit_before_splitting: ["Edit before you split.", "The page is carrying too much, but the honest boundary is not clear yet."],
  make_separate_live_and_read_versions: ["Make a live version and a read-alone version.", "One file is being asked to whisper and explain at the same time."],
  move_detail_outside_slide: ["Move the detail outside the slide.", "The wording may matter. This page is still the wrong home for all of it."],
  rework_delivery_or_copy: ["Let people read or listen—not wrestle with both.", "The spoken and visible channels are competing."],
  reference_density_allowed: ["The density is doing a real job.", "This is a reference page people control. It may carry more detail than a live slide."],
  cannot_call_yet: ["One more fact before we call it.", "The copy is measured, but its real use still changes the answer."],
} as const;

export function buildResult(state: AppState, preview: PreviewMeasurement): SlideResult {
  const expert = state.ride === "expert";
  const answers = state.expert;
  const delivery = expert ? answers.delivery ?? "self_read" : state.draft.quickMode;
  const role = expert ? answers.role ?? "statement" : "statement";
  const exposure = expert && answers.time !== "controlled" && answers.time ? Number(answers.time) : undefined;
  const input: SlideAssessmentInput = {
    clientLane: expert ? answers.lane : "personal_other",
    artefact: expert ? answers.artefact : "other",
    purpose: role === "evidence" ? "inform" : role === "process" ? "explain" : role === "gallery" ? "inspire" : "secure_decision",
    delivery,
    role,
    layout: expert ? answers.layout ?? "title_body" : "title_body",
    audience: {
      setting: expert ? answers.setting : "laptop",
      familiarity: expert ? answers.familiarity : "new",
      tasks: role === "comparison" ? ["compare", "decide"] : role === "evidence" ? ["inspect", "remember"] : role === "ask" ? ["glance", "decide"] : ["glance", "remember"],
    },
    language: { tag: document.documentElement.lang || navigator.language || "en-US" },
    relation: expert ? answers.relation ?? (delivery === "self_read" ? "no_speaker" : "supports_speech") : delivery === "self_read" ? "no_speaker" : "supports_speech",
    content: { title: state.draft.title || undefined, body: state.draft.copy },
    timing: exposure ? { exposureSeconds: exposure } : undefined,
    preview,
    constraints: expert ? {
      exactTextRequired: answers.constraints.includes("exact"),
      cannotSplit: answers.constraints.includes("cannot-split"),
      citationRequired: answers.constraints.includes("citation"),
      sourceMustBeRead: answers.constraints.includes("source-read"),
    } : undefined,
  };
  const raw = assessSlide(input);
  const [headline, body] = RECOMMENDATIONS[raw.recommendation];
  return {
    raw,
    headline,
    body,
    craft: expert ? craftCheck(state) : [],
    context: expert ? contextNotes(state) : [],
  };
}

function craftCheck(state: AppState): CraftObservation[] {
  const body = state.draft.copy.trim();
  const blocks = body.split(/\n\s*\n|\n(?=[•*\-–—])/u).filter((part) => part.trim());
  const sentences = body.split(/(?<=[.!?])\s+/u).filter(Boolean);
  const title = state.draft.title.trim().toLocaleLowerCase("en");
  const lower = body.toLocaleLowerCase("en");
  const role = state.expert.role;
  const observations: CraftObservation[] = [
    {
      state: blocks.length <= 3 ? "good" : "watch",
      label: blocks.length <= 3 ? "The hierarchy has a chance" : "Too many equal-looking blocks",
      detail: `${blocks.length} visible ${blocks.length === 1 ? "block" : "blocks"}. We count structure; we do not grade the writing.`,
    },
    {
      state: sentences.some((sentence) => sentence.split(/\s+/u).length > 32) ? "watch" : "good",
      label: sentences.some((sentence) => sentence.split(/\s+/u).length > 32) ? "One sentence may be doing two jobs" : "No sentence is mechanically overloaded",
      detail: "A 32-word sentence is a review cue, not a law passed by the Ministry of Slides.",
    },
  ];
  if (title) observations.push({
    state: lower.startsWith(title) ? "watch" : "good",
    label: lower.startsWith(title) ? "The body repeats the title" : "Title and body are not mechanically duplicated",
    detail: lower.startsWith(title) ? "If repetition is not the beat, spend those words elsewhere." : "A person still needs to judge whether they say the same thing differently.",
  });
  if (role === "ask") observations.push({
    state: /\b(choose|approve|read|reply|meet|fund|join|decide|send|book|start|support)\b/iu.test(body) ? "good" : "watch",
    label: /\b(choose|approve|read|reply|meet|fund|join|decide|send|book|start|support)\b/iu.test(body) ? "The ask contains a visible action" : "The ask may be missing an action",
    detail: "This is a verb check, not a persuasion score.",
  });
  if (role === "evidence") observations.push({
    state: /\b(source|according|survey|study|report|data|20\d{2})\b|%/iu.test(body) ? "good" : "watch",
    label: /\b(source|according|survey|study|report|data|20\d{2})\b|%/iu.test(body) ? "A source cue is visible" : "Evidence without a visible source cue",
    detail: "The cue may still be wrong. Slide Check cannot verify the claim.",
  });
  return observations;
}

function contextNotes(state: AppState): string[] {
  const notes: string[] = [];
  if (state.expert.delivery === "dual_use") notes.push("A live slide and a leave-behind have different jobs. Make two versions if the compromise becomes visible.");
  if (state.expert.familiarity === "new") notes.push("This is a new audience. Orientation must survive before specialist shorthand earns space.");
  if (state.expert.setting === "phone") notes.push("You chose the smallest common viewing condition. Comfortable laptop copy can still fail here.");
  if (state.expert.relation === "same_words") notes.push("Reading the slide aloud creates competition, even when both channels contain the same words.");
  if (state.expert.relation === "different_words") notes.push("Different spoken and visible copy asks people to choose which channel to abandon.");
  if (state.expert.constraints.includes("exact")) notes.push("The wording is fixed. Move, resize, sequence, or change delivery before pretending an edit is available.");
  if (state.expert.constraints.includes("cannot-split")) notes.push("You marked the page indivisible. If it fails, the honest moves are editing, hierarchy, time, or a different format.");
  return notes;
}
