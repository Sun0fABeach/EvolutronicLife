"use strict";

/**
 * Game entitiy class hierarchy.
 * @module entities
 * @requires helpers
 * @requires tile
 */

// TODO mixin pattern might be useful here. => 'level' or 'die' methods
// TODO think about generators and where to use them sensibly
// TODO getters and setters? where sensible?


const Entity = function() {
    function Entity(tile = null) {
        this.tile = tile;
        if(tile !== null)
            tile.push_entity(this);
        this.allows_step = undefined; // every sub-entity needs to define this
    }

    Object.defineProperties(Entity.prototype, {
        pos_y: {
            get: function() { return this.tile.pos_y; }
        },
        pos_x: {
            get: function() { return this.tile.pos_x; }
        }
    });

    return Entity;
}();

const Border = function() {
    function Border(tile) {
        Entity.call(this, tile);
        this.allows_step = -Infinity;
    }

    Border.prototype = Object.create(Entity.prototype);

    return Border;
}();
Border.dummy = new Border(new Tile(undefined, undefined));

const Beach = function() {
    function Beach(tile) {
        Entity.call(this, tile);
        this.allows_step = Infinity;
    }

    Beach.prototype = Object.create(Entity.prototype);

    return Beach;
}();
Beach.instance = new Beach(undefined);

const Water = function() {
    function Water(tile) {
        Entity.call(this, tile);
        this.allows_step = -Infinity;
    }

    function try_spawning(water) {
        if(helpers.chance_in_percent(1) && !water.tile.entity(Protozoan))
            return new Protozoan(water.tile);
        return null;
    }

    Water.prototype = Object.create(Entity.prototype, {
        'act': {
            value: function() {
                return {offspring: try_spawning(this)};
            }
        }
    });

    return Water;
}();

const Animal = function() {
    function Animal(tile) {
        Entity.call(this, tile);
        this.allows_step = -Infinity;
    }

    function go_to_tile(target_tile) {
        this.tile.pop_entity();
        target_tile.push_entity(this);
        this.tile = target_tile;
    }

    Animal.prototype = Object.create(Entity.prototype, {
        'go_to_tile': {
            value: go_to_tile
        },
    });

    return Animal;
}();

