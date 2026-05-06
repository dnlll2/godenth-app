#!/bin/bash
echo "🚀 GoDenth App — Setup completo..."

# ── CONSTANTS/COLORS ──────────────────────────────────
cat > constants/colors.ts << 'ENDOFFILE'
export const Colors = {
  primary: '#00A880',
  primary2: '#00886A',
  gold: '#C49800',
  goldLight: 'rgba(196,152,0,0.10)',
  bg: '#F0F8F4',
  white: '#FFFFFF',
  surface: '#E6F5EE',
  text: '#0A1C14',
  text2: '#3A6550',
  text3: '#7A9E8E',
  border: '#D0E8DA',
  border2: '#AECEBE',
  red: '#E53935',
  green: '#059669',

  // Tipos de profissional
  dentista: '#1A6FD4',
  protetico: '#7B3FC4',
  clinica: '#00A880',
  laboratorio: '#7B3FC4',
  fabricante: '#D4600A',
  servicos: '#334155',
  ensino: '#0891B2',
  marketing: '#D4186A',
  estrutura: '#92400E',
  gestao: '#334155',
}

export const PlanColors = {
  gratuito: Colors.text3,
  premium: Colors.primary,
  black: Colors.gold,
}
ENDOFFILE
echo "✅ constants/colors.ts"

# ── SERVICES/API ──────────────────────────────────────
cat > services/api.ts << 'ENDOFFILE'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// Interceptor — adiciona token JWT em todas as requisições
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('godenth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor — trata erros globais
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('godenth_token')
      await AsyncStorage.removeItem('godenth_user')
    }
    return Promise.reject(error)
  }
)

export default api
ENDOFFILE
echo "✅ services/api.ts"

# ── STORES/AUTHSTORE ──────────────────────────────────
cat > stores/authStore.ts << 'ENDOFFILE'
import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api from '../services/api'

interface User {
  id: number
  nome: string
  email: string
  tipo_profissional: string
  plano: string
  disponibilidade: string
  cidade?: string
  estado?: string
  bio?: string
  especialidade?: string
  avatar_url?: string
  cor_tema?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => Promise<void>
  loadUser: () => Promise<void>
  updateUser: (data: Partial<User>) => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = response.data
    await AsyncStorage.setItem('godenth_token', token)
    await AsyncStorage.setItem('godenth_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data)
    const { user, token } = response.data
    await AsyncStorage.setItem('godenth_token', token)
    await AsyncStorage.setItem('godenth_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: async () => {
    await AsyncStorage.removeItem('godenth_token')
    await AsyncStorage.removeItem('godenth_user')
    set({ user: null, token: null, isAuthenticated: false })
  },

  loadUser: async () => {
    try {
      const token = await AsyncStorage.getItem('godenth_token')
      const userStr = await AsyncStorage.getItem('godenth_user')
      if (token && userStr) {
        const user = JSON.parse(userStr)
        set({ user, token, isAuthenticated: true, isLoading: false })
      } else {
        set({ isLoading: false })
      }
    } catch {
      set({ isLoading: false })
    }
  },

  updateUser: (data) => {
    const current = get().user
    if (current) {
      const updated = { ...current, ...data }
      set({ user: updated })
      AsyncStorage.setItem('godenth_user', JSON.stringify(updated))
    }
  },
}))
ENDOFFILE
echo "✅ stores/authStore.ts"

# ── APP/_LAYOUT ───────────────────────────────────────
cat > app/_layout.tsx << 'ENDOFFILE'
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
ENDOFFILE
echo "✅ app/_layout.tsx"

# ── APP/INDEX ─────────────────────────────────────────
cat > app/index.tsx << 'ENDOFFILE'
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
ENDOFFILE
echo "✅ app/index.tsx"

