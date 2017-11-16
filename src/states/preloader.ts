import * as Phaser from 'phaser';

export class Preloader extends Phaser.State {

  preloadBar: Phaser.Sprite;

  preload() {
    // Add the preloadbar sprite.
    this.preloadBar = this.add.sprite(200, 250, 'preloadBar');

    // Load the gamepad spritesheet. Note that the width must equal height of the sprite.
    this.load.spritesheet('gamepad', 'assets/gamepad/gamepad_spritesheet.png', 100, 100);

    this.game.load.tilemap('level1', '/assets/maps/level1.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.image('desertSprite', '/assets/images/desert.png');

    this.load.image("earth", "assets/images/tiles/earth_paars.png");
    this.load.image("grass", "assets/images/tiles/grass.png");
    this.load.image("grassy", "assets/images/tiles/grassy.png");
    this.load.image("lava", "assets/images/tiles/lava.png");
    this.load.image("sand", "assets/images/tiles/sand.png");
    this.load.image("stone", "assets/images/tiles/stone.png");
    this.load.image("water", "assets/images/tiles/water.png");

    this.load.image("building1", "assets/images/buildings/manufactory01.png");
    this.load.image("building2", "assets/images/buildings/orange extraction rig01.png");
    this.load.image("building3", "assets/images/buildings/orange hq01.png");
    this.load.image("building4", "assets/images/buildings/Orange Powerplant01.png");
    this.load.image("building5", "assets/images/buildings/orangebarracks01.png");
    this.load.image("building6", "assets/images/buildings/orangelab01.png");
    this.load.image("building7", "assets/images/buildings/orange defense turret 01.png");

    // Sprite animations for our hover miner, all have 2 frames for the animation.
    this.game.load.atlas('hoverminer', 'assets/images/copter-sprites.png', 'assets/images/copter-sprites.json');

    this.load.image('spaceCraftE', 'assets/images/spaceCraft/spaceCraft4_E.png');
    this.load.image('spaceCraftN', 'assets/images/spaceCraft/spaceCraft4_N.png');
    this.load.image('spaceCraftNE', 'assets/images/spaceCraft/spaceCraft4_NE.png');
    this.load.image('spaceCraftNW', 'assets/images/spaceCraft/spaceCraft4_NW.png');
    this.load.image('spaceCraftS', 'assets/images/spaceCraft/spaceCraft4_S.png');
    this.load.image('spaceCraftSE', 'assets/images/spaceCraft/spaceCraft4_SE.png');
    this.load.image('spaceCraftSW', 'assets/images/spaceCraft/spaceCraft4_SW.png');
    this.load.image('spaceCraftW', 'assets/images/spaceCraft/spaceCraft4_W.png');

    // This will start and show our preloadbar, phaser will automatically fill this bar as more assets are loaded.
    this.load.setPreloadSprite(this.preloadBar);
  }

  create() {
    this.game.state.start('Level2', true, false);
  }
}