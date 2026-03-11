import { BUILDINGS } from './data.js';

export class UI {
  constructor(game) {
    this.game = game;
    this.moneyStat = document.getElementById('moneyStat');
    this.guestStat = document.getElementById('guestStat');
    this.ratingStat = document.getElementById('ratingStat');
    this.profitStat = document.getElementById('profitStat');
    this.objectiveStat = document.getElementById('objectiveStat');
    this.buildButtons = document.getElementById('buildButtons');
    this.infoContent = document.getElementById('infoContent');
    this.statusBar = document.getElementById('statusBar');
  }

  renderBuildPanel() {
    this.buildButtons.innerHTML = '';
    for (const b of Object.values(BUILDINGS)) {
      const unlocked = this.game.objectives.isUnlocked(b);
      const btn = document.createElement('button');
      btn.className = `build-btn ${this.game.selectedBuild === b.id ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
      btn.disabled = !unlocked;
      btn.innerHTML = `<strong>[${b.icon}] ${b.name}</strong><br/><small>$${b.cost} • ${b.type}</small>`;
      btn.onclick = () => {
        this.game.selectedBuild = b.id;
        this.renderBuildPanel();
      };
      this.buildButtons.appendChild(btn);
    }
  }

  updateStats() {
    const { economy, guestManager, objectives } = this.game;
    this.moneyStat.textContent = `$${Math.floor(economy.money)}`;
    this.guestStat.textContent = `${guestManager.guests.length}`;
    this.ratingStat.textContent = `${Math.round(this.game.parkRating)}`;
    this.profitStat.textContent = `$${Math.round(economy.dailyProfit)}/day`;
    this.objectiveStat.textContent = objectives.current ? `Objective: ${objectives.current.text}` : 'All objectives complete!';
  }

  updateInfoPanel(selectedTile) {
    const { guestManager, parkRating } = this.game;
    const avgH = guestManager.averageHappiness();
    const tileInfo = selectedTile && selectedTile.buildingId ? BUILDINGS[selectedTile.buildingId] : null;

    this.infoContent.innerHTML = `
      <div class="info-card">
        <strong>Park Mood</strong>
        <p>Guest happiness: ${avgH.toFixed(1)}%</p>
        <div class="progress"><span style="width:${avgH}%"></span></div>
        <p>Rating: ${Math.round(parkRating)}</p>
      </div>
      <div class="info-card">
        <strong>Guest Feed</strong>
        <p>${guestManager.guests.slice(0, 6).map((g) => `${g.thought.toUpperCase()} • H:${Math.round(g.happiness)}`).join('<br/>') || 'No guests yet'}</p>
      </div>
      <div class="info-card">
        <strong>Tile Selection</strong>
        ${tileInfo ? `<p>${tileInfo.name}</p><p>Ticket: $${tileInfo.ticket} • Upkeep: $${tileInfo.upkeep}</p>` : '<p>Hover or click a tile to inspect.</p>'}
      </div>
    `;
  }

  setHint(text) {
    this.statusBar.textContent = text;
  }
}
