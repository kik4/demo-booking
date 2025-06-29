export const ROLE_CODES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export const ROLE_LABELS = {
  [ROLE_CODES.USER]: "一般ユーザー",
  [ROLE_CODES.ADMIN]: "管理者",
} as const;

export const ROLE_OPTIONS = [
  { value: ROLE_CODES.USER, label: ROLE_LABELS[ROLE_CODES.USER] },
  { value: ROLE_CODES.ADMIN, label: ROLE_LABELS[ROLE_CODES.ADMIN] },
] as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
