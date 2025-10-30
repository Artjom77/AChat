import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface MessageBubbleProps {
  message: {
    text: string;
    timestamp: string;
    status: 'sending' | 'sent' | 'delivered' | 'read';
  };
  isMe: boolean;
}

export default function MessageBubble({ message, isMe }: MessageBubbleProps) {
  const getStatusIcon = () => {
    switch (message.status) {
      case 'sending':
        return <Icon name="clock-outline" size={14} color="#999" />;
      case 'sent':
        return <Icon name="check" size={14} color="#999" />;
      case 'delivered':
        return <Icon name="check-all" size={14} color="#999" />;
      case 'read':
        return <Icon name="check-all" size={14} color="#667eea" />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, isMe && styles.containerMe]}>
      <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
        <Text style={[styles.text, isMe && styles.textMe]}>
          {message.text}
        </Text>

        <View style={styles.footer}>
          <Text style={[styles.time, isMe && styles.timeMe]}>
            {formatTime(message.timestamp)}
          </Text>
          {isMe && <View style={styles.status}>{getStatusIcon()}</View>}
        </View>
      </View>
    </View>
  );
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    marginHorizontal: 10,
  },
  containerMe: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 16,
  },
  bubbleMe: {
    backgroundColor: '#667eea',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: 'white',
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 16,
    color: '#333',
  },
  textMe: {
    color: 'white',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  time: {
    fontSize: 11,
    color: '#999',
  },
  timeMe: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  status: {
    marginLeft: 4,
  },
});
