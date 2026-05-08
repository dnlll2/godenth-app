import { useCallback, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator, Alert } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import api from '../../services/api'

export default function Vagas() {
  const [vagas, setVagas] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadVagas = async () => {
    try {
      console.log("buscando vagas..."); const res = await api.get('/vagas')
      setVagas(res.data.vagas || [])
    } catch (err) {
      console.log('Erro:', err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useFocusEffect(useCallback(() => { setLoading(true); loadVagas() }, []))

  const candidatar = async (vaga: any) => {
    Alert.alert(
      'Candidatar-se',
      `Deseja se candidatar para ${vaga.cargo}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Candidatar!',
          onPress: async () => {
            try {
              await api.post(`/vagas/${vaga.id}/candidatar`, { respostas: [] })
              Alert.alert('✅ Sucesso!', 'Candidatura enviada!')
            } catch (err: any) {
              Alert.alert('Erro', err.response?.data?.error || 'Erro ao candidatar')
            }
          }
        }
      ]
    )
  }

  const renderVaga = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.logoBox}>
          <Text style={styles.logoBoxT}>{item.empresa_nome?.charAt(0) || 'C'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.cargo}>{item.cargo}</Text>
          <Text style={styles.empresa}>{item.empresa_nome || 'Clínica'}</Text>
        </View>
        <View style={[styles.statusBadge, item.status === 'aberta' ? styles.statusAberta : styles.statusFechada]}>
          <Text style={styles.statusT}>{item.status === 'aberta' ? '🟢 Aberta' : '🔴 Fechada'}</Text>
        </View>
      </View>

      <View style={styles.infos}>
        {item.contrato ? <View style={styles.tag}><Text style={styles.tagT}>📋 {item.contrato}</Text></View> : null}
        {item.especialidade ? <View style={styles.tag}><Text style={styles.tagT}>🦷 {item.especialidade}</Text></View> : null}
        {item.salario ? <View style={styles.tag}><Text style={[styles.tagT, { color: '#00A880' }]}>💰 {item.salario}</Text></View> : null}
      </View>

      {item.beneficios ? <Text style={styles.beneficios}>✅ {item.beneficios}</Text> : null}

      <TouchableOpacity
        style={[styles.btn, item.status !== 'aberta' && styles.btnDisabled]}
        onPress={() => item.status === 'aberta' && candidatar(item)}
        disabled={item.status !== 'aberta'}
      >
        <Text style={styles.btnT}>{item.status === 'aberta' ? 'Candidatar-se →' : 'Vaga fechada'}</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: '#EEF7F2' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.title}>💼 Vagas</Text>
        <View style={{ width: 32 }} />
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#00A880" />
        </View>
      ) : (
        <FlatList
          data={vagas}
          keyExtractor={(item: any) => item.id?.toString()}
          renderItem={renderVaga}
          contentContainerStyle={vagas.length === 0 ? { flex: 1 } : { padding: 14, gap: 14, paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadVagas() }} tintColor="#00A880" />}
          ListEmptyComponent={
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 48, marginBottom: 12 }}>💼</Text>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0A1C14' }}>Nenhuma vaga aberta</Text>
              <Text style={{ fontSize: 13, color: '#7A9E8E', marginTop: 6 }}>Volte em breve!</Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#007A6E' },
  back: { fontSize: 24, color: '#fff', fontWeight: '700' },
  title: { fontSize: 18, fontWeight: '800', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#D0E8DA', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  logoBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#007A6E', justifyContent: 'center', alignItems: 'center' },
  logoBoxT: { color: '#fff', fontWeight: '800', fontSize: 20 },
  cargo: { fontSize: 16, fontWeight: '800', color: '#0A1C14' },
  empresa: { fontSize: 12, color: '#7A9E8E', marginTop: 2 },
  statusBadge: { borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  statusAberta: { backgroundColor: '#E6F9F3' },
  statusFechada: { backgroundColor: '#FFE8E8' },
  statusT: { fontSize: 11, fontWeight: '700' },
  infos: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  tag: { backgroundColor: '#EEF7F2', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: '#D0E8DA' },
  tagT: { fontSize: 12, fontWeight: '600', color: '#3A6550' },
  beneficios: { fontSize: 12, color: '#3A6550', marginBottom: 14, lineHeight: 18 },
  btn: { backgroundColor: '#007A6E', borderRadius: 12, padding: 14, alignItems: 'center' },
  btnDisabled: { backgroundColor: '#AECEBE' },
  btnT: { color: '#fff', fontWeight: '800', fontSize: 14 },
})
