/**
 * Text processing utilities for caption display and timing
 */

/**
 * Splits text into sentences (for paragraph structure)
 */
export function splitIntoSentences(script: string): string[] {
  const sentences = script
    .split(/(?<=[.!?])\s+/)
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);
  
  return sentences;
}

/**
 * Splits text into clauses for highlighting timing
 */
export function splitIntoClauses(script: string): string[] {
  const clauses = script
    .split(/(?<=[!:;,.?])\s+/)
    .map(clause => clause.trim())
    .filter(clause => clause.length > 0);
  
  return clauses;
}

/**
 * Gets clauses for a specific sentence
 */
export function getClausesForSentence(sentence: string): string[] {
  const clauses = sentence
    .split(/(?<=[!:;,.?])\s+/)
    .map(clause => clause.trim())
    .filter(clause => clause.length > 0);
  
  return clauses;
}

/**
 * Calculates timing for each clause based on character count
 */
export function calculateClauseTimings(clauses: string[], duration: number): number[] {
  const timings: number[] = [];
  
  // Calculate weight for each clause based on character count
  const weights: number[] = clauses.map((clause) => {
    return Math.max(clause.length, 10); // Minimum weight
  });
  
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  
  // Distribute time proportionally based on weights
  let currentTime = 0;
  for (let i = 0; i < clauses.length; i++) {
    timings.push(currentTime);
    const clauseDuration = (weights[i] / totalWeight) * duration;
    currentTime += clauseDuration;
  }
  
  return timings;
}

