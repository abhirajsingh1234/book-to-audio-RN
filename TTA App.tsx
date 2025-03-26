import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Dimensions,
  ListRenderItem
} from 'react-native';
import RNFS from 'react-native-fs';
import axios from 'axios';
import { Buffer } from 'buffer';

// Define types for nested data
type Season = string;
type BookType = {
  name: string;
  seasons: Season[];
};

type UserRequest = {
  bookname: string;
  lesson: string;
};

// Corrected Dropdown Props type definition
interface DropdownProps {
  items: string[];
  placeholder?: string;
  onSelect?: (item: string) => void;
  label?: string;
}

// Generic Dropdown component
const Dropdown: React.FC<DropdownProps> = ({ items, placeholder, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const selectItem = (item: string) => {
    setSelectedItem(item);
    setIsOpen(false);
    if (onSelect) onSelect(item);
  };

  const renderItem: ListRenderItem<string> = ({ item }) => {
    const isSelected = item === selectedItem;
    return (
      <TouchableOpacity
        style={[styles.option, isSelected && styles.selectedOption]}
        onPress={() => selectItem(item)}
      >
        <Text style={[styles.optionText, isSelected && styles.selectedOptionText]}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.dropdownContainer}>
      <TouchableOpacity 
        style={[styles.dropdownButton, isOpen && styles.dropdownButtonActive]} 
        onPress={toggleDropdown}
      >
        <Text style={styles.dropdownButtonText}>
          {selectedItem || placeholder || 'Select an option'}
        </Text>
        <Text style={styles.dropdownCaret}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={styles.optionsList}>
          {items.length > 0 ? (
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(item: string) => item}
              style={styles.flatListStyle}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noItemsText}>No items available</Text>
          )}
        </View>
      )}
    </View>
  );
};

// Replace with your local server URL or ngrok URL
// const apiUrl = "http://localhost:5000";  for calling from files
// const apiUrl = "http://0.0.0.0:5000";    for calling from emulator
// const apiUrl = "http://192.168.0.106:5000/";  for calling from device
// Replace with your local server URL or ngrok URL
const apiUrl = "https://fastapi-server-78218016688.asia-south1.run.app/";


// Request storage permission handling
const requestStoragePermission = async () => {
  if (Platform.OS !== 'android') return true;

  try {
    if (Platform.Version >= 33) {
      // Android 13+ (API 33+)
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_AUDIO
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert("Permission Denied", "Storage permission is required.");
        return false;
      }
      return true;
    } else if (Platform.Version >= 30) {
      // Android 11+ (Scoped Storage)
      return true;
    } else {
      // Android 10 and below
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      ]);
      if (
        granted[PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE] !== PermissionsAndroid.RESULTS.GRANTED ||
        granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] !== PermissionsAndroid.RESULTS.GRANTED
      ) {
        Alert.alert("Permission Denied", "Storage permission is required.");
        return false;
      }
      return true;
    }
  } catch (err) {
    console.warn(err);
    Alert.alert("Permission Error", "Failed to request storage permissions.");
    return false;
  }
};

