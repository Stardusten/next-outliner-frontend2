function o(e){return new RegExp("^(("+e.join(")|(")+"))\\b","i")}var a=new RegExp("^[\\+\\-\\*/&#!_?\\\\<>=\\'\\[\\]]"),r=new RegExp("^(('=)|(<=)|(>=)|('>)|('<)|([[)|(]])|(^$))"),n=new RegExp("^[\\.,:]"),c=new RegExp("[()]"),m=new RegExp("^[%A-Za-z][A-Za-z0-9]*"),d=["break","close","do","else","for","goto","halt","hang","if","job","kill","lock","merge","new","open","quit","read","set","tcommit","trollback","tstart","use","view","write","xecute","b","c","d","e","f","g","h","i","j","k","l","m","n","o","q","r","s","tc","tro","ts","u","v","w","x"],i=["\\$ascii","\\$char","\\$data","\\$ecode","\\$estack","\\$etrap","\\$extract","\\$find","\\$fnumber","\\$get","\\$horolog","\\$io","\\$increment","\\$job","\\$justify","\\$length","\\$name","\\$next","\\$order","\\$piece","\\$qlength","\\$qsubscript","\\$query","\\$quit","\\$random","\\$reverse","\\$select","\\$stack","\\$test","\\$text","\\$translate","\\$view","\\$x","\\$y","\\$a","\\$c","\\$d","\\$e","\\$ec","\\$es","\\$et","\\$f","\\$fn","\\$g","\\$h","\\$i","\\$j","\\$l","\\$n","\\$na","\\$o","\\$p","\\$q","\\$ql","\\$qs","\\$r","\\$re","\\$s","\\$st","\\$t","\\$tr","\\$v","\\$z"],l=o(i),s=o(d);function u(e,t){e.sol()&&(t.label=!0,t.commandMode=0);var $=e.peek();return $==" "||$=="	"?(t.label=!1,t.commandMode==0?t.commandMode=1:(t.commandMode<0||t.commandMode==2)&&(t.commandMode=0)):$!="."&&t.commandMode>0&&($==":"?t.commandMode=-1:t.commandMode=2),($==="("||$==="	")&&(t.label=!1),$===";"?(e.skipToEnd(),"comment"):e.match(/^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?/)?"number":$=='"'?e.skipTo('"')?(e.next(),"string"):(e.skipToEnd(),"error"):e.match(r)||e.match(a)?"operator":e.match(n)?null:c.test($)?(e.next(),"bracket"):t.commandMode>0&&e.match(s)?"controlKeyword":e.match(l)?"builtin":e.match(m)?"variable":$==="$"||$==="^"?(e.next(),"builtin"):$==="@"?(e.next(),"string.special"):/[\w%]/.test($)?(e.eatWhile(/[\w%]/),"variable"):(e.next(),"error")}const p={name:"mumps",startState:function(){return{label:!1,commandMode:0}},token:function(e,t){var $=u(e,t);return t.label?"tag":$}};export{p as mumps};
