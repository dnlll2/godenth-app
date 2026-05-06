import { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useAuthStore } from '../stores/authStore'

export default function RootLayout() {
  const { loadUser } = useAuthStore()

  useEffect(() => {
    loadUser()
  }, [])

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}
