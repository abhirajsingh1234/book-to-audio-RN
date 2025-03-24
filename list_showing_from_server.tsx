import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';

// Define types for our nested data
type Season = string;
type BookType = {
  name: string;
  seasons: Season[];
};

// Define request type for API
type UserRequest = {
  bookname: string;
  lesson: string;
};

// Define the props our component accepts
type DropdownProps = {
  items: string[];
  placeholder?: string;
  onSelect?: (item: string) => void;
  label?: string;
  textColor?: string;      // Add text color prop
  selectedTextColor?: string; // Add selected text color prop
  placeholderColor?: string; // Add placeholder text color
};

// Generic dropdown component that can be reused
const Dropdown = (props: DropdownProps) => {
  // State variables
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  // Get props or use defaults
  const placeholder = props.placeholder || "Select an item";
  const textColor = props.textColor || '#333333';  // Default text color
  const selectedTextColor = props.selectedTextColor || '#007AFF';  // Default selected color
  const placeholderColor = props.placeholderColor || '#999999';  // Default placeholder color
  
  // Function to handle dropdown open/close
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Function to handle when user selects an item
  const selectItem = (item: string) => {
    setSelectedItem(item);
    setIsOpen(false);
    
    // Call the parent component's function if provided
    if (props.onSelect) {
      props.onSelect(item);
    }
  };
  
  // Function to render each item in the dropdown
  const renderItem = ({ item }: { item: string }) => {
    // Check if this item is the selected one
    const isSelected = item === selectedItem;
    
    return (
      <TouchableOpacity 
        style={[
          styles.option,
          isSelected && styles.selectedOption
        ]} 
        onPress={() => selectItem(item)}
      >
        <Text style={{ 
          color: isSelected ? selectedTextColor : textColor,
          fontWeight: isSelected ? 'bold' : 'normal'
        }}>
          {item}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {props.label && (
        <Text style={styles.label}>{props.label}</Text>
      )}
      {/* Dropdown button */}
      <TouchableOpacity 
        style={styles.dropdownButton} 
        onPress={toggleDropdown}
      >
        <Text style={{ 
          color: selectedItem ? selectedTextColor : placeholderColor
        }}>
          {selectedItem ? selectedItem : placeholder}
        </Text>
        <Text style={{ color: selectedTextColor }}>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {/* Dropdown options (only shown when isOpen is true) */}
      {isOpen && (
        <View style={styles.optionsList}>
          {props.items.length > 0 ? (
            <FlatList
              data={props.items}
              renderItem={renderItem}
              keyExtractor={(item: string) => item}
            />
          ) : (
            <Text style={[styles.noItemsText, { color: placeholderColor }]}>No items available</Text>
          )}
        </View>
      )}
    </View>
  );
};

// Main component that fetches data and manages both dropdowns
const DoubleDropdownDemo = () => {
  // State variables
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<string | null>(null);
  const [bookNames, setBookNames] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<string[]>([]);
  const [showSeasonDropdown, setShowSeasonDropdown] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Custom colors
  const bookTextColor = '#333333';  // Dark gray for book text
  const bookSelectedColor = '#2E7D32';  // Green for selected book
  const seasonTextColor = '#333333';  // Dark gray for season text
  const seasonSelectedColor = '#1565C0';  // Blue for selected season

  // API URL
  const apiUrl = "http://10.0.2.2:5000/";

  // Fetch books from server
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      
      // For testing - mock data if fetch fails
      const mockData = {
        books: {
          got: ["s1", "s2", "s3"],
          vikings: ["s1", "s2", "s3"]
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
        // Use mock data if fetch fails (for development)
        data = mockData;
      }
      
      // Transform the nested object into an array of books with their seasons
      const booksArray = Object.entries(data.books).map(([name, seasons]) => ({
        name,
        seasons: seasons as string[]
      }));
      
      setBooks(booksArray);
      
      // Extract book names for the first dropdown
      const names = booksArray.map(book => book.name);
      setBookNames(names);
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
      console.error('Error fetching books:', err);
    }
  };

  // Handle book selection
  const handleBookSelect = (bookName: string) => {
    setSelectedBook(bookName);
    setSelectedSeason(null); // Reset season selection when book changes
    
    // Find the selected book and get its seasons
    const selectedBookObject = books.find(book => book.name === bookName);
    if (selectedBookObject) {
      setSeasons(selectedBookObject.seasons);
      setShowSeasonDropdown(true); // Make the season dropdown visible
    } else {
      setSeasons([]);
      setShowSeasonDropdown(false);
    }
  };

  // Handle season selection
  const handleSeasonSelect = (season: string) => {
    setSelectedSeason(season);
  };

  // Handle submit button press - now with API call
  const handleSubmit = async () => {
    if (!selectedBook || !selectedSeason) {
      Alert.alert(
        "Incomplete Selection",
        "Please select both a book and a season before submitting",
        [{ text: "OK" }]
      );
      return;
    }
    
    try {
      setSubmitting(true);
      
      const userData: UserRequest = {
        bookname: selectedBook,
        lesson: selectedSeason
      };
      
      const response = await fetch(`${apiUrl}execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `Error: ${response.status}`);
      }
      
      const result = await response.json();
      
      Alert.alert(
        "Success",
        result.message || "Selection submitted successfully!",
        [{ text: "OK" }]
      );
      
    } catch (err) {
      console.error('Error submitting data:', err);
      Alert.alert(
        "Submission Error",
        err instanceof Error ? err.message : "An unknown error occurred",
        [{ text: "OK" }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Show loading indicator while fetching data
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#0000ff" />
        <Text>Loading books...</Text>
      </View>
    );
  }

  // Show error message if fetch failed
  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchBooks}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Book and Season Selection</Text>
      
      {/* First dropdown for books */}
      <View style={styles.dropdownWrapper}>
        <Text style={styles.label}>Select a Book:</Text>
        <Dropdown 
          items={bookNames}
          onSelect={handleBookSelect}
          placeholder="Choose a book"
          textColor={bookTextColor}
          selectedTextColor={bookSelectedColor}
          placeholderColor="#888888"
        />
      </View>
      
      {/* Second dropdown for seasons - only rendered if a book is selected */}
      {showSeasonDropdown && (
        <View style={styles.dropdownWrapper}>
          <Text style={styles.label}>Select a Season:</Text>
          <Dropdown 
            items={seasons}
            onSelect={handleSeasonSelect}
            placeholder="Choose a season"
            textColor={seasonTextColor}
            selectedTextColor={seasonSelectedColor}
            placeholderColor="#888888"
          />
        </View>
      )}
      
      {/* Submit button */}
      <TouchableOpacity 
        style={[
          styles.submitButton,
          // Disable the button visually if selections aren't complete or if submitting
          ((!selectedBook || !selectedSeason) || submitting) && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={!selectedBook || !selectedSeason || submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Selection</Text>
        )}
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  dropdownButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  optionsList: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 5,
    maxHeight: 150,
    backgroundColor: 'white',
    position: 'absolute',
    width: '100%',
    top: 45,
    zIndex: 1000,
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedOption: {
    backgroundColor: '#f5f5f5',
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 70,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#f44336',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    marginBottom: 8,
    fontWeight: 'bold',
    fontSize: 16,
  },
  noItemsText: {
    padding: 10,
    textAlign: 'center',
  },
  dropdownWrapper: {
    width: '80%',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    padding: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 30,
    marginTop: 30,
    width: '80%',
    alignItems: 'center',
    height: 50,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',  // Lighter green for disabled state
    opacity: 0.7,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default DoubleDropdownDemo;