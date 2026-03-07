// Network configurations
export const NETWORKS = {
  ETH: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    testnetChainId: 11155111, // Sepolia
    mainnetRpc: `https://eth-mainnet.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_ETH_KEY}`,
    testnetRpc: `https://eth-sepolia.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_ETH_KEY}`,
    explorer: 'https://etherscan.io',
    testnetExplorer: 'https://sepolia.etherscan.io',
    color: '#627EEA',
    icon: 'logo-ethereum',
  },
  BASE: {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    chainId: 8453,
    testnetChainId: 84532, // Base Sepolia
    mainnetRpc: `https://base-mainnet.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_BASE_KEY}`,
    testnetRpc: `https://base-sepolia.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_BASE_KEY}`,
    explorer: 'https://basescan.org',
    testnetExplorer: 'https://sepolia.basescan.org',
    color: '#0052FF',
    icon: 'globe-outline',
  },
  BNB: {
    id: 'bnb',
    name: 'BNB Chain',
    symbol: 'BNB',
    chainId: 56,
    testnetChainId: 97,
    mainnetRpc: `https://bsc-dataseed1.binance.org`,
    testnetRpc: `https://data-seed-prebsc-1-s1.binance.org:8545`,
    explorer: 'https://bscscan.com',
    testnetExplorer: 'https://testnet.bscscan.com',
    color: '#F3BA2F',
    icon: 'logo-bitcoin',
  },
};

export type NetworkType = keyof typeof NETWORKS;

// Storage keys
export const STORAGE_KEYS = {
  WALLET_ENCRYPTED: 'wallet_encrypted',
  ADDRESSES: 'wallet_addresses',
  WATCH_ONLY_ADDRESSES: 'watch_only_addresses',
  USE_TESTNET: 'use_testnet',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  SELECTED_NETWORK: 'selected_network',
};
