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

// USDC Contracts
const USDC_CONTRACTS = {
  VIRTUAL_BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  BASE: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  ETH: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
};

// Real Mainnet RPC URLs
const RPC_URLS = {
  VIRTUAL_BASE: 'https://virtual.base.rpc.tenderly.co/6489289e-4554-4dff-a239-4cd3f863d4c4',
  BASE: 'https://mainnet.base.org',
  ETH: 'https://ethereum.publicnode.com', // ✅ Better Ethereum RPC
};

const NETWORK_NAMES = {
  VIRTUAL_BASE: 'Virtual Base (Testnet)',
  BASE: 'Base Mainnet',
  ETH: 'Ethereum Mainnet',
};

const EXPLORERS = {
  VIRTUAL_BASE: 'https://base.blockscout.com',
  BASE: 'https://basescan.org',
  ETH: 'https://etherscan.io',
};

export default function Index() {
  const [screen, setScreen] = useState('home');
  const [wallet, setWallet] = useState(null);
  const [network, setNetwork] = useState('BASE'); // ✅ Base Mainnet is now default (الحقيقي)
  const [ethBalance, setEthBalance] = useState('0');
  const [usdcBalance, setUsdcBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [mnemonic, setMnemonic] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [blockNumber, setBlockNumber] = useState(0);

  useEffect(() => {
    loadWallet();
  }, []);

  useEffect(() => {
    if (wallet) {
      loadBalances();
    }
  }, [wallet, network]); // Add network dependency to reload when switching

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

  const importFromPrivateKey = async () => {
    try {
      setLoading(true);
      const importedWallet = new ethers.Wallet(privateKey);
      const walletData = {
        address: importedWallet.address,
        privateKey: importedWallet.privateKey,
        mnemonic: null,
      };
      
      await SecureStore.setItemAsync('wallet', JSON.stringify(walletData));
      setWallet(walletData);
      setScreen('dashboard');
      setLoading(false);
      Alert.alert('نجح!', 'تم استيراد المحفظة بنجاح');
    } catch (error) {
      setLoading(false);
      Alert.alert('خطأ', 'مفتاح خاص غير صحيح');
    }
  };

  const loadBalances = async () => {
    if (!wallet) return;
    
    try {
      const rpcUrl = RPC_URLS[network] || RPC_URLS.BASE;
      
      // ✅ Select correct USDC contract based on network
      let usdcContract;
      if (network === 'ETH') {
        usdcContract = USDC_CONTRACTS.ETH; // Ethereum USDC
      } else {
        usdcContract = USDC_CONTRACTS.BASE; // Base/Virtual Base USDC
      }
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      
      // Get ETH balance
      const ethBal = await provider.getBalance(wallet.address);
      setEthBalance(ethers.formatEther(ethBal));
      
      // Get USDC balance
      const usdcContractInstance = new ethers.Contract(
        usdcContract,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      const usdcBal = await usdcContractInstance.balanceOf(wallet.address);
      setUsdcBalance(ethers.formatUnits(usdcBal, 6));
      
      // Get current block number
      const block = await provider.getBlockNumber();
      setBlockNumber(block);
    } catch (error) {
      console.error('Error loading balances:', error);
      // Show error to user
      Alert.alert('خطأ في تحميل الأرصدة', 'تحقق من اتصالك بالإنترنت');
    }
  };

  const openBlockExplorer = (type, value) => {
    const explorerBase = EXPLORERS[network] || EXPLORERS.VIRTUAL_BASE;
    const explorerUrl = `${explorerBase}/${type}/${value}`;
    Alert.alert(
      'Block Explorer', 
      `عرض على ${NETWORK_NAMES[network]}:\n\n${explorerUrl}\n\nانسخ الرابط؟`,
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'نسخ', 
          onPress: async () => {
            await Clipboard.setStringAsync(explorerUrl);
            Alert.alert('تم', 'تم نسخ الرابط');
          }
        },
      ]
    );
  };

  const switchNetwork = () => {
    const networks = ['BASE', 'VIRTUAL_BASE', 'ETH']; // ✅ Base Mainnet first
    const networkNames = networks.map(net => NETWORK_NAMES[net]);
    
    Alert.alert(
      'تبديل الشبكة',
      'اختر الشبكة:',
      networks.map(net => ({
        text: NETWORK_NAMES[net] + (net === 'BASE' ? ' ⭐ (الافتراضي)' : ''),
        onPress: async () => {
          setNetwork(net);
          setLoading(true);
          Alert.alert('⏳ جاري التحديث', `جاري الاتصال بـ ${NETWORK_NAMES[net]}...`);
          
          // Small delay to let state update
          setTimeout(async () => {
            try {
              await loadBalances();
              setLoading(false);
              Alert.alert('✅ تم', `تم التبديل إلى ${NETWORK_NAMES[net]}\n\nالأرصدة المحدثة:\nETH: ${ethBalance}\nUSDC: ${usdcBalance}`);
            } catch (error) {
              setLoading(false);
              Alert.alert('خطأ', 'فشل تحميل الأرصدة');
            }
          }, 500);
        }
      }))
    );
  };

  const sendETH = async () => {
    if (!wallet || !toAddress || !amount) {
      Alert.alert('خطأ', 'الرجاء إدخال جميع الحقول');
      return;
    }

    try {
      setLoading(true);
      const rpcUrl = RPC_URLS[network];
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const signer = new ethers.Wallet(wallet.privateKey, provider);
      
      // Confirm before sending real transaction
      Alert.alert(
        '⚠️ تأكيد المعاملة الحقيقية',
        `ستقوم بإرسال معاملة حقيقية على ${NETWORK_NAMES[network]}!\n\nالمبلغ: ${amount} ETH\nإلى: ${toAddress.substring(0,10)}...\n\nهل أنت متأكد؟`,
        [
          { text: 'إلغاء', style: 'cancel', onPress: () => setLoading(false) },
          { text: 'تأكيد الإرسال', onPress: async () => {
            try {
              const tx = await signer.sendTransaction({
                to: toAddress,
                value: ethers.parseEther(amount),
              });
              
              setTxHash(tx.hash);
              Alert.alert(
                '✅ تم الإرسال!', 
                `المعاملة على البلوكشين:\n\nHash: ${tx.hash.substring(0, 20)}...\n\nجاري التأكيد...`,
                [{ text: 'حسناً', onPress: async () => {
                  await tx.wait();
                  await loadBalances();
                  Alert.alert('✅ مؤكد', 'تم تأكيد المعاملة على البلوكشين!');
                  setScreen('dashboard');
                }}]
              );
            } catch (err) {
              Alert.alert('خطأ', err.message || 'فشل إرسال المعاملة');
            } finally {
              setLoading(false);
            }
          }},
        ]
      );
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
      const rpcUrl = RPC_URLS[network];
      
      // ✅ Select correct USDC contract
      let usdcContractAddress;
      if (network === 'ETH') {
        usdcContractAddress = USDC_CONTRACTS.ETH;
      } else {
        usdcContractAddress = USDC_CONTRACTS.BASE;
      }
      
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      const signer = new ethers.Wallet(wallet.privateKey, provider);
      
      // Confirm before sending
      Alert.alert(
        '⚠️ تأكيد المعاملة الحقيقية',
        `ستقوم بإرسال معاملة USDC حقيقية على ${NETWORK_NAMES[network]}!\n\nالمبلغ: ${amount} USDC\nإلى: ${toAddress.substring(0,10)}...\n\nعقد USDC: ${usdcContractAddress.substring(0,10)}...\n\nهل أنت متأكد؟`,
        [
          { text: 'إلغاء', style: 'cancel', onPress: () => setLoading(false) },
          { text: 'تأكيد الإرسال', onPress: async () => {
            try {
              const usdcContractInstance = new ethers.Contract(
                usdcContractAddress,
                ['function transfer(address to, uint256 amount) returns (bool)'],
                signer
              );
              
              const tx = await usdcContractInstance.transfer(
                toAddress, 
                ethers.parseUnits(amount, 6)
              );
              
              setTxHash(tx.hash);
              Alert.alert(
                '✅ تم الإرسال!', 
                `معاملة USDC على البلوكشين:\n\nHash: ${tx.hash.substring(0, 20)}...\n\nجاري التأكيد...`,
                [{ text: 'حسناً', onPress: async () => {
                  await tx.wait();
                  await loadBalances();
                  Alert.alert('✅ مؤكد', 'تم تأكيد معاملة USDC على البلوكشين!');
                  setScreen('dashboard');
                }}]
              );
            } catch (err) {
              Alert.alert('خطأ', err.message || 'فشل إرسال USDC');
            } finally {
              setLoading(false);
            }
          }},
        ]
      );
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
      <ScrollView style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen('home')}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>استيراد محفظة</Text>
          
          <Text style={styles.label}>اختر طريقة الاستيراد:</Text>
          
          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setScreen('importMnemonic')}
          >
            <Ionicons name="key-outline" size={32} color="#3B82F6" />
            <View style={{flex: 1}}>
              <Text style={styles.optionTitle}>العبارة السرية</Text>
              <Text style={styles.optionDesc}>12 أو 24 كلمة</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color="#64748B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => setScreen('importPrivateKey')}
          >
            <Ionicons name="lock-closed-outline" size={32} color="#3B82F6" />
            <View style={{flex: 1}}>
              <Text style={styles.optionTitle}>المفتاح الخاص</Text>
              <Text style={styles.optionDesc}>0x...</Text>
            </View>
            <Ionicons name="chevron-back" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  // Import Mnemonic Screen
  if (screen === 'importMnemonic') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen('import')}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>العبارة السرية</Text>
          
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

  // Import Private Key Screen
  if (screen === 'importPrivateKey') {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setScreen('import')}
          >
            <Ionicons name="arrow-forward" size={24} color="#fff" />
          </TouchableOpacity>

          <Text style={styles.title}>المفتاح الخاص</Text>
          
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={3}
            placeholder="أدخل المفتاح الخاص (0x...)"
            placeholderTextColor="#64748B"
            value={privateKey}
            onChangeText={setPrivateKey}
            autoCapitalize="none"
            secureTextEntry
          />

          <View style={styles.warningBox}>
            <Ionicons name="shield-checkmark" size={24} color="#10B981" />
            <Text style={styles.warningText}>
              المفتاح الخاص يُحفظ بشكل آمن على جهازك فقط
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={importFromPrivateKey}>
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

        {/* Network Switcher */}
        <TouchableOpacity style={styles.networkSwitcher} onPress={switchNetwork}>
          <View style={styles.networkInfo}>
            <Ionicons name="globe" size={20} color="#3B82F6" />
            <Text style={styles.networkName}>{NETWORK_NAMES[network]}</Text>
          </View>
          <Ionicons name="swap-horizontal" size={20} color="#3B82F6" />
        </TouchableOpacity>

        {/* Blockchain Info */}
        <View style={styles.blockchainInfo}>
          <View style={styles.infoItem}>
            <Ionicons name="cube-outline" size={16} color="#3B82F6" />
            <Text style={styles.infoText}>Block: {blockNumber}</Text>
          </View>
          <TouchableOpacity
            style={styles.infoItem}
            onPress={() => openBlockExplorer('address', wallet.address)}
          >
            <Ionicons name="open-outline" size={16} color="#3B82F6" />
            <Text style={styles.infoLink}>Explorer</Text>
          </TouchableOpacity>
          <View style={styles.infoItem}>
            <Ionicons name="flash" size={16} color="#10B981" />
            <Text style={styles.infoTextGreen}>Real TX</Text>
          </View>
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

        {/* Blockchain Connection Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.statusText}>✅ معاملات حقيقية على Blockchain</Text>
          </View>
          <Text style={styles.statusSubtext}>جميع المعاملات تتم على {NETWORK_NAMES[network]}</Text>
        </View>
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
  optionCard: {
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
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  optionDesc: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  blockchainInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    marginHorizontal: 20,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#94A3B8',
    fontSize: 12,
  },
  infoTextGreen: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
  infoLink: {
    color: '#3B82F6',
    fontSize: 12,
    fontWeight: '600',
  },
  networkSwitcher: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  networkInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  networkName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  statusCard: {
    backgroundColor: '#1E293B',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  statusSubtext: {
    color: '#64748B',
    fontSize: 12,
    marginLeft: 28,
  },
});
