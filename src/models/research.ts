export interface ResearchSource {
  url: string;
  title: string;
  snippet: string;
  retrievedAt: string;
}

export interface ResearchFinding {
  id: string;
  summary: string;
  detail: string;
  sources: string[];
  confidence: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface ResearchArtifact {
  id: string;
  type: 'search_result' | 'finding' | 'synthesis' | 'draft';
  title: string;
  content: string;
  sources: ResearchSource[];
  findings: ResearchFinding[];
  createdAt: string;
  stepNumber: number;
}
