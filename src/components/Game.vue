<template>
  <div id="evolife">

    <div id="evolife--world"/>

    <div id="evolife--control-panel">
      <div id="evolife--controls-wrapper">

        <label>Steps per second: </label><span id="evolife--steps-per-sec"/>

        <div id="evolife--speed-ctrl">
          <button
            type="button"
            class="evolife--ctrl-button"
            id="evolife--slower"
          >
            Slower
          </button>
          <button
            type="button"
            class="evolife--ctrl-button"
            id="evolife--pause"
          >
            Pause
          </button>
          <button
            type="button"
            class="evolife--ctrl-button"
            id="evolife--faster"
          >
            Faster
          </button>
          <button
            type="button"
            class="evolife--ctrl-button"
            id="evolife--step"
            disabled
          >
            Step
          </button>
        </div>

        <div id="evolife--kill-switch-container">
          <select id="evolife--kill-options">
            <option value="Herbivore" selected>Herbivore</option>
            <option value="Carnivore">Carnivore</option>
            <option value="Protozoan">Protozoan</option>
            <option value="Plant">Plant</option>
          </select>
          <button type="button" class="evolife--ctrl-button" id="evolife--kill">
            Kill All
          </button>
        </div>

        <label>Tracked: </label>
        <div id="evolife--tracker-display">Ӝ</div>

        <table id="evolife--entity-stats">
          <tr>
            <th>Type</th>
            <td id="evolife--entity-stats__type">RainForest</td>
            <th>Level</th>
            <td id="evolife--entity-stats__level" data-stat="level">3</td>
            <th>Time to Live</th>
            <td
              data-stat="time_to_live"
              id="evolife--entity-stats__time-to-live"
              class="evolife--entity-stats__last-col"
            >
              32
            </td>
          </tr>
          <tr>
            <th>Food</th>
            <td id="evolife--entity-stats__food" data-stat="food">5</td>
            <th>Energy</th>
            <td id="evolife--entity-stats__energy" data-stat="energy">10</td>
            <th>Health</th>
            <td
              data-stat="health"
              id="evolife--entity-stats__health"
              class="evolife--entity-stats__last-col"
            >
              15
            </td>
          </tr>
          <tr>
            <th>Attack</th>
            <td id="evolife--entity-stats__attack" data-stat="attack">15</td>
            <th>Horny</th>
            <td
              data-stat="is_horny"
              id="evolife--entity-stats__is-horny"
            >
              Yes
            </td>
            <th>View Range</th>
            <td
              data-stat="view_range"
              id="evolife--entity-stats__view-range"
              class="evolife--entity-stats__last-col"
            >
              8
            </td>
          </tr>
        </table>
      </div>

      <button type="button" id="evolife--toggle-ctrls">
        Show Control Panel
      </button>
    </div>
  </div>
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
@import '~@/style';
</style>
