"use client";
import React, { useState } from 'react';

import Contact from './Contact';
import { useRouter } from 'next/navigation';

interface OnlineUsersListProps {
  onlinePeople: Record<string, { 
    firstName?: string;
    lastName?: string;
    fullname?: string; 
    avatarLink?: string 
  }>;
  offlinePeople: Record<string, { 
    _id: string;
    firstName?: string;
    lastName?: string;
    avatarLink?: string;
  }>;
  selectedUserId: string | null;
  setSelectedUserId: (id: string) => void;
  loading: boolean;
  onCloseContacts?: () => void;
  onMenuToggle?: () => void;
}

const OnlineUsersList: React.FC<OnlineUsersListProps> = ({
  onlinePeople = {},
  offlinePeople = {},
  selectedUserId,
  setSelectedUserId,
  loading,
  onCloseContacts,
  onMenuToggle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  // Function to get username - MOVED TO TOP
  const getUsername = (user: { firstName?: string; lastName?: string; fullname?: string }) => {
    if (user?.fullname) return user.fullname;
    const firstName = user?.firstName || '';
    const lastName = user?.lastName || '';
    return `${firstName} ${lastName}`.trim() || 'Unknown';
  };

  // Function to handle going back to home
  const handleBackToHome = () => {
    router.push('/'); // Navigate to home page
  };

  // Safe filtering with fallbacks - NOW getUsername IS DEFINED
  const filteredOnlinePeople = Object.entries(onlinePeople)
    .filter(([userId, user]) => {
      const username = getUsername(user);
      return username.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .map(([userId]) => userId);

  const filteredOfflinePeople = Object.entries(offlinePeople)
    .filter(([userId, person]) => {
      const username = getUsername(person);
      return username.toLowerCase().includes(searchTerm.toLowerCase());
    })
    .map(([userId]) => userId);

  return (
    <div className="h-full flex flex-col bg-gray-800">
      {/* Header with Back Button and Menu Button for Mobile */}
      <div className="p-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          {/* Back to Home Button - Only visible on mobile */}
          <button 
            onClick={handleBackToHome}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          
          <h2 className="text-white font-semibold">Contacts</h2>
          
          {/* Menu Button - Only visible on mobile */}
          <button 
            onClick={onMenuToggle}
            className="md:hidden p-2 text-gray-400 hover:text-white"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
        
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-400">Loading contacts...</p>
        </div>
      )}

      {/* Contacts List */}
      {!loading && (
        <div className="flex-1 overflow-y-auto">
          {/* Online contacts section */}
          <div>
            <div className="sticky top-0 bg-gray-800 pt-2 pb-1 px-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Online</h3>
            </div>
            <div className="px-2 pt-1">
              {filteredOnlinePeople.length > 0 ? (
                filteredOnlinePeople.map((userId) => {
                  const user = onlinePeople[userId] || {};
                  return (
                    <Contact
                      key={userId}
                      userId={userId}
                      fullname={getUsername(user)}
                      selectedUserId={selectedUserId}
                      setSelectedUserId={setSelectedUserId}
                      isOnline={true}
                      avatarLink={user.avatarLink}
                      onSelect={onCloseContacts}
                    />
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 px-2 py-3">No online contacts</p>
              )}
            </div>
          </div>

          {/* Offline contacts section */}
          <div>
            <div className="sticky top-0 bg-gray-800 pt-2 pb-1 px-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Offline</h3>
            </div>
            <div className="px-2 pt-1 pb-4">
              {filteredOfflinePeople.length > 0 ? (
                filteredOfflinePeople.map((userId) => {
                  const person = offlinePeople[userId] || {};
                  return (
                    <Contact
                      key={userId}
                      userId={userId}
                      fullname={getUsername(person)}
                      selectedUserId={selectedUserId}
                      setSelectedUserId={setSelectedUserId}
                      isOnline={false}
                      avatarLink={person.avatarLink}
                      onSelect={onCloseContacts}
                    />
                  );
                })
              ) : (
                <p className="text-sm text-gray-500 px-2 py-3">No offline contacts</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Close Button */}
      {onCloseContacts && (
        <div className="p-3 border-t border-gray-700">
          <button
            onClick={onCloseContacts}
            className="w-full py-2 px-4 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Close Contacts
          </button>
        </div>
      )}
    </div>
  );
};

export default OnlineUsersList;