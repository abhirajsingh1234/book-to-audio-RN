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
  apiUrl?: string;
  placeholder?: string;
  onSelect?: (book: string, seasons: string[]) => void;
};

const Dropdown = (props: DropdownProps) => {
  // State variables
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [books, setBooks] = useState<BookType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get props or use defaults
  const apiUrl = props.apiUrl || 'http://10.0.2.2:5000/';
  const placeholder = props.placeholder || "Select a book";
  
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
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setLoading(false);
      console.error('Error fetching books:', err);
    }
  };
  
  // Function to handle dropdown open/close
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  // Function to handle when user selects a book
  const selectBook = (book: BookType) => {
    setSelectedBook(book.name);
    setIsOpen(false);
    
    // Call the parent component's function if provided
    if (props.onSelect) {
      props.onSelect(book.name, book.seasons);
    }
  };
  
  // Function to render each book in the dropdown
  const renderBook = ({ item }: { item: BookType }) => {
    return (
      <TouchableOpacity 
        style={styles.option} 
        onPress={() => selectBook(item)}
      >
        <Text>{item.name}</Text>
        <Text style={styles.seasonsCount}>
          {item.seasons.length} seasons
        </Text>
      </TouchableOpacity>
    );
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
    <View style={styles.container}>
      {/* Dropdown button */}
      <TouchableOpacity 
        style={styles.dropdownButton} 
        onPress={toggleDropdown}
      >
        <Text>
          {selectedBook ? selectedBook : placeholder}
        </Text>
        <Text>{isOpen ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      
      {/* Dropdown options (only shown when isOpen is true) */}
      {isOpen && (
        <View style={styles.optionsList}>
          <FlatList
            data={books}
            renderItem={renderBook}
            keyExtractor={(item: BookType) => item.name}
          />
        </View>
      )}
    </View>
  );
};

// Demo App
const DropdownDemo = () => {
  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [seasons, setSeasons] = useState<string[]>([]);

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.title}>Books Dropdown</Text>
      
      <Dropdown 
        apiUrl="http://10.0.2.2:5000/"
        onSelect={(book, bookSeasons) => {
          setSelectedBook(book);
          setSeasons(bookSeasons);
        }}
        placeholder="Choose a book"
      />
      
      {selectedBook && (
        <View style={styles.result}>
          <Text style={styles.resultText}>
            Selected: {selectedBook}
          </Text>
          <Text style={styles.resultText}>
            Seasons: {seasons.join(', ')}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 250,
    marginVertical: 20,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  seasonsCount: {
    fontSize: 12,
    color: '#666',
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

export default DropdownDemo;