// app.js - Main application controller

class App {
    constructor() {
        this.game = new Game();
        this.board = new BoardRenderer('game-board');
        this.sound = new SoundManager();
        this.tutorial = new TutorialMode(this.game, this.board);
        this.quiz = new QuizMode(this.game, this.board);
        this.play = new PlayMode(this.game, this.board, this.sound);
        this.autoFlip = localStorage.getItem('cotuong_autoflip') !== 'false'; // default: true
        this.currentOpening = null;
        this.currentMode = 'tutorial';
        this.buildMenu();
        this.setupModeSwitch();
        this.setupMobileMenu();
        this.setupQuizButtons();
        this.setupPlayButtons();
        this.setupThemeSelector();
        this.setupSoundToggle();
        this.setupFlipToggle();
        this.board.render(this.game.board);
        // Auto-select first opening
        if (OPENINGS.length > 0) {
            this.selectOpening(OPENINGS[0]);
        }
    }

    buildMenu() {
        const menu = document.getElementById('opening-menu');
        menu.innerHTML = '';
        const categories = getOpeningsByCategory();
        const icons = {
            'Pháo đầu đối Bình phong mã': '🔴',
            'Pháo đầu đối Thuận pháo': '🔶',
            'Pháo đầu đối Nghịch pháo': '🟠',
            'Pháo đầu đối Đơn đề mã': '🟡',
            'Pháo đầu đối Phản cung mã': '🟢',
            'Pháo đầu - Biến thể đặc biệt': '💎',
            'Phi tượng cục': '🐘',
            'Tiên nhân chỉ lộ': '👤',
            'Khởi mã cục': '🐴',
            'Sĩ tượng cục': '🏯',
            'Thế trận đặc biệt': '⭐',
            'Quá cung pháo': '💥'
        };

        for (const [cat, openings] of Object.entries(categories)) {
            const group = document.createElement('div');
            group.className = 'menu-group';
            const header = document.createElement('div');
            header.className = 'menu-group-header';
            header.innerHTML = `<span>${icons[cat] || '📌'} ${cat}</span><span class="chevron">▾</span>`;
            header.addEventListener('click', () => {
                group.classList.toggle('collapsed');
            });
            group.appendChild(header);

            const list = document.createElement('div');
            list.className = 'menu-group-list';
            for (const op of openings) {
                const item = document.createElement('div');
                item.className = 'menu-item';
                item.textContent = op.name;
                item.dataset.id = op.id;
                item.addEventListener('click', () => {
                    this.selectOpening(op);
                    this.closeMobileMenu();
                });
                list.appendChild(item);
            }
            group.appendChild(list);
            menu.appendChild(group);
        }
    }

    selectOpening(opening) {
        this.currentOpening = opening;
        // Update active menu item
        document.querySelectorAll('.menu-item').forEach(el => {
            el.classList.toggle('active', el.dataset.id === opening.id);
        });
        // Update info
        document.getElementById('opening-name').textContent = opening.name;
        document.getElementById('opening-desc').textContent = opening.description;
        this.buildMoveList(opening);

        if (this.currentMode === 'tutorial') {
            this.play.deactivate();
            this.tutorial.activate(opening);
            this.quiz.deactivate();
        } else {
            this.play.deactivate();
            this.startQuiz();
        }
    }

    buildMoveList(opening) {
        const list = document.getElementById('move-list');
        list.innerHTML = '';
        opening.moves.forEach((move, i) => {
            const item = document.createElement('div');
            item.className = 'move-item';
            const side = i % 2 === 0 ? 'Đỏ' : 'Đen';
            const sideClass = i % 2 === 0 ? 'red' : 'black';
            item.innerHTML = `<span class="move-num">${i + 1}.</span>
                <span class="move-side ${sideClass}">${side}</span>
                <span class="move-text">${move.explanation.split(' - ')[0]}</span>`;
            item.addEventListener('click', () => {
                if (this.currentMode === 'tutorial') {
                    this.game.goToStep(i);
                    if (i >= 0) {
                        const m = this.game.moveHistory[i];
                        this.board.setHighlight(m.from, m.to);
                        this.tutorial.updateExplanation(m.explanation);
                    }
                    this.board.render(this.game.board);
                    this.tutorial.updateUI();
                }
            });
            list.appendChild(item);
        });
    }

    setupModeSwitch() {
        document.getElementById('mode-tutorial').addEventListener('click', () => {
            this.currentMode = 'tutorial';
            document.getElementById('mode-tutorial').classList.add('active');
            document.getElementById('mode-quiz').classList.remove('active');
            document.getElementById('quiz-controls').style.display = 'none';
            document.getElementById('tutorial-controls').style.display = 'flex';
            document.getElementById('quiz-options').style.display = 'none';
            document.getElementById('play-options').style.display = 'none';
            document.getElementById('play-controls').style.display = 'none';
            this.play.deactivate();
            if (this.currentOpening) this.selectOpening(this.currentOpening);
        });
        document.getElementById('mode-quiz').addEventListener('click', () => {
            this.currentMode = 'quiz';
            document.getElementById('mode-quiz').classList.add('active');
            document.getElementById('mode-tutorial').classList.remove('active');
            document.getElementById('tutorial-controls').style.display = 'none';
            document.getElementById('quiz-options').style.display = 'flex';
            document.getElementById('play-options').style.display = 'none';
            document.getElementById('play-controls').style.display = 'none';
            this.play.deactivate();
            if (this.currentOpening) this.showQuizOptions();
        });
    }

