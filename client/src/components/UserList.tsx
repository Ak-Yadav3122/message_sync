
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, UserPlus, Check, X, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { userAPI, friendAPI } from "@/services/api";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";

type UserListProps = {
  onSelectUser: (user: any) => void;
  selectedUser: any;
};

const UserList = ({ onSelectUser, selectedUser }: UserListProps) => {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchMode, setSearchMode] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");
  const queryClient = useQueryClient();

  // Get friends
  const {
    data: friendsData,
    isLoading: isLoadingFriends,
    refetch: refetchFriends
  } = useQuery({
    queryKey: ["friends"],
    queryFn: () => friendAPI.getFriends(),
  });

  // Get friend requests
  const {
    data: requestsData,
    isLoading: isLoadingRequests,
    refetch: refetchRequests
  } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: () => friendAPI.getFriendRequests(),
  });

  // Search users
  const {
    data: searchData,
    isLoading: isLoadingSearch,
    refetch: refetchSearch
  } = useQuery({
    queryKey: ["searchUsers", searchTerm],
    queryFn: () => userAPI.searchUsers(searchTerm),
    enabled: searchMode && searchTerm.length > 2,
  });

  // Send friend request
  const sendFriendRequestMutation = useMutation({
    mutationFn: (receiverId: number) => friendAPI.sendFriendRequest(receiverId),
    onSuccess: () => {
      toast.success("Friend request sent successfully");
      refetchRequests();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send friend request");
    },
  });

  // Respond to friend request
  const respondToRequestMutation = useMutation({
    mutationFn: ({ requestId, status }: { requestId: number; status: 'accepted' | 'rejected' }) => 
      friendAPI.respondToFriendRequest(requestId, status),
    onSuccess: (_, variables) => {
      toast.success(`Friend request ${variables.status}`);
      refetchRequests();
      refetchFriends();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to respond to friend request");
    },
  });

  const handleSearch = () => {
    if (searchTerm.length > 2) {
      setSearchMode(true);
      setActiveTab("search");
      refetchSearch();
    } else {
      toast.error("Please enter at least 3 characters to search");
    }
  };

  const handleSendFriendRequest = (userId: number) => {
    sendFriendRequestMutation.mutate(userId);
  };

  const handleRespondToRequest = (requestId: number, status: 'accepted' | 'rejected') => {
    respondToRequestMutation.mutate({ requestId, status });
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  const formatLastSeen = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 60000); 
    
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
  };

  // Organize data
  const friends = friendsData?.data?.friends || [];
  const receivedRequests = requestsData?.data?.receivedRequests || [];
  const sentRequests = requestsData?.data?.sentRequests || [];
  const searchResults = searchData?.data?.users || [];

  // Check if user has a pending request
  const hasPendingRequest = (userId: number) => {
    return sentRequests.some((request: any) => request.receiver_id === userId);
  };

  // Check if user is already a friend
  const isFriend = (userId: number) => {
    return friends.some((friend: any) => friend.id === userId);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b">
        <div className="relative flex">
          <Input
            placeholder="Search users..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-400" />
          <Button size="sm" className="ml-2" onClick={handleSearch}>
            Search
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="contacts">Contacts</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
        </TabsList>
        
        <TabsContent value="contacts" className="flex-1 p-0 m-0">
          <ScrollArea className="flex-1 h-[calc(100%-48px)]">
            <div className="divide-y">
              {isLoadingFriends ? (
                <div className="p-4 text-center">Loading contacts...</div>
              ) : friends.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No contacts yet. Search for users to add them.
                </div>
              ) : (
                friends.map((user: any) => (
                  <div
                    key={user.id}
                    className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors ${
                      selectedUser?.id === user.id ? "bg-slate-100" : ""
                    }`}
                    onClick={() => onSelectUser(user)}
                  >
                    <div className="relative">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                      </Avatar>
                      <span 
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                          user.status === "online" ? "bg-green-500" : "bg-slate-300"
                        }`}
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-medium truncate">{user.name}</p>
                        <span className="text-xs text-slate-500 whitespace-nowrap ml-2">
                          {user.status === "online" ? "online" : formatLastSeen(user.last_seen)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize text-xs">
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="requests" className="flex-1 p-0 m-0">
          <ScrollArea className="flex-1 h-[calc(100%-48px)]">
            {receivedRequests.length > 0 && (
              <div className="p-2 bg-slate-50">
                <h3 className="text-sm font-medium text-slate-500 px-2 py-1">Received Requests</h3>
                <div className="divide-y">
                  {receivedRequests.map((request: any) => (
                    <div key={request.id} className="p-3 flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(request.name)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{request.name}</p>
                        <Badge variant="outline" className="capitalize text-xs">
                          {request.role}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-green-600"
                          onClick={() => handleRespondToRequest(request.id, 'accepted')}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-red-600"
                          onClick={() => handleRespondToRequest(request.id, 'rejected')}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {sentRequests.length > 0 && (
              <div className="p-2 bg-slate-50 mt-2">
                <h3 className="text-sm font-medium text-slate-500 px-2 py-1">Sent Requests</h3>
                <div className="divide-y">
                  {sentRequests.map((request: any) => (
                    <div key={request.id} className="p-3 flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>{getInitials(request.name)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{request.name}</p>
                        <Badge variant="outline" className="capitalize text-xs">
                          {request.role}
                        </Badge>
                      </div>
                      
                      <Badge>Pending</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {!isLoadingRequests && receivedRequests.length === 0 && sentRequests.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                No pending friend requests.
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="search" className="flex-1 p-0 m-0">
          <ScrollArea className="flex-1 h-[calc(100%-48px)]">
            <div className="divide-y">
              {isLoadingSearch ? (
                <div className="p-4 text-center">Searching...</div>
              ) : searchMode && searchResults.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No users found with "{searchTerm}"
                </div>
              ) : searchMode ? (
                searchResults.map((user: any) => (
                  <div key={user.id} className="p-3 flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{user.name}</p>
                      <Badge variant="outline" className="capitalize text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    
                    {isFriend(user.id) ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onSelectUser(user)}
                      >
                        <MessageSquare className="mr-1 h-4 w-4" /> Message
                      </Button>
                    ) : hasPendingRequest(user.id) ? (
                      <Badge>Pending</Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => handleSendFriendRequest(user.id)}
                      >
                        <UserPlus className="mr-1 h-4 w-4" /> Add
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  Search for users to connect with.
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserList;
