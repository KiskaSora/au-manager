// ═══════════════════════════════════════════════════════════
//  AU Manager — SillyTavern Extension v2.0
//  Использует нативный Popup ST (как MemoryBooks) — работает
//  и на десктопе, и на мобильном без велосипедов.
// ═══════════════════════════════════════════════════════════

import { extension_settings } from '../../../extensions.js';
import { eventSource, event_types, saveSettingsDebounced } from '../../../../script.js';
import { Popup, POPUP_TYPE } from '../../../popup.js';

const EXT_NAME = 'au_manager';
console.log('[AU Manager] v2.0 loading...');

function countTokens(text) {
  return Math.ceil((text || '').length / 4);
}

const CATEGORIES = [
  { id: 'all',      label: 'Все',      icon: 'fa-border-all'     },
  { id: 'dynamics', label: 'Динамики', icon: 'fa-arrows-up-down' },
  { id: 'bonds',    label: 'Связи',    icon: 'fa-link'           },
  { id: 'setting',  label: 'Сеттинг',  icon: 'fa-location-dot'   },
  { id: 'trope',    label: 'Тропы',    icon: 'fa-shuffle'        },
  { id: 'fantasy',  label: 'Фэнтези',  icon: 'fa-wand-sparkles'  },
  { id: 'other',    label: 'Прочее',   icon: 'fa-ellipsis'       },
  { id: 'custom',   label: 'Мои',      icon: 'fa-star'           },
];

