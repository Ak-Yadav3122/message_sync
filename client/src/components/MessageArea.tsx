
import { useState, useRef, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { messageAPI } from "@/services/api";
import { toast } from "sonner";
import socketService from "@/services/socket";
import { useAuth } from "@/contexts/AuthContext";

type MessageAreaProps = {
  selectedUser: any;
  currentUser: any;
};

const MessageArea = ({ selectedUser, currentUser }: MessageAreaProps) => {
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);
  const { user: authUser } = useAuth();

  // Get conversation
  const {
    data: conversationData,
    isLoading,
    refetch: refetchConversation
  } = useQuery({
    queryKey: ["conversation", selectedUser?.id],
    queryFn: () => messageAPI.getConversation(selectedUser.id),
    enabled: !!selectedUser,
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: ({ receiverId, content }: { receiverId: number; content: string }) => 
      messageAPI.sendMessage(receiverId, content),
    onSuccess: () => {
      setNewMessage("");
      refetchConversation();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send message");
    },
  });

  useEffect(() => {
    // Scroll to the bottom whenever messages change
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversationData]);

  useEffect(() => {
    // Listen for new messages
    const handleNewMessage = (message: any) => {
      if (selectedUser && message.sender_id === selectedUser.id) {
        refetchConversation();
      } else {
        toast(`New message from ${message.sender_name}`);
      }
    };

    socketService.on("new_message", handleNewMessage);

    return () => {
      socketService.off("new_message", handleNewMessage);
    };
  }, [selectedUser, refetchConversation]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;
    
    sendMessageMutation.mutate({
      receiverId: selectedUser.id,
      content: newMessage.trim()
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  const messages = conversationData?.data?.messages || [];

  if (!selectedUser) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-500 p-4">
        <div className="text-center">
          <p>Select a user to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-row items-center gap-3 p-4 border-b">
        <Avatar>
          <AvatarImage src={selectedUser.avatar} />
          <AvatarFallback>{getInitials(selectedUser.name)}</AvatarFallback>
        </Avatar>
        
        <div>
          <h3 className="font-medium">{selectedUser.name}</h3>
          <p className="text-sm text-slate-500 flex items-center gap-1">
            <span 
              className={`inline-block w-2 h-2 rounded-full ${
                selectedUser.status === "online" ? "bg-green-500" : "bg-slate-300"
              }`} 
            />
            {selectedUser.status === "online" ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="text-center p-4">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center p-4 text-muted-foreground">
              No messages yet. Send a message to start the conversation.
            </div>
          ) : (
            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {messages.map((message: any) => {
                  const isCurrentUser = message.sender_id === authUser?.id;
                  
                  return (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`max-w-[75%] ${isCurrentUser ? "order-1" : "order-none"}`}>
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-slate-100 text-slate-900"
                          }`}
                        >
                          <p>{message.content}</p>
                        </div>
                        <div
                          className={`text-xs mt-1 text-slate-500 ${
                            isCurrentUser ? "text-right" : "text-left"
                          }`}
                        >
                          {formatTime(message.created_at)}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messageEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
            />
            <Button 
              size="icon" 
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() || sendMessageMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default MessageArea;
