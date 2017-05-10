"use strict";

/**
 * Game entity class hierarchy.
 * @module entities
 * @requires helpers
 * @requires tile
 */

// TODO 'instance' as static class methods (even via mixin?)
// TODO getters and setters? where sensible?

function Mortal(Base = class {}) {
    return class extends Base {
        die() {
            this.tile.remove_entity(this);
            this.tile = null;
            return this;
        }
    }
}

function Leveler(Base = class {}) {
    return class extends Base {
        constructor(allows_step, tile, lvl) {
            super(allows_step, tile);
            this._lvl = lvl;
        }

        get level() {
            return this._lvl;
        }
    }
}

class Entity {
    constructor(allows_step, tile = null) {
        this.allows_step = allows_step;
        if(tile) {
            this.tile = tile;
            tile.push_entity(this);
        }
    }

    get pos_y() {
        return this.tile.pos_y;
    }
    get pos_x() {
        return this.tile.pos_x;
    }

    in_simulation() {
        return !!this.tile;
    }
}

class Border extends Entity {
    constructor(tile) {
        super(-Infinity, tile);
    }
}
Border.dummy = new Border(new Tile(undefined, undefined));

class Beach extends Entity {
    constructor(tile) {
        super(Infinity, tile);
    }
}
Beach.instance = new Beach(undefined);

class Water extends Entity {
    constructor(tile) {
        super(-Infinity, tile);
    }

    _try_spawning() {
        if(helpers.chance_in_percent(1) && !this.tile.entity(Protozoan))
            return new Protozoan(this.tile);
        return null;
    }

    act() {
        return {offspring: this._try_spawning()};
    }
}

class Animal extends Mortal(Entity) {
    constructor(allows_step, tile) {
        super(allows_step, tile);
    }

    go_to_tile(target_tile) {
        this.tile.pop_entity();
        target_tile.push_entity(this);
        this.tile = target_tile;
    }
}

class LandAnimal extends Leveler(Animal) {
    constructor(tile, lvl = 0) {
        super(-Infinity, tile, lvl);
    }

    _grow_older() {
        if(this._time_to_live-- === 0) {
            this.die();
            return false;
        }
        return true;
    }

    _is_hungry() {
        return this._food === 0;
    }

    _hunt(prey_class) {
        const env = this.tile.env_rings[0];
        const prey_list = env.reduce((found, tile) => {
            const prey = tile.entity(prey_class);
            if(prey) found.push(prey);
            return found;
        }, []);

        if(prey_list.length === 0)
            return {ate: false};

        const prey = helpers.array_choice(prey_list);
        this._food += prey.health;
        const min_energy = this._cfg.min_energy_replenish;
        this._energy = Math.min(min_energy, this._energy + 1);
        this._rdy_to_copulate = true;
        if((prey.health -= this._attack) <= 0)
            return {ate: true, killed_prey: prey.die()};
        if(prey instanceof Plant && prey.level > 0)
            prey.devolve();

        return {ate: true};
    }

    _survive_without_food() {
        this._rdy_to_copulate = false;
        if(this._energy-- === 0) {
            this.die();
            return false;
        }
        return true;
    }

    _consume_from_food_reserves() {
        if(--this._food === 0)
            this._rdy_to_copulate = false;
    }

    _is_horny() {
        return this._rdy_to_copulate;
    }

    _try_reproduction(mate_class) {
        const env = this.tile.env_rings[0];
        const mating_partners = env.reduce((partner_list, tile) => {
            const partner = tile.entity(mate_class, this.level);
            if(partner && partner._is_horny())
                partner_list.push(partner);
            return partner_list;
        }, []);

        if(mating_partners.length === 0)
            return null;

        const birthplace_list = env.filter(tile => tile.walkable());
        if(birthplace_list.length === 0)
            return null;
        const birthplace = helpers.array_choice(birthplace_list);

        this._have_sex(helpers.array_choice(mating_partners));

        if(helpers.chance_in_percent(this._cfg.lvlup_chance) &&
            this.level != this._cfg.max_level &&
            birthplace.walkable(this.level + 1)
        ){
            return new mate_class(birthplace, this.level + 1);
        } else if(birthplace.walkable(this.level)) {
            return new mate_class(birthplace, this.level);
        } else {
            return this._devolve(mate_class, birthplace);
        }
    }

    _have_sex(partner) {
        this._rdy_to_copulate = partner._rdy_to_copulate = false;
    }

