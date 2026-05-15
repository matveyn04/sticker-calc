const MAX_STICKER_SIZE_BY_MATERIAL = {
    film: {
        width: 280,
        height: 416
    },
    paper: {
        width: 270,
        height: 380
    }
};

function getUsefulArea(material) {

    return {

        width:
            material.sw
            - LIMITS.side
            - LIMITS.side
            - LIMITS.mark
            - LIMITS.mark
            - LIMITS.safe
            - LIMITS.safe,

        height:
            material.sh
            - LIMITS.top
            - LIMITS.bottom
            - LIMITS.mark
            - LIMITS.mark
            - LIMITS.safe
            - LIMITS.safe
    };
}

function calculateStickersPerSheet(
    stickerW,
    stickerH,
    usefulW,
    usefulH
) {

    const techW = stickerW + BLEED;
    const techH = stickerH + BLEED;

    const cols =
        Math.floor(usefulW / techW);

    const rows =
        Math.floor(usefulH / techH);

    return {
        cols,
        rows,
        total: cols * rows,
        techW,
        techH,
        stickerW,
        stickerH
    };
}

function calculateSheets(qty, perSheet, kinds) {

    const sheetsPerKind =
        Math.ceil(qty / perSheet);

    return {
        sheetsPerKind,
        totalSheets:
            sheetsPerKind * kinds
    };
}

function getCuttingPricePerSheet(total) {

    if (total > 500) return 100;

    if (total > 300) return 70;

    if (total > 100) return 60;

    if (total > 40) return 45;

    return 40;
}

function getMarkup(cost) {

    if (cost <= 300) return 4;

    if (cost <= 400) return 3.5;

    if (cost <= 500) return 3;

    if (cost <= 600) return 2.8;

    if (cost <= 700) return 2.5;

    if (cost <= 800) return 2.4;

    if (cost <= 900) return 2.2;

    if (cost <= 1000) return 2.1;

    if (cost <= 2000) return 2;

    if (cost <= 4000) return 1.9;

    if (cost <= 7500) return 1.7;

    if (cost <= 13000) return 1.5;

    if (cost <= 40000) return 1.4;

    return 1.3;
}

function calculateFinalPrice(cost) {

    if (cost < 200) {
        return MIN_PRICE;
    }

    const markup =
        getMarkup(cost);

    const price =
        cost * markup;

    return Math.ceil(price / 50) * 50;
}

let warningTimer = null;

function showSizeWarning(message) {

    const warningEl =
        document.getElementById('sizeWarning');

    const textEl =
        document.getElementById('sizeWarningText');

    const barEl =
        document.getElementById('sizeWarningBar');

    if (!warningEl || !textEl || !barEl) {
        return;
    }

    warningEl.classList.remove('visible');
    barEl.classList.remove('animate');

    void warningEl.offsetWidth;

    textEl.innerText = message;
    warningEl.classList.add('visible');
    barEl.classList.add('animate');

    if (warningTimer) {
        clearTimeout(warningTimer);
    }

    warningTimer = setTimeout(() => {
        warningEl.classList.remove('visible');
        barEl.classList.remove('animate');
    }, 10000);
}

function getMaterialStickerLimits(materialKey, useful) {

    const materialCap =
        MAX_STICKER_SIZE_BY_MATERIAL[materialKey];

    if (!materialCap) {
        return {
            width: Math.max(useful.width - BLEED, 1),
            height: Math.max(useful.height - BLEED, 1)
        };
    }

    return {
        width: Math.min(materialCap.width, Math.max(useful.width - BLEED, 1)),
        height: Math.min(materialCap.height, Math.max(useful.height - BLEED, 1))
    };
}

function clampStickerSizeToUsefulArea(stickerW, stickerH, limits) {

    let width = stickerW;
    let height = stickerH;
    const adjustments = [];

    if (width > limits.width) {
        width = limits.width;
        adjustments.push('ширина');
    }

    if (height > limits.height) {
        height = limits.height;
        adjustments.push('высота');
    }

    return {
        width,
        height,
        adjusted: adjustments.length > 0,
        adjustedFields: adjustments
    };
}

