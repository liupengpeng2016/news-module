"use strict";!function(){function t(t){t.target||console.error("target of params is required"),this.target="string"==typeof t.target?document.getElementById(t.target):t.target,this.init()}window.console||(window.console.log=window.console.error=function(){}),t.prototype={constructor:t,init:function(){this.createScrollbar(),this.setScrollbarP(),this.setScrollbarH(),this.bindEvent()},refresh:function(){this.scrollHandle&&this.scrollHandle()},dHeight:function(){return this.target.scrollHeight},sHeight:function(t){return t&&(this.target.scrollTop=t),t||this.target.scrollTop},cHeight:function(){return this.target.clientHeight},createScrollbar:function(){var t=document.createElement("div"),e=document.createElement("div");t.className="scrollbar-bar",e.className="scrollbar-block",t.appendChild(e),this.target.parentNode.style.position="relative",this.target.parentNode.appendChild(t),this.scrollbar=e,this.scrollbarC=t},setScrollbarH:function(){this.scrollbar.style.height=this.cHeight()/this.dHeight()*this.cHeight()+"px"},setScrollbarP:function(){this.scrollbar.style.top=this.sHeight()/this.dHeight()*this.cHeight()+"px"},on:function(t,e,i){window.addEventListener?t.addEventListener(e,i):t.attachEvent("on"+e,i)},bindEvent:function(){var i=this;function t(){i.cHeight()>=i.dHeight()?i.scrollbarC.style.display="none":i.scrollbarC.style.display="block",i.setScrollbarP(),i.setScrollbarH()}this.on(this.target,"scroll",t);var n,o=!1;function e(t){if(2!==(t=t||event).button)return"mousedown"===t.type?o=!0:"mouseup"===t.type?o=!1:void 0}this.on(document,"mousemove",function(t){if(t=t||event,o&&(t.preventDefault&&t.preventDefault(),t.returnValue=!1),o){var e=(t.clientY-n)/i.cHeight()*i.dHeight()+i.sHeight();i.sHeight(e)}n=t.clientY}),this.on(this.scrollbar,"mouseenter",function(t){t=t||event,n=t.clientY}),this.on(this.scrollbar,"mousedown",e),this.on(document,"mouseup",e),this.on(window,"scroll",function(){t()}),this.on(this.target,"DOMSubtreeModified",t),this.scrolHandle=t}},window.Scrollbar=t}();