import Phaser from 'phaser';
import themeManager, { THEMES } from '../utils/ThemeManager';

export class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    create() {
        const { width, height } = this.scale;
        this.theme = themeManager.getTheme();

        // 1. Theme-based Background
        this.add.rectangle(width / 2, height / 2, width, height, this.theme.colors.bg);

        // 2. Animated Silhouettes
        if (!this.theme.styles.flat) {
            this.createSilhouettes(width, height);
            this.createParticles(width, height);
        }

        if (this.theme.styles.scanlines || this.theme.styles.pixelated) {
            this.createScanlines(width, height);
        }

        // 3. Game Logo
        const logo = this.add.text(width / 2, 120, 'NEON\nSURVIVOR', {
            fontFamily: this.theme.font,
            fontSize: this.theme.styles.pixelated ? '60px' : '84px',
            fill: Phaser.Display.Color.IntegerToColor(this.theme.colors.primary).rgba,
            fontStyle: 'bold',
            align: 'center'
        }).setOrigin(0.5);

        if (!this.theme.styles.flat) {
            logo.setShadow(0, 0, Phaser.Display.Color.IntegerToColor(this.theme.colors.primary).rgba, 20, true, true);
        }

        // 4. Main Menu Buttons
        const buttonX = width / 2;
        const mainStartY = 280;

        this.createMenuButton(buttonX, mainStartY, 'ENTER ARENA', () => {
            // Force focus on start
            window.focus();

            this.cameras.main.fadeOut(500, 0, 0, 0);

            // Safety timeout in case event doesn't fire
            const fallbackEvent = this.time.delayedCall(1000, () => {
                if (this.scene.isActive('MenuScene')) {
                    console.warn('MenuScene: Fade event timed out, forcing start');
                    if (themeManager.randomEnabled) themeManager.pickRandom();
                    this.scene.start('GameScene');
                }
            });

            this.cameras.main.once('camerafadeoutcomplete', () => {
                if (fallbackEvent) fallbackEvent.remove();
                if (themeManager.randomEnabled) themeManager.pickRandom();
                this.scene.start('GameScene');
            });
        }, 0, true);

