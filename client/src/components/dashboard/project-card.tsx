import { useLocation } from "wouter";
import { Project } from "@shared/schema";
import { format } from "date-fns";
import { Calendar, Folder } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  project: Project;
  memberCount?: number;
  taskCount?: number;
  completedTaskCount?: number;
}

export default function ProjectCard({ 
  project, 
  memberCount = 0, 
  taskCount = 0, 
  completedTaskCount = 0 
}: ProjectCardProps) {
  const [, navigate] = useLocation();
  const progress = taskCount > 0 ? Math.round((completedTaskCount / taskCount) * 100) : 0;

  return (
    <Card className="bg-white dark:bg-[#161B22] hover:shadow-md transition-shadow border border-gray-200 dark:border-[#30363D]">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold truncate">{project.title}</h3>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Folder className="h-4 w-4 text-[#58A6FF]" />
          </div>
        </div>
        
        <p className="text-gray-500 dark:text-[#8B949E] text-sm mb-4 line-clamp-2">
          {project.description || "No description provided"}
        </p>
        
        <div className="flex flex-col space-y-3">
          {project.deadline && (
            <div className="flex items-center text-sm text-gray-500 dark:text-[#8B949E]">
              <Calendar className="h-4 w-4 mr-2" />
              <span>Due {format(new Date(project.deadline), "MMM d, yyyy")}</span>
            </div>
          )}
          
          <div className="flex items-center text-sm text-gray-500 dark:text-[#8B949E]">
            <span className="mr-2">Progress:</span>
            <div className="flex-1">
              <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-[#58A6FF] rounded-full" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
            <span className="ml-2">{progress}%</span>
          </div>
          
          <div className="text-sm">
            <span className="text-gray-500 dark:text-[#8B949E]">Tasks: </span>
            <span className="font-medium">{completedTaskCount} / {taskCount}</span>
          </div>
        </div>
      </CardContent>
      <CardFooter className="bg-gray-50 dark:bg-[#0D1117] p-4 border-t border-gray-200 dark:border-[#30363D]">
        <Button
          className="w-full bg-[#58A6FF] hover:bg-blue-600 text-white"
          onClick={() => navigate(`/workspace/${project.workspaceId}/project/${project.id}`)}
        >
          View Project
        </Button>
      </CardFooter>
    </Card>
  );
}
