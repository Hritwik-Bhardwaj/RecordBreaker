import {
  View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useVariations, useExercises, Variation } from '../../src/lib/api'

const FORMAT_BADGE_COLORS: Record<string, string> = {
  max_reps: '#1E5BD0',
  timed_reps: '#B35B00',
  weight_based: '#1A6B38',
  max_time_hold: '#5B1AB3',
}

const FORMAT_LABELS: Record<string, string> = {
  max_reps: 'Max Reps',
  timed_reps: 'Timed Reps',
  weight_based: 'Weight',
  max_time_hold: 'Time Hold',
}

function VariationCard({ variation, exerciseId }: { variation: Variation; exerciseId: string }) {
  const router = useRouter()
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/leaderboards/${exerciseId}/${variation.id}` as any)}
      activeOpacity={0.75}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <Text style={styles.variationName}>{variation.name}</Text>
          {variation.time_limit_seconds != null && (
            <Text style={styles.timeLabel}>
              {variation.time_limit_seconds < 60
                ? `${variation.time_limit_seconds}s`
                : `${variation.time_limit_seconds / 60} min`} time limit
            </Text>
          )}
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.badge, { backgroundColor: FORMAT_BADGE_COLORS[variation.format_type] + '33' }]}>
            <Text style={[styles.badgeText, { color: FORMAT_BADGE_COLORS[variation.format_type] }]}>
              {FORMAT_LABELS[variation.format_type]}
            </Text>
          </View>
          <Text style={styles.arrow}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function ExerciseDetailScreen() {
  const { exerciseId } = useLocalSearchParams<{ exerciseId: string }>()
  const { data: variations, isLoading } = useVariations(exerciseId)
  const { data: categories } = useExercises()

  const exerciseName = categories
    ? Object.values(categories).flat().find(e => e.id === exerciseId)?.name ?? ''
    : ''

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => useRouter().back()} style={styles.backBtn} hitSlop={8}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{exerciseName}</Text>
        <Text style={styles.subtitle}>Each variation is a separate leaderboard</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator color="#E94560" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={variations}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <VariationCard variation={item} exerciseId={exerciseId} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1E1E2E' },
  backBtn: { marginBottom: 12 },
  backText: { color: '#E94560', fontSize: 16 },
  title: { color: '#fff', fontSize: 24, fontWeight: '700' },
  subtitle: { color: '#555577', fontSize: 13, marginTop: 4 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#12121A',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E2E',
    padding: 14,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLeft: { flex: 1 },
  cardRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  variationName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  timeLabel: { color: '#888', fontSize: 12, marginTop: 3 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  arrow: { color: '#555577', fontSize: 20 },
})
