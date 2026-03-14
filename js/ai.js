// ai.js - Xiangqi AI Engine
// Primary: Fairy-Stockfish WASM (GM-level strength)
// Fallback: Built-in Minimax + Alpha-Beta + Quiescence

const XiangqiAI = {

    // ========== Fairy-Stockfish Integration ==========
    _engine: null,
    _engineReady: false,
    _engineFailed: false,
    _engineLoading: false,
    // Ponder state: pre-compute response to expected opponent move
    _ponderMove: null,      // expected opponent move {from, to}
    _ponderResponse: null,  // pre-computed AI reply {from, to}
    _ponderBoard: null,     // board state after ponder move
    _ponderSearching: false,

    initFairyStockfish() {
        if (this._engine || this._engineFailed || this._engineLoading) return;
        this._engineLoading = true;

        // Load Fairy-Stockfish from local files (downloaded from CDN)
        const script = document.createElement('script');
        script.src = 'js/engine/stockfish.js';
        script.onload = async () => {
            try {
                if (typeof Stockfish === 'undefined') {
                    throw new Error('Stockfish function not found');
                }
                console.log('⏳ Initializing Fairy-Stockfish WASM...');
                const engine = await Stockfish();
                this._engine = engine;

                // Set up message listener
                engine.addMessageListener((msg) => {
                    if (typeof msg !== 'string') return;
                    console.log('[FS]', msg);  // Debug: log all engine output
                    this._outputBuffer.push(msg);
                    if (this._pendingCallback && (msg === 'uciok' || msg === 'readyok' || msg.startsWith('bestmove'))) {
                        const cb = this._pendingCallback;
                        this._pendingCallback = null;
                        cb(this._outputBuffer.slice());
                        this._outputBuffer = [];
                    }
                });

                // Initialize UCI for xiangqi
                await this._sendCmd('uci', 'uciok');
                await this._sendCmd('setoption name UCI_Variant value xiangqi');
                await this._sendCmd('setoption name Threads value 1');
                await this._sendCmd('setoption name Hash value 256');
                await this._sendCmd('setoption name Skill Level value 20');
                await this._sendCmd('isready', 'readyok');

                this._engineReady = true;
                this._engineLoading = false;
                console.log('✅ Fairy-Stockfish engine ready! (GM-level AI)');
            } catch (e) {
                console.warn('⚠️ Fairy-Stockfish init failed:', e.message);
                this._engineFailed = true;
                this._engineLoading = false;
                console.log('Using built-in AI engine (fallback)');
            }
        };
        script.onerror = (e) => {
            console.warn('⚠️ Cannot load Fairy-Stockfish:', e);
            this._engineFailed = true;
            this._engineLoading = false;
            console.log('Using built-in AI engine (fallback)');
        };
        document.head.appendChild(script);
    },

    _pendingCallback: null,
    _outputBuffer: [],

    _sendCmd(cmd, waitFor) {
        return new Promise((resolve) => {
            this._outputBuffer = [];
            this._pendingCallback = resolve;
            this._engine.postMessage(cmd);
            // Timeout safety
            setTimeout(() => {
                if (this._pendingCallback === resolve) {
                    this._pendingCallback = null;
                    resolve(this._outputBuffer.slice());
                    this._outputBuffer = [];
                }
            }, 30000);
        });
    },

    // Convert board to Xiangqi FEN
    boardToFen(board, isRedTurn) {
        // Internal: Uppercase = Red (K,A,E,R,H,C,P), Lowercase = Black
        // FEN for Fairy-Stockfish xiangqi:
        // Uppercase = Red, Lowercase = Black
        // K=King, A=Advisor, B=Bishop(Elephant), R=Rook, N=Knight(Horse), C=Cannon, P=Pawn
        const pieceToFen = {
            'K': 'K', 'A': 'A', 'E': 'B', 'R': 'R', 'H': 'N', 'C': 'C', 'P': 'P',
            'k': 'k', 'a': 'a', 'e': 'b', 'r': 'r', 'h': 'n', 'c': 'c', 'p': 'p'
        };
        let fen = '';
        for (let r = 0; r <= 9; r++) {
            let empty = 0;
            for (let c = 0; c <= 8; c++) {
                const piece = board[r][c];
                if (piece) {
                    if (empty > 0) { fen += empty; empty = 0; }
                    fen += pieceToFen[piece] || piece;
                } else { empty++; }
            }
            if (empty > 0) fen += empty;
            if (r < 9) fen += '/';
        }
        fen += isRedTurn ? ' w' : ' b';
        fen += ' - - 0 1';
        return fen;
    },

    // Parse Fairy-Stockfish move (e.g. "h2e2") to board coords
    // Files a-i = cols 0-8, ranks 0-9 = rows 9-0
    parseFairyMove(moveStr) {
        if (!moveStr || moveStr === '(none)' || moveStr.length < 4) return null;
        // UCI move format: [file][rank][file][rank] where file=a-i, rank=0-9
        // Ranks can be two digits (e.g. "10" — though xiangqi only uses 0-9)
        let idx = 0;
        const fromCol = moveStr.charCodeAt(idx++) - 97; // 'a'
        // Parse rank (could be 1 or 2 digits)
        let fromRankStr = '';
        while (idx < moveStr.length && moveStr[idx] >= '0' && moveStr[idx] <= '9') {
            fromRankStr += moveStr[idx++];
        }
        const fromRow = 10 - parseInt(fromRankStr);

        const toCol = moveStr.charCodeAt(idx++) - 97;
        let toRankStr = '';
        while (idx < moveStr.length && moveStr[idx] >= '0' && moveStr[idx] <= '9') {
            toRankStr += moveStr[idx++];
        }
        const toRow = 10 - parseInt(toRankStr);

        if (fromRow < 0 || fromRow > 9 || fromCol < 0 || fromCol > 8) return null;
        if (toRow < 0 || toRow > 9 || toCol < 0 || toCol > 8) return null;
        return { from: [fromRow, fromCol], to: [toRow, toCol] };
    },

    // Request best move from Fairy-Stockfish (async)
    async requestFairyMove(board, isRedTurn, depth, timeMs) {
        if (!this._engineReady) return null;
        try {
            const fen = this.boardToFen(board, isRedTurn);
            console.log(`🐟 FEN: ${fen}`);

            // Send position (fire-and-forget, no response expected from UCI)
            this._engine.postMessage('position fen ' + fen);
            // Confirm engine processed position
            await this._sendCmd('isready', 'readyok');
            // Search with depth and time limits
            console.log(`🐟 Searching: depth=${depth}, time=${timeMs}ms`);
            const output = await this._sendCmd(`go depth ${depth} movetime ${timeMs}`, 'bestmove');

            let bestMove = null, ponderMove = null, score = null;
            for (const line of output) {
                if (typeof line === 'string') {
                    if (line.startsWith('bestmove')) {
                        const parts = line.split(' ');
                        bestMove = parts[1];
                        if (parts[2] === 'ponder' && parts[3]) {
                            ponderMove = parts[3];
                        }
                    }
                    const sm = line.match(/score cp (-?\d+)/);
                    if (sm) score = parseInt(sm[1]);
                    const mm = line.match(/score mate (-?\d+)/);
                    if (mm) score = parseInt(mm[1]) > 0 ? 99999 : -99999;
                }
            }
            if (!bestMove) {
                console.warn('🐟 No bestmove found in output');
                return null;
            }
            const parsed = this.parseFairyMove(bestMove);
            const parsedPonder = ponderMove ? this.parseFairyMove(ponderMove) : null;
            if (parsed) {
                console.log(`🐟 Fairy-Stockfish: ${bestMove} → [${parsed.from}]→[${parsed.to}] (score: ${score})`);
                if (parsedPonder) {
                    console.log(`🐟 Ponder: ${ponderMove} → [${parsedPonder.from}]→[${parsedPonder.to}]`);
                }
            }
            return { move: parsed, ponder: parsedPonder };
        } catch (e) {
            console.warn('Fairy-Stockfish move error:', e);
            return null;
        }
    },

    // ========== Built-in Engine (Fallback) ==========
    PIECE_VALUES: {
        'K': 10000, 'A': 120, 'E': 120, 'R': 600, 'H': 270, 'C': 285, 'P': 30,
        'k': 10000, 'a': 120, 'e': 120, 'r': 600, 'h': 270, 'c': 285, 'p': 30
    },
    MVV_VALUES: { 'K': 100, 'A': 20, 'E': 20, 'R': 60, 'H': 27, 'C': 29, 'P': 10 },

    POS_BONUS: {
        'P': [
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [10,0,10,0,15,0,10,0,10],[20,0,30,0,40,0,30,0,20],
            [30,40,50,60,70,60,50,40,30],[50,60,70,80,90,80,70,60,50],
            [70,80,90,100,110,100,90,80,70],[90,100,110,120,130,120,110,100,90],
            [0,0,0,0,0,0,0,0,0]
        ],
        'H': [
            [0,-4,0,0,0,0,0,-4,0],[0,4,12,8,8,8,12,4,0],
            [4,4,16,14,16,14,16,4,4],[4,12,16,20,24,20,16,12,4],
            [8,16,20,24,28,24,20,16,8],[8,16,20,24,28,24,20,16,8],
            [4,12,16,20,24,20,16,12,4],[4,8,16,14,16,14,16,8,4],
            [0,4,8,8,8,8,8,4,0],[0,-4,0,0,0,0,0,-4,0]
        ],
        'C': [
            [4,4,0,12,14,12,0,4,4],[4,8,12,18,24,18,12,8,4],
            [4,8,8,14,20,14,8,8,4],[0,2,8,14,20,14,8,2,0],
            [0,2,6,12,18,12,6,2,0],[-2,0,6,14,16,14,6,0,-2],
            [0,0,0,12,16,12,0,0,0],[0,0,-2,6,14,6,-2,0,0],
            [0,0,0,2,12,2,0,0,0],[0,0,0,0,6,0,0,0,0]
        ],
        'R': [
            [6,8,6,14,20,14,6,8,6],[8,14,12,18,24,18,12,14,8],
            [6,12,10,18,22,18,10,12,6],[8,14,14,20,28,20,14,14,8],
            [14,20,20,26,34,26,20,20,14],[14,20,20,26,34,26,20,20,14],
            [8,14,14,20,28,20,14,14,8],[6,12,10,18,22,18,10,12,6],
            [4,8,10,14,18,14,10,8,4],[2,6,8,14,16,14,8,6,2]
        ],
        'A': [
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,20,0,20,0,0,0],
            [0,0,0,0,25,0,0,0,0],[0,0,0,20,0,20,0,0,0]
        ],
        'E': [
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,12,0,0,0,12,0,0],
            [0,0,0,0,0,0,0,0,0],[8,0,0,0,18,0,0,0,8],
            [0,0,0,0,0,0,0,0,0],[0,0,10,0,0,0,10,0,0]
        ],
        'K': [
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],[0,0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0,0],[0,0,0,-50,-60,-50,0,0,0],
            [0,0,0,-20,-30,-20,0,0,0],[0,0,0,8,20,8,0,0,0]
        ]
    },

    _zobristInited: false, _zobristTable: null, _zobristSide: 0,
    _initZobrist() {
        if (this._zobristInited) return;
        const P = ['K','A','E','R','H','C','P','k','a','e','r','h','c','p'];
        this._zobristTable = {};
        const r32 = () => (Math.random() * 0xFFFFFFFF) >>> 0;
        for (const p of P) { this._zobristTable[p] = [];
            for (let r = 0; r < 10; r++) { this._zobristTable[p][r] = [];
                for (let c = 0; c < 9; c++) this._zobristTable[p][r][c] = r32();
            }
        }
        this._zobristSide = r32(); this._zobristInited = true;
    },
    computeHash(board, isRedTurn) {
        this._initZobrist(); let h = 0;
        for (let r = 0; r < 10; r++) for (let c = 0; c < 9; c++) {
            const p = board[r][c]; if (p) h ^= this._zobristTable[p][r][c];
        }
        if (!isRedTurn) h ^= this._zobristSide; return h;
    },

    _ttable: new Map(), _ttMax: 200000,
    ttLookup(hash, depth, alpha, beta) {
        const e = this._ttable.get(hash);
        if (!e || e.depth < depth) return null;
        if (e.flag === 0) return e.score;
        if (e.flag === -1 && e.score <= alpha) return alpha;
        if (e.flag === 1 && e.score >= beta) return beta;
        return null;
    },
    ttStore(hash, depth, score, flag, bestMove) {
        if (this._ttable.size > this._ttMax) {
            const keys = [...this._ttable.keys()];
            for (let i = 0; i < keys.length / 2; i++) this._ttable.delete(keys[i]);
        }
        this._ttable.set(hash, { depth, score, flag, bestMove });
    },

    _killers: [],
    _initKillers(d) { this._killers = []; for (let i = 0; i <= d + 2; i++) this._killers.push([null, null]); },
    _storeKiller(d, m) {
        if (!this._killers[d]) return;
        const k0 = this._killers[d][0];
        if (k0 && k0.from[0]===m.from[0] && k0.from[1]===m.from[1] && k0.to[0]===m.to[0] && k0.to[1]===m.to[1]) return;
        this._killers[d][1] = this._killers[d][0]; this._killers[d][0] = m;
    },
    _isKiller(d, m) {
        if (!this._killers[d]) return false;
        for (let i = 0; i < 2; i++) { const k = this._killers[d][i];
            if (k && k.from[0]===m.from[0] && k.from[1]===m.from[1] && k.to[0]===m.to[0] && k.to[1]===m.to[1]) return true;
        } return false;
    },

    _historyTable: {},
    _initHistory() { this._historyTable = {}; },
    _getHistoryScore(m) { return this._historyTable[`${m.from[0]},${m.from[1]},${m.to[0]},${m.to[1]}`] || 0; },
    _storeHistory(m, d) { const k = `${m.from[0]},${m.from[1]},${m.to[0]},${m.to[1]}`;
        this._historyTable[k] = (this._historyTable[k] || 0) + d * d; },

    evaluate(board) {
        let score = 0, redAdv = 0, redEle = 0, blkAdv = 0, blkEle = 0;
        // Track piece locations for positional analysis
        const redPieces = [], blkPieces = [];
        for (let r = 0; r <= 9; r++) for (let c = 0; c <= 8; c++) {
            const piece = board[r][c]; if (!piece) continue;
            const isRed = XiangqiRules.isRed(piece), type = piece.toUpperCase();
            let val = this.PIECE_VALUES[piece];
            const pt = this.POS_BONUS[type];
            if (pt) val += pt[isRed ? r : 9 - r][c];
            if (isRed) {
                if (type === 'A') redAdv++; if (type === 'E') redEle++;
                redPieces.push({type, r, c, piece});
            } else {
                if (type === 'A') blkAdv++; if (type === 'E') blkEle++;
                blkPieces.push({type, r, c, piece});
            }
            score += isRed ? val : -val;
        }

        // === Positional Evaluation ===
        let redPos = 0, blkPos = 0;

        // --- Rook evaluation ---
        for (const p of redPieces.filter(p => p.type === 'R')) {
            // Open file bonus (no friendly pawn on same column)
            const hasFriendlyPawn = redPieces.some(x => x.type === 'P' && x.c === p.c);
            const hasEnemyPawn = blkPieces.some(x => x.type === 'P' && x.c === p.c);
            if (!hasFriendlyPawn && !hasEnemyPawn) redPos += 25; // open file
            else if (!hasFriendlyPawn) redPos += 12; // semi-open
            // Rook penetration (across river)
            if (p.r <= 4) redPos += 20;
            // Rook on back rank protecting
            if (p.r >= 8) redPos += 8;
        }
        for (const p of blkPieces.filter(p => p.type === 'R')) {
            const hasFriendlyPawn = blkPieces.some(x => x.type === 'P' && x.c === p.c);
            const hasEnemyPawn = redPieces.some(x => x.type === 'P' && x.c === p.c);
            if (!hasFriendlyPawn && !hasEnemyPawn) blkPos += 25;
            else if (!hasFriendlyPawn) blkPos += 12;
            if (p.r >= 5) blkPos += 20;
            if (p.r <= 1) blkPos += 8;
        }

        // --- Cannon evaluation ---
        for (const p of redPieces.filter(p => p.type === 'C')) {
            // Cannon with screen pieces (pieces between cannon and target)
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                let screens = 0, hasTarget = false;
                for (let i = 1; i <= 9; i++) {
                    const nr = p.r + dr*i, nc = p.c + dc*i;
                    if (nr < 0 || nr > 9 || nc < 0 || nc > 8) break;
                    if (board[nr][nc]) {
                        screens++;
                        if (screens === 2 && !XiangqiRules.isRed(board[nr][nc])) { hasTarget = true; break; }
                        if (screens > 2) break;
                    }
                }
                if (hasTarget) redPos += 18;
                if (screens === 1) redPos += 6; // has screen, potential
            }
        }
        for (const p of blkPieces.filter(p => p.type === 'C')) {
            for (const [dr, dc] of [[-1,0],[1,0],[0,-1],[0,1]]) {
                let screens = 0, hasTarget = false;
                for (let i = 1; i <= 9; i++) {
                    const nr = p.r + dr*i, nc = p.c + dc*i;
                    if (nr < 0 || nr > 9 || nc < 0 || nc > 8) break;
                    if (board[nr][nc]) {
                        screens++;
                        if (screens === 2 && XiangqiRules.isRed(board[nr][nc])) { hasTarget = true; break; }
                        if (screens > 2) break;
                    }
                }
                if (hasTarget) blkPos += 18;
                if (screens === 1) blkPos += 6;
            }
        }

        // --- Horse evaluation ---
        for (const p of redPieces.filter(p => p.type === 'H')) {
            if (p.r <= 4) redPos += 15; // across river
            if (p.c >= 2 && p.c <= 6) redPos += 10; // central
            // Connected horses (horses protecting each other)
            for (const h2 of redPieces.filter(x => x.type === 'H' && x !== p)) {
                const dr = Math.abs(p.r - h2.r), dc = Math.abs(p.c - h2.c);
                if ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) redPos += 8;
            }
        }
        for (const p of blkPieces.filter(p => p.type === 'H')) {
            if (p.r >= 5) blkPos += 15;
            if (p.c >= 2 && p.c <= 6) blkPos += 10;
            for (const h2 of blkPieces.filter(x => x.type === 'H' && x !== p)) {
                const dr = Math.abs(p.r - h2.r), dc = Math.abs(p.c - h2.c);
                if ((dr === 2 && dc === 1) || (dr === 1 && dc === 2)) blkPos += 8;
            }
        }

        // --- Pawn structure ---
        for (const p of redPieces.filter(p => p.type === 'P')) {
            if (p.r <= 4) { // across river
                // Connected pawns (adjacent pawn on same rank)
                if (redPieces.some(x => x.type === 'P' && x.r === p.r && Math.abs(x.c - p.c) === 2)) redPos += 12;
                // Advanced pawn threatening palace
                if (p.r <= 2 && p.c >= 3 && p.c <= 5) redPos += 20;
            }
        }
        for (const p of blkPieces.filter(p => p.type === 'P')) {
            if (p.r >= 5) {
                if (blkPieces.some(x => x.type === 'P' && x.r === p.r && Math.abs(x.c - p.c) === 2)) blkPos += 12;
                if (p.r >= 7 && p.c >= 3 && p.c <= 5) blkPos += 20;
            }
        }

        // --- Piece mobility (simplified: count raw moves for major pieces) ---
        for (const p of redPieces) {
            if (p.type === 'R' || p.type === 'H' || p.type === 'C') {
                const moves = XiangqiRules.generateRawMoves(board, p.r, p.c);
                redPos += moves.length * 2;
                // Bonus for threatening high-value enemy pieces
                for (const [mr, mc] of moves) {
                    const t = board[mr][mc];
                    if (t && !XiangqiRules.isRed(t)) {
                        const tv = this.PIECE_VALUES[t.toUpperCase()] || 0;
                        if (tv >= 270) redPos += 8; // threatening Rook/Horse/Cannon
                    }
                }
            }
        }
        for (const p of blkPieces) {
            if (p.type === 'R' || p.type === 'H' || p.type === 'C') {
                const moves = XiangqiRules.generateRawMoves(board, p.r, p.c);
                blkPos += moves.length * 2;
                for (const [mr, mc] of moves) {
                    const t = board[mr][mc];
                    if (t && XiangqiRules.isRed(t)) {
                        const tv = this.PIECE_VALUES[t.toUpperCase()] || 0;
                        if (tv >= 270) blkPos += 8;
                    }
                }
            }
        }

        score += redPos - blkPos;

        // === Structural bonuses ===
        score += (redAdv * 15 + redEle * 10) - (blkAdv * 15 + blkEle * 10);
        if (redAdv === 0) score -= 40; if (blkAdv === 0) score += 40;
        if (redEle === 0) score -= 20; if (blkEle === 0) score += 20;

        // === King safety ===
        try {
            const rk = XiangqiRules.findKing(board, true);
            const bk = XiangqiRules.findKing(board, false);
            if (rk) {
                if (rk[0] < 9) score -= (9 - rk[0]) * 40;
                let hasAdj = false;
                for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
                    const nr = rk[0]+dr, nc = rk[1]+dc;
                    if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8 && (board[nr][nc] === 'A')) hasAdj = true;
                }
                if (!hasAdj && redAdv > 0) score -= 50;
                if (redEle > 0) {
                    let hasEle = false;
                    for (const [dr,dc] of [[-2,-2],[-2,2],[2,-2],[2,2]]) {
                        const nr = rk[0]+dr, nc = rk[1]+dc;
                        if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8 && (board[nr][nc] === 'E')) hasEle = true;
                    }
                    if (!hasEle) score -= 30;
                }
            }
            if (bk) {
                if (bk[0] > 0) score += bk[0] * 40;
                let hasAdj = false;
                for (const [dr,dc] of [[-1,-1],[-1,1],[1,-1],[1,1]]) {
                    const nr = bk[0]+dr, nc = bk[1]+dc;
                    if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8 && (board[nr][nc] === 'a')) hasAdj = true;
                }
                if (!hasAdj && blkAdv > 0) score += 50;
                if (blkEle > 0) {
                    let hasEle = false;
                    for (const [dr,dc] of [[-2,-2],[-2,2],[2,-2],[2,2]]) {
                        const nr = bk[0]+dr, nc = bk[1]+dc;
                        if (nr >= 0 && nr <= 9 && nc >= 0 && nc <= 8 && (board[nr][nc] === 'e')) hasEle = true;
                    }
                    if (!hasEle) score += 30;
                }
            }
            if (XiangqiRules.isInCheck(board, false)) score += 45;
            if (XiangqiRules.isInCheck(board, true)) score -= 45;
        } catch (_) {}
        return score;
    },

    orderMoves(board, moves, depth, ttBest) {
        return moves.sort((a, b) => {
            if (ttBest) {
                if (a.from[0]===ttBest.from[0]&&a.from[1]===ttBest.from[1]&&a.to[0]===ttBest.to[0]&&a.to[1]===ttBest.to[1]) return -1;
                if (b.from[0]===ttBest.from[0]&&b.from[1]===ttBest.from[1]&&b.to[0]===ttBest.to[0]&&b.to[1]===ttBest.to[1]) return 1;
            }
            const cA = board[a.to[0]][a.to[1]], cB = board[b.to[0]][b.to[1]];
            if (cA && cB) {
                return (this.MVV_VALUES[cB.toUpperCase()]*100 - this.MVV_VALUES[board[b.from[0]][b.from[1]].toUpperCase()]) -
                       (this.MVV_VALUES[cA.toUpperCase()]*100 - this.MVV_VALUES[board[a.from[0]][a.from[1]].toUpperCase()]);
            }
            if (cA) return -1; if (cB) return 1;
            const kA = this._isKiller(depth, a)?1:0, kB = this._isKiller(depth, b)?1:0;
            if (kA !== kB) return kB - kA;
            return this._getHistoryScore(b) - this._getHistoryScore(a);
        });
    },

    quiescence(board, alpha, beta, isMax, startTime, timeLimit, qd) {
        if (performance.now() - startTime > timeLimit || qd <= 0) return this.evaluate(board);
        const sp = this.evaluate(board);
        if (isMax) { if (sp >= beta) return beta; if (sp > alpha) alpha = sp; }
        else { if (sp <= alpha) return alpha; if (sp < beta) beta = sp; }
        const caps = XiangqiRules.getAllLegalMoves(board, isMax).filter(m => board[m.to[0]][m.to[1]]);
        if (caps.length === 0) return sp;
        caps.sort((a, b) => (this.PIECE_VALUES[board[b.to[0]][b.to[1]]] || 0) - (this.PIECE_VALUES[board[a.to[0]][a.to[1]]] || 0));
        if (isMax) {
            for (const m of caps) {
                const nb = XiangqiRules.makeMove(board, m.from[0], m.from[1], m.to[0], m.to[1]);
                const s = this.quiescence(nb, alpha, beta, false, startTime, timeLimit, qd - 1);
                if (s > alpha) alpha = s; if (alpha >= beta) return beta;
            } return alpha;
        } else {
            for (const m of caps) {
                const nb = XiangqiRules.makeMove(board, m.from[0], m.from[1], m.to[0], m.to[1]);
                const s = this.quiescence(nb, alpha, beta, true, startTime, timeLimit, qd - 1);
                if (s < beta) beta = s; if (alpha >= beta) return alpha;
            } return beta;
        }
    },

    minimax(board, depth, alpha, beta, isMax, startTime, timeLimit, maxD) {
        if (performance.now() - startTime > timeLimit) return { score: this.evaluate(board) };
        const isRedTurn = isMax;
        if (XiangqiRules.isCheckmate(board, isRedTurn)) return { score: isMax ? -99999+(maxD-depth) : 99999-(maxD-depth) };
        if (XiangqiRules.isStalemate(board, isRedTurn)) return { score: 0 };
        if (depth === 0) return { score: this.quiescence(board, alpha, beta, isMax, startTime, timeLimit, 8) };
        const hash = this.computeHash(board, isRedTurn);
        const ttS = this.ttLookup(hash, depth, alpha, beta);
        if (ttS !== null && depth < maxD) return { score: ttS };

        // Null Move Pruning: if we can "pass" and still cause a beta cutoff, prune
        const inCheck = XiangqiRules.isInCheck(board, isRedTurn);
        if (depth >= 3 && !inCheck && maxD - depth > 0) {
            const R = 2; // reduction
            const nullR = this.minimax(board, depth - 1 - R, isMax ? -beta : -alpha, isMax ? -(beta-1) : -(alpha+1), !isMax, startTime, timeLimit, maxD);
            const nullScore = nullR.score;
            if (isMax && nullScore >= beta) return { score: beta };
            if (!isMax && nullScore <= alpha) return { score: alpha };
        }

        const ttE = this._ttable.get(hash), ttBM = ttE ? ttE.bestMove : null;
        let moves = XiangqiRules.getAllLegalMoves(board, isRedTurn);
        if (moves.length === 0) return { score: this.evaluate(board) };
        moves = this.orderMoves(board, moves, maxD - depth, ttBM);
        let best = moves[0], ttF = -1;
        if (isMax) {
            let maxE = -Infinity;
            for (let i = 0; i < moves.length; i++) {
                const m = moves[i];
                // Late Move Reduction: reduce depth for quiet moves late in the list
                let reduction = 0;
                if (i >= 4 && depth >= 3 && !board[m.to[0]][m.to[1]] && !this._isKiller(maxD-depth, m) && !inCheck) {
                    reduction = 1;
                }
                const nb = XiangqiRules.makeMove(board, m.from[0], m.from[1], m.to[0], m.to[1]);
                let r = this.minimax(nb, depth-1-reduction, alpha, beta, false, startTime, timeLimit, maxD);
                // Re-search at full depth if reduced search improved alpha
                if (reduction > 0 && r.score > alpha) {
                    r = this.minimax(nb, depth-1, alpha, beta, false, startTime, timeLimit, maxD);
                }
                if (r.score > maxE) { maxE = r.score; best = m; }
                if (maxE > alpha) { alpha = maxE; ttF = 0; }
                if (beta <= alpha) {
                    if (!board[m.to[0]][m.to[1]]) { this._storeKiller(maxD-depth, m); this._storeHistory(m, depth); }
                    ttF = 1; break;
                }
            }
            this.ttStore(hash, depth, maxE, ttF, best); return { score: maxE, move: best };
        } else {
            let minE = Infinity;
            for (let i = 0; i < moves.length; i++) {
                const m = moves[i];
                let reduction = 0;
                if (i >= 4 && depth >= 3 && !board[m.to[0]][m.to[1]] && !this._isKiller(maxD-depth, m) && !inCheck) {
                    reduction = 1;
                }
                const nb = XiangqiRules.makeMove(board, m.from[0], m.from[1], m.to[0], m.to[1]);
                let r = this.minimax(nb, depth-1-reduction, alpha, beta, true, startTime, timeLimit, maxD);
                if (reduction > 0 && r.score < beta) {
                    r = this.minimax(nb, depth-1, alpha, beta, true, startTime, timeLimit, maxD);
                }
                if (r.score < minE) { minE = r.score; best = m; }
                if (minE < beta) { beta = minE; ttF = 0; }
                if (beta <= alpha) {
                    if (!board[m.to[0]][m.to[1]]) { this._storeKiller(maxD-depth, m); this._storeHistory(m, depth); }
                    ttF = -1; break;
                }
            }
            this.ttStore(hash, depth, minE, ttF, best); return { score: minE, move: best };
        }
    },

    // ========== Public API ==========
    async getBestMove(board, isRedTurn, depth = 20, timeLimitMs = 15000) {
        // Initialize Fairy-Stockfish on first call
        if (!this._engine && !this._engineFailed && !this._engineLoading) {
            this.initFairyStockfish();
        }

        // If engine is loading, wait for it (up to 15 seconds)
        if (this._engineLoading && !this._engineReady && !this._engineFailed) {
            console.log('⏳ Waiting for Fairy-Stockfish engine...');
            const waitStart = performance.now();
            while (this._engineLoading && !this._engineReady && !this._engineFailed) {
                await new Promise(r => setTimeout(r, 200));
                if (performance.now() - waitStart > 15000) {
                    console.log('⚠️ Engine still loading, using built-in AI');
                    break;
                }
            }
        }

        // If Fairy-Stockfish is ready, use it
        if (this._engineReady && !this._engineFailed) {
            return this._getFairyMove(board, isRedTurn, depth, timeLimitMs);
        }

        // Fallback: built-in minimax
        console.log('Using built-in minimax engine');
        return this._getMinimaxMove(board, isRedTurn, depth, timeLimitMs);
    },

    // Check if player's move matches the ponder prediction — return instant response
    checkPonder(playerMove) {
        if (!this._ponderMove || !this._ponderResponse) return null;
        if (playerMove.from[0] === this._ponderMove.from[0] &&
            playerMove.from[1] === this._ponderMove.from[1] &&
            playerMove.to[0] === this._ponderMove.to[0] &&
            playerMove.to[1] === this._ponderMove.to[1]) {
            console.log('⚡ Ponder hit! Responding instantly');
            const response = this._ponderResponse;
            this._ponderMove = null;
            this._ponderResponse = null;
            this._ponderBoard = null;
            return response;
        }
        // Player didn't play the expected move — discard ponder
        this._ponderMove = null;
        this._ponderResponse = null;
        this._ponderBoard = null;
        return null;
    },

    // Start pre-computing the response to the expected ponder move
    async _startPonder(board, aiMove, ponderMove, isRedTurn) {
        if (!ponderMove || !this._engineReady || this._ponderSearching) return;
        try {
            // Build board after AI move + ponder move
            const boardAfterAI = XiangqiRules.makeMove(board, aiMove.from[0], aiMove.from[1], aiMove.to[0], aiMove.to[1]);
            // Validate ponder move
            const ponderPiece = boardAfterAI[ponderMove.from[0]][ponderMove.from[1]];
            if (!ponderPiece) return;
            const boardAfterPonder = XiangqiRules.makeMove(boardAfterAI, ponderMove.from[0], ponderMove.from[1], ponderMove.to[0], ponderMove.to[1]);

            this._ponderMove = ponderMove;
            this._ponderBoard = boardAfterPonder;
            this._ponderSearching = true;

            console.log(`🐟 Pondering: if opponent plays [${ponderMove.from}]→[${ponderMove.to}]...`);

            // Search for our response (AI's turn after ponder)
            const fairyDepth = 30;
            const result = await this.requestFairyMove(boardAfterPonder, isRedTurn, fairyDepth, 15000);
            this._ponderSearching = false;

            if (result && result.move) {
                const piece = boardAfterPonder[result.move.from[0]][result.move.from[1]];
                if (piece) {
                    const legal = XiangqiRules.getLegalMoves(boardAfterPonder, result.move.from[0], result.move.from[1]);
                    const isLegal = legal.some(m => m[0] === result.move.to[0] && m[1] === result.move.to[1]);
                    if (isLegal) {
                        this._ponderResponse = result.move;
                        console.log(`🐟 Ponder response ready: [${result.move.from}]→[${result.move.to}]`);
                        return;
                    }
                }
            }
            // Ponder search failed — clear
            this._ponderMove = null;
            this._ponderResponse = null;
            this._ponderBoard = null;
        } catch (e) {
            this._ponderSearching = false;
            this._ponderMove = null;
            this._ponderResponse = null;
            this._ponderBoard = null;
        }
    },

    async _getFairyMove(board, isRedTurn, depth, timeLimitMs) {
        try {
            const fairyDepth = Math.min(depth + 16, 50);
            const result = await this.requestFairyMove(board, isRedTurn, fairyDepth, timeLimitMs);
            if (result && result.move) {
                const move = result.move;
                const piece = board[move.from[0]][move.from[1]];
                console.log(`🐟 Move: [${move.from}] → [${move.to}], piece=${piece}`);
                if (piece) {
                    const legal = XiangqiRules.getLegalMoves(board, move.from[0], move.from[1]);
                    const isLegal = legal.some(m => m[0] === move.to[0] && m[1] === move.to[1]);
                    if (isLegal) {
                        console.log(`✅ Fairy move validated!`);
                        // Start ponder search in background (don't await)
                        if (result.ponder) {
                            this._startPonder(board, move, result.ponder, isRedTurn);
                        }
                        return move;
                    }
                    const fen = this.boardToFen(board, isRedTurn);
                    console.warn(`❌ Fairy move REJECTED: ${piece} [${move.from}]→[${move.to}]`);
                    console.warn(`   FEN: ${fen}`);
                    console.warn(`   Legal moves for ${piece} at [${move.from}]:`, legal);
                    console.warn(`   Board at target [${move.to}]: ${board[move.to[0]][move.to[1]] || 'empty'}`);
                } else {
                    console.warn(`❌ No piece at [${move.from}] — rejecting FS move`);
                }
            }
        } catch (e) {
            console.warn('Fairy error, fallback:', e);
        }
        console.log('⬇️ Falling back to built-in minimax AI');
        return this._getMinimaxMove(board, isRedTurn, depth, timeLimitMs);
    },

    _getMinimaxMove(board, isRedTurn, depth, timeLimitMs) {
        try {
            this._initZobrist(); this._initKillers(depth + 2); this._initHistory();
            const st = performance.now(); let best = null;
            for (let d = 1; d <= depth; d++) {
                const r = this.minimax(board, d, -Infinity, Infinity, isRedTurn, st, timeLimitMs, d);
                if (r.move) { best = r; console.log(`AI depth ${d}: score=${r.score} time=${(performance.now()-st).toFixed(0)}ms`); }
                if (performance.now() - st > timeLimitMs * 0.6) break;
                if (r.score > 90000 || r.score < -90000) break;
            }
            if (!best || !best.move) {
                const moves = XiangqiRules.getAllLegalMoves(board, isRedTurn);
                return moves.length > 0 ? moves[Math.floor(Math.random() * moves.length)] : null;
            }
            return best.move;
        } catch (e) {
            console.error('Minimax error:', e);
            try { const m = XiangqiRules.getAllLegalMoves(board, isRedTurn);
                return m.length > 0 ? m[Math.floor(Math.random() * m.length)] : null;
            } catch (_) { return null; }
        }
    },

    rankMoves(board, isRedTurn, depth = 2, timeLimitMs = 1200) {
        try {
            this._initZobrist(); this._initKillers(depth + 2); this._initHistory();
            const st = performance.now();
            const all = XiangqiRules.getAllLegalMoves(board, isRedTurn);
            const ranked = [];
            for (const m of all) {
                const nb = XiangqiRules.makeMove(board, m.from[0], m.from[1], m.to[0], m.to[1]);
                const r = this.minimax(nb, depth - 1, -Infinity, Infinity, !isRedTurn, st, timeLimitMs, depth);
                ranked.push({ move: m, score: r.score });
                if (performance.now() - st > timeLimitMs) break;
            }
            ranked.sort((a, b) => isRedTurn ? b.score - a.score : a.score - b.score);
            return ranked;
        } catch (e) { return []; }
    }
};

// Auto-initialize Fairy-Stockfish on page load
window.addEventListener('DOMContentLoaded', () => {
    console.log('🐟 Starting Fairy-Stockfish engine download...');
    XiangqiAI.initFairyStockfish();
});