        // 5. Theme Selection Grid
        this.add.text(width / 2, mainStartY + 80, 'SELECT VISUAL STYLE', {
            fontFamily: this.theme.font,
            fontSize: this.theme.styles.pixelated ? '14px' : '18px',
            fill: this.theme.styles.flat ? '#333' : '#888',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        const themeKeys = Object.keys(THEMES);
        const gridCols = 3;
        const itemW = 200;
        const itemH = 50;
        const gridSpacing = 20;
        const gridYStart = mainStartY + 130;

        themeKeys.forEach((key, index) => {
            const row = Math.floor(index / gridCols);
            const col = index % gridCols;
            const x = (width / 2) - ((gridCols - 1) * (itemW + gridSpacing) / 2) + col * (itemW + gridSpacing);
            const y = gridYStart + row * (itemH + gridSpacing);

            this.createThemeSelector(x, y, itemW, itemH, THEMES[key]);
        });

        // Random Option at the bottom of the grid
        const randomX = width / 2;
        const randomY = gridYStart + Math.ceil(themeKeys.length / gridCols) * (itemH + gridSpacing);
        this.createRandomToggle(randomX, randomY, itemW, itemH);

        // Exit at the very bottom
        this.createMenuButton(width / 2, height - 60, 'EXIT GAME', () => window.close(), 400, false);
    }

    createThemeSelector(x, y, w, h, targetTheme) {
        const isSelected = this.theme.id === targetTheme.id && !themeManager.randomEnabled;
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, w, h, isSelected ? targetTheme.colors.primary : 0x1a1a1a)
            .setStrokeStyle(2, targetTheme.colors.primary, 0.8)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(0, 0, targetTheme.name, {
            fontFamily: targetTheme.font,
            fontSize: targetTheme.styles.pixelated ? '10px' : '14px',
            fill: isSelected ? '#000' : '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, text]);

        bg.on('pointerdown', () => {
            themeManager.setTheme(targetTheme.id);
            this.scene.restart();
        });

        bg.on('pointerover', () => {
            if (!isSelected) bg.setFillStyle(0x333333);
            container.setScale(1.05);
        });

        bg.on('pointerout', () => {
            if (!isSelected) bg.setFillStyle(0x1a1a1a);
            container.setScale(1);
        });
    }

    createRandomToggle(x, y, w, h) {
        const isRandom = themeManager.randomEnabled;
        const container = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, w, h, isRandom ? 0xffaa00 : 0x1a1a1a)
            .setStrokeStyle(2, 0xffaa00, 0.8)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(0, 0, '🎲 RANDOM STYLE', {
            fontFamily: this.theme.font,
            fontSize: this.theme.styles.pixelated ? '10px' : '14px',
            fill: isRandom ? '#000' : '#fff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        container.add([bg, text]);

        bg.on('pointerdown', () => {
            themeManager.setTheme('RANDOM');
            this.scene.restart();
        });

        bg.on('pointerover', () => container.setScale(1.05));
        bg.on('pointerout', () => container.setScale(1));
    }

    createScanlines(width, height) {
        const graphics = this.add.graphics();
        graphics.lineStyle(1, 0x000000, 0.15);
        for (let i = 0; i < height; i += 4) {
            graphics.moveTo(0, i);
            graphics.lineTo(width, i);
        }
        graphics.strokePath();
    }

    createSilhouettes(width, height) {
        const color = this.theme.colors.primary;
        for (let i = 0; i < 8; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const size = Phaser.Math.Between(40, 150);
            const silhouette = this.add.circle(x, y, size, color, 0.03);
            this.tweens.add({
                targets: silhouette,
                x: x + Phaser.Math.Between(-100, 100),
                y: y + Phaser.Math.Between(-100, 100),
                duration: Phaser.Math.Between(4000, 8000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });
        }
    }

    createParticles(width, height) {
        const pColor = this.theme.colors.secondary;
        const graphics = this.add.graphics();
        graphics.fillStyle(pColor, 0.4);
        if (this.theme.styles.pixelated) graphics.fillRect(0, 0, 4, 4);
        else graphics.fillCircle(4, 4, 4);
        graphics.generateTexture('menu_particle', 8, 8);
        graphics.destroy();

        this.add.particles(0, 0, 'menu_particle', {
            x: { min: 0, max: width },
            y: { min: 0, max: height },
            speed: { min: 10, max: 40 },
            scale: { start: 0.1, end: 1 },
            alpha: { start: 0.3, end: 0 },
            lifespan: 5000,
            frequency: 80,
            blendMode: 'ADD'
        });
    }

    createMenuButton(x, y, label, callback, delay, isLarge = false) {
        const btn = this.add.container(x, y + 50).setAlpha(0);
        const theme = this.theme;

        const w = isLarge ? 340 : 280;
        const h = isLarge ? 60 : 50;

        const bg = this.add.rectangle(0, 0, w, h, theme.styles.flat ? 0xdddddd : 0x111111)
            .setStrokeStyle(theme.styles.flat ? 0 : 2, theme.colors.border, 0.5)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(0, 0, label, {
            fontFamily: theme.font,
            fontSize: isLarge ? (theme.styles.pixelated ? '18px' : '24px') : (theme.styles.pixelated ? '12px' : '18px'),
            fill: theme.styles.flat ? '#333333' : '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        btn.add([bg, text]);

        this.tweens.add({
            targets: btn,
            alpha: 1,
            y: y,
            duration: 600,
            delay: delay,
            ease: theme.styles.flat ? 'Power1' : 'Cubic.easeOut'
        });

        bg.on('pointerover', () => {
            if (theme.styles.flat) bg.setFillStyle(0xcccccc);
            else {
                bg.setFillStyle(0x222222);
                bg.setStrokeStyle(3, theme.colors.accent, 1);
            }
            text.setScale(1.1);
        });

        bg.on('pointerout', () => {
            if (theme.styles.flat) bg.setFillStyle(0xdddddd);
            else {
                bg.setFillStyle(0x111111);
                bg.setStrokeStyle(2, theme.colors.border, 0.5);
            }
            text.setScale(1);
        });

        bg.on('pointerdown', () => {
            this.tweens.add({
                targets: btn,
                scale: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: callback
            });
        });
    }
}
