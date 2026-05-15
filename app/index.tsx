import { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuthStore } from '../stores/authStore'
import { Colors } from '../constants/colors'

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore()

  useEffect(() => {
    console.log('[index] useEffect — isLoading:', isLoading, '| isAuthenticated:', isAuthenticated)
    if (!isLoading) {
      if (isAuthenticated) {
        AsyncStorage.getItem('godenth_onboarding_seen').then(seen => {
          console.log('[index] godenth_onboarding_seen:', seen)
          if (seen) {
            router.replace('/(tabs)/feed')
          } else {
            router.replace('/onboarding')
          }
        })
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
