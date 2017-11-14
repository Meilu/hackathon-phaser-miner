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

    // This will start and show our preloadbar, phaser will automatically fill this bar as more assets are loaded.
    this.load.setPreloadSprite(this.preloadBar);
  }

  create() {
    this.game.state.start('Level1', true, false);
  }
}
