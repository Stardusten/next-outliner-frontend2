const l={name:"properties",token:function(n,t){var o=n.sol()||t.afterSection,i=n.eol();if(t.afterSection=!1,o&&(t.nextMultiline?(t.inMultiline=!0,t.nextMultiline=!1):t.position="def"),i&&!t.nextMultiline&&(t.inMultiline=!1,t.position="def"),o)for(;n.eatSpace(););var e=n.next();return o&&(e==="#"||e==="!"||e===";")?(t.position="comment",n.skipToEnd(),"comment"):o&&e==="["?(t.afterSection=!0,n.skipTo("]"),n.eat("]"),"header"):e==="="||e===":"?(t.position="quote",null):(e==="\\"&&t.position==="quote"&&n.eol()&&(t.nextMultiline=!0),t.position)},startState:function(){return{position:"def",nextMultiline:!1,inMultiline:!1,afterSection:!1}}};export{l as properties};
