export const TOOL_DEFINITIONS = [
  {
    type: 'function' as const,
    function: {
      name: 'request_human_input',
      description:
        'Ask the human user a clarifying question when you need more information to proceed. This will pause your execution until the user responds.',
      parameters: {
        type: 'object',
        properties: {
          question: {
            type: 'string',
            description: 'The question to ask the user',
          },
          context: {
            type: 'string',
            description: 'Why you need this information',
          },
        },
        required: ['question'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'save_finding',
      description:
        'Record a research finding for later synthesis. Use this to save important discoveries as you research.',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Brief summary of the finding',
          },
          detail: {
            type: 'string',
            description: 'Detailed explanation',
          },
          sources: {
            type: 'array',
            items: { type: 'string' },
            description: 'Source URLs if any',
          },
          confidence: {
            type: 'string',
            enum: ['low', 'medium', 'high'],
            description: 'How confident you are in this finding',
          },
        },
        required: ['summary', 'detail'],
      },
    },
  },
  {
    type: 'function' as const,
    function: {
      name: 'mark_complete',
      description:
        'Signal that you have completed the task and your response contains the final result. Call this when you are done.',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'A one-sentence summary of what you produced',
          },
        },
        required: ['summary'],
      },
    },
  },
];
