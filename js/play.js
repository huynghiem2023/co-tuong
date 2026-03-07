// play.js - Play vs AI mode controller

class PlayMode {
    constructor(game, board) {
        this.game = game;
        this.board = board;
        this.active = false;
        this.playerIsRed = true;
        this.isPlayerTurn = true;
        this.selectedPiece = null;
        this.legalMoves = [];
        this.gameOver = false;
        this.moveCount = 0;
        this.aiThinking = false;
        this.lastPlayerCommentary = null;
        this.moveHistory = [];  // Track moves for undo
    }

    activate(playerSide) {
        this.active = true;
        this.playerIsRed = (playerSide === 'red');
        this.isPlayerTurn = true;
        this.selectedPiece = null;
        this.legalMoves = [];
        this.gameOver = false;
        this.moveCount = 0;
        this.aiThinking = false;
        this.moveHistory = [];

        // Show play controls, hide others
        document.getElementById('play-controls').style.display = 'flex';
        document.getElementById('tutorial-controls').style.display = 'none';
        document.getElementById('quiz-controls').style.display = 'none';
        document.getElementById('quiz-options').style.display = 'none';

        this.board.clearHighlights();
        this.board.onCellClick = (row, col) => this.handleCellClick(row, col);
        this.board.render(this.game.board);

        this.updateStatus('Đến lượt bạn! Chọn quân để đi.');
        this.updateMoveCount();

        // Determine whose turn based on the current board state
        const openingMoveCount = this.game.currentStep + 1;
        const isRedTurn = (openingMoveCount % 2 === 0);
        
        if ((this.playerIsRed && !isRedTurn) || (!this.playerIsRed && isRedTurn)) {
            this.isPlayerTurn = false;
            this.updateStatus('🤖 Máy đang suy nghĩ...');
            setTimeout(() => this.aiMove(), 500);
        }
    }

    deactivate() {
        this.active = false;
        this.selectedPiece = null;
        this.legalMoves = [];
        this.aiThinking = false;
        this.board.clearHighlights();
        this.board.hintCells = [];
        document.getElementById('play-controls').style.display = 'none';
    }

    handleCellClick(row, col) {
        if (!this.active || !this.isPlayerTurn || this.gameOver || this.aiThinking) return;

        try {
            const piece = this.game.board[row][col];

            if (!this.selectedPiece) {
                if (!piece) return;
                const isMyPiece = this.playerIsRed ? XiangqiRules.isRed(piece) : !XiangqiRules.isRed(piece);
                if (!isMyPiece) return;

                this.selectedPiece = { row, col };
                this.legalMoves = XiangqiRules.getLegalMoves(this.game.board, row, col);
                this.board.selectedCell = [row, col];
                this.board.hintCells = this.legalMoves;
                this.board.render(this.game.board);
            } else {
                if (row === this.selectedPiece.row && col === this.selectedPiece.col) {
                    this.clearSelection();
                    return;
                }

                if (piece) {
                    const isMyPiece = this.playerIsRed ? XiangqiRules.isRed(piece) : !XiangqiRules.isRed(piece);
                    if (isMyPiece) {
                        this.selectedPiece = { row, col };
                        this.legalMoves = XiangqiRules.getLegalMoves(this.game.board, row, col);
                        this.board.selectedCell = [row, col];
                        this.board.hintCells = this.legalMoves;
                        this.board.render(this.game.board);
                        return;
                    }
                }

                const isLegal = this.legalMoves.some(m => m[0] === row && m[1] === col);
                if (!isLegal) {
                    this.flashBoard('wrong');
                    this.updateStatus('❌ Nước đi không hợp lệ!');
                    setTimeout(() => {
                        if (this.active && this.isPlayerTurn) this.updateStatus('Đến lượt bạn!');
                    }, 1000);
                    return;
                }

                const from = [this.selectedPiece.row, this.selectedPiece.col];
                const to = [row, col];
                this.executePlayerMove(from, to);
            }
        } catch (e) {
            console.error('PlayMode handleCellClick error:', e);
            this.updateStatus('Đến lượt bạn!');
        }
    }

