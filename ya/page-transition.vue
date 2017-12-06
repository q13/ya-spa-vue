<template>
  <div class="page-transition" :class="[onTransition && name ? `page-transition-${name}` : '']" :style="style">
    <transition
      :name="name"
      @before-enter="handleBeforeEnter"
      @after-enter="handleAfterEnter"
      @after-leave="handleAfterLeave"
    >
      <slot></slot>
    </transition>
  </div>
</template>
<script>
export default {
  props: {
    name: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      onTransition: false,
      style: {}
    };
  },
  watch: {
  },
  destroyed() {
  },
  methods: {
    handleBeforeEnter() {
      this.onTransition = true;
    },
    // handleEnter(el, done) {
    //   done();
    // },
    handleAfterEnter() {
      this.onTransition = false;
    },
    handleBeforeLeave() {
      // let value = {};
      // const name = this.name;
      // if (name === 'flip') {
      //   console.log(11111);
      //   const winScrollTop = document.body.scrollTop + document.documentElement.scrollTop; // 记录位置
      //   value['perspective-origin'] = '50% ' + winScrollTop + 'px';
      //   this.style = value;
      // }
    },
    handleAfterLeave() {
      // this.onTransition = false;
    },
    handleLeave(el, done) {
      // done();
      // const name = this.name;
      // if (name === 'perspective-left') {
      //   Velocity(el, {
      //     opacity: [0, 1],
      //     transformPerspective: [2000, 2000],
      //     transformOriginX: [0, 0],
      //     transformOriginY: [0, 0],
      //     rotateY: -180
      //   }, {
      //     duration: 12960,
      //     complete: () => {
      //       Velocity.animate(el, {
      //         transformPerspective: 0,
      //         transformOriginX: '50%',
      //         transformOriginY: '50%',
      //         rotateY: 0
      //       }, {
      //         duration: 0,
      //         queue: false,
      //         complete: done
      //       });
      //     }
      //   });
      // } else {
      //   done();
      // }
    }
  }
}
</script>
<style>
.page-transition .slide-right-enter-active,
.page-transition .slide-right-leave-active {
  transition: all 0.4s ease;
}
.page-transition .slide-right-enter-active {
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  z-index: 10;
}
.page-transition .slide-right-enter, 
.page-transition .slide-right-leave-to {
  left: 360px;
  transform: translateZ(0);
  opacity: 0;
}
.page-transition .slide-right-leave-active {
  left: 0;
  transform: translateZ(0);
}
.page-transition .opacity-enter-active,
.page-transition .opacity-leave-active {
  transition: opacity .4s ease;
}
.page-transition .opacity-enter-active {
  position: absolute;
  top: 0;
  width: 100%;
  left: 0;
}
.page-transition .opacity-enter, 
.page-transition .opacity-leave-to {
  opacity: 0;
  transform: translateZ(0);
}


.page-transition-flip {
  /* perspective: 800px; */
  /* backface-visibility:hidden;
  perspective-origin: 50% center; */
  /* transform-style: preserve-3d; */
}
.page-transition .flip-enter-active {
  transition: transform .4s ease;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  transform: translateZ(0);
}
.page-transition .flip-enter {
  transform: rotateY(90deg) translateZ(0);
  opacity: 0;
}

</style>

