(function() {
    const btnRed = document.getElementById('btnRed');
    const btnBlue = document.getElementById('btnBlue');
    const btnYellow = document.getElementById('btnYellow');
    const btnGreen = document.getElementById('btnGreen');
    const btnStart = document.getElementById('btnStart');
    const btnRestart = document.getElementById('btnRestart');
    const levelDisplay = document.getElementById('levelDisplay');
    const messageText = document.getElementById('messageText');
    const highScoreValue = document.getElementById('highScoreValue');
    const gameOverOverlay = document.getElementById('gameOverOverlay');
    const finalScore = document.getElementById('finalScore');
    const finalHighScore = document.getElementById('finalHighScore');
    
    const colorButtons = { red: btnRed, blue: btnBlue, yellow: btnYellow, green: btnGreen };
    const toneFrequencies = { red: 196.0, blue: 261.6, yellow: 329.6, green: 392.0 };
    
    let audioCtx = null;
    const state = {
        sequence: [],
        playerIndex: 0,
        level: 0,
        highScore: 0,
        isPlaying: false,
        isShowingSequence: false,
        isAcceptingInput: false,
    };

    function getAudioContext() {
        if (!audioCtx || audioCtx.state === 'closed') {
            audioCtx = new(window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtx.state === 'suspended') audioCtx.resume();
        return audioCtx;
    }

    function playTone(color, duration = 300) {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            const freq = toneFrequencies[color] || 440;
            
            const osc = ctx.createOscillator();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now);
            
            const gainNode = ctx.createGain();
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.35, now + 0.02);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
            
            const osc2 = ctx.createOscillator();
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(freq * 1.01, now);
            const gain2 = ctx.createGain();
            gain2.gain.setValueAtTime(0, now);
            gain2.gain.linearRampToValueAtTime(0.15, now + 0.02);
            gain2.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
            
            osc.connect(gainNode);
            osc2.connect(gain2);
            gainNode.connect(ctx.destination);
            gain2.connect(ctx.destination);
            osc.start(now);
            osc2.start(now);
            osc.stop(now + duration / 1000 + 0.05);
            osc2.stop(now + duration / 1000 + 0.05);
        } catch (e) {
            console.warn('Audio play failed:', e.message);
        }
    }

    function playErrorTone() {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            const osc = ctx.createOscillator();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, now);
            osc.frequency.linearRampToValueAtTime(80, now + 0.4);
            const gain = ctx.createGain();
            gain.gain.setValueAtTime(0.25, now);
            gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start(now);
            osc.stop(now + 0.55);
        } catch (e) {
            console.warn('Error tone failed:', e.message);
        }
    }

    function playVictoryTone() {
        try {
            const ctx = getAudioContext();
            const now = ctx.currentTime;
            const notes = [523.25, 659.25, 783.99, 1046.5];
            notes.forEach((freq, i) => {
                const osc = ctx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, now + i * 0.1);
                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0, now + i * 0.1);
                gain.gain.linearRampToValueAtTime(0.3, now + i * 0.1 + 0.03);
                gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.3);
            });
        } catch (e) {
            console.warn('Victory tone failed:', e.message);
        }
    }

    function loadHighScore() {
        try {
            const saved = localStorage.getItem('simonGameHighScore');
            if (saved !== null) {
                const parsed = parseInt(saved, 10);
                if (!isNaN(parsed) && parsed >= 0) state.highScore = parsed;
            }
        } catch (e) {}
        updateHighScoreDisplay();
    }

    function saveHighScore() {
        try {
            localStorage.setItem('simonGameHighScore', state.highScore.toString());
        } catch (e) {}
    }

    function updateHighScoreDisplay() {
        highScoreValue.textContent = state.highScore;
    }

    function updateLevelDisplay() {
        levelDisplay.textContent = state.level;
        levelDisplay.classList.remove('pulse');
        void levelDisplay.offsetWidth;
        levelDisplay.classList.add('pulse');
    }

    function setMessage(msg, type = '') {
        messageText.textContent = msg;
        messageText.className = 'message-text';
        if (type) messageText.classList.add(type);
    }

    function showGameOverOverlay() {
        finalScore.textContent = 'Level ' + state.level;
        finalHighScore.textContent = 'Best: Level ' + state.highScore;
        gameOverOverlay.classList.remove('hidden');
    }

    function hideGameOverOverlay() {
        gameOverOverlay.classList.add('hidden');
    }

    function setStartButtonState(enabled) {
        btnStart.disabled = !enabled;
        btnStart.textContent = enabled ? '▶\u00A0 Start' : '⏳\u00A0 Wait...';
        btnStart.style.opacity = enabled ? '1' : '0.5';
        btnStart.style.cursor = enabled ? 'pointer' : 'not-allowed';
        btnStart.style.pointerEvents = enabled ? 'auto' : 'none';
    }

    function lightUpButton(color, duration = 350) {
        const btn = colorButtons[color];
        if (!btn) return;
        btn.classList.add('lit');
        playTone(color, duration);
        setTimeout(() => btn.classList.remove('lit'), duration);
    }

    function pressButtonVisual(color) {
        const btn = colorButtons[color];
        if (!btn) return;
        btn.classList.add('pressed');
        playTone(color, 250);
        setTimeout(() => btn.classList.remove('pressed'), 180);
    }

    function playSequence(index = 0) {
        if (index >= state.sequence.length) {
            state.isShowingSequence = false;
            state.isAcceptingInput = true;
            state.playerIndex = 0;
            setMessage('Your turn! Repeat the sequence.', 'success');
            setStartButtonState(false);
            return;
        }
        state.isShowingSequence = true;
        state.isAcceptingInput = false;
        setStartButtonState(false);
        const color = state.sequence[index];
        const baseDelay = Math.max(200, 500 - state.level * 20);
        const gapBetween = Math.max(120, 350 - state.level * 15);
        setTimeout(() => {
            lightUpButton(color, baseDelay);
            setTimeout(() => playSequence(index + 1), gapBetween);
        }, index === 0 ? 400 : 0);
    }

    function generateNextColor() {
        const colors = ['red', 'blue', 'yellow', 'green'];
        return colors[Math.floor(Math.random() * 4)];
    }

    function addToSequence() {
        state.sequence.push(generateNextColor());
        state.level = state.sequence.length;
        updateLevelDisplay();
        setMessage('Watch the sequence...', '');
    }

    function startNewGame() {
        state.sequence = [];
        state.playerIndex = 0;
        state.level = 0;
        state.isPlaying = true;
        state.isShowingSequence = false;
        state.isAcceptingInput = false;
        hideGameOverOverlay();
        updateLevelDisplay();
        setMessage('Get ready...', '');
        setStartButtonState(false);
        addToSequence();
        setTimeout(() => {
            setMessage('Watch the sequence...', '');
            playSequence(0);
        }, 600);
    }

    function handlePlayerInput(color) {
        if (!state.isAcceptingInput || !state.isPlaying || state.isShowingSequence) return;
        const expectedColor = state.sequence[state.playerIndex];
        pressButtonVisual(color);
        if (color === expectedColor) {
            state.playerIndex++;
            if (state.playerIndex >= state.sequence.length) {
                state.isAcceptingInput = false;
                setMessage('Correct! Next round...', 'success');
                playVictoryTone();
                if (state.level > state.highScore) {
                    state.highScore = state.level;
                    updateHighScoreDisplay();
                    saveHighScore();
                }
                setTimeout(() => {
                    addToSequence();
                    updateLevelDisplay();
                    setMessage('Watch the sequence...', '');
                    playSequence(0);
                }, 900);
            }
        } else {
            gameOver(color);
        }
    }

    function gameOver(wrongColor) {
        state.isPlaying = false;
        state.isAcceptingInput = false;
        state.isShowingSequence = false;
        setStartButtonState(true);
        const btn = colorButtons[wrongColor];
        if (btn) {
            btn.classList.add('pressed');
            setTimeout(() => btn.classList.remove('pressed'), 350);
        }
        playErrorTone();
        Object.values(colorButtons).forEach(b => b.classList.add('pressed'));
        setTimeout(() => Object.values(colorButtons).forEach(b => b.classList.remove('pressed')), 300);
        setMessage('Game Over! Press Start to try again.', 'error');
        if (state.level > state.highScore) {
            state.highScore = state.level;
            updateHighScoreDisplay();
            saveHighScore();
        }
        setTimeout(() => showGameOverOverlay(), 500);
        btnStart.textContent = '▶\u00A0 Retry';
        btnStart.disabled = false;
        btnStart.style.opacity = '1';
        btnStart.style.cursor = 'pointer';
        btnStart.style.pointerEvents = 'auto';
    }

    function resetToIdle() {
        state.isPlaying = false;
        state.isAcceptingInput = false;
        state.isShowingSequence = false;
        state.sequence = [];
        state.playerIndex = 0;
        state.level = 0;
        updateLevelDisplay();
        setMessage('Press Start to play', '');
        setStartButtonState(true);
        hideGameOverOverlay();
        btnStart.textContent = '▶\u00A0 Start';
        btnStart.disabled = false;
        btnStart.style.opacity = '1';
        btnStart.style.cursor = 'pointer';
        btnStart.style.pointerEvents = 'auto';
    }

    btnRed.addEventListener('click', () => handlePlayerInput('red'));
    btnBlue.addEventListener('click', () => handlePlayerInput('blue'));
    btnYellow.addEventListener('click', () => handlePlayerInput('yellow'));
    btnGreen.addEventListener('click', () => handlePlayerInput('green'));

    Object.entries(colorButtons).forEach(([color, btn]) => {
        btn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handlePlayerInput(color);
        });
    });

    btnStart.addEventListener('click', () => {
        if (!state.isPlaying) startNewGame();
        else if (state.isPlaying && !state.isAcceptingInput && !state.isShowingSequence) startNewGame();
    });

    btnRestart.addEventListener('click', () => {
        hideGameOverOverlay();
        startNewGame();
    });

    document.addEventListener('keydown', (e) => {
        if (!state.isAcceptingInput) return;
        const keyMap = {
            'q': 'red', 'w': 'blue', 'a': 'yellow', 's': 'green',
            'ArrowUp': 'red', 'ArrowRight': 'blue', 'ArrowDown': 'yellow', 'ArrowLeft': 'green',
            '1': 'red', '2': 'blue', '3': 'yellow', '4': 'green',
        };
        const color = keyMap[e.key.toLowerCase()];
        if (color) {
            e.preventDefault();
            handlePlayerInput(color);
        }
    });

    gameOverOverlay.addEventListener('click', (e) => {
        if (e.target === gameOverOverlay) {
            hideGameOverOverlay();
            resetToIdle();
        }
    });

    loadHighScore();
    updateLevelDisplay();
    setMessage('Press Start to play', '');
    setStartButtonState(true);
    hideGameOverOverlay();
    
    console.log('🟢🔵🟡🔴 Simon Game | Group 6 | Ready to play!');
})();
