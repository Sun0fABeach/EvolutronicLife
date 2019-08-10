<template>
  <main>
    <div id="world"></div>
    <div id="control_panel">
      <label>Steps per second: </label><span id="steps_per_sec"></span>
      <div id="speed_ctrl_container">
        <button type="button" class="ctrl_button" id="slower">Slower</button>
        <button type="button" class="ctrl_button" id="pause">Pause</button>
        <button type="button" class="ctrl_button" id="faster">Faster</button>
        <button type="button" class="ctrl_button" id="step" disabled>Step</button>
      </div>
      <div id="kill_switch_container">
        <select id="kill_options">
          <option value="Herbivore" selected>Herbivore</option>
          <option value="Carnivore">Carnivore</option>
          <option value="Protozoan">Protozoan</option>
          <option value="Plant">Plant</option>
        </select>
        <button type="button" class="ctrl_button" id="kill">Kill All</button>
      </div>
      <label>Tracked: </label>
      <div id="tracker_display">Ӝ</div>
      <table>
        <tr>
          <th>Type</th>
          <td id="type">RainForest</td>
          <th>Level</th>
          <td id="level">3</td>
          <th>Time to Live</th>
          <td id="time_to_live" class="last_col">32</td>
        </tr>
        <tr>
          <th>Food</th>
          <td id="food">5</td>
          <th>Energy</th>
          <td id="energy">10</td>
          <th>Health</th>
          <td id="health" class="last_col">15</td>
        </tr>
        <tr>
          <th>Attack</th>
          <td id="attack">15</td>
          <th>Horny</th>
          <td id="is_horny">Yes</td>
          <th>View Range</th>
          <td id="view_range" class="last_col">8</td>
        </tr>
      </table>
    </div>
    <button type="button" id="toggle_ctrls">Show Control Panel</button>
  </main>
</template>

<script lang="ts">
import Vue from 'vue';
import game from '@/game/main';
import userCtrl from '@/game/user_ctrl';

export default Vue.extend({
  name: 'Game',
  mounted() {
    userCtrl.setup_event_listeners();
    game.start_simulation();
  }
});
</script>

<style lang="scss">
@import '~@/style.css';
</style>
