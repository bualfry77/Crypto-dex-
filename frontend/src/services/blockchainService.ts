import 'react-native-get-random-values';
import { ethers } from 'ethers';
import { NETWORKS, NetworkType } from '../utils/constants';

export interface NetworkBalance {
  network: NetworkType;
  balance: string;
  balanceFormatted: string;
  usdValue?: number;
}

export interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  timestamp: number;
  blockNumber: number;
  status: 'pending' | 'confirmed' | 'failed';
  network: NetworkType;
  gasUsed?: string;
  gasPrice?: string;
}

export class BlockchainService {
  private static providers: Map<string, ethers.JsonRpcProvider> = new Map();

  // Get or create provider for network
  static getProvider(network: NetworkType, useTestnet: boolean = false): ethers.JsonRpcProvider {
    const networkConfig = NETWORKS[network];
    const rpcUrl = useTestnet ? networkConfig.testnetRpc : networkConfig.mainnetRpc;
    const key = `${network}-${useTestnet}`;

    if (!this.providers.has(key)) {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      this.providers.set(key, provider);
    }

    return this.providers.get(key)!;
  }

  // Get balance for an address on a specific network
  static async getBalance(
    address: string,
    network: NetworkType,
    useTestnet: boolean = false
  ): Promise<NetworkBalance> {
    try {
      const provider = this.getProvider(network, useTestnet);
      const balance = await provider.getBalance(address);
      const balanceFormatted = ethers.formatEther(balance);

      return {
        network,
        balance: balance.toString(),
        balanceFormatted,
      };
    } catch (error) {
      console.error(`Error getting balance for ${network}:`, error);
      return {
        network,
        balance: '0',
        balanceFormatted: '0',
      };
    }
  }

  // Get balances for all networks
  static async getAllBalances(
    address: string,
    useTestnet: boolean = false
  ): Promise<NetworkBalance[]> {
    const networks: NetworkType[] = ['ETH', 'BASE', 'BNB'];
    
    const balancePromises = networks.map(network =>
      this.getBalance(address, network, useTestnet)
    );

    const balances = await Promise.all(balancePromises);
    return balances;
  }

  // Estimate gas for transaction
  static async estimateGas(
    from: string,
    to: string,
    amount: string,
    network: NetworkType,
    useTestnet: boolean = false
  ): Promise<{ gasLimit: bigint; gasPrice: bigint; totalCost: string }> {
    try {
      const provider = this.getProvider(network, useTestnet);
      
      // Get current gas price
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || BigInt(0);

      // Estimate gas limit
      const gasLimit = await provider.estimateGas({
        from,
        to,
        value: ethers.parseEther(amount),
      });

      // Calculate total cost
      const totalCost = gasLimit * gasPrice;

      return {
        gasLimit,
        gasPrice,
        totalCost: ethers.formatEther(totalCost),
      };
    } catch (error) {
      console.error('Error estimating gas:', error);
      throw new Error('Failed to estimate gas');
    }
  }

  // Send transaction
  static async sendTransaction(
    from: string,
    to: string,
    amount: string,
    privateKey: string,
    network: NetworkType,
    useTestnet: boolean = false
  ): Promise<TransactionData> {
    try {
      const provider = this.getProvider(network, useTestnet);
      const wallet = new ethers.Wallet(privateKey, provider);

      // Get current gas price
      const feeData = await provider.getFeeData();

      // Create transaction
      const tx = await wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount),
        gasPrice: feeData.gasPrice,
      });

      console.log('Transaction sent:', tx.hash);

      return {
        hash: tx.hash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        valueFormatted: ethers.formatEther(tx.value),
        timestamp: Date.now(),
        blockNumber: 0,
        status: 'pending',
        network,
      };
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  }

  // Wait for transaction confirmation
  static async waitForTransaction(
    txHash: string,
    network: NetworkType,
    useTestnet: boolean = false,
    confirmations: number = 1
  ): Promise<TransactionData> {
    try {
      const provider = this.getProvider(network, useTestnet);
      
      console.log(`Waiting for ${confirmations} confirmation(s)...`);
      const receipt = await provider.waitForTransaction(txHash, confirmations);

      if (!receipt) {
        throw new Error('Transaction receipt not found');
      }

      const tx = await provider.getTransaction(txHash);
      if (!tx) {
        throw new Error('Transaction not found');
      }

      return {
        hash: txHash,
        from: tx.from,
        to: tx.to || '',
        value: tx.value.toString(),
        valueFormatted: ethers.formatEther(tx.value),
        timestamp: Date.now(),
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        network,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice?.toString(),
      };
    } catch (error) {
      console.error('Error waiting for transaction:', error);
      throw error;
    }
  }

  // Get transaction history (simplified - using Alchemy API would be better)
  static async getTransactionHistory(
    address: string,
    network: NetworkType,
    useTestnet: boolean = false
  ): Promise<TransactionData[]> {
    try {
      const provider = this.getProvider(network, useTestnet);
      
      // Get latest block
      const latestBlock = await provider.getBlockNumber();
      
      // Look back 100 blocks (this is a simplified version)
      const fromBlock = Math.max(0, latestBlock - 100);
      
      const transactions: TransactionData[] = [];

      // Note: This is a basic implementation
      // For production, use Alchemy's enhanced API for transaction history
      
      return transactions;
    } catch (error) {
      console.error('Error getting transaction history:', error);
      return [];
    }
  }

  // Validate address
  static isValidAddress(address: string): boolean {
    return ethers.isAddress(address);
  }

  // Format address (short version)
  static formatAddress(address: string, chars: number = 4): string {
    if (!address) return '';
    return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
  }

  // Get block explorer URL
  static getExplorerUrl(
    network: NetworkType,
    type: 'address' | 'tx',
    value: string,
    useTestnet: boolean = false
  ): string {
    const networkConfig = NETWORKS[network];
    const explorer = useTestnet ? networkConfig.testnetExplorer : networkConfig.explorer;
    
    if (type === 'address') {
      return `${explorer}/address/${value}`;
    } else {
      return `${explorer}/tx/${value}`;
    }
  }

  // Get current network info
  static async getNetworkInfo(
    network: NetworkType,
    useTestnet: boolean = false
  ): Promise<{ chainId: number; blockNumber: number }> {
    try {
      const provider = this.getProvider(network, useTestnet);
      const networkInfo = await provider.getNetwork();
      const blockNumber = await provider.getBlockNumber();

      return {
        chainId: Number(networkInfo.chainId),
        blockNumber,
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      throw error;
    }
  }
}
