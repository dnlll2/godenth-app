import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'https://godenth-api-production.up.railway.app'

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
})

// Token em memória — atualizado pelo authStore após login/logout/loadUser
let _token: string | null = null

export const setAuthToken = (token: string | null) => {
  _token = token
}

// Interceptor — usa token em memória (síncrono, confiável no web)
api.interceptors.request.use((config) => {
  console.log('[api] request:', config.method?.toUpperCase(), config.url, '| token presente:', !!_token)
  if (_token) {
    config.headers.Authorization = `Bearer ${_token}`
  } else {
    console.warn('[api] token ausente')
  }
  return config
})

// Interceptor — limpa token em memória e AsyncStorage no 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      _token = null
      await AsyncStorage.removeItem('godenth_token')
      await AsyncStorage.removeItem('godenth_user')
    }
    return Promise.reject(error)
  }
)

export default api
