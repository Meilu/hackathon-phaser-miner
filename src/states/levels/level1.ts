import 'phaserIsometric';

export class Level1 extends Phaser.State {

    preload() {
        this.game.plugins.add(<any>new Phaser.Plugin.Isometric(this.game));
        console.log("level1 preload");
    }

    create() {
        console.log("level1");
    }
 }