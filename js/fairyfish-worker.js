// fairyfish-worker.js - Web Worker wrapper for Fairy-Stockfish WASM
// Loads Fairy-Stockfish from CDN and communicates via UCI protocol

const FAIRY_CDN = 'https://cdn.jsdelivr.net/npm/fairy-stockfish-nnue.wasm@1.1.11';

let engine = null;
let isReady = false;
let pendingResolve = null;
let outputBuffer = [];

// Load the engine
async function initEngine() {
    try {
        // Import the Fairy-Stockfish module from CDN
        importScripts(FAIRY_CDN + '/stockfish.js');

        engine = await Stockfish();

        // Capture engine output
        engine.addMessageListener((msg) => {
            // console.log('[Engine]', msg);
            if (pendingResolve && typeof msg === 'string') {
                outputBuffer.push(msg);

                // Check for completion markers
                if (msg === 'uciok' || msg === 'readyok' || msg.startsWith('bestmove')) {
                    const resolve = pendingResolve;
                    pendingResolve = null;
                    resolve(outputBuffer.slice());
                    outputBuffer = [];
                }
            }
        });

        // Initialize UCI
        await sendCommand('uci', 'uciok');
        // Set xiangqi variant
        await sendCommand('setoption name UCI_Variant value xiangqi');
        // Optimize for speed
        await sendCommand('setoption name Threads value 1');
        await sendCommand('setoption name Hash value 32');
        await sendCommand('isready', 'readyok');

        isReady = true;
        postMessage({ type: 'ready' });
    } catch (e) {
        postMessage({ type: 'error', error: 'Failed to load engine: ' + e.message });
    }
}

function sendCommand(cmd, waitFor) {
    return new Promise((resolve) => {
        outputBuffer = [];
        pendingResolve = resolve;
        engine.postMessage(cmd);

        // Timeout to prevent hanging
        setTimeout(() => {
            if (pendingResolve === resolve) {
                pendingResolve = null;
                resolve(outputBuffer.slice());
                outputBuffer = [];
            }
        }, 15000);
    });
}

// Handle messages from main thread
self.onmessage = async function(e) {
    const { type, data } = e.data;

    if (type === 'init') {
        await initEngine();
    } else if (type === 'getBestMove') {
        if (!isReady || !engine) {
            postMessage({ type: 'bestmove', requestId: data.requestId, move: null, error: 'Engine not ready' });
            return;
        }

        try {
            const { fen, depth, time, requestId } = data;

            // Set position
            await sendCommand('position fen ' + fen);
            await sendCommand('isready', 'readyok');

            // Search - use both depth and time limits
            const searchCmd = `go depth ${depth || 12} movetime ${time || 4000}`;
            const output = await sendCommand(searchCmd, 'bestmove');

            // Parse bestmove from output
            let bestMove = null;
            let score = null;
            for (const line of output) {
                if (typeof line === 'string') {
                    if (line.startsWith('bestmove')) {
                        const parts = line.split(' ');
                        bestMove = parts[1];
                    }
                    // Parse score from info lines
                    const scoreMatch = line.match(/score cp (-?\d+)/);
                    if (scoreMatch) {
                        score = parseInt(scoreMatch[1]);
                    }
                    const mateMatch = line.match(/score mate (-?\d+)/);
                    if (mateMatch) {
                        score = parseInt(mateMatch[1]) > 0 ? 99999 : -99999;
                    }
                }
            }

            postMessage({ type: 'bestmove', requestId, move: bestMove, score });
        } catch (e) {
            postMessage({ type: 'bestmove', requestId: data.requestId, move: null, error: e.message });
        }
    }
};
