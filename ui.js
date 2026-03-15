// ═══════════════════════════════════════════
// UI — интерфейс менеджера
// ═══════════════════════════════════════════

import { saveSettingsDebounced } from '../../../../script.js';
import { Popup, POPUP_TYPE } from '../../../popup.js';
import { CATEGORIES } from './config.js';
import {
  getSettings, getFullLibrary, getActiveAUs, countTokens,
  toggleAU, clearAll, saveCustomAU, deleteCustomAU, exportJSON, importJSON,
} from './state.js';
import { updatePromptInjection } from './prompt.js';

// ── Хелперы ────────────────────────────────────────────────────

let currentCat = 'all';

function showToast(msg) {
  let t = document.getElementById('aum-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'aum-toast';
    t.style.cssText = 'position:fixed;bottom:30px;left:50%;transform:translateX(-50%);background:rgba(20,20,20,0.95);color:#ddd;padding:10px 20px;border-radius:6px;font-size:0.8rem;font-family:monospace;z-index:99999999;border:1px solid rgba(255,255,255,0.15);pointer-events:none;transition:opacity 0.3s;white-space:nowrap;max-width:90vw;text-align:center;';
    document.body.appendChild(t);
  }
  t.textContent = msg; t.style.opacity = '1';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
}

function _update() {
  updatePromptInjection();
  syncUI();
}

// ── Публичный sync ─────────────────────────────────────────────

export function syncUI() {
  updateBadge();
  updateTotalTokens();
  const grid = document.getElementById('aum-card-grid');
  if (grid) { renderCards(); renderChips(); }
}

export function updateBadge() {
  const n = getSettings().active_aus.length;
  $('#aum-badge').text(n || '').toggle(n > 0);
}

function updateTotalTokens() {
  const total = getActiveAUs().reduce((s, a) => s + countTokens(a.prompt), 0);
  $('#aum-total-tokens').text(total > 0 ? `~${total} токенов` : '');
}

// ── Попап-справка ──────────────────────────────────────────────

async function showInfoPopup() {
  const html = `<div style="font-family:monospace;max-width:480px;line-height:1.6;color:#ccc;">
    <div style="font-size:1rem;font-weight:700;color:#e0b8e8;margin-bottom:12px;">
      <i class="fa-solid fa-masks-theater"></i> AU Manager — справка
    </div>
    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;">Что такое AU?</b><br>
      AU (Alternate Universe) — промпты с правилами вселенной. Они вставляются в системный промпт, ИИ читает их как часть основных инструкций.
    </div>
    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-toggle-on" style="color:#c084c8"></i> Инъекция</b><br>
      Переключатель вкл/выкл. Когда включено — активные AU добавляются в системный промпт через официальный ST API (setExtensionPrompt).
    </div>
    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-plus"></i> Добавить</b><br>
      Создать собственный AU. Появится в категории «Мои».
    </div>
    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-file-export"></i> Экспорт / <i class="fa-solid fa-file-import"></i> Импорт</b><br>
      Сохранить и загрузить все AU и настройки в файл JSON.
    </div>
    <div style="font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-trash-can"></i> Сброс</b><br>
      Деактивирует все AU (не удаляет — только снимает галочки).
    </div>
  </div>`;
  const popup = new Popup(html, POPUP_TYPE.TEXT, '', { wide: false, large: false });
  await popup.show();
}

// ── HTML попапа ────────────────────────────────────────────────

function buildPopupHTML() {
  return `<div id="aum-modal">
    <div id="aum-head">
      <span id="aum-head-title"><i class="fa-solid fa-masks-theater"></i> AU MANAGER</span>
      <div id="aum-head-right">
        <button id="aum-inject-info" class="aum-head-btn" title="Справка">
          <i class="fa-solid fa-circle-info"></i>
        </button>
        <label class="aum-toggle-label" title="Включить/выключить инъекцию AU">
          <input type="checkbox" id="aum-inject-toggle" ${getSettings().enabled ? 'checked' : ''}>
          <span class="aum-tog ${getSettings().enabled ? 'aum-tog-on' : ''}"></span>
          <span class="aum-inj-label">инъекция</span>
        </label>
        <button id="aum-btn-add" class="aum-head-btn" title="Добавить свой AU"><i class="fa-solid fa-plus"></i></button>
        <button id="aum-btn-export" class="aum-head-btn" title="Экспорт в JSON"><i class="fa-solid fa-file-export"></i></button>
        <button id="aum-btn-import" class="aum-head-btn" title="Импорт из JSON"><i class="fa-solid fa-file-import"></i></button>
        <input type="file" id="aum-import-input" accept=".json" style="display:none">
        <button id="aum-clear" class="aum-head-btn" title="Сбросить активные AU"><i class="fa-solid fa-trash-can"></i></button>
      </div>
    </div>

    <div id="aum-cats">
      ${CATEGORIES.map((c, i) => `
        <button class="aum-cat${i === 0 ? ' aum-cat-on' : ''}" data-cat="${c.id}">
          <i class="fa-solid ${c.icon}"></i><span>${c.label}</span>
        </button>`).join('')}
    </div>

    <div id="aum-card-grid"></div>

    <div id="aum-foot">
      <div id="aum-foot-top">
        <span class="aum-foot-label"><i class="fa-solid fa-circle-check"></i> активно:</span>
        <span id="aum-total-tokens" class="aum-total-tokens"></span>
      </div>
      <div id="aum-chips"></div>
    </div>
  </div>`;
}

