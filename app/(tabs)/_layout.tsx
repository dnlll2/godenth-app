import { Tabs } from 'expo-router'
import { Platform } from 'react-native'
import Svg, { Path, Circle, Line } from 'react-native-svg'

const IC_ON  = '#00C9B1'
const IC_OFF = '#B8D0C8'
const SW = 1.7

function mk(c: string) {
  return { stroke: c, strokeWidth: SW, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
}

function HomeIcon({ color }: { color: string }) {
  const b = mk(color)
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M2,11 L12,3 L22,11" {...b} />
      <Path d="M4,11 L4,21 L20,21 L20,11" {...b} />
      <Path d="M9,21 L9,15 L15,15 L15,21" {...b} />
    </Svg>
  )
}

function SearchIcon({ color }: { color: string }) {
  const b = mk(color)
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx="10.5" cy="10.5" r="6.5" {...b} />
      <Line x1="15.5" y1="15.5" x2="21" y2="21" {...b} />
    </Svg>
  )
}

function BellIcon({ color }: { color: string }) {
  const b = mk(color)
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M10,7 C10,5.3 14,5.3 14,7" {...b} />
      <Path d="M5,17 C5,12 7.5,8 12,8 C16.5,8 19,12 19,17 L20,19 L4,19 Z" {...b} />
      <Path d="M10,19 C10,20.7 14,20.7 14,19" {...b} />
    </Svg>
  )
}

function ChatIcon({ color }: { color: string }) {
  const b = mk(color)
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M3,5 C3,3.9 3.9,3 5,3 L19,3 C20.1,3 21,3.9 21,5 L21,14 C21,15.1 20.1,16 19,16 L8,16 L3,21 Z" {...b} />
    </Svg>
  )
}

function PersonIcon({ color }: { color: string }) {
  const b = mk(color)
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="4" {...b} />
      <Path d="M4,22 C4,16.5 7.5,14 12,14 C16.5,14 20,16.5 20,22" {...b} />
    </Svg>
  )
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: IC_ON,
      tabBarInactiveTintColor: IC_OFF,
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopColor: '#E8F0EC',
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 80 : 62,
        paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        paddingTop: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      tabBarLabelStyle: {
        fontSize: 10,
        fontWeight: '700',
      },
    }}>
      <Tabs.Screen name="feed"         options={{ title: 'Início',    tabBarIcon: ({ color }) => <HomeIcon   color={color} /> }} />
      <Tabs.Screen name="buscar"       options={{ title: 'Buscar',    tabBarIcon: ({ color }) => <SearchIcon color={color} /> }} />
      <Tabs.Screen name="notificacoes" options={{ title: 'Alertas',   tabBarIcon: ({ color }) => <BellIcon   color={color} /> }} />
      <Tabs.Screen name="mensagens"    options={{ title: 'Chat',      tabBarIcon: ({ color }) => <ChatIcon   color={color} /> }} />
      <Tabs.Screen name="perfil"       options={{ title: 'Perfil',    tabBarIcon: ({ color }) => <PersonIcon color={color} /> }} />
      <Tabs.Screen name="publicar"     options={{ href: null }} />
      <Tabs.Screen name="editar-perfil" options={{ href: null }} />
      <Tabs.Screen name="vagas"        options={{ href: null }} />
    </Tabs>
  )
}
