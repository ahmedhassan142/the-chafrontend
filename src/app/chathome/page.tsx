"use client";
import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import dynamic from 'next/dynamic'; 
import { useMediaQuery } from 'react-responsive';

import ProtectedRoute from '../components/Protectedroute';
import TopBar from '../components/Chat/Topbar';
import ChatMessages from '../components/Chat/ChatMessages';
import Nav from '../components/Chat/Nav';
import MessageInputForm from '@/app/components/Chat/MessageInputForm';

import { useAuth } from '@/app/context/authContext';
import { useProfile } from '@/app/context/profileContext';
import OnlineUsersList from '../components/Chat/OnlineUserList';



interface Message {
  _id: string;
  text: string;
  sender: string;
  recipient: string;
  createdAt: string;
  isOptimistic?: boolean;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface WsUser {
  _id: string;
  fullname?: string;
  firstName?: string;
  lastName?: string;
  avatarLink?: string;
}

type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

const ChatHome = () => {
  const [ws, setWs] = useState<WebSocket | null>(null);
  // Add this state at the top of your ChatHome component
const [loadingContacts, setLoadingContacts] = useState(false);
  const [onlinePeople, setOnlinePeople] = useState<Record<string, WsUser>>({});
  const [offlinePeople, setOfflinePeople] = useState<Record<string, WsUser>>({});
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  
  const isMobile = useMediaQuery({ maxWidth: 1023 });
  const { userDetails } = useProfile();
  const { isAuthenticated, checkAuth, logout, token } = useAuth();
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
// In your ChatHome component, add this state
const [recipientDetails, setRecipientDetails] = useState<{
  _id: string;
  firstName?: string;
  lastName?: string;
  avatarLink?: string;
} | null>(null);

// Modify your handleUserSelect function
const handleUserSelect = (userId: string) => {
  setSelectedUserId(userId);
  
  // Find the user in either onlinePeople or offlinePeople
  const user = onlinePeople[userId] || offlinePeople[userId];
  
  if (user) {
    setRecipientDetails({
      _id: userId,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarLink: user.avatarLink
    });
  } else {
    // Fallback if user not found (shouldn't happen since you're selecting from the list)
    setRecipientDetails({
      _id: userId,
      firstName: '',
      lastName: ''
    });
  }
  
  if (isMobile) {
    setShowContacts(false);
  }
};
  const fetchPeople = useCallback(async () => {
  if (!isAuthenticated) return;
     setLoadingContacts(true);
  try {
    const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL || "https://the-chat-backend.onrender.com"}/api/user/people`, {
      headers: {
        Authorization: `Bearer ${token}`,
        withCredentials: true
      }
    });

    const peopleData = Array.isArray(response?.data) 
      ? response.data.map((p: any) => ({
          _id: p?._id || '',
          firstName: p?.firstName,
          lastName: p?.lastName,
          fullname: `${p?.firstName || ''} ${p?.lastName || ''}`.trim(), // Add fullname
          avatarLink: p?.avatarLink,
        }))
      : [];

    const offlinePeopleArr = peopleData
      .filter((p: WsUser) => p._id !== userDetails?._id)
      .filter((p: WsUser) => !onlinePeople[p._id]);

    const newOfflinePeople = offlinePeopleArr.reduce((acc: Record<string, WsUser>, p: WsUser) => {
      acc[p._id] = p;
      return acc;
    }, {});

    setOfflinePeople(prev => {
      const filteredPrev = Object.fromEntries(
        Object.entries(prev).filter(([id]) => !onlinePeople[id])
      );
      return { ...filteredPrev, ...newOfflinePeople };
    });

  } catch (error) {
    console.error('Error fetching people:', error);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      logout();
    }
  } finally{
    setLoadingContacts(false);
  }
}, [isAuthenticated, onlinePeople, userDetails?._id, logout, token]);
const fetchMessages = useCallback(async (loadMore = false, beforeDate?: string) => {
  if (!selectedUserId || !token) return;

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_BASE_URL || "https://the-chat-backend.onrender.com"}/api/user/messages/${selectedUserId}`,
      { 
        headers: { Authorization: `Bearer ${token}` },
        params: {
          limit: 50,
          before: loadMore ? beforeDate : undefined
        }
      }
    );

    // Handle new response format
    const newMessages = response.data.data.messages.map((msg:Message) => ({
      _id: msg._id,
      text: msg.text,
      sender: msg.sender,
      recipient: msg.recipient,
      createdAt: msg.createdAt,
      status: 'sent'
    }));

    setMessages(prev => loadMore 
      ? [...newMessages, ...prev] // Prepend for pagination
      : [...prev.filter(m => m.status !== 'sent'), ...newMessages] // Merge with pending
    );

    return response.data.data.hasMore;

  } catch (error) {
    console.error('Error fetching messages:', error);
    return false;
  }
}, [selectedUserId, token]);
 
  const connectToWebSocket = useCallback(() => {
    if (!isAuthenticated || !token) {
      console.error('[WebSocket] Authentication required - missing token');
      setConnectionStatus('disconnected');
      return () => {}; // Return empty cleanup function
    }

    setConnectionStatus('connecting');
    const wsUrl = `wss://the-chat-backend.onrender.com/ws?token=${encodeURIComponent(token)}`;

    try {
      const socket = new WebSocket(wsUrl);

      socket.onopen = () => {
        console.log('[WebSocket] Connection established');
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        socket.send(JSON.stringify({
          type: 'handshake',
          userId: userDetails?._id,
          timestamp: new Date().toISOString()
        }));
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.debug('[WebSocket] Message received:', data);

          switch (data.type) {
            case 'auth_success':
              console.log('[WebSocket] Authentication confirmed');
              break;
              
            case 'online_users':
              setOnlineUsers(data.users);
              break;
              
            case 'message':
              handleIncomingMessage(data);
              break;
              
            case 'status_update':
              updateMessageStatus(data);
              break;
              
            case 'error':
              console.error('[WebSocket] Server error:', data.message);
              break;
              
            default:
              console.warn('[WebSocket] Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('[WebSocket] Message processing error:', error, event.data);
        }
      };

      socket.onclose = (event) => {
        const closeDetails = {
          code: event.code,
          reason: event.reason,
          wasClean: event.wasClean,
          timestamp: new Date().toISOString()
        };
        
        console.log('[WebSocket] Connection closed:', closeDetails);
        setConnectionStatus('disconnected');
        
        if (event.code !== 1000) {
          const baseDelay = 1000;
          const maxDelay = 30000;
          const delay = Math.min(
            baseDelay * Math.pow(2, reconnectAttempts.current),
            maxDelay
          );
          
          console.log(`[WebSocket] Will attempt reconnect in ${delay}ms`);
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttempts.current++;
            console.log(`[WebSocket] Attempting reconnect #${reconnectAttempts.current}`);
            connectToWebSocket();
          }, delay);
        }
      };

      socket.onerror = (error) => {
        const errorDetails = {
          error: error,
          readyState: socket.readyState,
          url: wsUrl,
          timestamp: new Date().toISOString()
        };
        
        console.error('[WebSocket] Connection error:', errorDetails);
        setConnectionStatus('disconnected');
      };

      wsRef.current = socket;
      setWs(socket);

      return () => {
        console.log('[WebSocket] Cleaning up connection');
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.close(1000, 'Component unmounted');
        }
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
        }
      };

    } catch (error) {
      console.error('[WebSocket] Connection initialization failed:', error);
      setConnectionStatus('disconnected');
      return () => {}; // Return empty cleanup function
    }
  }, [isAuthenticated, token, userDetails?._id]);

