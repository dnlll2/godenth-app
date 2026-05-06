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
