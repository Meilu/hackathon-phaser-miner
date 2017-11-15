import 'phaserIsometric';

export class Level2 extends Phaser.State {
    private _groundGroup: Phaser.Group;
    private _buildingsGroup: Phaser.Group;
    private _cursorPosition: Phaser.Plugin.Isometric.Point3;
    private _player: Phaser.Plugin.Isometric.IsoSprite;
    private _playerDirection = Direction.S;
    private _cursors: Phaser.CursorKeys;

    private _water: Phaser.Plugin.Isometric.IsoSprite[] = [];

    private _isBuilding = false;
    private _buildingSprite: Phaser.Plugin.Isometric.IsoSprite;
    private _selectedTile: Phaser.Plugin.Isometric.IsoSprite;

    private _worldSize = 1;
    private _tileSize = 64;

    preload() {
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
    }

    create() {
        this._groundGroup = this.add.group();
        this._buildingsGroup = this.add.group();

        // Set the global gravity for IsoArcade.
        (<any>this.game).physics.isoArcade.gravity.setTo(0, 0, -500);

        this.spawnTiles();
        this._player = this.createPlayer();

        // Set up our controls.
        this._cursors = this.game.input.keyboard.createCursorKeys();

        this.game.input.keyboard.addKeyCapture([
            Phaser.Keyboard.LEFT,
            Phaser.Keyboard.RIGHT,
            Phaser.Keyboard.UP,
            Phaser.Keyboard.DOWN,
            Phaser.Keyboard.SPACEBAR,
            Phaser.Keyboard.A,
            Phaser.Keyboard.D,
            Phaser.Keyboard.W,
            Phaser.Keyboard.S,
            Phaser.Keyboard.B,
            Phaser.Keyboard.SHIFT
        ]);

        // Make the camera follow the player.
        this.game.camera.follow(this._player);

        // Provide a 3D position for the cursor
        this._cursorPosition = new Phaser.Plugin.Isometric.Point3();

        // Start the map with two buildings.
        this.startBuilding(2);
        this.build(256, 768);
        this.startBuilding(4);
        this.build(640, 192);
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

        this.movePlayer();

        // Our collision and sorting code again.
        (<any>this.game).physics.isoArcade.collide(this._groundGroup);
        (<any>this.game).iso.topologicalSort(this._groundGroup);

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

    private spawnTiles(): void {
        var tileArray = [];
        tileArray[0] = 'water';
        tileArray[1] = 'sand';
        tileArray[2] = 'grass';
        tileArray[3] = 'grassy';
        tileArray[4] = 'earth';
        tileArray[5] = 'stone';
        tileArray[6] = 'lava';

        var tiles = [
            3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            3, 3, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4,
            3, 3, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4,
            3, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4,
            3, 0, 0, 0, 0, 0, 3, 3, 3, 3, 3, 3, 3, 4, 4,
            3, 3, 3, 0, 0, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3,
            1, 1, 1, 1, 1, 1, 3, 3, 3, 3, 3, 3, 3, 3, 3,
        ];

        var i = 0;
        for (var y = this._tileSize; y <= (<any>this.game).physics.isoArcade.bounds.frontY - this._tileSize; y += this._tileSize) {
            for (var x = this._tileSize; x <= (<any>this.game).physics.isoArcade.bounds.frontX - this._tileSize; x += this._tileSize) {
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

    private createPlayer(): Phaser.Plugin.Isometric.IsoSprite {
        // TODO: fix jumping bug when we start on spaceCraftS.
        var player: Phaser.Plugin.Isometric.IsoSprite = (<any>this.add).isoSprite(550, 550, 0, "spaceCraftNE", 0, this._buildingsGroup);
        //player.loadTexture("spaceCraftS");

        player.anchor.set(0.5);

        (<any>this.game).physics.isoArcade.enable(player);
        player.body.collideWorldBounds = true;
        player.body.setSize(200, 200, 70, -50, -50);

        var space = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        space.onDown.add(() => {
            player.body.velocity.z = 300;
        }, this);

        return player;
    }

    private movePlayer() {
        var isUpKeyDown = this._cursors.up.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.W);
        var isRightKeyDown = this._cursors.right.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.D);
        var isLeftKeyDown = this._cursors.left.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.A);
        var isDownKeyDown = this._cursors.down.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.S);
        var isShiftKeyDown = this.game.input.keyboard.isDown(Phaser.Keyboard.SHIFT);

        // Move the player at this speed.
        var speed = 200;
        var diagonalSpeed = 230;

        if (isShiftKeyDown) {
            speed = speed * 2;
            diagonalSpeed = diagonalSpeed * 2;
        }

        var newDirection: Direction = undefined;
        if (isUpKeyDown) {
            if (isRightKeyDown) {
                newDirection = Direction.NE;
                this._player.body.velocity.x = 0;
                this._player.body.velocity.y = -diagonalSpeed;
            }
            else if (isLeftKeyDown) {
                newDirection = Direction.NW;
                this._player.body.velocity.x = -diagonalSpeed;
                this._player.body.velocity.y = 0;
            }
            else {
                newDirection = Direction.N;
                this._player.body.velocity.x = -speed;
                this._player.body.velocity.y = -speed;
            }
        }
        else if (isDownKeyDown) {
            if (isRightKeyDown) {
                newDirection = Direction.SE;
                this._player.body.velocity.x = diagonalSpeed;
                this._player.body.velocity.y = 0;
            }
            else if (isLeftKeyDown) {
                newDirection = Direction.SW;
                this._player.body.velocity.x = 0;
                this._player.body.velocity.y = diagonalSpeed;
            }
            else {
                newDirection = Direction.S;
                this._player.body.velocity.x = speed;
                this._player.body.velocity.y = speed;
            }
        }
        else if (isRightKeyDown) {
            newDirection = Direction.E;
            this._player.body.velocity.x = speed;
            this._player.body.velocity.y = -speed;
        }
        else if (isLeftKeyDown) {
            newDirection = Direction.W;
            this._player.body.velocity.x = -speed;
            this._player.body.velocity.y = speed;
        }
        else {
            this._player.body.velocity.x = 0;
            this._player.body.velocity.y = 0;
        }

        // Load the right direction texture.
        if (newDirection != undefined && newDirection != null && newDirection != this._playerDirection) {
            this._player.loadTexture("spaceCraft" + Direction[newDirection].toString());
            this._playerDirection = newDirection;
        }
    }

    private startBuilding(buildingNumber: number) {
        if (this._isBuilding)
            this.stopBuilding();

        this._buildingSprite = (<any>this.game).add.isoSprite(0, 0, 0, 'building' + buildingNumber, 0, this._buildingsGroup);
        this._buildingSprite.tint = 0x86bfda;
        this._buildingSprite.anchor.set(0.5, 0.5);

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