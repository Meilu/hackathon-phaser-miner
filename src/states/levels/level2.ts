import 'phaserIsometric';
import '../../scripts/phaser-virtual-joystick.js';
import * as firebase from 'firebase';

export class MinerPlayerDocument {
  // Database properties.
  public uid: string;
  public x = 0;
  public y = 0;
  public z = 0;
  public direction = Direction.S;
  public hasFallenDown = false;
}
export class MinerPlayer {
  public uid: string;
  public direction = Direction.S;
  public sprite: Phaser.Plugin.Isometric.IsoSprite;
  public updatePosition = false;
}

export class Level2 extends Phaser.State {
  private _nextGameHref = "src/map/map.html";

  private _cursorPosition: Phaser.Plugin.Isometric.Point3;
  private _joystick: any;
  private _cursors: Phaser.CursorKeys;

  private _groundGroup: Phaser.Group;
  private _water: Phaser.Plugin.Isometric.IsoSprite[] = [];
  private _emptyTilePositions: any[] = [];
  private _startTilePositions: any[] = [];

  private _buildingsGroup: Phaser.Group;
  private _addedBuildings: Phaser.Plugin.Isometric.IsoSprite[] = [];
  private _otherPlayersGroups: Phaser.Group[] = [];

  private _player: MinerPlayer;
  private _otherPlayers: MinerPlayer[] = [];

  private _isBuilding = false;
  private _buildingSprite: Phaser.Plugin.Isometric.IsoSprite;
  private _selectedTile: Phaser.Plugin.Isometric.IsoSprite;
  private _isFallingDown = false;

  private _worldSize = 1;
  private _tileSize = 64;

  private _firebaseApp: firebase.app.App;
  private _firebaseAuth: firebase.auth.Auth;
  private _firebaseTableRef: firebase.database.Reference;
  private _firebasePlayerDocumentRef: firebase.database.Reference;

  preload() {
    this.setupFirebase();

    this.game.plugins.add(<any>new Phaser.Plugin.Isometric(this.game));

    // This is used to set a game canvas-based offset for the 0, 0, 0 isometric coordinate - by default
    // this point would be at screen coordinates 0, 0 (top left) which is usually undesirable.
    // When using camera following, it's best to keep the Y anchor set to 0, which will let the camera
    // cover the full size of your world bounds.
    (<any>this.game).iso.anchor.setTo(0.5, 0);
    (<any>this.game).iso.projectionAngle = 0.523599; // 30 degrees

    this.game.time.advancedTiming = true;

    // In order to have the camera move, we need to increase the size of our world bounds.
    this.game.world.setBounds(0, 0, 2048 * this._worldSize, 1024 * this._worldSize);

    // Start the IsoArcade physics system.
    this.game.physics.startSystem(Phaser.Plugin.Isometric.ISOARCADE);

    // TODO: bij resizen blijft de joystick staan.
    // this.game.scale.onSizeChange.add(() => {
    //     if (this._joystick) {
    //         this._joystick.position = new Phaser.Point(this.game.width - 150, this.game.height - 150);
    //     }
    // });
  }

