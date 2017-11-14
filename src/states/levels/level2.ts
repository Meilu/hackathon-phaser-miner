

import 'phaserIsometric';

export class Level2 extends Phaser.State {

    isoGroup: any;
    cursorPos: any;

    preload() {
        this.game.plugins.add(<any>new Phaser.Plugin.Isometric(this.game));

        // This is used to set a game canvas-based offset for the 0, 0, 0 isometric coordinate - by default
        // this point would be at screen coordinates 0, 0 (top left) which is usually undesirable.
        (<any>this.game).iso.anchor.setTo(0.5, 0.2);

        (<any>this.game).iso.projectionAngle = 2.53073; // 145 degrees
    }

    create() {
        this.isoGroup = this.add.group();
        var buildingsGroup = this.add.group();

        this.spawnTiles();

        var tileWidth = 92;
        var house = (<any>this.add).isoSprite(tileWidth * 4, tileWidth * 4, 0, 'house', 0, buildingsGroup);
        house.anchor.set(0.5, 1)

        // Provide a 3D position for the cursor
        this.cursorPos = new Phaser.Plugin.Isometric.Point3();
    }

    update() {
        // Update the cursor position.
        // It's important to understand that screen-to-isometric projection means you have to specify a z position manually, as this cannot be easily
        // determined from the 2D pointer position without extra trickery. By default, the z position is 0 if not set.
        (<any>this.game).iso.unproject(this.game.input.activePointer.position, this.cursorPos);

        // Loop through all tiles and test to see if the 3D position from above intersects with the automatically generated IsoSprite tile bounds.
        this.isoGroup.forEach((tile: any) => {
            var inBounds = tile.isoBounds.containsXY(this.cursorPos.x, this.cursorPos.y);
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
        });
    }

    private spawnTiles(): void {
        var tile;
       
        for (var xx = 0; xx < 500; xx += 92) {
            for (var yy = 0; yy < 500; yy += 92) {
                // Create a tile using the new game.add.isoSprite factory method at the specified position.
                // The last parameter is the group you want to add it to (just like game.add.sprite)
                tile = (<any>this.add).isoSprite(xx, yy, 0, 'tile', 0, this.isoGroup);         
                tile.anchor.set(0.5, 0);
            }
        }
    }
 }