
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserList from "@/components/UserList";
import MessageArea from "@/components/MessageArea";
import Sidebar from "@/components/Sidebar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import socketService from "@/services/socket";

const Dashboard = () => {
  const { user, logout, deleteAccount } = useAuth();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("messages");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showContacts, setShowContacts] = useState(true);

  useEffect(() => {
    if (user) {
      socketService.connect(user.id);
    }

    // Clean up socket connection
    return () => {
      socketService.disconnect();
    };
  }, [user]);

  // Update selectedUser status when user status changes
  useEffect(() => {
    const handleUserStatusChange = (data: any) => {
      if (selectedUser && data.userId === selectedUser.id) {
        setSelectedUser(prev => ({
          ...prev,
          status: data.status
        }));
      }
    };

    socketService.on("user_status_change", handleUserStatusChange);

    return () => {
      socketService.off("user_status_change", handleUserStatusChange);
    };
  }, [selectedUser]);


  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setShowContacts(false);
      } else {
        setShowContacts(true);
      }
    };

    // Set initial state
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount();
    } catch (error) {
      console.error("Failed to delete account:", error);
    }
  };

  const toggleContacts = () => {
    setShowContacts(prev => !prev);
  };

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b px-4 py-3 bg-white">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-medium">MessageSync</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600 hidden sm:inline">
              Welcome, {user.name}
            </span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      <div className="flex-1 flex">
        <Sidebar 
          user={user} 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onOpenSettings={() => setShowSettings(true)}
        />
        
        <main className="flex-1 p-4 bg-slate-50">
          <div className="container mx-auto">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="messages">Messages</TabsTrigger>
                <TabsTrigger value="profile">My Profile</TabsTrigger>
                <div className="md:hidden">
                  <Button 
                    variant="outline"
                    size="sm"
                    className="ml-2"
                    onClick={toggleContacts}
                  >
                    {showContacts ? "Hide" : "Show"} Contacts
                  </Button>
                </div>
              </TabsList>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="messages" className="mt-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-160px)]">
                    {showContacts && (
                      <Card className="md:col-span-1 overflow-hidden">
                        <CardHeader className="pb-2 flex flex-row justify-between items-center">
                          <div>
                            <CardTitle>Contacts</CardTitle>
                            <CardDescription>Connect with your friends</CardDescription>
                          </div>
                          <div className="md:hidden">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={toggleContacts}
                              className="h-8 w-8 p-0"
                            >
                              ×
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="p-0">
                          <UserList onSelectUser={(user) => {
                            setSelectedUser(user);
                            // On mobile, hide contacts after user selection
                            if (window.innerWidth < 768) {
                              setShowContacts(false);
                            }
                          }} selectedUser={selectedUser} />
                        </CardContent>
                      </Card>
                    )}
                    
                    <Card className={`${showContacts ? 'md:col-span-2' : 'col-span-full'} overflow-hidden flex flex-col`}>
                      <MessageArea selectedUser={selectedUser} currentUser={user} />
                    </Card>
                  </div>
                </TabsContent>
                
                <TabsContent value="profile" className="mt-0">
                  <Card>
                    <CardHeader>
                      <CardTitle>My Profile</CardTitle>
                      <CardDescription>View and manage your account information</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Name</h3>
                          <p>{user.name}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Email</h3>
                          <p>{user.email}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Phone</h3>
                          <p>{user.phone}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-slate-500">Role</h3>
                          <p className="capitalize">{user.role}</p>
                        </div>
                        
                        <div className="pt-4">
                          <h3 className="text-sm font-medium text-slate-500 mb-2">Account Actions</h3>
                          <div className="flex flex-col gap-2">
                            <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
                              <DialogTrigger asChild>
                                <Button variant="destructive">Delete Account</Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Delete Account</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete your account? This action cannot be undone
                                    and all your data will be permanently deleted.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                                    Cancel
                                  </Button>
                                  <Button variant="destructive" onClick={handleDeleteAccount}>
                                    Delete Account
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </motion.div>
            </Tabs>
          </div>
        </main>
      </div>

      {/* Settings Dialog */}
      
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Settings</DialogTitle>
            <DialogDescription>
              Adjust your application settings
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Appearance</h3>
                <div className="flex items-center justify-between">
                  <span>Dark Mode</span>
                  <Button variant="outline" size="sm">
                    Coming Soon
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Notifications</h3>
                <div className="flex items-center justify-between">
                  <span>Enable Notifications</span>
                  <Button variant="outline" size="sm">
                    Coming Soon
                  </Button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-slate-500 mb-2">Privacy</h3>
                <div className="flex items-center justify-between">
                  <span>Online Status</span>
                  <Button variant="outline" size="sm">
                    Visible
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