const LandAnimal = function() {
    function LandAnimal(tile, lvl = 0) {
        Animal.call(this, tile);
        this.allows_step = -Infinity;
        this._lvl = lvl;
    }

    function grow_older(animal) {
        if(animal._time_to_live-- === 0) {
            animal.tile.pop_entity();
            return false;
        }
        return true;
    }

    function is_hungry(animal) {
        return animal._food === 0;
    }

    function hunt(hunter, hunter_class, prey_class) {
        const env = hunter.tile.env_rings[0];
        const prey_list = env.reduce((found, tile) => {
            const prey = tile.entity(prey_class);
            if(prey) found.push(prey);
            return found;
        }, []);

        if(prey_list.length === 0)
            return {ate: false};

        const prey = helpers.array_choice(prey_list);
        hunter._food += prey.health;
        const min_energy = hunter._cfg.min_energy_replenish;
        hunter._energy = Math.min(min_energy, hunter._energy + 1);
        hunter._rdy_to_copulate = true;
        if((prey.health -= hunter._attack) <= 0)
            return {ate: true, killed_prey: prey.tile.remove_entity(prey)};
        if(prey instanceof Plant && prey.level > 0)
            prey.devolve();

        return {ate: true};
    }

    function survive_without_food(animal) {
        animal._rdy_to_copulate = false;
        if(animal._energy-- === 0) {
            animal.tile.pop_entity();
            return false;
        }
        return true;
    }

    function consume_from_food_reserves(animal) {
        if(--animal._food === 0)
            animal._rdy_to_copulate = false;
    }

    function is_horny(animal) {
        return animal._rdy_to_copulate;
    }

    function try_reproduction(animal, mate_class) {
        const env = animal.tile.env_rings[0];
        const mating_partners = env.reduce((partner_list, tile) => {
            const partner = tile.entity(mate_class, animal.level);
            if(partner && is_horny(partner))
                partner_list.push(partner);
            return partner_list;
        }, []);

        if(mating_partners.length === 0)
            return null;

        const birthplace_list = env.filter(tile => tile.walkable());
        if(birthplace_list.length === 0)
            return null;
        const birthplace = helpers.array_choice(birthplace_list);

        have_sex(animal, helpers.array_choice(mating_partners));

        if(helpers.chance_in_percent(animal._cfg.lvlup_chance) &&
            animal.level != animal._cfg.max_level &&
            birthplace.walkable(animal.level + 1)
        ){
            return new mate_class(birthplace, animal.level + 1);
        } else if(birthplace.walkable(animal.level)) {
            return new mate_class(birthplace, animal.level);
        } else {
            return devolve(mate_class, birthplace);
        }
    }

    function have_sex(animal, partner) {
        animal._rdy_to_copulate = partner._rdy_to_copulate = false;
    }

    function devolve(child_class, birthplace) {
        // it is assumed that we need to devolve b/c of blocking veggy on tile
        const veggy_lvl = birthplace.entity().level;
        return new child_class(birthplace, veggy_lvl - 1);
    }

    function move(animal, own_class, prey_class) {
        let target_tile = undefined;

        if(is_horny(animal))
            target_tile = route_to_mate(animal, own_class);
        else if(is_hungry(animal) || animal.level === 2)
            target_tile = route_to_prey(animal, prey_class);

        // if entity is neither hungry nor horny, or the step towards a mate
        // or prey can't be taken (is blocked), we try to move randomly
        if(!target_tile) {
            target_tile = random_step(animal);
            if(!target_tile) {  // no way to move: death of entity
                animal.tile.pop_entity();
                return false;
            }
        }

        animal.go_to_tile(target_tile);
        return true;
    }

    function route_to_mate(animal, mate_class, lvl) {
        const possible_targets = search_target_candidates(
            animal, mate_class, animal.lvl
        );
        if(!possible_targets)
            return null;
        return make_step_choice(animal, possible_targets);
    }

    function route_to_prey(animal, prey_class) {
        let possible_targets = search_target_candidates(animal, prey_class);
        if(!possible_targets)
            return null;

        // of the found targets, we pick one with the highest lvl
        const max_target_lvl = Math.max(
            ...possible_targets.map(entity => entity.level)
        );
        possible_targets = possible_targets.filter(
            entity => entity.level === max_target_lvl
        );

        return make_step_choice(animal, possible_targets);
    }

    function search_target_candidates(animal, target_class, lvl = undefined) {
        const possible_targets = [];

        for(const ring of animal.tile.env_rings.slice(1, animal._view_range)) {
            for(const tile of ring) {
                const entity = tile.entity(target_class, lvl);
                if(entity)
                    possible_targets.push(entity);
            }
            if(possible_targets.length > 0)
                return possible_targets;
        }

        return null;
    }

    function make_step_choice(animal, target_candidates) {
        const wanted_target = helpers.array_choice(target_candidates);
        const immediate_env = animal.tile.env_rings[0];
        const step_position = calculate_step(animal, wanted_target);
        const target_tile = immediate_env[step_position];

        if(target_tile.walkable(animal.level))
            return target_tile;

        return null;
    }

    /**
     * Calculates step position in the immediate environment based on the
     * position of the wanted target.
     * @method calculate_step
     * @param {LandAnimal} animal Animal that wants to move
     * @param {Entity} target Target the animal wants to move towards
     * @return {Number} The position in the immediate environment that leads
     *                  towards the target
     * @example
     *      [0][1][2]
     *      [3][x][4]
     *      [5][6][7]
     */
    function calculate_step(animal, target) {
        const x_dir = (target.pos_x > animal.pos_x) -
                      (target.pos_x < animal.pos_x)
        const y_dir = (target.pos_y > animal.pos_y) -
                      (target.pos_y < animal.pos_y)

        if(y_dir == -1) {
            switch(x_dir) {
                case -1: return 0;
                case 0:  return 1;
                case 1:  return 2;
            }
        } else if(y_dir == 0) {
            switch(x_dir) {
                case -1: return 3;
                case 1:  return 4;
            }
        } else if(y_dir == 1) {
            switch(x_dir) {
                case -1: return 5;
                case 0:  return 6;
                case 1:  return 7;
            }
        }
    }

    function random_step(animal) {
        const env = animal.tile.env_rings[0];
        const walkable_tiles = env.filter(
            tile => tile.walkable(animal.level)
        );
        if(walkable_tiles.length > 0)
            return helpers.array_choice(walkable_tiles);
        else
            return null;
    }

    function act(actor_class, prey_class) {
        if(!grow_older(this))
            return {death: true};

        if(is_hungry(this)) {
            const {ate, killed_prey} = hunt(this, actor_class, prey_class);
            if(ate)
                return {killed_prey};
            if(!survive_without_food(this))
                return {death: true};

            // if we land here, the herbivore couldn't eat, but didn't die
        } else {
            consume_from_food_reserves(this);

            if(is_horny(this)) {
                const newborn = try_reproduction(this, actor_class);
                if(newborn)
                    return {offspring: newborn};
            }
        }

        return {death: !move(this, actor_class, prey_class)};
    }


    LandAnimal.prototype = Object.create(Animal.prototype, {
        'level': {
            get: function() { return this._lvl; }
        },
        'act': {
            value: act
        }
    });

    return LandAnimal;
}();

