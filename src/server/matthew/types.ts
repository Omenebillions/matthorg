export interface MatthewChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  name?: string;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface MatthewToolDefinition {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface MatthewCitation {
  type: 'lead' | 'deal' | 'invoice' | 'customer' | 'metric' | 'marketplace';
  title: string;
  detail?: string;
  id?: string;
}

export interface MatthewChatRequest {
  message: string;
  history?: MatthewChatMessage[];
  businessId: string;
  clientContext?: {
    businessName?: string;
    industry?: string;
    specialization?: string;
    currency?: string;
    userPlan?: string;
    leadsCount?: number;
    quotesCount?: number;
    invoicesCount?: number;
    customersCount?: number;
  };
  clientFallbackData?: {
    business?: any;
    leads?: any[];
    quotes?: any[];
    invoices?: any[];
    customers?: any[];
    payments?: any[];
    requests?: any[];
  };
}

export interface MatthewChatResponse {
  success: boolean;
  message: string;
  model: string;
  engine: 'openai' | 'gemini';
  tool_calls_executed: string[];
  citations: MatthewCitation[];
  is_out_of_domain?: boolean;
}
