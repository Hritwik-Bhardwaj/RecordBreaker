import { FastifyInstance, FastifyRequest } from 'fastify'
import { supabase } from '../db'

const VALID_GENDERS = ['men', 'women']
const VALID_AGE_BRACKETS = ['junior', 'main', 'senior', 'senior_i', 'senior_ii', 'senior_iii']
const VALID_WEIGHT_CLASSES = ['lightweight', 'middleweight', 'light_heavyweight', 'heavyweight']

export default async function leaderboardRoutes(app: FastifyInstance) {

  // GET /leaderboards/exercises — all enabled exercises grouped by category
  app.get('/leaderboards/exercises', async (_req, reply) => {
    const { data, error } = await supabase
      .from('exercises')
      .select('id, name, category, uses_regulated_weight, exercise_variations(id, name, format_type, time_limit_seconds)')
      .eq('enabled', true)
      .eq('exercise_variations.enabled', true)
      .order('name')

    if (error) return reply.status(500).send({ error: error.message, statusCode: 500 })

    const categories: Record<string, typeof data> = {}
    for (const exercise of data ?? []) {
      const cat = exercise.category
      if (!categories[cat]) categories[cat] = []
      categories[cat]!.push(exercise)
    }

    return { categories }
  })

  // GET /leaderboards/exercises/:exerciseId/variations
  app.get('/leaderboards/exercises/:exerciseId/variations', async (
    req: FastifyRequest<{ Params: { exerciseId: string } }>,
    reply,
  ) => {
    const { exerciseId } = req.params

    const { data, error } = await supabase
      .from('exercise_variations')
      .select('id, name, format_type, time_limit_seconds, rules_text')
      .eq('exercise_id', exerciseId)
      .eq('enabled', true)
      .order('name')

    if (error) return reply.status(500).send({ error: error.message, statusCode: 500 })
    return { variations: data }
  })

  // GET /leaderboards — exercises list with variation counts
  app.get('/leaderboards', async (
    req: FastifyRequest<{ Querystring: { exerciseId?: string; category?: string; page?: string; limit?: string } }>,
    reply,
  ) => {
    const page = Math.max(1, parseInt(req.query.page ?? '1', 10))
    const limit = Math.min(50, parseInt(req.query.limit ?? '20', 10))
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('exercises')
      .select('id, name, category, exercise_variations(id, name, format_type, time_limit_seconds)', { count: 'exact' })
      .eq('enabled', true)
      .eq('exercise_variations.enabled', true)
      .order('name')
      .range(from, to)

    if (req.query.exerciseId) query = query.eq('id', req.query.exerciseId)
    if (req.query.category) query = query.eq('category', req.query.category)

    const { data, error, count } = await query
    if (error) return reply.status(500).send({ error: error.message, statusCode: 500 })

    return { exercises: data, total: count, page, limit }
  })

  // GET /leaderboards/:variationId/top50
  app.get('/leaderboards/:variationId/top50', async (
    req: FastifyRequest<{
      Params: { variationId: string }
      Querystring: { gender: string; ageBracket: string; weightClass: string; country: string }
    }>,
    reply,
  ) => {
    const { variationId } = req.params
    const { gender, ageBracket, weightClass, country } = req.query

    if (!gender || !ageBracket || !weightClass || !country) {
      return reply.status(400).send({ error: 'gender, ageBracket, weightClass, and country are required', statusCode: 400 })
    }
    if (!VALID_GENDERS.includes(gender)) {
      return reply.status(400).send({ error: `gender must be one of: ${VALID_GENDERS.join(', ')}`, statusCode: 400 })
    }
    if (!VALID_AGE_BRACKETS.includes(ageBracket)) {
      return reply.status(400).send({ error: `ageBracket must be one of: ${VALID_AGE_BRACKETS.join(', ')}`, statusCode: 400 })
    }
    if (!VALID_WEIGHT_CLASSES.includes(weightClass)) {
      return reply.status(400).send({ error: `weightClass must be one of: ${VALID_WEIGHT_CLASSES.join(', ')}`, statusCode: 400 })
    }

    const isGlobal = country === 'global'

    let rankQuery = supabase
      .from('leaderboard_ranks')
      .select(`
        rank,
        user_id,
        record_id,
        records (
          value_reps, value_weight_kg, value_time_seconds, added_weight_kg,
          approved_at, video_url, overlay_video_url
        ),
        users (
          name, profile_photo_url, state, country
        )
      `)
      .eq('variation_id', variationId)
      .eq('gender', gender)
      .eq('age_bracket', ageBracket)
      .eq('weight_class', weightClass)
      .lte('rank', 50)
      .order('rank')

    rankQuery = isGlobal
      ? rankQuery.is('country', null)
      : rankQuery.eq('country', country)

    const { data, error } = await rankQuery
    if (error) return reply.status(500).send({ error: error.message, statusCode: 500 })

    // Get total count for this leaderboard
    let countQuery = supabase
      .from('leaderboard_ranks')
      .select('*', { count: 'exact', head: true })
      .eq('variation_id', variationId)
      .eq('gender', gender)
      .eq('age_bracket', ageBracket)
      .eq('weight_class', weightClass)

    countQuery = isGlobal
      ? countQuery.is('country', null)
      : countQuery.eq('country', country)

    const { count } = await countQuery

    const records = (data ?? []).map((row: any) => ({
      rank: row.rank,
      userId: row.user_id,
      name: row.users?.name,
      profilePhotoUrl: row.users?.profile_photo_url,
      state: row.users?.state,
      country: row.users?.country,
      valueReps: row.records?.value_reps,
      valueWeightKg: row.records?.value_weight_kg,
      valueTimeSeconds: row.records?.value_time_seconds,
      addedWeightKg: row.records?.added_weight_kg,
      approvedAt: row.records?.approved_at,
      videoUrl: row.records?.video_url,
      overlayVideoUrl: row.records?.overlay_video_url,
    }))

    return {
      leaderboard: { variationId, gender, ageBracket, weightClass, country, totalEntries: count ?? 0 },
      records,
    }
  })

  // GET /leaderboards/:variationId/my-rank (requires JWT auth)
  app.get<{
    Params: { variationId: string }
    Querystring: { gender: string; ageBracket: string; weightClass: string; country: string }
  }>('/leaderboards/:variationId/my-rank', {
    onRequest: [app.authenticate],
  }, async (req, reply) => {
    const { variationId } = req.params
    const { gender, ageBracket, weightClass, country } = req.query
    const userId = (req.user as any).sub

    if (!gender || !ageBracket || !weightClass || !country) {
      return reply.status(400).send({ error: 'gender, ageBracket, weightClass, and country are required', statusCode: 400 })
    }

    const isGlobal = country === 'global'

    // My rank
    let myRankQuery = supabase
      .from('leaderboard_ranks')
      .select('rank, record_id, records(value_reps, value_weight_kg, value_time_seconds, added_weight_kg, approved_at, video_url)')
      .eq('variation_id', variationId)
      .eq('gender', gender)
      .eq('age_bracket', ageBracket)
      .eq('weight_class', weightClass)
      .eq('user_id', userId)
      .single()

    myRankQuery = isGlobal
      ? (myRankQuery as any).is('country', null)
      : (myRankQuery as any).eq('country', country)

    // 50th place value
    let fiftiethQuery = supabase
      .from('leaderboard_ranks')
      .select('record_id, records(value_reps, value_weight_kg, value_time_seconds)')
      .eq('variation_id', variationId)
      .eq('gender', gender)
      .eq('age_bracket', ageBracket)
      .eq('weight_class', weightClass)
      .eq('rank', 50)
      .single()

    fiftiethQuery = isGlobal
      ? (fiftiethQuery as any).is('country', null)
      : (fiftiethQuery as any).eq('country', country)

    const [myRankResult, fiftiethResult] = await Promise.all([myRankQuery, fiftiethQuery])

    const myRow = myRankResult.data as any
    const fiftiethRow = fiftiethResult.data as any

    const myRecord = myRow?.records ?? null
    const fiftiethRecord = fiftiethRow?.records ?? null

    const fiftiethPlaceValue =
      fiftiethRecord?.value_reps ?? fiftiethRecord?.value_weight_kg ?? fiftiethRecord?.value_time_seconds ?? null

    const myValue =
      myRecord?.value_reps ?? myRecord?.value_weight_kg ?? myRecord?.value_time_seconds ?? null

    const gapToFifty =
      myValue != null && fiftiethPlaceValue != null ? fiftiethPlaceValue - myValue : null

    return {
      myRank: myRow?.rank ?? null,
      myRecord,
      fiftiethPlaceValue,
      gapToFifty,
    }
  })
}
