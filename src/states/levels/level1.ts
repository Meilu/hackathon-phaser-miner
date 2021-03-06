import { TileSprite } from './../../sprites/tile.sprite';
import * as firebase from 'firebase';



export class Level1 extends Phaser.State {

  private _cursors: any;

  private _map;
  private _groundLayer;
  private _rockLayer;
  private _objectLayer;
  private _player: Phaser.Sprite;

  private _gameWorldGroup: Phaser.Group;

  private _fireBaseApp;
  private _firebaseUser;
  private _auth;
  private _velocity = 150;
  preload() {

    var config = {
      apiKey: "AIzaSyBqaEksBFhZbwG4X5J5kfYXSnePM8YkRVk",
      authDomain: "hackathon-miner.firebaseapp.com",
      databaseURL: "https://hackathon-miner.firebaseio.com",
      projectId: "hackathon-miner",
      storageBucket: "hackathon-miner.appspot.com",
      messagingSenderId: "770754233104"
    };

    this._fireBaseApp = firebase.initializeApp(config);

    this._auth = this._fireBaseApp.auth();
    //var playerId = getRandomArbitrary(0, 100);
    //var grid = getMatrix(140, 210, 0);

    //function setGrid(firebase){
    //	firebase.database().ref('grid').set(getMatrix(140, 210, 0));
    //}

    this._auth.signInAnonymously();

    this.game.physics.startSystem(Phaser.Physics.ARCADE);
    this.game.stage.backgroundColor = "#ffffff";
  }

  create() {

    this._map = this.game.add.tilemap('level1');
    this._map.addTilesetImage('desert', 'desertSprite');


    this._groundLayer = this._map.createLayer('ground');
    this._rockLayer = this._map.createLayer('rocks_water');

    this._groundLayer.resizeWorld();
    this._rockLayer.resizeWorld();

    // Enable collision on the rocks/water layer.
    this._map.setCollisionBetween(1, 100000, true, 'rocks_water');

    //create player
    var result = this.findObjectsByType('player', 'startpoints')

    this._player = this.game.add.sprite(result[0].x, result[0].y, 'hoverminer');
    this._player.animations.add('left', Phaser.Animation.generateFrameNames('copter-left', 1, 2), 5, true);
    this._player.animations.add('right', Phaser.Animation.generateFrameNames('copter-right', 1, 2), 5, true);
    this._player.animations.add('down', Phaser.Animation.generateFrameNames('copter-down', 1, 2), 5, true);
    this._player.animations.add('up', Phaser.Animation.generateFrameNames('copter-up', 1, 2), 5, true);

    this._auth.onAuthStateChanged((user: any) => {

      this._fireBaseApp.database().ref('mining-cart/' + this._auth.currentUser.uid).set({
        t: 'player',
        x: result[0].x,
        y: result[0].y,
      });
    });


    this._player.animations.play('left');

    this.game.physics.arcade.enable(this._player);

    //the camera will follow the player in the world
    this.game.camera.follow(this._player);

    //move player with cursor keys
    this._cursors = this.game.input.keyboard.createCursorKeys();
  }


  public update() {
    var positionChanged = false;

    //player movement
    this._player.body.velocity.y = 0;
    this._player.body.velocity.x = 0;

    this.game.physics.arcade.collide(this._player, this._rockLayer);

    if (this._cursors.up.isDown) {
      positionChanged = true;
      this._player.body.velocity.y -= this._velocity;
      this._player.animations.play('up');
    }
    else if (this._cursors.down.isDown) {
      positionChanged = true;
      this._player.body.velocity.y += this._velocity;
      this._player.animations.play('down');
    }
    if (this._cursors.left.isDown) {
      positionChanged = true;
      this._player.body.velocity.x -= this._velocity;
      this._player.animations.play('left');
    }
    else if (this._cursors.right.isDown) {
      positionChanged = true;
      this._player.body.velocity.x += this._velocity;
      this._player.animations.play('right');
    }

    if (positionChanged) {
      this._fireBaseApp.database().ref('mining-cart/' + this._auth.currentUser.uid).set({
        x: this._player.position.x,
        y: this._player.position.y,
      });
    }

  }

  private findObjectsByType(type: string, layer: string) {
    var result = [];

    this._map.objects[layer].forEach((element: any) => {
      if (element.type === type) {
        //Phaser uses top left, Tiled bottom left so we have to adjust the y position
        element.y -= this._map.tileHeight;
        result.push(element);
      }
    });

    return result;
  }

  private createSpritFromTiledObject(element: any, group: any) {

    var sprite = group.create(element.x, element.y, element.properties.sprite);

    //copy all properties to the sprite
    Object.keys(element.properties).forEach(function (key) {
      sprite[key] = element.properties[key];
    });
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
