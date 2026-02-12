// Global Game State
class GameState {
    constructor() {
        this.xp = 0;
        this.level = 1;
        this.badges = [];
        this.moduleScores = {
            nv: 0,
            odmr: 0,
            missions: 0,
            quiz: 0
        };
        this.moduleProgress = {
            nv: 0,
            odmr: 0,
            missions: 0,
            quiz: 0
        };
        this.unlockedModules = ['nv', 'quiz'];
        this.currentStreak = 0;
        this.bestStreak = 0;
    }

    addXP(amount) {
        this.xp += amount;
        this.updateLevel();
        this.updateUI();
    }

    updateLevel() {
        const newLevel = Math.floor(this.xp / 100) + 1;
        if (newLevel > this.level) {
            this.level = newLevel;
            this.showAchievement('Level Up!', `Reached Level ${this.level}`);
        }
    }

    updateModuleScore(module, score) {
        if (score > this.moduleScores[module]) {
            this.moduleScores[module] = score;
            this.updateProgress(module);
            this.checkUnlocks();
        }
    }

    updateProgress(module) {
        const maxScores = { nv: 100, odmr: 100000, missions: 100, quiz: 100 };
        this.moduleProgress[module] = Math.min((this.moduleScores[module] / maxScores[module]) * 100, 100);
        this.updateProgressRing(module, this.moduleProgress[module]);
    }

    updateProgressRing(module, progress) {
        const circle = document.querySelector(`[data-module="${module}"] .progress-circle`);
        const text = document.querySelector(`[data-module="${module}"] .progress-text`);
        if (circle && text) {
            const circumference = 126;
            const offset = circumference - (progress / 100) * circumference;
            circle.style.strokeDashoffset = offset;
            text.textContent = `${Math.round(progress)}%`;
        }
    }

    checkUnlocks() {
        if (this.moduleProgress.nv >= 50 && !this.unlockedModules.includes('odmr')) {
            this.unlockModule('odmr');
        }
        if (this.moduleProgress.odmr >= 50 && !this.unlockedModules.includes('missions')) {
            this.unlockModule('missions');
        }
    }

    unlockModule(module) {
        this.unlockedModules.push(module);
        const tile = document.querySelector(`[data-module="${module}"]`);
        if (tile) {
            tile.classList.remove('locked');
            this.showAchievement('Module Unlocked!', `${this.getModuleTitle(module)} is now available`);
        }
    }

    getModuleTitle(module) {
        const titles = {
            nv: 'Create the NV',
            odmr: 'Light & Spin',
            missions: 'Sense & Decode',
            quiz: 'Quiz & Boss'
        };
        return titles[module];
    }

    awardBadge(badge) {
        if (!this.badges.includes(badge.id)) {
            this.badges.push(badge.id);
            this.showAchievement('Achievement Unlocked bro !', badge.name);
            this.updateUI();
        }
    }

    showAchievement(title, description) {
        const toast = document.getElementById('achievementToast');
        const titleEl = toast.querySelector('.achievement-title');
        const descEl = toast.querySelector('.achievement-description');

        titleEl.textContent = title;
        descEl.textContent = description;

        toast.classList.remove('hidden');
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.classList.add('hidden'), 300);
        }, 3000);
    }

    showSuccess(message) {
        const successEl = document.getElementById('successMessage');
        const textEl = successEl.querySelector('.success-text');

        textEl.textContent = message;
        successEl.classList.remove('hidden');
        successEl.classList.add('show');

        setTimeout(() => {
            successEl.classList.remove('show');
            setTimeout(() => successEl.classList.add('hidden'), 300);
        }, 2000);
    }

    updateUI() {
        document.getElementById('xpAmount').textContent = this.xp;
        document.getElementById('levelAmount').textContent = this.level;
        document.getElementById('badgeCount').textContent = this.badges.length;

        // Update module scores
        Object.keys(this.moduleScores).forEach(module => {
            const scoreEl = document.getElementById(`${module}Score`);
            if (scoreEl) {
                scoreEl.textContent = this.moduleScores[module];
            }
        });
    }
}

// Initialize game state
const gameState = new GameState();

// Module 1: NV Creation Game
class NVCreationGame {
    constructor() {
        this.gridSize = 8;
        this.grid = [];
        this.selectedAtom = 'carbon';
        this.moves = 0;
        this.startTime = null;
        this.timer = null;
        this.nitrogenPositions = [];
        this.vacancyPositions = [];
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.createGrid();
        this.bindEvents();
        this.reset();
        this.isInitialized = true;
    }

