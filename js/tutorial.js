// tutorial.js - Step-by-step tutorial mode

class TutorialMode {
    constructor(game, board) {
        this.game = game;
        this.board = board;
        this.active = false;
        this.autoPlayTimer = null;
        this.setupControls();
    }

    setupControls() {
        document.getElementById('btn-start').addEventListener('click', () => this.goToStart());
        document.getElementById('btn-prev').addEventListener('click', () => this.stepBack());
        document.getElementById('btn-next').addEventListener('click', () => this.stepForward());
        document.getElementById('btn-end').addEventListener('click', () => this.goToEnd());
        document.getElementById('btn-autoplay').addEventListener('click', () => this.toggleAutoPlay());
        document.addEventListener('keydown', (e) => {
            if (!this.active) return;
            if (e.key === 'ArrowLeft') this.stepBack();
            else if (e.key === 'ArrowRight') this.stepForward();
            else if (e.key === 'Home') this.goToStart();
            else if (e.key === 'End') this.goToEnd();
        });
    }

    activate(opening) {
        this.active = true;
        this.stopAutoPlay();
        this.game.loadOpening(opening);
        this.board.clearHighlights();
        this.board.render(this.game.board);
        this.updateUI();
        this.updateExplanation('Nhấn ▶ hoặc phím → để bắt đầu xem các nước đi.');
    }

    deactivate() {
        this.active = false;
        this.stopAutoPlay();
    }

    stepForward() {
        if (!this.active) return;
        const move = this.game.stepForward();
        if (move) {
            this.board.setHighlight(move.from, move.to);
            const piece = this.game.board[move.to[0]][move.to[1]];
            this.board.animateMove(this.game.board, move.from, move.to, piece, () => {
                this.board.render(this.game.board);
            });
            this.updateExplanation(move.explanation);
        }
        this.updateUI();
    }

    stepBack() {
        if (!this.active) return;
        this.stopAutoPlay();
        const move = this.game.stepBackward();
        if (move) {
            if (this.game.currentStep >= 0) {
                const prev = this.game.moveHistory[this.game.currentStep];
                this.board.setHighlight(prev.from, prev.to);
                this.updateExplanation(prev.explanation);
            } else {
                this.board.clearHighlights();
                this.updateExplanation('Đã về nước đầu tiên.');
            }
            this.board.render(this.game.board);
        }
        this.updateUI();
    }

    goToStart() {
        if (!this.active) return;
        this.stopAutoPlay();
        this.game.goToStart();
        this.board.clearHighlights();
        this.board.render(this.game.board);
        this.updateExplanation('Đã về vị trí ban đầu.');
        this.updateUI();
    }

    goToEnd() {
        if (!this.active) return;
        this.stopAutoPlay();
        this.game.goToEnd();
        if (this.game.currentStep >= 0) {
            const move = this.game.moveHistory[this.game.currentStep];
            this.board.setHighlight(move.from, move.to);
            this.updateExplanation(move.explanation);
        }
        this.board.render(this.game.board);
        this.updateUI();
    }

    toggleAutoPlay() {
        if (this.autoPlayTimer) {
            this.stopAutoPlay();
        } else {
            this.startAutoPlay();
        }
    }

    startAutoPlay() {
        const btn = document.getElementById('btn-autoplay');
        btn.textContent = '⏸';
        btn.classList.add('playing');
        this.autoPlayTimer = setInterval(() => {
            if (this.game.currentStep >= this.game.moveHistory.length - 1) {
                this.stopAutoPlay();
                return;
            }
            this.stepForward();
        }, 1500);
    }

    stopAutoPlay() {
        if (this.autoPlayTimer) {
            clearInterval(this.autoPlayTimer);
            this.autoPlayTimer = null;
        }
        const btn = document.getElementById('btn-autoplay');
        btn.textContent = '⏵';
        btn.classList.remove('playing');
    }

    updateUI() {
        const current = this.game.currentStep + 1;
        const total = this.game.getTotalMoves();
        document.getElementById('move-counter').textContent = `${current} / ${total}`;
        const pct = total > 0 ? (current / total) * 100 : 0;
        document.getElementById('progress-fill').style.width = pct + '%';
        document.getElementById('btn-prev').disabled = this.game.currentStep < 0;
        document.getElementById('btn-start').disabled = this.game.currentStep < 0;
        document.getElementById('btn-next').disabled = this.game.currentStep >= total - 1;
        document.getElementById('btn-end').disabled = this.game.currentStep >= total - 1;

        // Update move list highlights
        const items = document.querySelectorAll('.move-item');
        items.forEach((item, i) => {
            item.classList.toggle('active', i === this.game.currentStep);
        });
        const activeItem = document.querySelector('.move-item.active');
        if (activeItem) activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    updateExplanation(text) {
        document.getElementById('explanation-text').textContent = text;
    }
}
