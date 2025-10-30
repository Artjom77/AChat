import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ChatInputProps {
  onSend: (text: string) => void;
}

export default function ChatInput({ onSend }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text);
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.iconButton}>
        <Icon name="plus-circle" size={28} color="#667eea" />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Сообщение..."
        value={text}
        onChangeText={setText}
        multiline
        maxLength={5000}
      />

      {text.trim() ? (
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Icon name="send" size={24} color="white" />
        </TouchableOpacity>
      ) : (
        <>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="microphone" size={28} color="#667eea" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Icon name="camera" size={28} color="#667eea" />
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    marginHorizontal: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  iconButton: {
    padding: 8,
  },
  sendButton: {
    backgroundColor: '#667eea',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