    createGrid() {
        const gridContainer = document.getElementById('latticeGrid');
        if (!gridContainer) return;

        gridContainer.innerHTML = '';
        this.grid = [];

        for (let i = 0; i < this.gridSize * this.gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('lattice-cell', 'carbon');
            cell.textContent = 'C';
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onCellClick(i);
            });
            gridContainer.appendChild(cell);
            this.grid.push('carbon');
        }
    }

    bindEvents() {
        // Atom palette selection
        document.querySelectorAll('.atom-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.atom-option').forEach(o => o.classList.remove('active'));
                option.classList.add('active');
                this.selectedAtom = option.dataset.atom;
            });
        });

        // Control buttons
        const annealBtn = document.getElementById('annealBtn');
        const resetBtn = document.getElementById('resetLattice');

        if (annealBtn) {
            annealBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.anneal();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.reset();
            });
        }
    }

    onCellClick(index) {
        if (this.grid[index] !== this.selectedAtom) {
            this.moves++;
            this.grid[index] = this.selectedAtom;
            this.updateCell(index);
            this.updateStats();

            if (this.selectedAtom === 'nitrogen') {
                this.nitrogenPositions.push(index);
            } else if (this.selectedAtom === 'vacancy') {
                this.vacancyPositions.push(index);
            }
        }
    }

    updateCell(index) {
        const cell = document.querySelector(`#latticeGrid .lattice-cell:nth-child(${index + 1})`);
        if (!cell) return;

        const atomType = this.grid[index];
        cell.className = `lattice-cell ${atomType}`;
        cell.textContent = atomType === 'carbon' ? 'C' : atomType === 'nitrogen' ? 'N' : '□';
    }

    updateStats() {
        if (!this.startTime) {
            this.startTime = Date.now();
            this.timer = setInterval(() => {
                const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
                const timeEl = document.getElementById('nvTime');
                if (timeEl) timeEl.textContent = elapsed;
                this.updateScore();
            }, 1000);
        }

        const movesEl = document.getElementById('nvMoves');
        if (movesEl) movesEl.textContent = this.moves;
        this.updateScore();
    }

    updateScore() {
        const elapsed = this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0;
        const score = Math.max(100 - this.moves - Math.floor(elapsed / 5), 10);
        const scoreEl = document.getElementById('nvCurrentScore');
        if (scoreEl) scoreEl.textContent = score;
    }

    anneal() {
        if (this.nitrogenPositions.length === 0 || this.vacancyPositions.length === 0) {
            alert('You need both nitrogen atoms and vacancies to form an NV center!');
            return;
        }

        // Check for adjacent N-V pairs
        let nvFormed = false;
        for (const nPos of this.nitrogenPositions) {
            for (const vPos of this.vacancyPositions) {
                if (this.areAdjacent(nPos, vPos)) {
                    this.formNVCenter(nPos, vPos);
                    nvFormed = true;
                    break;
                }
            }
            if (nvFormed) break;
        }

        if (nvFormed) {
            this.completeLevel();
        } else {
            alert('No adjacent nitrogen-vacancy pairs found! Try placing them next to each other.');
        }
    }

    areAdjacent(pos1, pos2) {
        const row1 = Math.floor(pos1 / this.gridSize);
        const col1 = pos1 % this.gridSize;
        const row2 = Math.floor(pos2 / this.gridSize);
        const col2 = pos2 % this.gridSize;

        return Math.abs(row1 - row2) + Math.abs(col1 - col2) === 1;
    }

    formNVCenter(nPos, vPos) {
        const nCell = document.querySelector(`#latticeGrid .lattice-cell:nth-child(${nPos + 1})`);
        const vCell = document.querySelector(`#latticeGrid .lattice-cell:nth-child(${vPos + 1})`);

        if (nCell && vCell) {
            nCell.classList.add('nv-center');
            vCell.classList.add('nv-center');
            nCell.textContent = 'NV';
            vCell.textContent = '';
        }
    }

    completeLevel() {
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const score = Math.max(100 - this.moves - Math.floor(elapsed / 5), 10);

        gameState.updateModuleScore('nv', score);
        gameState.addXP(50);

        if (score === 100) {
            gameState.awardBadge({ id: 'perfectionist', name: 'Perfectionist' });
        }

        if (elapsed < 60) {
            gameState.awardBadge({ id: 'speedRunner', name: 'Speed Runner' });
        }

        gameState.awardBadge({ id: 'firstNV', name: 'First NV' });
        gameState.showSuccess(`NV Center Created! Score: ${score}`);

        setTimeout(() => this.closeModal(), 2000);
    }

    reset() {
        this.moves = 0;
        this.startTime = null;
        this.nitrogenPositions = [];
        this.vacancyPositions = [];

        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        // Reset grid to all carbon
        for (let i = 0; i < this.grid.length; i++) {
            this.grid[i] = 'carbon';
            this.updateCell(i);
        }

        const movesEl = document.getElementById('nvMoves');
        const timeEl = document.getElementById('nvTime');
        const scoreEl = document.getElementById('nvCurrentScore');

        if (movesEl) movesEl.textContent = '0';
        if (timeEl) timeEl.textContent = '0';
        if (scoreEl) scoreEl.textContent = '100';
    }

    closeModal() {
        const modal = document.getElementById('nvModal');
        if (modal) modal.classList.add('hidden');
    }
}

