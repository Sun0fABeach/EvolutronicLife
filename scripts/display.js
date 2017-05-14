"use strict";

/**
 * HTML modification routines.
 * @module display
 * @requires helpers
 */

/**
 * Top level display singleton object.
 * @class display
 */
 const display = function() {
     /**
      * Draw world on browser window.
      * @method display_world
      * @param {Array} entity_map Entity map to translate and display
      * @param {Number} [watched_idx=undefined] Index n of the watched entity
      *                 as in child number n of its parent node. *undefined*
      *                 if there is no watched entity.
      */
     function update_world(entity_map, watched_idx=undefined) {
         const new_map = translator.build_html_map(entity_map, watched_idx);
         const world_container = document.getElementById("world");
         const old_map = world_container.firstElementChild;
         if(old_map)
             world_container.removeChild(old_map);
         world_container.appendChild(new_map);
     }

     /**
      * Highlight watched entity on the world map.
      * @method highlight_watched_on_map
      * @param {Number} watched_idx Index n of the watched entity as in
      *                             child number n of its parent node.
      */
     function highlight_watched_on_map(watched_idx) {
         const currently_highlighted = document.getElementById("tracked");
         if(currently_highlighted)
            currently_highlighted.id = "";
         const map = document.querySelector("pre");
         map.children[watched_idx].id = "tracked";
     }

     /**
      * Display the currently watched entity, or clear display if there is none.
      * @method display_watched_entity
      * @param {Entity} watched_entity Currently tracked entity. If *null*,
      *                                the tracking info will be cleared.
      */
     function update_watched_info(watched_entity) {
         const tracker_display = document.getElementById("tracker_display");

         if(!watched_entity) {
             tracker_display.className = "";
             tracker_display.innerHTML = "";
             return;
         }

         const {token, css_class} = translator.entity_to_token(watched_entity);
         tracker_display.className = css_class;
         tracker_display.innerHTML = token;
     }

     /**
      * Update the speed indicator.
      * @method display_speed
      * @param {Number} step_duration Duration of steps in milliseconds
      */
     function update_speed(step_duration) {
         const steps_per_sec = (1000 / step_duration).toFixed(2);
         document.querySelector("#steps_per_sec").innerHTML =
             helpers.pad_left(steps_per_sec, 5);
     }

     return {
         update_world,
         highlight_watched_on_map,
         update_watched_info,
         update_speed
     };
 }();
