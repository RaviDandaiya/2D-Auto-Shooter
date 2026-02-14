export const THEMES = {
    CYBERPUNK: {
        id: 'CYBERPUNK',
        name: 'CYBERPUNK',
        font: 'Orbitron, Arial',
        colors: {
            primary: 0xff00ff,
            secondary: 0x00ffff,
            health: 0xff00ff,
            xp: 0x00ffff,
            bg: 0x050005,
            text: '#00ffff',
            border: 0xff00ff,
            accent: 0x00ffff
        },
        styles: {
            hpSegments: 12,
            hpRadius: 0,
            xpRadius: 0,
            borderThickness: 2,
            hasDrip: false,
            ornamental: false,
            glitch: true,
            scanlines: true
        },
        particles: {
            hit: 0xff00ff,
            death: 0x00ffff
        }
    },
    GOTHIC: {
        id: 'GOTHIC',
        name: 'GOTHIC SURVIVAL',
        font: 'Cinzel, serif',
        colors: {
            primary: 0x880000,
            secondary: 0xffaa00,
            health: 0x660000,
            xp: 0x000044,
            bg: 0x050505,
            text: '#ffaa00',
            border: 0xaa8800,
            accent: 0xaa8800
        },
        styles: {
            hpSegments: 0,
            hpRadius: 2,
            xpRadius: 2,
            borderThickness: 3,
            hasDrip: true,
            ornamental: true
        },
        particles: {
            hit: 0xaa0000,
            death: 0x333333,
            embers: true,
            fog: true
        }
    },
    MINIMAL: {
        id: 'MINIMAL',
        name: 'MODERN FLAT',
        font: 'Inter, sans-serif',
        colors: {
            primary: 0x333333,
            secondary: 0xeeeeee,
            health: 0xff4b4b,
            xp: 0x4b79ff,
            bg: 0xf5f5f5,
            text: '#333333',
            border: 0x333333,
            accent: 0x4b79ff
        },
        styles: {
            hpSegments: 0,
            hpRadius: 10,
            xpRadius: 10,
            borderThickness: 0,
            hasDrip: false,
            ornamental: false,
            flat: true
        },
        particles: {
            hit: 0xeeeeee,
            death: 0xdddddd
        }
    },
    PIXEL: {
        id: 'PIXEL',
        name: 'RETRO PIXEL',
        font: '"Press Start 2P", cursive',
        colors: {
            primary: 0x00ff00,
            secondary: 0xff0000,
            health: 0xff0000,
            xp: 0x0000ff,
            bg: 0x111111,
            text: '#ffffff',
            border: 0xffffff,
            accent: 0xffff00
        },
        styles: {
            hpSegments: 5,
            hpRadius: 0,
            xpRadius: 0,
            borderThickness: 4,
            hasDrip: false,
            ornamental: false,
            pixelated: true
        },
        particles: {
            hit: 0xffffff,
            death: 0xffff00,
            pixel: true
        }
    },
    FANTASY: {
        id: 'FANTASY',
        name: 'DARK FANTASY',
        font: 'MedievalSharp, cursive',
        colors: {
            primary: 0xaa00ff,
            secondary: 0xc0c0c0,
            health: 0xa30000,
            xp: 0x4b0082,
            bg: 0x0a0015,
            text: '#c0c0c0',
            border: 0x777777,
            accent: 0xaa00ff
        },
        styles: {
            hpSegments: 0,
            hpRadius: 5,
            xpRadius: 5,
            borderThickness: 2,
            hasDrip: false,
            ornamental: true,
            runes: true
        },
        particles: {
            hit: 0xaa00ff,
            death: 0x4b0082,
            shimmer: true
        }
    }
};

class ThemeManager {
    constructor() {
        this.currentTheme = THEMES.CYBERPUNK;
        this.randomEnabled = false;
    }

    setTheme(themeId) {
        if (themeId === 'RANDOM') {
            this.randomEnabled = true;
            this.pickRandom();
            return true;
        }
        if (THEMES[themeId]) {
            this.currentTheme = THEMES[themeId];
            this.randomEnabled = false;
            return true;
        }
        return false;
    }

    pickRandom() {
        const keys = Object.keys(THEMES);
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        this.currentTheme = THEMES[randomKey];
    }

    getTheme() {
        return this.currentTheme;
    }
}

const themeInstance = new ThemeManager();
export default themeInstance;
