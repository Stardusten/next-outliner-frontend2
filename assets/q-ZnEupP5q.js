var i,u=m(["abs","acos","aj","aj0","all","and","any","asc","asin","asof","atan","attr","avg","avgs","bin","by","ceiling","cols","cor","cos","count","cov","cross","csv","cut","delete","deltas","desc","dev","differ","distinct","div","do","each","ej","enlist","eval","except","exec","exit","exp","fby","fills","first","fkeys","flip","floor","from","get","getenv","group","gtime","hclose","hcount","hdel","hopen","hsym","iasc","idesc","if","ij","in","insert","inter","inv","key","keys","last","like","list","lj","load","log","lower","lsq","ltime","ltrim","mavg","max","maxs","mcount","md5","mdev","med","meta","min","mins","mmax","mmin","mmu","mod","msum","neg","next","not","null","or","over","parse","peach","pj","plist","prd","prds","prev","prior","rand","rank","ratios","raze","read0","read1","reciprocal","reverse","rload","rotate","rsave","rtrim","save","scan","select","set","setenv","show","signum","sin","sqrt","ss","ssr","string","sublist","sum","sums","sv","system","tables","tan","til","trim","txf","type","uj","ungroup","union","update","upper","upsert","value","var","view","views","vs","wavg","where","where","while","within","wj","wj1","wsum","xasc","xbar","xcol","xcols","xdesc","xexp","xgroup","xkey","xlog","xprev","xrank"]),d=/[|/&^!+:\\\-*%$=~#;@><,?_\'\"\[\(\]\)\s{}]/;function m(t){return new RegExp("^("+t.join("|")+")$")}function s(t,e){var o=t.sol(),r=t.next();if(i=null,o){if(r=="/")return(e.tokenize=p)(t,e);if(r=="\\")return t.eol()||/\s/.test(t.peek())?(t.skipToEnd(),/^\\\s*$/.test(t.current())?(e.tokenize=f)(t):e.tokenize=s,"comment"):(e.tokenize=s,"builtin")}if(/\s/.test(r))return t.peek()=="/"?(t.skipToEnd(),"comment"):"null";if(r=='"')return(e.tokenize=v)(t,e);if(r=="`")return t.eatWhile(/[A-Za-z\d_:\/.]/),"macroName";if(r=="."&&/\d/.test(t.peek())||/\d/.test(r)){var n=null;return t.backUp(1),t.match(/^\d{4}\.\d{2}(m|\.\d{2}([DT](\d{2}(:\d{2}(:\d{2}(\.\d{1,9})?)?)?)?)?)/)||t.match(/^\d+D(\d{2}(:\d{2}(:\d{2}(\.\d{1,9})?)?)?)/)||t.match(/^\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?/)||t.match(/^\d+[ptuv]{1}/)?n="temporal":(t.match(/^0[NwW]{1}/)||t.match(/^0x[\da-fA-F]*/)||t.match(/^[01]+[b]{1}/)||t.match(/^\d+[chijn]{1}/)||t.match(/-?\d*(\.\d*)?(e[+\-]?\d+)?(e|f)?/))&&(n="number"),n&&(!(r=t.peek())||d.test(r))?n:(t.next(),"error")}return/[A-Za-z]|\./.test(r)?(t.eatWhile(/[A-Za-z._\d]/),u.test(t.current())?"keyword":"variable"):/[|/&^!+:\\\-*%$=~#;@><\.,?_\']/.test(r)||/[{}\(\[\]\)]/.test(r)?null:"error"}function p(t,e){return t.skipToEnd(),/\/\s*$/.test(t.current())?(e.tokenize=x)(t,e):e.tokenize=s,"comment"}function x(t,e){var o=t.sol()&&t.peek()=="\\";return t.skipToEnd(),o&&/^\\\s*$/.test(t.current())&&(e.tokenize=s),"comment"}function f(t){return t.skipToEnd(),"comment"}function v(t,e){for(var o=!1,r,n=!1;r=t.next();){if(r=='"'&&!o){n=!0;break}o=!o&&r=="\\"}return n&&(e.tokenize=s),"string"}function a(t,e,o){t.context={prev:t.context,indent:t.indent,col:o,type:e}}function c(t){t.indent=t.context.indent,t.context=t.context.prev}const k={name:"q",startState:function(){return{tokenize:s,context:null,indent:0,col:0}},token:function(t,e){t.sol()&&(e.context&&e.context.align==null&&(e.context.align=!1),e.indent=t.indentation());var o=e.tokenize(t,e);if(o!="comment"&&e.context&&e.context.align==null&&e.context.type!="pattern"&&(e.context.align=!0),i=="(")a(e,")",t.column());else if(i=="[")a(e,"]",t.column());else if(i=="{")a(e,"}",t.column());else if(/[\]\}\)]/.test(i)){for(;e.context&&e.context.type=="pattern";)c(e);e.context&&i==e.context.type&&c(e)}else i=="."&&e.context&&e.context.type=="pattern"?c(e):/atom|string|variable/.test(o)&&e.context&&(/[\}\]]/.test(e.context.type)?a(e,"pattern",t.column()):e.context.type=="pattern"&&!e.context.align&&(e.context.align=!0,e.context.col=t.column()));return o},indent:function(t,e,o){var r=e&&e.charAt(0),n=t.context;if(/[\]\}]/.test(r))for(;n&&n.type=="pattern";)n=n.prev;var l=n&&r==n.type;return n?n.type=="pattern"?n.col:n.align?n.col+(l?0:1):n.indent+(l?0:o.unit):0}};export{k as q};