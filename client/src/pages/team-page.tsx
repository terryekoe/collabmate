import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { User, Workspace, WorkspaceMember } from "@shared/schema";

import AppLayout from "@/components/layout/app-layout";
import MemberCard from "@/components/team/member-card";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";

// Add member form schema
const addMemberFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["member", "leader", "admin"]),
});

type AddMemberFormValues = z.infer<typeof addMemberFormSchema>;

export default function TeamPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  
  // Get workspaces
  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });
  
  // Get workspace members
  const { data: workspaceData } = useQuery<{
    members: (User & { workspaceMember: WorkspaceMember })[];
    currentUserRole: string;
  }>({
    queryKey: [`/api/workspaces/${selectedWorkspace}/members`],
    enabled: !!selectedWorkspace,
  });
  
  // Add member form
  const addMemberForm = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberFormSchema),
    defaultValues: {
      email: "",
      role: "member",
    },
  });
  
  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async (data: AddMemberFormValues) => {
      const res = await apiRequest("POST", `/api/workspaces/${selectedWorkspace}/members/invite`, {
        email: data.email,
        role: data.role
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${selectedWorkspace}/members`] });
      toast({
        title: "Member added",
        description: "The member has been added to the workspace",
      });
      setIsAddMemberModalOpen(false);
      addMemberForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add member",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle workspace change
  const handleWorkspaceChange = (value: string) => {
    setSelectedWorkspace(value);
  };
  
  // Handle add member form submit
  const onSubmitAddMember = (data: AddMemberFormValues) => {
    addMemberMutation.mutate(data);
  };
  
  // Open add member modal
  const openAddMemberModal = () => {
    setIsAddMemberModalOpen(true);
  };
  
  const members = workspaceData?.members || [];
  const currentUserRole = workspaceData?.currentUserRole || 'member';
  const canManageTeam = currentUserRole === 'admin' || currentUserRole === 'leader';
  
  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-mono">Team Members</h1>
        
        <div className="flex flex-col md:flex-row gap-2">
          <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
            <SelectTrigger className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D] w-full md:w-64">
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
          
          {canManageTeam && selectedWorkspace && (
            <Button 
              className="bg-[#58A6FF] hover:bg-blue-600 text-white"
              onClick={openAddMemberModal}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Member
            </Button>
          )}
        </div>
      </div>
      
      {!selectedWorkspace ? (
        <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Select a Workspace</h3>
            <p className="text-gray-500 dark:text-[#8B949E]">
              Choose a workspace to view and manage team members
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {members.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {members.map(member => (
                <MemberCard 
                  key={member.id}
                  member={member}
                  workspaceMember={member.workspaceMember}
                  workspaceId={parseInt(selectedWorkspace)}
                  currentUserRole={currentUserRole}
                  metrics={{
                    tasksCompleted: 8, // Replace with actual data when available
                    totalTasks: 12,   // Replace with actual data when available
                    avgRating: 4.2    // Replace with actual data when available
                  }}
                />
              ))}
            </div>
          ) : (
            <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No Team Members</h3>
                <p className="text-gray-500 dark:text-[#8B949E] mb-4">
                  This workspace doesn't have any team members yet
                </p>
                {canManageTeam && (
                  <Button 
                    className="bg-[#58A6FF] hover:bg-blue-600 text-white"
                    onClick={openAddMemberModal}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add First Member
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
      
      {/* Add Member Modal */}
      <Dialog open={isAddMemberModalOpen} onOpenChange={setIsAddMemberModalOpen}>
        <DialogContent className="bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#30363D]">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a new member to join your workspace
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addMemberForm}>
            <form onSubmit={addMemberForm.handleSubmit(onSubmitAddMember)} className="space-y-4">
              <FormField
                control={addMemberForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter email address"
                        className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addMemberForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="leader">Leader</SelectItem>
                        {currentUserRole === 'admin' && (
                          <SelectItem value="admin">Admin</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit"
                  className="bg-[#58A6FF] hover:bg-blue-600 text-white"
                  disabled={addMemberMutation.isPending}
                >
                  {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
