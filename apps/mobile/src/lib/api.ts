import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1'

const client = axios.create({ baseURL: BASE_URL })

// ── Types ─────────────────────────────────────────────────────

export interface Variation {
  id: string
  name: string
  format_type: 'max_reps' | 'timed_reps' | 'weight_based' | 'max_time_hold'
  time_limit_seconds: number | null
  rules_text?: string | null
}

export interface Exercise {
  id: string
  name: string
  category: string
  uses_regulated_weight: boolean
  exercise_variations: Variation[]
}

export interface ExerciseCategory {
  [category: string]: Exercise[]
}

export interface ExerciseSearchResult {
  exerciseId: string
  exerciseName: string
  category: string
  variationId: string
  variationName: string
  formatType: string
}

export interface LeaderboardParams {
  variationId: string
  gender: string
  ageBracket: string
  weightClass: string
  country: string
}

export interface LeaderboardRecord {
  rank: number
  userId: string
  name: string
  profilePhotoUrl: string | null
  state: string | null
  country: string
  valueReps: number | null
  valueWeightKg: number | null
  valueTimeSeconds: number | null
  addedWeightKg: number | null
  approvedAt: string
  videoUrl: string
  overlayVideoUrl: string | null
}

export interface LeaderboardResponse {
  leaderboard: {
    variationId: string
    gender: string
    ageBracket: string
    weightClass: string
    country: string
    totalEntries: number
  }
  records: LeaderboardRecord[]
}

// ── API Functions ─────────────────────────────────────────────

export async function getExercises(): Promise<ExerciseCategory> {
  const { data } = await client.get<{ categories: ExerciseCategory }>('/leaderboards/exercises')
  return data.categories
}

export async function searchExercises(q: string): Promise<ExerciseSearchResult[]> {
  const { data } = await client.get<ExerciseSearchResult[]>('/exercises/search', { params: { q } })
  return data
}

export async function getLeaderboardTop50(params: LeaderboardParams): Promise<LeaderboardResponse> {
  const { variationId, ...query } = params
  const { data } = await client.get<LeaderboardResponse>(
    `/leaderboards/${variationId}/top50`,
    { params: { gender: query.gender, ageBracket: query.ageBracket, weightClass: query.weightClass, country: query.country } },
  )
  return data
}

export async function getVariations(exerciseId: string): Promise<Variation[]> {
  const { data } = await client.get<{ variations: Variation[] }>(
    `/leaderboards/exercises/${exerciseId}/variations`,
  )
  return data.variations
}

// ── React Query Hooks ─────────────────────────────────────────

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: getExercises,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useVariations(exerciseId: string) {
  return useQuery({
    queryKey: ['variations', exerciseId],
    queryFn: () => getVariations(exerciseId),
    enabled: Boolean(exerciseId),
    staleTime: 5 * 60 * 1000,
  })
}

export function useLeaderboard(params: Partial<LeaderboardParams>) {
  const isReady =
    Boolean(params.variationId) &&
    Boolean(params.gender) &&
    Boolean(params.ageBracket) &&
    Boolean(params.weightClass) &&
    Boolean(params.country)

  return useQuery({
    queryKey: ['leaderboard', params],
    queryFn: () => getLeaderboardTop50(params as LeaderboardParams),
    enabled: isReady,
    staleTime: 60 * 1000, // 1 minute
  })
}

export function useSearchExercises(q: string) {
  const [debouncedQ, setDebouncedQ] = useState(q)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(q), 300)
    return () => clearTimeout(timer)
  }, [q])

  return useQuery({
    queryKey: ['exercise-search', debouncedQ],
    queryFn: () => searchExercises(debouncedQ),
    enabled: debouncedQ.length >= 2,
    staleTime: 30 * 1000,
  })
}
