import * as Phaser from 'phaser';

export class Preloader extends Phaser.State {

  preloadBar: Phaser.Sprite;

  preload() {

    // Add the preloadbar sprite.
    this.preloadBar = this.add.sprite(200, 250, 'preloadBar');

    // Preload anything related to the preloader image.
    this.load.image('tile', 'assets/images/tile2.png');
    this.load.image('house', 'assets/images/house.png')

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

    // Preload anything related that we want to be loaded at the start of the game here.
    this.load.image('grasTile', 'assets/images/gras-tile.png');
    this.load.image('stoneTile', 'assets/images/stone-tile.png');
    this.load.image('sandTile', 'assets/images/sand-tile.png');


  }

  create() {
    this.game.state.start('Level1', true, false);
  }
}
