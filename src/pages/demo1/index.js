/**
 * Demo页
 */
import template from './template.html';
import style from './style.styl';

export default {
  template,
  data() {
    return {
      classNames: {
        [style['cpt']]: true
      }
    };
  }
};