// ── Карточки ───────────────────────────────────────────────────

function renderCards() {
  const grid = document.getElementById('aum-card-grid');
  if (!grid) return;
  const { active_aus } = getSettings();
  const lib = getFullLibrary();
  const list = currentCat === 'all'    ? lib
    : currentCat === 'custom' ? lib.filter(a => a.isCustom)
    : lib.filter(a => a.cat === currentCat);

  if (!list.length) {
    grid.innerHTML = '<div class="aum-empty">Нет AU в этой категории.<br>Добавьте свои через кнопку <b>+</b></div>';
    return;
  }

  grid.innerHTML = list.map(au => {
    const on  = active_aus.includes(au.id);
    const cat = CATEGORIES.find(c => c.id === au.cat);
    const tok = countTokens(au.prompt);
    return `<div class="aum-card${on ? ' aum-on' : ''}" data-id="${au.id}">
      <div class="aum-card-top">
        <span class="aum-card-name">${au.name}</span>
        <div class="aum-card-actions">
          <button class="aum-card-btn aum-edit-btn" data-id="${au.id}"><i class="fa-solid fa-pen"></i></button>
          ${au.isCustom ? `<button class="aum-card-btn aum-del-btn" data-id="${au.id}"><i class="fa-solid fa-trash"></i></button>` : ''}
          <button class="aum-card-btn aum-tog-btn${on ? ' aum-tog-on' : ''}" data-id="${au.id}">
            <i class="fa-solid ${on ? 'fa-toggle-on' : 'fa-toggle-off'}"></i>
          </button>
        </div>
      </div>
      <div class="aum-card-cat"><i class="fa-solid ${cat?.icon || 'fa-tag'}"></i> ${cat?.label || au.cat}</div>
      <div class="aum-card-short">${au.short}</div>
      <div class="aum-card-tokens">~${tok} токенов</div>
    </div>`;
  }).join('');

  grid.querySelectorAll('.aum-tog-btn').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); toggleAU(btn.dataset.id, _update); })
  );
  grid.querySelectorAll('.aum-edit-btn').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); openEditor(btn.dataset.id); })
  );
  grid.querySelectorAll('.aum-del-btn').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm(`Удалить «${getFullLibrary().find(a => a.id === btn.dataset.id)?.name}»?`)) {
        deleteCustomAU(btn.dataset.id, _update);
      }
    })
  );
  grid.querySelectorAll('.aum-card').forEach(card =>
    card.addEventListener('click', () => toggleAU(card.dataset.id, _update))
  );
}

// ── Чипы ──────────────────────────────────────────────────────

function renderChips() {
  const wrap = document.getElementById('aum-chips');
  if (!wrap) return;
  const active = getActiveAUs();
  if (!active.length) {
    wrap.innerHTML = '<span class="aum-none">нет активных AU</span>';
    updateTotalTokens();
    return;
  }
  wrap.innerHTML = active.map(au =>
    `<span class="aum-chip">${au.name}<button class="aum-chip-x" data-id="${au.id}"><i class="fa-solid fa-xmark"></i></button></span>`
  ).join('');
  wrap.querySelectorAll('.aum-chip-x').forEach(b =>
    b.addEventListener('click', () => toggleAU(b.dataset.id, _update))
  );
  updateTotalTokens();
}

// ── Редактор AU ────────────────────────────────────────────────

