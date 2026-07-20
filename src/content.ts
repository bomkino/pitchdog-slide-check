import type { Choice } from "./ui.ts";

export const LANES = [
  { value: "film_tv", label: "Film or TV", detail: "Pitch deck, lookbook, bible, treatment, or project presentation." },
  { value: "advertising", label: "Advertising", detail: "Director’s treatment, agency pitch, campaign, or credentials deck." },
  { value: "business", label: "Startup or business", detail: "Fundraising, sales, partnership, strategy, or company deck." },
  { value: "education_civic", label: "Education or public work", detail: "Lecture, training, report, conference, or civic presentation." },
  { value: "personal_other", label: "Something else", detail: "The same physical page check still works." },
] as const satisfies readonly Choice[];

export const ARTEFACTS = [
  { value: "film_tv_pitch", label: "Creative pitch", detail: "A story, series, film, campaign, or creative proposition." },
  { value: "fundraising_deck", label: "Fundraising deck", detail: "A company, opportunity, evidence, and a specific ask." },
  { value: "sales_deck", label: "Sales or partnership deck", detail: "A buyer, partner, or client deciding what happens next." },
  { value: "strategy_or_decision_deck", label: "Strategy or decision deck", detail: "A group needs to understand, compare, approve, or align." },
  { value: "training_or_lecture", label: "Teaching or talk", detail: "People must learn, remember, or follow an argument." },
  { value: "report_or_leave_behind", label: "Report or leave-behind", detail: "The page will be read without a presenter." },
  { value: "other", label: "Other", detail: "No invented certainty. We’ll use the broad page mechanics." },
] as const satisfies readonly Choice[];

export const MODES = [
  { value: "speaker_led", label: "Presented live", detail: "People listen and glance. The slide supports a voice." },
  { value: "self_read", label: "Sent to read", detail: "The page carries its own context." },
  { value: "dual_use", label: "Used both ways", detail: "Live and read-alone needs may pull in different directions." },
  { value: "reference", label: "Reference page", detail: "People control the pace and may inspect detail." },
] as const satisfies readonly Choice[];

export const JOBS = [
  { value: "statement", label: "Make one point", detail: "A premise, claim, theme, or north-star thought." },
  { value: "overview", label: "Orient the reader", detail: "What this is and how to understand it." },
  { value: "story", label: "Tell part of a story", detail: "A synopsis, case, arc, or narrative beat." },
  { value: "evidence", label: "Show evidence", detail: "Proof, data, examples, or a source-backed claim." },
  { value: "comparison", label: "Help people compare", detail: "Options, trade-offs, before-and-after, or a useful relationship." },
  { value: "process", label: "Explain a process", detail: "A sequence, system, plan, or way of working." },
  { value: "gallery", label: "Create a visual beat", detail: "A pause, reveal, gallery, or image-led moment." },
  { value: "ask", label: "Make the ask", detail: "The decision or action this page should create." },
] as const satisfies readonly Choice[];

export const SETTINGS = [
  { value: "large_room", label: "Across a room", detail: "People glance while somebody speaks." },
  { value: "small_room", label: "Around a table", detail: "The page is visible, but conversation still competes." },
  { value: "video_call", label: "On a video call", detail: "The slide shares a smaller, more fragile screen." },
  { value: "laptop", label: "On a laptop", detail: "A realistic read-alone pitch setting." },
  { value: "phone", label: "On a phone", detail: "The smallest common accidental viewing condition." },
  { value: "print", label: "Printed or exported", detail: "People control pace and may inspect more detail." },
  { value: "mixed_unknown", label: "A mix—or I don’t know", detail: "We’ll use the more cautious condition." },
] as const satisfies readonly Choice[];

export const FAMILIARITY = [
  { value: "new", label: "New to the idea", detail: "The page must orient before it can compress." },
  { value: "mixed", label: "A mixed room", detail: "Some context can be shared; some cannot." },
  { value: "expert", label: "Already close to it", detail: "Specialist shorthand may be genuinely useful." },
] as const satisfies readonly Choice[];

export const RELATIONS = [
  { value: "supports_speech", label: "The slide supports what I say", detail: "The page and voice share a job without duplicating every word." },
  { value: "same_words", label: "I say what the slide says", detail: "People may be forced to read and listen to the same copy." },
  { value: "different_words", label: "I say something different", detail: "Two channels may compete for attention." },
  { value: "no_speaker", label: "There is no speaker", detail: "The page must survive alone." },
] as const satisfies readonly Choice[];

export const LAYOUTS = [
  { value: "statement", label: "One statement", detail: "A dominant line with little or no supporting copy." },
  { value: "title_body", label: "Title and body", detail: "One heading, then one main copy block." },
  { value: "two_column", label: "Two columns", detail: "Two related groups or a deliberate comparison." },
  { value: "cards", label: "Cards or tiles", detail: "Several discrete items with equal or ranked weight." },
  { value: "data_chart", label: "Chart or data", detail: "The graphic carries meaning and labels support it." },
  { value: "timeline", label: "Timeline or sequence", detail: "Order and progression are visible." },
  { value: "image_caption", label: "Image with caption", detail: "The visual leads; copy frames what to notice." },
  { value: "custom", label: "Something custom", detail: "We’ll measure the supplied page without pretending to know the layout." },
] as const satisfies readonly Choice[];

export const TIMES = [
  { value: "controlled", label: "They control the time", detail: "A read-alone or reference page." },
  { value: "5", label: "About 5 seconds", detail: "One sharp beat. Very little reading." },
  { value: "10", label: "About 10 seconds", detail: "A headline plus a small amount of support." },
  { value: "20", label: "About 20 seconds", detail: "Enough for a deliberate read if speech is not competing." },
  { value: "30", label: "30 seconds or more", detail: "People can inspect, but hierarchy still matters." },
] as const satisfies readonly Choice[];

export const CONSTRAINTS = [
  { value: "none", label: "Nothing special", detail: "The copy can be edited, moved, or split if the page asks for it." },
  { value: "exact", label: "The wording must stay exact", detail: "Legal, quoted, approved, or otherwise fixed text." },
  { value: "cannot-split", label: "This page cannot split", detail: "The information must remain together for a real reason." },
  { value: "citation", label: "A citation is required", detail: "The source must exist before the page can be called complete." },
  { value: "source-read", label: "People must read the source", detail: "The source line is part of the visible reading load." },
] as const satisfies readonly Choice[];
