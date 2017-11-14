import Config from './config';
import * as Phaser from 'phaser';
import { Boot } from "./states/boot";
import { Preloader } from "./states/preloader";
import { Level1 } from './states/levels/level1';

export class Miner extends Phaser.Game {

  constructor() {
    super(Config.width, Config.height, Phaser.AUTO, 'content', null);


    this.state.add('Boot', Boot, false);
    this.state.add('Preloader', Preloader, false);
    this.state.add('Level1', Level1, false);

    this.state.start('Boot');
  }
}
