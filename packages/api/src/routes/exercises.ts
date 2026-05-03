import { FastifyInstance, FastifyRequest } from 'fastify'
import { supabase } from '../db'

export default async function exerciseRoutes(app: FastifyInstance) {

  // GET /exercises/search?q=
  app.get('/exercises/search', async (
    req: FastifyRequest<{ Querystring: { q?: string } }>,
    reply,
  ) => {
    const q = req.query.q?.trim()

    if (!q || q.length < 2) {
      return reply.status(400).send({ error: 'q must be at least 2 characters', statusCode: 400 })
    }

    const pattern = `%${q}%`

    // Search exercises
    const { data: exercises, error: exError } = await supabase
      .from('exercises')
      .select('id, name, category, exercise_variations(id, name, format_type)')
      .eq('enabled', true)
      .ilike('name', pattern)
      .limit(10)

    // Search variations
    const { data: variations, error: varError } = await supabase
      .from('exercise_variations')
      .select('id, name, format_type, exercises!inner(id, name, category)')
      .eq('enabled', true)
      .ilike('name', pattern)
      .limit(10)

    if (exError || varError) {
      return reply.status(500).send({ error: exError?.message ?? varError?.message, statusCode: 500 })
    }

    const results: Array<{
      exerciseId: string
      exerciseName: string
      category: string
      variationId: string
      variationName: string
      formatType: string
    }> = []

    // Flatten exercise matches — include all their variations
    for (const ex of exercises ?? []) {
      for (const v of (ex as any).exercise_variations ?? []) {
        results.push({
          exerciseId: ex.id,
          exerciseName: ex.name,
          category: ex.category,
          variationId: v.id,
          variationName: v.name,
          formatType: v.format_type,
        })
      }
    }

    // Add direct variation matches (avoiding duplicates)
    const seen = new Set(results.map(r => r.variationId))
    for (const v of variations ?? []) {
      if (seen.has(v.id)) continue
      const ex = (v as any).exercises
      results.push({
        exerciseId: ex.id,
        exerciseName: ex.name,
        category: ex.category,
        variationId: v.id,
        variationName: v.name,
        formatType: v.format_type,
      })
    }

    return results.slice(0, 20)
  })
}
