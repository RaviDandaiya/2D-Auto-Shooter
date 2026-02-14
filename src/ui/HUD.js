import themeManager from '../utils/ThemeManager';

export default class HUD {
    constructor(scene) {
        this.scene = scene;
        this.width = scene.scale.width;
        this.height = scene.scale.height;
        this.refreshTheme();

        // State for smoothed animations
        this.visualHealth = 100;
        this.targetHealth = 100;
        this.maxHealth = 100;
        this.flashHealth = false;
        this.shakeTime = 0;

        this.visualXP = 0;
        this.targetXP = 0;
        this.requiredXP = 100;
        this.level = 1;

        this.killCount = 0;
        this.survivalTime = 0;

        this.create();
    }

    refreshTheme() {
        this.theme = themeManager.getTheme();
    }

    create() {
        if (this.container) this.container.destroy();

        // Container for all HUD elements
        this.container = this.scene.add.container(0, 0).setScrollFactor(0);
        this.container.setDepth(100);

        // --- Graphics Objects ---
        this.barGraphics = this.scene.add.graphics().setScrollFactor(0);
        this.container.add(this.barGraphics);

        // --- Post-processing layers ---
        if (this.theme.styles.scanlines) {
            this.createScanlines();
        }

        // --- Text Objects ---
        const theme = this.theme;
        const textStyle = {
            fontFamily: theme.font,
            fontSize: theme.styles.pixelated ? '12px' : '14px',
            fontStyle: 'bold',
            color: theme.colors.text
        };

        // 1. Health Text
        this.hpLabel = this.scene.add.text(20, 10, 'VITALITY', textStyle).setScrollFactor(0);

        // 2. Timer (Top Center)
        this.timeText = this.scene.add.text(this.width / 2, 30, '00:00', {
            ...textStyle,
            fontSize: theme.styles.pixelated ? '20px' : '28px'
        }).setOrigin(0.5).setScrollFactor(0);

        if (!theme.styles.flat) this.timeText.setShadow(0, 0, '#000000', 4, true, true);

        // 3. Kill Counter (Top Right)
        this.killText = this.scene.add.text(this.width - 20, 30, '💀 0', {
            ...textStyle,
            fontSize: theme.styles.pixelated ? '16px' : '24px'
        }).setOrigin(1, 0.5).setScrollFactor(0);

        // 4. Level Indicator (Bottom Center, above XP bar)
        this.lvlText = this.scene.add.text(this.width / 2, this.height - 45, `LEVEL ${this.level}`, {
            ...textStyle,
            fontSize: theme.styles.pixelated ? '12px' : '18px'
        }).setOrigin(0.5).setScrollFactor(0);

        if (theme.colors.xp && !theme.styles.flat) {
            this.lvlText.setShadow(0, 0, Phaser.Display.Color.IntegerToColor(theme.colors.xp).rgba, 10);
        }

        this.container.add([this.hpLabel, this.timeText, this.killText, this.lvlText]);

        // Initial Draw
        this.draw();

        // Register update listener cleanly
        this.updateListener = (time, delta) => {
            this.shakeTime += delta;

            // Glitch effect for Cyberpunk
            if (theme.styles.glitch && Math.random() < 0.05) {
                this.container.x = Math.random() * 2 - 1;
                this.container.y = Math.random() * 2 - 1;
            } else if (theme.styles.glitch) {
                this.container.x = 0;
                this.container.y = 0;
            }

            if ((this.visualHealth / this.maxHealth < 0.3 && this.visualHealth > 0) ||
                this.visualXP >= this.requiredXP ||
                this.theme.styles.hasDrip ||
                this.theme.styles.runes) {
                this.draw();
            }
        };

        // Remove existing if present to avoid dupes (using named function reference if stored)
        // Since we are creating new HUD each time, we should just add it.
        // But better to be safe:
        this.scene.events.on('update', this.updateListener);

        // Clean up on destroy
        this.scene.events.once('shutdown', () => {
            this.scene.events.off('update', this.updateListener);
        });
    }

    createScanlines() {
        const scanlines = this.scene.add.graphics().setScrollFactor(0);
        scanlines.lineStyle(1, 0x000000, 0.1);
        for (let i = 0; i < this.height; i += 4) {
            scanlines.moveTo(0, i);
            scanlines.lineTo(this.width, i);
        }
        scanlines.strokePath();
        this.container.add(scanlines);
    }

    updateHealth(current, max) {
        if (current < this.targetHealth) {
            this.flashHealth = true;
            this.scene.time.delayedCall(100, () => {
                this.flashHealth = false;
                this.draw();
            });
        }

        this.targetHealth = current;
        this.maxHealth = max;

        this.scene.tweens.addCounter({
            from: this.visualHealth,
            to: this.targetHealth,
            duration: 300,
            ease: this.theme.styles.flat ? 'Linear' : 'Power2.easeOut',
            onUpdate: (tween) => {
                this.visualHealth = tween.getValue();
                this.draw();
            }
        });
    }

