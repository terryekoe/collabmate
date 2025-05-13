import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link } from "wouter";
import { Project, insertProjectSchema, Workspace } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, Folder, Clock, Users, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";

// Project creation form schema
const projectFormSchema = insertProjectSchema.extend({
  deadline: z.date().optional(),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function ProjectsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Get all workspaces
  const { data: workspaces, isLoading: isLoadingWorkspaces } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });
  
  // Get all projects
  const { data: projects, isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects"],
    enabled: !!user,
  });
  
  // Project creation form
  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      title: "",
      description: "",
      workspaceId: 0,
      deadline: undefined,
    },
  });
  
  // Project creation mutation
  const createProjectMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      const res = await apiRequest("POST", "/api/projects", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Project created",
        description: "Your project has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create project",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Handle form submission
  const onSubmit = (data: ProjectFormValues) => {
    createProjectMutation.mutate(data);
  };
  
  // Calculate days remaining for deadline
  const getDaysRemaining = (deadline: Date | null) => {
    if (!deadline) return null;
    
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const differenceInTime = deadlineDate.getTime() - today.getTime();
    const differenceInDays = Math.ceil(differenceInTime / (1000 * 3600 * 24));
    
    return differenceInDays;
  };
  
  // Get workspace name by ID
  const getWorkspaceName = (workspaceId: number) => {
    const workspace = workspaces?.find(ws => ws.id === workspaceId);
    return workspace?.name || "Unknown Workspace";
  };
  
  // Loading state
  if (isLoadingWorkspaces || isLoadingProjects) {
    return (
      <AppLayout>
        <div className="container py-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">Projects</h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="pb-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Projects</h1>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Create a new project to organize tasks and collaborate with your team
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Title</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Enter project title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Describe the project purpose and goals" 
                            className="min-h-[100px]"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="workspaceId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))} 
                          value={field.value ? field.value.toString() : undefined}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a workspace" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {workspaces?.map((workspace) => (
                              <SelectItem key={workspace.id} value={workspace.id.toString()}>
                                {workspace.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="deadline"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Deadline (Optional)</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={`w-full justify-start text-left font-normal ${
                                  !field.value && "text-muted-foreground"
                                }`}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : "Select a date"}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={field.onChange}
                              initialFocus
                              disabled={(date) => date < new Date()}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end">
                    <Button type="submit" disabled={createProjectMutation.isPending}>
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
        
        {projects?.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
              <Folder className="h-10 w-10 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-xl font-medium mb-2">No projects yet</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Get started by creating your first project
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>Create a Project</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects?.map((project) => {
              const daysRemaining = project.deadline ? getDaysRemaining(project.deadline) : null;
              
              return (
                <Link key={project.id} href={`/project/${project.id}`}>
                  <a className="block h-full">
                    <Card className="h-full transition-all hover:shadow-md cursor-pointer">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start mb-1">
                          <CardTitle className="text-xl">{project.title}</CardTitle>
                          <Badge variant="outline" className="capitalize">
                            {getWorkspaceName(project.workspaceId)}
                          </Badge>
                        </div>
                        <CardDescription>
                          {project.description && project.description.length > 100 
                            ? `${project.description.substring(0, 100)}...` 
                            : project.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {project.deadline && (
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-500 dark:text-gray-400">
                              Deadline: {format(new Date(project.deadline), "MMM d, yyyy")}
                            </span>
                            {daysRemaining !== null && daysRemaining >= 0 && (
                              <Badge className="ml-2" variant={daysRemaining <= 3 ? "destructive" : "secondary"}>
                                {daysRemaining} days left
                              </Badge>
                            )}
                            {daysRemaining !== null && daysRemaining < 0 && (
                              <Badge variant="destructive" className="ml-2">
                                Overdue
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center text-sm">
                            <CheckSquare className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                            <span className="text-gray-500 dark:text-gray-400">
                              0/0 Tasks Complete
                            </span>
                          </div>
                        </div>
                        
                        <Progress value={0} className="h-2" />
                      </CardContent>
                      <CardFooter className="pt-0">
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                          <span className="text-gray-500 dark:text-gray-400">
                            0 Team Members
                          </span>
                        </div>
                      </CardFooter>
                    </Card>
                  </a>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}