"use strict";

/**
 * Simulation logic.
 * @module simulation
 * @requires entities
 * @requires tile
 */

 /**
  * Singleton object containing simulation functions.
  * @class simulation
  */
const simulation = function() {

    let tile_map = [];
    const entity_lists = new Map([   // TODO: try to set with iteration over entities object properties
        [ entities.RainForest, [] ],
        [ entities.Plant, [] ],
        [ entities.Water, [] ],
        [ entities.Beach, [] ],
        [ entities.Protozoan, [] ],
        [ entities.Herbivore, [] ],
        [ entities.Carnivore, [] ]
    ]);

    function setup_tile_map(entity_map) {
        tile_map = entity_map.map(function(entity_row, y) {
            return entity_row.map(function(entity, x) {
                const tile = new Tile(y, x);
                if(entity) {
                    tile.push_entity(entity);
                    entity.tile = tile;
                    entity_lists.forEach((list, constr) => {
                        if(entity instanceof constr)
                            list.push(entity);
                    });
                }
                return tile;
            });
        });
        setup_env_rings(tile_map);
    }

    function setup_env_rings(tile_map, num_rings = 8) {
        tile_map.forEach(function(tile_row, y) {
            tile_row.forEach(function(tile, x) {
                for(let scope = 1; scope <= num_rings; ++scope)
                    tile.env_rings.push(calc_env_ring(tile_map, y, x, scope));
            });
        });
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
        for(let relative_x = -scope; relative_x <= scope; ++relative_x) {
            x_on_map = center_x + relative_x;
            add_environment_tile(env_ring, tile_map, y_on_map, x_on_map, scope);
        }

        x_on_map = center_x - scope;     //left ring column
        for(let relative_y = -scope+1; relative_y < scope; ++relative_y) {
            y_on_map = center_y + relative_y;
            add_environment_tile(env_ring, tile_map, y_on_map, x_on_map, scope);
        }

        x_on_map = center_x + scope;     //right ring column
        for(let relative_y = -scope+1; relative_y < scope; ++relative_y) {
            y_on_map = center_y + relative_y;
            add_environment_tile(env_ring, tile_map, y_on_map, x_on_map, scope);
        }

        y_on_map = center_y + scope;     //bottom ring row
        for(let relative_x = -scope; relative_x <= scope; ++relative_x) {
            x_on_map = center_x + relative_x;
            add_environment_tile(env_ring, tile_map, y_on_map, x_on_map, scope);
        }

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
        else if(scope === 1)
            env_ring.push(entities.Border.dummy.tile);
    }

    function update() {
        landanimal_action(entities.Carnivore, entities.Herbivore);
        landanimal_action(entities.Herbivore, entities.Plant);
        vegetation_action();
        protozoan_action();
        water_action();
    }

    function vegetation_action() {
        const plant_list = entity_lists.get(entities.Plant);
        const veggy_list = entity_lists.get(entities.RainForest)
                                       .concat(plant_list);

        const new_plants = veggy_list.reduce((offspring_list, veggy) => {
            const {offspring} = veggy.act();
            if(offspring)
                offspring_list.push(offspring);
            return offspring_list;
        }, []);

        entity_lists.set(entities.Plant, plant_list.concat(new_plants));
    }

    function protozoan_action() {
        const protozoan_list = entity_lists.get(entities.Protozoan);

        const dead_protos = protozoan_list.reduce((dead_list, proto) => {
            const {offspring: new_animal, death} = proto.act();
            if(new_animal) {
                [entities.Herbivore, entities.Carnivore].forEach((constr) => {
                    if(new_animal instanceof constr)
                        entity_lists.get(constr).push(new_animal);
                });
                dead_list.push(proto);
            } else if(death) {
                dead_list.push(proto);
            }
            return dead_list;
        }, []);

        for(const corpse of dead_protos)
            helpers.remove_from_array(protozoan_list, corpse);
    }

    function water_action() {
        const water_list = entity_lists.get(entities.Water);

        const new_protozoans = water_list.reduce((offspring_list, water) => {
            const {offspring} = water.act();
            if(offspring)
                offspring_list.push(offspring);
            return offspring_list;
        }, []);

        const protozoan_list = entity_lists.get(entities.Protozoan);
        entity_lists.set(
            entities.Protozoan, protozoan_list.concat(new_protozoans)
        );
    }

    function landanimal_action(hunter_class, prey_class) {
        const offspring_list = [];

        let survivors = entity_lists.get(hunter_class).filter(animal => {
            const {killed_prey, offspring, death} = animal.act();

            if(death)
                return false;

            if(killed_prey)
                helpers.remove_from_array(
                    entity_lists.get(prey_class), killed_prey
                );
            else if(offspring)
                offspring_list.push(offspring);

            return true;
        });

        entity_lists.set(hunter_class, survivors.concat(offspring_list));
    }

    function entity_map() {
        return tile_map.map(row => row.map(tile => tile.entity()));
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
        }
    });
}();