async function openEditor(id) {
  const existing = id ? getFullLibrary().find(a => a.id === id) : null;
  const isNew    = !existing;

  const catOptions = CATEGORIES
    .filter(c => c.id !== 'all' && c.id !== 'custom')
    .map(c => `<option value="${c.id}" ${existing?.cat === c.id ? 'selected' : ''}>${c.label}</option>`)
    .join('');

  const html = `<div class="aum-editor-inner">
    <div class="aum-editor-title">${isNew ? '➕ Новый AU' : '✏️ Редактировать AU'}</div>
    <label>Название</label>
    <input id="aum-ed-name" type="text" autocomplete="off" placeholder="Название AU" value="${existing?.name || ''}">
    <label>Категория</label>
    <select id="aum-ed-cat">${catOptions}</select>
    <label>Краткое описание</label>
    <input id="aum-ed-short" type="text" autocomplete="off" placeholder="для карточки" value="${existing?.short || ''}">
    <label>Промпт для ИИ <span id="aum-ed-tokcount"></span></label>
    <textarea id="aum-ed-prompt" rows="8" placeholder="Текст промпта который получит ИИ...">${existing?.prompt || ''}</textarea>
    ${!isNew && existing?.isCustom ? '<button id="aum-ed-delete" class="aum-btn-danger" style="margin-top:8px;width:100%">🗑 Удалить этот AU</button>' : ''}
  </div>`;

  const editorPopup = new Popup(html, POPUP_TYPE.CONFIRM, '', {
    okButton: 'Сохранить',
    cancelButton: 'Отмена',
    wide: false,
    large: false,
  });

  let nameEl, catEl, shortEl, promptEl;

  requestAnimationFrame(() => {
    nameEl   = document.getElementById('aum-ed-name');
    catEl    = document.getElementById('aum-ed-cat');
    shortEl  = document.getElementById('aum-ed-short');
    promptEl = document.getElementById('aum-ed-prompt');
    const tokEl = document.getElementById('aum-ed-tokcount');

    if (promptEl && tokEl) {
      const updateTok = () => { tokEl.textContent = `~${countTokens(promptEl.value)} токенов`; };
      promptEl.addEventListener('input', updateTok);
      updateTok();
    }
    document.getElementById('aum-ed-delete')?.addEventListener('click', async () => {
      editorPopup.completeCancelled();
      if (confirm(`Удалить «${existing.name}»?`)) { deleteCustomAU(existing.id, _update); showToast('✓ Удалено'); }
    });
  });

  const result = await editorPopup.show();
  if (!result) return;

  const name   = nameEl?.value?.trim()   || '';
  const cat    = catEl?.value            || 'other';
  const short  = shortEl?.value?.trim()  || '';
  const prompt = promptEl?.value?.trim() || '';

  if (!name || !prompt) { showToast('Заполни название и промпт'); return; }
  const newId = existing?.id || `custom_${Date.now()}`;
  saveCustomAU({ id: newId, cat, name, short, prompt, isCustom: true }, _update);
  showToast('✓ Сохранено');
  renderCards();
  renderChips();
}

// ── Главный попап ──────────────────────────────────────────────

let currentPopup = null;

export async function showMainPopup() {
  currentPopup = new Popup(buildPopupHTML(), POPUP_TYPE.TEXT, '', {
    wide: true,
    large: false,
    allowVerticalScrolling: true,
  });

  requestAnimationFrame(() => {
    renderCards();
    renderChips();
    updateTotalTokens();

    document.getElementById('aum-clear')?.addEventListener('click', () => clearAll(_update));
    document.getElementById('aum-btn-add')?.addEventListener('click', () => openEditor(null));
    document.getElementById('aum-btn-export')?.addEventListener('click', () => exportJSON());
    document.getElementById('aum-btn-import')?.addEventListener('click', () => {
      document.getElementById('aum-import-input')?.click();
    });
    document.getElementById('aum-inject-toggle')?.addEventListener('change', e => {
      getSettings().enabled = e.target.checked;
      e.target.nextElementSibling?.classList.toggle('aum-tog-on', e.target.checked);
      saveSettingsDebounced();
      updatePromptInjection();
    });
    document.getElementById('aum-inject-info')?.addEventListener('click', showInfoPopup);
    document.getElementById('aum-import-input')?.addEventListener('change', e => {
      if (e.target.files[0]) importJSON(e.target.files[0], _update, showToast);
      e.target.value = '';
    });
    document.querySelectorAll('.aum-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.aum-cat').forEach(b => b.classList.remove('aum-cat-on'));
        btn.classList.add('aum-cat-on');
        currentCat = btn.dataset.cat;
        renderCards();
      });
    });
  });

  await currentPopup.show();
  currentPopup = null;
}
