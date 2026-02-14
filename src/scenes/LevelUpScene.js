import Phaser from 'phaser';
import themeManager from '../utils/ThemeManager';

export class LevelUpScene extends Phaser.Scene {
    constructor() {
        super('LevelUpScene');
    }

    create() {
        const { width, height } = this.scale;
        const theme = themeManager.getTheme();

        // 1. Darken Background (Themed)
        this.add.rectangle(width / 2, height / 2, width, height, theme.colors.bg, 0.9);

        // 2. Title with Glow
        const title = this.add.text(width / 2, 80, 'EVOLUTION SELECT', {
            fontFamily: theme.font,
            fontSize: theme.styles.pixelated ? '32px' : '42px',
            fill: theme.id === 'MINIMAL' ? '#333' : Phaser.Display.Color.IntegerToColor(theme.colors.primary).rgba,
            fontStyle: 'bold'
        }).setOrigin(0.5);

        if (!theme.styles.flat) {
            title.setShadow(0, 0, Phaser.Display.Color.IntegerToColor(theme.colors.primary).rgba, 15, true, true);
        }

        // 3. Upgrade Pool
        const allUpgrades = [
            { id: 'damage', name: 'ATK DAMAGE', icon: '⚔️' },
            { id: 'attack_speed', name: 'FIRE RATE', icon: '⚡' },
            { id: 'move_speed', name: 'AGILITY', icon: '👟' },
            { id: 'health', name: 'VITALITY', icon: '❤️' },
            { id: 'new_weapon', name: 'DOUBLE SHOT', icon: '🔫' },
            { id: 'circular', name: 'VOID AURA', icon: '🌀' },
            { id: 'burst', name: 'NOVA BURST', icon: '💥' },
            { id: 'beam', name: 'ION BEAM', icon: '⌁' }
        ];

        const upgrades = [];
        const pool = [...allUpgrades];
        const rarities = [
            { name: 'COMMON', color: 0xaaaaaa },
            { name: 'RARE', color: 0x00aaff },
            { name: 'EPIC', color: 0xffaa00 }
        ];

        for (let i = 0; i < 3; i++) {
            if (pool.length === 0) break;
            const index = Phaser.Math.Between(0, pool.length - 1);
            const roll = Phaser.Math.Between(1, 100);
            let rarity = rarities[0];
            if (roll > 95) rarity = rarities[2];
            else if (roll > 70) rarity = rarities[1];
            upgrades.push({ ...pool[index], rarity });
            pool.splice(index, 1);
        }

        const cardWidth = 220;
        const cardHeight = 340;
        const spacing = 40;
        const totalWidth = (cardWidth * 3) + (spacing * 2);
        const startX = (width - totalWidth) / 2 + cardWidth / 2;

        upgrades.forEach((upgrade, index) => {
            const x = startX + index * (cardWidth + spacing);
            const y = height / 2 + 20;
            const cardContainer = this.add.container(x, y);

            // Card BG
            const cardBgColor = theme.styles.flat ? 0xffffff : 0x1a1a1a;
            const bg = this.add.rectangle(0, 0, cardWidth, cardHeight, cardBgColor)
                .setStrokeStyle(theme.styles.flat ? 1 : 3, upgrade.rarity.color)
                .setInteractive({ useHandCursor: true });

            // Holographic effect for Cyberpunk
            if (theme.id === 'CYBERPUNK') {
                this.add.rectangle(0, 0, cardWidth, cardHeight, 0x00ffff, 0.05);
            }

            const rarityLabel = this.add.text(0, -cardHeight / 2 + 25, upgrade.rarity.name, {
                fontFamily: theme.font, fontSize: theme.styles.pixelated ? '10px' : '12px', fontStyle: 'bold',
                color: Phaser.Display.Color.IntegerToColor(upgrade.rarity.color).rgba
            }).setOrigin(0.5);

            const icon = this.add.text(0, -60, upgrade.icon, { fontSize: '64px' }).setOrigin(0.5);

            const name = this.add.text(0, 20, upgrade.name, {
                fontFamily: theme.font, fontSize: theme.styles.pixelated ? '14px' : '20px', fontStyle: 'bold',
                color: theme.styles.flat ? '#333' : '#fff', align: 'center', wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5);

            cardContainer.add([bg, rarityLabel, icon, name]);
            cardContainer.setScale(0);

            this.tweens.add({
                targets: cardContainer,
                scale: 1,
                duration: 400,
                delay: index * 100,
                ease: 'Back.easeOut'
            });

            bg.on('pointerover', () => {
                cardContainer.setScale(1.05);
                if (!theme.styles.flat) bg.setStrokeStyle(5, upgrade.rarity.color);
            });

            bg.on('pointerout', () => {
                cardContainer.setScale(1);
                if (!theme.styles.flat) bg.setStrokeStyle(3, upgrade.rarity.color);
            });

            bg.on('pointerdown', () => {
                this.tweens.add({
                    targets: cardContainer,
                    scale: 0.9,
                    duration: 100,
                    yoyo: true,
                    onComplete: () => this.selectUpgrade(upgrade.id)
                });
            });
        });
    }

    selectUpgrade(upgradeId) {
        this.scene.resume('GameScene', { upgrade: upgradeId });
        this.scene.stop();
    }
}