    executePlayerMove(from, to) {
        this.clearSelection();

        // Save info for commentary BEFORE applying move
        const movingPiece = this.game.board[from[0]][from[1]];
        const captured = this.game.board[to[0]][to[1]];
        const pieceName = this.getPieceFullName(movingPiece);
        const captureText = captured ? ` ăn ${this.getPieceFullName(captured)}` : '';

        // Save board snapshot for async evaluation
        const boardSnapshot = this.game.board.map(r => [...r]);

        // Apply the move
        this.moveHistory.push({ from, to, piece: movingPiece, captured, side: 'player' });
        this.game.board[to[0]][to[1]] = this.game.board[from[0]][from[1]];
        this.game.board[from[0]][from[1]] = null;
        this.moveCount++;

        this.board.setHighlight(from, to);
        this.board.animateMove(this.game.board, from, to, movingPiece, () => {
            this.board.render(this.game.board);
            this.updateMoveCount();

            // Check game end states
            const opponentIsRed = !this.playerIsRed;
            if (this.checkGameEnd(opponentIsRed, true)) return;

            // Show "thinking" status
            this.isPlayerTurn = false;

            // Evaluate asynchronously + then AI moves
            setTimeout(() => {
                try {
                    const commentary = this.evaluateMove(boardSnapshot, from, to, pieceName, captureText);
                    this.lastPlayerCommentary = commentary;
                    this.showPlayerCommentary(commentary);
                } catch (e) {
                    console.error('Evaluation error:', e);
                    this.lastPlayerCommentary = null;
                }

                // AI moves after a short delay
                setTimeout(() => {
                    document.getElementById('play-status').textContent = '🤖 Máy đang suy nghĩ...';
                    this.aiMove();
                }, 600);
            }, 50);
        });
    }

    executeAIMove(from, to) {
        const movingPiece = this.game.board[from[0]][from[1]];
        const captured = this.game.board[to[0]][to[1]];
        const aiPieceName = this.getPieceFullName(movingPiece);
        const aiCaptureText = captured ? ` ăn ${this.getPieceFullName(captured)}` : '';

        this.moveHistory.push({ from, to, piece: movingPiece, captured, side: 'ai' });
        this.game.board[to[0]][to[1]] = this.game.board[from[0]][from[1]];
        this.game.board[from[0]][from[1]] = null;
        this.moveCount++;

        this.board.setHighlight(from, to);
        this.board.animateMove(this.game.board, from, to, movingPiece, () => {
            this.board.render(this.game.board);
            this.updateMoveCount();

            const opponentIsRed = this.playerIsRed;
            if (this.checkGameEnd(opponentIsRed, false)) return;

            this.isPlayerTurn = true;

            // Build combined explanation with both moves
            const aiMoveText = `🤖 Máy: ${aiPieceName}${aiCaptureText}`;
            let checkText = '';
            if (XiangqiRules.isInCheck(this.game.board, this.playerIsRed)) {
                checkText = ' ⚡ Chiếu!';
            }

            document.getElementById('play-status').textContent = `Đến lượt bạn!${checkText}`;
            this.showBothMoves(aiMoveText + checkText);
        });
    }

    checkGameEnd(sideToMove, wasPlayerMove) {
        try {
            if (XiangqiRules.isCheckmate(this.game.board, sideToMove)) {
                this.gameOver = true;
                const winner = wasPlayerMove ? 'Bạn' : 'Máy';
                this.updateStatus(`🏆 ${winner} thắng! Chiếu hết!`);
                this.flashBoard(wasPlayerMove ? 'correct' : 'wrong');
                return true;
            }
            if (XiangqiRules.isStalemate(this.game.board, sideToMove)) {
                this.gameOver = true;
                this.updateStatus('🤝 Hòa cờ! (Hết nước đi)');
                return true;
            }
        } catch (e) {
            console.error('checkGameEnd error:', e);
        }
        return false;
    }