    showQuizOptions() {
        document.getElementById('quiz-options').style.display = 'flex';
        document.getElementById('quiz-controls').style.display = 'none';
    }

    startQuiz(side) {
        side = side || 'red';
        document.getElementById('quiz-options').style.display = 'none';
        document.getElementById('play-controls').style.display = 'none';
        if (this.currentOpening) {
            this.play.deactivate();
            this.tutorial.deactivate();
            this.quiz.activate(this.currentOpening, side);
        }
    }

    startPlayAI(side) {
        if (!this.currentOpening) return;
        // Pre-load Fairy-Stockfish engine while player is making first move
        XiangqiAI.initFairyStockfish();
        // First go to end of opening
        this.game.goToEnd();
        this.board.render(this.game.board);
        
        this.currentMode = 'play';
        document.getElementById('mode-tutorial').classList.remove('active');
        document.getElementById('mode-quiz').classList.remove('active');
        document.getElementById('tutorial-controls').style.display = 'none';
        document.getElementById('quiz-controls').style.display = 'none';
        document.getElementById('quiz-options').style.display = 'none';
        document.getElementById('play-options').style.display = 'none';
        
        this.tutorial.deactivate();
        this.quiz.deactivate();
        this.play.activate(side);
    }

    setupQuizButtons() {
        document.getElementById('quiz-red').addEventListener('click', () => this.startQuiz('red'));
        document.getElementById('quiz-black').addEventListener('click', () => this.startQuiz('black'));
        document.getElementById('btn-hint').addEventListener('click', () => this.quiz.showHint());
        document.getElementById('btn-retry').addEventListener('click', () => {
            if (this.currentOpening) this.startQuiz(this.quiz.playingAs);
        });
    }

    setupPlayButtons() {
        document.getElementById('btn-play-ai').addEventListener('click', () => {
            if (this.currentOpening) {
                // Show side selection instead of directly starting
                document.getElementById('tutorial-controls').style.display = 'none';
                document.getElementById('quiz-controls').style.display = 'none';
                document.getElementById('quiz-options').style.display = 'none';
                document.getElementById('play-controls').style.display = 'none';
                document.getElementById('play-options').style.display = 'flex';
            }
        });
        document.getElementById('play-red').addEventListener('click', () => {
            document.getElementById('play-options').style.display = 'none';
            if (this.currentOpening) this.startPlayAI('red');
        });
        document.getElementById('play-black').addEventListener('click', () => {
            document.getElementById('play-options').style.display = 'none';
            if (this.currentOpening) this.startPlayAI('black');
        });
        document.getElementById('btn-play-hint').addEventListener('click', () => {
            this.play.showHint();
        });
        document.getElementById('btn-undo').addEventListener('click', () => {
            this.play.undo();
        });
        document.getElementById('btn-resign').addEventListener('click', () => {
            this.play.resign();
        });
        document.getElementById('btn-new-game').addEventListener('click', () => {
            if (this.currentOpening) {
                this.selectOpening(this.currentOpening);
                this.currentMode = 'tutorial';
                document.getElementById('mode-tutorial').classList.add('active');
                document.getElementById('mode-quiz').classList.remove('active');
                document.getElementById('play-controls').style.display = 'none';
                document.getElementById('play-options').style.display = 'none';
                document.getElementById('tutorial-controls').style.display = 'flex';
                this.play.deactivate();
            }
        });
    }

    setupMobileMenu() {
        document.getElementById('mobile-menu-btn').addEventListener('click', () => {
            document.getElementById('sidebar').classList.toggle('open');
            document.getElementById('overlay').classList.toggle('show');
        });
        document.getElementById('overlay').addEventListener('click', () => this.closeMobileMenu());
    }

    setupThemeSelector() {
        const select = document.getElementById('theme-select');
        select.addEventListener('change', () => {
            this.board.setTheme(select.value);
            this.board.render(this.game.board);
        });
    }

    setupSoundToggle() {
        const btn = document.getElementById('btn-sound-toggle');
        if (!btn) return;
        // Update initial icon
        btn.textContent = this.sound.muted ? '🔇' : '🔊';
        btn.addEventListener('click', () => {
            const muted = this.sound.toggleMute();
            btn.textContent = muted ? '🔇' : '🔊';
        });
        // Initialize AudioContext on first user interaction anywhere
        // On mobile, keep retrying until audio is actually unlocked
        const initAudio = () => {
            this.sound.init();
            if (this.sound._audioUnlocked) {
                document.removeEventListener('click', initAudio);
                document.removeEventListener('touchstart', initAudio);
            }
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('touchstart', initAudio);
    }

    setupFlipToggle() {
        const btn = document.getElementById('btn-flip-toggle');
        if (!btn) return;
        // Update initial state
        this._updateFlipBtn(btn);
        btn.addEventListener('click', () => {
            this.autoFlip = !this.autoFlip;
            localStorage.setItem('cotuong_autoflip', this.autoFlip);
            this._updateFlipBtn(btn);
            // Apply immediately if in play mode
            if (this.play.active) {
                this.board.flipped = this.autoFlip ? !this.play.playerIsRed : false;
                this.board.render(this.game.board);
            }
        });
    }

    _updateFlipBtn(btn) {
        if (this.autoFlip) {
            btn.style.opacity = '1';
            btn.title = 'Tự động xoay bàn cờ: BẬT (click để tắt)';
        } else {
            btn.style.opacity = '0.5';
            btn.title = 'Tự động xoay bàn cờ: TẮT (click để bật)';
        }
    }

    closeMobileMenu() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('overlay').classList.remove('show');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
