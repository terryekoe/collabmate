import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Project, Task, User } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Clock, Pencil, Plus, BarChart, Users, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import AppLayout from "@/components/layout/app-layout";

export default function ProjectPage() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  
  // Get project data
  const { data: project, isLoading: isLoadingProject } = useQuery<Project>({
    queryKey: [`/api/projects/${id}`],
    enabled: !!id && !!user,
  });
  
  // Get project tasks
  const { data: tasks, isLoading: isLoadingTasks } = useQuery<(Task & { assignee: User })[]>({
    queryKey: [`/api/projects/${id}/tasks`],
    enabled: !!id && !!user,
  });
  
  // Get project members
  const { data: members, isLoading: isLoadingMembers } = useQuery<User[]>({
    queryKey: [`/api/projects/${id}/members`],
    enabled: !!id && !!user,
  });
  
  // Calculate project progress
  const calculateProgress = () => {
    if (!tasks || tasks.length === 0) return 0;
    
    const completedTasks = tasks.filter(task => task.status === "completed").length;
    return Math.round((completedTasks / tasks.length) * 100);
  };
  
  // Group tasks by status
  const getTasksByStatus = (status: string) => {
    return tasks?.filter(task => task.status === status) || [];
  };
  
  // Task status counts
  const todoCount = tasks?.filter(task => task.status === "todo").length || 0;
  const inProgressCount = tasks?.filter(task => task.status === "in_progress").length || 0;
  const reviewCount = tasks?.filter(task => task.status === "review").length || 0;
  const completedCount = tasks?.filter(task => task.status === "completed").length || 0;
  
  // Loading state
  if (isLoadingProject || isLoadingTasks || isLoadingMembers) {
    return (
      <AppLayout>
        <div className="container py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-8"></div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
            
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }
  
  // If project not found
  if (!project && !isLoadingProject) {
    return (
      <AppLayout>
        <div className="container py-6 text-center">
          <h1 className="text-3xl font-bold mb-4">Project Not Found</h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            The project you're looking for does not exist or you don't have access to it
          </p>
          <Button onClick={() => navigate("/projects")}>Go to Projects</Button>
        </div>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <div className="container py-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-1">{project?.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 max-w-2xl">
              {project?.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Pencil className="h-4 w-4 mr-2" />
              Edit Project
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>
        
        {/* Project Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Progress</p>
                  <h3 className="text-2xl font-bold mt-1">{calculateProgress()}%</h3>
                </div>
                <BarChart className="h-8 w-8 text-blue-500" />
              </div>
              <Progress value={calculateProgress()} className="h-2 mt-3" />
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Tasks</p>
                  <h3 className="text-2xl font-bold mt-1">{tasks?.length || 0}</h3>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <Badge variant="outline" className="gap-1">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span> {todoCount} Todo
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <span className="w-2 h-2 rounded-full bg-blue-400"></span> {inProgressCount} In Progress
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <span className="w-2 h-2 rounded-full bg-yellow-400"></span> {reviewCount} Review
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <span className="w-2 h-2 rounded-full bg-green-400"></span> {completedCount} Completed
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Team Members</p>
                  <h3 className="text-2xl font-bold mt-1">{members?.length || 0}</h3>
                </div>
                <Users className="h-8 w-8 text-violet-500" />
              </div>
              <div className="flex mt-3">
                {members?.slice(0, 5).map((member) => (
                  <Avatar key={member.id} className="-ml-2 first:ml-0 border-2 border-background">
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                ))}
                {members && members.length > 5 && (
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground -ml-2 text-xs">
                    +{members.length - 5}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Deadline</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {project?.deadline 
                      ? format(new Date(project.deadline), "MMM d") 
                      : "No deadline"}
                  </h3>
                </div>
                <Calendar className="h-8 w-8 text-red-500" />
              </div>
              {project?.deadline && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {format(new Date(project.deadline), "MMMM d, yyyy")}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Project Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">Tasks</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Tasks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {tasks && tasks.length > 0 ? (
                      <div className="space-y-2">
                        {tasks.slice(0, 5).map((task) => (
                          <div key={task.id} className="flex items-center justify-between p-3 border rounded-md">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-3 ${
                                task.status === "completed" ? "bg-green-500" :
                                task.status === "in_progress" ? "bg-blue-500" :
                                task.status === "review" ? "bg-yellow-500" :
                                "bg-gray-500"
                              }`}></div>
                              <span>{task.title}</span>
                            </div>
                            <Badge variant="outline" className="capitalize">{task.status}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No tasks yet</p>
                    )}
                    
                    {tasks && tasks.length > 5 && (
                      <Button variant="outline" className="w-full mt-4" onClick={() => setActiveTab("tasks")}>
                        View All Tasks
                      </Button>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Project Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {project?.description ? (
                      <p className="whitespace-pre-line">{project.description}</p>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No description provided</p>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Team Members</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {members && members.length > 0 ? (
                      <div className="space-y-3">
                        {members.map((member) => (
                          <div key={member.id} className="flex items-center gap-3">
                            <Avatar>
                              <AvatarFallback className="uppercase">{member.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{member.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">No team members yet</p>
                    )}
                    
                    <Button variant="outline" className="w-full mt-4" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</p>
                      <p>{project?.createdAt ? format(new Date(project.createdAt), "MMMM d, yyyy") : "Unknown"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Deadline</p>
                      <p>{project?.deadline ? format(new Date(project.deadline), "MMMM d, yyyy") : "No deadline"}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="tasks">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>All Tasks</CardTitle>
                  <CardDescription>Manage project tasks</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  New Task
                </Button>
              </CardHeader>
              <CardContent>
                {tasks && tasks.length > 0 ? (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">To Do ({todoCount})</h4>
                      <div className="space-y-2">
                        {getTasksByStatus("todo").map((task) => (
                          <div key={task.id} className="p-3 border rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{task.title}</span>
                              <Badge variant="outline" className={`capitalize ${
                                task.priority === "high" ? "text-red-500" :
                                task.priority === "medium" ? "text-yellow-500" :
                                "text-blue-500"
                              }`}>
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {task.description.length > 100 
                                  ? `${task.description.substring(0, 100)}...` 
                                  : task.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-1">
                                  <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{task.assignee.name}</span>
                              </div>
                              {task.deadline && (
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {format(new Date(task.deadline), "MMM d")}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">In Progress ({inProgressCount})</h4>
                      <div className="space-y-2">
                        {getTasksByStatus("in_progress").map((task) => (
                          <div key={task.id} className="p-3 border rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{task.title}</span>
                              <Badge variant="outline" className={`capitalize ${
                                task.priority === "high" ? "text-red-500" :
                                task.priority === "medium" ? "text-yellow-500" :
                                "text-blue-500"
                              }`}>
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {task.description.length > 100 
                                  ? `${task.description.substring(0, 100)}...` 
                                  : task.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-1">
                                  <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{task.assignee.name}</span>
                              </div>
                              {task.deadline && (
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {format(new Date(task.deadline), "MMM d")}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Review ({reviewCount})</h4>
                      <div className="space-y-2">
                        {getTasksByStatus("review").map((task) => (
                          <div key={task.id} className="p-3 border rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{task.title}</span>
                              <Badge variant="outline" className={`capitalize ${
                                task.priority === "high" ? "text-red-500" :
                                task.priority === "medium" ? "text-yellow-500" :
                                "text-blue-500"
                              }`}>
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {task.description.length > 100 
                                  ? `${task.description.substring(0, 100)}...` 
                                  : task.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-1">
                                  <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{task.assignee.name}</span>
                              </div>
                              {task.deadline && (
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {format(new Date(task.deadline), "MMM d")}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Completed ({completedCount})</h4>
                      <div className="space-y-2">
                        {getTasksByStatus("completed").map((task) => (
                          <div key={task.id} className="p-3 border rounded-md">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">{task.title}</span>
                              <Badge variant="outline" className={`capitalize ${
                                task.priority === "high" ? "text-red-500" :
                                task.priority === "medium" ? "text-yellow-500" :
                                "text-blue-500"
                              }`}>
                                {task.priority}
                              </Badge>
                            </div>
                            {task.description && (
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                                {task.description.length > 100 
                                  ? `${task.description.substring(0, 100)}...` 
                                  : task.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center">
                                <Avatar className="h-6 w-6 mr-1">
                                  <AvatarFallback>{task.assignee.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{task.assignee.name}</span>
                              </div>
                              {task.deadline && (
                                <div className="flex items-center text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {format(new Date(task.deadline), "MMM d")}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                      <CheckSquare className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No tasks yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Start by creating your first task for this project
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Task
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="team">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Team Members</CardTitle>
                  <CardDescription>Manage project team</CardDescription>
                </div>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </CardHeader>
              <CardContent>
                {members && members.length > 0 ? (
                  <div className="divide-y">
                    {members.map((member) => (
                      <div key={member.id} className="py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="uppercase">{member.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                          </div>
                        </div>
                        <Badge className="capitalize">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                      <Users className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">No team members yet</h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Add team members to collaborate on this project
                    </p>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>Project Activity</CardTitle>
                <CardDescription>Recent activities in this project</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-300 dark:before:via-gray-700 before:to-transparent">
                  {/* Activity examples - would be replaced with actual activities from API */}
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-gray-100 dark:bg-gray-800 dark:border-gray-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-semibold">John Doe created the project</div>
                        <time className="text-xs text-gray-500 dark:text-gray-400">2h</time>
                      </div>
                      <div className="text-sm">Created a new project: Budget Analysis Dashboard</div>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-gray-100 dark:bg-gray-800 dark:border-gray-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>JS</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-semibold">Jane Smith added a new task</div>
                        <time className="text-xs text-gray-500 dark:text-gray-400">1d</time>
                      </div>
                      <div className="text-sm">Added task: Create wireframes for the dashboard</div>
                    </div>
                  </div>
                  
                  <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-gray-100 dark:bg-gray-800 dark:border-gray-900 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>MW</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                      <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-semibold">Mark Wilson completed a task</div>
                        <time className="text-xs text-gray-500 dark:text-gray-400">3d</time>
                      </div>
                      <div className="text-sm">Completed task: Setup environment for development</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}