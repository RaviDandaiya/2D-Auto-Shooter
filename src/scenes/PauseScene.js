import Phaser from 'phaser';

export class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const { width, height } = this.scale;

        // 1. Semi-transparent dark background
        const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
            .setInteractive(); // Block clicks to scene below

        this.tweens.add({
            targets: bg,
            fillAlpha: 0.6,
            duration: 200
        });

        // 2. Title
        const title = this.add.text(width / 2, height / 2 - 150, 'PAUSED', {
            fontFamily: 'Orbitron, Arial',
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5).setAlpha(0);

        this.tweens.add({
            targets: title,
            alpha: 1,
            y: height / 2 - 120,
            duration: 400,
            ease: 'Back.easeOut'
        });

        // 3. Menu Buttons
        const buttonYStart = height / 2 - 20;
        const spacing = 70;

        this.createButton(width / 2, buttonYStart, 'RESUME', () => this.resumeGame(), 100);
        this.createButton(width / 2, buttonYStart + spacing, 'SETTINGS', () => { }, 200);
        this.createButton(width / 2, buttonYStart + spacing * 2, 'QUIT TO MENU', () => this.scene.start('MenuScene'), 300);

        // ESC to resume
        this.input.keyboard.once('keydown-ESC', () => this.resumeGame());
    }

    createButton(x, y, label, callback, delay) {
        const btn = this.add.container(x, y).setAlpha(0);

        const bg = this.add.rectangle(0, 0, 240, 50, 0x222222)
            .setStrokeStyle(2, 0xffffff, 0.3)
            .setInteractive({ useHandCursor: true });

        const text = this.add.text(0, 0, label, {
            fontFamily: 'Orbitron, Arial',
            fontSize: '20px',
            fill: '#ffffff'
        }).setOrigin(0.5);

        btn.add([bg, text]);

        this.tweens.add({
            targets: btn,
            alpha: 1,
            x: x,
            duration: 300,
            delay: delay
        });

        bg.on('pointerover', () => {
            bg.setFillStyle(0x444444);
            bg.setStrokeStyle(2, 0x00ffff, 1);
            text.setScale(1.1).setFill('#00ffff');
        });

        bg.on('pointerout', () => {
            bg.setFillStyle(0x222222);
            bg.setStrokeStyle(2, 0xffffff, 0.3);
            text.setScale(1).setFill('#ffffff');
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

    resumeGame() {
        // Trigger camera zoom back in GameScene
        const gameScene = this.scene.get('GameScene');
        gameScene.cameras.main.zoomTo(1, 200);

        this.scene.resume('GameScene');
        this.scene.stop();
    }
}
