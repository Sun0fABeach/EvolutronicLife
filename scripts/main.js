"use strict";

// TODO: there shall be a display module. main shouldn't do that stuff

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
        if(watched_entity && !watched_entity.in_simulation())
            watched_entity = null;
        display.update_world(simulation.entity_map);
        display.update_watched_entity(watched_entity);
    }

    /**
     * Start simulation.
     * @method start_simulation
     */
    function start_simulation() {
        const entity_map = translator.parse_initial_map(map);
        num_map_cols = entity_map[0].length;
        simulation.setup_tile_map(entity_map);
        display.update_speed(step_duration);
        display.update_world(simulation.entity_map);
        display.update_watched_entity(null);
        setTimeout(loop, step_duration);
    }

    /**
     * Set a new watched entity and display it.
     * @method set_watched_entity
     * @param {Number} index_on_map Index n of the new watched entity as in
     *                              child number n of its parent node.
     */
    function set_watched_entity(index_on_map) {
        const y = Math.floor(index_on_map / num_map_cols);
        const x = index_on_map % num_map_cols;
        watched_entity = simulation.get_entity(y, x);
        display.update_watched_entity(watched_entity);
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
