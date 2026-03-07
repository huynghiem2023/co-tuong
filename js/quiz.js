// quiz.js - Interactive quiz mode

class QuizMode {
    constructor(game, board) {
        this.game = game;
        this.board = board;
        this.active = false;
        this.score = { correct: 0, wrong: 0 };
        this.selectedPiece = null;
        this.playingAs = 'red'; // 'red' or 'black'
        this.waitingForInput = false;
    }

    activate(opening, side) {
        this.active = true;
        this.playingAs = side || 'red';
        this.score = { correct: 0, wrong: 0 };
        this.selectedPiece = null;
        this.waitingForInput = false;
        this.board.onCellClick = (row, col) => this.handleCellClick(row, col);
        this.game.loadOpening(opening);
        this.board.clearHighlights();
        this.board.render(this.game.board);
        this.updateScoreUI();
        this.showQuizInfo('Hãy chọn quân cờ và đi nước đúng!');
        document.getElementById('quiz-controls').style.display = 'flex';
        document.getElementById('tutorial-controls').style.display = 'none';

        // If playing as black, auto-play red's first move
        if (this.playingAs === 'black') {
            setTimeout(() => this.autoPlayOpponent(), 600);
        } else {
            this.waitingForInput = true;
        }
    }

    deactivate() {
        this.active = false;
        this.selectedPiece = null;
        this.waitingForInput = false;
        this.board.clearHighlights();
        document.getElementById('quiz-controls').style.display = 'none';
        document.getElementById('tutorial-controls').style.display = 'flex';
    }

    handleCellClick(row, col) {
        if (!this.active || !this.waitingForInput) return;

        const expected = this.game.getExpectedMove();
        if (!expected) return;

        const piece = this.game.getPieceAt(row, col);

        if (!this.selectedPiece) {
            // First click - select a piece
            if (!piece) return;
            const isMyPiece = this.playingAs === 'red' ? this.game.isRedPiece(piece) : this.game.isBlackPiece(piece);
            if (!isMyPiece) return;

            this.selectedPiece = { row, col };
            this.board.selectedCell = [row, col];
            this.board.render(this.game.board);
        } else {
            // Second click - try to move
            if (row === this.selectedPiece.row && col === this.selectedPiece.col) {
                // Deselect
                this.selectedPiece = null;
                this.board.selectedCell = null;
                this.board.render(this.game.board);
                return;
            }

            // Check if clicking another own piece
            if (piece) {
                const isMyPiece = this.playingAs === 'red' ? this.game.isRedPiece(piece) : this.game.isBlackPiece(piece);
                if (isMyPiece) {
                    this.selectedPiece = { row, col };
                    this.board.selectedCell = [row, col];
                    this.board.render(this.game.board);
                    return;
                }
            }

            const from = [this.selectedPiece.row, this.selectedPiece.col];
            const to = [row, col];
            this.selectedPiece = null;
            this.board.selectedCell = null;

            if (from[0] === expected.from[0] && from[1] === expected.from[1] &&
                to[0] === expected.to[0] && to[1] === expected.to[1]) {
                this.onCorrect(expected);
            } else {
                this.onWrong(expected, from, to);
            }
        }
    }

    onCorrect(move) {
        this.score.correct++;
        this.waitingForInput = false;
        this.showQuizInfo('✅ Chính xác! ' + move.explanation);
        this.flashBoard('correct');

        this.game.stepForward();
        this.board.setHighlight(move.from, move.to);
        const piece = this.game.board[move.to[0]][move.to[1]];
        this.board.animateMove(this.game.board, move.from, move.to, piece, () => {
            this.board.render(this.game.board);
            this.updateScoreUI();
            if (this.game.currentStep >= this.game.moveHistory.length - 1) {
                this.showQuizInfo('🎉 Hoàn thành! Điểm: ' + this.score.correct + '/' + (this.score.correct + this.score.wrong));
                return;
            }
            setTimeout(() => this.autoPlayOpponent(), 800);
        });
    }

    onWrong(expected, from, to) {
        this.score.wrong++;
        this.waitingForInput = false;
        this.showQuizInfo('❌ Sai! Nước đúng: ' + expected.explanation);
        this.flashBoard('wrong');
        this.updateScoreUI();

        // Show the correct move
        setTimeout(() => {
            this.game.stepForward();
            this.board.setHighlight(expected.from, expected.to);
            const piece = this.game.board[expected.to[0]][expected.to[1]];
            this.board.animateMove(this.game.board, expected.from, expected.to, piece, () => {
                this.board.render(this.game.board);
                if (this.game.currentStep >= this.game.moveHistory.length - 1) {
                    this.showQuizInfo('🎉 Hoàn thành! Điểm: ' + this.score.correct + '/' + (this.score.correct + this.score.wrong));
                    return;
                }
                setTimeout(() => this.autoPlayOpponent(), 800);
            });
        }, 1000);
    }

    autoPlayOpponent() {
        const move = this.game.getExpectedMove();
        if (!move) return;

        this.game.stepForward();
        this.board.setHighlight(move.from, move.to);
        const piece = this.game.board[move.to[0]][move.to[1]];
        this.showQuizInfo('Đối thủ đi: ' + move.explanation + ' — Đến lượt bạn!');
        this.board.animateMove(this.game.board, move.from, move.to, piece, () => {
            this.board.render(this.game.board);
            if (this.game.currentStep >= this.game.moveHistory.length - 1) {
                this.showQuizInfo('🎉 Hoàn thành! Điểm: ' + this.score.correct + '/' + (this.score.correct + this.score.wrong));
                return;
            }
            this.waitingForInput = true;
        });
    }

    showHint() {
        const expected = this.game.getExpectedMove();
        if (!expected || !this.waitingForInput) return;
        this.board.hintCells = [expected.from, expected.to];
        this.board.render(this.game.board);
        this.showQuizInfo('💡 Gợi ý: Di chuyển quân tại ô xanh.');
        setTimeout(() => {
            this.board.hintCells = [];
            this.board.render(this.game.board);
        }, 2000);
    }

    flashBoard(type) {
        const el = document.getElementById('board-container');
        el.classList.add('flash-' + type);
        setTimeout(() => el.classList.remove('flash-' + type), 500);
    }

    showQuizInfo(text) {
        document.getElementById('explanation-text').textContent = text;
    }

    updateScoreUI() {
        document.getElementById('quiz-score').textContent = `✅ ${this.score.correct}  ❌ ${this.score.wrong}`;
    }
}