const Herbivore = function() {
    function Herbivore(tile, lvl) {
        LandAnimal.call(this, tile, lvl);
        this._cfg = Entity.config.get(Herbivore);
        this._view_range = this._cfg.view_range[this._lvl];
        this._time_to_live = this._cfg.time_to_live[this._lvl];
        this._energy = this._cfg.energy[this._lvl];
        this._food = this._cfg.food[this._lvl];
        this.health = this._cfg.health[this._lvl];
        this._attack = this._cfg.attack[this._lvl];
    }

    Herbivore.prototype = Object.create(LandAnimal.prototype, {
        'act': {
            value: function() {
                return LandAnimal.prototype.act.call(this, Herbivore, Plant);
            }
        }
    });

    return Herbivore;
}();

const Carnivore = function() {
    function Carnivore(tile, lvl) {
        LandAnimal.call(this, tile, lvl);
        this._cfg = Entity.config.get(Carnivore);
        this._view_range = this._cfg.view_range[this._lvl];
        this._time_to_live = this._cfg.time_to_live[this._lvl];
        this._energy = this._cfg.energy[this._lvl];
        this._food = this._cfg.food[this._lvl];
        this._attack = this._cfg.attack[this._lvl];
    }

    Carnivore.prototype = Object.create(LandAnimal.prototype, {
        'act': {
            value: function() {
                return LandAnimal.prototype.act.call(
                    this, Carnivore, Herbivore
                );
            }
        }
    });

    return Carnivore;
}();

const Protozoan = function() {
    function Protozoan(tile) {
        Animal.call(this, tile);
        this._cfg = Entity.config.get(Protozoan);
        this._time_to_live = this._cfg.time_to_live;
    }

    function beach_reachable(proto) {
        const env = proto.tile.env_rings[0];
        // save as instance var for later use by jump_on_beach
        proto._adjacent_beaches = env.filter((tile) => tile.walkable());
        return proto._adjacent_beaches.length > 0;
    }

    function jump_on_beach(proto) {
        proto.tile.pop_entity();
        const constr = helpers.chance_in_percent(proto._cfg.herby_evo_chance) ?
                                                        Herbivore : Carnivore;
        return new constr(helpers.array_choice(proto._adjacent_beaches));
    }

    function move(proto) {
        if(proto._time_to_live-- === 0) {
            proto.tile.pop_entity();
            return false;
        }

        const env = proto.tile.env_rings[0];
        const swimmable_tiles = env.filter((tile) => tile.entity(Water));
        if(swimmable_tiles.length === 0) {
            proto.tile.pop_entity();
            return false; // dies when it has nowhere to move
        }
        proto.go_to_tile(helpers.array_choice(swimmable_tiles));
        return true;
    }

    Protozoan.prototype = Object.create(Animal.prototype, {
        'act': {
            value: function() {
                if(beach_reachable(this))
                    return {offspring: jump_on_beach(this)};
                return {death: !move(this)};
            }
        }
    });

    return Protozoan;
}();

