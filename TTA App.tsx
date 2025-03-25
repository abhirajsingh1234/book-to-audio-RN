
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
  Dimensions
} from 'react-native';
import RNFetchBlob from 'rn-fetch-blob';

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

type DropdownProps = {
  items: string[];
  placeholder?: string;
  onSelect?: (item: string) => void;
  label?: string;
};

// Generic Dropdown component
const Dropdown = ({ items, placeholder, onSelect }: DropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const selectItem = (item: string) => {
    setSelectedItem(item);
    setIsOpen(false);
    if (onSelect) onSelect(item);
  };

  const renderItem = ({ item }: { item: string }) => {
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
      <TouchableOpacity style={styles.dropdownButton} onPress={toggleDropdown}>
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
const apiUrl = "http://192.168.0.106:5000/";

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

const DoubleDropdownDemo = () => {
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
      // For development, use mock data if fetch fails
      const mockData = {
        books: {
          "MindSet Secrets for Winning": [
            "A MESSAGE FROM THE AUTHOR", 
            "WITH WINNING IN MIND", 
            "THE MEANING OF SUCCESS"
          ],
          got: ["s1", "s2", "s3"]
        }
      };
      let data;
      try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        data = await response.json();
      } catch (fetchErr) {
        console.warn("Using mock data due to fetch error:", fetchErr);
        data = mockData;
      }
      const booksArray = Object.entries(data.books).map(([name, seasons]) => ({
        name,
        seasons: seasons as string[]
      }));
      setBooks(booksArray);
      setBookNames(booksArray.map(book => book.name));
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
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
      const { config, fs } = RNFetchBlob;
      const downloadDest = fs.dirs.DownloadDir + `/${selectedBook}_${selectedSeason}_${Date.now()}.mp3`;
      const response = await config({
        fileCache: true,
        path: downloadDest,
        appendExt: 'mp3',
      }).fetch(
        'POST', 
        `${apiUrl}execute`, 
        { 'Content-Type': 'application/json' }, 
        JSON.stringify(userData)
      );
      Alert.alert("Download Complete", `Audio saved to: ${response.path()}`);
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
    backgroundColor: '#F5F5F5',
    paddingTop: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  dropdownWrapper: {
    width: width * 0.9,
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
  },
  dropdownContainer: {
    width: '100%',
  },
  dropdownButton: {
    backgroundColor: 'white',
    padding: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#666',
  },
  dropdownCaret: {
    color: '#999',
  },
  optionsList: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    maxHeight: 200,
  },
  flatListStyle: {
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  selectedOptionText: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  noItemsText: {
    padding: 15,
    textAlign: 'center',
    color: '#999',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 30,
    marginTop: 20,
    width: width * 0.8,
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    marginBottom: 15,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
  }
});

export default DoubleDropdownDemo;
