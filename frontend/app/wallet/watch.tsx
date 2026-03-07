import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { WalletService } from '../src/services/walletService';
import { useWalletStore } from '../src/store/walletStore';
import { BlockchainService } from '../src/services/blockchainService';

export default function WatchWallet() {
  const router = useRouter();
  const { setCurrentWallet, loadSavedAddresses } = useWalletStore();
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddWatchAddress = async () => {
    try {
      setIsLoading(true);

      if (!address.trim()) {
        throw new Error('الرجاء إدخال العنوان');
      }

      // Validate address
      if (!BlockchainService.isValidAddress(address.trim())) {
        throw new Error('عنوان غير صحيح');
      }

      const wallet = await WalletService.addWatchOnlyAddress(address.trim());
      await WalletService.saveWallet(wallet, false);
      setCurrentWallet(wallet);
      await loadSavedAddresses();
      setIsLoading(false);

      Alert.alert('نجح!', 'تمت إضافة العنوان للمراقبة', [
        { text: 'حسناً', onPress: () => router.replace('/dashboard') },
      ]);
    } catch (error: any) {
      setIsLoading(false);
      Alert.alert('خطأ', error.message || 'فشلت إضافة العنوان');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>جاري إضافة العنوان...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-forward" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>مراقبة عنوان</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="eye" size={60} color="#3B82F6" />
        </View>

        <Text style={styles.title}>إضافة عنوان للمراقبة</Text>
        <Text style={styles.description}>
          أضف عنوان محفظة لمراقبة الرصيد فقط. لن تتمكن من إرسال المعاملات.
        </Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>عنوان المحفظة</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            placeholderTextColor="#64748B"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#3B82F6" />
          <Text style={styles.infoText}>
            وضع المراقبة فقط يسمح لك بمشاهدة الرصيد والمعاملات بدون القدرة على الإرسال.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddWatchAddress}
        >
          <Text style={styles.addButtonText}>إضافة عنوان</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 24,
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
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  infoText: {
    flex: 1,
    color: '#3B82F6',
    fontSize: 14,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});