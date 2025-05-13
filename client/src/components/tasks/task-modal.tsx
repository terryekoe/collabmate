import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { insertTaskSchema, Task, Project, User } from '@shared/schema';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task?: Task;
  projectId?: number;
}

// Extend the task schema with validation
const taskFormSchema = insertTaskSchema.extend({
  deadline: z.string().optional(),
}).omit({ createdAt: true });

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function TaskModal({ isOpen, onClose, task, projectId }: TaskModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Get projects
  const { data: projects } = useQuery<Project[]>({
    queryKey: ["/api/workspaces", user?.id, "projects"],
    enabled: !!user && !projectId,
  });
  
  // Get users for selected project
  const selectedProjectId = projectId || task?.projectId;
  const { data: projectMembers } = useQuery<(User & { id: number })[]>({
    queryKey: [`/api/projects/${selectedProjectId}/members`],
    enabled: !!selectedProjectId,
  });
  
  // Form setup
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: task?.title || '',
      description: task?.description || '',
      status: task?.status || 'todo',
      priority: task?.priority || 'medium',
      progress: task?.progress || 0,
      projectId: task?.projectId || projectId,
      assigneeId: task?.assigneeId || user?.id,
      createdById: user?.id,
      deadline: task?.deadline 
        ? new Date(task.deadline).toISOString().split('T')[0]
        : undefined
    },
  });
  
  // Update form when task or projectId changes
  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        progress: task.progress,
        projectId: task.projectId,
        assigneeId: task.assigneeId,
        createdById: task.createdById,
        deadline: task.deadline 
          ? new Date(task.deadline).toISOString().split('T')[0]
          : undefined
      });
    } else if (projectId) {
      form.setValue('projectId', projectId);
    }
  }, [task, projectId, form]);
  
  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const res = await apiRequest("POST", `/api/projects/${data.projectId}/tasks`, data);
      return await res.json();
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${newTask.projectId}/tasks`] });
      toast({
        title: "Task created",
        description: "Task was created successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create task",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const res = await apiRequest("PUT", `/api/tasks/${task?.id}`, data);
      return await res.json();
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${updatedTask.projectId}/tasks`] });
      toast({
        title: "Task updated",
        description: "Task was updated successfully",
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update task",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle form submission
  const onSubmit = (data: TaskFormValues) => {
    const formattedData = {
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      createdById: user?.id || 0,
    };
    
    if (task) {
      updateTaskMutation.mutate(formattedData);
    } else {
      createTaskMutation.mutate(formattedData);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white dark:bg-[#161B22] border-gray-200 dark:border-[#30363D] text-gray-900 dark:text-[#C9D1D9] max-w-md md:max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold font-mono">
            {task ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Task Title</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      placeholder="Enter task title"
                      className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                    />
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
                      placeholder="Describe the task"
                      className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {!projectId && !task && (
                <FormField
                  control={form.control}
                  name="projectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(parseInt(value))} 
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                            <SelectValue placeholder="Select project" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                          {projects?.map((project) => (
                            <SelectItem key={project.id} value={project.id.toString()}>
                              {project.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <FormField
                control={form.control}
                name="assigneeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assign To</FormLabel>
                    <Select 
                      onValueChange={(value) => field.onChange(parseInt(value))} 
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                          <SelectValue placeholder="Select assignee" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                        {projectMembers?.map((member) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.name}
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
                  <FormItem>
                    <FormLabel>Deadline</FormLabel>
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
              
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]">
                        <SelectItem value="todo">To Do</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="review">Review</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {task && (
                <FormField
                  control={form.control}
                  name="progress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Progress ({field.value}%)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="range"
                          min="0"
                          max="100"
                          className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D]"
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button 
                  type="button" 
                  variant="outline"
                  className="bg-gray-200 dark:bg-[#0D1117] hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-[#C9D1D9]"
                >
                  Cancel
                </Button>
              </DialogClose>
              <Button 
                type="submit"
                className="bg-[#58A6FF] hover:bg-blue-600 text-white"
                disabled={createTaskMutation.isPending || updateTaskMutation.isPending}
              >
                {task ? 'Update Task' : 'Create Task'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
