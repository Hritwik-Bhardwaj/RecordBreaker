import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { useExercises, useSearchExercises, Exercise } from '../../src/lib/api'

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  push_bodyweight: 'Push',
  push_equipment: 'Push (Equipment)',
  pull_bodyweight: 'Pull',
  dips: 'Dips',
  legs: 'Legs',
  full_body: 'Full Body',
  static_holds: 'Static Holds',
}

const FILTER_CATEGORIES = ['all', 'push_bodyweight', 'push_equipment', 'pull_bodyweight', 'dips', 'legs', 'full_body', 'static_holds']

function SkeletonCard() {
  return <View style={styles.skeletonCard} />
}

function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const router = useRouter()
  const varCount = exercise.exercise_variations?.length ?? 0
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/leaderboards/${exercise.id}` as any)}
      activeOpacity={0.75}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardName}>{exercise.name}</Text>
          <Text style={styles.cardSub}>{varCount} variation{varCount !== 1 ? 's' : ''}</Text>
        </View>
        <View style={styles.cardRight}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{CATEGORY_LABELS[exercise.category] ?? exercise.category}</Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function ExerciseBrowseScreen() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')

  const { data: categories, isLoading } = useExercises()
  const { data: searchResults, isFetching: isSearching } = useSearchExercises(searchQuery)

  const allExercises: Exercise[] = categories
    ? Object.values(categories).flat()
    : []

  const filteredExercises = activeCategory === 'all'
    ? allExercises
    : allExercises.filter(e => e.category === activeCategory)

  const showSearchOverlay = searchQuery.length >= 2

  return (
    <SafeAreaView style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search exercises..."
          placeholderTextColor="#555577"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
            <Text style={styles.clearText}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillScroll}
        contentContainerStyle={styles.pillContent}
      >
        {FILTER_CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.pill, activeCategory === cat && styles.pillActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.pillText, activeCategory === cat && styles.pillTextActive]}>
              {CATEGORY_LABELS[cat]}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search overlay */}
      {showSearchOverlay ? (
        <View style={styles.overlay}>
          {isSearching ? (
            <ActivityIndicator color="#E94560" style={{ marginTop: 20 }} />
          ) : !searchResults?.length ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No exercises found for "{searchQuery}"</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={item => item.variationId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.searchResultRow}
                  onPress={() => router.push(`/leaderboards/${item.exerciseId}/${item.variationId}` as any)}
                >
                  <Text style={styles.searchResultExercise}>{item.exerciseName}</Text>
                  <Text style={styles.searchResultVariation}>{item.variationName}</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </View>
      ) : isLoading ? (
        <View style={styles.listContainer}>
          {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlatList
          data={filteredExercises}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <ExerciseCard exercise={item} />}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#12121A',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    paddingHorizontal: 12,
  },
  searchInput: { flex: 1, color: '#fff', height: 44, fontSize: 15 },
  clearBtn: { padding: 4 },
  clearText: { color: '#555577', fontSize: 16 },
  pillScroll: { maxHeight: 44 },
  pillContent: { paddingHorizontal: 16, gap: 8, flexDirection: 'row', alignItems: 'center' },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1E1E2E',
  },
  pillActive: { backgroundColor: '#E94560' },
  pillText: { color: '#888', fontSize: 13, fontWeight: '500' },
  pillTextActive: { color: '#fff' },
  listContainer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 },
  card: {
    backgroundColor: '#12121A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    marginBottom: 10,
    padding: 14,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flex: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  cardSub: { color: '#555577', fontSize: 12, marginTop: 2 },
  categoryBadge: {
    backgroundColor: '#1E1E2E',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: { color: '#888', fontSize: 11 },
  arrow: { color: '#555577', fontSize: 20, marginLeft: 4 },
  skeletonCard: {
    backgroundColor: '#12121A',
    borderRadius: 12,
    height: 64,
    marginBottom: 10,
    opacity: 0.5,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchResultRow: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  searchResultExercise: { color: '#fff', fontSize: 14, fontWeight: '600' },
  searchResultVariation: { color: '#888', fontSize: 12, marginTop: 2 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: '#555577', fontSize: 14 },
})
