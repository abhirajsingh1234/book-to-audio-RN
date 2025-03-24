import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView,
  ActivityIndicator
} from 'react-native';

// Define types for our nested data
type Season = string;
type BookType = {
  name: string;
  seasons: Season[];
};

// Define the props our component accepts
type DropdownProps = {
  items: string[];
  placeholder?: string;
  onSelect?: (item: string) => void;
};

// Generic dropdown component that can be reused
const Dropdown = (props: DropdownProps) => {
  // State variables
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  
  // Get props or use defaults
  const placeholder = props.placeholder || "Select an item";
  
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
    return (
      <TouchableOpacity 
        style={styles.option} 
        onPress={() => selectItem(item)}
      >
        <Text>{item}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Dropdown button */}
      <TouchableOpacity 
        style={styles.dropdownButton} 
        onPress={toggleDropdown}
      >
        <Text>
          {selectedItem ? selectedItem : placeholder}
        </Text>
        <Text>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {/* Dropdown options (only shown when isOpen is true) */}
      {isOpen && (
        <View style={styles.optionsList}>
          <FlatList
            data={props.items}
            renderItem={renderItem}
            keyExtractor={(item: string) => item}
          />
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

  // API URL
  const apiUrl = "http://10.0.2.2:5000/";

  // Fetch books from server
  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      
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
    }
  };

  // Handle season selection
  const handleSeasonSelect = (season: string) => {
    setSelectedSeason(season);
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
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Book and Season Selection</Text>
      
      {/* First dropdown for books */}
      <Dropdown 
        items={bookNames}
        onSelect={handleBookSelect}
        placeholder="Choose a book"
      />
      
      {/* Second dropdown for seasons (only visible after book selection) */}
      {selectedBook && (
        <Dropdown 
          items={seasons}
          onSelect={handleSeasonSelect}
          placeholder="Choose a season"
        />
      )}
      
      {/* Display the selections */}
      {selectedBook && (
        <View style={styles.result}>
          <Text style={styles.resultText}>
            Selected Book: {selectedBook}
          </Text>
          {selectedSeason && (
            <Text style={styles.resultText}>
              Selected Season: {selectedSeason}
            </Text>
          )}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    marginVertical: 10,
  },
  dropdownButton: {
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionsList: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginTop: 5,
    maxHeight: 150,
  },
  option: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  result: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    width: 250,
  },
  resultText: {
    marginBottom: 5,
  },
  loadingContainer: {
    width: 250,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    width: 250,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f44336',
    borderRadius: 5,
    backgroundColor: '#ffebee',
  },
  errorText: {
    color: '#f44336',
  }
});

export default DoubleDropdownDemo;