(function () {
  if (!window.console) {
    window.console.log = window.console.error = function () {}
  }
  function Scrollbar (params) {
    /*
      {
      target: idstr / dom
    }
    */
    // 参数校验
    if (!params.target) {
      console.error('target of params is required')
    }
    // 初始化参数
    this.target = typeof params.target === 'string' ? document.getElementById(params.target) : params.target
    this.init()
  }
  Scrollbar.prototype = {
    constructor: Scrollbar,
    init: function () {
      var _this = this
      this.createScrollbar()
      this.setScrollbarP()
      this.setScrollbarH()
      this.bindEvent()
    },
    refresh: function () {
      this.scrollHandle && this.scrollHandle()
    },
    dHeight: function () {
      return this.target.scrollHeight
    },
    sHeight: function (num) {
      if (num) {
        this.target.scrollTop = num
      }
      return num ? num : this.target.scrollTop
    },
    cHeight: function () {
      return this.target.clientHeight
    },
    createScrollbar: function () {
      var bar = document.createElement('div')
      var block = document.createElement('div')
      bar.className = 'scrollbar-bar'
      block.className = 'scrollbar-block'
      bar.appendChild(block)
      this.target.parentNode.style.position = 'relative'
      this.target.parentNode.appendChild(bar)
      // huan cun
      this.scrollbar = block
      this.scrollbarC = bar
    },
    setScrollbarH: function () {
      this.scrollbar.style.height = this.cHeight() / this.dHeight() * this.cHeight() + 'px'
    },
    setScrollbarP: function () {
      this.scrollbar.style.top = this.sHeight() / this.dHeight() * this.cHeight() + 'px'
    },
    on: function (target, evt, callback) {
      if (window.addEventListener) {
        target.addEventListener(evt, callback)
      } else {
        target.attachEvent('on' + evt, callback)
      }
    },
    bindEvent: function () {
      var _this = this
      function isShow() {
        if (_this.cHeight() >= _this.dHeight()) {
          _this.scrollbarC.style.display = 'none'
        } else {
          _this.scrollbarC.style.display = 'block'
        }
      }
      // 滚动时滚动条位置处理
      function scrollHandle () {
        isShow()
        _this.setScrollbarP()
        _this.setScrollbarH()
      }
      this.on(this.target, 'scroll', scrollHandle)

      // 拖动滚动条处理
      var startP, isClicking = false
      function mousemoveHandle (evt) {
        var evt = evt || event
        if (isClicking) {
          evt.preventDefault && evt.preventDefault()
          evt.returnValue = false
        }
        if (isClicking) {
          var scrollT = (evt.clientY - startP) / _this.cHeight() * _this.dHeight() + _this.sHeight()
          _this.sHeight(scrollT)
        }
        startP = evt.clientY
      }
      function mouseenterHandle (evt) {
        var evt = evt || event
        startP = evt.clientY
      }
      function mouseClickHandle (evt) {
        var evt = evt || event
        if (evt.button === 2) {
          return
        }
        if (evt.type === 'mousedown') {
          return isClicking = true
        }
        if (evt.type === 'mouseup') {
          return isClicking = false
        }
      }
      this.on(document, 'mousemove', mousemoveHandle)
      this.on(this.scrollbar, 'mouseenter', mouseenterHandle)
      this.on(this.scrollbar, 'mousedown', mouseClickHandle)
      this.on(document, 'mouseup', mouseClickHandle)
      this.on(window, 'scroll', function() {
        scrollHandle()
      })
      this.on(this.target, 'DOMSubtreeModified', scrollHandle)
      this.scrolHandle = scrollHandle
    }
  }
  window.Scrollbar = Scrollbar
})()
