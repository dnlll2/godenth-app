import { useState, useEffect } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, Switch, ActivityIndicator, Alert, Modal, Platform,
} from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import api from '../services/api'

const DEFAULT_PRIVACIDADE = {
  ocultar_foto: false, ocultar_cargo: false, ocultar_email: false,
  ocultar_celular: false, ocultar_idade: false, ocultar_bio: false,
  ocultar_localizacao: false, ocultar_especialidades: false,
  ocultar_habilidades: false, ocultar_formacao: false,
  ocultar_experiencia: false, ocultar_instagram: false,
}

const PRIVACY_ITEMS: { key: string; label: string; sub: string }[] = [
  { key: 'ocultar_foto',           label: 'Foto de perfil',    sub: 'Exibe apenas a inicial do nome' },
  { key: 'ocultar_cargo',          label: 'Cargo principal',   sub: 'Cargo não aparece no perfil público' },
  { key: 'ocultar_email',          label: 'E-mail',            sub: 'Apenas conexões podem ver' },
  { key: 'ocultar_celular',        label: 'Celular',           sub: 'Apenas conexões podem ver' },
  { key: 'ocultar_idade',          label: 'Idade',             sub: 'Data de nascimento não aparece' },
  { key: 'ocultar_bio',            label: 'Bio / Resumo',      sub: 'Resumo profissional fica oculto' },
  { key: 'ocultar_localizacao',    label: 'Localização',       sub: 'Cidade e estado não aparecem' },
  { key: 'ocultar_especialidades', label: 'Especialidades',    sub: 'Lista de especialidades fica oculta' },
  { key: 'ocultar_habilidades',    label: 'Habilidades',       sub: 'Lista de habilidades fica oculta' },
  { key: 'ocultar_formacao',       label: 'Formação',          sub: 'Formação acadêmica fica oculta' },
  { key: 'ocultar_experiencia',    label: 'Experiência',       sub: 'Experiência profissional fica oculta' },
  { key: 'ocultar_instagram',      label: 'Instagram',         sub: 'Link do Instagram não aparece' },
]

