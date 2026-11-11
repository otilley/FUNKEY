
const ASSET_PATHS = [
    'SVG_For_Funkey/assets',
    './SVG_For_Funkey/assets',
    'assets',
    'SVG_For_Funkey'
];

const tileSize = 80;
const keySpacing = 90;
const DESIGN_W = 630;
const DESIGN_H = 945;
const columnBottom = 920;


const keyboardColumns = [
    { letters: 'QWERTYUIOP', x: 40,  offset: 0 },
    { letters: 'ASDFGHJKL',  x: 135, offset: 0.5 },
    { letters: 'ZXCVBNM',    x: 230, offset: 1.2 }
];

const inputBox = { x: 320, y: 335, w: 300, h: 60 };

const keys = [];
let inputEl;
let pressedLetter = null;
let ready = false;
let failedPaths = [];
let logoImage;


function loadSvg(fileName, onDone) {
    const img = new Image();
    let attempt = 0;

    function tryNext() {
        if (attempt >= ASSET_PATHS.length) {
            img.failed = true;
            failedPaths.push(`${ASSET_PATHS[0]}/${fileName}`);
            onDone();
            return;
        }
        img.src = `${ASSET_PATHS[attempt]}/${fileName}`;
        attempt++;
    }

    img.failed = false;
    img.onload = () => onDone();
    img.onerror = () => tryNext();
    tryNext();
    return img;
}

function requestRedraw() {
    if (ready) redraw();
}

keyboardColumns.forEach(({ letters, x, offset }) => {
    [...letters].forEach((letter, index) => {
        keys.push({
            letter,
            x,
            y: columnBottom - tileSize - offset * keySpacing - index * keySpacing,
            outline: loadSvg(`${letter}_SVG.svg`, requestRedraw),
            fill: loadSvg(`${letter}_FILL.svg`, requestRedraw)
        });
    });
});

logoImage = loadSvg('FUNKEYLOGO.svg', requestRedraw);


function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('p5-container');
    canvas.elt.setAttribute('role', 'img');
    canvas.elt.setAttribute('aria-label', 'FUNKEY keyboard. Hover over a letter to fill it, click or type to enter letters.');
    canvas.elt.addEventListener('mouseleave', () => {
        cursor(ARROW);
        redraw();
    });

    textFont('Space Grotesk');

    inputEl = createInput('');
    inputEl.parent('p5-container');
    inputEl.attribute('placeholder', 'Type here...');
    inputEl.attribute('maxlength', '20');
    inputEl.attribute('aria-label', 'What makes you FUNKEY?');
    inputEl.style('position', 'absolute');
    inputEl.style('box-sizing', 'border-box');
    inputEl.style('background', 'transparent');
    inputEl.style('color', '#d4e060');
    inputEl.style('border', 'none');
    inputEl.style('border-radius', '0');
    inputEl.style('outline', 'none');
    inputEl.style('font-family', 'Space Grotesk, sans-serif');
    inputEl.style('text-align', 'center');
    inputEl.style('padding', '0 14px');
    inputEl.style('text-transform', 'uppercase');
    layoutInput();

    ready = true;
    noLoop();
}

function getScale() {
    const scaleFactor = min(width / DESIGN_W, height / DESIGN_H);
    return {
        scaleFactor,
        offsetX: (width - DESIGN_W * scaleFactor) / 2,
        offsetY: (height - DESIGN_H * scaleFactor) / 2
    };
}

function layoutInput() {
    const { scaleFactor, offsetX, offsetY } = getScale();
    inputEl.position(offsetX + inputBox.x * scaleFactor, offsetY + inputBox.y * scaleFactor);
    inputEl.size(inputBox.w * scaleFactor, inputBox.h * scaleFactor);
    inputEl.style('font-size', `${34 * scaleFactor}px`);
}

function keyAtPointer() {
    const { scaleFactor, offsetX, offsetY } = getScale();
    const px = (mouseX - offsetX) / scaleFactor;
    const py = (mouseY - offsetY) / scaleFactor;
    return keys.find(k =>
        px >= k.x && px <= k.x + tileSize &&
        py >= k.y && py <= k.y + tileSize
    );
}


function drawKey(k, filled) {
    const img = filled ? k.fill : k.outline;

    if (img.complete && !img.failed) {
        drawingContext.drawImage(img, k.x, k.y, tileSize, tileSize);
        return;
    }

    
    stroke('#d4e060');
    strokeWeight(2);
    if (filled) fill('#d4e060'); else noFill();
    rect(k.x, k.y, tileSize, tileSize, 14);
    noStroke();
    fill(filled ? '#211f1f' : '#d4e060');
    textStyle(BOLD);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(k.letter, k.x + tileSize / 2, k.y + tileSize / 2);
}

function draw() {
    background('#211f1f');
    const { scaleFactor, offsetX, offsetY } = getScale();
    const hoveredKey = keyAtPointer();

    push();
    translate(offsetX, offsetY);
    scale(scaleFactor);

    keys.forEach((k) => {
        drawKey(k, k === hoveredKey || k.letter === pressedLetter);
    });

    noStroke();
    fill('#d4e060');
    textStyle(NORMAL);
    textSize(16);
    textAlign(CENTER, CENTER);
    text('What makes you FUNKEY?', 470, 284);

    if (logoImage.complete && !logoImage.failed) {
        drawingContext.drawImage(logoImage, 478, 851, 114, 31);
    }
    pop();
}

function typeLetter(letter) {
    inputEl.value(inputEl.value() + letter);
}


function flashKey(letter) {
    pressedLetter = letter;
    redraw();
}


function mouseMoved() {
    cursor(keyAtPointer() ? HAND : ARROW);
    redraw();
}

function mousePressed() {
    const k = keyAtPointer();
    if (k) {
        typeLetter(k.letter);
        flashKey(k.letter);
    }
}

function mouseReleased() {
    pressedLetter = null;
    redraw();
}

function keyPressed() {
    const inputFocused = document.activeElement === inputEl.elt;
    const letter = (key || '').toUpperCase();

    if (keyCode === BACKSPACE && !inputFocused) {
        inputEl.value(inputEl.value().slice(0, -1));
        return false;
    }

    if (/^[A-Z]$/.test(letter) && keys.some(k => k.letter === letter)) {
        flashKey(letter);
        if (!inputFocused) {
            typeLetter(letter);
            return false;
        }
    }
}

function keyReleased() {
    pressedLetter = null;
    redraw();
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    layoutInput();
    redraw();
}