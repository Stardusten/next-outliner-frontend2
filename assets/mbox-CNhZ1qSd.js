var i=["From","Sender","Reply-To","To","Cc","Bcc","Message-ID","In-Reply-To","References","Resent-From","Resent-Sender","Resent-To","Resent-Cc","Resent-Bcc","Resent-Message-ID","Return-Path","Received"],o=["Date","Subject","Comments","Keywords","Resent-Date"],d=/^[ \t]/,m=/^From /,s=new RegExp("^("+i.join("|")+"): "),c=new RegExp("^("+o.join("|")+"): "),u=/^[^:]+:/,l=/^[^ ]+@[^ ]+/,h=/^.*?(?=[^ ]+?@[^ ]+)/,p=/^<.*?>/,R=/^.*?(?=<.*>)/;function f(e){return e==="Subject"?"header":"string"}function H(e,n){if(e.sol()){if(n.inSeparator=!1,n.inHeader&&e.match(d))return null;if(n.inHeader=!1,n.header=null,e.match(m))return n.inHeaders=!0,n.inSeparator=!0,"atom";var t,r=!1;return(t=e.match(c))||(r=!0)&&(t=e.match(s))?(n.inHeaders=!0,n.inHeader=!0,n.emailPermitted=r,n.header=t[1],"atom"):n.inHeaders&&(t=e.match(u))?(n.inHeader=!0,n.emailPermitted=!0,n.header=t[1],"atom"):(n.inHeaders=!1,e.skipToEnd(),null)}if(n.inSeparator)return e.match(l)?"link":(e.match(h)||e.skipToEnd(),"atom");if(n.inHeader){var a=f(n.header);if(n.emailPermitted){if(e.match(p))return a+" link";if(e.match(R))return a}return e.skipToEnd(),a}return e.skipToEnd(),null}const S={name:"mbox",startState:function(){return{inSeparator:!1,inHeader:!1,emailPermitted:!1,header:null,inHeaders:!1}},token:H,blankLine:function(e){e.inHeaders=e.inSeparator=e.inHeader=!1},languageData:{autocomplete:i.concat(o)}};export{S as mbox};