# ── APP/(AUTH)/LOGIN ──────────────────────────────────
cat > "app/(auth)/login.tsx" << 'ENDOFFILE'
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Atenção', 'Preencha e-mail e senha')
    setLoading(true)
    try {
      await login(email, password)
      router.replace('/(tabs)/feed')
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}><Text style={styles.go}>Go</Text><Text style={styles.denth}>Denth</Text></Text>
          <Text style={styles.tagline}>Network profissional da odontologia</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.title}>Entrar</Text>

          <Text style={styles.label}>E-mail</Text>
          <TextInput
            style={styles.input}
            placeholder="seu@email.com.br"
            placeholderTextColor={Colors.text3}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Senha</Text>
          <TextInput
            style={styles.input}
            placeholder="Sua senha"
            placeholderTextColor={Colors.text3}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity style={styles.btn} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Entrar →</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/cadastro')}>
            <Text style={styles.linkText}>Não tem conta? <Text style={{ color: Colors.primary, fontWeight: '800' }}>Criar conta grátis</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C14' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 48, fontWeight: '800', letterSpacing: -2 },
  go: { color: Colors.gold },
  denth: { color: Colors.primary },
  tagline: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 6 },
  form: { backgroundColor: Colors.white, borderRadius: 20, padding: 24 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text2, marginBottom: 6 },
  input: {
    backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, padding: 14, fontSize: 15, color: Colors.text, marginBottom: 14
  },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 13, padding: 15,
    alignItems: 'center', marginTop: 6,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  link: { alignItems: 'center', marginTop: 16 },
  linkText: { fontSize: 14, color: Colors.text3 },
})
ENDOFFILE
echo "✅ app/(auth)/login.tsx"

# ── APP/(AUTH)/CADASTRO ───────────────────────────────
cat > "app/(auth)/cadastro.tsx" << 'ENDOFFILE'
import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ScrollView, ActivityIndicator
} from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'

const TIPOS = [
  { key: 'dentista', label: '🦷 Dentista / Especialista', cor: Colors.dentista },
  { key: 'protetico', label: '🔬 Técnico em Prótese', cor: Colors.protetico },
  { key: 'clinica', label: '🏥 Clínica / Consultório', cor: Colors.clinica },
  { key: 'laboratorio', label: '🏭 Laboratório', cor: Colors.laboratorio },
  { key: 'gestao', label: '⚙️ Gestão / Administração', cor: Colors.gestao },
  { key: 'marketing', label: '📢 Marketing', cor: Colors.marketing },
]

