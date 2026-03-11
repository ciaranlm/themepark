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
    this.entryFeeStat = document.getElementById('entryFeeStat');
    this.parkNameStat = document.getElementById('parkNameStat');
    this.buildButtons = document.getElementById('buildButtons');
    this.buildPreview = document.getElementById('buildPreview');
    this.infoContent = document.getElementById('infoContent');
    this.statusBar = document.getElementById('statusBar');
    this.notifications = document.getElementById('notifications');
    this.pauseBtn = document.getElementById('pauseBtn');
    this.playBtn = document.getElementById('playBtn');
    this.fastBtn = document.getElementById('fastBtn');
    this.setupManagementModal();
  }

  setupTimeControls() {
    this.pauseBtn.onclick = () => this.game.timeControls.setState('pause');
    this.playBtn.onclick = () => this.game.timeControls.setState('play');
    this.fastBtn.onclick = () => this.game.timeControls.setState('fast');
  }

  setupManagementModal() {
    this.modal = document.getElementById('parkModal');
    this.parkNameInput = document.getElementById('parkNameInput');
    this.entryFeeInput = document.getElementById('entryFeeInput');
    this.feeReaction = document.getElementById('feeReaction');
    this.managementStats = document.getElementById('managementStats');
    document.getElementById('parkSettingsBtn').onclick = () => this.openManagement();
    document.getElementById('closeParkModal').onclick = () => this.closeManagement();
    document.getElementById('feeDownBtn').onclick = () => this.adjustFee(-1);
    document.getElementById('feeUpBtn').onclick = () => this.adjustFee(1);
    this.parkNameInput.onchange = () => this.applyManagementEdits();
    this.entryFeeInput.onchange = () => this.applyManagementEdits();
  }

  openManagement() {
    this.modal.classList.remove('hidden');
    this.parkNameInput.value = this.game.parkName;
    this.entryFeeInput.value = this.game.entryFee;
    this.renderManagementStats();
  }

  closeManagement() { this.applyManagementEdits(); this.modal.classList.add('hidden'); }

  adjustFee(delta) {
    const next = Math.max(0, Math.min(60, Number(this.entryFeeInput.value || this.game.entryFee) + delta));
    this.entryFeeInput.value = next;
    this.applyManagementEdits();
  }

  applyManagementEdits() {
    this.game.parkName = (this.parkNameInput.value || 'Unnamed Park').trim() || 'Unnamed Park';
    this.game.entryFee = Math.max(0, Math.min(60, Number(this.entryFeeInput.value || 0)));
    this.renderManagementStats();
  }

  renderManagementStats() {
    const fee = this.game.entryFee;
    const reaction = fee > 32 ? 'Guests think the gate price is high and arrivals will slow.' : fee < 6 ? 'Low entry price draws larger crowds but less entry revenue.' : 'Current entry price is reasonable for a growing park.';
    this.feeReaction.textContent = reaction;
    this.managementStats.innerHTML = `
      <div><strong>Lifetime Guests:</strong> ${this.game.lifetimeGuests}</div>
      <div><strong>Lifetime Revenue:</strong> $${Math.round(this.game.lifetimeRevenue)}</div>
      <div><strong>Days Open:</strong> ${this.game.currentDay}</div>
      <div><strong>Tier:</strong> ${this.game.parkRating > 82 ? 'Premier Park' : this.game.parkRating > 65 ? 'Regional Park' : 'Starter Park'}</div>`;
  }

  renderBuildPanel() {
    this.buildButtons.innerHTML = '';
    const selected = BUILDING_DEFINITIONS[this.game.selectedBuild];
    const state = this.game.objectives.stateFor(selected);
    this.buildPreview.innerHTML = `<div class="info-card"><strong>${selected.name}</strong><p>Size ${selected.width}x${selected.height} • Cost $${selected.cost} • Upkeep $${selected.upkeep}</p><p>Status: ${state}</p><p>${state === 'locked' ? this.game.objectives.lockReason(selected) : 'Ready to build'}</p></div>`;

    for (const category of CATEGORY_ORDER) {
      const wrap = document.createElement('div');
      wrap.className = 'build-group';
      wrap.innerHTML = `<h3>${category}</h3>`;
      const grid = document.createElement('div');
      grid.className = 'build-grid';

      Object.values(BUILDING_DEFINITIONS).filter((d) => d.category === category).forEach((b) => {
        const status = this.game.objectives.stateFor(b);
        const unlocked = status !== 'locked';
        const btn = document.createElement('button');
        btn.className = `build-btn ${this.game.selectedBuild === b.id ? 'active' : ''} ${status}`;
        btn.disabled = !unlocked;
        btn.title = `${b.name} (${b.width}x${b.height})\nCost $${b.cost} • Upkeep $${b.upkeep}\n${unlocked ? 'Available' : this.game.objectives.lockReason(b)}`;
        btn.innerHTML = `<strong>${b.name}</strong><small>$${b.cost} • ${b.width}x${b.height}</small><em>${status === 'locked' ? this.game.objectives.lockReason(b) : status === 'new' ? 'Newly unlocked!' : 'Available'}</em>`;
        btn.onclick = () => { this.game.selectedBuild = b.id; this.renderBuildPanel(); this.updateInfoPanel(this.game.selectedTile); };
        grid.appendChild(btn);
      });
      wrap.appendChild(grid);
      this.buildButtons.appendChild(wrap);
    }
  }

  notify(text) {
    const node = document.createElement('div');
    node.className = 'toast';
    node.textContent = text;
    this.notifications.appendChild(node);
    setTimeout(() => node.remove(), 2800);
  }

  updateStats() {
    const { economy, guestManager, timeControls } = this.game;
    this.moneyStat.textContent = `$${Math.floor(economy.money)}`;
    this.guestStat.textContent = `${guestManager.guests.length}`;
    this.ratingStat.textContent = `${Math.round(this.game.parkRating)}`;
    this.profitStat.textContent = `$${Math.round(economy.dailyProfit)}/day`;
    this.entryFeeStat.textContent = `$${this.game.entryFee}`;
    this.parkNameStat.textContent = this.game.parkName;
    this.objectiveStat.textContent = 'Grow your park: expand attractions, rating, and guest comfort.';
    this.timeState.textContent = timeControls.label();
    this.dayStat.textContent = `Day ${timeControls.day}`;

    this.game.currentDay = timeControls.day;
    this.game.lifetimeGuests = economy.totalGuestsServed;
    this.game.lifetimeRevenue = economy.lifetimeRevenue;

    for (const [state, btn] of [['pause', this.pauseBtn], ['play', this.playBtn], ['fast', this.fastBtn]]) btn.classList.toggle('active-speed', timeControls.state === state);
  }

  updateInfoPanel(hoverTile) {
    const { parkRating, guestManager, selectedStructure, selectedBuild } = this.game;
    const avgH = guestManager.averageHappiness();
    const build = BUILDING_DEFINITIONS[selectedBuild];
    const hover = hoverTile ? this.game.map.getTile(hoverTile.x, hoverTile.y) : null;

    if (selectedStructure) {
      const status = !selectedStructure.operating ? 'paused' : selectedStructure.usageCount < 2 ? 'idle' : selectedStructure.usageCount > 25 ? 'busy' : 'operating';
      this.infoContent.innerHTML = `
      <div class="info-card"><strong>${selectedStructure.name}</strong>
      <p>Footprint: ${selectedStructure.width}x${selectedStructure.height}</p>
      <p>Cost: $${build?.cost ?? 0} • Upkeep: $${selectedStructure.upkeep}</p>
      <p>Appeal: ${selectedStructure.excitement} • Capacity: ${selectedStructure.capacity}</p>
      <p>Status: ${status} • Guests served: ${selectedStructure.guestsServed}</p></div>`;
      return;
    }

    this.infoContent.innerHTML = `
      <div class="info-card"><strong>Park Overview</strong>
      <p>Guest happiness: ${avgH.toFixed(1)}%</p><div class="progress"><span style="width:${avgH}%"></span></div>
      <p>Rating: ${Math.round(parkRating)} • Entry Fee: $${this.game.entryFee}</p>
      <p>Lifetime guests ${this.game.lifetimeGuests} • Revenue $${Math.round(this.game.lifetimeRevenue)}</p></div>
      <div class="info-card"><strong>Selected Build</strong>
      <p>${build.name} (${build.width}x${build.height})</p>
      <p>Cost $${build.cost} • Upkeep $${build.upkeep}</p>
      <p>Status: ${this.game.objectives.stateFor(build)} ${this.game.objectives.stateFor(build) === 'locked' ? `• ${this.game.objectives.lockReason(build)}` : ''}</p></div>
      <div class="info-card"><strong>Hover Tile</strong>
      <p>${hoverTile ? `Tile ${hoverTile.x},${hoverTile.y} • Terrain ${hover?.base || 'grass'}` : 'Move cursor over map.'}</p></div>`;
  }

  setHint(text) { this.statusBar.textContent = text; }
}
