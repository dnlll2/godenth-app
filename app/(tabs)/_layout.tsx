import { Tabs } from 'expo-router'

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { display: 'none' },
    }}>
      <Tabs.Screen name="feed" />
      <Tabs.Screen name="buscar" />
      <Tabs.Screen name="notificacoes" />
      <Tabs.Screen name="perfil" />
      <Tabs.Screen name="publicar" options={{ href: null }} />
      <Tabs.Screen name="editar-perfil" options={{ href: null }} />
    </Tabs>
  )
}