const BUILTIN_LIBRARY = [
  { id: 'omegaverse', cat: 'dynamics', name: 'Омегаверс', short: 'A/B/O, феромоны, иерархия, метки',
    prompt: `[AU — Omegaverse/A-B-O: A secondary biological sex system exists. Alphas: dominant, pheromone-emitting, rut cycles, capable of bonding bites that create permanent claims. Betas: neutral baseline. Omegas: heat cycles, heightened instincts and emotional sensitivity, can be marked/claimed. All retain full personal agency. Scent is the primary channel for emotion, attraction, and social signaling.]` },
  { id: 'pack', cat: 'dynamics', name: 'Пак-динамика', short: 'пак, стая, защита, принятие',
    prompt: `[AU — Pack Dynamics: Characters form and operate within packs — chosen family units governed by fierce protective instinct and hierarchy. Bonds are physical as well as emotional: pack members sense each other's distress, share comfort through proximity, and feel each other's absence like a wound.]` },
  { id: 'vampire_hierarchy', cat: 'dynamics', name: 'Вампирская иерархия', short: 'творец–птенец, кровь, подчинение, возраст',
    prompt: `[AU — Vampire Hierarchy: Vampires exist in a strict hierarchy defined by age and bloodline. Sires have deep instinctual authority over their fledglings. Blood is currency, intimacy, and power simultaneously. Drinking is vulnerable for both parties.]` },
  { id: 'soulmate_words', cat: 'bonds', name: 'Соулмейты: первые слова', short: 'слова соулмейта на коже с рождения',
    prompt: `[AU — Soulmates (First Words): Every person is born with the first words their soulmate will ever speak to them written somewhere on their skin. The moment of recognition — hearing your words spoken aloud — is physically overwhelming.]` },
  { id: 'soulmate_timer', cat: 'bonds', name: 'Соулмейты: таймер', short: 'обратный отсчёт на запястье до встречи',
    prompt: `[AU — Soulmates (Countdown Timer): A numerical timer is inscribed on each person's inner wrist, counting down to the exact moment they will first meet their soulmate. At zero it becomes a clock measuring how long they've known each other.]` },
  { id: 'soulmate_marks', cat: 'bonds', name: 'Соулмейты: метка', short: 'уникальный знак, зеркальный у партнёра',
    prompt: `[AU — Soulmates (Matching Marks): Each person bears a unique mark mirrored exactly on their soulmate. First skin-to-skin contact between matched pairs produces a sensation of warmth and rightness that is unmistakable.]` },
  { id: 'soulmate_dreams', cat: 'bonds', name: 'Соулмейты: общие сны', short: 'одно пространство снов, другая жизнь',
    prompt: `[AU — Soulmates (Shared Dreamspace): Soulmates share a private dream dimension from early childhood. Neither knows the other's real identity. When they finally meet in waking life the recognition is violent in its certainty.]` },
  { id: 'telepathic', cat: 'bonds', name: 'Телепатическая связь', short: 'ментальный канал, чувства, мысли',
    prompt: `[AU — Telepathic Bond: The characters share an involuntary mental link. Baseline: shared emotional state bleeds through. Peak: full thoughts, sensory overlap, impossible privacy. The link cannot be closed by will.]` },
  { id: 'red_string', cat: 'bonds', name: 'Красная нить', short: 'судьба видима, нить нельзя разорвать',
    prompt: `[AU — Red String of Fate: A red thread connects destined individuals — visible to those with the gift to see them. It cannot be cut permanently. Fate creates the connection; the people involved must choose what to do with it.]` },
  { id: 'hogwarts', cat: 'setting', name: 'Хогвартс / Магшкола', short: 'магическая академия, факультеты, тайны',
    prompt: `[AU — Magical Academy: Characters attend a residential school for magic. Students are sorted into houses that create lifelong alliances and rivalries. Magic is emotional — it responds to inner states, amplifies what's repressed, misbehaves under stress.]` },
  { id: 'royalty', cat: 'setting', name: 'Роялти', short: 'дворец, политика, долг против желания',
    prompt: `[AU — Royalty/Court: Characters exist in a world of monarchy and court politics. Rank is immutable; bloodline determines fate. The palace is simultaneously a gilded cage and a stage. Duty and personal desire are in direct, constant conflict.]` },
  { id: 'coffee_shop', cat: 'setting', name: 'Кофейня', short: 'уютный быт, знакомые заказы, близость',
    prompt: `[AU — Coffee Shop: The story is grounded in a coffee shop. The rhythm is domestic and slow: regulars, memorized orders, small rituals of recognition that accumulate into something.]` },
  { id: 'college', cat: 'setting', name: 'Колледж / Университет', short: 'учёба, общага, взросление, интенсивность',
    prompt: `[AU — College/University: Characters are students navigating academic pressure, dormitory proximity, part-time jobs, late nights. Everything feels simultaneously urgent and provisional. Identity is in active formation.]` },
  { id: 'mafia', cat: 'setting', name: 'Мафия / Криминальный мир', short: 'лояльность, власть, предательство',
    prompt: `[AU — Mafia/Organized Crime: Loyalty is the supreme virtue; betrayal the gravest sin. Violence is practical, not aberrant. The strange intimacy of shared danger and shared secrets creates bonds that are almost impossible to break.]` },
  { id: 'spy', cat: 'setting', name: 'Шпионы / Разведка', short: 'прикрытие, двойные агенты, что правда',
    prompt: `[AU — Spy/Intelligence: Characters are operatives — identities are constructed, loyalties tested, truth always layered. Cover stories require performance of intimacy. Real feelings become entangled with performed ones.]` },
  { id: 'small_town', cat: 'setting', name: 'Маленький город', short: 'все всё знают, история не уходит',
    prompt: `[AU — Small Town: Everyone knows everyone's history. Privacy is structural impossibility. Old reputations stick. Returning characters must reckon with who they were versus who they've become.]` },
  { id: 'fake_dating', cat: 'trope', name: 'Фейк-дейтинг', short: 'притворяемся парой → перестаём понимать',
    prompt: `[AU — Fake Dating: The characters are performing a romantic relationship for external reasons. The longer they perform, the less certain the distinction becomes. The moment the arrangement could end becomes the moment neither wants it to.]` },
  { id: 'forced_proximity', cat: 'trope', name: 'Вынужденное соседство', short: 'один дом, не сбежать, стены падают',
    prompt: `[AU — Forced Proximity: External circumstances trap the characters together. The inability to retreat strips social armor. The tension of being unable to leave amplifies everything: irritation, tenderness, attraction.]` },
  { id: 'enemies_to_lovers', cat: 'trope', name: 'Враги → Любовники', short: 'настоящая антагония, настоящее признание',
    prompt: `[AU — Enemies to Lovers: The characters begin in genuine antagonism. The shift is earned through accumulated moments of forced cooperation, unwilling respect, and vulnerability that cannot be unshared.]` },
  { id: 'bodyguard', cat: 'trope', name: 'Телохранитель', short: 'защита, профессиональная дистанция, невозможно',
    prompt: `[AU — Bodyguard: One character is employed to protect the other. Professional distance is the explicit rule and the constant challenge. That hyperawareness bleeds inevitably into hyperawareness of everything else.]` },
  { id: 'found_family', cat: 'trope', name: 'Случайная семья', short: 'не рождённые вместе, но выбравшие друг друга',
    prompt: `[AU — Found Family: A group of people not bound by blood become family through accumulated shared hardship and chosen loyalty. The bond is harder and fiercer for being chosen rather than assumed.]` },
  { id: 'amnesia', cat: 'trope', name: 'Амнезия', short: 'потеря памяти — чужой в своём прошлом',
    prompt: `[AU — Amnesia: One character has lost memory of themselves, their relationships, their history. Whether lost love can be rebuilt without its foundation is the central question.]` },
  { id: 'slowburn', cat: 'trope', name: 'Слоуберн', short: 'медленно, накопленное, долго ждать',
    prompt: `[Narrative focus — Slow Burn: Emotional and romantic development should be gradual, accumulating through small moments. Desire exists long before it is acknowledged. The eventual resolution should feel both inevitable and hard-won.]` },
  { id: 'vampires', cat: 'fantasy', name: 'Вампиры', short: 'бессмертие, кровь, человечность и её потеря',
    prompt: `[AU — Vampires: One or more characters are vampires — immortal, feeding on blood, supernaturally strong. Blood-drinking is intimate, pleasurable, and dangerous for both parties. Being turned is irreversible.]` },
  { id: 'werewolves', cat: 'fantasy', name: 'Оборотни', short: 'трансформация, инстинкт, стая, луна',
    prompt: `[AU — Werewolves: One or more characters are werewolves. In human form: heightened senses read the room like an open book. Pack loyalty is instinctual and nearly unconditional.]` },
  { id: 'fae', cat: 'fantasy', name: 'Фэйри / Двор', short: 'контракты, ложь через правду, дворы',
    prompt: `[AU — Fae/Fairy Court: Fae cannot lie outright but deceive constantly. They are absolutely bound by their given word and by bargains struck. True names carry power; gifts create debt; iron and salt harm them.]` },
  { id: 'witches', cat: 'fantasy', name: 'Ведьмы и Маги', short: 'заклинания, цена, эмоции усиливают магию',
    prompt: `[AU — Witches and Magic Users: Magic is real and practiced through various disciplines. All magic has cost and limitation. Magic reflects and amplifies emotional state — strong uncontrolled emotion is dangerous.]` },
  { id: 'angels_demons', cat: 'fantasy', name: 'Ангелы и Демоны', short: 'два лагеря, падение, запретное',
    prompt: `[AU — Angels and Demons: Heaven and Hell are real, distinct factions with their own bureaucracies and hypocrisies. Love between opposing factions is both forbidden and inevitable.]` },
  { id: 'space_opera', cat: 'other', name: 'Космос / Space Opera', short: 'корабли, системы, расстояния имеют вес',
    prompt: `[AU — Space Opera: Humanity spans multiple star systems. Ships are homes; crews are family forged by proximity and shared risk. Vast distances make communication and reunion meaningful in ways ground-bound stories cannot replicate.]` },
  { id: 'android', cat: 'other', name: 'Андроиды / ИИ', short: 'создан, но чувствует — или притворяется',
    prompt: `[AU — Androids/Artificial Beings: One or more characters are constructed. The question of their consciousness and personhood is live and unresolved. What humanity means — and who gets to decide — is the story's actual subject.]` },
  { id: 'dystopia', cat: 'other', name: 'Антиутопия', short: 'система контроля, цена сопротивления',
    prompt: `[AU — Dystopia: Society operates under an oppressive system. Characters navigate survival within the system, active resistance, or the specific guilt of complicity. Hope exists but is specific, hard-won, and fragile.]` },
  { id: 'time_loop', cat: 'other', name: 'Петля времени', short: 'один день снова и снова, только ты помнишь',
    prompt: `[AU — Time Loop: One character is trapped reliving the same period of time. Everyone else resets; only the looper carries accumulated memory. They carry the specific loneliness of being the only person for whom this time has weight.]` },
  { id: 'superheroes', cat: 'other', name: 'Супергерои', short: 'силы, секретная личность, цена',
    prompt: `[AU — Superheroes/Powers: Some people have abilities varied in origin and in nature. Having powers is as much burden as gift. Secret identities create specific intimacy problems. The line between protection and control matters.]` },
];

