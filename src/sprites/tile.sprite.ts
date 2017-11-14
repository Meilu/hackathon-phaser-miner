import * as Phaser from 'phaser';

export class TileSprite extends Phaser.Sprite {

  constructor(game: Phaser.Game, x: number, y: number, tile: string) {
    super(game, x, y, tile, 0);

    this.anchor.setTo(0.5, 0);
  }
}
