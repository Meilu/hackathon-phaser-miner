import 'phaserIsometric';

export class Level2 extends Phaser.State {
    private _groundGroup: Phaser.Group;
    private _buildingsGroup: Phaser.Group;
    private _cursorPosition: Phaser.Plugin.Isometric.Point3;
    private _player: Phaser.Plugin.Isometric.IsoSprite;
    private _cursors: Phaser.CursorKeys;
    private _house: Phaser.Plugin.Isometric.IsoSprite;

    private _playerDirection = Direction.S;

    preload() {
        this.game.plugins.add(<any>new Phaser.Plugin.Isometric(this.game));

        // This is used to set a game canvas-based offset for the 0, 0, 0 isometric coordinate - by default
        // this point would be at screen coordinates 0, 0 (top left) which is usually undesirable.
        // When using camera following, it's best to keep the Y anchor set to 0, which will let the camera
        // cover the full size of your world bounds.
        (<any>this.game).iso.anchor.setTo(0.5, 0);

        (<any>this.game).iso.projectionAngle = 2.53073; // 145 degrees

        this.game.time.advancedTiming = true;

        // In order to have the camera move, we need to increase the size of our world bounds.
        this.game.world.setBounds(0, 0, 2048, 1024);

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
            Phaser.Keyboard.B
        ]);

        // Make the camera follow the player.
        this.game.camera.follow(this._player);

        // Provide a 3D position for the cursor
        this._cursorPosition = new Phaser.Plugin.Isometric.Point3();
    }

    update() {
        // Update the cursor position.
        // It's important to understand that screen-to-isometric projection means you have to specify a z position manually, as this cannot be easily
        // determined from the 2D pointer position without extra trickery. By default, the z position is 0 if not set.
        (<any>this.game).iso.unproject(this.game.input.activePointer.position, this._cursorPosition);

        if (this._house)
            this._house.body.position = this._cursorPosition;

        // Loop through all tiles and test to see if the 3D position from above intersects with the automatically generated IsoSprite tile bounds.
        this._groundGroup.forEach((tile: any) => {
            var inBounds = tile.isoBounds.containsXY(this._cursorPosition.x, this._cursorPosition.y);
            // If it does, do a little animation and tint change.
            if (!tile.selected && inBounds) {
                tile.selected = true;
                tile.tint = 0x86bfda;
                this.game.add.tween(tile).to({ isoZ: 4 }, 200, Phaser.Easing.Quadratic.InOut, true);
            }
            // If not, revert back to how it was.
            else if (tile.selected && !inBounds) {
                tile.selected = false;
                tile.tint = 0xffffff;
                this.game.add.tween(tile).to({ isoZ: 0 }, 200, Phaser.Easing.Quadratic.InOut, true);
            }
        }, this);

        if (this.game.input.keyboard.isDown(Phaser.Keyboard.B)) {
            this.wantToBuildHouse();
        }

        this.movePlayer();

        // Our collision and sorting code again.
        (<any>this.game).physics.isoArcade.collide(this._buildingsGroup);
        (<any>this.game).iso.topologicalSort(this._buildingsGroup);
    }

    render() {
        // this._groundGroup.forEach((sprite: any) => {
        //     this.game.debug.body(sprite);
        // }, this);
        // this._buildingsGroup.forEach((sprite: any) => {
        //     this.game.debug.body(sprite);
        // }, this);
        // this.game.debug.pixel(10, 10, "blue", 10);
    }

    private spawnTiles(): void {
        for (var xx = 0; xx < 1000; xx += 92) {
            for (var yy = 0; yy < 1000; yy += 92) {
                // Create a tile using the new game.add.isoSprite factory method at the specified position.
                // The last parameter is the group you want to add it to (just like game.add.sprite)
                var tile = (<any>this.add).isoSprite(xx, yy, 0, 'tile', 0, this._groundGroup);
                tile.anchor.set(0.5, 0);

                tile.inputEnabled = true;
                tile.events.onInputDown.add((tile: Phaser.Plugin.Isometric.IsoSprite) => {
                    this.buildHouse(tile.isoX, tile.isoY);
                }, this);
            }
        }
    }

    private createPlayer(): Phaser.Plugin.Isometric.IsoSprite {
        var player: Phaser.Plugin.Isometric.IsoSprite = (<any>this.add).isoSprite(550, 550, 0, "spaceCraftNE", 0, this._buildingsGroup);
        //player.loadTexture("spaceCraftS");

        player.anchor.set(0.5);

        (<any>this.game).physics.isoArcade.enable(player);
        player.body.collideWorldBounds = true;
        player.body.setSize(200, 200, 70, -50, -50);

        var space = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        space.onDown.add(() => {
            player.body.velocity.z = 600;
        }, this);

        return player;
    }

    private movePlayer() {
        var isUpKeyDown = this._cursors.up.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.W);
        var isRightKeyDown = this._cursors.right.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.D);
        var isLeftKeyDown = this._cursors.left.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.A);
        var isDownKeyDown = this._cursors.down.isDown || this.game.input.keyboard.isDown(Phaser.Keyboard.S);

        // Move the player at this speed.
        var speed = 200;
        var diagonalSpeed = 230;

        var newDirection: Direction = undefined;
        if (isUpKeyDown) {
            if (isLeftKeyDown) {
                newDirection = Direction.NW;
                this._player.body.velocity.x = 0;
                this._player.body.velocity.y = -diagonalSpeed;
            }
            else if (isRightKeyDown) {
                newDirection = Direction.NE;
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
            if (isLeftKeyDown) {
                newDirection = Direction.SW;
                this._player.body.velocity.x = diagonalSpeed;
                this._player.body.velocity.y = 0;
            }
            else if (isRightKeyDown) {
                newDirection = Direction.SE;
                this._player.body.velocity.x = 0;
                this._player.body.velocity.y = diagonalSpeed;
            }
            else {
                newDirection = Direction.S;
                this._player.body.velocity.x = speed;
                this._player.body.velocity.y = speed;
            }
        }
        else if (isLeftKeyDown) {
            newDirection = Direction.W;
            this._player.body.velocity.x = speed;
            this._player.body.velocity.y = -speed;
        }
        else if (isRightKeyDown) {
            newDirection = Direction.E;
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

    private wantToBuildHouse() {
        if (this._house)
            return;

        this._house = (<any>this.game).add.isoSprite(0, 0, 0, 'house', 0, this._buildingsGroup);
        this._house.tint = 0x86bfda;
        this._house.anchor.set(0.5, 0);

        // Enable the physics body on this cube.
        (<any>this.game).physics.isoArcade.enable(this._house);
        this._house.body.setSize(280, 280, 100, -80, -80);
        this._house.body.immovable = true;

        this._house.body.collideWorldBounds = true;
    }

    private buildHouse(isoX: number, isoY: number) {
        var house = (<any>this.game.add).isoSprite(isoX, isoY, 0, 'house', 0, this._buildingsGroup);
        house.anchor.set(0.5, 0);

        // Enable the physics body on this cube.
        (<any>this.game).physics.isoArcade.enable(house);
        house.body.setSize(280, 280, 100, -80, -80);
        house.body.immovable = true;

        house.body.collideWorldBounds = true;

        if (this._house)
            this._house.destroy();
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