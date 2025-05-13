import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Project, Task, User, Workspace, Activity } from "@shared/schema";
import { Plus } from "lucide-react";

import AppLayout from "@/components/layout/app-layout";
import TaskCard from "@/components/dashboard/task-card";
import ActivityItem from "@/components/dashboard/activity-item";
import ProjectCard from "@/components/dashboard/project-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TaskModal from "@/components/tasks/task-modal";

// Project form schema
const projectFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  deadline: z.string().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function WorkspacePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("projects");
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  // Get workspace details
  const { data: workspace } = useQuery<Workspace>({
    queryKey: [`/api/workspaces/${id}`],
    enabled: !!id,
  });
  
  // Get workspace projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: [`/api/workspaces/${id}/projects`],
    enabled: !!id,
  });
  
  // Get workspace tasks
  const { data: tasks } = useQuery<(Task & { assignee: User })[]>({
    queryKey: [`/api/workspaces/${id}/tasks`],
    enabled: !!id,
  });
  
  // Get workspace activities
  const { data: activities } = useQuery<(Activity & { user: User })[]>({
    queryKey: [`/api/workspaces/${id}/activities`],
    enabled: !!id,
  });
  
  // Get workspace members
  const { data: members } = useQuery<(User & { role: string })[]>({
    queryKey: [`/api/workspaces/${id}/members`],
    enabled: !!id,
  });
  
  // Get user's workspace role
  const userRole = members?.find(member => member.id === user?.id)?.role || 'member';
  
  // Project form
  const projectForm = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      deadline: "",
    },
  });
  
  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const formattedData = {
        ...data,
        workspaceId: parseInt(id),
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      };
      
      const res = await apiRequest("POST", `/api/workspaces/${id}/projects`, formattedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/workspaces/${id}/projects`] });
      toast({
        title: "Project created",
        description: "Project was created successfully",
      });
      setIsProjectModalOpen(false);
      projectForm.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle project form submit
  const onSubmitProject = (data: ProjectFormValues) => {
    createProjectMutation.mutate(data);
  };
  
  // Handle task edit
  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };
  
  // Close task modal
  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(undefined);
  };
  
  // Open project modal
  const openProjectModal = () => {
    setIsProjectModalOpen(true);
  };
  
  // Open task modal
  const openTaskModal = () => {
    setIsTaskModalOpen(true);
  };
  
  // Filter tasks by status
  const todoTasks = tasks?.filter(task => task.status === 'todo') || [];
  const inProgressTasks = tasks?.filter(task => task.status === 'in_progress') || [];
  const reviewTasks = tasks?.filter(task => task.status === 'review') || [];
  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];
  
  // Count tasks by project
  const getProjectTaskCounts = (projectId: number) => {
    const projectTasks = tasks?.filter(task => task.projectId === projectId) || [];
    const completedCount = projectTasks.filter(task => task.status === 'completed').length;
    return {
      total: projectTasks.length,
      completed: completedCount
    };
  };
  
  return (
    <AppLayout workspaceId={id}>
      <Tabs defaultValue="projects" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-gray-200 dark:bg-[#161B22] rounded-lg p-1">
            <TabsTrigger value="projects" className="px-4 py-2">Projects</TabsTrigger>
            <TabsTrigger value="tasks" className="px-4 py-2">Tasks</TabsTrigger>
            <TabsTrigger value="activity" className="px-4 py-2">Activity</TabsTrigger>
          </TabsList>
          
          {(userRole === 'admin' || userRole === 'leader') && (
            <div>
              {activeTab === 'projects' && (
                <Button onClick={openProjectModal} className="bg-[#58A6FF] hover:bg-blue-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Project
                </Button>
              )}
              {activeTab === 'tasks' && (
                <Button onClick={openTaskModal} className="bg-[#58A6FF] hover:bg-blue-600 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              )}
            </div>
          )}
        </div>
        
        <TabsContent value="projects" className="pt-4">
          {projects && projects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map(project => {
                const taskCounts = getProjectTaskCounts(project.id);
                return (
                  <ProjectCard 
                    key={project.id} 
                    project={project}
                    taskCount={taskCounts.total}
                    completedTaskCount={taskCounts.completed}
                    memberCount={5} // Replace with actual count when available
                  />
                );
              })}
            </div>
          ) : (
            <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                <p className="text-gray-500 dark:text-[#8B949E] mb-4">
                  {(userRole === 'admin' || userRole === 'leader') 
                    ? "Create your first project to start collaborating with your team"
                    : "There are no projects in this workspace yet"}
                </p>
                {(userRole === 'admin' || userRole === 'leader') && (
                  <Button onClick={openProjectModal} className="bg-[#58A6FF] hover:bg-blue-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Project
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="tasks" className="space-y-6 pt-4">
          {tasks && tasks.length > 0 ? (
            <>
              {todoTasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">To Do</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {todoTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onEdit={handleTaskEdit}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {inProgressTasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">In Progress</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inProgressTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onEdit={handleTaskEdit}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {reviewTasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Review</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reviewTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onEdit={handleTaskEdit}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              {completedTasks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3">Completed</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {completedTasks.map(task => (
                      <TaskCard 
                        key={task.id} 
                        task={task} 
                        onEdit={handleTaskEdit}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold mb-2">No Tasks Yet</h3>
                <p className="text-gray-500 dark:text-[#8B949E] mb-4">
                  {(userRole === 'admin' || userRole === 'leader') 
                    ? "Create your first task to start tracking progress"
                    : "There are no tasks assigned in this workspace yet"}
                </p>
                {(userRole === 'admin' || userRole === 'leader') && (
                  <Button onClick={openTaskModal} className="bg-[#58A6FF] hover:bg-blue-600 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="activity" className="pt-4">
          <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
            <CardHeader className="px-4 py-3 border-b border-gray-200 dark:border-[#30363D]">
              <CardTitle className="text-lg font-semibold">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-gray-200 dark:divide-[#30363D]">
                {activities && activities.length > 0 ? (
                  activities.map(activity => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500 dark:text-[#8B949E]">No recent activities</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Project Modal */}
      <Dialog open={isProjectModalOpen} onOpenChange={setIsProjectModalOpen}>
        <DialogContent className="bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#30363D]">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Add a new project to your workspace
            </DialogDescription>
          </DialogHeader>
          
          <Form {...projectForm}>
            <form onSubmit={projectForm.handleSubmit(onSubmitProject)} className="space-y-4">
              <FormField
                control={projectForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Title</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="Enter project title"
                        className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={projectForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Describe the project"
                        className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={projectForm.control}
                name="deadline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deadline (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date"
                        className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="submit"
                  className="bg-[#58A6FF] hover:bg-blue-600 text-white"
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal 
          isOpen={isTaskModalOpen} 
          onClose={closeTaskModal} 
          task={selectedTask}
          projectId={selectedTask?.projectId}
        />
      )}
    </AppLayout>
  );
}
