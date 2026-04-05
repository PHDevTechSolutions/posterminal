import { db } from "./firebase";
import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  updateDoc,
  onSnapshot,
  Timestamp,
  serverTimestamp 
} from "firebase/firestore";
import { toast } from "sonner";

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderType: 'customer' | 'staff';
  senderName: string;
  message: string;
  timestamp: Timestamp;
  read: boolean;
  attachments?: string[];
}

export interface ChatConversation {
  id?: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: number;
  status: 'active' | 'closed' | 'pending';
  createdAt: Timestamp;
  staffAssigned?: string;
  staffName?: string;
}

export interface NewMessage {
  conversationId: string;
  senderId: string;
  senderType: 'customer' | 'staff';
  senderName: string;
  message: string;
  attachments?: string[];
}

class ChatService {
  private conversationsListener: (() => void) | null = null;
  private messagesListener: (() => void) | null = null;

  // Create a new conversation
  async createConversation(customerId: string, customerName: string, customerEmail?: string, customerPhone?: string): Promise<string> {
    try {
      const conversation: any = {
        customerId,
        customerName,
        lastMessage: '',
        lastMessageTime: Timestamp.now(),
        unreadCount: 0,
        status: 'pending',
        createdAt: Timestamp.now(),
      };

      // Only add optional fields if they have values (Firestore doesn't accept undefined)
      if (customerEmail) conversation.customerEmail = customerEmail;
      if (customerPhone) conversation.customerPhone = customerPhone;

      const docRef = await addDoc(collection(db, "conversations"), conversation);
      return docRef.id;
    } catch (error) {
      console.error("Error creating conversation:", error);
      throw error;
    }
  }

  // Send a message
  async sendMessage(data: NewMessage): Promise<void> {
    try {
      const message: Omit<ChatMessage, 'id'> = {
        conversationId: data.conversationId,
        senderId: data.senderId,
        senderType: data.senderType,
        senderName: data.senderName,
        message: data.message,
        timestamp: Timestamp.now(),
        read: false,
        attachments: data.attachments || [],
      };

      await addDoc(collection(db, "messages"), message);

      // Update conversation with last message
      const conversationRef = doc(db, "conversations", data.conversationId);
      await updateDoc(conversationRef, {
        lastMessage: data.message,
        lastMessageTime: Timestamp.now(),
        unreadCount: data.senderType === 'customer' ? 1 : 0,
        status: 'active',
      });

      if (data.senderType === 'customer') {
        toast.success("Message sent!");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      throw error;
    }
  }

  // Get all conversations (for staff)
  async getConversations(): Promise<ChatConversation[]> {
    try {
      const q = query(
        collection(db, "conversations"),
        orderBy("lastMessageTime", "desc")
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ChatConversation));
    } catch (error) {
      console.error("Error getting conversations:", error);
      throw error;
    }
  }

  // Get conversation by customer ID
  async getConversationByCustomer(customerId: string): Promise<ChatConversation | null> {
    try {
      const q = query(
        collection(db, "conversations"),
        where("customerId", "==", customerId)
      );
      
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      
      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() } as ChatConversation;
    } catch (error) {
      console.error("Error getting conversation:", error);
      throw error;
    }
  }

  // Get messages for a conversation
  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    try {
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId)
      );
      
      const snapshot = await getDocs(q);
      const messages = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ChatMessage));
      
      // Sort client-side to avoid needing composite index
      return messages.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeA - timeB;
      });
    } catch (error) {
      console.error("Error getting messages:", error);
      throw error;
    }
  }

  // Mark messages as read
  async markAsRead(conversationId: string): Promise<void> {
    try {
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        unreadCount: 0,
      });

      // Also mark all messages as read
      const q = query(
        collection(db, "messages"),
        where("conversationId", "==", conversationId),
        where("read", "==", false)
      );

      const snapshot = await getDocs(q);
      const updates = snapshot.docs.map(doc => 
        updateDoc(doc.ref, { read: true })
      );
      await Promise.all(updates);
    } catch (error) {
      console.error("Error marking as read:", error);
      throw error;
    }
  }

  // Assign staff to conversation
  async assignStaff(conversationId: string, staffId: string, staffName: string): Promise<void> {
    try {
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        staffAssigned: staffId,
        staffName,
        status: 'active',
      });
    } catch (error) {
      console.error("Error assigning staff:", error);
      throw error;
    }
  }

  // Close conversation
  async closeConversation(conversationId: string): Promise<void> {
    try {
      const conversationRef = doc(db, "conversations", conversationId);
      await updateDoc(conversationRef, {
        status: 'closed',
      });
      toast.success("Conversation closed");
    } catch (error) {
      console.error("Error closing conversation:", error);
      throw error;
    }
  }

  // Listen to all conversations (real-time for staff)
  onConversationsChange(callback: (conversations: ChatConversation[]) => void): () => void {
    const q = query(
      collection(db, "conversations"),
      orderBy("lastMessageTime", "desc")
    );

    this.conversationsListener = onSnapshot(q, (snapshot) => {
      const conversations = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ChatConversation));
      callback(conversations);
    });

    return () => this.conversationsListener?.();
  }

  // Listen to messages in a conversation (real-time)
  onMessagesChange(conversationId: string, callback: (messages: ChatMessage[]) => void): () => void {
    const q = query(
      collection(db, "messages"),
      where("conversationId", "==", conversationId)
    );

    this.messagesListener = onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ChatMessage));
      
      // Sort client-side to avoid needing composite index
      const sortedMessages = messages.sort((a, b) => {
        const timeA = a.timestamp?.toMillis?.() || 0;
        const timeB = b.timestamp?.toMillis?.() || 0;
        return timeA - timeB;
      });
      
      callback(sortedMessages);
    });

    return () => this.messagesListener?.();
  }

  // Get unread count for staff
  async getUnreadCount(): Promise<number> {
    try {
      const q = query(
        collection(db, "conversations"),
        where("unreadCount", ">", 0)
      );
      
      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error("Error getting unread count:", error);
      return 0;
    }
  }
}

export const chatService = new ChatService();
