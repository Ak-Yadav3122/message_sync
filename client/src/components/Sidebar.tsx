
import { Home, MessageSquare, Users, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

type SidebarProps = {
  user: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenSettings: () => void;
};

const Sidebar = ({ user, activeTab, setActiveTab, onOpenSettings }: SidebarProps) => {
  const navItems = [
    { label: "Messages", value: "messages", icon: MessageSquare },
    { label: "Profile", value: "profile", icon: User },
  ];

  const filteredNavItems = navItems.filter(item => {
    
    if (item.value === "users") {
      return ["teacher", "institute"].includes(user.role);
    }
    return true;
  });

  return (
    <div className="w-16 md:w-56 bg-white border-r flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-medium hidden md:block">MessageSync</h2>
        <h2 className="text-lg font-medium md:hidden text-center">MS</h2>
      </div>
      
      <nav className="flex-1 p-2">
        <ul className="space-y-1">
          {filteredNavItems.map((item) => (
            <li key={item.value}>
              <button
                className={cn(
                  "w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm transition-colors",
                  activeTab === item.value
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                )}
                onClick={() => setActiveTab(item.value)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span className="hidden md:inline">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t">
        <button
          className="w-full flex items-center space-x-2 px-3 py-2 rounded-md text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          onClick={onOpenSettings}
        >
          <Settings className="h-5 w-5 flex-shrink-0" />
          <span className="hidden md:inline">Setting</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
