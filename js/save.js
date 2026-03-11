const KEY = 'tiny-park-save-v2';

export const saveGame = (game) => {
  localStorage.setItem(KEY, JSON.stringify(game.serialize()));
};

export const loadGame = () => {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
};
