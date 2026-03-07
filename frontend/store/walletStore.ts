import { create } from 'zustand';
import { WalletData, WalletService } from '@/services/walletService';
import { NetworkBalance, BlockchainService } from '@/services/blockchainService';
import { NetworkType } from '@/utils/constants';

interface WalletStore {
  // State
  currentWallet: WalletData | null;
  balances: NetworkBalance[];
  selectedNetwork: NetworkType;
  useTestnet: boolean;
  isLoading: boolean;
  error: string | null;
  savedAddresses: string[];

  // Actions
  setCurrentWallet: (wallet: WalletData | null) => void;
  setBalances: (balances: NetworkBalance[]) => void;
  setSelectedNetwork: (network: NetworkType) => void;
  setUseTestnet: (useTestnet: boolean) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setSavedAddresses: (addresses: string[]) => void;
  
  // Async actions
  loadWallet: (address: string) => Promise<void>;
  refreshBalances: () => Promise<void>;
  loadSavedAddresses: () => Promise<void>;
}

export const useWalletStore = create<WalletStore>((set, get) => ({
  // Initial state
  currentWallet: null,
  balances: [],
  selectedNetwork: 'ETH',
  useTestnet: true, // Start with testnet for safety
  isLoading: false,
  error: null,
  savedAddresses: [],

  // Setters
  setCurrentWallet: (wallet) => set({ currentWallet: wallet }),
  
  setBalances: (balances) => set({ balances }),
  
  setSelectedNetwork: (network) => set({ selectedNetwork: network }),
  
  setUseTestnet: (useTestnet) => {
    set({ useTestnet });
    // Refresh balances when switching networks
    get().refreshBalances();
  },
  
  setIsLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  setSavedAddresses: (addresses) => set({ savedAddresses: addresses }),

  // Load wallet from storage
  loadWallet: async (address: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const wallet = await WalletService.loadWallet(address);
      
      if (!wallet) {
        // Check if it's a watch-only address
        const isWatchOnly = await WalletService.isWatchOnly(address);
        if (isWatchOnly) {
          set({
            currentWallet: { address, isWatchOnly: true },
            isLoading: false,
          });
          // Load balances
          await get().refreshBalances();
          return;
        }
        
        throw new Error('Wallet not found');
      }

      set({ currentWallet: wallet, isLoading: false });
      
      // Load balances
      await get().refreshBalances();
    } catch (error: any) {
      console.error('Error loading wallet:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Refresh balances for current wallet
  refreshBalances: async () => {
    const { currentWallet, useTestnet } = get();
    
    if (!currentWallet) {
      return;
    }

    try {
      set({ isLoading: true });
      
      const balances = await BlockchainService.getAllBalances(
        currentWallet.address,
        useTestnet
      );
      
      set({ balances, isLoading: false });
    } catch (error: any) {
      console.error('Error refreshing balances:', error);
      set({ error: error.message, isLoading: false });
    }
  },

  // Load saved addresses
  loadSavedAddresses: async () => {
    try {
      const addresses = await WalletService.getSavedAddresses();
      set({ savedAddresses: addresses });
    } catch (error: any) {
      console.error('Error loading saved addresses:', error);
    }
  },
}));
