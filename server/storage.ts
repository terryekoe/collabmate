import { 
  User, InsertUser,
  Workspace, InsertWorkspace,
  WorkspaceMember, InsertWorkspaceMember,
  Project, InsertProject,
  ProjectMember, InsertProjectMember,
  Task, InsertTask,
  Feedback, InsertFeedback,
  Activity, InsertActivity
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Workspace methods
  getWorkspace(id: number): Promise<Workspace | undefined>;
  getWorkspacesByUserId(userId: number): Promise<Workspace[]>;
  createWorkspace(workspace: InsertWorkspace): Promise<Workspace>;
  
  // Workspace Member methods
  getWorkspaceMember(workspaceId: number, userId: number): Promise<WorkspaceMember | undefined>;
  getWorkspaceMembers(workspaceId: number): Promise<(WorkspaceMember & { user: User })[]>;
  isWorkspaceMember(workspaceId: number, userId: number): Promise<boolean>;
  addWorkspaceMember(member: InsertWorkspaceMember): Promise<WorkspaceMember>;
  
  // Project methods
  getProject(id: number): Promise<Project | undefined>;
  getProjectsByWorkspaceId(workspaceId: number): Promise<Project[]>;
  createProject(project: InsertProject): Promise<Project>;
  
  // Project Member methods
  getProjectMember(projectId: number, userId: number): Promise<ProjectMember | undefined>;
  getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]>;
  isProjectMember(projectId: number, userId: number): Promise<boolean>;
  addProjectMember(member: InsertProjectMember): Promise<ProjectMember>;
  
  // Task methods
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProjectId(projectId: number): Promise<(Task & { assignee: User })[]>;
  getTasksByAssigneeId(assigneeId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task>;
  
  // Feedback methods
  createFeedback(feedback: InsertFeedback): Promise<Feedback>;
  getFeedbackByWorkspaceId(workspaceId: number): Promise<Feedback[]>;
  getFeedbackByTargetUserId(targetUserId: number): Promise<Feedback[]>;
  
  // Activity methods
  createActivity(activity: InsertActivity): Promise<Activity>;
  getActivitiesByWorkspaceId(workspaceId: number): Promise<(Activity & { user: User })[]>;
  
  // Session store
  sessionStore: session.Store;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private workspaces: Map<number, Workspace>;
  private workspaceMembers: Map<number, WorkspaceMember>;
  private projects: Map<number, Project>;
  private projectMembers: Map<number, ProjectMember>;
  private tasks: Map<number, Task>;
  private feedback: Map<number, Feedback>;
  private activities: Map<number, Activity>;
  
  sessionStore: session.Store;
  
  private currentUserId: number;
  private currentWorkspaceId: number;
  private currentWorkspaceMemberId: number;
  private currentProjectId: number;
  private currentProjectMemberId: number;
  private currentTaskId: number;
  private currentFeedbackId: number;
  private currentActivityId: number;

  constructor() {
    this.users = new Map();
    this.workspaces = new Map();
    this.workspaceMembers = new Map();
    this.projects = new Map();
    this.projectMembers = new Map();
    this.tasks = new Map();
    this.feedback = new Map();
    this.activities = new Map();
    
    this.currentUserId = 1;
    this.currentWorkspaceId = 1;
    this.currentWorkspaceMemberId = 1;
    this.currentProjectId = 1;
    this.currentProjectMemberId = 1;
    this.currentTaskId = 1;
    this.currentFeedbackId = 1;
    this.currentActivityId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 1 day
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Workspace methods
  async getWorkspace(id: number): Promise<Workspace | undefined> {
    return this.workspaces.get(id);
  }

  async getWorkspacesByUserId(userId: number): Promise<Workspace[]> {
    // Get all workspace IDs where this user is a member
    const memberWorkspaceIds = Array.from(this.workspaceMembers.values())
      .filter(member => member.userId === userId)
      .map(member => member.workspaceId);
    
    // Get the workspaces for these IDs
    return Array.from(this.workspaces.values())
      .filter(workspace => memberWorkspaceIds.includes(workspace.id));
  }

  async createWorkspace(insertWorkspace: InsertWorkspace): Promise<Workspace> {
    const id = this.currentWorkspaceId++;
    const now = new Date();
    const workspace: Workspace = { ...insertWorkspace, id, createdAt: now };
    this.workspaces.set(id, workspace);
    return workspace;
  }

  // Workspace Member methods
  async getWorkspaceMember(workspaceId: number, userId: number): Promise<WorkspaceMember | undefined> {
    return Array.from(this.workspaceMembers.values()).find(
      member => member.workspaceId === workspaceId && member.userId === userId
    );
  }

  async getWorkspaceMembers(workspaceId: number): Promise<(WorkspaceMember & { user: User })[]> {
    const members = Array.from(this.workspaceMembers.values())
      .filter(member => member.workspaceId === workspaceId);
    
    return Promise.all(
      members.map(async member => {
        const user = await this.getUser(member.userId);
        return { ...member, user: user! };
      })
    );
  }

  async isWorkspaceMember(workspaceId: number, userId: number): Promise<boolean> {
    const member = await this.getWorkspaceMember(workspaceId, userId);
    return !!member;
  }

  async addWorkspaceMember(insertMember: InsertWorkspaceMember): Promise<WorkspaceMember> {
    const id = this.currentWorkspaceMemberId++;
    const member: WorkspaceMember = { ...insertMember, id };
    this.workspaceMembers.set(id, member);
    return member;
  }

  // Project methods
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async getProjectsByWorkspaceId(workspaceId: number): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.workspaceId === workspaceId);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const now = new Date();
    const project: Project = { ...insertProject, id, createdAt: now };
    this.projects.set(id, project);
    return project;
  }

  // Project Member methods
  async getProjectMember(projectId: number, userId: number): Promise<ProjectMember | undefined> {
    return Array.from(this.projectMembers.values()).find(
      member => member.projectId === projectId && member.userId === userId
    );
  }

  async getProjectMembers(projectId: number): Promise<(ProjectMember & { user: User })[]> {
    const members = Array.from(this.projectMembers.values())
      .filter(member => member.projectId === projectId);
    
    return Promise.all(
      members.map(async member => {
        const user = await this.getUser(member.userId);
        return { ...member, user: user! };
      })
    );
  }

  async isProjectMember(projectId: number, userId: number): Promise<boolean> {
    const member = await this.getProjectMember(projectId, userId);
    return !!member;
  }

  async addProjectMember(insertMember: InsertProjectMember): Promise<ProjectMember> {
    const id = this.currentProjectMemberId++;
    const member: ProjectMember = { ...insertMember, id };
    this.projectMembers.set(id, member);
    return member;
  }

  // Task methods
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByProjectId(projectId: number): Promise<(Task & { assignee: User })[]> {
    const tasks = Array.from(this.tasks.values())
      .filter(task => task.projectId === projectId);
    
    return Promise.all(
      tasks.map(async task => {
        const assignee = await this.getUser(task.assigneeId);
        return { ...task, assignee: assignee! };
      })
    );
  }

  async getTasksByAssigneeId(assigneeId: number): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.assigneeId === assigneeId);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskId++;
    const now = new Date();
    const task: Task = { ...insertTask, id, createdAt: now };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<Task>): Promise<Task> {
    const task = await this.getTask(id);
    if (!task) {
      throw new Error("Task not found");
    }
    
    const updatedTask = { ...task, ...taskUpdate };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  // Feedback methods
  async createFeedback(insertFeedback: InsertFeedback): Promise<Feedback> {
    const id = this.currentFeedbackId++;
    const now = new Date();
    const feedback: Feedback = { ...insertFeedback, id, createdAt: now };
    this.feedback.set(id, feedback);
    return feedback;
  }

  async getFeedbackByWorkspaceId(workspaceId: number): Promise<Feedback[]> {
    return Array.from(this.feedback.values())
      .filter(feedback => feedback.workspaceId === workspaceId);
  }

  async getFeedbackByTargetUserId(targetUserId: number): Promise<Feedback[]> {
    return Array.from(this.feedback.values())
      .filter(feedback => feedback.targetUserId === targetUserId);
  }

  // Activity methods
  async createActivity(insertActivity: InsertActivity): Promise<Activity> {
    const id = this.currentActivityId++;
    const now = new Date();
    const activity: Activity = { ...insertActivity, id, createdAt: now };
    this.activities.set(id, activity);
    return activity;
  }

  async getActivitiesByWorkspaceId(workspaceId: number): Promise<(Activity & { user: User })[]> {
    const activities = Array.from(this.activities.values())
      .filter(activity => activity.workspaceId === workspaceId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return Promise.all(
      activities.map(async activity => {
        const user = await this.getUser(activity.userId);
        return { ...activity, user: user! };
      })
    );
  }
}

export const storage = new MemStorage();