  create() {
    this._groundGroup = this.add.group();
    this._buildingsGroup = this.add.group();

    // Set the global gravity for IsoArcade.
    (<any>this.game).physics.isoArcade.gravity.setTo(0, 0, -500);

    this.spawnTiles();

    this._firebaseAuth.onAuthStateChanged((user: firebase.User) => {
      this._firebasePlayerDocumentRef = this._firebaseApp.database().ref('mining-cart/' + this._firebaseAuth.currentUser.uid);
      this._firebaseTableRef = this._firebaseApp.database().ref('mining-cart');

      var startPosition = this.calculateStartPosition();
      // Create the player.
      this._player = this.createPlayer(this._firebaseAuth.currentUser.uid, startPosition[0], startPosition[1], 0, false);

      this._firebasePlayerDocumentRef.set({
        x: this._player.sprite.isoX,
        y: this._player.sprite.isoY,
        z: this._player.sprite.isoZ,
        direction: this._player.direction
      });

      // Remove the player when he stops playing.
      window.onunload = ((e: any) => {
        this._firebasePlayerDocumentRef.remove();
      });

      // Make the camera follow the player.
      this.game.camera.follow(this._player.sprite);

      // Listen to table changes to handle other players.
      this._firebaseTableRef.on("value", (snapshot: any) => {
        snapshot.forEach((childSnapshot: any) => {
          // Only listen to documents from oither players.
          if (childSnapshot.key != this._firebaseAuth.currentUser.uid) {
            var document: MinerPlayerDocument = {
              uid: childSnapshot.key,
              x: childSnapshot.val().x,
              y: childSnapshot.val().y,
              z: childSnapshot.val().z,
              direction: childSnapshot.val().direction,
              hasFallenDown: childSnapshot.val().hasFallenDown
            };

            this.handleOtherPlayerDocument(document);
          }
        });
      });

      this._firebaseTableRef.on("child_removed", (childSnapshot: any) => {
        this._otherPlayers.forEach((player: MinerPlayer) => {
          if (player.uid == childSnapshot.key) {
            this._otherPlayers.splice(this._otherPlayers.indexOf(player), 1);

            var tween = this.game.add.tween(player.sprite).to({ isoZ: 1000 }, 1000, Phaser.Easing.Exponential.In);
            tween.onComplete.add(() => {
              player.sprite.destroy();
            });
            tween.start();
          }
        });
      });
    });

    // Set up our controls.
    this._cursors = this.game.input.keyboard.createCursorKeys();

    if (!this.game.device.desktop) {
      // Add the VirtualGamepad plugin to the game.
      var gamepad = this.game.plugins.add((<any>Phaser.Plugin).VirtualGamepad);
      // Add a joystick to the game.
      this._joystick = (<any>gamepad).addJoystick(this.game.width - 200, this.game.height - 200, 1.2, 'gamepad');
      // Add a button to the game. Place it outside of the screen, since we don't use it.
      var button = (<any>gamepad).addButton(-100, -100, 1.0, 'gamepad');
    }

    // Provide a 3D position for the cursor
    this._cursorPosition = new Phaser.Plugin.Isometric.Point3();

    // Start the map with two buildings.
    this.startBuilding(2, false);
    this.build(256, 768);
    this.startBuilding(4, false);
    this.build(490, 192);
  }

