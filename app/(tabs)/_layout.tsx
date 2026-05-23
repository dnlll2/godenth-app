import { Tabs } from 'expo-router'
import { Platform } from 'react-native'
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg'

const IC_ON  = '#00C9B1'
const IC_OFF = '#B8D0C8'
const SW = 1.7

function mk(c: string) {
  return { stroke: c, strokeWidth: SW, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
}

function DashboardIcon({ color }: { color: string }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Rect x="3"  y="3"  width="8" height="8" rx="1" stroke={color} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="13" y="3"  width="8" height="8" rx="1" stroke={color} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3"  y="13" width="8" height="8" rx="1" stroke={color} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="13" y="13" width="8" height="8" rx="1" stroke={color} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function StarIcon({ color }: { color: string }) {
  const b = mk(color)
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M12,2 L15.09,8.26 L22,9.27 L17,14.14 L18.18,21.02 L12,17.77 L5.82,21.02 L7,14.14 L2,9.27 L8.91,8.26 Z" {...b} />
    </Svg>
  )
}

function CartIcon({ color }: { color: string }) {
  const b = mk(color)
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M2,3 L5.5,3 L7.72,14.4 C7.85,15 8.38,15.42 9,15.42 L19,15.42 C19.6,15.42 20.12,15.02 20.27,14.43 L22,7 L6,7" {...b} />
      <Circle cx="9"  cy="20" r="1.5" {...b} />
      <Circle cx="17" cy="20" r="1.5" {...b} />
    </Svg>
  )
}

function BuildingIcon({ color }: { color: string }) {
  const b = mk(color)
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24">
      <Path d="M3,21 L3,6 C3,5.45 3.45,5 4,5 L20,5 C20.55,5 21,5.45 21,6 L21,21" {...b} />
      <Line x1="1" y1="21" x2="23" y2="21" {...b} />
      <Path d="M9,21 L9,15 L15,15 L15,21" {...b} />
      <Rect x="8"  y="8" width="3" height="3" stroke={color} strokeWidth={SW} fill="none" />
      <Rect x="13" y="8" width="3" height="3" stroke={color} strokeWidth={SW} fill="none" />
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
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
    }}>
      <Tabs.Screen name="feed"          options={{ title: 'Painel',       tabBarIcon: ({ color }) => <DashboardIcon color={color} /> }} />
      <Tabs.Screen name="oportunidades" options={{ title: 'Oportunidades', tabBarIcon: ({ color }) => <StarIcon      color={color} /> }} />
      <Tabs.Screen name="marketplace"   options={{ title: 'Marketplace',   tabBarIcon: ({ color }) => <CartIcon      color={color} /> }} />
      <Tabs.Screen name="empresas"      options={{ title: 'Páginas',       tabBarIcon: ({ color }) => <BuildingIcon  color={color} /> }} />
      <Tabs.Screen name="perfil"        options={{ title: 'Perfil',        tabBarIcon: ({ color }) => <PersonIcon    color={color} /> }} />
      <Tabs.Screen name="grupos"        options={{ href: null }} />
      <Tabs.Screen name="notificacoes"  options={{ href: null }} />
      <Tabs.Screen name="mensagens"     options={{ href: null }} />
      <Tabs.Screen name="publicar"      options={{ href: null }} />
      <Tabs.Screen name="editar-perfil" options={{ href: null }} />
      <Tabs.Screen name="vagas"         options={{ href: null }} />
      <Tabs.Screen name="buscar"        options={{ href: null }} />
    </Tabs>
  )
}
