import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Modal, ActivityIndicator, Image,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter, Stack } from 'expo-router'
import { useState } from 'react'
import { VideoView, useVideoPlayer } from 'expo-video'
import { useLeaderboard, useVariations, useExercises, LeaderboardRecord } from '../../../src/lib/api'
import { formatRecordValue } from '../../../src/lib/formatters'

const USER_COUNTRY = 'IN' // hardcoded for Phase 1 — replace with auth profile in Phase 2

const RANK_COLORS: Record<number, string> = { 1: '#FFD700', 2: '#C0C0C0', 3: '#CD7F32' }

const GENDER_OPTIONS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
]
const AGE_BRACKET_OPTIONS = [
  { value: 'junior', label: 'Junior (16–23)' },
  { value: 'main', label: 'Main (24–34)' },
  { value: 'senior', label: 'Senior (35–49)' },
  { value: 'senior_i', label: 'Senior I (50–59)' },
  { value: 'senior_ii', label: 'Senior II (60–69)' },
  { value: 'senior_iii', label: 'Senior III (70+)' },
]
const WEIGHT_CLASS_OPTIONS = [
  { value: 'lightweight', label: 'Lightweight' },
  { value: 'middleweight', label: 'Middleweight' },
  { value: 'light_heavyweight', label: 'Light Heavyweight' },
  { value: 'heavyweight', label: 'Heavyweight' },
]

function FilterPill({
  label,
  onPress,
}: {
  label: string
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={styles.filterPill} onPress={onPress}>
      <Text style={styles.filterPillText}>{label} ▾</Text>
    </TouchableOpacity>
  )
}

function PickerModal({
  visible,
  options,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean
  options: { value: string; label: string }[]
  selected: string
  onSelect: (v: string) => void
  onClose: () => void
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalBackdrop} onPress={onClose} activeOpacity={1}>
        <View style={styles.bottomSheet}>
          {options.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sheetOption, opt.value === selected && styles.sheetOptionActive]}
              onPress={() => { onSelect(opt.value); onClose() }}
            >
              <Text style={[styles.sheetOptionText, opt.value === selected && styles.sheetOptionTextActive]}>
                {opt.label}
              </Text>
              {opt.value === selected && <Text style={styles.checkmark}>✓</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  )
}

function VideoModal({ videoUrl, record, rank, onClose }: {
  videoUrl: string
  record: LeaderboardRecord
  rank: number
  onClose: () => void
}) {
  const player = useVideoPlayer(videoUrl, p => { p.play() })

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={styles.videoContainer}>
        <VideoView
          player={player}
          style={styles.video}
          contentFit="contain"
          nativeControls
        />
        <View style={styles.videoOverlay}>
          <Text style={styles.videoRank}>#{rank}</Text>
          <Text style={styles.videoName}>{record.name}</Text>
          <Text style={styles.videoValue}>
            {formatRecordValue(
              {
                value_reps: record.valueReps,
                value_weight_kg: record.valueWeightKg,
                value_time_seconds: record.valueTimeSeconds,
                added_weight_kg: record.addedWeightKg,
              },
              'max_reps', // passed from parent in real impl
            )}
          </Text>
        </View>
        <TouchableOpacity style={styles.videoClose} onPress={onClose}>
          <Text style={styles.videoCloseText}>✕</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  )
}

