import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '@/services/walletService';
import { useWalletStore } from '@/store/walletStore';

export default function ImportWallet() {
  const router = useRouter();
  const { setCurrentWallet, loadSavedAddresses } = useWalletStore();
  const [importType, setImportType] = useState<'mnemonic' | 'privateKey' | null>(null);
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleImport = async () => {
    try {
      setIsLoading(true);
      let wallet;

      if (importType === 'mnemonic') {
        if (!mnemonic.trim()) {
          throw new Error('الرجاء إدخال العبارة السرية');
        }
        wallet = await WalletService.importWalletFromMnemonic(mnemonic.trim());
      } else if (importType === 'privateKey') {
        if (!privateKey.trim()) {
          throw new Error('الرجاء إدخال المفتاح الخاص');
        }
        wallet = await WalletService.importWalletFromPrivateKey(privateKey.trim());
      } else {
        throw new Error('الرجاء اختيار طريقة الاستيراد');
      }

      // Save wallet
      await WalletService.saveWallet(wallet, false);
      setCurrentWallet(wallet);
      await loadSavedAddresses();
      setIsLoading(false);

      Alert.alert('نجح!', 'تم استيراد المحفظة بنجاح', [
        { text: 'حسناً', onPress: () => router.replace('/dashboard') },
      ]);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('خطأ', error.message || 'فشل استيراد المحفظة');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>جاري استيراد المحفظة...</Text>
      </View>
    );
  }

  if (!importType) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>استيراد محفظة</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="download" size={60} color="#3B82F6" />
          </View>

          <Text style={styles.title}>اختر طريقة الاستيراد</Text>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setImportType('mnemonic')}
          >
            <Ionicons name="key-outline" size={32} color="#3B82F6" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>العبارة السرية</Text>
              <Text style={styles.optionDescription}>12 أو 24 كلمة</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionButton}
            onPress={() => setImportType('privateKey')}
          >
            <Ionicons name="lock-closed-outline" size={32} color="#3B82F6" />
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>المفتاح الخاص</Text>
              <Text style={styles.optionDescription}>مفتاح خاص مشفر</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setImportType(null)}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {importType === 'mnemonic' ? 'العبارة السرية' : 'المفتاح الخاص'}
          </Text>
        </View>

        <View style={styles.content}>
          {importType === 'mnemonic' ? (
            <>
              <Text style={styles.label}>أدخل العبارة السرية (12 أو 24 كلمة)</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                placeholder="مثال: word1 word2 word3 ..."
                placeholderTextColor="#64748B"
                value={mnemonic}
                onChangeText={setMnemonic}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </>
          ) : (
            <>
              <Text style={styles.label}>أدخل المفتاح الخاص</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                placeholder="0x..."
                placeholderTextColor="#64748B"
                value={privateKey}
                onChangeText={setPrivateKey}
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
              />
            </>
          )}

          <View style={styles.warningBox}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={styles.warningText}>
              مفاتيحك محفوظة بشكل آمن على جهازك فقط. لن تغادر تطبيقك.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.importButton}
            onPress={handleImport}
          >
            <Text style={styles.importButtonText}>استيراد المحفظة</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
    marginBottom: 32,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 32,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#94A3B8',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  textArea: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
    textAlignVertical: 'top',
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
    borderColor: '#10B981',
  },
  warningText: {
    flex: 1,
    color: '#10B981',
    fontSize: 14,
    lineHeight: 20,
  },
  importButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  importButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});