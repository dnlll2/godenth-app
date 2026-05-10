import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'

const MAX_CHARS = 500

export default function Sobre() {
  const { cadastroData, login } = useAuthStore()
  const [bio, setBio] = useState('')
  const [loading, setLoading] = useState(false)

  const finalizar = async () => {
    setLoading(true)
    try {
      await api.post('/auth/register', {
        nome: cadastroData.nome,
        email: cadastroData.email,
        password: cadastroData.senha,
        tipo_profissional: cadastroData.profissao?.label || 'dentista',
        cidade: cadastroData.cidade,
        estado: cadastroData.estado,
        bio,
      })
      await login(cadastroData.email!, cadastroData.senha!)
      router.replace('/(tabs)/feed')
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Text style={styles.back}>←</Text></TouchableOpacity>
        <Text style={styles.logo}><Text style={{ color: '#F5C800' }}>Go</Text><Text style={{ color: '#fff' }}>Denth</Text></Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={styles.progressRow}>
        {[1,2,3,4,5,6,7].map(i => <View key={i} style={[styles.bar, styles.barOn]} />)}
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Último passo!</Text>
        <Text style={styles.title}>Fale sobre{'\n'}você</Text>
        <Text style={styles.sub}>Escreva um resumo profissional — aparece no topo do seu perfil</Text>
        <View style={styles.inputBox}>
          <TextInput
            style={styles.textarea}
            placeholder="Ex: Cirurgião-Dentista com 8 anos de experiência em Implantodontia e Estética. Apaixonado por resultados naturais e atendimento humanizado. Atuo em São Paulo - SP."
            placeholderTextColor="#AECEBE"
            value={bio}
            onChangeText={t => t.length <= MAX_CHARS && setBio(t)}
            multiline
            numberOfLines={8}
            textAlignVertical="top"
          />
          <View style={styles.counter}>
            <Text style={[styles.counterText, bio.length > MAX_CHARS * 0.9 && { color: '#E53935' }]}>{bio.length}/{MAX_CHARS}</Text>
          </View>
        </View>
        <View style={styles.dicas}>
          <Text style={styles.dicasTitle}>💡 Dicas para um bom resumo:</Text>
          <Text style={styles.dica}>• Mencione anos de experiência</Text>
          <Text style={styles.dica}>• Cite suas principais especialidades</Text>
          <Text style={styles.dica}>• Fale do seu diferencial</Text>
          <Text style={styles.dica}>• Informe sua cidade de atuação</Text>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.btn} onPress={finalizar} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnT}>{bio.length > 0 ? '🚀 Criar minha conta' : 'Pular e criar conta →'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EEF7F2' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  logo: { fontSize: 22, fontWeight: '800' },
  progressRow: { flexDirection: 'row', gap: 4, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#007A6E' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#F5C800' },
  scroll: { padding: 20, paddingBottom: 100 },
  step: { fontSize: 11, fontWeight: '800', color: '#F5C800', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 24, lineHeight: 20 },
  inputBox: { backgroundColor: '#fff', borderRadius: 16, borderWidth: 2, borderColor: '#D0E8DA', overflow: 'hidden' },
  textarea: { padding: 16, fontSize: 15, color: '#0A1C14', minHeight: 180, lineHeight: 24 },
  counter: { paddingHorizontal: 16, paddingBottom: 12, alignItems: 'flex-end' },
  counterText: { fontSize: 12, color: '#7A9E8E', fontWeight: '600' },
  dicas: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginTop: 16, borderWidth: 1, borderColor: '#D0E8DA' },
  dicasTitle: { fontSize: 13, fontWeight: '800', color: '#0A1C14', marginBottom: 10 },
  dica: { fontSize: 12, color: '#7A9E8E', lineHeight: 22 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
