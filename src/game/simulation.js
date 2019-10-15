/**
 * Simulation logic.
 * @module simulation
 * @requires helpers
 * @requires entities
 * @requires tile
 */

import helpers from './helpers';
import entities from './entities';
import Tile from './tile';
import {
    each, map, invokeMap, range, concat, difference, transform, chain
} from 'lodash-es'

 /**
  * Singleton object containing simulation functions.
  * @class simulation
  */
const simulation = function() {
    let tile_map = [];
    const entity_lists = new Map(map(entities, klass => [klass, []]));

    /**
     * Build up an internal tile map, based on the given entity map.
     * @method setup_tile_map
     * @param {Array} entity_map 2D array containing rows of entity objects
     */
    function setup_tile_map(entity_map) {
        tile_map = map(entity_map, (entity_row, y) => {
            return map(entity_row, (entity, x) => {
                const tile = new Tile(y, x);
                if(entity) {
                    tile.push_entity(entity);
                    entity.tile = tile;
                    entity_lists.forEach((list, klass) => {
                        if(entity instanceof klass)
                            list.push(entity);
                    });
                }
                return tile;
            });
        });
        setup_env_rings(tile_map);
    }

    /**
     * For each tile in the given tile map, set up multiple environment tile
     * rings. Each of these rings is an array containing the surrounding tiles
     * of a certain distance. These tiles can be inspected by entities to do
     * their path finding.
     * @method setup_env_rings
     * @private
     * @param {Array} tile_map 2D array containing rows of tiles
     * @param {Number} [num_rings=8] number of environment rings
     */
    function setup_env_rings(tile_map, num_rings = 8) {
        each(tile_map, (tile_row, y) =>
            each(tile_row, (tile, x) =>
                each(range(1, num_rings + 1), scope =>
                    tile.env_rings.push(calc_env_ring(tile_map, y, x, scope))
                )
            )
        );
    }

    /**
     * Calculates the tile ring of the given scope around the tile at position
     * center_y, center_x.
     * @method calc_env_ring
     * @private
     * @param {Array} tile_map 2D list containing all tiles of the map
     * @param {Number} center_y y-coordinate of the tile
     * @param {Number} center_x x-coordinate of the tile
     * @param {Number} scope expanse of the tile ring list to be calculated
     * @example
     *      scope = 1 [0][1][2] scope = 2 [0][1][2][3][4] (hex digits here)
     *                [3][o][4]           [5]         [8]
     *                [5][6][7]           [6]   [o]   [9]
     *                                    [7]         [A]
     *                                    [B][C][D][E][F]
     *
     * @return {Array} tile ring list
     */
    function calc_env_ring(tile_map, center_y, center_x, scope) {
        const env_ring = [];

        let x_on_map, y_on_map = center_y - scope;     //top ring row
        each(range(-scope, scope + 1), relative_x => {
            x_on_map = center_x + relative_x;
            add_environment_tile(env_ring, tile_map, y_on_map, x_on_map, scope);
        });

        x_on_map = center_x - scope;     //left ring column
        each(range(-scope + 1, scope), relative_y => {
            y_on_map = center_y + relative_y;
            add_environment_tile(env_ring, tile_map, y_on_map, x_on_map, scope);
        });

        x_on_map = center_x + scope;     //right ring column
        each(range(-scope + 1, scope), relative_y => {
            y_on_map = center_y + relative_y;
            add_environment_tile(env_ring, tile_map, y_on_map, x_on_map, scope);
        });

        y_on_map = center_y + scope;     //bottom ring row
        each(range(-scope, scope + 1), relative_x => {
            x_on_map = center_x + relative_x;
            add_environment_tile(env_ring, tile_map, y_on_map, x_on_map, scope);
        });

        return env_ring;
    }

    /**
     * Adds a tile to the environment ring based on the given coordinates. If
     * the coordinates lie outside of the map, two different actions might be
     * taken, depending on the value of the scope argument.
     * 1. If scope == 1, a dummy tile that contains a border entity is added.
     *    This will effectively delimit the map.
     * 2. If scope > 1, no tile is added.
     *
     * @method add_environment_tile
     * @private
     * @param {Array} env_ring environment tile ring to extend
     * @param {Array} tile_map 2D list containing all tiles of the map
     * @param {Number} pos_y y-coordinate of the environment tile
     * @param {Number} pos_x x-coordinate of the environment tile
     * @param {Number} scope expanse of the environment tile ring
     */
    function add_environment_tile(env_ring, tile_map, pos_y, pos_x, scope) {
        if(tile_map[pos_y] && tile_map[pos_y][pos_x])
            env_ring.push(tile_map[pos_y][pos_x]);
        else if(scope === 1) {
            if(!entities.Border.dummy)
                entities.Border.dummy = new entities.Border(new Tile());
            env_ring.push(entities.Border.dummy.tile);
        }
    }

    /**
     * Let each entity make a move. This effectively advances the simulation
     * on step forward.
     * @method update
     */
    function update() {
        landanimal_action(entities.Carnivore, entities.Herbivore);
        landanimal_action(entities.Herbivore, entities.Plant);
        vegetation_action();
        protozoan_action();
        water_action();
    }

    function vegetation_action() {
        const plant_list = entity_lists.get(entities.Plant);
        const veggy_list = concat(
            plant_list, entity_lists.get(entities.RainForest)
        );

        const new_plants = transform(veggy_list, (offspring_list, veggy) => {
            const {offspring} = veggy.act();
            if(offspring)
                offspring_list.push(offspring);
        });

        entity_lists.set(entities.Plant, concat(plant_list, new_plants));
    }

    function protozoan_action() {
        const protozoan_list = entity_lists.get(entities.Protozoan);

        const dead_protos = transform(protozoan_list, (dead_list, proto) => {
            const {offspring: new_animal, death} = proto.act();
            if(new_animal) {
                each([entities.Herbivore, entities.Carnivore], entity_class => {
                    if(new_animal instanceof entity_class)
                        entity_lists.get(entity_class).push(new_animal);
                });
                dead_list.push(proto);
            } else if(death) {
                dead_list.push(proto);
            }
        });

        each(dead_protos, corpse =>
            helpers.remove_from_array(protozoan_list, corpse)
        );
    }

    function water_action() {
        const water_list = entity_lists.get(entities.Water);

        const new_protos = transform(water_list, (offspring_list, water) => {
            const {offspring} = water.act();
            if(offspring)
                offspring_list.push(offspring);
        });

        const protozoan_list = entity_lists.get(entities.Protozoan);
        entity_lists.set(
            entities.Protozoan, protozoan_list.concat(new_protos)
        );
    }

    function landanimal_action(hunter_class, prey_class) {
        const action_data = map(entity_lists.get(hunter_class), hunter =>
            ({hunter, ...hunter.act()})
        );

        const surviving_hunters = chain(action_data)
            .reject('death')
            .map('hunter')
            .value();

        const offspring = chain(action_data)
            .filter('offspring')
            .map('offspring')
            .value();

        const killed_prey = chain(action_data)
            .filter('killed_prey')
            .map('killed_prey')
            .value();

        entity_lists.set(
            prey_class, difference(entity_lists.get(prey_class), killed_prey)
        );
        entity_lists.set(
            hunter_class, concat(surviving_hunters, offspring)
        );
    }

    /**
     * Return the current simulation state as a map of entity objects. Positions
     * that hold no entity will be represented as *undefined*.
     * @method entity_map
     * @return {Array} 2D array containing rows of entity objects.
     */
    function entity_map() {
        return map(tile_map, row => invokeMap(row, 'entity'));
    }

    /**
     * Return the entity located at the given coordinates.
     * @method get_entity
     * @param {Number} y Row number
     * @param {Number} x Column number
     * @return {Entity} Entity located at the given coordinates, or *undefined*
     *                  if there is none.
     */
    function get_entity(y, x) {
        return tile_map[y][x].entity();
    }

    /**
     * Kill all entities of the given type.
     * @method kill_entity_type
     * @param {String} type_name Class name of the entity type to kill
     */
    function kill_entity_type(type_name) {
        const entity_class = entities[type_name];
        invokeMap(entity_lists.get(entity_class), 'die');
        entity_lists.set(entity_class, []);
    }

    // explicit syntax b/c we define a getter
    return Object.create(Object.prototype, {
        'setup_tile_map': {
            value: setup_tile_map
        },
        'update': {
            value: update
        },
        'entity_map': {
            get: entity_map
        },
        'get_entity': {
            value: get_entity
        },
        'kill_entity_type': {
            value: kill_entity_type
        }
    });
}();

export default simulation;
