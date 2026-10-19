/**
 * A tone is a semantic color used by badges and filter chips.
 * Class strings are spelled out in full so Tailwind can detect them.
 */
export type Tone = 'primary' | 'success' | 'danger' | 'info' | 'warning' | 'neutral'

export const TONE_TEXT: Record<Tone, string> = {
  primary: 'text-primary-strong',
  success: 'text-success',
  danger: 'text-danger',
  info: 'text-info',
  warning: 'text-warning',
  neutral: 'text-muted-foreground',
}

/** Status badge: light tint with a subtle border. */
export const TONE_BADGE: Record<Tone, string> = {
  primary: 'text-primary-strong bg-primary/10 border-primary/30',
  success: 'text-success bg-success/10 border-success/25',
  danger: 'text-danger bg-danger/10 border-danger/25',
  info: 'text-info bg-info/10 border-info/25',
  warning: 'text-warning bg-warning/10 border-warning/25',
  neutral: 'text-muted-foreground bg-muted border-border',
}

/** Active filter chip. */
export const TONE_CHIP_ACTIVE: Record<Tone, string> = {
  primary: 'text-primary-strong bg-primary/10 border-primary/40',
  success: 'text-success bg-success/10 border-success/35',
  danger: 'text-danger bg-danger/10 border-danger/35',
  info: 'text-info bg-info/10 border-info/35',
  warning: 'text-warning bg-warning/10 border-warning/35',
  neutral: 'text-foreground bg-muted border-border',
}
