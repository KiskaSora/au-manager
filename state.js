// ═══════════════════════════════════════════
// STATE — настройки и управление библиотекой
// ═══════════════════════════════════════════

import { extension_settings } from '../../../extensions.js';
import { saveSettingsDebounced } from '../../../../script.js';
import { EXT_NAME } from './config.js';
import { DYNAMICS_AUS } from './library/dynamics.js';
import { BONDS_AUS }    from './library/bonds.js';
import { SETTING_AUS }  from './library/setting.js';
import { TROPE_AUS }    from './library/trope.js';
import { FANTASY_AUS }  from './library/fantasy.js';
import { OTHER_AUS }    from './library/other.js';

export const BUILTIN_LIBRARY = [
  ...DYNAMICS_AUS,
  ...BONDS_AUS,
  ...SETTING_AUS,
  ...TROPE_AUS,
  ...FANTASY_AUS,
  ...OTHER_AUS,
];

export function countTokens(text) {
  return Math.ceil((text || '').length / 4);
}

export function getSettings() {
  if (!extension_settings[EXT_NAME]) {
    extension_settings[EXT_NAME] = { active_aus: [], enabled: true, custom_aus: [] };
  }
  if (!extension_settings[EXT_NAME].custom_aus) {
    extension_settings[EXT_NAME].custom_aus = [];
  }
  return extension_settings[EXT_NAME];
}

export function getFullLibrary() {
  const custom = getSettings().custom_aus.map(a => ({ ...a, isCustom: true }));
  return [...BUILTIN_LIBRARY, ...custom];
}

export function getActiveAUs() {
  return getFullLibrary().filter(a => getSettings().active_aus.includes(a.id));
}

export function toggleAU(id, updateFn) {
  const s = getSettings();
  const idx = s.active_aus.indexOf(id);
  if (idx === -1) s.active_aus.push(id);
  else s.active_aus.splice(idx, 1);
  saveSettingsDebounced();
  updateFn?.();
}

export function clearAll(updateFn) {
  getSettings().active_aus = [];
  saveSettingsDebounced();
  updateFn?.();
}

export function saveCustomAU(data, updateFn) {
  const s = getSettings();
  const idx = s.custom_aus.findIndex(a => a.id === data.id);
  if (idx === -1) s.custom_aus.push(data);
  else s.custom_aus[idx] = data;
  saveSettingsDebounced();
  updateFn?.();
}

export function deleteCustomAU(id, updateFn) {
  const s = getSettings();
  s.custom_aus = s.custom_aus.filter(a => a.id !== id);
  s.active_aus = s.active_aus.filter(aid => aid !== id);
  saveSettingsDebounced();
  updateFn?.();
}

export function exportJSON() {
  const s = getSettings();
  const data = { version: 2, active_aus: s.active_aus, custom_aus: s.custom_aus, enabled: s.enabled };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = 'au_manager_export.json'; a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
}

export function importJSON(file, updateFn, toastFn) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const s = getSettings();
      if (Array.isArray(data.custom_aus)) {
        const existingIds = new Set(s.custom_aus.map(a => a.id));
        data.custom_aus.forEach(au => {
          if (existingIds.has(au.id)) {
            const idx = s.custom_aus.findIndex(a => a.id === au.id);
            s.custom_aus[idx] = au;
          } else {
            s.custom_aus.push(au);
          }
        });
      }
      if (Array.isArray(data.active_aus)) s.active_aus = data.active_aus;
      if (typeof data.enabled === 'boolean') s.enabled = data.enabled;
      saveSettingsDebounced();
      updateFn?.();
      toastFn?.('✓ Импорт выполнен');
    } catch { toastFn?.('✗ Ошибка: невалидный JSON'); }
  };
  reader.readAsText(file);
}