// Main component with explicit React.FC type
const DoubleDropdownDemo: React.FC = () => {
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [bookNames, setBookNames] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      let data;
      
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        data = await response.json();
  
        // Fix: Correctly access "BOOKS" instead of "books"
        if (!data.BOOKS || Object.keys(data.BOOKS).length === 0) {
          console.warn("Fetched data has no valid 'BOOKS' property, using mock data.");
          throw new Error("Invalid data structure from server");
        }
      } catch (fetchErr) {
        console.warn("Using mock data due to fetch error:", fetchErr);
        data = {
          BOOKS: {
            "MindSet Secrets for Winning": [
              "A MESSAGE FROM THE AUTHOR",
              "WITH WINNING IN MIND",
              "THE MEANING OF SUCCESS"
            ],
            got: ["s1", "s2", "s3"]
          }
        };
      }
  
      // Convert API response to the expected format
      const booksArray = Object.entries(data.BOOKS).map(([name, seasons]) => ({
        name,
        seasons: seasons as string[]
      }));
      
      setBooks(booksArray);
      setBookNames(booksArray.map(book => book.name));
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
      setLoading(false);
    }
  };

  const handleBookSelect = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedSeason(null);
    const selectedBookObject = books.find(book => book.name === bookName);
    if (selectedBookObject) {
      setSeasons(selectedBookObject.seasons);
      setShowSeasonDropdown(true);
    } else {
      setSeasons([]);
      setShowSeasonDropdown(false);
    }
  };

  // Updated download functionality using axios, Buffer, and RNFS
  const handleDownload = async () => {
    if (!selectedBook || !selectedSeason) {
      Alert.alert("Incomplete Selection", "Please select both a book and a season before downloading");
      return;
    }
    
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) return;

    try {
      setSubmitting(true);
      const userData: UserRequest = { bookname: selectedBook, lesson: selectedSeason };

      // Send POST request to the FastAPI endpoint
      const response = await axios.post(
        `${apiUrl}execute`,
        userData,
        { responseType: 'arraybuffer', headers: { 'Content-Type': 'application/json' } }
      );

      // Create a filename and determine the download path
      const filename = `${selectedBook}_${selectedSeason}_${Date.now()}.mp3`;
      const downloadPath = Platform.select({
        android: `${RNFS.DownloadDirectoryPath}/${filename}`,
        ios: `${RNFS.DocumentDirectoryPath}/${filename}`,
        default: `${RNFS.DocumentDirectoryPath}/${filename}`
      }) as string;

      // Convert arraybuffer to base64 string
      const base64Data = Buffer.from(response.data).toString('base64');

      // Write file to local storage
      await RNFS.writeFile(downloadPath, base64Data, 'base64');

      Alert.alert("Download Complete", `Audio saved to: ${downloadPath}`);
    } catch (err) {
      console.error("Download error:", err);
      Alert.alert("Download Error", err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text style={styles.loadingText}>Loading books...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchBooks}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Book and Season Selection</Text>
      
      <View style={styles.dropdownWrapper}>
        <Text style={styles.label}>Select a Book:</Text>
        <Dropdown 
          items={bookNames} 
          onSelect={handleBookSelect} 
          placeholder="Choose a book" 
        />
      </View>
      
      {showSeasonDropdown && (
        <View style={styles.dropdownWrapper}>
          <Text style={styles.label}>Select a Season:</Text>
          <Dropdown 
            items={seasons} 
            onSelect={(season) => setSelectedSeason(season)} 
            placeholder="Choose a season" 
          />
        </View>
      )}
      
      <TouchableOpacity
        style={[styles.submitButton, ((!selectedBook || !selectedSeason) || submitting) && styles.submitButtonDisabled]}
        onPress={handleDownload}
        disabled={!selectedBook || !selectedSeason || submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Download Audio</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 30,
    color: '#2C3E50',
    textAlign: 'center',
  },
  dropdownWrapper: {
    width: width * 0.9,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#34495E',
    fontWeight: '600',
  },
  dropdownContainer: {
    width: '100%',
  },
  dropdownButton: {
    backgroundColor: 'white',
    padding: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  dropdownButtonActive: {
    borderColor: '#3498DB',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#2C3E50',
    fontWeight: '500',
  },
  dropdownCaret: {
    color: '#7F8C8D',
  },
  optionsList: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flatListStyle: {
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F5',
  },
  selectedOption: {
    backgroundColor: '#F0F8FF',
  },
  optionText: {
    fontSize: 16,
    color: '#2C3E50',
  },
  selectedOptionText: {
    color: '#3498DB',
    fontWeight: '700',
  },
  noItemsText: {
    padding: 15,
    textAlign: 'center',
    color: '#95A5A6',
    fontStyle: 'italic',
  },
  submitButton: {
    backgroundColor: '#3498DB',
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
    width: width * 0.8,
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
    shadowColor: '#3498DB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  submitButtonDisabled: {
    backgroundColor: '#AED6F1',
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F0F4F8',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#34495E',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F0F4F8',
  },
  errorText: {
    fontSize: 18,
    color: '#E74C3C',
    marginBottom: 15,
    textAlign: 'center',
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#3498DB',
    padding: 12,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  }
});

export default DoubleDropdownDemo;
