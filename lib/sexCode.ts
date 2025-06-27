export const SEX_CODES = {
  NOT_KNOWN: 0,
  MALE: 1,
  FEMALE: 2,
  NOT_APPLICABLE: 9,
} as const;

export const SEX_LABELS = {
  [SEX_CODES.NOT_KNOWN]: "回答しない",
  [SEX_CODES.MALE]: "男性",
  [SEX_CODES.FEMALE]: "女性",
  [SEX_CODES.NOT_APPLICABLE]: "その他",
} as const;

export const SEX_OPTIONS = [
  { value: SEX_CODES.MALE, label: SEX_LABELS[SEX_CODES.MALE] },
  { value: SEX_CODES.FEMALE, label: SEX_LABELS[SEX_CODES.FEMALE] },
  { value: SEX_CODES.NOT_KNOWN, label: SEX_LABELS[SEX_CODES.NOT_KNOWN] },
  {
    value: SEX_CODES.NOT_APPLICABLE,
    label: SEX_LABELS[SEX_CODES.NOT_APPLICABLE],
  },
] as const;

export type SexCode = (typeof SEX_CODES)[keyof typeof SEX_CODES];
