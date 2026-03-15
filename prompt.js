// ═══════════════════════════════════════════
// PROMPT — сборка и инъекция промта
// ═══════════════════════════════════════════

import { setExtensionPrompt, extension_prompt_types } from '../../../../script.js';
import { PROMPT_KEY } from './config.js';
import { getSettings, getActiveAUs } from './state.js';

export function buildAUPrompt() {
  const s = getSettings();
  if (!s.enabled) return '';
  const active = getActiveAUs();
  if (!active.length) return '';

  const names = active.map(a => a.name).join(', ');
  const body  = active.map(a => a.prompt).join('\n\n');

  return `[ПРАВИЛА МИРА — активные АУ: ${names}]
Эта история разворачивается в альтернативной вселенной. Все правила ниже действуют как физика, биология и социальные нормы этого мира. Применяй их последовательно в каждом ответе без исключений.

${body}

[Конец правил мира. Всё вышеперечисленное — обязательный фундамент этой истории.]`;
}

export function updatePromptInjection() {
  try {
    setExtensionPrompt(PROMPT_KEY, buildAUPrompt(), extension_prompt_types.IN_CHAT, 0);
  } catch (e) {
    console.warn('[AU Manager] prompt injection error:', e);
  }
}
