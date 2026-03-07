// game.js - Game state management for Cờ Tướng

class Game {
    constructor() {
        this.board = [];
        this.moveHistory = [];
        this.currentStep = -1;
        this.reset();
    }

    reset() {
        this.board = this.createInitialBoard();
        this.moveHistory = [];
        this.currentStep = -1;
    }

    createInitialBoard() {
        const board = [];
        for (let i = 0; i < 10; i++) {
            board.push(new Array(9).fill(null));
        }
        // Black pieces (top, rows 0-4)
        board[0] = ['r','h','e','a','k','a','e','h','r'];
        board[2][1] = 'c'; board[2][7] = 'c';
        board[3][0] = 'p'; board[3][2] = 'p'; board[3][4] = 'p';
        board[3][6] = 'p'; board[3][8] = 'p';
        // Red pieces (bottom, rows 5-9)
        board[9] = ['R','H','E','A','K','A','E','H','R'];
        board[7][1] = 'C'; board[7][7] = 'C';
        board[6][0] = 'P'; board[6][2] = 'P'; board[6][4] = 'P';
        board[6][6] = 'P'; board[6][8] = 'P';
        return board;
    }

    cloneBoard() {
        return this.board.map(row => [...row]);
    }

    loadOpening(opening) {
        this.reset();
        this.moveHistory = opening.moves.map(m => ({...m, captured: null}));
        this.currentStep = -1;
    }

    stepForward() {
        if (this.currentStep >= this.moveHistory.length - 1) return null;
        this.currentStep++;
        const move = this.moveHistory[this.currentStep];
        move.captured = this.board[move.to[0]][move.to[1]];
        this.board[move.to[0]][move.to[1]] = this.board[move.from[0]][move.from[1]];
        this.board[move.from[0]][move.from[1]] = null;
        return move;
    }

    stepBackward() {
        if (this.currentStep < 0) return null;
        const move = this.moveHistory[this.currentStep];
        this.board[move.from[0]][move.from[1]] = this.board[move.to[0]][move.to[1]];
        this.board[move.to[0]][move.to[1]] = move.captured || null;
        this.currentStep--;
        return move;
    }

    goToStart() {
        while (this.currentStep >= 0) {
            this.stepBackward();
        }
    }

    goToEnd() {
        while (this.currentStep < this.moveHistory.length - 1) {
            this.stepForward();
        }
    }

    goToStep(targetStep) {
        if (targetStep < -1 || targetStep >= this.moveHistory.length) return;
        while (this.currentStep > targetStep) this.stepBackward();
        while (this.currentStep < targetStep) this.stepForward();
    }

    getExpectedMove() {
        if (this.currentStep >= this.moveHistory.length - 1) return null;
        return this.moveHistory[this.currentStep + 1];
    }

    getPieceAt(row, col) {
        return this.board[row][col];
    }

    isRedPiece(piece) {
        return piece && piece === piece.toUpperCase();
    }

    isBlackPiece(piece) {
        return piece && piece === piece.toLowerCase();
    }

    isRedTurn() {
        return (this.currentStep + 1) % 2 === 0;
    }

    getTotalMoves() {
        return this.moveHistory.length;
    }
}
