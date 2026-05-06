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
