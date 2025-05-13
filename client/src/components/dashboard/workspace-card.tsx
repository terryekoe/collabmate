import { useLocation } from "wouter";
import { Workspace } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, Users } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface WorkspaceCardProps {
  workspace: Workspace;
  memberCount?: number;
}

export default function WorkspaceCard({ workspace, memberCount = 0 }: WorkspaceCardProps) {
  const [, navigate] = useLocation();

  const handleCardClick = () => {
    navigate(`/workspace/${workspace.id}`);
  };

  return (
    <Card className="bg-white dark:bg-[#161B22] hover:shadow-md transition-shadow cursor-pointer border border-gray-200 dark:border-[#30363D]">
      <CardContent className="p-6" onClick={handleCardClick}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xl font-mono font-semibold truncate">{workspace.name}</h3>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900 text-[#58A6FF]">
            {workspace.category || "Project"}
          </span>
        </div>
        
        <p className="text-gray-500 dark:text-[#8B949E] text-sm mb-4 line-clamp-2">
          {workspace.description || "No description provided"}
        </p>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-[#8B949E]">
          {workspace.deadline && (
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              <span>
                {format(new Date(workspace.deadline), "MMM d, yyyy")}
              </span>
            </div>
          )}
          
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{memberCount} members</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-[#0D1117] p-4 border-t border-gray-200 dark:border-[#30363D]">
        <Button
          className="w-full bg-[#58A6FF] hover:bg-blue-600 text-white"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/workspace/${workspace.id}`);
          }}
        >
          Open Workspace
        </Button>
      </CardFooter>
    </Card>
  );
}