// ── Settings ───────────────────────────────────────────────────

function getSettings() {
  if (!extension_settings[EXT_NAME]) {
    extension_settings[EXT_NAME] = { active_aus: [], enabled: true, custom_aus: [] };
  }
  if (!extension_settings[EXT_NAME].custom_aus) {
    extension_settings[EXT_NAME].custom_aus = [];
  }
  return extension_settings[EXT_NAME];
}

function getFullLibrary() {
  const custom = getSettings().custom_aus.map(a => ({ ...a, isCustom: true }));
  return [...BUILTIN_LIBRARY, ...custom];
}

function getActiveAUs() {
  return getFullLibrary().filter(a => getSettings().active_aus.includes(a.id));
}

function toggleAU(id) {
  const s = getSettings();
  const idx = s.active_aus.indexOf(id);
  if (idx === -1) s.active_aus.push(id);
  else s.active_aus.splice(idx, 1);
  saveSettingsDebounced();
  syncUI();
}

function clearAll() {
  getSettings().active_aus = [];
  saveSettingsDebounced();
  syncUI();
}

function saveCustomAU(data) {
  const s = getSettings();
  const idx = s.custom_aus.findIndex(a => a.id === data.id);
  if (idx === -1) s.custom_aus.push(data);
  else s.custom_aus[idx] = data;
  saveSettingsDebounced();
  syncUI();
}

