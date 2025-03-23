import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet } from "react-native";

const App = () => {
  const [name, setName] = useState("");
  const [greetMessage, setGreetMessage] = useState("");

  const fetchGreet = async () => {
    try {
      const API_URL = "http://10.0.2.2:5000/greet"; // For Android Emulator
      // const API_URL = "http://192.168.x.x:5000/greet"; // Replace with your PC's IP
      const response = await fetch(API_URL, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({ name })});
      const data = await response.json();
      setGreetMessage(data.message);
    } catch (error) {
      console.error("Error fetching greeting:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>React Native with FastAPI</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter your name"
        value={name}
        onChangeText={setName}
      />
      <Button title="Greet Me" onPress={fetchGreet} />
      <Text style={styles.message}>{greetMessage}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "80%",
    borderWidth: 1,
    padding: 10,
    marginVertical: 10,
  },
  message: {
    fontSize: 16,
    marginVertical: 10,
  },
});

export default App;
