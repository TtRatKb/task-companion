import type { TaskTemplate } from './types';

/**
 * Reusable plain-text variables: {Fach}, {Klasse}, {Thema} or any
 * similarly named custom field. Matching is case-sensitive; replacement
 * values are inserted literally (no second parsing pass).
 */
const placeholderPattern = /\{([\p{L}_][\p{L}\p{N}_-]{0,39})\}/gu;

export function extractTemplatePlaceholders(template: Pick<TaskTemplate, 'name' | 'description' | 'steps'>): string[] {
  const found = new Set<string>();
  for (const text of [template.name, template.description, ...template.steps]) {
    for (const match of text.matchAll(placeholderPattern)) {
      // Reserved schedule anchor, not a question about a task variable.
      if (match[1] !== 'Deadline') found.add(match[1]);
    }
  }
  return [...found];
}

export function fillTemplateText(text: string, values: Readonly<Record<string, string>>): string {
  return text.replace(placeholderPattern, (full, name: string) =>
    name !== 'Deadline' && typeof values[name] === 'string' && values[name].trim() ? values[name].trim() : full);
}

export function expandTaskTemplate(
  template: TaskTemplate, values: Readonly<Record<string, string>>
): TaskTemplate {
  const missing = extractTemplatePlaceholders(template).filter(name => !values[name]?.trim());
  if (missing.length) throw new Error('Fehlende Angaben: ' + missing.join(', '));
  return {
    ...template,
    name: fillTemplateText(template.name, values),
    description: fillTemplateText(template.description, values),
    steps: template.steps.map(step => fillTemplateText(step, values))
  };
}