  update() {
    // Update the cursor position.
    // It's important to understand that screen-to-isometric projection means you have to specify a z position manually, as this cannot be easily
    // determined from the 2D pointer position without extra trickery. By default, the z position is 0 if not set.
    (<any>this.game).iso.unproject(this.game.input.activePointer.position, this._cursorPosition);

    // Loop through all tiles and test to see if the 3D position from above intersects with the automatically generated IsoSprite tile bounds.
    this._groundGroup.forEach((tile: any) => {
      var inBounds = tile.isoBounds.containsXY(this._cursorPosition.x, this._cursorPosition.y);
      // If it does, do a little animation and tint change.
      if (!tile.selected && inBounds) {
        tile.selected = true;
        tile.tint = 0xfff2cc
        this._selectedTile = tile;
        this.game.add.tween(tile).to({ isoZ: 6 }, 200, Phaser.Easing.Quadratic.InOut, true);

        // If we are building update the position of the sprite.
        if (this._isBuilding && this._buildingSprite)
          this._buildingSprite.isoPosition.setTo(tile.isoX, tile.isoY);
      }
      // If not, revert back to how it was.
      else if (tile.selected && !inBounds) {
        tile.selected = false;
        tile.tint = 0xffffff;
        this.game.add.tween(tile).to({ isoZ: 0 }, 200, Phaser.Easing.Quadratic.InOut, true);
      }
    }, this);

    if (this._water) {
      this._water.forEach((w: any) => {
        if (w.selected)
          return;

        w.isoZ = (-2 * Math.sin((this.game.time.now + (w.isoX * 7)) * 0.004)) + (-1 * Math.sin((this.game.time.now + (w.isoY * 8)) * 0.005));
        w.alpha = Phaser.Math.clamp(1 + (w.isoZ * 0.1), 0.2, 1);
      });
    }

    // On ESC stop building.
    if (this._isBuilding && this.game.input.keyboard.isDown(Phaser.Keyboard.ESC)) {
      this.stopBuilding();
    }
    else {//if (this.game.input.keyboard.isDown(Phaser.Keyboard.B)) {
      if (this.game.input.keyboard.isDown(Phaser.Keyboard.ONE))
        this.startBuilding(1);
      else if (this.game.input.keyboard.isDown(Phaser.Keyboard.TWO))
        this.startBuilding(2);
      else if (this.game.input.keyboard.isDown(Phaser.Keyboard.THREE))
        this.startBuilding(3);
      else if (this.game.input.keyboard.isDown(Phaser.Keyboard.FOUR))
        this.startBuilding(4);
      else if (this.game.input.keyboard.isDown(Phaser.Keyboard.FIVE))
        this.startBuilding(5);
      else if (this.game.input.keyboard.isDown(Phaser.Keyboard.SIX))
        this.startBuilding(6);
      else if (this.game.input.keyboard.isDown(Phaser.Keyboard.SEVEN))
        this.startBuilding(7);
    }

    if (this.game.input.keyboard.isDown(Phaser.Keyboard.DELETE)) {
      this._addedBuildings.forEach((buildingSprite: Phaser.Plugin.Isometric.IsoSprite) => {
        buildingSprite.destroy();
      });

      // Remove otherplayers from firebase.
      this._otherPlayers.forEach((otherPlayer: MinerPlayer) => {
        this._firebaseApp.database().ref('mining-cart/' + otherPlayer.uid).remove();
      });
    }

    if (this._player)
      this.movePlayer();

    if (this._player) {
      if (this.shouldFall()) {
        this.fallDown();
      }
      if (this._isFallingDown && this._player.sprite.isoZ < -130) {
        // Stop following the player.
        this.game.camera.unfollow();

        // Remove the player.
        this._player.sprite.body.moves = false;
        this._player.sprite.body.immovable = true;
        this.setPosition(this._player.sprite, -10000, -10000);
        this._player.sprite.destroy();

        this._firebasePlayerDocumentRef.set({ hasFallenDown: true });

        this.camera.fade(0x000000);
        this.camera.onFadeComplete.add(() => {
          window.location.href = this._nextGameHref;
        }, this);
      }
    }
    this._otherPlayers.forEach((player: MinerPlayer) => {
      if (player.sprite.isoZ < -50) {
        // Remove the player.
        player.sprite.body.moves = false;
        player.sprite.body.immovable = true;
        this.setPosition(player.sprite, -10000, -10000);
        player.sprite.destroy();

        this._otherPlayers.splice(this._otherPlayers.indexOf(player), 1);
      }
    });

    // Our collision and sorting code again.
    (<any>this.game).physics.isoArcade.collide(this._groundGroup);
    (<any>this.game).iso.topologicalSort(this._groundGroup);

    this._otherPlayersGroups.forEach((group: any) => {
      (<any>this.game).iso.topologicalSort(group);
    });

    (<any>this.game).physics.isoArcade.collide(this._buildingsGroup);
    (<any>this.game).iso.topologicalSort(this._buildingsGroup);
  }

  render() {
    // Use for debugging:

    // this._groundGroup.forEach((sprite: any) => {
    //     this.game.debug.body(sprite);
    // }, this);
    // this._buildingsGroup.forEach((sprite: any) => {
    //     this.game.debug.body(sprite);
    // }, this);
    // this.game.debug.pixel(10, 10, "blue", 10);
  }

  private setupFirebase() {
    var config = {
      apiKey: "AIzaSyBqaEksBFhZbwG4X5J5kfYXSnePM8YkRVk",
      authDomain: "hackathon-miner.firebaseapp.com",
      databaseURL: "https://hackathon-miner.firebaseio.com",
      projectId: "hackathon-miner",
      storageBucket: "hackathon-miner.appspot.com",
      messagingSenderId: "770754233104"
    };

    this._firebaseApp = firebase.initializeApp(config);
    this._firebaseAuth = this._firebaseApp.auth();
    this._firebaseAuth.signInAnonymously();
  }

