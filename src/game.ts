import Config from './config';
import * as Phaser from 'phaser';

export class Miner extends Phaser.Game {

    constructor() {
        super(Config.width, Config.height, Phaser.AUTO, 'content', null);

    }
}