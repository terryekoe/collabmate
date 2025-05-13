import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { User, Task } from '@shared/schema';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { MoreHorizontal } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';

interface TaskCardProps {
  task: Task & { assignee?: User };
  onEdit?: (task: Task) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  // Get priority class
  const getPriorityClass = (priority: string) => {
    switch(priority) {
      case 'high':
        return "bg-red-100 dark:bg-red-900 text-[#F85149]";
      case 'medium':
        return "bg-yellow-100 dark:bg-yellow-900 text-[#F0883E]";
      case 'low':
        return "bg-green-100 dark:bg-green-900 text-[#7EE787]";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
    }
  };
  
  // Get status class
  const getStatusClass = (status: string) => {
    switch(status) {
      case 'completed':
        return "bg-green-100 dark:bg-green-900 text-[#7EE787]";
      case 'in_progress':
        return "bg-blue-100 dark:bg-blue-900 text-[#58A6FF]";
      case 'review':
        return "bg-purple-100 dark:bg-purple-900 text-purple-500";
      default:
        return "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400";
    }
  };
  
  // Format status display text
  const formatStatus = (status: string) => {
    switch(status) {
      case 'todo':
        return 'To Do';
      case 'in_progress':
        return 'In Progress';
      case 'review':
        return 'Review';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };
  
  // Format priority display text
  const formatPriority = (priority: string) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1) + ' Priority';
  };
  
  // Format date
  const formatDate = (dateString: Date | undefined) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (updatedTask: Partial<Task>) => {
      const res = await apiRequest("PUT", `/api/tasks/${task.id}`, updatedTask);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${task.projectId}/tasks`] });
    }
  });
  
  // Handle edit task
  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
  };
  
  return (
    <div className="bg-white dark:bg-[#161B22] rounded-lg p-4 shadow">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
          task.status === 'completed' 
            ? getStatusClass(task.status)
            : getPriorityClass(task.priority)
        }`}>
          {task.status === 'completed' 
            ? 'Completed' 
            : formatPriority(task.priority)}
        </span>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 dark:text-[#8B949E] mr-2">{task.progress}%</span>
          <DropdownMenu>
            <DropdownMenuTrigger>
              <MoreHorizontal className="h-5 w-5 text-gray-400 dark:text-[#8B949E]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#30363D]">
              <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
                Edit
              </DropdownMenuItem>
              {task.status !== 'completed' && (
                <DropdownMenuItem 
                  onClick={() => updateTaskMutation.mutate({ status: 'completed', progress: 100 })}
                  className="cursor-pointer"
                >
                  Mark Complete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <h3 className="text-lg font-semibold mt-3">{task.title}</h3>
      <p className="text-gray-500 dark:text-[#8B949E] text-sm mt-1">
        {task.description?.length > 120 
          ? task.description.substring(0, 120) + '...' 
          : task.description}
      </p>
      <div className="mt-4">
        <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`absolute top-0 left-0 h-full ${
              task.status === 'completed' ? 'bg-[#7EE787]' : 'bg-[#58A6FF]'
            } rounded-full`} 
            style={{ width: `${task.progress}%` }}
          ></div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center">
          {task.assignee?.avatarUrl ? (
            <img 
              src={task.assignee.avatarUrl} 
              alt={task.assignee.name}
              className="h-6 w-6 rounded-full" 
            />
          ) : (
            <div className="h-6 w-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 uppercase text-xs font-bold">
              {task.assignee?.name?.charAt(0) || 'U'}
            </div>
          )}
          <span className="ml-2 text-sm">{task.assignee?.name || 'Unassigned'}</span>
        </div>
        <span className="text-xs text-gray-500 dark:text-[#8B949E]">
          {task.status === 'completed' 
            ? 'Completed ' + formatDate(task.createdAt)
            : 'Due ' + formatDate(task.deadline)}
        </span>
      </div>
    </div>
  );
}
