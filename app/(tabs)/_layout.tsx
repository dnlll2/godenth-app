import { useState, useEffect, useRef } from 'react'
import { Tabs, Slot, router, usePathname } from 'expo-router'
import {
  Platform, useWindowDimensions, View, Text, TouchableOpacity,
  StyleSheet, Animated, ScrollView, Image, ActivityIndicator,
} from 'react-native'
import Svg, { Path, Circle, Line, Rect } from 'react-native-svg'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'

// ── Constants ─────────────────────────────────────────────────────────────────
const PRIMARY  = '#1c909b'
const IC_ON    = '#00C9B1'
const IC_OFF   = '#B8D0C8'
const SW       = 1.7
const DESKTOP_BREAKPOINT = 768
const SIDEBAR_EXPANDED   = 220
const SIDEBAR_COLLAPSED  = 60
const RIGHT_PANEL_WIDTH  = 280

function mk(c: string) {
  return { stroke: c, strokeWidth: SW, fill: 'none', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function DashboardIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Rect x="3"  y="3"  width="8" height="8" rx="1" stroke={color} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="13" y="3"  width="8" height="8" rx="1" stroke={color} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="3"  y="13" width="8" height="8" rx="1" stroke={color} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Rect x="13" y="13" width="8" height="8" rx="1" stroke={color} strokeWidth={SW} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  )
}

function StarIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M12,2 L15.09,8.26 L22,9.27 L17,14.14 L18.18,21.02 L12,17.77 L5.82,21.02 L7,14.14 L2,9.27 L8.91,8.26 Z" {...mk(color)} />
    </Svg>
  )
}

function CartIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M2,3 L5.5,3 L7.72,14.4 C7.85,15 8.38,15.42 9,15.42 L19,15.42 C19.6,15.42 20.12,15.02 20.27,14.43 L22,7 L6,7" {...mk(color)} />
      <Circle cx="9"  cy="20" r="1.5" {...mk(color)} />
      <Circle cx="17" cy="20" r="1.5" {...mk(color)} />
    </Svg>
  )
}

function BuildingIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M3,21 L3,6 C3,5.45 3.45,5 4,5 L20,5 C20.55,5 21,5.45 21,6 L21,21" {...mk(color)} />
      <Line x1="1" y1="21" x2="23" y2="21" {...mk(color)} />
      <Path d="M9,21 L9,15 L15,15 L15,21" {...mk(color)} />
      <Rect x="8"  y="8" width="3" height="3" stroke={color} strokeWidth={SW} fill="none" />
      <Rect x="13" y="8" width="3" height="3" stroke={color} strokeWidth={SW} fill="none" />
    </Svg>
  )
}

function PersonIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx="12" cy="8" r="4" {...mk(color)} />
      <Path d="M4,22 C4,16.5 7.5,14 12,14 C16.5,14 20,16.5 20,22" {...mk(color)} />
    </Svg>
  )
}

function GroupsIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Circle cx="9" cy="7" r="3" {...mk(color)} />
      <Circle cx="17" cy="8" r="2.5" {...mk(color)} />
      <Path d="M2,21 C2,16.5 5,14 9,14 C13,14 16,16.5 16,21" {...mk(color)} />
      <Path d="M19,21 C19,18 17.5,16.5 15.5,16" {...mk(color)} />
    </Svg>
  )
}

function AdminIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path d="M12,2 L15.09,8.26 L22,9.27 L17,14.14 L18.18,21.02 L12,17.77 L5.82,21.02 L7,14.14 L2,9.27 L8.91,8.26 Z" {...mk(color)} />
    </Svg>
  )
}

function SearchIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Circle cx="11" cy="11" r="8" {...mk(color)} />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" {...mk(color)} />
    </Svg>
  )
}

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path d="M18,8 A6,6 0 0,0 6,8 C6,15 3,17 3,17 L21,17 C21,17 18,15 18,8" {...mk(color)} />
      <Path d="M13.73,21 A2,2 0 0,1 10.27,21" {...mk(color)} />
    </Svg>
  )
}

function HamburgerIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Line x1="3" y1="6"  x2="21" y2="6"  {...mk(color)} />
      <Line x1="3" y1="12" x2="21" y2="12" {...mk(color)} />
      <Line x1="3" y1="18" x2="21" y2="18" {...mk(color)} />
    </Svg>
  )
}

