import { router } from "expo-router"
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Nova publicação</Text>
      </View>
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
  backBtn: { padding: 4 },
  backBtnText: { fontSize: 14, fontWeight: '700', color: '#00A880' },
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
