import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
    constructor() {
        super('GameOverScene');
    }

    init(data) {
        this.stats = data || { time: 0, level: 1, kills: 0 };
    }

    create() {
        const { width, height } = this.scale;

        // 1. Dark Overlay Fade In
        const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0);
        this.tweens.add({
            targets: overlay,
            fillAlpha: 0.85,
            duration: 1000
        });

        // 2. GAME OVER Text
        const title = this.add.text(width / 2, height / 2 - 180, 'GAME OVER', {
            fontFamily: 'Orbitron, Arial',
            fontSize: '84px',
            fill: '#ff0000',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);
        title.setShadow(0, 0, '#ff0000', 20, true, true);

        this.tweens.add({
            targets: title,
            alpha: 1,
            y: height / 2 - 150,
            duration: 1000,
            ease: 'Back.easeOut'
        });

        // 3. Stats Container
        const statsY = height / 2;
        const statsStyle = { fontFamily: 'Arial', fontSize: '24px', fill: '#ffffff' };

        const minutes = Math.floor(this.stats.time / 60);
        const seconds = this.stats.time % 60;
        const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const timeText = this.add.text(width / 2, statsY - 30, `Survival Time: ${timeStr}`, statsStyle).setOrigin(0.5).setAlpha(0);
        const levelText = this.add.text(width / 2, statsY + 10, `Final Level: ${this.stats.level}`, statsStyle).setOrigin(0.5).setAlpha(0);
        const killText = this.add.text(width / 2, statsY + 50, `Enemies Terminated: ${this.stats.kills}`, statsStyle).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: [timeText, levelText, killText],
            alpha: 1,
            duration: 800,
            delay: 1000,
            stagger: 200
        });

        // 4. Buttons
        this.createButton(width / 2 - 120, height / 2 + 150, 'RESTART', () => {
            this.scene.start('GameScene');
        }, 1800);

        this.createButton(width / 2 + 120, height / 2 + 150, 'MENU', () => {
            // Since we don't have a menu yet, let's just restart for now or point to GameScene
            // In a real app, this would go to MenuScene
            this.scene.start('MenuScene');
        }, 2000);
    }

    createButton(x, y, label, callback, delay) {
        const btn = this.add.container(x, y).setAlpha(0);

        const bg = this.add.rectangle(0, 0, 200, 60, 0x333333)
            .setStrokeStyle(2, 0xffffff, 0.5)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(0, 0, label, {
            fontFamily: 'Orbitron, Arial',
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        btn.add([bg, text]);

        this.tweens.add({
            targets: btn,
            alpha: 1,
            duration: 500,
            delay: delay
        });

        bg.on('pointerover', () => {
            bg.setFillStyle(0xff0000, 0.8);
            text.setScale(1.1);
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x333333, 1);
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
