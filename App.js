import React, { useState, useEffect } from 'react';
import Purchases from 'react-native-purchases';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  StatusBar,
  Modal,
  TextInput,
  Alert,
  Image,
  ActivityIndicator
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { 
  Shield, 
  Plus, 
  Clock, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  X, 
  Sparkles, 
  CheckCircle, 
  Camera, 
  Crown, 
  Trash2, 
  Check, 
  Search,
  Inbox,
  CornerDownLeft,
  Bell,
  BellRing,
  ArrowRight,
  Zap,
  Tag,
  Copy,
  Mail,
  TrendingDown
} from 'lucide-react-native';

const STORAGE_KEY = '@pocketclaim_warranties_v1';
const PRO_KEY = '@pocketclaim_pro_status_v1';
const ONBOARDED_KEY = '@pocketclaim_seen_onboarding_v1';

export default function App() {
  const [warranties, setWarranties] = useState([
    { 
      id: '1', 
      item: 'MacBook Pro 16"', 
      store: 'Apple Store', 
      expires: '12 Days Left', 
      value: '$2,499', 
      status: 'warning', 
      daysRemaining: 12, 
      reminderActive: true,
      priceDrop: null
    },
    { 
      id: '2', 
      item: 'Sony WH-1000XM5', 
      store: 'Amazon', 
      expires: '180 Days Left', 
      value: '$399', 
      status: 'good', 
      daysRemaining: 180, 
      reminderActive: false,
      priceDrop: { originalPrice: 399, currentPrice: 349, dropAmount: 50, odds: '92% High' }
    },
    { 
      id: '3', 
      item: 'Dyson V15 Vacuum', 
      store: 'Best Buy', 
      expires: '3 Days Left', 
      value: '$749', 
      status: 'critical', 
      daysRemaining: 3, 
      reminderActive: true,
      priceDrop: { originalPrice: 749, currentPrice: 679, dropAmount: 70, odds: '85% High' }
    },
  ]);

  // Onboarding State
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true);
  const [onboardStep, setOnboardStep] = useState(0);

  // Search & Auto-Suggestion State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const filterPills = ['All', 'Active', 'Expiring Soon', 'Claimed'];

  // Pro State & Subscription Tiers
  const [isPro, setIsPro] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('annual');

  // Modal states
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [paywallModalVisible, setPaywallModalVisible] = useState(false);
  const [claimLetterModalVisible, setClaimLetterModalVisible] = useState(false);

  // AI Claim Generator State
  const [selectedItemForClaim, setSelectedItemForClaim] = useState(null);
  const [claimReason, setClaimReason] = useState('Price Mismatch / Price Drop');
  const [generatedLetter, setGeneratedLetter] = useState('');

  // Form & Image states
  const [newItemName, setNewItemName] = useState('');
  const [newItemStore, setNewItemStore] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemDays, setNewItemDays] = useState('');
  const [receiptImage, setReceiptImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Initialize RevenueCat SDK & load saved data / onboarding check on startup
  useEffect(() => {
    try {
      Purchases.configure({ apiKey: "test_SaJ0j1PFIAYUwoSPCNINLxQblgF" });
    } catch (e) {
      console.log("RevenueCat web preview mode", e);
    }

    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const onboardedStatus = await AsyncStorage.getItem(ONBOARDED_KEY);
      if (onboardedStatus === null) {
        setHasSeenOnboarding(false);
      }

      const savedWarranties = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedWarranties !== null) setWarranties(JSON.parse(savedWarranties));
      
      const savedPro = await AsyncStorage.getItem(PRO_KEY);
      if (savedPro !== null) setIsPro(JSON.parse(savedPro));
    } catch (e) {
      console.log('Error loading initial data', e);
    }
  };

  const completeOnboarding = async () => {
    setHasSeenOnboarding(true);
    try {
      await AsyncStorage.setItem(ONBOARDED_KEY, 'true');
    } catch (e) {
      console.log('Error saving onboarding status', e);
    }
  };

  const saveData = async (data) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.log('Error saving claim', e);
    }
  };

  // Toggle Push Notification Reminder
  const handleToggleReminder = (id) => {
    const updatedList = warranties.map(item => {
      if (item.id === id) {
        const nextState = !item.reminderActive;
        if (nextState) {
          Alert.alert(
            '🔔 Reminder Set!',
            `Push notification scheduled 3 days before ${item.item}'s warranty expires.`
          );
        }
        return { ...item, reminderActive: nextState };
      }
      return item;
    });

    setWarranties(updatedList);
    saveData(updatedList);
  };

  // Open AI Claim Letter Generator
  const handleOpenClaimGenerator = (item, defaultReason = 'Price Mismatch / Price Drop') => {
    setSelectedItemForClaim(item);
    setClaimReason(defaultReason);
    generateLetterContent(item, defaultReason);
    setClaimLetterModalVisible(true);
  };

  // Generate Letter Text based on Item and Selected Reason
  const generateLetterContent = (item, reason) => {
    if (!item) return;
    
    let letterText = `Subject: Price Match Refund Request - Order #${item.item.replace(/\s+/g, '').toUpperCase()}-2026\n\n`;
    letterText += `Dear ${item.store} Customer Support Team,\n\n`;

    if (reason.includes('Price Mismatch')) {
      const dropAmt = item.priceDrop ? `$${item.priceDrop.dropAmount}` : '$50';
      const curPrice = item.priceDrop ? `$${item.priceDrop.currentPrice}` : '$349';
      letterText += `I am writing to formally request a price adjustment for my recent purchase of the ${item.item} (${item.value}), bought at ${item.store}.\n\n`;
      letterText += `I noticed that the price for this exact item has recently dropped to ${curPrice} (a difference of ${dropAmt}). Since this purchase was made within your standard price guarantee and return window (${item.expires}), I kindly request a refund for the price difference of ${dropAmt} back to my original payment method.\n\n`;
    } else if (reason.includes('Defective')) {
      letterText += `I am contacting support regarding a defect with my ${item.item} purchased at ${item.store} for ${item.value}.\n\n`;
      letterText += `The item has developed a technical issue during normal usage within the active warranty period (${item.expires}). As per your store policy and manufacturer warranty, I would like to request an immediate replacement or repair.\n\n`;
    } else {
      letterText += `I am writing regarding my purchase of ${item.item} from ${item.store} (${item.value}).\n\n`;
      letterText += `I would like to initiate a return / exchange request within my active policy window (${item.expires}). Please advise on the return shipping instructions.\n\n`;
    }

    letterText += `Thank you for your prompt assistance.\n\nBest regards,\nVerified PocketClaim Vault User`;
    setGeneratedLetter(letterText);
  };

  // Real Clipboard Copy Handler
  const handleCopyLetter = async () => {
    try {
      await Clipboard.setStringAsync(generatedLetter);
      Alert.alert('📋 Copied to Clipboard!', 'Claim letter copied to clipboard. Ready to paste in email.');
    } catch (e) {
      console.log('Error copying to clipboard', e);
    }
  };

  // Auto-Suggestions Search
  const getAutoSuggestions = () => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const suggestions = new Set();

    warranties.forEach(item => {
      if (item.item.toLowerCase().includes(query)) suggestions.add(item.item);
      if (item.store.toLowerCase().includes(query)) suggestions.add(item.store);
    });

    return Array.from(suggestions).slice(0, 4);
  };

  const suggestionsList = getAutoSuggestions();

  // Filter Logic
  const getFilteredWarranties = () => {
    return warranties.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.store.toLowerCase().includes(searchQuery.toLowerCase());

      let matchesFilter = true;
      if (activeFilter === 'Active') {
        matchesFilter = item.status === 'good' || item.status === 'warning' || item.status === 'critical';
      } else if (activeFilter === 'Expiring Soon') {
        matchesFilter = item.status === 'critical' || item.status === 'warning';
      } else if (activeFilter === 'Claimed') {
        matchesFilter = item.status === 'claimed';
      }

      return matchesSearch && matchesFilter;
    });
  };

  const filteredWarranties = getFilteredWarranties();

  // Handle Delete Warranty
  const handleDeleteClaim = (id) => {
    const updatedList = warranties.filter(item => item.id !== id);
    setWarranties(updatedList);
    saveData(updatedList);
  };

  // Handle Mark as Claimed
  const handleMarkAsClaimed = (id) => {
    const updatedList = warranties.map(item => {
      if (item.id === id) {
        return { ...item, expires: 'Claimed / Refunded', status: 'claimed', reminderActive: false, priceDrop: null };
      }
      return item;
    });
    setWarranties(updatedList);
    saveData(updatedList);
  };

  // Handle RevenueCat Purchase Simulation
  const handleSubscribe = async () => {
    setIsPro(true);
    try {
      await AsyncStorage.setItem(PRO_KEY, JSON.stringify(true));
    } catch (e) {
      console.log('Error saving Pro status', e);
    }

    setPaywallModalVisible(false);
    
    setTimeout(() => {
      Alert.alert(
        '🎉 Welcome to PocketClaim Pro!',
        'Your 7-Day Free Trial is now active. Automatic Gmail Receipt Sync has been enabled.',
        [{ text: 'Great!', style: 'default' }]
      );
    }, 300);
  };

  // Image Picker & Mock OCR Scanner (Expo SDK 51+ compliant)
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Permission to access gallery is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setReceiptImage(result.assets[0].uri);
      setIsScanning(true);

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
      status: statusCalc,
      daysRemaining: daysNum,
      reminderActive: true,
      priceDrop: null
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

  // Onboarding Carousel
  const onboardingSlides = [
    {
      icon: <Shield color="#e11d48" size={64} />,
      title: "Never Lose a Refund Again",
      subtitle: "PocketClaim automatically tracks your warranties, return windows, and store policies in one secure vault."
    },
    {
      icon: <Camera color="#fb7185" size={64} />,
      title: "AI Receipt & Gmail Sync",
      subtitle: "Snap a photo of any physical receipt or let our Pro scanner automatically index your digital inbox purchases."
    },
    {
      icon: <Zap color="#f43f5e" size={64} />,
      title: "Proactive Protection",
      subtitle: "Get smart push notifications before your coverage expires so you never miss out on free replacements."
    }
  ];

  if (!hasSeenOnboarding) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.onboardContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#0a080d" />
          
          <View style={styles.onboardHeader}>
            <Shield color="#e11d48" size={32} />
            <Text style={styles.onboardBrand}>PocketClaim</Text>
          </View>

          <View style={styles.onboardContent}>
            <View style={styles.onboardIconCircle}>
              {onboardingSlides[onboardStep].icon}
            </View>
            <Text style={styles.onboardTitle}>{onboardingSlides[onboardStep].title}</Text>
            <Text style={styles.onboardSubtitle}>{onboardingSlides[onboardStep].subtitle}</Text>
          </View>

          <View style={styles.dotsRow}>
            {onboardingSlides.map((_, i) => (
              <View 
                key={i} 
                style={[styles.dot, onboardStep === i ? styles.dotActive : styles.dotInactive]} 
              />
            ))}
          </View>

          <View style={styles.onboardFooter}>
            <TouchableOpacity 
              style={styles.onboardButton} 
              onPress={() => {
                if (onboardStep < onboardingSlides.length - 1) {
                  setOnboardStep(onboardStep + 1);
                } else {
                  completeOnboarding();
                }
              }}
            >
              <Text style={styles.onboardButtonText}>
                {onboardStep === onboardingSlides.length - 1 ? 'Get Started' : 'Continue'}
              </Text>
              <ArrowRight color="#ffffff" size={18} />
            </TouchableOpacity>

            {onboardStep < onboardingSlides.length - 1 && (
              <TouchableOpacity onPress={completeOnboarding} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip Intro</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#0a080d" />
        
        {/* Top Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Shield color="#e11d48" size={28} />
            <Text style={styles.brandTitle}>PocketClaim</Text>
            {isPro && (
              <View style={styles.proHeaderBadge}>
                <Crown color="#fb7185" size={12} />
                <Text style={styles.proHeaderBadgeText}>PRO</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setAddModalVisible(true)}>
            <Plus color="#ffffff" size={20} />
            <Text style={styles.addButtonText}>Add Claim</Text>
          </TouchableOpacity>
        </View>

        {/* Global Controls */}
        <View style={styles.globalControls}>
          <View style={styles.searchBar}>
            <Search color="#64748b" size={20} />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Search items or stores..." 
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setShowSuggestions(false); }}>
                <X color="#94a3b8" size={18} />
              </TouchableOpacity>
            )}
          </View>

          {/* Auto-Suggestion Dropdown */}
          {showSuggestions && suggestionsList.length > 0 && (
            <View style={styles.suggestionsDropdown}>
              {suggestionsList.map((suggestion, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.suggestionItem}
                  onPress={() => {
                    setSearchQuery(suggestion);
                    setShowSuggestions(false);
                  }}
                >
                  <Search color="#e11d48" size={14} />
                  <Text style={styles.suggestionText}>{suggestion}</Text>
                  <CornerDownLeft color="#475569" size={12} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Filter Pills */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsContainer}>
            {filterPills.map(pill => (
              <TouchableOpacity 
                key={pill} 
                style={activeFilter === pill ? styles.pillActive : styles.pillInactive}
                onPress={() => setActiveFilter(pill)}
              >
                <Text style={activeFilter === pill ? styles.pillTextActive : styles.pillTextInactive}>
                  {pill}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          onScrollBeginDrag={() => setShowSuggestions(false)}
        >
          {/* Value Protected Card */}
          <View style={styles.statsCard}>
            <Text style={styles.statsLabel}>Total Value Protected</Text>
            <Text style={styles.statsValue}>${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</Text>
            <View style={styles.statsFooter}>
              <TrendingUp color="#fb7185" size={16} />
              <Text style={styles.statsSubtext}>{warranties.length} Active Warranties & Receipts</Text>
            </View>
          </View>

          {/* Dynamic Warranty List Section */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vault Entries ({filteredWarranties.length})</Text>
          </View>

          {filteredWarranties.length > 0 ? (
            filteredWarranties.map((item) => (
              <View key={item.id} style={styles.claimCard}>
                
                {/* HERO FEATURE: Price Drop Radar Alert Box */}
                {item.priceDrop && item.status !== 'claimed' && (
                  <View style={styles.priceDropAlertBox}>
                    <View style={styles.priceDropHeader}>
                      <View style={styles.priceDropTitleGroup}>
                        <TrendingDown color="#10b981" size={18} />
                        <Text style={styles.priceDropTitle}>Price Drop Detected!</Text>
                      </View>
                      <View style={styles.oddsTag}>
                        <Text style={styles.oddsText}>Odds: {item.priceDrop.odds}</Text>
                      </View>
                    </View>

                    <Text style={styles.priceDropSub}>
                      Item dropped from ${item.priceDrop.originalPrice} ➔ <Text style={styles.highlightGreen}>${item.priceDrop.currentPrice}</Text> at {item.store}.
                    </Text>

                    <TouchableOpacity 
                      style={styles.claimAdjustmentBtn} 
                      onPress={() => handleOpenClaimGenerator(item, 'Price Mismatch / Price Drop')}
                    >
                      <Sparkles color="#ffffff" size={14} />
                      <Text style={styles.claimAdjustmentText}>Claim ${item.priceDrop.dropAmount} Price Adjustment</Text>
                    </TouchableOpacity>
                  </View>
                )}

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
                    item.status === 'claimed' ? styles.badgeClaimed :
                    item.status === 'critical' ? styles.badgeCritical : 
                    item.status === 'warning' ? styles.badgeWarning : styles.badgeGood
                  ]}>
                    <Clock color="#ffffff" size={13} />
                    <Text style={styles.badgeTextWhite}>
                      {item.expires}
                    </Text>
                  </View>
                </View>

                {/* Quick Action Buttons */}
                <View style={styles.cardActions}>
                  {item.status !== 'claimed' && (
                    <TouchableOpacity 
                      style={styles.actionBtnDraft} 
                      onPress={() => handleOpenClaimGenerator(item, 'Defective Item / Exchange')}
                    >
                      <FileText color="#fb7185" size={14} />
                      <Text style={styles.actionTextDraft}>Draft Claim</Text>
                    </TouchableOpacity>
                  )}

                  {item.status !== 'claimed' && (
                    <TouchableOpacity 
                      style={item.reminderActive ? styles.actionBtnReminderActive : styles.actionBtnReminderInactive} 
                      onPress={() => handleToggleReminder(item.id)}
                    >
                      {item.reminderActive ? (
                        <BellRing color="#fb7185" size={14} />
                      ) : (
                        <Bell color="#64748b" size={14} />
                      )}
                      <Text style={item.reminderActive ? styles.actionTextReminderActive : styles.actionTextReminderInactive}>
                        {item.reminderActive ? 'Reminder Set' : 'Remind Me'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  {item.status !== 'claimed' && (
                    <TouchableOpacity 
                      style={styles.actionBtnClaim} 
                      onPress={() => handleMarkAsClaimed(item.id)}
                    >
                      <Check color="#10b981" size={14} />
                      <Text style={styles.actionTextClaim}>Mark Claimed</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity 
                    style={styles.actionBtnDelete} 
                    onPress={() => handleDeleteClaim(item.id)}
                  >
                    <Trash2 color="#ef4444" size={14} />
                    <Text style={styles.actionTextDelete}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyStateContainer}>
              <Inbox color="#1f1322" size={80} />
              <Text style={styles.emptyStateTitle}>No Matches Found</Text>
              <Text style={styles.emptyStateSub}>Adjust your search or filter criteria to find items in your vault.</Text>
            </View>
          )}

          {/* Dynamic RevenueCat Banner */}
          {isPro ? (
            <View style={styles.proActiveBanner}>
              <CheckCircle color="#10b981" size={20} />
              <View style={styles.proTextGroup}>
                <Text style={styles.proActiveTitle}>Gmail Auto-Sync Active</Text>
                <Text style={styles.proSub}>Scanning inbox automatically for digital receipts.</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.proBanner} onPress={() => setPaywallModalVisible(true)}>
              <AlertCircle color="#fb7185" size={20} />
              <View style={styles.proTextGroup}>
                <Text style={styles.proTitle}>Unlock Auto-Receipt Sync</Text>
                <Text style={styles.proSub}>Automatically scan Gmail for purchase warranties.</Text>
              </View>
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* --- HERO FEATURE: AI CLAIM LETTER GENERATOR MODAL --- */}
        <Modal visible={claimLetterModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, styles.claimLetterBox]}>
              <View style={styles.modalHeader}>
                <View style={styles.brandRow}>
                  <Sparkles color="#e11d48" size={22} />
                  <Text style={styles.modalTitle}>AI Claim Letter Generator</Text>
                </View>
                <TouchableOpacity onPress={() => setClaimLetterModalVisible(false)}>
                  <X color="#94a3b8" size={22} />
                </TouchableOpacity>
              </View>

              {selectedItemForClaim && (
                <View style={styles.claimItemSummary}>
                  <Text style={styles.claimSummaryItem}>{selectedItemForClaim.item}</Text>
                  <Text style={styles.claimSummaryStore}>{selectedItemForClaim.store} • {selectedItemForClaim.value}</Text>
                </View>
              )}

              <Text style={styles.reasonLabel}>Reason for Claim:</Text>
              <View style={styles.reasonPillContainer}>
                {['Price Mismatch / Price Drop', 'Defective Item / Exchange', 'General Return Request'].map(reason => (
                  <TouchableOpacity 
                    key={reason}
                    style={claimReason === reason ? styles.reasonPillActive : styles.reasonPillInactive}
                    onPress={() => {
                      setClaimReason(reason);
                      generateLetterContent(selectedItemForClaim, reason);
                    }}
                  >
                    <Text style={claimReason === reason ? styles.reasonTextActive : styles.reasonTextInactive}>
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.reasonLabel}>Generated Letter Draft:</Text>
              <TextInput 
                style={styles.letterTextarea}
                multiline
                value={generatedLetter}
                onChangeText={setGeneratedLetter}
              />

              <View style={styles.letterActions}>
                <TouchableOpacity style={styles.copyBtn} onPress={handleCopyLetter}>
                  <Copy color="#ffffff" size={16} />
                  <Text style={styles.copyBtnText}>Copy Letter</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.openMailBtn}
                  onPress={() => {
                    Alert.alert('📧 Opening Mail App...', `Drafting email to ${selectedItemForClaim ? selectedItemForClaim.store : 'Store'} Customer Support.`);
                  }}
                >
                  <Mail color="#ffffff" size={16} />
                  <Text style={styles.openMailBtnText}>Open in Mail</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

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

              <TouchableOpacity 
                style={selectedPlan === 'annual' ? styles.planCardSelected : styles.planCard}
                onPress={() => setSelectedPlan('annual')}
              >
                <View>
                  <Text style={styles.planTitle}>Annual Access</Text>
                  <Text style={styles.planSub}>7-Day Free Trial • $29.99/yr</Text>
                </View>
                <Text style={styles.savingsTag}>SAVE 50%</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={selectedPlan === 'monthly' ? styles.planCardSelected : styles.planCard}
                onPress={() => setSelectedPlan('monthly')}
              >
                <View>
                  <Text style={styles.planTitle}>Monthly Access</Text>
                  <Text style={styles.planSub}>$4.99 / month</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe}>
                <Text style={styles.subscribeText}>
                  {selectedPlan === 'annual' ? 'Start 7-Day Free Trial' : 'Subscribe Now ($4.99/mo)'}
                </Text>
              </TouchableOpacity>

              <Text style={styles.legalText}>Powered by RevenueCat • Cancel anytime in store settings</Text>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a080d' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1f1322' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandTitle: { fontSize: 22, fontWeight: 'bold', color: '#ffffff' },
  proHeaderBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#270a16', borderWidth: 1, borderColor: '#e11d48', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, marginLeft: 4 },
  proHeaderBadgeText: { color: '#fb7185', fontWeight: 'bold', fontSize: 10 },
  addButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#be123c', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, gap: 4 },
  addButtonText: { color: '#ffffff', fontWeight: '600', fontSize: 14 },
  
  onboardContainer: { flex: 1, backgroundColor: '#0a080d', padding: 24, justifyContent: 'space-between' },
  onboardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  onboardBrand: { fontSize: 20, fontWeight: 'bold', color: '#ffffff' },
  onboardContent: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  onboardIconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#1c0d18', borderWidth: 1, borderColor: '#4c0519', justifyContent: 'center', alignItems: 'center', marginBottom: 32 },
  onboardTitle: { fontSize: 26, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 12 },
  onboardSubtitle: { fontSize: 15, color: '#94a3b8', textAlign: 'center', lineHeight: 22, paddingHorizontal: 10 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 20 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 24, backgroundColor: '#e11d48' },
  dotInactive: { width: 8, backgroundColor: '#2e1220' },
  onboardFooter: { gap: 12 },
  onboardButton: { flexDirection: 'row', backgroundColor: '#e11d48', paddingVertical: 16, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 8 },
  onboardButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  skipButton: { alignItems: 'center', paddingVertical: 8 },
  skipText: { color: '#64748b', fontSize: 14, fontWeight: '500' },

  globalControls: { backgroundColor: '#0a080d', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 6, gap: 10, borderBottomWidth: 1, borderBottomColor: '#1f1322', zIndex: 20 },
  
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#140a12', borderRadius: 12, borderWidth: 1, borderColor: '#2e1220', paddingHorizontal: 12, height: 48, gap: 8 },
  searchInput: { flex: 1, color: '#ffffff', fontSize: 15 },

  suggestionsDropdown: { backgroundColor: '#140a12', borderWidth: 1, borderColor: '#3b1222', borderRadius: 12, overflow: 'hidden', marginTop: -4 },
  suggestionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f101b', gap: 10 },
  suggestionText: { flex: 1, color: '#e2e8f0', fontSize: 14, fontWeight: '500' },

  filterPillsContainer: { gap: 8, paddingBottom: 8, marginTop: 4 },
  pillInactive: { backgroundColor: '#140a12', borderWidth: 1, borderColor: '#2e1220', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  pillActive: { backgroundColor: '#be123c', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  pillTextInactive: { color: '#94a3b8', fontSize: 13, fontWeight: '500' },
  pillTextActive: { color: '#ffffff', fontSize: 13, fontWeight: '600' },

  scrollContent: { padding: 20, paddingTop: 16 },
  
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
  
  priceDropAlertBox: { backgroundColor: 'rgba(16, 185, 129, 0.08)', borderWidth: 1, borderColor: '#10b981', borderRadius: 10, padding: 12, marginBottom: 14 },
  priceDropHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceDropTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  priceDropTitle: { color: '#10b981', fontWeight: 'bold', fontSize: 14 },
  oddsTag: { backgroundColor: 'rgba(16, 185, 129, 0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  oddsText: { color: '#34d399', fontSize: 11, fontWeight: '700' },
  priceDropSub: { color: '#cbd5e1', fontSize: 12, marginVertical: 8 },
  highlightGreen: { color: '#34d399', fontWeight: 'bold' },
  claimAdjustmentBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#059669', paddingVertical: 8, borderRadius: 8 },
  claimAdjustmentText: { color: '#ffffff', fontWeight: 'bold', fontSize: 13 },

  cardMain: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#270a16', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  itemTitle: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  itemSub: { color: '#94a3b8', fontSize: 13, marginTop: 2 },
  
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, gap: 5 },
  badgeCritical: { backgroundColor: '#9f1239' },
  badgeWarning: { backgroundColor: '#b45309' },
  badgeGood: { backgroundColor: '#047857' },
  badgeClaimed: { backgroundColor: '#065f46' },
  badgeTextWhite: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  
  cardActions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 8, marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#1f101b' },
  actionBtnDraft: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(225, 29, 72, 0.15)', borderWidth: 1, borderColor: '#e11d48', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  actionTextDraft: { color: '#fb7185', fontSize: 12, fontWeight: '600' },
  actionBtnReminderActive: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(225, 29, 72, 0.15)', borderWidth: 1, borderColor: '#e11d48', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  actionTextReminderActive: { color: '#fb7185', fontSize: 12, fontWeight: '600' },
  actionBtnReminderInactive: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0a080d', borderWidth: 1, borderColor: '#2e1220', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  actionTextReminderInactive: { color: '#94a3b8', fontSize: 12, fontWeight: '500' },
  actionBtnClaim: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  actionTextClaim: { color: '#10b981', fontSize: 12, fontWeight: '600' },
  actionBtnDelete: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(239, 68, 68, 0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  actionTextDelete: { color: '#ef4444', fontSize: 12, fontWeight: '600' },

  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 50, gap: 12 },
  emptyStateTitle: { color: '#94a3b8', fontSize: 18, fontWeight: 'bold' },
  emptyStateSub: { color: '#64748b', fontSize: 14, textAlign: 'center', paddingHorizontal: 20 },

  proBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f0813', borderWidth: 1, borderColor: '#e11d48', borderRadius: 12, padding: 16, marginTop: 12, gap: 12 },
  proActiveBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.12)', borderWidth: 1, borderColor: '#10b981', borderRadius: 12, padding: 16, marginTop: 12, gap: 12 },
  proTextGroup: { flex: 1 },
  proTitle: { color: '#fb7185', fontWeight: 'bold', fontSize: 15 },
  proActiveTitle: { color: '#10b981', fontWeight: 'bold', fontSize: 15 },
  proSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.85)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#140a12', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, borderWidth: 1, borderColor: '#3b1222' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: '#ffffff', fontSize: 18, fontWeight: 'bold' },

  claimLetterBox: { maxHeight: '90%' },
  claimItemSummary: { backgroundColor: '#0a080d', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#2e1220', marginBottom: 16 },
  claimSummaryItem: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  claimSummaryStore: { color: '#fb7185', fontSize: 13, marginTop: 2 },
  reasonLabel: { color: '#94a3b8', fontSize: 13, fontWeight: '600', marginBottom: 8 },
  reasonPillContainer: { flexDirection: 'column', gap: 6, marginBottom: 16 },
  reasonPillActive: { backgroundColor: '#270a16', borderWidth: 1, borderColor: '#e11d48', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  reasonPillInactive: { backgroundColor: '#0a080d', borderWidth: 1, borderColor: '#2e1220', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  reasonTextActive: { color: '#fb7185', fontSize: 12, fontWeight: 'bold' },
  reasonTextInactive: { color: '#94a3b8', fontSize: 12 },
  letterTextarea: { backgroundColor: '#0a080d', color: '#e2e8f0', borderWidth: 1, borderColor: '#2e1220', borderRadius: 10, padding: 12, height: 160, textAlignVertical: 'top', fontSize: 12, fontFamily: 'monospace', marginBottom: 16 },
  letterActions: { flexDirection: 'row', gap: 10 },
  copyBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#334155', paddingVertical: 14, borderRadius: 10 },
  copyBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  openMailBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#e11d48', paddingVertical: 14, borderRadius: 10 },
  openMailBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  
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
  planCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#140a12', borderWidth: 1, borderColor: '#2e1220', borderRadius: 12, padding: 16, marginBottom: 10 },
  planTitle: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  planSub: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  savingsTag: { backgroundColor: '#e11d48', color: '#ffffff', fontWeight: 'bold', fontSize: 11, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  subscribeButton: { backgroundColor: '#e11d48', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  subscribeText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  legalText: { color: '#64748b', fontSize: 11, textAlign: 'center', marginTop: 12 }
});