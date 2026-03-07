// ai.js - Xiangqi AI Engine with Minimax + Alpha-Beta Pruning

const XiangqiAI = {
    // Piece base values
    PIECE_VALUES: {
        'K': 10000, 'A': 120, 'E': 120, 'R': 600, 'H': 270, 'C': 285, 'P': 30,
        'k': 10000, 'a': 120, 'e': 120, 'r': 600, 'h': 270, 'c': 285, 'p': 30
    },

    // Positional bonuses for Red pieces (rows 0-9, cols 0-8)
    // Flipped vertically for Black
    POS_BONUS: {
        'P': [ // Pawn - value increases after crossing river
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],
            [20,0,20,0,30,0,20,0,20],
            [30,0,35,0,40,0,35,0,30],
            [40,45,50,55,60,55,50,45,40],
            [55,60,65,70,75,70,65,60,55],
            [70,75,80,85,90,85,80,75,70],
            [85,90,95,100,105,100,95,90,85],
            [0,0,0,0,0,0,0,0,0]
        ],
        'H': [ // Horse - center is better
            [0,0,5,0,0,0,5,0,0],
            [0,10,0,15,0,15,0,10,0],
            [5,0,20,0,20,0,20,0,5],
            [0,15,0,25,0,25,0,15,0],
            [5,0,20,0,25,0,20,0,5],
            [5,0,20,0,25,0,20,0,5],
            [0,15,0,25,0,25,0,15,0],
            [5,0,20,0,20,0,20,0,5],
            [0,10,0,15,0,15,0,10,0],
            [0,0,5,0,0,0,5,0,0]
        ],
        'C': [ // Cannon - good in center and on certain files
            [5,5,5,10,20,10,5,5,5],
            [5,10,15,20,25,20,15,10,5],
            [5,10,10,15,20,15,10,10,5],
            [0,5,10,15,20,15,10,5,0],
            [0,5,10,15,15,15,10,5,0],
            [0,5,10,15,15,15,10,5,0],
            [0,5,10,15,20,15,10,5,0],
            [5,10,10,15,20,15,10,10,5],
            [5,10,15,20,25,20,15,10,5],
            [5,5,5,10,20,10,5,5,5]
        ],
        'R': [ // Rook - open files, 7th rank
            [0,0,0,5,10,5,0,0,0],
            [0,5,5,10,15,10,5,5,0],
            [0,5,5,10,15,10,5,5,0],
            [5,10,10,15,20,15,10,10,5],
            [10,15,15,20,25,20,15,15,10],
            [10,15,15,20,25,20,15,15,10],
            [5,10,10,15,20,15,10,10,5],
            [0,5,5,10,15,10,5,5,0],
            [0,5,5,10,15,10,5,5,0],
            [0,0,0,5,10,5,0,0,0]
        ]
    },

    // Evaluate board position (positive = Red advantage, negative = Black advantage)
    evaluate(board) {
        let score = 0;
        for (let r = 0; r <= 9; r++) {
            for (let c = 0; c <= 8; c++) {
                const piece = board[r][c];
                if (!piece) continue;
                const isRed = XiangqiRules.isRed(piece);
                const type = piece.toUpperCase();
                let val = this.PIECE_VALUES[piece];

                // Add positional bonus
                const posTable = this.POS_BONUS[type];
                if (posTable) {
                    // For Red pieces, use the table as-is (Red starts at bottom = row 9)
                    // For Black pieces, flip the row
                    const pr = isRed ? r : 9 - r;
                    val += posTable[pr][c];
                }

                score += isRed ? val : -val;
            }
        }

        // Bonus for check
        if (XiangqiRules.isInCheck(board, false)) score += 50; // Black is in check
        if (XiangqiRules.isInCheck(board, true)) score -= 50;  // Red is in check

        return score;
    },

    // Move ordering heuristic - try captures first for better pruning
    orderMoves(board, moves) {
        return moves.sort((a, b) => {
            const capA = board[a.to[0]][a.to[1]];
            const capB = board[b.to[0]][b.to[1]];
            const valA = capA ? this.PIECE_VALUES[capA] : 0;
            const valB = capB ? this.PIECE_VALUES[capB] : 0;
            return valB - valA; // Higher value captures first
        });
    },

    // Minimax with Alpha-Beta Pruning
    minimax(board, depth, alpha, beta, isMaximizing, startTime, timeLimit) {
        // Time check
        if (performance.now() - startTime > timeLimit) return { score: this.evaluate(board) };

        const isRedTurn = isMaximizing;

        // Terminal check
        if (XiangqiRules.isCheckmate(board, isRedTurn)) {
            return { score: isMaximizing ? -99999 + (4 - depth) : 99999 - (4 - depth) };
        }
        if (XiangqiRules.isStalemate(board, isRedTurn)) {
            return { score: 0 };
        }
        if (depth === 0) {
            return { score: this.evaluate(board) };
        }

        let allMoves = XiangqiRules.getAllLegalMoves(board, isRedTurn);
        allMoves = this.orderMoves(board, allMoves);

        let bestMove = allMoves[0] || null;

        if (isMaximizing) {
            let maxEval = -Infinity;
            for (const move of allMoves) {
                const newBoard = XiangqiRules.makeMove(board, move.from[0], move.from[1], move.to[0], move.to[1]);
                const result = this.minimax(newBoard, depth - 1, alpha, beta, false, startTime, timeLimit);
                if (result.score > maxEval) {
                    maxEval = result.score;
                    bestMove = move;
                }
                alpha = Math.max(alpha, result.score);
                if (beta <= alpha) break;
            }
            return { score: maxEval, move: bestMove };
        } else {
            let minEval = Infinity;
            for (const move of allMoves) {
                const newBoard = XiangqiRules.makeMove(board, move.from[0], move.from[1], move.to[0], move.to[1]);
                const result = this.minimax(newBoard, depth - 1, alpha, beta, true, startTime, timeLimit);
                if (result.score < minEval) {
                    minEval = result.score;
                    bestMove = move;
                }
                beta = Math.min(beta, result.score);
                if (beta <= alpha) break;
            }
            return { score: minEval, move: bestMove };
        }
    },

    // Get the best move for the AI
    getBestMove(board, isRedTurn, depth = 3, timeLimitMs = 3000) {
        try {
            const startTime = performance.now();

            // Try iterative deepening
            let bestResult = null;
            for (let d = 1; d <= depth; d++) {
                const result = this.minimax(board, d, -Infinity, Infinity, isRedTurn, startTime, timeLimitMs);
                if (result.move) bestResult = result;
                if (performance.now() - startTime > timeLimitMs * 0.7) break;
            }

            // Fallback: pick a random legal move
            if (!bestResult || !bestResult.move) {
                const moves = XiangqiRules.getAllLegalMoves(board, isRedTurn);
                if (moves.length > 0) {
                    return moves[Math.floor(Math.random() * moves.length)];
                }
                return null;
            }

            return bestResult.move;
        } catch (e) {
            console.error('AI getBestMove error:', e);
            // Fallback: pick any legal move
            try {
                const moves = XiangqiRules.getAllLegalMoves(board, isRedTurn);
                if (moves.length > 0) {
                    return moves[Math.floor(Math.random() * moves.length)];
                }
            } catch (e2) {
                console.error('AI fallback error:', e2);
            }
            return null;
        }
    }
};
