import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { 
  insertWorkspaceSchema, 
  insertWorkspaceMemberSchema, 
  insertProjectSchema, 
  insertTaskSchema, 
  insertFeedbackSchema,
  insertActivitySchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Middleware to check if user is an admin
  const isAdmin = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user.role === "admin") {
      return next();
    }
    res.status(403).json({ message: "Forbidden - Admin access required" });
  };

  // Middleware to check if user is a leader
  const isLeader = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && (req.user.role === "leader" || req.user.role === "admin")) {
      return next();
    }
    res.status(403).json({ message: "Forbidden - Leader access required" });
  };

  // Workspace Routes
  app.get("/api/workspaces", isAuthenticated, async (req, res) => {
    try {
      const workspaces = await storage.getWorkspacesByUserId(req.user.id);
      res.json(workspaces);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workspaces" });
    }
  });

  app.get("/api/workspaces/:id", isAuthenticated, async (req, res) => {
    try {
      const workspace = await storage.getWorkspace(parseInt(req.params.id));
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      // Check if user has access to this workspace
      const isMember = await storage.isWorkspaceMember(workspace.id, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this workspace" });
      }

      res.json(workspace);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workspace" });
    }
  });

  app.post("/api/workspaces", isAdmin, async (req, res) => {
    try {
      const workspaceData = insertWorkspaceSchema.parse(req.body);
      const workspace = await storage.createWorkspace({
        ...workspaceData,
        adminId: req.user.id
      });
      
      // Add the admin as a workspace member automatically
      await storage.addWorkspaceMember({
        workspaceId: workspace.id,
        userId: req.user.id,
        role: "admin"
      });
      
      // Create an activity for workspace creation
      await storage.createActivity({
        userId: req.user.id,
        workspaceId: workspace.id,
        type: "workspace_created",
        content: `${req.user.name} created the workspace "${workspace.name}"`,
        entityId: workspace.id,
        entityType: "workspace"
      });
      
      res.status(201).json(workspace);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid workspace data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create workspace" });
    }
  });

  // Workspace Members Routes
  app.post("/api/workspaces/:id/members", isAdmin, async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.id);
      const workspace = await storage.getWorkspace(workspaceId);
      
      if (!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
      }

      const memberData = insertWorkspaceMemberSchema.parse({
        ...req.body,
        workspaceId
      });
      
      const member = await storage.addWorkspaceMember(memberData);
      
      // Create an activity for adding a member
      const user = await storage.getUser(memberData.userId);
      await storage.createActivity({
        userId: req.user.id,
        workspaceId,
        type: "member_added",
        content: `${req.user.name} added ${user?.name || 'a user'} to the workspace`,
        entityId: memberData.userId,
        entityType: "user"
      });
      
      res.status(201).json(member);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid member data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add member to workspace" });
    }
  });

  app.get("/api/workspaces/:id/members", isAuthenticated, async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.id);
      
      // Check if user has access to this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this workspace" });
      }
      
      const members = await storage.getWorkspaceMembers(workspaceId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch workspace members" });
    }
  });

  // Project Routes
  app.post("/api/workspaces/:id/projects", isLeader, async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.id);
      
      // Check if user has leader/admin access to this workspace
      const member = await storage.getWorkspaceMember(workspaceId, req.user.id);
      if (!member || (member.role !== "leader" && member.role !== "admin")) {
        return res.status(403).json({ message: "You don't have permission to create projects" });
      }
      
      const projectData = insertProjectSchema.parse({
        ...req.body,
        workspaceId
      });
      
      const project = await storage.createProject(projectData);
      
      // Create an activity for project creation
      await storage.createActivity({
        userId: req.user.id,
        workspaceId,
        type: "project_created",
        content: `${req.user.name} created the project "${project.title}"`,
        entityId: project.id,
        entityType: "project"
      });
      
      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid project data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get("/api/workspaces/:id/projects", isAuthenticated, async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.id);
      
      // Check if user has access to this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this workspace" });
      }
      
      const projects = await storage.getProjectsByWorkspaceId(workspaceId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  // Project Members Routes
  app.post("/api/projects/:id/members", isLeader, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has leader/admin access to the workspace
      const member = await storage.getWorkspaceMember(project.workspaceId, req.user.id);
      if (!member || (member.role !== "leader" && member.role !== "admin")) {
        return res.status(403).json({ message: "You don't have permission to add project members" });
      }
      
      const memberData = {
        ...req.body,
        projectId
      };
      
      // Ensure the user is a member of the workspace
      const isWorkspaceMember = await storage.isWorkspaceMember(project.workspaceId, memberData.userId);
      if (!isWorkspaceMember) {
        return res.status(400).json({ message: "User must be a member of the workspace first" });
      }
      
      const projectMember = await storage.addProjectMember(memberData);
      
      // Create an activity for adding a project member
      const user = await storage.getUser(memberData.userId);
      await storage.createActivity({
        userId: req.user.id,
        workspaceId: project.workspaceId,
        type: "project_member_added",
        content: `${req.user.name} added ${user?.name || 'a user'} to the project "${project.title}"`,
        entityId: projectId,
        entityType: "project"
      });
      
      res.status(201).json(projectMember);
    } catch (error) {
      res.status(500).json({ message: "Failed to add member to project" });
    }
  });

  app.get("/api/projects/:id/members", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to the project's workspace
      const isMember = await storage.isWorkspaceMember(project.workspaceId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      const members = await storage.getProjectMembers(projectId);
      res.json(members);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  // Task Routes
  app.post("/api/projects/:id/tasks", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to create tasks
      // Leaders and admins can create tasks for anyone, members can only create tasks for themselves
      const workspaceMember = await storage.getWorkspaceMember(project.workspaceId, req.user.id);
      if (!workspaceMember) {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      if (workspaceMember.role === "member" && req.body.assigneeId !== req.user.id) {
        return res.status(403).json({ message: "Members can only create tasks for themselves" });
      }
      
      const taskData = insertTaskSchema.parse({
        ...req.body,
        projectId,
        createdById: req.user.id
      });
      
      const task = await storage.createTask(taskData);
      
      // Create an activity for task creation
      const assignee = await storage.getUser(taskData.assigneeId);
      await storage.createActivity({
        userId: req.user.id,
        workspaceId: project.workspaceId,
        type: "task_created",
        content: `${req.user.name} created task "${task.title}" and assigned it to ${assignee?.name || 'a user'}`,
        entityId: task.id,
        entityType: "task"
      });
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid task data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get("/api/projects/:id/tasks", isAuthenticated, async (req, res) => {
    try {
      const projectId = parseInt(req.params.id);
      const project = await storage.getProject(projectId);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access to the project's workspace
      const isMember = await storage.isWorkspaceMember(project.workspaceId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this project" });
      }
      
      const tasks = await storage.getTasksByProjectId(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.put("/api/tasks/:id", isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const task = await storage.getTask(taskId);
      
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      const project = await storage.getProject(task.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check user permissions for task update
      // Only the task assignee, leaders, or admins can update tasks
      const workspaceMember = await storage.getWorkspaceMember(project.workspaceId, req.user.id);
      if (!workspaceMember) {
        return res.status(403).json({ message: "You don't have access to this task" });
      }
      
      if (workspaceMember.role === "member" && task.assigneeId !== req.user.id) {
        return res.status(403).json({ message: "You can only update tasks assigned to you" });
      }
      
      // Update the task
      const updatedTask = await storage.updateTask(taskId, req.body);
      
      // Create an activity for task update
      await storage.createActivity({
        userId: req.user.id,
        workspaceId: project.workspaceId,
        type: "task_updated",
        content: `${req.user.name} updated task "${task.title}"`,
        entityId: task.id,
        entityType: "task"
      });
      
      res.json(updatedTask);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Feedback Routes
  app.post("/api/workspaces/:id/feedback", isAuthenticated, async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.id);
      
      // Check if user has access to this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this workspace" });
      }
      
      const feedbackData = insertFeedbackSchema.parse({
        ...req.body,
        workspaceId
      });
      
      const feedback = await storage.createFeedback(feedbackData);
      
      // Create an activity for feedback submission (anonymous)
      await storage.createActivity({
        userId: req.user.id,
        workspaceId,
        type: "feedback_submitted",
        content: "Anonymous feedback was submitted",
        entityId: feedback.id,
        entityType: "feedback"
      });
      
      res.status(201).json(feedback);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid feedback data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  app.get("/api/workspaces/:id/feedback", isLeader, async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.id);
      
      // Check if user has leader/admin access to this workspace
      const member = await storage.getWorkspaceMember(workspaceId, req.user.id);
      if (!member || (member.role !== "leader" && member.role !== "admin")) {
        return res.status(403).json({ message: "You don't have permission to view feedback" });
      }
      
      const feedback = await storage.getFeedbackByWorkspaceId(workspaceId);
      
      // Return feedback anonymously
      const anonymizedFeedback = feedback.map(item => {
        return {
          id: item.id,
          workspaceId: item.workspaceId,
          targetUserId: item.targetUserId,
          effortScore: item.effortScore,
          communicationScore: item.communicationScore,
          reliabilityScore: item.reliabilityScore,
          comments: item.comments,
          createdAt: item.createdAt
        };
      });
      
      res.json(anonymizedFeedback);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch feedback" });
    }
  });

  // Activities Routes
  app.get("/api/workspaces/:id/activities", isAuthenticated, async (req, res) => {
    try {
      const workspaceId = parseInt(req.params.id);
      
      // Check if user has access to this workspace
      const isMember = await storage.isWorkspaceMember(workspaceId, req.user.id);
      if (!isMember) {
        return res.status(403).json({ message: "You don't have access to this workspace" });
      }
      
      const activities = await storage.getActivitiesByWorkspaceId(workspaceId);
      res.json(activities);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch activities" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
