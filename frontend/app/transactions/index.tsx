import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '../src/store/walletStore';
import { NETWORKS } from '../src/utils/constants';
import { BlockchainService } from '../src/services/blockchainService';

export default function Transactions() {
  const router = useRouter();
  const { currentWallet, selectedNetwork, useTestnet } = useWalletStore();

  if (!currentWallet) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>لا توجد محفظة</Text>
      </View>
    );
  }

  const openExplorer = () => {
    const explorerUrl = BlockchainService.getExplorerUrl(
      selectedNetwork,
      'address',
      currentWallet.address,
      useTestnet
    );
    console.log('Explorer URL:', explorerUrl);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>سجل المعاملات</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Network Badge */}
        <View style={styles.networkBadge}>
          <Ionicons
            name={NETWORKS[selectedNetwork].icon as any}
            size={20}
            color={NETWORKS[selectedNetwork].color}
          />
          <Text style={styles.networkText}>
            {NETWORKS[selectedNetwork].name}
          </Text>
          {useTestnet && (
            <View style={styles.testnetBadge}>
              <Text style={styles.testnetText}>Testnet</Text>
            </View>
          )}
        </View>

        {/* Empty State */}
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="receipt-outline" size={60} color="#64748B" />
          </View>
          <Text style={styles.emptyTitle}>لا توجد معاملات بعد</Text>
          <Text style={styles.emptyDescription}>
            ستظهر جميع معاملاتك هنا
          </Text>

          {/* Open in Explorer */}
          <TouchableOpacity
            style={styles.explorerButton}
            onPress={openExplorer}
          >
            <Ionicons name="open-outline" size={20} color="#3B82F6" />
            <Text style={styles.explorerButtonText}>
              عرض على Block Explorer
            </Text>
          </TouchableOpacity>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            يمكنك عرض جميع معاملاتك على Block Explorer الخاص بالشبكة
          </Text>
        </View>
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
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    gap: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 32,
  },
  networkText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  testnetBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  testnetText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 32,
    textAlign: 'center',
  },
  explorerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293B',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  explorerButtonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    color: '#3B82F6',
    fontSize: 14,
    lineHeight: 20,
  },
});
