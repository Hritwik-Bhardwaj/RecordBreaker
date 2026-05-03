import { createClient } from '@supabase/supabase-js'
import ExerciseManager from './ExerciseManager'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

export default async function ExercisesPage() {
  const { data: exercises } = await supabase
    .from('exercises')
    .select('id, name, category, uses_regulated_weight, enabled, exercise_variations(id)')
    .order('category')
    .order('name')

  return <ExerciseManager initialExercises={exercises ?? []} />
}