  private handleOtherPlayerDocument(document: MinerPlayerDocument) {
    var exists = false;

    // Check if the player exists already, if not create it.
    this._otherPlayers.forEach((player: MinerPlayer) => {
      if (player.uid == document.uid)
        exists = true;
    });

    // Create a new player if it did not exist yet.
    if (exists == false) {
      var newOtherPlayer = this.createPlayer(document.uid, document.x, document.y, 200, true);
      newOtherPlayer.sprite.body.moves = false;
      newOtherPlayer.sprite.body.immovable = true;
      newOtherPlayer.sprite.alpha = 0;

      var tween = this.game.add.tween(newOtherPlayer.sprite).to({ isoZ: 0, alpha: 1 }, 1000, Phaser.Easing.Bounce.Out);
      tween.onComplete.add(() => {
        newOtherPlayer.updatePosition = true;
      });
      tween.start();
      this._otherPlayers.push(newOtherPlayer);
    }

    // Set the position and direction of the other player.
    // Loop through all players
    this._otherPlayers.forEach((player: MinerPlayer) => {
      if (player.uid == document.uid) {
        if (document.hasFallenDown) {
          player.sprite.destroy();
        }
        else {
          if (player.updatePosition)
            this.setPosition(player.sprite, document.x, document.y, document.z);
          this.setDirection(player.sprite, document.direction);
        }
      }
    });
  }

  private spawnTiles(): void {
    var tileArray = [];
    tileArray[0] = 'water';
    tileArray[1] = 'sand';
    tileArray[2] = 'grass';
    tileArray[3] = 'grassy';
    tileArray[4] = 'earth';
    tileArray[5] = 'stone';
    tileArray[6] = 'grassy';
    tileArray[7] = 'empty';

    var tiles = [
      3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
      3, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4,
      3, 3, 0, 0, 0, 3, 3, 3, 3, 3, 3, 4, 7, 7, 4,
      3, 0, 0, 0, 0, 0, 3, 3, 3, 3, 4, 7, 7, 7, 4,
      3, 0, 0, 0, 0, 0, 3, 3, 3, 3, 4, 7, 7, 7, 4,
      3, 3, 3, 0, 0, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4,
      3, 3, 3, 3, 3, 3, 6, 6, 6, 6, 3, 3, 3, 3, 3,
      1, 3, 3, 3, 3, 3, 6, 6, 6, 6, 3, 3, 3, 3, 3,
      1, 3, 3, 3, 3, 3, 6, 6, 6, 6, 3, 3, 3, 3, 3,
      1, 1, 1, 3, 3, 3, 6, 6, 6, 6, 3, 3, 3, 3, 3,
      1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
      1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
      1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
      1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3,
      1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3,
    ];

    var i = 0;
    for (var y = this._tileSize; y <= (<any>this.game).physics.isoArcade.bounds.frontY - this._tileSize; y += this._tileSize) {
      for (var x = this._tileSize; x <= (<any>this.game).physics.isoArcade.bounds.frontX - this._tileSize; x += this._tileSize) {
        // Don't draw tiles on empty spots.
        if (tiles[i] == 7) {
          this._emptyTilePositions.push([x, y]);
          i++;
          continue;
        }
        // Save the start tile positions.
        if (tiles[i] == 6) {
          this._startTilePositions.push([x, y]);
        }

        var tile: Phaser.Plugin.Isometric.IsoSprite = (<any>this.game).add.isoSprite(x, y, 0, tileArray[tiles[i]], 0, this._groundGroup);
        tile.anchor.set(0.5, 0);
        tile.smoothed = false;

        (<any>this.game).physics.isoArcade.enable(tile);
        tile.body.moves = false;
        tile.body.collideWorldBounds = true;

        tile.inputEnabled = true;
        tile.events.onInputDown.add((tile: Phaser.Plugin.Isometric.IsoSprite) => {
          if (this._isBuilding)
            this.build(tile.isoX, tile.isoY);
        });

        if (tiles[i] === 0) {
          this._water.push(tile);
        }
        i++;
      }
    }
  }

  private calculateStartPosition() {
    if (!this._startTilePositions || this._startTilePositions.length == 0)
      return [550, 550];

    // Return a random startTile position.
    return this._startTilePositions[Math.floor(Math.random() * this._startTilePositions.length)];
  }

