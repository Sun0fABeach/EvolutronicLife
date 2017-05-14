"use strict";

/**
 * Top level simulation control.
 * @module main
 * @main main
 * @requires translator
 * @requires simulation
 * @requires display
 */

/**
 * Top level simulation control singleton object.
 * @class main
 */
const main = function() {
    let step_duration = 500;
    const step_change = 100;
    const max_step_duration = 1000;
    const min_step_duration = 100;
    let simulation_stopped = false;
    let current_timeout;
    let watched_entity;
    let num_map_cols;

    /**
     * Simulation loop, called in intervals.
     * @method loop
     * @private
     */
    function loop() {
        current_timeout = setTimeout(loop, step_duration);
        simulation.update();
        const watched_idx = check_watched_entity();
        display.update_world(simulation.entity_map, watched_idx);
        display.update_watched_info(watched_entity);
    }

    /**
     * Start simulation. This includes parsing the map, displaying everything
     * and finally initiating the game loop.
     * @method start_simulation
     */
    function start_simulation() {
        const entity_map = translator.parse_initial_map(map);
        num_map_cols = entity_map[0].length;
        simulation.setup_tile_map(entity_map);
        display.update_speed(step_duration);
        display.update_world(simulation.entity_map);
        display.update_watched_info(null);
        setTimeout(loop, step_duration);
    }

    /**
     * Set a new watched entity and display it. If there is no watched entity
     * at the given position, the entity tracking info will be cleared.
     * @method set_watched_entity
     * @param {Number} index_on_map Index n of the new watched entity as in
     *                              child number n of its parent node.
     */
    function set_watched_entity(index_on_map) {
        const y = Math.floor(index_on_map / num_map_cols);
        const x = index_on_map % num_map_cols;
        watched_entity = simulation.get_entity(y, x);
        if(watched_entity)
            display.highlight_watched_on_map(index_on_map);
        display.update_watched_info(watched_entity);
    }

    /**
     * Check if the currently watched entity is still alive and if not, set
     * global variable *watched_entity* to *null*. Return the map index of the
     * watched entity, or *undefined* if there is none.
     * @method check_watched_entity
     * @private
     * @return {Number} Index n of the watched entity as in child number n of
     *                  its parent node, or *undefined* if there is no watched
     *                  entity.
     */
    function check_watched_entity() {
        let watched_idx;
        if(watched_entity) {
            if(!watched_entity.in_simulation()) {
                watched_entity = null;
            } else {
                watched_idx = watched_entity.pos_y * num_map_cols +
                                watched_entity.pos_x;
            }
        }
        return watched_idx;
    }

    /**
     * Slow down simulation.
     * @method slow_down_interval
     * @return {Object} Two-member object, containing:
     * - step_duration: new duration in milliseconds
     * - limit_reached: true if minimum speed reached, false otherwise
     */
    function slow_down_interval() {
        if(step_duration < max_step_duration)
            step_duration += step_change;
        return {
            step_duration, limit_reached: step_duration == max_step_duration
        };
    }

    /**
     * Speed up simulation.
     * @method speed_up_interval
     * @return {Object} Two-member object, containing:
     * - step_duration: new duration in milliseconds
     * - limit_reached: true if maximum speed reached, false otherwise
     */
    function speed_up_interval() {
        if(step_duration > min_step_duration)
            step_duration -= step_change;
        return {
            step_duration, limit_reached: step_duration == min_step_duration
        };
    }

    /**
     * Pause/unpause simulation.
     * @method stop_resume
     * @return {Boolean} True if simulation continued, false if it stopped
     */
    function stop_resume() {
        if(simulation_stopped) {
            simulation_stopped = false;
            loop();
            return true;
        } else {
            simulation_stopped = true;
            clearTimeout(current_timeout);
            return false;
        }
    }

    return {
        start_simulation,
        set_watched_entity,
        slow_down_interval,
        speed_up_interval,
        stop_resume
    };
}();
