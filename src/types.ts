import type { ArtefactKind, AudienceSetting, ClientLane, DeliveryMode, LayoutKind, SlideAssessment, SlideRole, SpeechTextRelation } from "../engine/one-slide-or-three/index.ts";

export type Ride = "quick" | "expert";
export type Phase = "landing" | "flow" | "editor" | "result";

export interface ExpertAnswers {
  lane?: ClientLane;
  artefact?: ArtefactKind;
  delivery?: DeliveryMode;
  role?: SlideRole;
  setting?: AudienceSetting;
  familiarity?: "new" | "mixed" | "expert";
  relation?: SpeechTextRelation;
  layout?: LayoutKind;
  time?: "controlled" | "5" | "10" | "20" | "30";
  constraints: string[];
}

export interface SlideDraft {
  title: string;
  copy: string;
  quickMode: "speaker_led" | "self_read" | "dual_use";
}

export interface CraftObservation {
  state: "good" | "watch" | "unknown";
  label: string;
  detail: string;
}

export interface SlideResult {
  raw: SlideAssessment;
  headline: string;
  body: string;
  craft: CraftObservation[];
  context: string[];
}

export interface AppState {
  phase: Phase;
  ride?: Ride;
  step: number;
  expert: ExpertAnswers;
  draft: SlideDraft;
  result?: SlideResult;
}