  private createPlayer(uid: string, isoX: number, isoY: number, isoZ: number, isOtherPlayer: boolean): MinerPlayer {
    var newGroup;
    if (isOtherPlayer) {
      newGroup = this.add.group();
      this._otherPlayersGroups.push(newGroup);
    }
    // TODO: fix jumping bug when we start on spaceCraftS.
    var playerSprite: Phaser.Plugin.Isometric.IsoSprite = (<any>this.game).add.isoSprite(isoX, isoY, isoZ, "spaceCraftSE", 0, !isOtherPlayer ? this._buildingsGroup : newGroup);
    //player.loadTexture("spaceCraftS");

    playerSprite.anchor.set(0.5);
    playerSprite.scale.setTo(0.5, 0.5);

    (<any>this.game).physics.isoArcade.enable(playerSprite);
    playerSprite.body.collideWorldBounds = true;
    //player.body.setSize(200, 200, 70, -50, -50);
    playerSprite.body.setSize(250, 250, 70, 0, 0);

    // var space = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

    // space.onDown.add(() => {
    //     playerSprite.body.velocity.z = 300;
    // }, this);

    return {
      uid: uid,
      direction: Direction.S,
      sprite: playerSprite,
      updatePosition: isOtherPlayer ? false : true
    };
  }

