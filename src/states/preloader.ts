import * as Phaser from 'phaser';

export class Preloader extends Phaser.State {

    preloadBar: Phaser.Sprite;

    preload() {
        this.preloadBar = this.add.sprite(200,250, 'preloadBar');

        // Preload anything related to the preloader image.
       this.load.image('tile', 'assets/images/tile.png');

        this.load.setPreloadSprite(this.preloadBar);
    }

    create() {
        this.game.state.start('Level1', true, false);
    }
 }