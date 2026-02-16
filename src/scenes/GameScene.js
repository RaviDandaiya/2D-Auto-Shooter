import Phaser from 'phaser';
import SoundManager from '../utils/SoundManager';
import HUD from '../ui/HUD';
import themeManager from '../utils/ThemeManager';

export class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        this.load.svg('player', 'assets/player.svg', { width: 64, height: 64 });
        this.load.svg('enemy', 'assets/enemy.svg', { width: 48, height: 48 });
        this.load.svg('bullet', 'assets/bullet.svg', { width: 32, height: 32 });
    }

    create() {
        console.log('GameScene: create() started');
        this.theme = themeManager.getTheme();
        console.log('GameScene: Theme loaded', this.theme.id);

        // Define particle texture if missing to prevent errors
        if (!this.textures.exists('particle_texture')) {
            const graphics = this.add.graphics();
            graphics.fillStyle(0xffffff);
            graphics.fillCircle(4, 4, 4);
            graphics.generateTexture('particle_texture', 8, 8);
            graphics.destroy();
        }

        // Initialize Sound Manager & HUD
        this.soundManager = new SoundManager(this);
        this.hud = new HUD(this);
        console.log('GameScene: HUD and SoundManager initialized');

        // 1. Create a large world arena
        const worldSize = 2500;
        this.physics.world.setBounds(0, 0, worldSize, worldSize);

        // 2. Space Background (Theme Aware)
        // Dark deep space background - slight tint based on theme
        const bgColor = this.theme.colors.bg;
        // Convert to hex string if it's a number (Phaser handles both but setBackgroundColor string is safe)
        const bgColorString = typeof bgColor === 'number' ? `#${bgColor.toString(16).padStart(6, '0')}` : bgColor;

        this.cameras.main.setBackgroundColor(bgColorString);

        // Star Colors
        const starColor = this.theme.id === 'CYBERPUNK' ? 0xff00ff :
            (this.theme.id === 'CRIMSON' ? 0xff5555 : 0xaaccff);

        // Layer 1: Distant Stars (Small, Slowly moving)
        if (!this.textures.exists('stars_far')) {
            const stars = this.add.graphics();
            stars.fillStyle(starColor, 0.5);
            for (let i = 0; i < 1500; i++) {
                stars.fillCircle(Phaser.Math.Between(0, 2048), Phaser.Math.Between(0, 2048), 1);
            }
            stars.generateTexture('stars_far', 2048, 2048);
            stars.destroy();
        }

        // Layer 2: Close Stars (Brighter, Faster moving)
        if (!this.textures.exists('stars_near')) {
            const stars = this.add.graphics();
            stars.fillStyle(0xffffff, 0.8);
            for (let i = 0; i < 500; i++) {
                stars.fillCircle(Phaser.Math.Between(0, 2048), Phaser.Math.Between(0, 2048), Math.random() < 0.5 ? 2 : 3);
            }
            stars.generateTexture('stars_near', 2048, 2048);
            stars.destroy();
        }

        // Tiling background for depth (Parallax)
        this.bgStars1 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'stars_far')
            .setScrollFactor(0).setOrigin(0).setAlpha(0.2); // Reduced opacity

        this.bgStars2 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'stars_near')
            .setScrollFactor(0).setOrigin(0).setAlpha(0.4); // Reduced opacity

        // Ambient Effects (Gothic)
        if (this.theme.particles.embers) {
            this.createAmbientEmbers(worldSize);
        }
        if (this.theme.particles.fog) {
            this.createAmbientFog(worldSize);
        }

        this.scale.on('resize', (gameSize) => {
            if (this.bgStars1) this.bgStars1.setSize(gameSize.width, gameSize.height);
            if (this.bgStars2) this.bgStars2.setSize(gameSize.width, gameSize.height);
        });

        // 3. Create Groups for Combat
        this.enemies = this.physics.add.group();
        this.projectiles = this.physics.add.group();
        this.gems = this.physics.add.group();
        this.particles = this.add.particles('particle_texture');
        console.log('GameScene: Groups created');

        // 4. Create the player
        this.player = this.add.container(worldSize / 2, worldSize / 2);

        // NUCLEAR OPTION: Remove all children first just in case
        this.player.removeAll(true);

        // Player Sprite
        const playerSprite = this.add.image(0, 0, 'player');
        playerSprite.setDisplaySize(50, 50);

        // Player Name Tag
        const names = ['Starfighter', 'Pilot X', 'Neon Ace', 'Viper', 'Nova', 'Cyber-01'];
        const randomName = names[Phaser.Math.Between(0, names.length - 1)];
        const nameText = this.add.text(0, -50, randomName, {
            fontSize: '14px',
            fontFamily: 'Orbitron, Arial',
            fill: '#00ffff'
        }).setOrigin(0.5);

        this.player.add([playerSprite, nameText]);

        this.physics.add.existing(this.player);
        // Player is a Container.
        // It's generally better to give the physics body to the container.
        // Set circular body for player too.
        this.player.body.setCircle(20);
        this.player.body.setOffset(-20, -20); // Containers need explicit offset to center body on (0,0)
        this.player.body.setCollideWorldBounds(true);
        console.log('GameScene: Player physics initialized');

        // Force time scale and unpause
        this.time.timeScale = 1;
        this.physics.resume();

        // Adjusted Stats for better early game flow (Action: Buff Fire Rate)
        this.playerStats = {
            moveSpeed: 300,
            fireRate: 500, // Reduced from 800ms
            damage: 20,
            weaponLevel: 0,
            circularLevel: 0,
            burstLevel: 0,
            beamLevel: 0
        };

        // NUCLEAR INPUT: Direct Window Listeners
        window.inputs = { up: false, down: false, left: false, right: false };

        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') window.inputs.up = true;
            if (key === 's' || key === 'arrowdown') window.inputs.down = true;
            if (key === 'a' || key === 'arrowleft') window.inputs.left = true;
            if (key === 'd' || key === 'arrowright') window.inputs.right = true;
        });

        window.addEventListener('keyup', (e) => {
            const key = e.key.toLowerCase();
            if (key === 'w' || key === 'arrowup') window.inputs.up = false;
            if (key === 's' || key === 'arrowdown') window.inputs.down = false;
            if (key === 'a' || key === 'arrowleft') window.inputs.left = false;
            if (key === 'd' || key === 'arrowright') window.inputs.right = false;
        });

        console.log('GameScene: Nuclear Input set up');

        // 6. Camera Follow
        this.cameras.main.setBounds(0, 0, worldSize, worldSize);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // 7. Immediate Enemy Spawn (Force 5 enemies)
        for (let i = 0; i < 5; i++) {
            this.spawnEnemy();
        }

        // 8. Collisions
        this.physics.add.overlap(this.projectiles, this.enemies, this.handleCombat, null, this);
        this.physics.add.overlap(this.player, this.enemies, this.handlePlayerDamage, null, this);
        this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);
        console.log('GameScene: Collisions set up');

        // 9. Player Stats & UI
        this.playerHealth = 100;
        this.maxHealth = 100;
        this.playerXP = 0;
        this.requiredXP = 100;
        this.playerLevel = 1;

        this.hud.updateXP(this.playerXP, this.requiredXP, this.playerLevel);

        // Instruction overlay
        this.add.text(10, this.scale.height - 30, 'WASD/Arrows to move', {
            fontSize: '16px',
            fill: '#fff',
            backgroundColor: '#000'
        }).setScrollFactor(0).setAlpha(0.6);

        // Resume event listener
        this.events.on('resume', (scene, data) => {
            if (data && data.upgrade) {
                this.applyUpgrade(data.upgrade);
            }
        });

        // 13. Game Timer & Scaling
        this.gameTime = 0;

        this.time.addEvent({
            delay: 1000,
            callback: this.updateGameTime,
            callbackScope: this,
            loop: true
        });

        // Spawn timer
        this.spawnTimer = this.time.addEvent({
            delay: 2000,
            callback: this.spawnEnemy,
            callbackScope: this,
            loop: true
        });

        // Start Auto-Shoot
        this.startAutoShootTimer();

        // Pause listener
        this.input.keyboard.on('keydown-ESC', () => {
            if (this.scene.isActive('GameScene')) {
                this.cameras.main.zoomTo(0.9, 200);
                this.scene.pause();
                this.scene.launch('PauseScene');
            }
        });

        // Initial HUD Update
        this.hud.updateHealth(this.playerHealth, this.maxHealth);
        this.hud.updateXP(this.playerXP, this.requiredXP, this.playerLevel);

        console.log('GameScene: create() complete');
        this.hasLoggedUpdate = false;

        // --- Click to Resume / Focus Fix ---
        const focusZone = this.add.zone(0, 0, worldSize, worldSize).setOrigin(0).setScrollFactor(0);
        focusZone.setInteractive();
        focusZone.on('pointerdown', () => {
            console.log('GameScene: Clicked to focus');
            if (this.sound.context.state === 'suspended') {
                this.sound.context.resume();
            }
            window.focus();
        });
    }

    startAutoShootTimer() {
        if (this.shootEvent) this.shootEvent.remove();

        this.shootEvent = this.time.addEvent({
            delay: this.playerStats.fireRate,
            callback: this.autoShoot,
            callbackScope: this,
            loop: true
        });
    }

    updateGameTime() {
        this.gameTime++;
        this.hud.updateTime(this.gameTime);

        if (this.gameTime % 60 === 0) {
            const currentDelay = this.spawnTimer.delay;
            const newDelay = Math.max(500, currentDelay - 200);

            this.spawnTimer.remove();
            this.spawnTimer = this.time.addEvent({
                delay: newDelay,
                callback: this.spawnEnemy,
                callbackScope: this,
                loop: true
            });

            this.showNotification('Enemy Wave Intensifies!');
            this.soundManager.playPowerUp();
        }
    }

    showNotification(text) {
        const notif = this.add.text(this.scale.width / 2, 150, text, {
            fontSize: '32px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);

        this.tweens.add({
            targets: notif,
            alpha: 0,
            y: 100,
            duration: 2000,
            onComplete: () => notif.destroy()
        });
    }

    spawnEnemy() {
        if (!this.player) return;

        // SPAWN VISIBLE: Spawn effectively "just off screen" around the player
        // Screen diagonal is ~1500. Radius 800 is safe.
        const angle = Phaser.Math.Between(0, 360);
        const distance = Phaser.Math.Between(700, 900); // Close enough to arrive in 2-3 seconds

        let x = this.player.x + Math.cos(angle) * distance;
        let y = this.player.y + Math.sin(angle) * distance;

        // Clamp to world
        const worldSize = 2500;
        x = Phaser.Math.Clamp(x, 50, worldSize - 50);
        y = Phaser.Math.Clamp(y, 50, worldSize - 50);

        let type = 'normal';
        let color = 0xff0000;
        let radius = 15;
        // Buffed Early Game HP (Still 1-shot for 20dmg, but "tougher")
        let hp = 10;

        // Scale up after 60 seconds (Base 25->30, Scale 20->25)
        if (this.gameTime > 60) {
            hp = 30 + (this.playerLevel * 6) + (Math.floor((this.gameTime - 60) / 60) * 25);
        }

        let speed = 180; // Buffed from 150

        if (this.gameTime >= 120) {
            const chance = Phaser.Math.Between(0, 100);
            if (chance < 30) {
                type = 'charger';
                color = 0xffaa00;
                radius = 12;
                speed = 300; // Buffed from 250
                hp = hp * 0.6;
            }
        }

        if (this.gameTime >= 300) {
            const chance = Phaser.Math.Between(0, 100);
            if (chance < 20) {
                type = 'tank';
                color = 0x880088;
                radius = 25;
                speed = 80;
                hp = hp * 2.5;
            }
        }

        const enemy = this.add.image(x, y, 'enemy');
        const displaySize = radius * 2.5;
        enemy.setDisplaySize(displaySize, displaySize);
        enemy.setTint(color);
        this.enemies.add(enemy);
        this.physics.add.existing(enemy);

        // Circular Body - Explicit centering
        // Texture is 48x48. Radius 24 = Full Width.
        enemy.body.setCircle(24);
        // No offset needed if 24 is exactly half of 48.

        enemy.body.setCollideWorldBounds(true);
        enemy.body.onWorldBounds = true;

        enemy.heading = new Phaser.Math.Vector2();
        enemy.hp = hp;
        enemy.speed = speed;
        enemy.type = type;
        enemy.baseColor = color; // Store original color for flash reset
    }

    autoShoot() {
        if (this.enemies.getChildren().length === 0) return;

        let shotFired = false;

        // 1. Circular Area Attack
        if (this.playerStats.circularLevel > 0) {
            this.fireCircularAttack();
            shotFired = true;
        }

        // 2. Multi-Burst Attack
        if (this.playerStats.burstLevel > 0) {
            this.fireMultiBurst();
            shotFired = true;
        }

        // Find nearest enemy for targeted weapons
        let nearestEnemy = null;
        let minDistance = Infinity;

        this.enemies.getChildren().forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
            if (dist < minDistance) {
                minDistance = dist;
                nearestEnemy = enemy;
            }
        });

        if (nearestEnemy) {
            this.fireProjectile(nearestEnemy);
            shotFired = true;

            // 3. Piercing Laser Beam
            if (this.playerStats.beamLevel > 0) {
                this.firePiercingBeam(nearestEnemy);
                shotFired = true;
            }
        }

        if (shotFired) {
            this.soundManager.playShoot();
        }
    }

    fireProjectile(target) {
        if (this.playerStats.weaponLevel === 0) {
            this.createBullet(target, 0);
        } else if (this.playerStats.weaponLevel >= 1) {
            this.createBullet(target, -0.1);
            this.createBullet(target, 0.1);
        }
    }

    fireCircularAttack() {
        const circle = this.add.circle(this.player.x, this.player.y, 10, 0x00ffff, 0.5);
        this.physics.add.existing(circle);

        // Circular attack doesn't move, it expands
        this.tweens.add({
            targets: circle,
            scale: 10 + (this.playerStats.circularLevel * 2), // Grows bigger with level
            alpha: 0,
            duration: 500,
            onComplete: () => circle.destroy()
        });

        // Add to projectiles to trigger collision? 
        // Better to check overlap specifically for this one or add to projectiles with a special property
        this.projectiles.add(circle);
        circle.isArea = true;
        circle.damage = this.playerStats.damage * 0.5; // Less damage but AOE
    }

    fireMultiBurst() {
        const count = 4 + (this.playerStats.burstLevel * 2);
        const step = (Math.PI * 2) / count;

        for (let i = 0; i < count; i++) {
            const angle = i * step;
            const bullet = this.add.circle(this.player.x, this.player.y, 4, 0xff00ff);
            this.projectiles.add(bullet);
            this.physics.add.existing(bullet);

            bullet.body.setVelocity(
                Math.cos(angle) * 400,
                Math.sin(angle) * 400
            );
            bullet.damage = this.playerStats.damage * 0.8;

            this.time.delayedCall(1000, () => {
                if (bullet.active) bullet.destroy();
            });
        }
    }

    firePiercingBeam(target) {
        const beam = this.add.rectangle(this.player.x, this.player.y, 30, 4, 0x00ff00);
        this.projectiles.add(beam);
        this.physics.add.existing(beam);

        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y);
        beam.rotation = angle;

        const speed = 800;
        beam.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        beam.isPiercing = true;
        beam.penetration = 2 + this.playerStats.beamLevel; // Hits multiple enemies
        beam.damage = this.playerStats.damage * 1.5;

        this.time.delayedCall(1000, () => {
            if (beam.active) beam.destroy();
        });
    }

    createBullet(target, angleOffset) {
        // Use 'bullet' sprite instead of circle
        const bullet = this.add.image(this.player.x, this.player.y, 'bullet');
        this.projectiles.add(bullet);

        const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, target.x, target.y) + angleOffset;
        const speed = 900; // Increased from 600 for reliable hits

        this.physics.add.existing(bullet);
        bullet.body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );
        bullet.damage = this.playerStats.damage;

        // Large hitbox for bullets
        bullet.body.setCircle(12); // Generous hit radius

        this.time.delayedCall(2000, () => {
            if (bullet.active) bullet.destroy();
        });
    }

    createExplosion(x, y, color) {
        for (let i = 0; i < 8; i++) {
            const particle = this.add.circle(x, y, 3, color);
            this.physics.add.existing(particle);

            const angle = Phaser.Math.Between(0, 360);
            const speed = Phaser.Math.Between(50, 150);

            particle.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
            );

            this.tweens.add({
                targets: particle,
                alpha: 0,
                scale: 0,
                duration: 500,
                onComplete: () => particle.destroy()
            });
        }
    }

    showDamageNumber(x, y, damage, isCrit) {
        const text = this.add.text(x, y, Math.ceil(damage).toString(), {
            fontFamily: 'Orbitron, Arial',
            fontSize: isCrit ? '28px' : '18px',
            fill: isCrit ? '#ffff00' : '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);

        if (isCrit) {
            text.setShadow(0, 0, '#ffff00', 8, true, true);
        }

        this.tweens.add({
            targets: text,
            y: y - 60,
            alpha: 0,
            duration: 800,
            ease: 'Cubic.easeOut',
            onComplete: () => text.destroy()
        });
    }

    handleCombat(projectile, enemy) {
        if (Math.random() > 0.5) this.soundManager.playHit();

        let damage = projectile.damage || this.playerStats.damage;
        let isCrit = Math.random() < 0.15; // 15% Crit chance

        if (isCrit) {
            damage *= 2;
            this.cameras.main.shake(100, 0.003); // Slight shake for crits
        }

        // Handle Area of Effect
        if (projectile.isArea) {
            if (!projectile.hitList) projectile.hitList = [];
            if (projectile.hitList.includes(enemy)) return;
            projectile.hitList.push(enemy);
            enemy.hp -= damage;
            this.showDamageNumber(enemy.x, enemy.y, damage, isCrit);
        } else if (projectile.isPiercing) {
            enemy.hp -= damage;
            projectile.penetration--;
            this.showDamageNumber(enemy.x, enemy.y, damage, isCrit);

            // Visual hit effect
            enemy.setTintFill(0xffffff);
            this.time.delayedCall(100, () => {
                if (enemy.active) enemy.setTint(enemy.baseColor || 0xffffff);
            });

            if (projectile.penetration <= 0) projectile.destroy();
        } else {
            // Normal Bullet
            enemy.hp -= damage;
            projectile.destroy();
            this.showDamageNumber(enemy.x, enemy.y, damage, isCrit);

            // Visual hit effect
            enemy.setTintFill(0xffffff);
            this.time.delayedCall(100, () => {
                if (enemy.active) enemy.setTint(enemy.baseColor || 0xffffff);
            });
        }

        this.createExplosion(enemy.x, enemy.y, 0xffffff);

        if (enemy.hp <= 0 && enemy.active) {
            // Death Logic
            this.soundManager.playExplosion();
            this.createExplosion(enemy.x, enemy.y, enemy.baseColor || 0xff0000);
            this.cameras.main.shake(50, 0.005); // Subtle shake on kill

            // HUD Update
            this.hud.killCount++;
            this.hud.updateKills(this.hud.killCount);

            const gem = this.add.circle(enemy.x, enemy.y, 8, 0x0000ff);
            this.gems.add(gem);
            this.physics.add.existing(gem);
            enemy.destroy();
        }
    }

    collectGem(player, gem) {
        this.soundManager.playTone(600, 'sine', 0.1);
        gem.destroy();
        this.playerXP += 20;

        if (this.playerXP >= this.requiredXP) {
            this.levelUp();
        }

        this.hud.updateXP(this.playerXP, this.requiredXP, this.playerLevel);
    }

    levelUp() {
        this.soundManager.playPowerUp();
        this.playerLevel++;
        this.playerXP = 0;
        this.requiredXP = Math.floor(this.requiredXP * 1.5);

        this.hud.updateXP(this.playerXP, this.requiredXP, this.playerLevel);

        this.scene.pause();
        this.scene.launch('LevelUpScene');
    }

    applyUpgrade(upgradeId) {
        this.soundManager.playPowerUp();
        switch (upgradeId) {
            case 'damage': this.playerStats.damage += 10; break;
            case 'attack_speed':
                this.playerStats.fireRate = Math.max(100, this.playerStats.fireRate * 0.8);
                this.startAutoShootTimer();
                break;
            case 'move_speed': this.playerStats.moveSpeed += 200; break;
            case 'new_weapon': this.playerStats.weaponLevel++; break;
            case 'health':
                this.playerHealth = Math.min(this.maxHealth, this.playerHealth + 50);
                this.hud.updateHealth(this.playerHealth, this.maxHealth);
                break;
            case 'circular': this.playerStats.circularLevel++; break;
            case 'burst': this.playerStats.burstLevel++; break;
            case 'beam': this.playerStats.beamLevel++; break;
        }
    }

    handlePlayerDamage(player, enemy) {
        this.soundManager.playTone(100, 'sawtooth', 0.3, -50); // Deep hurt sound
        enemy.destroy();
        this.playerHealth -= 12; // Increased damage (+20%)
        this.hud.updateHealth(this.playerHealth, this.maxHealth);
        this.cameras.main.shake(200, 0.02); // Strong shake on hurt

        this.tweens.add({
            targets: this.player,
            alpha: 0.2,
            duration: 100,
            yoyo: true,
            repeat: 5
        });

        // Blood particles? 
        this.createExplosion(this.player.x, this.player.y, 0xff0000);

        if (this.playerHealth <= 0) {
            this.scene.start('GameOverScene', {
                time: this.gameTime,
                level: this.playerLevel,
                kills: this.hud.killCount
            });
            this.scene.stop('GameScene');
        }
    }

    update(time, delta) {
        if (!this.hasLoggedUpdate) {
            console.log('GameScene: update() running');
            this.hasLoggedUpdate = true;
        }

        // Use NUCLEAR inputs
        const keys = window.inputs || { up: false, down: false, left: false, right: false };

        if (!this.player || !this.player.body) return;

        // Ensure stats exist
        const maxSpeed = (this.playerStats && this.playerStats.moveSpeed) ? this.playerStats.moveSpeed : 300;
        const body = this.player.body;

        // ACCELERATION BASED MOVEMENT (ULTRA RESPONSIVE - SENSITIVE)
        const acceleration = 6000; // Instant torque
        const drag = 3500;         // Instant grip

        body.setDrag(drag);
        body.setMaxVelocity(maxSpeed);

        let moveX = 0;
        let moveY = 0;

        // Check Input
        if (keys.up) moveY = -1;
        else if (keys.down) moveY = 1;

        if (keys.left) moveX = -1;
        else if (keys.right) moveX = 1;

        // Apply Movement
        if (moveX !== 0 || moveY !== 0) {
            // Normalize
            const angle = Math.atan2(moveY, moveX);
            const accelX = Math.cos(angle) * acceleration;
            const accelY = Math.sin(angle) * acceleration;

            body.setAcceleration(accelX, accelY);

            // Rotation (Rotate towards movement direction, but smoother)
            // Increased sensitivity significantly (0.1 -> 0.3)
            const targetRotation = angle + Math.PI / 2;
            this.player.rotation = Phaser.Math.Angle.RotateTo(
                this.player.rotation,
                targetRotation,
                0.3 // Fast rotation
            );
        } else {
            body.setAcceleration(0);
        }

        // Parallax Background
        if (this.bgStars1 && this.bgStars2) {
            this.bgStars1.tilePositionX = this.cameras.main.scrollX * 0.3;
            this.bgStars1.tilePositionY = this.cameras.main.scrollY * 0.3;

            this.bgStars2.tilePositionX = this.cameras.main.scrollX * 0.6;
            this.bgStars2.tilePositionY = this.cameras.main.scrollY * 0.6;
        }

        // Camera Follow Polish
        this.cameras.main.setLerp(0.1, 0.1);

        // Enemy AI
        this.enemies.getChildren().forEach(enemy => {
            if (enemy.active) {
                this.physics.moveToObject(enemy, this.player, enemy.speed || 150);
                enemy.rotation = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y) + Math.PI / 2;
            }
        });
    }

    createAmbientEmbers(worldSize) {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffaa00, 0.4);
        graphics.fillCircle(2, 2, 2);
        graphics.generateTexture('ember', 4, 4);
        graphics.destroy();

        this.add.particles(0, 0, 'ember', {
            x: { min: 0, max: worldSize },
            y: { min: 0, max: worldSize },
            speed: { min: 5, max: 20 },
            gravityY: -10,
            scale: { start: 0.5, end: 1.5 },
            alpha: { start: 0.4, end: 0 },
            lifespan: 4000,
            frequency: 200,
            blendMode: 'ADD'
        });
    }

    createAmbientFog(worldSize) {
        const graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 0.05);
        graphics.fillCircle(30, 30, 30);
        graphics.generateTexture('fog', 60, 60);
        graphics.destroy();

        this.add.particles(0, 0, 'fog', {
            x: { min: 0, max: worldSize },
            y: { min: 0, max: worldSize },
            speed: { min: 2, max: 10 },
            scale: { start: 2, end: 5 },
            alpha: { start: 0.05, end: 0 },
            lifespan: 10000,
            frequency: 500
        });
    }
}