function RankRow({
  item,
  onWatch,
}: {
  item: LeaderboardRecord
  onWatch: (record: LeaderboardRecord) => void
}) {
  const router = useRouter()
  const rankColor = RANK_COLORS[item.rank] ?? '#fff'

  return (
    <View style={styles.rankRow}>
      <Text style={[styles.rankNum, { color: rankColor }]}>#{item.rank}</Text>
      {item.profilePhotoUrl ? (
        <Image source={{ uri: item.profilePhotoUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{item.name?.[0] ?? '?'}</Text>
        </View>
      )}
      <TouchableOpacity
        style={styles.rankInfo}
        onPress={() => router.push(`/profile/${item.userId}` as any)}
      >
        <Text style={styles.rankName}>{item.name}</Text>
        <Text style={styles.rankLocation}>{[item.state, item.country].filter(Boolean).join(', ')}</Text>
      </TouchableOpacity>
      <View style={styles.rankRight}>
        <Text style={styles.rankValue}>
          {formatRecordValue(
            {
              value_reps: item.valueReps,
              value_weight_kg: item.valueWeightKg,
              value_time_seconds: item.valueTimeSeconds,
              added_weight_kg: item.addedWeightKg,
            },
            'max_reps',
          )}
        </Text>
        <Text style={styles.rankDate}>
          {new Date(item.approvedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: '2-digit' })}
        </Text>
        <TouchableOpacity style={styles.watchBtn} onPress={() => onWatch(item)}>
          <Text style={styles.watchBtnText}>▶ Watch</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

function SkeletonRow() {
  return <View style={styles.skeletonRow} />
}

export default function LeaderboardScreen() {
  const router = useRouter()
  const { exerciseId, variationId } = useLocalSearchParams<{ exerciseId: string; variationId: string }>()

  const [isGlobal, setIsGlobal] = useState(false)
  const [gender, setGender] = useState('men')
  const [ageBracket, setAgeBracket] = useState('main')
  const [weightClass, setWeightClass] = useState('middleweight')

  const [pickerTarget, setPickerTarget] = useState<'gender' | 'ageBracket' | 'weightClass' | null>(null)
  const [watchingRecord, setWatchingRecord] = useState<LeaderboardRecord | null>(null)

  const country = isGlobal ? 'global' : USER_COUNTRY

  const { data, isLoading } = useLeaderboard({ variationId, gender, ageBracket, weightClass, country })

  const { data: categories } = useExercises()
  const { data: variations } = useVariations(exerciseId)

  const exerciseName = categories
    ? Object.values(categories).flat().find(e => e.id === exerciseId)?.name ?? ''
    : ''
  const variationName = variations?.find(v => v.id === variationId)?.name ?? ''

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>+ Follow</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.exerciseTitle}>{exerciseName}</Text>
        <Text style={styles.variationSubtitle}>{variationName}</Text>

        {/* Geography toggle */}
        <View style={styles.geoToggle}>
          <TouchableOpacity
            style={[styles.geoBtn, !isGlobal && styles.geoBtnActive]}
            onPress={() => setIsGlobal(false)}
          >
            <Text style={[styles.geoBtnText, !isGlobal && styles.geoBtnTextActive]}>🇮🇳 India</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.geoBtn, isGlobal && styles.geoBtnActive]}
            onPress={() => setIsGlobal(true)}
          >
            <Text style={[styles.geoBtnText, isGlobal && styles.geoBtnTextActive]}>🌍 Global</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        <FilterPill
          label={GENDER_OPTIONS.find(o => o.value === gender)?.label ?? gender}
          onPress={() => setPickerTarget('gender')}
        />
        <FilterPill
          label={AGE_BRACKET_OPTIONS.find(o => o.value === ageBracket)?.label.split(' ')[0] ?? ageBracket}
          onPress={() => setPickerTarget('ageBracket')}
        />
        <FilterPill
          label={WEIGHT_CLASS_OPTIONS.find(o => o.value === weightClass)?.label ?? weightClass}
          onPress={() => setPickerTarget('weightClass')}
        />
      </View>

      {/* Leaderboard list */}
      {isLoading ? (
        <View style={styles.listPadding}>
          {[...Array(10)].map((_, i) => <SkeletonRow key={i} />)}
        </View>
      ) : !data?.records.length ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No records yet.</Text>
          <Text style={styles.emptySubText}>Be the first to submit on this leaderboard.</Text>
        </View>
      ) : (
        <FlatList
          data={data.records}
          keyExtractor={item => String(item.rank)}
          renderItem={({ item }) => <RankRow item={item} onWatch={setWatchingRecord} />}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter pickers */}
      <PickerModal
        visible={pickerTarget === 'gender'}
        options={GENDER_OPTIONS}
        selected={gender}
        onSelect={setGender}
        onClose={() => setPickerTarget(null)}
      />
      <PickerModal
        visible={pickerTarget === 'ageBracket'}
        options={AGE_BRACKET_OPTIONS}
        selected={ageBracket}
        onSelect={setAgeBracket}
        onClose={() => setPickerTarget(null)}
      />
      <PickerModal
        visible={pickerTarget === 'weightClass'}
        options={WEIGHT_CLASS_OPTIONS}
        selected={weightClass}
        onSelect={setWeightClass}
        onClose={() => setPickerTarget(null)}
      />

      {/* Video player modal */}
      {watchingRecord && (
        <VideoModal
          videoUrl={watchingRecord.overlayVideoUrl ?? watchingRecord.videoUrl}
          record={watchingRecord}
          rank={watchingRecord.rank}
          onClose={() => setWatchingRecord(null)}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },

  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1E1E2E' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  backText: { color: '#E94560', fontSize: 16 },
  followBtn: { borderWidth: 1, borderColor: '#E94560', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5 },
  followBtnText: { color: '#E94560', fontSize: 13, fontWeight: '600' },

  exerciseTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  variationSubtitle: { color: '#888', fontSize: 13, marginTop: 2, marginBottom: 12 },

  geoToggle: { flexDirection: 'row', gap: 8 },
  geoBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#1E1E2E' },
  geoBtnActive: { backgroundColor: '#E94560' },
  geoBtnText: { color: '#888', fontSize: 13, fontWeight: '600' },
  geoBtnTextActive: { color: '#fff' },

  filterBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
  },
  filterPill: {
    backgroundColor: '#1E1E2E',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterPillText: { color: '#ccc', fontSize: 12, fontWeight: '500' },

  listPadding: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 },

  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E2E',
    gap: 10,
  },
  rankNum: { width: 30, fontWeight: '700', fontSize: 14, textAlign: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  avatarPlaceholder: { backgroundColor: '#1E1E2E', alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { color: '#888', fontSize: 14, fontWeight: '700' },
  rankInfo: { flex: 1 },
  rankName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  rankLocation: { color: '#555577', fontSize: 11, marginTop: 2 },
  rankRight: { alignItems: 'flex-end', gap: 2 },
  rankValue: { color: '#fff', fontWeight: '700', fontSize: 13 },
  rankDate: { color: '#555577', fontSize: 11 },
  watchBtn: {
    marginTop: 4,
    backgroundColor: '#E9456022',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E94560',
  },
  watchBtnText: { color: '#E94560', fontSize: 11, fontWeight: '600' },

  skeletonRow: {
    height: 56,
    backgroundColor: '#12121A',
    borderRadius: 8,
    marginBottom: 8,
    opacity: 0.5,
  },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60 },
  emptyText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  emptySubText: { color: '#555577', fontSize: 13, marginTop: 6 },

  // Modal / bottom sheet
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: '#00000088' },
  bottomSheet: {
    backgroundColor: '#12121A',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
    paddingTop: 8,
  },
  sheetOption: { paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between' },
  sheetOptionActive: { backgroundColor: '#E9456011' },
  sheetOptionText: { color: '#ccc', fontSize: 15 },
  sheetOptionTextActive: { color: '#E94560', fontWeight: '600' },
  checkmark: { color: '#E94560', fontSize: 16 },

  // Video modal
  videoContainer: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1 },
  videoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: '#00000099',
  },
  videoRank: { color: '#E94560', fontSize: 18, fontWeight: '700' },
  videoName: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 2 },
  videoValue: { color: '#ccc', fontSize: 14, marginTop: 2 },
  videoClose: {
    position: 'absolute',
    top: 48,
    right: 20,
    width: 36,
    height: 36,
    backgroundColor: '#00000088',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoCloseText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
