const STORAGE_KEY = "boxCalculator";

function getVal(id) {
    return Number(document.getElementById(id).value);
}

function set(id, val) {
    document.getElementById(id).value = val;
}

function save() {
    const ids = [
        "W",
        "L",
        "H",
        "LW",
        "LL",
        "coverSize",
        "bottomSize",
        "sideSize",
        "CQ",
        "BQ",
        "SQ",
    ];

    const data = {};
    ids.forEach((i) => (data[i] = document.getElementById(i).value));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function load() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;

    const data = JSON.parse(saved);
    Object.keys(data).forEach((k) => {
        const el = document.getElementById(k);
        if (el) el.value = data[k];
    });
}

function clearAll() {
    if (!confirm("Очистить всё?")) return;

    ["W", "L", "H"].forEach((id) => set(id, ""));

    ["coverSize", "bottomSize", "sideSize", "CQ", "BQ", "SQ"].forEach((id) =>
        set(id, "")
    );

    save();
}

/* ------------------ CORE PACKING ENGINE ------------------ */

function pack(w, h, W, H) {
    const a = Math.floor(W / w) * Math.floor(H / h);
    const b = Math.floor(W / h) * Math.floor(H / w);
    return Math.max(a, b);
}

function bestFit(w, h, sheetW, sheetH) {
    const normal = pack(w, h, sheetW, sheetH);
    return normal;
}

/* ------------------ DRAW GRID VISUAL ------------------ */

function drawLayout(containerId, w, h, sheetW, sheetH, color, labelText) {
    const container = document.getElementById(containerId);

    container.innerHTML = "";

    const rect = container.getBoundingClientRect();

    let W = sheetW;

    let H = sheetH;

    const rotateSheet = sheetH > sheetW;

    if (rotateSheet) {
        W = sheetH;

        H = sheetW;
    }

    const scale = Math.min(
        rect.width / W,

        rect.height / H
    );

    // 🔥 ДОБАВЛЯЕМ ЛЕЙБЛ

    const label = document.createElement("div");

    label.className = "layout-label";

    label.textContent = labelText;

    container.appendChild(label);

    // --- выбираем лучшую ориентацию деталей ---
    const normalCols = Math.floor(W / w);
    const normalRows = Math.floor(H / h);

    const rotatedCols = Math.floor(W / h);
    const rotatedRows = Math.floor(H / w);

    const useRotated = rotatedCols * rotatedRows > normalCols * normalRows;

    const bw = useRotated ? h : w;
    const bh = useRotated ? w : h;

    const cols = Math.floor(W / bw);
    const rows = Math.floor(H / bh);

    const count = cols * rows;

    // --- рамка листа ---
    const sheet = document.createElement("div");
    sheet.style.position = "absolute";
    sheet.style.left = "0";
    sheet.style.top = "0";
    sheet.style.width = W * scale + "px";
    sheet.style.height = H * scale + "px";
    sheet.style.border = "1px solid #0b1a30ff";
    sheet.style.borderRadius = "0px";

    container.appendChild(sheet);

    // --- детали ---
    for (let i = 0; i < count; i++) {
        const el = document.createElement("div");
        el.className = "cell " + color;

        el.style.position = "absolute";
        el.style.width = bw * scale + "px";
        el.style.height = bh * scale + "px";

        const x = (i % cols) * bw * scale;
        const y = Math.floor(i / cols) * bh * scale;

        el.style.left = x + "px";
        el.style.top = y + "px";

        el.style.border = "1px solid rgba(255,255,255,0.5)";
        el.style.boxSizing = "border-box";

        container.appendChild(el);
    }

    return count;
}

/* ------------------ MAIN CALC ------------------ */

function calculate() {
    const W = getVal("W");
    const L = getVal("L");
    const H = getVal("H");

    const LW = getVal("LW");
    const LL = getVal("LL");

    if (!W || !L || !H || !LW || !LL) {
        alert("Заполните все поля");
        return;
    }

    const BW = L + 3;
    const BL = W + H * 2;

    const SW = W;
    const SL = H;

    const CW = L + 45;
    const CL = W + 45;

    const CQ = pack(CW, CL, LW, LL);
    const BQ = pack(BW, BL, LW, LL);
    const SQ = pack(SW, SL, LW, LL);

    set("coverSize", `${CW}*${CL}`);
    set("bottomSize", `${BW}*${BL}`);
    set("sideSize", `${SW}*${SL}`);

    set("CQ", CQ);
    set("BQ", BQ);
    set("SQ", SQ);

    /* ---------------- VISUAL ---------------- */

    const coverFit = drawLayout(
        "coverLayout",
        CW,
        CL,
        LW,
        LL,
        "cover",
        "КРЫШКИ"
    );
    const bottomFit = drawLayout(
        "bottomLayout",
        BW,
        BL,
        LW,
        LL,
        "bottom",
        "ДОНЬЯ"
    );
    const sideFit = drawLayout(
        "sideLayout",
        SW,
        SL,
        LW,
        LL,
        "side",
        "БОКОВИНЫ"
    );

    /* ---------------- STATUS ---------------- */

    const sheetStatus = document.getElementById("sheetStatus");

    const maxFit = Math.max(coverFit, bottomFit, sideFit);

    if (maxFit === 0) {
        sheetStatus.textContent = "❌ Ничего не помещается";
        sheetStatus.className = "status bad";
    } else if (CQ === 0 || BQ === 0 || SQ === 0) {
        sheetStatus.textContent = "⚠️ Частичная раскладка";
        sheetStatus.className = "status warn";
    } else {
        sheetStatus.textContent = "✅ Оптимальный раскрой";
        sheetStatus.className = "status ok";
    }

    save();
}

/* ------------------ EVENTS ------------------ */

document.getElementById("calculateBtn").addEventListener("click", calculate);
document.getElementById("clearBtn").addEventListener("click", clearAll);

window.addEventListener("load", load);

["W", "L", "H", "LW", "LL"].forEach((id) => {
    document.getElementById(id).addEventListener("input", save);
});

document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") calculate();
});
