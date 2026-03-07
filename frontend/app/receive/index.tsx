import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '@/store/walletStore';
import { NETWORKS } from '@/utils/constants';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';

export default function Receive() {
  const router = useRouter();
  const { currentWallet, selectedNetwork, useTestnet } = useWalletStore();
  const qrRef = useRef<any>(null);

  const copyAddress = async () => {
    if (currentWallet?.address) {
      await Clipboard.setStringAsync(currentWallet.address);
      Alert.alert('تم النسخ', 'تم نسخ العنوان إلى الحافظة');
    }
  };

  const shareAddress = async () => {
    if (currentWallet?.address) {
      try {
        await Share.share({
          message: `عنوان محفظتي:\n${currentWallet.address}`,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    }
  };

  if (!currentWallet) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>لا توجد محفظة</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>استقبال</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Network Info */}
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

        <Text style={styles.description}>
          امسح رمز QR أو شارك عنوانك لاستقبال {NETWORKS[selectedNetwork].symbol}
        </Text>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <View style={styles.qrBox}>
            <QRCode
              value={currentWallet.address}
              size={250}
              backgroundColor="white"
              color="black"
              getRef={(ref) => (qrRef.current = ref)}
            />
          </View>
        </View>

        {/* Address */}
        <View style={styles.addressSection}>
          <Text style={styles.addressLabel}>عنوان المحفظة</Text>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{currentWallet.address}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={copyAddress}
          >
            <Ionicons name="copy-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>نسخ العنوان</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={shareAddress}
          >
            <Ionicons name="share-outline" size={24} color="#fff" />
            <Text style={styles.actionButtonText}>مشاركة</Text>
          </TouchableOpacity>
        </View>

        {/* Warning */}
        <View style={styles.warningBox}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.warningText}>
            تأكد من إرسال فقط {NETWORKS[selectedNetwork].symbol} على شبكة{' '}
            {NETWORKS[selectedNetwork].name}. إرسال عملات أخرى قد يؤدي لفقدانها!
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
    marginBottom: 16,
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
  description: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrBox: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addressSection: {
    marginBottom: 24,
  },
  addressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  addressBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  addressText: {
    color: '#94A3B8',
    fontSize: 14,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  warningText: {
    flex: 1,
    color: '#3B82F6',
    fontSize: 14,
    lineHeight: 20,
  },
});