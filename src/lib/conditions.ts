export const CONDITIONS = [
  { code: "NEW", label: "New / Sealed" },
  { code: "LN", label: "Like New" },
  { code: "VG_CM", label: "VG — Complete (w/ Manual)" },
  { code: "VG_NM", label: "VG — No Manual" },
  { code: "G", label: "Good" },
  { code: "WU", label: "Well Used" },
  { code: "DO", label: "Disc / Cart Only" },
  { code: "CIB", label: "CIB (Case + Manual)" },
  { code: "BOX", label: "Box Only" },
  { code: "MAN", label: "Manual Only" },
] as const;

export type ConditionCode = (typeof CONDITIONS)[number]["code"];

export function conditionLabel(code: string) {
  return CONDITIONS.find((c) => c.code === code)?.label ?? code;
}

export const PLATFORMS = [
  "PS5",
  "PS4",
  "PS3",
  "PS2",
  "PS1",
  "Xbox Series",
  "Xbox One",
  "Xbox 360",
  "Xbox",
  "Switch",
  "Wii U",
  "Wii",
  "GameCube",
  "N64",
  "SNES",
  "NES",
  "GBA",
  "DS",
  "3DS",
  "PC",
  "Other",
] as const;
export type Platform = (typeof PLATFORMS)[number];
