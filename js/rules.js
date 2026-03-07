// rules.js - Complete Cờ Tướng (Xiangqi) move validation

const XiangqiRules = {
    // Check if position is within board bounds
    inBounds(r, c) { return r >= 0 && r <= 9 && c >= 0 && c <= 8; },

    // Check if position is inside the palace
    inPalace(r, c, isRed) {
        if (isRed) return r >= 7 && r <= 9 && c >= 3 && c <= 5;
        return r >= 0 && r <= 2 && c >= 3 && c <= 5;
    },

    // Check if piece belongs to Red
    isRed(piece) { return piece && piece === piece.toUpperCase(); },

    // Check if two pieces are enemies
    isEnemy(p1, p2) {
        if (!p1 || !p2) return false;
        return this.isRed(p1) !== this.isRed(p2);
    },

    // Find the King position for a side
    findKing(board, isRed) {
        const target = isRed ? 'K' : 'k';
        for (let r = 0; r <= 9; r++)
            for (let c = 0; c <= 8; c++)
                if (board[r][c] === target) return [r, c];
        return null;
    },

    // Check if Kings are facing each other (illegal position)
    kingsAreFacing(board) {
        const rk = this.findKing(board, true);
        const bk = this.findKing(board, false);
        if (!rk || !bk || rk[1] !== bk[1]) return false;
        const col = rk[1];
        for (let r = bk[0] + 1; r < rk[0]; r++) {
            if (board[r][col]) return false;
        }
        return true;
    },

    // Generate raw moves for a piece (without checking if King is left in check)
    generateRawMoves(board, r, c) {
        const piece = board[r][c];
        if (!piece) return [];
        const type = piece.toUpperCase();
        const red = this.isRed(piece);
        const moves = [];

        const addIf = (tr, tc) => {
            if (!this.inBounds(tr, tc)) return;
            const target = board[tr][tc];
            if (!target || this.isEnemy(piece, target)) moves.push([tr, tc]);
        };

        switch (type) {
            case 'K': // King / Tướng
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    const nr = r + dr, nc = c + dc;
                    if (this.inPalace(nr, nc, red)) addIf(nr, nc);
                }
                break;

            case 'A': // Advisor / Sĩ
                for (const [dr, dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
                    const nr = r + dr, nc = c + dc;
                    if (this.inPalace(nr, nc, red)) addIf(nr, nc);
                }
                break;

            case 'E': // Elephant / Tượng
                for (const [dr, dc] of [[-2,-2],[-2,2],[2,-2],[2,2]]) {
                    const nr = r + dr, nc = c + dc;
                    const br = r + dr/2, bc = c + dc/2; // blocking point
                    if (!this.inBounds(nr, nc)) continue;
                    // Elephant cannot cross the river
                    if (red && nr < 5) continue;
                    if (!red && nr > 4) continue;
                    if (board[br][bc]) continue; // blocked
                    addIf(nr, nc);
                }
                break;

            case 'H': // Horse / Mã
                for (const [dr, dc, br, bc] of [
                    [-2,-1,-1,0],[-2,1,-1,0],[2,-1,1,0],[2,1,1,0],
                    [-1,-2,0,-1],[-1,2,0,1],[1,-2,0,-1],[1,2,0,1]
                ]) {
                    const nr = r + dr, nc = c + dc;
                    if (!this.inBounds(nr, nc)) continue;
                    if (board[r + br][c + bc]) continue; // blocked (cản mã)
                    addIf(nr, nc);
                }
                break;

            case 'R': // Rook / Xe
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    for (let i = 1; i <= 9; i++) {
                        const nr = r + dr * i, nc = c + dc * i;
                        if (!this.inBounds(nr, nc)) break;
                        const target = board[nr][nc];
                        if (!target) { moves.push([nr, nc]); continue; }
                        if (this.isEnemy(piece, target)) moves.push([nr, nc]);
                        break;
                    }
                }
                break;

            case 'C': // Cannon / Pháo
                for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                    let jumped = false;
                    for (let i = 1; i <= 9; i++) {
                        const nr = r + dr * i, nc = c + dc * i;
                        if (!this.inBounds(nr, nc)) break;
                        const target = board[nr][nc];
                        if (!jumped) {
                            if (!target) moves.push([nr, nc]);
                            else jumped = true;
                        } else {
                            if (target) {
                                if (this.isEnemy(piece, target)) moves.push([nr, nc]);
                                break;
                            }
                        }
                    }
                }
                break;

            case 'P': // Pawn / Tốt/Binh
                if (red) {
                    addIf(r - 1, c); // forward
                    if (r <= 4) { addIf(r, c - 1); addIf(r, c + 1); } // crossed river
                } else {
                    addIf(r + 1, c);
                    if (r >= 5) { addIf(r, c - 1); addIf(r, c + 1); }
                }
                break;
        }
        return moves;
    },

    // Make a temporary move on a cloned board
    makeMove(board, fr, fc, tr, tc) {
        const b = board.map(row => [...row]);
        b[tr][tc] = b[fr][fc];
        b[fr][fc] = null;
        return b;
    },

    // Check if the given side's King is in check
    isInCheck(board, isRed) {
        const king = this.findKing(board, isRed);
        if (!king) return true; // King captured = definitely in check
        // Check if any enemy piece can capture the King
        for (let r = 0; r <= 9; r++)
            for (let c = 0; c <= 8; c++) {
                const p = board[r][c];
                if (!p || this.isRed(p) === isRed) continue;
                const moves = this.generateRawMoves(board, r, c);
                for (const [mr, mc] of moves) {
                    if (mr === king[0] && mc === king[1]) return true;
                }
            }
        return false;
    },

    // Generate all legal moves for a piece (filters out moves that leave King in check)
    getLegalMoves(board, r, c) {
        const piece = board[r][c];
        if (!piece) return [];
        const red = this.isRed(piece);
        const rawMoves = this.generateRawMoves(board, r, c);
        const legal = [];
        for (const [tr, tc] of rawMoves) {
            const newBoard = this.makeMove(board, r, c, tr, tc);
            // Move is legal if it doesn't leave own King in check and Kings aren't facing
            if (!this.isInCheck(newBoard, red) && !this.kingsAreFacing(newBoard)) {
                legal.push([tr, tc]);
            }
        }
        return legal;
    },

    // Get all legal moves for a side
    getAllLegalMoves(board, isRed) {
        const allMoves = [];
        for (let r = 0; r <= 9; r++)
            for (let c = 0; c <= 8; c++) {
                const p = board[r][c];
                if (!p || this.isRed(p) !== isRed) continue;
                const moves = this.getLegalMoves(board, r, c);
                for (const [tr, tc] of moves) {
                    allMoves.push({ from: [r, c], to: [tr, tc] });
                }
            }
        return allMoves;
    },

    // Check if the given side is in checkmate (no legal moves + in check)
    isCheckmate(board, isRed) {
        return this.getAllLegalMoves(board, isRed).length === 0 && this.isInCheck(board, isRed);
    },

    // Check if stalemate (no legal moves but not in check)
    isStalemate(board, isRed) {
        return this.getAllLegalMoves(board, isRed).length === 0 && !this.isInCheck(board, isRed);
    }
};