function ensureWarningUi() {

    if (document.getElementById('sizeWarning')) {
        return;
    }

    const container =
        document.querySelector('.calc-container');

    const copyBtn =
        document.getElementById('copyBtn');

    if (!container || !copyBtn) {
        return;
    }

    const warningEl = document.createElement('div');
    warningEl.id = 'sizeWarning';
    warningEl.className = 'size-warning';
    warningEl.innerHTML = `
        <div id="sizeWarningText" class="size-warning-text"></div>
        <div class="size-warning-track">
            <div id="sizeWarningBar" class="size-warning-bar"></div>
        </div>
    `;

    copyBtn.insertAdjacentElement('beforebegin', warningEl);

    if (!document.getElementById('sizeWarningStyles')) {
        const styles = document.createElement('style');
        styles.id = 'sizeWarningStyles';
        styles.textContent = `
            .size-warning {
                margin: 0 0 16px 0;
                padding: 12px;
                border-radius: 12px;
                background: rgb(226, 226, 226);
                border: 1px solid rgb(0, 238, 255);
                color: #ff0000;
                opacity: 0;
                transform: translateY(-4px);
                pointer-events: none;
                transition: opacity .2s ease, transform .2s ease;
            }
            .size-warning.visible {
                opacity: 1;
                transform: translateY(0);
            }
            .size-warning-text {
                font-size: 13px;
                font-weight: 700;
                margin-bottom: 8px;
            }
            .size-warning-track {
                height: 4px;
                width: 100%;
                border-radius: 99px;
                background: rgba(146, 64, 14, 0.2);
                overflow: hidden;
            }
            .size-warning-bar {
                width: 100%;
                height: 100%;
                transform-origin: left;
                transform: scaleX(1);
                background: #f59e0b;
            }
            .size-warning-bar.animate {
                animation: sizeWarningCountdown 10s linear forwards;
            }
            @keyframes sizeWarningCountdown {
                from { transform: scaleX(1); }
                to { transform: scaleX(0); }
            }
        `;
        document.head.appendChild(styles);
    }
}

function calculateStickerJob() {

    ensureWarningUi();

    const widthInput =
        document.getElementById('stickW');

    const heightInput =
        document.getElementById('stickH');

    let stickerW =
        parseFloat(widthInput.value) || 0;

    let stickerH =
        parseFloat(heightInput.value) || 0;

    const qty =
        parseInt(document.getElementById('orderQty').value) || 0;

    const kinds =
        parseInt(document.getElementById('kinds')?.value || 1);

    const materialKey =
        document.getElementById('material').value;

    const material =
        MATERIALS[materialKey];

    if (
        stickerW <= 0
        || stickerH <= 0
        || qty <= 0
    ) {
        return;
    }

    const useful =
        getUsefulArea(material);

    const stickerLimits =
        getMaterialStickerLimits(materialKey, useful);

    widthInput.max = Math.floor(stickerLimits.width);
    heightInput.max = Math.floor(stickerLimits.height);

    const clamped =
        clampStickerSizeToUsefulArea(stickerW, stickerH, stickerLimits);

    if (clamped.adjusted) {
        stickerW = clamped.width;
        stickerH = clamped.height;

        widthInput.value = Math.floor(stickerW);
        heightInput.value = Math.floor(stickerH);

        const adjustedText =
            clamped.adjustedFields.length === 2
                ? 'Размер автоматически уменьшен до полезной области листа'
                : `${clamped.adjustedFields[0][0].toUpperCase()}${clamped.adjustedFields[0].slice(1)} автоматически уменьшена до полезной области листа`;

        showSizeWarning(adjustedText);
    }

    const normal =
        calculateStickersPerSheet(
            stickerW,
            stickerH,
            useful.width,
            useful.height
        );

    const rotated =
        calculateStickersPerSheet(
            stickerH,
            stickerW,
            useful.width,
            useful.height
        );

    const best =
        normal.total >= rotated.total
            ? normal
            : rotated;

    if (best.total <= 0) {
        return;
    }

    const sheets =
        calculateSheets(
            qty,
            best.total,
            kinds
        );

    const cutPerSheet =
        getCuttingPricePerSheet(best.total);

    const materialCost =
        sheets.totalSheets * material.cost;

    const cuttingCost =
        sheets.totalSheets * cutPerSheet;

    const visibleSelfCost =
        materialCost;

    const fullCost =
        materialCost + cuttingCost;

    const finalPrice =
        calculateFinalPrice(fullCost);

    document.getElementById('finalPrice').innerText =
        finalPrice.toLocaleString() + ' ₽';

    document.getElementById('info').innerHTML = `
        <div class="info-item">
            <span>На листе</span>
            <b>${best.total} шт.</b>
        </div>

        <div class="info-item">
            <span>Листов</span>
            <b>${sheets.totalSheets} шт.</b>
        </div>

        <div class="info-item">
            <span>Себестоимость</span>
            <b>${visibleSelfCost.toFixed(2)} ₽</b>
        </div>

        <div class="info-item">
            <span>Резка</span>
            <b>${cutPerSheet} ₽/лист</b>
        </div>

        <div class="info-item">
            <span>Всего выйдет</span>
            <b>${sheets.totalSheets * best.total} шт.</b>
        </div>

        <div class="info-item">
            <span>За 1 шт.</span>
            <b>${(finalPrice / (qty * kinds)).toFixed(2)} ₽</b>
        </div>
    `;

    drawSheet(
        material,
        useful,
        best
    );
}

