var c={};function h(t){if(t.eatSpace())return null;var a=t.sol(),r=t.next();if(r==="\\")return t.match("fB")||t.match("fR")||t.match("fI")||t.match("u")||t.match("d")||t.match("%")||t.match("&")?"string":t.match("m[")?(t.skipTo("]"),t.next(),"string"):t.match("s+")||t.match("s-")?(t.eatWhile(/[\d-]/),"string"):((t.match("(")||t.match("*("))&&t.eatWhile(/[\w-]/),"string");if(a&&(r==="."||r==="'")&&t.eat("\\")&&t.eat('"'))return t.skipToEnd(),"comment";if(a&&r==="."){if(t.match("B ")||t.match("I ")||t.match("R "))return"attribute";if(t.match("TH ")||t.match("SH ")||t.match("SS ")||t.match("HP "))return t.skipToEnd(),"quote";if(t.match(/[A-Z]/)&&t.match(/[A-Z]/)||t.match(/[a-z]/)&&t.match(/[a-z]/))return"attribute"}t.eatWhile(/[\w-]/);var e=t.current();return c.hasOwnProperty(e)?c[e]:null}function m(t,a){return(a.tokens[0]||h)(t,a)}const i={name:"troff",startState:function(){return{tokens:[]}},token:function(t,a){return m(t,a)}};export{i as troff};