export default function Cadastro() {
  const [step, setStep] = useState(0)
  const [tipo, setTipo] = useState('')
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuthStore()

  const handleRegister = async () => {
    if (!nome || !email || !password) return Alert.alert('Atenção', 'Preencha todos os campos')
    setLoading(true)
    try {
      await register({ nome, email, password, tipo_profissional: tipo, cidade, estado })
      router.replace('/(tabs)/feed')
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : router.back()} style={styles.back}>
        <Text style={styles.backText}>← Voltar</Text>
      </TouchableOpacity>

      <Text style={styles.logo}><Text style={styles.go}>Go</Text><Text style={styles.denth}>Denth</Text></Text>

      <View style={styles.progress}>
        {[0,1,2].map(i => (
          <View key={i} style={[styles.bar, i < step ? styles.barDone : i === step ? styles.barCur : {}]} />
        ))}
      </View>

      {step === 0 && (
        <View style={styles.card}>
          <Text style={styles.stepLabel}>Passo 1 de 3</Text>
          <Text style={styles.title}>Qual é sua área?</Text>
          {TIPOS.map(t => (
            <TouchableOpacity key={t.key} style={[styles.opt, tipo === t.key && { borderColor: t.cor, backgroundColor: t.cor + '15' }]}
              onPress={() => setTipo(t.key)}>
              <Text style={[styles.optText, tipo === t.key && { color: t.cor }]}>{t.label}</Text>
              {tipo === t.key && <Text style={{ color: t.cor, fontWeight: '900' }}>✓</Text>}
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={[styles.btn, !tipo && styles.btnDisabled]} onPress={() => tipo && setStep(1)} disabled={!tipo}>
            <Text style={styles.btnText}>Continuar →</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.stepLabel}>Passo 2 de 3</Text>
          <Text style={styles.title}>Seus dados</Text>
          <Text style={styles.label}>Nome completo *</Text>
          <TextInput style={styles.input} placeholder="Dr. Rafael Costa" placeholderTextColor={Colors.text3} value={nome} onChangeText={setNome} />
          <Text style={styles.label}>E-mail *</Text>
          <TextInput style={styles.input} placeholder="seu@email.com.br" placeholderTextColor={Colors.text3} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
          <Text style={styles.label}>Senha *</Text>
          <TextInput style={styles.input} placeholder="Mínimo 8 caracteres" placeholderTextColor={Colors.text3} value={password} onChangeText={setPassword} secureTextEntry />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Cidade</Text>
              <TextInput style={styles.input} placeholder="São Paulo" placeholderTextColor={Colors.text3} value={cidade} onChangeText={setCidade} />
            </View>
            <View style={{ width: 80 }}>
              <Text style={styles.label}>Estado</Text>
              <TextInput style={styles.input} placeholder="SP" placeholderTextColor={Colors.text3} value={estado} onChangeText={setEstado} maxLength={2} autoCapitalize="characters" />
            </View>
          </View>
          <TouchableOpacity style={styles.btn} onPress={() => setStep(2)}>
            <Text style={styles.btnText}>Continuar →</Text>
          </TouchableOpacity>
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.stepLabel}>Passo 3 de 3</Text>
          <Text style={styles.title}>Quase lá! 🎉</Text>
          <Text style={styles.summary}>Nome: <Text style={{ fontWeight: '700', color: Colors.text }}>{nome}</Text></Text>
          <Text style={styles.summary}>E-mail: <Text style={{ fontWeight: '700', color: Colors.text }}>{email}</Text></Text>
          <Text style={styles.summary}>Área: <Text style={{ fontWeight: '700', color: Colors.text }}>{TIPOS.find(t => t.key === tipo)?.label}</Text></Text>
          {cidade ? <Text style={styles.summary}>Local: <Text style={{ fontWeight: '700', color: Colors.text }}>{cidade} · {estado}</Text></Text> : null}
          <TouchableOpacity style={[styles.btn, styles.btnGold]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>🚀 Criar minha conta</Text>}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C14' },
  scroll: { padding: 20, paddingBottom: 40 },
  back: { marginBottom: 16 },
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 },
  logo: { fontSize: 36, fontWeight: '800', textAlign: 'center', marginBottom: 20 },
  go: { color: Colors.gold }, denth: { color: Colors.primary },
  progress: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)' },
  barDone: { backgroundColor: Colors.primary },
  barCur: { backgroundColor: Colors.gold },
  card: { backgroundColor: Colors.white, borderRadius: 20, padding: 22 },
  stepLabel: { fontSize: 11, fontWeight: '800', color: Colors.primary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 6 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 18 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.text2, marginBottom: 6 },
  input: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 13, fontSize: 14, color: Colors.text, marginBottom: 13 },
  opt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.bg, borderWidth: 2, borderColor: Colors.border, borderRadius: 13, padding: 14, marginBottom: 9 },
  optText: { fontSize: 14, fontWeight: '600', color: Colors.text },
  btn: { backgroundColor: Colors.primary, borderRadius: 13, padding: 15, alignItems: 'center', marginTop: 8 },
  btnGold: { backgroundColor: Colors.gold },
  btnDisabled: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  summary: { fontSize: 13, color: Colors.text3, marginBottom: 8 },
})
ENDOFFILE
echo "✅ app/(auth)/cadastro.tsx"

# ── APP/(TABS)/_LAYOUT ────────────────────────────────
cat > "app/(tabs)/_layout.tsx" << 'ENDOFFILE'
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
ENDOFFILE
echo "✅ app/(tabs)/_layout.tsx"

# ── APP/(TABS)/FEED ───────────────────────────────────
cat > "app/(tabs)/feed.tsx" << 'ENDOFFILE'
import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'
import { Colors } from '../../constants/colors'
import { useAuthStore } from '../../stores/authStore'

const FILTROS = ['Todos', '💼 Vagas', '🙋 Disponível', '🤝 Parcerias', '🔬 Serviços', '🎓 Cursos']