    createXpSparks(x, y, progressWidth) {
        if (this.theme.styles.flat) return;
        const color = this.theme.colors.xp;
        const count = this.theme.styles.pixelated ? 15 : 5;

        for (let i = 0; i < count; i++) {
            const spark = this.theme.styles.pixelated ?
                this.scene.add.rectangle(x + progressWidth, y, 4, 4, color) :
                this.scene.add.circle(x + progressWidth, y, 3, color);

            this.container.add(spark);

            this.scene.tweens.add({
                targets: spark,
                x: x + progressWidth + Phaser.Math.Between(-30, 30),
                y: y + Phaser.Math.Between(-40, -10),
                alpha: 0,
                duration: 600,
                ease: this.theme.styles.pixelated ? 'Linear' : 'Cubic.easeOut',
                onComplete: () => spark.destroy()
            });
        }
    }

    updateXP(current, required, level) {
        if (current > this.targetXP) {
            const xpW = Math.min(600, this.width - 40);
            const xpX = (this.width - xpW) / 2;
            const xpY = this.height - 30;
            const currentRatio = this.visualXP / this.requiredXP;
            this.createXpSparks(xpX, xpY + 7, xpW * currentRatio);
        }

        this.targetXP = current;
        this.requiredXP = required;

        if (this.level !== level) {
            this.level = level;
            this.lvlText.setText(`LEVEL ${this.level}`);

            if (!this.theme.styles.flat) {
                this.scene.tweens.add({
                    targets: this.lvlText,
                    scale: 1.5,
                    duration: 300,
                    yoyo: true,
                    ease: 'Back.easeOut'
                });
            }
        }

        this.scene.tweens.addCounter({
            from: this.visualXP,
            to: this.targetXP,
            duration: 400,
            ease: this.theme.styles.flat ? 'Linear' : 'Cubic.easeOut',
            onUpdate: (tween) => {
                this.visualXP = tween.getValue();
                this.draw();
            }
        });
    }

    updateTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        this.timeText.setText(`${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`);
    }

    updateKills(count) {
        this.killCount = count;
        this.killText.setText(`💀 ${this.killCount}`);

        if (!this.theme.styles.flat) {
            this.scene.tweens.add({
                targets: this.killText,
                scale: 1.2,
                duration: 100,
                yoyo: true
            });
        }
    }

    draw() {
        this.barGraphics.clear();
        const theme = this.theme;

        // --- Health Bar (Top Left) ---
        const hpPercent = Math.max(0, this.visualHealth / this.maxHealth);
        let hpX = 20;
        const hpY = 30;
        const hpW = 200;
        const hpH = theme.styles.pixelated ? 24 : 20;
        const radius = theme.styles.hpRadius;

        if (!theme.styles.flat && hpPercent < 0.3 && hpPercent > 0) {
            hpX += Math.sin(this.shakeTime * 0.05) * 2;
        }

        // Ornamental Details
        if (theme.styles.ornamental) {
            this.barGraphics.lineStyle(2, theme.colors.accent, 0.5);
            this.drawOrnament(hpX - 5, hpY - 5);
            this.drawOrnament(hpX + hpW + 5, hpY - 5, true);
        }

        // Fantasy Runes
        if (theme.styles.runes) {
            this.drawRunes(hpX, hpY - 15, hpW);
        }

        // Background
        this.barGraphics.fillStyle(0x000000, theme.styles.flat ? 0.1 : 0.7);
        if (radius > 0) this.barGraphics.fillRoundedRect(hpX, hpY, hpW, hpH, radius);
        else this.barGraphics.fillRect(hpX, hpY, hpW, hpH);

        // Border
        if (theme.styles.borderThickness > 0) {
            this.barGraphics.lineStyle(theme.styles.borderThickness, theme.colors.border, 0.4);
            if (radius > 0) this.barGraphics.strokeRoundedRect(hpX, hpY, hpW, hpH, radius);
            else this.barGraphics.strokeRect(hpX, hpY, hpW, hpH);
        }

        let hpColor = theme.colors.health;
        if (this.flashHealth) hpColor = 0xffffff;

        if (theme.styles.hpSegments > 0) {
            const segments = theme.styles.hpSegments;
            const segmentGap = theme.styles.pixelated ? 2 : 4;
            const totalGapWidth = segmentGap * (segments - 1);
            const segmentW = (hpW - totalGapWidth) / segments;

            for (let i = 0; i < segments; i++) {
                const segX = hpX + i * (segmentW + segmentGap);
                const segPercentStart = i / segments;

                this.barGraphics.fillStyle(0xffffff, 0.05);
                this.barGraphics.fillRect(segX, hpY + 2, segmentW, hpH - 4);

                if (hpPercent > segPercentStart) {
                    const fillRatio = Math.min(1, (hpPercent - segPercentStart) * segments);
                    this.barGraphics.fillStyle(hpColor, 1);
                    this.barGraphics.fillRect(segX, hpY + 2, segmentW * fillRatio, hpH - 4);
                }
            }
        } else {
            if (hpPercent > 0) {
                this.barGraphics.fillStyle(hpColor, 1);
                if (radius > 0) this.barGraphics.fillRoundedRect(hpX, hpY, hpW * hpPercent, hpH, radius);
                else this.barGraphics.fillRect(hpX, hpY, hpW * hpPercent, hpH);

                if (theme.styles.hasDrip) {
                    this.drawDrips(hpX, hpY, hpW * hpPercent, hpH, hpColor);
                }
            }
        }

        // --- XP Bar (Bottom Center) ---
        let xpW = Math.min(600, this.width - 40);
        let xpH = theme.styles.pixelated ? 16 : 14;
        let xpX = (this.width - xpW) / 2;
        let xpY = this.height - (theme.styles.pixelated ? 35 : 30);
        const xpRadius = theme.styles.xpRadius;

        if (!theme.styles.flat && this.visualXP >= this.requiredXP) {
            const scale = 1 + Math.sin(this.scene.time.now * 0.01) * 0.08;
            xpW *= scale;
            xpH *= scale;
            xpX = (this.width - xpW) / 2;
            xpY = this.height - 30 - (xpH - 14) / 2;
        }

        this.barGraphics.fillStyle(0x000000, theme.styles.flat ? 0.1 : 0.7);
        if (xpRadius > 0) this.barGraphics.fillRoundedRect(xpX, xpY, xpW, xpH, xpRadius);
        else this.barGraphics.fillRect(xpX, xpY, xpW, xpH);

        if (theme.styles.borderThickness > 0) {
            this.barGraphics.lineStyle(theme.styles.borderThickness, theme.colors.xp, 0.4);
            if (xpRadius > 0) this.barGraphics.strokeRoundedRect(xpX, xpY, xpW, xpH, xpRadius);
            else this.barGraphics.strokeRect(xpX, xpY, xpW, xpH);
        }

        const xpPercent = Math.max(0, Math.min(1, this.visualXP / this.requiredXP));

        if (xpPercent > 0) {
            this.barGraphics.fillStyle(theme.colors.xp, 1);
            if (xpRadius > 0) this.barGraphics.fillRoundedRect(xpX, xpY, xpW * xpPercent, xpH, xpRadius);
            else this.barGraphics.fillRect(xpX, xpY, xpW * xpPercent, xpH);

            // Cyberpunk/Fantasy Highlight
            if (theme.id === 'NEON' || theme.id === 'CYBERPUNK' || theme.id === 'FANTASY') {
                this.barGraphics.fillStyle(0xffffff, 0.3);
                this.barGraphics.fillRect(xpX + 2, xpY + 2, (xpW * xpPercent) - 4, xpH / 3);
            }
        }
    }

    drawDrips(x, y, w, h, color) {
        this.barGraphics.fillStyle(color, 1);
        const dripCount = Math.floor(w / 15);
        for (let i = 0; i < dripCount; i++) {
            const dripX = x + (i * 15) + 5;
            const dripLen = 5 + Math.sin(this.shakeTime * 0.005 + i) * 5;
            this.barGraphics.fillCircle(dripX, y + h, 2.5);
            this.barGraphics.fillRect(dripX - 2.5, y + h - 5, 5, dripLen);
            this.barGraphics.fillCircle(dripX, y + h + dripLen, 2.5);
        }
    }

    drawRunes(x, y, w) {
        const runeSymbols = ['⚔', '✙', '✧', '☘', '❈', '❦', '✥'];
        this.barGraphics.fillStyle(this.theme.colors.accent, 0.3);
        for (let i = 0; i < w / 30; i++) {
            const symbol = runeSymbols[i % runeSymbols.length];
            const runeX = x + i * 30;
            const runeY = y + Math.sin(this.shakeTime * 0.002 + i) * 2;
            // Native canvas drawing for symbols or just dots for simplicity in Graphics?
            // Let's use small rune-like shapes for graphics
            this.barGraphics.fillCircle(runeX, runeY, 2);
            this.barGraphics.lineStyle(1, this.theme.colors.accent, 0.2);
            this.barGraphics.strokeCircle(runeX, runeY, 5);
        }
    }

    drawOrnament(x, y, flip = false) {
        const size = 10;
        this.barGraphics.beginPath();
        if (!flip) {
            this.barGraphics.moveTo(x, y + size);
            this.barGraphics.lineTo(x, y);
            this.barGraphics.lineTo(x + size, y);
        } else {
            this.barGraphics.moveTo(x, y + size);
            this.barGraphics.lineTo(x, y);
            this.barGraphics.lineTo(x - size, y);
        }
        this.barGraphics.strokePath();
    }
}
