// ============ НАДЁЖНОЕ ХРАНИЛИЩЕ (localStorage + cookie-фолбэк) ============
//
// ИСПРАВЛЕНИЕ БАГА «победы не сохраняются в статистике и рекордах»:
//
// Ранее вся история игр сериализовалась в ОДИН cookie `minesweeper_results`
// (см. cookies.ts). Cookie имеет жёсткое ограничение размера ~4096 байт, а
// encodeURIComponent() дополнительно раздувает кириллические имена примерно
// в 3 раза. Как только список результатов превышал лимит, браузер МОЛЧА
// отбрасывал запись куки: saveGameResult() завершался «успешно», но новые
// победы (и поражения) не попадали ни в статистику, ни в таблицу рекордов.
//
// Теперь основным хранилищем является localStorage (лимит ~5 МБ), который
// не ограничен размером одной куки. Cookie остаётся как фолбэк — чтобы
// старые данные пользователей не потерялись после обновления игры.

const LS_RESULTS_KEY = 'minesweeper_results';
const LS_PLAYER_KEY = 'minesweeper_player';

/** Проверяет доступность localStorage (в приватном режиме некоторых браузеров он может бросать исключение). */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__ls_test__';
    window.localStorage.setItem(testKey, '1');
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/** Читает «сырое» значение из localStorage по ключу. */
export function rawRead(key: string): string | null {
  if (!isLocalStorageAvailable()) return null;
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** Записывает «сырое» значение в localStorage по ключу. */
export function rawWrite(key: string, value: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Переполнение квоты localStorage — молча игнорируем,
    // данные останутся в предыдущем состоянии.
  }
}

/** Удаляет значение из localStorage по ключу. */
export function rawRemove(key: string): void {
  if (!isLocalStorageAvailable()) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

// Ключи экспортируются, чтобы cookies.ts мог использовать те же имена.
export { LS_RESULTS_KEY, LS_PLAYER_KEY };
