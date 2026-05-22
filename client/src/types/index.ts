export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'teacher' | 'student';
  institution?: string;
  avatar?: string;
  createdAt?: string;
}

export interface Resource {
  _id: string;
  type: 'pdf' | 'image' | 'video' | 'text' | 'other';
  filename: string;
  originalName: string;
  path: string;
  size: number;
  mimeType: string;
}

export interface Card {
  _id: string;
  title: string;
  description: string;
  subject: string;
  tags: string[];
  resources: Resource[];
  creator: User;
  accessList: User[];
  accessCount: number;
  isPublished: boolean;
  textContent?: string;
  embeddingsReady?: boolean;
  pendingRequests?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AccessRequest {
  _id: string;
  student: User;
  card: Card;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
}

export interface DashboardStats {
  role: string;
  totalCards?: number;
  pendingRequests?: number;
  approvedRequests?: number;
  totalStudentsWithAccess?: number;
  approvedCards?: number;
  totalAvailableCards?: number;
}

export interface CardsResponse {
  cards: Card[];
  total: number;
  page: number;
  pages: number;
}

// ---- Quiz ----
export interface QuizQuestion {
  _id?: string;
  text: string;
  options: string[];
  correctIndex?: number; // only present for teacher
}

export interface QuizAttempt {
  _id?: string;
  student?: User;
  answers: number[];
  score: number;
  total: number;
  submittedAt: string;
}

export interface Quiz {
  _id: string;
  card: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  attempts?: QuizAttempt[];
  myAttempts?: QuizAttempt[];
  isActive: boolean;
  createdAt: string;
}

// ---- Discussion ----
export interface DiscussionMessage {
  _id: string;
  card: string;
  author: User;
  content: string;
  createdAt: string;
}
