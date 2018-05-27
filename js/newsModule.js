'use strict';
if (typeof console === 'undefined') {
  window.console = {
    log: function () {},
    error: function () {}
  }
}
// dom operate methods
var $l = function (str, gather) {
  return new DomOperate(str, gather)
}
function DomOperate (str, gather) {
  var doms = this.init(str, gather)
  for (var i = 0; i < doms.length; i++) {
    this[i] = doms[i]
  }
  this.length = doms.length
}
DomOperate.prototype = {
  constructor: DomOperate,
  init: function (str, gather) {
    var strType = this.strType(str)
    if (strType === 'id') {
      var dom = document.getElementById(str.slice(1))
      return dom ? [dom] : []
    } else if (strType === 'tag') {
      return (gather || document).getElementsByTagName(str)
    } else if (strType === 'class') {
      var tags = (gather || document).getElementsByTagName('*')
      var classDom = []
      var classExp = new RegExp('(\\s+|^)' + str.slice(1) + '(\\s+|$)')
      for (var i = 0; i < tags.length; i++) {
        if (classExp.test(tags[i].className)) {
          classDom.push(tags[i])
        }
      }
      return classDom
    } else if (strType === 'dom') {
      return [str]
    } else if (strType === 'domArray') {
      return str
    } else {
      return []
    }
  },
  strType: function (str) {
    var idExp = /^#.+/
    var classExp = /^\..+/
    var tagExp = /^[^.#]/
    if (typeof str === 'object') {
      if (str instanceof Array) {
        return 'domArray'
      } else if (str.ownerDocument === document) {
        return 'dom'
      }
    } else if (typeof str === 'string') {
      if (idExp.test(str)) {
        return 'id'
      } else if (classExp.test(str)){
        return 'class'
      } else if (tagExp.test(str)) {
        return 'tagName'
      }
    } else {
      return null
    }
  },
  addClass: function (newClass) {
    for (var i = 0; i < this.length; i++) {
      if($l(this[i]).hasClass(newClass)) return
      this[i].className += ' ' + newClass
    }
    return this
  },
  removeClass: function (oldClass) {
    var reg = new RegExp('\\s*' + oldClass)
    for (var i = 0; i < this.length; i++) {
      this[i].className = this[i].className.replace(reg, '')
    }
    return this
  },
  hasClass: function (str) {
    var reg = new RegExp('(\\s+|^)+' + str + '(\\s+|$)')
    return this[0].className.search(reg) != -1 ? true : false
  },
  hasAttr: function (str) {
    return this[0].getAttribute(str) !== null
  },
  attr: function () {
    if (!this[0]) return
    if (arguments.length == 1) {
      return this[0].getAttribute(arguments[0])
    } else {
      this[0].setAttribute(arguments[0], arguments[1])
      return this
    }
  },
  child: function (str) {
    var childList = this[0].childNodes || []
    var children = []
    for (var i = 0; i < childList.length; i++) {
      if (!str) {
        if (childList[i].tagName) {
          children.push(childList[i])
        }
      } else {
        if (childList[i].id == str.slice(1) || childList[i].className == str.slice(1) || childList[i].nodeName.toLowerCase() == str) {
          children.push(childList[i])
        }
      }
    }
    return $l(children)
  },
  eq: function (index) {
    return $l(this[index])
  },
  trigger: function (eventType) {
    var evt
    try {
      evt = new Event(eventType, {
        bubbles: true
      })
    } catch (err) {
      if (document.createEvent) {
        evt = document.createEvent('Event')
        evt.initEvent(eventType, true, false)
      }
    }
    for(var i = 0; i < this.length; i++) {
      if (this[i].dispatchEvent) {
        this[i].dispatchEvent(evt)
      } else {
        this[i].fireEvent('on' + eventType)
      }
    }
  },
  index: function (index) {
    var children = $l(this[0].parentNode).child()
    if (parseInt(index)) {
      return $l(children[index])
    }
    for (var i = 0; i < children.length; i++) {
      if (this[0] === children[i]) {
        return i
      }
    }
  },
  on: function (eventType, sStr, callback) {
    var _this = this
    if (arguments.length == 2) {
      callback = arguments[1]
      sStr = ''
    }
    function findThis (target, str) {
      var result
      if (target === document.body) {
        return null
      }
      if (!str) {
        result = target
      }
      var type = _this.strType(str)
      if (type === 'class') {
        var exp = new RegExp('(\\s+|^)' + str.slice(1) + '(\\s+|$)')
        if (exp.test(target.className)) {
          result = target
        }
      } else if (type === 'id') {
        var exp = new RegExp('(\\s+|^)' + str.slice(1) + '(\\s+|$)')
        if (exp.test(target.id)) {
          result = target
        }
      } else if (type === 'tagName') {
        var exp = new RegExp('(\\s+|^)' + str + '(\\s+|$)', 'i')
        if (exp.test(target.tagName)) {
          result = target
        }
      }
      return result === undefined ? findThis(target.parentNode, str) : result
    }
    var eventHandler = function (evt) {
      var evt = evt || event
      var target = evt.target || evt.srcElement
      var _this = findThis(target, sStr)
      _this && callback.call(_this, evt)
    }
    for (var i = 0; i < _this.length; i++) {
      if (window.addEventListener) {
        _this[i].addEventListener(eventType, eventHandler)
      } else if (window.attachEvent) {
        _this[i].attachEvent('on' + eventType, eventHandler)
      }
    }
    return _this
  },
  offset: function () {
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
    return getOffset(this[0])
  },
  isInView: function (hasHeight, showSpace) {
    var scrollT
    var clientHeight
    var offsetT
    if (hasHeight) {
      scrollT = this[0].offsetParent.scrollTop
      clientHeight = this[0].offsetParent.clientHeight
      offsetT = this[0].offsetTop
    } else {
      scrollT = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
      clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
      offsetT = this.offset().top
    }
    if (scrollT + clientHeight >= offsetT + showSpace) {
      return true
    } else {
      return false
    }
  },
  find: function (str) {
    return new DomOperate(str, this[0])
  }
}
// class methods
var $lMethods = {
  ajax: function (obj) {
    var xml, paramsStr = ''
    function formatParams (params, pre) {
      var str = '', pre = pre || ''
      var a = pre ? true : false
      for (var i in params) {
        if (params.hasOwnProperty(i)) {
          if (typeof params[i] === 'object') {
            str += formatParams(params[i], pre + (a ? '[' : '') + i + (a ? ']' : ''))
          } else {
            str += pre + (a ? '[' : '') + i + (a ? ']' : '') + '=' + encodeURIComponent(params[i]) + '&'
          }
        }
      }
      return str
    }
    paramsStr = formatParams(obj.params).slice(0, -1)
    if (obj.method === 'jsonp') {
      var script = document.createElement('script')
      script.onerror = script.onabort = function () {
        obj.error && obj.error()
      }
      var jsonp = obj.jsonp || 'callback'
      var jsonpCallback = obj.jsonpCallback || 'n' + Math.random().toString(26).slice(2)
      window[jsonpCallback] = function (res) {
        obj.success(res)
      }
      var jsonpStr = (paramsStr ? "&" : '') + jsonp + '=' + jsonpCallback
      script.src = obj.url + '?' + paramsStr + jsonpStr
      document.getElementsByTagName('head')[0].appendChild(script)
    } else {
      if (window.XMLHttpRequest) {
        xml = new XMLHttpRequest()
      } else {
        xml = new ActiveXObject('Microsoft.XMLHTTP')
      }
      if (obj.method === 'get') {
        xml.open("get", obj.url + '?' + paramsStr, true)
      } else if(obj.method === 'post') {
        xml.open("post", obj.url, true)
      }
      xml.setRequestHeader("Content-type","application/x-www-form-urlencoded");
      xml.onreadystatechange = function () {
        if (xml.readyState == 4) {
          if (xml.status == 200 || xml.status == 304) {
            obj.success && obj.success(xml.responseText)
          } else {
            obj.error && obj.error()
          }
        }
      xml.send(obj.method === 'post' ? paramsStr : '')
      }
    }
  },
  iev: function () {
    var info = navigator.userAgent
    var reg = /msie \d+/i
    var result = reg.exec(info)
    return !result ? undefined : parseInt(result[0].split(' ')[1])
  },
  cookie: function () {
    var key = arguments[0]
    var value = arguments[1]
    var day = arguments[2]
    if (arguments.length > 1) {
      var time = new Date()
      var year = time.getFullYear()
      var date = time.getDate()
      if (day === 'forever') {
        time.setFullYear(year + 100)
      } else {
        time.setDate(date + day)
      }
      document.cookie = key + '=' + value + (day ? ';expires=' + time.toGMTString() : '')
    } else {
      var reg = new RegExp(key + '=' + '[^;=]*')
      return document.cookie.match(reg) && document.cookie.match(reg)[0].split('=')[1]
    }
  },
  open: function (url) {
    var id = 'n256' + Math.random().toString(26).slice(2)
    var a = document.createElement('a')
    a.href = url
    a.id = id
    a.target = '_blank'
    a.style.display = 'none'
    document.body.appendChild(a)
    setTimeout(function () {
      document.getElementById(id).click()
    }, 0)
  },
  parseTime: function (time) {
    function format(num) {
      return num >= 10 ? num : '0' + num
    }
    var time = new Date(time)
    var year = time.getFullYear()
    var month = time.getMonth() + 1
    var date = time.getDate()
    var hours = time.getHours()
    var minus = time.getMinutes()
    var seconds = time.getSeconds()
    return format(month) + '月' + format(date) + '日 ' + format(hours) + ':' + format(minus)
  }
}
for (var i in $lMethods) {
  if ($lMethods.hasOwnProperty(i)) {
    $l[i] = $lMethods[i]
  }
}
// NewsModule class
function NewsModule (params) {
  // default params handle
  this.containerId = params.containerId
  this.adsenseid = params.adsenseid
  this.newsAdsenseid = params.newsAdsenseid
  this.statisticsInterval = params.statisticsInterval || 1000
  this.tabData = params.tabData || [['头条', 'toutiao']]
  this.newsNumPer = params.newsNumPer || 18
  this.newsNumFirst = params.newsNumFirst || 18
  this.newsRadio = params.newsRadio || 3
  this.showAd = params.showAd === false ? false : true
  this.newsOrigin = params.newsOrigin || 'dongfang'
  this.instance = params.instance || 0
  this.adConfig = params.adConfig || {"baidu": 0.3, "360": 0.7}
  this.replace360Ad = params.replace360Ad === false ? false : true
  this.loadPage = params.loadPage || 5
  this.reloadInterval = params.reloadInterval || 3000
  this.reloadTimes = params.reloadTimes || 5
  this.maxPage = params.maxPage || 10
  this.isShowTab = params.isShowTab === false ? false : true
  this.baiduAdUrl = params.baiduAdUrl || 'ads/baiduAd.html'
  this.topInstance = params.topInstance || 0
  // second add
  this.showSpace = params.showSpace || 0
  this.changeTabWay = params.changeTabWay || 1
  this.actionAtBottom = params.actionAtBottom || 'load'
  this.containerHeight = params.containerHeight || 0
  this.newsMode = params.newsMode || 3
  this.adMode = params.adMode || 2
  this.forceStretchNewsImg = params.forceStretchNewsImg === true ? true : false
  this.forceStretchAdImg = params.forceStretchAdImg === true ? true : false
  this._360ccp = params._360ccp || 'top'
  this.isShow360cc = params.isShow360cc && true
  this.baiduAdId = params.baiduAdId || 'u3433620'
  this.dongfangNewsId = params.dongfangNewsId || '02151'
  this._360ccId = params._360ccId || "OBHnX7"
  this._360adId = params._360adId || 'mCzFYt'
  this.scrollInterval = params.scrollInterval || 500
  this.scrollTimes = params.scrollTimes || 0
  this.scrollType = params.scrollType || 'times'
  // computed params
  this.newsBuffer = {nurl: [], nindex: []}
  this.target = $l('#' + this.containerId)[0]
  this.adNumPer = parseInt((this.newsNumPer - 1) / this.newsRadio + 1)
  this.adNumFirst = parseInt((this.newsNumFirst - 1) / this.newsRadio + 1)
  this.state = {
    activeIndex: 0,
    pagesList: [],
    adsenseidList:[]
  }
  // params validate
  if (!params.adsenseid) {
    console.error('adsenseid is required')
  }
  if (!params.newsAdsenseid) {
    console.error('newsAdsenseid is required')
  }
  if (!this.containerId) {
    console.error('containerId is required')
  }
  if (!params.baiduAdId) {
    console.error('baiduAdId is required')
  }
  if (!params.dongfangNewsId) {
    console.error('dongfangNewsId is required')
  }
  if (!params._360ccId) {
    console.error('_360ccId is required')
  }
  if (!params._360adId) {
    console.error('_360adId is required')
  }
  // 初始化dom结构
  if (this.containerHeight) {
    $l(this.target).addClass('n256-tab-title-fixed')
  }
  if (this._360ccp === 'top' && this.isShow360cc) {
    this.create360cc()
  }
  this.createTab()
  this.createNewsContainer()
  // dom缓存
  this.newsContainer = $l(this.target).find('.n256-tab-item-container')[0]
  if (this._360ccp === 'bottom' && this.isShow360cc) {
    this.create360cc()
  }
  if (this.actionAtBottom === 'load') {
    this.createLoadNotice()
    this.createNoNewsNotice()
  }
  // 事件绑定
  this.bindEvent()
  this.bindStatisticsEvent()
  // 初始化接口数据
  if (this.containerHeight) {
    this.newsContainer.style.height = this.containerHeight + 'px'
    this.newsContainer.style.overflow = 'scroll'
    this.newsContainer.style.overflowX= 'hidden'
  }
  var eventType
  if (this.changeTabWay === 1) {
    eventType = 'mouseover'
  } else if (this.changeTabWay === 2) {
    eventType = 'click'
  }
  $l(this.target).find('.n256-news-tab').child().eq(0).trigger(eventType)
}
NewsModule.prototype = {
  constructor: NewsModule,
  createLoadNotice: function () {
    var div = document.createElement('div')
    var p = document.createElement('p')
    div.className = 'n256-news-loadnotice'
    // div.id = 'n256-news-loadnotice'
    div.innerHTML = '加载中...'
    p.className = 'n256-load-more-btn hide btn'
    // p.id = 'n256-load-more-btn'
    p.innerHTML = '点击加载更多'
    this.newsContainer.appendChild(div)
    this.newsContainer.appendChild(p)
  },
  create360cc: function () {
    var div = document.createElement('div')
    var id = 'n256' + Math.random().toString(26).slice(0, 10)
    var ccid = this._360ccId
    div.id = id
    this.target.appendChild(div)
    setTimeout(function () {
      var obj = {"w":280,"showid": ccid,"rshowid": ccid,"inject":"inlay","layout":"magicCubeScene","style":"magicCube","row":"2","line":"2"}
      obj.placeholderId = id
      typeof BANNER_SLIDER != 'undefined' && BANNER_SLIDER(obj);
    }, 0)
  },
  createNoNewsNotice: function () {
    var div = document.createElement('div')
    div.className = 'n256-nonews-notice hide'
    // div.id = 'n256-nonews-notice'
    div.innerHTML = '<a href="javascript:;"  class="btn">暂无内容，点击重新加载</a>'
    this.newsContainer.appendChild(div)
  },
  newsTopTemplate: function (itemData, i) {
    var img = itemData.miniimg[0].src
    var title = itemData.topic
    var url = itemData.url
    var content = '<a class="n256-news-top-list-item news-item" target=_blank href=' + url + ' data-url=' + url + ' data-num=' + (i + 1) + '>' +
      '<div class="img">' +
        '<img src="' + img + '" alt=""/>' +
      '</div>' +
      '<p class="title">' +
        '<span>' + title + '</span>' +
      '</p>' +
      '</a>'
    return content
  },
  singleImgNewsTemplate: function (item, i) {
    var news = '<a class="n256-news-item-singleImg news-item"  target="_blank" href=' + item.url + ' data-url=' + item.url + '>' +
      '<div class="n256-news-img">' +
        '<img src="' + item.miniimg[0].src + '" alt="" style="height:' + (this.forceStretchNewsImg ? '100%' : 'auto') + '">' +
      '</div>' +
      '<div class="n256-news-content">' +
        '<div class="content">' +
        '<span class="title">' + item.topic + '</span>' +
        '<p class="n256-news-info"><span class="type">' + item.tpch + '</span><span>' + item.source + '</span><span>' + $l.parseTime(parseInt(item.date) * 1e3) + '</span></p>' +
        '</div>' +
      '</div>' +
    '</a>'
    return news
  },
  multiImgNewsTemplate: function (item) {
    var news = '<a class="n256-news-item-multiImg news-item"  target=_blank href=' + item.url + ' data-url=' + item.url + '>' +
      '<span class="title">' + item.topic + '</span>' +
      '<ul>' +
        '<li><img src="' + item.miniimg[0].src + '" alt="" style="height:' + (this.forceStretchNewsImg ? '100%' : 'auto') + '"></li>' +
        '<li><img src="' + item.miniimg[1].src + '" alt="" style="height:' + (this.forceStretchNewsImg ? '100%' : 'auto') + '"></li>' +
        '<li><img src="' + item.miniimg[2].src + '" alt="" style="height:' + (this.forceStretchNewsImg ? '100%' : 'auto') + '"></li>' +
      '</ul>' +
      '<p class="n256-news-info"><span class="type">' + item.tpch + '</span><span>' + item.source + '</span><span>' + $l.parseTime(parseInt(item.date) * 1e3) + '</span></p>' +
      '</a>'
    return news
  },
  baiduAdContainer: function (num) {
    var ad = '<div class="ad-baidu" data-num="' + num + '" style="position:relative;"></div>'
    return ad
  },
  _360AdContainer: function (num) {
    var ad = '<div class="ad-360" data-num="' + num + '" style="position:relative;"></div>'
    return ad
  },
  _360AdTemplate: function (adItem, num) {
    if (!adItem) {
      return ''
    }
    var ad
    var adType = adItem.type
    var clktk = adItem.clktk.join()
    var imptk = adItem.imptk.join()

    if (adType == 1 || adType == 4 || this.adMode == 1) {
      ad = '<a class="n256-news-item-singleImg"  target=_blank href=' + adItem.curl + ' data-url=' + adItem.curl + ' data-clktk=' + clktk + ' data-imptk=' + imptk + '>' +
        '<div class="n256-news-img">' +
          '<img src="' + (adItem.img || adItem.assets[0].img) + '" alt="" style="height:' + (this.forceStretchAdImg ? '100%' : 'auto') + '">' +
        '</div>' +
        '<div class="n256-news-content">' +
          '<div class="content">' +
          '<span class="title">' + adItem.title + '</span>' +
          '<p class="n256-news-info"><span class="type">广告</span><span>' + adItem.src + '</span></p>' +
          '</div>' +
        '</div>' +
      '</a>'
    } else if (adType == 2) {
      ad = '<a class="n256-news-item-multiImg"  target=_blank href=' + adItem.curl + ' data-url=' + adItem.curl + ' data-clktk=' + clktk + ' data-imptk=' + imptk + '>' +
        '<span class="title">' + (adItem.topic || adItem.title || adItem.desc) + '</span>' +
        '<ul>' +
          '<li><img src="' + adItem.assets[0].img + '" alt=""></li>' +
          '<li><img src="' + adItem.assets[1].img + '" alt=""></li>' +
          '<li><img src="' + adItem.assets[2].img + '" alt=""></li>' +
        '</ul>' +
        '<p class="n256-news-info"><span class="type">广告</span><span>' + adItem.src + '</span></p>' +
        '</a>'
    } else if (adType == 3) {
      ad = '<a class="n256-news-item-bigImg"  target=_blank href=' + adItem.curl + ' data-url=' + adItem.curl + ' data-clktk=' + clktk + ' data-imptk=' + imptk + '>' +
        '<span class="title">' + (adItem.topic || adItem.title || adItem.desc) + '</span>' +
        '<div class="big-img">' +
          '<img src="' + adItem.img + '" alt=""/>' +
        '</div>' +
        '<p class="n256-news-info"><span class="type">广告</span><span>' + adItem.src + '</span></p>' +
        '</a>'
    }
    return ad
  },
  baiduAdTemplate: function (num) {
    var iframeId ='n256' + Math.random().toString(16).slice(2)
    this.adStatistics(1, null, null, num, 1002)
    return '<iframe frameborder="0" width="100%" id="' + iframeId + '" scrolling="no" src="' + this.baiduAdUrl + '?id=' + this.baiduAdId + '#' + iframeId + '"/>'
  },
  get360Ad: (function () {
    var uid = Math.random().toString(26).slice(2)
    var reqtimes = 1
    return function (impct, num, callback) {
      var _this = this
      window.isNewsLoading = true
      this.adStatistics(1, null, null, num, 1001)
      $l.ajax({
        method: 'jsonp',
        params: {
          of: 4,
          newf: 1,
          type: 1,
          showid: _this._360adId,
          uid: uid,
          reqtimes: reqtimes,
          impct: impct
        },
        jsonp: 'jsonp',
        jsonpCallback: 'n360ad',
        url: 'http://show.g.mediav.com/s',
        success: function (res) {
          _this.adStatistics(2, null, null, num, 1001)
          window.isNewsLoading = false
          callback && callback(res.ads)
          reqtimes++
        },
        error: function () {
          window.isNewsLoading = false
          callback && callback([])
        }
      })
    }
  })(),
  getDongfangNews: (function () {
    function getUid () {
      var uid = $l.cookie('n256NewsUid');
      if (!uid) {
        uid = Math.random().toString(26).slice(2) + Math.random().toString(26).slice(2)
        $l.cookie('n256NewsUid', uid, 'forever')
      }
      return uid
    }
    // api stauts handle
    var startkey = '' // 上次请求数据中取
    var newkey = '' // 上次请求数据中取
    var idx =  0 // 已加载信息条数
    var uid = getUid()
    // var qid = '02151' // 渠道信息
    var isFirst = true
    return function (callback, error, isReset) {
      if (isReset) {
        startkey = ''
        newkey = ''
        idx =  0
      }
      var _this = this
      function getPosition (next) {
        var position = $l.cookie('n256Position') || ''
        if ($l.iev() <= 8) position = ' '
        if (position) {
          next && next(position)
        } else {
          $l.ajax({
            method: 'jsonp',
            url: 'http://guess.union2.50bang.org/adsapi/ci',
            success: function (res) {
              var position = res.c
              next && next(position)
              $l.cookie('n256Position', res.c)
            },
            error: function () {
              next && next(position)
            },
            jsonp: 'jsonp',
            jsonpCallback: 'n256position'
          })
        }
      }
      function getNews (position) {
        _this.newsStatistics(1)
        window.isNewsLoading = true
        var page = _this.state.pagesList[_this.state.activeIndex] + 1
        var newsnum = isFirst ? _this.newsNumFirst : _this.newsNumPer
        isFirst = false
        $l.ajax({
          method: 'jsonp',
          url: 'http://2345jsllq.dftoutiao.com/newsapi_pc/newsjp02',
          params: {
            type: _this.tabData[_this.state.activeIndex][1],
            startkey: startkey,
            newkey: newkey,
            pgnum: page,
            uid: uid,
            idx: idx,
            qid: _this.dongfangNewsId,
            position: position,
            newsnum: newsnum
          },
          success: function (res) {
            // api stauts handle
            _this.state.pagesList[_this.state.activeIndex]++
            startkey = res.endkey
            newkey = res.newkey
            idx += res.data.length
            // other mession
            _this.newsStatistics(2)
            window.isNewsLoading = false
            callback && callback(res.data)
            // // 重置新闻排行距离底部距离
          },
          error: function () {
            window.isNewsLoading = false
            error && error()
          }
        })
      }
      getPosition(getNews)
    }
  })(),
  getNewsTop: function (callback, error) {
    var _this = this
    _this.newsStatistics(1)
    $l.ajax({
      url: 'http://newswifiapi.dftoutiao.com/newstop/change',
      method: 'jsonp',
      success: function (res) {
        callback && callback(res.data)
        _this.newsStatistics(2)
      },
      error: function () {
        error && error()
      },
      params: {
        qid: _this.dongfangNewsId,
        ispc: 1,
        newsnum: 20,
        pgnum: 1
      },
      jsonp: 'jsonpcallback'
    })
  },
  getNews: (function () {
    var times = 0
    return function (isReset) {
      var _this = this
      this.getDongfangNews(function (res) {
        if (!res && !res.length) {
          times++
          if (times >= _this.reloadTimes) {
            times = 0
            return _this.showNonewsNotice(true)
          }
          setTimeout(function () {
            _this.getNews()
          }, _this.reloadInterval)
        } else {
          times = 0
          _this.fillNews(res)
          _this.showNonewsNotice(false)
        }
      }, function () {
        times++
        if (times >= _this.reloadTimes) {
          times = 0
          return _this.showNonewsNotice(true)
        }
        setTimeout(function () {
          _this.getNews()
        }, _this.reloadInterval)
      }, isReset)
    }
  })(),
  createTab: function () {
    var tabContent = ''
    for (var i = 0; i < this.tabData.length; i++) {
      var sep = '|', imgUrl = this.tabData[i][2]
      if (i === this.tabData.length - 1) {
        sep = ''
      }
      tabContent += '<span data-type="' + this.tabData[i][1] +
      '" data-index="' + i + '">' +
      (imgUrl ? '<img class=tab-icon src="' + imgUrl + '" />' : '') +
      this.tabData[i][0] + '</span>' +  sep
      this.state.pagesList.push(0)
      this.state.adsenseidList.push(this.adsenseid)
    }
    var div = document.createElement('div')
    // div.id = 'n256-news-tab'
    div.className = 'n256-news-tab' + (this.isShowTab ? '' : ' hide')
    div.innerHTML = tabContent
    this.target.appendChild(div)
  },
  createNewsContainer: function () {
    var newsItemContainer = document.createElement('div')
    newsItemContainer.className = 'n256-tab-item-container'
    this.target.appendChild(newsItemContainer)
    for(var i = 0; i < this.tabData.length; i++) {
      var div = document.createElement('div')
      div.id = 'n256-tab-item-' + this.tabData[i][1]
      div.className = 'n256-tab-item'
      newsItemContainer.appendChild(div)
    }
  },
  fillNews: function (newsData, isClear) {
    var newsModule = this
    var adNum360 = 0
    var content = '', type
    var newsContainer = $l('.n256-tab-item')[this.state.activeIndex]
    var _this = this
    for (var i = 0; i < newsData.length; i++) {
      // 选取广告类型
      var ad = ''
      if ((i === 0 || i % this.newsRadio === 0) && this.showAd) {
        var result = Math.random()
        var percent = 0
        for (var k in this.adConfig) {
          if (this.adConfig.hasOwnProperty(k)) {
            if (result < percent + this.adConfig[k] && result >= percent) {
              type = k
              break
            }
            percent += this.adConfig[k]
          }
        }
        switch (type) {
          case 'baidu': ad = this.baiduAdContainer(this.state.adsenseidList[this.state.activeIndex]); break
          case '360': ad = this._360AdContainer(this.state.adsenseidList[this.state.activeIndex]); adNum360++;break
        }
        this.state.adsenseidList[this.state.activeIndex]++
      }
      // 选取新闻类型
      var news
      if (this.newsMode === 1) {
        type = 'single'
      } else if (this.newsMode === 2) {
        if (newsData[i].miniimg.length >= 3) {
          type = 'multi'
        } else {
          type = 'single'
        }
      } else if (this.newsMode === 3) {
        if (newsData[i].miniimg.length >= 3) {
          type = Math.random() >= 0.5 ? 'single' : 'multi'
        } else {
          type = 'single'
        }
      }
      news = type == 'multi' ? this.multiImgNewsTemplate(newsData[i]) : this.singleImgNewsTemplate(newsData[i])
      // pinjie
      content += news
      content += ad
    }
    if (isClear) {
      newsContainer.innerHTML = ''
    }
    var div = document.createElement('div')
    $l(div).attr('data-page', this.state.pagesList[this.state.activeIndex])
    div.innerHTML = content
    newsContainer.appendChild(div)
    // 填充百度广告
    var adBaidu = $l(div).find('.ad-baidu')
    for (var i = 0; i < adBaidu.length; i++) {
      var num = $l(adBaidu[i]).attr('data-num')
      adBaidu[i].innerHTML = this.baiduAdTemplate([num])
    }
    if (!newsModule.adConfig[360]) {
      setTimeout(function () {
        newsModule.checkShow(null, true)
      }, 600)
    }
    // 填充360广告
    var _this = this
    if (!adNum360) return
    var ad360 = $l(div).find('.ad-360')
    var _360Num = []
    for (var i = 0; i < ad360.length; i++) {
      _360Num.push($l(ad360[i]).attr('data-num'))
    }
    //console.log('get 360 ad')
    this.get360Ad(adNum360, _360Num, function (ads) {
      if (!ads) {
        ads = []
      }
      // console.log('request 360num=' +adNum360 + ' 360广告位=' + ad360.length + ' 返回数量=' + ads.length)
      var fillNum = Math.min(ad360.length, ads.length)
      for (var i = 0; i < fillNum; i++) {
        ad360[i].innerHTML = _this._360AdTemplate(ads[i])
      }
      // 未显示部分展示为百度ad
      if (!_this.replace360Ad) return
      for (var i = ads.length; i < ad360.length; i++) {
        var num = $l(ad360[i]).attr('data-num')
        $l(ad360[i]).removeClass('ad-360').addClass('ad-baidu')
        ad360[i].innerHTML = _this.baiduAdTemplate([num])
      }
      // 更新后检测展现部分
      setTimeout(function () {
        newsModule.checkShow(null, true)
      }, 600)
    })
  },
  showNonewsNotice: function (isShow) {
    var loadNotice = $l('.n256-news-loadnotice')
    var loadMore = $l('.n256-load-more-btn')
    var noNewsNotice = $l('.n256-load-more-btn')
    if (isShow) {
      loadNotice.addClass('hide')
      loadMore.addClass('hide')
      noNewsNotice.removeClass('hide')
    } else {
      loadNotice.removeClass('hide')
      loadMore.addClass('hide')
      noNewsNotice.addClass('hide')
    }
  },
  showBottomNotice: function (isShow) {
    var loadNotice = $l('.n256-news-loadnotice')
    var text = isShow ? '已经到底了，休息一会吧~' : '加载中...'
    loadNotice[0].innerHTML = text
  },
  _360Statistics: function (urlList) {
    function send (url) {
      var newImg = new Image()
      newImg.onload = newImg.onerror = newImg.onabort = function () {
        newImg.onload = newImg.onerror = newImg.onabort = null
      }
      newImg.src = url
    }
    for (var i = 0; i < urlList.length; i++) {
      send(urlList[i])
    }
  },
  newsStatistics: function (type, nurl, nindex) {
   $l.ajax({
     method: 'jsonp',
     url: '//guess.union2.50bang.org/trrs',
     params: {
       adsenseid: this.newsAdsenseid,
       user: {
         uid: ''
       },
       site: {
         url: location.href,
         referer: document.referrer
       },
       app: {},
       device: {
         userAgent: navigator.userAgent,
         idfa: '',
         imei: '',
         deviceType: 0,
         brand: '',
         model: '',
         os: '',
         osv: '',
         network: ''
       },
       data: {
         type: 7,
         action: 'news',
         acode: type,
         atime: parseInt(new Date().getTime() / 1000),
         url: location.href,
         rurl: document.referrer,
         tab: this.tabData[this.state.activeIndex][1],
         nid: '',
         nurl: nurl || '',
         nindex: nindex || '',
         hindex: '',
         channelid: 1003
       }
     }
   })
  },
  adStatistics: function (type, aurl, aindex, adsenseid, channelid) {
    $l.ajax({
      method: 'jsonp',
      url: '//guess.union2.50bang.org/trrs',
      params: {
        adsenseid: this.newsAdsenseid,
        user: {
          uid: ''
        },
        site: {
          url: location.href,
          referer: document.referrer
        },
        app: {},
        device: {
          userAgent: navigator.userAgent,
          idfa: '',
          imei: '',
          deviceType: 0,
          brand: '',
          model: '',
          os: '',
          osv: '',
          network: ''
        },
        data: {
          type: 7,
          action: 'ad',
          acode: type,
          atime: parseInt(new Date().getTime() / 1000),
          url: location.href || '',
          rurl: document.referrer || '',
          tab: this.tabData[this.state.activeIndex][1],
          adsenseid: adsenseid || '',
          aurl: aurl || '',
          aindex: aindex || '',
          channelid: channelid || ''
        }
      }
    })
  },
  getAdPosition: function (evt) {
    var offsetX = evt.offsetX
    var offsetY = evt.offsetY
    var target = evt.target || evt.srcElement
    var offsetTop = target.offsetTop
    var offsetLeft = target.offsetLeft
    return {
      x: offsetX + offsetTop,
      y: offsetY + offsetLeft
    }
  },
  bindEvent: function () {
    var newsModule = this
    // click lead more
    $l('.n256-load-more-btn').on('click', function () {
     newsModule.getNews()
    })
    // tab切换
    $l('.n256-news-tab').on(newsModule.changeTabWay === 1 ? 'mouseover' : 'click', 'span', clickTabHandle)
    function clickTabHandle () {
      var page = newsModule.state.pagesList[newsModule.state.activeIndex]
      if (page >= newsModule.loadPage) {
       $l('.n256-news-loadnotice').addClass('hide')
       $l('.n256-load-more-btn').removeClass('hide')
      } else {
       $l('.n256-news-loadnotice').removeClass('hide')
       $l('.n256-load-more-btn').addClass('hide')
      }
      var isvisited = $l(this).attr('isvisited')
      var tabs = $l('.n256-news-tab').child('span')
      var index = $l(this).attr('data-index')
      var type = $l(this).attr('data-type')
      $l(tabs[newsModule.state.activeIndex]).removeClass('active-tab')
      $l(tabs[index]).addClass('active-tab')
      var tabs = $l(newsModule.target).find('.n256-tab-item')
      $l(tabs[newsModule.state.activeIndex]).removeClass('active-tab-item')
      $l(tabs[index]).addClass('active-tab-item')
      newsModule.state.activeIndex = index
      if (isvisited) {
        return
      } else if (!window.isNewsLoading) {
        newsModule.getNews(true)
        $l(this).attr('isvisited', 'true')
      }
    }
     // 滚动到底部行为
     function scrollLoadHandle () {
       var docHeight
       var scrollTop
       var clientHeight
       if (newsModule.containerHeight) {
         docHeight = newsModule.newsContainer.scrollHeight
         scrollTop = newsModule.newsContainer.scrollTop
         clientHeight = newsModule.newsContainer.clientHeight
       } else {
         docHeight = document.documentElement.scrollHeight || document.body.scrollHeight
         scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
         clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
       }
       var spaceToBottom = docHeight - Math.ceil(scrollTop + clientHeight)
       if (!scrollTop) {
         return
       }
       // 滚动到底部固定
       if (newsModule.actionAtBottom === 'fixed') {
         if (spaceToBottom <= newsModule.topInstance) {
           newsModule.newsContainer.style.paddingBottom = newsModule.topInstance - spaceToBottom + 'px'
         } else {
           newsModule.newsContainer.style.paddingBottom = '0px'
         }
         var target = $l('.n256-tab-item')[newsModule.state.activeIndex]
         var targetH = target.offsetHeight
         var offsetT = $l(newsModule.newsContainer).offset().top
         var scrollT = window.pageYOffset || (document.documentElement || document.body).scrollTop
         var clientH = window.innerHeight || (document.documentElement || document.body).clientHeight
         if (targetH + offsetT - scrollT <= clientH) {
           $l(target).addClass('fixed-position')
         } else {
           $l(target).removeClass('fixed-position')
         }
       } else if (newsModule.actionAtBottom === 'load') {
         // 加载页数及按钮控制
         if (newsModule.state.pagesList[newsModule.state.activeIndex] >= newsModule.maxPage) {
           return newsModule.showBottomNotice(true)
         } else if (newsModule.state.pagesList[newsModule.state.activeIndex] >= newsModule.loadPage){
           newsModule.showBottomNotice(true)
           $l('.n256-news-loadnotice').addClass('hide')
           $l('.n256-load-more-btn').removeClass('hide')
           return
         }
         // 加载下一页
         if (spaceToBottom <= newsModule.instance) {
          if (!window.isNewsLoading) {
            newsModule.getNews()
          }
        }
      }
    }
    var scrollTarget = newsModule.containerHeight ? newsModule.newsContainer : window
    if (window.addEventListener) {
      scrollTarget.addEventListener('scroll', scrollLoadHandle)
    } else {
      scrollTarget.attachEvent('onscroll', scrollLoadHandle)
    }
  },
  bindStatisticsEvent: function () {
    var newsModule =  this
    // 点击360广告
    var timeStart, timeEnd
    $l(newsModule.target).on('mousedown', '.ad-360', function (evt) {
     timeStart = new Date().getTime()
    })
    $l(newsModule.target).on('mouseup', '.ad-360', function (evt) {
      if (evt.button === 2) return
      var target = $l($l(this).child()[0])
      var clktk = target.attr('data-clktk')
      var timeEnd = new Date().getTime()
      clktk = clktk.replace('__EVENT_TIME_START__', timeStart)
      clktk = clktk.replace('__EVENT_TIME_END__', timeEnd)
      clktk = clktk.replace('__OFFSET_X__', newsModule.getAdPosition(evt).x)
      clktk = clktk.replace('__OFFSET_Y__', newsModule.getAdPosition(evt).y)
      clktk = clktk.split(',')
      // 跳转链接处理
      var url = target.attr('data-url')
      url = url.replace('__EVENT_TIME_START__', timeStart)
      url = url.replace('__EVENT_TIME_END__', timeEnd)
      url = url.replace('__OFFSET_X__', newsModule.getAdPosition(evt).x)
      url = url.replace('__OFFSET_Y__', newsModule.getAdPosition(evt).y)
      target.attr('href', url)
      // 发送360点击统计
      newsModule._360Statistics(clktk)
      // 发送内部点击统计
      var aurl = url
      var aindex
      var page = $l(this.parentNode).attr('data-page')
      var channelid = '1001'
      if (page >= 2) {
        aindex = $l(this).index() + (page - 2 ) * (newsModule.newsNumPer + newsModule.adNumPer) + (newsModule.adNumFirst + newsModule.newsNumFirst)
      } else {
        aindex = $l(this).index()
      }
      var adsenseid = $l(this).attr('data-num')
      newsModule.adStatistics(4, aurl, aindex + 1, [adsenseid], channelid)
    })

    // 点击新闻
    $l(newsModule.target).on('click', '.news-item', function (evt) {
      if (evt.button === 2) return
      var type = 4
      var nurl = $l(this).attr('data-url')
      var nindex = 0
      // var hindex = $l(this).attr('data-num')
      var page = $l(this.parentNode).attr('data-page')
      if (page >= 2) {
        nindex = $l(this).index() + (page - 2 ) * (newsModule.newsNumPer + newsModule.adNumPer) + (newsModule.adNumFirst + newsModule.newsNumFirst)
      } else {
        nindex = $l(this).index()
      }
      newsModule.newsStatistics(type, [nurl], [nindex + 1])
      var url = $l(this).attr('data-url')
    })
    // // 点击百度广告
    // function clickBaiduAdHandle (evt) {
    //   // var target = $l(this).child().eq(0)
    //   var aurl = ''
    //   var aindex
    //   var page = $l(this.parentNode).attr('data-page')
    //   var channelid = '1002'
    //   if (page >= 2) {
    //     aindex = $l(this).index() + (page - 2 ) * (newsModule.newsNumPer + newsModule.adNumPer) + (newsModule.adNumFirst + newsModule.newsNumFirst)
    //   } else {
    //     aindex = $l(this).index()
    //   }
    //   var adsenseid = $l(this).attr('data-num')
    //   newsModule.adStatistics(4, aurl, aindex + 1, [adsenseid], channelid)
    // }
    // $l(newsModule.target).on('click', '.ad-baidu', function () {
    //   if (evt.button === 2) return
    //   clickBaiduAdHandle.call(this, evt)
    // })
    // 所有内容展现时统计处理
    var scrollTarget = newsModule.containerHeight ? newsModule.newsContainer : window
    var showStatisticsHandle = (function () {
      var prevTime = 0, times = 0, nowTime = 0
      return function (evt, forceExecute) {
        if (!forceExecute) {
          // 过滤执行次数
          var scrollSpaceNow
          times++
          if (newsModule.scrollType === 'times') {
            if (times >= newsModule.scrollTimes) {
              times = 0
            } else {
              return
            }
          } else {
            nowTime = new Date().getTime()
            if (nowTime - prevTime > newsModule.scrollInterval) {
              prevTime = nowTime
            } else {
              return
            }
          }
        }
        // 执行展现统计处理
        var container = $l(newsModule.target).find('.n256-tab-item').eq(newsModule.state.activeIndex)
        var newsList = container.find('.news-item')
        var _360Ad = container.find('.ad-360')
        var baiduAd = container.find('.ad-baidu')
        for (var i = 0; i < newsList.length; i++) {
          var isvisited = $l(newsList[i]).attr('isvisited')
          if ($l(newsList[i]).isInView(newsModule.containerHeight, newsModule.showSpace) && !isvisited) {
            // 参数处理
            var nindex = 0
            var nurl = $l(newsList[i]).attr('data-url')
            var page = $l(newsList[i].parentNode).attr('data-page')
            if (page >= 2) {
              nindex = $l(newsList[i]).index() + (page - 2 ) * (newsModule.newsNumPer + newsModule.adNumPer) + (newsModule.adNumFirst + newsModule.newsNumFirst)
            } else {
              nindex = $l(newsList[i]).index()
            }
            // 展现的新闻放入缓冲区
            newsModule.newsBuffer.nurl.push(nurl)
            newsModule.newsBuffer.nindex.push(nindex + 1)
            $l(newsList[i]).attr('isvisited', 'true')
          }
        }
        for (var i = 0; i < _360Ad.length; i++) {
          var item = $l(_360Ad[i])
          var isvisited = item.attr('isvisited')
          if (item.isInView(newsModule.containerHeight, newsModule.showSpace) && !isvisited && item.child().length) {
            // 参数处理
            var aurl = item.attr('data-url')
            var adsenseid = item.attr('data-num')
            var aindex = 0
            var channelid = 1001
            var page = $l(item[0].parentNode).attr('data-page')
            if (page >= 2) {
              aindex = item.index() + (page - 2 ) * (newsModule.newsNumPer + newsModule.adNumPer) + (newsModule.adNumFirst + newsModule.newsNumFirst)
            } else {
              aindex = item.index()
            }
            // 展现的360广告直接发送统计
            newsModule.adStatistics(3, aurl, aindex + 1, [adsenseid], channelid)
            if (item.child()[0]) {
              var imptk = $l(item.child()[0]).attr('data-imptk').split(',')
              newsModule._360Statistics(imptk)
            }
            item.attr('isvisited', 'true')
          }
        }
        for (var i = 0; i < baiduAd.length; i++) {
          var item = $l(baiduAd[i])
          var isvisited = item.attr('isvisited')
          if (item.isInView(newsModule.containerHeight, newsModule.showSpace) && !isvisited && item[0].offsetHeight >= 10) {
            // 参数处理
            var aurl = item.attr('data-url')
            var adsenseid = item.attr('data-num')
            var aindex = 0
            var channelid = 1002
            var page = $l(baiduAd[i].parentNode).attr('data-page')
            if (page >= 2) {
              aindex = item.index() + (page - 2 ) * (newsModule.newsNumPer + newsModule.adNumPer) + (newsModule.adNumFirst + newsModule.newsNumFirst)
            } else {
              aindex = item.index()
            }
            // 展现的百度广告直接发送统计
            newsModule.adStatistics(3, aurl, aindex + 1, [adsenseid], channelid)
            item.attr('isvisited', 'true')
          }
        }
      }
    })()
    this.checkShow = showStatisticsHandle
    if (window.addEventListener) {
      scrollTarget.addEventListener('scroll', showStatisticsHandle)
    } else {
      scrollTarget.attachEvent('onscroll', showStatisticsHandle)
    }
    // 对内部发送新闻展现统计
    setInterval(function () {
      if (newsModule.newsBuffer.nurl && newsModule.newsBuffer.nurl.length) {
        newsModule.newsStatistics(3, newsModule.newsBuffer.nurl, newsModule.newsBuffer.nindex)
      }
      newsModule.newsBuffer.nurl.length = 0
      newsModule.newsBuffer.nindex.length = 0
    }, newsModule.statisticsInterval)
  }
}
