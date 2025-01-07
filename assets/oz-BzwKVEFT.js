function o(t){return new RegExp("^(("+t.join(")|(")+"))\\b")}var h=/[\^@!\|<>#~\.\*\-\+\\/,=]/,m=/(<-)|(:=)|(=<)|(>=)|(<=)|(<:)|(>:)|(=:)|(\\=)|(\\=:)|(!!)|(==)|(::)/,k=/(:::)|(\.\.\.)|(=<:)|(>=:)/,u=["in","then","else","of","elseof","elsecase","elseif","catch","finally","with","require","prepare","import","export","define","do"],s=["end"],p=o(["true","false","nil","unit"]),z=o(["andthen","at","attr","declare","feat","from","lex","mod","div","mode","orelse","parser","prod","prop","scanner","self","syn","token"]),g=o(["local","proc","fun","case","class","if","cond","or","dis","choice","not","thread","try","raise","lock","for","suchthat","meth","functor"]),f=o(u),l=o(s);function a(t,e){if(t.eatSpace())return null;if(t.match(/[{}]/))return"bracket";if(t.match("[]"))return"keyword";if(t.match(k)||t.match(m))return"operator";if(t.match(p))return"atom";var r=t.match(g);if(r)return e.doInCurrentLine?e.doInCurrentLine=!1:e.currentIndent++,r[0]=="proc"||r[0]=="fun"?e.tokenize=b:r[0]=="class"?e.tokenize=x:r[0]=="meth"&&(e.tokenize=I),"keyword";if(t.match(f)||t.match(z))return"keyword";if(t.match(l))return e.currentIndent--,"keyword";var n=t.next();if(n=='"'||n=="'")return e.tokenize=v(n),e.tokenize(t,e);if(/[~\d]/.test(n)){if(n=="~")if(/^[0-9]/.test(t.peek())){if(t.next()=="0"&&t.match(/^[xX][0-9a-fA-F]+/)||t.match(/^[0-9]*(\.[0-9]+)?([eE][~+]?[0-9]+)?/))return"number"}else return null;return n=="0"&&t.match(/^[xX][0-9a-fA-F]+/)||t.match(/^[0-9]*(\.[0-9]+)?([eE][~+]?[0-9]+)?/)?"number":null}return n=="%"?(t.skipToEnd(),"comment"):n=="/"&&t.eat("*")?(e.tokenize=d,d(t,e)):h.test(n)?"operator":(t.eatWhile(/\w/),"variable")}function x(t,e){return t.eatSpace()?null:(t.match(/([A-Z][A-Za-z0-9_]*)|(`.+`)/),e.tokenize=a,"type")}function I(t,e){return t.eatSpace()?null:(t.match(/([a-zA-Z][A-Za-z0-9_]*)|(`.+`)/),e.tokenize=a,"def")}function b(t,e){return t.eatSpace()?null:!e.hasPassedFirstStage&&t.eat("{")?(e.hasPassedFirstStage=!0,"bracket"):e.hasPassedFirstStage?(t.match(/([A-Z][A-Za-z0-9_]*)|(`.+`)|\$/),e.hasPassedFirstStage=!1,e.tokenize=a,"def"):(e.tokenize=a,null)}function d(t,e){for(var r=!1,n;n=t.next();){if(n=="/"&&r){e.tokenize=a;break}r=n=="*"}return"comment"}function v(t){return function(e,r){for(var n=!1,i,c=!1;(i=e.next())!=null;){if(i==t&&!n){c=!0;break}n=!n&&i=="\\"}return(c||!n)&&(r.tokenize=a),"string"}}function S(){var t=u.concat(s);return new RegExp("[\\[\\]]|("+t.join("|")+")$")}const w={name:"oz",startState:function(){return{tokenize:a,currentIndent:0,doInCurrentLine:!1,hasPassedFirstStage:!1}},token:function(t,e){return t.sol()&&(e.doInCurrentLine=0),e.tokenize(t,e)},indent:function(t,e,r){var n=e.replace(/^\s+|\s+$/g,"");return n.match(l)||n.match(f)||n.match(/(\[])/)?r.unit*(t.currentIndent-1):t.currentIndent<0?0:t.currentIndent*r.unit},languageData:{indentOnInut:S(),commentTokens:{line:"%",block:{open:"/*",close:"*/"}}}};export{w as oz};