function drawSheet(
    material,
    useful,
    best
) {

    const canvas =
        document.getElementById('sheetCanvas');

    const ctx =
        canvas.getContext('2d');

    const scale =
        580 / material.sh;

    canvas.width =
        material.sw * scale;

    canvas.height =
        material.sh * scale;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle = '#fff';

    ctx.fillRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.fillStyle =
        'rgba(0,0,0,0.04)';

    ctx.fillRect(
        0,
        0,
        canvas.width,
        LIMITS.top * scale
    );

    ctx.fillRect(
        0,
        (material.sh - LIMITS.bottom) * scale,
        canvas.width,
        LIMITS.bottom * scale
    );

    ctx.fillRect(
        0,
        0,
        LIMITS.side * scale,
        canvas.height
    );

    ctx.fillRect(
        (material.sw - LIMITS.side) * scale,
        0,
        LIMITS.side * scale,
        canvas.height
    );

    const startX =
        LIMITS.side
        + LIMITS.mark
        + LIMITS.safe;

    const startY =
        LIMITS.top
        + LIMITS.mark
        + LIMITS.safe;

    ctx.strokeStyle = '#ff0000';

    ctx.lineWidth = 2;

    ctx.strokeRect(
        startX * scale,
        startY * scale,
        useful.width * scale,
        useful.height * scale
    );

    ctx.fillStyle = '#38bdf8';

    const gridWidth =
        best.cols * best.techW;

    const gridHeight =
        best.rows * best.techH;

    const offsetX =
        startX
        + (useful.width - gridWidth) / 2;

    const offsetY =
        startY
        + (useful.height - gridHeight) / 2;

    const bleedOffset = BLEED / 2;

    for (let r = 0; r < best.rows; r++) {

        for (let c = 0; c < best.cols; c++) {

            const x =
                (
                    offsetX
                    + c * best.techW
                    + bleedOffset
                ) * scale;

            const y =
                (
                    offsetY
                    + r * best.techH
                    + bleedOffset
                ) * scale;

            ctx.fillRect(
                x,
                y,
                best.stickerW * scale,
                best.stickerH * scale
            );
        }
    }
}

function copyTZ() {

    const stickerW =
        document.getElementById('stickW').value;

    const stickerH =
        document.getElementById('stickH').value;

    const qty =
        parseInt(
            document.getElementById('orderQty').value
        ) || 0;

    const kinds =
        parseInt(
            document.getElementById('kinds').value
        ) || 1;

    const totalQty =
        qty * kinds;

    const materialKey =
        document.getElementById('material').value;

    const material =
        MATERIALS[materialKey];

    const priceText =
        document.getElementById('finalPrice').innerText;

    const cleanPrice =
        parseFloat(
            priceText.replace(/\s/g, '')
                     .replace(/[^\d]/g, '')
        ) || 0;

    const pricePerPiece =
        (cleanPrice / totalQty)
        .toFixed(2)
        .replace('.', ',');

    const text =
`Наклейка ${stickerW}×${stickerH} мм
Печать 4+0
${material.name}
Плоттерная резка
Тираж ${kinds} вида по ${qty}шт.
(Итого ${totalQty}шт)
Сдача в листах
Стоимость: ${priceText} (${pricePerPiece}р/шт.)`;

    navigator.clipboard.writeText(text);
}

calculateStickerJob();

window.calculate =
    calculateStickerJob;