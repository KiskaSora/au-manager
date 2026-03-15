// ═══════════════════════════════════════════
// CONFIG — константы
// ═══════════════════════════════════════════

export const EXT_NAME    = 'au_manager';
export const PROMPT_KEY  = EXT_NAME + '_au_injection';

export const CATEGORIES = [
  { id: 'all',      label: 'Все',      icon: 'fa-border-all'     },
  { id: 'dynamics', label: 'Динамики', icon: 'fa-arrows-up-down' },
  { id: 'bonds',    label: 'Связи',    icon: 'fa-link'           },
  { id: 'setting',  label: 'Сеттинг',  icon: 'fa-location-dot'   },
  { id: 'trope',    label: 'Тропы',    icon: 'fa-shuffle'        },
  { id: 'fantasy',  label: 'Фэнтези',  icon: 'fa-wand-sparkles'  },
  { id: 'other',    label: 'Прочее',   icon: 'fa-ellipsis'       },
  { id: 'custom',   label: 'Мои',      icon: 'fa-star'           },
];
