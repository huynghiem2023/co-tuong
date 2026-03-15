// play.js - Play vs AI mode controller

class PlayMode {
    constructor(game, board, sound) {
        this.game = game;
        this.board = board;
        this.sound = sound;
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
        this.board.flipped = (window.app && window.app.autoFlip) ? !this.playerIsRed : false;
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
        this.board.flipped = false;
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
                if (this.sound) this.sound.playSelect();
                this.legalMoves = XiangqiRules.getLegalMoves(this.game.board, row, col);
                // Debug: show why moves are filtered
                const rawMoves = XiangqiRules.generateRawMoves(this.game.board, row, col);
                console.log(`🔍 Selected ${piece} at [${row},${col}]`);
                console.log(`   Raw moves: ${rawMoves.length}`, rawMoves);
                console.log(`   Legal moves: ${this.legalMoves.length}`, this.legalMoves);
                if (rawMoves.length > 0 && this.legalMoves.length === 0) {
                    console.warn(`   ⚠️ All moves filtered! Checking why...`);
                    for (const [tr, tc] of rawMoves) {
                        const nb = XiangqiRules.makeMove(this.game.board, row, col, tr, tc);
                        const inCheck = XiangqiRules.isInCheck(nb, this.playerIsRed);
                        const facing = XiangqiRules.kingsAreFacing(nb);
                        if (inCheck || facing) {
                            console.warn(`   [${row},${col}]→[${tr},${tc}]: BLOCKED (check=${inCheck}, kingsFacing=${facing})`);
                        }
                    }
                }
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
                        if (this.sound) this.sound.playSelect();
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
                    if (this.sound) this.sound.playInvalid();
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
        // Save for ponder check — AI can respond instantly if it predicted this move
        this._lastPlayerMove = { from, to };

        // Save info for commentary BEFORE applying move
        const movingPiece = this.game.board[from[0]][from[1]];
        const captured = this.game.board[to[0]][to[1]];
        const pieceName = this.getPieceFullName(movingPiece);
        const captureText = captured ? ` ăn ${this.getPieceFullName(captured)}` : '';

        // Save board snapshot for deferred evaluation (will evaluate AFTER AI responds)
        this._pendingEval = {
            boardSnapshot: this.game.board.map(r => [...r]),
            from, to, pieceName, captureText
        };

        // Apply the move
        this.moveHistory.push({ from, to, piece: movingPiece, captured, side: 'player' });
        this.game.board[to[0]][to[1]] = this.game.board[from[0]][from[1]];
        this.game.board[from[0]][from[1]] = null;
        this.moveCount++;

        this.board.setHighlight(from, to);
        this.board.animateMove(this.game.board, from, to, movingPiece, () => {
            // Play move or capture sound
            if (this.sound) {
                if (captured) this.sound.playCapture();
                else this.sound.playMove();
            }
            this.board.render(this.game.board);
            this.updateMoveCount();

            // Check game end states
            const opponentIsRed = !this.playerIsRed;
            if (this.checkGameEnd(opponentIsRed, true)) return;

            // Play check sound if opponent is in check (non-checkmate)
            if (this.sound && XiangqiRules.isInCheck(this.game.board, opponentIsRed)) {
                this.sound.playCheck();
            }

            // Show "thinking" status and start AI immediately
            this.isPlayerTurn = false;
            document.getElementById('play-status').textContent = '🤖 Máy đang suy nghĩ...';
            setTimeout(() => this.aiMove(), 100);
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
            // Play move or capture sound
            if (this.sound) {
                if (captured) this.sound.playCapture();
                else this.sound.playMove();
            }
            this.board.render(this.game.board);
            this.updateMoveCount();

            const opponentIsRed = this.playerIsRed;
            if (this.checkGameEnd(opponentIsRed, false)) return;

            this.isPlayerTurn = true;

            // Build AI move text
            const aiMoveText = `🤖 Máy: ${aiPieceName}${aiCaptureText}`;
            let checkText = '';
            if (XiangqiRules.isInCheck(this.game.board, this.playerIsRed)) {
                checkText = ' ⚡ Chiếu!';
                if (this.sound) this.sound.playCheck();
            }

            document.getElementById('play-status').textContent = `Đến lượt bạn!${checkText}`;

            // NOW evaluate the player's previous move (deferred for better accuracy)
            if (this._pendingEval) {
                const ev = this._pendingEval;
                this._pendingEval = null;
                setTimeout(() => {
                    try {
                        const commentary = this.evaluateMove(ev.boardSnapshot, ev.from, ev.to, ev.pieceName, ev.captureText);
                        this.lastPlayerCommentary = commentary;
                        this.showBothMoves(aiMoveText + checkText);
                    } catch (e) {
                        console.error('Evaluation error:', e);
                        this.lastPlayerCommentary = null;
                        this.showBothMoves(aiMoveText + checkText);
                    }
                }, 50);
            } else {
                this.showBothMoves(aiMoveText + checkText);
            }
        });
    }

