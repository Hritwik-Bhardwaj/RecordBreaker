import { supabase } from '../db'

export interface LeaderboardKey {
  variationId: string
  gender: string
  ageBracket: string
  weightClass: string
  country: string | null
}

interface RawRecord {
  id: string
  user_id: string
  value_reps: number | null
  value_weight_kg: number | null
  value_time_seconds: number | null
  added_weight_kg: number | null
  approved_at: string
}

interface VariationMeta {
  format_type: 'max_reps' | 'timed_reps' | 'weight_based' | 'max_time_hold'
}

function sortRecords(records: RawRecord[], formatType: string): RawRecord[] {
  return [...records].sort((a, b) => {
    // Weighted bodyweight: added_weight_kg present takes priority over format_type
    if (a.added_weight_kg != null || b.added_weight_kg != null) {
      const wA = a.added_weight_kg ?? 0
      const wB = b.added_weight_kg ?? 0
      if (wB !== wA) return wB - wA
      const rA = a.value_reps ?? 0
      const rB = b.value_reps ?? 0
      if (rB !== rA) return rB - rA
      return new Date(a.approved_at).getTime() - new Date(b.approved_at).getTime()
    }

    if (formatType === 'weight_based') {
      const wA = a.value_weight_kg ?? 0
      const wB = b.value_weight_kg ?? 0
      if (wB !== wA) return wB - wA
      const rA = a.value_reps ?? 0
      const rB = b.value_reps ?? 0
      if (rB !== rA) return rB - rA
      return new Date(a.approved_at).getTime() - new Date(b.approved_at).getTime()
    }

    if (formatType === 'max_time_hold') {
      const tA = a.value_time_seconds ?? 0
      const tB = b.value_time_seconds ?? 0
      if (tB !== tA) return tB - tA
      return new Date(a.approved_at).getTime() - new Date(b.approved_at).getTime()
    }

    // max_reps and timed_reps
    const rA = a.value_reps ?? 0
    const rB = b.value_reps ?? 0
    if (rB !== rA) return rB - rA
    return new Date(a.approved_at).getTime() - new Date(b.approved_at).getTime()
  })
}

export async function refreshLeaderboardRanks(params: LeaderboardKey): Promise<void> {
  const { variationId, gender, ageBracket, weightClass, country } = params

  // Fetch variation format type
  const { data: variation, error: varError } = await supabase
    .from('exercise_variations')
    .select('format_type')
    .eq('id', variationId)
    .single<VariationMeta>()

  if (varError || !variation) {
    throw new Error(`Variation ${variationId} not found: ${varError?.message}`)
  }

  // Build record query — country null = global (match all countries)
  let query = supabase
    .from('records')
    .select('id, user_id, value_reps, value_weight_kg, value_time_seconds, added_weight_kg, approved_at')
    .eq('variation_id', variationId)
    .eq('gender', gender)
    .eq('age_bracket', ageBracket)
    .eq('weight_class', weightClass)
    .eq('status', 'approved')

  if (country !== null) {
    query = query.eq('country', country)
  }

  const { data: records, error: recError } = await query
  if (recError) throw new Error(`Failed to fetch records: ${recError.message}`)

  const sorted = sortRecords((records as RawRecord[]) ?? [], variation.format_type)
  const top200 = sorted.slice(0, 200)

  const rankRows = top200.map((record, index) => ({
    variation_id: variationId,
    gender,
    age_bracket: ageBracket,
    weight_class: weightClass,
    country: country ?? null,
    rank: index + 1,
    record_id: record.id,
    user_id: record.user_id,
    updated_at: new Date().toISOString(),
  }))

  // Delete existing ranks for this exact combination
  let deleteQuery = supabase
    .from('leaderboard_ranks')
    .delete()
    .eq('variation_id', variationId)
    .eq('gender', gender)
    .eq('age_bracket', ageBracket)
    .eq('weight_class', weightClass)

  if (country !== null) {
    deleteQuery = deleteQuery.eq('country', country)
  } else {
    deleteQuery = deleteQuery.is('country', null)
  }

  const { error: deleteError } = await deleteQuery
  if (deleteError) throw new Error(`Failed to delete old ranks: ${deleteError.message}`)

  if (rankRows.length > 0) {
    const { error: insertError } = await supabase.from('leaderboard_ranks').insert(rankRows)
    if (insertError) throw new Error(`Failed to insert new ranks: ${insertError.message}`)
  }
}

export async function refreshBothLeaderboards(params: LeaderboardKey): Promise<void> {
  await Promise.all([
    refreshLeaderboardRanks({ ...params, country: params.country }),
    refreshLeaderboardRanks({ ...params, country: null }),
  ])
}
