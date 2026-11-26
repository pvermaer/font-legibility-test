// Length of the interval in milliseconds. 1 second is typical for a radar.
const SPEED = 1000;
// The display density of planes on a given surface (higher value means fewer planes)
const DENSITY = 75000;

// Google fonts are loaded through the stylesheet link in index.html
const FONTS_GOOGLE = [
    'Roboto',
    'Roboto Mono',
    'Fira Sans',
    'Fira Mono',
    'Ubuntu',
    'Ubuntu Mono',
    'IBM Plex Sans',
    'IBM Plex Mono',
    'Source Code Pro',
    'Open Sans',
    'Exo',
    'Inter'
];
const FONTS_EXT = [
    'Arial',
    'Lucida Grande',
    'Verdana',
    'System Font'
];

// Seed the simplex noise generator (global `noise` comes from perlin.js)
noise.seed(Math.random());
// A time value used for the Simplex algorithm
const start = Date.now();

// How many planes to show? Results in 20 - 50 planes on a typical display
// (at least 20, in case the page loads in a background tab with no size yet)
const maxPlanes = Math.max(20, Math.round(innerWidth * innerHeight / DENSITY));

const main = document.querySelector('main');
const loading = document.querySelector('.loading');
const inputFont = document.querySelector('#inputFont');
const inputFontSlider = document.querySelector('#inputFontSlider');
const fontSliderTicks = document.querySelector('#fontSliderTicks');
const inputSize = document.querySelector('#inputSize');
const inputSizeSlider = document.querySelector('#inputSizeSlider');
const inputBlur = document.querySelector('#inputBlur');
const inputBlurSlider = document.querySelector('#inputBlurSlider');
const inputTheme = document.querySelector('#inputTheme');
const inputMovement = document.querySelector('#inputMovement');
const inputBackground = document.querySelector('#inputBackground');

// Every flight on screen: its element and the random values used for the Simplex noise
let flights = [];
let movementInterval;

// Get the flights data: a snapshot of real Frankfurt (FRA) arrivals
async function loadFlights() {
    try {
        const response = await fetch('flights.json?v=16');
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();

        // Show a different random selection of flights on every visit
        const fragment = document.createDocumentFragment();
        flights = shuffle(data).slice(0, maxPlanes).map(item => {
            const el = createFlight(item);
            fragment.append(el);
            return {
                el,
                rx: Math.random() * maxPlanes,
                ry: Math.random() * maxPlanes,
                speed: Math.random() * 0.00001 + 0.000001
            };
        });
        main.append(fragment);

        loading.animate([{ opacity: 1 }, { opacity: 0 }], 400).finished.then(() => loading.remove());

        // Position flights randomly on the page
        moveFlights();
    } catch {
        loading.querySelector('.airplane').hidden = true;
        loading.querySelector('p').textContent = "Couldn't load flight data.";
    }
}

// Callsign (airline code + flight number, e.g. "DE4891") above the aircraft type
function createFlight(item) {
    const el = document.createElement('div');
    el.className = 'flight';
    el.append(item.callsign, document.createElement('br'), item.type || '');
    return el;
}

// Fisher-Yates shuffle on a copy of the array
function shuffle(array) {
    const result = array.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function moveFlights() {
    const t = Date.now() - start;
    const width = innerWidth;
    const height = innerHeight;

    for (const flight of flights) {
        // Calculate new position with 3-dimensional Simplex noise
        // Shout-out to Louis https://css-tricks.com/simulating-mouse-movement/
        const x = (noise.simplex3(flight.rx, 0, t * flight.speed) + 1) / 2 * width;
        const y = (noise.simplex3(flight.ry, 0, t * flight.speed) + 1) / 2 * height;
        flight.el.style.transform = `translate(${x}px, ${y}px)`;
    }
}

// Combine fonts from different sources, sort them alphabetically and populate the dropdown
const fonts = [...FONTS_EXT, ...FONTS_GOOGLE].sort();
inputFont.replaceChildren(...fonts.map(font => new Option(font, font)));
fontSliderTicks.replaceChildren(...fonts.map((font, i) => new Option('', i)));
// One slider step per font in the dropdown
inputFontSlider.max = fonts.length - 1;

inputFont.addEventListener('change', () => {
    // "System Font" falls back to the native font stack from the stylesheet
    main.style.fontFamily = inputFont.value === 'System Font' ? '' : inputFont.value;
    inputFontSlider.value = inputFont.selectedIndex;
});

inputFontSlider.addEventListener('input', () => {
    inputFont.selectedIndex = inputFontSlider.value;
    inputFont.dispatchEvent(new Event('change'));
});

inputSize.addEventListener('change', () => {
    main.style.fontSize = `${inputSize.value}px`;
    inputSizeSlider.value = inputSize.value;
});

inputSizeSlider.addEventListener('input', () => {
    inputSize.value = inputSizeSlider.value;
    inputSize.dispatchEvent(new Event('change'));
});

inputBlur.addEventListener('change', () => {
    main.style.filter = `blur(${inputBlur.value}px)`;
    inputBlurSlider.value = inputBlur.value;
});

inputBlurSlider.addEventListener('input', () => {
    inputBlur.value = inputBlurSlider.value;
    inputBlur.dispatchEvent(new Event('change'));
});

inputTheme.addEventListener('change', () => {
    const root = document.documentElement;
    root.classList.add('color-theme-in-transition');
    root.dataset.theme = inputTheme.value;
    setTimeout(() => root.classList.remove('color-theme-in-transition'), 1000);
});

inputMovement.addEventListener('change', () => {
    clearInterval(movementInterval);
    if (inputMovement.checked) {
        movementInterval = setInterval(moveFlights, SPEED);
    }
});

inputBackground.addEventListener('change', () => {
    main.classList.toggle('background', inputBackground.checked);
});

// Keyboard shortcuts: left/right loops through the fonts, up/down changes the font size
addEventListener('keydown', event => {
    // Leave the arrow keys alone while a text field, dropdown or slider has focus
    if (event.target.matches('input:not([type="checkbox"]), select, textarea')) return;

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        const step = event.key === 'ArrowRight' ? 1 : -1;
        inputFont.selectedIndex = (inputFont.selectedIndex + step + fonts.length) % fonts.length;
        inputFont.dispatchEvent(new Event('change'));
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        if (event.key === 'ArrowUp') inputSize.stepUp(); else inputSize.stepDown();
        inputSize.dispatchEvent(new Event('change'));
    } else {
        return;
    }
    event.preventDefault();
});

// Reposition the flights when the window size changes
addEventListener('resize', moveFlights);

// Detect if the user has Dark mode on and set theme to Dark
if (matchMedia('(prefers-color-scheme: dark)').matches) {
    inputTheme.value = 'dark';
}

// Start without random movement if the user prefers reduced motion
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    inputMovement.checked = false;
}

// Trigger the change event so we can set the default values
for (const input of [inputFont, inputSize, inputBlur, inputTheme, inputMovement, inputBackground]) {
    input.dispatchEvent(new Event('change'));
}

loadFlights();
