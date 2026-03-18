/**
 * UI system view helpers.
 *
 * Owns DOM reads/writes and mirrors data from the shared state store so future
 * changes can extend panels and controls without coupling to simulation code.
 */
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
    this.speed1Btn = document.getElementById('speed1Btn');
    this.speed2Btn = document.getElementById('speed2Btn');
    this.speed3Btn = document.getElementById('speed3Btn');
    this.setupManagementModal();
  }

  setupTimeControls() {
    this.pauseBtn.onclick = () => this.game.timeControls.setSpeed(0);
    this.speed1Btn.onclick = () => this.game.timeControls.setSpeed(1);
    this.speed2Btn.onclick = () => this.game.timeControls.setSpeed(2);
    this.speed3Btn.onclick = () => this.game.timeControls.setSpeed(3);
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
    this.parkNameInput.value = this.game.state.snapshot.parkName;
    this.entryFeeInput.value = this.game.state.snapshot.entryFee;
    this.renderManagementStats();
  }

  closeManagement() { this.applyManagementEdits(); this.modal.classList.add('hidden'); }

  adjustFee(delta) {
    const next = Math.max(0, Math.min(60, Number(this.entryFeeInput.value || this.game.state.snapshot.entryFee) + delta));
    this.entryFeeInput.value = next;
    this.applyManagementEdits();
  }

  applyManagementEdits() {
    this.game.state.patch({
      parkName: (this.parkNameInput.value || 'Unnamed Park').trim() || 'Unnamed Park',
      entryFee: Math.max(0, Math.min(60, Number(this.entryFeeInput.value || 0))),
    });
    this.renderManagementStats();
  }

  renderManagementStats() {
    const { entryFee: fee, lifetimeGuests, lifetimeRevenue, currentDay, parkRating } = this.game.state.snapshot;
    const reaction = fee > 32 ? 'Guests think the gate price is high and arrivals will slow.' : fee < 6 ? 'Low entry price draws larger crowds but less entry revenue.' : 'Current entry price is reasonable for a growing park.';
    this.feeReaction.textContent = reaction;
    this.managementStats.innerHTML = `
      <div><strong>Lifetime Guests:</strong> ${lifetimeGuests}</div>
      <div><strong>Lifetime Revenue:</strong> $${Math.round(lifetimeRevenue)}</div>
      <div><strong>Days Open:</strong> ${currentDay}</div>
      <div><strong>Tier:</strong> ${parkRating > 82 ? 'Premier Park' : parkRating > 65 ? 'Regional Park' : 'Starter Park'}</div>`;
  }

  renderBuildPanel() {
    this.buildButtons.innerHTML = '';
    const selected = BUILDING_DEFINITIONS[this.game.state.snapshot.selectedBuild];
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
        btn.className = `build-btn ${this.game.state.snapshot.selectedBuild === b.id ? 'active' : ''} ${status}`;
        btn.disabled = !unlocked;
        btn.title = `${b.name} (${b.width}x${b.height})\nCost $${b.cost} • Upkeep $${b.upkeep}\n${unlocked ? 'Available' : this.game.objectives.lockReason(b)}`;
        btn.innerHTML = `<strong>${b.name}</strong><small>$${b.cost} • ${b.width}x${b.height}</small><em>${status === 'locked' ? this.game.objectives.lockReason(b) : status === 'new' ? 'Newly unlocked!' : 'Available'}</em>`;
        btn.onclick = () => {
          this.game.state.patch({ selectedBuild: b.id });
          this.game.inputSystem?.refreshPlacementPreview();
          this.renderBuildPanel();
          this.updateInfoPanel(this.game.state.snapshot.selectedTile);
          this.setHint(`Selected ${b.name}. Move cursor over map to preview placement.`);
        };
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
    const state = this.game.state.snapshot;
    this.moneyStat.textContent = `$${Math.floor(economy.money)}`;
    this.guestStat.textContent = `${guestManager.guests.length}`;
    this.ratingStat.textContent = `${Math.round(state.parkRating)}`;
    this.profitStat.textContent = `$${Math.round(economy.dailyProfit)}/day`;
    this.entryFeeStat.textContent = `$${state.entryFee}`;
    this.parkNameStat.textContent = state.parkName;
    this.objectiveStat.textContent = 'Grow your park: expand attractions, rating, and guest comfort.';
    this.timeState.textContent = timeControls.label();
    this.dayStat.textContent = `Day ${timeControls.day}`;

    this.game.state.patch({
      currentDay: timeControls.day,
      lifetimeGuests: economy.totalGuestsServed,
      lifetimeRevenue: economy.lifetimeRevenue,
    });

    for (const [speed, btn] of [[0, this.pauseBtn], [1, this.speed1Btn], [2, this.speed2Btn], [3, this.speed3Btn]]) btn.classList.toggle('active-speed', timeControls.gameSpeed === speed);
  }

  updateInfoPanel(hoverTile) {
    const { guestManager } = this.game;
    const { parkRating, selectedStructure, selectedBuild, entryFee, lifetimeGuests, lifetimeRevenue, placementPreview } = this.game.state.snapshot;
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
      <p>Rating: ${Math.round(parkRating)} • Entry Fee: $${entryFee}</p>
      <p>Lifetime guests ${lifetimeGuests} • Revenue $${Math.round(lifetimeRevenue)}</p></div>
      <div class="info-card"><strong>Selected Build</strong>
      <p>${build.name} (${build.width}x${build.height})</p>
      <p>Cost $${build.cost} • Upkeep $${build.upkeep}</p>
      <p>Status: ${this.game.objectives.stateFor(build)} ${this.game.objectives.stateFor(build) === 'locked' ? `• ${this.game.objectives.lockReason(build)}` : ''}</p></div>
      <div class="info-card"><strong>Hover Tile</strong>
      <p>${hoverTile ? `Tile ${hoverTile.x},${hoverTile.y} • Terrain ${hover?.base || 'grass'}` : 'Move cursor over map.'}</p>
      <p>${placementPreview ? `Placement: ${placementPreview.valid ? 'Valid' : placementPreview.reason}` : 'Placement preview inactive.'}</p></div>`;
  }


  timeLabel() { return this.game.timeControls.label(); }

  addFloatingText(text, x, y, color) { this.game.state.addFloatingText(text, x, y, color); }

  setHint(text) { this.statusBar.textContent = text; }
}

