"use client";
import React from 'react';

import { useProfile } from '@/app/context/profileContext';
import Avatar from './Avatar';

interface Person {
  _id: string;
  fullname?: string;
  firstName?: string;
  lastName?: string;
  avatarLink?: string;
}

interface TopBarProps {
  selectedUserId: string;
  setSelectedUserId: (id: string | null) => void;
  offlinePeople: Record<string, Person>;
  onlinePeople: Record<string, { firstName:string,lastName:string,fullname: string; avatarLink?: string }>;
  connectionStatus: 'disconnected' | 'connecting' | 'connected';
  onBack?: () => void;
  isMobile?: boolean;
  
}

const TopBar: React.FC<TopBarProps> = ({
  selectedUserId,
  offlinePeople,
  onlinePeople,
  connectionStatus,
  onBack,
  isMobile = false,
  
}) => {
  const { userDetails } = useProfile();
  
  // Get the recipient from either onlinePeople or offlinePeople
  const onlinePerson = onlinePeople[selectedUserId];
  const offlinePerson = offlinePeople[selectedUserId];
  const recipient = onlinePerson || offlinePerson;

  if (!userDetails || !recipient) return null;

  // For desktop: show sender's info (current user)
  // For mobile: show recipient's info
  const displayPerson = isMobile ? recipient : userDetails;
  
  // Get display name with proper fallbacks
  const fullname = isMobile 
    ? recipient.fullname || `${recipient.firstName || ''} ${recipient.lastName || ''}`.trim() || 'Unknown User'
    //@ts-ignore
    : userDetails.fullname || `${userDetails.firstName || ''} ${userDetails.lastName || ''}`.trim() || 'Unknown User';

  const isOnline = !!onlinePeople[selectedUserId];
  const avatarLink = displayPerson.avatarLink;

  return (
    <div className="flex items-center justify-between w-full p-3">
      {/* Left side: Back button and recipient info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {isMobile && onBack && (
          <button 
            onClick={onBack}
            className="flex-shrink-0 p-1 text-gray-400 hover:text-white"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
        )}
        
        <div className="flex-shrink-0">
          <Avatar
            userId={selectedUserId}
            fullname={fullname}
            size="sm"
            avatarLink={avatarLink}
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-medium truncate">{fullname}</h2>
          {isMobile ? (
            // Show recipient's online status in mobile
            <p className={`text-xs truncate ${
              isOnline ? 'text-green-400' : 'text-gray-400'
            }`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
          ) : (
            // Show "You" indicator in desktop since it's showing sender's info
            <p className="text-xs text-gray-400 truncate">You</p>
          )}
        </div>
      </div>

      {/* Right side: Menu toggle and connection status */}
      <div className="flex items-center gap-2">
        {connectionStatus !== 'connected' && (
          <div className={`text-xs px-2 py-1 rounded ${
            connectionStatus === 'connecting' ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'
          }`}>
            {connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </div>
        )}
        
      
      </div>
    </div>
  );
};

export default TopBar;