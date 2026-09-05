export const taskGenerationSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    tasks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          estimatedHours: { type: 'number' },
          storyPoints: { type: 'integer' },
          labels: { type: 'array', items: { type: 'string' } },
          dependencies: { type: 'array', items: { type: 'string' } }
        },
        required: ['title', 'description', 'priority', 'estimatedHours', 'storyPoints', 'labels', 'dependencies']
      }
    }
  },
  required: ['summary', 'tasks']
};

export const sprintRiskSchema = {
  type: 'object',
  properties: {
    riskLevel: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
    riskScore: { type: 'integer' },
    summary: { type: 'string' },
    reasons: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } }
  },
  required: ['riskLevel', 'riskScore', 'summary', 'reasons', 'recommendations']
};

export const assignmentSchema = {
  type: 'object',
  properties: {
    recommendations: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          score: { type: 'integer' },
          reason: { type: 'string' },
          currentWorkload: { type: 'integer' }
        },
        required: ['userId', 'score', 'reason', 'currentWorkload']
      }
    },
    recommendedUserId: { type: 'string' },
    summary: { type: 'string' }
  },
  required: ['recommendations', 'recommendedUserId', 'summary']
};

export const bugPrioritizationSchema = {
  type: 'object',
  properties: {
    recommendedSeverity: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
    recommendedPriority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
    confidence: { type: 'integer' },
    summary: { type: 'string' },
    reasoning: { type: 'array', items: { type: 'string' } },
    recommendedActions: { type: 'array', items: { type: 'string' } }
  },
  required: ['recommendedSeverity', 'recommendedPriority', 'confidence', 'summary', 'reasoning', 'recommendedActions']
};

export const projectHealthSchema = {
  type: 'object',
  properties: {
    healthScore: { type: 'integer' },
    healthStatus: { type: 'string', enum: ['Healthy', 'Watch', 'At Risk', 'Critical'] },
    summary: { type: 'string' },
    strengths: { type: 'array', items: { type: 'string' } },
    risks: { type: 'array', items: { type: 'string' } },
    recommendations: { type: 'array', items: { type: 'string' } }
  },
  required: ['healthScore', 'healthStatus', 'summary', 'strengths', 'risks', 'recommendations']
};

export const meetingSchema = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    decisions: { type: 'array', items: { type: 'string' } },
    actionItems: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          ownerName: { type: 'string' },
          priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Critical'] },
          dueDate: { type: 'string' }
        },
        required: ['title', 'ownerName', 'priority', 'dueDate']
      }
    },
    followUps: { type: 'array', items: { type: 'string' } }
  },
  required: ['summary', 'decisions', 'actionItems', 'followUps']
};

export const releaseNotesSchema = {
  type: 'object',
  properties: {
    title: { type: 'string' },
    summary: { type: 'string' },
    newFeatures: { type: 'array', items: { type: 'string' } },
    bugFixes: { type: 'array', items: { type: 'string' } },
    improvements: { type: 'array', items: { type: 'string' } },
    knownIssues: { type: 'array', items: { type: 'string' } }
  },
  required: ['title', 'summary', 'newFeatures', 'bugFixes', 'improvements', 'knownIssues']
};

export const assistantSchema = {
  type: 'object',
  properties: {
    answer: { type: 'string' },
    keyPoints: { type: 'array', items: { type: 'string' } },
    suggestedActions: { type: 'array', items: { type: 'string' } }
  },
  required: ['answer', 'keyPoints', 'suggestedActions']
};
