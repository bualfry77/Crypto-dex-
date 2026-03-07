import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import 'react-native-get-random-values';
import { ethers } from 'ethers';

// USDC Contract on Base
const USDC_CONTRACT = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913';

// Tenderly Virtual Base RPC
const RPC_URL = 'https://virtual.base.rpc.tenderly.co/6489289e-4554-4dff-a239-4cd3f863d4c4';

export default function Index() {
  const [screen, setScreen] = useState('home');
  const [wallet, setWallet] = useState(null);
  const [ethBalance, setEthBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    if (wallet) {
      loadBalances();
    }
  }, [wallet]);

  const loadWallet = async () => {
    try {
      const savedWallet = await SecureStore.getItemAsync('wallet');
      if (savedWallet) {
        const walletData = JSON.parse(savedWallet);
        setWallet(walletData);
      }
    } catch (error) {
      console.error('Error loading wallet:', error);
    }
  };

  const createWallet = async () => {
    try {
      setLoading(true);
      const newWallet = ethers.Wallet.createRandom();
      const walletData = {
        address: newWallet.address,
        privateKey: newWallet.privateKey,
        mnemonic: newWallet.mnemonic.phrase,
      };
      
      await SecureStore.setItemAsync('wallet', JSON.stringify(walletData));
      setWallet(walletData);
      setMnemonic(newWallet.mnemonic.phrase);
      setScreen('showMnemonic');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('خطأ', 'فشل إنشاء المحفظة');
    }
  };

  const importWallet = async () => {
    try {
      setLoading(true);
      const importedWallet = ethers.Wallet.fromPhrase(mnemonic);
      const walletData = {
        address: importedWallet.address,
        privateKey: importedWallet.privateKey,
        mnemonic: importedWallet.mnemonic.phrase,
      };
      
      await SecureStore.setItemAsync('wallet', JSON.stringify(walletData));
      setWallet(walletData);
      setScreen('dashboard');
      setLoading(false);
    } catch (error) {
      setLoading(false);
      Alert.alert('خطأ', 'عبارة سرية غير صحيحة');
    }
  };

  const loadBalances = async () => {
    if (!wallet) return;
    
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      
      // Get ETH balance
      const ethBal = await provider.getBalance(wallet.address);
      setEthBalance(ethers.formatEther(ethBal));
      
      // Get USDC balance
      const usdcContract = new ethers.Contract(
        USDC_CONTRACT,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      const usdcBal = await usdcContract.balanceOf(wallet.address);
      setUsdcBalance(ethers.formatUnits(usdcBal, 6));
    } catch (error) {
      console.error('Error loading balances:', error);
    }
  };

  const sendETH = async () => {
    if (!wallet || !toAddress || !amount) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = new ethers.Wallet(wallet.privateKey, provider);
      
      const tx = await signer.sendTransaction({
        to: toAddress,
        value: ethers.parseEther(amount),
      });
      
      setTxHash(tx.hash);
      Alert.alert('نجح!', `تم إرسال المعاملة\nHash: ${tx.hash.substring(0, 10)}...`);
      
      await tx.wait();
      await loadBalances();
      setLoading(false);
      setScreen('dashboard');
    } catch (error) {
      setLoading(false);
      Alert.alert('خطأ', error.message || 'فشل إرسال المعاملة');
    }
  };

  const sendUSDC = async () => {
    if (!wallet || !toAddress || !amount) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول');
      return;
    }

    try {
      setLoading(true);
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const signer = new ethers.Wallet(wallet.privateKey, provider);
      
      const usdcContract = new ethers.Contract(
        USDC_CONTRACT,
        ['function transfer(address to, uint256 amount) returns (bool)'],
        signer
      );
      
      const tx = await usdcContract.transfer(toAddress, ethers.parseUnits(amount, 6));
      setTxHash(tx.hash);
      Alert.alert('نجح!', `تم إرسال المعاملة\nHash: ${tx.hash.substring(0, 10)}...`);
      
      await tx.wait();
      await loadBalances();
      setLoading(false);
      setScreen('dashboard');
    } catch (error) {
      setLoading(false);
      Alert.alert('خطأ', error.message || 'فشل إرسال USDC');
    }
  };

  const copyAddress = async () => {
    await Clipboard.setStringAsync(wallet.address);
    Alert.alert('تم النسخ', 'تم نسخ العنوان');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>جاري المعالجة...</Text>
      </View>
    );
  }

  // Home Screen
  if (screen === 'home' && !wallet) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="wallet" size={80} color="#3B82F6" />
          <Text style={styles.title}>محفظة العملات المشفرة</Text>
          <Text style={styles.subtitle}>Virtual Base Network</Text>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.primaryButton} onPress={createWallet}>
            <Ionicons name="add-circle-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>إنشاء محفظة جديدة</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setScreen('import')}
          >
            <Ionicons name="download-outline" size={24} color="#3B82F6" />
            <Text style={styles.buttonTextSecondary}>استيراد محفظة</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Show Mnemonic Screen
  if (screen === 'showMnemonic') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <Ionicons name="checkmark-circle" size={60} color="#10B981" />
          <Text style={styles.title}>احفظ العبارة السرية!</Text>
          
          <View style={styles.mnemonicBox}>
            {mnemonic.split(' ').map((word, index) => (
              <View key={index} style={styles.wordBox}>
                <Text style={styles.wordNumber}>{index + 1}</Text>
                <Text style={styles.wordText}>{word}</Text>
              </View>
            ))}
          </View>

          <View style={styles.warningBox}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={styles.warningText}>
              احفظ هذه العبارة في مكان آمن! لن تتمكن من استعادة محفظتك بدونها
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => setScreen('dashboard')}
          >
            <Text style={styles.buttonText}>لقد حفظتها، المتابعة</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Import Screen
  if (screen === 'import') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen('home')}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>استيراد محفظة</Text>
          
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={4}
            placeholder="أدخل العبارة السرية (12 كلمة)"
            placeholderTextColor="#64748B"
            value={mnemonic}
            onChangeText={setMnemonic}
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={importWallet}>
            <Text style={styles.buttonText}>استيراد</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Dashboard Screen
  if (screen === 'dashboard') {
    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>محفظتي</Text>
          <TouchableOpacity style={styles.addressBox} onPress={copyAddress}>
            <Text style={styles.addressText}>
              {wallet.address.substring(0, 6)}...{wallet.address.substring(38)}
            </Text>
            <Ionicons name="copy-outline" size={16} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>ETH Balance</Text>
          <Text style={styles.balanceAmount}>{parseFloat(ethBalance).toFixed(6)}</Text>
          <Text style={styles.balanceSymbol}>ETH</Text>
        </View>

        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>USDC Balance</Text>
          <Text style={styles.balanceAmount}>{parseFloat(usdcBalance).toFixed(2)}</Text>
          <Text style={styles.balanceSymbol}>USDC</Text>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setScreen('sendETH')}
          >
            <Ionicons name="arrow-up" size={24} color="#fff" />
            <Text style={styles.actionText}>إرسال ETH</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setScreen('sendUSDC')}
          >
            <Ionicons name="arrow-up" size={24} color="#fff" />
            <Text style={styles.actionText}>إرسال USDC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => setScreen('receive')}
          >
            <Ionicons name="arrow-down" size={24} color="#fff" />
            <Text style={styles.actionText}>استقبال</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadBalances}
        >
          <Ionicons name="refresh" size={20} color="#3B82F6" />
          <Text style={styles.refreshText}>تحديث الأرصدة</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  // Send ETH Screen
  if (screen === 'sendETH') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen('dashboard')}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>إرسال ETH</Text>
          
          <TextInput
            style={styles.input}
            placeholder="عنوان المستلم (0x...)"
            placeholderTextColor="#64748B"
            value={toAddress}
            onChangeText={setToAddress}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="المبلغ (ETH)"
            placeholderTextColor="#64748B"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={sendETH}>
            <Text style={styles.buttonText}>إرسال الآن</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Send USDC Screen
  if (screen === 'sendUSDC') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen('dashboard')}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>إرسال USDC</Text>
          
          <TextInput
            style={styles.input}
            placeholder="عنوان المستلم (0x...)"
            placeholderTextColor="#64748B"
            value={toAddress}
            onChangeText={setToAddress}
            autoCapitalize="none"
          />

          <TextInput
            style={styles.input}
            placeholder="المبلغ (USDC)"
            placeholderTextColor="#64748B"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={sendUSDC}>
            <Text style={styles.buttonText}>إرسال الآن</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Receive Screen
  if (screen === 'receive') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen('dashboard')}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>استقبال</Text>
          
          <View style={styles.qrContainer}>
            <QRCode value={wallet.address} size={250} />
          </View>

          <View style={styles.addressBox}>
            <Text style={styles.addressFullText}>{wallet.address}</Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={copyAddress}>
            <Ionicons name="copy-outline" size={24} color="#fff" />
            <Text style={styles.buttonText}>نسخ العنوان</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return null;
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
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    marginTop: 8,
  },
  content: {
    padding: 24,
  },
  buttonContainer: {
    padding: 24,
    gap: 16,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    padding: 18,
    borderRadius: 12,
    gap: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1E293B',
    padding: 18,
    borderRadius: 12,
    gap: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonTextSecondary: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
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
  mnemonicBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  wordBox: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    width: '31%',
  },
  wordNumber: {
    color: '#64748B',
    fontSize: 12,
  },
  wordText: {
    color: '#fff',
    fontSize: 14,
  },
  warningBox: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    color: '#F59E0B',
    fontSize: 14,
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  addressText: {
    color: '#94A3B8',
    fontSize: 14,
  },
  addressFullText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  balanceCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: '#94A3B8',
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
  },
  balanceSymbol: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    flex: 1,
  },
  actionText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    marginHorizontal: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  refreshText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignSelf: 'center',
    marginBottom: 24,
  },
});
