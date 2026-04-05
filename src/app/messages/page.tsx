"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { chatService, ChatConversation, ChatMessage } from "@/lib/chat-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Send, 
  MessageCircle, 
  CheckCircle, 
  X,
  Loader2,
  User,
  Clock,
  Archive
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function MessagesPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load conversations
  useEffect(() => {
    if (!user) return;
    
    setLoading(true);
    const unsubscribe = chatService.onConversationsChange((convs) => {
      setConversations(convs);
      const unread = convs.filter(c => c.unreadCount > 0).length;
      setUnreadCount(unread);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // Load messages when conversation selected
  useEffect(() => {
    if (!selectedConversation?.id) return;

    chatService.markAsRead(selectedConversation.id);
    
    const unsubscribe = chatService.onMessagesChange(selectedConversation.id, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation?.id || !user) return;

    setSending(true);
    try {
      await chatService.sendMessage({
        conversationId: selectedConversation.id,
        senderId: user.uid,
        senderType: 'staff',
        senderName: profile?.displayName || user.email || "Staff",
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!selectedConversation?.id || !user) return;
    
    try {
      await chatService.assignStaff(
        selectedConversation.id,
        user.uid,
        profile?.displayName || user.email || "Staff"
      );
      toast.success("Conversation assigned to you");
    } catch (error) {
      console.error("Error assigning conversation:", error);
      toast.error("Failed to assign conversation");
    }
  };

  const handleCloseConversation = async () => {
    if (!selectedConversation?.id) return;
    
    try {
      await chatService.closeConversation(selectedConversation.id);
      setSelectedConversation(null);
    } catch (error) {
      console.error("Error closing conversation:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-400">Please login</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="h-16 bg-white border-b px-6 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <h1 className="font-semibold">Messages</h1>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {unreadCount} new
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-140px)]">
          {/* Conversations List */}
          <Card className="md:col-span-1 overflow-hidden">
            <CardHeader className="p-4 border-b">
              <h2 className="font-semibold">Conversations</h2>
            </CardHeader>
            <div className="overflow-y-auto h-full">
              {loading ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : conversations.length === 0 ? (
                <div className="text-center p-8 text-gray-400">
                  <MessageCircle className="h-12 w-12 mx-auto mb-2" />
                  <p>No conversations yet</p>
                </div>
              ) : (
                <div className="divide-y">
                  {conversations.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                        selectedConversation?.id === conv.id ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium text-sm">{conv.customerName}</span>
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conv.lastMessage || "No messages"}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                        <Clock className="h-3 w-3" />
                        {conv.lastMessageTime?.toDate ? 
                          format(conv.lastMessageTime.toDate(), 'MMM d, h:mm a') : ''
                        }
                        {conv.status === 'closed' && (
                          <Badge variant="secondary" className="text-xs">Closed</Badge>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* Chat Area */}
          <Card className="md:col-span-2 flex flex-col overflow-hidden">
            {selectedConversation ? (
              <>
                {/* Chat Header */}
                <CardHeader className="p-4 border-b flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      <h3 className="font-semibold">{selectedConversation.customerName}</h3>
                      {selectedConversation.status === 'active' && (
                        <Badge className="bg-green-100 text-green-700">Active</Badge>
                      )}
                    </div>
                    {selectedConversation.customerEmail && (
                      <p className="text-sm text-gray-500 mt-1">{selectedConversation.customerEmail}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!selectedConversation.staffAssigned && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleAssignToMe}
                      >
                        Assign to Me
                      </Button>
                    )}
                    {selectedConversation.status !== 'closed' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={handleCloseConversation}
                      >
                        <Archive className="h-4 w-4 mr-1" />
                        Close
                      </Button>
                    )}
                  </div>
                </CardHeader>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <p>No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg, index) => (
                        <div
                          key={msg.id || index}
                          className={`flex ${msg.senderType === 'staff' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-2xl ${
                              msg.senderType === 'staff'
                                ? 'bg-black text-white rounded-br-none'
                                : 'bg-white border rounded-bl-none'
                            }`}
                          >
                            <p className="text-sm">{msg.message}</p>
                            <div className="flex items-center gap-1 mt-1 text-xs opacity-70">
                              <span>
                                {msg.timestamp?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                              </span>
                              {msg.senderType === 'staff' && msg.read && (
                                <CheckCircle className="h-3 w-3" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Input */}
                {selectedConversation.status !== 'closed' && (
                  <div className="p-4 border-t bg-white">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        disabled={sending}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sending}
                      >
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4" />
                  <p>Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
