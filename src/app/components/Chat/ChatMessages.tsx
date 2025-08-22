"use client";
import React, { useState, useRef, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Avatar from './Avatar';
import { useAuth } from '@/app/context/authContext';
import { useMediaQuery } from 'react-responsive'; // Add this import

interface Message {
  _id: string;
  text: string;
  sender: string;
  recipient: string;
  createdAt: string;
  isOptimistic?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface UserDetails {
  _id: string;
  firstName?: string;
  lastName?: string;
  avatarLink?: string;
}

interface ChatMessagesProps {
  messages: Message[];
  userDetails: UserDetails;
  selectedUserId: string;
  recipientDetails: UserDetails;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  ws?: WebSocket | null;
  children: React.ReactNode;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({ 
  messages, 
  userDetails, 
  selectedUserId,
  recipientDetails,
  setMessages,
  ws,
  children
}) => {
  const { token } = useAuth();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Add media query to detect mobile view
  const isMobile = useMediaQuery({ maxWidth: 1023 });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: 'smooth'
    });
  }, [messages]);

  // Enhanced WebSocket message handler
  useEffect(() => {
    if (!ws) return;

    const handleMessage = (event: MessageEvent) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'status_update') {
          setMessages(prev => {
            const existingIndex = prev.findIndex(msg => 
              (data.tempId && msg._id === data.tempId) || 
              (data.messageId && msg._id === data.messageId)
            );

            if (existingIndex >= 0) {
              return prev.map(msg => {
                const idMatches = (data.tempId && msg._id === data.tempId) || 
                                 (data.messageId && msg._id === data.messageId);

                if (idMatches) {
                  return { 
                    ...msg, 
                    _id: data.messageId || msg._id,
                    status: data.status,
                    isOptimistic: false,
                    ...(data.createdAt && { createdAt: data.createdAt })
                  };
                }
                return msg;
              });
            }
            
            // Handle case where message isn't found (might be from previous session)
            if (data.messageId && data.status) {
              return [...prev, {
                _id: data.messageId,
                text: '', // Unknown content
                sender: userDetails._id,
                recipient: selectedUserId,
                createdAt: data.createdAt || new Date().toISOString(),
                status: data.status
              }];
            }
            
            return prev;
          });
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    };

    ws.addEventListener('message', handleMessage);
    return () => ws.removeEventListener('message', handleMessage);
  }, [ws, setMessages, selectedUserId, userDetails._id]);

  // Validate messages array
  if (!Array.isArray(messages)) {
    console.error('Messages is not an array:', messages);
    return <div className="p-4 text-red-500">Error loading messages</div>;
  }

  // Filter messages for current conversation
  const filteredMessages = useMemo(() => {
    return messages.filter(msg => 
      [msg.sender, msg.recipient].includes(selectedUserId) &&
      [msg.sender, msg.recipient].includes(userDetails._id)
    );
  }, [messages, selectedUserId, userDetails._id]);

  // Generate unique keys for each message
  const messagesToRender = useMemo(() => {
    const seenIds = new Set<string>();
    
    return filteredMessages.map((message) => {
      // Handle duplicate permanent IDs
      if (message._id) {
        if (seenIds.has(message._id)) {
          // If we encounter a duplicate permanent ID, create a unique variant
          const uniqueId = `${message._id}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
          seenIds.add(uniqueId);
          return {
            ...message,
            reactKey: uniqueId
          };
        }
        seenIds.add(message._id);
        return {
          ...message,
          reactKey: message._id
        };
      }
      
      // For temporary messages, create a highly unique key
      return {
        ...message,
        reactKey: `temp-${message.createdAt}-${message.sender}-${Math.random().toString(36).slice(2, 8)}`
      };
    });
  }, [filteredMessages]);

  useEffect(() => {
    if (!selectedUserId || !ws || !userDetails?._id) return;

    // When messages are loaded/updated, mark unread messages as read
    const unreadMessages = messages.filter(msg => 
      msg.recipient === userDetails._id && 
      msg.sender === selectedUserId && 
      msg.status !== 'read' &&
      msg._id && // Ensure message has an ID (not optimistic)
      !msg._id.startsWith('temp-') // Don't mark optimistic messages as read
    );

    if (unreadMessages.length > 0 && ws.readyState === WebSocket.OPEN) {
      unreadMessages.forEach(msg => {
        // Only send mark_read for messages that have actual IDs
        if (msg._id && !msg._id.startsWith('temp-')) {
          ws.send(JSON.stringify({
            type: 'mark_read',
            messageId: msg._id // Include the messageId
          }));
          
          // Optimistic update
          setMessages(prev => prev.map(m => 
            m._id === msg._id ? { ...m, status: 'read' } : m
          ));
        }
      });
    }
  }, [messages, selectedUserId, ws, userDetails?._id, setMessages]);

  const getStatusIndicator = (status?: string) => {
    switch (status) {
      case 'sending':
        return <span className="text-xs text-gray-400 ml-1" title="Sending">🕒</span>;
      case 'sent':
        return <span className="text-xs text-gray-400 ml-1" title="Sent">✓</span>;
      case 'delivered':
        return <span className="text-xs text-gray-400 ml-1" title="Delivered">✓✓</span>;
      case 'read':
        return <span className="text-xs text-yellow-500 ml-1" title="Read">✓✓</span>;
      case 'failed':
        return <span className="text-xs text-red-400 ml-1" title="Failed">✕</span>;
      default:
        return null;
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!token) {
      alert('Authentication required');
      return;
    }

    setDeletingId(messageId);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001"}/api/user/messages/${messageId}`, 
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete message');
      }

      setMessages(prev => prev.filter(msg => msg._id !== messageId));

      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'message_deleted',
          messageId,
          deletedAt: new Date().toISOString()
        }));
      }
      
    } catch (error) {
      console.error("Delete failed:", error);
      setMessages(prev => [...prev]);
      alert(error instanceof Error ? error.message : 'Failed to delete message');
    } finally {
      setDeletingId(null);
      setSelectedMessageId(null);
    }
  };

  const handleDeleteAllMessages = async () => {
    if (!selectedUserId || isDeletingAll) return;
    
    setIsDeletingAll(true);
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4001"}/api/user/messages/clear-conversation/${selectedUserId}`, 
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to clear conversation');
      }
      
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'conversation_cleared',
          recipientId: selectedUserId
        }));
      }
      
      setMessages([]);
      setSelectedMessageId(null);
    } catch (error: any) {
      console.error("Clear conversation failed:", error);
      alert(`Failed to clear conversation: ${error.message}`);
    } finally {
      setIsDeletingAll(false);
      setShowDeleteAllModal(false);
    }
  };

  const handleMessageClick = (messageId: string) => {
    setSelectedMessageId(prev => prev === messageId ? null : messageId);
  };

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header - Only show in desktop view */}
      {!isMobile && (
        <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700">
          {selectedUserId ? (
            <div className="flex justify-between items-center p-3">
              <div className="flex items-center gap-2">
                <Avatar 
                  userId={selectedUserId} 
                  fullname={
                    recipientDetails.firstName || recipientDetails.lastName 
                      ? `${recipientDetails.firstName || ''} ${recipientDetails.lastName || ''}`.trim()
                      : 'User'
                  } 
                  size="sm" 
                  avatarLink={recipientDetails.avatarLink}
                />
                <span className="font-medium text-white">
                  {recipientDetails.firstName || recipientDetails.lastName 
                    ? `${recipientDetails.firstName || ''} ${recipientDetails.lastName || ''}`.trim()
                    : 'User'}
                </span>
              </div>
              {messages.length > 0 && (
                <button 
                  onClick={() => setShowDeleteAllModal(true)}
                  className="text-red-400 hover:text-red-300 text-sm font-medium"
                >
                  Clear Chat
                </button>
              )}
            </div>
          ) : (
            <div className="p-3">
              <h1 className="text-white font-semibold">Chats</h1>
            </div>
          )}
        </div>
      )}

      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4"
        style={{ paddingBottom: '80px' }}
      >
        <div className="flex flex-col gap-3">
          {selectedUserId ? (
            messagesToRender.map((message) => {
              const isMe = message.sender === userDetails._id;
              const isSelected = selectedMessageId === message._id;
              
              return (
                <div 
                  key={message.reactKey}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'} relative`}
                >
                  {!isMe && (
                    <div className="flex-shrink-0 self-end">
                      <Avatar
                        userId={message.sender}
                        fullname={message.sender}
                        size="sm"
                      />
                    </div>
                  )}
                  <div 
                    className={`max-w-[85%] min-w-[50px] px-4 py-2 rounded-2xl relative ${
                      isMe 
                        ? 'bg-blue-600 rounded-br-none ml-10' 
                        : 'bg-gray-600 rounded-bl-none mr-10'
                    } ${isSelected ? 'ring-2 ring-blue-400' : ''}`}
                    onClick={() => handleMessageClick(message._id)}
                  >
                    <p className="text-white break-words">
                      {message.text}
                    </p>
                    {isMe && (
                      <div className="flex justify-end mt-1">
                        {getStatusIndicator(message.status)}
                      </div>
                    )}
                    {isSelected && isMe && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(message._id);
                        }}
                        disabled={deletingId === message._id}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        {deletingId === message._id ? '...' : '✕'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-5xl mb-4">👋</div>
                <h3 className="text-xl font-medium mb-2">Select a conversation</h3>
                <p className="text-gray-500">Start chatting with your connections</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 p-4 bg-gray-800 border-t border-gray-700">
        {children}
      </div>

      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium mb-4 text-white">Clear this chat?</h3>
            <p className="mb-6 text-gray-300">All messages will be deleted for you.</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="px-4 py-2 rounded bg-gray-600 hover:bg-gray-500 text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllMessages}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white"
              >
                {isDeletingAll ? 'Clearing...' : 'Clear Chat'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatMessages;