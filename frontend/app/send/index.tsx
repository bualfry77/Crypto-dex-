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
import { useWalletStore } from '@/store/walletStore';
import { BlockchainService } from '@/services/blockchainService';
import { WalletService } from '@/services/walletService';
import { NETWORKS } from '@/utils/constants';

export default function Send() {
  const router = useRouter();
  const { currentWallet, selectedNetwork, useTestnet } = useWalletStore();
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gasEstimate, setGasEstimate] = useState<any>(null);

  const estimateGas = async () => {
    if (!currentWallet || !toAddress || !amount) return;

    try {
      const estimate = await BlockchainService.estimateGas(
        currentWallet.address,
        toAddress,
        amount,
        selectedNetwork,
        useTestnet
      );
      setGasEstimate(estimate);
    } catch (error: any) {
      console.error('Error estimating gas:', error);
      Alert.alert('خطأ', 'فشل تقدير رسوم الغاز');
    }
  };

  const handleSend = async () => {
    if (!currentWallet) {
      Alert.alert('خطأ', 'لا توجد محفظة');
      return;
    }

    if (currentWallet.isWatchOnly) {
      Alert.alert('خطأ', 'لا يمكن الإرسال من محفظة مراقبة فقط');
      return;
    }

    if (!toAddress.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال عنوان المستلم');
      return;
    }

    if (!BlockchainService.isValidAddress(toAddress)) {
      Alert.alert('خطأ', 'عنوان غير صحيح');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('خطأ', 'الرجاء إدخال مبلغ صحيح');
      return;
    }

    // Confirm transaction
    Alert.alert(
      'تأكيد الإرسال',
      `هل تريد إرسال ${amount} ${NETWORKS[selectedNetwork].symbol} إلى ${BlockchainService.formatAddress(toAddress)}؟\n\nالرسوم المقدرة: ${gasEstimate?.totalCost || '...'} ${NETWORKS[selectedNetwork].symbol}`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { text: 'إرسال', onPress: sendTransaction },
      ]
    );
  };

  const sendTransaction = async () => {
    try {
      setIsLoading(true);

      // Load wallet data
      const walletData = await WalletService.loadWallet(currentWallet!.address);
      if (!walletData || !walletData.privateKey) {
        throw new Error('فشل تحميل المحفظة');
      }

      // Send transaction
      const tx = await BlockchainService.sendTransaction(
        currentWallet!.address,
        toAddress,
        amount,
        walletData.privateKey,
        selectedNetwork,
        useTestnet
      );

      setIsLoading(false);

      Alert.alert(
        'تم الإرسال!',
        `تم إرسال المعاملة بنجاح\n\nHash: ${BlockchainService.formatAddress(tx.hash)}\n\nسيتم تأكيدها قريباً`,
        [{ text: 'حسناً', onPress: () => router.back() }]
      );
    } catch (error: any) {
      setIsLoading(false);
      console.error('Error sending transaction:', error);
      Alert.alert('خطأ', error.message || 'فشل إرسال المعاملة');
    }
  };

  if (!currentWallet) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>لا توجد محفظة</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>جاري إرسال المعاملة...</Text>
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
        <Text style={styles.headerTitle}>إرسال</Text>
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

        {/* To Address */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>إلى العنوان</Text>
          <TextInput
            style={styles.input}
            placeholder="0x..."
            placeholderTextColor="#64748B"
            value={toAddress}
            onChangeText={setToAddress}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Amount */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>المبلغ</Text>
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor="#64748B"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={styles.amountSymbol}>
              {NETWORKS[selectedNetwork].symbol}
            </Text>
          </View>
        </View>

        {/* Estimate Gas Button */}
        <TouchableOpacity
          style={styles.estimateButton}
          onPress={estimateGas}
          disabled={!toAddress || !amount}
        >
          <Ionicons name="calculator-outline" size={20} color="#3B82F6" />
          <Text style={styles.estimateButtonText}>تقدير رسوم الغاز</Text>
        </TouchableOpacity>

        {/* Gas Estimate */}
        {gasEstimate && (
          <View style={styles.gasEstimateBox}>
            <View style={styles.gasEstimateRow}>
              <Text style={styles.gasEstimateLabel}>Gas Limit:</Text>
              <Text style={styles.gasEstimateValue}>
                {gasEstimate.gasLimit.toString()}
              </Text>
            </View>
            <View style={styles.gasEstimateRow}>
              <Text style={styles.gasEstimateLabel}>الرسوم المقدرة:</Text>
              <Text style={styles.gasEstimateValue}>
                {gasEstimate.totalCost} {NETWORKS[selectedNetwork].symbol}
              </Text>
            </View>
          </View>
        )}

        {/* Warning for watch-only */}
        {currentWallet.isWatchOnly && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={styles.warningText}>
              لا يمكن الإرسال من محفظة مراقبة فقط
            </Text>
          </View>
        )}

        {/* Send Button */}
        <TouchableOpacity
          style={[
            styles.sendButton,
            (currentWallet.isWatchOnly || !toAddress || !amount) &&
              styles.sendButtonDisabled,
          ]}
          onPress={handleSend}
          disabled={currentWallet.isWatchOnly || !toAddress || !amount}
        >
          <Text style={styles.sendButtonText}>إرسال الآن</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  amountInput: {
    flex: 1,
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    paddingVertical: 16,
  },
  amountSymbol: {
    color: '#64748B',
    fontSize: 18,
    fontWeight: '600',
  },
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  estimateButtonText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  gasEstimateBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  gasEstimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  gasEstimateLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  gasEstimateValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  warningBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#334155',
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});