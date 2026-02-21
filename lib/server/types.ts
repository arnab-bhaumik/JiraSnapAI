export interface JiraConfig {
  projectName: string;
  email: string;
  apiToken: string;
  jiraUrl: string;
  issueType: string;
}

export interface GroqConfig {
  apiKey: string;
}

export interface AppSettings {
  jira: JiraConfig;
  groq: GroqConfig;
}

export interface AnalyzeRequest {
  image: string;
  mimeType: string;
  notes: string;
}

export interface AnalyzeResponse {
  success: boolean;
  ticketKey?: string;
  extractedText?: string;
  message: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  jira: {
    projectName: '',
    email: '',
    apiToken: '',
    jiraUrl: '',
    issueType: 'Bug',
  },
  groq: {
    apiKey: '',
  },
};
