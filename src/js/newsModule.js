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
  isInView: function (outSpace) {
    outSpace = outSpace || 0
    var scrollT = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
    var clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
    var offsetT = this.offset().top
    if (scrollT + clientHeight >= offsetT + outSpace) {
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
  this.baiduAdId = params.baiduAdId || 'u3433620'
  this.dongfangNewsId = params.dongfangNewsId || '02151'
  this._360ccId = params._360ccId || "OBHnX7"
  this._360adId = params._360adId || 'mCzFYt'
  // computed attr
  this.newsBuffer = []
  this.adNumPer = parseInt((this.newsNumPer - 1) / this.newsRadio + 1)
  this.adNumFirst = parseInt((this.newsNumFirst - 1) / this.newsRadio + 1)
  if (!params.adsenseid || !params.newsAdsenseid) {
    console.error('adsenseid, newsAdsenseid is both required')
  }
  this.state = {
    activeIndex: 0,
    pagesList: [0]
  }
  this.init()
}
NewsModule.prototype = {
  constructor: NewsModule,
  createLoadNotice: function () {
    var div = document.createElement('div')
    var p = document.createElement('p')
    div.className = 'n256-news-loadnotice'
    div.id = 'n256-news-loadnotice'
    div.innerHTML = '加载中...'
    p.className = 'n256-load-more-btn hide btn'
    p.id = 'n256-load-more-btn'
    p.innerHTML = '点击加载更多'
    $l('#n256-news-container')[0].appendChild(div)
    $l('#n256-news-container')[0].appendChild(p)
  },
  createNewsTop: function () {
    var _this = this
    var container = document.createElement('div')
    container.className = 'n256-news-top'
    container.id = 'n256-news-top'
    var content = '<div id="n256-news-top-ad" class="n256-news-top-ad">' +
    '</div>' +
    '<div id="n256-news-top-list" class="n256-news-top-list">' +
    '<h4>热点排行</h4>' +
    '</div>'
    container.innerHTML = content
    $l('#n256-news-container')[0].appendChild(container)
    // 360橱窗
    setTimeout(function () {
      var obj = {"w":280,"showid": _this._360ccId,"rshowid":_this._360ccId,"inject":"inlay","layout":"magicCubeScene","style":"magicCube","row":"2","line":"2"}
      obj.placeholderId = 'n256-news-top-ad'
      typeof BANNER_SLIDER != 'undefined' && BANNER_SLIDER(obj);
    }, 0)
  },
  createNoNewsNotice: function () {
    var div1 = document.createElement('div')
    div1.className = 'n256-nonews-notice hide'
    div1.id = 'n256-nonews-notice'
    div1.innerHTML = '<a href="javascript:;"  class="btn">暂无内容，点击重新加载</a>'
    var div2 = document.createElement('div')
    div2.className = 'n256-nonews-notice-hottop hide'
    div2.id = 'n256-nonews-notice-hottop'
    div2.innerHTML = '<a href="javascript:;" class="btn">暂无内容，点击重新加载</a>'
    $l('#n256-news-container')[0].appendChild(div1)
    $l('#n256-news-top')[0].appendChild(div2)
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
        '<img src="' + item.miniimg[0].src + '" alt="">' +
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
        '<li><img src="' + item.miniimg[0].src + '" alt=""></li>' +
        '<li><img src="' + item.miniimg[1].src + '" alt=""></li>' +
        '<li><img src="' + item.miniimg[2].src + '" alt=""></li>' +
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

    if (adType == 1 || adType == 4) {
      ad = '<a class="n256-news-item-singleImg"  target=_blank href=' + adItem.curl + ' data-url=' + adItem.curl + ' data-clktk=' + clktk + ' data-imptk=' + imptk + '>' +
        '<div class="n256-news-img">' +
          '<img src="' + adItem.img + '" alt="">' +
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
          showid: this._360adId,
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
            // 重置新闻排行距离底部距离
            if ($l('#n256-news-top-content')[0]) {
              $l('#n256-news-top-content')[0].style.paddingBottom = '0px'
            }
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
      if (times >= this.reloadTimes) {
        times = 0
        return this.showNonewsNotice(true)
      }
      var _this = this
      this.getDongfangNews(function (res) {
        if (!res && !res.length) {
          times++
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
    }

    var div = document.createElement('div')
    div.id = 'n256-news-tab'
    div.className = 'n256-news-tab' + (this.isShowTab ? '' : ' hide')
    div.innerHTML = tabContent
    $l('#n256-news-container')[0].appendChild(div)
  },
  createNewsContainer: function () {
    for(var i = 0; i < this.tabData.length; i++) {
      var div = document.createElement('div')
      div.id = 'n256-tab-item-' + this.tabData[i][1]
      div.className = 'n256-tab-item'
      $l('#n256-news-container')[0].appendChild(div)
    }
  },
  fillNews: function (newsData, isClear) {
    var adNum360 = 0
    var content = '', type
    var newsContainer = $l('.n256-tab-item')[this.state.activeIndex]
    var _this = this
    for (var i = 0; i < newsData.length; i++) {
      // ad
      var ad = ''
      if ((i === 0 || i % 3 === 0) && this.showAd) {
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
          case 'baidu': ad = this.baiduAdContainer(this.adsenseid); break
          case '360': ad = this._360AdContainer(this.adsenseid); adNum360++;break
        }
        this.adsenseid++
      }
      // news
      var news
      if (newsData[i].miniimg.length >= 3) {
        type = Math.random() >= 0.5 ? 'single' : 'multi'
      } else {
        type = 'single'
      }
      news = type == 'multi' ? this.multiImgNewsTemplate(newsData[i]) : this.singleImgNewsTemplate(newsData[i])
      // pin jie
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
    // 填充ad
    // baidu ad
    var adBaidu = $l(div).find('.ad-baidu')
    for (var i = 0; i < adBaidu.length; i++) {
      var num = $l(adBaidu[i]).attr('data-num')
      adBaidu[i].innerHTML = this.baiduAdTemplate([num])
    }
    // 360 ad
    var _this = this
    if (!adNum360) return
    var ad360 = $l(div).find('.ad-360')
    var _360Num = []
    for (var i = 0; i < ad360.length; i++) {
      _360Num.push($l(ad360[i]).attr('data-num'))
    }
    this.get360Ad(adNum360, _360Num, function (ads) {
      if (!ads) {
        ads = []
      }
      var ad360 = $l(div).find('.ad-360')
      // console.log('request 360num=' +adNum360 + ' 360广告位=' + ad360.length + ' 返回数量=' + ads.length)
      for (var i = 0; i < ads.length; i++) {
        ad360[i].innerHTML = _this._360AdTemplate(ads[i])
      }
      // 未显示部分展示为百度ad
      if (!_this.replace360Ad) return
      for (var i = ads.length; i < ad360.length; i++) {
        var num = $l(ad360[i]).attr('data-num')
        $l(ad360[i]).removeClass('ad-360').addClass('ad-baidu')
        ad360[i].innerHTML = _this.baiduAdTemplate([num])
      }
    })
  },
  fillTopNews: function (news) {
    news.length = 20
    var content = ''
    for (var i = 0; i < news.length; i++) {
      content += this.newsTopTemplate(news[i], i)
    }
    var frag = document.createElement('div')
    frag.id = 'n256-news-top-content'
    frag.innerHTML = content
    $l('#n256-news-top-list')[0].appendChild(frag)
  },
  showNonewsNotice: function (isShow) {
    var loadNotice = $l('#n256-news-loadnotice')
    var loadMore = $l('#n256-load-more-btn')
    var noNewsNotice = $l('#n256-nonews-notice')
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
    var loadNotice = $l('#n256-news-loadnotice')
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
  newsStatistics: function (type, nurl, nindex, hindex) {
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
         nindex: hindex && hindex.length ?  '' : nindex || '',
         hindex: hindex || '',
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
          url: encodeURIComponent(location.href) || '',
          rurl: encodeURIComponent(document.referrer) || '',
          tab: this.tabData[this.state.activeIndex][1],
          adsenseid: adsenseid || '',
          aurl: encodeURIComponent(aurl || ''),
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
  init: function () {
    this.createTab()
    this.createNewsContainer()
    this.createNewsTop()
    this.createLoadNotice()
    this.createNoNewsNotice()
    var newsModule = this
    // click lead more
    $l('#n256-load-more-btn').on('click', function () {
     newsModule.getNews()
    })
    // click reload btn
    $l('#n256-nonews-notice').on('click', function () {
      newsModule.getNews()
    })
    // click reload btn hottop
    $l('#n256-nonews-notice-hottop').on('click', function () {
      newsModule.getNewsTop(function newsTopLoadedCallback (res) {
        res.length = 20
        newsModule.fillTopNews(res)
        $l('#n256-nonews-notice-hottop').addClass('hide')
      }, function () {
        $l('#n256-nonews-notice-hottop').removeClass('hide')
      })
    })
    // click tab
    $l('#n256-news-tab').on('click', 'span', clickTabHandle)
    function clickTabHandle () {
      var page = newsModule.state.pagesList[newsModule.state.activeIndex]
      if (page >= newsModule.loadPage) {
       $l('#n256-news-loadnotice').addClass('hide')
       $l('#n256-load-more-btn').removeClass('hide')
      } else {
       $l('#n256-news-loadnotice').removeClass('hide')
       $l('#n256-load-more-btn').addClass('hide')
      }
      var isvisited = $l(this).attr('isvisited')
      var tabs = $l('#n256-news-tab').child('span')
      var index = $l(this).attr('data-index')
      var type = $l(this).attr('data-type')
      $l(tabs[newsModule.state.activeIndex]).removeClass('active-tab')
      $l(tabs[index]).addClass('active-tab')
      var tabs = $l('#n256-news-container').find('.n256-tab-item')
      $l(tabs[newsModule.state.activeIndex]).removeClass('active-tab-item')
      $l(tabs[index]).addClass('active-tab-item')
      newsModule.state.activeIndex = index
      if (isvisited) {
       return
      } else if (!window.isNewsLoading) {
      newsModule.getNews(true)
      $l(this).attr('isvisited', 'true')
      }
      // loaded statistics
      setTimeout(function () {
       showStatisticsHandle()
      }, 2000)
    }
     // scroll load
     function scrollLoadHandle () {
       var docHeight = document.documentElement.scrollHeight || document.body.scrollHeight
       var scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop
       var clientHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight
       var spaceToBottom = docHeight - Math.ceil(scrollTop + clientHeight)
       // 新闻排行底部距离控制
       if (spaceToBottom <= newsModule.topInstance) {
         if ($l('#n256-news-top-content')[0]) {
           $l('#n256-news-top-content')[0].style.paddingBottom = newsModule.topInstance - spaceToBottom + 'px'
         }
       } else {
         if ($l('#n256-news-top-content')[0]) {
           $l('#n256-news-top-content')[0].style.paddingBottom = '0px'
         }
       }
       if (newsModule.state.pagesList[newsModule.state.activeIndex] >= newsModule.maxPage) {
         return newsModule.showBottomNotice(true)
       } else if (newsModule.state.pagesList[newsModule.state.activeIndex] >= newsModule.loadPage){
         newsModule.showBottomNotice(true)
         $l('#n256-news-loadnotice').addClass('hide')
         $l('#n256-load-more-btn').removeClass('hide')
         return
       }
       if (spaceToBottom <= newsModule.instance) {
        if (!window.isNewsLoading) {
          newsModule.getNews()
        }
      }
    }
    if (window.addEventListener) {
      window.addEventListener('scroll', scrollLoadHandle)
    } else {
      window.attachEvent('onscroll', scrollLoadHandle)
    }
    // statistics
    // 360 ad click
    var timeStart, timeEnd
    $l('#n256-news-container').on('mousedown', '.ad-360', function (evt) {
     timeStart = new Date().getTime()
    })
    $l('#n256-news-container').on('mouseup', '.ad-360', function (evt) {
      if (evt.button === 2) return
      var target = $l($l(this).child()[0])
      var clktk = target.attr('data-clktk')
      var timeEnd = new Date().getTime()
      clktk = clktk.replace('__EVENT_TIME_START__', timeStart)
      clktk = clktk.replace('__EVENT_TIME_END__', timeEnd)
      clktk = clktk.replace('__OFFSET_X__', newsModule.getAdPosition(evt).x)
      clktk = clktk.replace('__OFFSET_Y__', newsModule.getAdPosition(evt).y)
      clktk = clktk.split(',')
      newsModule._360Statistics(clktk)
      // 跳转链接处理
      var url = target.attr('data-url')
      url = url.replace('__EVENT_TIME_START__', timeStart)
      url = url.replace('__EVENT_TIME_END__', timeEnd)
      url = url.replace('__OFFSET_X__', newsModule.getAdPosition(evt).x)
      url = url.replace('__OFFSET_Y__', newsModule.getAdPosition(evt).y)
      target.attr('href', url)
     // location.href = url
     // $l.open(url)
    })
    // $l('#n256-news-container').on('click', '.ad-360', function (evt) {
    //   evt.preventDefault()
    // })
    // news click
    $l('#n256-news-container').on('click', '.news-item', function (evt) {
      if (evt.button === 2) return

     var type = 4
     var nurl = $l(this).attr('data-url')
     var nindex = 0
     var hindex = $l(this).attr('data-num')
     var page = $l(this.parentNode).attr('data-page')
     if (page >= 2) {
       nindex = $l(this).index() + (page - 2 ) * (newsModule.newsNumPer + newsModule.adNumPer) + (newsModule.adNumFirst + newsModule.newsNumFirst)
     } else {
       nindex = $l(this).index()
     }
     newsModule.newsStatistics(type, [nurl], [nindex + 1], hindex ? [hindex] : '')
     var url = $l(this).attr('data-url')
     // location.href = url
     //$l.open(url)
    })
    // ad click
    function clickAdHandle (evt) {
      var target = $l($l(this).child()[0])
      var url = target.attr('data-url')
      url = url.replace('__EVENT_TIME_START__', timeStart)
      url = url.replace('__EVENT_TIME_END__', timeEnd)
      url = url.replace('__OFFSET_X__', newsModule.getAdPosition(evt).x)
      url = url.replace('__OFFSET_Y__', newsModule.getAdPosition(evt).y)
      var type = this.className.indexOf('ad-360') !== -1 ? '360' : 'baidu'
      var aurl = url
      var aindex
      var page = $l(this.parentNode).attr('data-page')
      var channelid = type === '360' ? '1001' : '1002'
      if (page >= 2) {
        aindex = $l(this).index() + (page - 2 ) * (newsModule.newsNumPer + newsModule.adNumPer) + (newsModule.adNumFirst + newsModule.newsNumFirst)
      } else {
        aindex = $l(this).index()
      }
      var adsenseid = $l(this).attr('data-num')
      newsModule.adStatistics(4, aurl, aindex + 1, [adsenseid], channelid)
    }
    $l('#n256-news-container').on('click', '.ad-360', function (evt) {
      if (evt.button === 2) return

      clickAdHandle.call(this, evt)
    })
    $l('#n256-news-container').on('click', '.ad-baidu', function () {
      if (evt.button === 2) return

      clickAdHandle.call(this)
    })
    // show statistics
    function showStatisticsHandle () {
      var container = $l($l('.n256-tab-item')[newsModule.state.activeIndex])
      // var newsList = $l('#n256-news-container').find('.news-item')
      var newsList = container.find('.news-item')
      var newsTop = $l('#n256-news-top').find('.news-item')
      var _360Ad = container.find('.ad-360')
      var baiduAd = container.find('.ad-baidu')
      for (var i = 0; i < newsList.length; i++) {
        var isvisited = $l(newsList[i]).attr('isvisited')
        if ($l(newsList[i]).isInView() && !isvisited) {
          // 参数处理
          var nindex = 0
          var hindex = $l(newsList[i]).attr('data-num')
          var nurl = $l(newsList[i]).attr('data-url')
          var page = $l(newsList[i].parentNode).attr('data-page')
          if (page >= 2) {
            nindex = $l(newsList[i]).index() + (page - 2 ) * (newsModule.newsNumPer + newsModule.adNumPer) + (newsModule.adNumFirst + newsModule.newsNumFirst)
          } else {
            nindex = $l(newsList[i]).index()
          }
          // console.log('news show = ' + (nindex + 1))
          // send statistics
          newsModule.newsBuffer.push({nurl: nurl, nindex: nindex + 1, hindex: hindex})
          $l(newsList[i]).attr('isvisited', 'true')
        }
      }
      for (var i = 0; i < newsTop.length; i++) {
        var isvisited = $l(newsTop[i]).attr('isvisited')
        if ($l(newsTop[i]).isInView() && !isvisited) {
          // 参数处理
          var hindex = $l(newsTop[i]).attr('data-num')
          var nurl = $l(newsTop[i]).attr('data-url')
          var page = $l(newsTop[i].parentNode).attr('data-page')
          // console.log('top show = ' + hindex)
          // send statistics
          newsModule.newsBuffer.push({nurl: nurl, nindex: '', hindex: hindex})
          $l(newsTop[i]).attr('isvisited', 'true')
        }
      }
      for (var i = 0; i < _360Ad.length; i++) {
        var item = $l(_360Ad[i])
        var isvisited = item.attr('isvisited')
        if (item.isInView() && !isvisited && item.child().length) {
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
          // console.log('360 ad show = ' + (aindex + 1))
          // send statistics
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
        if (item.isInView() && !isvisited && item[0].offsetHeight >= 10) {
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
          // console.log('baidu ad show = ' + (aindex + 1))
          // send statistics
          newsModule.adStatistics(3, aurl, aindex + 1, [adsenseid], channelid)
          item.attr('isvisited', 'true')
        }
      }
    }
    if (window.addEventListener) {
      window.addEventListener('scroll', showStatisticsHandle)
    } else {
      window.attachEvent('onscroll', showStatisticsHandle)
    }
    // send news show statistics
    setInterval(function () {
      var nurl_n = []
      var nurl_h = []
      var nindex = []
      var hindex = []
      for (var i = 0; i < newsModule.newsBuffer.length; i++) {
        if (newsModule.newsBuffer[i].hindex) {
          nurl_h.push(newsModule.newsBuffer[i].nurl)
          hindex.push(newsModule.newsBuffer[i].hindex)
        } else {
          nurl_n.push(newsModule.newsBuffer[i].nurl)
          nindex.push(newsModule.newsBuffer[i].nindex)
        }
      }
      if (nurl_n.length && nindex.length) {
        newsModule.newsStatistics(3, nurl_n, nindex)
      }
      if (nurl_h.length && hindex.length) {
        newsModule.newsStatistics(3, nurl_h, null, hindex)
      }
      newsModule.newsBuffer = []
    }, newsModule.statisticsInterval)

    // dom load handle
    $l('#n256-news-tab').child()[0].click()
    newsModule.getNewsTop(function newsTopLoadedCallback (res) {
      res.length = 20
      newsModule.fillTopNews(res)
      $l('#n256-nonews-notice-hottop').addClass('hide')
    }, function () {
      $l('#n256-nonews-notice-hottop').removeClass('hide')
    })
    function newsTopLoadedCallback (res) {
      res.length = 20
      newsModule.fillTopNews(res)
    }
    // news top scroll fixed
    var fixedControl = function () {
      var container = $l('#n256-news-top-list')
      var target = $l('#n256-news-top-content')
      if (!target.length) return
      var targetH = target[0].offsetHeight
      var offsetT = container.offset().top
      var scrollT = window.pageYOffset || (document.documentElement || document.body).scrollTop
      var clientH = window.innerHeight || (document.documentElement || document.body).clientHeight
      if (targetH + offsetT <= scrollT + clientH) {
        target.addClass('fixed-position')
      } else {
        target.removeClass('fixed-position')
      }
    }
    if (window.addEventListener) {
      window.addEventListener('scroll', fixedControl)
    } else {
      window.attachEvent('onscroll', fixedControl)
    }
  }
}
