export default class ZoomifyJs {
  /**
   * @param {string|object} options
   */
  constructor(options = {}) {
    // to check if zoomed in or not
    // this.zoomedIn = false;
    this.resolveConfig(options);
    this.handleFocusZoom = e => this.focusZoom.call(this, e);
    this.handleFocusZoomOut = e => this.focusZoomOut.call(this, e);
    this.handleMouseEnter = e => this.mouseEnter.call(this, e);
    this.handleMouseOut = e => this.mouseOut.call(this, e);

    this.init();
  }

  resolveConfig(options) {
    const settings = {
      selector: '.zoomifyJs',
      transitionDuration: 300,
      easing: 'ease-in-out',
      scale: 2,
      clickToZoom: false
    };

    if (typeof options === 'string') {
      settings.selector = options;
    }
    else {
      const userSettings = options;
      for (const attrName in userSettings) {
        settings[attrName] = userSettings[attrName];
      }
    }

    this.config = settings;
    return settings;
  }

  /**
   * @returns {HTMLElement};
   */
  getElement() {
    return this.element || (this.element = document.querySelector(this.config.selector));
  }

  init() {
    const elm = this.getElement();
    elm.style.cursor = 'zoom-in';

    if (this.config.clickToZoom) {
      elm.zoomifyJs = this;
      const btn = document.createElement('button');
      btn.setAttribute('id', 'zoomifyJs-click-to-zoom');
      btn.style.border = 0;
      btn.style.background = 'rgba(0,0,0, 0.5)';
      btn.style.padding = '10px';
      btn.style.paddingLeft = '15px';
      btn.style.paddingRight = '15px';
      btn.style.borderRadius = '20px';
      btn.style.position = 'absolute';
      btn.style.bottom = '15px';
      btn.style.zIndex = 10;
      btn.style.left = 0;
      btn.style.right = 0;
      btn.style.width = 'max-content';
      btn.style.color = 'white';
      btn.style.margin = '0 auto';
      btn.textContent = 'Click to zoom';
      btn.style.pointerEvents = 'none';
      elm.parentElement.style.position = 'relative';

      elm.parentElement.appendChild(btn);

      elm.addEventListener('click', e => {
        const currentZoomedIn = this.zoomedIn;
        this.zoomedIn = !this.zoomedIn;
        this.setZoomEvents(currentZoomedIn);

        // to fix image change before zoom
        this.mouseEnter(e);

        btn.style.display = currentZoomedIn ? 'block' : 'none';
      });

      return;
    }

    this.setZoomEvents();
  }

  zoomIn() {
    const elm = this.getElement();
    // default style first to avoid jerk on first click on mobile
    elm.style.transition = `scale ${this.config.transitionDuration}ms ${this.config.easing}`;
    this.focusZoom({ target: elm }, true);
  }

  zoomOut() {
    const elm = this.getElement();
    this.focusZoomOut({ target: elm });
  }

  enableZoom(value) {
    this.zoom = value;
    return value ? this.zoomIn() : this.zoomOut();
  }

