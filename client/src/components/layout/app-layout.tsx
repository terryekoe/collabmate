import { ReactNode } from "react";
import Sidebar from "./sidebar";
import Header from "./header";

interface AppLayoutProps {
  children: ReactNode;
  workspaceId?: string;
  title?: string;
}

export default function AppLayout({ children, workspaceId, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0D1117]">
      <Sidebar />
      
      <div className="md:ml-64 p-4 md:p-8">
        <Header workspaceId={workspaceId} />
        
        {children}
      </div>
    </div>
  );
}
