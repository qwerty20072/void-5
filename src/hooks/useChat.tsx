
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export interface Message {
  id: string;
  content: string;
  sender_type: 'client' | 'tutor';
  created_at: string;
  conversation_id: string;
}

export interface Conversation {
  id: string;
  tutor_id: string;
  client_id: string;
  tutor_name: string;
  client_name: string;
  client_email: string;
  service_type?: string;
  created_at: string;
  updated_at: string;
}

export const messageSchema = z.object({
  content: z.string().trim().min(1, { message: "Message cannot be empty" }).max(1000, { message: "Message must be under 1000 characters" })
});

export const useChat = () => {
  const { toast } = useToast();
  const { handleError } = useErrorHandler();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Load messages for a conversation
  const loadMessages = useCallback(async (conversationId: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(msg => ({
        ...msg,
        sender_type: msg.sender_type as 'client' | 'tutor'
      })));

    } catch (error) {
      handleError(error, { fallbackMessage: "Failed to load messages." });
    }
  }, [toast]);

  // Initialize or find conversation between current user and tutor
  const initializeConversation = useCallback(async (currentUserId: string, tutorData: { id: string; name: string; service?: string }) => {
    if (!currentUserId || !tutorData.id) return;

    try {
      setLoading(true);

      // Check if conversation already exists
      const { data: existingConv, error: searchError } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', currentUserId)
        .eq('tutor_id', tutorData.id)
        .maybeSingle();

      if (searchError && searchError.code !== 'PGRST116') {
        throw searchError;
      }

      if (existingConv) {
        setConversation(existingConv);
        await loadMessages(existingConv.id);
        return;
      }

      // Get current user profile for name
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', currentUserId)
        .single();

      // Create new conversation
      const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
          client_id: currentUserId,
          tutor_id: tutorData.id,
          tutor_name: tutorData.name,
          client_name: userProfile?.name || 'Student',
          client_email: currentUserId, // Using ID as placeholder
          service_type: tutorData.service
        })
        .select()
        .single();

      if (createError) throw createError;

      setConversation(newConv);
      await loadMessages(newConv.id);

    } catch (error) {
      handleError(error, { fallbackMessage: "Failed to start conversation. Please try again." });
    } finally {
      setLoading(false);
    }
  }, [toast, loadMessages]);

  // Send a new message
  const sendMessage = useCallback(async (content: string, currentUserId: string) => {
    if (!conversation || !currentUserId) return;

    const result = messageSchema.safeParse({ content });
    if (!result.success) {
      toast({
        title: "Invalid message",
        description: result.error.issues?.[0]?.message || "Please check your message.",
        variant: "destructive",
      });
      return;
    }

    const cleaned = result.data.content;

    try {
      setSending(true);

      // Determine sender type based on conversation roles
      const senderType = conversation.client_id === currentUserId ? 'client' : 'tutor';

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          content: cleaned,
          sender_type: senderType
        })
        .select()
        .single();

      if (error) throw error;

      // Add message to local state
      setMessages(prev => [...prev, {
        ...data,
        sender_type: data.sender_type as 'client' | 'tutor'
      }]);

      // Bump conversation updated_at so it shows at top of lists
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversation.id);

    } catch (error) {
      handleError(error, { fallbackMessage: "Failed to send message. Please try again." });
    } finally {
      setSending(false);
    }
  }, [conversation, toast]);

  // Set up real-time message subscription
  useEffect(() => {
    if (!conversation) return;

    const subscription = supabase
      .channel(`messages:${conversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversation.id}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversation?.id]); // Only depend on conversation.id, not the whole object

  return {
    conversation,
    messages,
    loading,
    sending,
    initializeConversation,
    sendMessage
  };
};
