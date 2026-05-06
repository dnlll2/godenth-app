import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '../../constants/colors'

function TabIcon({ icon, label, focused }: { icon: string, label: string, focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={styles.tabIcon}>{icon}</Text>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: styles.tabBar,
      tabBarShowLabel: false,
    }}>
      <Tabs.Screen name="feed" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="📋" label="Feed" focused={focused} /> }} />
      <Tabs.Screen name="buscar" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔍" label="Buscar" focused={focused} /> }} />
      <Tabs.Screen name="publicar" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="➕" label="Publicar" focused={focused} /> }} />
      <Tabs.Screen name="notificacoes" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="🔔" label="Alertas" focused={focused} /> }} />
      <Tabs.Screen name="perfil" options={{ tabBarIcon: ({ focused }) => <TabIcon icon="👤" label="Perfil" focused={focused} /> }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white, borderTopWidth: 2, borderTopColor: Colors.border,
    height: 70, paddingBottom: 10, paddingTop: 6,
    shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 8,
  },
  tabItem: { alignItems: 'center', gap: 3 },
  tabIcon: { fontSize: 22 },
  tabLabel: { fontSize: 10, fontWeight: '700', color: Colors.text3 },
  tabLabelActive: { color: Colors.primary },
})
