type FormatType = 'max_reps' | 'timed_reps' | 'weight_based' | 'max_time_hold'

interface RecordFields {
  value_reps?: number | null
  value_weight_kg?: number | null
  value_time_seconds?: number | null
  added_weight_kg?: number | null
}

export function formatTimeDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return s === 0 ? `${m}m` : `${m}m ${s}s`
}

export function formatTimeHold(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatRecordValue(record: RecordFields, formatType: FormatType): string {
  // Weighted bodyweight variation — added_weight_kg takes precedence
  if (record.added_weight_kg != null) {
    const reps = record.value_reps ?? 0
    return `+${record.added_weight_kg}kg × ${reps} reps`
  }

  switch (formatType) {
    case 'max_reps':
      return `${record.value_reps ?? 0} reps`

    case 'timed_reps':
      return `${record.value_reps ?? 0} reps`

    case 'weight_based': {
      const kg = record.value_weight_kg ?? 0
      const reps = record.value_reps ?? 0
      return `${kg}kg × ${reps} reps`
    }

    case 'max_time_hold':
      return formatTimeHold(record.value_time_seconds ?? 0)

    default:
      return '—'
  }
}
