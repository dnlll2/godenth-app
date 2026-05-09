import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useAuthStore } from '../../stores/authStore'
import api from '../../services/api'

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export default function Cadastro3() {
  const { profissao, extras } = useLocalSearchParams<{ profissao: string, extras: string }>()
  const profissaoObj = JSON.parse(profissao || '{}')
  const extrasArr = JSON.parse(extras || '[]')

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuthStore()

  const handleCadastro = async () => {
    if (!nome || !email || !senha) return Alert.alert('Atenção', 'Preencha nome, email e senha')
    if (senha.length < 6) return Alert.alert('Atenção', 'Senha deve ter pelo menos 6 caracteres')

    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        nome,
        email,
        password: senha,
        tipo_profissional: profissaoObj.label || 'dentista',
        cidade,
        estado,
      })

      const { token } = res.data
      await login(email, senha)
      router.replace('/(tabs)/feed')
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Erro ao cadastrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.logo}>
          <Text style={{ color: '#F5C800' }}>Go</Text>
          <Text style={{ color: '#fff' }}>Denth</Text>
        </Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.progressRow}>
        <View style={[styles.bar, styles.barOn]} />
        <View style={[styles.bar, styles.barOn]} />
        <View style={[styles.bar, styles.barOn]} />
        <View style={styles.bar} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.step}>Passo 3 de 4</Text>
        <Text style={styles.title}>Seus dados{'\n'}pessoais</Text>
        <Text style={styles.sub}>Essas informações formam seu currículo profissional</Text>

        <View style={[styles.profCard, { borderColor: profissaoObj.cor || '#00A880' }]}>
          <View style={[styles.profDot, { backgroundColor: profissaoObj.cor || '#00A880' }]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.profLabel}>{profissaoObj.label}</Text>
            {extrasArr.length > 0 && (
              <Text style={styles.profExtras}>+{extrasArr.length} cargo{extrasArr.length > 1 ? 's' : ''} adicional{extrasArr.length > 1 ? 'is' : ''}</Text>
            )}
          </View>
        </View>

        <Text style={styles.label}>Nome completo *</Text>
        <TextInput
          style={styles.input}
          placeholder="Seu nome completo"
          placeholderTextColor="#AECEBE"
          value={nome}
          onChangeText={setNome}
        />

        <Text style={styles.label}>E-mail *</Text>
        <TextInput
          style={styles.input}
          placeholder="seu@email.com.br"
          placeholderTextColor="#AECEBE"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Senha *</Text>
        <TextInput
          style={styles.input}
          placeholder="Mínimo 6 caracteres"
          placeholderTextColor="#AECEBE"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput
              style={styles.input}
              placeholder="São Paulo"
              placeholderTextColor="#AECEBE"
              value={cidade}
              onChangeText={setCidade}
            />
          </View>
          <View style={{ width: 90 }}>
            <Text style={styles.label}>Estado</Text>
            <TextInput
              style={styles.input}
              placeholder="SP"
              placeholderTextColor="#AECEBE"
              value={estado}
              onChangeText={t => setEstado(t.toUpperCase())}
              maxLength={2}
              autoCapitalize="characters"
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🔒</Text>
          <Text style={styles.infoText}>Seus dados são protegidos e nunca compartilhados sem sua permissão</Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.btn, (!nome || !email || !senha) && styles.btnOff]}
          disabled={!nome || !email || !senha || loading}
          onPress={handleCadastro}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnT}>Criar minha conta →</Text>}
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
  progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#007A6E' },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' },
  barOn: { backgroundColor: '#F5C800' },
  scroll: { padding: 20, paddingBottom: 100 },
  step: { fontSize: 11, fontWeight: '800', color: '#00A880', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 },
  title: { fontSize: 28, fontWeight: '800', color: '#0A1C14', lineHeight: 34, marginBottom: 8 },
  sub: { fontSize: 13, color: '#7A9E8E', marginBottom: 20 },
  profCard: { backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 2, flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  profDot: { width: 10, height: 10, borderRadius: 5 },
  profLabel: { fontSize: 14, fontWeight: '800', color: '#0A1C14' },
  profExtras: { fontSize: 11, color: '#7A9E8E', marginTop: 2 },
  label: { fontSize: 12, fontWeight: '700', color: '#3A6550', marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D0E8DA', borderRadius: 12, padding: 14, fontSize: 15, color: '#0A1C14', marginBottom: 14 },
  infoBox: { flexDirection: 'row', gap: 10, backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#D0E8DA', marginTop: 8 },
  infoIcon: { fontSize: 18 },
  infoText: { flex: 1, fontSize: 12, color: '#7A9E8E', lineHeight: 18 },
  footer: { padding: 16, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#D0E8DA' },
  btn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  btnOff: { backgroundColor: '#AECEBE' },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },
})
