// TODO: button dis/enabling done via display module ?

/**
 * Event listeners for user input.
 * @module user_ctrl
 * @requires main
 * @requires globals
 */

import main from './main';
import { markupPrefix } from './globals';


const user_ctrl = function() {

    let slower_button, faster_button, pause_button,
        step_button, kill_button, kill_select, toggle_ctrls;

    /**
     * Install event listeners.
     * @method setup_event_listeners
     * @private
     */
    function setup_event_listeners() {
        faster_button = document.getElementById(`${markupPrefix}faster`);
        slower_button = document.getElementById(`${markupPrefix}slower`);
        pause_button = document.getElementById(`${markupPrefix}pause`);
        step_button = document.getElementById(`${markupPrefix}step`);
        kill_button = document.getElementById(`${markupPrefix}kill`);
        kill_select = document.getElementById(`${markupPrefix}kill-options`);
        toggle_ctrls = document.getElementById(`${markupPrefix}toggle-ctrls`);
        faster_button.addEventListener("click", increase_speed);
        slower_button.addEventListener("click", decrease_speed);
        pause_button.addEventListener("click", stop_resume);
        kill_button.addEventListener("click", kill_entities);

        /* disable this button via javascript here, b/c for some reason,
           firefox doesn't respect the disabled attribute in html */
        step_button.setAttribute("disabled", "");

        toggle_ctrls.addEventListener("click", toggle_ctrl_panel);
        document.getElementById("evolife--world").addEventListener(
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
    }

    /**
     * Event handler: pause or resume simulation.
     * @method stop_resume
     * @param {Event} event Mouse click event
     * @private
     */
    function stop_resume(event) {
        if(main.stop_resume()) {
            pause_button.innerHTML = "Pause";
            step_button.setAttribute("disabled", "");
            step_button.removeEventListener("click", do_step);
        } else {
            pause_button.innerHTML = "Resume";
            step_button.removeAttribute("disabled");
            step_button.addEventListener("click", do_step);
        }
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
     * Event handler: mkill all entities of the selected type.
     * @method kill_entities
     * @param {Event} event Mouse click event
     * @private
     */
    function kill_entities(event) {
        main.kill_all_of(kill_select.value);
    }

    /**
     * Event handler: show or hide control panel.
     * @method toggle_ctrl_panel
     * @param {Event} event Mouse click event
     * @private
     */
    function toggle_ctrl_panel(event) {
        let ctrl_panel = document.getElementById(
            `${markupPrefix}controls-wrapper`
        );
        if(toggle_ctrls.innerHTML.trim() === "Show Control Panel") {
            ctrl_panel.style.height = ctrl_panel.scrollHeight + "px";
            ctrl_panel.style.opacity = 1;
            ctrl_panel.style.marginBottom = "12px";
            toggle_ctrls.innerHTML = "Hide Control Panel";
        } else {
            ctrl_panel.style.height = 0;
            ctrl_panel.style.opacity = 0;
            ctrl_panel.style.marginBottom = 0;
            toggle_ctrls.innerHTML = "Show Control Panel";
        }
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

    return { setup_event_listeners }
}();

export default user_ctrl;