    // Lightweight evaluation: compare move scores without deep search
    evaluateMove(boardBefore, from, to, pieceName, captureText) {
        const playerIsRed = this.playerIsRed;

        // Score before the move
        const scoreBefore = XiangqiAI.evaluate(boardBefore);

        // Score after the player's move
        const boardAfterPlayer = XiangqiRules.makeMove(boardBefore, from[0], from[1], to[0], to[1]);
        const scoreAfterPlayer = XiangqiAI.evaluate(boardAfterPlayer);

        // Quick search: find the best move with depth 2 only (much faster)
        const bestMove = XiangqiAI.getBestMove(boardBefore, playerIsRed, 2, 800);

        let scoreAfterBest = scoreAfterPlayer;
        if (bestMove) {
            const boardAfterBest = XiangqiRules.makeMove(boardBefore, bestMove.from[0], bestMove.from[1], bestMove.to[0], bestMove.to[1]);
            scoreAfterBest = XiangqiAI.evaluate(boardAfterBest);
        }

        // Delta from player's perspective
        const playerDelta = playerIsRed
            ? (scoreAfterPlayer - scoreAfterBest)
            : (scoreAfterBest - scoreAfterPlayer);

        const isBestMove = bestMove &&
            from[0] === bestMove.from[0] && from[1] === bestMove.from[1] &&
            to[0] === bestMove.to[0] && to[1] === bestMove.to[1];

        let rating, emoji, detail;

        if (isBestMove) {
            rating = 'Xuất sắc'; emoji = '🔥';
            detail = 'Đây là nước đi tốt nhất!';
        } else if (playerDelta >= -20) {
            rating = 'Nước đi tốt'; emoji = '👍';
            detail = 'Nước đi gần như tối ưu.';
        } else if (playerDelta >= -80) {
            rating = 'Tạm được'; emoji = '🤔';
            detail = 'Có nước đi tốt hơn.';
        } else if (playerDelta >= -200) {
            rating = 'Nước đi yếu'; emoji = '😬';
            detail = 'Nước này mất lợi thế đáng kể.';
        } else {
            rating = 'Sai lầm!'; emoji = '💀';
            detail = 'Nước đi rất tệ, mất lợi thế lớn!';
        }

        return { emoji, rating, detail, pieceName, captureText };
    }

    showPlayerCommentary(c) {
        const statusText = `${c.emoji} ${c.rating}: ${c.pieceName}${c.captureText}`;
        document.getElementById('play-status').textContent = statusText;
        document.getElementById('explanation-text').innerHTML =
            `<div style="margin-bottom:6px"><strong>🎯 Bạn:</strong> ${c.pieceName}${c.captureText} — ${c.emoji} ${c.rating}</div>` +
            `<div style="color:#8888a0; font-size:12px">${c.detail}</div>`;
    }

    showBothMoves(aiMoveText) {
        const el = document.getElementById('explanation-text');
        let playerLine = '';
        if (this.lastPlayerCommentary) {
            const c = this.lastPlayerCommentary;
            playerLine = `<div style="margin-bottom:6px"><strong>🎯 Bạn:</strong> ${c.pieceName}${c.captureText} — ${c.emoji} ${c.rating}</div>` +
                `<div style="color:#8888a0; font-size:12px; margin-bottom:8px">${c.detail}</div>`;
        }
        const aiLine = `<div><strong>${aiMoveText}</strong></div>`;
        el.innerHTML = playerLine + aiLine;
    }

    getPieceFullName(piece) {
        if (!piece) return '';
        const names = {
            'K': 'Tướng', 'A': 'Sĩ', 'E': 'Tượng', 'R': 'Xe', 'H': 'Mã', 'C': 'Pháo', 'P': 'Tốt',
            'k': 'Tướng', 'a': 'Sĩ', 'e': 'Tượng', 'r': 'Xe', 'h': 'Mã', 'c': 'Pháo', 'p': 'Tốt'
        };
        const side = XiangqiRules.isRed(piece) ? 'Đỏ' : 'Đen';
        return `${names[piece]} ${side}`;
    }

