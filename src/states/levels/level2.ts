import 'phaserIsometric';

export class Level2 extends Phaser.State {
    private _groundGroup: Phaser.Group;
    private _buildingsGroup: Phaser.Group;
    private _cursorPosition: Phaser.Plugin.Isometric.Point3;
    private _player: Phaser.Plugin.Isometric.IsoSprite;
    private _cursors: Phaser.CursorKeys;

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

        // Create another cube as our 'player', and set it up just like the cubes above.
        this._player = (<any>this.add).isoSprite(128, 128, 0, 'tile', 0, this._buildingsGroup);
        this._player.tint = 0x86bfda;
        this._player.anchor.set(0.5);

        (<any>this.game).physics.isoArcade.enable(this._player);
        this._player.body.collideWorldBounds = true;

        // Set up our controls.
        this._cursors = this.game.input.keyboard.createCursorKeys();

        this.game.input.keyboard.addKeyCapture([
            Phaser.Keyboard.LEFT,
            Phaser.Keyboard.RIGHT,
            Phaser.Keyboard.UP,
            Phaser.Keyboard.DOWN,
            Phaser.Keyboard.SPACEBAR
        ]);

        var space = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);

        space.onDown.add(function () {
            this.player.body.velocity.z = 300;
        }, this);

        // Make the camera follow the player.
        this.game.camera.follow(this._player);

        // Provide a 3D position for the cursor
        this._cursorPosition = new Phaser.Plugin.Isometric.Point3();

        var tileWidth = 92;
        var house: Phaser.Plugin.Isometric.IsoSprite = (<any>this.add).isoSprite(tileWidth * 4, tileWidth * 4, 0, 'house', 0, this._buildingsGroup);
        house.anchor.set(0.5, 1);

        // Enable the physics body on this cube.
        (<any>this.game).physics.isoArcade.enable(house);
        house.body.immovable = true;

        house.body.collideWorldBounds = true;
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

        // Move the player at this speed.
        var speed = 1000;

        if (this._cursors.up.isDown) {
            this._player.body.velocity.y = -speed;
        }
        else if (this._cursors.down.isDown) {
            this._player.body.velocity.y = speed;
        }
        else {
            this._player.body.velocity.y = 0;
        }

        if (this._cursors.left.isDown) {
            this._player.body.velocity.x = speed;
        }
        else if (this._cursors.right.isDown) {
            this._player.body.velocity.x = -speed;
        }
        else {
            this._player.body.velocity.x = 0;
        }

        // Our collision and sorting code again.
        (<any>this.game).physics.isoArcade.collide(this._buildingsGroup);
        (<any>this.game).iso.topologicalSort(this._buildingsGroup);
    }

    private spawnTiles(): void {
        var tile;

        for (var xx = 0; xx < 1000; xx += 92) {
            for (var yy = 0; yy < 1000; yy += 92) {
                // Create a tile using the new game.add.isoSprite factory method at the specified position.
                // The last parameter is the group you want to add it to (just like game.add.sprite)
                tile = (<any>this.add).isoSprite(xx, yy, 0, 'tile', 0, this._groundGroup);
                tile.anchor.set(0.5, 0);
            }
        }
    }
}