// ── Nav items definition ───────────────────────────────────────────────────────

type NavItem = { label: string; href: string; Icon: React.ComponentType<{ color: string }> }

const NAV_ITEMS: NavItem[] = [
  { label: 'Painel',       href: '/(tabs)/feed',         Icon: DashboardIcon },
  { label: 'Oportunidades', href: '/(tabs)/oportunidades', Icon: StarIcon },
  { label: 'Marketplace',  href: '/(tabs)/marketplace',  Icon: CartIcon },
  { label: 'Páginas',      href: '/(tabs)/empresas',     Icon: BuildingIcon },
  // { label: 'Grupos',       href: '/(tabs)/grupos',        Icon: GroupsIcon },
  { label: 'Perfil',       href: '/(tabs)/perfil',       Icon: PersonIcon },
]

// ── Desktop Top Bar (full-width) ───────────────────────────────────────────────

function DesktopTopBar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { user } = useAuthStore()
  const avatarUrl = user?.avatar_url || null

  return (
    <View style={tb.bar}>
      {/* Left: hamburger + logo */}
      <View style={tb.left}>
        <TouchableOpacity onPress={onToggle} style={tb.hamburgerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <HamburgerIcon color="#fff" />
        </TouchableOpacity>
        <Text style={tb.logoText}>
          <Text style={{ color: '#F5C800' }}>Go</Text>
          <Text style={{ color: '#fff' }}>Denth</Text>
        </Text>
      </View>

      {/* Right: action icons */}
      <View style={tb.right}>
        <TouchableOpacity style={tb.iconBtn} onPress={() => router.push('/(tabs)/publicar' as any)}>
          <Text style={tb.plusT}>+</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tb.iconBtn} onPress={() => router.push('/(tabs)/buscar' as any)}>
          <SearchIcon color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={tb.iconBtn} onPress={() => router.push('/(tabs)/notificacoes' as any)}>
          <BellIcon color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(tabs)/perfil' as any)}>
          {avatarUrl
            ? <Image source={{ uri: avatarUrl }} style={tb.avatar} />
            : <View style={tb.avatarFb}><Text style={tb.avatarFbT}>{user?.nome?.charAt(0) || 'U'}</Text></View>
          }
        </TouchableOpacity>
      </View>
    </View>
  )
}

// ── Desktop Sidebar ────────────────────────────────────────────────────────────

