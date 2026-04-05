"use client";

import { useState, useEffect, useRef } from "react";
import { useShopConfig } from "@/context/ShopConfigContext";
import { chatService, ChatMessage, ChatConversation } from "@/lib/chat-service";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, X, MessageCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Generate unique customer ID for this session
const getCustomerId = () => {
  if (typeof window === 'undefined') return 'anonymous';
  let customerId = localStorage.getItem('chat-customer-id');
  if (!customerId) {
    customerId = `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('chat-customer-id', customerId);
  }
  return customerId;
};

export function ChatWidget() {
  const { config, loading } = useShopConfig();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [showNameInput, setShowNameInput] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const customerId = getCustomerId();

  // Load existing conversation on mount
  useEffect(() => {
    if (!config?.chat?.enabled) return;
    
    const loadConversation = async () => {
      try {
        const existing = await chatService.getConversationByCustomer(customerId);
        if (existing) {
          setConversationId(existing.id || null);
          setShowNameInput(false);
          const msgs = await chatService.getMessages(existing.id!);
          setMessages(msgs);
        }
      } catch (error) {
        console.error("Error loading conversation:", error);
      }
    };
    
    loadConversation();
  }, [config, customerId]);

  // Subscribe to new messages
  useEffect(() => {
    if (!conversationId) return;
    
    const unsubscribe = chatService.onMessagesChange(conversationId, (newMessages) => {
      setMessages(newMessages);
      
      // Play sound if new message from staff
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage?.senderType === 'staff' && config?.chat?.soundEnabled) {
        playNotificationSound();
      }
    });

    return () => unsubscribe();
  }, [conversationId, config]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const playNotificationSound = () => {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.5;
    audio.play().catch(() => {});
  };

  const handleStartChat = async () => {
    if (!customerName.trim()) {
      toast.error("Please enter your name");
      return;
    }
    
    setIsLoading(true);
    try {
      const newConversationId = await chatService.createConversation(
        customerId,
        customerName.trim()
      );
      setConversationId(newConversationId);
      setShowNameInput(false);
      
      // Send welcome message if enabled
      if (config?.chat?.autoReplyEnabled) {
        await chatService.sendMessage({
          conversationId: newConversationId,
          senderId: 'system',
          senderType: 'staff',
          senderName: 'Support Team',
          message: config.chat.welcomeMessage,
        });
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      toast.error("Failed to start chat");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversationId) return;
    
    setIsLoading(true);
    try {
      await chatService.sendMessage({
        conversationId,
        senderId: customerId,
        senderType: 'customer',
        senderName: customerName,
        message: newMessage.trim(),
      });
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading || !config?.chat?.enabled) return null;

  const { chat, brand } = config;
  const position = chat.widgetPosition === 'bottom-left' ? 'left-4' : 'right-4';

  return (
    <div className={`fixed bottom-4 ${position} z-50 flex flex-col items-end`}>
      {/* Chat Window */}
      {isOpen && !isMinimized && (
        <div 
          className="mb-4 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl overflow-hidden border"
          style={{ borderColor: chat.widgetColor }}
        >
          {/* Header */}
          <div 
            className="p-4 flex items-center justify-between"
            style={{ backgroundColor: chat.widgetColor }}
          >
            <div className="flex items-center gap-2">
              {chat.showAvatar && (
                <span className="text-2xl">{chat.avatarEmoji}</span>
              )}
              <div>
                <h3 className="font-semibold text-white">Chat with {brand.name}</h3>
                <p className="text-xs text-white/70">We typically reply quickly</p>
              </div>
            </div>
            <div className="flex gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsMinimized(true)}
              >
                <span className="text-lg">−</span>
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-white hover:bg-white/20"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <div className="h-80 overflow-y-auto p-4 bg-gray-50">
            {showNameInput ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-gray-600">Welcome! Please enter your name to start chatting:</p>
                <Input
                  placeholder="Your name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleStartChat()}
                />
                <Button 
                  onClick={handleStartChat}
                  disabled={isLoading}
                  style={{ backgroundColor: chat.widgetColor }}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Start Chat"}
                </Button>
              </div>
            ) : (
              <>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-400">{chat.welcomeMessage}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((msg, index) => (
                      <div
                        key={msg.id || index}
                        className={`flex ${msg.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                            msg.senderType === 'customer'
                              ? 'rounded-br-none'
                              : 'rounded-bl-none'
                          }`}
                          style={{
                            backgroundColor: msg.senderType === 'customer' ? chat.widgetColor : '#F3F4F6',
                            color: msg.senderType === 'customer' ? 'white' : '#374151',
                          }}
                        >
                          <p>{msg.message}</p>
                          <span className="text-xs opacity-60 mt-1 block">
                            {msg.timestamp?.toDate?.().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || ''}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </>
            )}
          </div>

          {/* Input */}
          {!showNameInput && (
            <div className="p-3 bg-white border-t">
              <div className="flex gap-2">
                <Input
                  placeholder={chat.placeholderText}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button 
                  size="icon"
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isLoading}
                  style={{ backgroundColor: chat.widgetColor }}
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Minimized Indicator */}
      {isOpen && isMinimized && (
        <Button
          onClick={() => setIsMinimized(false)}
          className="mb-4 rounded-full px-4 py-2 text-white"
          style={{ backgroundColor: chat.widgetColor }}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Continue chatting...
        </Button>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-full h-14 w-14 shadow-lg"
          style={{ backgroundColor: chat.widgetColor }}
        >
          {chat.showAvatar ? (
            <span className="text-2xl">{chat.avatarEmoji}</span>
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      )}
    </div>
  );
}