    aiMove() {
        if (!this.active || this.gameOver) return;
        this.aiThinking = true;

        setTimeout(() => {
            try {
                const aiIsRed = !this.playerIsRed;
                const move = XiangqiAI.getBestMove(this.game.board, aiIsRed, 3, 2000);

                if (!move) {
                    this.gameOver = true;
                    this.updateStatus('🏆 Bạn thắng! Máy hết nước đi!');
                    this.aiThinking = false;
                    return;
                }

                this.aiThinking = false;
                this.executeAIMove(move.from, move.to);
            } catch (e) {
                console.error('AI move error:', e);
                this.aiThinking = false;
                this.isPlayerTurn = true;
                this.updateStatus('⚠️ Lỗi AI. Đến lượt bạn!');
            }
        }, 100);
    }

    clearSelection() {
        this.selectedPiece = null;
        this.legalMoves = [];
        this.board.selectedCell = null;
        this.board.hintCells = [];
        this.board.render(this.game.board);
    }

    showHint() {
        if (!this.active || !this.isPlayerTurn || this.gameOver || this.aiThinking) return;
        try {
            this.updateStatus('💡 Đang tìm nước gợi ý...');
            setTimeout(() => {
                const bestMove = XiangqiAI.getBestMove(this.game.board, this.playerIsRed, 2, 800);
                if (!bestMove) {
                    this.updateStatus('Không tìm thấy gợi ý!');
                    return;
                }
                const pieceName = this.getPieceFullName(this.game.board[bestMove.from[0]][bestMove.from[1]]);
                this.board.hintCells = [bestMove.from, bestMove.to];
                this.board.render(this.game.board);
                this.updateStatus(`💡 Gợi ý: Di chuyển ${pieceName}`);
                document.getElementById('explanation-text').textContent =
                    `💡 Gợi ý: Di chuyển ${pieceName} từ ô xanh.`;
                setTimeout(() => {
                    if (this.active) {
                        this.board.hintCells = [];
                        this.board.render(this.game.board);
                    }
                }, 3000);
            }, 50);
        } catch (e) {
            console.error('Hint error:', e);
            this.updateStatus('Đến lượt bạn!');
        }
    }

    resign() {
        if (!this.active || this.gameOver) return;
        this.gameOver = true;
        this.updateStatus('🏳️ Bạn đã đầu hàng! Máy thắng.');
        this.flashBoard('wrong');
    }

    undo() {
        if (!this.active || this.gameOver || this.aiThinking) return;
        if (this.moveHistory.length === 0) return;

        // Undo AI's last move + player's last move (2 moves)
        let undoCount = 0;
        while (this.moveHistory.length > 0 && undoCount < 2) {
            const lastMove = this.moveHistory.pop();
            // Reverse the move
            this.game.board[lastMove.from[0]][lastMove.from[1]] = lastMove.piece;
            this.game.board[lastMove.to[0]][lastMove.to[1]] = lastMove.captured || null;
            this.moveCount--;
            undoCount++;
        }

        this.isPlayerTurn = true;
        this.selectedPiece = null;
        this.legalMoves = [];
        this.board.clearHighlights();
        this.board.render(this.game.board);
        this.updateMoveCount();
        this.lastPlayerCommentary = null;
        this.updateStatus('↩️ Đã hoàn tác. Đến lượt bạn!');
        document.getElementById('explanation-text').textContent = '↩️ Đã hoàn tác 1 lượt. Hãy đi lại!';
    }

    updateStatus(text) {
        document.getElementById('play-status').textContent = text;
        document.getElementById('explanation-text').textContent = text;
    }

    updateMoveCount() {
        document.getElementById('play-move-count').textContent = `Nước đi: ${this.moveCount}`;
    }

    flashBoard(type) {
        const el = document.getElementById('board-container');
        el.classList.add('flash-' + type);
        setTimeout(() => el.classList.remove('flash-' + type), 500);
    }
}