    checkGameEnd(sideToMove, wasPlayerMove) {
        try {
            if (XiangqiRules.isCheckmate(this.game.board, sideToMove)) {
                this.gameOver = true;
                const winner = wasPlayerMove ? 'Bạn' : 'Máy';
                this.updateStatus(`🏆 ${winner} thắng! Chiếu hết!`);
                this.flashBoard(wasPlayerMove ? 'correct' : 'wrong');
                if (this.sound) {
                    this.sound.playVictory(); // Always play dramatic checkmate sound
                }
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

    // Tactical analysis: explain WHY a move is good/bad
    analyzeTactics(boardBefore, boardAfter, from, to, playerIsRed) {
        const insights = [];
        const movingPiece = boardBefore[from[0]][from[1]];
        const captured = boardBefore[to[0]][to[1]];
        const type = movingPiece.toUpperCase();
        const VALS = { 'K': 10000, 'A': 120, 'E': 120, 'R': 600, 'H': 270, 'C': 285, 'P': 30 };
        const NAMES = { 'K':'Tướng','A':'Sĩ','E':'Tượng','R':'Xe','H':'Mã','C':'Pháo','P':'Tốt' };

        // 1. Capture analysis — exchange value
        if (captured) {
            const capType = captured.toUpperCase();
            const capVal = VALS[capType] || 0;
            const movVal = VALS[type] || 0;
            // Check if the moving piece is under threat after capture
            const enemyMoves = XiangqiRules.getAllLegalMoves(boardAfter, !playerIsRed);
            const isRecapturable = enemyMoves.some(m => m.to[0] === to[0] && m.to[1] === to[1]);
            if (!isRecapturable) {
                insights.push(`Ăn ${NAMES[capType]} miễn phí (${capVal} điểm), đối phương không thể bắt lại.`);
            } else if (capVal > movVal) {
                insights.push(`Đổi ${NAMES[type]} (${movVal}) lấy ${NAMES[capType]} (${capVal}) — trao đổi có lợi!`);
            } else if (capVal === movVal) {
                insights.push(`Đổi ${NAMES[type]} ngang ${NAMES[capType]} — trao đổi cân bằng.`);
            } else {
                insights.push(`Dùng ${NAMES[type]} (${movVal}) ăn ${NAMES[capType]} (${capVal}) — trao đổi bất lợi, cẩn thận!`);
            }
        }

        // 2. Check threat
        if (XiangqiRules.isInCheck(boardAfter, !playerIsRed)) {
            if (XiangqiRules.isCheckmate(boardAfter, !playerIsRed)) {
                insights.push('⚡ Chiếu hết! Nước đi quyết định thắng lợi!');
            } else {
                insights.push('⚡ Chiếu tướng! Gây áp lực buộc đối phương phải giải chiếu.');
            }
        }

        // 3. Double attack — piece threatens multiple enemy pieces after move
        if (type === 'H' || type === 'C' || type === 'R') {
            const myMovesAfter = XiangqiRules.generateRawMoves(boardAfter, to[0], to[1]);
            const threatenedPieces = [];
            for (const [mr, mc] of myMovesAfter) {
                const target = boardAfter[mr][mc];
                if (target && XiangqiRules.isRed(target) !== playerIsRed) {
                    const tv = VALS[target.toUpperCase()] || 0;
                    if (tv >= 120) threatenedPieces.push(NAMES[target.toUpperCase()]);
                }
            }
            if (threatenedPieces.length >= 2) {
                insights.push(`Tấn công kép! ${NAMES[type]} đồng thời đe dọa ${threatenedPieces.join(' và ')}.`);
            } else if (threatenedPieces.length === 1 && !captured) {
                insights.push(`${NAMES[type]} đe dọa ${threatenedPieces[0]} đối phương.`);
            }
        }

        // 4. Central column control (col 4)
        if ((type === 'R' || type === 'C') && to[1] === 4) {
            const wasOnCenter = from[1] === 4;
            if (!wasOnCenter) {
                insights.push(`${NAMES[type]} chiếm trung lộ — khống chế cột giữa, kiểm soát thế trận.`);
            }
        }

        // 5. River crossing (quá hà)
        const riverCrossed = playerIsRed ? (to[0] <= 4 && from[0] >= 5) : (to[0] >= 5 && from[0] <= 4);
        if (riverCrossed) {
            if (type === 'R') {
                insights.push('Xe quá hà — Xe vượt sông tấn công, khống chế hàng tốt đối phương.');
            } else if (type === 'H') {
                insights.push('Mã quá hà — Mã vượt sông, linh hoạt tấn công sâu vào trận địa đối phương.');
            } else if (type === 'P') {
                insights.push('Tốt quá hà — Tốt vượt sông, giờ có thể đi ngang và tăng sức mạnh.');
            } else if (type === 'C') {
                insights.push('Pháo quá hà — Pháo tiến sâu gây áp lực trực tiếp.');
            }
        }

        // 6. King defense (sĩ/tượng moves)
        if (type === 'A') {
            const king = XiangqiRules.findKing(boardAfter, playerIsRed);
            if (king) {
                const dr = Math.abs(to[0] - king[0]), dc = Math.abs(to[1] - king[1]);
                if (dr === 1 && dc === 1) {
                    insights.push('Bổ Sĩ sát Tướng — tăng cường phòng thủ cung, bảo vệ Tướng trực tiếp.');
                } else {
                    insights.push('Di chuyển Sĩ — điều chỉnh phòng thủ cung.');
                }
            }
        }
        if (type === 'E') {
            insights.push('Phi Tượng — mở rộng vùng phòng thủ, bảo vệ trận địa hậu phương.');
        }

        // 7. Piece development — leaving starting position
        const startPositions = playerIsRed ? {
            'R': [[9,0],[9,8]], 'H': [[9,1],[9,7]], 'C': [[7,1],[7,7]]
        } : {
            'R': [[0,0],[0,8]], 'H': [[0,1],[0,7]], 'C': [[2,1],[2,7]]
        };
        if (startPositions[type]) {
            const wasAtStart = startPositions[type].some(p => p[0] === from[0] && p[1] === from[1]);
            if (wasAtStart && !captured) {
                insights.push(`Khai triển ${NAMES[type]} — xuất quân ra khỏi vị trí ban đầu, tham gia chiến đấu.`);
            }
        }

        // 8. Mobility comparison
        const myMovesBefore = XiangqiRules.getAllLegalMoves(boardBefore, playerIsRed);
        const myMovesAfterAll = XiangqiRules.getAllLegalMoves(boardAfter, playerIsRed);
        const enemyMovesBefore = XiangqiRules.getAllLegalMoves(boardBefore, !playerIsRed);
        const enemyMovesAfter = XiangqiRules.getAllLegalMoves(boardAfter, !playerIsRed);
        const myMobilityDelta = myMovesAfterAll.length - myMovesBefore.length;
        const enemyMobilityDelta = enemyMovesAfter.length - enemyMovesBefore.length;
        if (enemyMobilityDelta <= -8) {
            insights.push('Hạn chế mạnh đối phương — giảm đáng kể số nước đi hợp lệ của đối phương.');
        }
        if (myMobilityDelta >= 8) {
            insights.push('Mở rộng thế trận — tăng đáng kể số nước đi linh hoạt cho bên mình.');
        }

        // 9. King safety — exposed king warning
        if (!captured && type !== 'A' && type !== 'E') {
            const king = XiangqiRules.findKing(boardAfter, playerIsRed);
            if (king) {
                let advisorsNear = 0;
                for (let r = king[0]-1; r <= king[0]+1; r++) {
                    for (let c = king[1]-1; c <= king[1]+1; c++) {
                        if (r >= 0 && r <= 9 && c >= 0 && c <= 8) {
                            const p = boardAfter[r][c];
                            if (p && p.toUpperCase() === 'A' && XiangqiRules.isRed(p) === playerIsRed) advisorsNear++;
                        }
                    }
                }
                if (advisorsNear === 0) {
                    // Check if king was protected before
                    let advisorsNearBefore = 0;
                    const kingBefore = XiangqiRules.findKing(boardBefore, playerIsRed);
                    if (kingBefore) {
                        for (let r = kingBefore[0]-1; r <= kingBefore[0]+1; r++) {
                            for (let c = kingBefore[1]-1; c <= kingBefore[1]+1; c++) {
                                if (r >= 0 && r <= 9 && c >= 0 && c <= 8) {
                                    const p = boardBefore[r][c];
                                    if (p && p.toUpperCase() === 'A' && XiangqiRules.isRed(p) === playerIsRed) advisorsNearBefore++;
                                }
                            }
                        }
                    }
                    if (advisorsNearBefore > 0) {
                        insights.push('⚠️ Tướng mất bảo vệ Sĩ — cung trống, cẩn thận bị đe dọa!');
                    }
                }
            }
        }

        // 10. Rook on open file
        if (type === 'R') {
            const col = to[1];
            const hasFriendlyPawn = (() => {
                for (let r = 0; r <= 9; r++) {
                    const p = boardAfter[r][col];
                    if (p && p.toUpperCase() === 'P' && XiangqiRules.isRed(p) === playerIsRed) return true;
                }
                return false;
            })();
            const hasEnemyPawn = (() => {
                for (let r = 0; r <= 9; r++) {
                    const p = boardAfter[r][col];
                    if (p && p.toUpperCase() === 'P' && XiangqiRules.isRed(p) !== playerIsRed) return true;
                }
                return false;
            })();
            if (!hasFriendlyPawn && !hasEnemyPawn && !insights.some(i => i.includes('trung lộ'))) {
                insights.push('Xe chiếm cột mở — không bị tốt chặn, tầm hoạt động rộng.');
            }
        }

        return insights;
    }

    // Deeper evaluation: compare move scores + tactical analysis
    evaluateMove(boardBefore, from, to, pieceName, captureText) {
        const playerIsRed = this.playerIsRed;

        // Score after the player's move
        const boardAfterPlayer = XiangqiRules.makeMove(boardBefore, from[0], from[1], to[0], to[1]);
        const playerResult = XiangqiAI.minimax(boardAfterPlayer, 6, -Infinity, Infinity, !playerIsRed, performance.now(), 3000, 6);
        const scoreAfterPlayer = playerResult.score;

        // Find the best move
        const bestMove = XiangqiAI._getMinimaxMove(boardBefore, playerIsRed, 7, 3000);

        let scoreAfterBest = scoreAfterPlayer;
        if (bestMove) {
            const boardAfterBest = XiangqiRules.makeMove(boardBefore, bestMove.from[0], bestMove.from[1], bestMove.to[0], bestMove.to[1]);
            const bestResult = XiangqiAI.minimax(boardAfterBest, 6, -Infinity, Infinity, !playerIsRed, performance.now(), 3000, 6);
            scoreAfterBest = bestResult.score;
        }

        const playerDelta = playerIsRed
            ? (scoreAfterPlayer - scoreAfterBest)
            : (scoreAfterBest - scoreAfterPlayer);

        const isBestMove = bestMove &&
            from[0] === bestMove.from[0] && from[1] === bestMove.from[1] &&
            to[0] === bestMove.to[0] && to[1] === bestMove.to[1];

        // Tactical analysis
        const tactics = this.analyzeTactics(boardBefore, boardAfterPlayer, from, to, playerIsRed);

        // Check if this is a losing capture exchange
        const movingPiece = boardBefore[from[0]][from[1]];
        const captured = boardBefore[to[0]][to[1]];
        let exchangePenalty = 0; // 0 = no issue, negative = bad exchange
        if (captured) {
            const VALS = { 'K': 10000, 'A': 120, 'E': 120, 'R': 600, 'H': 270, 'C': 285, 'P': 30 };
            const capVal = VALS[captured.toUpperCase()] || 0;
            const movVal = VALS[movingPiece.toUpperCase()] || 0;
            // Check if the moving piece can be recaptured
            const enemyMoves = XiangqiRules.getAllLegalMoves(boardAfterPlayer, !playerIsRed);
            const isRecapturable = enemyMoves.some(m => m.to[0] === to[0] && m.to[1] === to[1]);
            if (isRecapturable && movVal > capVal) {
                exchangePenalty = capVal - movVal; // e.g. 120 - 600 = -480
            }
        }

        let rating, emoji;

        if (exchangePenalty < -200) {
            // Terrible exchange (e.g. Rook for Advisor) — never rate as good
            rating = 'Nước đi yếu'; emoji = '😬';
        } else if (exchangePenalty < -50) {
            // Bad exchange — cap at mediocre
            rating = 'Tạm được'; emoji = '🤔';
        } else if (isBestMove) {
            rating = 'Xuất sắc'; emoji = '🔥';
        } else if (playerDelta >= -20) {
            rating = 'Nước đi tốt'; emoji = '👍';
        } else if (playerDelta >= -80) {
            rating = 'Tạm được'; emoji = '🤔';
        } else if (playerDelta >= -200) {
            rating = 'Nước đi yếu'; emoji = '😬';
        } else {
            rating = 'Sai lầm!'; emoji = '💀';
        }

        // Build detail from tactical insights
        let detail;
        if (tactics.length > 0) {
            detail = tactics.slice(0, 3).join(' ');
        } else {
            // Fallback generic text
            if (isBestMove && exchangePenalty >= -50) detail = 'Đây là nước đi tốt nhất!';
            else if (playerDelta >= -20) detail = 'Nước đi gần như tối ưu.';
            else if (playerDelta >= -80) detail = 'Có nước đi tốt hơn.';
            else if (playerDelta >= -200) detail = 'Nước này mất lợi thế đáng kể.';
            else detail = 'Nước đi rất tệ, mất lợi thế lớn!';
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

        setTimeout(async () => {
            try {
                const aiIsRed = !this.playerIsRed;

                // 1. Check ponder hit — AI already pre-computed the response
                if (this._lastPlayerMove) {
                    const ponderResult = XiangqiAI.checkPonder(this._lastPlayerMove);
                    if (ponderResult) {
                        // Ponder hit! Play almost instantly
                        console.log('⚡ Ponder hit! Responding instantly');
                        this.updateStatus('⚡ Máy đáp tức thì!');
                        await new Promise(r => setTimeout(r, 100));
                        this.aiThinking = false;
                        this.executeAIMove(ponderResult.from, ponderResult.to);
                        return;
                    }
                }

                // 2. Check forced move — only 1 legal move available
                const allMoves = XiangqiRules.getAllLegalMoves(this.game.board, aiIsRed);
                if (allMoves.length === 0) {
                    this.gameOver = true;
                    this.updateStatus('🏆 Bạn thắng! Máy hết nước đi!');
                    this.aiThinking = false;
                    return;
                }
                if (allMoves.length === 1) {
                    // Only one legal move — play it instantly like a human would
                    console.log('🎯 Forced move — only 1 legal option');
                    await new Promise(r => setTimeout(r, 150));
                    const forced = allMoves[0];
                    this.aiThinking = false;
                    this.executeAIMove(forced.from, forced.to);
                    return;
                }

                // 3. Smart time management
                let searchTime = 15000;
                let searchDepth = 20;
                const board = this.game.board;
                const aiInCheck = XiangqiRules.isInCheck(board, aiIsRed);

                if (aiInCheck) {
                    // AI is in check — ALWAYS use full search (complex position)
                    console.log('🛡️ AI is in check — full search for best defense');
                    this.updateStatus('🛡️ Máy đang phòng thủ...');
                } else {
                    // Not in check — check for obvious responses
                    const pieceValues = { 'R': 900, 'r': 900, 'H': 400, 'h': 400, 'C': 450, 'c': 450, 
                                          'A': 200, 'a': 200, 'E': 200, 'e': 200, 'P': 100, 'p': 100,
                                          'K': 9999, 'k': 9999 };
                    let bestCaptureValue = 0;
                    
                    for (const m of allMoves) {
                        const target = board[m.to[0]][m.to[1]];
                        if (target) {
                            const val = pieceValues[target] || 0;
                            if (val > bestCaptureValue) bestCaptureValue = val;
                        }
                    }

                    const enemyMoves = XiangqiRules.getAllLegalMoves(board, !aiIsRed);

                    if (bestCaptureValue >= 400) {
                        // Big capture available and NOT in check — respond quickly
                        searchTime = 5000;
                        searchDepth = 14;
                        console.log(`⚡ Major capture available (value=${bestCaptureValue}) — quick response`);
                        this.updateStatus('💥 Máy phản công!');
                    } else if (allMoves.length >= 3 * enemyMoves.length && enemyMoves.length <= 5) {
                        // Dominating position
                        searchTime = 5000;
                        searchDepth = 14;
                        console.log('⚡ Dominating position — faster response');
                        this.updateStatus('🤔 Máy đang suy nghĩ...');
                    } else {
                        // Normal position — full search
                        this.updateStatus('🤔 Máy đang suy nghĩ...');
                    }
                }

                // 4. Search for best move
                const move = await XiangqiAI.getBestMove(this.game.board, aiIsRed, searchDepth, searchTime);

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
                // Use minimax directly (synchronous, fast) instead of async getBestMove
                const bestMove = XiangqiAI._getMinimaxMove(this.game.board, this.playerIsRed, 5, 3000);
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
        if (this.sound) this.sound.playDefeat();
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
