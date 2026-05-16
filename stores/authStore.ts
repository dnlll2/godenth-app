import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import api, { setAuthToken } from '../services/api'

interface User {
  id: number
  nome: string
  email: string
  tipo_profissional: string
  plano: string
  disponibilidade?: string
  embaixador?: boolean
  cidade?: string
  estado?: string
  bio?: string
  especialidade?: string
  especialidades?: string[]
  habilidades?: string[]
  cargos_extras?: any[]
  avatar_url?: string
  cor_tema?: string
  celular?: string
  data_nascimento?: string
  privacidade?: { ocultar_email?: boolean; ocultar_celular?: boolean; ocultar_idade?: boolean }
  instagram?: string
  formacao?: any[]
  experiencia?: any[]
}

interface CadastroData {
  profissao?: any
  extras?: any[]
  especialidades?: string[]
  habilidades?: string[]
  academico?: { [key: string]: any }
  nome?: string
  email?: string
  senha?: string
  cidade?: string
  estado?: string
  bio?: string
}

interface AuthState {
  cadastroData: CadastroData
  setCadastroData: (data: Partial<CadastroData>) => void
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
  cadastroData: (() => {
    try {
      const saved = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('godenth_cadastro') : null
      return saved ? JSON.parse(saved) : {}
    } catch { return {} }
  })(),
  setCadastroData: (data) => set(state => {
    const novo = { ...state.cadastroData, ...data }
    try { if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('godenth_cadastro', JSON.stringify(novo)) } catch {}
    return { cadastroData: novo }
  }),

  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password })
    const { user, token } = response.data
    setAuthToken(token)
    await AsyncStorage.setItem('godenth_token', token)
    await AsyncStorage.setItem('godenth_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  register: async (data) => {
    const response = await api.post('/auth/register', data)
    const { user, token } = response.data
    setAuthToken(token)
    await AsyncStorage.setItem('godenth_token', token)
    await AsyncStorage.setItem('godenth_user', JSON.stringify(user))
    set({ user, token, isAuthenticated: true })
  },

  logout: async () => {
    setAuthToken(null)
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
        setAuthToken(token)
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
