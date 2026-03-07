import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../src/services/walletService';
import { useWalletStore } from '../src/store/walletStore';
import * as Clipboard from 'expo-clipboard';

export default function CreateWallet() {
  const router = useRouter();
  const { setCurrentWallet, loadSavedAddresses } = useWalletStore();
  const [wallet, setWallet] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mnemonicConfirmed, setMnemonicConfirmed] = useState(false);

  const handleCreateWallet = async () => {
    try {
      setIsLoading(true);
      const newWallet = await WalletService.createNewWallet();
      setWallet(newWallet);
      setIsLoading(false);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('خطأ', error.message || 'فشل إنشاء المحفظة');
    }
  };

  const handleSaveWallet = async () => {
    if (!wallet) return;

    if (!mnemonicConfirmed) {
      Alert.alert(
        'تحذير',
        'يرجى التأكد من حفظ العبارة السرية في مكان آمن. لن تتمكن من استعادة محفظتك بدونها!',
        [
          { text: 'إلغاء', style: 'cancel' },
          {
            text: 'لقد حفظتها',
            onPress: async () => {
              setMnemonicConfirmed(true);
              await saveWallet();
            },
          },
        ]
      );
      return;
    }

    await saveWallet();
  };

  const saveWallet = async () => {
    try {
      setIsLoading(true);
      await WalletService.saveWallet(wallet, false);
      setCurrentWallet(wallet);
      await loadSavedAddresses();
      setIsLoading(false);

      Alert.alert('نجح!', 'تم إنشاء المحفظة بنجاح', [
        { text: 'حسناً', onPress: () => router.replace('/dashboard') },
      ]);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('خطأ', error.message || 'فشل حفظ المحفظة');
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('تم النسخ', `تم نسخ ${label} إلى الحافظة`);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>جاري إنشاء المحفظة...</Text>
      </View>
    );
  }

  if (!wallet) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إنشاء محفظة جديدة</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="add-circle" size={80} color="#3B82F6" />
          </View>

          <Text style={styles.title}>محفظة جديدة</Text>
          <Text style={styles.description}>
            سيتم إنشاء محفظة جديدة بعبارة سرية (12 كلمة). احفظها في مكان آمن!
          </Text>

          <View style={styles.warningBox}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={styles.warningText}>
              العبارة السرية هي المفتاح الوحيد لاستعادة محفظتك. لا تشاركها مع أحد!
            </Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={handleCreateWallet}
          >
            <Text style={styles.createButtonText}>إنشاء المحفظة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Alert.alert(
              'تحذير',
              'هل أنت متأكد؟ إذا لم تحفظ العبارة السرية، ستفقد محفظتك!',
              [
                { text: 'إلغاء', style: 'cancel' },
                { text: 'نعم', onPress: () => router.back() },
              ]
            );
          }}
        >
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>احفظ العبارة السرية</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark-circle" size={60} color="#10B981" />
        </View>

        <Text style={styles.title}>تم إنشاء المحفظة!</Text>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>العنوان</Text>
            <TouchableOpacity
              onPress={() => copyToClipboard(wallet.address, 'العنوان')}
            >
              <Ionicons name="copy-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
          <View style={styles.addressBox}>
            <Text style={styles.addressText}>{wallet.address}</Text>
          </View>
        </View>

        {wallet.mnemonic && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>العبارة السرية (12 كلمة)</Text>
              <TouchableOpacity
                onPress={() => copyToClipboard(wallet.mnemonic, 'العبارة السرية')}
              >
                <Ionicons name="copy-outline" size={20} color="#3B82F6" />
              </TouchableOpacity>
            </View>
            <View style={styles.mnemonicBox}>
              {wallet.mnemonic.split(' ').map((word: string, index: number) => (
                <View key={index} style={styles.wordBox}>
                  <Text style={styles.wordNumber}>{index + 1}</Text>
                  <Text style={styles.wordText}>{word}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <View style={styles.warningBox}>
          <Ionicons name="alert-circle" size={24} color="#EF4444" />
          <Text style={styles.warningText}>
            اكتب العبارة السرية على ورقة واحفظها في مكان آمن. لا تلتقط صورة ولا تحفظها رقمياً!
          </Text>
        </View>

        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveWallet}
        >
          <Text style={styles.saveButtonText}>لقد حفظت العبارة، المتابعة</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 16,
    marginTop: 16,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 24,
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 24,
  },
  successIcon: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
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
  },
  mnemonicBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  wordBox: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    width: '31%',
  },
  wordNumber: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  wordText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  warningBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 14,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#10B981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});