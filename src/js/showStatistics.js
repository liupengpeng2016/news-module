(function () {
  function ViewCheck (params) {
    /*
      {
      doms: array, // 要检测的dom集合
      canHideByContainer: false, // 是否会被父元素隐藏（因滚动或其他原因超出父元素范围而无法展示，不算展示）
      container: dom, // 父容器， canHideByContainer为true时，必填
      callback: fn, // 展现后回调
      showSpace: int // 发展现时距离底部距离
    }
    */
    this.doms = params.doms || [];
    this.canHideByContainer = params.canHideByContainer
    this.callback = params.callback
    this.showSpace = params.showSpace || 0
    this.container = params.container
    if (this.container && getComputedStyle(this.container).position === 'static') {
      this.container.style.position = 'relative'
    }
    var _this = this
    if (window.addEventListener) {
      window.addEventListener('scroll', function () {
        _this.checkShow()
      })
      if (this.container) {
        this.container.addEventListener('scroll', function () {
          _this.checkShow()
        })
      }
    } else if (window.attachEvent) {
      window.attachEvent('onscroll', function () {
        _this.checkShow()
      })
      if (this.container) {
        this.container.attachEvent('onscroll', function () {
          _this.checkShow()
        })
      }
    }
    // 初始化成功后检测一次
    this.checkShow()
  }
  ViewCheck.prototype = {
    constructor: ViewCheck,
    offset: function (dom) {
      function getOffset (dom) {
        if (!dom) {
          return {
            top:0,
            left:0
          }
        } else {
          return {
            top: dom.offsetTop + getOffset(dom.offsetParent).top,
            left: dom.offsetLeft + getOffset(dom.offsetParent).left
          }
        }
      }
      return getOffset(dom)
    },
    addDom: function (doms) {
      this.doms = this.doms.concat(doms)
    },
    isInView: function (dom) {
      var scrollT1, scrollT2
      var clientHeight1, clientHeight2
      var offsetT1, offsetT2
      var isInView = false
      scrollT2 = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
      clientHeight2 = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
      offsetT2 = this.offset(dom).top
      if (this.canHideByContainer) {
        scrollT1 = dom.offsetParent.scrollTop
        clientHeight1 = dom.offsetParent.clientHeight
        offsetT1 = dom.offsetTop
        // 未在父元素中被遮挡算展现
        if (scrollT1 + clientHeight1 >= offsetT1 + this.showSpace &&
          scrollT2 + clientHeight2 >= offsetT2 -  scrollT1 + this.showSpace) {
           isInView = true
        }
      } else {
        // 滚动超出屏幕底部算展现
        if (scrollT2 + clientHeight2 >= offsetT2 + this.showSpace) {
          isInView = true
        }
      }
      // 隐藏时不算展现
      if (dom.offsetWidth === 0) {
        isInView = false
      }
      return isInView
    },
    checkShow: function () {
      for (var i = 0; i < this.doms.length; i++) {
        if (!this.doms[i].showed && this.isInView(this.doms[i])) {
          this.doms[i].showed = true
          this.callback && this.callback(this.doms[i])
        }
      }
    }
  }
  window.ViewCheck = ViewCheck
})()
