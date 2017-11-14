import * as Phaser from 'phaser';

export class Preloader extends Phaser.State {

  preloadBar: Phaser.Sprite;

  preload() {

    // Add the preloadbar sprite.
    this.preloadBar = this.add.sprite(200, 250, 'preloadBar');

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
