var n=["and","as","block","endblock","by","cycle","debug","else","elif","extends","filter","endfilter","firstof","do","for","endfor","if","endif","ifchanged","endifchanged","ifequal","endifequal","ifnotequal","set","raw","endraw","endifnotequal","in","include","load","not","now","or","parsed","regroup","reversed","spaceless","call","endcall","macro","endmacro","endspaceless","ssi","templatetag","openblock","closeblock","openvariable","closevariable","without","context","openbrace","closebrace","opencomment","closecomment","widthratio","url","with","endwith","get_current_language","trans","endtrans","noop","blocktrans","endblocktrans","get_available_languages","get_current_language_bidi","pluralize","autoescape","endautoescape"],o=/^[+\-*&%=<>!?|~^]/,c=/^[:\[\(\{]/,i=["true","false"],r=/^(\d[+\-\*\/])?\d+(\.\d+)?/;n=new RegExp("(("+n.join(")|(")+"))\\b"),i=new RegExp("(("+i.join(")|(")+"))\\b");function s(e,t){var a=e.peek();if(t.incomment)return e.skipTo("#}")?(e.eatWhile(/\#|}/),t.incomment=!1):e.skipToEnd(),"comment";if(t.intag){if(t.operator){if(t.operator=!1,e.match(i))return"atom";if(e.match(r))return"number"}if(t.sign){if(t.sign=!1,e.match(i))return"atom";if(e.match(r))return"number"}if(t.instring)return a==t.instring&&(t.instring=!1),e.next(),"string";if(a=="'"||a=='"')return t.instring=a,e.next(),"string";if(t.inbraces>0&&a==")")e.next(),t.inbraces--;else if(a=="(")e.next(),t.inbraces++;else if(t.inbrackets>0&&a=="]")e.next(),t.inbrackets--;else if(a=="[")e.next(),t.inbrackets++;else{if(!t.lineTag&&(e.match(t.intag+"}")||e.eat("-")&&e.match(t.intag+"}")))return t.intag=!1,"tag";if(e.match(o))return t.operator=!0,"operator";if(e.match(c))t.sign=!0;else{if(e.column()==1&&t.lineTag&&e.match(n))return"keyword";if(e.eat(" ")||e.sol()){if(e.match(n))return"keyword";if(e.match(i))return"atom";if(e.match(r))return"number";e.sol()&&e.next()}else e.next()}}return"variable"}else if(e.eat("{")){if(e.eat("#"))return t.incomment=!0,e.skipTo("#}")?(e.eatWhile(/\#|}/),t.incomment=!1):e.skipToEnd(),"comment";if(a=e.eat(/\{|%/))return t.intag=a,t.inbraces=0,t.inbrackets=0,a=="{"&&(t.intag="}"),e.eat("-"),"tag"}else if(e.eat("#")){if(e.peek()=="#")return e.skipToEnd(),"comment";if(!e.eol())return t.intag=!0,t.lineTag=!0,t.inbraces=0,t.inbrackets=0,"tag"}e.next()}const l={name:"jinja2",startState:function(){return{tokenize:s,inbrackets:0,inbraces:0}},token:function(e,t){var a=t.tokenize(e,t);return e.eol()&&t.lineTag&&!t.instring&&t.inbraces==0&&t.inbrackets==0&&(t.intag=!1,t.lineTag=!1),a},languageData:{commentTokens:{block:{open:"{#",close:"#}",line:"##"}}}};export{l as jinja2};
