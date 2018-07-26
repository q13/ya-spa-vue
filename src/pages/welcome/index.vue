<template>
  <div class="welcome-body">
    Hey guy! Here is A SPA project framework.
  </div>
</template>

<script>
export default {
  created() {
    console.log('Welcome created!');
  }
}
</script>

<style>
.welcome-body {
  animation: 1s rainbow;
}
@keyframes rainbow {
  0% { background: #c00; }
  50% { background: orange; }
  100% { background: yellowgreen; }
}
</style>