function DesktopSidebar({ collapsed, widthAnim }: {
  collapsed: boolean
  widthAnim: Animated.Value
}) {
  const pathname = usePathname()
  const { user } = useAuthStore()
  const isAdmin  = user?.plano === 'black'

  const items = isAdmin
    ? [...NAV_ITEMS, { label: 'Admin', href: '/admin', Icon: AdminIcon }]
    : NAV_ITEMS

  return (
    <Animated.View style={[ds.sidebar, { width: widthAnim }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 8 }}>
        {items.map(item => {
          const segment   = item.href.replace('/(tabs)/', '').replace(/^\//, '')
          const active    = pathname === `/${segment}` || pathname.startsWith(`/${segment}/`)
          const iconColor = active ? '#fff' : 'rgba(255,255,255,0.55)'
          return (
            <TouchableOpacity
              key={item.href}
              style={[ds.navItem, active && ds.navItemActive, collapsed && ds.navItemCollapsed]}
              onPress={() => router.push(item.href as any)}
              activeOpacity={0.8}
            >
              <item.Icon color={iconColor} />
              {!collapsed && (
                <Text style={[ds.navLabel, active && ds.navLabelActive]} numberOfLines={1}>
                  {item.label}
                </Text>
              )}
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </Animated.View>
  )
}

// ── Desktop Right Panel ────────────────────────────────────────────────────────

const RP_API = 'https://godenth-api.onrender.com'

function DesktopRightPanel() {
  const [empresas, setEmpresas]     = useState<any[]>([])
  const [curriculos, setCurriculos] = useState<any[]>([])
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/pages', { params: { limit: 3, orderBy: 'created_at' } })
        .then(r => setEmpresas((r.data.pages || r.data || []).slice(0, 3)))
        .catch(() => {}),
      api.get('/users/search', { params: { limit: 3, orderBy: 'created_at', is_bot: false } })
        .then(r => setCurriculos((r.data.users || r.data || []).slice(0, 3)))
        .catch(() => {}),
    ]).finally(() => setLoading(false))
  }, [])

  return (
    <ScrollView style={rp.panel} contentContainerStyle={rp.scroll} showsVerticalScrollIndicator={false}>
      {loading ? (
        <ActivityIndicator color={PRIMARY} style={{ marginVertical: 20 }} />
      ) : (
        <>
          {/* Novas Empresas */}
          {empresas.length > 0 && (
            <View style={rp.section}>
              <Text style={rp.sectionTitle}>🏢 Novas Empresas</Text>
              {empresas.map(e => {
                const logoUrl = e.logo_url
                  ? (e.logo_url.startsWith('http') ? e.logo_url : RP_API + e.logo_url)
                  : null
                return (
                  <TouchableOpacity
                    key={e.id}
                    style={rp.empresaItem}
                    onPress={() => router.push(`/pagina/${e.id}` as any)}
                    activeOpacity={0.8}
                  >
                    {logoUrl
                      ? <Image source={{ uri: logoUrl }} style={rp.empresaLogo} />
                      : <View style={rp.empresaLogoFb}>
                          <Text style={rp.empresaLogoFbT}>{(e.nome || '?').charAt(0)}</Text>
                        </View>
                    }
                    <View style={{ flex: 1 }}>
                      <Text style={rp.empresaNome} numberOfLines={1}>{e.nome}</Text>
                      {e.categoria
                        ? <Text style={rp.empresaCat} numberOfLines={1}>{e.categoria}</Text>
                        : null}
                    </View>
                  </TouchableOpacity>
                )
              })}
              <TouchableOpacity onPress={() => router.push('/(tabs)/empresas' as any)}>
                <Text style={rp.verTodas}>Ver todas as empresas →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Novos Currículos */}
          {curriculos.length > 0 && (
            <View style={rp.section}>
              <Text style={rp.sectionTitle}>👤 Novos Currículos</Text>
              {curriculos.map(u => {
                const avatarUrl = u.avatar_url
                  ? (u.avatar_url.startsWith('http') ? u.avatar_url : RP_API + u.avatar_url)
                  : null
                return (
                  <TouchableOpacity
                    key={u.id}
                    style={rp.sugestaoItem}
                    onPress={() => router.push(`/usuario/${u.id}` as any)}
                    activeOpacity={0.8}
                  >
                    {avatarUrl
                      ? <Image source={{ uri: avatarUrl }} style={rp.sugestaoAv} />
                      : <View style={rp.sugestaoAv}>
                          <Text style={rp.sugestaoAvT}>{u.nome?.charAt(0) || '?'}</Text>
                        </View>
                    }
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={rp.sugestaoNome} numberOfLines={1}>{u.nome}</Text>
                      {u.tipo_profissional
                        ? <Text style={rp.sugestaoProf} numberOfLines={1}>{u.tipo_profissional}</Text>
                        : null}
                      {u.cidade
                        ? <Text style={rp.curricCidade} numberOfLines={1}>📍 {u.cidade}</Text>
                        : null}
                    </View>
                  </TouchableOpacity>
                )
              })}
              <TouchableOpacity onPress={() => router.push('/(tabs)/buscar' as any)}>
                <Text style={rp.verTodas}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </ScrollView>
  )
}

// ── Desktop Shell (wraps sidebar + content + right panel) ────────────────────

function DesktopShell() {
  const [collapsed, setCollapsed] = useState(false)
  const widthAnim = useRef(new Animated.Value(SIDEBAR_EXPANDED)).current

  const toggleSidebar = () => {
    const toValue = collapsed ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED
    Animated.timing(widthAnim, { toValue, duration: 240, useNativeDriver: false }).start()
    setCollapsed(c => !c)
  }

  return (
    <View style={{ flex: 1, flexDirection: 'column', backgroundColor: '#F0F8F4' }}>
      <DesktopTopBar collapsed={collapsed} onToggle={toggleSidebar} />
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <DesktopSidebar collapsed={collapsed} widthAnim={widthAnim} />
        <View style={{ flex: 1, overflow: 'hidden' as any }}>
          <Slot />
        </View>
        <View style={{ width: RIGHT_PANEL_WIDTH, borderLeftWidth: 1, borderLeftColor: '#D0E8DA', backgroundColor: '#fff' }}>
          <DesktopRightPanel />
        </View>
      </View>
    </View>
  )
}

// ── Mobile Tab Layout ──────────────────────────────────────────────────────────

function MobileTabLayout() {
  const { width } = useWindowDimensions()
  const hideBar   = width >= DESKTOP_BREAKPOINT

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: IC_ON,
      tabBarInactiveTintColor: IC_OFF,
      tabBarStyle: hideBar ? { display: 'none' } : {
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
      <Tabs.Screen name="feed"          options={{ title: 'Painel',        tabBarIcon: ({ color }) => <DashboardIcon color={color} /> }} />
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

// ── Root Layout export ─────────────────────────────────────────────────────────

export default function TabsLayout() {
  const { width } = useWindowDimensions()
  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT

  if (isDesktop) {
    return <DesktopShell />
  }

  return <MobileTabLayout />
}

// ── Styles: Desktop Top Bar ───────────────────────────────────────────────────

const tb = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PRIMARY,
    paddingHorizontal: 16,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  hamburgerBtn: { padding: 4 },
  logoText: { fontSize: 22, fontFamily: 'Poppins-ExtraBold', letterSpacing: -0.5 },
  iconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
  },
  plusT: { color: '#fff', fontSize: 22, fontWeight: '800', lineHeight: 26, marginTop: -2 },
  avatar: { width: 34, height: 34, borderRadius: 17 },
  avatarFb: { width: 34, height: 34, borderRadius: 17, backgroundColor: '#1A6FD4', justifyContent: 'center', alignItems: 'center' },
  avatarFbT: { color: '#fff', fontSize: 13, fontWeight: '800' },
})

// ── Styles: Desktop Sidebar ───────────────────────────────────────────────────

const ds = StyleSheet.create({
  sidebar: {
    backgroundColor: PRIMARY,
    overflow: 'hidden',
    borderRightWidth: 1,
    borderRightColor: 'rgba(0,0,0,0.08)',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  navItemCollapsed: {
    justifyContent: 'center',
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  navLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    flexShrink: 1,
  },
  navLabelActive: {
    color: '#fff',
  },
})

// ── Styles: Right Panel ───────────────────────────────────────────────────────

const rp = StyleSheet.create({
  panel: {
    flex: 1,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  profileCard: {
    backgroundColor: '#F0F8F4',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0E8DA',
    gap: 4,
  },
  profileAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: PRIMARY,
  },
  profileAvatarFb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  profileAvatarT: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0A1C14',
    textAlign: 'center',
  },
  profileProfissao: {
    fontSize: 12,
    color: '#4A7060',
    fontWeight: '600',
    textAlign: 'center',
  },
  profileLoc: {
    fontSize: 11,
    color: '#7A9E8E',
    textAlign: 'center',
  },
  profileLink: {
    marginTop: 8,
    backgroundColor: PRIMARY,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  profileLinkT: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3A6550',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  vagaItem: {
    backgroundColor: '#F0F8F4',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D0E8DA',
    gap: 2,
  },
  empresaItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#EEF7F2',
  },
  empresaLogo: { width: 36, height: 36, borderRadius: 8, flexShrink: 0 },
  empresaLogoFb: {
    width: 36, height: 36, borderRadius: 8,
    backgroundColor: PRIMARY + '20', justifyContent: 'center', alignItems: 'center', flexShrink: 0,
  },
  empresaLogoFbT: { fontSize: 16, fontWeight: '800', color: PRIMARY },
  empresaNome: { fontSize: 13, fontWeight: '700', color: '#0A1C14' },
  empresaCat: { fontSize: 11, color: '#7A9E8E', marginTop: 1, textTransform: 'capitalize' },
  curricCidade: { fontSize: 11, color: '#7A9E8E' },
  verTodas: {
    fontSize: 12,
    color: PRIMARY,
    fontWeight: '700',
    textAlign: 'right',
    marginTop: 4,
  },
  sugestaoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF7F2',
  },
  sugestaoAv: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  sugestaoAvT: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  sugestaoNome: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A1C14',
  },
  sugestaoProf: {
    fontSize: 11,
    color: '#7A9E8E',
    fontWeight: '600',
  },
})
