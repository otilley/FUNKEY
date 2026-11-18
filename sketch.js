
const ASSET_PATHS = [
    'SVG_For_Funkey/assets',
    './SVG_For_Funkey/assets',
    'assets',
    'SVG_For_Funkey'
];

const tileSize = 80;
const keySpacing = 90;
const DESIGN_W = 1200;
const DESIGN_H = 630;
const CHARACTER_LIMIT = 30;


const keyboardRows = [
    { letters: 'QWERTYUIOP', x: 155, y: 330 },
    { letters: 'ASDFGHJKL',  x: 200, y: 420 },
    { letters: 'ZXCVBNM',    x: 263, y: 510 }
];

const inputBox = { x: 380, y: 120, w: 440, h: 220 };

const keys = [];
let inputEl;
let pressedLetter = null;
let ready = false;
let failedPaths = [];
let keySynth;



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

keyboardRows.forEach(({ letters, x, y }) => {
    [...letters].forEach((letter, index) => {
        keys.push({
            letter,
            x: x + index * keySpacing,
            y,
            outline: loadSvg(`${letter}_SVG.svg`, requestRedraw),
            fill: loadSvg(`${letter}_FILL.svg`, requestRedraw)
        });
    });
});

function setup() {
    const canvas = createCanvas(windowWidth, windowHeight);
    canvas.parent('p5-container');
    keySynth = new Tone.Synth({
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.005, decay: 0.1, sustain: 0, release: 0.08 }
    }).toDestination();
    canvas.elt.setAttribute('role', 'img');
   
    canvas.elt.addEventListener('mouseleave', () => {
        cursor(ARROW);
        redraw();
    });

    textFont('Space Grotesk');

    inputEl = createElement('textarea');
    inputEl.parent('p5-container');
    inputEl.attribute('placeholder', 'Type here...');
    inputEl.attribute('rows', '3');
    inputEl.attribute('wrap', 'soft');
    inputEl.attribute('maxlength', String(CHARACTER_LIMIT));
    inputEl.attribute('aria-label', 'What makes you FUNKEY?');
    inputEl.style('position', 'absolute');
    inputEl.style('box-sizing', 'border-box');
    inputEl.style('background', 'transparent');
    inputEl.style('color', '#B6D43C');
    inputEl.style('border', 'none');
    inputEl.style('border-radius', '0');
    inputEl.style('outline', 'none');
    inputEl.style('font-family', 'Space Grotesk, sans-serif');
    inputEl.style('text-align', 'center');
    inputEl.style('padding', '8px 14px');
    inputEl.style('line-height', '1.2');
    inputEl.style('text-transform', 'uppercase');
    inputEl.style('resize', 'none');
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
        drawingContext.save();
        drawingContext.translate(k.x + tileSize / 2, k.y + tileSize / 2);
        drawingContext.rotate(HALF_PI);
        drawingContext.drawImage(img, -tileSize / 2, -tileSize / 2, tileSize, tileSize);
        drawingContext.restore();
        return;
    }

    
    stroke('#B6D43C');
    strokeWeight(2);
    if (filled) fill('#B6D43C'); else noFill();
    rect(k.x, k.y, tileSize, tileSize, 14);
    noStroke();
    fill(filled ? '#232021' : '#B6D43C');
    textStyle(BOLD);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(k.letter, k.x + tileSize / 2, k.y + tileSize / 2);
}

function draw() {
    background('#171617');
    const { scaleFactor, offsetX, offsetY } = getScale();
    const hoveredKey = keyAtPointer();

    push();
    translate(offsetX, offsetY);
    scale(scaleFactor);

    keys.forEach((k) => {
        drawKey(k, k === hoveredKey || k.letter === pressedLetter);
    });

    noStroke();
    fill('#B6D43C');
    textStyle(ITALIC);
    textSize(25);
    textAlign(CENTER, CENTER);
    text('What makes you FUNKEY?', 600, 43);
    

    pop();
}

function typeLetter(letter) {
    if (inputEl.value().length >= CHARACTER_LIMIT) return;
    inputEl.value(inputEl.value() + letter);
}


function flashKey(letter) {
    pressedLetter = letter;
    redraw();
}

function playKeySound(letter) {
    const notes = ['C4', 'D4', 'E4', 'G4', 'A4'];
    const keyIndex = keys.findIndex((k) => k.letter === letter);
    Tone.start().then(() => {
        keySynth.triggerAttackRelease(notes[keyIndex % notes.length], '16n');
    });
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
        playKeySound(k.letter);
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
        playKeySound(letter);
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