  setZoomEvents(detach = false) {
    const elm = this.getElement();

    elm.zoomifyJs = this;
    if (elm.attributes.zoomify && elm.attributes.zoomify.value !== '') {
      // To Preload image
      const zoomImg = new Image();
      zoomImg.src = elm.attributes.zoomify.value;
    }
    ['touchstart'].forEach(name => {
      if (detach) {
        elm.removeEventListener(name, () => this.enableZoom(!this.zoom));
      }
      else {
        elm.addEventListener(name, () => this.enableZoom(true), { passive: true });
      }
    })
    ;['mouseenter'].forEach(name => {
      if (detach) {
        elm.removeEventListener(name, this.handleMouseEnter);
      }
      else {
        elm.addEventListener(name, this.handleMouseEnter, { passive: true });
      }
    })
    ;['mouseout'].forEach(name => {
      if (detach) {
        elm.removeEventListener(name, this.handleMouseOut);
      }
      else {
        elm.addEventListener(name, this.handleMouseOut, { passive: true });
      }
    })
    ;['mousemove', 'touchmove'].forEach(name => {
      if (detach) {
        elm.removeEventListener(name, this.handleFocusZoom);
      }
      else {
        elm.addEventListener(name, this.handleFocusZoom, { passive: true });
      }
    })
    ;['mouseleave'].forEach(name => {
      if (detach) {
        elm.removeEventListener(name, this.handleFocusZoomOut);
      }
      else {
        elm.addEventListener(name, this.handleFocusZoomOut, {
          passive: true,
        });
      }
    });
    if (detach) {
      this.focusZoomOut({ target: elm });
      elm.removeEventListener('contextmenu', this.preventContextMenu);
      if (
        elm.tagName === 'IMG' &&
            elm.parentElement.tagName === 'PICTURE'
      ) {
        setTimeout(() => {
          elm.parentElement.style.removeProperty('display');
          elm.parentElement.style.removeProperty('overflow');
          elm.parentElement.style.removeProperty('max-height');
          elm.parentElement.style.removeProperty('max-width');
          elm.style.removeProperty('transition');
          elm.removeAttribute('data-src');
        }, this.config.transitionDuration);
      }
    }
    else {
      elm.addEventListener('contextmenu', this.preventContextMenu);
      elm.style.transition = `scale ${this.config.transitionDuration}ms ${this.config.easing}`;
      if (
        elm.tagName === 'IMG' &&
            elm.parentElement.tagName === 'PICTURE'
      ) {
        const imgRect = elm.getBoundingClientRect();
        elm.parentElement.style.display = 'block';
        elm.parentElement.style.overflow = 'hidden';
        elm.parentElement.style.maxHeight = `${imgRect.height}px`;
        elm.parentElement.style.maxWidth = `${imgRect.width}px`;
      }
      elm.zoomifyJs = this;
    }
  }

  preventContextMenu(e) {
    e.preventDefault();
  }

  static inBoundaries(bounds, x, y) {
    const l = bounds.left + window.scrollX;
    const t = bounds.top + window.scrollY;
    const h = bounds.height;
    const w = bounds.width;
    const maxX = l + w;
    const maxY = t + h;
    return (y <= maxY && y >= t) && (x <= maxX && x >= l);
  }

  focusZoom(e, force = false) {
    const img = e.target;
    const imgRect = img.getBoundingClientRect();
    let pageX = e.pageX;
    let pageY = e.pageY;
    if (e.constructor.name === 'TouchEvent') {
      pageX = e.changedTouches[0].pageX;
      pageY = e.changedTouches[0].pageY;
    }

    // prevent image move when cursor is out of bound
    if (!force && !ZoomifyJs.inBoundaries(imgRect, pageX, pageY)) { return; }
    const offsetX = ((pageX - (imgRect.left + window.scrollX)) / imgRect.width) * 100;
    const offsetY = ((pageY - (imgRect.top + window.scrollY)) / imgRect.height) * 100;
    img.style.scale = this.config.scale;
    img.style.transformOrigin = `${offsetX}% ${offsetY}%`;
    this.zoomedIn = true;
  }

  focusZoomOut(e) {
    const img = e.target;
    img.style.removeProperty('scale');
    setTimeout(() => {
      img.style.removeProperty('transform-origin');
    }, this.config.transitionDuration);
    this.zoomedIn = false;
  }

  mouseEnter(e) {
    const elm = e.target;
    if (elm.attributes.zoomify && elm.attributes.zoomify.value !== '') {
      elm.setAttribute('data-src', elm.attributes.src.value);
      elm.attributes.src.value = elm.attributes.zoomify.value;
    }
  }

  mouseOut(e) {
    const elm = e.target;
    setTimeout(() => {
      if (elm.attributes.zoomify && elm.attributes.zoomify.value !== '') {
        elm.attributes.src.value = elm.attributes['data-src'].value;
      }
    }, this.config.transitionDuration);
  }

  destroy() {
    this.zoomOut();
    this.setZoomEvents(true);

    if (this.config.clickToZoom) {
      this.getElement().parentElement.querySelector('#zoomifyJs-click-to-zoom').remove();
    }

    delete this.getElement().zoomifyJs;
  }
}