export default function Feed() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filtro, setFiltro] = useState('Todos')
  const { user } = useAuthStore()

  const loadFeed = async () => {
    try {
      const res = await api.get('/posts')
      setPosts(res.data.posts || [])
    } catch (err) {
      console.log('Erro ao carregar feed:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { loadFeed() }, [])

  const renderPost = ({ item }: any) => (
    <View style={styles.card}>
      <View style={[styles.stripe, { backgroundColor: Colors.primary }]} />
      <View style={styles.cardBody}>
        <Text style={styles.postType}>{item.tipo_post?.toUpperCase()}</Text>
        <Text style={styles.postAuthor}>{item.page_nome || item.author_nome}</Text>
        <Text style={styles.postCity}>{item.cidade} · {item.estado}</Text>
        {item.data_json && (
          <View style={styles.postData}>
            {item.data_json.cargo && <Text style={styles.postTitle}>{item.data_json.cargo}</Text>}
            {item.data_json.salario && <Text style={styles.postSalary}>{item.data_json.salario}</Text>}
            {item.data_json.descricao && <Text style={styles.postDesc}>{item.data_json.descricao}</Text>}
          </View>
        )}
      </View>
    </View>
  )

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} size="large" /></View>

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}><Text style={{ color: Colors.gold }}>Go</Text><Text style={{ color: Colors.primary }}>Denth</Text></Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => router.push('/notificacoes')}><Text>🔔</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/perfil')}>
            <View style={[styles.avatar, { backgroundColor: Colors.dentista }]}><Text style={styles.avatarText}>{user?.nome?.charAt(0) || 'U'}</Text></View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filtros */}
      <FlatList
        data={FILTROS}
        horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtros}
        keyExtractor={i => i}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.filtro, filtro === item && styles.filtroOn]} onPress={() => setFiltro(item)}>
            <Text style={[styles.filtroText, filtro === item && styles.filtroTextOn]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={(item: any) => item.id?.toString()}
        renderItem={renderPost}
        contentContainerStyle={posts.length === 0 ? styles.empty : styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFeed() }} tintColor={Colors.primary} />}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Feed vazio por enquanto</Text>
            <Text style={styles.emptySub}>Publique algo ou siga páginas de empresa</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  logo: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  filtros: { paddingHorizontal: 14, paddingVertical: 10, gap: 7, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  filtro: { backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 6 },
  filtroOn: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filtroText: { fontSize: 12, fontWeight: '700', color: Colors.text2 },
  filtroTextOn: { color: '#fff' },
  list: { padding: 14, paddingBottom: 80, gap: 12 },
  empty: { flex: 1 },
  card: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  stripe: { height: 4 },
  cardBody: { padding: 14 },
  postType: { fontSize: 9, fontWeight: '800', color: Colors.primary, letterSpacing: 1, marginBottom: 8 },
  postAuthor: { fontSize: 15, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  postCity: { fontSize: 11, color: Colors.text3, marginBottom: 8 },
  postData: { gap: 3 },
  postTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  postSalary: { fontSize: 15, fontWeight: '800', color: Colors.primary },
  postDesc: { fontSize: 13, color: Colors.text2, lineHeight: 20 },
  emptyBox: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 },
})
ENDOFFILE
echo "✅ app/(tabs)/feed.tsx"

# ── APP/(TABS)/BUSCAR ─────────────────────────────────
cat > "app/(tabs)/buscar.tsx" << 'ENDOFFILE'
import { useState } from 'react'
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

