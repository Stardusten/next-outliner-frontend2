function R(O){for(var E={},T=O.split(" "),I=0;I<T.length;++I)E[T[I]]=!0;return E}var e="ABS ACOS ARITY ASIN ATAN AVG BAGSIZE BINSTORAGE BLOOM BUILDBLOOM CBRT CEIL CONCAT COR COS COSH COUNT COUNT_STAR COV CONSTANTSIZE CUBEDIMENSIONS DIFF DISTINCT DOUBLEABS DOUBLEAVG DOUBLEBASE DOUBLEMAX DOUBLEMIN DOUBLEROUND DOUBLESUM EXP FLOOR FLOATABS FLOATAVG FLOATMAX FLOATMIN FLOATROUND FLOATSUM GENERICINVOKER INDEXOF INTABS INTAVG INTMAX INTMIN INTSUM INVOKEFORDOUBLE INVOKEFORFLOAT INVOKEFORINT INVOKEFORLONG INVOKEFORSTRING INVOKER ISEMPTY JSONLOADER JSONMETADATA JSONSTORAGE LAST_INDEX_OF LCFIRST LOG LOG10 LOWER LONGABS LONGAVG LONGMAX LONGMIN LONGSUM MAX MIN MAPSIZE MONITOREDUDF NONDETERMINISTIC OUTPUTSCHEMA  PIGSTORAGE PIGSTREAMING RANDOM REGEX_EXTRACT REGEX_EXTRACT_ALL REPLACE ROUND SIN SINH SIZE SQRT STRSPLIT SUBSTRING SUM STRINGCONCAT STRINGMAX STRINGMIN STRINGSIZE TAN TANH TOBAG TOKENIZE TOMAP TOP TOTUPLE TRIM TEXTLOADER TUPLESIZE UCFIRST UPPER UTF8STORAGECONVERTER ",r="VOID IMPORT RETURNS DEFINE LOAD FILTER FOREACH ORDER CUBE DISTINCT COGROUP JOIN CROSS UNION SPLIT INTO IF OTHERWISE ALL AS BY USING INNER OUTER ONSCHEMA PARALLEL PARTITION GROUP AND OR NOT GENERATE FLATTEN ASC DESC IS STREAM THROUGH STORE MAPREDUCE SHIP CACHE INPUT OUTPUT STDERROR STDIN STDOUT LIMIT SAMPLE LEFT RIGHT FULL EQ GT LT GTE LTE NEQ MATCHES TRUE FALSE DUMP",L="BOOLEAN INT LONG FLOAT DOUBLE CHARARRAY BYTEARRAY BAG TUPLE MAP ",U=R(e),C=R(r),G=R(L),A=/[*+\-%<>=&?:\/!|]/;function n(O,E,T){return E.tokenize=T,T(O,E)}function a(O,E){for(var T=!1,I;I=O.next();){if(I=="/"&&T){E.tokenize=S;break}T=I=="*"}return"comment"}function o(O){return function(E,T){for(var I=!1,N,t=!1;(N=E.next())!=null;){if(N==O&&!I){t=!0;break}I=!I&&N=="\\"}return(t||!I)&&(T.tokenize=S),"error"}}function S(O,E){var T=O.next();return T=='"'||T=="'"?n(O,E,o(T)):/[\[\]{}\(\),;\.]/.test(T)?null:/\d/.test(T)?(O.eatWhile(/[\w\.]/),"number"):T=="/"?O.eat("*")?n(O,E,a):(O.eatWhile(A),"operator"):T=="-"?O.eat("-")?(O.skipToEnd(),"comment"):(O.eatWhile(A),"operator"):A.test(T)?(O.eatWhile(A),"operator"):(O.eatWhile(/[\w\$_]/),C.propertyIsEnumerable(O.current().toUpperCase())&&!O.eat(")")&&!O.eat(".")?"keyword":U.propertyIsEnumerable(O.current().toUpperCase())?"builtin":G.propertyIsEnumerable(O.current().toUpperCase())?"type":"variable")}const M={name:"pig",startState:function(){return{tokenize:S,startOfLine:!0}},token:function(O,E){if(O.eatSpace())return null;var T=E.tokenize(O,E);return T},languageData:{autocomplete:(e+L+r).split(" ")}};export{M as pig};