// Module 2: ODMR Simulation
class ODMRSimulation {
    constructor() {
        this.frequency = 2.85;
        this.magneticField = 0;
        this.laserPower = 50;
        this.isLocked = false;
        this.lockStartTime = null;
        this.lockDuration = 0;
        this.score = 0;
        this.chart = null;
        this.animationId = null;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.bindEvents();
        this.setupChart();
        this.isInitialized = true;
    }

    bindEvents() {
        const frequencySlider = document.getElementById('frequencySlider');
        const magneticFieldSlider = document.getElementById('magneticField');
        const laserPowerSlider = document.getElementById('laserPower');
        const autoLockBtn = document.getElementById('autoLockBtn');

        if (frequencySlider) {
            frequencySlider.addEventListener('input', (e) => {
                this.frequency = parseFloat(e.target.value) / 1000; // Convert MHz to GHz
                document.getElementById('frequencyValue').textContent = `${this.frequency.toFixed(2)} GHz`;
                this.updateSpectrum();
                this.checkLock();
            });
        }

        if (magneticFieldSlider) {
            magneticFieldSlider.addEventListener('input', (e) => {
                this.magneticField = parseInt(e.target.value);
                document.getElementById('magneticFieldValue').textContent = `${this.magneticField} G`;
                this.updateSpectrum();
            });
        }

        if (laserPowerSlider) {
            laserPowerSlider.addEventListener('input', (e) => {
                this.laserPower = parseInt(e.target.value);
                document.getElementById('laserPowerValue').textContent = `${this.laserPower} mW`;
                this.updateSpectrum();
            });
        }

        if (autoLockBtn) {
            autoLockBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.autoLock();
            });
        }
    }

    setupChart() {
        const ctx = document.getElementById('odmrChart');
        if (!ctx) return;

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Fluorescence Intensity',
                    data: [],
                    borderColor: '#1FB8CD',
                    backgroundColor: 'rgba(31, 184, 205, 0.1)',
                    borderWidth: 2,
                    pointRadius: 0,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Frequency (GHz)'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Fluorescence Intensity'
                        },
                        min: 0,
                        max: 1
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });

        this.updateSpectrum();
    }

    updateSpectrum() {
        if (!this.chart) return;

        const frequencies = [];
        const intensities = [];
        const startFreq = 2.8;
        const endFreq = 2.9;
        const steps = 100;

        for (let i = 0; i <= steps; i++) {
            const freq = startFreq + (endFreq - startFreq) * i / steps;
            frequencies.push(freq.toFixed(3));
            intensities.push(this.calculateFluorescence(freq));
        }

        this.chart.data.labels = frequencies;
        this.chart.data.datasets[0].data = intensities;
        this.chart.update('none');

        this.updateSNR();
    }

    calculateFluorescence(freq) {
        const targetFreq = 2.87; // GHz
        const zeemanSplit = this.magneticField * 2.8e-6; // Zeeman splitting

        // Create resonance dips
        const dip1 = targetFreq - zeemanSplit;
        const dip2 = targetFreq + zeemanSplit;

        const linewidth = 0.002; // GHz
        const baseline = 0.8 + 0.2 * (this.laserPower / 100);

        let intensity = baseline;

        // Apply Lorentzian line shapes
        intensity *= (1 - 0.3 * this.laserPower / 100 / (1 + Math.pow((freq - dip1) / linewidth, 2)));
        if (this.magneticField > 0) {
            intensity *= (1 - 0.3 * this.laserPower / 100 / (1 + Math.pow((freq - dip2) / linewidth, 2)));
        }

        // Add noise
        intensity += (Math.random() - 0.5) * 0.02 * (100 - this.laserPower) / 100;

        return Math.max(0, Math.min(1, intensity));
    }

    checkLock() {
        const targetFreq = 2.87;
        const tolerance = 0.002;
        const isOnResonance = Math.abs(this.frequency - targetFreq) < tolerance;

        const lockStatusEl = document.getElementById('lockStatus');

        if (isOnResonance && !this.isLocked) {
            this.isLocked = true;
            this.lockStartTime = Date.now();
            if (lockStatusEl) {
                lockStatusEl.textContent = 'Locked';
                lockStatusEl.classList.remove('unlocked');
                lockStatusEl.classList.add('locked');
            }
            this.startScoring();
        } else if (!isOnResonance && this.isLocked) {
            this.isLocked = false;
            this.lockStartTime = null;
            if (lockStatusEl) {
                lockStatusEl.textContent = 'Unlocked';
                lockStatusEl.classList.remove('locked');
                lockStatusEl.classList.add('unlocked');
            }
            this.stopScoring();
        }
    }

    startScoring() {
        if (this.animationId) return;

        const updateScore = () => {
            if (this.isLocked && this.lockStartTime) {
                this.lockDuration = (Date.now() - this.lockStartTime) / 1000;
                const accuracy = 1 - Math.abs(this.frequency - 2.87) / 0.1;
                this.score = Math.floor(accuracy * this.lockDuration * 1000);
                const scoreEl = document.getElementById('odmrCurrentScore');
                if (scoreEl) scoreEl.textContent = this.score;

                if (this.lockDuration >= 5) {
                    this.completeMission();
                    return;
                }
            }

            this.animationId = requestAnimationFrame(updateScore);
        };

        updateScore();
    }

    stopScoring() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    updateSNR() {
        const snr = 10 + this.laserPower / 5 - (Math.random() * 5);
        const snrEl = document.getElementById('snrValue');
        if (snrEl) snrEl.textContent = `${snr.toFixed(1)} dB`;
    }

    autoLock() {
        this.frequency = 2.87;
        const freqSlider = document.getElementById('frequencySlider');
        const freqValue = document.getElementById('frequencyValue');

        if (freqSlider) freqSlider.value = 2870;
        if (freqValue) freqValue.textContent = '2.87 GHz';

        this.updateSpectrum();
        this.checkLock();

        gameState.awardBadge({ id: 'resonanceMaster', name: 'Resonance Master' });
    }

    completeMission() {
        this.stopScoring();
        gameState.updateModuleScore('odmr', this.score);
        gameState.addXP(75);

        if (this.score > 50000) {
            gameState.awardBadge({ id: 'perfectionist', name: 'Perfectionist' });
        }

        gameState.showSuccess(`ODMR Lock Achieved! Score: ${this.score}`);
        setTimeout(() => this.closeModal(), 2000);
    }

    reset() {
        this.frequency = 2.85;
        this.magneticField = 0;
        this.laserPower = 50;
        this.isLocked = false;
        this.lockStartTime = null;
        this.lockDuration = 0;
        this.score = 0;

        this.stopScoring();

        const freqSlider = document.getElementById('frequencySlider');
        const freqValue = document.getElementById('frequencyValue');
        const magField = document.getElementById('magneticField');
        const magValue = document.getElementById('magneticFieldValue');
        const laser = document.getElementById('laserPower');
        const laserValue = document.getElementById('laserPowerValue');
        const scoreEl = document.getElementById('odmrCurrentScore');
        const lockStatus = document.getElementById('lockStatus');

        if (freqSlider) freqSlider.value = 2850;
        if (freqValue) freqValue.textContent = '2.85 GHz';
        if (magField) magField.value = 0;
        if (magValue) magValue.textContent = '0 G';
        if (laser) laser.value = 50;
        if (laserValue) laserValue.textContent = '50 mW';
        if (scoreEl) scoreEl.textContent = '0';
        if (lockStatus) {
            lockStatus.textContent = 'Unlocked';
            lockStatus.classList.remove('locked');
            lockStatus.classList.add('unlocked');
        }

        this.updateSpectrum();
    }

    closeModal() {
        const modal = document.getElementById('odmrModal');
        if (modal) modal.classList.add('hidden');
    }
}

