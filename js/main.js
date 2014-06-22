// This example uses the Phaser 2.0.4 framework
// Copyright © 2014 John Watson
// Licensed under the terms of the MIT License

// Crazy Phaser Mario World
// Written by Carl Simpson as a learning project to teach myself phaser and get pr0 >>
// The game engine used here was written by John Watson 
// Massive thanks go to him for releasing this engine under MIT ..
// and also to @codevinsky for his ZendaRunner Tutorial without either of these , this wouldnt exist!

var GameState = function(game) {
};
var	score = 0;
var	scoreString = '';
var	scorecard;

// Load images and sounds
GameState.prototype.preload = function() {
	this.game.load.image('background', 'assets/back_ground.png');
    this.game.load.image('ground', 'assets/floor.png');
    this.game.load.tilemap('mario', 'assets/super_mario.json', null, Phaser.Tilemap.TILED_JSON);
    this.game.load.image('tiles', 'assets/super_mario.png');
    this.game.load.spritesheet('player', 'assets/dude.png', 32, 48, 9);
    this.load.spritesheet('coins', 'assets/coins-ps.png', 51, 51, 7);
    this.load.spritesheet('missile', 'assets/missiles-ps.png', 361, 218, 4);

	this.coinRate = 1000;
	this.coinTimer = 0;

	this.previousCoinType = null;
	this.enemyRate = 2000;
    this.enemyTimer = 0;

	//this.score = 0;
	//this.scoreString = '';
	//this.scorecard;
	this.coinSpawnX = null;
	this.coinSpacingX = 10;
	this.coinSpacingY = 10;
    
    this.score = 0;
    // Load teh wav files for audio .. (ogg required for FF)
    this.load.audio('coin', 'assets/audio/coin.wav');
    this.load.audio('death', 'assets/audio/death.wav');
    this.load.audio('gameMusic', 'assets/audio/Pamgaea.MP3');
};
// Setup the example
GameState.prototype.create = function() {
	// Load in the scrolling background
	// see the @codevinksky tutorial for scrolling explanation
    this.background = this.game.add.tileSprite(0, 0, this.game.width, 512, 'background');
    this.background.autoScroll(-100, 0);

    // Define movement constants
    this.MAX_SPEED = 500; // pixels/second
    this.ACCELERATION = 1500; // pixels/second/second
    this.DRAG = 600; // pixels/second
    this.GRAVITY = 2600; // pixels/second/second
    this.JUMP_SPEED = -700; // pixels/second (negative y is up)

    // Create a player sprite
    this.player = this.game.add.sprite(this.game.width/2, this.game.height - 150,'player');
    // Enable physics on the player
    this.game.physics.enable(this.player, Phaser.Physics.ARCADE);
    // Make player collide with world boundaries so he doesn't leave the stage
    this.player.body.collideWorldBounds = true;
    // Set player minimum and maximum movement speed
    this.player.body.maxVelocity.setTo(this.MAX_SPEED, this.MAX_SPEED * 10); // x, y
    // Add drag to the player that slows them down when they are not accelerating
    this.player.body.drag.setTo(this.DRAG, 0); // x, y
    // Since we're jumping we need gravity
    game.physics.arcade.gravity.y = this.GRAVITY;
    // Set a flag for tracking if we've double jumped
    this.canDoubleJump = true;
    // Set a flag for tracking if the player can adjust their jump height
    this.canVariableJump = true;

    //  Player physics properties. Give the little guy a slight bounce.
    this.player.body.bounce.y = 0.2;

    // Add the coins & sound
    this.coins = this.game.add.group();
    this.enemies = this.game.add.group();
    this.coinSpawnX = this.game.width + 64;
    this.coinSound = this.game.add.audio('coin');
	//  The score
        this.scoreString = 'Score : ';
        this.scoreText = this.game.add.text(10, 20, scoreString + score, { font: '12px Arial', fill: '#fff' });

    //this.deathSound = this.game.add.audio('death');

    // Create some ground for the player to walk on
    this.ground = this.game.add.group();
    for(var x = 0; x < this.game.width; x += 32) {
        // Add the ground blocks, enable physics on each, make them immovable
        var groundBlock = this.game.add.sprite(x, this.game.height - 32, 'ground');
        this.game.physics.enable(groundBlock, Phaser.Physics.ARCADE);
        groundBlock.body.immovable = true;
        groundBlock.body.allowGravity = false;
        this.ground.add(groundBlock);
    }

    // Capture certain keys to prevent their default actions in the browser.
    // This is only necessary because this is an HTML5 game. Games on other
    // platforms may not need code like this.
    this.game.input.keyboard.addKeyCapture([
        Phaser.Keyboard.LEFT,
        Phaser.Keyboard.RIGHT,
        Phaser.Keyboard.UP,
        Phaser.Keyboard.DOWN
    ]);

    this.gameMusic = this.game.add.audio('gameMusic');
    this.gameMusic.play('', 0, true);

    // Only works running to the right ?? 
    //this.player.animations.add('Phaser.Keyboard.LEFT', [0, 1, 2, 3], 10, true);
    this.player.animations.add('Phaser.Keyboard.RIGHT', [5, 6, 7, 8], 10, true);
};