function deleteCustomAU(id) {
  const s = getSettings();
  s.custom_aus = s.custom_aus.filter(a => a.id !== id);
  s.active_aus = s.active_aus.filter(aid => aid !== id);
  saveSettingsDebounced();
  syncUI();
}

// ── Импорт / Экспорт ──────────────────────────────────────────

function exportJSON() {
  const s = getSettings();
  const data = { version: 2, active_aus: s.active_aus, custom_aus: s.custom_aus, enabled: s.enabled };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  // На мобильном Safari нужен явный append/click/remove
  const a = document.createElement('a');
  a.href = url;
  a.download = 'au_manager_export.json';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  showToast('✓ Экспорт сохранён');
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      const s = getSettings();
      if (Array.isArray(data.custom_aus)) {
        const existingIds = new Set(s.custom_aus.map(a => a.id));
        data.custom_aus.forEach(au => {
          if (existingIds.has(au.id)) { const idx = s.custom_aus.findIndex(a => a.id === au.id); s.custom_aus[idx] = au; }
          else s.custom_aus.push(au);
        });
      }
      if (Array.isArray(data.active_aus)) s.active_aus = data.active_aus;
      if (typeof data.enabled === 'boolean') s.enabled = data.enabled;
      saveSettingsDebounced(); syncUI(); showToast('✓ Импорт выполнен');
    } catch { showToast('✗ Ошибка: невалидный JSON'); }
  };
  reader.readAsText(file);
}

async function showInfoPopup() {
  const html = `<div style="font-family:monospace;max-width:480px;line-height:1.6;color:#ccc;">
    <div style="font-size:1rem;font-weight:700;color:#e0b8e8;margin-bottom:12px;">
      <i class="fa-solid fa-masks-theater"></i> AU Manager — справка
    </div>

    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;">Что такое AU?</b><br>
      AU (Alternate Universe) — промпты с правилами вселенной. Они вставляются в каждый запрос к ИИ, задавая контекст мира.
    </div>

    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-toggle-on" style="color:#c084c8"></i> Инъекция</b><br>
      Переключатель вкл/выкл. Когда включено — активные AU отправляются ИИ как системное сообщение сразу после главного промпта.
    </div>

    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-plus"></i> Добавить</b><br>
      Создать собственный AU с произвольным промптом. Они появятся в категории «Мои».
    </div>

    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-file-export"></i> Экспорт</b><br>
      Сохраняет все ваши AU и активные настройки в файл <code>au_manager_export.json</code>.
    </div>

    <div style="margin-bottom:10px;font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-file-import"></i> Импорт</b><br>
      Загружает AU из ранее экспортированного файла. Существующие AU обновляются, новые добавляются.
    </div>

    <div style="font-size:0.82rem;">
      <b style="color:#ddd;"><i class="fa-solid fa-trash-can"></i> Сброс</b><br>
      Деактивирует все AU (не удаляет — просто снимает галочки).
    </div>
  </div>`;

  const popup = new Popup(html, POPUP_TYPE.TEXT, '', { wide: false, large: false });
  await popup.show();
}

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