// Module 3: Missions System
class MissionsSystem {
    constructor() {
        this.measurements = 0;
        this.efficiency = 100;
        this.score = 100;
        this.missionType = 'magnetic';
        this.fieldData = [];
        this.chart = null;
        this.sampleData = [];
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.generateSampleData();
        this.setupMap();
        this.setupChart();
        this.bindEvents();
        this.isInitialized = true;
    }

    bindEvents() {
        const startBtn = document.getElementById('startMission');
        const resetBtn = document.getElementById('resetMission');
        const missionSelect = document.getElementById('missionType');

        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startMission();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.reset();
            });
        }

        if (missionSelect) {
            missionSelect.addEventListener('change', (e) => {
                this.missionType = e.target.value;
                this.generateSampleData();
                this.setupMap();
            });
        }
    }

    generateSampleData() {
        this.sampleData = [];
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                let field;
                if (this.missionType === 'magnetic') {
                    // Create magnetic field pattern
                    field = 50 + 30 * Math.sin(x * 0.5) * Math.cos(y * 0.3) + Math.random() * 10;
                } else {
                    // Biosensing pattern
                    const centerX = 5, centerY = 5;
                    const distance = Math.sqrt((x - centerX) ** 2 + (y - centerY) ** 2);
                    field = 100 * Math.exp(-distance / 3) + Math.random() * 5;
                }
                this.sampleData.push({ x, y, field });
            }
        }
        return this.sampleData;
    }

    setupMap() {
        const svg = document.getElementById('sampleMap');
        if (!svg) return;

        svg.innerHTML = '';

        // Create background grid
        for (let x = 0; x < 10; x++) {
            for (let y = 0; y < 10; y++) {
                const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
                rect.setAttribute('x', x * 30);
                rect.setAttribute('y', y * 30);
                rect.setAttribute('width', 30);
                rect.setAttribute('height', 30);
                rect.setAttribute('fill', '#2a2a2a');
                rect.setAttribute('stroke', '#3a3a3a');
                rect.setAttribute('stroke-width', '1');
                rect.style.cursor = 'pointer';

                rect.addEventListener('click', () => this.takeMeasurement(x, y));
                svg.appendChild(rect);
            }
        }
    }

    setupChart() {
        const ctx = document.getElementById('fieldChart');
        if (!ctx) return;

        this.chart = new Chart(ctx.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Field Strength (G)',
                    data: [],
                    borderColor: '#FFC185',
                    backgroundColor: 'rgba(255, 193, 133, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: '#FFC185',
                    pointBorderColor: '#FFC185',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Measurement #'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Field Strength (G)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    }

    takeMeasurement(x, y) {
        const dataPoint = this.sampleData.find(d => d.x === x && d.y === y);
        if (!dataPoint) return;

        this.measurements++;
        const field = dataPoint.field;
        this.fieldData.push(field);

        // Update map visualization
        const rect = document.querySelector(`#sampleMap rect[x="${x * 30}"][y="${y * 30}"]`);
        if (rect) {
            const intensity = Math.min(field / 100, 1);
            const color = `rgba(31, 184, 205, ${intensity})`;
            rect.setAttribute('fill', color);
        }

        // Update UI
        const measurementsEl = document.getElementById('measurements');
        const positionEl = document.getElementById('probePosition');
        const fieldEl = document.getElementById('fieldStrength');
        const efficiencyEl = document.getElementById('efficiency');
        const scoreEl = document.getElementById('missionsCurrentScore');

        if (measurementsEl) measurementsEl.textContent = this.measurements;
        if (positionEl) positionEl.textContent = `(${x}, ${y})`;
        if (fieldEl) fieldEl.textContent = `${field.toFixed(1)} G`;

        // Update efficiency and score
        this.efficiency = Math.max(100 - this.measurements * 2, 10);
        this.score = Math.floor(this.efficiency * (this.fieldData.length / 10));

        if (efficiencyEl) efficiencyEl.textContent = this.efficiency;
        if (scoreEl) scoreEl.textContent = this.score;

        // Update chart
        if (this.chart) {
            this.chart.data.labels.push(this.measurements);
            this.chart.data.datasets[0].data.push(field);
            this.chart.update();
        }

        // Check completion
        if (this.measurements >= 25) {
            this.completeMission();
        }

        gameState.addXP(5);
    }

    startMission() {
        this.reset();
        const missionName = this.missionType === 'magnetic' ? 'Magnetic Field' : 'Biosensing';
        gameState.showSuccess(`${missionName} Mission Started!`);
    }

    completeMission() {
        gameState.updateModuleScore('missions', this.score);
        gameState.addXP(60);

        if (this.efficiency > 80) {
            gameState.awardBadge({ id: 'perfectionist', name: 'Perfectionist' });
        }

        gameState.showSuccess(`Mission Complete! Score: ${this.score}`);
        setTimeout(() => this.closeModal(), 2000);
    }

    reset() {
        this.measurements = 0;
        this.efficiency = 100;
        this.score = 100;
        this.fieldData = [];

        const measurementsEl = document.getElementById('measurements');
        const efficiencyEl = document.getElementById('efficiency');
        const scoreEl = document.getElementById('missionsCurrentScore');
        const positionEl = document.getElementById('probePosition');
        const fieldEl = document.getElementById('fieldStrength');

        if (measurementsEl) measurementsEl.textContent = '0';
        if (efficiencyEl) efficiencyEl.textContent = '100';
        if (scoreEl) scoreEl.textContent = '100';
        if (positionEl) positionEl.textContent = '(0, 0)';
        if (fieldEl) fieldEl.textContent = '0.0 G';

        this.generateSampleData();
        this.setupMap();

        if (this.chart) {
            this.chart.data.labels = [];
            this.chart.data.datasets[0].data = [];
            this.chart.update();
        }
    }

    closeModal() {
        const modal = document.getElementById('missionsModal');
        if (modal) modal.classList.add('hidden');
    }
}

// Module 4: Quiz System
class QuizSystem {
    constructor() {
        this.questions = [
            {
                question: "What is an NV center?",
                options: ["A nitrogen atom next to a vacancy", "A carbon defect", "A quantum dot", "A photon"],
                correct: 0,
                explanation: "NV centers consist of a nitrogen atom substituting for carbon, adjacent to a lattice vacancy."
            },
            {
                question: "What is the typical ODMR frequency for NV centers?",
                options: ["1.42 GHz", "2.87 GHz", "5.23 GHz", "10.1 GHz"],
                correct: 1,
                explanation: "NV centers have a characteristic zero-field splitting of approximately 2.87 GHz."
            },
            {
                question: "What color light is typically used to excite NV centers?",
                options: ["Red", "Green", "Blue", "Infrared"],
                correct: 1,
                explanation: "Green light (532 nm) is commonly used to optically excite NV centers."
            },
            {
                question: "NV centers can be used to detect:",
                options: ["Magnetic fields", "Temperature", "Electric fields", "All of the above"],
                correct: 3,
                explanation: "NV centers are versatile quantum sensors capable of detecting various physical quantities."
            },
            {
                question: "The spin state of an NV center can be:",
                options: ["Only ms=0", "ms=0, ±1", "ms=±1/2", "ms=0, ±1, ±2"],
                correct: 1,
                explanation: "NV centers have three spin states: ms = 0, +1, and -1."
            },
            {
                question: "What happens during optical readout of NV centers?",
                options: ["They emit microwaves", "They change color", "Fluorescence intensity changes", "They become magnetic"],
                correct: 2,
                explanation: "Different spin states have different fluorescence intensities, enabling optical readout."
            },
            {
                question: "Diamond is preferred for NV centers because:",
                options: ["It's expensive", "It has a wide bandgap", "It's shiny", "It's rare"],
                correct: 1,
                explanation: "Diamond's wide bandgap and excellent material properties make it ideal for quantum applications."
            },
            {
                question: "What causes the Zeeman effect in NV centers?",
                options: ["Electric fields", "Magnetic fields", "Temperature", "Pressure"],
                correct: 1,
                explanation: "Magnetic fields cause Zeeman splitting of the NV center energy levels."
            },
            {
                question: "Room temperature operation of NV centers is possible because:",
                options: ["They're hot", "They have long coherence times", "They don't need cooling", "They're stable defects"],
                correct: 3,
                explanation: "NV centers are stable defects that can operate at room temperature, unlike many quantum systems."
            },
            {
                question: "ODMR stands for:",
                options: ["Optical Detection of Magnetic Resonance", "Optical Diamond Measurement Research", "Optimal Data Management Routine", "Organized Detection Method Routine"],
                correct: 0,
                explanation: "ODMR (Optically Detected Magnetic Resonance) is the key technique used with NV centers."
            }
        ];
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.timeLeft = 30;
        this.timer = null;
        this.isActive = false;
        this.streak = 0;
        this.bestStreak = 0;
        this.isInitialized = false;
    }

    init() {
        if (this.isInitialized) return;
        this.bindEvents();
        this.isInitialized = true;
    }

    bindEvents() {
        const startBtn = document.getElementById('startQuiz');
        const nextBtn = document.getElementById('nextQuestion');
        const retakeBtn = document.getElementById('retakeQuiz');

        if (startBtn) {
            startBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.startQuiz();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.nextQuestion();
            });
        }

        if (retakeBtn) {
            retakeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.retakeQuiz();
            });
        }
    }

    startQuiz() {
        this.currentQuestion = 0;
        this.score = 0;
        this.correctAnswers = 0;
        this.streak = 0;
        this.isActive = true;

        const startBtn = document.getElementById('startQuiz');
        const nextBtn = document.getElementById('nextQuestion');
        const results = document.getElementById('quizResults');
        const container = document.getElementById('quizContainer');

        if (startBtn) startBtn.classList.add('hidden');
        if (nextBtn) nextBtn.classList.remove('hidden');
        if (results) results.classList.add('hidden');
        if (container) container.classList.remove('hidden');

        this.loadQuestion();
    }

    loadQuestion() {
        if (this.currentQuestion >= this.questions.length) {
            this.endQuiz();
            return;
        }

        const question = this.questions[this.currentQuestion];

        const questionNumEl = document.getElementById('questionNumber');
        const questionTextEl = document.getElementById('questionText');

        if (questionNumEl) questionNumEl.textContent = this.currentQuestion + 1;
        if (questionTextEl) questionTextEl.textContent = question.question;

        const optionsContainer = document.getElementById('optionsContainer');
        if (optionsContainer) {
            optionsContainer.innerHTML = '';

            question.options.forEach((option, index) => {
                const optionEl = document.createElement('div');
                optionEl.classList.add('quiz-option');
                optionEl.textContent = option;
                optionEl.addEventListener('click', () => this.selectAnswer(index));
                optionsContainer.appendChild(optionEl);
            });
        }

        const explanation = document.getElementById('explanation');
        const nextBtn = document.getElementById('nextQuestion');

        if (explanation) explanation.classList.add('hidden');
        if (nextBtn) nextBtn.disabled = true;

        this.timeLeft = 30;
        this.startTimer();
    }

    startTimer() {
        if (this.timer) clearInterval(this.timer);

        this.timer = setInterval(() => {
            this.timeLeft--;
            const timerEl = document.getElementById('quizTimer');
            if (timerEl) timerEl.textContent = this.timeLeft;

            if (this.timeLeft <= 0) {
                this.selectAnswer(-1); // Time's up
            }
        }, 1000);
    }

    selectAnswer(selectedIndex) {
        if (!this.isActive) return;

        this.isActive = false;
        if (this.timer) {
            clearInterval(this.timer);
            this.timer = null;
        }

        const question = this.questions[this.currentQuestion];
        const options = document.querySelectorAll('.quiz-option');

        // Highlight correct and incorrect answers
        options.forEach((option, index) => {
            if (index === question.correct) {
                option.classList.add('correct');
            } else if (index === selectedIndex) {
                option.classList.add('incorrect');
            }
            option.style.pointerEvents = 'none';
        });

        // Check if answer is correct
        if (selectedIndex === question.correct) {
            this.correctAnswers++;
            this.streak++;
            this.bestStreak = Math.max(this.bestStreak, this.streak);

            // Score based on time left and streak
            const timeBonus = this.timeLeft * 2;
            const streakBonus = this.streak * 5;
            this.score += 10 + timeBonus + streakBonus;

            gameState.addXP(10 + streakBonus);
        } else {
            this.streak = 0;
        }

        // Update UI
        const scoreEl = document.getElementById('quizCurrentScore');
        const streakEl = document.getElementById('streak');

        if (scoreEl) scoreEl.textContent = this.score;
        if (streakEl) streakEl.textContent = this.streak;

        // Show explanation
        const explanationEl = document.getElementById('explanation');
        if (explanationEl) {
            explanationEl.textContent = question.explanation;
            explanationEl.classList.remove('hidden');
        }

        const nextBtn = document.getElementById('nextQuestion');
        if (nextBtn) nextBtn.disabled = false;
    }

    nextQuestion() {
        this.currentQuestion++;
        this.isActive = true;
        this.loadQuestion();
    }

    endQuiz() {
        const container = document.getElementById('quizContainer');
        const results = document.getElementById('quizResults');

        if (container) container.classList.add('hidden');
        if (results) results.classList.remove('hidden');

        const finalScoreEl = document.getElementById('finalScore');
        const correctEl = document.getElementById('correctAnswers');
        const bestStreakEl = document.getElementById('bestStreak');

        if (finalScoreEl) finalScoreEl.textContent = this.score;
        if (correctEl) correctEl.textContent = this.correctAnswers;
        if (bestStreakEl) bestStreakEl.textContent = this.bestStreak;

        gameState.updateModuleScore('quiz', this.score);
        gameState.addXP(50);

        if (this.correctAnswers === 10) {
            gameState.awardBadge({ id: 'perfectionist', name: 'Perfectionist' });
        }

        if (this.bestStreak >= 5) {
            gameState.awardBadge({ id: 'speedRunner', name: 'Speed Runner' });
        }
    }

    retakeQuiz() {
        this.startQuiz();
    }

    closeModal() {
        const modal = document.getElementById('quizModal');
        if (modal) modal.classList.add('hidden');
    }
}

