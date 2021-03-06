/**
 * HTML modification routines.
 * @module display
 * @requires translator
 * @requires entities
 * @requires globals
 */

import { pull, padStart, findKey } from 'lodash-es'
import translator from './translator'
import entities from './entities'
import { markupPrefix } from './globals'


/**
 * Top level display singleton object.
 * @class display
 */
 const display = function() {
    /**
     * Draw world on browser window.
     * @method update_world
     * @param {Array} entity_map Entity map to translate and display
     * @param {Boolean} do_toggle Whether the entity tokens should toggle on
     *                            this update
     * @param {Number} [watched_idx=undefined] Index n of the watched entity
     *                 as in child number n of its parent node. *undefined*
     *                 if there is no watched entity.
     */
    function update_world(entity_map, do_toggle, watched_idx=undefined) {
        const new_map = translator.build_html_map(
            entity_map, do_toggle, watched_idx
        )
        const world_container = document.getElementById(
            `${markupPrefix}world`
        )
        const old_map = world_container.firstElementChild
        if(old_map)
            world_container.removeChild(old_map)
        world_container.appendChild(new_map)
    }

    /**
     * Highlight watched entity on the world map and clear previous
     * highlighting.
     * @method highlight_watched_on_map
     * @param {Number} watched_idx Index n of the watched entity as in
     *                             child number n of its parent node. Set to
     *                             *undefined* if you just want to clear
     *                             current highlighting.
     */
    function highlight_watched_on_map(watched_idx) {
        const trackedId = `${markupPrefix}tracked`
        const currently_highlighted = document.getElementById(trackedId)
        if(currently_highlighted)
            currently_highlighted.id = ''
        if(watched_idx !== undefined) {
            const map = document.querySelector(`#${markupPrefix}world pre`)
            map.children[watched_idx].id = trackedId
        }
    }

    /**
     * Display the currently watched entity in the control panel by showing
     * the token and displaying its stats in the table.
     * @method update_watched_info
     * @param {Entity} watched_entity Currently tracked entity. If *null*,
     *                                the tracking info will be cleared.
     */
    function update_watched_info(watched_entity) {
        _update_token_display(watched_entity)
        _update_watched_table(watched_entity)
    }

    /**
     * Display the currently watched entity, or clear display if there is none.
     * @method _update_token_display
     * @private
     * @param {Entity} watched_entity Currently tracked entity. If *null*,
     *                                the token display will be cleared.
     */
    function _update_token_display(watched_entity) {
        const tracker_display = document.getElementById(
            `${markupPrefix}tracker-display`
        )

        if(!watched_entity) {
            tracker_display.className = ''
            tracker_display.innerHTML = ''
            return
        }

        const {token, css_class} = translator.entity_to_token(watched_entity)
        tracker_display.className = css_class
        tracker_display.innerHTML = token
    }

    /**
     * Display the currently watched entity's stats in the table, or clear
     * the table info if there is none.
     * @method _update_watched_table
     * @private
     * @param {Entity} watched_entity Currently tracked entity. If *null*,
     *                                the stats table will be cleared.
     */
    function _update_watched_table(watched_entity) {
        const stats_table = document.getElementById(
            `${markupPrefix}entity-stats`
        )

        const statsPrefix = `${markupPrefix}entity-stats__`
        const fields = Array.from(stats_table.getElementsByTagName('td'))
        const name_field = stats_table.querySelector(`#${statsPrefix}type`)
        pull(fields, name_field)

        if(watched_entity) {
            name_field.innerHTML = findKey(entities, klass =>
                watched_entity instanceof klass
            )
        } else {
            name_field.innerHTML = '-'
        }

        for(const field of fields) {
            const stat = field.dataset.stat

            if(!watched_entity || watched_entity[stat] === undefined ||
                                watched_entity[stat] === Infinity) {
                field.innerHTML = '-'
            } else {
                // field dataset values match the entity property names
                let value = watched_entity[stat]
            if(stat === 'level')
                ++value; // level starts at 0 internally
            else if(stat === 'is_horny') // value is bool
                value = ['No', 'Yes'][0+value]; // cast to int for indexing
                field.innerHTML = value
            }
        }
    }

    /**
     * Update the speed indicator.
     * @method display_speed
     * @param {Number} step_duration Duration of steps in milliseconds
     */
    function update_speed(step_duration) {
        const steps_per_sec = (1000 / step_duration).toFixed(2)
        document.querySelector(`#${markupPrefix}steps-per-sec`).innerHTML =
            padStart(steps_per_sec, 5, String.fromCharCode(160)) // nbsp
    }

    return {
        update_world,
        highlight_watched_on_map,
        update_watched_info,
        update_speed
    }
}()

export default display
