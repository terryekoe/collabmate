import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { User, Workspace } from "@shared/schema";
import { SunMoon, Home, Folder, CheckSquare, MessageSquare, Users, BarChart2, Settings, Menu } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMediaQuery } from "@/hooks/use-mobile";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isOpen, setIsOpen] = useState(!isMobile);
  
  // Get workspaces
  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });
  
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  
  // Handle workspace change
  const handleWorkspaceChange = (value: string) => {
    setSelectedWorkspace(value);
    setLocation(`/workspace/${value}`);
  };
  
  // Toggle dark mode
  const [isDarkMode, setIsDarkMode] = useState(true);
  
  useEffect(() => {
    // Set dark mode by default
    document.documentElement.classList.add('dark');
  }, []);
  
  const toggleDarkMode = () => {
    if (isDarkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
    setIsDarkMode(!isDarkMode);
  };
  
  // Toggle sidebar on mobile
  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };
  
  // Close sidebar when switching pages on mobile
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false);
    }
  }, [location, isMobile]);
  
  // Update sidebar state when screen size changes
  useEffect(() => {
    setIsOpen(!isMobile);
  }, [isMobile]);

  return (
    <>
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 z-50 p-4 md:hidden">
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
        </Button>
      </div>
      
      {/* Sidebar */}
      <div 
        className={`fixed top-0 left-0 h-full w-64 bg-gray-100 dark:bg-[#161B22] border-r border-gray-200 dark:border-[#30363D] transition-transform duration-200 ease-in-out z-40 ${
          isOpen ? 'transform-none' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-[#30363D] flex items-center justify-between">
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#58A6FF]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
            </svg>
            <h1 className="ml-2 text-xl font-semibold font-mono">CollabMate</h1>
          </div>
          <button onClick={toggleDarkMode} className="p-2 rounded-md">
            <SunMoon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        <div className="py-4">
          <div className="px-4 mb-4">
            <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
              <SelectTrigger className="w-full py-2 px-3 bg-gray-200 dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                <SelectValue placeholder="Select Workspace" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-[#0D1117] border-gray-200 dark:border-[#30363D]">
                {workspaces?.map((workspace) => (
                  <SelectItem key={workspace.id} value={workspace.id.toString()}>
                    {workspace.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User profile */}
          {user && (
            <div className="px-4 mb-4 py-2 border-b border-gray-200 dark:border-[#30363D]">
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 uppercase font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="ml-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-500 dark:text-[#8B949E] capitalize">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          <nav>
            <NavLink href="/" icon={<Home className="h-5 w-5 mr-2" />} title="Dashboard" currentPath={location} />
            <NavLink href="/projects" icon={<Folder className="h-5 w-5 mr-2" />} title="Projects" currentPath={location} />
            <NavLink href="/tasks" icon={<CheckSquare className="h-5 w-5 mr-2" />} title="Tasks" currentPath={location} />
            <NavLink href="/feedback" icon={<MessageSquare className="h-5 w-5 mr-2" />} title="Feedback" currentPath={location} />
            <NavLink href="/team" icon={<Users className="h-5 w-5 mr-2" />} title="Team" currentPath={location} />
            <NavLink href="/reports" icon={<BarChart2 className="h-5 w-5 mr-2" />} title="Reports" currentPath={location} />
            <NavLink href="/settings" icon={<Settings className="h-5 w-5 mr-2" />} title="Settings" currentPath={location} />
            
            <div className="px-4 pt-6">
              <Button 
                variant="outline" 
                className="w-full justify-start text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Logging out..." : "Logout"}
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  title: string;
  currentPath: string;
}

function NavLink({ href, icon, title, currentPath }: NavLinkProps) {
  const isActive = currentPath === href || 
    (href !== "/" && currentPath.startsWith(href));
  
  return (
    <Link href={href}>
      <a className={`flex items-center py-2 px-4 ${
        isActive 
          ? "text-[#58A6FF] border-l-2 border-[#58A6FF]" 
          : "hover:bg-gray-200 dark:hover:bg-gray-800 transition"
      }`}>
        {icon}
        {title}
      </a>
    </Link>
  );
}
