class AirplaneGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Set browser title
        document.title = "Operation Rising Lion - v1.0.1";
        
        // Check if device is mobile
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Add mobile viewport if on mobile
        if (this.isMobile) {
            let viewport = document.querySelector('meta[name=viewport]');
            if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                document.head.appendChild(viewport);
            }
            viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
        }
        
        // Adjust canvas size for mobile (vertical orientation)
        if (this.isMobile) {
            // Simple mobile setup - vertical orientation
            this.setupMobileGame();
        }
        
        // Game settings
        this.gameWidth = this.canvas.width;
        this.gameHeight = this.canvas.height;
        
        // Game states
        this.gameState = 'splash'; // 'splash', 'playing', 'paused', 'gameOver', 'topScores', 'nameInput'
        
        // Splash screen assets
        this.splashImage = null;
        this.startButtonImage = null;
        this.topScoresButtonImage = null;
        
        // Button properties - will be set properly in updateMobilePositions for mobile
        if (this.isMobile) {
            // Initialize with placeholder values - will be updated in setupMobileCanvas
            this.startButton = { x: 0, y: 0, width: 200, height: 50, hovered: false };
            this.topScoresButton = { x: 0, y: 0, width: 200, height: 50, hovered: false };
        } else {
            // Desktop layout (original positioning)
            this.startButton = {
                x: this.gameWidth / 6 - 85,
                y: this.gameHeight / 2 + 100,
                width: 200,
                height: 60,
                hovered: false
            };
            
            this.topScoresButton = {
                x: this.gameWidth / 6 - 85,
                y: this.gameHeight / 2 + 180,
                width: 200,
                height: 60,
                hovered: false
            };
        }
        
        // High scores system
        this.highScores = [];
        this.isNewHighScore = false;
        
        // Initialize Supabase (replace with your actual URL and key)
        this.supabase = null;
        this.initializeSupabase();
        
        // Name input system
        this.playerNameInput = '';
        this.nameInputCursor = 0;
        this.nameInputBlinkTime = 0;
        this.maxNameLength = 12;
        this.virtualKeyboard = this.createVirtualKeyboard();
        
        // Airplane properties - adjust for mobile
        if (this.isMobile) {
            this.airplane = {
                x: this.gameWidth / 2 - 50,
                y: this.gameHeight - 120,
                width: 100,
                height: 120,
                speed: 4,
                image: null
            };
        } else {
            this.airplane = {
                x: this.gameWidth / 2 - 75 * 0.85,
                y: this.gameHeight - 170,
                width: 150 * 0.85,
                height: 175 * 0.85,
                speed: 5,
                image: null
            };
        }
        
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
        
        // Anti-aircraft gun properties
        this.aaGuns = [];
        this.aaGunImage = null;
        this.aaGunImageFlipped = null;
        this.aaGunSpawnTimer = 0;
        this.aaGunSpawnInterval = 180; // Spawn every 3 seconds at 60fps
        this.aaGunsEnabled = false; // Enable when score >= 10
        
        // AA gun bullets
        this.aaGunBullets = [];
        this.aaGunBulletSpeed = 4;
        
        // Explosion effects
        this.explosions = [];
        
        // Game scoring
        this.score = 0;
        this.hitReactors = 0;
        this.destroyedReactors = 0;
        
        // Health system
        this.maxHealth = 5;
        this.currentHealth = 5;
        this.gameOverTime = 0;
        this.gameOverDuration = 3000; // 3 seconds
        
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
        
        // Music system
        this.backgroundMusic = null;
        this.explosionSound = null;
        this.isMusicMuted = false;
        this.musicButton = {
            x: 10,
            y: this.gameHeight - 40,
            width: 80,
            height: 30,
            hovered: false
        };
        
        // Initialize game
        this.init();
    }
    
    init() {
        this.showLoadingScreen();
        this.loadAssets();
        this.loadMusic();
        this.setupEventListeners();
        this.initializeReactors();
    }
    
    setupMobileGame() {
        // Set up vertical mobile game
        this.setupMobileCanvas();
        
        // Handle orientation and resize
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.setupMobileCanvas(), 500);
        });
        
        window.addEventListener('resize', () => {
            if (this.isMobile) {
                setTimeout(() => this.setupMobileCanvas(), 100);
            }
        });
    }
    
    setupMobileCanvas() {
        if (!this.isMobile) return;
        
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Set up vertical mobile canvas - prioritize height
        this.canvas.width = Math.min(screenWidth - 20, 400);
        this.canvas.height = Math.min(screenHeight - 100, 700);
        
        // Ensure good vertical proportions
        if (this.canvas.height < this.canvas.width * 1.5) {
            this.canvas.height = this.canvas.width * 1.8; // Make it taller
        }
        
        // Style the canvas for mobile
        this.canvas.style.width = this.canvas.width + 'px';
        this.canvas.style.height = this.canvas.height + 'px';
        this.canvas.style.display = 'block';
        this.canvas.style.margin = '10px auto';
        this.canvas.style.border = '2px solid #00ff00';
        this.canvas.style.borderRadius = '8px';
        this.canvas.style.background = '#000';
        this.canvas.style.touchAction = 'none'; // Prevent browser gestures
        
        // Update game dimensions
        this.gameWidth = this.canvas.width;
        this.gameHeight = this.canvas.height;
        
        // Recalculate positions for vertical layout
        this.updateMobilePositions();
        
        console.log(`Mobile canvas setup: ${this.canvas.width}x${this.canvas.height}`);
    }
    
    updateMobilePositions() {
        if (!this.isMobile) return;
        
        // Button sizing for mobile vertical layout
        const buttonWidth = Math.min(200, this.gameWidth - 40);
        const buttonHeight = 50;
        
        // Position buttons in lower portion of vertical screen
        this.startButton.x = (this.gameWidth - buttonWidth) / 2;
        this.startButton.y = this.gameHeight * 0.7; // 70% down the screen
        this.startButton.width = buttonWidth;
        this.startButton.height = buttonHeight;
        
        this.topScoresButton.x = (this.gameWidth - buttonWidth) / 2;
        this.topScoresButton.y = this.gameHeight * 0.7 + 70; // Below start button
        this.topScoresButton.width = buttonWidth;
        this.topScoresButton.height = buttonHeight;
        
        // Airplane positioned at bottom for vertical gameplay
        this.airplane.x = this.gameWidth / 2 - this.airplane.width / 2;
        this.airplane.y = this.gameHeight - 100; // Near bottom
        
        console.log(`Mobile positions updated - airplane: (${this.airplane.x}, ${this.airplane.y})`);
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
            { key: 'top_scores_button', src: './assets/top.png' },  // Top scores button
            { key: 'airplane', src: './assets/airplane.png' },
            { key: 'background', src: './assets/background.png' },
            { key: 'reactor', src: './assets/reactor.png' },
            { key: 'damaged_reactor', src: './assets/damaged_reactor.png' },
            { key: 'aa_gun', src: './assets/gun.png' }
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
    
    loadMusic() {
        try {
            this.backgroundMusic = new Audio('./assets/music.mp3');
            this.backgroundMusic.loop = true;
            this.backgroundMusic.volume = 0.5; // Set volume to 50%
            this.backgroundMusic.preload = 'auto';
            
            // Handle loading errors
            this.backgroundMusic.addEventListener('error', (e) => {
                console.warn('Music file not found: ./assets/music.mp3');
                console.log('To add music: place a music file named "music.mp3" in the assets folder');
                this.backgroundMusic = null;
                this.isMusicMuted = true; // Auto-mute if no music file
            });
            
            // Handle loading success
            this.backgroundMusic.addEventListener('loadeddata', () => {
                console.log('Background music loaded successfully');
            });
            
            // Handle can play through
            this.backgroundMusic.addEventListener('canplaythrough', () => {
                console.log('Background music ready to play');
            });
            
            console.log('Attempting to load music from: ./assets/music.mp3');
        } catch (error) {
            console.error('Error creating Audio object:', error);
            this.backgroundMusic = null;
        }
        
        // Load explosion sound effect
        try {
            this.explosionSound = new Audio('./assets/explosion.mp3');
            this.explosionSound.volume = 0.7; // Slightly louder than music
            this.explosionSound.preload = 'auto';
            
            this.explosionSound.addEventListener('error', (e) => {
                console.warn('Explosion sound not found: ./assets/explosion.mp3');
                this.explosionSound = null;
            });
            
            this.explosionSound.addEventListener('loadeddata', () => {
                console.log('Explosion sound loaded successfully');
            });
            
            console.log('Attempting to load explosion sound from: ./assets/explosion.mp3');
        } catch (error) {
            console.error('Error loading explosion sound:', error);
            this.explosionSound = null;
        }
    }
    
    onAssetLoaded(key, image) {
        this.loadingAssets++;
        
        if (key === 'splash') {
            this.splashImage = image;
        } else if (key === 'start_button') {
            this.startButtonImage = image;
        } else if (key === 'top_scores_button') {
            this.topScoresButtonImage = image;
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
        } else if (key === 'aa_gun') {
            // Scale AA gun to be 3/4 the size of reactors
            this.scaleAAGunToReactorSize(image);
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
        } else if (key === 'top_scores_button') {
            console.log('Creating fallback top scores button');
            this.createTopScoresButton();

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
        } else if (key === 'aa_gun') {
            console.log('Failed to load gun.png - AA guns will be disabled');
            this.aaGunImage = null;
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
        
        // Add title - adjust size for mobile
        spriteCtx.fillStyle = '#00ff00';
        if (this.isMobile) {
            spriteCtx.font = 'bold 28px Courier New';
            spriteCtx.textAlign = 'center';
            spriteCtx.fillText('NUCLEAR STRIKE', this.gameWidth / 2, this.gameHeight / 2 - 150);
            
            spriteCtx.font = 'bold 18px Courier New';
            spriteCtx.fillText('AIRPLANE MISSION', this.gameWidth / 2, this.gameHeight / 2 - 120);
            
            // Add mobile instructions
            spriteCtx.fillStyle = '#ffff00';
            spriteCtx.font = 'bold 14px Courier New';
            spriteCtx.fillText('MOBILE CONTROLS:', this.gameWidth / 2, this.gameHeight * 0.5);
            
            spriteCtx.font = '12px Courier New';
            spriteCtx.fillStyle = '#ffffff';
            spriteCtx.fillText('• TAP to shoot missiles', this.gameWidth / 2, this.gameHeight * 0.5 + 25);
            spriteCtx.fillText('• SWIPE LEFT/RIGHT to move', this.gameWidth / 2, this.gameHeight * 0.5 + 45);
            spriteCtx.fillText('• DODGE AA gun bullets!', this.gameWidth / 2, this.gameHeight * 0.5 + 65);
            spriteCtx.fillText('• Hit reactors twice to destroy', this.gameWidth / 2, this.gameHeight * 0.5 + 85);
                } else {
        spriteCtx.font = 'bold 48px Courier New';
        spriteCtx.textAlign = 'center';
        spriteCtx.fillText('NUCLEAR STRIKE', this.gameWidth / 2, this.gameHeight / 2 - 150);
        
        spriteCtx.font = 'bold 24px Courier New';
        spriteCtx.fillText('AIRPLANE MISSION', this.gameWidth / 2, this.gameHeight / 2 - 100);
        
        // Add desktop instructions - positioned higher and more visible
        spriteCtx.fillStyle = '#ffff00';
        spriteCtx.font = 'bold 18px Courier New';
        spriteCtx.fillText('DESKTOP CONTROLS:', this.gameWidth / 2, this.gameHeight / 2 - 50);
        
        spriteCtx.font = 'bold 16px Courier New';
        spriteCtx.fillStyle = '#00ff00';
        spriteCtx.fillText('↑↓←→ ARROW KEYS to move (UP/DOWN to dodge!)', this.gameWidth / 2, this.gameHeight / 2 - 20);
        spriteCtx.fillText('SPACE to shoot missiles', this.gameWidth / 2, this.gameHeight / 2 + 5);
        
        spriteCtx.fillStyle = '#ff4444';
        spriteCtx.fillText('DODGE red AA gun bullets!', this.gameWidth / 2, this.gameHeight / 2 + 30);
        
        spriteCtx.fillStyle = '#ffffff';
        spriteCtx.fillText('Hit reactors twice to destroy', this.gameWidth / 2, this.gameHeight / 2 + 55);
        }
        
        this.splashImage = spriteCanvas;
    }
    
    createStartButton() {
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = this.startButton.width;
        spriteCanvas.height = this.startButton.height;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Button background - brighter for mobile
        spriteCtx.fillStyle = this.isMobile ? '#006600' : '#004400';
        spriteCtx.fillRect(0, 0, this.startButton.width, this.startButton.height);
        
        // Button border - thicker for mobile
        spriteCtx.strokeStyle = '#00ff00';
        spriteCtx.lineWidth = this.isMobile ? 4 : 3;
        spriteCtx.strokeRect(0, 0, this.startButton.width, this.startButton.height);
        
        // Button text - adjust size for mobile
        spriteCtx.fillStyle = '#00ff00';
        const fontSize = this.isMobile ? Math.min(20, this.startButton.width / 10) : 24;
        spriteCtx.font = `bold ${fontSize}px Courier New`;
        spriteCtx.textAlign = 'center';
        spriteCtx.fillText('START GAME', this.startButton.width / 2, this.startButton.height / 2 + 8);
        
        this.startButtonImage = spriteCanvas;
    }
    
    createTopScoresButton() {
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = this.topScoresButton.width;
        spriteCanvas.height = this.topScoresButton.height;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Button background - gold/yellow theme for top scores
        spriteCtx.fillStyle = this.isMobile ? '#665500' : '#443300';
        spriteCtx.fillRect(0, 0, this.topScoresButton.width, this.topScoresButton.height);
        
        // Button border - thicker for mobile
        spriteCtx.strokeStyle = '#ffdd00';
        spriteCtx.lineWidth = this.isMobile ? 4 : 3;
        spriteCtx.strokeRect(0, 0, this.topScoresButton.width, this.topScoresButton.height);
        
        // Button text - adjust size for mobile
        spriteCtx.fillStyle = '#ffdd00';
        const fontSize = this.isMobile ? Math.min(18, this.topScoresButton.width / 12) : 20;
        spriteCtx.font = `bold ${fontSize}px Courier New`;
        spriteCtx.textAlign = 'center';
        spriteCtx.fillText('TOP SCORES', this.topScoresButton.width / 2, this.topScoresButton.height / 2 + 6);
        
        this.topScoresButtonImage = spriteCanvas;
    }
    
    // Supabase initialization
    async initializeSupabase() {
        try {
            let SUPABASE_URL, SUPABASE_ANON_KEY;

            // Try to get credentials from config file first (for local development)
            if (typeof CONFIG !== 'undefined' && CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_URL_HERE') {
                SUPABASE_URL = CONFIG.SUPABASE_URL;
                SUPABASE_ANON_KEY = CONFIG.SUPABASE_ANON_KEY;
                console.log('Using credentials from config.js');
            } else {
                // Fallback: Use placeholder values (will be replaced during deployment)
                SUPABASE_URL = '{{SUPABASE_URL}}';
                SUPABASE_ANON_KEY = '{{SUPABASE_ANON_KEY}}';
                
                // Check if placeholders were replaced (meaning we're in production)
                if (SUPABASE_URL.includes('{{') || SUPABASE_ANON_KEY.includes('{{')) {
                    console.error('Supabase credentials not configured for production deployment.');
                    this.highScores = [];
                    return;
                }
            }
            
            if (typeof supabase !== 'undefined') {
                this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log('Supabase initialized successfully');
                
                // Load high scores from database
                await this.loadHighScores();
            } else {
                console.error('Supabase library not loaded');
                this.highScores = [];
            }
        } catch (error) {
            console.error('Failed to initialize Supabase:', error);
            this.highScores = [];
        }
    }
    
    // High scores system methods
    async loadHighScores() {
        if (!this.supabase) {
            console.error('Supabase not initialized');
            this.highScores = [];
            return;
        }

        try {
            const { data, error } = await this.supabase
                .from('high_scores')
                .select('player_name, score, created_at')
                .order('score', { ascending: false })
                .limit(3);
            
            if (error) throw error;
            
            // Format data to match your existing structure
            this.highScores = data.map(score => ({
                name: score.player_name,
                score: score.score,
                date: new Date(score.created_at).toLocaleDateString()
            }));
            
            console.log('High scores loaded from Supabase:', this.highScores);
        } catch (error) {
            console.error('Failed to load high scores from Supabase:', error);
            this.highScores = [];
        }
    }
    
    async checkForHighScore() {
        // Refresh high scores from database first
        await this.loadHighScores();
        
        // Check if current score qualifies for top 3
        if (this.highScores.length < 3) {
            return true; // Always qualify if less than 3 scores
        }
        
        // Check if score is higher than the lowest high score
        const lowestHighScore = Math.min(...this.highScores.map(s => s.score));
        return this.score > lowestHighScore;
    }
    
    async addHighScore(playerName) {
        const cleanName = (playerName || '').trim() || 'Anonymous';
        
        if (!this.supabase) {
            console.error('Supabase not initialized, cannot save high score');
            return;
        }

        try {
            const { error } = await this.supabase
                .from('high_scores')
                .insert([{
                    player_name: cleanName,
                    score: this.score
                }]);
            
            if (error) throw error;
            
            console.log('High score saved to Supabase:', { name: cleanName, score: this.score });
            
            // Reload high scores from database to get updated leaderboard
            await this.loadHighScores();
        } catch (error) {
            console.error('Failed to save high score to Supabase:', error);
        }
    }
    
    promptForPlayerName() {
        // Switch to custom name input screen instead of using alert
        this.gameState = 'nameInput';
        this.playerNameInput = '';
        this.nameInputCursor = 0;
        this.nameInputBlinkTime = 0;
        console.log('Switched to name input screen for high score');
    }
    
    createVirtualKeyboard() {
        const keys = [
            ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
            ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
            ['Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
            ['SPACE', 'DONE', 'CANCEL']
        ];
        
        return keys.map((row, rowIndex) => 
            row.map((key, keyIndex) => ({
                key: key,
                x: 0, // Will be calculated in renderNameInput
                y: 0, // Will be calculated in renderNameInput
                width: key === 'SPACE' ? 120 : (key === 'DONE' || key === 'CANCEL' ? 80 : 35),
                height: 35,
                hovered: false,
                row: rowIndex,
                col: keyIndex
            }))
        );
    }
    
    async handleNameInput(key) {
        if (key === 'Enter' || key === 'DONE') {
            // Submit the name
            await this.addHighScore(this.playerNameInput || 'Anonymous');
            this.isNewHighScore = false;
            this.stopMusic();
            this.gameState = 'splash';
            this.resetGame();
        } else if (key === 'Escape' || key === 'CANCEL') {
            // Cancel - don't save high score
            this.isNewHighScore = false;
            this.stopMusic();
            this.gameState = 'splash';
            this.resetGame();
        } else if (key === 'Backspace' || key === '⌫') {
            // Remove last character
            if (this.playerNameInput.length > 0) {
                this.playerNameInput = this.playerNameInput.slice(0, -1);
            }
        } else if (key === 'SPACE') {
            // Add space
            if (this.playerNameInput.length < this.maxNameLength) {
                this.playerNameInput += ' ';
            }
        } else if (key.length === 1 && this.playerNameInput.length < this.maxNameLength) {
            // Add character (letters, numbers, spaces, basic punctuation)
            if (/[a-zA-Z0-9\s\-_.]/.test(key)) {
                this.playerNameInput += key;
            }
        }
    }
    
    handleVirtualKeyboardClick() {
        if (this.gameState !== 'nameInput') return;
        
        // Check which virtual key was clicked
        for (let row of this.virtualKeyboard) {
            for (let keyObj of row) {
                if (keyObj.hovered) {
                    this.handleNameInput(keyObj.key);
                    break;
                }
            }
        }
    }
    

    
    createAirplaneSprite() {
        // Fallback airplane sprite creation - scale for mobile
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = this.airplane.width;
        spriteCanvas.height = this.airplane.height;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Scale factor for mobile
        const scale = this.isMobile ? 0.7 : 1;
        const offsetX = this.isMobile ? this.airplane.width * 0.15 : 0;
        const offsetY = this.isMobile ? this.airplane.height * 0.1 : 0;
        
        // Draw airplane body (main fuselage)
        spriteCtx.fillStyle = '#888888';
        spriteCtx.fillRect(20 * scale + offsetX, 10 * scale + offsetY, 10 * scale, 40 * scale);
        
        // Draw wings
        spriteCtx.fillStyle = '#666666';
        spriteCtx.fillRect(5 * scale + offsetX, 25 * scale + offsetY, 40 * scale, 8 * scale);
        
        // Draw nose
        spriteCtx.fillStyle = '#aaaaaa';
        spriteCtx.beginPath();
        spriteCtx.moveTo(25 * scale + offsetX, 10 * scale + offsetY);
        spriteCtx.lineTo(20 * scale + offsetX, 0 * scale + offsetY);
        spriteCtx.lineTo(30 * scale + offsetX, 0 * scale + offsetY);
        spriteCtx.closePath();
        spriteCtx.fill();
        
        // Draw tail
        spriteCtx.fillStyle = '#666666';
        spriteCtx.fillRect(18 * scale + offsetX, 45 * scale + offsetY, 14 * scale, 8 * scale);
        
        // Add some details (engines)
        spriteCtx.fillStyle = '#444444';
        spriteCtx.fillRect(12 * scale + offsetX, 28 * scale + offsetY, 4 * scale, 4 * scale);
        spriteCtx.fillRect(34 * scale + offsetX, 28 * scale + offsetY, 4 * scale, 4 * scale);
        
        this.airplane.image = spriteCanvas;
    }
    
    createReactorSprite() {
        // Create fallback reactor sprite - adjust size for mobile
        const size = this.isMobile ? 80 : 120 * 1.3;
        const scale = this.isMobile ? 0.7 : 1.3;
        
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = size;
        spriteCanvas.height = size;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Draw reactor building base
        spriteCtx.fillStyle = '#444444';
        spriteCtx.fillRect(20 * scale, 60 * scale, 80 * scale, 50 * scale);
        
        // Draw cooling towers
        spriteCtx.fillStyle = '#666666';
        spriteCtx.fillRect(30 * scale, 20 * scale, 24 * scale, 60 * scale);
        spriteCtx.fillRect(66 * scale, 20 * scale, 24 * scale, 60 * scale);
        
        // Draw reactor core (glowing center)
        spriteCtx.fillStyle = '#ff4444';
        spriteCtx.fillRect(50 * scale, 70 * scale, 20 * scale, 20 * scale);
        
        // Add glow effect
        spriteCtx.fillStyle = '#ff6666';
        spriteCtx.fillRect(54 * scale, 74 * scale, 12 * scale, 12 * scale);
        
        // Add warning stripes
        spriteCtx.fillStyle = '#ffff00';
        for (let i = 0; i < 3; i++) {
            spriteCtx.fillRect((24 + i * 16) * scale, 100 * scale, 8 * scale, 4 * scale);
        }
        
        this.reactorImage = spriteCanvas;
    }
    
    createDamagedReactorSprite() {
        // Create fallback damaged reactor sprite - adjust size for mobile
        const size = this.isMobile ? 80 : 120 * 1.3;
        const scale = this.isMobile ? 0.7 : 1.3;
        
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = size;
        spriteCanvas.height = size;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Draw damaged reactor building base
        spriteCtx.fillStyle = '#222222';
        spriteCtx.fillRect(20 * scale, 60 * scale, 80 * scale, 50 * scale);
        
        // Draw damaged/cracked cooling towers
        spriteCtx.fillStyle = '#444444';
        spriteCtx.fillRect(30 * scale, 20 * scale, 24 * scale, 60 * scale);
        spriteCtx.fillRect(66 * scale, 20 * scale, 24 * scale, 60 * scale);
        
        // Add cracks
        spriteCtx.strokeStyle = '#111111';
        spriteCtx.lineWidth = 2 * scale;
        spriteCtx.beginPath();
        spriteCtx.moveTo(35 * scale, 25 * scale);
        spriteCtx.lineTo(45 * scale, 75 * scale);
        spriteCtx.moveTo(70 * scale, 30 * scale);
        spriteCtx.lineTo(80 * scale, 70 * scale);
        spriteCtx.stroke();
        
        // Draw damaged reactor core (dim)
        spriteCtx.fillStyle = '#664444';
        spriteCtx.fillRect(50 * scale, 70 * scale, 20 * scale, 20 * scale);
        
        // Add smoke effect
        spriteCtx.fillStyle = 'rgba(100, 100, 100, 0.7)';
        for (let i = 0; i < 5; i++) {
            spriteCtx.beginPath();
            spriteCtx.arc((60 + i * 8) * scale, (15 - i * 2) * scale, (3 + i) * scale, 0, Math.PI * 2);
            spriteCtx.fill();
        }
        
        this.damagedReactorImage = spriteCanvas;
    }
    

    
    scaleAAGunToReactorSize(originalImage) {
        // Calculate target size as 3/4 of reactor size
        const reactorSize = this.isMobile ? 80 : 120 * 1.3;
        const targetSize = Math.floor(reactorSize * 0.75);
        
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = targetSize;
        spriteCanvas.height = targetSize;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Draw scaled image maintaining aspect ratio
        spriteCtx.drawImage(originalImage, 0, 0, targetSize, targetSize);
        
        this.aaGunImage = spriteCanvas;
        this.createFlippedAAGun();
        
        console.log(`AA Gun scaled to ${targetSize}x${targetSize} (3/4 of reactor size: ${reactorSize})`);
    }
    
    createFlippedAAGun() {
        if (!this.aaGunImage) return;
        
        const spriteCanvas = document.createElement('canvas');
        spriteCanvas.width = this.aaGunImage.width;
        spriteCanvas.height = this.aaGunImage.height;
        const spriteCtx = spriteCanvas.getContext('2d');
        
        // Flip horizontally
        spriteCtx.scale(-1, 1);
        spriteCtx.drawImage(this.aaGunImage, -this.aaGunImage.width, 0);
        
        this.aaGunImageFlipped = spriteCanvas;
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
        
        // Adjust reactor size for mobile
        const reactorSize = this.isMobile ? 80 : 120 * 1.3;
        const minSpacing = reactorSize * 1.5; // Increased spacing between reactors
        
        // Try to find a good X position that doesn't overlap with existing reactors
        do {
            x = Math.random() * (this.gameWidth - reactorSize);
            attempts++;
            
            // Check if this position overlaps with any existing reactor
            let overlaps = false;
            for (let existingReactor of this.reactors) {
                if (existingReactor.destroyed) continue;
                
                const distance = Math.abs(x - existingReactor.x);
                if (distance < minSpacing && Math.abs((customY || -reactorSize) - existingReactor.y) < reactorSize * 2) {
                    overlaps = true;
                    break;
                }
            }
            
            if (!overlaps) break;
            
        } while (attempts < 20);
        
        this.lastReactorX = x;
        
        const reactor = {
            x: x,
            y: customY !== null ? customY : -reactorSize,
            width: reactorSize,
            height: reactorSize,
            speed: this.backgroundSpeed,
            destroyed: false,
            damaged: false,
            glowPhase: Math.random() * Math.PI * 2
        };
        
        this.reactors.push(reactor);
    }
    
    spawnAAGun() {
        if (!this.aaGunsEnabled || this.score < 10 || !this.aaGunImage) return;
        
        const gunWidth = this.aaGunImage.width;
        const gunHeight = this.aaGunImage.height;
        const sideMargin = 50; // Distance from screen edge
        
        // Randomly choose left or right side
        const isLeftSide = Math.random() < 0.5;
        
        let x, flipped;
        if (isLeftSide) {
            x = sideMargin; // Left side
            flipped = true;
        } else {
            x = this.gameWidth - gunWidth - sideMargin; // Right side
            flipped = false;
        }
        
        // Find a Y position that doesn't overlap with reactors or other AA guns
        let y;
        let attempts = 0;
        const maxAttempts = 30; // Increased attempts
        const minSpacing = Math.max(gunHeight, gunWidth) * 1.2; // Minimum spacing between guns
        
        do {
            y = Math.random() * (this.gameHeight - gunHeight - 300) + 150; // Better Y range
            attempts++;
            
            // Check overlap with reactors
            let overlapsReactor = this.checkAAGunReactorOverlap(x, y, gunWidth, gunHeight);
            
            // Check overlap with other AA guns
            let overlapsGun = false;
            for (let existingGun of this.aaGuns) {
                if (existingGun.destroyed) continue;
                
                const distance = Math.sqrt(
                    Math.pow(x - existingGun.x, 2) + 
                    Math.pow(y - existingGun.y, 2)
                );
                
                if (distance < minSpacing) {
                    overlapsGun = true;
                    break;
                }
            }
            
            if (!overlapsReactor && !overlapsGun) break;
            
        } while (attempts < maxAttempts);
        
        // If we couldn't find a good position, skip this spawn
        if (attempts >= maxAttempts) {
            console.log('Could not find suitable position for AA gun, skipping spawn');
            return;
        }
        
        const aaGun = {
            x: x,
            y: y,
            width: gunWidth,
            height: gunHeight,
            speed: this.backgroundSpeed,
            flipped: flipped,
            destroyed: false,
            spawnTime: Date.now(), // Track when it was spawned for smoother appearance
            lastShotTime: 0, // Track when it last shot
            shootInterval: 1500 + Math.random() * 1500 // Random shooting interval (1.5-3 seconds)
        };
        
        this.aaGuns.push(aaGun);
        console.log(`AA Gun spawned at (${x}, ${y}), flipped: ${flipped}`);
    }
    
    checkAAGunReactorOverlap(gunX, gunY, gunWidth, gunHeight) {
        // Check if AA gun position would overlap with any reactor
        const safetyMargin = 20; // Extra margin for safety
        
        for (let reactor of this.reactors) {
            if (reactor.destroyed) continue;
            
            // Check AABB collision with safety margin
            if (gunX < reactor.x + reactor.width + safetyMargin &&
                gunX + gunWidth + safetyMargin > reactor.x &&
                gunY < reactor.y + reactor.height + safetyMargin &&
                gunY + gunHeight + safetyMargin > reactor.y) {
                return true; // Overlap detected
            }
        }
        return false; // No overlap
    }
    
    setupEventListeners() {
        // Existing keyboard controls
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            // Handle name input screen
            if (this.gameState === 'nameInput') {
                e.preventDefault(); // Prevent default browser behavior
                this.handleNameInput(e.key);
                return;
            }
            
            // Handle shooting
            if (e.code === 'Space' && this.gameState === 'playing') {
                e.preventDefault(); // Prevent page scrolling
                this.shootRocket();
            }
            
            // Handle Escape key - return to splash screen
            if (e.code === 'Escape' && this.gameState === 'playing') {
                this.stopMusic();
                this.gameState = 'splash';
                this.resetGame();
                console.log('Returned to splash screen');
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse events for all screens
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mousePos.x = e.clientX - rect.left;
            this.mousePos.y = e.clientY - rect.top;
            
            if (this.gameState === 'splash') {
                this.updateButtonHover();
            } else if (this.gameState === 'nameInput') {
                this.updateVirtualKeyboardHover();
            } else if (this.gameState === 'playing') {
                this.updateButtonHover();
            } else if (this.gameState === 'topScores') {
                this.updateButtonHover();
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            if (this.gameState === 'splash') {
                this.handleSplashClick();
            } else if (this.gameState === 'topScores') {
                this.handleTopScoresClick();
            } else if (this.gameState === 'nameInput') {
                this.handleVirtualKeyboardClick();
            } else if (this.gameState === 'playing') {
                // Handle music button clicks during gameplay
                if (this.musicButton.hovered) {
                    this.toggleMusic();
                }
            }
        });

        // Touch events for mobile only
        if (this.isMobile) {
            let touchStartX = 0;
            let touchStartY = 0;
            let isTouching = false;
            const minSwipeDistance = 30; // Minimum distance for a swipe

            this.canvas.addEventListener('touchstart', (e) => {
                e.preventDefault(); // Prevent scrolling
                isTouching = true;
                
                const rect = this.canvas.getBoundingClientRect();
                touchStartX = e.touches[0].clientX;
                touchStartY = e.touches[0].clientY;
                
                // Update mouse position for button detection
                this.mousePos.x = touchStartX - rect.left;
                this.mousePos.y = touchStartY - rect.top;
                
                // Handle splash screen touch
                if (this.gameState === 'splash') {
                    this.updateButtonHover();
                } else if (this.gameState === 'nameInput') {
                    this.updateVirtualKeyboardHover();
                }
                
                // Handle shooting on tap during gameplay
                if (this.gameState === 'playing') {
                    // Check if touching music button first
                    this.updateButtonHover();
                    if (!this.musicButton.hovered) {
                        this.shootRocket();
                    }
                }
            });

            this.canvas.addEventListener('touchmove', (e) => {
                e.preventDefault(); // Prevent scrolling
                
                const rect = this.canvas.getBoundingClientRect();
                const touchX = e.touches[0].clientX;
                const touchY = e.touches[0].clientY;
                
                // Handle splash screen touch move
                if (this.gameState === 'splash') {
                    this.mousePos.x = touchX - rect.left;
                    this.mousePos.y = touchY - rect.top;
                    this.updateButtonHover();
                    return;
                } else if (this.gameState === 'nameInput') {
                    this.mousePos.x = touchX - rect.left;
                    this.mousePos.y = touchY - rect.top;
                    this.updateVirtualKeyboardHover();
                    return;
                }
                
                // Handle gameplay movement
                if (this.gameState === 'playing') {
                    // Update music button hover during gameplay
                    this.updateButtonHover();
                    
                    const deltaX = touchX - touchStartX;
                    const deltaY = touchY - touchStartY;

                    // Only handle horizontal movement
                    if (Math.abs(deltaX) > minSwipeDistance) {
                        // Move airplane based on swipe direction
                        if (deltaX > 0) {
                            // Swipe right
                            this.airplane.x = Math.min(this.airplane.x + this.airplane.speed * 2, 
                                this.gameWidth - this.airplane.width);
                        } else {
                            // Swipe left
                            this.airplane.x = Math.max(this.airplane.x - this.airplane.speed * 2, 0);
                        }
                        touchStartX = touchX; // Update start position for continuous movement
                    }
                }
            });

            this.canvas.addEventListener('touchend', (e) => {
                e.preventDefault();
                
                if (isTouching && this.gameState === 'splash') {
                    console.log(`Touch end - buttons hovered: start=${this.startButton.hovered}, topScores=${this.topScoresButton.hovered}`);
                    this.handleSplashClick();
                } else if (isTouching && this.gameState === 'topScores') {
                    this.handleTopScoresClick();
                } else if (isTouching && this.gameState === 'nameInput') {
                    this.handleVirtualKeyboardClick();
                } else if (isTouching && this.gameState === 'playing') {
                    // Handle music button tap during gameplay
                    if (this.musicButton.hovered) {
                        this.toggleMusic();
                    }
                }
                
                isTouching = false;
            });

            this.canvas.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                isTouching = false;
            });
        }
    }
    
    updateButtonHover() {
        // Check music button hover in all states
        this.musicButton.hovered = this.isPointInButton(this.mousePos, this.musicButton);
        
        if (this.gameState === 'splash') {
            // Check start button hover
            this.startButton.hovered = this.isPointInButton(this.mousePos, this.startButton);
            
            // Check top scores button hover
            this.topScoresButton.hovered = this.isPointInButton(this.mousePos, this.topScoresButton);
            
            // Change cursor style
            this.canvas.style.cursor = (this.startButton.hovered || this.topScoresButton.hovered || this.musicButton.hovered) ? 'pointer' : 'default';
        } else if (this.gameState === 'topScores') {
            // Check music button and return area
            this.canvas.style.cursor = this.musicButton.hovered ? 'pointer' : 'default';
        } else if (this.gameState === 'playing') {
            // Check music button during gameplay
            this.canvas.style.cursor = this.musicButton.hovered ? 'pointer' : 'default';
        }
    }
    
    updateVirtualKeyboardHover() {
        let anyHovered = false;
        
        for (let row of this.virtualKeyboard) {
            for (let keyObj of row) {
                keyObj.hovered = this.isPointInButton(this.mousePos, keyObj);
                if (keyObj.hovered) anyHovered = true;
            }
        }
        
        this.canvas.style.cursor = anyHovered ? 'pointer' : 'default';
    }
    
    isPointInButton(point, button) {
        return point.x >= button.x && 
               point.x <= button.x + button.width &&
               point.y >= button.y && 
               point.y <= button.y + button.height;
    }
    
    async handleSplashClick() {
        if (this.startButton.hovered) {
            this.gameState = 'playing';
            this.initializeReactors();
            this.startMusic();
            console.log('Game Started!');
        } else if (this.topScoresButton.hovered) {
            this.gameState = 'topScores';
            // Refresh high scores when opening the screen
            await this.loadHighScores();
            console.log('Top Scores screen opened');
        } else if (this.musicButton.hovered) {
            this.toggleMusic();
        }
    }
    
    handleTopScoresClick() {
        if (this.musicButton.hovered) {
            this.toggleMusic();
        } else {
            // Any other click on top scores screen returns to splash
            this.stopMusic();
            this.gameState = 'splash';
            console.log('Returning to splash from top scores');
        }
    }
    
    startMusic() {
        if (this.backgroundMusic && !this.isMusicMuted) {
            console.log('Attempting to start music...');
            this.backgroundMusic.currentTime = 0; // Start from beginning
            
            const playPromise = this.backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('Music started successfully');
                    })
                    .catch(error => {
                        console.warn('Could not start music (browser autoplay restriction):', error.name);
                        console.log('User interaction required to play audio');
                        // Music will start when user clicks the music button
                    });
            }
        } else {
            if (!this.backgroundMusic) {
                console.warn('Background music not loaded');
            }
            if (this.isMusicMuted) {
                console.log('Music is muted');
            }
        }
    }
    
    stopMusic() {
        if (this.backgroundMusic) {
            this.backgroundMusic.pause();
            this.backgroundMusic.currentTime = 0;
        }
    }
    
    toggleMusic() {
        this.isMusicMuted = !this.isMusicMuted;
        
        if (this.isMusicMuted) {
            this.stopMusic();
        } else if (this.gameState === 'playing') {
            this.startMusic();
        }
        
        console.log('Music ' + (this.isMusicMuted ? 'muted' : 'unmuted'));
    }
    
    playExplosionSound() {
        if (this.explosionSound && !this.isMusicMuted) {
            // Reset to beginning and play
            this.explosionSound.currentTime = 0;
            this.explosionSound.play().catch(e => {
                console.warn('Could not play explosion sound:', e.name);
            });
        }
    }
    

    
    update() {
        if (!this.assetsLoaded) return;
        
        // Handle game over state
        if (this.gameState === 'gameOver') {
            const currentTime = Date.now();
            
            // Prompt for high score name if needed
            if (this.isNewHighScore) {
                this.promptForPlayerName();
            }
            
            if (currentTime - this.gameOverTime >= this.gameOverDuration) {
                this.stopMusic();
                this.gameState = 'splash';
                this.resetGame();
            }
            return;
        }
        
        if (this.gameState !== 'playing') return;
        
        // Enable AA guns when score reaches 10
        if (this.score >= 10 && !this.aaGunsEnabled) {
            this.aaGunsEnabled = true;
            console.log('AA Guns enabled! Score: ' + this.score);
        }
        
        this.updateBackground();
        this.updateAirplane();
        this.updateRockets();
        this.updateReactors();
        this.updateAAGuns();
        this.updateAAGunBullets();
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
        
        // Allow vertical movement for dodging AA gun bullets
        if (this.keys['ArrowUp'] && this.airplane.y > 50) {
            this.airplane.y -= this.airplane.speed * 0.7;
        }
        
        if (this.keys['ArrowDown'] && this.airplane.y < this.gameHeight - this.airplane.height - 10) {
            this.airplane.y += this.airplane.speed * 0.7;
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
                        this.playExplosionSound(); // Play explosion sound when reactor is completely destroyed
                        console.log(`Reactor destroyed! Score: ${this.score}`);
                    }
                    
                    break; // Exit reactor loop since rocket is gone
                }
            }
            
            // Check collisions with AA guns (if still have rocket)
            if (i >= 0 && i < this.rockets.length) {
                for (let j = 0; j < this.aaGuns.length; j++) {
                    const aaGun = this.aaGuns[j];
                    
                    if (aaGun.destroyed) continue;
                    
                    // AABB collision detection
                    if (this.rockets[i].x < aaGun.x + aaGun.width &&
                        this.rockets[i].x + this.rockets[i].width > aaGun.x &&
                        this.rockets[i].y < aaGun.y + aaGun.height &&
                        this.rockets[i].y + this.rockets[i].height > aaGun.y) {
                        
                        // Remove rocket
                        this.rockets.splice(i, 1);
                        
                        // Create explosion
                        this.createExplosion(
                            aaGun.x + aaGun.width / 2,
                            aaGun.y + aaGun.height / 2
                        );
                        
                        // Destroy AA gun
                        aaGun.destroyed = true;
                        this.score += 3; // 3 points for destroying AA gun
                        console.log(`AA Gun destroyed! Score: ${this.score}`);
                        
                        break; // Exit AA gun loop since rocket is gone
                    }
                }
            }
        }
        
        // Check AA gun bullets hitting airplane
        for (let i = this.aaGunBullets.length - 1; i >= 0; i--) {
            const bullet = this.aaGunBullets[i];
            
            // AABB collision detection with airplane
            if (bullet.x < this.airplane.x + this.airplane.width &&
                bullet.x + bullet.width > this.airplane.x &&
                bullet.y < this.airplane.y + this.airplane.height &&
                bullet.y + bullet.height > this.airplane.y) {
                
                // Remove bullet
                this.aaGunBullets.splice(i, 1);
                
                // Create explosion at airplane
                this.createExplosion(
                    this.airplane.x + this.airplane.width / 2,
                    this.airplane.y + this.airplane.height / 2
                );
                
                // Reduce health
                this.currentHealth--;
                console.log(`Airplane hit! Health: ${this.currentHealth}/${this.maxHealth}`);
                
                // Check if game over
                if (this.currentHealth <= 0) {
                    this.gameState = 'gameOver';
                    this.gameOverTime = Date.now();
                    console.log('Game Over! Health depleted.');
                    
                    // Check for high score asynchronously
                    this.checkForHighScore().then(isHighScore => {
                        if (isHighScore) {
                            this.isNewHighScore = true;
                        }
                    });
                }
                
                break; // Exit bullet loop
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
    
    updateAAGuns() {
        if (!this.aaGunsEnabled) return;
        
        // Update AA gun spawning
        this.aaGunSpawnTimer++;
        if (this.aaGunSpawnTimer >= this.aaGunSpawnInterval) {
            this.spawnAAGun();
            this.aaGunSpawnTimer = 0;
        }
        
        // Update existing AA guns
        for (let i = this.aaGuns.length - 1; i >= 0; i--) {
            const aaGun = this.aaGuns[i];
            
            if (aaGun.destroyed) continue;
            
            // Move AA gun down with background
            aaGun.y += aaGun.speed;
            
            // Check if AA gun should shoot at airplane
            const currentTime = Date.now();
            if (currentTime - aaGun.lastShotTime > aaGun.shootInterval) {
                // Only shoot if gun is on screen and airplane is in range
                if (aaGun.y > -aaGun.height && aaGun.y < this.gameHeight) {
                    this.aaGunShoot(aaGun);
                    aaGun.lastShotTime = currentTime;
                }
            }
            
            // Remove AA guns that are off screen
            if (aaGun.y > this.gameHeight + aaGun.height) {
                this.aaGuns.splice(i, 1);
            }
        }
    }
    
    aaGunShoot(aaGun) {
        // Calculate direction to airplane
        const gunCenterX = aaGun.x + aaGun.width / 2;
        const gunCenterY = aaGun.y + aaGun.height / 2;
        const airplaneCenterX = this.airplane.x + this.airplane.width / 2;
        const airplaneCenterY = this.airplane.y + this.airplane.height / 2;
        
        // Calculate angle to airplane
        const deltaX = airplaneCenterX - gunCenterX;
        const deltaY = airplaneCenterY - gunCenterY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Only shoot if airplane is within reasonable range
        if (distance > 600) return;
        
        // Normalize direction
        const dirX = deltaX / distance;
        const dirY = deltaY / distance;
        
        // Create bullet
        const bullet = {
            x: gunCenterX - 2,
            y: gunCenterY - 2,
            width: 4,
            height: 4,
            velocityX: dirX * this.aaGunBulletSpeed,
            velocityY: dirY * this.aaGunBulletSpeed,
            fromGun: true
        };
        
        this.aaGunBullets.push(bullet);
    }
    
    updateAAGunBullets() {
        // Update existing bullets
        for (let i = this.aaGunBullets.length - 1; i >= 0; i--) {
            const bullet = this.aaGunBullets[i];
            
            // Move bullet
            bullet.x += bullet.velocityX;
            bullet.y += bullet.velocityY;
            
            // Remove bullets that are off screen
            if (bullet.x < -10 || bullet.x > this.gameWidth + 10 || 
                bullet.y < -10 || bullet.y > this.gameHeight + 10) {
                this.aaGunBullets.splice(i, 1);
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
        } else if (this.gameState === 'gameOver') {
            this.renderGameOver();
        } else if (this.gameState === 'topScores') {
            this.renderTopScores();
        } else if (this.gameState === 'nameInput') {
            this.renderNameInput();
        }
    }
    
    renderSplashScreen() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Draw splash background
        if (this.splashImage) {
            this.ctx.drawImage(this.splashImage, 0, 0, this.gameWidth, this.gameHeight);
        }
        
        // Draw instructions overlay on bottom right corner
        this.drawInstructionsOverlay();
        
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
        
        // Draw top scores button
        if (this.topScoresButtonImage) {
            // Add glow effect if hovered
            if (this.topScoresButton.hovered) {
                this.ctx.shadowColor = '#ffdd00';
                this.ctx.shadowBlur = 10;
            }
            
            this.ctx.drawImage(
                this.topScoresButtonImage,
                this.topScoresButton.x,
                this.topScoresButton.y,
                this.topScoresButton.width,
                this.topScoresButton.height
            );
            
                        this.ctx.shadowBlur = 0;
        }
        
        // Draw music button
        this.drawMusicButton();
    }
    
    drawInstructionsOverlay() {
        // Position instructions in bottom right corner
        const rightMargin = 20;
        const bottomMargin = 20;
        const lineHeight = 20;
        
        // Semi-transparent background for readability
        const boxWidth = this.isMobile ? 250 : 350;
        const boxHeight = this.isMobile ? 100 : 120;
        const boxX = this.gameWidth - boxWidth - rightMargin;
        const boxY = this.gameHeight - boxHeight - bottomMargin;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        // Instructions text
        let textY = boxY + 25;
        const textX = boxX + 10;
        
        if (this.isMobile) {
            // Mobile instructions
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 12px Courier New';
            this.ctx.fillText('MOBILE CONTROLS:', textX, textY);
            
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = '10px Courier New';
            textY += lineHeight;
            this.ctx.fillText('• TAP to shoot missiles', textX, textY);
            textY += lineHeight;
            this.ctx.fillText('• SWIPE LEFT/RIGHT to move', textX, textY);
            textY += lineHeight;
            this.ctx.fillText('• DODGE red AA gun bullets!', textX, textY);
        } else {
            // Desktop instructions
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = 'bold 14px Courier New';
            this.ctx.fillText('DESKTOP CONTROLS:', textX, textY);
            
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 12px Courier New';
            textY += lineHeight;
            this.ctx.fillText('↑↓←→ ARROW KEYS to move (UP/DOWN to dodge!)', textX, textY);
            textY += lineHeight;
            this.ctx.fillText('SPACE to shoot missiles', textX, textY);
            
            this.ctx.fillStyle = '#ff4444';
            textY += lineHeight;
            this.ctx.fillText('DODGE red AA gun bullets!', textX, textY);
            
            this.ctx.fillStyle = '#ffffff';
            textY += lineHeight;
            this.ctx.fillText('Hit reactors twice to destroy', textX, textY);
        }
    }
    
    renderGame() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Draw scrolling background
        this.drawBackground();
        
        // Draw reactors
        this.drawReactors();
        
        // Draw AA guns
        this.drawAAGuns();
        
        // Draw rockets
        this.drawRockets();
        
        // Draw AA gun bullets
        this.drawAAGunBullets();
        
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
    
    drawAAGuns() {
        if (!this.aaGunsEnabled) return;
        
        this.aaGuns.forEach(aaGun => {
            if (aaGun.destroyed) return;
            
            // Calculate fade-in effect for newly spawned guns
            const timeSinceSpawn = Date.now() - (aaGun.spawnTime || 0);
            const fadeInDuration = 1000; // 1 second fade-in
            let opacity = Math.min(timeSinceSpawn / fadeInDuration, 1);
            
            // Choose the appropriate image based on flipped state
            const image = aaGun.flipped ? 
                (this.aaGunImageFlipped || this.aaGunImage) : 
                this.aaGunImage;
            
            if (image) {
                // Save current alpha
                const originalAlpha = this.ctx.globalAlpha;
                this.ctx.globalAlpha = opacity;
                
                // Add red glow effect like reactors
                const glowIntensity = (Math.sin(Date.now() * 0.005) + 1) * 0.3 + 0.4;
                this.ctx.shadowColor = `rgba(255, 68, 68, ${glowIntensity * opacity})`;
                this.ctx.shadowBlur = 12;
                
                this.ctx.drawImage(
                    image,
                    aaGun.x,
                    aaGun.y,
                    aaGun.width,
                    aaGun.height
                );
                
                // Reset shadow
                this.ctx.shadowBlur = 0;
                
                // Restore original alpha
                this.ctx.globalAlpha = originalAlpha;
            }
            
            // Add warning indicator above AA gun with red glow and fade-in
            this.ctx.fillStyle = `rgba(255, 0, 0, ${((Math.sin(Date.now() * 0.008) + 1) * 0.3 + 0.5) * opacity})`;
            this.ctx.font = '12px Courier New';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('⚠', aaGun.x + aaGun.width / 2, aaGun.y - 5);
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
    
    drawAAGunBullets() {
        this.aaGunBullets.forEach(bullet => {
            // Add strong red glow effect for visibility
            this.ctx.shadowColor = '#ff0000';
            this.ctx.shadowBlur = 8;
            
            // Draw outer glow (larger, more transparent)
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.6)';
            this.ctx.fillRect(bullet.x - 1, bullet.y - 1, bullet.width + 2, bullet.height + 2);
            
            // Draw main bullet body (bright red)
            this.ctx.fillStyle = '#ff2222';
            this.ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
            
            // Add inner bright core
            this.ctx.fillStyle = '#ffaaaa';
            this.ctx.fillRect(bullet.x + 1, bullet.y + 1, bullet.width - 2, bullet.height - 2);
            
            // Reset shadow
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
        // Adjust UI size for mobile
        const uiWidth = this.isMobile ? 100 : 120;
        const uiHeight = this.isMobile ? 35 : 40;
        const fontSize = this.isMobile ? '14px' : '16px';
        
        // Draw simplified scoreboard with dark background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(10, 10, uiWidth, uiHeight);
        this.ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(10, 10, uiWidth, uiHeight);
        
        // Draw only the score
        this.ctx.fillStyle = 'rgba(0, 255, 0, 0.9)';
        this.ctx.font = `${fontSize} Courier New`;
        this.ctx.fillText(`SCORE: ${this.score}`, 15, this.isMobile ? 30 : 35);
        
        // Draw health bar in top right
        this.drawHealthBar();
        
        // Draw music button
        this.drawMusicButton();
        
        // Add mobile controls reminder during gameplay
        if (this.isMobile && this.gameState === 'playing') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            this.ctx.fillRect(this.gameWidth - 110, 10, 100, 50);
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
            this.ctx.strokeRect(this.gameWidth - 110, 10, 100, 50);
            
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            this.ctx.font = '10px Courier New';
            this.ctx.fillText('TAP: Shoot', this.gameWidth - 105, 25);
            this.ctx.fillText('SWIPE: Move', this.gameWidth - 105, 38);
            this.ctx.fillText('ESC: Menu', this.gameWidth - 105, 51);
        }
        
        // Show loading progress if still loading
        if (!this.assetsLoaded) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.8)';
            this.ctx.font = `${fontSize} Courier New`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Loading... ${this.loadingAssets}/${this.totalAssets}`, this.gameWidth / 2, this.gameHeight / 2 + 30);
            this.ctx.textAlign = 'left';
        }
    }
    
    drawHealthBar() {
        // Health bar dimensions and position (top right)
        const barWidth = this.isMobile ? 100 : 120;
        const barHeight = this.isMobile ? 12 : 15;
        const barX = this.gameWidth - barWidth - 15;
        const barY = 15;
        
        // Background (empty health)
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        // Health percentage
        const healthPercent = this.currentHealth / this.maxHealth;
        const healthWidth = barWidth * healthPercent;
        
        // Health bar color based on health level
        let healthColor;
        if (healthPercent > 0.6) {
            healthColor = '#00ff00'; // Green
        } else if (healthPercent > 0.3) {
            healthColor = '#ffff00'; // Yellow
        } else {
            healthColor = '#ff0000'; // Red
        }
        
        // Draw health bar
        this.ctx.fillStyle = healthColor;
        this.ctx.fillRect(barX, barY, healthWidth, barHeight);
        
        // Health text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${this.isMobile ? '10px' : '12px'} Courier New`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.currentHealth}/${this.maxHealth}`, barX + barWidth / 2, barY + barHeight + 15);
        this.ctx.textAlign = 'left';
    }
    
    drawMusicButton() {
        // Draw music button background
        this.ctx.fillStyle = this.musicButton.hovered ? 'rgba(100, 100, 100, 0.9)' : 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(this.musicButton.x, this.musicButton.y, this.musicButton.width, this.musicButton.height);
        
        // Draw border
        this.ctx.strokeStyle = this.musicButton.hovered ? '#ffff00' : '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(this.musicButton.x, this.musicButton.y, this.musicButton.width, this.musicButton.height);
        
        // Draw music icon and text
        this.ctx.textAlign = 'center';
        
        if (this.isMusicMuted || !this.backgroundMusic) {
            // Muted state or no music file - red
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = 'bold 12px Courier New';
            this.ctx.fillText('♪', this.musicButton.x + 20, this.musicButton.y + this.musicButton.height / 2 + 4);
            
            // Draw X over the music note
            this.ctx.strokeStyle = '#ff4444';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(this.musicButton.x + 12, this.musicButton.y + 8);
            this.ctx.lineTo(this.musicButton.x + 28, this.musicButton.y + 22);
            this.ctx.moveTo(this.musicButton.x + 28, this.musicButton.y + 8);
            this.ctx.lineTo(this.musicButton.x + 12, this.musicButton.y + 22);
            this.ctx.stroke();
            
            // Text label - show different text for missing file
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = 'bold 8px Courier New';
            this.ctx.fillText(!this.backgroundMusic ? 'N/A' : 'OFF', this.musicButton.x + 60, this.musicButton.y + this.musicButton.height / 2 + 3);
        } else {
            // Playing state - green
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 12px Courier New';
            this.ctx.fillText('♪♫', this.musicButton.x + 20, this.musicButton.y + this.musicButton.height / 2 + 4);
            
            // Text label
            this.ctx.fillStyle = '#00ff00';
            this.ctx.font = 'bold 8px Courier New';
            this.ctx.fillText('ON', this.musicButton.x + 60, this.musicButton.y + this.musicButton.height / 2 + 3);
        }
        
        this.ctx.textAlign = 'left';
    }
    
    renderGameOver() {
        // Keep the game scene visible but dimmed
        this.renderGame();
        
        // Dark overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Game Over text
        this.ctx.fillStyle = '#ff0000';
        this.ctx.font = `bold ${this.isMobile ? '48px' : '72px'} Courier New`;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 20;
        
        // Pulsing effect
        const pulseIntensity = (Math.sin(Date.now() * 0.01) + 1) * 0.3 + 0.7;
        this.ctx.globalAlpha = pulseIntensity;
        
        this.ctx.fillText('GAME OVER', this.gameWidth / 2, this.gameHeight / 2);
        
        // Reset effects
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
        this.ctx.textAlign = 'left';
        
        // Countdown or instruction
        const timeLeft = Math.ceil((this.gameOverDuration - (Date.now() - this.gameOverTime)) / 1000);
        if (timeLeft > 0) {
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${this.isMobile ? '16px' : '24px'} Courier New`;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(`Returning to menu in ${timeLeft}...`, this.gameWidth / 2, this.gameHeight / 2 + 60);
            this.ctx.textAlign = 'left';
        }
    }
    
    renderTopScores() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.gameHeight);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(0.5, '#003366');
        gradient.addColorStop(1, '#001122');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Title
        this.ctx.fillStyle = '#ffdd00';
        this.ctx.font = `bold ${this.isMobile ? '32px' : '48px'} Courier New`;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ffdd00';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText('🏆 TOP SCORES 🏆', this.gameWidth / 2, this.isMobile ? 80 : 120);
        this.ctx.shadowBlur = 0;
        
        // Display top 3 scores
        const startY = this.isMobile ? 150 : 200;
        const lineHeight = this.isMobile ? 50 : 60;
        
        // Define column positions
        const rankCol = this.isMobile ? 40 : 80;
        const nameCol = this.isMobile ? 100 : 200;
        const scoreCol = this.isMobile ? this.gameWidth - 120 : this.gameWidth - 200;
        const dateCol = this.isMobile ? this.gameWidth - 40 : this.gameWidth - 80;
        
        if (this.highScores.length === 0) {
            // No scores yet
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `${this.isMobile ? '18px' : '24px'} Courier New`;
            this.ctx.fillText('No high scores yet!', this.gameWidth / 2, startY + 50);
            this.ctx.fillText('Play the game to set a record!', this.gameWidth / 2, startY + 100);
        } else {
            // Display each high score
            for (let i = 0; i < Math.min(3, this.highScores.length); i++) {
                const score = this.highScores[i];
                const rank = i + 1;
                const y = startY + (i * lineHeight);
                
                // Rank with medal colors
                let rankColor = '#cd6133'; // Bronze
                if (rank === 1) rankColor = '#ffd700'; // Gold
                else if (rank === 2) rankColor = '#c0c0c0'; // Silver
                
                this.ctx.fillStyle = rankColor;
                this.ctx.font = `bold ${this.isMobile ? '20px' : '26px'} Courier New`;
                this.ctx.fillText(`#${rank}`, rankCol, y);
                
                // Player name (column 2)
                this.ctx.fillStyle = '#00ff00';
                this.ctx.font = `bold ${this.isMobile ? '16px' : '20px'} Courier New`;
                let displayName = score.name;
                if (displayName.length > (this.isMobile ? 8 : 12)) {
                    displayName = displayName.substring(0, this.isMobile ? 8 : 12) + '...';
                }
                this.ctx.fillText(displayName, nameCol, y);
                
                // Score (column 3 - centered)
                this.ctx.fillStyle = '#ffffff';
                this.ctx.font = `bold ${this.isMobile ? '18px' : '24px'} Courier New`;
                this.ctx.textAlign = 'center';
                this.ctx.fillText(score.score.toString(), scoreCol, y);
                
                // Date (column 4 - right aligned)
                this.ctx.fillStyle = '#888888';
                this.ctx.font = `${this.isMobile ? '12px' : '16px'} Courier New`;
                this.ctx.textAlign = 'right';
                this.ctx.fillText(score.date, dateCol, y);
                
                // Reset text alignment
                this.ctx.textAlign = 'left';
            }
        }
        
        // Instructions
        this.ctx.fillStyle = '#ffff00';
        this.ctx.font = `${this.isMobile ? '14px' : '18px'} Courier New`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(this.isMobile ? 'TAP anywhere to return' : 'CLICK anywhere to return to menu', 
                         this.gameWidth / 2, this.gameHeight - (this.isMobile ? 30 : 50));
        
        this.ctx.textAlign = 'left';
        
        // Draw music button
        this.drawMusicButton();
    }
    
    renderNameInput() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Create gradient background
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.gameHeight);
        gradient.addColorStop(0, '#001122');
        gradient.addColorStop(0.5, '#003366');
        gradient.addColorStop(1, '#001122');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        // Celebration title
        this.ctx.fillStyle = '#ffdd00';
        this.ctx.font = `bold ${this.isMobile ? '28px' : '48px'} Courier New`;
        this.ctx.textAlign = 'center';
        this.ctx.shadowColor = '#ffdd00';
        this.ctx.shadowBlur = 15;
        this.ctx.fillText('🎉 NEW HIGH SCORE! 🎉', this.gameWidth / 2, this.isMobile ? 60 : 100);
        this.ctx.shadowBlur = 0;
        
        // Score display
        this.ctx.fillStyle = '#00ff00';
        this.ctx.font = `bold ${this.isMobile ? '24px' : '36px'} Courier New`;
        this.ctx.fillText(`Your Score: ${this.score}`, this.gameWidth / 2, this.isMobile ? 100 : 150);
        
        // Input prompt
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${this.isMobile ? '18px' : '24px'} Courier New`;
        this.ctx.fillText('Enter your name:', this.gameWidth / 2, this.isMobile ? 140 : 200);
        
        // Input box
        const inputBoxWidth = this.isMobile ? 250 : 350;
        const inputBoxHeight = this.isMobile ? 40 : 50;
        const inputBoxX = (this.gameWidth - inputBoxWidth) / 2;
        const inputBoxY = this.isMobile ? 160 : 230;
        
        // Input box background
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight);
        this.ctx.strokeStyle = '#00ff00';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(inputBoxX, inputBoxY, inputBoxWidth, inputBoxHeight);
        
        // Input text
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = `${this.isMobile ? '20px' : '24px'} Courier New`;
        this.ctx.textAlign = 'left';
        const displayText = this.playerNameInput || '';
        this.ctx.fillText(displayText, inputBoxX + 10, inputBoxY + inputBoxHeight - 12);
        
        // Blinking cursor
        this.nameInputBlinkTime += 0.1;
        if (Math.sin(this.nameInputBlinkTime) > 0) {
            const textWidth = this.ctx.measureText(displayText).width;
            this.ctx.fillStyle = '#00ff00';
            this.ctx.fillRect(inputBoxX + 10 + textWidth + 2, inputBoxY + 8, 2, inputBoxHeight - 16);
        }
        
        // Character limit indicator
        this.ctx.fillStyle = this.playerNameInput.length >= this.maxNameLength ? '#ff4444' : '#888888';
        this.ctx.font = `${this.isMobile ? '12px' : '14px'} Courier New`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(`${this.playerNameInput.length}/${this.maxNameLength}`, this.gameWidth / 2, inputBoxY + inputBoxHeight + 20);
        
        // Desktop instructions
        if (!this.isMobile) {
            this.ctx.fillStyle = '#ffff00';
            this.ctx.font = '16px Courier New';
            this.ctx.fillText('ENTER to save • ESCAPE to cancel', this.gameWidth / 2, this.gameHeight - 50);
        }
        
        // Mobile virtual keyboard
        if (this.isMobile) {
            this.drawVirtualKeyboard();
        }
        
        this.ctx.textAlign = 'left';
    }
    
    drawVirtualKeyboard() {
        const keyboardStartY = this.gameHeight * 0.5;
        const keySpacing = 5;
        const rowSpacing = 8;
        
        // Calculate keyboard layout
        for (let rowIndex = 0; rowIndex < this.virtualKeyboard.length; rowIndex++) {
            const row = this.virtualKeyboard[rowIndex];
            const totalRowWidth = row.reduce((sum, key) => sum + key.width + keySpacing, -keySpacing);
            const startX = (this.gameWidth - totalRowWidth) / 2;
            
            let currentX = startX;
            const currentY = keyboardStartY + (rowIndex * (35 + rowSpacing));
            
            for (let keyObj of row) {
                keyObj.x = currentX;
                keyObj.y = currentY;
                
                // Draw key background
                this.ctx.fillStyle = keyObj.hovered ? '#004400' : '#002200';
                this.ctx.fillRect(keyObj.x, keyObj.y, keyObj.width, keyObj.height);
                
                // Draw key border
                this.ctx.strokeStyle = keyObj.hovered ? '#00ff00' : '#006600';
                this.ctx.lineWidth = 2;
                this.ctx.strokeRect(keyObj.x, keyObj.y, keyObj.width, keyObj.height);
                
                // Draw key text
                this.ctx.fillStyle = keyObj.hovered ? '#00ff00' : '#ffffff';
                this.ctx.font = 'bold 12px Courier New';
                this.ctx.textAlign = 'center';
                
                let displayText = keyObj.key;
                if (keyObj.key === 'SPACE') displayText = 'SPACE';
                else if (keyObj.key === 'DONE') displayText = '✓';
                else if (keyObj.key === 'CANCEL') displayText = '✗';
                
                this.ctx.fillText(
                    displayText,
                    keyObj.x + keyObj.width / 2,
                    keyObj.y + keyObj.height / 2 + 4
                );
                
                currentX += keyObj.width + keySpacing;
            }
        }
        
        this.ctx.textAlign = 'left';
    }
    
    resetGame() {
        // Reset game state when returning to splash
        this.score = 0;
        this.hitReactors = 0;
        this.destroyedReactors = 0;
        this.currentHealth = this.maxHealth;
        this.rockets = [];
        this.reactors = [];
        this.aaGuns = [];
        this.aaGunBullets = [];
        this.explosions = [];
        this.backgroundY = 0;
        this.reactorSpawnTimer = 0;
        this.aaGunSpawnTimer = 0;
        this.aaGunsEnabled = false;
        this.lastReactorX = -200;
        this.shootCooldown = 0;
        this.canShoot = true;
        this.isNewHighScore = false;
        
        // Reset name input
        this.playerNameInput = '';
        this.nameInputCursor = 0;
        this.nameInputBlinkTime = 0;
        
        // Refresh high scores from database
        if (this.supabase) {
            this.loadHighScores();
        }
        
        // Reset airplane position - adjust for mobile
        if (this.isMobile) {
            this.airplane.x = this.gameWidth / 2 - this.airplane.width / 2;
            this.airplane.y = this.gameHeight - 100;
        } else {
            this.airplane.x = this.gameWidth / 2 - 75 * 0.85;
            this.airplane.y = this.gameHeight - 170;
        }
        
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