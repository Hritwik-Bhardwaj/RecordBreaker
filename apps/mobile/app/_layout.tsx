import { Tabs } from 'expo-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'

const queryClient = new QueryClient()

const COLORS = {
  bg: '#0A0A0F',
  tabBg: '#12121A',
  active: '#E94560',
  inactive: '#555577',
  border: '#1E1E2E',
}

function TabIcon({ name, focused }: { name: keyof typeof Ionicons.glyphMap; focused: boolean }) {
  return (
    <View style={styles.iconWrapper}>
      <Ionicons name={name} size={22} color={focused ? COLORS.active : COLORS.inactive} />
      {focused && <View style={styles.dot} />}
    </View>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarStyle: {
              backgroundColor: COLORS.tabBg,
              borderTopColor: COLORS.border,
              borderTopWidth: 1,
              height: 60,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{ tabBarIcon: ({ focused }) => <TabIcon name="home" focused={focused} /> }}
          />
          <Tabs.Screen
            name="leaderboards"
            options={{ tabBarIcon: ({ focused }) => <TabIcon name="trophy" focused={focused} /> }}
          />
          <Tabs.Screen
            name="profile"
            options={{ tabBarIcon: ({ focused }) => <TabIcon name="person" focused={focused} /> }}
          />
          <Tabs.Screen
            name="news"
            options={{ tabBarIcon: ({ focused }) => <TabIcon name="newspaper" focused={focused} /> }}
          />
        </Tabs>
      </SafeAreaProvider>
    </QueryClientProvider>
  )
}

const styles = StyleSheet.create({
  iconWrapper: { alignItems: 'center', justifyContent: 'center', paddingTop: 4 },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E94560',
    marginTop: 3,
  },
})
