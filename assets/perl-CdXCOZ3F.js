function l(t,r){return t.string.charAt(t.pos+(r||0))}function g(t,r){if(r){var i=t.pos-r;return t.string.substr(i>=0?i:0,r)}else return t.string.substr(0,t.pos-1)}function c(t,r){var i=t.string.length,$=i-t.pos+1;return t.string.substr(t.pos,r&&r<i?r:$)}function u(t,r){var i=t.pos+r,$;i<=0?t.pos=0:i>=($=t.string.length-1)?t.pos=$:t.pos=i}var R={"->":4,"++":4,"--":4,"**":4,"=~":4,"!~":4,"*":4,"/":4,"%":4,x:4,"+":4,"-":4,".":4,"<<":4,">>":4,"<":4,">":4,"<=":4,">=":4,lt:4,gt:4,le:4,ge:4,"==":4,"!=":4,"<=>":4,eq:4,ne:4,cmp:4,"~~":4,"&":4,"|":4,"^":4,"&&":4,"||":4,"//":4,"..":4,"...":4,"?":4,":":4,"=":4,"+=":4,"-=":4,"*=":4,",":4,"=>":4,"::":4,not:4,and:4,or:4,xor:4,BEGIN:[5,1],END:[5,1],PRINT:[5,1],PRINTF:[5,1],GETC:[5,1],READ:[5,1],READLINE:[5,1],DESTROY:[5,1],TIE:[5,1],TIEHANDLE:[5,1],UNTIE:[5,1],STDIN:5,STDIN_TOP:5,STDOUT:5,STDOUT_TOP:5,STDERR:5,STDERR_TOP:5,$ARG:5,$_:5,"@ARG":5,"@_":5,$LIST_SEPARATOR:5,'$"':5,$PROCESS_ID:5,$PID:5,$$:5,$REAL_GROUP_ID:5,$GID:5,"$(":5,$EFFECTIVE_GROUP_ID:5,$EGID:5,"$)":5,$PROGRAM_NAME:5,$0:5,$SUBSCRIPT_SEPARATOR:5,$SUBSEP:5,"$;":5,$REAL_USER_ID:5,$UID:5,"$<":5,$EFFECTIVE_USER_ID:5,$EUID:5,"$>":5,$a:5,$b:5,$COMPILING:5,"$^C":5,$DEBUGGING:5,"$^D":5,"${^ENCODING}":5,$ENV:5,"%ENV":5,$SYSTEM_FD_MAX:5,"$^F":5,"@F":5,"${^GLOBAL_PHASE}":5,"$^H":5,"%^H":5,"@INC":5,"%INC":5,$INPLACE_EDIT:5,"$^I":5,"$^M":5,$OSNAME:5,"$^O":5,"${^OPEN}":5,$PERLDB:5,"$^P":5,$SIG:5,"%SIG":5,$BASETIME:5,"$^T":5,"${^TAINT}":5,"${^UNICODE}":5,"${^UTF8CACHE}":5,"${^UTF8LOCALE}":5,$PERL_VERSION:5,"$^V":5,"${^WIN32_SLOPPY_STAT}":5,$EXECUTABLE_NAME:5,"$^X":5,$1:5,$MATCH:5,"$&":5,"${^MATCH}":5,$PREMATCH:5,"$`":5,"${^PREMATCH}":5,$POSTMATCH:5,"$'":5,"${^POSTMATCH}":5,$LAST_PAREN_MATCH:5,"$+":5,$LAST_SUBMATCH_RESULT:5,"$^N":5,"@LAST_MATCH_END":5,"@+":5,"%LAST_PAREN_MATCH":5,"%+":5,"@LAST_MATCH_START":5,"@-":5,"%LAST_MATCH_START":5,"%-":5,$LAST_REGEXP_CODE_RESULT:5,"$^R":5,"${^RE_DEBUG_FLAGS}":5,"${^RE_TRIE_MAXBUF}":5,$ARGV:5,"@ARGV":5,ARGV:5,ARGVOUT:5,$OUTPUT_FIELD_SEPARATOR:5,$OFS:5,"$,":5,$INPUT_LINE_NUMBER:5,$NR:5,"$.":5,$INPUT_RECORD_SEPARATOR:5,$RS:5,"$/":5,$OUTPUT_RECORD_SEPARATOR:5,$ORS:5,"$\\":5,$OUTPUT_AUTOFLUSH:5,"$|":5,$ACCUMULATOR:5,"$^A":5,$FORMAT_FORMFEED:5,"$^L":5,$FORMAT_PAGE_NUMBER:5,"$%":5,$FORMAT_LINES_LEFT:5,"$-":5,$FORMAT_LINE_BREAK_CHARACTERS:5,"$:":5,$FORMAT_LINES_PER_PAGE:5,"$=":5,$FORMAT_TOP_NAME:5,"$^":5,$FORMAT_NAME:5,"$~":5,"${^CHILD_ERROR_NATIVE}":5,$EXTENDED_OS_ERROR:5,"$^E":5,$EXCEPTIONS_BEING_CAUGHT:5,"$^S":5,$WARNING:5,"$^W":5,"${^WARNING_BITS}":5,$OS_ERROR:5,$ERRNO:5,"$!":5,"%OS_ERROR":5,"%ERRNO":5,"%!":5,$CHILD_ERROR:5,"$?":5,$EVAL_ERROR:5,"$@":5,$OFMT:5,"$#":5,"$*":5,$ARRAY_BASE:5,"$[":5,$OLD_PERL_VERSION:5,"$]":5,if:[1,1],elsif:[1,1],else:[1,1],while:[1,1],unless:[1,1],for:[1,1],foreach:[1,1],abs:1,accept:1,alarm:1,atan2:1,bind:1,binmode:1,bless:1,bootstrap:1,break:1,caller:1,chdir:1,chmod:1,chomp:1,chop:1,chown:1,chr:1,chroot:1,close:1,closedir:1,connect:1,continue:[1,1],cos:1,crypt:1,dbmclose:1,dbmopen:1,default:1,defined:1,delete:1,die:1,do:1,dump:1,each:1,endgrent:1,endhostent:1,endnetent:1,endprotoent:1,endpwent:1,endservent:1,eof:1,eval:1,exec:1,exists:1,exit:1,exp:1,fcntl:1,fileno:1,flock:1,fork:1,format:1,formline:1,getc:1,getgrent:1,getgrgid:1,getgrnam:1,gethostbyaddr:1,gethostbyname:1,gethostent:1,getlogin:1,getnetbyaddr:1,getnetbyname:1,getnetent:1,getpeername:1,getpgrp:1,getppid:1,getpriority:1,getprotobyname:1,getprotobynumber:1,getprotoent:1,getpwent:1,getpwnam:1,getpwuid:1,getservbyname:1,getservbyport:1,getservent:1,getsockname:1,getsockopt:1,given:1,glob:1,gmtime:1,goto:1,grep:1,hex:1,import:1,index:1,int:1,ioctl:1,join:1,keys:1,kill:1,last:1,lc:1,lcfirst:1,length:1,link:1,listen:1,local:2,localtime:1,lock:1,log:1,lstat:1,m:null,map:1,mkdir:1,msgctl:1,msgget:1,msgrcv:1,msgsnd:1,my:2,new:1,next:1,no:1,oct:1,open:1,opendir:1,ord:1,our:2,pack:1,package:1,pipe:1,pop:1,pos:1,print:1,printf:1,prototype:1,push:1,q:null,qq:null,qr:null,quotemeta:null,qw:null,qx:null,rand:1,read:1,readdir:1,readline:1,readlink:1,readpipe:1,recv:1,redo:1,ref:1,rename:1,require:1,reset:1,return:1,reverse:1,rewinddir:1,rindex:1,rmdir:1,s:null,say:1,scalar:1,seek:1,seekdir:1,select:1,semctl:1,semget:1,semop:1,send:1,setgrent:1,sethostent:1,setnetent:1,setpgrp:1,setpriority:1,setprotoent:1,setpwent:1,setservent:1,setsockopt:1,shift:1,shmctl:1,shmget:1,shmread:1,shmwrite:1,shutdown:1,sin:1,sleep:1,socket:1,socketpair:1,sort:1,splice:1,split:1,sprintf:1,sqrt:1,srand:1,stat:1,state:1,study:1,sub:1,substr:1,symlink:1,syscall:1,sysopen:1,sysread:1,sysseek:1,system:1,syswrite:1,tell:1,telldir:1,tie:1,tied:1,time:1,times:1,tr:null,truncate:1,uc:1,ucfirst:1,umask:1,undef:1,unlink:1,unpack:1,unshift:1,untie:1,use:1,utime:1,values:1,vec:1,wait:1,waitpid:1,wantarray:1,warn:1,when:1,write:1,y:null},a="string.special",o=/[goseximacplud]/;function s(t,r,i,$,f){return r.chain=null,r.style=null,r.tail=null,r.tokenize=function(e,E){for(var T=!1,_,p=0;_=e.next();){if(_===i[p]&&!T)return i[++p]!==void 0?(E.chain=i[p],E.style=$,E.tail=f):f&&e.eatWhile(f),E.tokenize=n,$;T=!T&&_=="\\"}return $},r.tokenize(t,r)}function A(t,r,i){return r.tokenize=function($,f){return $.string==i&&(f.tokenize=n),$.skipToEnd(),"string"},r.tokenize(t,r)}function n(t,r){if(t.eatSpace())return null;if(r.chain)return s(t,r,r.chain,r.style,r.tail);if(t.match(/^(\-?((\d[\d_]*)?\.\d+(e[+-]?\d+)?|\d+\.\d*)|0x[\da-fA-F_]+|0b[01_]+|\d[\d_]*(e[+-]?\d+)?)/))return"number";if(t.match(/^<<(?=[_a-zA-Z])/))return t.eatWhile(/\w/),A(t,r,t.current().substr(2));if(t.sol()&&t.match(/^\=item(?!\w)/))return A(t,r,"=cut");var i=t.next();if(i=='"'||i=="'"){if(g(t,3)=="<<"+i){var $=t.pos;t.eatWhile(/\w/);var f=t.current().substr(1);if(f&&t.eat(i))return A(t,r,f);t.pos=$}return s(t,r,[i],"string")}if(i=="q"){var e=l(t,-2);if(!(e&&/\w/.test(e))){if(e=l(t,0),e=="x"){if(e=l(t,1),e=="(")return u(t,2),s(t,r,[")"],a,o);if(e=="[")return u(t,2),s(t,r,["]"],a,o);if(e=="{")return u(t,2),s(t,r,["}"],a,o);if(e=="<")return u(t,2),s(t,r,[">"],a,o);if(/[\^'"!~\/]/.test(e))return u(t,1),s(t,r,[t.eat(e)],a,o)}else if(e=="q"){if(e=l(t,1),e=="(")return u(t,2),s(t,r,[")"],"string");if(e=="[")return u(t,2),s(t,r,["]"],"string");if(e=="{")return u(t,2),s(t,r,["}"],"string");if(e=="<")return u(t,2),s(t,r,[">"],"string");if(/[\^'"!~\/]/.test(e))return u(t,1),s(t,r,[t.eat(e)],"string")}else if(e=="w"){if(e=l(t,1),e=="(")return u(t,2),s(t,r,[")"],"bracket");if(e=="[")return u(t,2),s(t,r,["]"],"bracket");if(e=="{")return u(t,2),s(t,r,["}"],"bracket");if(e=="<")return u(t,2),s(t,r,[">"],"bracket");if(/[\^'"!~\/]/.test(e))return u(t,1),s(t,r,[t.eat(e)],"bracket")}else if(e=="r"){if(e=l(t,1),e=="(")return u(t,2),s(t,r,[")"],a,o);if(e=="[")return u(t,2),s(t,r,["]"],a,o);if(e=="{")return u(t,2),s(t,r,["}"],a,o);if(e=="<")return u(t,2),s(t,r,[">"],a,o);if(/[\^'"!~\/]/.test(e))return u(t,1),s(t,r,[t.eat(e)],a,o)}else if(/[\^'"!~\/(\[{<]/.test(e)){if(e=="(")return u(t,1),s(t,r,[")"],"string");if(e=="[")return u(t,1),s(t,r,["]"],"string");if(e=="{")return u(t,1),s(t,r,["}"],"string");if(e=="<")return u(t,1),s(t,r,[">"],"string");if(/[\^'"!~\/]/.test(e))return s(t,r,[t.eat(e)],"string")}}}if(i=="m"){var e=l(t,-2);if(!(e&&/\w/.test(e))&&(e=t.eat(/[(\[{<\^'"!~\/]/),e)){if(/[\^'"!~\/]/.test(e))return s(t,r,[e],a,o);if(e=="(")return s(t,r,[")"],a,o);if(e=="[")return s(t,r,["]"],a,o);if(e=="{")return s(t,r,["}"],a,o);if(e=="<")return s(t,r,[">"],a,o)}}if(i=="s"){var e=/[\/>\]})\w]/.test(l(t,-2));if(!e&&(e=t.eat(/[(\[{<\^'"!~\/]/),e))return e=="["?s(t,r,["]","]"],a,o):e=="{"?s(t,r,["}","}"],a,o):e=="<"?s(t,r,[">",">"],a,o):e=="("?s(t,r,[")",")"],a,o):s(t,r,[e,e],a,o)}if(i=="y"){var e=/[\/>\]})\w]/.test(l(t,-2));if(!e&&(e=t.eat(/[(\[{<\^'"!~\/]/),e))return e=="["?s(t,r,["]","]"],a,o):e=="{"?s(t,r,["}","}"],a,o):e=="<"?s(t,r,[">",">"],a,o):e=="("?s(t,r,[")",")"],a,o):s(t,r,[e,e],a,o)}if(i=="t"){var e=/[\/>\]})\w]/.test(l(t,-2));if(!e&&(e=t.eat("r"),e&&(e=t.eat(/[(\[{<\^'"!~\/]/),e)))return e=="["?s(t,r,["]","]"],a,o):e=="{"?s(t,r,["}","}"],a,o):e=="<"?s(t,r,[">",">"],a,o):e=="("?s(t,r,[")",")"],a,o):s(t,r,[e,e],a,o)}if(i=="`")return s(t,r,[i],"builtin");if(i=="/")return/~\s*$/.test(g(t))?s(t,r,[i],a,o):"operator";if(i=="$"){var $=t.pos;if(t.eatWhile(/\d/)||t.eat("{")&&t.eatWhile(/\d/)&&t.eat("}"))return"builtin";t.pos=$}if(/[$@%]/.test(i)){var $=t.pos;if(t.eat("^")&&t.eat(/[A-Z]/)||!/[@$%&]/.test(l(t,-2))&&t.eat(/[=|\\\-#?@;:&`~\^!\[\]*'"$+.,\/<>()]/)){var e=t.current();if(R[e])return"builtin"}t.pos=$}if(/[$@%&]/.test(i)&&(t.eatWhile(/[\w$]/)||t.eat("{")&&t.eatWhile(/[\w$]/)&&t.eat("}"))){var e=t.current();return R[e]?"builtin":"variable"}if(i=="#"&&l(t,-2)!="$")return t.skipToEnd(),"comment";if(/[:+\-\^*$&%@=<>!?|\/~\.]/.test(i)){var $=t.pos;if(t.eatWhile(/[:+\-\^*$&%@=<>!?|\/~\.]/),R[t.current()])return"operator";t.pos=$}if(i=="_"&&t.pos==1){if(c(t,6)=="_END__")return s(t,r,["\0"],"comment");if(c(t,7)=="_DATA__")return s(t,r,["\0"],"builtin");if(c(t,7)=="_C__")return s(t,r,["\0"],"string")}if(/\w/.test(i)){var $=t.pos;if(l(t,-2)=="{"&&(l(t,0)=="}"||t.eatWhile(/\w/)&&l(t,0)=="}"))return"string";t.pos=$}if(/[A-Z]/.test(i)){var E=l(t,-2),$=t.pos;if(t.eatWhile(/[A-Z_]/),/[\da-z]/.test(l(t,0)))t.pos=$;else{var e=R[t.current()];return e?(e[1]&&(e=e[0]),E!=":"?e==1?"keyword":e==2?"def":e==3?"atom":e==4?"operator":e==5?"builtin":"meta":"meta"):"meta"}}if(/[a-zA-Z_]/.test(i)){var E=l(t,-2);t.eatWhile(/\w/);var e=R[t.current()];return e?(e[1]&&(e=e[0]),E!=":"?e==1?"keyword":e==2?"def":e==3?"atom":e==4?"operator":e==5?"builtin":"meta":"meta"):"meta"}return null}const d={name:"perl",startState:function(){return{tokenize:n,chain:null,style:null,tail:null}},token:function(t,r){return(r.tokenize||n)(t,r)},languageData:{commentTokens:{line:"#"},wordChars:"$"}};export{d as perl};
