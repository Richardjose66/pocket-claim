import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView, 
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Shield, Plus, Clock, FileText, TrendingUp, AlertCircle, X, Sparkles, CheckCircle, Camera, Upload } from 'lucide-react-native';

const STORAGE_KEY = '@pocketclaim_warranties_v1';

export default function App() {
  const [warranties, setWarranties] = useState([
    { id: '1', item: 'MacBook Pro 16"', store: 'Apple Store', expires: '12 Days Left', value: '$2,499', status: 'warning' },
    { id: '2', item: 'Sony WH-1000XM5', store: 'Amazon', expires: '180 Days Left', value: '$399', status: 'good' },
    { id: '3', item: 'Dyson V15 Vacuum', store: 'Best Buy', expires: '3 Days Left', value: '$749', status: 'critical' },
  ]);

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [paywallModalVisible, setPaywallModalVisible] = useState(false);

  // Form & Image states
  const [newItemName, setNewItemName] = useState('');
  const [newItemStore, setNewItemStore] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemDays, setNewItemDays] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Load saved warranties on startup
  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved !== null) {
        setWarranties(JSON.parse(saved));
      }
    } catch (e) {
      console.log('Error loading saved claims', e);
    }
  };

  const saveData = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('Error saving claim', e);
    }
  };

  // Image Picker & Mock OCR Scanner
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setReceiptImage(result.assets[0].uri);
      setIsScanning(true);

      // Simulate AI Receipt Scan extraction after 1.5 seconds
      setTimeout(() => {
        setIsScanning(false);
        setNewItemName('PlayStation 5 Pro');
        setNewItemStore('GameStop');
        setNewItemValue('699');
        setNewItemDays('365');
      }, 1500);
    }
  };

  // Add warranty handler
  const handleAddClaim = () => {
    if (!newItemName || !newItemValue) {
      Alert.alert('Missing Info', 'Please enter at least an Item Name and Price.');
      return;
    }

    const daysNum = parseInt(newItemDays) || 30;
    let statusCalc = 'good';
    if (daysNum <= 5) statusCalc = 'critical';
    else if (daysNum <= 15) statusCalc = 'warning';

    const newClaim = {
      id: Date.now().toString(),
      item: newItemName,
      store: newItemStore || 'Store Receipt',
      value: `$${newItemValue.replace('$', '')}`,
      expires: `${daysNum} Days Left`,
      status: statusCalc
    };

    const updatedList = [newClaim, ...warranties];
    setWarranties(updatedList);
    saveData(updatedList);

    setNewItemName('');
    setNewItemStore('');
    setNewItemValue('');
    setNewItemDays('');
    setReceiptImage(null);
    setAddModalVisible(false);
  };

  // Total value calculator
  const totalValue = warranties.reduce((acc, curr) => {
    const num = parseFloat(curr.value.replace(/[^0-9.-]+/g, '')) || 0;
    return acc + num;
  }, 0);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0a080d" />
      
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <Shield color="#e11d48" size={28} />
          <Text style={styles.brandTitle}>PocketClaim</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
          <Plus color="#ffffff" size={20} />
          <Text style={styles.addButtonText}>Add Claim</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Value Protected Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Total Value Protected</Text>
          <Text style={styles.statsValue}>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
          <View style={styles.statsFooter}>
            <TrendingUp color="#fb7185" size={16} />
            <Text style={styles.statsSubtext}>{warranties.length} Active Warranties & Receipts</Text>
          </View>
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Expirations</Text>
          <Text style={styles.seeAll}>View All</Text>
        </View>

        {/* Warranty Cards */}
        {warranties.map((item) => (
          <View key={item.id} style={styles.claimCard}>
            <View style={styles.cardMain}>
              <View style={styles.iconBox}>
                <FileText color="#fb7185" size={22} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.itemTitle}>{item.item}</Text>
                <Text style={styles.itemSub}>{item.store} • {item.value}</Text>
              </View>

              <View style={[
                styles.badge, 
                item.status === 'critical' ? styles.badgeCritical : item.status === 'warning' ? styles.badgeWarning : styles.badgeGood
              ]}>
                <Clock color="#ffffff" size={13} />
                <Text style={styles.badgeTextWhite}>
                  {item.expires}
                </Text>
              </View>
            </View>
          </View>
        ))}

        {/* RevenueCat Pro Banner Trigger */}
        <TouchableOpacity style={styles.proBanner} onPress={() => setPaywallModalVisible(true)}>
          <AlertCircle color="#fb7185" size={20} />
          <View style={styles.proTextGroup}>
            <Text style={styles.proTitle}>Unlock Auto-Receipt Sync</Text>
            <Text style={styles.proSub}>Automatically scan Gmail for purchase warranties.</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* --- ADD CLAIM MODAL WITH RECEIPT SCANNER --- */}
      <Modal visible={addModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Warranty / Receipt</Text>
              <TouchableOpacity onPress={() => { setAddModalVisible(false); setReceiptImage(null); }}>
                <X color="#94a3b8" size={22} />
              </TouchableOpacity>
            </View>

            {/* Receipt Upload / Scan Box */}
            <TouchableOpacity style={styles.uploadBox} onPress={pickImage}>
              {receiptImage ? (
                <View style={styles.receiptPreviewContainer}>
                  <Image source={{ uri: receiptImage }} style={styles.receiptImagePreview} />
                  {isScanning && (
                    <View style={styles.scanningOverlay}>
                      <ActivityIndicator size="small" color="#e11d48" />
                      <Text style={styles.scanningText}>AI Scanning Receipt...</Text>
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <Camera color="#fb7185" size={24} />
                  <Text style={styles.uploadText}>Upload Receipt Photo for AI Auto-Fill</Text>
                </View>
              )}
            </TouchableOpacity>

            <TextInput 
              style={styles.input} 
              placeholder="Item Name (e.g. iPad Air)" 
              placeholderTextColor="#64748b"
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Store / Retailer (e.g. Target)" 
              placeholderTextColor="#64748b"
              value={newItemStore}
              onChangeText={setNewItemStore}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Item Price ($)" 
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={newItemValue}
              onChangeText={setNewItemValue}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Warranty Duration in Days (e.g. 365)" 
              placeholderTextColor="#64748b"
              keyboardType="numeric"
              value={newItemDays}
              onChangeText={setNewItemDays}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleAddClaim}>
              <Text style={styles.saveButtonText}>Save Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* --- REVENUECAT PAYWALL MODAL --- */}
      <Modal visible={paywallModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.paywallBox]}>
            <TouchableOpacity style={styles.closePaywall} onPress={() => setPaywallModalVisible(false)}>
              <X color="#94a3b8" size={22} />
            </TouchableOpacity>

            <View style={styles.paywallHeader}>
              <Sparkles color="#e11d48" size={40} />
              <Text style={styles.paywallTitle}>PocketClaim Pro</Text>
              <Text style={styles.paywallSub}>Never manually log a physical receipt again.</Text>
            </View>

            <View style={styles.featureList}>
              <View style={styles.featureRow}>
                <CheckCircle color="#e11d48" size={18} />
                <Text style={styles.featureText}>Automatic Gmail Receipt Auto-Scan</Text>
              </View>
              <View style={styles.featureRow}>
                <CheckCircle color="#e11d48" size={18} />
                <Text style={styles.featureText}>Unlimited Warranty & Receipt Storage</Text>
              </View>
              <View style={styles.featureRow}>
                <CheckCircle color="#e11d48" size={18} />
                <Text style={styles.featureText}>Price-Drop Refund Instant Alerts</Text>
              </View>
              <View style={styles.featureRow}>
                <CheckCircle color="#e11d48" size={18} />
                <Text style={styles.featureText}>Export PDF Reports for Insurance Claims</Text>
              </View>
            </View>

            {/* Pricing Options */}
            <TouchableOpacity style={styles.planCardSelected}>
              <View>
                <Text style={styles.planTitle}>Annual Access</Text>
                <Text style={styles.planSub}>7-Day Free Trial • $29.99/yr</Text>
              </View>
              <Text style={styles.savingsTag}>SAVE 50%</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.planCard}>
              <View>
                <Text style={styles.planTitle}>Monthly Access</Text>
                <Text style={styles.planSub}>$4.99 / month</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.subscribeButton} onPress={() => {
              Alert.alert('RevenueCat SDK Active', 'Paywall integration successful!');
              setPaywallModalVisible(false);
            }}>
              <Text style={styles.subscribeText}>Start 7-Day Free Trial</Text>
            </TouchableOpacity>

            <Text style={styles.legalText}>Powered by RevenueCat • Cancel anytime in store settings</Text>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a080d' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1f1322' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#be123c', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4 },
  addButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  scrollContent: { padding: 20 },
  
  statsCard: { 
    backgroundColor: '#1c0d18', 
    borderRadius: 16, 
    padding: 20, 
    marginBottom: 24, 
    borderWidth: 1, 
    borderColor: '#4c0519' 
  },
  statsLabel: { color: '#fda4af', fontSize: 14 },
  statsValue: { color: '#ffffff', fontSize: 32, fontWeight: 'bold', marginVertical: 6 },
  statsFooter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statsSubtext: { color: '#fb7185', fontSize: 13, fontWeight: '500' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  seeAll: { color: '#fb7185', fontSize: 14 },
  
  claimCard: { backgroundColor: '#140a12', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#2e1220' },
  cardMain: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#270a16', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  itemTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  itemSub: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
  badgeCritical: { backgroundColor: '#9f1239' },
  badgeWarning: { backgroundColor: '#b45309' },
  badgeGood: { backgroundColor: '#047857' },
  badgeTextWhite: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  
  proBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f0813', borderWidth: 1, borderColor: '#e11d48', borderRadius: 12, padding: 16, marginTop: 12, gap: 12 },
  proTextGroup: { flex: 1 },
  proTitle: { color: '#fb7185', fontWeight: 'bold', fontSize: 15 },
  proSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#140a12', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#3b1222' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },
  
  // Upload Receipt UI
  uploadBox: { backgroundColor: '#0a080d', borderRadius: 12, borderWidth: 1, borderColor: '#3b1222', borderStyle: 'dashed', padding: 16, marginBottom: 16, alignItems: 'center', justifyContent: 'center', minHeight: 90 },
  uploadPlaceholder: { alignItems: 'center', gap: 6 },
  uploadText: { color: '#fb7185', fontSize: 13, fontWeight: '500' },
  receiptPreviewContainer: { width: '100%', height: 90, borderRadius: 8, overflow: 'hidden', position: 'relative' },
  receiptImagePreview: { width: '100%', height: '100%' },
  scanningOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 8, 13, 0.85)', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  scanningText: { color: '#ffffff', fontSize: 13, fontWeight: 'bold' },

  input: { backgroundColor: '#0a080d', borderRadius: 10, padding: 14, color: '#ffffff', marginBottom: 12, borderWidth: 1, borderColor: '#2e1220' },
  saveButton: { backgroundColor: '#e11d48', paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  saveButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },

  paywallBox: { backgroundColor: '#0a080d', borderTopWidth: 2, borderTopColor: '#e11d48' },
  closePaywall: { alignSelf: 'flex-end' },
  paywallHeader: { alignItems: 'center', marginVertical: 12 },
  paywallTitle: { color: '#ffffff', fontSize: 24, fontWeight: 'bold', marginTop: 10 },
  paywallSub: { color: '#94a3b8', fontSize: 14, textAlign: 'center', marginTop: 4 },
  featureList: { marginVertical: 16, gap: 10 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  featureText: { color: '#e2e8f0', fontSize: 14 },
  planCardSelected: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#270a16', borderWidth: 2, borderColor: '#e11d48', borderRadius: 12, padding: 16, marginBottom: 10 },
  planCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#140a12', borderWidth: 1, borderColor: '#2e1220', borderRadius: 12, padding: 16, marginBottom: 16 },
  planTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  planSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  savingsTag: { backgroundColor: '#e11d48', color: '#ffffff', fontWeight: 'bold', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  subscribeButton: { backgroundColor: '#e11d48', paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  subscribeText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  legalText: { color: '#64748b', fontSize: 11, textAlign: 'center', marginTop: 12 }
});