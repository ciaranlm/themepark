const KEY = 'tiny-park-save-v1';

export const saveGame = (game) => {
  const payload = {
    map: game.map.serialize(),
    economy: game.economy.serialize(),
    guests: game.guestManager.serialize(),
    objectives: game.objectives.serialize(),
    selectedBuild: game.selectedBuild,
  };
  localStorage.setItem(KEY, JSON.stringify(payload));
};

export const loadGame = () => {
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : null;
};
