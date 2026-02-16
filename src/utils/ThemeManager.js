export const THEMES = {
    CYBERPUNK: {
        id: 'CYBERPUNK',
        name: 'NEON CYBERPUNK',
        font: 'Orbitron, Arial',
        colors: {
            primary: 0xff00ff,
            secondary: 0x00ffff,
            health: 0xff00ff,
            xp: 0x00ffff,
            bg: 0x020205, // Deep Dark Blue/Black
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
    CRIMSON: {
        id: 'CRIMSON',
        name: 'CRIMSON VOID',
        font: 'Cinzel, serif',
        colors: {
            primary: 0xff0000,
            secondary: 0xffaa00,
            health: 0xaa0000,
            xp: 0xff4444,
            bg: 0x050000, // Deep Dark Red/Black
            text: '#ffaa00',
            border: 0xaa0000,
            accent: 0xff0000
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
    COSMIC: {
        id: 'COSMIC',
        name: 'DEEP SPACE',
        font: 'Inter, sans-serif',
        colors: {
            primary: 0x4b79ff,
            secondary: 0xffffff,
            health: 0x4b79ff,
            xp: 0xffffff,
            bg: 0x000000, // Pure Black for max contrast
            text: '#ffffff',
            border: 0x4b79ff,
            accent: 0xffffff
        },
        styles: {
            hpSegments: 0,
            hpRadius: 10,
            xpRadius: 10,
            borderThickness: 2,
            hasDrip: false,
            ornamental: false,
            flat: true
        },
        particles: {
            hit: 0x4b79ff,
            death: 0xffffff
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
