"use strict";

/**
 * Top level simulation control.
 * @module main
 * @main main
 * @requires translator
 * @requires simulation
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

    /**
     * Draw world on browser window.
     * @method display_world
     * @private
     */
    function display_world() {
        const html_map = translator.build_html_map(simulation.entity_map);
        const main = document.querySelector("main");
        const old_map = main.firstElementChild;
        if(old_map.tagName.toLowerCase() === 'pre')
            main.removeChild(old_map);
        main.insertBefore(html_map, main.firstElementChild);
    }

    /**
     * Simulation loop, called in intervals.
     * @method loop
     * @private
     */
    function loop() {
        current_timeout = setTimeout(loop, step_duration);
        simulation.update();
        display_world();
    }

    /**
     * Start simulation.
     * @method start_simulation
     */
    function start_simulation() {
        const entity_map = translator.parse_initial_map(map);
        simulation.setup_tile_map(entity_map);
        user_ctrl.display_speed(step_duration);
        display_world();
        setTimeout(loop, step_duration);
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
        start_simulation, slow_down_interval, speed_up_interval, stop_resume
    };
}();
