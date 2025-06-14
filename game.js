class AirplaneGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set browser title
        document.title = "Operation Rising Lion";
        
        // Game settings
        this.gameWidth = this.canvas.width;
        this.gameHeight = this.canvas.height;
        
        // Game states
        this.gameState = 'splash'; // 'splash', 'playing', 'paused'
        
        // Splash screen assets
        this.splashImage = null;
        this.startButtonImage = null;
        this.exitButtonImage = null;
        
        // Button properties - positioned to align with title
        this.startButton = {
            x: this.gameWidth / 6 - 85,    // Fine-tuned positioning under title center
            y: this.gameHeight / 2 + 100, // Lower middle area
            width: 200,
            height: 60,
            hovered: false
        };
        
        this.exitButton = {
            x: this.gameWidth / 6 - 85,    // Same X as start button
            y: this.gameHeight / 2 + 180, // Below start button
            width: 200,
            height: 60,
            hovered: false
        };
        
        // Airplane properties
        this.airplane = {
            x: this.gameWidth / 2 - 75 * 0.85, // Center horizontally for new size
            y: this.gameHeight - 170,    // Moved lower (was -200)
            width: 150 * 0.85,           // 3/4 of previous width
            height: 175 * 0.85,          // 3/4 of previous height
            speed: 5,
            image: null
        };
        
        // Rocket properties
        this.rockets = [];
        this.rocketSpeed = 8;
        this.canShoot = true;
        this.shootCooldown = 0;
        this.shootCooldownTime = 15; // frames between shots
        
        // Reactor properties
        this.reactors = [];
        this.reactorImage = null;
        this.damagedReactorImage = null;
        this.reactorSpawnTimer = 0;
        this.reactorSpawnInterval = 120; // Spawn every 2 seconds at 60fps
        this.lastReactorX = -200; // Track last reactor X position for spacing
        
        // Explosion effects
        this.explosions = [];
        
        // Game scoring
        this.score = 0;
        this.hitReactors = 0;
        this.destroyedReactors = 0;
        
        // Input handling
        this.keys = {};
        this.mousePos = { x: 0, y: 0 };
        
        // Background scrolling
        this.backgroundY = 0;
        this.backgroundSpeed = 2; // Increased speed for more dynamic gameplay
        
        // Asset loading
        this.assetsLoaded = false;
        this.loadingAssets = 0;
        this.totalAssets = 0;
        
        // Initialize game
        this.init();
    }
    
    init() {
        this.showLoadingScreen();
        this.loadAssets();
        this.setupEventListeners();
        this.initializeReactors();
    }
    
    showLoadingScreen() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = '20px Courier New';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading Assets...', this.gameWidth / 2, this.gameHeight / 2);
        this.ctx.textAlign = 'left';
    }
    
    loadAssets() {
        const assetsToLoad = [
            { key: 'splash', src: './assets/splash.png' },
            { key: 'start_button', src: './assets/start.png' },     // Changed from start_button.png
            { key: 'exit_button', src: './assets/exit.png' },       // Changed from exit_button.png
            { key: 'airplane', src: './assets/airplane.png' },
            { key: 'background', src: './assets/background.png' },
            { key: 'reactor', src: './assets/reactor.png' },
            { key: 'damaged_reactor', src: './assets/damaged_reactor.png' }
        ];
        
        this.totalAssets = assetsToLoad.length;
        this.loadingAssets = 0;
        
        assetsToLoad.forEach(asset => {
            const img = new Image();
            img.onload = () => {
                this.onAssetLoaded(asset.key, img);
            };
            img.onerror = () => {
                console.warn(`Failed to load ${asset.src}, using fallback`);
                this.onAssetLoadError(asset.key);
            };
            img.src = asset.src;
        });
    }
    
    onAssetLoaded(key, image) {
        this.loadingAssets++;
        
        if (key === 'splash') {
            this.splashImage = image;
        } else if (key === 'start_button') {
            this.startButtonImage = image;
        } else if (key === 'exit_button') {
            this.exitButtonImage = image;
        } else if (key === 'airplane') {
            this.airplane.image = image;
            // Scale to our desired 3/4 size
            this.airplane.width = Math.min(image.width * 1.5, 150) * 0.85;  // 3/4 of previous
            this.airplane.height = Math.min(image.height * 1.5, 175) * 0.85; // 3/4 of previous
        } else if (key === 'background') {
            this.backgroundImage = image;
        } else if (key === 'reactor') {
            this.reactorImage = image;
        } else if (key === 'damaged_reactor') {
            this.damagedReactorImage = image;
        }
        
        this.checkAssetsComplete();
    }
    
    onAssetLoadError(key) {
        this.loadingAssets++;
        
        if (key === 'splash') {
            console.log('Creating fallback splash screen');
            this.createSplashScreen();
        } else if (key === 'start_button') {
            console.log('Creating fallback start button');
            this.createStartButton();
        } else if (key === 'exit_button') {
            console.log('Creating fallback exit button');
            this.createExitButton();
        } else if (key === 'airplane') {
            console.log('Creating fallback airplane sprite');
            this.createAirplaneSprite();
        } else if (key === 'background') {
            console.log('Using procedural background');
            this.backgroundImage = null;
        } else if (key === 'reactor') {
            console.log('Creating fallback reactor sprite');
            this.createReactorSprite();
        } else if (key === 'damaged_reactor') {
            console.log('Creating fallback damaged reactor sprite');
            this.createDamagedReactorSprite();
        }
        
        this.checkAssetsComplete();
    }
    
    checkAssetsComplete() {
        if (this.loadingAssets >= this.totalAssets) {
            this.assetsLoaded = true;
            console.log('All assets loaded successfully');
            this.gameLoop();
        }
    }
    
    createSplashScreen() {
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = this.gameWidth;
        spriteCanvas.height = this.gameHeight;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Create gradient background
        const gradient = spriteCtx.createLinearGradient(0, 0, 0, this.gameHeight);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(0.5, '#003366');
        gradient.addColorStop(1, '#001122');
        spriteCtx.fillStyle = gradient;
        spriteCtx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Add title
        spriteCtx.fillStyle = '#00ff00';
        spriteCtx.font = 'bold 48px Courier New';
        spriteCtx.textAlign = 'center';
        spriteCtx.fillText('NUCLEAR STRIKE', this.gameWidth / 2, this.gameHeight / 2 - 100);
        
        spriteCtx.font = 'bold 24px Courier New';
        spriteCtx.fillText('AIRPLANE MISSION', this.gameWidth / 2, this.gameHeight / 2 - 50);
        
        this.splashImage = spriteCanvas;
    }
    
    createStartButton() {
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = this.startButton.width;
        spriteCanvas.height = this.startButton.height;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Button background
        spriteCtx.fillStyle = '#004400';
        spriteCtx.fillRect(0, 0, this.startButton.width, this.startButton.height);
        
        // Button border
        spriteCtx.strokeStyle = '#00ff00';
        spriteCtx.lineWidth = 3;
        spriteCtx.strokeRect(0, 0, this.startButton.width, this.startButton.height);
        
        // Button text
        spriteCtx.fillStyle = '#00ff00';
        spriteCtx.font = 'bold 24px Courier New';
        spriteCtx.textAlign = 'center';
        spriteCtx.fillText('START GAME', this.startButton.width / 2, this.startButton.height / 2 + 8);
        
        this.startButtonImage = spriteCanvas;
    }
    
    createExitButton() {
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = this.exitButton.width;
        spriteCanvas.height = this.exitButton.height;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Button background
        spriteCtx.fillStyle = '#440000';
        spriteCtx.fillRect(0, 0, this.exitButton.width, this.exitButton.height);
        
        // Button border
        spriteCtx.strokeStyle = '#ff0000';
        spriteCtx.lineWidth = 3;
        spriteCtx.strokeRect(0, 0, this.exitButton.width, this.exitButton.height);
        
        // Button text
        spriteCtx.fillStyle = '#ff0000';
        spriteCtx.font = 'bold 24px Courier New';
        spriteCtx.textAlign = 'center';
        spriteCtx.fillText('EXIT', this.exitButton.width / 2, this.exitButton.height / 2 + 8);
        
        this.exitButtonImage = spriteCanvas;
    }
    
    createAirplaneSprite() {
        // Fallback airplane sprite creation (same as before)
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = this.airplane.width;
        spriteCanvas.height = this.airplane.height;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Draw airplane body (main fuselage)
        spriteCtx.fillStyle = '#888888';
        spriteCtx.fillRect(20, 10, 10, 40);
        
        // Draw wings
        spriteCtx.fillStyle = '#666666';
        spriteCtx.fillRect(5, 25, 40, 8);
        
        // Draw nose
        spriteCtx.fillStyle = '#aaaaaa';
        spriteCtx.beginPath();
        spriteCtx.moveTo(25, 10);
        spriteCtx.lineTo(20, 0);
        spriteCtx.lineTo(30, 0);
        spriteCtx.closePath();
        spriteCtx.fill();
        
        // Draw tail
        spriteCtx.fillStyle = '#666666';
        spriteCtx.fillRect(18, 45, 14, 8);
        
        // Add some details (engines)
        spriteCtx.fillStyle = '#444444';
        spriteCtx.fillRect(12, 28, 4, 4);
        spriteCtx.fillRect(34, 28, 4, 4);
        
        this.airplane.image = spriteCanvas;
    }
    
    createReactorSprite() {
        // Create fallback reactor sprite
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = 120 * 1.3; // 1.3x larger
        spriteCanvas.height = 120 * 1.3; // 1.3x larger
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Draw reactor building base (scaled up)
        spriteCtx.fillStyle = '#444444';
        spriteCtx.fillRect(20 * 1.3, 60 * 1.3, 80 * 1.3, 50 * 1.3); // 1.3x larger
        
        // Draw cooling towers (scaled up)
        spriteCtx.fillStyle = '#666666';
        spriteCtx.fillRect(30 * 1.3, 20 * 1.3, 24 * 1.3, 60 * 1.3); // 1.3x larger
        spriteCtx.fillRect(66 * 1.3, 20 * 1.3, 24 * 1.3, 60 * 1.3); // 1.3x larger
        
        // Draw reactor core (glowing center, scaled up)
        spriteCtx.fillStyle = '#ff4444';
        spriteCtx.fillRect(50 * 1.3, 70 * 1.3, 20 * 1.3, 20 * 1.3); // 1.3x larger
        
        // Add glow effect (scaled up)
        spriteCtx.fillStyle = '#ff6666';
        spriteCtx.fillRect(54 * 1.3, 74 * 1.3, 12 * 1.3, 12 * 1.3); // 1.3x larger
        
        // Add warning stripes (scaled up)
        spriteCtx.fillStyle = '#ffff00';
        for (let i = 0; i < 3; i++) {
            spriteCtx.fillRect((24 + i * 16) * 1.3, 100 * 1.3, 8 * 1.3, 4 * 1.3); // 1.3x larger
        }
        
        this.reactorImage = spriteCanvas;
    }
    
    createDamagedReactorSprite() {
        // Create fallback damaged reactor sprite
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = 120 * 1.3;  // 1.3x larger
        spriteCanvas.height = 120 * 1.3; // 1.3x larger
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Draw damaged reactor building base
        spriteCtx.fillStyle = '#222222';
        spriteCtx.fillRect(20 * 1.3, 60 * 1.3, 80 * 1.3, 50 * 1.3); // 1.3x larger
        
        // Draw damaged/cracked cooling towers
        spriteCtx.fillStyle = '#444444';
        spriteCtx.fillRect(30 * 1.3, 20 * 1.3, 24 * 1.3, 60 * 1.3); // 1.3x larger
        spriteCtx.fillRect(66 * 1.3, 20 * 1.3, 24 * 1.3, 60 * 1.3); // 1.3x larger
        
        // Add cracks
        spriteCtx.strokeStyle = '#111111';
        spriteCtx.lineWidth = 2 * 1.3; // 1.3x larger
        spriteCtx.beginPath();
        spriteCtx.moveTo(35 * 1.3, 25 * 1.3);
        spriteCtx.lineTo(45 * 1.3, 75 * 1.3);
        spriteCtx.moveTo(70 * 1.3, 30 * 1.3);
        spriteCtx.lineTo(80 * 1.3, 70 * 1.3);
        spriteCtx.stroke();
        
        // Draw damaged reactor core (dim)
        spriteCtx.fillStyle = '#664444';
        spriteCtx.fillRect(50 * 1.3, 70 * 1.3, 20 * 1.3, 20 * 1.3); // 1.3x larger
        
        // Add smoke effect
        spriteCtx.fillStyle = 'rgba(100, 100, 100, 0.7)';
        for (let i = 0; i < 5; i++) {
            spriteCtx.beginPath();
            spriteCtx.arc((60 + i * 8) * 1.3, (15 - i * 2) * 1.3, (3 + i) * 1.3, 0, Math.PI * 2);
            spriteCtx.fill();
        }
        
        this.damagedReactorImage = spriteCanvas;
    }
    
    initializeReactors() {
        // Create initial reactors scattered around with proper spacing
        for (let i = 0; i < 3; i++) {
            this.spawnReactor(i * -200); // More spacing initially
        }
    }
    
    spawnReactor(customY = null) {
        let x;
        let attempts = 0;
        
        // Try to find a good X position that doesn't overlap
        do {
            x = Math.random() * (this.gameWidth - 120 * 1.3); // Account for larger size
            attempts++;
        } while (Math.abs(x - this.lastReactorX) < 150 * 1.3 && attempts < 10); // Increased spacing for larger size
        
        this.lastReactorX = x;
        
        const reactor = {
            x: x,
            y: customY !== null ? customY : -120 * 1.3, // Account for larger size
            width: 120 * 1.3,  // 1.3x larger
            height: 120 * 1.3, // 1.3x larger
            speed: this.backgroundSpeed,
            destroyed: false,
            damaged: false,
            glowPhase: Math.random() * Math.PI * 2
        };
        
        this.reactors.push(reactor);
    }
    
    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle shooting
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault(); // Prevent page scrolling
                this.shootRocket();
            }
            
            // Handle Escape key - return to splash screen
            if (e.code === 'Escape' && this.gameState === 'playing') {
                this.gameState = 'splash';
                this.resetGame();
                console.log('Returned to splash screen');
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse events for splash screen
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
            
            if (this.gameState === 'splash') {
                this.updateButtonHover();
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'splash') {
                this.handleSplashClick();
            }
        });
    }
    
    updateButtonHover() {
        // Check start button hover
        this.startButton.hovered = this.isPointInButton(this.mousePos, this.startButton);
        
        // Check exit button hover
        this.exitButton.hovered = this.isPointInButton(this.mousePos, this.exitButton);
        
        // Change cursor style
        this.canvas.style.cursor = (this.startButton.hovered || this.exitButton.hovered) ? 'pointer' : 'default';
    }
    
    isPointInButton(point, button) {
        return point.x >= button.x && 
               point.x <= button.x + button.width &&
               point.y >= button.y && 
               point.y <= button.y + button.height;
    }
    
    handleSplashClick() {
        if (this.startButton.hovered) {
            this.gameState = 'playing';
            this.initializeReactors();
            console.log('Game Started!');
        } else if (this.exitButton.hovered) {
            // In a real game, this would close the window
            // For web, we'll just show an alert
            alert('Thanks for playing!');
            console.log('Exit button clicked');
        }
    }
    
    update() {
        if (this.gameState !== 'playing' || !this.assetsLoaded) return;
        
        this.updateBackground();
        this.updateAirplane();
        this.updateRockets();
        this.updateReactors();
        this.updateExplosions();
        this.checkCollisions();
        this.updateCooldowns();
    }
    
    updateBackground() {
        // Scroll background to create movement effect
        this.backgroundY += this.backgroundSpeed;
        if (this.backgroundY >= (this.backgroundImage ? this.backgroundImage.height : 100)) {
            this.backgroundY = 0;
        }
    }
    
    updateAirplane() {
        // Handle airplane movement
        if (this.keys['ArrowLeft'] && this.airplane.x > 0) {
            this.airplane.x -= this.airplane.speed;
        }
        
        if (this.keys['ArrowRight'] && this.airplane.x < this.gameWidth - this.airplane.width) {
            this.airplane.x += this.airplane.speed;
        }
        
        // Optional: Allow vertical movement within a limited range
        if (this.keys['ArrowUp'] && this.airplane.y > this.gameHeight - 150) {
            this.airplane.y -= this.airplane.speed * 0.5;
        }
        
        if (this.keys['ArrowDown'] && this.airplane.y < this.gameHeight - 60) {
            this.airplane.y += this.airplane.speed * 0.5;
        }
        
        // Handle shooting
        if (this.keys['Space'] && this.canShoot) {
            this.shootRocket();
        }
    }
    
    updateRockets() {
        // Update existing rockets
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const rocket = this.rockets[i];
            rocket.y -= this.rocketSpeed;
            
            // Remove rockets that are off screen
            if (rocket.y < -10) {
                this.rockets.splice(i, 1);
            }
        }
    }
    
    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const explosion = this.explosions[i];
            explosion.age++;
            explosion.radius += 2;
            explosion.opacity -= 0.02;
            
            // Remove old explosions
            if (explosion.age > 50 || explosion.opacity <= 0) {
                this.explosions.splice(i, 1);
            }
        }
    }
    
    updateCooldowns() {
        if (this.shootCooldown > 0) {
            this.shootCooldown--;
        }
        if (this.shootCooldown === 0) {
            this.canShoot = true;
        }
    }
    
    checkCollisions() {
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const rocket = this.rockets[i];
            
            for (let j = 0; j < this.reactors.length; j++) {
                const reactor = this.reactors[j];
                
                if (reactor.destroyed) continue;
                
                // AABB collision detection
                if (rocket.x < reactor.x + reactor.width &&
                    rocket.x + rocket.width > reactor.x &&
                    rocket.y < reactor.y + reactor.height &&
                    rocket.y + rocket.height > reactor.y) {
                    
                    // Remove rocket
                    this.rockets.splice(i, 1);
                    
                    // Create explosion
                    this.createExplosion(
                        reactor.x + reactor.width / 2,
                        reactor.y + reactor.height / 2
                    );
                    
                    // Handle reactor damage
                    if (!reactor.damaged) {
                        // First hit - damage the reactor
                        reactor.damaged = true;
                        reactor.hits = 1;
                        this.score += 1; // 1 point for first hit
                        this.hitReactors++;
                        console.log(`Reactor damaged! Score: ${this.score}`);
                    } else {
                        // Second hit - destroy the reactor
                        reactor.destroyed = true;
                        reactor.hits = 2;
                        this.score += 2; // 2 points for destruction
                        this.destroyedReactors++;
                        console.log(`Reactor destroyed! Score: ${this.score}`);
                    }
                    
                    break; // Exit reactor loop since rocket is gone
                }
            }
        }
    }
    
    createExplosion(x, y) {
        const explosion = {
            x: x,
            y: y,
            radius: 5,
            maxRadius: 60,
            opacity: 1,
            age: 0,
            colors: ['#ff4444', '#ff8844', '#ffaa44', '#ffff44']
        };
        this.explosions.push(explosion);
    }
    
    shootRocket() {
        const rocket = {
            x: this.airplane.x + this.airplane.width / 2 - 2,
            y: this.airplane.y,
            width: 4,
            height: 12,
            speed: this.rocketSpeed
        };
        
        this.rockets.push(rocket);
        this.canShoot = false;
        this.shootCooldown = this.shootCooldownTime;
    }
    
    updateReactors() {
        // Update reactor spawning
        this.reactorSpawnTimer++;
        if (this.reactorSpawnTimer >= this.reactorSpawnInterval) {
            this.spawnReactor();
            this.reactorSpawnTimer = 0;
        }
        
        // Update existing reactors
        for (let i = this.reactors.length - 1; i >= 0; i--) {
            const reactor = this.reactors[i];
            
            // Move reactor down
            reactor.y += reactor.speed;
            
            // Update glow animation
            reactor.glowPhase += 0.1;
            
            // Remove reactors that are off screen
            if (reactor.y > this.gameHeight + 120) {
                this.reactors.splice(i, 1);
            }
        }
    }
    
    render() {
        if (!this.assetsLoaded) {
            this.showLoadingScreen();
            return;
        }
        
        if (this.gameState === 'splash') {
            this.renderSplashScreen();
        } else if (this.gameState === 'playing') {
            this.renderGame();
        }
    }
    
    renderSplashScreen() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Draw splash background
        if (this.splashImage) {
            this.ctx.drawImage(this.splashImage, 0, 0, this.gameWidth, this.gameHeight);
        }
        
        // Draw start button
        if (this.startButtonImage) {
            // Add glow effect if hovered
            if (this.startButton.hovered) {
                this.ctx.shadowColor = '#00ff00';
                this.ctx.shadowBlur = 10;
            }
            
            this.ctx.drawImage(
                this.startButtonImage,
                this.startButton.x,
                this.startButton.y,
                this.startButton.width,
                this.startButton.height
            );
            
            this.ctx.shadowBlur = 0;
        }
        
        // Draw exit button
        if (this.exitButtonImage) {
            // Add glow effect if hovered
            if (this.exitButton.hovered) {
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 10;
            }
            
            this.ctx.drawImage(
                this.exitButtonImage,
                this.exitButton.x,
                this.exitButton.y,
                this.exitButton.width,
                this.exitButton.height
            );
            
            this.ctx.shadowBlur = 0;
        }
    }
    
    renderGame() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Draw scrolling background
        this.drawBackground();
        
        // Draw reactors
        this.drawReactors();
        
        // Draw rockets
        this.drawRockets();
        
        // Draw explosions
        this.drawExplosions();
        
        // Draw airplane
        this.drawAirplane();
        
        // Draw UI elements
        this.drawUI();
    }
    
    drawBackground() {
        if (this.backgroundImage) {
            // Draw tiled background image
            const bgHeight = this.backgroundImage.height;
            const bgWidth = this.backgroundImage.width;
            
            // Calculate how many tiles we need
            const tilesX = Math.ceil(this.gameWidth / bgWidth);
            const tilesY = Math.ceil((this.gameHeight + bgHeight) / bgHeight);
            
            for (let x = 0; x < tilesX; x++) {
                for (let y = -1; y < tilesY; y++) {
                    this.ctx.drawImage(
                        this.backgroundImage,
                        x * bgWidth,
                        y * bgHeight + this.backgroundY,
                        bgWidth,
                        bgHeight
                    );
                }
            }
        } else {
            // Fallback to procedural background
            this.drawProceduralBackground();
        }
    }
    
    drawProceduralBackground() {
        // Create a scrolling grid pattern to simulate movement
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        // Vertical lines
        for (let x = 0; x < this.gameWidth; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.gameHeight);
            this.ctx.stroke();
        }
        
        // Horizontal lines (scrolling)
        for (let y = -100; y < this.gameHeight + 100; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y + this.backgroundY);
            this.ctx.lineTo(this.gameWidth, y + this.backgroundY);
            this.ctx.stroke();
        }
        
        // Add some cloud-like effects
        this.drawClouds();
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        
        // Static clouds for now (can be made dynamic later)
        const clouds = [
            { x: 100, y: 100 + this.backgroundY * 0.5, size: 30 },
            { x: 300, y: 200 + this.backgroundY * 0.3, size: 40 },
            { x: 500, y: 150 + this.backgroundY * 0.4, size: 25 },
            { x: 700, y: 80 + this.backgroundY * 0.6, size: 35 }
        ];
        
        clouds.forEach(cloud => {
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y % (this.gameHeight + 100), cloud.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }
    
    drawReactors() {
        this.reactors.forEach(reactor => {
            if (reactor.destroyed) return;
            
            // Draw glow effect
            const glowIntensity = (Math.sin(reactor.glowPhase) + 1) * 0.3 + 0.4;
            this.ctx.shadowColor = `rgba(255, 68, 68, ${glowIntensity})`;
            this.ctx.shadowBlur = 15;
            
            // Choose appropriate image based on reactor state
            const image = reactor.damaged ? 
                (this.damagedReactorImage || this.reactorImage) : 
                this.reactorImage;
            
            if (image) {
                this.ctx.drawImage(
                    image,
                    reactor.x,
                    reactor.y,
                    reactor.width,
                    reactor.height
                );
            }
            
            // Reset shadow
            this.ctx.shadowBlur = 0;
            
            // Add warning indicator
            this.ctx.fillStyle = `rgba(255, 255, 0, ${glowIntensity})`;
            this.ctx.font = '12px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('☢', reactor.x + reactor.width / 2, reactor.y - 5);
            this.ctx.textAlign = 'left';
        });
    }
    
    drawRockets() {
        this.ctx.fillStyle = '#ffff00';
        this.rockets.forEach(rocket => {
            // Draw rocket body
            this.ctx.fillRect(rocket.x, rocket.y, rocket.width, rocket.height);
            
            // Add rocket glow
            this.ctx.shadowColor = '#ffff00';
            this.ctx.shadowBlur = 5;
            this.ctx.fillRect(rocket.x, rocket.y, rocket.width, rocket.height);
            this.ctx.shadowBlur = 0;
        });
    }
    
    drawExplosions() {
        this.explosions.forEach(explosion => {
            const progress = explosion.age / 50;
            
            // Draw multiple explosion rings
            for (let i = 0; i < explosion.colors.length; i++) {
                this.ctx.globalAlpha = explosion.opacity * (1 - i * 0.2);
                this.ctx.fillStyle = explosion.colors[i];
                
                const ringRadius = explosion.radius - i * 8;
                if (ringRadius > 0) {
                    this.ctx.beginPath();
                    this.ctx.arc(explosion.x, explosion.y, ringRadius, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawAirplane() {
        if (this.airplane.image) {
            // Add a stronger glow effect
            this.ctx.shadowColor = 'rgba(0, 255, 0, 0.7)'; // Changed from cyan to green and increased opacity
            this.ctx.shadowBlur = 15; // Increased from 5
            this.ctx.drawImage(
                this.airplane.image,
                this.airplane.x,
                this.airplane.y,
                this.airplane.width,
                this.airplane.height
            );
            
            // Add a second glow layer for more intensity
            this.ctx.shadowColor = 'rgba(0, 255, 0, 0.4)';
            this.ctx.shadowBlur = 25;
            this.ctx.drawImage(
                this.airplane.image,
                this.airplane.x,
                this.airplane.y,
                this.airplane.width,
                this.airplane.height
            );
            
            this.ctx.shadowBlur = 0;
        }
    }
    
    drawUI() {
        // Draw simplified scoreboard with dark background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, 120, 40);
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, 120, 40);
        
        // Draw only the score
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        this.ctx.font = '16px Courier New';
        this.ctx.fillText(`SCORE: ${this.score}`, 20, 35);
        
        // Show loading progress if still loading
        if (!this.assetsLoaded) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            this.ctx.font = '16px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Loading... ${this.loadingAssets}/${this.totalAssets}`, this.gameWidth / 2, this.gameHeight / 2 + 30);
            this.ctx.textAlign = 'left';
        }
    }
    
    resetGame() {
        // Reset game state when returning to splash
        this.score = 0;
        this.hitReactors = 0;
        this.destroyedReactors = 0;
        this.rockets = [];
        this.reactors = [];
        this.explosions = [];
        this.backgroundY = 0;
        this.reactorSpawnTimer = 0;
        this.lastReactorX = -200;
        this.shootCooldown = 0;
        this.canShoot = true;
        
        // Reset airplane position
        this.airplane.x = this.gameWidth / 2 - 75 * 0.75;
        this.airplane.y = this.gameHeight - 150;
        
        console.log('Game reset complete');
    }
    
    gameLoop() {
        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new AirplaneGame();
}); 