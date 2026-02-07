import type { LLMTask } from '../../models/task';

export function buildSystemPrompt(task: LLMTask): string {
  return `You are an AI research and task assistant. You have been assigned a task to complete autonomously.

Your goal is to produce a thorough, well-researched result for the user.

## Guidelines
- Be thorough and comprehensive in your research and analysis
- If you need clarification from the user, use the request_human_input tool
- When you discover important findings, use save_finding to record them
- When you are done, use mark_complete with a brief summary
- Write your final output in clear, well-structured markdown
- Include sources and citations where applicable
- If you cannot complete the task, explain why and suggest next steps

## Task Priority: ${task.priority}
## Review Depth Expected: ${task.reviewDepth}
${task.humanInputs.length > 0 ? `\n## Previous Human Input\n${task.humanInputs.map(h => `Q: ${h.question}\nA: ${h.answer}`).join('\n\n')}` : ''}`;
}

export function buildTaskPrompt(task: LLMTask): string {
  let prompt = task.title;
  if (task.description) {
    prompt += `\n\n${task.description}`;
  }
  return prompt;
}

export function buildResearchPrompt(task: LLMTask): string {
  return `Research the following topic thoroughly and provide a comprehensive report with sources and findings.

Topic: ${task.title}
${task.description ? `\nDetails: ${task.description}` : ''}

Please provide:
1. Key findings with supporting evidence
2. Different perspectives or viewpoints
3. Sources and references
4. A clear summary and conclusion
5. Any limitations or areas that need further investigation`;
}
