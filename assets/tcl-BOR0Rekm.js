function f(t){for(var r={},a=t.split(" "),e=0;e<a.length;++e)r[a[e]]=!0;return r}var c=f("Tcl safe after append array auto_execok auto_import auto_load auto_mkindex auto_mkindex_old auto_qualify auto_reset bgerror binary break catch cd close concat continue dde eof encoding error eval exec exit expr fblocked fconfigure fcopy file fileevent filename filename flush for foreach format gets glob global history http if incr info interp join lappend lindex linsert list llength load lrange lreplace lsearch lset lsort memory msgcat namespace open package parray pid pkg::create pkg_mkIndex proc puts pwd re_syntax read regex regexp registry regsub rename resource return scan seek set socket source split string subst switch tcl_endOfWord tcl_findLibrary tcl_startOfNextWord tcl_wordBreakAfter tcl_startOfPreviousWord tcl_wordBreakBefore tcltest tclvars tell time trace unknown unset update uplevel upvar variable vwait"),u=f("if elseif else and not or eq ne in ni for foreach while switch"),s=/[+\-*&%=<>!?^\/\|]/;function i(t,r,a){return r.tokenize=a,a(t,r)}function o(t,r){var a=r.beforeParams;r.beforeParams=!1;var e=t.next();if((e=='"'||e=="'")&&r.inParams)return i(t,r,m(e));if(/[\[\]{}\(\),;\.]/.test(e))return e=="("&&a?r.inParams=!0:e==")"&&(r.inParams=!1),null;if(/\d/.test(e))return t.eatWhile(/[\w\.]/),"number";if(e=="#")return t.eat("*")?i(t,r,p):e=="#"&&t.match(/ *\[ *\[/)?i(t,r,d):(t.skipToEnd(),"comment");if(e=='"')return t.skipTo(/"/),"comment";if(e=="$")return t.eatWhile(/[$_a-z0-9A-Z\.{:]/),t.eatWhile(/}/),r.beforeParams=!0,"builtin";if(s.test(e))return t.eatWhile(s),"comment";t.eatWhile(/[\w\$_{}\xa1-\uffff]/);var n=t.current().toLowerCase();return c.propertyIsEnumerable(n)?"keyword":u.propertyIsEnumerable(n)?(r.beforeParams=!0,"keyword"):null}function m(t){return function(r,a){for(var e=!1,n,l=!1;(n=r.next())!=null;){if(n==t&&!e){l=!0;break}e=!e&&n=="\\"}return l&&(a.tokenize=o),"string"}}function p(t,r){for(var a=!1,e;e=t.next();){if(e=="#"&&a){r.tokenize=o;break}a=e=="*"}return"comment"}function d(t,r){for(var a=0,e;e=t.next();){if(e=="#"&&a==2){r.tokenize=o;break}e=="]"?a++:e!=" "&&(a=0)}return"meta"}const k={name:"tcl",startState:function(){return{tokenize:o,beforeParams:!1,inParams:!1}},token:function(t,r){return t.eatSpace()?null:r.tokenize(t,r)},languageData:{commentTokens:{line:"#"}}};export{k as tcl};