// ── Prompt injection ───────────────────────────────────────────

function onBeforeCombinePrompts(chat) {
  const s = getSettings();
  if (!s.enabled) return;
  const active = getActiveAUs();
  if (!active.length) return;
  const body = active.map(a => a.prompt).join('\n\n');
  const msg = { role: 'system', content: `[AU SETTINGS — прочитай и следуй этим правилам мира]\n${body}` };
  const arr = Array.isArray(chat) ? chat : (chat && Array.isArray(chat.chat) ? chat.chat : null);
  if (arr) arr.splice(1, 0, msg);
}

// ── UI state ───────────────────────────────────────────────────

let currentCat = 'all';
let currentPopup = null;

function syncUI() {
  updateBadge();
  updateTotalTokens();
  const grid = document.getElementById('aum-card-grid');
  if (grid) { renderCards(); renderChips(); }
}

function updateBadge() {
  const n = getSettings().active_aus.length;
  $('#aum-badge').text(n || '').toggle(n > 0);
}

function updateTotalTokens() {
  const total = getActiveAUs().reduce((s, a) => s + countTokens(a.prompt), 0);
  $('#aum-total-tokens').text(total > 0 ? `~${total} токенов` : '');
}

// ── Строим HTML контент для попапа ────────────────────────────

function buildPopupHTML() {
  return `<div id="aum-modal">
    <div id="aum-head">
      <span id="aum-head-title"><i class="fa-solid fa-masks-theater"></i> AU MANAGER</span>
      <div id="aum-head-right">
        <button id="aum-inject-info" class="aum-head-btn" title="">
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
  const list = currentCat === 'all' ? lib
    : currentCat === 'custom' ? lib.filter(a => a.isCustom)
    : lib.filter(a => a.cat === currentCat);

  if (!list.length) {
    grid.innerHTML = '<div class="aum-empty">Нет AU в этой категории.<br>Добавьте свои через кнопку <b>+</b></div>';
    return;
  }

  grid.innerHTML = list.map(au => {
    const on = active_aus.includes(au.id);
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
    btn.addEventListener('click', e => { e.stopPropagation(); toggleAU(btn.dataset.id); })
  );
  grid.querySelectorAll('.aum-edit-btn').forEach(btn =>
    btn.addEventListener('click', e => { e.stopPropagation(); openEditor(btn.dataset.id); })
  );
  grid.querySelectorAll('.aum-del-btn').forEach(btn =>
    btn.addEventListener('click', e => {
      e.stopPropagation();
      if (confirm(`Удалить «${getFullLibrary().find(a => a.id === btn.dataset.id)?.name}»?`)) deleteCustomAU(btn.dataset.id);
    })
  );
  grid.querySelectorAll('.aum-card').forEach(card =>
    card.addEventListener('click', () => toggleAU(card.dataset.id))
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
    b.addEventListener('click', () => toggleAU(b.dataset.id))
  );
  updateTotalTokens();
}

// ── Редактор AU (тоже через Popup ST) ─────────────────────────

async function openEditor(id) {
  const existing = id ? getFullLibrary().find(a => a.id === id) : null;
  const isNew = !existing;

  const catOptions = CATEGORIES.filter(c => c.id !== 'all' && c.id !== 'custom')
    .map(c => `<option value="${c.id}" ${existing?.cat === c.id ? 'selected' : ''}>${c.label}</option>`).join('');

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

  // Навешиваем события после того как попап добавлен в DOM
  const setupEditor = () => {
    const promptEl = document.getElementById('aum-ed-prompt');
    const tokEl = document.getElementById('aum-ed-tokcount');
    if (promptEl && tokEl) {
      const updateTok = () => { tokEl.textContent = `~${countTokens(promptEl.value)} токенов`; };
      promptEl.addEventListener('input', updateTok);
      updateTok();
    }
    const delBtn = document.getElementById('aum-ed-delete');
    if (delBtn) {
      delBtn.addEventListener('click', async () => {
        editorPopup.completeCancelled();
        if (confirm(`Удалить «${existing.name}»?`)) { deleteCustomAU(existing.id); showToast('✓ Удалено'); }
      });
    }
  };

  // Небольшая задержка чтобы DOM попапа успел создаться
  requestAnimationFrame(setupEditor);

  const result = await editorPopup.show();
  if (!result) return;

  const name = document.getElementById('aum-ed-name')?.value?.trim() || '';
  const cat = document.getElementById('aum-ed-cat')?.value || 'other';
  const short = document.getElementById('aum-ed-short')?.value?.trim() || '';
  const prompt = document.getElementById('aum-ed-prompt')?.value?.trim() || '';

  if (!name || !prompt) { showToast('Заполни название и промпт'); return; }
  const newId = existing?.id || `custom_${Date.now()}`;
  saveCustomAU({ id: newId, cat, name, short, prompt, isCustom: true });
  showToast('✓ Сохранено');

  // Обновляем карточки в открытом главном попапе
  renderCards();
  renderChips();
}

// ── Главный попап (через ST Popup) ────────────────────────────

async function showMainPopup() {
  const content = buildPopupHTML();

  currentPopup = new Popup(content, POPUP_TYPE.TEXT, '', {
    wide: true,
    large: false,
    allowVerticalScrolling: true,
  });

  // Навешиваем события — используем requestAnimationFrame чтобы DOM попапа был готов
  requestAnimationFrame(() => {
    renderCards();
    renderChips();
    updateTotalTokens();

    document.getElementById('aum-clear')?.addEventListener('click', clearAll);
    document.getElementById('aum-btn-add')?.addEventListener('click', () => openEditor(null));
    document.getElementById('aum-btn-export')?.addEventListener('click', exportJSON);
    document.getElementById('aum-btn-import')?.addEventListener('click', () => {
      document.getElementById('aum-import-input')?.click();
    });

    document.getElementById('aum-inject-toggle')?.addEventListener('change', e => {
      getSettings().enabled = e.target.checked;
      e.target.nextElementSibling?.classList.toggle('aum-tog-on', e.target.checked);
      saveSettingsDebounced();
    });

    document.getElementById('aum-inject-info')?.addEventListener('click', showInfoPopup);

    document.getElementById('aum-import-input')?.addEventListener('change', e => {
      if (e.target.files[0]) importJSON(e.target.files[0]);
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

// ── Создаём UI и вешаем события ───────────────────────────────

function createUI() {
  // Точно как MemoryBooks — append в extensionsMenu
  const menuItem = $(`
    <div id="aum-menu-container" class="extension_container interactable" tabindex="0">
      <div id="aum-menu-item" class="list-group-item flex-container flexGap5 interactable" tabindex="0" role="listitem" title="AU Manager">
        <div class="fa-solid fa-masks-theater extensionsMenuExtensionButton"></div>
        <span>AU Manager</span>
        <span id="aum-badge" style="display:none;margin-left:6px;background:var(--SmartThemeQuoteColor,#c084c8);color:#fff;border-radius:8px;padding:0 6px;font-size:0.65rem;font-weight:700;line-height:18px;"></span>
      </div>
    </div>`);

  const menu = $('#extensionsMenu');
  if (menu.length > 0) {
    menu.prepend(menuItem);
    updateBadge();
    console.log('[AU Manager] button injected ✓');
  } else {
    console.warn('[AU Manager] extensionsMenu not found');
  }
}

function setupEventListeners() {
  // Делегированный клик — точно как MemoryBooks, работает на мобильном
  $(document).on('click', '#aum-menu-item', showMainPopup);
}

// ── Init ───────────────────────────────────────────────────────

let _initialized = false;

function init() {
  if (_initialized) return;
  if (!document.getElementById('extensionsMenu')) return;
  _initialized = true;
  createUI();
  setupEventListeners();
  console.log('[AU Manager] initialized ✓');
}

jQuery(async () => {
  console.log('[AU Manager] jQuery ready');
  getSettings();
  eventSource.on(event_types.GENERATE_BEFORE_COMBINE_PROMPTS, onBeforeCombinePrompts);
  eventSource.on(event_types.APP_READY, init);
  // Если APP_READY уже был — пробуем сразу
  setTimeout(init, 300);
  console.log('[AU Manager] v2.0 loaded ✓');
});
