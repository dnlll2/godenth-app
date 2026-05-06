import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../stores/authStore'
import { Colors } from '../constants/colors'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        router.replace('/(tabs)/feed')
      } else {
        router.replace('/(auth)/login')
      }
    }
  }, [isLoading, isAuthenticated])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}
