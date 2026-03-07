// board.js - Canvas-based board rendering for Cờ Tướng with theme support

const BOARD_THEMES = {
    classic: {
        name: '🪵 Gỗ cổ điển',
        boardShadow: '#c8a254', boardBg: ['#e8cc7a','#dbb960','#d4ab52','#c99e48'],
        boardBorder: '#6b4c1e', gridLine: '#5a4320', markerColor: '#5a4320', riverText: '#6b4c1e',
        redPiece: ['#ff9a8b','#d32f2f','#7f0000'], redRing: 'rgba(255,205,210,0.8)', redChar: '#fff5f5',
        blackPiece: ['#78909c','#37474f','#111'], blackRing: 'rgba(176,190,197,0.6)', blackChar: '#eceff1'
    },
    jade: {
        name: '💎 Ngọc bích',
        boardShadow: '#2e6b5a', boardBg: ['#b8d8c8','#9cc8b4','#88bca4','#78b098'],
        boardBorder: '#2e5a4a', gridLine: '#2e5a4a', markerColor: '#2e5a4a', riverText: '#2e5a4a',
        redPiece: ['#ff8a70','#c62828','#6d1010'], redRing: 'rgba(255,180,170,0.8)', redChar: '#fff',
        blackPiece: ['#556b7a','#1a2e38','#0a1418'], blackRing: 'rgba(140,170,190,0.6)', blackChar: '#e8f0f8'
    },
    dark: {
        name: '🌑 Đêm tối',
        boardShadow: '#111', boardBg: ['#2a2a3a','#252535','#222230','#1e1e2e'],
        boardBorder: '#444460', gridLine: '#55557a', markerColor: '#55557a', riverText: '#6a6a90',
        redPiece: ['#ff6b5b','#b71c1c','#5a0e0e'], redRing: 'rgba(255,120,100,0.6)', redChar: '#ffdddd',
        blackPiece: ['#90a4ae','#455a64','#1a2228'], blackRing: 'rgba(144,164,174,0.5)', blackChar: '#cfd8dc'
    },
    rosewood: {
        name: '🟤 Gỗ hồng sắc',
        boardShadow: '#4a1a10', boardBg: ['#c4785a','#b86a4e','#a85e44','#985438'],
        boardBorder: '#3a1208', gridLine: '#3a1a10', markerColor: '#3a1a10', riverText: '#3a1a10',
        redPiece: ['#ffb090','#e53935','#8b1a1a'], redRing: 'rgba(255,200,180,0.8)', redChar: '#fff8f0',
        blackPiece: ['#607d8b','#263238','#0d1518'], blackRing: 'rgba(150,170,180,0.6)', blackChar: '#e0e8f0'
    },
    parchment: {
        name: '📜 Giấy da',
        boardShadow: '#a09070', boardBg: ['#f5edd4','#ece4c8','#e5dcbe','#ddd4b4'],
        boardBorder: '#8a7a5a', gridLine: '#7a6a4a', markerColor: '#7a6a4a', riverText: '#7a6a4a',
        redPiece: ['#ff8a7a','#c62828','#700000'], redRing: 'rgba(255,180,170,0.85)', redChar: '#fff5f0',
        blackPiece: ['#607d8b','#2c3e50','#0e1a20'], blackRing: 'rgba(140,160,176,0.6)', blackChar: '#e8ecf0'
    },
    realistic3d: {
        name: '🏆 3D Chân thực', is3D: true,
        boardShadow: '#5a3a1a', boardBg: ['#d4a86a','#c89e60','#c09555','#b88c4a'],
        boardBorder: '#4a2a0a', gridLine: '#4a3018', markerColor: '#4a3018', riverText: '#4a3018',
        redPiece: ['#ff9a8b','#d32f2f','#7f0000'], redRing: 'rgba(255,205,210,0.8)', redChar: '#fff5f5',
        blackPiece: ['#78909c','#37474f','#111'], blackRing: 'rgba(176,190,197,0.6)', blackChar: '#eceff1'
    }
};

class BoardRenderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 60;
        this.padding = 45;
        this.pieceRadius = 24;
        this.highlightFrom = null;
        this.highlightTo = null;
        this.hintCells = [];
        this.selectedCell = null;
        this.onCellClick = null;
        this.animating = false;
        this.themeKey = 'classic';
        this.theme = BOARD_THEMES.classic;
        this._lastBoard = null;
        this.pieceNames = {
            'K': '帥', 'A': '仕', 'E': '相', 'R': '車', 'H': '馬', 'C': '炮', 'P': '兵',
            'k': '將', 'a': '士', 'e': '象', 'r': '車', 'h': '馬', 'c': '砲', 'p': '卒'
        };
        // 3D assets
        this.assets = { loaded: false, wood: null, pieces: {} };
        this.preloadAssets();
        this.setupCanvas();
        this.canvas.addEventListener('click', this.handleClick.bind(this));
    }

    preloadAssets() {
        // Only load uppercase (Red) piece images — shared for both sides
        const upperKeys = ['K','A','E','R','H','C','P'];
        let loaded = 0;
        const total = upperKeys.length + 1; // pieces + wood texture
        const checkDone = () => {
            loaded++;
            if (loaded >= total) {
                this.assets.loaded = true;
                if (this.theme.is3D && this._lastBoard) {
                    this.render(this._lastBoard);
                }
            }
        };
        // Wood texture
        this.assets.wood = new Image();
        this.assets.wood.onload = checkDone;
        this.assets.wood.onerror = checkDone;
        this.assets.wood.src = 'assets/wood_texture.png';
        // Load piece images (uppercase only)
        for (const key of upperKeys) {
            const img = new Image();
            img.onload = checkDone;
            img.onerror = checkDone;
            img.src = 'assets/piece_' + key + '.png';
            this.assets.pieces[key] = img;
            // Map lowercase key to same image
            this.assets.pieces[key.toLowerCase()] = img;
        }
    }

    setTheme(themeKey) {
        if (BOARD_THEMES[themeKey]) {
            this.themeKey = themeKey;
            this.theme = BOARD_THEMES[themeKey];
        }
    }

    setupCanvas() {
        const w = 8 * this.cellSize + 2 * this.padding;
        const h = 9 * this.cellSize + 2 * this.padding;
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = w * dpr;
        this.canvas.height = h * dpr;
        this.canvas.style.width = w + 'px';
        this.canvas.style.height = h + 'px';
        this.ctx.scale(dpr, dpr);
        this.logicalWidth = w;
        this.logicalHeight = h;
    }

    getCanvasPos(row, col) {
        return { x: this.padding + col * this.cellSize, y: this.padding + row * this.cellSize };
    }

    getCellFromPixel(px, py) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.logicalWidth / rect.width;
        const scaleY = this.logicalHeight / rect.height;
        const x = (px - rect.left) * scaleX;
        const y = (py - rect.top) * scaleY;
        const col = Math.round((x - this.padding) / this.cellSize);
        const row = Math.round((y - this.padding) / this.cellSize);
        if (row >= 0 && row <= 9 && col >= 0 && col <= 8) return { row, col };
        return null;
    }

    handleClick(e) {
        if (this.animating) return;
        const cell = this.getCellFromPixel(e.clientX, e.clientY);
        if (cell && this.onCellClick) this.onCellClick(cell.row, cell.col);
    }

    render(board) {
        this._lastBoard = board;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.logicalWidth, this.logicalHeight);
        this.drawBoard();
        this.drawHighlights();
        this.drawPieces(board);
    }

    // ==================== BOARD DRAWING ====================
    drawBoard() {
        if (this.theme.is3D) { this.drawBoard3D(); }
        else { this.drawBoard2D(); }
    }

    drawBoard2D() {
        const ctx = this.ctx, cs = this.cellSize, p = this.padding, t = this.theme;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 25;
        ctx.fillStyle = t.boardShadow;
        ctx.fillRect(p - 22, p - 22, 8 * cs + 44, 9 * cs + 44);
        ctx.restore();

        const g = ctx.createLinearGradient(p, p, p + 8 * cs, p + 9 * cs);
        g.addColorStop(0, t.boardBg[0]); g.addColorStop(0.3, t.boardBg[1]);
        g.addColorStop(0.7, t.boardBg[2]); g.addColorStop(1, t.boardBg[3]);
        ctx.fillStyle = g;
        ctx.fillRect(p - 15, p - 15, 8 * cs + 30, 9 * cs + 30);

        ctx.strokeStyle = t.boardBorder; ctx.lineWidth = 3;
        ctx.strokeRect(p - 15, p - 15, 8 * cs + 30, 9 * cs + 30);
        ctx.lineWidth = 1;
        ctx.strokeRect(p - 5, p - 5, 8 * cs + 10, 9 * cs + 10);
        this.drawGridLines();
    }

    drawBoard3D() {
        const ctx = this.ctx, cs = this.cellSize, p = this.padding;
        const bx = p - 22, by = p - 22, bw = 8 * cs + 44, bh = 9 * cs + 44;
        const edgeH = 12;

        // Drop shadow
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 35;
        ctx.shadowOffsetX = 5; ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#000'; ctx.fillRect(bx, by, bw, bh); ctx.restore();

        // 3D edges
        ctx.fillStyle = '#3a2008'; ctx.beginPath();
        ctx.moveTo(bx, by + bh); ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw + edgeH, by + bh + edgeH); ctx.lineTo(bx + edgeH, by + bh + edgeH);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#4a2a10'; ctx.beginPath();
        ctx.moveTo(bx + bw, by); ctx.lineTo(bx + bw + edgeH, by + edgeH);
        ctx.lineTo(bx + bw + edgeH, by + bh + edgeH); ctx.lineTo(bx + bw, by + bh);
        ctx.closePath(); ctx.fill();

        // Board surface
        if (this.assets.wood && this.assets.wood.naturalWidth) {
            ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
            ctx.drawImage(this.assets.wood, bx, by, bw, bh);
            ctx.fillStyle = 'rgba(180,140,60,0.15)'; ctx.fillRect(bx, by, bw, bh);
            ctx.restore();
        } else {
            const g = ctx.createLinearGradient(p, p, p + 8 * cs, p + 9 * cs);
            g.addColorStop(0, '#d4a86a'); g.addColorStop(1, '#b88c4a');
            ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh);
        }
        // Gloss
        const gl = ctx.createLinearGradient(bx, by, bx, by + bh * 0.4);
        gl.addColorStop(0, 'rgba(255,255,255,0.10)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = gl; ctx.fillRect(bx, by, bw, bh * 0.4);

        ctx.strokeStyle = '#5a3a18'; ctx.lineWidth = 3; ctx.strokeRect(bx, by, bw, bh);
        ctx.strokeStyle = '#6a4a28'; ctx.lineWidth = 1;
        ctx.strokeRect(p - 5, p - 5, 8 * cs + 10, 9 * cs + 10);
        this.drawGridLines();
    }

    drawGridLines() {
        const ctx = this.ctx, cs = this.cellSize, p = this.padding, t = this.theme;
        ctx.strokeStyle = t.gridLine; ctx.lineWidth = 1.2;
        for (let r = 0; r <= 9; r++) {
            ctx.beginPath(); ctx.moveTo(p, p + r * cs); ctx.lineTo(p + 8 * cs, p + r * cs); ctx.stroke();
        }
        for (let c = 0; c <= 8; c++) {
            if (c === 0 || c === 8) {
                ctx.beginPath(); ctx.moveTo(p + c * cs, p); ctx.lineTo(p + c * cs, p + 9 * cs); ctx.stroke();
            } else {
                ctx.beginPath(); ctx.moveTo(p + c * cs, p); ctx.lineTo(p + c * cs, p + 4 * cs); ctx.stroke();
                ctx.beginPath(); ctx.moveTo(p + c * cs, p + 5 * cs); ctx.lineTo(p + c * cs, p + 9 * cs); ctx.stroke();
            }
        }
        ctx.setLineDash([]);
        ctx.beginPath(); ctx.moveTo(p+3*cs,p); ctx.lineTo(p+5*cs,p+2*cs); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p+5*cs,p); ctx.lineTo(p+3*cs,p+2*cs); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p+3*cs,p+7*cs); ctx.lineTo(p+5*cs,p+9*cs); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p+5*cs,p+7*cs); ctx.lineTo(p+3*cs,p+9*cs); ctx.stroke();

        ctx.fillStyle = t.riverText;
        ctx.font = `italic bold ${cs * 0.42}px "KaiTi", "STKaiti", serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText('楚  河', p + 2 * cs, p + 4.5 * cs);
        ctx.fillText('漢  界', p + 6 * cs, p + 4.5 * cs);
        this.drawPositionMarkers();
    }

    drawPositionMarkers() {
        const ctx = this.ctx, cs = this.cellSize, p = this.padding, ms = 5, gap = 3;
        ctx.strokeStyle = this.theme.markerColor; ctx.lineWidth = 1;
        const pos = [[2,1],[2,7],[7,1],[7,7],[3,0],[3,2],[3,4],[3,6],[3,8],[6,0],[6,2],[6,4],[6,6],[6,8]];
        for (const [row,col] of pos) {
            const x = p + col * cs, y = p + row * cs;
            const dirs = [];
            if (col > 0) dirs.push([-1,-1],[-1,1]);
            if (col < 8) dirs.push([1,-1],[1,1]);
            for (const [dx,dy] of dirs) {
                ctx.beginPath();
                ctx.moveTo(x+dx*gap, y+dy*(gap+ms));
                ctx.lineTo(x+dx*gap, y+dy*gap);
                ctx.lineTo(x+dx*(gap+ms), y+dy*gap);
                ctx.stroke();
            }
        }
    }

    // ==================== HIGHLIGHTS ====================
    drawHighlights() {
        const ctx = this.ctx, cs = this.cellSize;
        if (this.highlightFrom) {
            const p = this.getCanvasPos(this.highlightFrom[0], this.highlightFrom[1]);
            ctx.fillStyle = 'rgba(255,200,0,0.3)';
            ctx.fillRect(p.x - cs/2, p.y - cs/2, cs, cs);
        }
        if (this.highlightTo) {
            const p = this.getCanvasPos(this.highlightTo[0], this.highlightTo[1]);
            ctx.fillStyle = 'rgba(255,200,0,0.45)';
            ctx.fillRect(p.x - cs/2, p.y - cs/2, cs, cs);
        }
        if (this.selectedCell) {
            const p = this.getCanvasPos(this.selectedCell[0], this.selectedCell[1]);
            ctx.strokeStyle = '#00ff88'; ctx.lineWidth = 3;
            ctx.strokeRect(p.x - cs/2 + 2, p.y - cs/2 + 2, cs - 4, cs - 4);
        }
        for (const cell of this.hintCells) {
            const p = this.getCanvasPos(cell[0], cell[1]);
            ctx.fillStyle = 'rgba(0,220,120,0.3)';
            ctx.beginPath(); ctx.arc(p.x, p.y, this.pieceRadius*0.45, 0, Math.PI*2); ctx.fill();
        }
    }

    // ==================== PIECE DRAWING ====================
    drawPieces(board) {
        for (let row = 0; row <= 9; row++)
            for (let col = 0; col <= 8; col++) {
                const pc = board[row][col];
                if (pc) { const p = this.getCanvasPos(row, col); this.drawPieceAt(p.x, p.y, pc); }
            }
    }

    drawPieceAt(x, y, piece) {
        if (this.theme.is3D) this.drawPiece3D(x, y, piece);
        else this.drawPiece2D(x, y, piece);
    }

    drawPiece2D(x, y, piece) {
        const ctx = this.ctx, r = this.pieceRadius, isRed = piece === piece.toUpperCase(), t = this.theme;
        const colors = isRed ? t.redPiece : t.blackPiece;
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 5;
        ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 2;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        const bg = ctx.createRadialGradient(x - r*0.3, y - r*0.3, r*0.05, x, y, r);
        bg.addColorStop(0, colors[0]); bg.addColorStop(0.4, colors[1]); bg.addColorStop(1, colors[2]);
        ctx.fillStyle = bg; ctx.fill(); ctx.restore();
        ctx.beginPath(); ctx.arc(x, y, r - 3.5, 0, Math.PI * 2);
        ctx.strokeStyle = isRed ? t.redRing : t.blackRing; ctx.lineWidth = 1.5; ctx.stroke();
        ctx.fillStyle = isRed ? t.redChar : t.blackChar;
        ctx.font = `bold ${r*1.05}px "KaiTi","STKaiti","SimSun","Microsoft YaHei",serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(this.pieceNames[piece], x, y + 1);
    }

    drawPiece3D(x, y, piece) {
        const ctx = this.ctx, r = this.pieceRadius + 2;
        const isRed = piece === piece.toUpperCase();
        // Use uppercase key to find image (shared between Red and Black)
        const imgKey = piece.toUpperCase();
        const img = this.assets.pieces[imgKey];
        const hasImg = img && img.naturalWidth > 0;
        const imgSize = r * 2.3;

        // Shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 3; ctx.shadowOffsetY = 5;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0,0,0,0.01)'; ctx.fill();
        ctx.restore();

        if (hasImg) {
            // Draw the 3D piece image
            ctx.save();
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(img, x - imgSize/2, y - imgSize/2, imgSize, imgSize);
            // Color tint overlay to distinguish Red vs Black
            if (!isRed) {
                // Dark cool tint for Black pieces
                ctx.fillStyle = 'rgba(30, 50, 80, 0.35)';
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            } else {
                // Warm subtle tint for Red pieces
                ctx.fillStyle = 'rgba(180, 40, 20, 0.12)';
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
            // Colored ring border to clearly identify side
            ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2);
            ctx.strokeStyle = isRed ? 'rgba(220, 40, 30, 0.7)' : 'rgba(50, 70, 100, 0.7)';
            ctx.lineWidth = 2.5; ctx.stroke();
        } else {
            // Fallback gradient when no image available
            ctx.save();
            ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
            const bg = ctx.createRadialGradient(x-r*0.3, y-r*0.3, r*0.05, x+r*0.1, y+r*0.1, r);
            if (isRed) {
                bg.addColorStop(0,'#ffa090'); bg.addColorStop(0.3,'#e53935');
                bg.addColorStop(0.7,'#b71c1c'); bg.addColorStop(1,'#5a0000');
            } else {
                bg.addColorStop(0,'#90a4ae'); bg.addColorStop(0.3,'#546e7a');
                bg.addColorStop(0.7,'#263238'); bg.addColorStop(1,'#0a0e10');
            }
            ctx.fillStyle = bg; ctx.fill(); ctx.restore();
            ctx.beginPath(); ctx.arc(x, y, r-4, 0, Math.PI*2);
            ctx.strokeStyle = isRed ? 'rgba(255,215,0,0.5)' : 'rgba(180,190,200,0.4)';
            ctx.lineWidth = 1.5; ctx.stroke();
            // Fallback text
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.font = `bold ${r}px "KaiTi","STKaiti","SimSun","Microsoft YaHei",serif`;
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(this.pieceNames[piece], x+1, y+2);
            ctx.fillStyle = isRed ? '#ffe8e0' : '#e0e8f0';
            ctx.fillText(this.pieceNames[piece], x, y+1);
        }
    }

    // ==================== UTILITIES ====================
    setHighlight(from, to) { this.highlightFrom = from; this.highlightTo = to; }
    clearHighlights() { this.highlightFrom = null; this.highlightTo = null; this.selectedCell = null; this.hintCells = []; }

    animateMove(board, from, to, piece, callback) {
        const fromPos = this.getCanvasPos(from[0], from[1]);
        const toPos = this.getCanvasPos(to[0], to[1]);
        const duration = 280, startTime = performance.now();
        this.animating = true;
        const anim = (now) => {
            const t = Math.min((now - startTime) / duration, 1);
            const ease = 1 - (1-t)*(1-t);
            const cx = fromPos.x + (toPos.x - fromPos.x) * ease;
            const cy = fromPos.y + (toPos.y - fromPos.y) * ease;
            const tmp = board.map(r => [...r]); tmp[to[0]][to[1]] = null;
            this.render(tmp);
            this.drawPieceAt(cx, cy, piece);
            if (t < 1) requestAnimationFrame(anim);
            else { this.animating = false; this.render(board); if (callback) callback(); }
        };
        requestAnimationFrame(anim);
    }
}
