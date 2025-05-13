import { User, WorkspaceMember } from "@shared/schema";
import { Shield, Star, UserCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MemberCardProps {
  member: User;
  workspaceMember?: WorkspaceMember;
  workspaceId: number;
  currentUserRole?: string;
  metrics?: {
    tasksCompleted?: number;
    totalTasks?: number;
    avgRating?: number;
  };
}

export default function MemberCard({ 
  member, 
  workspaceMember,
  workspaceId,
  currentUserRole,
  metrics 
}: MemberCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const changeRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: number; role: string }) => {
      const res = await apiRequest("PUT", `/api/workspaces/${workspaceId}/members/${userId}`, {
        role
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/members`] });
      toast({
        title: "Role updated",
        description: `${member.name}'s role has been updated successfully`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update role",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/workspaces/${workspaceId}/members/${userId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${workspaceId}/members`] });
      toast({
        title: "Member removed",
        description: `${member.name} has been removed from the workspace`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove member",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const getRoleIcon = (role: string) => {
    switch(role) {
      case 'admin':
        return <Shield className="h-4 w-4 text-[#F85149]" />;
      case 'leader':
        return <Star className="h-4 w-4 text-[#F0883E]" />;
      default:
        return null;
    }
  };
  
  const canManageUsers = currentUserRole === 'admin' || 
    (currentUserRole === 'leader' && workspaceMember?.role === 'member');
  
  return (
    <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
      <CardContent className="p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            {member.avatarUrl ? (
              <img 
                src={member.avatarUrl} 
                alt={member.name} 
                className="h-12 w-12 rounded-full" 
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 uppercase font-bold text-xl">
                {member.name.charAt(0)}
              </div>
            )}
          </div>
          
          <div className="ml-4 flex-1">
            <div className="flex items-center">
              <h3 className="font-medium text-lg">{member.name}</h3>
              {workspaceMember && (
                <div className="ml-2 flex items-center">
                  {getRoleIcon(workspaceMember.role)}
                  <span className="ml-1 text-xs uppercase text-gray-500 dark:text-[#8B949E]">
                    {workspaceMember.role}
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-[#8B949E]">{member.email}</p>
          </div>
          
          {canManageUsers && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                  </svg>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#30363D]">
                {currentUserRole === 'admin' && workspaceMember?.role !== 'admin' && (
                  <DropdownMenuItem 
                    onClick={() => changeRoleMutation.mutate({ userId: member.id, role: 'admin' })}
                    className="cursor-pointer"
                  >
                    Make Admin
                  </DropdownMenuItem>
                )}
                
                {(currentUserRole === 'admin' || currentUserRole === 'leader') && 
                  workspaceMember?.role !== 'leader' && workspaceMember?.role !== 'admin' && (
                  <DropdownMenuItem 
                    onClick={() => changeRoleMutation.mutate({ userId: member.id, role: 'leader' })}
                    className="cursor-pointer"
                  >
                    Make Leader
                  </DropdownMenuItem>
                )}
                
                {currentUserRole === 'admin' && workspaceMember?.role !== 'member' && (
                  <DropdownMenuItem 
                    onClick={() => changeRoleMutation.mutate({ userId: member.id, role: 'member' })}
                    className="cursor-pointer"
                  >
                    Make Member
                  </DropdownMenuItem>
                )}
                
                {currentUserRole === 'admin' && (
                  <DropdownMenuItem 
                    onClick={() => removeMemberMutation.mutate(member.id)}
                    className="cursor-pointer text-[#F85149]"
                  >
                    Remove
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {metrics && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#30363D] grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-semibold">
                {metrics.tasksCompleted || 0} / {metrics.totalTasks || 0}
              </div>
              <div className="text-xs text-gray-500 dark:text-[#8B949E]">Tasks</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {metrics.totalTasks 
                  ? Math.round(((metrics.tasksCompleted || 0) / metrics.totalTasks) * 100) 
                  : 0}%
              </div>
              <div className="text-xs text-gray-500 dark:text-[#8B949E]">Completion</div>
            </div>
            <div>
              <div className="text-lg font-semibold">
                {metrics.avgRating ? metrics.avgRating.toFixed(1) : '-'}
              </div>
              <div className="text-xs text-gray-500 dark:text-[#8B949E]">Rating</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