  private movePlayer() {
    var isUpKeyDown = this._cursors.up.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.W) || (this._joystick && this._joystick.properties.up);
    var isRightKeyDown = this._cursors.right.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.D) || (this._joystick && this._joystick.properties.right);
    var isLeftKeyDown = this._cursors.left.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.A) || (this._joystick && this._joystick.properties.left);
    var isDownKeyDown = this._cursors.down.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.S) || (this._joystick && this._joystick.properties.down);
    var isShiftKeyDown = this.game.input.keyboard.isDown(Phaser.Keyboard.SHIFT);

    // Move the player at this speed.
    var speed = 200;
    var diagonalSpeed = 230;

    if (isShiftKeyDown) {
      speed = speed * 2;
      diagonalSpeed = diagonalSpeed * 2;
    }

    var positionChanged = true;
    var newDirection: Direction = undefined;
    if (isUpKeyDown) {
      if (isRightKeyDown) {
        newDirection = Direction.NE;
        this._player.sprite.body.velocity.x = 0;
        this._player.sprite.body.velocity.y = -diagonalSpeed;
      }
      else if (isLeftKeyDown) {
        newDirection = Direction.NW;
        this._player.sprite.body.velocity.x = -diagonalSpeed;
        this._player.sprite.body.velocity.y = 0;
      }
      else {
        newDirection = Direction.N;
        this._player.sprite.body.velocity.x = -speed;
        this._player.sprite.body.velocity.y = -speed;
      }
    }
    else if (isDownKeyDown) {
      if (isRightKeyDown) {
        newDirection = Direction.SE;
        this._player.sprite.body.velocity.x = diagonalSpeed;
        this._player.sprite.body.velocity.y = 0;
      }
      else if (isLeftKeyDown) {
        newDirection = Direction.SW;
        this._player.sprite.body.velocity.x = 0;
        this._player.sprite.body.velocity.y = diagonalSpeed;
      }
      else {
        newDirection = Direction.S;
        this._player.sprite.body.velocity.x = speed;
        this._player.sprite.body.velocity.y = speed;
      }
    }
    else if (isRightKeyDown) {
      newDirection = Direction.E;
      this._player.sprite.body.velocity.x = speed;
      this._player.sprite.body.velocity.y = -speed;
    }
    else if (isLeftKeyDown) {
      newDirection = Direction.W;
      this._player.sprite.body.velocity.x = -speed;
      this._player.sprite.body.velocity.y = speed;
    }
    else {
      this._player.sprite.body.velocity.x = 0;
      this._player.sprite.body.velocity.y = 0;
      positionChanged = false;
    }

    // Load the right direction texture.
    if (newDirection != undefined && newDirection != null && newDirection != this._player.direction) {
      this.setDirection(this._player.sprite, newDirection);
      this._player.direction = newDirection;
    }

    // Update the document in Firebase.
    if (this._firebasePlayerDocumentRef && (positionChanged || this._isFallingDown)) {
      this._firebasePlayerDocumentRef.set({
        x: this._player.sprite.isoX,
        y: this._player.sprite.isoY,
        z: this._player.sprite.isoZ,
        direction: this._player.direction
      });
    }
  }

  private shouldFall() {
    var shouldFall = false;
    this._emptyTilePositions.forEach((emptyTilePosition: number[]) => {
      if (this._player.sprite.isoX > emptyTilePosition[0] && this._player.sprite.isoX < emptyTilePosition[0] + this._tileSize &&
        this._player.sprite.isoY > emptyTilePosition[1] && this._player.sprite.isoY < emptyTilePosition[1] + this._tileSize) {
        shouldFall = true;
      }
    });

    return shouldFall;
  }
  private fallDown() {
    if (this._isFallingDown)
      return;

    this._isFallingDown = true;

    this._buildingsGroup.remove(this._player.sprite);
    this._groundGroup.add(this._player.sprite);

    this._player.sprite.body.setSize(100, 100, 70, 0, 0);
    this._player.sprite.body.collideWorldBounds = false;
  }

  private setPosition(sprite: Phaser.Plugin.Isometric.IsoSprite, isoX: number, isoY: number, isoZ?: number) {
    sprite.isoPosition.setTo(isoX, isoY, isoZ);
  }
  private setDirection(sprite: Phaser.Plugin.Isometric.IsoSprite, direction: Direction) {
    try {
      sprite.loadTexture("spaceCraft" + Direction[direction].toString());
    }
    catch (e) { }
  }

  private startBuilding(buildingNumber: number, isAdded: boolean = true) {
    if (this._isBuilding)
      this.stopBuilding();

    this._buildingSprite = (<any>this.game).add.isoSprite(0, 0, 0, 'building' + buildingNumber, 0, this._buildingsGroup);
    this._buildingSprite.tint = 0x86bfda;
    this._buildingSprite.anchor.set(0.5, 0.5);

    if (isAdded)
      this._addedBuildings.push(this._buildingSprite);

    // Enable the physics body on this sprite.
    (<any>this.game).physics.isoArcade.enable(this._buildingSprite);
    switch (buildingNumber) {
      case 1:
        this._buildingSprite.body.setSize(300, 300, 100, -100, -100);
        break;
      case 2:
        this._buildingSprite.body.setSize(260, 260, 70, -60, -70);
        break;
      case 3:
        this._buildingSprite.body.setSize(140, 220, 120, -10, -60);
        break;
      case 4:
        this._buildingSprite.body.setSize(180, 180, 100, -20, -25);
        break;
      case 5:
        this._buildingSprite.body.setSize(180, 210, 70, -60, -55);
        break;
      case 6:
        this._buildingSprite.body.setSize(200, 265, 160, -85, -80);
        break;
      case 7:
        this._buildingSprite.body.setSize(180, 110, 80, -20, 20);
        break;
    }
    this._buildingSprite.body.collideWorldBounds = true;

    // Make the building always follow the cursor.
    //this._buildingSprite.body.position = this._cursorPosition;

    // Base the position on the selected tile.
    this._buildingSprite.body.moves = false;
    this._buildingSprite.body.immovable = true;
    if (this._selectedTile)
      this._buildingSprite.isoPosition.setTo(this._selectedTile.isoX, this._selectedTile.isoY);

    this._isBuilding = true;
  }

  private stopBuilding() {
    if (this._buildingSprite) {
      this._buildingSprite.destroy();
      this._buildingSprite = undefined;
    }
    this._isBuilding = false;
  }

  private build(isoX?: number, isoY?: number) {
    // Stop following the cursor.
    //this._buildingSprite.body.position = new Phaser.Point();

    var buildingSprite = this._buildingSprite;

    // Stop the building procedure.
    this._buildingSprite = undefined;
    this.stopBuilding();

    if (isoX || isoY) {
      // Set the building to the right position.
      buildingSprite.body.moves = false;
      buildingSprite.body.immovable = true;
      buildingSprite.isoPosition.setTo(isoX, isoY);
    }

    // Set the tint back to normal.
    buildingSprite.tint = 0xffffff;

    // Animate the building by bouncing downward.
    var tween = this.game.add.tween(buildingSprite).to({ isoZ: 70 }, 1).to({ isoZ: 0 }, 1000, Phaser.Easing.Bounce.Out);
    tween.start();
  }
}

enum Direction {
  E,
  N,
  NE,
  NW,
  S,
  SE,
  SW,
  W
}