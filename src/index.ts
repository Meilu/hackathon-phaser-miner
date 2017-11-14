/// <reference path="../node_modules/phaser/typescript/phaser.d.ts"/>
/// <reference path="../node_modules/phaser/typescript/pixi.d.ts"/>
/// <reference path="../node_modules/phaser-plugin-isometric/dist/phaser.plugin.isometric.d.ts"/>
/// <reference path="../node_modules/phaser-tiled/typescript/phaser-tiled.d.ts"/>

import 'pixi';
import 'p2';
import * as Phaser from 'phaser';

import Config from './config';
import { Miner } from "./game";

class SimpleGame {
  cursors: Phaser.CursorKeys;
  game: Miner;

  constructor() {
    this.game = new Miner();

  }

  preload() {

  }

  create() {
    this.cursors = this.game.input.keyboard.createCursorKeys();

  }

  update() {
    this.game.input.update();
  }
}

window.onload = () => {
  const game = new SimpleGame();
};
