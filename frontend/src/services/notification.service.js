import { supabase } from '../lib/supabaseClient';

/**
 * Production Notification Service
 * With real-time Supabase websocket subscription.
 */
export const notificationService = {
  // Fetch user notifications
  async getNotifications(userId) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.warn('Notification fetch warning:', error.message);
      return [];
    }
    return data || [];
  },

  // Mark single notification as read
  async markAsRead(notificationId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) console.error('Error marking notification read:', error.message);
  },

  // Mark all notifications read
  async markAllAsRead(userId) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', userId);

    if (error) console.error('Error marking all read:', error.message);
  },

  // Subscribe to real-time notification stream
  subscribe(userId, onNewNotification) {
    if (!userId || userId.startsWith('00000000-0000')) {
      return () => {};
    }
    try {
      const channel = supabase
        .channel(`user-notifications-${userId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          payload => {
            if (onNewNotification) onNewNotification(payload.new);
          }
        )
        .subscribe();

      return () => {
        try {
          supabase.removeChannel(channel);
        } catch (e) {}
      };
    } catch (err) {
      console.warn('Realtime subscription skipped:', err.message);
      return () => {};
    }
  }
};