    _devolve(child_class, birthplace) {
        // it is assumed that we need to devolve b/c of blocking veggy on tile
        const veggy_lvl = birthplace.entity().level;
        return new child_class(birthplace, veggy_lvl - 1);
    }

    _move(own_class, prey_class) {
        let target_tile = undefined;

        if(this._is_horny())
            target_tile = this._route_to_mate(own_class);
        else if(this._is_hungry() || this.level === 2)
            target_tile = this._route_to_prey(prey_class);

        // if entity is neither hungry nor horny, or the step towards a mate
        // or prey can't be taken (is blocked), we try to move randomly
        if(!target_tile) {
            target_tile = this._random_step();
            if(!target_tile) {  // no way to move: death of entity
                this.die();
                return false;
            }
        }

        this.go_to_tile(target_tile);
        return true;
    }

    _route_to_mate(mate_class, lvl) {
        const possible_targets = this._search_target_candidates(
            mate_class, this.lvl
        );
        if(possible_targets.length === 0)
            return null;
        return this._make_step_choice(possible_targets);
    }

    _route_to_prey(prey_class) {
        let possible_targets = this._search_target_candidates(prey_class);
        if(possible_targets.length === 0)
            return null;

        // of the found targets, we pick one with the highest lvl
        const max_target_lvl = Math.max(
            ...possible_targets.map(entity => entity.level)
        );
        possible_targets = possible_targets.filter(
            entity => entity.level === max_target_lvl
        );

        return this._make_step_choice(possible_targets);
    }

    _search_target_candidates(target_class, lvl = undefined) {
        const possible_targets = [];

        for(const ring of this.tile.env_rings.slice(1, this._view_range)) {
            for(const tile of ring) {
                const entity = tile.entity(target_class, lvl);
                if(entity)
                    possible_targets.push(entity);
            }
            if(possible_targets.length > 0)
                break;
        }

        return possible_targets;
    }

