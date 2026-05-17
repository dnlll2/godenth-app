import { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import api from '../../services/api'
import { Colors } from '../../constants/colors'

type Estado = 'idle' | 'loading' | 'sucesso' | 'erro'

export default function RedefinirSenha() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [estado, setEstado] = useState<Estado>('idle')
  const [erroMsg, setErroMsg] = useState('')

  const handleRedefinir = async () => {
    setErroMsg('')
    if (!token) { setErroMsg('Link inválido. Solicite um novo.'); return }
    if (novaSenha.length < 6) { setErroMsg('A senha deve ter pelo menos 6 caracteres'); return }
    if (novaSenha !== confirmar) { setErroMsg('As senhas não coincidem'); return }

    setEstado('loading')
    try {
      await api.post('/auth/reset-password', { token, new_password: novaSenha })
      setEstado('sucesso')
    } catch (err: any) {
      setErroMsg(err.response?.data?.error || 'Erro ao redefinir senha. Tente novamente.')
      setEstado('erro')
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={s.logoWrap}>
          <Text style={s.logo}>
            <Text style={s.go}>Go</Text>
            <Text style={s.denth}>Denth</Text>
          </Text>
        </View>

        <View style={s.card}>
          {estado === 'sucesso' ? (
            /* ── Sucesso ── */
            <View style={s.successBox}>
              <Text style={s.successIcon}>✅</Text>
              <Text style={s.successTitle}>Senha redefinida!</Text>
              <Text style={s.successText}>
                Sua senha foi atualizada com sucesso. Faça login com sua nova senha.
              </Text>
              <TouchableOpacity style={s.btn} onPress={() => router.replace('/(auth)/login')}>
                <Text style={s.btnT}>Ir para o login</Text>
              </TouchableOpacity>
            </View>
          ) : !token ? (
            /* ── Token ausente ── */
            <View style={s.successBox}>
              <Text style={s.successIcon}>⚠️</Text>
              <Text style={s.successTitle}>Link inválido</Text>
              <Text style={s.successText}>
                Este link de recuperação não é válido. Solicite um novo.
              </Text>
              <TouchableOpacity style={s.btnSecondary} onPress={() => router.replace('/(auth)/esqueci-senha')}>
                <Text style={s.btnSecondaryT}>Solicitar novo link</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* ── Formulário ── */
            <>
              <Text style={s.title}>Criar nova senha</Text>
              <Text style={s.sub}>
                Escolha uma senha forte com pelo menos 6 caracteres.
              </Text>

              <Text style={s.label}>Nova senha</Text>
              <TextInput
                style={[s.input, erroMsg ? s.inputErro : null]}
                placeholder="Mínimo 6 caracteres"
                placeholderTextColor={Colors.text3}
                value={novaSenha}
                onChangeText={v => { setNovaSenha(v); setErroMsg('') }}
                secureTextEntry
              />

              <Text style={s.label}>Confirmar nova senha</Text>
              <TextInput
                style={[s.input, erroMsg ? s.inputErro : null]}
                placeholder="Repita a senha"
                placeholderTextColor={Colors.text3}
                value={confirmar}
                onChangeText={v => { setConfirmar(v); setErroMsg('') }}
                secureTextEntry
              />

              {!!erroMsg && <Text style={s.erroText}>{erroMsg}</Text>}

              <TouchableOpacity
                style={[s.btn, estado === 'loading' && s.btnDisabled]}
                onPress={handleRedefinir}
                disabled={estado === 'loading'}
              >
                {estado === 'loading'
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={s.btnT}>Redefinir senha</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={s.voltar} onPress={() => router.replace('/(auth)/login')}>
                <Text style={s.voltarT}>← Voltar para o login</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A1C14' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 42, fontFamily: 'Poppins-ExtraBold', letterSpacing: -2 },
  go: { color: Colors.gold },
  denth: { color: Colors.primary },

  card: { backgroundColor: Colors.white, borderRadius: 20, padding: 24 },

  title: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 8 },
  sub: { fontSize: 13, color: Colors.text3, lineHeight: 19, marginBottom: 22 },

  label: { fontSize: 13, fontWeight: '700', color: Colors.text2, marginBottom: 6 },
  input: {
    backgroundColor: Colors.bg, borderWidth: 1.5, borderColor: Colors.border,
    borderRadius: 12, padding: 14, fontSize: 15, color: Colors.text, marginBottom: 14,
  },
  inputErro: { borderColor: '#E53935' },
  erroText: { color: '#E53935', fontSize: 12, marginBottom: 10 },

  btn: {
    backgroundColor: Colors.primary, borderRadius: 13, padding: 15,
    alignItems: 'center', marginTop: 6,
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  btnDisabled: { opacity: 0.6 },
  btnT: { color: '#fff', fontSize: 15, fontWeight: '800' },

  voltar: { alignItems: 'center', marginTop: 18 },
  voltarT: { fontSize: 13, color: Colors.text3 },

  successBox: { alignItems: 'center', paddingVertical: 12 },
  successIcon: { fontSize: 52, marginBottom: 14 },
  successTitle: { fontSize: 20, fontWeight: '800', color: Colors.text, marginBottom: 10 },
  successText: { fontSize: 14, color: Colors.text3, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  btnSecondary: {
    borderWidth: 1.5, borderColor: Colors.primary, borderRadius: 13,
    paddingHorizontal: 28, paddingVertical: 12,
  },
  btnSecondaryT: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
})
