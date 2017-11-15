import * as Phaser from 'phaser';

export class Preloader extends Phaser.State {

  preloadBar: Phaser.Sprite;

  preload() {

    // Add the preloadbar sprite.
    this.preloadBar = this.add.sprite(200, 250, 'preloadBar');

    this.game.load.tilemap('level1', '/assets/maps/level1.json', null, Phaser.Tilemap.TILED_JSON);
    this.load.image('desertSprite', '/assets/images/desert.png');

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
    this.game.state.start('Level1', true, false);
  }
}
