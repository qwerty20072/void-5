
import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageSquare, Send, User, Clock, ArrowLeft, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Conversation {
  id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  tutor_id: string;
  tutor_name: string;
  service_type?: string;
  created_at: string;
  updated_at: string;
  unread_count?: number;
  last_message?: {
    content: string;
    sender_type: string;
    created_at: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_type: 'client' | 'tutor';
  created_at: string;
  conversation_id: string;
}

interface InboxProps {
  userId: string;
}

const Inbox = ({ userId }: InboxProps) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [userType, setUserType] = useState<'Student' | 'Tutor' | null>(null);
  const [lastReadTimes, setLastReadTimes] = useState<{[conversationId: string]: string}>({});
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Load user type and conversations
  useEffect(() => {
    loadUserTypeAndConversations();
    loadLastReadTimes();
  }, [userId]);

  const loadLastReadTimes = () => {
    const stored = localStorage.getItem(`lastReadTimes_${userId}`);
    if (stored) {
      setLastReadTimes(JSON.parse(stored));
    }
  };

  const markConversationAsRead = (conversationId: string) => {
    const now = new Date().toISOString();
    const newLastReadTimes = { ...lastReadTimes, [conversationId]: now };
    setLastReadTimes(newLastReadTimes);
    localStorage.setItem(`lastReadTimes_${userId}`, JSON.stringify(newLastReadTimes));
    
    // Notify other components (like Navigation) that read status changed
    window.dispatchEvent(new CustomEvent('messagesMarkedAsRead'));
    
    // Refresh conversations to update unread counts immediately
    setTimeout(() => {
      loadUserTypeAndConversations();
    }, 100);
  };

  // Set up real-time subscription for messages
  useEffect(() => {
    if (!selectedConversation) return;

    loadMessages(selectedConversation.id);
    markConversationAsRead(selectedConversation.id);

    const messagesSubscription = supabase
      .channel(`inbox-messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${selectedConversation.id}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          // Mark as read immediately if this conversation is selected
          markConversationAsRead(selectedConversation.id);
          // Refresh conversations to update last message
          loadUserTypeAndConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesSubscription);
    };
  }, [selectedConversation]);

  // Scroll functionality
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    const handleMessagesScroll = () => {
      if (messagesScrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = messagesScrollRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
        setShowScrollBottom(!isNearBottom && scrollTop > 100);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    const messagesContainer = messagesScrollRef.current;
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', handleMessagesScroll);
    }
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (messagesContainer) {
        messagesContainer.removeEventListener('scroll', handleMessagesScroll);
      }
    };
  }, [selectedConversation]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    if (messagesScrollRef.current) {
      messagesScrollRef.current.scrollTop = messagesScrollRef.current.scrollHeight;
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (selectedConversation && messages.length > 0) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, selectedConversation]);

  const loadUserTypeAndConversations = async () => {
    try {
      // First, get user type
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;

      const currentUserType = profile?.user_type?.toLowerCase() === 'tutor' ? 'Tutor' : 'Student';
      setUserType(currentUserType);

      // Then load conversations based on user type
      let query = supabase
        .from('conversations')
        .select(`
          *,
          messages!inner(content, sender_type, created_at)
        `);

      // Filter conversations based on user type
      if (currentUserType === 'Tutor') {
        query = query.eq('tutor_id', userId);
      } else {
        query = query.eq('client_id', userId);
      }

      const { data: convos, error } = await query.order('updated_at', { ascending: false });

      if (error) throw error;

      // Process conversations to add last message and unread count
      const processedConvos = (convos || []).map(convo => {
        const conversationMessages = convo.messages || [];
        const lastMessage = conversationMessages.length > 0 
          ? conversationMessages[conversationMessages.length - 1]
          : null;
        
        // Calculate unread count based on last read time
        const lastReadTime = lastReadTimes[convo.id];
        let unreadCount = 0;
        
        if (lastReadTime) {
          // Count messages after last read time from the other party
          const otherPartyType = currentUserType === 'Tutor' ? 'client' : 'tutor';
          unreadCount = conversationMessages.filter(msg => 
            msg.sender_type === otherPartyType && 
            new Date(msg.created_at) > new Date(lastReadTime)
          ).length;
        } else {
          // If never read, count all messages from the other party
          const otherPartyType = currentUserType === 'Tutor' ? 'client' : 'tutor';
          unreadCount = conversationMessages.filter(msg => 
            msg.sender_type === otherPartyType
          ).length;
        }

        return {
          ...convo,
          last_message: lastMessage,
          unread_count: unreadCount,
          messages: undefined // Remove messages from the object to keep it clean
        };
      });

      setConversations(processedConvos);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: "Failed to load conversations.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
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
      toast({
        title: "Error",
        description: "Failed to load messages.",
        variant: "destructive",
      });
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConversation || !newMessage.trim() || sending) return;

    try {
      setSending(true);

      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: selectedConversation.id,
          content: newMessage.trim(),
          sender_type: userType === 'Tutor' ? 'tutor' : 'client'
        })
        .select()
        .single();

      if (error) throw error;

      // Immediately add the message to the UI
      const newMsg: Message = {
        id: data.id,
        content: data.content,
        sender_type: data.sender_type as 'client' | 'tutor',
        created_at: data.created_at,
        conversation_id: data.conversation_id
      };
      setMessages(prev => [...prev, newMsg]);

      // Update conversation's updated_at
      await supabase
        .from('conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', selectedConversation.id);

      setNewMessage('');
      
      // Refresh conversations to update last message
      loadUserTypeAndConversations();
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: "Error",
        description: "Failed to send reply. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${Math.floor(diffInHours)}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading conversations...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
        {/* Conversations List */}
        <Card className="lg:col-span-1 bg-card border border-border rounded-xl overflow-hidden">
          <CardHeader className="pb-3 bg-primary border-b border-border rounded-t-xl">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-primary-foreground">
                Conversations ({conversations.length})
              </h3>
            </div>
          </CardHeader>
          <ScrollArea className="h-[500px]">
            <div className="space-y-3 p-4">
              {conversations.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-primary/20">
                    <MessageSquare className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm text-foreground font-medium">No conversations yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Start a conversation with a tutor to see it here</p>
                </div>
              ) : (
                conversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    className={cn(
                      "p-4 rounded-xl cursor-pointer transition-all duration-200 border hover:shadow-lg hover:scale-[1.02] group",
                      selectedConversation?.id === conversation.id
                        ? "bg-primary/10 border-primary/40 shadow-lg shadow-primary/10"
                        : "hover:bg-muted/50 hover:border-border bg-background border-border"
                    )}
                    onClick={() => {
                      setSelectedConversation(conversation);
                      markConversationAsRead(conversation.id);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                            selectedConversation?.id === conversation.id
                              ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                              : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                          )}>
                            <User className="h-5 w-5" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-sm text-foreground">
                              {userType === 'Tutor' ? conversation.client_name : conversation.tutor_name}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {userType === 'Tutor' 
                              ? (conversation.service_type ? `${conversation.service_type} Student` : 'Student')
                              : 'Tutor'}
                          </p>
                        </div>
                      </div>
                      {conversation.last_message && (
                        <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                          {formatRelativeTime(conversation.last_message.created_at)}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Chat Interface */}
        <Card className="lg:col-span-2 bg-card border border-border rounded-xl overflow-hidden">
          {selectedConversation ? (
            <>
              <CardHeader className="pb-3 bg-primary border-b border-border rounded-t-xl">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedConversation(null)}
                    className="lg:hidden hover:bg-primary-foreground/10 text-primary-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-foreground/20 rounded-full flex items-center justify-center shadow-md border border-primary-foreground/30">
                      <User className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-primary-foreground">
                        {userType === 'Tutor' ? selectedConversation.client_name : selectedConversation.tutor_name}
                      </h3>
                      <p className="text-sm text-primary-foreground/70">
                        {userType === 'Tutor' 
                          ? (selectedConversation.service_type ? `${selectedConversation.service_type} Student` : 'Student')
                          : 'Tutor'}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <ScrollArea className="h-[400px] px-4 bg-background" ref={messagesScrollRef}>
                <div className="space-y-4 py-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                     className={cn(
                       "flex gap-3 animate-fade-in",
                       (userType === 'Tutor' && message.sender_type === 'tutor') || 
                       (userType === 'Student' && message.sender_type === 'client') 
                         ? "justify-end" : "justify-start"
                     )}
                    >
                       {((userType === 'Tutor' && message.sender_type === 'client') || 
                         (userType === 'Student' && message.sender_type === 'tutor')) && (
                         <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0 mt-1 border border-border">
                           <User className="h-4 w-4 text-muted-foreground" />
                         </div>
                       )}
                      
                       <div
                         className={cn(
                           "max-w-[75%] rounded-2xl px-4 py-3 shadow-sm transition-all duration-200 hover:shadow-md relative",
                           (userType === 'Tutor' && message.sender_type === 'tutor') || 
                           (userType === 'Student' && message.sender_type === 'client')
                             ? "bg-slate-100 dark:bg-slate-800 text-foreground shadow-lg border border-slate-200 dark:border-slate-700 rounded-br-sm before:content-[''] before:absolute before:top-3 before:-right-3 before:w-0 before:h-0 before:border-l-[20px] before:border-l-slate-100 dark:before:border-l-slate-800 before:border-t-[10px] before:border-t-transparent before:border-b-[10px] before:border-b-transparent"
                             : "bg-slate-100 dark:bg-slate-800 text-foreground shadow-lg border border-slate-200 dark:border-slate-700 rounded-bl-sm before:content-[''] before:absolute before:top-3 before:-left-3 before:w-0 before:h-0 before:border-r-[20px] before:border-r-slate-100 dark:before:border-r-slate-800 before:border-t-[10px] before:border-t-transparent before:border-b-[10px] before:border-b-transparent"
                         )}
                       >
                         <p className="text-sm leading-relaxed">{message.content}</p>
                         <p className="text-xs mt-2 opacity-70 font-medium text-muted-foreground">
                           {formatTime(message.created_at)}
                         </p>
                      </div>

                       {((userType === 'Tutor' && message.sender_type === 'tutor') || 
                         (userType === 'Student' && message.sender_type === 'client')) && (
                         <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1 shadow-md shadow-primary/30 border border-primary/30">
                           <User className="h-4 w-4 text-primary-foreground" />
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <Separator className="bg-border" />

              <div className="p-4 bg-background">
                <form onSubmit={sendReply} className="flex gap-3">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your reply..."
                    disabled={sending}
                    className="flex-1 border-border bg-background focus:border-primary/50 focus:ring-primary/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  />
                  <Button 
                    type="submit" 
                    disabled={!newMessage.trim() || sending}
                    size="icon"
                    className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-lg shadow-accent/20 transition-all duration-200 hover:scale-105 border border-accent/30"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-accent-foreground"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <CardContent className="flex items-center justify-center h-full bg-background">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <h3 className="font-semibold mb-3 text-lg text-foreground">Select a conversation</h3>
                 <p className="text-sm text-muted-foreground max-w-md">
                   {userType === 'Tutor' 
                     ? "Choose a conversation from the list to start replying to your students"
                     : "Choose a conversation from the list to continue chatting with your tutors"
                   }
                 </p>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Scroll Buttons */}
      {showScrollTop && (
        <Button
          onClick={scrollToTop}
          size="icon"
          className="fixed bottom-20 right-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      )}
      
      {showScrollBottom && selectedConversation && (
        <Button
          onClick={scrollToBottom}
          size="icon"
          className="fixed bottom-8 right-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-50"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default Inbox;
