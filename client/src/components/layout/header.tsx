import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Workspace } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { PlusIcon, Download } from "lucide-react";
import TaskModal from "@/components/tasks/task-modal";

interface HeaderProps {
  workspaceId?: string;
}

export default function Header({ workspaceId }: HeaderProps) {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  
  // Get workspace details
  const { data: workspace } = useQuery<Workspace>({
    queryKey: [`/api/workspaces/${workspaceId}`],
    enabled: !!workspaceId,
  });
  
  // Open task modal
  const openTaskModal = () => {
    setIsTaskModalOpen(true);
  };
  
  // Close task modal
  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-mono">
            {workspace ? workspace.name : 'Dashboard'}
          </h1>
          {workspace && (
            <div className="flex items-center mt-1 text-gray-500 dark:text-[#8B949E] text-sm">
              <span>{workspace.category || 'Project'}</span>
              {workspace.deadline && (
                <>
                  <span className="mx-2">•</span>
                  <span>
                    Deadline: {new Date(workspace.deadline).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="mt-4 md:mt-0 flex">
          <Button 
            className="flex items-center bg-[#58A6FF] hover:bg-blue-600 text-white mr-2"
            onClick={openTaskModal}
          >
            <PlusIcon className="h-5 w-5 mr-1" />
            New Task
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center text-gray-700 dark:text-[#C9D1D9] bg-gray-200 dark:bg-[#161B22] hover:bg-gray-300 dark:hover:bg-gray-700"
          >
            <Download className="h-5 w-5 mr-1" />
            Export Report
          </Button>
        </div>
      </div>
      
      {isTaskModalOpen && <TaskModal isOpen={isTaskModalOpen} onClose={closeTaskModal} />}
    </div>
  );
}
