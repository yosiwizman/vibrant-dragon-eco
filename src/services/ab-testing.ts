"use client";

// A/B Testing Framework
// Enables feature experimentation and optimization

interface Experiment {
  id: string;
  name: string;
  description: string;
  variants: Variant[];
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: number;
  endDate?: number;
  targetPercentage: number;
  metrics: string[];
  results?: ExperimentResults;
}

interface Variant {
  id: string;
  name: string;
  weight: number; // 0-100, must sum to 100 across all variants
  config: Record<string, any>;
}

interface ExperimentResults {
  totalParticipants: number;
  variantResults: Record<string, VariantResult>;
  winner?: string;
  confidence: number;
}

interface VariantResult {
  participants: number;
  conversions: number;
  conversionRate: number;
  metrics: Record<string, number>;
}

interface UserAssignment {
  experimentId: string;
  variantId: string;
  assignedAt: number;
}

class ABTestingService {
  private experiments: Map<string, Experiment> = new Map();
  private userAssignments: Map<string, UserAssignment[]> = new Map();
  private conversions: Map<string, { experimentId: string; variantId: string; metric: string; value: number; timestamp: number }[]> = new Map();
  private userId: string = '';

  initialize(userId: string): void {
    this.userId = userId;
    this.loadAssignments();
    console.log('[ab-testing] Initialized for user:', userId);
  }

  private loadAssignments(): void {
    try {
      const stored = localStorage.getItem(`ab_assignments_${this.userId}`);
      if (stored) {
        const assignments = JSON.parse(stored);
        this.userAssignments.set(this.userId, assignments);
      }
    } catch (error) {
      console.error('[ab-testing] Failed to load assignments:', error);
    }
  }

  private saveAssignments(): void {
    try {
      const assignments = this.userAssignments.get(this.userId) || [];
      localStorage.setItem(`ab_assignments_${this.userId}`, JSON.stringify(assignments));
    } catch (error) {
      console.error('[ab-testing] Failed to save assignments:', error);
    }
  }

  createExperiment(experiment: Omit<Experiment, 'status' | 'results'>): Experiment {
    const newExperiment: Experiment = {
      ...experiment,
      status: 'draft'
    };
    
    // Validate variant weights sum to 100
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    if (totalWeight !== 100) {
      throw new Error('Variant weights must sum to 100');
    }
    
    this.experiments.set(experiment.id, newExperiment);
    console.log('[ab-testing] Created experiment:', experiment.name);
    
    return newExperiment;
  }

  startExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }
    
    experiment.status = 'running';
    experiment.startDate = Date.now();
    
    console.log('[ab-testing] Started experiment:', experiment.name);
  }

  pauseExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;
    
    experiment.status = 'paused';
    console.log('[ab-testing] Paused experiment:', experiment.name);
  }

  completeExperiment(experimentId: string): void {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return;
    
    experiment.status = 'completed';
    experiment.endDate = Date.now();
    experiment.results = this.calculateResults(experimentId);
    
    console.log('[ab-testing] Completed experiment:', experiment.name);
  }

  getVariant(experimentId: string): Variant | null {
    const experiment = this.experiments.get(experimentId);
    if (!experiment || experiment.status !== 'running') {
      return null;
    }
    
    // Check if user is already assigned
    const assignments = this.userAssignments.get(this.userId) || [];
    const existingAssignment = assignments.find(a => a.experimentId === experimentId);
    
    if (existingAssignment) {
      return experiment.variants.find(v => v.id === existingAssignment.variantId) || null;
    }
    
    // Check if user should be in experiment (based on target percentage)
    const userHash = this.hashUserId(this.userId + experimentId);
    if (userHash > experiment.targetPercentage) {
      return null; // User not in experiment
    }
    
    // Assign user to variant based on weights
    const variant = this.selectVariant(experiment.variants, userHash);
    
    // Save assignment
    assignments.push({
      experimentId,
      variantId: variant.id,
      assignedAt: Date.now()
    });
    this.userAssignments.set(this.userId, assignments);
    this.saveAssignments();
    
    console.log('[ab-testing] Assigned user to variant:', variant.name);
    
    return variant;
  }

  private hashUserId(input: string): number {
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash % 100);
  }

  private selectVariant(variants: Variant[], hash: number): Variant {
    let cumulative = 0;
    const normalizedHash = hash % 100;
    
    for (const variant of variants) {
      cumulative += variant.weight;
      if (normalizedHash < cumulative) {
        return variant;
      }
    }
    
    return variants[variants.length - 1];
  }

  trackConversion(experimentId: string, metric: string, value: number = 1): void {
    const assignments = this.userAssignments.get(this.userId) || [];
    const assignment = assignments.find(a => a.experimentId === experimentId);
    
    if (!assignment) {
      console.log('[ab-testing] User not in experiment, skipping conversion');
      return;
    }
    
    const userConversions = this.conversions.get(this.userId) || [];
    userConversions.push({
      experimentId,
      variantId: assignment.variantId,
      metric,
      value,
      timestamp: Date.now()
    });
    this.conversions.set(this.userId, userConversions);
    
    console.log('[ab-testing] Tracked conversion:', { experimentId, metric, value });
  }

  private calculateResults(experimentId: string): ExperimentResults {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      return { totalParticipants: 0, variantResults: {}, confidence: 0 };
    }
    
    const variantResults: Record<string, VariantResult> = {};
    let totalParticipants = 0;
    
    // Initialize results for each variant
    experiment.variants.forEach(variant => {
      variantResults[variant.id] = {
        participants: 0,
        conversions: 0,
        conversionRate: 0,
        metrics: {}
      };
    });
    
    // Count participants and conversions
    this.userAssignments.forEach((assignments, userId) => {
      const assignment = assignments.find(a => a.experimentId === experimentId);
      if (assignment) {
        totalParticipants++;
        variantResults[assignment.variantId].participants++;
        
        // Count conversions
        const userConversions = this.conversions.get(userId) || [];
        const experimentConversions = userConversions.filter(c => c.experimentId === experimentId);
        
        if (experimentConversions.length > 0) {
          variantResults[assignment.variantId].conversions++;
          
          // Aggregate metrics
          experimentConversions.forEach(c => {
            const current = variantResults[assignment.variantId].metrics[c.metric] || 0;
            variantResults[assignment.variantId].metrics[c.metric] = current + c.value;
          });
        }
      }
    });
    
    // Calculate conversion rates
    Object.values(variantResults).forEach(result => {
      result.conversionRate = result.participants > 0 
        ? (result.conversions / result.participants) * 100 
        : 0;
    });
    
    // Determine winner (simple comparison for now)
    let winner: string | undefined;
    let highestRate = 0;
    
    Object.entries(variantResults).forEach(([variantId, result]) => {
      if (result.conversionRate > highestRate) {
        highestRate = result.conversionRate;
        winner = variantId;
      }
    });
    
    // Calculate confidence (simplified)
    const confidence = totalParticipants > 100 ? 95 : totalParticipants > 50 ? 80 : 60;
    
    return {
      totalParticipants,
      variantResults,
      winner,
      confidence
    };
  }

  getExperiment(experimentId: string): Experiment | undefined {
    return this.experiments.get(experimentId);
  }

  getAllExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  getRunningExperiments(): Experiment[] {
    return this.getAllExperiments().filter(e => e.status === 'running');
  }

  // Pre-built experiments for Echo
  setupDefaultExperiments(): void {
    // Voice UI experiment
    this.createExperiment({
      id: 'voice-ui-style',
      name: 'Voice UI Style',
      description: 'Test different voice button styles',
      variants: [
        { id: 'control', name: 'Current Design', weight: 50, config: { style: 'current' } },
        { id: 'minimal', name: 'Minimal Design', weight: 50, config: { style: 'minimal' } }
      ],
      targetPercentage: 100,
      metrics: ['voice_activation', 'session_duration', 'task_completion']
    });
    
    // Onboarding flow experiment
    this.createExperiment({
      id: 'onboarding-flow',
      name: 'Onboarding Flow',
      description: 'Test different onboarding experiences',
      variants: [
        { id: 'guided', name: 'Guided Tour', weight: 33, config: { type: 'guided' } },
        { id: 'video', name: 'Video Tutorial', weight: 33, config: { type: 'video' } },
        { id: 'interactive', name: 'Interactive Demo', weight: 34, config: { type: 'interactive' } }
      ],
      targetPercentage: 100,
      metrics: ['onboarding_completion', 'first_task_created', 'day_7_retention']
    });
    
    // Widget layout experiment
    this.createExperiment({
      id: 'widget-layout',
      name: 'Widget Layout',
      description: 'Test different default widget layouts',
      variants: [
        { id: 'compact', name: 'Compact Layout', weight: 50, config: { layout: 'compact' } },
        { id: 'spacious', name: 'Spacious Layout', weight: 50, config: { layout: 'spacious' } }
      ],
      targetPercentage: 50,
      metrics: ['widget_interactions', 'customization_rate', 'satisfaction_score']
    });
    
    console.log('[ab-testing] Default experiments created');
  }
}

export const abTesting = new ABTestingService();