export default function Buscar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const search = async () => {
    if (!query.trim()) return
    setLoading(true)
    setSearched(true)
    try {
      const [users, pages, vagas] = await Promise.all([
        api.get(`/users/search?q=${query}`),
        api.get(`/pages/search?q=${query}`),
        api.get(`/vagas?cargo=${query}`),
      ])
      const combined = [
        ...users.data.users.map((u: any) => ({ ...u, _type: 'profissional' })),
        ...pages.data.pages.map((p: any) => ({ ...p, _type: 'empresa' })),
        ...vagas.data.vagas.map((v: any) => ({ ...v, _type: 'vaga' })),
      ]
      setResults(combined)
    } catch (err) {
      console.log('Erro busca:', err)
    } finally {
      setLoading(false)
    }
  }

  const renderItem = ({ item }: any) => (
    <TouchableOpacity style={styles.card}>
      <View style={[styles.avatar, { backgroundColor: item._type === 'profissional' ? Colors.dentista : Colors.primary }]}>
        <Text style={styles.avatarText}>{item._type === 'vaga' ? '💼' : (item.nome?.charAt(0) || '?')}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.nome || item.cargo}</Text>
        <Text style={styles.sub}>
          {item._type === 'profissional' ? `${item.tipo_profissional} · ${item.cidade}` :
           item._type === 'empresa' ? `${item.categoria} · ${item.cidade}` :
           `${item.contrato} · ${item.salario}`}
        </Text>
        <Text style={[styles.badge, { color: item._type === 'vaga' ? Colors.gold : Colors.primary }]}>
          {item._type === 'profissional' ? '👤 Profissional' : item._type === 'empresa' ? '🏢 Empresa' : '💼 Vaga'}
        </Text>
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar</Text>
        <View style={styles.searchBar}>
          <Text style={{ fontSize: 16, color: Colors.text3 }}>🔍</Text>
          <TextInput
            style={styles.input}
            placeholder="Dentista, protético, clínica, vaga…"
            placeholderTextColor={Colors.text3}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={search} style={styles.searchBtn}>
              <Text style={styles.searchBtnText}>Buscar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />}

      {searched && !loading && (
        <Text style={styles.count}>{results.length} resultados para "{query}"</Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item, i) => `${item._type}-${item.id}-${i}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          !searched ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyIcon}>🔍</Text>
              <Text style={styles.emptyTitle}>Busque profissionais,{'\n'}empresas ou vagas</Text>
            </View>
          ) : null
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { backgroundColor: Colors.white, padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 12 },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border2, borderRadius: 13, paddingHorizontal: 13, paddingVertical: 10 },
  input: { flex: 1, fontSize: 14, color: Colors.text },
  searchBtn: { backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  searchBtnText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  count: { fontSize: 13, fontWeight: '700', color: Colors.text2, paddingHorizontal: 14, paddingTop: 12 },
  list: { padding: 14, gap: 10, paddingBottom: 80 },
  card: { backgroundColor: Colors.white, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: Colors.border },
  avatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  sub: { fontSize: 11, color: Colors.text3, marginBottom: 4 },
  badge: { fontSize: 10, fontWeight: '700' },
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 14 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text2, textAlign: 'center', lineHeight: 24 },
})
ENDOFFILE
echo "✅ app/(tabs)/buscar.tsx"

# ── APP/(TABS)/PUBLICAR ───────────────────────────────
cat > "app/(tabs)/publicar.tsx" << 'ENDOFFILE'
import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator } from 'react-native'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

const TIPOS = [
  { key: 'disponibilidade', label: '🙋 Estou disponível', desc: 'Apareça no feed para recrutadores', pessoal: true },
  { key: 'parceria', label: '🤝 Busco parceria', desc: 'Lab, clínica ou fornecedor', pessoal: true },
]

export default function Publicar() {
  const [tipo, setTipo] = useState('disponibilidade')
  const [descricao, setDescricao] = useState('')
  const [especialidade, setEspecialidade] = useState('')
  const [cidade, setCidade] = useState('')
  const [loading, setLoading] = useState(false)

  const handlePublish = async () => {
    if (!especialidade) return Alert.alert('Atenção', 'Preencha a especialidade')
    setLoading(true)
    try {
      await api.post('/posts', {
        tipo_post: tipo,
        data_json: { descricao, especialidade, cidade }
      })
      Alert.alert('✅ Publicado!', 'Seu post apareceu no feed')
      setDescricao('')
      setEspecialidade('')
      setCidade('')
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao publicar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      <Text style={styles.title}>Nova publicação</Text>
      <Text style={styles.sub}>Feed limpo e profissional — campos fixos</Text>

      <View style={styles.info}>
        <Text style={styles.infoIcon}>🔒</Text>
        <Text style={styles.infoText}>Vagas, serviços e cursos só por <Text style={{ fontWeight: '800' }}>Páginas de Empresa</Text></Text>
      </View>

      <Text style={styles.sectionTitle}>Tipo de publicação</Text>
      {TIPOS.map(t => (
        <TouchableOpacity key={t.key} style={[styles.opt, tipo === t.key && styles.optOn]} onPress={() => setTipo(t.key)}>
          <Text style={styles.optLabel}>{t.label}</Text>
          <Text style={styles.optDesc}>{t.desc}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.sectionTitle}>Detalhes</Text>
      <Text style={styles.label}>Especialidade *</Text>
      <TextInput style={styles.input} placeholder="Ex: Implantodontia, Prótese…" placeholderTextColor={Colors.text3} value={especialidade} onChangeText={setEspecialidade} />
      <Text style={styles.label}>Descrição</Text>
      <TextInput style={[styles.input, styles.textarea]} placeholder="Conte mais sobre você e o que busca…" placeholderTextColor={Colors.text3} value={descricao} onChangeText={setDescricao} multiline numberOfLines={4} textAlignVertical="top" />
      <Text style={styles.label}>Cidade</Text>
      <TextInput style={styles.input} placeholder="São Paulo · SP" placeholderTextColor={Colors.text3} value={cidade} onChangeText={setCidade} />

      <TouchableOpacity style={styles.btn} onPress={handlePublish} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Publicar no Feed →</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { padding: 16, paddingBottom: 80 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 4 },
  sub: { fontSize: 13, color: Colors.text3, marginBottom: 16 },
  info: { flexDirection: 'row', gap: 10, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 13, padding: 13, marginBottom: 20 },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: 12, color: Colors.text2, lineHeight: 18 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 },
  opt: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border, borderRadius: 14, padding: 14, marginBottom: 9 },
  optOn: { borderColor: Colors.primary, backgroundColor: 'rgba(0,168,128,0.06)' },
  optLabel: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  optDesc: { fontSize: 11, color: Colors.text3 },
  label: { fontSize: 12, fontWeight: '700', color: Colors.text2, marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 12, padding: 13, fontSize: 14, color: Colors.text, marginBottom: 13 },
  textarea: { height: 100 },
  btn: { backgroundColor: Colors.primary, borderRadius: 13, padding: 15, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
ENDOFFILE
echo "✅ app/(tabs)/publicar.tsx"

# ── APP/(TABS)/NOTIFICACOES ───────────────────────────
cat > "app/(tabs)/notificacoes.tsx" << 'ENDOFFILE'
import { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

export default function Notificacoes() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/notifications')
      setNotifications(res.data.notifications || [])
    } catch (err) { console.log(err) }
    finally { setLoading(false); setRefreshing(false) }
  }

  const markRead = async (id: number) => {
    await api.put(`/notifications/${id}/read`)
    load()
  }

  const markAll = async () => {
    await api.put('/notifications/all/read')
    load()
  }

  useEffect(() => { load() }, [])

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Notificações</Text>
          <Text style={styles.sub}>{notifications.filter((n: any) => !n.read_at).length} não lidas</Text>
        </View>
        <TouchableOpacity style={styles.markBtn} onPress={markAll}>
          <Text style={styles.markBtnText}>✓ Marcar lidas</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item: any) => item.id.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor={Colors.primary} />}
        renderItem={({ item }: any) => (
          <TouchableOpacity style={[styles.item, !item.read_at && styles.itemUnread]} onPress={() => markRead(item.id)}>
            {!item.read_at && <View style={styles.unreadBar} />}
            <View style={styles.itemIcon}><Text style={{ fontSize: 20 }}>🔔</Text></View>
            <View style={styles.itemBody}>
              <Text style={styles.itemTipo}>{item.tipo}</Text>
              <Text style={styles.itemTime}>{new Date(item.created_at).toLocaleDateString('pt-BR')}</Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={notifications.length === 0 ? styles.empty : {}}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={{ fontSize: 48, marginBottom: 14 }}>🔔</Text>
            <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text },
  sub: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  markBtn: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 6 },
  markBtnText: { fontSize: 12, fontWeight: '700', color: Colors.primary },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, position: 'relative' },
  itemUnread: { backgroundColor: '#FAFFFE' },
  unreadBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3, backgroundColor: Colors.primary },
  itemIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.surface, justifyContent: 'center', alignItems: 'center' },
  itemBody: { flex: 1 },
  itemTipo: { fontSize: 13, fontWeight: '700', color: Colors.text },
  itemTime: { fontSize: 11, color: Colors.text3, marginTop: 2 },
  empty: { flex: 1 },
  emptyBox: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.text2 },
})
ENDOFFILE
echo "✅ app/(tabs)/notificacoes.tsx"

# ── APP/(TABS)/PERFIL ─────────────────────────────────
cat > "app/(tabs)/perfil.tsx" << 'ENDOFFILE'
import { useEffect, useState } from 'react'
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import api from '../../services/api'
import { useAuthStore } from '../../stores/authStore'
import { Colors } from '../../constants/colors'

export default function Perfil() {
  const { user, logout } = useAuthStore()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me')
      setProfile(res.data)
    } catch (err) { console.log(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { loadProfile() }, [])

  const handleLogout = () => {
    Alert.alert('Sair', 'Deseja sair da conta?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login') } }
    ])
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={Colors.primary} /></View>

  const tipoCor = Colors[profile?.tipo_profissional as keyof typeof Colors] as string || Colors.primary

  return (
    <ScrollView style={styles.container}>
      {/* Cover */}
      <View style={[styles.cover, { backgroundColor: tipoCor + '30' }]} />

      {/* Avatar */}
      <View style={styles.avatarRow}>
        <View style={[styles.avatar, { backgroundColor: tipoCor }]}>
          <Text style={styles.avatarText}>{profile?.nome?.charAt(0) || 'U'}</Text>
        </View>
        <TouchableOpacity style={styles.editBtn}><Text style={styles.editBtnText}>Editar perfil</Text></TouchableOpacity>
      </View>

      <View style={styles.main}>
        <Text style={styles.name}>{profile?.nome}</Text>
        <Text style={styles.role}>{profile?.tipo_profissional} {profile?.cro ? `· ${profile.cro} ✓` : ''}</Text>
        {profile?.cidade && <Text style={styles.loc}>📍 {profile.cidade} · {profile.estado}</Text>}

        <View style={styles.badges}>
          <View style={[styles.badge, { backgroundColor: tipoCor + '15', borderColor: tipoCor + '40' }]}>
            <Text style={[styles.badgeText, { color: tipoCor }]}>{profile?.tipo_profissional}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: Colors.goldLight, borderColor: Colors.gold + '40' }]}>
            <Text style={[styles.badgeText, { color: Colors.gold }]}>⭐ {profile?.plano}</Text>
          </View>
        </View>

        {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
      </View>

      {/* Stats */}
      <View style={styles.stats}>
        <View style={styles.stat}><Text style={[styles.statN, { color: tipoCor }]}>0</Text><Text style={styles.statL}>Conexões</Text></View>
        <View style={styles.stat}><Text style={[styles.statN, { color: tipoCor }]}>{profile?.anos_experiencia || 0}</Text><Text style={styles.statL}>Anos exp.</Text></View>
        <View style={styles.stat}><Text style={[styles.statN, { color: tipoCor }]}>0</Text><Text style={styles.statL}>Visitas</Text></View>
      </View>

      {/* Especialidade */}
      {profile?.especialidade && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎯 Especialidade</Text>
          <Text style={styles.sectionText}>{profile.especialidade}</Text>
        </View>
      )}

      {/* Ações */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>🏢</Text>
          <Text style={styles.actionText}>Minhas páginas</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>📁</Text>
          <Text style={styles.actionText}>Minhas candidaturas</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionIcon}>⚙️</Text>
          <Text style={styles.actionText}>Configurações</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { borderColor: Colors.red + '30' }]} onPress={handleLogout}>
          <Text style={styles.actionIcon}>🚪</Text>
          <Text style={[styles.actionText, { color: Colors.red }]}>Sair da conta</Text>
          <Text style={styles.actionArrow}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cover: { height: 110 },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', paddingHorizontal: 16, marginTop: -32, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: Colors.white },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  editBtn: { backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8 },
  editBtnText: { fontSize: 13, fontWeight: '800', color: Colors.primary },
  main: { paddingHorizontal: 16, marginBottom: 4 },
  name: { fontSize: 22, fontWeight: '800', color: Colors.text },
  role: { fontSize: 13, color: Colors.text2, marginTop: 3 },
  loc: { fontSize: 12, color: Colors.text3, marginTop: 2 },
  badges: { flexDirection: 'row', gap: 7, marginTop: 10, flexWrap: 'wrap' },
  badge: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 11, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '800' },
  bio: { fontSize: 13, color: Colors.text2, lineHeight: 20, marginTop: 12 },
  stats: { flexDirection: 'row', backgroundColor: Colors.surface, marginTop: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRightWidth: 1, borderRightColor: Colors.border },
  statN: { fontSize: 20, fontWeight: '800' },
  statL: { fontSize: 10, color: Colors.text3, marginTop: 2, fontWeight: '600' },
  section: { margin: 16, backgroundColor: Colors.white, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: Colors.border },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: Colors.text2, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 },
  sectionText: { fontSize: 14, color: Colors.text, fontWeight: '600' },
  actions: { margin: 16, backgroundColor: Colors.white, borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, borderBottomWidth: 1, borderBottomColor: Colors.border },
  actionIcon: { fontSize: 19, width: 28 },
  actionText: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.text },
  actionArrow: { fontSize: 18, color: Colors.text3 },
})
ENDOFFILE
echo "✅ app/(tabs)/perfil.tsx"

echo ""
echo "🎉 App setup completo!"
echo "Rode: npx expo start --web"
