import { useEffect, useRef } from 'react';
import useAuth from '../hooks/useAuth';
import { updateAdminStatus } from '../api/api';

const useOnlineStatus = () => {
  const { admin } = useAuth();
  const isCleaningUp = useRef(false);

  useEffect(() => {
    if (!admin?.adminId) return;

    const sendOnlineStatus = async () => {
      if (isCleaningUp.current) return;
      try {
        await updateAdminStatus({ status: 'online' }, admin.adminId);
      } catch (error) {
        console.error('Failed to update online status:', error);
      }
    };

    const sendOfflineStatus = async () => {
      try {
        await updateAdminStatus({ status: 'offline' }, admin.adminId);
      } catch (error) {
        console.error('Failed to update offline status:', error);
      }
    };

    // Initial online status
    sendOnlineStatus();

    // Use Page Visibility API instead of just beforeunload
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendOfflineStatus();
      } else {
        sendOnlineStatus();
      }
    };

    // Heartbeat interval (increased to 30 seconds)
    const interval = setInterval(sendOnlineStatus, 30000);

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', sendOfflineStatus);

    return () => {
      isCleaningUp.current = true;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', sendOfflineStatus);
      
      // Send offline status on cleanup (but don't await it to avoid blocking)
      sendOfflineStatus();
    };
  }, [admin?.adminId]);
};

export default useOnlineStatus;
