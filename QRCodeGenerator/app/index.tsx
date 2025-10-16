import React, { memo, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';         
import QRCode from "react-native-qrcode-svg";
import * as Clipboard from "expo-clipboard";
import uuid  from "react-native-uuid";

interface ProductCategory {
  id: string;
  name: string;
}

interface ProductData {
  id: string;
  name: string;
  category: string;
  description: string;
  timestamp: string;
  type: string;
}

interface QRItem {
  id: string;
  data: string;
  productInfo: ProductData;
  createdAt: string;
}

const PRODUCT_CATEGORIES: ProductCategory[] = [
  { id: "electronics", name: "Electronics" },
  { id: "clothing", name: "Clothing" },
  { id: "food", name: "Food & Beverages" },
  { id: "books", name: "Books" },
  { id: "furniture", name: "Furniture" },
  { id: "other", name: "Other" },
];

export default function App() {
  const [productName, setProductName] = useState<string>("");
  const [productCategory, setProductCategory] = useState<string>("electronics");
  const [productDescription, setProductDescription] = useState<string>("");
  const [customId, setCustomId] = useState<string>("");
  const [generatedQR, setGeneratedQR] = useState<QRItem | null>(null);
  const [qrHistory, setQrHistory] = useState<QRItem[]>([]);

  const qrCodeRef = useRef<QRCode | null>(null);

  const generateUniqueId = useCallback((): string => {
    return (
      customId ||
      `PROD-${Date.now()}-${Math.random()
        .toString(36)
        .substr(2, 9)
        .toUpperCase()}`
    );
  }, [customId]);

  const generateQRData = useCallback((): string => {
    const productData: ProductData = {
      id: generateUniqueId(),
      name: productName.trim(),
      category: productCategory,
      description: productDescription.trim(),
      timestamp: new Date().toISOString(),
      type: "product_qr",
    };

    return JSON.stringify(productData);
  }, [productName, productCategory, productDescription, generateUniqueId]);

  const handleGenerateQR = (): void => {
    if (!productName.trim()) {
      Alert.alert("Error", "Please enter a product name");
      return;
    }

    const qrData = generateQRData();
    const newQR: QRItem = {
      id: uuid.v4(),
      data: qrData,
      productInfo: JSON.parse(qrData),
      createdAt: new Date().toLocaleString(),
    };

    setGeneratedQR(newQR);

    // Add to history (keep last 10 items)
    setQrHistory((prev) => [newQR, ...prev.slice(0, 9)]);
  };

  const handleCopyToClipboard = async (): Promise<void> => {
    if (!generatedQR) return;

    try { 
      await Clipboard.setStringAsync(generatedQR.data);
      Alert.alert("Success", "QR code data copied to clipboard!");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      Alert.alert("Error", "Failed to copy to clipboard");
    }
  };

  const handleSaveToHistory = (): void => {
    if (!generatedQR) return;

    setQrHistory((prev) => [generatedQR, ...prev.slice(0, 9)]);
    Alert.alert("Success", "QR code saved to history!");
  };

  const handleUseFromHistory = useCallback((qrItem: QRItem): void => {
    setGeneratedQR(qrItem);
    setProductName(qrItem.productInfo.name);
    setProductCategory(qrItem.productInfo.category);
    setProductDescription(qrItem.productInfo.description);
    setCustomId(qrItem.productInfo.id);
  }, []);

  const clearForm = (): void => {
    setProductName("");
    setProductCategory("electronics");
    setProductDescription("");
    setCustomId("");
    setGeneratedQR(null);
  };

  // Memoized category button &  history item component for better performance
  const CategoryButton = memo(function CategoryButton({
    category,
    isActive,
    onPress,
  }: {
    category: ProductCategory;
    isActive: boolean;
    onPress: (id: string) => void;
  }) {
    return (
      <TouchableOpacity
        style={[styles.categoryButton, isActive && styles.categoryButtonActive]}
        onPress={() => onPress(category.id)}
      >
        <Text
          style={[
            styles.categoryButtonText,
            isActive && styles.categoryButtonTextActive,
          ]}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  });

  const HistoryItem = memo(function HistoryItem({
    item,
    onPress,
  }: {
    item: QRItem;
    onPress: (item: QRItem) => void;
  }) {
    return (
      <TouchableOpacity
        style={styles.historyItem}
        onPress={() => onPress(item)}
      >
        <Text style={styles.historyItemName} numberOfLines={1}>
          {item.productInfo.name}
        </Text>
        <Text style={styles.historyItemId} numberOfLines={1}>
          {item.productInfo.id}
        </Text>
      </TouchableOpacity>
    );
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>QR Code Generator</Text>
        <Text style={styles.subtitle}>Create QR codes for your products</Text>

        {/* Product Form */}
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Product Name *</Text>
            <TextInput
              style={styles.input}
              value={productName}
              onChangeText={setProductName}
              placeholder="Enter product name"
              placeholderTextColor="#999"
              maxLength={100}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryContainer}>
              {PRODUCT_CATEGORIES.map((category) => (
                <CategoryButton
                  key={category.id}
                  category={category}
                  isActive={productCategory === category.id}
                  onPress={setProductCategory}
                />
              ))}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={productDescription}
              onChangeText={setProductDescription}
              placeholder="Enter product description"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              maxLength={500}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Custom ID (Optional)</Text>
            <TextInput
              style={styles.input}
              value={customId}
              onChangeText={setCustomId}
              placeholder="Leave empty for auto-generated ID"
              placeholderTextColor="#999"
              maxLength={50}
            />
          </View>

          <TouchableOpacity
            style={styles.generateButton}
            onPress={handleGenerateQR}
            disabled={!productName.trim()}
          >
            <Text
              style={[
                styles.generateButtonText,
                !productName.trim() && styles.generateButtonTextDisabled,
              ]}
            >
              Generate QR Code
            </Text>
          </TouchableOpacity>
        </View>

        {/* Generated QR Code */}
        {generatedQR && (
          <View style={styles.qrContainer}>
            <Text style={styles.qrTitle}>Your QR Code</Text>
            <View style={styles.qrCodeWrapper}>
              <QRCode
                value={generatedQR.data}
                size={200}
                color="#000000"
                backgroundColor="#ffffff"
                ecl="M"
                getRef={(c) => (qrCodeRef.current = c)}
              />
            </View>

            <View style={styles.qrInfo}>
              <Text style={styles.qrInfoText}>
                <Text style={styles.qrInfoLabel}>Product:</Text>{" "}
                {generatedQR.productInfo.name}
              </Text>
              <Text style={styles.qrInfoText}>
                <Text style={styles.qrInfoLabel}>ID:</Text>{" "}
                {generatedQR.productInfo.id}
              </Text>
              <Text style={styles.qrInfoText}>
                <Text style={styles.qrInfoLabel}>Category:</Text>{" "}
                {generatedQR.productInfo.category}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleCopyToClipboard}
              >
                <Text style={styles.actionButtonText}>Copy Data</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleSaveToHistory}
              >
                <Text style={styles.actionButtonText}>Save to History</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.clearButton]}
                onPress={clearForm}
              >
                <Text style={styles.actionButtonText}>New Product</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* QR History */}
        {qrHistory.length > 0 && (
          <View style={styles.historyContainer}>
            <Text style={styles.historyTitle}>Recent QR Codes</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.historyScroll}
            >
              {qrHistory.map((item) => (
                <HistoryItem
                  key={item.id}
                  item={item}
                  onPress={handleUseFromHistory}
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 40 : 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  formContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
    color: "#333",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  categoryButtonActive: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  categoryButtonText: {
    fontSize: 12,
    color: "#666",
  },
  categoryButtonTextActive: {
    color: "white",
    fontWeight: "600",
  },
  generateButton: {
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  generateButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  generateButtonTextDisabled: {
    opacity: 0.6,
  },
  qrContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  qrTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  qrCodeWrapper: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  qrInfo: {
    width: "100%",
    marginBottom: 16,
  },
  qrInfoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  qrInfoLabel: {
    fontWeight: "600",
    color: "#333",
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  actionButton: {
    backgroundColor: "#007AFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 120,
    alignItems: "center",
  },
  clearButton: {
    backgroundColor: "#6c757d",
  },
  actionButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  historyContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  historyScroll: {
    flexDirection: "row",
  },
  historyItem: {
    backgroundColor: "#f8f9fa",
    padding: 12,
    borderRadius: 8,
    marginRight: 12,
    minWidth: 140,
    borderWidth: 1,
    borderColor: "#eee",
  },
  historyItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  historyItemId: {
    fontSize: 12,
    color: "#666",
  },
});