// The update() method is called every frame
GameState.prototype.update = function() {
    if (this.game.time.fps !== 0) {
        this.fpsText.setText(this.game.time.fps + ' FPS');
    }

    // Collide the player with the ground
    this.game.physics.arcade.collide(this.player, this.ground);


    if (this.leftInputIsActive()) {
        // If the LEFT key is down, set the player velocity to move left
        this.player.body.acceleration.x = -this.ACCELERATION;
    } else if (this.rightInputIsActive()) {
        // If the RIGHT key is down, set the player velocity to move right
        this.player.body.acceleration.x = this.ACCELERATION;
    } else {
        this.player.body.acceleration.x = 0;
    }

    // Set a variable that is true when the player is touching the ground
    var onTheGround = this.player.body.touching.down;
    if (onTheGround) this.canDoubleJump = true;

    if (this.upInputIsActive(5)) {
        // Allow the player to adjust his jump height by holding the jump button
        if (this.canDoubleJump) this.canVariableJump = true;

        if (this.canDoubleJump || onTheGround) {
            // Jump when the player is touching the ground or they can double jump
            this.player.body.velocity.y = this.JUMP_SPEED;

            // Disable ability to double jump if the player is jumping in the air
            if (!onTheGround) this.canDoubleJump = false;
        }
    }
    if(this.coinTimer < this.game.time.now) {
      this.generateCoins();
      this.coinTimer = this.game.time.now + this.coinRate;
      //console.log('generate coins');
    }
    if(this.enemyTimer < this.game.time.now){
    	this.createEnemy();
    	this.enemyTimer = this.game.time.now + this.enemyRate;
    }
    // Keep y velocity constant while the jump button is held for up to 150 ms
    if (this.canVariableJump && this.upInputIsActive(150)) {
        this.player.body.velocity.y = this.JUMP_SPEED;
    }

    // Don't allow variable jump height after the jump button is released
    if (!this.upInputIsActive()) {
        this.canVariableJump = false;
    }
    this.game.physics.arcade.overlap(this.player, this.coins, this.coinHit, null, this);
	this.game.physics.arcade.overlap(this.player, this.enemies, this.enemyHit, null, this);
};

