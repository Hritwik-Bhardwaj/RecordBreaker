import { FastifyInstance, FastifyRequest } from 'fastify'
import { refreshBothLeaderboards, refreshLeaderboardRanks } from '../services/ranking'
import { supabase } from '../db'

// Simple secret-based guard for solo admin use
function checkAdminSecret(req: FastifyRequest, secret: string): boolean {
  return req.headers['x-admin-secret'] === secret
}

export default async function adminRoutes(app: FastifyInstance) {
  const adminSecret = process.env.ADMIN_SECRET ?? 'dev-admin-secret'

  // POST /admin/refresh-ranks
  // Body: { variationId, gender, ageBracket, weightClass, country }
  // Omit country to refresh all combinations for that variation
  app.post<{
    Body: {
      variationId: string
      gender: string
      ageBracket: string
      weightClass: string
      country?: string | null
    }
  }>('/admin/refresh-ranks', async (req, reply) => {
    if (!checkAdminSecret(req, adminSecret)) {
      return reply.status(401).send({ error: 'Unauthorized', statusCode: 401 })
    }

    const { variationId, gender, ageBracket, weightClass, country } = req.body

    if (!variationId || !gender || !ageBracket || !weightClass) {
      return reply.status(400).send({ error: 'variationId, gender, ageBracket, weightClass are required', statusCode: 400 })
    }

    await refreshBothLeaderboards({
      variationId,
      gender,
      ageBracket,
      weightClass,
      country: country ?? null,
    })

    return { ok: true, message: `Ranks refreshed for ${variationId} / ${gender} / ${ageBracket} / ${weightClass}` }
  })

  // POST /admin/refresh-all-ranks
  // Refreshes leaderboard_ranks for ALL approved records in the DB.
  // Useful after bulk seeding. Can take a few seconds.
  app.post('/admin/refresh-all-ranks', async (req, reply) => {
    if (!checkAdminSecret(req, adminSecret)) {
      return reply.status(401).send({ error: 'Unauthorized', statusCode: 401 })
    }

    // Get every unique combination that has approved records
    const { data, error } = await supabase
      .from('records')
      .select('variation_id, gender, age_bracket, weight_class, country')
      .eq('status', 'approved')

    if (error) return reply.status(500).send({ error: error.message, statusCode: 500 })

    // Deduplicate country-specific combinations
    const seenCountry = new Set<string>()
    const countryCombos: Array<{ variationId: string; gender: string; ageBracket: string; weightClass: string; country: string }> = []

    for (const row of data ?? []) {
      const key = `${row.variation_id}|${row.gender}|${row.age_bracket}|${row.weight_class}|${row.country}`
      if (!seenCountry.has(key)) {
        seenCountry.add(key)
        countryCombos.push({
          variationId: row.variation_id,
          gender: row.gender,
          ageBracket: row.age_bracket,
          weightClass: row.weight_class,
          country: row.country,
        })
      }
    }

    // Deduplicate global combinations (no country dimension)
    const seenGlobal = new Set<string>()
    const globalCombos = countryCombos.filter(c => {
      const key = `${c.variationId}|${c.gender}|${c.ageBracket}|${c.weightClass}`
      if (seenGlobal.has(key)) return false
      seenGlobal.add(key)
      return true
    })

    // Refresh country leaderboards and global leaderboards in separate passes
    // so the global leaderboard is only refreshed once per unique combination
    // (prevents race conditions when multiple countries share the same combo)
    await Promise.all(countryCombos.map(c => refreshLeaderboardRanks(c)))
    await Promise.all(globalCombos.map(c => refreshLeaderboardRanks({ ...c, country: null })))

    return { ok: true, refreshed: countryCombos.length + globalCombos.length, message: `Refreshed ${countryCombos.length} country + ${globalCombos.length} global leaderboard combinations` }
  })
}