const Vegetation = function() {
    function Vegetation(tile) {
        Entity.call(this, tile);
        this._ticks_to_reproduce = undefined;
    }

    function try_growth(veggy) {
        const env = veggy.tile.env_rings[0];
        const free_tiles = env.filter(tile => tile.empty());
        if(free_tiles.length > 0) {
            if(veggy._ticks_to_reproduce === undefined) {
                veggy._ticks_to_reproduce = helpers.random_in_range(
                    ...Entity.config.get(Vegetation).ticks_repro_range
                );
            } else if(--veggy._ticks_to_reproduce <= 0) {
                veggy._ticks_to_reproduce = undefined;
                return new Plant(helpers.array_choice(free_tiles), 0);
            }
        } else {
            veggy._ticks_to_reproduce = undefined;
        }

        return null;
    }

    Vegetation.prototype = Object.create(Entity.prototype, {
        'act': {
            value: function() {
                return {offspring: try_growth(this)};
            }
        }
    });

    return Vegetation;
}();

const RainForest = function() {
    function RainForest(tile) {
        Vegetation.call(this, tile);
        this.allows_step = -Infinity;
    }

    RainForest.prototype = Object.create(Vegetation.prototype, {
        'level': {
            get: function() { return Infinity; }
        }
    });

    return RainForest;
}();

const Plant = function() {
    const max_lvl = 2;

    function Plant(tile, lvl) {
        Vegetation.call(this, tile);
        this._cfg = Entity.config.get(Plant);
        set_configs(this, lvl);
    }

    function set_configs(plant, lvl) {
        plant._lvl = Math.min(lvl, max_lvl);
        plant.allows_step = Math.abs(plant._lvl - max_lvl);
        plant.health = plant._cfg.health[plant._lvl];
        plant._ticks_to_evolve = undefined;
    }

    function can_evolve(plant) {
        if(plant._lvl === max_lvl)
            return false;

        const env = plant.tile.env_rings[0];
        if(env.every(tile => {
            const adjacent_veg = tile.entity(Vegetation);
            return adjacent_veg && adjacent_veg.level >= plant.level ||
                   tile.entity(Border);
        })) {
            if(plant._ticks_to_evolve === undefined) {
                const tick_range = plant._cfg.ticks_evo_range;
                plant._ticks_to_evolve = helpers.random_in_range(...tick_range);
                return false;
            } else {
                return --plant._ticks_to_evolve <= 0 ? true : false;
            }
        }

        plant._ticks_to_evolve = undefined;
        return false;
    }

    function evolve(plant) {
        set_configs(plant, plant._lvl + 1); // lvlup;
        plant._ticks_to_evolve = undefined;
    }

    Plant.prototype = Object.create(Vegetation.prototype, {
        'level': {
            get: function() { return this._lvl; }
        },
        'devolve': {
            value: function () {
                for(let lvl = 0; lvl < this._cfg.health.length-1; ++lvl) {
                    if(this.health <= this._cfg.health[lvl]) {
                        set_configs(this, lvl);
                        return;
                    }
                }
            }
        },
        'act': {
            value: function() {
                if(can_evolve(this)) {
                    evolve(this);
                    return {};
                }
                return Vegetation.prototype.act.call(this);
            }
        }
    });

    return Plant;
}();

Entity.config = new Map([
    [Vegetation, {
            ticks_repro_range: [10, 40]
        }
    ],
    [Plant, {
            max_level: 2,
            health: [5, 10, 15],
            ticks_evo_range: [40, 100]
        }
    ],
    [Protozoan, {
            time_to_live: 20,
            herby_evo_chance: 80
        }
    ],
    [Herbivore, {
            max_level: 2,
            time_to_live: [50, 100, 150],
            view_range: [4, 6, 8],
            food: [10, 10, 10],
            energy: [10, 20, 30],
            health: [5, 10, 15],
            attack: [5, 10, 15],
            lvlup_chance: 50,
            min_energy_replenish: 10
        }
    ],
    [Carnivore, {
            max_level: 2,
            time_to_live: [50, 100, 150],
            view_range: [4, 6, 8],
            food: [10, 10, 10],
            energy: [10, 20, 30],
            attack: [5, 10, 15],
            lvlup_chance: 50,
            min_energy_replenish: 10
        }
    ]
]);
