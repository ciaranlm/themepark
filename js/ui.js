import { BUILDING_DEFINITIONS, CATEGORY_ORDER } from './rideDefinitions.js';

export class UI {
  constructor(game) {
    this.game = game;
    this.moneyStat = document.getElementById('moneyStat');
    this.guestStat = document.getElementById('guestStat');
    this.ratingStat = document.getElementById('ratingStat');
    this.profitStat = document.getElementById('profitStat');
    this.objectiveStat = document.getElementById('objectiveStat');
    this.timeState = document.getElementById('timeState');
    this.dayStat = document.getElementById('dayStat');
    this.buildButtons = document.getElementById('buildButtons');
    this.infoContent = document.getElementById('infoContent');
    this.statusBar = document.getElementById('statusBar');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.playBtn = document.getElementById('playBtn');
    this.fastBtn = document.getElementById('fastBtn');
  }

  setupTimeControls() {
    this.pauseBtn.onclick = () => this.game.timeControls.setState('pause');
    this.playBtn.onclick = () => this.game.timeControls.setState('play');
    this.fastBtn.onclick = () => this.game.timeControls.setState('fast');
  }

  renderBuildPanel() {
    this.buildButtons.innerHTML = '';
    for (const category of CATEGORY_ORDER) {
      const wrap = document.createElement('div');
      wrap.className = 'build-group';
      wrap.innerHTML = `<h3>${category}</h3>`;
      const grid = document.createElement('div');
      grid.className = 'build-grid';

      Object.values(BUILDING_DEFINITIONS).filter((d) => d.category === category).forEach((b) => {
        const unlocked = this.game.objectives.isUnlocked(b);
        const btn = document.createElement('button');
        btn.className = `build-btn ${this.game.selectedBuild === b.id ? 'active' : ''} ${unlocked ? '' : 'locked'}`;
        btn.disabled = !unlocked;
        btn.title = `${b.name} (${b.width}x${b.height})\nUpkeep $${b.upkeep}  Excitement ${b.excitement}  Capacity ${b.capacity}`;
        btn.innerHTML = `<strong>${b.name}</strong><small>$${b.cost} • ${b.width}x${b.height}</small>`;
        btn.onclick = () => { this.game.selectedBuild = b.id; this.renderBuildPanel(); this.updateInfoPanel(this.game.selectedTile); };
        grid.appendChild(btn);
      });
      wrap.appendChild(grid);
      this.buildButtons.appendChild(wrap);
    }
  }

  updateStats() {
    const { economy, guestManager, objectives, timeControls } = this.game;
    this.moneyStat.textContent = `$${Math.floor(economy.money)}`;
    this.guestStat.textContent = `${guestManager.guests.length}`;
    this.ratingStat.textContent = `${Math.round(this.game.parkRating)}`;
    this.profitStat.textContent = `$${Math.round(economy.dailyProfit)}/day`;
    this.objectiveStat.textContent = objectives.current ? `Objective: ${objectives.current.text}` : 'All objectives complete!';
    this.timeState.textContent = timeControls.label();
    this.dayStat.textContent = `Day ${timeControls.day}`;

    for (const [state, btn] of [['pause', this.pauseBtn], ['play', this.playBtn], ['fast', this.fastBtn]]) {
      btn.classList.toggle('active-speed', timeControls.state === state);
    }
  }

  updateInfoPanel(hoverTile) {
    const { parkRating, guestManager, selectedStructure, selectedBuild } = this.game;
    const avgH = guestManager.averageHappiness();
    const build = BUILDING_DEFINITIONS[selectedBuild];
    const hover = hoverTile ? this.game.map.getTile(hoverTile.x, hoverTile.y) : null;

    if (selectedStructure) {
      const status = !selectedStructure.operating ? 'paused' : selectedStructure.usageCount < 2 ? 'empty' : selectedStructure.usageCount > 25 ? 'crowded' : 'operating';
      this.infoContent.innerHTML = `
      <div class="info-card"><strong>${selectedStructure.name}</strong>
      <p>Size: ${selectedStructure.width}x${selectedStructure.height} • Status: ${status}</p>
      <p>Ticket: $${selectedStructure.ticketPrice} • Upkeep: $${selectedStructure.upkeep}</p>
      <p>Usage: ${selectedStructure.usageCount} • Appeal: ${selectedStructure.excitement}</p></div>`;
      return;
    }

    this.infoContent.innerHTML = `
      <div class="info-card"><strong>Park Overview</strong>
      <p>Guest happiness: ${avgH.toFixed(1)}%</p><div class="progress"><span style="width:${avgH}%"></span></div>
      <p>Rating: ${Math.round(parkRating)}</p></div>
      <div class="info-card"><strong>Selected Build</strong>
      <p>${build.name} (${build.width}x${build.height})</p>
      <p>Cost $${build.cost} • Upkeep $${build.upkeep}</p>
      <p>Excitement ${build.excitement} • Capacity ${build.capacity}</p></div>
      <div class="info-card"><strong>Hover Info</strong>
      <p>${hoverTile ? `Tile ${hoverTile.x},${hoverTile.y} • ${hover?.base || 'grass'}` : 'Move cursor over map.'}</p></div>
    `;
  }

  setHint(text) { this.statusBar.textContent = text; }
}
