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
      */
     function update_world(entity_map) {
         const new_map = translator.build_html_map(entity_map);
         const world_container = document.getElementById("world");
         const old_map = world_container.firstElementChild;
         if(old_map)
             world_container.removeChild(old_map);
         world_container.appendChild(new_map);
     }

     /**
      * Display the currently watched entity, or clear display if it died or
      * there currently is no watched entity.
      * @method display_watched_entity
      * @param {Entity} watched_entity Currently tracked entity
      */
     function update_watched_entity(watched_entity) {
         const tracker_display = document.getElementById("tracker_display");

         if(!watched_entity) {
             tracker_display.className = "";
             tracker_display.innerHTML = "";
             return;
         }

         const {token, css_class} = translator.entity_to_token(watched_entity);
         tracker_display.className = css_class || "";
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

     return {update_world, update_watched_entity, update_speed};
 }();
