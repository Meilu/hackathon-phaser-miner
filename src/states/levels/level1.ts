import { TileSprite } from './../../sprites/tile.sprite';

export class Level1 extends Phaser.State {

  private _tileMappings = {
    0: "stoneTile",
    1: "grasTile",
    2: "sandTile"
  }

  private _tilePositions: number[][] = [
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 2, 2, 2, 2, 0, 1],
    [1, 0, 2, 2, 2, 2, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1]
  ];

  private _cursors: any;

  private _tileGroup;

  preload() {

  }

  /**
   * Because we are using scalemode.RESIZE, this function will be called automatically anytime the window is resized
   * here we can reposition any element if needed.
   */
  resize() {
    console.log("resizing level1");
  }

  create() {

    // Create our tilegroup;
    this._tileGroup = this.add.group();
    this._cursors = this.game.input.keyboard.createCursorKeys();

    // Loop through rows
    for (var i = 0; i < this._tilePositions.length; i++) {

      // Loop through columns
      for (var j = 0; j < this._tilePositions[i].length; j++) {

        let x = j * 64;
        let y = i * 64;

        let tileType = this._tilePositions[i][j];

        // Determine the tiletype.
        let mappedTileType = this._tileMappings[tileType];

        let sprite = new TileSprite(this.game, x, y, mappedTileType);

        var isoPoint = this.cartesianToIsometric({ x: x, y: y });
        sprite.x = isoPoint.x;
        sprite.y = isoPoint.y;

        // Now add it to the group
        this._tileGroup.add(sprite);
      }
    }

    this._tileGroup.x = this.world.centerX;
    this._tileGroup.y = this.world.centerY - (this._tileGroup.height / 2);

  }

  update() {
    if (this._cursors.next.isDown) {
      this.game.state.start('Level2', true, false);
    }
  }

  /**
   * converts cartersian coordinates to isometric ones
   * @param cartPt
   */
  private cartesianToIsometric(cartPt: any) {
    var tempPt = new Phaser.Point();

    tempPt.x = cartPt.x - cartPt.y;
    tempPt.y = (cartPt.x + cartPt.y) / 2;

    return tempPt;
  }

  /**
   * convert isometric to cartesian.
   * @param isoPt
   */
  private isometricToCartesian(isoPt: any) {
    var tempPt = new Phaser.Point();

    tempPt.x = (2 * isoPt.y + isoPt.x) / 2;
    tempPt.y = (2 * isoPt.y - isoPt.x) / 2;

    return tempPt;
  }

}
