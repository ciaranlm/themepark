/**
 * UI system view helpers.
 *
 * Owns DOM reads/writes and mirrors data from the shared state store so future
 * changes can extend panels and controls without coupling to simulation code.
 */
import { BUILDING_DEFINITIONS, CATEGORY_ORDER, RIDE_CATALOGUE } from './rideDefinitions.js';

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
    this.thoughtsContent = document.getElementById('thoughtsContent');
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
    const selectedState = this.game.objectives.stateFor(selected);
    const selectedShortfall = Math.max(0, Math.ceil(selected.cost - this.game.economy.money));
    const affordText = this.game.economy.canAfford(selected.cost) ? 'Ready to build now.' : `Need $${selectedShortfall} more to build immediately.`;
    this.buildPreview.innerHTML = `<div class="info-card"><strong>${selected.name}</strong><p>Category: ${selected.category} • Size ${selected.width}x${selected.height}</p><p>Build $${selected.cost} • Ticket $${selected.ticketPrice} • Upkeep $${selected.upkeep}</p><p>Exc ${selected.excitement} • Int ${selected.intensity} • Nau ${selected.nausea}</p><p>Capacity ${selected.capacity} • Cycle ${selected.cycleTime}s</p><p>Status: ${selectedState}${selectedState === 'locked' ? ` • ${this.game.objectives.lockReason(selected)}` : ''}</p><p>${selectedState === 'locked' ? this.game.objectives.lockReason(selected) : affordText}</p></div>`;

    for (const category of CATEGORY_ORDER) {
      const wrap = document.createElement('div');
      wrap.className = 'build-group';
      wrap.innerHTML = `<h3>${category}</h3>`;
      const grid = document.createElement('div');
      grid.className = 'build-grid';

      RIDE_CATALOGUE.filter((d) => d.category === category).forEach((b) => {
        const status = this.game.objectives.stateFor(b);
        const unlocked = status !== 'locked';
        const canAfford = this.game.economy.canAfford(b.cost);
        const explanation = !unlocked
          ? this.game.objectives.lockReason(b)
          : canAfford
            ? 'Ready to build now'
            : `Need $${Math.ceil(b.cost - this.game.economy.money)} more`;
        const btn = document.createElement('button');
        btn.className = `build-btn ${this.game.state.snapshot.selectedBuild === b.id ? 'active' : ''} ${status} ${canAfford ? 'affordable' : 'unaffordable'}`;
        btn.title = `${b.name} (${b.width}x${b.height})\nBuild $${b.cost} • Ticket $${b.ticketPrice} • Cycle ${b.cycleTime}s\n${explanation}`;
        btn.innerHTML = `<strong>${b.name}</strong><small>${b.category} • $${b.cost} • ${b.width}x${b.height}</small><em>${status === 'locked' ? explanation : status === 'new' ? 'Newly unlocked!' : explanation}</em>`;
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
    this.renderThoughts();
  }

  renderThoughts() {
    const thoughts = this.game.state.snapshot.recentThoughts || [];
    if (!thoughts.length) {
      this.thoughtsContent.innerHTML = '<div class="info-card"><p>No guest feedback yet. Build paths and attractions to hear from your visitors.</p></div>';
      return;
    }

    this.thoughtsContent.innerHTML = thoughts
      .map((entry) => `<div class="thought-card ${entry.mood || 'neutral'}"><strong>Guest #${entry.guestId}</strong><p>${entry.text}</p><small>Day ${entry.atDay}</small></div>`)
      .join('');
  }

  updateInfoPanel(hoverTile) {
    const { guestManager, definitions } = this.game;
    const { parkRating, selectedStructure, selectedBuild, entryFee, lifetimeGuests, lifetimeRevenue, placementPreview } = this.game.state.snapshot;
    const avgH = guestManager.averageHappiness();
    const build = BUILDING_DEFINITIONS[selectedBuild];
    const hover = hoverTile ? this.game.map.getTile(hoverTile.x, hoverTile.y) : null;

    if (selectedStructure) {
      const structureDef = definitions[selectedStructure.id];
      const connectionText = selectedStructure.connected === false ? 'NOT CONNECTED to entrance paths' : 'Connected to entrance paths';
      const queueCount = selectedStructure.queue?.length ?? 0;
      const riders = selectedStructure.riders?.length ?? 0;
      const status = selectedStructure.operatingState || (!selectedStructure.operating ? 'closed' : selectedStructure.usageCount < 2 ? 'idle' : selectedStructure.usageCount > 25 ? 'busy' : 'operating');
      const estimatedLoads = Math.ceil(queueCount / Math.max(1, selectedStructure.capacity || 1));
      const estimatedWait = queueCount > 0 ? estimatedLoads * Math.max(1, selectedStructure.cycleTime || 1) : 0;
      this.infoContent.innerHTML = `
      <div class="info-card"><strong>${selectedStructure.name}</strong>
      <p>Footprint: ${selectedStructure.width}x${selectedStructure.height}</p>
      <p>Build: $${structureDef?.cost ?? 0} • Ticket: $${selectedStructure.ticketPrice} • Upkeep: $${selectedStructure.upkeep}</p>
      <p>Exc: ${selectedStructure.excitement} • Int: ${selectedStructure.intensity} • Nau: ${selectedStructure.nausea}</p><p>Capacity: ${selectedStructure.capacity} • Cycle: ${selectedStructure.cycleTime}s</p>
      <p>Status: ${status} • Guests served: ${selectedStructure.guestsServed}</p>
      <p>Queue length: ${queueCount} • Riders onboard: ${riders}</p>
      <p>${queueCount > 0 ? `Estimated wait: ~${estimatedWait}s across ${estimatedLoads} load${estimatedLoads === 1 ? '' : 's'}` : 'No queue right now.'}</p>
      <p class="${selectedStructure.connected === false ? 'warning-text' : 'ok-text'}">${connectionText}</p></div>`;
      return;
    }

    this.infoContent.innerHTML = `
      <div class="info-card"><strong>Park Overview</strong>
      <p>Guest happiness: ${avgH.toFixed(1)}%</p><div class="progress"><span style="width:${avgH}%"></span></div>
      <p>Rating: ${Math.round(parkRating)} • Entry Fee: $${entryFee}</p>
      <p>Lifetime guests ${lifetimeGuests} • Revenue $${Math.round(lifetimeRevenue)}</p></div>
      <div class="info-card"><strong>Selected Build</strong>
      <p>${build.name} (${build.width}x${build.height}) • ${build.category}</p>
      <p>Build $${build.cost} • Ticket $${build.ticketPrice} • Upkeep $${build.upkeep}</p>
      <p>Exc ${build.excitement} • Int ${build.intensity} • Nau ${build.nausea} • Cap ${build.capacity}</p>
      <p>Status: ${this.game.objectives.stateFor(build)} ${this.game.objectives.stateFor(build) === 'locked' ? `• ${this.game.objectives.lockReason(build)}` : this.game.economy.canAfford(build.cost) ? '• Ready to build now' : `• Need $${Math.ceil(build.cost - this.game.economy.money)} more`}</p></div>
      <div class="info-card"><strong>Hover Tile</strong>
      <p>${hoverTile ? `Tile ${hoverTile.x},${hoverTile.y} • Terrain ${hover?.base || 'grass'}` : 'Move cursor over map.'}</p>
      <p>${hoverTile && hover?.base === 'entrance' ? 'Guests spawn here and must use connected paths.' : placementPreview ? `Placement: ${placementPreview.valid ? 'Valid' : placementPreview.reason}` : 'Placement preview inactive.'}</p></div>`;
  }


  timeLabel() { return this.game.timeControls.label(); }

  addFloatingText(text, x, y, color) { this.game.state.addFloatingText(text, x, y, color); }

  setHint(text) { this.statusBar.textContent = text; }
}

