<template>
  <div id="app">
    <Game/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Game from './components/Game.vue';

export default Vue.extend({
  name: 'app',
  components: {
    Game
  }
});
</script>
