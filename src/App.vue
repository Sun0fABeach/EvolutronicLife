<template>
  <div id="app">
    <Game id="evolife" />
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

<style lang="scss">
html, body {
  height: 100%;
}
html {
  width: 100%;
}
body {
  background-color: #151010;
  margin: 0;  /* remove browser auto-margin */
  font-family: sans-serif;
}
#evolife {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
