function a(t){for(var e={},n=t.split(" "),r=0;r<n.length;++r)e[n[r]]=!0;return e}var i=a("algorithm and annotation assert block break class connect connector constant constrainedby der discrete each else elseif elsewhen encapsulated end enumeration equation expandable extends external false final flow for function if import impure in initial inner input loop model not operator or outer output package parameter partial protected public pure record redeclare replaceable return stream then true type when while within"),l=a("abs acos actualStream asin atan atan2 cardinality ceil cos cosh delay div edge exp floor getInstanceName homotopy inStream integer log log10 mod pre reinit rem semiLinear sign sin sinh spatialDistribution sqrt tan tanh"),u=a("Real Boolean Integer String"),c=[].concat(Object.keys(i),Object.keys(l),Object.keys(u)),k=/[;=\(:\),{}.*<>+\-\/^\[\]]/,p=/(:=|<=|>=|==|<>|\.\+|\.\-|\.\*|\.\/|\.\^)/,o=/[0-9]/,s=/[_a-zA-Z]/;function f(t,e){return t.skipToEnd(),e.tokenize=null,"comment"}function m(t,e){for(var n=!1,r;r=t.next();){if(n&&r=="/"){e.tokenize=null;break}n=r=="*"}return"comment"}function d(t,e){for(var n=!1,r;(r=t.next())!=null;){if(r=='"'&&!n){e.tokenize=null,e.sol=!1;break}n=!n&&r=="\\"}return"string"}function z(t,e){for(t.eatWhile(o);t.eat(o)||t.eat(s););var n=t.current();return e.sol&&(n=="package"||n=="model"||n=="when"||n=="connector")?e.level++:e.sol&&n=="end"&&e.level>0&&e.level--,e.tokenize=null,e.sol=!1,i.propertyIsEnumerable(n)?"keyword":l.propertyIsEnumerable(n)?"builtin":u.propertyIsEnumerable(n)?"atom":"variable"}function b(t,e){for(;t.eat(/[^']/););return e.tokenize=null,e.sol=!1,t.eat("'")?"variable":"error"}function h(t,e){return t.eatWhile(o),t.eat(".")&&t.eatWhile(o),(t.eat("e")||t.eat("E"))&&(t.eat("-")||t.eat("+"),t.eatWhile(o)),e.tokenize=null,e.sol=!1,"number"}const g={name:"modelica",startState:function(){return{tokenize:null,level:0,sol:!0}},token:function(t,e){if(e.tokenize!=null)return e.tokenize(t,e);if(t.sol()&&(e.sol=!0),t.eatSpace())return e.tokenize=null,null;var n=t.next();if(n=="/"&&t.eat("/"))e.tokenize=f;else if(n=="/"&&t.eat("*"))e.tokenize=m;else{if(p.test(n+t.peek()))return t.next(),e.tokenize=null,"operator";if(k.test(n))return e.tokenize=null,"operator";if(s.test(n))e.tokenize=z;else if(n=="'"&&t.peek()&&t.peek()!="'")e.tokenize=b;else if(n=='"')e.tokenize=d;else if(o.test(n))e.tokenize=h;else return e.tokenize=null,"error"}return e.tokenize(t,e)},indent:function(t,e,n){if(t.tokenize!=null)return null;var r=t.level;return/(algorithm)/.test(e)&&r--,/(equation)/.test(e)&&r--,/(initial algorithm)/.test(e)&&r--,/(initial equation)/.test(e)&&r--,/(end)/.test(e)&&r--,r>0?n.unit*r:0},languageData:{commentTokens:{line:"//",block:{open:"/*",close:"*/"}},autocomplete:c}};export{g as modelica};
