var l={"+":["conjugate","add"],"\u2212":["negate","subtract"],"\xD7":["signOf","multiply"],"\xF7":["reciprocal","divide"],"\u2308":["ceiling","greaterOf"],"\u230A":["floor","lesserOf"],"\u2223":["absolute","residue"],"\u2373":["indexGenerate","indexOf"],"?":["roll","deal"],"\u22C6":["exponentiate","toThePowerOf"],"\u235F":["naturalLog","logToTheBase"],"\u25CB":["piTimes","circularFuncs"],"!":["factorial","binomial"],"\u2339":["matrixInverse","matrixDivide"],"<":[null,"lessThan"],"\u2264":[null,"lessThanOrEqual"],"=":[null,"equals"],">":[null,"greaterThan"],"\u2265":[null,"greaterThanOrEqual"],"\u2260":[null,"notEqual"],"\u2261":["depth","match"],"\u2262":[null,"notMatch"],"\u2208":["enlist","membership"],"\u2377":[null,"find"],"\u222A":["unique","union"],"\u2229":[null,"intersection"],"\u223C":["not","without"],"\u2228":[null,"or"],"\u2227":[null,"and"],"\u2371":[null,"nor"],"\u2372":[null,"nand"],"\u2374":["shapeOf","reshape"],",":["ravel","catenate"],"\u236A":[null,"firstAxisCatenate"],"\u233D":["reverse","rotate"],"\u2296":["axis1Reverse","axis1Rotate"],"\u2349":["transpose",null],"\u2191":["first","take"],"\u2193":[null,"drop"],"\u2282":["enclose","partitionWithAxis"],"\u2283":["diclose","pick"],"\u2337":[null,"index"],"\u234B":["gradeUp",null],"\u2352":["gradeDown",null],"\u22A4":["encode",null],"\u22A5":["decode",null],"\u2355":["format","formatByExample"],"\u234E":["execute",null],"\u22A3":["stop","left"],"\u22A2":["pass","right"]},a=/[\.\/⌿⍀¨⍣]/,r=/⍬/,i=/[\+−×÷⌈⌊∣⍳\?⋆⍟○!⌹<≤=>≥≠≡≢∈⍷∪∩∼∨∧⍱⍲⍴,⍪⌽⊖⍉↑↓⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢]/,u=/←/,o=/[⍝#].*$/,s=function(n){var t;return t=!1,function(e){return t=e,e===n?t==="\\":!0}};const c={name:"apl",startState:function(){return{prev:!1,func:!1,op:!1,string:!1,escape:!1}},token:function(n,t){var e;return n.eatSpace()?null:(e=n.next(),e==='"'||e==="'"?(n.eatWhile(s(e)),n.next(),t.prev=!0,"string"):/[\[{\(]/.test(e)?(t.prev=!1,null):/[\]}\)]/.test(e)?(t.prev=!0,null):r.test(e)?(t.prev=!1,"atom"):/[¯\d]/.test(e)?(t.func?(t.func=!1,t.prev=!1):t.prev=!0,n.eatWhile(/[\w\.]/),"number"):a.test(e)||u.test(e)?"operator":i.test(e)?(t.func=!0,t.prev=!1,l[e]?"variableName.function.standard":"variableName.function"):o.test(e)?(n.skipToEnd(),"comment"):e==="\u2218"&&n.peek()==="."?(n.next(),"variableName.function"):(n.eatWhile(/[\w\$_]/),t.prev=!0,"keyword"))}};export{c as apl};