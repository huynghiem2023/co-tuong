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
    },
    royal: {
        name: '👑 Hoàng Gia', isRoyal: true,
        boardShadow: '#3a2a10', boardBg: ['#dcc07a','#d2b468','#c8a85a','#c0a050'],
        boardBorder: '#1a5a8a', gridLine: '#6a5530', markerColor: '#6a5530', riverText: '#7a6540',
        frameBorder: '#1a5a8a', frameHighlight: '#4aa0d0', frameGold: '#c8a040',
        redPiece: ['#f0dcc0','#e8d0b0','#c8a880'], redRing: 'rgba(180,60,40,0.6)', redChar: '#8b1a1a',
        blackPiece: ['#f0dcc0','#e8d0b0','#c8a880'], blackRing: 'rgba(40,60,80,0.5)', blackChar: '#1a1a2a'
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
        this.flipped = false;
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
        if (this.flipped) {
            return { x: this.padding + (8 - col) * this.cellSize, y: this.padding + (9 - row) * this.cellSize };
        }
        return { x: this.padding + col * this.cellSize, y: this.padding + row * this.cellSize };
    }

    getCellFromPixel(px, py) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.logicalWidth / rect.width;
        const scaleY = this.logicalHeight / rect.height;
        const x = (px - rect.left) * scaleX;
        const y = (py - rect.top) * scaleY;
        let col = Math.round((x - this.padding) / this.cellSize);
        let row = Math.round((y - this.padding) / this.cellSize);
        if (this.flipped) { row = 9 - row; col = 8 - col; }
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
        if (this.theme.isRoyal) { this.drawBoardRoyal(); }
        else if (this.theme.is3D) { this.drawBoard3D(); }
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

    drawBoardRoyal() {
        const ctx = this.ctx, cs = this.cellSize, p = this.padding, t = this.theme;
        const fx = p - 38, fy = p - 38, fw = 8 * cs + 76, fh = 9 * cs + 76;

        // Outer shadow
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30;
        ctx.shadowOffsetX = 4; ctx.shadowOffsetY = 6;
        ctx.fillStyle = '#0a2a4a'; ctx.fillRect(fx, fy, fw, fh);
        ctx.restore();

        // Blue ornate outer frame
        const frameG = ctx.createLinearGradient(fx, fy, fx + fw, fy + fh);
        frameG.addColorStop(0, '#1a6a9a'); frameG.addColorStop(0.15, '#2080b0');
        frameG.addColorStop(0.4, '#4aa0d0'); frameG.addColorStop(0.6, '#2888b8');
        frameG.addColorStop(0.85, '#1a6a9a'); frameG.addColorStop(1, '#104a70');
        ctx.fillStyle = frameG; ctx.fillRect(fx, fy, fw, fh);

        // Frame decorative border lines
        ctx.strokeStyle = '#80c8e8'; ctx.lineWidth = 1.5;
        ctx.strokeRect(fx + 4, fy + 4, fw - 8, fh - 8);
        ctx.strokeStyle = '#c8a040'; ctx.lineWidth = 1;
        ctx.strokeRect(fx + 7, fy + 7, fw - 14, fh - 14);

        // Corner ornaments (subtle gold accents)
        const cornerSize = 18;
        ctx.strokeStyle = '#d4b050'; ctx.lineWidth = 2;
        [[fx+10,fy+10,1,1],[fx+fw-10,fy+10,-1,1],[fx+10,fy+fh-10,1,-1],[fx+fw-10,fy+fh-10,-1,-1]].forEach(([cx,cy,dx,dy]) => {
            ctx.beginPath();
            ctx.moveTo(cx, cy + dy*cornerSize); ctx.lineTo(cx, cy); ctx.lineTo(cx + dx*cornerSize, cy);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(cx + dx*3, cy + dy*cornerSize*0.7); ctx.lineTo(cx + dx*3, cy + dy*3); ctx.lineTo(cx + dx*cornerSize*0.7, cy + dy*3);
            ctx.stroke();
        });

        // Inner dark red/maroon border
        const ix = p - 20, iy = p - 20, iw = 8 * cs + 40, ih = 9 * cs + 40;
        ctx.fillStyle = '#5a2020'; ctx.fillRect(ix, iy, iw, ih);
        ctx.strokeStyle = '#8a4040'; ctx.lineWidth = 1;
        ctx.strokeRect(ix + 2, iy + 2, iw - 4, ih - 4);

        // Golden wood board surface
        const g = ctx.createLinearGradient(p, p, p + 8*cs, p + 9*cs);
        g.addColorStop(0, t.boardBg[0]); g.addColorStop(0.3, t.boardBg[1]);
        g.addColorStop(0.7, t.boardBg[2]); g.addColorStop(1, t.boardBg[3]);
        ctx.fillStyle = g;
        ctx.fillRect(p - 12, p - 12, 8 * cs + 24, 9 * cs + 24);

        // Subtle wood grain texture
        ctx.globalAlpha = 0.06;
        for (let i = 0; i < 40; i++) {
            const y2 = p - 12 + (i * (9*cs+24) / 40);
            ctx.strokeStyle = i % 2 === 0 ? '#8a6a30' : '#a08040';
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.moveTo(p - 12, y2); ctx.lineTo(p + 8*cs + 12, y2); ctx.stroke();
        }
        ctx.globalAlpha = 1.0;

        // Inner board border
        ctx.strokeStyle = '#7a6030'; ctx.lineWidth = 1.5;
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
        if (this.flipped) {
            ctx.fillText('漢  界', p + 2 * cs, p + 4.5 * cs);
            ctx.fillText('楚  河', p + 6 * cs, p + 4.5 * cs);
        } else {
            ctx.fillText('楚  河', p + 2 * cs, p + 4.5 * cs);
            ctx.fillText('漢  界', p + 6 * cs, p + 4.5 * cs);
        }
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
        const ctx = this.ctx, cs = this.cellSize, cornerLen = cs * 0.28;
        // Draw corner brackets for a cell
        const drawCorners = (p, color, lineW) => {
            ctx.strokeStyle = color;
            ctx.lineWidth = lineW;
            ctx.lineCap = 'round';
            const half = cs / 2 - 2;
            // Top-left
            ctx.beginPath(); ctx.moveTo(p.x - half, p.y - half + cornerLen); ctx.lineTo(p.x - half, p.y - half); ctx.lineTo(p.x - half + cornerLen, p.y - half); ctx.stroke();
            // Top-right
            ctx.beginPath(); ctx.moveTo(p.x + half - cornerLen, p.y - half); ctx.lineTo(p.x + half, p.y - half); ctx.lineTo(p.x + half, p.y - half + cornerLen); ctx.stroke();
            // Bottom-left
            ctx.beginPath(); ctx.moveTo(p.x - half, p.y + half - cornerLen); ctx.lineTo(p.x - half, p.y + half); ctx.lineTo(p.x - half + cornerLen, p.y + half); ctx.stroke();
            // Bottom-right
            ctx.beginPath(); ctx.moveTo(p.x + half - cornerLen, p.y + half); ctx.lineTo(p.x + half, p.y + half); ctx.lineTo(p.x + half, p.y + half - cornerLen); ctx.stroke();
            ctx.lineCap = 'butt';
        };

        if (this.highlightFrom) {
            const p = this.getCanvasPos(this.highlightFrom[0], this.highlightFrom[1]);
            drawCorners(p, 'rgba(200,170,50,0.6)', 2);
        }
        if (this.highlightTo) {
            const p = this.getCanvasPos(this.highlightTo[0], this.highlightTo[1]);
            drawCorners(p, 'rgba(220,180,30,0.9)', 2.5);
        }
        if (this.selectedCell) {
            const p = this.getCanvasPos(this.selectedCell[0], this.selectedCell[1]);
            drawCorners(p, '#00ff88', 3);
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
        if (this.theme.isRoyal) this.drawPieceRoyal(x, y, piece);
        else if (this.theme.is3D) this.drawPiece3D(x, y, piece);
        else this.drawPiece2D(x, y, piece);
    }

    drawPieceRoyal(x, y, piece) {
        const ctx = this.ctx, r = this.pieceRadius * 1.15, isRed = piece === piece.toUpperCase(), t = this.theme;
        ctx.save();

        // Piece shadow
        ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2; ctx.shadowOffsetY = 3;

        // Wooden piece body — natural warm color gradient
        const bodyG = ctx.createRadialGradient(x - r*0.2, y - r*0.25, r*0.1, x, y, r);
        bodyG.addColorStop(0, '#f8ecd0');
        bodyG.addColorStop(0.4, '#e8d8b8');
        bodyG.addColorStop(0.7, '#d8c8a0');
        bodyG.addColorStop(1, '#c0a878');
        ctx.fillStyle = bodyG;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();

        ctx.restore();

        // Raised edge rim
        ctx.strokeStyle = '#a08860'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI*2); ctx.stroke();

        // Inner ring (colored: red or dark)
        const ringColor = isRed ? 'rgba(160,40,30,0.7)' : 'rgba(30,40,60,0.6)';
        ctx.strokeStyle = ringColor; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(x, y, r - 5, 0, Math.PI*2); ctx.stroke();

        // Chinese character
        const charColor = isRed ? '#8b1a1a' : '#1a1a2a';
        ctx.fillStyle = charColor;
        ctx.font = `bold ${r * 1.3}px 'KaiTi', 'STKaiti', 'SimSun', serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        const name = this.pieceNames[piece] || piece;
        ctx.fillText(name, x, y + 1);
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
                // Light cool tint for Black pieces — preserves wood grain
                ctx.fillStyle = 'rgba(20, 40, 70, 0.22)';
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            } else {
                // Very subtle warm tint for Red pieces
                ctx.fillStyle = 'rgba(200, 50, 20, 0.08)';
                ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
            // Colored ring border to clearly identify side
            ctx.beginPath(); ctx.arc(x, y, r - 1, 0, Math.PI * 2);
            ctx.strokeStyle = isRed ? 'rgba(180, 50, 20, 0.6)' : 'rgba(40, 60, 90, 0.5)';
            ctx.lineWidth = 2; ctx.stroke();
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
