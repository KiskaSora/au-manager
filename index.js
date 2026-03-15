// ═══════════════════════════════════════════
// AU Manager — точка входа
// ═══════════════════════════════════════════

import { eventSource, event_types } from '../../../../script.js';
import { extension_settings }       from '../../../extensions.js';
import { EXT_NAME }                  from './config.js';
import { getSettings }               from './state.js';
import { updatePromptInjection }     from './prompt.js';
import { syncUI, updateBadge, showMainPopup } from './ui.js';

// ── Инициализация ─────────────────────────────────────────────

function init() {
  // Настройки по умолчанию
  if (!extension_settings[EXT_NAME]) {
    extension_settings[EXT_NAME] = { active_aus: [], enabled: true, custom_aus: [] };
  }
  const s = getSettings();
  if (!s.custom_aus) s.custom_aus = [];

  // Кнопка в меню расширений
  const menuItem = $(`
    <div id="aum-menu-container" class="extension_container interactable" tabindex="0">
      <div id="aum-menu-item" class="list-group-item flex-container flexGap5 interactable" tabindex="0" role="listitem" title="AU Manager">
        <div class="fa-solid fa-masks-theater extensionsMenuExtensionButton"></div>
        <span>AU Manager</span>
        <span id="aum-badge" style="display:none;margin-left:6px;background:var(--SmartThemeQuoteColor,#c084c8);color:#fff;border-radius:8px;padding:0 6px;font-size:0.65rem;font-weight:700;line-height:18px;"></span>
      </div>
    </div>`);

  const menu = $('#extensionsMenu');
  if (menu.length) {
    menu.prepend(menuItem);
    updateBadge();
  } else {
    console.warn('[AU Manager] extensionsMenu not found');
  }

  $(document).on('click', '#aum-menu-item', showMainPopup);

  // Начальная инъекция
  updatePromptInjection();

  console.log('[AU Manager] v2.1 initialized ✓');
}

// ── События ST ────────────────────────────────────────────────

jQuery(() => {
  try {
    init();

    eventSource.on(event_types.MESSAGE_SENT,  () => updatePromptInjection());
    eventSource.on(event_types.CHAT_CHANGED,  () => {
      updatePromptInjection();
      syncUI();
    });

  } catch (e) {
    console.error('[AU Manager] init error:', e);
  }
});