// Helper functions
const setOnlineUsers = (users: WsUser[]) => {
  const onlineMap = users.reduce((acc: Record<string, WsUser>, user: WsUser) => {
    if (user._id !== userDetails?._id) {
      acc[user._id] = user;
    }
    return acc;
  }, {});
  
  setOnlinePeople(onlineMap);
  console.debug('[WebSocket] Updated online users:', onlineMap);
};

const handleIncomingMessage = (data: any) => {
  setMessages(prev => {
    // Handle optimistic updates
    const existingIndex = prev.findIndex(m => 
      m.isOptimistic && 
      m.text === data.content && 
      Math.abs(new Date(m.createdAt).getTime() - new Date(data.createdAt).getTime()) < 1000
    );
    
    if (existingIndex >= 0) {
      const updated = [...prev];
      updated[existingIndex] = {
        ...data,
        _id: data.messageId,
        text: data.content,
        sender: data.senderId,
        isOptimistic: undefined,
        status: 'delivered'
      };
      return updated;
    }
    
    return [...prev, {
      _id: data.messageId,
      text: data.content,
      sender: data.senderId,
      recipient: userDetails?._id || '',
      createdAt: data.createdAt,
      status: 'delivered'
    }];
  });
};

const updateMessageStatus = (data: any) => {
  setMessages(prev => prev.map(m => 
    m._id === data.messageId ? { ...m, status: data.status } : m
  ));
  console.debug('[WebSocket] Updated message status:', data);
};
  const sendMessage = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newMessage.trim() || !selectedUserId || !ws || !userDetails) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    
    const optimisticMessage = {
      _id: tempId,
      text: newMessage,
      recipient: selectedUserId,
      sender: userDetails._id,
      createdAt: new Date().toISOString(),
      isOptimistic: true,
      status: 'sending'
    };
