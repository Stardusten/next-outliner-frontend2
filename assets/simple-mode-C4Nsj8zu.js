function g(t){p(t,"start");var e={},n=t.languageData||{},d=!1;for(var u in t)if(u!=n&&t.hasOwnProperty(u))for(var l=e[u]=[],r=t[u],a=0;a<r.length;a++){var i=r[a];l.push(new f(i,t)),(i.indent||i.dedent)&&(d=!0)}return{name:n.name,startState:function(){return{state:"start",pending:null,indent:d?[]:null}},copyState:function(s){var o={state:s.state,pending:s.pending,indent:s.indent&&s.indent.slice(0)};return s.stack&&(o.stack=s.stack.slice(0)),o},token:k(e),indent:x(e,n),languageData:n}}function p(t,e){if(!t.hasOwnProperty(e))throw new Error("Undefined state "+e+" in simple mode")}function h(t,e){if(!t)return/(?:)/;var n="";return t instanceof RegExp?(t.ignoreCase&&(n="i"),t=t.source):t=String(t),new RegExp("^(?:"+t+")",n)}function c(t){if(!t)return null;if(t.apply)return t;if(typeof t=="string")return t.replace(/\./g," ");for(var e=[],n=0;n<t.length;n++)e.push(t[n]&&t[n].replace(/\./g," "));return e}function f(t,e){(t.next||t.push)&&p(e,t.next||t.push),this.regex=h(t.regex),this.token=c(t.token),this.data=t}function k(t){return function(e,n){if(n.pending){var d=n.pending.shift();return n.pending.length==0&&(n.pending=null),e.pos+=d.text.length,d.token}for(var u=t[n.state],l=0;l<u.length;l++){var r=u[l],a=(!r.data.sol||e.sol())&&e.match(r.regex);if(a){r.data.next?n.state=r.data.next:r.data.push?((n.stack||(n.stack=[])).push(n.state),n.state=r.data.push):r.data.pop&&n.stack&&n.stack.length&&(n.state=n.stack.pop()),r.data.indent&&n.indent.push(e.indentation()+e.indentUnit),r.data.dedent&&n.indent.pop();var i=r.token;if(i&&i.apply&&(i=i(a)),a.length>2&&r.token&&typeof r.token!="string"){n.pending=[];for(var s=2;s<a.length;s++)a[s]&&n.pending.push({text:a[s],token:r.token[s-1]});return e.backUp(a[0].length-(a[1]?a[1].length:0)),i[0]}else return i&&i.join?i[0]:i}}return e.next(),null}}function x(t,e){return function(n,d){if(n.indent==null||e.dontIndentStates&&e.doneIndentState.indexOf(n.state)>-1)return null;var u=n.indent.length-1,l=t[n.state];t:for(;;){for(var r=0;r<l.length;r++){var a=l[r];if(a.data.dedent&&a.data.dedentIfLineStart!==!1){var i=a.regex.exec(d);if(i&&i[0]){u--,(a.next||a.push)&&(l=t[a.next||a.push]),d=d.slice(i[0].length);continue t}}}break}return u<0?0:n.indent[u]}}export{g as s};
