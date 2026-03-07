import 'react-native-get-random-values';
import { ethers } from 'ethers';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { STORAGE_KEYS } from '@/utils/constants';

export interface WalletData {
  address: string;
  mnemonic?: string;
  privateKey?: string;
  isWatchOnly?: boolean;
}

export class WalletService {
  // Generate new wallet with mnemonic
  static async createNewWallet(): Promise<WalletData> {
    try {
      // Generate random mnemonic
      const wallet = ethers.Wallet.createRandom();
      
      return {
        address: wallet.address,
        mnemonic: wallet.mnemonic?.phrase,
        privateKey: wallet.privateKey,
        isWatchOnly: false,
      };
    } catch (error) {
      console.error('Error creating wallet:', error);
      throw new Error('Failed to create wallet');
    }
  }

  // Import wallet from mnemonic
  static async importWalletFromMnemonic(mnemonic: string): Promise<WalletData> {
    try {
      const wallet = ethers.Wallet.fromPhrase(mnemonic);
      
      return {
        address: wallet.address,
        mnemonic: wallet.mnemonic?.phrase,
        privateKey: wallet.privateKey,
        isWatchOnly: false,
      };
    } catch (error) {
      console.error('Error importing wallet:', error);
      throw new Error('Invalid mnemonic phrase');
    }
  }

  // Import wallet from private key
  static async importWalletFromPrivateKey(privateKey: string): Promise<WalletData> {
    try {
      const wallet = new ethers.Wallet(privateKey);
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        isWatchOnly: false,
      };
    } catch (error) {
      console.error('Error importing wallet from private key:', error);
      throw new Error('Invalid private key');
    }
  }

  // Add watch-only address
  static async addWatchOnlyAddress(address: string): Promise<WalletData> {
    try {
      // Validate address
      if (!ethers.isAddress(address)) {
        throw new Error('Invalid Ethereum address');
      }

      return {
        address: ethers.getAddress(address), // Checksum format
        isWatchOnly: true,
      };
    } catch (error) {
      console.error('Error adding watch-only address:', error);
      throw new Error('Invalid address');
    }
  }

  // Encrypt and save wallet
  static async saveWallet(wallet: WalletData, useBiometric: boolean = false): Promise<void> {
    try {
      // Check if biometric is available and enabled
      if (useBiometric) {
        const compatible = await LocalAuthentication.hasHardwareAsync();
        const enrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (!compatible || !enrolled) {
          throw new Error('Biometric authentication not available');
        }

        // Authenticate user
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: 'Authenticate to save wallet',
          fallbackLabel: 'Use passcode',
        });

        if (!result.success) {
          throw new Error('Authentication failed');
        }
      }

      // Save wallet data (encrypted by SecureStore)
      if (!wallet.isWatchOnly && wallet.privateKey) {
        await SecureStore.setItemAsync(
          STORAGE_KEYS.WALLET_ENCRYPTED,
          JSON.stringify({
            address: wallet.address,
            privateKey: wallet.privateKey,
            mnemonic: wallet.mnemonic,
          })
        );
      }

      // Save address list
      const addresses = await this.getSavedAddresses();
      if (!addresses.includes(wallet.address)) {
        addresses.push(wallet.address);
        await SecureStore.setItemAsync(
          STORAGE_KEYS.ADDRESSES,
          JSON.stringify(addresses)
        );
      }

      // Save watch-only flag if applicable
      if (wallet.isWatchOnly) {
        const watchOnly = await this.getWatchOnlyAddresses();
        if (!watchOnly.includes(wallet.address)) {
          watchOnly.push(wallet.address);
          await SecureStore.setItemAsync(
            STORAGE_KEYS.WATCH_ONLY_ADDRESSES,
            JSON.stringify(watchOnly)
          );
        }
      }

      console.log('Wallet saved successfully');
    } catch (error) {
      console.error('Error saving wallet:', error);
      throw error;
    }
  }

  // Load wallet
  static async loadWallet(address: string): Promise<WalletData | null> {
    try {
      const walletJson = await SecureStore.getItemAsync(STORAGE_KEYS.WALLET_ENCRYPTED);
      
      if (!walletJson) {
        return null;
      }

      const walletData = JSON.parse(walletJson);
      
      if (walletData.address.toLowerCase() === address.toLowerCase()) {
        return walletData;
      }

      return null;
    } catch (error) {
      console.error('Error loading wallet:', error);
      return null;
    }
  }

  // Get all saved addresses
  static async getSavedAddresses(): Promise<string[]> {
    try {
      const addressesJson = await SecureStore.getItemAsync(STORAGE_KEYS.ADDRESSES);
      return addressesJson ? JSON.parse(addressesJson) : [];
    } catch (error) {
      console.error('Error getting saved addresses:', error);
      return [];
    }
  }

  // Get watch-only addresses
  static async getWatchOnlyAddresses(): Promise<string[]> {
    try {
      const watchOnlyJson = await SecureStore.getItemAsync(STORAGE_KEYS.WATCH_ONLY_ADDRESSES);
      return watchOnlyJson ? JSON.parse(watchOnlyJson) : [];
    } catch (error) {
      console.error('Error getting watch-only addresses:', error);
      return [];
    }
  }

  // Check if address is watch-only
  static async isWatchOnly(address: string): Promise<boolean> {
    const watchOnly = await this.getWatchOnlyAddresses();
    return watchOnly.some(addr => addr.toLowerCase() === address.toLowerCase());
  }

  // Sign transaction
  static async signTransaction(
    address: string,
    transaction: ethers.TransactionRequest
  ): Promise<string> {
    try {
      // Check if watch-only
      const isWatchOnly = await this.isWatchOnly(address);
      if (isWatchOnly) {
        throw new Error('Cannot sign transaction with watch-only address');
      }

      // Load wallet
      const walletData = await this.loadWallet(address);
      if (!walletData || !walletData.privateKey) {
        throw new Error('Wallet not found or missing private key');
      }

      // Create wallet instance
      const wallet = new ethers.Wallet(walletData.privateKey);

      // Sign transaction
      const signedTx = await wallet.signTransaction(transaction);
      
      return signedTx;
    } catch (error) {
      console.error('Error signing transaction:', error);
      throw error;
    }
  }

  // Delete wallet
  static async deleteWallet(address: string): Promise<void> {
    try {
      // Remove from addresses list
      const addresses = await this.getSavedAddresses();
      const filteredAddresses = addresses.filter(
        addr => addr.toLowerCase() !== address.toLowerCase()
      );
      await SecureStore.setItemAsync(
        STORAGE_KEYS.ADDRESSES,
        JSON.stringify(filteredAddresses)
      );

      // Remove from watch-only if present
      const watchOnly = await this.getWatchOnlyAddresses();
      const filteredWatchOnly = watchOnly.filter(
        addr => addr.toLowerCase() !== address.toLowerCase()
      );
      await SecureStore.setItemAsync(
        STORAGE_KEYS.WATCH_ONLY_ADDRESSES,
        JSON.stringify(filteredWatchOnly)
      );

      // If it was the main wallet, clear encrypted data
      const walletData = await this.loadWallet(address);
      if (walletData) {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.WALLET_ENCRYPTED);
      }

      console.log('Wallet deleted successfully');
    } catch (error) {
      console.error('Error deleting wallet:', error);
      throw error;
    }
  }
}