export default function Configuracoes() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [email, setEmail] = useState('')
  const [celular, setCelular] = useState('')
  const [privacidade, setPrivacidade] = useState<any>(DEFAULT_PRIVACIDADE)

  const [senhaModal, setSenhaModal] = useState(false)
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [salvandoSenha, setSalvandoSenha] = useState(false)

  useEffect(() => { loadProfile() }, [])

  const loadProfile = async () => {
    try {
      const res = await api.get('/users/me')
      const p = res.data
      setEmail(p.email || '')
      setCelular(p.celular || '')
      setPrivacidade({ ...DEFAULT_PRIVACIDADE, ...(p.privacidade || {}) })
    } catch (err) { console.log(err) }
    finally { setLoading(false) }
  }

  const salvar = async () => {
    setSaving(true)
    try {
      await api.put('/users/me', { celular, privacidade })
      Alert.alert('Salvo', 'Configurações atualizadas com sucesso.')
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível salvar.')
    } finally { setSaving(false) }
  }

  const alterarSenha = async () => {
    if (!senhaAtual || !novaSenha || !confirmarSenha) {
      Alert.alert('Atenção', 'Preencha todos os campos.')
      return
    }
    if (novaSenha !== confirmarSenha) {
      Alert.alert('Atenção', 'A nova senha e a confirmação não conferem.')
      return
    }
    if (novaSenha.length < 6) {
      Alert.alert('Atenção', 'A nova senha deve ter ao menos 6 caracteres.')
      return
    }
    setSalvandoSenha(true)
    try {
      await api.put('/users/me/password', { senha_atual: senhaAtual, nova_senha: novaSenha })
      Alert.alert('Pronto', 'Senha alterada com sucesso!')
      setSenhaModal(false)
      setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('')
    } catch (err: any) {
      Alert.alert('Erro', err.response?.data?.error || 'Não foi possível alterar a senha.')
    } finally { setSalvandoSenha(false) }
  }

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color="#00A880" size="large" />
    </View>
  )

  return (
    <View style={s.root}>
      {/* Header */}
      <LinearGradient colors={['#007A6E', '#004D44']} style={s.headerGrad}>
        <View style={s.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.headerSide}>
            <Text style={s.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={s.headerTitle}>Configurações</Text>
          <View style={[s.headerSide, { alignItems: 'flex-end' }]}>
            {saving
              ? <ActivityIndicator color="#F5C800" size="small" />
              : <TouchableOpacity onPress={salvar}><Text style={s.saveTextBtn}>Salvar</Text></TouchableOpacity>
            }
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent} keyboardShouldPersistTaps="handled">

        {/* ── 1. Privacidade ─────────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>Privacidade</Text>
        <Text style={s.sectionSub}>Escolha o que aparece no seu perfil público</Text>
        <View style={s.card}>
          {PRIVACY_ITEMS.map((item, i) => (
            <View key={item.key}>
              <View style={s.toggleRow}>
                <View style={s.toggleInfo}>
                  <Text style={s.toggleLabel}>{item.label}</Text>
                  <Text style={s.toggleSub}>{item.sub}</Text>
                </View>
                <Switch
                  value={!!privacidade[item.key]}
                  onValueChange={v => setPrivacidade((p: any) => ({ ...p, [item.key]: v }))}
                  trackColor={{ false: '#D0E8DA', true: '#00A880' }}
                  thumbColor="#fff"
                />
              </View>
              {i < PRIVACY_ITEMS.length - 1 && <View style={s.divider} />}
            </View>
          ))}
        </View>

        {/* ── 2. Conta ───────────────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>Conta</Text>
        <View style={s.card}>
          <Text style={s.fieldLbl}>E-mail <Text style={s.readOnlyTag}>(não editável)</Text></Text>
          <View style={[s.input, s.inputReadOnly]}>
            <Text style={s.inputReadOnlyT}>{email || '—'}</Text>
          </View>

          <Text style={s.fieldLbl}>Celular / WhatsApp</Text>
          <TextInput
            style={s.input}
            value={celular}
            onChangeText={setCelular}
            placeholder="(11) 99999-9999"
            placeholderTextColor="#A0B8AC"
            keyboardType="phone-pad"
          />
        </View>

        {/* ── 3. Segurança ───────────────────────────────────────────────── */}
        <Text style={s.sectionLabel}>Segurança</Text>
        <View style={s.card}>
          <TouchableOpacity style={s.secRow} onPress={() => setSenhaModal(true)}>
            <View style={s.secIcon}>
              <Text style={{ fontSize: 20 }}>🔑</Text>
            </View>
            <View style={s.secInfo}>
              <Text style={s.secLabel}>Alterar senha</Text>
              <Text style={s.secSub}>Troque sua senha de acesso</Text>
            </View>
            <Text style={s.secArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* Footer save */}
      <View style={s.footer}>
        <TouchableOpacity style={[s.saveBtn, saving && s.saveBtnDisabled]} onPress={salvar} disabled={saving}>
          {saving
            ? <ActivityIndicator color="#fff" />
            : <Text style={s.saveBtnT}>Salvar configurações</Text>
          }
        </TouchableOpacity>
      </View>

      {/* Modal alterar senha */}
      <Modal visible={senhaModal} transparent animationType="slide" onRequestClose={() => setSenhaModal(false)}>
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Alterar senha</Text>

            <Text style={s.fieldLbl}>Senha atual *</Text>
            <TextInput
              style={s.input}
              value={senhaAtual}
              onChangeText={setSenhaAtual}
              placeholder="Digite sua senha atual"
              placeholderTextColor="#A0B8AC"
              secureTextEntry
            />

            <Text style={s.fieldLbl}>Nova senha *</Text>
            <TextInput
              style={s.input}
              value={novaSenha}
              onChangeText={setNovaSenha}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor="#A0B8AC"
              secureTextEntry
            />

            <Text style={s.fieldLbl}>Confirmar nova senha *</Text>
            <TextInput
              style={[s.input, { marginBottom: 20 }]}
              value={confirmarSenha}
              onChangeText={setConfirmarSenha}
              placeholder="Repita a nova senha"
              placeholderTextColor="#A0B8AC"
              secureTextEntry
            />

            <View style={s.modalBtns}>
              <TouchableOpacity
                style={s.cancelBtn}
                onPress={() => { setSenhaModal(false); setSenhaAtual(''); setNovaSenha(''); setConfirmarSenha('') }}
              >
                <Text style={s.cancelBtnT}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.confirmBtn, salvandoSenha && { opacity: 0.6 }]}
                onPress={alterarSenha}
                disabled={salvandoSenha}
              >
                {salvandoSenha
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.confirmBtnT}>Alterar senha</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F2F5F4' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F5F4' },

  headerGrad: { paddingTop: Platform.OS === 'ios' ? 52 : 28 },
  headerBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 14 },
  headerSide: { width: 70 },
  backBtn: { fontSize: 24, color: '#fff', fontWeight: '700' },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '800', color: '#fff' },
  saveTextBtn: { fontSize: 15, fontWeight: '800', color: '#F5C800' },

  scroll: { flex: 1 },
  scrollContent: { paddingTop: 4, paddingBottom: 16 },

  sectionLabel: { fontSize: 11, fontWeight: '800', color: '#007A6E', textTransform: 'uppercase', letterSpacing: 1.2, paddingHorizontal: 16, paddingTop: 22, paddingBottom: 4 },
  sectionSub: { fontSize: 12, color: '#7A9E8E', paddingHorizontal: 16, marginBottom: 6 },

  card: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 20,
    shadowColor: '#006A5E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  divider: { height: 1, backgroundColor: '#F2F5F4', marginVertical: 2 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 },
  toggleInfo: { flex: 1, marginRight: 12 },
  toggleLabel: { fontSize: 14, fontWeight: '700', color: '#0A1C14' },
  toggleSub: { fontSize: 11, color: '#7A9E8E', marginTop: 2 },

  fieldLbl: { fontSize: 11, fontWeight: '700', color: '#7A9E8E', marginBottom: 6, marginTop: 14 },
  input: { backgroundColor: '#F2F5F4', borderRadius: 12, padding: 14, fontSize: 15, color: '#0A1C14' },
  inputReadOnly: { justifyContent: 'center' },
  inputReadOnlyT: { fontSize: 15, color: '#A0B8AC' },
  readOnlyTag: { fontSize: 10, color: '#A0B8AC', fontWeight: '500', textTransform: 'none' },

  secRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  secIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#EEF7F2', justifyContent: 'center', alignItems: 'center' },
  secInfo: { flex: 1 },
  secLabel: { fontSize: 15, fontWeight: '700', color: '#0A1C14' },
  secSub: { fontSize: 12, color: '#7A9E8E', marginTop: 2 },
  secArrow: { fontSize: 22, color: '#D0E8DA', fontWeight: '300' },

  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    paddingBottom: Platform.OS === 'ios' ? 28 : 14,
    borderTopWidth: 1,
    borderTopColor: '#E8F0EC',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  saveBtn: { backgroundColor: '#007A6E', borderRadius: 14, padding: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnT: { color: '#fff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.48)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 32 : 16 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#D0E8DA', borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetTitle: { fontSize: 18, fontWeight: '800', color: '#0A1C14', marginBottom: 4 },
  modalBtns: { flexDirection: 'row', gap: 12, paddingTop: 4 },
  cancelBtn: { flex: 1, backgroundColor: '#F2F5F4', borderRadius: 12, padding: 14, alignItems: 'center' },
  cancelBtnT: { fontSize: 14, fontWeight: '800', color: '#3A6550' },
  confirmBtn: { flex: 1, backgroundColor: '#007A6E', borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmBtnT: { fontSize: 14, fontWeight: '800', color: '#fff' },
})
