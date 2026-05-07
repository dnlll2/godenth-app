import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

const API_URL = 'https://godenth-api-production.up.railway.app'

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
