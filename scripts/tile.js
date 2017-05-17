'use strict';

/**
 * The simulated map consists of a grid of tiles that all the entities can
 * move onto or out of.
 * @module tile
 * @requires helpers
 */

class Tile {
    /**
     * Tiles that make up the simulated map.
     * @class Tile
     * @constructor
     * @param {Number} pos_y Vertical position on the grid as integer
     * @param {Number} pos_x Horizontal position on the grid as integer
     * @return {Tile} New tile instance
     */
    constructor(pos_y, pos_x) {
        this.pos_y = pos_y;
        this.pos_x = pos_x;
        this.env_rings = [];
        this._entity_stack = [];
    }


    /**
     * Push entity on entity stack.
     * @method push_entity
     * @param {Entity} entity Entity to push
     */
    push_entity(entity) {
        this._entity_stack.push(entity);
    }

    /**
     * Pop entity off entity stack.
     * @method pop_entity
     * @return {Entity} Popped entity, or *null* if stack is empty.
     */
    pop_entity() {
        const popped = this._entity_stack.pop();
        return popped ? popped : null;
    }

    /**
     * Remove given entity from entity stack.
     * @method remove_entity
     * @param {Entity} entity Entity to remove from stack
     * @return {Entity} Removed entity, or *null* if not found in stack.
     */
    remove_entity(entity) {
        return helpers.remove_from_array(this._entity_stack, entity);
    }

    /**
     * Get reference to entity of the entity stack.
     * @method entity
     * @param {Class} [entity_class=undefined] Class of the searched entity.
     *  If not defined, the top entity of the stack (or *null* if empty)
     *  will be returned.
     * @param {Number} [lvl=undefined] Level of the searched entity.
     *  Only has effect when *entity_class* is defined.
     * @return {Entity} Found Entity or *undefined*.
     */
    entity(entity_class = undefined, lvl = undefined) {
        if(entity_class) {
            return this._entity_stack.find(entity => {
                if(entity instanceof entity_class)
                    return lvl === undefined || entity.level === lvl;
            });
        } else {
            const len = this._entity_stack.length;
            return len > 0 ? this._entity_stack[len - 1] : undefined;
        }
    }

    /**
     * Tell whether this tile holds no entity on its stack.
     * @method empty
     * @return {Boolean} True if this tile holds no entity, false otherwise
     */
     empty() {
        return !this.entity();
     }

    /**
     * Tell whether this tile can be stepped on by an entity.
     * @method walkable
     * @param {Number} [lvl=0] Level of entity that wants to step on tile
     * @return {Boolean} True if tile can be stepped on, false otherwise
     */
    walkable(lvl = 0) {
        if(this.empty())
            return true;

        if(this._entity_stack.some(entity => entity.allows_step < lvl))
            return false;

        return true;
    }
}