// This is the Coin generation section written by @codevinsky for the ZendaRunner jetpack tutorial
 GameState.prototype.createCoin = function() {
    var x = this.game.width;
    var y = this.game.rnd.integerInRange(50, this.game.world.height - 192);

    var coin = this.coins.getFirstExists(false);
    if(!coin) {
      coin = new Coin(this.game, 0, 0);
      this.coins.add(coin);
    }

    coin.reset(x, y);
    coin.revive();
    return coin;
  },
  GameState.prototype.generateCoins = function() {
    if(!this.previousCoinType || this.previousCoinType < 3) {
      var coinType = this.game.rnd.integer() % 5;
      switch(coinType) {
        case 0:
          //do nothing. No coins generated
          break;
        case 1:
        case 2:
          // if the cointype is 1 or 2, create a single coin
          //this.createCoin();
          this.createCoin();

          break;
        case 3:
          // create a small group of coins
          this.createCoinGroup(2, 2);
          break;
        case 4:
          //create a large coin group
          this.createCoinGroup(6, 2);
          break;
        default:
          // if somehow we error on the cointype, set the previouscointype to zero and do nothing
          this.previousCoinType = 0;
          break;
      }

      this.previousCoinType = coinType;
    } else {
      if(this.previousCoinType === 4) {
        // the previous coin generated was a large group, 
        // skip the next generation as well
        this.previousCoinType = 3;
      } else {
        this.previousCoinType = 0;  
      }
      
    }
  },
  GameState.prototype.createCoinGroup = function(columns, rows) {
    //create 4 coins in a group
    var coinSpawnY = this.game.rnd.integerInRange(50, this.game.world.height - 192);
    var coinRowCounter = 0;
    var coinColumnCounter = 0;
    var coin;
    for(var i = 0; i < columns * rows; i++) {
      coin = this.createCoin(this.spawnX, coinSpawnY);
      coin.x = coin.x + (coinColumnCounter * coin.width) + (coinColumnCounter * this.coinSpacingX);
      coin.y = coinSpawnY + (coinRowCounter * coin.height) + (coinRowCounter * this.coinSpacingY);
      coinColumnCounter++;
      if(i+1 >= columns && (i+1) % columns === 0) {
        coinRowCounter++;
        coinColumnCounter = 0;
      } 
    }
  },

  GameState.prototype.coinHit = function(player, coin) {
    this.coinSound.play();
    coin.kill();

    var dummyCoin = new Coin(this.game, coin.x, coin.y);
    this.game.add.existing(dummyCoin);

    dummyCoin.animations.play('spin', 40, true);

    var scoreTween = this.game.add.tween(dummyCoin).to({x: 50, y: 50}, 300, Phaser.Easing.Linear.NONE, true);

    scoreTween.onComplete.add(function() {
      dummyCoin.destroy();
    }, this);

    console.log('coin hit');
    this.scoreCard();
    
  },


    GameState.prototype.groundHit = function(player, ground) {
    player.body.velocity.y = -200;
  },


    GameState.prototype.createEnemy = function() {
    var x = this.game.width;
    var y = this.game.rnd.integerInRange(50, this.game.world.height - 192);

    var enemy = this.enemies.getFirstExists(false);
    if(!enemy) {
      enemy = new Enemy(this.game, 0, 0);
      this.enemies.add(enemy);
    }
    enemy.reset(x, y);
    enemy.revive();
  },
 
  GameState.prototype.enemyHit = function(player, enemy) {
    player.kill();
    enemy.kill();

    //this.deathSound.play();
    this.gameMusic.stop();
    
    this.background.stopScroll();

    this.enemies.setAll('body.velocity.x', 0);
    this.coins.setAll('body.velocity.x', 0);

    this.enemyTimer = Number.MAX_VALUE;
    this.coinTimer = Number.MAX_VALUE;

    //var scoreboard = new Scoreboard(this.game);
    //this.scoreboard.show(this.score);
    console.log('enemy hit');

    // add in text to say you died on a timer , then restart after 2 seconds.
    this.game.add.text = this.game.add.text(150, 150, 'oh no you died - hit refresh to play again =) ', { fill: '#ffffff' });

},
GameState.prototype.scoreCard = function() {
    if(score < 10000) {   
    //  Increase the score
    score += 1;
    this.scoreText.text = this.scoreString + score;
    console.log("score updated");
    //} else {
        //alert("houston we have a problem");
    }
    
},
// This function should return true when the player activates the "go left" control
// In this case, either holding the right arrow or tapping or clicking on the left
// side of the screen.

GameState.prototype.leftInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.LEFT);
    isActive |= (this.game.input.activePointer.isDown &&
        this.game.input.activePointer.x < this.game.width/4);
    
    this.player.animations.play('Phaser.Keyboard.LEFT');
    return isActive;
};

// This function should return true when the player activates the "go right" control
// In this case, either holding the right arrow or tapping or clicking on the right
// side of the screen.
GameState.prototype.rightInputIsActive = function() {
    var isActive = false;

    isActive = this.input.keyboard.isDown(Phaser.Keyboard.RIGHT);
    isActive |= (this.game.input.activePointer.isDown &&
        this.game.input.activePointer.x > this.game.width/2 + this.game.width/4);

	this.player.animations.play('Phaser.Keyboard.RIGHT');
    return isActive;
    
};

// This function should return true when the player activates the "jump" control
// In this case, either holding the up arrow or tapping or clicking on the center
// part of the screen.
GameState.prototype.upInputIsActive = function(duration) {
    var isActive = false;

    isActive = this.input.keyboard.justPressed(Phaser.Keyboard.UP, duration);
    isActive |= (this.game.input.activePointer.justPressed(duration + 1000/60) &&
        this.game.input.activePointer.x > this.game.width/4 &&
        this.game.input.activePointer.x < this.game.width/2 + this.game.width/4);

    return isActive;
};

var game = new Phaser.Game(848, 320, Phaser.AUTO, 'game');
game.state.add('game', GameState, true);