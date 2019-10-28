/**
 * The simulated map consists of a grid of tiles that all the entities can
 * move onto or out of.
 * @module tile
 */

import { pull, last, find, some } from 'lodash-es'

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
        this.pos_y = pos_y
        this.pos_x = pos_x
        this.env_rings = []
        this._entity_stack = []
    }


    /**
     * Push entity on entity stack.
     * @method push_entity
     * @param {Entity} entity Entity to push
     */
    push_entity(entity) {
        this._entity_stack.push(entity)
    }

    /**
     * Pop entity off entity stack.
     * @method pop_entity
     * @return {Entity} Popped entity, or *null* if stack is empty.
     */
    pop_entity() {
        return this._entity_stack.pop() || null
    }

    /**
     * Remove given entity from entity stack.
     * @method remove_entity
     * @param {Entity} entity Entity to remove from stack
     */
    remove_entity(entity) {
        pull(this._entity_stack, entity)
    }

    /**
     * Return top of the entity stack.
     * @method top_entity
     * @return {Entity} Entity at the top, or *null* if stack is empty.
     */
    top_entity() {
        return last(this._entity_stack) || null
    }

    /**
     * Search for entity on the stack.
     * @method entity
     * @param {Class} [entity_class] Class of the searched entity.
     * @param {Number} [lvl=undefined] Level of the searched entity.
     *  Searches for entity of given class with any level if not provided.
     * @return {Entity} Found Entity or *undefined*.
     */
    entity(entity_class, lvl = undefined) {
        return find(this._entity_stack, entity => {
            if(entity instanceof entity_class)
                return lvl === undefined || entity.level === lvl
        })
    }

    /**
     * Tell whether this tile holds no entity on its stack.
     * @method empty
     * @return {Boolean} True if this tile holds no entity, false otherwise
     */
     empty() {
        return !this.top_entity()
     }

    /**
     * Tell whether this tile can be stepped on by an entity.
     * @method walkable
     * @param {Number} [lvl=0] Level of entity that wants to step on tile
     * @return {Boolean} True if tile can be stepped on, false otherwise
     */
    walkable(lvl = 0) {
        if(this.empty())
            return true

        if(some(this._entity_stack, entity => entity.allows_step < lvl))
            return false

        return true
    }
}

export default Tile
