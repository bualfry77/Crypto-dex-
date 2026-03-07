// Network configurations
export const NETWORKS = {
  VIRTUAL_BASE: {
    id: 'virtual-base',
    name: 'Virtual Base',
    symbol: 'ETH',
    chainId: 8453,
    testnetChainId: 8453,
    mainnetRpc: process.env.EXPO_PUBLIC_TENDERLY_VIRTUAL_BASE_RPC || 'https://virtual.base.rpc.tenderly.co/6489289e-4554-4dff-a239-4cd3f863d4c4',
    testnetRpc: process.env.EXPO_PUBLIC_TENDERLY_VIRTUAL_BASE_RPC || 'https://virtual.base.rpc.tenderly.co/6489289e-4554-4dff-a239-4cd3f863d4c4',
    explorer: 'https://base.blockscout.com',
    testnetExplorer: 'https://base.blockscout.com',
    color: '#0052FF',
    icon: 'rocket-outline',
  },
  BASE: {
    id: 'base',
    name: 'Base Mainnet',
    symbol: 'ETH',
    chainId: 8453,
    testnetChainId: 84532,
    mainnetRpc: `https://base-mainnet.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_BASE_KEY}`,
    testnetRpc: `https://base-sepolia.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_BASE_KEY}`,
    explorer: 'https://basescan.org',
    testnetExplorer: 'https://sepolia.basescan.org',
    color: '#0052FF',
    icon: 'globe-outline',
  },
  ETH: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: 1,
    testnetChainId: 11155111,
    mainnetRpc: `https://eth-mainnet.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_ETH_KEY}`,
    testnetRpc: `https://eth-sepolia.g.alchemy.com/v2/${process.env.EXPO_PUBLIC_ALCHEMY_ETH_KEY}`,
    explorer: 'https://etherscan.io',
    testnetExplorer: 'https://sepolia.etherscan.io',
    color: '#627EEA',
    icon: 'logo-ethereum',
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