// Initialize modules
let nvGame, odmrSim, missions, quiz;

// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    // Initialize game state UI
    gameState.updateUI();

    // Initialize modules
    nvGame = new NVCreationGame();
    odmrSim = new ODMRSimulation();
    missions = new MissionsSystem();
    quiz = new QuizSystem();

    // Module tile click handlers - Fixed to open correct modules
    document.querySelectorAll('.module-tile').forEach(tile => {
        tile.addEventListener('click', (e) => {
            e.stopPropagation();
            const module = tile.dataset.module;
            if (gameState.unlockedModules.includes(module)) {
                openModule(module);
            }
        });
    });

    // Modal close handlers
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modalId = closeBtn.dataset.modal;
            const modal = document.getElementById(modalId);
            if (modal) modal.classList.add('hidden');
        });
    });

    // Continue mission button
    document.getElementById('continueBtn').addEventListener('click', () => {
        const incompleteModule = gameState.unlockedModules.find(module =>
            gameState.moduleProgress[module] < 100
        );

        if (incompleteModule) {
            openModule(incompleteModule);
        } else {
            // Find next unlocked module
            const nextModule = gameState.unlockedModules[0];
            if (nextModule) {
                openModule(nextModule);
            }
        }
    });

    // Close modals when clicking outside
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.add('hidden');
            }
        });
    });
});

