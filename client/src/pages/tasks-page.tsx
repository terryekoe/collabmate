import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Task } from "@shared/schema";

import AppLayout from "@/components/layout/app-layout";
import TaskCard from "@/components/dashboard/task-card";
import TaskModal from "@/components/tasks/task-modal";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function TasksPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | undefined>(undefined);
  
  // Get all user's tasks
  const { data: tasks, isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks/user"],
    enabled: !!user,
  });
  
  // Filter tasks by status and search term
  const filterTasks = (status: string) => {
    if (!tasks) return [];
    
    return tasks
      .filter(task => 
        task.status === status && 
        (searchTerm === "" || 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          task.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
  };
  
  // Filter completed tasks
  const filterCompletedTasks = () => {
    if (!tasks) return [];
    
    return tasks
      .filter(task => 
        task.status === 'completed' && 
        (searchTerm === "" || 
          task.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
          task.description?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
  };
  
  // Get task counts
  const todoCount = tasks ? tasks.filter(task => task.status === 'todo').length : 0;
  const inProgressCount = tasks ? tasks.filter(task => task.status === 'in_progress').length : 0;
  const reviewCount = tasks ? tasks.filter(task => task.status === 'review').length : 0;
  const completedCount = tasks ? tasks.filter(task => task.status === 'completed').length : 0;
  
  // Handle task edit
  const handleTaskEdit = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };
  
  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  // Close task modal
  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(undefined);
  };
  
  // Create new task
  const createNewTask = () => {
    setSelectedTask(undefined);
    setIsTaskModalOpen(true);
  };
  
  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-mono">My Tasks</h1>
        
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-[#8B949E]" />
            <Input
              className="pl-9 bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D] w-full md:w-64"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={handleSearch}
            />
          </div>
          
          <Button 
            className="bg-[#58A6FF] hover:bg-blue-600 text-white"
            onClick={createNewTask}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="todo" className="mb-8">
        <TabsList className="bg-gray-200 dark:bg-[#161B22] rounded-lg p-1 mb-4">
          <TabsTrigger value="todo" className="px-4 py-2">
            To Do <span className="ml-2 text-xs bg-gray-300 dark:bg-[#30363D] px-2 py-0.5 rounded-full">{todoCount}</span>
          </TabsTrigger>
          <TabsTrigger value="in_progress" className="px-4 py-2">
            In Progress <span className="ml-2 text-xs bg-gray-300 dark:bg-[#30363D] px-2 py-0.5 rounded-full">{inProgressCount}</span>
          </TabsTrigger>
          <TabsTrigger value="review" className="px-4 py-2">
            Review <span className="ml-2 text-xs bg-gray-300 dark:bg-[#30363D] px-2 py-0.5 rounded-full">{reviewCount}</span>
          </TabsTrigger>
          <TabsTrigger value="completed" className="px-4 py-2">
            Completed <span className="ml-2 text-xs bg-gray-300 dark:bg-[#30363D] px-2 py-0.5 rounded-full">{completedCount}</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="todo">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 dark:border-[#58A6FF] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTasks('todo').length > 0 ? (
                filterTasks('todo').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={handleTaskEdit}
                  />
                ))
              ) : (
                <Card className="bg-white dark:bg-[#161B22] col-span-full">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">No To Do Tasks</h3>
                    <p className="text-gray-500 dark:text-[#8B949E] mb-4">
                      {searchTerm ? "No tasks match your search" : "You don't have any to-do tasks at the moment"}
                    </p>
                    {!searchTerm && (
                      <Button 
                        className="bg-[#58A6FF] hover:bg-blue-600 text-white"
                        onClick={createNewTask}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create New Task
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="in_progress">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 dark:border-[#58A6FF] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTasks('in_progress').length > 0 ? (
                filterTasks('in_progress').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={handleTaskEdit}
                  />
                ))
              ) : (
                <Card className="bg-white dark:bg-[#161B22] col-span-full">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">No In Progress Tasks</h3>
                    <p className="text-gray-500 dark:text-[#8B949E]">
                      {searchTerm ? "No tasks match your search" : "You don't have any in-progress tasks at the moment"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="review">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 dark:border-[#58A6FF] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterTasks('review').length > 0 ? (
                filterTasks('review').map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={handleTaskEdit}
                  />
                ))
              ) : (
                <Card className="bg-white dark:bg-[#161B22] col-span-full">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">No Tasks Under Review</h3>
                    <p className="text-gray-500 dark:text-[#8B949E]">
                      {searchTerm ? "No tasks match your search" : "You don't have any tasks under review at the moment"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin w-8 h-8 border-4 border-blue-500 dark:border-[#58A6FF] border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filterCompletedTasks().length > 0 ? (
                filterCompletedTasks().map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    onEdit={handleTaskEdit}
                  />
                ))
              ) : (
                <Card className="bg-white dark:bg-[#161B22] col-span-full">
                  <CardContent className="p-8 text-center">
                    <h3 className="text-lg font-semibold mb-2">No Completed Tasks</h3>
                    <p className="text-gray-500 dark:text-[#8B949E]">
                      {searchTerm ? "No tasks match your search" : "You don't have any completed tasks yet"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {isTaskModalOpen && (
        <TaskModal 
          isOpen={isTaskModalOpen} 
          onClose={closeTaskModal} 
          task={selectedTask}
        />
      )}
    </AppLayout>
  );
}
