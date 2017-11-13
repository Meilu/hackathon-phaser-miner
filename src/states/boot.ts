import * as Phaser from 'phaser';

export class Boot extends Phaser.State {
    preload() {
        // Preload anything related to the preloader image.
       this.load.image('preloadBar', 'assets/images/loader.png');
    }

    create() {
        //  Unless you specifically need to support multitouch I would recommend setting this to 1
        this.input.maxPointers = 1;

        //  Phaser will automatically pause if the browser tab the game is in loses focus. You can disable that here:
        this.stage.disableVisibilityChange = true;

        this.game.state.start('Preloader', true, false);
    }
 }