'use strict';

// TODO: button dis/enabling done via display module ?

/**
 * Event listeners for user input.
 * @module user_ctrl
 * @requires main
 * @requires display
 */

 /**
  * Singleton object containing the event listeners.
  * @class user_ctrl
  */
const user_ctrl = function() {
    let slower_button, faster_button, pause_button, step_button;

    /**
     * Install event listeners.
     * @method setup_event_listeners
     * @private
     */
    function setup_event_listeners() {
        faster_button = document.getElementById("faster");
        slower_button = document.getElementById("slower");
        pause_button = document.getElementById("pause");
        step_button = document.getElementById("step");
        faster_button.addEventListener("click", increase_speed);
        slower_button.addEventListener("click", decrease_speed);
        pause_button.addEventListener("click", stop_resume);
        step_button.addEventListener("click", do_step);
        document.getElementById("world").addEventListener(
            "mouseup", track_entity
        );
    }

    /**
     * Event handler: slow down simulation.
     * @method decrease_speed
     * @param {Event} event Mouse click event
     * @private
     */
    function decrease_speed(event) {
        const {
            step_duration, limit_reached: disable_button
        } = main.slow_down_interval();

        if(disable_button) {
            slower_button.setAttribute("disabled", "");
            slower_button.removeEventListener("click", decrease_speed);
        } else if(faster_button.hasAttribute("disabled")) {
            faster_button.removeAttribute("disabled");
            faster_button.addEventListener("click", increase_speed);
        }

        display.update_speed(step_duration);
    }

    /**
     * Event handler: speed up simulation.
     * @method increase_speed
     * @param {Event} event Mouse click event
     * @private
     */
    function increase_speed(event) {
        const {
            step_duration, limit_reached: disable_button
        } = main.speed_up_interval();

        if(disable_button) {
            faster_button.setAttribute("disabled", "");
            faster_button.removeEventListener("click", increase_speed);
        } else if(slower_button.hasAttribute("disabled")) {
            slower_button.removeAttribute("disabled");
            slower_button.addEventListener("click", decrease_speed);
        }

        display.update_speed(step_duration);
    }

    /**
     * Event handler: pause or resume simulation.
     * @method stop_resume
     * @param {Event} event Mouse click event
     * @private
     */
    function stop_resume(event) {
        let button_label;
        if(main.stop_resume()) {
            button_label = "Pause";
            step_button.setAttribute("disabled", "");
            step_button.removeEventListener("click", do_step);
        } else {
            button_label = "Resume";
            step_button.removeAttribute("disabled");
            step_button.addEventListener("click", do_step);
        }
        pause_button.setAttribute("value", button_label);
    }

    /**
     * Event handler: move simulation one step forward.
     * @method do_step
     * @param {Event} event Mouse click event
     * @private
     */
    function do_step(event) {
        main.step();
    }

    /**
     * Event handler: track the clicked entity.
     * @method track_entity
     * @param {Event} event Mouse click event
     * @private
     */
    function track_entity(event) {
        const clicked = event.target;
        main.set_watched_entity(
            Array.from(clicked.parentNode.children).indexOf(clicked)
        );
    }

    window.addEventListener("load", () => {
        setup_event_listeners();
        main.start_simulation();
    });

    return {  };  // TODO this might not be needed
}();
