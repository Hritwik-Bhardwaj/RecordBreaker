'use client'

import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
)

const CATEGORIES = [
  'push_bodyweight', 'push_equipment', 'pull_bodyweight',
  'dips', 'legs', 'full_body', 'static_holds',
] as const

interface Exercise {
  id: string
  name: string
  category: string
  uses_regulated_weight: boolean
  enabled: boolean
  exercise_variations: { id: string }[]
}

const STYLES = {
  sidebar: 'w-56 min-h-screen bg-[#0F0F1A] border-r border-[#1E1E2E] flex flex-col gap-1 p-4',
  navItem: 'px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-[#1E1E2E] transition-colors',
  navActive: 'px-3 py-2 rounded-lg text-sm text-white bg-[#E94560] font-semibold',
  content: 'flex-1 bg-[#080810] p-8 overflow-auto',
  table: 'w-full text-sm',
  th: 'text-left text-gray-500 font-medium pb-3 border-b border-[#1E1E2E]',
  td: 'py-3 border-b border-[#1E1E2E] text-gray-300',
  tdAlt: 'py-3 border-b border-[#1E1E2E] text-gray-300 bg-[#0F0F1A]',
  badge: 'inline-block px-2 py-0.5 rounded text-xs font-medium',
  btn: 'px-3 py-1 rounded text-xs font-semibold transition-colors',
  input: 'w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#E94560]',
  select: 'w-full bg-[#1E1E2E] border border-[#2E2E3E] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#E94560]',
}

export default function ExerciseManager({ initialExercises }: { initialExercises: Exercise[] }) {
  const [exercises, setExercises] = useState(initialExercises)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', category: CATEGORIES[0], description: '', uses_regulated_weight: false })
  const [saving, setSaving] = useState(false)

  async function toggleEnabled(exercise: Exercise) {
    const { error } = await supabase
      .from('exercises')
      .update({ enabled: !exercise.enabled })
      .eq('id', exercise.id)

    if (!error) {
      setExercises(prev => prev.map(e => e.id === exercise.id ? { ...e, enabled: !e.enabled } : e))
    }
  }

  async function addExercise() {
    if (!form.name.trim()) return
    setSaving(true)
    const { data, error } = await supabase
      .from('exercises')
      .insert({ ...form, enabled: true })
      .select('id, name, category, uses_regulated_weight, enabled')
      .single()

    setSaving(false)
    if (!error && data) {
      setExercises(prev => [...prev, { ...data, exercise_variations: [] }])
      setShowModal(false)
      setForm({ name: '', category: CATEGORIES[0], description: '', uses_regulated_weight: false })
    }
  }

  return (
    <div className="flex min-h-screen bg-[#080810] text-white font-sans">
      {/* Sidebar */}
      <nav className={STYLES.sidebar}>
        <div className="text-[#E94560] font-bold text-lg mb-6 px-3">RecordBreaker</div>
        <span className={STYLES.navActive}>Exercises</span>
        <span className={STYLES.navItem}>Moderation Queue</span>
        <span className={STYLES.navItem}>Users</span>
      </nav>

      {/* Content */}
      <main className={STYLES.content}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Exercises</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#E94560] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#c73650] transition-colors"
          >
            + Add Exercise
          </button>
        </div>

        <table className={STYLES.table}>
          <thead>
            <tr>
              <th className={STYLES.th}>Name</th>
              <th className={STYLES.th}>Category</th>
              <th className={STYLES.th}>Variations</th>
              <th className={STYLES.th}>Regulated Weight</th>
              <th className={STYLES.th}>Status</th>
              <th className={STYLES.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exercises.map((ex, i) => {
              const tdClass = i % 2 === 0 ? STYLES.td : STYLES.tdAlt
              return (
                <tr key={ex.id}>
                  <td className={tdClass + ' font-medium text-white'}>{ex.name}</td>
                  <td className={tdClass}>
                    <span className={STYLES.badge + ' bg-[#1E1E2E] text-gray-400'}>{ex.category}</span>
                  </td>
                  <td className={tdClass}>{ex.exercise_variations?.length ?? 0}</td>
                  <td className={tdClass}>{ex.uses_regulated_weight ? '✓' : '—'}</td>
                  <td className={tdClass}>
                    <span className={STYLES.badge + (ex.enabled ? ' bg-green-900 text-green-400' : ' bg-gray-800 text-gray-500')}>
                      {ex.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleEnabled(ex)}
                        className={STYLES.btn + (ex.enabled ? ' bg-gray-700 text-gray-300 hover:bg-gray-600' : ' bg-green-800 text-green-300 hover:bg-green-700')}
                      >
                        {ex.enabled ? 'Disable' : 'Enable'}
                      </button>
                      <Link
                        href={`/admin/exercises/${ex.id}/variations`}
                        className={STYLES.btn + ' bg-[#1E1E2E] text-gray-300 hover:bg-[#2E2E3E]'}
                      >
                        Manage Variations
                      </Link>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </main>

      {/* Add Exercise Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-[#12121A] border border-[#1E1E2E] rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold mb-4">Add Exercise</h2>
            <div className="flex flex-col gap-3">
              <input
                className={STYLES.input}
                placeholder="Exercise name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
              <select
                className={STYLES.select}
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value as any }))}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <textarea
                className={STYLES.input}
                placeholder="Description (optional)"
                rows={3}
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              />
              <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.uses_regulated_weight}
                  onChange={e => setForm(f => ({ ...f, uses_regulated_weight: e.target.checked }))}
                  className="accent-[#E94560]"
                />
                Uses regulated weight
              </label>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className={STYLES.btn + ' bg-[#1E1E2E] text-gray-400 hover:bg-[#2E2E3E] px-4 py-2'}
              >
                Cancel
              </button>
              <button
                onClick={addExercise}
                disabled={saving}
                className="bg-[#E94560] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#c73650] disabled:opacity-50 transition-colors"
              >
                {saving ? 'Saving...' : 'Add Exercise'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
