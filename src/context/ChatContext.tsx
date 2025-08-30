import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { chatService } from '../services/chatService';
import { Message } from '../types';
import { useAuth } from './AuthContext';

interface ChatContextType {
  messages: { [channelId: string]: Message[] };
  activeChannel: string | null;
  isConnected: boolean;
  sendMessage: (content: string, channelId: string, receiverId?: string) => Promise<void>;
  joinChannel: (channelId: string) => void;
  leaveChannel: (channelId: string) => void;
  loadMessages: (channelId: string) => Promise<void>;
  setActiveChannel: (channelId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<{ [channelId: string]: Message[] }>({});
  const [activeChannel, setActiveChannelState] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [subscriptions, setSubscriptions] = useState<{ [channelId: string]: any }>({});

  const sendMessage = async (content: string, channelId: string, receiverId?: string) => {
    if (!user) return;

    const { data, error } = await chatService.sendMessage(content, channelId, receiverId);
    if (error) {
      console.error('Error sending message:', error);
    }
  };

  const loadMessages = async (channelId: string) => {
    const { data, error } = await chatService.getMessages(channelId);
    if (data && !error) {
      setMessages(prev => ({
        ...prev,
        [channelId]: data
      }));
    }
  };

  const joinChannel = (channelId: string) => {
    if (subscriptions[channelId]) return;

    const subscription = chatService.subscribeToChannel(channelId, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new as Message;
        setMessages(prev => ({
          ...prev,
          [channelId]: [...(prev[channelId] || []), newMessage]
        }));
      }
    });

    setSubscriptions(prev => ({
      ...prev,
      [channelId]: subscription
    }));

    // Load existing messages
    loadMessages(channelId);
    setIsConnected(true);
  };

  const leaveChannel = (channelId: string) => {
    if (subscriptions[channelId]) {
      subscriptions[channelId].unsubscribe();
      setSubscriptions(prev => {
        const newSubs = { ...prev };
        delete newSubs[channelId];
        return newSubs;
      });
    }
  };

  const setActiveChannel = (channelId: string) => {
    setActiveChannelState(channelId);
    if (!subscriptions[channelId]) {
      joinChannel(channelId);
    }
  };

  useEffect(() => {
    if (user) {
      // Subscribe to direct messages for the user
      const directMessageSub = chatService.subscribeToDirectMessages(user.id, (payload) => {
        if (payload.eventType === 'INSERT') {
          const newMessage = payload.new as Message;
          const channelId = `direct_${newMessage.sender_id}_${newMessage.receiver_id}`;
          setMessages(prev => ({
            ...prev,
            [channelId]: [...(prev[channelId] || []), newMessage]
          }));
        }
      });

      return () => {
        directMessageSub.unsubscribe();
        // Clean up all subscriptions
        Object.values(subscriptions).forEach(sub => sub.unsubscribe());
      };
    }
  }, [user]);

  const value: ChatContextType = {
    messages,
    activeChannel,
    isConnected,
    sendMessage,
    joinChannel,
    leaveChannel,
    loadMessages,
    setActiveChannel,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
