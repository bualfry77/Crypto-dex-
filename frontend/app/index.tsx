import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useWalletStore } from '../src/store/walletStore';

export default function Index() {
  const router = useRouter();
  const { loadSavedAddresses, savedAddresses } = useWalletStore();

  useEffect(() => {
    // Load saved addresses on mount
    loadSavedAddresses();
  }, []);

  useEffect(() => {
    // If user has saved addresses, redirect to dashboard
    if (savedAddresses.length > 0) {
      // Auto-navigate to dashboard after 1 second
      const timer = setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [savedAddresses]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Ionicons name="wallet" size={80} color="#3B82F6" />
        </View>
        <Text style={styles.title}>محفظة العملات المشفرة</Text>
        <Text style={styles.subtitle}>محفظة آمنة متعددة السلاسل</Text>
      </View>

      <View style={styles.networkIcons}>
        <View style={styles.networkBadge}>
          <Ionicons name="logo-ethereum" size={24} color="#627EEA" />
          <Text style={styles.networkText}>ETH</Text>
        </View>
        <View style={styles.networkBadge}>
          <Ionicons name="globe-outline" size={24} color="#0052FF" />
          <Text style={styles.networkText}>Base</Text>
        </View>
        <View style={styles.networkBadge}>
          <Ionicons name="logo-bitcoin" size={24} color="#F3BA2F" />
          <Text style={styles.networkText}>BNB</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={() => router.push('/wallet/create')}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.buttonText}>إنشاء محفظة جديدة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/wallet/import')}
        >
          <Ionicons name="download-outline" size={24} color="#3B82F6" />
          <Text style={styles.buttonTextSecondary}>استيراد محفظة</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => router.push('/wallet/watch')}
        >
          <Ionicons name="eye-outline" size={24} color="#3B82F6" />
          <Text style={styles.buttonTextSecondary}>مراقبة عنوان فقط</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        <Text style={styles.footerText}>مشفر وآمن بالكامل</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 3,
    borderColor: '#3B82F6',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
  },
  networkIcons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 48,
  },
  networkBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  networkText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 16,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 48,
  },
  footerText: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '500',
  },
});