    _make_step_choice(target_candidates) {
        const wanted_target = helpers.array_choice(target_candidates);
        const immediate_env = this.tile.env_rings[0];
        const step_position = this._calculate_step(wanted_target);
        const target_tile = immediate_env[step_position];

        if(target_tile.walkable(this.level))
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
    _calculate_step(target) {
        const x_dir = (target.pos_x > this.pos_x) -
                      (target.pos_x < this.pos_x)
        const y_dir = (target.pos_y > this.pos_y) -
                      (target.pos_y < this.pos_y)

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

    _random_step() {
        const env = this.tile.env_rings[0];
        const walkable_tiles = env.filter(
            tile => tile.walkable(this.level)
        );
        if(walkable_tiles.length > 0)
            return helpers.array_choice(walkable_tiles);
        else
            return null;
    }

    act(actor_class, prey_class) {
        if(!this._grow_older())
            return {death: true};

        if(this._is_hungry()) {
            const {ate, killed_prey} = this._hunt(prey_class);
            if(ate)
                return {killed_prey};
            if(!this._survive_without_food())
                return {death: true};

            // if we land here, the herbivore couldn't eat, but didn't die
        } else {
            this._consume_from_food_reserves();

            if(this._is_horny()) {
                const newborn = this._try_reproduction(actor_class);
                if(newborn)
                    return {offspring: newborn};
            }
        }

        return {death: !this._move(actor_class, prey_class)};
    }
}

class Herbivore extends LandAnimal {
    constructor(tile, lvl) {
        const cfg = Herbivore.config;
        const level = Math.min(lvl, cfg.max_level);

        super(tile, level);

        this._cfg = cfg;
        this._view_range = cfg.view_range[level];
        this._time_to_live = cfg.time_to_live[level];
        this._energy = cfg.energy[level];
        this._food = cfg.food[level];
        this.health = cfg.health[level];
        this._attack = cfg.attack[level];
    }

    act() {
        return super.act(Herbivore, Plant);
    }
}

class Carnivore extends LandAnimal {
    constructor(tile, lvl) {
        const cfg = Carnivore.config;
        const level = Math.min(lvl, cfg.max_level);

        super(tile, level);

        this._cfg = cfg;
        this._view_range = cfg.view_range[level];
        this._time_to_live = cfg.time_to_live[level];
        this._energy = cfg.energy[level];
        this._food = cfg.food[level];
        this._attack = cfg.attack[level];
    }

    act() {
        return super.act(Carnivore, Herbivore);
    }
}

class Protozoan extends Animal {
    constructor(tile) {
        super(-Infinity, tile);
        this._time_to_live = Protozoan.config.time_to_live;
    }

    _beach_reachable() {
        const env = this.tile.env_rings[0];
        // save as instance var for later use by _jump_on_beach
        this._adjacent_beaches = env.filter((tile) => tile.walkable());
        return this._adjacent_beaches.length > 0;
    }

    _jump_on_beach() {
        this.tile.pop_entity();
        const constr = helpers.chance_in_percent(
            Protozoan.config.herby_evo_chance) ? Herbivore : Carnivore;
        return new constr(helpers.array_choice(this._adjacent_beaches), 0);
    }

    _move() {
        if(this._time_to_live-- === 0) {
            this.tile.pop_entity();
            return false;
        }

        const env = this.tile.env_rings[0];
        const swimmable_tiles = env.filter((tile) => tile.entity(Water));
        if(swimmable_tiles.length === 0) {
            this.die();
            return false; // dies when it has nowhere to move
        }
        this.go_to_tile(helpers.array_choice(swimmable_tiles));
        return true;
    }

    act() {
        if(this._beach_reachable())
            return {offspring: this._jump_on_beach()};
        return {death: !this._move()};
    }
}

class Vegetation extends Leveler(Entity) {
    constructor(allows_step, tile, level) {
        super(allows_step, tile, level);
        this._ticks_to_reproduce = undefined;
    }

    _try_growth() {
        const env = this.tile.env_rings[0];
        const free_tiles = env.filter(tile => tile.empty());
        if(free_tiles.length > 0) {
            if(this._ticks_to_reproduce === undefined) {
                this._ticks_to_reproduce = helpers.random_in_range(
                    ...Vegetation.config.ticks_repro_range
                );
            } else if(--this._ticks_to_reproduce <= 0) {
                this._ticks_to_reproduce = undefined;
                return new Plant(helpers.array_choice(free_tiles), 0);
            }
        } else {
            this._ticks_to_reproduce = undefined;
        }

        return null;
    }

    act() {
        return {offspring: this._try_growth()};
    }
}

class RainForest extends Vegetation {
    constructor(tile) {
        super(-Infinity, tile, Infinity);
    }
}

class Plant extends Mortal(Vegetation) {
    constructor(tile, lvl) {
        const cfg = Plant.config;
        const level = Math.min(lvl, cfg.max_level);
        const allows_step = Math.abs(lvl - cfg.max_level);

        super(allows_step, tile, level);

        this.health = cfg.health[level];
        this._ticks_to_evolve = undefined;
    }

    _set_configs(lvl) {
        this._lvl = Math.min(lvl, Plant.config.max_level);
        this.allows_step = Math.abs(this._lvl - Plant.config.max_level);
        this.health = Plant.config.health[this._lvl];
        this._ticks_to_evolve = undefined;
    }

    _can_evolve() {
        if(this._lvl === Plant.config.max_level)
            return false;

        const env = this.tile.env_rings[0];
        if(env.every(tile => {
            const adjacent_veg = tile.entity(Vegetation);
            return adjacent_veg && adjacent_veg.level >= this.level ||
                   tile.entity(Border);
        })) {
            if(this._ticks_to_evolve === undefined) {
                const tick_range = Plant.config.ticks_evo_range;
                this._ticks_to_evolve = helpers.random_in_range(...tick_range);
                return false;
            } else {
                return --this._ticks_to_evolve <= 0 ? true : false;
            }
        }

        this._ticks_to_evolve = undefined;
        return false;
    }

    _evolve() {
        this._set_configs(this._lvl + 1); // lvlup;
        this._ticks_to_evolve = undefined;
    }

    devolve() {
        for(let lvl = 0; lvl < Plant.config.health.length-1; ++lvl) {
            if(this.health <= Plant.config.health[lvl]) {
                this._set_configs(lvl);
                return;
            }
        }
    }

    act() {
        if(this._can_evolve()) {
            this._evolve();
            return {};
        }
        return super.act();
    }
}

Vegetation.config = {
    ticks_repro_range: [10, 40]
};
Plant.config = {
    max_level: 2,
    health: [5, 10, 15],
    ticks_evo_range: [40, 100]
}
Protozoan.config = {
    time_to_live: 20,
    herby_evo_chance: 80
}
Herbivore.config = {
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
Carnivore.config = {
    max_level: 2,
    time_to_live: [50, 100, 150],
    view_range: [4, 6, 8],
    food: [10, 10, 10],
    energy: [10, 20, 30],
    attack: [5, 10, 15],
    lvlup_chance: 50,
    min_energy_replenish: 10
}