function openModule(module) {
    const modalId = `${module}Modal`;
    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.remove('hidden');

        // Initialize and reset module state when opening
        switch(module) {
            case 'nv':
                nvGame.init();
                nvGame.reset();
                break;
            case 'odmr':
                odmrSim.init();
                odmrSim.reset();
                break;
            case 'missions':
                missions.init();
                missions.reset();
                break;
            case 'quiz':
                quiz.init();
                // Quiz doesn't auto-reset
                break;
        }
    }
}

// Sound effects (using Web Audio API for game-like sounds)
class SoundEngine {
    constructor() {
        this.audioContext = null;
        this.init();
    }

    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
        }
    }

    playSuccess() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(523.25, this.audioContext.currentTime); // C5
        oscillator.frequency.exponentialRampToValueAtTime(659.25, this.audioContext.currentTime + 0.1); // E5
        oscillator.frequency.exponentialRampToValueAtTime(783.99, this.audioContext.currentTime + 0.2); // G5

        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    playClick() {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }
}

const soundEngine = new SoundEngine();

// Add sound effects to interactive elements
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn') ||
        e.target.classList.contains('quiz-option') ||
        e.target.classList.contains('lattice-cell') ||
        e.target.classList.contains('module-tile')) {
        soundEngine.playClick();
    }
});

// Play success sound for achievements
const originalShowSuccess = gameState.showSuccess;
gameState.showSuccess = function(message) {
    soundEngine.playSuccess();
    originalShowSuccess.call(this, message);
};
document.addEventListener("DOMContentLoaded", () => {
    const senseBtn = document.getElementById("senseBtn");
    const decodeBtn = document.getElementById("decodeBtn");

    if (senseBtn) senseBtn.addEventListener("click", sense);
    if (decodeBtn) decodeBtn.addEventListener("click", decode);
});