//@ts-ignore
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');

    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify({
          type: 'message',
          content: newMessage,  // Changed from 'text' to 'content'
    recipientId: selectedUserId, 
          clientTempId: tempId
        }));
      } catch (error) {
        console.error('Error sending message:', error);
        setMessages(prev => prev.map(m => 
          m._id === tempId ? { ...m, status: 'failed' } : m
        ));
      }
    } else {
      setMessages(prev => prev.map(m => 
        m._id === tempId ? { ...m, status: 'failed' } : m
      ));
    }
  };

  useEffect(() => {
    if (selectedUserId && ws?.readyState === WebSocket.OPEN) {
      fetchMessages();
    }
  }, [selectedUserId, ws?.readyState]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const verifyAuth = async () => {
      await checkAuth();
      if (!isAuthenticated) {
        router.push('/login');
      } else {
        fetchPeople();
        if (isMobile) {
          setShowContacts(true);
        }
      }
    };
    verifyAuth();
  }, [isAuthenticated, checkAuth, router, fetchPeople, isMobile]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const socket = connectToWebSocket();
    return () => {
      //@ts-ignore
      if (socket && socket.readyState === WebSocket.OPEN) {
        //@ts-ignore
        socket.close(1000, 'Component unmounted');
      }
    };
  }, [isAuthenticated, connectToWebSocket]);

 

  const handleBackToContacts = () => {
    setSelectedUserId(null);
    if (isMobile) {
      setShowContacts(true);
    }
  };
 

  if (!isAuthenticated) {
    return null;
  }

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-gray-900">
        {/* Navigation Sidebar */}
        <div className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-800 transform ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 transition-transform duration-300 ease-in-out`}>
          <Nav 
            connectionStatus={connectionStatus}
            onMobileMenuToggle={() => setMobileMenuOpen(false)}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col relative h-screen">
          {/* Mobile Header */}
         <div className="lg:hidden flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700 z-20">
             <div className="flex items-center gap-2">
              {/* <button 
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className=" pl-2 text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button> */}
              
              {selectedUserId ? (
                <TopBar
                  selectedUserId={selectedUserId}
                  setSelectedUserId={setSelectedUserId}
                  offlinePeople={offlinePeople}
                  //@ts-ignore
                  onlinePeople={onlinePeople}
                  connectionStatus={connectionStatus}
                  onBack={handleBackToContacts}
                  isMobile={true}
                  onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
                />
              ) : (
                <h1 className="text-white font-semibold">Chats</h1>
              )}
            </div>
            {!selectedUserId && (
              
              <button 
                onClick={() => setShowContacts(true)}
                className="p-2 text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </button>
              
            )}
          </div>

          {/* Desktop TopBar */}
          {selectedUserId && !isMobile && (
            <div className="hidden lg:block sticky top-0 z-10 bg-gray-800 border-b border-gray-700">
              <TopBar
                selectedUserId={selectedUserId}
                setSelectedUserId={setSelectedUserId}
                offlinePeople={offlinePeople}
                //@ts-ignore
                onlinePeople={onlinePeople}
                connectionStatus={connectionStatus}
                onBack={handleBackToContacts}
                isMobile={false}
              />
            </div>
          )}

          {/* Content Area */}
          <div className="flex-1 flex overflow-hidden h-[calc(100vh-3rem)]">
            {/* Contacts List */}
            
            <div className={`${isMobile ? (showContacts ? 'fixed inset-0 z-30' : 'hidden') : 'flex-shrink-0 w-64'} bg-gray-800 border-r border-gray-700 transition-transform duration-300 ease-in-out`}>
            

<OnlineUsersList
  onlinePeople={onlinePeople}
  offlinePeople={offlinePeople}
  selectedUserId={selectedUserId}
  setSelectedUserId={handleUserSelect}
  loading={loadingContacts}
  onCloseContacts={() => setShowContacts(false)}
  onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
/>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 min-h-0 flex flex-col ${isMobile && !selectedUserId ? 'hidden' : 'flex'}`}>
              {selectedUserId ? (
                <>
                 <ChatMessages
  messages={messages}
  userDetails={userDetails || { _id: '', firstName: '', lastName: '' }}
  selectedUserId={selectedUserId}
  recipientDetails={recipientDetails || { _id: selectedUserId || '', firstName: '', lastName: '' }}
  setMessages={setMessages}
  ws={ws}
>
  <MessageInputForm
    newMessage={newMessage}
    setNewMessage={setNewMessage}
    sendMessage={sendMessage}
    selectedUserId={selectedUserId}
  />
</ChatMessages>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center p-4">
                  <div className="text-center text-gray-400">
                    <h2 className="text-xl font-semibold mb-2">Select a chat to start messaging</h2>
                    <p>Or wait for someone to message you</p>
                    {connectionStatus !== 'connected' && (
                      <div className={`mt-4 p-2 rounded ${
                        connectionStatus === 'connecting' ? 'bg-yellow-900/50' : 'bg-red-900/50'
                      }`}>
                        {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ChatHome;