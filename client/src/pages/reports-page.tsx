import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Workspace, User } from "@shared/schema";

import AppLayout from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Area, 
  AreaChart, 
  Bar, 
  BarChart, 
  CartesianGrid, 
  Cell, 
  Legend, 
  Pie, 
  PieChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts";
import { Download } from "lucide-react";

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedWorkspace, setSelectedWorkspace] = useState<string>("");
  const [reportPeriod, setReportPeriod] = useState<string>("month");
  
  // Get workspaces
  const { data: workspaces } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });
  
  // Get workspace report data
  const { data: reportData } = useQuery<{
    taskCompletion: {
      total: number;
      completed: number;
      progress: number;
    };
    tasksByStatus: {
      name: string;
      value: number;
      color: string;
    }[];
    tasksByPriority: {
      name: string;
      value: number;
      color: string;
    }[];
    progressOverTime: {
      date: string;
      progress: number;
    }[];
    topContributors: {
      name: string;
      tasks: number;
      color: string;
    }[];
  }>({
    queryKey: [`/api/workspaces/${selectedWorkspace}/reports`, reportPeriod],
    enabled: !!selectedWorkspace,
  });
  
  // Handle workspace change
  const handleWorkspaceChange = (value: string) => {
    setSelectedWorkspace(value);
  };
  
  // Handle period change
  const handlePeriodChange = (value: string) => {
    setReportPeriod(value);
  };
  
  // Download report
  const downloadReport = () => {
    // This would be implemented to export data as PDF/CSV
    alert("Report download functionality would be implemented here");
  };
  
  // Mock data for charts
  const mockTasksByStatus = [
    { name: "To Do", value: 6, color: "#8B949E" },
    { name: "In Progress", value: 8, color: "#58A6FF" },
    { name: "Review", value: 4, color: "#F0883E" },
    { name: "Completed", value: 12, color: "#7EE787" },
  ];
  
  const mockTasksByPriority = [
    { name: "High", value: 7, color: "#F85149" },
    { name: "Medium", value: 15, color: "#F0883E" },
    { name: "Low", value: 8, color: "#58A6FF" },
  ];
  
  const mockProgressOverTime = [
    { date: "Week 1", progress: 10 },
    { date: "Week 2", progress: 25 },
    { date: "Week 3", progress: 40 },
    { date: "Week 4", progress: 60 },
    { date: "Week 5", progress: 75 },
    { date: "Week 6", progress: 85 },
  ];
  
  const mockTopContributors = [
    { name: "Alex J.", tasks: 15, color: "#58A6FF" },
    { name: "Sarah C.", tasks: 12, color: "#7EE787" },
    { name: "Michael K.", tasks: 10, color: "#F0883E" },
    { name: "James W.", tasks: 8, color: "#F85149" },
    { name: "Emma L.", tasks: 5, color: "#8B949E" },
  ];
  
  const data = reportData || {
    taskCompletion: { total: 30, completed: 12, progress: 40 },
    tasksByStatus: mockTasksByStatus,
    tasksByPriority: mockTasksByPriority,
    progressOverTime: mockProgressOverTime,
    topContributors: mockTopContributors
  };
  
  return (
    <AppLayout>
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold font-mono">Reports & Analytics</h1>
        
        <div className="flex flex-col md:flex-row gap-2">
          <Select value={selectedWorkspace} onValueChange={handleWorkspaceChange}>
            <SelectTrigger className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D] w-full md:w-48">
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
          
          <Select value={reportPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="bg-white dark:bg-[#0D1117] border-gray-300 dark:border-[#30363D] w-full md:w-36">
              <SelectValue placeholder="Time Period" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#0D1117] border-gray-200 dark:border-[#30363D]">
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          
          {selectedWorkspace && (
            <Button 
              variant="outline" 
              className="text-gray-700 dark:text-[#C9D1D9] bg-gray-200 dark:bg-[#161B22] hover:bg-gray-300 dark:hover:bg-gray-700"
              onClick={downloadReport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          )}
        </div>
      </div>
      
      {!selectedWorkspace ? (
        <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
          <CardContent className="p-8 text-center">
            <h3 className="text-lg font-semibold mb-2">Select a Workspace</h3>
            <p className="text-gray-500 dark:text-[#8B949E]">
              Choose a workspace to view analytics and reports
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Task Completion */}
          <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
            <CardHeader>
              <CardTitle>Task Completion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-2xl font-bold">{data.taskCompletion.completed}</span>
                  <span className="text-gray-500 dark:text-[#8B949E]">of</span>
                  <span className="text-xl">{data.taskCompletion.total}</span>
                  <span className="text-gray-500 dark:text-[#8B949E]">tasks completed</span>
                </div>
                <div className="w-full max-w-md mb-4">
                  <Progress value={data.taskCompletion.progress} className="h-4" />
                </div>
                <p className="text-center text-gray-500 dark:text-[#8B949E]">
                  {data.taskCompletion.progress}% completion rate
                </p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tasks by Status */}
            <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
              <CardHeader>
                <CardTitle>Tasks by Status</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.tasksByStatus}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {data.tasksByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Tasks by Priority */}
            <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
              <CardHeader>
                <CardTitle>Tasks by Priority</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data.tasksByPriority}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} tasks`, 'Count']} />
                    <Bar dataKey="value">
                      {data.tasksByPriority.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Progress Over Time */}
            <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
              <CardHeader>
                <CardTitle>Progress Over Time</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.progressOverTime}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, 'Progress']} />
                    <Area type="monotone" dataKey="progress" stroke="#58A6FF" fill="#58A6FF" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Top Contributors */}
            <Card className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-[#30363D]">
              <CardHeader>
                <CardTitle>Top Contributors</CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={data.topContributors}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#30363D" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => [`${value} tasks`, 'Completed']} />
                    <Bar dataKey="tasks">
                      {data.topContributors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
