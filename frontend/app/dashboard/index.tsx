import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '../src/store/walletStore';
import { NETWORKS, NetworkType } from '../src/utils/constants';
import { BlockchainService } from '../src/services/blockchainService';
import * as Clipboard from 'expo-clipboard';

export default function Dashboard() {
  const router = useRouter();
  const {
    currentWallet,
    balances,
    selectedNetwork,
    useTestnet,
    isLoading,
    setSelectedNetwork,
    setUseTestnet,
    refreshBalances,
    loadWallet,
    savedAddresses,
    loadSavedAddresses,
  } = useWalletStore();

  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    // Load saved addresses
    loadSavedAddresses();
  }, []);

  useEffect(() => {
    // If we have saved addresses but no current wallet, load the first one
    if (savedAddresses.length > 0 && !currentWallet) {
      loadWallet(savedAddresses[0]);
    }
  }, [savedAddresses, currentWallet]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshBalances();
    setRefreshing(false);
  };

  const copyAddress = async () => {
    if (currentWallet?.address) {
      await Clipboard.setStringAsync(currentWallet.address);
      Alert.alert('تم النسخ', 'تم نسخ العنوان');
    }
  };

  const getTotalBalance = () => {
    return balances.reduce((total, balance) => {
      return total + parseFloat(balance.balanceFormatted || '0');
    }, 0);
  };

  const getCurrentNetworkBalance = () => {
    const balance = balances.find((b) => b.network === selectedNetwork);
    return balance?.balanceFormatted || '0';
  };

  if (!currentWallet) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="wallet-outline" size={80} color="#64748B" />
        <Text style={styles.emptyText}>لا توجد محفظة</Text>
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={() => router.replace('/')}
        >
          <Text style={styles.emptyButtonText}>إنشاء أو استيراد محفظة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>محفظتي</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => {
                Alert.alert(
                  'وضع الشبكة',
                  `الوضع الحالي: ${useTestnet ? 'Testnet' : 'Mainnet'}`,
                  [
                    {
                      text: useTestnet ? 'التبديل إلى Mainnet' : 'التبديل إلى Testnet',
                      onPress: () => setUseTestnet(!useTestnet),
                    },
                    { text: 'إلغاء', style: 'cancel' },
                  ]
                );
              }}
            >
              <Ionicons
                name={useTestnet ? 'flask' : 'globe'}
                size={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet Address */}
        <TouchableOpacity
          style={styles.addressContainer}
          onPress={copyAddress}
        >
          <View style={styles.addressBadge}>
            {currentWallet.isWatchOnly && (
              <Ionicons name="eye-outline" size={16} color="#94A3B8" />
            )}
            <Text style={styles.addressText}>
              {BlockchainService.formatAddress(currentWallet.address)}
            </Text>
            <Ionicons name="copy-outline" size={16} color="#94A3B8" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Network Selector */}
        <View style={styles.networkSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.networkList}>
              {(Object.keys(NETWORKS) as NetworkType[]).map((network) => (
                <TouchableOpacity
                  key={network}
                  style={[
                    styles.networkCard,
                    selectedNetwork === network && styles.networkCardActive,
                  ]}
                  onPress={() => setSelectedNetwork(network)}
                >
                  <Ionicons
                    name={NETWORKS[network].icon as any}
                    size={24}
                    color={
                      selectedNetwork === network
                        ? '#fff'
                        : NETWORKS[network].color
                    }
                  />
                  <Text
                    style={[
                      styles.networkName,
                      selectedNetwork === network && styles.networkNameActive,
                    ]}
                  >
                    {NETWORKS[network].name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>الرصيد الحالي</Text>
          {isLoading ? (
            <ActivityIndicator size="large" color="#3B82F6" />
          ) : (
            <>
              <Text style={styles.balanceAmount}>
                {parseFloat(getCurrentNetworkBalance()).toFixed(4)}
              </Text>
              <Text style={styles.balanceSymbol}>
                {NETWORKS[selectedNetwork].symbol}
              </Text>
            </>
          )}
        </View>

        {/* All Balances */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>جميع الأرصدة</Text>
          {balances.map((balance) => (
            <View key={balance.network} style={styles.balanceItem}>
              <View style={styles.balanceItemLeft}>
                <View
                  style={[
                    styles.networkIcon,
                    { backgroundColor: NETWORKS[balance.network].color + '20' },
                  ]}
                >
                  <Ionicons
                    name={NETWORKS[balance.network].icon as any}
                    size={20}
                    color={NETWORKS[balance.network].color}
                  />
                </View>
                <View>
                  <Text style={styles.balanceItemName}>
                    {NETWORKS[balance.network].name}
                  </Text>
                  <Text style={styles.balanceItemSymbol}>
                    {NETWORKS[balance.network].symbol}
                  </Text>
                </View>
              </View>
              <Text style={styles.balanceItemAmount}>
                {parseFloat(balance.balanceFormatted).toFixed(4)}
              </Text>
            </View>
          ))}
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/send')}
            disabled={currentWallet.isWatchOnly}
          >
            <View
              style={[
                styles.actionIconContainer,
                currentWallet.isWatchOnly && styles.actionDisabled,
              ]}
            >
              <Ionicons name="arrow-up" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>إرسال</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/receive')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="arrow-down" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>استقبال</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => router.push('/transactions')}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="time" size={24} color="#fff" />
            </View>
            <Text style={styles.actionText}>السجل</Text>
          </TouchableOpacity>
        </View>

        {currentWallet.isWatchOnly && (
          <View style={styles.watchOnlyBanner}>
            <Ionicons name="eye-outline" size={20} color="#F59E0B" />
            <Text style={styles.watchOnlyText}>
              وضع المراقبة فقط - لا يمكنك إرسال المعاملات
            </Text>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 20,
    color: '#94A3B8',
    marginTop: 16,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    backgroundColor: '#1E293B',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressContainer: {
    alignItems: 'center',
  },
  addressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  addressText: {
    color: '#94A3B8',
    fontSize: 14,
    fontFamily: 'monospace',
  },
  content: {
    flex: 1,
  },
  networkSelector: {
    paddingVertical: 20,
  },
  networkList: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
  },
  networkCard: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  networkCardActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  networkName: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '600',
  },
  networkNameActive: {
    color: '#fff',
  },
  balanceCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  balanceSymbol: {
    fontSize: 20,
    color: '#64748B',
    fontWeight: '600',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  balanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  balanceItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  networkIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  balanceItemSymbol: {
    fontSize: 14,
    color: '#94A3B8',
  },
  balanceItemAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  actionText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  watchOnlyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  watchOnlyText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 14,
  },
  spacer: {
    height: 40,
  },
});
