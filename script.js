const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const colorPalette = document.querySelector('.color-palette');
const lineWidthSlider = document.getElementById('lineWidth');
const pencilToolBtn = document.getElementById('pencilTool');
const eraserToolBtn = document.getElementById('eraserTool');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const clearCanvasBtn = document.getElementById('clearCanvas');
const savePngImageBtn = document.getElementById('savePngImage');
const savePdfImageBtn = document.getElementById('savePdfImage'); // PDF保存ボタン

// キャンバスのサイズ設定
canvas.width = 800;
canvas.height = 600;

let isDrawing = false;
let currentTool = 'pencil'; // 'pencil' or 'eraser'
let currentColor = '#000000'; // 現在選択されている色
ctx.lineWidth = lineWidthSlider.value;
ctx.lineCap = 'round'; // 線の端を丸くする
ctx.lineJoin = 'round'; // 線の角を丸くする

// --- アンドゥ/リドゥ用の履歴管理 ---
let history = []; // 描画履歴を保存する配列
let historyStep = -1; // 現在の履歴のステップ

// 初期設定
ctx.strokeStyle = currentColor;
ctx.fillStyle = '#FFFFFF'; // キャンバス背景色
ctx.fillRect(0, 0, canvas.width, canvas.height); // キャンバスを白で初期化
saveState(); // 初期状態を履歴に保存

// --- イベントリスナー ---
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mousemove', draw);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mouseout', stopDrawing);

colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
    ctx.strokeStyle = currentColor;
    // カラーパレットの選択状態を解除
    document.querySelectorAll('.color-box').forEach(box => box.classList.remove('active'));
});

// カラーパレットのクリックイベント
colorPalette.addEventListener('click', (e) => {
    if (e.target.classList.contains('color-box')) {
        const selectedColor = e.target.dataset.color;
        currentColor = selectedColor;
        ctx.strokeStyle = currentColor;
        colorPicker.value = selectedColor; // カラーピッカーも同期
        // 選択された色に'active'クラスを追加し、他から削除
        document.querySelectorAll('.color-box').forEach(box => box.classList.remove('active'));
        e.target.classList.add('active');
    }
});

lineWidthSlider.addEventListener('input', (e) => {
    ctx.lineWidth = e.target.value;
});

pencilToolBtn.addEventListener('click', () => {
    currentTool = 'pencil';
    ctx.strokeStyle = currentColor; // 鉛筆に戻る時に現在の色を適用
});

eraserToolBtn.addEventListener('click', () => {
    currentTool = 'eraser';
    ctx.strokeStyle = '#FFFFFF'; // 消しゴムは背景色と同じにする
});

undoBtn.addEventListener('click', undo);
redoBtn.addEventListener('click', redo);

clearCanvasBtn.addEventListener('click', () => {
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState(); // クリア後も履歴に保存
});

savePngImageBtn.addEventListener('click', () => {
    const dataURL = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataURL;
    a.download = 'my-drawing.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

savePdfImageBtn.addEventListener('click', saveCanvasAsPdf); // PDF保存イベント

// --- 描画関数 ---
function startDrawing(e) {
    isDrawing = true;
    ctx.beginPath(); // 新しいパスを開始
    draw(e); // クリックした瞬間から描き始める
}

function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.moveTo(x, y); // 新しい開始点を設定
}

function stopDrawing() {
    if (isDrawing) {
        isDrawing = false;
        ctx.beginPath(); // 描画を終了し、新しいパスを開始
        saveState(); // 描画終了時に履歴を保存
    }
}

// --- 履歴管理関数 ---
function saveState() {
    // 現在の履歴より後のステップを削除（やり直し後の新しい描画）
    if (historyStep < history.length - 1) {
        history = history.slice(0, historyStep + 1);
    }
    history.push(canvas.toDataURL()); // キャンバスの状態をデータURLとして保存
    historyStep++;
    // 履歴が大きくなりすぎないように制限することも可能（例: 20件まで）
    // if (history.length > 20) {
    //     history.shift(); // 古い履歴を削除
    //     historyStep--;
    // }
}

function undo() {
    if (historyStep > 0) {
        historyStep--;
        const canvasImage = new Image();
        canvasImage.src = history[historyStep];
        canvasImage.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height); // キャンバスをクリア
            ctx.drawImage(canvasImage, 0, 0); // 履歴から画像を再描画
        };
    }
}

function redo() {
    if (historyStep < history.length - 1) {
        historyStep++;
        const canvasImage = new Image();
        canvasImage.src = history[historyStep];
        canvasImage.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(canvasImage, 0, 0);
        };
    }
}

// --- PDF保存機能 ---
async function saveCanvasAsPdf() {
    const { jsPDF } = window.jspdf; // jsPDFライブラリをロード

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'px', 'a4'); // 横向きA4サイズでPDFを作成

    // キャンバスのサイズとPDFのページサイズを考慮して画像を配置
    const imgWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    pdf.save('my-drawing.pdf');
}
