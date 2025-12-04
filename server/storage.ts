import { type User, type InsertUser, type Project, type Conversation } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Project operations (optional, projects stored client-side in IndexedDB)
  getProject(id: string): Promise<Project | undefined>;
  saveProject(project: Project): Promise<Project>;
  
  // Conversation operations
  getConversation(id: string): Promise<Conversation | undefined>;
  saveConversation(conversation: Conversation): Promise<Conversation>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private projects: Map<string, Project>;
  private conversations: Map<string, Conversation>;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.conversations = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getProject(id: string): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async saveProject(project: Project): Promise<Project> {
    this.projects.set(project.id, project);
    return project;
  }

  async getConversation(id: string): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async saveConversation(conversation: Conversation): Promise<Conversation> {
    this.conversations.set(conversation.id, conversation);
    return conversation;
  }
}

export const storage = new MemStorage();
