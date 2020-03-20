<template>
  <div id="app">
    <Game id="evolife" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'
import Game from './components/Game.vue'

export default Vue.extend({
  name: 'app',
  components: {
    Game
  }
})
</script>

<style lang="scss">
body {
  margin: 0;  // remove browser auto-margin
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: #151010;
  font-family: sans-serif;
}
#app {
  position: relative; // anchor for centered game position
}
#evolife {
  position: absolute;
  transform: translate(-50%, -286px); // half height of game with closed panel
}
</style>
