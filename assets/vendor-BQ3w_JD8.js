const fo=(i,e)=>i===e,Lt=Symbol("solid-proxy"),Us=Symbol("solid-track"),ds={equals:fo};let lr=pr;const vt=1,ps=2,hr={owned:null,cleanups:null,context:null,owner:null};var x=null;let Ds=null,mo=null,D=null,J=null,et=null,Ts=0;function fi(i,e){const t=D,n=x,s=i.length===0,r=e===void 0?n:e,o=s?hr:{owned:null,cleanups:null,context:r?r.context:null,owner:r},l=s?i:()=>i(()=>tt(()=>Ai(o)));x=o,D=null;try{return Ft(l,!0)}finally{D=t,x=n}}function Ma(i,e){e=e?Object.assign({},ds,e):ds;const t={value:i,observers:null,observerSlots:null,comparator:e.equals||void 0},n=s=>(typeof s=="function"&&(s=s(t.value)),dr(t,s));return[ur.bind(t),n]}function Si(i,e,t){const n=Ea(i,e,!1,vt);Ti(n)}function cr(i,e,t){lr=Mo;const n=Ea(i,e,!1,vt);(!t||!t.render)&&(n.user=!0),et?et.push(n):Ti(n)}function kn(i,e,t){t=t?Object.assign({},ds,t):ds;const n=Ea(i,e,!0,0);return n.observers=null,n.observerSlots=null,n.comparator=t.equals||void 0,Ti(n),ur.bind(n)}function go(i){return Ft(i,!1)}function tt(i){if(D===null)return i();const e=D;D=null;try{return i()}finally{D=e}}function Bh(i){cr(()=>tt(i))}function zs(i){return x===null||(x.cleanups===null?x.cleanups=[i]:x.cleanups.push(i)),i}function $s(){return D}function bo(){return x}function yo(i,e){const t=x,n=D;x=i,D=null;try{return Ft(e,!0)}catch(s){Sa(s)}finally{x=t,D=n}}function ur(){if(this.sources&&this.state)if(this.state===vt)Ti(this);else{const i=J;J=null,Ft(()=>ms(this),!1),J=i}if(D){const i=this.observers?this.observers.length:0;D.sources?(D.sources.push(this),D.sourceSlots.push(i)):(D.sources=[this],D.sourceSlots=[i]),this.observers?(this.observers.push(D),this.observerSlots.push(D.sources.length-1)):(this.observers=[D],this.observerSlots=[D.sources.length-1])}return this.value}function dr(i,e,t){let n=i.value;return(!i.comparator||!i.comparator(n,e))&&(i.value=e,i.observers&&i.observers.length&&Ft(()=>{for(let s=0;s<i.observers.length;s+=1){const r=i.observers[s],o=Ds&&Ds.running;o&&Ds.disposed.has(r),(o?!r.tState:!r.state)&&(r.pure?J.push(r):et.push(r),r.observers&&fr(r)),o||(r.state=vt)}if(J.length>1e6)throw J=[],new Error},!1)),e}function Ti(i){if(!i.fn)return;Ai(i);const e=Ts;vo(i,i.value,e)}function vo(i,e,t){let n;const s=x,r=D;D=x=i;try{n=i.fn(e)}catch(o){return i.pure&&(i.state=vt,i.owned&&i.owned.forEach(Ai),i.owned=null),i.updatedAt=t+1,Sa(o)}finally{D=r,x=s}(!i.updatedAt||i.updatedAt<=t)&&(i.updatedAt!=null&&"observers"in i?dr(i,n):i.value=n,i.updatedAt=t)}function Ea(i,e,t,n=vt,s){const r={fn:i,state:n,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:e,owner:x,context:x?x.context:null,pure:t};return x===null||x!==hr&&(x.owned?x.owned.push(r):x.owned=[r]),r}function fs(i){if(i.state===0)return;if(i.state===ps)return ms(i);if(i.suspense&&tt(i.suspense.inFallback))return i.suspense.effects.push(i);const e=[i];for(;(i=i.owner)&&(!i.updatedAt||i.updatedAt<Ts);)i.state&&e.push(i);for(let t=e.length-1;t>=0;t--)if(i=e[t],i.state===vt)Ti(i);else if(i.state===ps){const n=J;J=null,Ft(()=>ms(i,e[0]),!1),J=n}}function Ft(i,e){if(J)return i();let t=!1;e||(J=[]),et?t=!0:et=[],Ts++;try{const n=i();return wo(t),n}catch(n){t||(et=null),J=null,Sa(n)}}function wo(i){if(J&&(pr(J),J=null),i)return;const e=et;et=null,e.length&&Ft(()=>lr(e),!1)}function pr(i){for(let e=0;e<i.length;e++)fs(i[e])}function Mo(i){let e,t=0;for(e=0;e<i.length;e++){const n=i[e];n.user?i[t++]=n:fs(n)}for(e=0;e<t;e++)fs(i[e])}function ms(i,e){i.state=0;for(let t=0;t<i.sources.length;t+=1){const n=i.sources[t];if(n.sources){const s=n.state;s===vt?n!==e&&(!n.updatedAt||n.updatedAt<Ts)&&fs(n):s===ps&&ms(n,e)}}}function fr(i){for(let e=0;e<i.observers.length;e+=1){const t=i.observers[e];t.state||(t.state=ps,t.pure?J.push(t):et.push(t),t.observers&&fr(t))}}function Ai(i){let e;if(i.sources)for(;i.sources.length;){const t=i.sources.pop(),n=i.sourceSlots.pop(),s=t.observers;if(s&&s.length){const r=s.pop(),o=t.observerSlots.pop();n<s.length&&(r.sourceSlots[o]=n,s[n]=r,t.observerSlots[n]=o)}}if(i.tOwned){for(e=i.tOwned.length-1;e>=0;e--)Ai(i.tOwned[e]);delete i.tOwned}if(i.owned){for(e=i.owned.length-1;e>=0;e--)Ai(i.owned[e]);i.owned=null}if(i.cleanups){for(e=i.cleanups.length-1;e>=0;e--)i.cleanups[e]();i.cleanups=null}i.state=0}function Eo(i){return i instanceof Error?i:new Error(typeof i=="string"?i:"Unknown error",{cause:i})}function Sa(i,e=x){throw Eo(i)}const So=Symbol("fallback");function Na(i){for(let e=0;e<i.length;e++)i[e]()}function Ao(i,e,t={}){let n=[],s=[],r=[],o=0,l=e.length>1?[]:null;return zs(()=>Na(r)),()=>{let h=i()||[],c=h.length,f,d;return h[Us],tt(()=>{let v,E,S,A,P,O,ee,Ue,Wt;if(c===0)o!==0&&(Na(r),r=[],n=[],s=[],o=0,l&&(l=[])),t.fallback&&(n=[So],s[0]=fi(po=>(r[0]=po,t.fallback())),o=1);else if(o===0){for(s=new Array(c),d=0;d<c;d++)n[d]=h[d],s[d]=fi(m);o=c}else{for(S=new Array(c),A=new Array(c),l&&(P=new Array(c)),O=0,ee=Math.min(o,c);O<ee&&n[O]===h[O];O++);for(ee=o-1,Ue=c-1;ee>=O&&Ue>=O&&n[ee]===h[Ue];ee--,Ue--)S[Ue]=s[ee],A[Ue]=r[ee],l&&(P[Ue]=l[ee]);for(v=new Map,E=new Array(Ue+1),d=Ue;d>=O;d--)Wt=h[d],f=v.get(Wt),E[d]=f===void 0?-1:f,v.set(Wt,d);for(f=O;f<=ee;f++)Wt=n[f],d=v.get(Wt),d!==void 0&&d!==-1?(S[d]=s[f],A[d]=r[f],l&&(P[d]=l[f]),d=E[d],v.set(Wt,d)):r[f]();for(d=O;d<c;d++)d in S?(s[d]=S[d],r[d]=A[d],l&&(l[d]=P[d],l[d](d))):s[d]=fi(m);s=s.slice(0,o=c),n=h.slice(0)}return s});function m(v){if(r[d]=v,l){const[E,S]=Ma(d);return l[d]=S,e(h[d],E)}return e(h[d])}}}function Wh(i,e){return tt(()=>i(e||{}))}const Po=i=>`Stale read from <${i}>.`;function Gh(i){const e="fallback"in i&&{fallback:()=>i.fallback};return kn(Ao(()=>i.each,i.children,e||void 0))}function Uh(i){const e=i.keyed,t=kn(()=>i.when,void 0,void 0),n=e?t:kn(t,void 0,{equals:(s,r)=>!s==!r});return kn(()=>{const s=n();if(s){const r=i.children;return typeof r=="function"&&r.length>0?tt(()=>r(e?s:()=>{if(!tt(n))throw Po("Show");return t()})):r}return i.fallback},void 0,void 0)}const _o=new Set(["innerHTML","textContent","innerText","children"]),To=Object.assign(Object.create(null),{className:"class",htmlFor:"for"}),No=new Set(["beforeinput","click","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"]),ko={xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace"},zh=i=>kn(()=>i());function Do(i,e,t){let n=t.length,s=e.length,r=n,o=0,l=0,h=e[s-1].nextSibling,c=null;for(;o<s||l<r;){if(e[o]===t[l]){o++,l++;continue}for(;e[s-1]===t[r-1];)s--,r--;if(s===o){const f=r<n?l?t[l-1].nextSibling:t[r-l]:h;for(;l<r;)i.insertBefore(t[l++],f)}else if(r===l)for(;o<s;)(!c||!c.has(e[o]))&&e[o].remove(),o++;else if(e[o]===t[r-1]&&t[l]===e[s-1]){const f=e[--s].nextSibling;i.insertBefore(t[l++],e[o++].nextSibling),i.insertBefore(t[--r],f),e[s]=t[r]}else{if(!c){c=new Map;let d=l;for(;d<r;)c.set(t[d],d++)}const f=c.get(e[o]);if(f!=null)if(l<f&&f<r){let d=o,m=1,v;for(;++d<s&&d<r&&!((v=c.get(e[d]))==null||v!==f+m);)m++;if(m>f-l){const E=e[o];for(;l<f;)i.insertBefore(t[l++],E)}else i.replaceChild(t[l++],e[o++])}else o++;else e[o++].remove()}}}const ka="_$DX_DELEGATE";function $h(i,e,t,n={}){let s;return fi(r=>{s=r,e===document?i():qs(e,i(),e.firstChild?null:void 0,t)},n.owner),()=>{s(),e.textContent=""}}function Hh(i,e,t,n){let s;const r=()=>{const l=n?document.createElementNS("http://www.w3.org/1998/Math/MathML","template"):document.createElement("template");return l.innerHTML=i,t?l.content.firstChild.firstChild:n?l.firstChild:l.content.firstChild},o=e?()=>tt(()=>document.importNode(s||(s=r()),!0)):()=>(s||(s=r())).cloneNode(!0);return o.cloneNode=o,o}function Ro(i,e=window.document){const t=e[ka]||(e[ka]=new Set);for(let n=0,s=i.length;n<s;n++){const r=i[n];t.has(r)||(t.add(r),e.addEventListener(r,Go))}}function Hs(i,e,t){t==null?i.removeAttribute(e):i.setAttribute(e,t)}function Co(i,e,t,n){n==null?i.removeAttributeNS(e,t):i.setAttributeNS(e,t,n)}function Io(i,e,t){t?i.setAttribute(e,""):i.removeAttribute(e)}function xo(i,e){e==null?i.removeAttribute("class"):i.className=e}function Oo(i,e,t,n){if(n)Array.isArray(t)?(i[`$$${e}`]=t[0],i[`$$${e}Data`]=t[1]):i[`$$${e}`]=t;else if(Array.isArray(t)){const s=t[0];i.addEventListener(e,t[0]=r=>s.call(i,t[1],r))}else i.addEventListener(e,t,typeof t!="function"&&t)}function Vo(i,e,t={}){const n=Object.keys(e||{}),s=Object.keys(t);let r,o;for(r=0,o=s.length;r<o;r++){const l=s[r];!l||l==="undefined"||e[l]||(Da(i,l,!1),delete t[l])}for(r=0,o=n.length;r<o;r++){const l=n[r],h=!!e[l];!l||l==="undefined"||t[l]===h||!h||(Da(i,l,!0),t[l]=h)}return t}function Lo(i,e,t){if(!e)return t?Hs(i,"style"):e;const n=i.style;if(typeof e=="string")return n.cssText=e;typeof t=="string"&&(n.cssText=t=void 0),t||(t={}),e||(e={});let s,r;for(r in t)e[r]==null&&n.removeProperty(r),delete t[r];for(r in e)s=e[r],s!==t[r]&&(n.setProperty(r,s),t[r]=s);return t}function qh(i,e,t){t!=null?i.style.setProperty(e,t):i.style.removeProperty(e)}function jh(i,e={},t,n){const s={};return Si(()=>typeof e.ref=="function"&&Fo(e.ref,i)),Si(()=>Bo(i,e,t,!0,s,!0)),s}function Fo(i,e,t){return tt(()=>i(e,t))}function qs(i,e,t,n){if(t!==void 0&&!n&&(n=[]),typeof e!="function")return gs(i,e,n,t);Si(s=>gs(i,e(),s,t),n)}function Bo(i,e,t,n,s={},r=!1){e||(e={});for(const o in s)if(!(o in e)){if(o==="children")continue;s[o]=Ra(i,o,null,s[o],t,r,e)}for(const o in e){if(o==="children")continue;const l=e[o];s[o]=Ra(i,o,l,s[o],t,r,e)}}function Wo(i){return i.toLowerCase().replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function Da(i,e,t){const n=e.trim().split(/\s+/);for(let s=0,r=n.length;s<r;s++)i.classList.toggle(n[s],t)}function Ra(i,e,t,n,s,r,o){let l,h,c,f;if(e==="style")return Lo(i,t,n);if(e==="classList")return Vo(i,t,n);if(t===n)return n;if(e==="ref")r||t(i);else if(e.slice(0,3)==="on:"){const d=e.slice(3);n&&i.removeEventListener(d,n,typeof n!="function"&&n),t&&i.addEventListener(d,t,typeof t!="function"&&t)}else if(e.slice(0,10)==="oncapture:"){const d=e.slice(10);n&&i.removeEventListener(d,n,!0),t&&i.addEventListener(d,t,!0)}else if(e.slice(0,2)==="on"){const d=e.slice(2).toLowerCase(),m=No.has(d);if(!m&&n){const v=Array.isArray(n)?n[0]:n;i.removeEventListener(d,v)}(m||t)&&(Oo(i,d,t,m),m&&Ro([d]))}else if(e.slice(0,5)==="attr:")Hs(i,e.slice(5),t);else if(e.slice(0,5)==="bool:")Io(i,e.slice(5),t);else if((f=e.slice(0,5)==="prop:")||(c=_o.has(e))||(l=i.nodeName.includes("-")||"is"in o))f&&(e=e.slice(5),h=!0),e==="class"||e==="className"?xo(i,t):l&&!h&&!c?i[Wo(e)]=t:i[e]=t;else{const d=e.indexOf(":")>-1&&ko[e.split(":")[0]];d?Co(i,d,e,t):Hs(i,To[e]||e,t)}return t}function Go(i){let e=i.target;const t=`$$${i.type}`,n=i.target,s=i.currentTarget,r=h=>Object.defineProperty(i,"target",{configurable:!0,value:h}),o=()=>{const h=e[t];if(h&&!e.disabled){const c=e[`${t}Data`];if(c!==void 0?h.call(e,c,i):h.call(e,i),i.cancelBubble)return}return e.host&&typeof e.host!="string"&&!e.host._$host&&e.contains(i.target)&&r(e.host),!0},l=()=>{for(;o()&&(e=e._$host||e.parentNode||e.host););};if(Object.defineProperty(i,"currentTarget",{configurable:!0,get(){return e||document}}),i.composedPath){const h=i.composedPath();r(h[0]);for(let c=0;c<h.length-2&&(e=h[c],!!o());c++){if(e._$host){e=e._$host,l();break}if(e.parentNode===s)break}}else l();r(n)}function gs(i,e,t,n,s){for(;typeof t=="function";)t=t();if(e===t)return t;const r=typeof e,o=n!==void 0;if(i=o&&t[0]&&t[0].parentNode||i,r==="string"||r==="number"){if(r==="number"&&(e=e.toString(),e===t))return t;if(o){let l=t[0];l&&l.nodeType===3?l.data!==e&&(l.data=e):l=document.createTextNode(e),t=Gt(i,t,n,l)}else t!==""&&typeof t=="string"?t=i.firstChild.data=e:t=i.textContent=e}else if(e==null||r==="boolean")t=Gt(i,t,n);else{if(r==="function")return Si(()=>{let l=e();for(;typeof l=="function";)l=l();t=gs(i,l,t,n)}),()=>t;if(Array.isArray(e)){const l=[],h=t&&Array.isArray(t);if(js(l,e,t,s))return Si(()=>t=gs(i,l,t,n,!0)),()=>t;if(l.length===0){if(t=Gt(i,t,n),o)return t}else h?t.length===0?Ca(i,l,n):Do(i,t,l):(t&&Gt(i),Ca(i,l));t=l}else if(e.nodeType){if(Array.isArray(t)){if(o)return t=Gt(i,t,n,e);Gt(i,t,null,e)}else t==null||t===""||!i.firstChild?i.appendChild(e):i.replaceChild(e,i.firstChild);t=e}}return t}function js(i,e,t,n){let s=!1;for(let r=0,o=e.length;r<o;r++){let l=e[r],h=t&&t[i.length],c;if(!(l==null||l===!0||l===!1))if((c=typeof l)=="object"&&l.nodeType)i.push(l);else if(Array.isArray(l))s=js(i,l,h)||s;else if(c==="function")if(n){for(;typeof l=="function";)l=l();s=js(i,Array.isArray(l)?l:[l],Array.isArray(h)?h:[h])||s}else i.push(l),s=!0;else{const f=String(l);h&&h.nodeType===3&&h.data===f?i.push(h):i.push(document.createTextNode(f))}}return s}function Ca(i,e,t=null){for(let n=0,s=e.length;n<s;n++)i.insertBefore(e[n],t)}function Gt(i,e,t,n){if(t===void 0)return i.textContent="";const s=n||document.createTextNode("");if(e.length){let r=!1;for(let o=e.length-1;o>=0;o--){const l=e[o];if(s!==l){const h=l.parentNode===i;!r&&!o?h?i.replaceChild(s,l):i.insertBefore(s,t):h&&l.remove()}else r=!0}}else i.insertBefore(s,t);return[s]}const Uo="http://www.w3.org/2000/svg";function zo(i,e=!1,t=void 0){return e?document.createElementNS(Uo,i):document.createElement(i,{is:t})}function Kh(i){const{useShadow:e}=i,t=document.createTextNode(""),n=()=>i.mount||document.body,s=bo();let r;return cr(()=>{r||(r=yo(s,()=>kn(()=>i.children)));const o=n();if(o instanceof HTMLHeadElement){const[l,h]=Ma(!1),c=()=>h(!0);fi(f=>qs(o,()=>l()?f():r(),null)),zs(c)}else{const l=zo(i.isSVG?"g":"div",i.isSVG),h=e&&l.attachShadow?l.attachShadow({mode:"open"}):l;Object.defineProperty(l,"_$host",{get(){return t.parentNode},configurable:!0}),qs(h,r),o.appendChild(l),i.ref&&i.ref(l),zs(()=>o.removeChild(l))}},void 0,{render:!0}),t}async function $o(i={echoCancellation:!1,noiseSuppression:!0,autoGainControl:!0},e=""){try{return await navigator.mediaDevices.getUserMedia({audio:e?{...i,deviceId:{exact:e}}:i})}catch(t){if(e&&t.name==="OverconstrainedError")return console.warn("Requested audio input device unavailable, falling back to default"),navigator.mediaDevices.getUserMedia({audio:i});throw t}}const Ho={KeyZ:48,KeyS:49,KeyX:50,KeyD:51,KeyC:52,KeyV:53,KeyG:54,KeyB:55,KeyH:56,KeyN:57,KeyJ:58,KeyM:59,Comma:60,KeyL:61,Period:62,Semicolon:63,Slash:64,KeyQ:60,Digit2:61,KeyW:62,Digit3:63,KeyE:64,KeyR:65,Digit5:66,KeyT:67,Digit6:68,KeyY:69,Digit7:70,KeyU:71,KeyI:72,Digit9:73,KeyO:74,Digit0:75,KeyP:76,BracketLeft:77,Equal:78,BracketRight:79,Numpad1:60,Numpad2:62,Numpad3:64,Numpad4:65,Numpad5:67,Numpad6:69,Numpad7:71,Numpad8:72,Numpad9:74};function Ns(i){const{baseNote:e,scale:t}=i;if(t.length===0)throw new RangeError("scale must contain at least one interval");const n=[["KeyZ","KeyX","KeyC","KeyV","KeyB","KeyN","KeyM","Comma","Period","Slash"],["KeyA","KeyS","KeyD","KeyF","KeyG","KeyH","KeyJ","KeyK","KeyL","Semicolon","Quote","Backslash"],["KeyQ","KeyW","KeyE","KeyR","KeyT","KeyY","KeyU","KeyI","KeyO","KeyP","BracketLeft","BracketRight"],["Digit1","Digit2","Digit3","Digit4","Digit5","Digit6","Digit7","Digit8","Digit9","Digit0","Minus","Equal"]],s={};return n.forEach((r,o)=>{const l=e+o*12;r.forEach((h,c)=>{const f=c%t.length,d=Math.floor(c/t.length);s[h]=l+d*12+t[f]})}),["Numpad1","Numpad2","Numpad3","Numpad4","Numpad5","Numpad6","Numpad7","Numpad8","Numpad9"].forEach((r,o)=>{const l=o%t.length,h=Math.floor(o/t.length);s[r]=e+36+h*12+t[l]}),s}const qo=Ns({baseNote:36,scale:[0,2,4,5,7,9,11]}),jo=Ns({baseNote:36,scale:[0,2,3,5,7,8,10]}),Ko=Ns({baseNote:36,scale:[0,2,4,7,9]}),Yo=Ns({baseNote:48,scale:[0,1,2,3,4,5,6,7,8,9,10,11]}),Yh="major",Zh={piano:Ho,major:qo,minor:jo,pentatonic:Ko,chromatic:Yo};var Zo=Object.defineProperty,mr=i=>{throw TypeError(i)},Qo=(i,e,t)=>e in i?Zo(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t,y=(i,e,t)=>Qo(i,typeof e!="symbol"?e+"":e,t),Aa=(i,e,t)=>e.has(i)||mr("Cannot "+t),a=(i,e,t)=>(Aa(i,e,"read from private field"),t?t.call(i):e.get(i)),p=(i,e,t)=>e.has(i)?mr("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(i):e.set(i,t),u=(i,e,t,n)=>(Aa(i,e,"write to private field"),e.set(i,t),t),b=(i,e,t)=>(Aa(i,e,"access private method"),t),Rs=(i,e,t,n)=>({set _(s){u(i,e,s)},get _(){return a(i,e,n)}});const Xo=48e3,Jo={sampleRate:Xo};function el(i,e=!1){if(i==null)return!1;const t=.001,n=240,s=1,r=2;if(i.duration<t)return console.warn(`Audio duration is too short: ${i.duration} seconds. Must be longer than ${t} seconds`),!1;if(i.duration>n)return console.warn(`Audio duration is too long: ${i.duration} seconds. Must be shorter than ${n} seconds`),!1;if(i.numberOfChannels<s||i.numberOfChannels>r)return console.warn("Invalid number of audio channels."),!1;let o=!1,l=0,h=0;for(let c=0;c<i.numberOfChannels;c++)try{const f=i.getChannelData(c);if(!f||f.length===0)return!1;let d=0;for(let v=0;v<f.length;v++){const E=Math.abs(f[v]);E>0&&(o=!0),E>l&&(l=E),d+=E*E}const m=Math.sqrt(d/f.length);if(m>h&&(h=m),o)break}catch{return!1}if(o){if(e){const c=20*Math.log10(l),f=20*Math.log10(h);console.log(`AudioBuffer Analysis:
      Duration: ${i.duration} seconds
      Peak amplitude: ${l.toFixed(4)} (${c.toFixed(1)} dB)
      RMS amplitude: ${h.toFixed(4)} (${f.toFixed(1)} dB)
    `)}}else console.warn("Invalid Buffer: No non-zero data.");return o}var mi,bs,Te,mt,Le,$t,Ht,qt,gi,vn,fe,gr,Ia,br,Ks,Ys,Vn;class xa{constructor(e,t,n,s=1024){p(this,fe),p(this,mi),p(this,bs),p(this,Te),p(this,mt),p(this,Le),p(this,$t),p(this,Ht),p(this,qt,null),p(this,gi,new Map),p(this,vn,null),u(this,mi,e),u(this,bs,t),u(this,Te,n),u(this,mt,e.createAnalyser()),u(this,Le,e.createAnalyser()),a(this,mt).fftSize=s,a(this,Le).fftSize=s,u(this,$t,new Float32Array(a(this,mt).fftSize)),u(this,Ht,new Float32Array(a(this,Le).fftSize))}start(e=1e3,t,n=!1){return this.stop(),b(this,fe,gr).call(this),u(this,qt,window.setInterval(()=>{const s=this.getLevels();t&&t(s),n&&b(this,fe,br).call(this,s)},e)),this}getLevels(){a(this,mt).getFloatTimeDomainData(a(this,$t)),a(this,Le).getFloatTimeDomainData(a(this,Ht));const e=b(this,fe,Ks).call(this,a(this,$t)),t=b(this,fe,Ks).call(this,a(this,Ht)),n=b(this,fe,Ys).call(this,a(this,$t)),s=b(this,fe,Ys).call(this,a(this,Ht)),r=b(this,fe,Vn).call(this,e),o=b(this,fe,Vn).call(this,t),l=b(this,fe,Vn).call(this,n),h=b(this,fe,Vn).call(this,s),c=l-h;return{input:{rms:e,peak:n,rmsDB:r,peakDB:l},output:{rms:t,peak:s,rmsDB:o,peakDB:h},gainChange:c,gainChangeDB:c}}stop(){if(a(this,qt)){window.clearInterval(a(this,qt)),u(this,qt,null);try{a(this,mt).disconnect(),a(this,Le).disconnect(),a(this,vn)&&(a(this,vn).disconnect(),u(this,vn,null));const e=a(this,gi).get(a(this,Te));if(e){a(this,Te).disconnect();for(const t of e)t.node instanceof AudioNode?a(this,Te).connect(t.node,t.output,t.input):t.node instanceof AudioParam&&a(this,Te).connect(t.node,t.output)}a(this,gi).clear()}catch(e){console.error("Error removing level monitoring:",e)}}}}mi=new WeakMap,bs=new WeakMap,Te=new WeakMap,mt=new WeakMap,Le=new WeakMap,$t=new WeakMap,Ht=new WeakMap,qt=new WeakMap,gi=new WeakMap,vn=new WeakMap,fe=new WeakSet,gr=function(){try{const i=b(this,fe,Ia).call(this,a(this,Te));a(this,gi).set(a(this,Te),i);const e=a(this,mi).createGain();e.gain.value=1,a(this,bs).connect(e),e.connect(a(this,mt)),a(this,Te).disconnect(),a(this,Te).connect(a(this,Le));for(const t of i)t.node instanceof AudioNode?a(this,Le).connect(t.node,t.output,t.input):t.node instanceof AudioParam&&a(this,Le).connect(t.node,t.output);u(this,vn,e)}catch(i){console.error("Error setting up level monitoring:",i)}},Ia=function(i){return[{node:a(this,mi).destination,output:0,input:0}]},br=function(i){console.log(`Audio Levels:
       Input:  RMS ${i.input.rmsDB.toFixed(1)} dB | Peak ${i.input.peakDB.toFixed(1)} dB
       Output: RMS ${i.output.rmsDB.toFixed(1)} dB | Peak ${i.output.peakDB.toFixed(1)} dB
       Gain Change: ${i.gainChangeDB>0?"+":""}${i.gainChangeDB.toFixed(1)} dB`)},Ks=function(i){let e=0;for(let t=0;t<i.length;t++)e+=i[t]*i[t];return Math.sqrt(e/i.length)},Ys=function(i){let e=0;for(let t=0;t<i.length;t++){const n=Math.abs(i[t]);n>e&&(e=n)}return e},Vn=function(i){return i<1e-7?-100:20*Math.log10(i)};function Oa(i,e,t=.9){const n=e.numberOfChannels,s=e.length,r=e.sampleRate;let o=0;for(let c=0;c<n;c++){const f=e.getChannelData(c);for(let d=0;d<s;d++){const m=Math.abs(f[d]);m>o&&(o=m)}}if(o===0)return e;const l=t/o,h=i.createBuffer(n,s,r);for(let c=0;c<n;c++){const f=e.getChannelData(c),d=h.getChannelData(c);for(let m=0;m<s;m++)d[m]=f[m]*l}return h}const tl=1e-4;function Va(i,e=tl){const t=i.getChannelData(0),n=i.sampleRate,s=[];for(let r=1;r<t.length;r++)if(Math.abs(t[r])<e)s.push(r/n);else if(Math.sign(t[r])!==Math.sign(t[r-1])){const o=-t[r-1]/(t[r]-t[r-1]),l=(r-1+o)/n;s.push(l)}return s}const yr=["pulse","bandlimited-sawtooth","supersaw","warm-pad","metallic","formant","white-noise","pink-noise","brown-noise","colored-noise","random-harmonic","custom-function"],Qh=["sine","sawtooth","square","triangle",...yr];function nl(i){return yr.includes(i)}function il(i,e,t={}){switch(e){case"pulse":return sl(i,{dutyCycle:t.dutyCycle,harmonics:t.harmonics});case"bandlimited-sawtooth":return al(i,{harmonics:t.harmonics,rolloff:t.rolloff});case"supersaw":return rl(i,{voices:t.voices,detune:t.detune,harmonics:t.harmonics});case"warm-pad":return ol(i,{brightness:t.brightness,harmonics:t.harmonics});case"metallic":return ll(i,{inharmonicity:t.inharmonicity,harmonics:t.harmonics});case"formant":return hl(i,{formantFreqs:t.formantFreqs,formantBandwidths:t.formantBandwidths,fundamentalFreq:t.fundamentalFreq,harmonics:t.harmonics});case"white-noise":return ul(i,{harmonics:t.harmonics,seed:t.seed});case"pink-noise":return dl(i,{harmonics:t.harmonics,seed:t.seed});case"brown-noise":return pl(i,{harmonics:t.harmonics,seed:t.seed});case"colored-noise":return fl(i,{slope:t.slope,harmonics:t.harmonics,seed:t.seed});case"random-harmonic":return ml(i,{chaos:t.chaos,harmonicDensity:t.harmonicDensity,harmonics:t.harmonics,seed:t.seed});case"custom-function":return cl(i,t.waveFunction||(n=>Math.sin(n)),{harmonics:t.harmonics});default:throw new Error(`Invalid waveform type: ${e}`)}}function sl(i,e={}){const{dutyCycle:t=.5,harmonics:n=32}=e,s=new Float32Array(n+1),r=new Float32Array(n+1);for(let o=1;o<=n;o++)s[o]=0,r[o]=2/Math.PI*Math.sin(o*Math.PI*t)/o;return i.createPeriodicWave(s,r,{disableNormalization:!1})}function al(i,e={}){const{harmonics:t=32,rolloff:n=1}=e,s=new Float32Array(t+1),r=new Float32Array(t+1);for(let o=1;o<=t;o++)s[o]=0,r[o]=1/o*Math.pow(o,-n+1),o%2===0&&(r[o]*=-1);return i.createPeriodicWave(s,r,{disableNormalization:!1})}function rl(i,e={}){const{voices:t=7,detune:n=25,harmonics:s=16}=e,r=new Float32Array(s+1),o=new Float32Array(s+1);for(let l=0;l<t;l++){const h=l===0?0:(l%2===1?1:-1)*Math.ceil(l/2)*(n/Math.ceil(t/2)),c=Math.pow(2,h/1200);for(let f=1;f<=s;f++){const d=f*c;if(d<=s){const m=1/t*(1/f);o[Math.floor(d)]+=m*(f%2===1?1:-1)}}}return i.createPeriodicWave(r,o,{disableNormalization:!1})}function ol(i,e={}){const{brightness:t=.3,harmonics:n=64}=e,s=new Float32Array(n+1),r=new Float32Array(n+1);for(let o=1;o<=n;o++){const l=1/o*Math.exp(-o*(1-t)*.1);o%2===1&&(r[o]=l),o%2===0&&o<=n/2&&(r[o]=l*.3)}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function ll(i,e={}){const{inharmonicity:t=.2,harmonics:n=32}=e,s=new Float32Array(n+1),r=new Float32Array(n+1);for(let o=1;o<=n;o++){const l=Math.sqrt(1+t*o*o),h=Math.round(o*l);if(h<=n){const c=1/(o*o);s[h]+=c*.3,r[h]+=c*.7}}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function hl(i,e={}){const{formantFreqs:t=[800,1200,2600],formantBandwidths:n=[80,120,260],fundamentalFreq:s=440,harmonics:r=64}=e,o=new Float32Array(r+1),l=new Float32Array(r+1);for(let h=1;h<=r;h++){const c=h*s;let f=1/h;for(let d=0;d<t.length;d++){const m=t[d],v=n[d]||100,E=Math.abs(c-m),S=1/(1+Math.pow(E/v,2));f*=1+S*2}l[h]=f*(h%2===1?1:-1)}return i.createPeriodicWave(o,l,{disableNormalization:!1})}function cl(i,e,t={}){const{harmonics:n=32}=t,s=new Float32Array(n+1),r=new Float32Array(n+1),o=2048,l=new Float32Array(o);for(let h=0;h<o;h++){const c=h/o*2*Math.PI;l[h]=e(c)}for(let h=1;h<=n;h++){let c=0,f=0;for(let d=0;d<o;d++){const m=d/o*2*Math.PI*h;c+=l[d]*Math.cos(m),f+=l[d]*Math.sin(m)}s[h]=c/o,r[h]=f/o}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function ul(i,e={}){const{harmonics:t=64,seed:n}=e,s=new Float32Array(t+1),r=new Float32Array(t+1);let o=n!==void 0?n:Math.random()*1e6;const l=()=>(o=(o*9301+49297)%233280,o/233280);for(let h=1;h<=t;h++){const c=1/Math.sqrt(t),f=l()*2*Math.PI;s[h]=c*Math.cos(f),r[h]=c*Math.sin(f)}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function dl(i,e={}){const{harmonics:t=64,seed:n}=e,s=new Float32Array(t+1),r=new Float32Array(t+1);let o=n!==void 0?n:Math.random()*1e6;const l=()=>(o=(o*9301+49297)%233280,o/233280);for(let h=1;h<=t;h++){const c=1/Math.sqrt(h*t),f=l()*2*Math.PI;s[h]=c*Math.cos(f),r[h]=c*Math.sin(f)}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function pl(i,e={}){const{harmonics:t=64,seed:n}=e,s=new Float32Array(t+1),r=new Float32Array(t+1);let o=n!==void 0?n:Math.random()*1e6;const l=()=>(o=(o*9301+49297)%233280,o/233280);for(let h=1;h<=t;h++){const c=1/(h*Math.sqrt(t)),f=l()*2*Math.PI;s[h]=c*Math.cos(f),r[h]=c*Math.sin(f)}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function fl(i,e={}){const{slope:t=0,harmonics:n=64,seed:s}=e,r=new Float32Array(n+1),o=new Float32Array(n+1);let l=s!==void 0?s:Math.random()*1e6;const h=()=>(l=(l*9301+49297)%233280,l/233280);for(let c=1;c<=n;c++){const f=1/(Math.pow(c,t/2)*Math.sqrt(n)),d=h()*2*Math.PI;r[c]=f*Math.cos(d),o[c]=f*Math.sin(d)}return i.createPeriodicWave(r,o,{disableNormalization:!1})}function ml(i,e={}){const{chaos:t=.5,harmonicDensity:n=.7,harmonics:s=32,seed:r}=e,o=new Float32Array(s+1),l=new Float32Array(s+1);let h=r!==void 0?r:Math.random()*1e6;const c=()=>(h=(h*9301+49297)%233280,h/233280);for(let f=1;f<=s;f++)if(c()<n){const d=1/f,m=1+(c()-.5)*2*t,v=d*m,E=c()*2*Math.PI;c()>.5?o[f]=v*Math.cos(E):l[f]=v*Math.sin(E)}return i.createPeriodicWave(o,l,{disableNormalization:!1})}const vr=[["C"],["C#","Db"],["D"],["D#","Eb"],["E"],["F"],["F#","Gb"],["G"],["G#","Ab"],["A"],["A#","Bb"],["B"]],gl={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11},bl={chromatic:[0,1,2,3,4,5,6,7,8,9,10,11],major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],harmonic_minor:[0,2,3,5,7,8,11],melodic_minor:[0,2,3,5,7,9,11],lydian:[0,2,4,6,7,9,10],dorian:[0,2,3,5,7,9,10],phrygian:[0,1,3,5,7,8,10],mixolydian:[0,2,4,5,7,9,10],locrian:[0,1,3,5,6,8,10],diminished:[0,2,3,5,6,8,9,11],augmented:[0,3,4,8,9],major_pentatonic:[0,2,4,7,9],minor_pentatonic:[0,2,3,7,8],blues:[0,3,5,6,7,10],whole_tone:[0,2,4,6,8,10]};function yl(i,e=440){return e*Math.pow(2,(i-69)/12)}function vl(i,e="semitones",t=440,n){const s=12*Math.log2(i/t)+69;return e==="semitones"?Math.round(s):s}function wl(i=0,e=9,t=440,n=4){const s=[],r=Math.pow(2,.08333333333333333),o=57;for(let l=i*12;l<=e*12+(e===8?0:11);l++){const h=t*Math.pow(r,l-o);s.push(Number(h.toFixed(n)))}return s}function La(i){return typeof i=="number"&&Number.isInteger(i)&&i>=0&&i<=127}function Cs(i,e=60){return Math.pow(2,(i-e)/12)}const Pa=wl(0,9),Ml=Pa.map(i=>1/i),El=Array.from({length:Pa.length},(i,e)=>{const t=Math.floor(e/12)-1,n=e%12;return`${vr[n][0]}${t}`}),Sl=vr,Ri=gl,ys=Pa,Al=Ml,wr=El,Mr=bl,Er=i=>{const e=ys.reduce((n,s)=>Math.abs(s-i)<Math.abs(n-i)?s:n),t=vl(e);return Pl(t)};function Pl(i){const e=yl(i),t=Math.floor(i/12)-1,n=i%12;return{name:Sl[n][0],octave:t,midiNote:i,frequency:e,period:1/e}}function _l(){const i={};return wr.forEach((e,t)=>{i[e]=ys[t]}),Tl(i),Nl(i)}function Tl(i){const e=[["C#","Db"],["D#","Eb"],["F#","Gb"],["G#","Ab"],["A#","Bb"]];for(let t=0;t<=8;t++)for(const[n,s]of e){const r=`${n}${t}`,o=`${s}${t}`;r in i&&!(o in i)?i[o]=i[r]:o in i&&!(r in i)&&(i[r]=i[o])}}function Nl(i){return Object.fromEntries(Object.entries(i).sort((e,t)=>e[1]-t[1]))}const kl=_l();Object.fromEntries(Object.entries(kl).map(([i,e])=>[i,1/e]));function Dl(i,e,t=0,n=8){if(!Ri[i]&&Ri[i]!==0)throw new Error(`Unknown root note: ${i}`);const s=[...typeof e=="string"?Mr[e]:e],r=Ri[i],o=[],l=[],h=[];for(let c=t;c<=n;c++)s.forEach(f=>{const d=c*12+(r+f)%12;d<ys.length&&(o.push(ys[d]),l.push(Al[d]),h.push(wr[d]))});return{rootIdx:r,frequencies:o,periodsInSec:l,scalePattern:s,noteNames:h}}function Rl(i,e){const t=Math.pow(2,e/12);return i.map(n=>n/t)}function Ee(i,e,t){if(!i){const n=t?`
Context: ${JSON.stringify(t)}`:"";throw new Error(`Assertion failed${e?`: ${e}`:""}${n}`)}}function Cl(i){return typeof i=="object"&&i!==null&&typeof i.then=="function"}async function Ci(i,e,t=!0){if(typeof i!="function")throw new Error("tryCatch argument must be a function");try{const n=i();if(Cl(n))try{return{data:await n,error:null}}catch(s){return Fa(s,e,t)}return{data:n,error:null}}catch(n){return Fa(n,e,t)}}function Fa(i,e,t=!0){if(t){const n=i.message??i;console.error(n)}return{data:null,error:i}}var Ln;class Il{constructor(){p(this,Ln,null);try{if(typeof window>"u"||typeof AudioContext>"u"){console.error("Environment util: Window or AudioContext is undefined");return}const e=window.AudioContext||window.webkitAudioContext,t=new e,n=t.createGain().gain,s=typeof navigator<"u"&&"keyboard"in navigator,r=typeof KeyboardEvent<"u"&&typeof KeyboardEvent.prototype.getModifierState=="function";u(this,Ln,{cancelAndHoldSupported:typeof n.cancelAndHoldAtTime=="function",workletSupported:typeof t.audioWorklet=="object",keyboardAPISupported:s,modifierStateSupported:r}),t.close().catch(console.error)}catch{u(this,Ln,{cancelAndHoldSupported:!1,workletSupported:!1,keyboardAPISupported:!1,modifierStateSupported:!1})}}get capabilities(){return a(this,Ln)}}Ln=new WeakMap;const Ba=new Il,xl=()=>{var i;return!!((i=Ba==null?void 0:Ba.capabilities)!=null&&i.cancelAndHoldSupported)};function Ii(i,e,t){const n=t??i.value;i.cancelScheduledValues(e),i.setValueAtTime(n,e)}function bi(i,e,t){(Array.isArray(i)?i:[i]).forEach(n=>{xl()?n.cancelAndHoldAtTime(e):(n.cancelScheduledValues(e),n.setValueAtTime(n.value,e))})}function Ol(i,e,t="any",n=r=>r,s=(r,o)=>Math.abs(r-o)){if(i.length===0)throw new Error("Array cannot be empty");if(i.length===1)return 0;const r=e,o=n(i[0]),l=n(i[i.length-1]);if(r<=o)return 0;if(r>=l)return i.length-1;let h=0,c=i.length-1;for(;h<c-1;){const m=Math.floor((h+c)/2),v=n(i[m]);if(v===r)return m;v<r?h=m:c=m}if(t==="left")return h;if(t==="right")return c;const f=s(n(i[h]),r),d=s(n(i[c]),r);return f<=d?h:c}function Ni(i,e,t="any",n=r=>r,s=(r,o)=>Math.abs(r-o)){const r=Ol(i,e,t,n,s);return i[r]}const G=(i,e,t,n={warn:!1})=>{if(n.warn&&(i<e||i>t)){const s=n.name?`(${n.name})`:"";console.warn(`Value${s} ${i} is outside range [${e}, ${t}], clamping to ${i<e?e:t}`)}return Math.max(e,Math.min(t,i))},Ne=(i,e,t,n,s,r={warn:!0})=>{if(i<e||i>t){const l=r.name?`(${r.name})`:"";r.warn&&console.warn(`Input value${l} ${i} is outside nominal range [${e}, ${t}]`),i=G(i,e,t)}const o=(i-e)*(s-n)/(t-e)+n;return G(o,Math.min(n,s),Math.max(n,s))};function Vl(i,e){const{inputRange:t,outputRange:n,curve:s="linear"}=e;(i>t.max||i<t.min)&&console.warn("interpolate: Value outside of input range, will be clamped");let r=(Math.max(t.min,Math.min(i,t.max))-t.min)/(t.max-t.min);switch(s){case"linear":break;case"power1":r=Math.pow(r,1/1.5);break;case"power2":r=Math.pow(r,1/2);break;case"power3":r=Math.pow(r,1/3);break;case"power4":r=Math.pow(r,1/4);break;case"expo":r=r===0?0:Math.pow(2,10*(r-1));break;case"log":r=Math.log(1+9*r)/Math.log(10);break;case"sine":r=1-Math.cos(r*Math.PI/2);break;case"circ":r=1-Math.sqrt(1-r*r);break;default:typeof s=="number"&&(r=Math.pow(r,1/s));break}return n.min+r*(n.max-n.min)}function Ll(i,e){const{inputRange:t,outputRange:n,blend:s=1,curve:r="linear"}=e;(i>t.max||i<t.min)&&console.warn("interpolateLinearToExp: Value outside of input range, will be clamped"),n.min<=0&&console.warn("interpolateLinearToExp: Output min must be > 0 for exponential interpolation");let o=(Math.max(t.min,Math.min(i,t.max))-t.min)/(t.max-t.min);const l=Math.max(0,Math.min(s,1)),h=typeof r=="number"?r:r==="smooth"?2:r==="steep"?3:r==="gentle"?1.5:1;h!==1&&(o=Math.pow(o,1/h));const c=n.min+o*(n.max-n.min),f=n.min*Math.pow(n.max/n.min,o);return(1-l)*c+l*f}const Wa=i=>{const e=i.values().next();if(!e.done)return i.delete(e.value),e.value};let Vt=null,yi=null;function Bt(i){return Vt||(Vt=new AudioContext({sampleRate:Jo.sampleRate,latencyHint:"interactive"}),Vt.state==="suspended"&&(yi=yi||Sr())),Vt}async function _a(i){const e=Bt();if(e.state==="running")return e;if(e.state==="closed"){Vt=null;const t=await Ci(()=>_a(i));return Ee(t.data instanceof AudioContext&&!t.error,"failed to re-created closed audio context",t.error),t.data}return yi=yi||Sr(),await yi,e}function Sr(){if(typeof document>"u")return Promise.resolve();const i=["click","touchstart","keydown"];return new Promise(e=>{const t=async()=>{Vt&&(await Vt.resume(),i.forEach(n=>document.removeEventListener(n,t)),e())};i.forEach(n=>document.addEventListener(n,t,{once:!0}))})}function Fl(){return typeof AudioContext<"u"&&"setSinkId"in AudioContext.prototype}async function Xh(){return(await navigator.mediaDevices.enumerateDevices()).filter(i=>i.kind==="audiooutput")}async function Jh(){return(await navigator.mediaDevices.enumerateDevices()).filter(i=>i.kind==="audioinput")}async function ec(i){Ee(Fl(),"AudioContext.setSinkId is not supported in this browser"),await(await _a()).setSinkId(i==="default"?"":i)}const Bl=30,Wl=1e3,Gl={off:0,low:.1,medium:.2,high:.3};async function Ar(i,e="medium"){const t=i.getChannelData(0),n=Gl[e];let s=0;for(let A=0;A<t.length;A++){const P=Math.abs(t[A]);P>s&&(s=P)}const r=n>0?t.map(A=>Math.abs(A)>n*s?A:0):t,o=Math.floor(i.sampleRate/Wl),l=Math.floor(i.sampleRate/Bl),h=new Float32Array(l);for(let A=o;A<h.length;A++){let P=0;for(let O=0;O<r.length-A;O++)P+=r[O]*r[O+A];h[A]=P}let c=o;for(let A=o;A<l;A++)h[A]>h[c]&&(c=A);const f=c;let d=0;if(f>0&&f<h.length-1){const A=h[f-1],P=h[f],O=h[f+1],ee=2*(2*P-A-O);d=Math.abs(ee)<1e-6?0:(O-A)/ee}const m=h[c],v=r.reduce((A,P)=>A+P*P,0),E=v>0?m/v:0,S=Math.max(0,Math.min(1,E));return{frequency:i.sampleRate/(f+d),confidence:S}}function Ga(i,e,t,n){const s=Math.min(e+t,i.length);for(let r=e;r<s;r++){const o=(r-e)/t,l=n==="in"?o:1-o;i[r]*=l}}function Pr(i,e,t,n,s=4){const r=e.numberOfChannels,o=n-t,l=i.createBuffer(r,o,e.sampleRate),h=Math.floor(s/1e3*e.sampleRate);for(let c=0;c<r;c++){const f=e.getChannelData(c),d=l.getChannelData(c);for(let m=0;m<o;m++)d[m]=f[t+m];o>h*2&&h>0&&(Ga(d,0,h,"in"),Ga(d,o-h,h,"out"))}return l}function Ul(i,e,t=.5,n=4,s=1){const r=e.numberOfChannels,o=e.length,l=e.sampleRate;let h=0;for(let d=0;d<r;d++){const m=e.getChannelData(d);for(let v=0;v<o;v++){const E=Math.abs(m[v]);E>h&&(h=E)}}let c=s;if(h>0){const d=.95/(h<=t?h:t+(h-t)/n);c=Math.min(s,d),h>.9&&(c=Math.min(c,1.2))}const f=i.createBuffer(r,o,l);for(let d=0;d<r;d++){const m=e.getChannelData(d),v=f.getChannelData(d);for(let E=0;E<o;E++){const S=m[E],A=Math.abs(S);let P;if(A<=t)P=S*c;else{const O=(A-t)/n,ee=t+O;P=(S<0?-1:1)*ee*c}v[E]=Math.max(-.99,Math.min(.99,P))}}return f}function zl(i){let e=0,t=0,n=0;for(let o=0;o<i.numberOfChannels;o++){const l=i.getChannelData(o);for(let h=0;h<l.length;h++){const c=Math.abs(l[h]);c>e&&(e=c),t+=l[h]*l[h],n++}}const s=n>0?Math.sqrt(t/n):0,r=s>0?e/s:0;return r<5.5?{shouldCompress:!1,crestFactor:r}:r<7?{shouldCompress:!0,crestFactor:r,suggestedSettings:{threshold:.5,ratio:2,makeupGain:1}}:{shouldCompress:!0,crestFactor:r,suggestedSettings:{threshold:.3,ratio:4,makeupGain:1}}}function $l(i,e,t="samples"){const n=i.numberOfChannels,s=i.sampleRate,r=Array.from({length:n},(c,f)=>i.getChannelData(f));if(r.length===0||!r[0])throw new Error("AudioBuffer must contain at least one audio channel");const o=r[0].length;function l(){for(let c=0;c<o;c++)if(Math.max(...r.map(f=>Math.abs(f[c])))>e)return t==="seconds"?c/s:c;return 0}function h(){for(let c=o-1;c>=0;c--)if(Math.max(...r.map(f=>Math.abs(f[c])))>e)return t==="seconds"?c/s:c;return t==="seconds"?(o-1)/s:o-1}return{start:l(),end:h()}}const Mt={normalize:{enabled:!0,maxAmplitudePeak:.99},compress:{enabled:!0},trimSilence:{enabled:!0,threshold:.005},fadeInOutMs:1,tune:{detectPitch:!0,autotune:!0,targetMidiNote:60},hpf:{auto:!0},getZeroCrossings:!0};async function _r(i,e,t={}){var n,s;const{fadeInOutMs:r=Mt.fadeInOutMs,hpf:o=Mt.hpf,getZeroCrossings:l=Mt.getZeroCrossings}=t;if(t.skipPreProcessing){const S={audiobuffer:e};if(l){const A=Va(e);S.zeroCrossings=A}return S}const h={...Mt.normalize,...t.normalize||{}},c={...Mt.compress,...t.compress||{}},f={...Mt.trimSilence,...t.trimSilence||{}},d={...Mt.tune,...t.tune||{}};let m=e,v={};const E=.35;if(f!=null&&f.enabled){const{start:S,end:A}=$l(m,f.threshold??.01);m=Pr(i,m,S,A,r)}if(o){if("cutoff"in o)m=await za(m,o.cutoff??80);else if("auto"in o&&o.auto){const S=await Ua(m);if(S.confidence>=E){const A=S.frequency>30&&S.frequency<350?S.frequency:80;m=await za(m,A)}}}if(h!=null&&h.enabled&&(m=Oa(i,m,h.maxAmplitudePeak)),c!=null&&c.enabled){const S=zl(m);if(S.shouldCompress){const A=c.threshold!==void 0||c.ratio!==void 0||c.makeupGain!==void 0;let P;A&&c.threshold!==void 0?P={threshold:c.threshold??.5,ratio:c.ratio??2,makeupGain:c.makeupGain??1}:P=S.suggestedSettings,m=Ul(i,m,P.threshold,P.ratio,P.makeupGain)}}if(d!=null&&d.detectPitch||d!=null&&d.autotune||o&&"auto"in o&&o.auto){const S=await Ua(m),A=(d==null?void 0:d.targetMidiNote)||60,P=ql(S.midiFloat,A);v.detectedPitch={fundamentalHz:S.frequency,transpositionSemitones:P,confidence:S.confidence}}if(d!=null&&d.autotune&&(!((n=v.detectedPitch)!=null&&n.transpositionSemitones)||v.detectedPitch.confidence<E?console.info("Skipped autotune due to unreliable pitch detection"):Math.abs(((s=v.detectedPitch)==null?void 0:s.transpositionSemitones)??0)<.1?console.info("Skipped autotune - detected pitch is already C"):m=Hl(i,m,v.detectedPitch.transpositionSemitones)),h!=null&&h.enabled&&(m=Oa(i,m,h.maxAmplitudePeak)),l){const S=Va(m);v.zeroCrossings=S}return{...v,audiobuffer:m}}function Hl(i,e,t){const n=Math.pow(2,t/12),s=e.length,r=Math.round(s/n),o=i.createBuffer(e.numberOfChannels,r,e.sampleRate);for(let l=0;l<e.numberOfChannels;l++){const h=e.getChannelData(l),c=o.getChannelData(l);for(let f=0;f<r;f++){const d=f*n,m=Math.floor(d),v=d-m;m+1<s?c[f]=h[m]*(1-v)+h[m+1]*v:c[f]=h[m]}}return o}async function Ua(i,e=!1){const t=await Ar(i),n=Er(t.frequency),s=69+12*Math.log2(t.frequency/440),r=n.frequency/t.frequency;return e&&console.table({pitchSource:t,targetNoteInfo:n,playbackRateMultiplier:r,midiFloat:s}),{frequency:t.frequency,confidence:t.confidence,midiFloat:s,targetNoteInfo:n}}function ql(i,e){let t=e-i;for(;t>6;)t-=12;for(;t<-6;)t+=12;return t}async function za(i,e,t=.5){const n=new OfflineAudioContext(i.numberOfChannels,i.length,i.sampleRate),s=n.createBufferSource(),r=n.createBiquadFilter();return r.type="highpass",r.frequency.value=e,r.Q.value=t,s.buffer=i,s.connect(r),r.connect(n.destination),s.start(0),await n.startRendering()}let jl=-1;const Tr=new Map,We=(i,e)=>{const t=`${++jl}-${i}`;return Tr.set(t,e),t},Ge=i=>{Tr.delete(i)||console.debug("Attempted to unregister a non-existent Node ID: ",i)};function wt(i){const e=new Map;return{sendMessage(t,n){const s=e.get(t);if(s){const r={type:t,senderId:i,...n};s.forEach(o=>o(r))}},onMessage(t,n){e.has(t)||e.set(t,new Set);const s=e.get(t);return s.add(n),()=>s.delete(n)},forwardFrom(t,n,s){const r=s||(l=>({...l})),o=n.map(l=>t.onMessage(l,h=>{const c=r(h);c!==null&&this.sendMessage(c.type,c)}));return()=>o.forEach(l=>l())}}}var jt,wn,vs,it,ze,H,j,Fn,xi;class Kl{constructor(e=[],t=[0,1],n,s,r){p(this,Fn),p(this,jt),p(this,wn,0),p(this,vs,!1),p(this,it),p(this,ze,null),p(this,H),p(this,j),y(this,"updateStartPoint",(o,l)=>{this.updatePoint(a(this,it),o,l)}),y(this,"updateEndPoint",(o,l)=>{this.updatePoint(a(this,j),o,l)}),y(this,"setValueRange",o=>u(this,jt,o)),this.points=e,Ee(e.length>=2,"EnvelopeData needs at least two points to initialize"),u(this,wn,n),u(this,jt,t),u(this,it,0),u(this,j,e.length-1),u(this,ze,s!==void 0&&e[s]?s:null),u(this,H,r!==void 0&&e[r]?r:Math.max(0,a(this,j)-1))}addPoint(e,t,n="exponential"){const s={time:e,value:t,curve:n};if(this.points.length>=2){const o=this.points[this.startPointIndex].time,l=this.points[a(this,j)].time;if(e<o||e>l){console.warn(`Cannot add point at time ${e}. Must be between ${o} and ${l}`);return}}const r=this.points.findIndex(o=>o.time>e);r===-1?(this.points.push(s),u(this,j,this.points.length-1)):(this.points.splice(r,0,s),u(this,j,this.points.length-1),a(this,ze)!==null&&r<=a(this,ze)&&Rs(this,ze)._++,a(this,H)!==null&&r<=a(this,H)&&Rs(this,H)._++),b(this,Fn,xi).call(this)}updatePoint(e,t,n){if(e>=0&&e<this.points.length){const s=this.points[e];let r=t??s.time;if(e===1&&r<=this.points[a(this,it)].time||e===a(this,j)-1&&r>=this.points[a(this,j)].time)return;this.points[e]={...s,time:r,value:n??s.value}}b(this,Fn,xi).call(this)}deletePoint(e){this.points.length>2&&e>a(this,it)&&e<a(this,j)&&(this.points.splice(e,1),u(this,j,this.points.length-1)),a(this,H)!==null&&(e<a(this,H)?Rs(this,H)._--:e===a(this,H)&&u(this,H,a(this,j)>a(this,H)+1?a(this,H)+1:Math.max(0,a(this,j)-1))),b(this,Fn,xi).call(this)}interpolateValueAtTime(e){if(this.points.length===0)return a(this,jt)[0];if(this.points.length===1)return this.points[0].value;const t=[...this.points].sort((s,r)=>s.time-r.time);let n=0;if(e<=t[0].time)n=t[0].value;else if(e>=t[t.length-1].time)n=t[t.length-1].value;else{n=0;for(let s=0;s<t.length-1;s++){const r=t[s],o=t[s+1];if(e>=r.time&&e<=o.time){const l=o.time-r.time,h=l===0?0:(e-r.time)/l;r.curve==="exponential"&&r.value>0&&o.value>0?n=r.value*Math.pow(o.value/r.value,h):n=r.value+(o.value-r.value)*h;break}}}return n}setSustainPoint(e){if(e==null){u(this,ze,null);return}e>=0&&e<this.points.length&&u(this,ze,e)}setReleasePoint(e){e>=0&&e<this.points.length?u(this,H,e):console.error("EnvelopeData.setReleasePoint: invalid index")}get startPointIndex(){return a(this,it)}get sustainPointIndex(){return a(this,ze)}get releasePointIndex(){return a(this,H)>=this.points.length&&u(this,H,Math.max(0,this.points.length-2)),a(this,H)}get endPointIndex(){return a(this,j)}get pointValueRange(){return a(this,jt)}get startTime(){var e;return((e=this.points[a(this,it)])==null?void 0:e.time)??0}get endTime(){var e;return((e=this.points[a(this,j)])==null?void 0:e.time)??a(this,wn)}get durationSeconds(){return this.endTime-this.startTime}setDurationSeconds(e){u(this,wn,e)}get hasSharpTransitions(){return a(this,vs)}}jt=new WeakMap,wn=new WeakMap,vs=new WeakMap,it=new WeakMap,ze=new WeakMap,H=new WeakMap,j=new WeakMap,Fn=new WeakSet,xi=function(){const i=.02*a(this,wn);u(this,vs,this.points.some((e,t)=>t>0&&Math.abs(e.time-this.points[t-1].time)<i))};var Oi,ce,Bn,T,st,Kt,at,Fe,je,Q,V,xt,Is,On,Nr,Ie,he,gt,rt,we,kr,Vi,Dr,Rr,Cr,Li;class xs{constructor(e,t,n,s=[],r=[0,1],o=1,l=!0){switch(p(this,V),y(this,"nodeId"),y(this,"nodeType","default-env"),p(this,Oi,!1),p(this,ce),p(this,Bn),p(this,T),p(this,st),y(this,"envelopeType"),p(this,Kt),p(this,at,!1),p(this,Fe,!1),p(this,je,1),p(this,Q,1),y(this,"addPoint",(h,c,f)=>{a(this,T).addPoint(h,c,f),a(this,he)&&u(this,gt,!0)}),y(this,"deletePoint",h=>{a(this,T).deletePoint(h),a(this,he)&&u(this,gt,!0)}),y(this,"updatePoint",(h,c,f)=>{a(this,T).updatePoint(h,c,f),a(this,he)&&u(this,gt,!0)}),y(this,"setValueRange",h=>a(this,T).setValueRange(h)),y(this,"enable",()=>u(this,Kt,!0)),y(this,"disable",()=>u(this,Kt,!1)),p(this,Ie,!1),p(this,he,!1),p(this,gt,!1),p(this,rt,()=>a(this,at)&&!a(this,Ie)),p(this,we,null),p(this,Vi,navigator.userAgent.includes("Firefox")),y(this,"setTimeScale",h=>{u(this,Q,h),a(this,he)&&u(this,gt,!0)}),y(this,"setLoopEnabled",(h,c="normal")=>{c!=="normal"&&console.info("Only default env loop mode implemented. Other modes coming soon!"),u(this,at,h)}),y(this,"syncToPlaybackRate",h=>{u(this,Fe,h)}),y(this,"setSustainPoint",h=>{a(this,T).setSustainPoint(h),a(this,we)&&!a(this,at)&&!a(this,Ie)&&b(this,V,Cr).call(this)}),y(this,"setReleasePoint",h=>a(this,T).setReleasePoint(h)),this.envelopeType=t,this.nodeType=t,this.nodeId=We(this.envelopeType,this),u(this,ce,e),u(this,Bn,wt(this.nodeId)),t){case"amp-env":u(this,st,"envGain");break;case"pitch-env":u(this,st,"playbackRate");break;case"filter-env":u(this,st,"lpf");break;case"loop-env":u(this,st,"loopEnd"),console.warn("CustomEnvelope not implemented for type: loop-env");break;default:console.error(`CustomEnvelope not implemented for type: ${t}`),u(this,st,"default");break}u(this,Kt,l),u(this,T,n||new Kl([...s],r,o)),u(this,Oi,!0),this.sendUpstreamMessage(`${this.envelopeType}:created`,{})}setSampleDuration(e){return a(this,T).setDurationSeconds(e),this}get initialized(){return a(this,Oi)}get data(){return a(this,T)}get param(){return a(this,st)}get isEnabled(){return a(this,Kt)}get points(){return a(this,T).points}get baseDuration(){return a(this,T).endTime-a(this,T).startTime}get effectiveDuration(){return b(this,V,xt).call(this)}get timeScale(){return a(this,Q)}get envPointValueRange(){return a(this,T).pointValueRange}get loopEnabled(){return a(this,at)}get syncedToPlaybackRate(){return a(this,Fe)}get numPoints(){return a(this,T).points.length}getEffectivePointTime(e){return Ee(e>=0&&e<=this.points.length-1),b(this,V,xt).call(this,a(this,T).startPointIndex,e)}triggerEnvelope(e,t,n={baseValue:1,playbackRate:1}){if(a(this,Vi)){try{const s=a(this,ce).currentTime,r=Math.max(s+.001,t);bi(e,r),e.linearRampToValueAtTime(n.baseValue*.8,r+.01),e.linearRampToValueAtTime(n.baseValue*.5,r+.1),console.debug("Firefox trigger envelope - simple linear ramps")}catch(s){console.debug("Firefox trigger envelope failed silently:",s)}u(this,Ie,!1),u(this,je,n.playbackRate);return}if(u(this,Ie,!1),u(this,je,n.playbackRate),u(this,we,{audioParam:e,startTime:t,options:n}),a(this,at)?b(this,V,kr).call(this,e,t,n):b(this,V,Nr).call(this,e,t,n),!this.releasePoint){console.error("Release point not set, ensure supported by envelope");return}setTimeout(()=>{this.sustainEnabled||a(this,Ie)||(u(this,Ie,!0),n.voiceId!==void 0&&this.sendUpstreamMessage(`${this.envelopeType}:release`,{voiceId:n.voiceId,midiNote:n.midiNote,releasePoint:this.releasePoint,remainingDuration:this.effectiveReleaseDuration}))},this.effectiveReleaseStartTime*1e3)}releaseEnvelope(e,t,n,s=!1){if(a(this,Ie))return;const r=a(this,we);if(u(this,Ie,!0),u(this,we,null),a(this,Vi)){try{const f=a(this,ce).currentTime;e.cancelScheduledValues(f),setTimeout(()=>{try{const d=a(this,ce).currentTime;bi(e,d),e.linearRampToValueAtTime(0,d+.1),console.debug("Firefox delayed release envelope - linear ramp to 0")}catch(d){console.debug("Firefox delayed release also failed:",d)}},10)}catch(f){console.debug("Firefox immediate release failed:",f),setTimeout(()=>{try{const d=a(this,ce).currentTime;e.setValueAtTime(0,d+.05)}catch(d){console.debug("Firefox very delayed release failed:",d)}},50)}return}const o=Math.max(a(this,ce).currentTime,t),l=r?Math.max(0,o-r.startTime):void 0,h=l!==void 0?Math.min(this.baseDuration,l*(a(this,Fe)?r.options.playbackRate:1)*a(this,Q)):void 0,c=this.envelopeType==="amp-env"&&(r==null?void 0:r.audioParam)===e&&h!==void 0?b(this,V,Li).call(this,a(this,T).interpolateValueAtTime(h)*r.options.baseValue):void 0;s&&b(this,V,Dr).call(this,{audioParamValue:e.value,elapsedSeconds:l,envelopeTime:h,releaseStartValue:c,safeStart:o,startTime:t,activeStartTime:r==null?void 0:r.startTime}),b(this,V,Rr).call(this,e,t,this.releasePointIndex,{baseValue:e.value,playbackRate:a(this,je),releaseStartValue:c,curveScale:this.envelopeType==="amp-env"?r==null?void 0:r.options.baseValue:void 0,...n})}get sustainPointIndex(){return a(this,T).sustainPointIndex}get releasePointIndex(){return a(this,T).releasePointIndex}get releasePoint(){return this.points[this.releasePointIndex]||null}get effectiveReleaseStartTime(){return this.getEffectivePointTime(this.releasePointIndex)}get baseReleaseDuration(){return this.points[a(this,T).endPointIndex].time-this.points[this.releasePointIndex].time}get effectiveReleaseDuration(){return a(this,Fe)?this.baseReleaseDuration/a(this,je)/a(this,Q):this.baseReleaseDuration/a(this,Q)}get sustainEnabled(){return this.sustainPoint!==null&&!this.loopEnabled}get sustainPoint(){return this.sustainPointIndex!==null?this.points[this.sustainPointIndex]:null}get currentPlaybackRate(){return a(this,je)}setCurrentPlaybackRate(e){u(this,je,e),a(this,Fe)&&a(this,he)&&u(this,gt,!0)}onMessage(e,t){return a(this,Bn).onMessage(e,t)}sendUpstreamMessage(e,t){return a(this,Bn).sendMessage(e,t),this}hasVariation(){var e;const t=((e=this.points[0])==null?void 0:e.value)??0;return this.points.some(n=>Math.abs(n.value-t)>.001)}static getDefaults(e,t=1){switch(e){case"amp-env":return{points:[{time:0,value:0,curve:"exponential"},{time:Math.min(.005,.1*t),value:1,curve:"exponential"},{time:.25*t,value:.75,curve:"exponential"},{time:.9*t,value:.5,curve:"exponential"},{time:t,value:0,curve:"exponential"}],envPointValueRange:[0,1],initEnable:!0,sustainPointIndex:null,releasePointIndex:3};case"pitch-env":return{points:[{time:0,value:1,curve:"exponential"},{time:t,value:1,curve:"exponential"}],envPointValueRange:[.5,1.5],initEnable:!1,sustainPointIndex:null,releasePointIndex:1};case"filter-env":return{points:[{time:0,value:0,curve:"exponential"},{time:.02*t,value:1,curve:"exponential"},{time:.3*t,value:.2,curve:"exponential"},{time:t,value:0,curve:"exponential"}],envPointValueRange:[0,1],initEnable:!1,sustainPointIndex:null,releasePointIndex:2};default:return{points:[{time:0,value:0,curve:"linear"},{time:.1*t,value:1,curve:"linear"},{time:t,value:0,curve:"linear"}],envPointValueRange:[0,1],initEnable:!0,sustainPointIndex:null,releasePointIndex:1}}}dispose(){u(this,at,!1),Ge(this.nodeId)}}Oi=new WeakMap,ce=new WeakMap,Bn=new WeakMap,T=new WeakMap,st=new WeakMap,Kt=new WeakMap,at=new WeakMap,Fe=new WeakMap,je=new WeakMap,Q=new WeakMap,V=new WeakSet,xt=function(i=a(this,T).startPointIndex,e=a(this,T).endPointIndex,t=a(this,je),n=a(this,Q)){if(i<a(this,T).startPointIndex||e>a(this,T).endPointIndex||i>=e)return 0;const s=this.points[i].time;let r=this.points[e].time-s;return a(this,Fe)&&(r=r/t),r/n},Is=function(i){return this.envelopeType==="filter-env"?i<1?1e3:750:a(this,T).hasSharpTransitions?1e3:i<1?500:250},On=function(i,e=this.baseDuration,t){const n=b(this,V,Is).call(this,i),s=Math.max(2,Math.floor(i*n)),r=new Float32Array(s),{baseValue:o,minValue:l,maxValue:h,startFromValue:c}=t;let f,d,m;this.envelopeType==="filter-env"&&(f=Math.log(o),d=Math.log(h),m=d-f);for(let v=0;v<s;v++){const E=v/(s-1)*e;let S=a(this,T).interpolateValueAtTime(E);c!==void 0&&v===0?S=c:this.envelopeType==="filter-env"&&f&&m?S=Math.exp(f+m*S):o!==1&&(S=S*o),r[v]=G(S,l,h)}return r},Nr=function(i,e,t){var n;const s=this.sustainEnabled?this.sustainPointIndex??this.points.length-1:this.points.length-1,r=b(this,V,xt).call(this,0,s,t.playbackRate,a(this,Q)),o=b(this,V,On).call(this,r,this.sustainEnabled?((n=this.sustainPoint)==null?void 0:n.time)??this.baseDuration:this.baseDuration,{...t,minValue:i.minValue,maxValue:i.maxValue,startFromValue:i.value});t.voiceId!==void 0&&this.sendUpstreamMessage(`${this.envelopeType}:trigger`,{voiceId:t.voiceId,midiNote:t.midiNote,duration:r,sustainEnabled:this.sustainEnabled,loopEnabled:!1,sustainPoint:this.sustainPoint,releasePoint:this.releasePoint});const l=a(this,ce).currentTime,h=Math.max(l,e);if(r<.005){i.linearRampToValueAtTime(o[o.length-1],h+r);return}try{bi(i,h),i.setValueCurveAtTime(o,h,r),this.sustainEnabled||setTimeout(()=>{u(this,we,null)},r*1e3+100)}catch{console.debug("Failed to apply envelope curve due to rapid fire.");try{bi(i,h),i.linearRampToValueAtTime(o[o.length-1],h+r),this.sustainEnabled||setTimeout(()=>{u(this,we,null)},r*1e3+100)}catch{try{i.setValueAtTime(o[o.length-1],h),u(this,we,null)}catch{u(this,we,null)}}}},Ie=new WeakMap,he=new WeakMap,gt=new WeakMap,rt=new WeakMap,we=new WeakMap,kr=function(i,e,t){if(!a(this,rt).call(this)){u(this,he,!1);return}let n=b(this,V,xt).call(this,a(this,T).startPointIndex,a(this,T).endPointIndex,t.playbackRate,a(this,Q)),s=b(this,V,On).call(this,n,this.baseDuration,{...t,minValue:i.minValue,maxValue:i.maxValue,startFromValue:i.value});t.voiceId!==void 0&&this.sendUpstreamMessage(`${this.envelopeType}:trigger`,{voiceId:t.voiceId,midiNote:t.midiNote,duration:n,sustainEnabled:!1,loopEnabled:!0,sustainPoint:this.sustainPoint,releasePoint:this.releasePoint});let r=Math.max(a(this,ce).currentTime,e);const o=Math.max(.15,Math.min(n*3,.5)),l=.005;let h=0,c=0;u(this,he,!0);let f=!1,d=null;const m=()=>{if(!a(this,rt).call(this)){u(this,he,!1);return}if(d!==null&&(clearTimeout(d),d=null),!f){f=!0;try{for(a(this,gt)&&(n=b(this,V,xt).call(this,a(this,T).startPointIndex,a(this,T).endPointIndex,t.playbackRate,a(this,Q)),s=b(this,V,On).call(this,n,this.baseDuration,{...t,minValue:i.minValue,maxValue:i.maxValue,startFromValue:i.value}));r<a(this,ce).currentTime+o&&r>=h;){if(!a(this,rt).call(this)){u(this,he,!1);return}const v=n-l;try{i.setValueCurveAtTime(s,r,v)}catch{c++,c>=100&&(console.debug(`Multiple curve overlaps in looping envelope, nr of overlaps: ${c} 
                (loop duration: ${n.toFixed(3)}s, buffer: ${l})`),c=0)}if(r+=n+l,h=r,t.voiceId!==void 0){const E=a(this,ce).getOutputTimestamp();if(E.contextTime!==void 0&&E.performanceTime!==void 0){const S=r-E.contextTime,A=E.performanceTime+S*1e3,P=Math.max(0,A-performance.now());setTimeout(()=>{if(!a(this,rt).call(this)){u(this,he,!1);return}this.sendUpstreamMessage(`${this.envelopeType}:trigger:loop`,{voiceId:t.voiceId,midiNote:t.midiNote,duration:n})},P)}else{if(!a(this,rt).call(this)){u(this,he,!1);return}this.sendUpstreamMessage(`${this.envelopeType}:trigger:loop`,{voiceId:t.voiceId,midiNote:t.midiNote,duration:n})}}}d=setTimeout(()=>{if(!a(this,rt).call(this)){u(this,he,!1);return}m()},100)}finally{f=!1}}};m()},Vi=new WeakMap,Dr=function(i){console.debug("CustomEnvelope release debug:",{envelopeType:this.envelopeType,...i})},Rr=function(i,e,t,n){const s=n.curveScale??1,r=this.points[t],o=this.points[this.points.length-1],l=Math.max(a(this,ce).currentTime,e),h=o.time-r.time,c=b(this,V,xt).call(this,t,this.points.length-1,n.playbackRate,a(this,Q)),f=b(this,V,Li).call(this,a(this,T).interpolateValueAtTime(o.time)*s);if(c<=1e-4){Ii(i,l,n.releaseStartValue),i.linearRampToValueAtTime(f,l+.005);return}const d=b(this,V,Is).call(this,c),m=Math.max(2,Math.floor(c*d)),v=new Float32Array(m);for(let E=0;E<m;E++){const S=E/(m-1),A=r.time+S*h;v[E]=b(this,V,Li).call(this,a(this,T).interpolateValueAtTime(A)*s)}n.voiceId!==void 0&&this.sendUpstreamMessage(`${this.envelopeType}:release`,{voiceId:n.voiceId,midiNote:n.midiNote,releasePoint:this.releasePoint,remainingDuration:c});try{const E=n.releaseStartValue??i.value;Ii(i,l,E);const S=new Float32Array(v.length);for(let A=0;A<v.length;A++){const P=A/(v.length-1);S[A]=E+P*(v[A]-E)}S[0]=E,i.setValueCurveAtTime(S,l+.001,c)}catch{try{Ii(i,l,n.releaseStartValue),i.linearRampToValueAtTime(f,l+c)}catch(E){console.warn("Fallback linear ramp also failed:",E);try{i.setValueAtTime(f,l)}catch(S){console.warn("All AudioParam operations failed:",S)}}}},Cr=function(){if(!a(this,we)||!this.sustainEnabled)return;const{audioParam:i,startTime:e,options:t}=a(this,we),n=a(this,ce).currentTime,s=n-Math.max(e,n),r=a(this,Fe)?s*t.playbackRate*a(this,Q):s*a(this,Q),o=this.sustainPoint;if(!(!o||r>=o.time))try{bi(i,n);const l=o.time-r,h=a(this,Fe)?l/t.playbackRate/a(this,Q):l/a(this,Q);if(h>.001){const c=b(this,V,On).call(this,h,o.time,{...t,minValue:i.minValue,maxValue:i.maxValue,startFromValue:i.value});i.setValueCurveAtTime(c,n,h)}}catch{console.debug("Dynamic sustain reschedule failed, envelope will continue normally")}},Li=function(i){const[e,t]=a(this,T).pointValueRange;return Math.max(e,Math.min(t,i))};function Os(i,e,t={}){const{durationSeconds:n=2,points:s,sustainPointIndex:r,releasePointIndex:o,envPointValueRange:l,initEnable:h,sharedData:c}=t;if(c)return new xs(i,e,c);const f=xs.getDefaults(e,n),d=s||f.points;let m=l||f.envPointValueRange;const v=h!==void 0?h:f.initEnable,E=r!==void 0?r:f.sustainPointIndex,S=o!==void 0?o:f.releasePointIndex,A=new xs(i,e,void 0,d,m,n,v);return A.setSustainPoint(E),S&&A.setReleasePoint(S),A}class Yl{constructor(){y(this,"timers",new Map)}debounce(e,t,n){const s=n??e.name??"default";return(...r)=>{this.timers.has(s)&&clearTimeout(this.timers.get(s)),this.timers.set(s,setTimeout(()=>{e(...r),this.timers.delete(s)},t))}}cancel(e){this.timers.has(e)&&(clearTimeout(this.timers.get(e)),this.timers.delete(e))}}var Et,xe,Yt,Wn,St;const Ir=class Zs{constructor(e,t=Zs.MIN_EXPONENTIAL_RAMP_VALUE){y(this,"nodeId"),y(this,"nodeType","audio-param-controller"),p(this,Et),p(this,xe),p(this,Yt,[]),p(this,Wn,!1),p(this,St),u(this,Et,e),this.nodeId=We(this.nodeType,this),u(this,xe,e.createConstantSource()),a(this,xe).offset.setValueAtTime(t,e.currentTime),u(this,St,t),a(this,xe).start(),u(this,Wn,!0)}addTarget(e,t=1){if(t===1)a(this,xe).connect(e),a(this,Yt).push({param:e});else{const n=new GainNode(a(this,Et),{gain:t});a(this,xe).connect(n),n.connect(e),a(this,Yt).push({param:e,scaler:n})}return this}ramp(e,t,n="exponential",s=!0){const r=a(this,Et).currentTime;s&&this.param.cancelScheduledValues(r);const o=this.param.value;if(this.param.setValueAtTime(o,r),n==="exponential"){const l=Math.max(e,Zs.MIN_EXPONENTIAL_RAMP_VALUE);this.param.exponentialRampToValueAtTime(l,r+t),u(this,St,l)}else this.param.linearRampToValueAtTime(e,r+t),u(this,St,e);return this}setValue(e,t=this.now,n=!0){return n&&this.param.cancelScheduledValues(t),this.param.setValueAtTime(e,t),u(this,St,e),this}get targets(){return a(this,Yt)}get context(){return a(this,Et)}get now(){return a(this,Et).currentTime}get param(){return a(this,xe).offset}get value(){return a(this,St)}get initialized(){return a(this,Wn)}dispose(){u(this,Wn,!1);try{a(this,xe).stop(),a(this,xe).disconnect(),a(this,Yt).forEach(({scaler:e})=>e&&e.disconnect())}catch{}Ge(this.nodeId)}};Et=new WeakMap,xe=new WeakMap,Yt=new WeakMap,Wn=new WeakMap,St=new WeakMap,y(Ir,"MIN_EXPONENTIAL_RAMP_VALUE",1e-6);let Zl=Ir;const $a=(i,e)=>{const{from:t,to:n}=e,[s,r]=t,[o,l]=n,h=(l-o)/(r-s);if(Array.isArray(i))return i.map(c=>{const f=Math.max(s,Math.min(r,c));return o+(f-s)*h});{const c=Math.max(s,Math.min(r,i));return o+(c-s)*h}};var Zt,de,Gn,Fi,Un,xr;class Ql{constructor(){p(this,xr),p(this,Zt,[]),p(this,de,[]),p(this,Gn,0),p(this,Fi,"C"),p(this,Un,[]),y(this,"paramType",null)}setScale(e,t,n=0,s=0,r=6,o,l=!1){const h=[...t];let c=Dl(e,h,s,r).periodsInSec.sort((f,d)=>f-d);return n!==0&&(c=Rl(c,-n)),u(this,Fi,e),u(this,Un,h),this.setAllowedPeriods(c,o,l)}setRootNote(e){this.setScale(e,a(this,Un),0,0,6,!1,!1)}setAllowedPeriods(e,t,n=!1,s="any"){let r=t?$a([...e],t):e;return u(this,de,[...r].sort((o,l)=>o-l)),u(this,Gn,a(this,de).length-1),a(this,de)}snapToValue(e,t=a(this,Zt),n,s="any"){if(t.length===0)return e;if(n===void 0)return Ni(t,e);const r=t.filter(o=>Math.abs(o-e)<=n);if(r.length>0)return Ni(r,e,s);if(n!==void 0){const o=Ni(t,e,s),l=Math.sign(o-e);return e+l*n}return e}snapToMusicalPeriod(e,t=a(this,de)){if(t.length===0||e>this.longestPeriod)return e;if(e<=this.shortestPeriod)return this.shortestPeriod;const n=a(this,de)[a(this,Gn)];if(e===n)return e;const s=e>n?"right":"left",r=Ni(t,e,s);return u(this,Gn,a(this,de).indexOf(r)),r}setAllowedValues(e,t){const n=t?$a(e,t):e;return u(this,Zt,[...n].sort((s,r)=>s-r)),a(this,Zt)}get rootNote(){return a(this,Fi)}get scalePattern(){return a(this,Un)}get periods(){return a(this,de)}get shortestPeriod(){return a(this,de)[0]}get longestPeriod(){const e=a(this,de).length-1;return a(this,de)[e]}get hasValueSnapping(){return a(this,Zt).length>0}get hasPeriodSnapping(){return a(this,de).length>0}}Zt=new WeakMap,de=new WeakMap,Gn=new WeakMap,Fi=new WeakMap,Un=new WeakMap,xr=new WeakSet;var ye,B,Bi,zn,Ye,Wi,At,Qs,Or,Vr;class Ha{constructor(e,t){p(this,Qs),y(this,"nodeType","macro"),y(this,"nodeId"),p(this,ye),p(this,B),p(this,Bi),p(this,zn),p(this,Ye,""),p(this,Wi,!1),p(this,At),y(this,"getValue",()=>a(this,ye).value),p(this,Vr,(n,s,r,o,l)=>{console.debug("adjusting param: ",a(this,Ye),"targetValue",n,"constant",s,"targetPeriod",r,"quantizedPeriod",o,"result",l)}),u(this,ye,new Zl(e,t)),u(this,B,new Ql),u(this,Bi,new Yl),u(this,zn,wt(a(this,ye).nodeId)),this.nodeId=a(this,ye).nodeId,u(this,At,t),u(this,Wi,!0)}async init(){}addTarget(e,t,n=1){return a(this,Ye)||u(this,Ye,t),Ee(t===a(this,Ye),"Macros only support a single ParamType"),a(this,ye).addTarget(e,n),this}ramp(e,t,n,s={}){const r=b(this,Qs,Or).call(this,e,n);if(r===a(this,At))return this;u(this,At,r);const{method:o="exponential",debounceMs:l=20,onComplete:h,onCompleteDelayMs:c=30}=s,f=()=>{a(this,ye).ramp(r,t,o,!0),h&&setTimeout(h,t*1e3+c)};return l===0?f():a(this,Bi).debounce(f,l,this.nodeId)(),this}debugProcessVal(e,t,n){console.log("MacroParam.#processValue input:",{value:e,constant:t,targetPeriod:n,hasValueSnapping:a(this,B).hasValueSnapping,hasPeriodSnapping:a(this,B).hasPeriodSnapping,longestPeriod:a(this,B).longestPeriod})}setAllowedParamValues(e,t){return a(this,B).setAllowedValues(e,t)}setAllowedPeriods(e,t,n=!1){return a(this,B).setAllowedPeriods(e,t,n)}setScale(e){const{rootNote:t,scale:n,tuningOffset:s=0,lowestOctave:r=0,highestOctave:o=8}=e,l=Array.isArray(n)?n:Mr[n];return a(this,B).setScale(t,l,s,r,o,e.normalize,e.snapToZeroCrossings)}setValue(e,t){return a(this,ye).setValue(e,t),u(this,At,e),this}get targetValue(){return a(this,At)}get targets(){return a(this,ye).targets}get snapper(){return a(this,B)}get rootNote(){return a(this,B).rootNote}setRootNote(e){a(this,B).setRootNote(e)}get scalePattern(){return a(this,B).scalePattern}get isReady(){return a(this,Wi)}get now(){throw new Error("Not implemented")}get audioParam(){return a(this,ye).param}get type(){return a(this,Ye)}get longestPeriod(){return a(this,B).longestPeriod}onChange(e){return this.onMessage("value:changed",e)}onMessage(e,t){return a(this,zn).onMessage(e,t)}sendMessage(e,t){a(this,zn).sendMessage(e,t)}dispose(){a(this,ye).dispose()}connect(e,t,n){return this.addTarget(e,t,n),this}disconnect(e){throw new Error("Not implemented")}}ye=new WeakMap,B=new WeakMap,Bi=new WeakMap,zn=new WeakMap,Ye=new WeakMap,Wi=new WeakMap,At=new WeakMap,Qs=new WeakSet,Or=function(i,e){if(!Number.isFinite(i)||!Number.isFinite(e))return i;const t=Math.abs(i-e);if(a(this,B).hasPeriodSnapping&&t<a(this,B).longestPeriod){const n=a(this,B).snapToMusicalPeriod(t);let s;if(a(this,Ye)==="loopEnd"&&(s=e+n),a(this,Ye)==="loopStart"&&(s=Math.max(0,e-n),s>=e-.001)){const r=a(this,B).periods.filter(o=>o<n);if(r.length>0){const o=Math.max(...r);s=e-o}else s=Math.max(0,e-.001)}if(s!==void 0)return s}else if(a(this,B).hasValueSnapping)return a(this,B).snapToValue(i);return i},Vr=new WeakMap;function Xl(i,e){return typeof e=="number"&&Number.isFinite(e)&&e>=i.min&&e<=i.max&&(!i.allowedValues||i.allowedValues.includes(e))}const ki=i=>`${(i*100).toFixed(0)}%`,Vs=i=>`${i.toFixed(0)} Hz`,Di=(i,e)=>`${(i*e).toFixed(2)} s`,Ut={volume:{label:"Volume",min:0,max:1,defaultValue:.75,apply:(i,e)=>i.setVolume(e)},dryWet:{label:"Dry/Wet",min:0,max:1,defaultValue:.5,apply:(i,e)=>i.setDryWetMix({dry:1-e,wet:e})},glide:{label:"Glide",min:0,max:1,defaultValue:0,step:.001,format:i=>i.toFixed(3),apply:(i,e)=>i.setGlideTime(e)},tempo:{label:"Tempo",min:20,max:300,defaultValue:120,step:1,format:i=>`${i.toFixed(0)} BPM`,apply:(i,e)=>i.setTempo(e)},lowpassFilter:{label:"LPF",min:40,max:2e4,defaultValue:2e4,curve:5,format:Vs,apply:(i,e)=>i.setLpfCutoff(e)},highpassFilter:{label:"HPF",min:20,max:2e4,defaultValue:40,curve:5,format:Vs,apply:(i,e)=>i.setHpfCutoff(e)},feedback:{label:"Feedback",min:0,max:1,defaultValue:0,step:.001,curve:2.5,format:i=>i.toFixed(3),apply:(i,e)=>i.setFeedbackAmount(e)},feedbackPitch:{label:"FB-Pitch",min:.25,max:4,defaultValue:1,allowedValues:[.25,.5,1,2,3,4],curve:2,apply:(i,e)=>i.setFeedbackPitchScale(e)},feedbackDecay:{label:"FB-Decay",min:.01,max:1,defaultValue:.75,curve:1.5,apply:(i,e)=>i.setFeedbackDecay(e)},feedbackLpf:{label:"FB-LPF",min:400,max:16e3,defaultValue:1e4,curve:5,format:Vs,apply:(i,e)=>i.setFeedbackLowpassCutoff(e)},distortion:{label:"Distortion",min:0,max:1,defaultValue:0,curve:1.5,apply:(i,e)=>i.outputBus.setDistortionMacro(e)},drive:{label:"Drive",min:0,max:1,defaultValue:0,apply:(i,e)=>i.outputBus.setDrive(e)},clipping:{label:"Clipping",min:0,max:1,defaultValue:0,apply:(i,e)=>i.outputBus.setClippingMacro(e)},amMod:{label:"AM",min:0,max:1,defaultValue:0,apply:(i,e)=>i.setModulationAmount("AM",e)},reverbSend:{label:"Reverb Send",min:0,max:1,defaultValue:0,format:ki,apply:(i,e)=>i.sendToFx("reverb",e)},reverbSize:{label:"Reverb Size",min:0,max:1,defaultValue:.7,apply:(i,e)=>i.setReverbAmount(e)},delaySend:{label:"Delay Send",min:0,max:1,defaultValue:0,curve:2,format:ki,apply:(i,e)=>i.sendToFx("delay",e)},delayTime:{label:"Delay Time",min:.005,max:1.5,defaultValue:.1,curve:2,format:i=>`${i.toFixed(3)} s`,apply:(i,e)=>i.outputBus.setDelayTime(e)},delayFeedback:{label:"Delay Feedback",min:0,max:1,defaultValue:.25,curve:1.5,format:ki,apply:(i,e)=>i.outputBus.setDelayFeedback(e)},gainLFORate:{label:"Amp LFO Rate",min:0,max:1,defaultValue:.1,curve:5,apply:(i,e)=>{var t;return(t=i.gainLFO)==null?void 0:t.setFrequency(e*100+.1)}},gainLFODepth:{label:"Amp LFO Depth",min:0,max:1,defaultValue:0,curve:1.5,apply:(i,e)=>{var t;return(t=i.gainLFO)==null?void 0:t.setDepth(e)}},pitchLFORate:{label:"Pitch LFO Rate",min:0,max:1,defaultValue:.01,curve:5,apply:(i,e)=>{var t;return(t=i.pitchLFO)==null?void 0:t.setFrequency(e*100+.1)}},pitchLFODepth:{label:"Pitch LFO Depth",min:0,max:1,defaultValue:0,curve:1.5,apply:(i,e)=>{var t;return(t=i.pitchLFO)==null?void 0:t.setDepth(e/10)}},trimStart:{label:"Start",min:0,max:1,defaultValue:0,step:.001,format:Di,apply:(i,e)=>i.setSampleStartPoint(e*i.sampleDuration)},trimEnd:{label:"End",min:0,max:1,defaultValue:1,step:.001,format:Di,apply:(i,e)=>i.setSampleEndPoint(e*i.sampleDuration)},loopStart:{label:"Loop Start",min:0,max:1,defaultValue:0,step:.001,format:Di,apply:(i,e)=>i.setLoopStart(e*i.sampleDuration)},loopDuration:{label:"Loop Length",min:0,max:1,defaultValue:1,curve:4,format:(i,e)=>{const t=i*e;return t<=.061?`${(t*1e3).toFixed(0)}ms`:`${t.toFixed(2)} s`},apply:(i,e)=>i.setLoopDuration(e*i.sampleDuration)},loopEnd:{label:"Loop End",min:0,max:1,defaultValue:1,step:.001,format:Di,apply:(i,e)=>i.setLoopEnd(e*i.sampleDuration)},loopRampDuration:{label:"Loop Ramp",min:.001,max:1,defaultValue:.5,step:.001,apply:(i,e)=>i.setLoopRampDuration(e)},loopDurationDrift:{label:"Loop Drift",min:0,max:1,defaultValue:.3,step:.001,curve:.5,format:i=>`${(i*100).toFixed(1)}%`,apply:(i,e)=>i.setLoopDurationDriftAmount(e)},keytrackLoop:{label:"KeyTrack",min:0,max:1,defaultValue:0,format:ki,apply:(i,e)=>i.setKeytrackLoopAmount(e)}};var Qt,se,Oe,Xt,$n;class Xs{constructor(e){p(this,Qt),p(this,se),p(this,Oe),p(this,Xt,new Set),p(this,$n,null),y(this,"storeCurrentValues",()=>{u(this,$n,{rate:a(this,se).frequency.value,depth:a(this,Oe).gain.value})}),y(this,"getStoredValues",()=>a(this,$n)),u(this,Qt,e),u(this,se,e.createOscillator()),u(this,Oe,e.createGain()),a(this,se).frequency.value=1,a(this,Oe).gain.value=0,a(this,se).connect(a(this,Oe)),a(this,se).start()}setFrequency(e,t=this.now){a(this,se).frequency.setValueAtTime(e,t)}setDepth(e,t=this.now){a(this,Oe).gain.setValueAtTime(e,t)}setWaveform(e,t){if(e instanceof PeriodicWave)a(this,se).setPeriodicWave(e);else if(typeof e=="string"&&nl(e)){const n=il(a(this,Qt),e,t);a(this,se).setPeriodicWave(n)}else a(this,se).type=e}setPeriodicWave(e){a(this,se).setPeriodicWave(e)}connect(e){a(this,Oe).connect(e),a(this,Xt).add(e)}disconnect(e){e?(a(this,Oe).disconnect(e),a(this,Xt).delete(e)):(a(this,Oe).disconnect(),a(this,Xt).clear())}setMusicalNote(e,t={}){const{divisor:n=1,glideTime:s=0,timestamp:r=this.now}=t,o=440*Math.pow(2,(e-69)/12)/n;if(s<=.001)return this.setFrequency(o,r),this;if(t.glideFromMidiNote){const l=440*Math.pow(2,(t.glideFromMidiNote-69)/12)/n;this.setFrequency(l,r)}a(this,se).frequency.setTargetAtTime(o,r+.001,s)}getPitchWobbleWaveform(){const e=new Float32Array(8),t=new Float32Array(8);e[0]=0,t[0]=0;for(let n=1;n<8;n++)e[n]=Math.random()*.5,t[n]=Math.random()*.5;return a(this,Qt).createPeriodicWave(e,t,{disableNormalization:!0})}get now(){return a(this,Qt).currentTime}dispose(){a(this,se).stop(),a(this,Xt).clear(),u(this,$n,null),this.disconnect()}}Qt=new WeakMap,se=new WeakMap,Oe=new WeakMap,Xt=new WeakMap,$n=new WeakMap;var Hn,Gi,ve,Jt,$e,en,qn;class He{constructor(e,t,n,s={}){y(this,"nodeId"),y(this,"nodeType"),p(this,Hn),p(this,Gi,!1),p(this,ve),p(this,Jt),p(this,$e),p(this,en,new Set),p(this,qn,new Set),this.nodeType=n,this.nodeId=We(n,this),u(this,Hn,wt(this.nodeId)),u(this,ve,e),s.createIOGains?(u(this,Jt,new GainNode(t,{gain:1})),u(this,$e,new GainNode(t,{gain:1})),a(this,Jt).connect(a(this,ve)),a(this,ve).connect(a(this,$e))):(u(this,Jt,e),u(this,$e,e)),u(this,Gi,!0)}onMessage(e,t){return a(this,Hn).onMessage(e,t)}sendUpstreamMessage(e,t){return a(this,Hn).sendMessage(e,t),this}connect(e){var t;const n="input"in e?e.input:e;a(this,$e).connect(n),"nodeId"in e&&(a(this,en).add(e.nodeId),(t=e.addIncoming)==null||t.call(e,this.nodeId))}disconnect(e){var t;if(e){const n="input"in e?e.input:e;a(this,$e).disconnect(n),"nodeId"in e&&(a(this,en).delete(e.nodeId),(t=e.removeIncoming)==null||t.call(e,this.nodeId))}else a(this,$e).disconnect(),a(this,en).clear()}addIncoming(e){a(this,qn).add(e)}removeIncoming(e){a(this,qn).delete(e)}get connections(){return{outgoing:Array.from(a(this,en)),incoming:Array.from(a(this,qn))}}setParam(e,t,n=this.now){if("parameters"in a(this,ve)){const r=a(this,ve).parameters.get(e);if(r){r.setValueAtTime(t,n);return}}const s=a(this,ve)[e];if(s!=null&&s.setValueAtTime){s.setValueAtTime(t,n);return}console.warn(`Parameter '${e}' not found on node`)}getAudioParam(e){return a(this,ve)[e]||null}get audioNode(){return a(this,ve)}get input(){return a(this,Jt)}get output(){return a(this,$e)}get context(){return a(this,ve).context}get now(){return a(this,ve).context.currentTime}get initialized(){return a(this,Gi)}dispose(){this.disconnect(),Ge(this.nodeId)}}Hn=new WeakMap,Gi=new WeakMap,ve=new WeakMap,Jt=new WeakMap,$e=new WeakMap,en=new WeakMap,qn=new WeakMap;const Jl={threshold:-13,knee:6,ratio:4,attack:.003,release:.05},eh={threshold:-1,ratio:20,attack:.001,release:.01,knee:0};var Js,Ui,tn,jn,F,Kn;const Lr=class ea{constructor(e=Bt()){y(this,"nodeId"),y(this,"nodeType","dattorro-reverb"),p(this,Js,!1),p(this,Ui),p(this,tn,new Set),p(this,jn,new Set),p(this,F),p(this,Kn,"default"),this.nodeId=We(this.nodeType,this),u(this,Ui,e),u(this,F,new AudioWorkletNode(e,"dattorro-reverb-processor",{outputChannelCount:[2]})),this.setParam("dry",0),this.setAmountMacro(.01)}connect(e){var t;const n="input"in e?e.input:e;a(this,F).connect(n),"nodeId"in e&&(a(this,tn).add(e.nodeId),(t=e.addIncoming)==null||t.call(e,this.nodeId))}disconnect(e){var t;if(e){const n="input"in e?e.input:e;a(this,F).disconnect(n),"nodeId"in e&&(a(this,tn).delete(e.nodeId),(t=e.removeIncoming)==null||t.call(e,this.nodeId))}else a(this,F).disconnect(),a(this,tn).clear()}addIncoming(e){a(this,jn).add(e.nodeId)}removeIncoming(e){a(this,jn).delete(e.nodeId)}setParam(e,t,n=this.now){var s;if(!isFinite(t)){console.warn(`Skipping non-finite value for ${e}:`,t);return}if(e==="size"){this.setAmountMacro(t);return}if(e==="diffusion"){this.setDiffusionMacro(t);return}(s=a(this,F).parameters.get(e))==null||s.setValueAtTime(t,n)}getAudioParam(e){return e==="diffusion"?{value:this.getDiffusionMacroValue(),setValueAtTime:(t,n)=>this.setDiffusionMacro(t)}:a(this,F).parameters.get(e)||null}setAmountMacro(e){var t;if(e<0||e>1){console.warn("Reverb amount must be 0-1 range");return}const n=ea.PRESETS[a(this,Kn)],s=Ne(e,0,1,n.decay,.93),r=Ne(e,0,1,n.excursionRate,2),o=Ne(e,0,1,n.excursionDepth,2),l=Ne(e,0,1,n.damping,.65),h=Ne(e,0,1,n.bandwidth,.2),c=Ne(e,0,1,.3,1);this.setDiffusionMacro(c),(t=this.getAudioParam("decay"))==null||t.setTargetAtTime(s,this.now,.1),this.setParam("excursionRate",r),this.setParam("excursionDepth",o),this.setParam("damping",l),this.setParam("bandwidth",h)}setPreset(e="default",t=.5){u(this,Kn,e);const n=ea.PRESETS[e],s=a(this,F).context.currentTime;Object.entries(n).forEach(([r,o])=>{const l=a(this,F).parameters.get(r);l?l.linearRampToValueAtTime(o,s+t):console.warn(`Parameter '${r}' not found in reverb node`)})}setDiffusionMacro(e){const t=Math.max(.1,e*.75),n=Math.max(.1,e*.625),s=Math.min(.7,Math.max(.1,e*.6)),r=Math.max(.2,e*.4);this.setParam("inputDiffusion1",t),this.setParam("inputDiffusion2",n),this.setParam("decayDiffusion1",s),this.setParam("decayDiffusion2",r)}getDiffusionMacroValue(){var e;return((((e=this.getAudioParam("inputDiffusion1"))==null?void 0:e.value)??.75)-.1)/(.75-.1)}getCurrentSettings(){const e={};return Array.from(a(this,F).parameters.keys()).forEach(t=>{var n;e[t]=((n=a(this,F).parameters.get(t))==null?void 0:n.value)??0}),e}get audioNode(){return a(this,F)}get context(){return a(this,Ui)}get input(){return a(this,F)}get output(){return a(this,F)}get now(){return a(this,F).context.currentTime}get initialized(){return a(this,Js)}get currentPreset(){return a(this,Kn)}get connections(){return{outgoing:Array.from(a(this,tn)),incoming:Array.from(a(this,jn))}}get numberOfInputs(){return this.input.numberOfInputs}get numberOfOutputs(){return this.output.numberOfOutputs}get workletInfo(){return{numberOfInputs:a(this,F).numberOfInputs,numberOfOutputs:a(this,F).numberOfOutputs,channelCount:a(this,F).channelCount,channelCountMode:a(this,F).channelCountMode}}dispose(){this.disconnect(),Ge(this.nodeId)}};Js=new WeakMap,Ui=new WeakMap,tn=new WeakMap,jn=new WeakMap,F=new WeakMap,Kn=new WeakMap,y(Lr,"PRESETS",{room:{preDelay:1525,bandwidth:.5683,inputDiffusion1:.4666,inputDiffusion2:.5853,decay:.3226,decayDiffusion1:.6954,decayDiffusion2:.6022,damping:.6446,excursionRate:0,excursionDepth:0},church:{preDelay:0,bandwidth:.928,inputDiffusion1:.7331,inputDiffusion2:.4534,decay:.7,decayDiffusion1:.7839,decayDiffusion2:.1992,damping:.5975,excursionRate:0,excursionDepth:0},freeze:{preDelay:0,bandwidth:.999,inputDiffusion1:.75,inputDiffusion2:.625,decay:1,decayDiffusion1:.5,decayDiffusion2:.711,damping:.005,excursionRate:.3,excursionDepth:1.4},ether:{preDelay:0,bandwidth:.999,inputDiffusion1:.23,inputDiffusion2:.667,decay:.45,decayDiffusion1:.7,decayDiffusion2:.5,damping:.3,excursionRate:.85,excursionDepth:1.2},default:{preDelay:0,bandwidth:.85,inputDiffusion1:.4,inputDiffusion2:.45,decay:.1,decayDiffusion1:.5,decayDiffusion2:.45,damping:.25,excursionRate:.3,excursionDepth:.3}});let th=Lr;class ks extends AudioWorkletNode{constructor(e,t,n){super(e,t,n),y(this,"_processorReady",!1),y(this,"_messageQueue",[]),y(this,"_onProcessorMessage"),this.port.onmessage=s=>{if(s.data&&s.data.type==="initialized"){this._processorReady=!0;for(const r of this._messageQueue)this.port.postMessage(r);this._messageQueue=[]}this._onProcessorMessage&&this._onProcessorMessage(s)}}setParam(e,t){const n=this.parameters.get(e);return n?(n.setValueAtTime(t,this.context.currentTime),this):(console.warn(`Parameter '${String(e)}' not found on worklet node`),this)}getParam(e){return this.parameters.get(e)}sendProcessorMessage(e){return this._processorReady?this.port.postMessage(e):this._messageQueue.push(e),this}onProcessorMessage(e){return this._onProcessorMessage=e,this}dispose(){this.disconnect(),this.port.onmessage=null,this.port.close()}}function nh(i){return new ks(i,"feedback-delay-processor")}function ih(i){return new ks(i,"distortion-processor")}function sh(i){return new ks(i,"delay-processor")}var zi,Yn,te,Zn,ot,nn,Qn,Xn,$i,Mn,ta,na,ia,sa,Jn,Hi,qi,ws,Fr,qa;class Br{constructor(e=Bt()){p(this,ws),y(this,"nodeId"),y(this,"nodeType","harmonic-feedback"),p(this,zi,!1),p(this,Yn),p(this,te),p(this,Zn),p(this,ot),p(this,nn,new Set),p(this,Qn,new Set),p(this,Xn),p(this,$i,1),p(this,Mn,!1),p(this,ta,0),p(this,na,.999),p(this,ia,.15),p(this,sa,1),p(this,Jn,.00012656238799684143),p(this,Hi,2),p(this,qi,0),this.nodeId=We(this.nodeType,this),u(this,Yn,e),u(this,te,nh(e)),u(this,Zn,new GainNode(e,{gain:1})),u(this,ot,new GainNode(e,{gain:1})),a(this,Zn).connect(a(this,te)).connect(a(this,ot));const t=this.setPitch(60);u(this,Xn,t),u(this,zi,!0)}trigger(e,t={}){const{secondsFromNow:n=0,cents:s=0,velocity:r=100,glideTime:o=0,triggerDecay:l=!0}=t,h=this.now+n;return this.setPitch(e,s,h,o),l&&b(this,ws,Fr).call(this),this}setAmountMacro(e){const t=G(e,0,1);return this.setFeedbackAmount(t),u(this,qi,t),this}get currentAmount(){return a(this,qi)}setPitch(e,t=0,n=this.now,s=0){const r=440*Math.pow(2,(e-69)/12),o=1/(t!==0?r*Math.pow(2,t/1200):r),l=a(this,Jn),h=Math.max(l,o);return this.setDelay(h,n,s),h}setDelay(e,t=this.now,n=0){u(this,Xn,e);const s=e*a(this,$i),r=G(s,a(this,Jn),a(this,Hi));return n===0||!isFinite(n)?(this.getAudioParam("delayTime").setValueAtTime(r,t),this):(this.getAudioParam("delayTime").linearRampToValueAtTime(r,t+n),this)}setDelayMultiplier(e,t=this.now,n=.75){if(typeof e!="number"||!isFinite(e)){console.warn("setDelayMultiplier:Invalid multiplier:",e);return}const s=G(e,.25,4,{warn:!0,name:"pitchDelayMultiplier"}),r=this.getAudioParam("delayTime");u(this,$i,s);const o=G(s*a(this,Xn),a(this,Jn),a(this,Hi));return n===0||!isFinite(n)?(r.setValueAtTime(o,t),this):(r.setTargetAtTime(o,t,n/3),this)}setFeedbackAmount(e,t=this.now){const n=Vl(e,{inputRange:{min:0,max:1},outputRange:{min:Math.max(.001,a(this,ta)),max:a(this,na)},curve:"power4"});return a(this,te).parameters.get("feedbackAmount").setValueAtTime(n,t),this}setAutoGain(e,t){return a(this,te).port.postMessage({type:"setAutoGain",enabled:e,amount:t}),this}setDecay(e,t=this.now){const n=Ne(e,0,1,a(this,ia),a(this,sa));return this.getAudioParam("decay").setValueAtTime(n,t),this}setLowpassCutoff(e){if(e>16e3||e<100){console.warn("Feedback lowpass cutoff out of bounds");return}this.getAudioParam("lowpass").setTargetAtTime(e,this.now,.1)}connect(e){var t;const n="input"in e?e.input:e;a(this,ot).connect(n),"nodeId"in e&&(a(this,nn).add(e.nodeId),(t=e.addIncoming)==null||t.call(e,this.nodeId))}disconnect(e){var t;if(e){const n="input"in e?e.input:e;a(this,ot).disconnect(n),"nodeId"in e&&(a(this,nn).delete(e.nodeId),(t=e.removeIncoming)==null||t.call(e,this.nodeId))}else a(this,ot).disconnect(),a(this,nn).clear()}addIncoming(e){a(this,Qn).add(e.nodeId)}removeIncoming(e){a(this,Qn).delete(e.nodeId)}setParam(e,t,n=this.now){var s;switch(e){case"feedback":this.setFeedbackAmount(t,n);break;case"delayTime":this.setDelay(t,n);break;case"amount":this.setAmountMacro(t);break;case"decay":this.setDecay(t,n);break;default:(s=a(this,te).parameters.get(e))==null||s.setValueAtTime(t,n);break}}getAudioParam(e){return a(this,te).parameters.get(e)||null}get audioNode(){return a(this,te)}get context(){return a(this,Yn)}get now(){return a(this,Yn).currentTime}get input(){return a(this,Zn)}get output(){return a(this,ot)}get connections(){return{outgoing:Array.from(a(this,nn)),incoming:Array.from(a(this,Qn))}}get initialized(){return a(this,zi)}get decayActive(){return a(this,Mn)}get numberOfInputs(){return this.input.numberOfInputs}get numberOfOutputs(){return this.output.numberOfOutputs}get workletInfo(){return{numberOfInputs:a(this,te).numberOfInputs,numberOfOutputs:a(this,te).numberOfOutputs,channelCount:a(this,te).channelCount,channelCountMode:a(this,te).channelCountMode}}dispose(){this.disconnect(),Ge(this.nodeId)}}zi=new WeakMap,Yn=new WeakMap,te=new WeakMap,Zn=new WeakMap,ot=new WeakMap,nn=new WeakMap,Qn=new WeakMap,Xn=new WeakMap,$i=new WeakMap,Mn=new WeakMap,ta=new WeakMap,na=new WeakMap,ia=new WeakMap,sa=new WeakMap,Jn=new WeakMap,Hi=new WeakMap,qi=new WeakMap,ws=new WeakSet,Fr=function(){a(this,Mn)&&b(this,ws,qa).call(this),u(this,Mn,!0);const i=this.getAudioParam("feedbackAmount").value;return a(this,te).port.postMessage({type:"triggerDecay",baseFeedbackAmount:i}),this},qa=function(){return u(this,Mn,!1),a(this,te).port.postMessage({type:"stopDecay"}),this};var ji,N,ei,sn,Pe,ue,qe,an,ti,lt,Ze,Wr,aa,ra,Ki,ja,Gr,ht;class ah{constructor(e){p(this,Ze),y(this,"nodeId"),y(this,"nodeType","InstrumentBus"),p(this,ji),p(this,N),p(this,ei,!1),p(this,sn,null),p(this,Pe,{}),p(this,ue,new Map),p(this,qe,new Map),p(this,an,new Set),p(this,ti,new Set),p(this,lt,t=>{for(let n=0;n<t.length-1;n++)b(this,Ze,aa).call(this,t[n],t[n+1]);return this}),p(this,Ki,(t,n={})=>{const{initGain:s=0}=n,r=new He(new GainNode(a(this,N),{gain:s}),a(this,N),"gain");return a(this,qe).set(t,r),r}),y(this,"getSendNode",t=>a(this,qe).get(t)),p(this,ht,null),this.nodeId=We(this.nodeType,this),u(this,N,e||Bt()),u(this,ji,wt(this.nodeId))}createGainNode(e,t={}){const{initialGain:n=1}=t;return new He(new GainNode(a(this,N),{gain:n}),e,"gain")}async init(){if(!a(this,ei))return a(this,sn)?a(this,sn):(u(this,sn,(async()=>{try{const e=this.createGainNode(a(this,N),{initialGain:1}),t=this.createGainNode(a(this,N),{initialGain:1}),n=this.createGainNode(a(this,N),{initialGain:1}),s=this.createGainNode(a(this,N),{initialGain:1}),r=new He(new BiquadFilterNode(a(this,N),{type:"lowpass",Q:.5,frequency:a(this,N).sampleRate/2-1e3}),a(this,N),"lpf"),o=new He(new BiquadFilterNode(a(this,N),{type:"highpass",Q:.707,frequency:20}),a(this,N),"hpf"),l=new He(new DynamicsCompressorNode(a(this,N),Jl),a(this,N),"compressor"),h=new He(new DynamicsCompressorNode(a(this,N),eh),a(this,N),"limiter"),c=new He(ih(a(this,N)),a(this,N),"distortion"),f=new He(sh(a(this,N)),a(this,N),"Delay",{createIOGains:!1}),d=new th(a(this,N)),m=new Br(a(this,N));b(this,Ze,Gr).call(this,{input:e,lpf:r,hpf:o,dryMix:t,wetMix:n,output:s,compressor:l,limiter:h,feedback:m,distortion:c,reverb:d,delay:f}),a(this,Ki).call(this,"reverb"),a(this,Ki).call(this,"delay"),b(this,Ze,Wr).call(this),u(this,ei,!0)}catch{}})()),a(this,sn))}getNode(e){if(e.endsWith("_send")){const t=e.replace("_send","");return a(this,qe).get(t)}return a(this,Pe)[e]}removeNode(e){if(a(this,Pe)[e]){b(this,Ze,ra).call(this,e);for(const[t,n]of a(this,ue)){const s=n.indexOf(e);s>-1&&(n.splice(s,1),a(this,ue).set(t,n))}delete a(this,Pe)[e],a(this,ue).delete(e)}return this}noteOn(e,t=100,n=0,s=0){const r=this.getNode("feedback");r&&"trigger"in r&&typeof r.trigger=="function"&&r.trigger(e,{velocity:t,secondsFromNow:n,glideTime:s});const o=this.getNode("delay");return o==null||o.audioNode.sendProcessorMessage({type:"trigger"}),this}setSendAmount(e,t){const n=a(this,qe).get(e);if(!n)return console.warn(`Send effect ${e} not found`),this;const s=Math.max(0,Math.min(1,t));return n.setParam("gain",s),this}setHpfCutoff(e){var t;const n=G(e,20,this.context.sampleRate/2-1e3);return(t=this.getNode("hpf"))==null||t.audioNode.frequency.setTargetAtTime(n,this.now,.1),this}setLpfCutoff(e){var t;const n=G(e,20,this.context.sampleRate/2-1e3);return(t=this.getNode("lpf"))==null||t.audioNode.frequency.setTargetAtTime(n,this.now,.1),this}setCompressorParams(e){var t;const n=(t=this.getNode("compressor"))==null?void 0:t.audioNode;return e.threshold!==void 0&&n.threshold.setValueAtTime(e.threshold,this.now),e.knee!==void 0&&n.knee.setValueAtTime(e.knee,this.now),e.ratio!==void 0&&n.ratio.setValueAtTime(e.ratio,this.now),e.attack!==void 0&&n.attack.setValueAtTime(e.attack,this.now),e.release!==void 0&&n.release.setValueAtTime(e.release,this.now),this}setDryWetMix(e){var t,n;if(e.dry!==void 0){const s=Math.max(0,Math.min(1,e.dry));(t=this.getNode("dryMix"))==null||t.setParam("gain",s)}if(e.wet!==void 0){const s=Math.max(0,Math.min(1,e.wet));(n=this.getNode("wetMix"))==null||n.setParam("gain",s)}return this}setDelayTime(e){var t;const n=G(e,0,5);return(t=this.getNode("delay"))==null||t.setParam("delayTime",n),this}setDelayFeedback(e){var t;const n=Ne(e,0,1,0,.99);return(t=this.getNode("delay"))==null||t.setParam("feedbackAmount",n),this}setDelayCharacter(e){const t=this.getNode("delay");return t==null||t.audioNode.sendProcessorMessage({type:"setCharacter",modes:e}),this}setReverbSize(e){const t=this.getNode("reverb");return t&&"setAmountMacro"in t&&typeof t.setAmountMacro=="function"&&t.setAmountMacro(e),this}setReverbDecay(e){var t;return(t=this.getNode("reverb"))==null||t.setParam("decay",e),this}setDistortionMacro(e){const t=G(e,0,1);this.setDrive(t);const n=Ne(t,0,1,0,.95);this.setClippingMacro(n)}setDrive(e){var t;return(t=this.getNode("distortion"))==null||t.setParam("distortionDrive",e),this}setClippingMacro(e){const t=G(e,0,1),n=this.getNode("distortion");n==null||n.setParam("clippingAmount",t);const s=Ne(t,0,1,.25,.03);return n==null||n.setParam("clippingThreshold",s),this}setClippingMode(e){const t=this.getNode("distortion");t instanceof ks&&t.sendProcessorMessage({type:"setLimitingMode",mode:e})}setFeedbackAmount(e){const t=this.getNode("feedback");return t&&"setAmountMacro"in t&&typeof t.setAmountMacro=="function"&&t.setAmountMacro(e),this}setFeedbackPitchScale(e){const t=this.getNode("feedback");return t&&"setDelayMultiplier"in t&&typeof t.setDelayMultiplier=="function"&&t.setDelayMultiplier(e),this}setFeedbackDecay(e){var t;return(t=this.getNode("feedback"))==null||t.setDecay(e),this}setFeedbackLowpassCutoff(e){var t;return(t=this.getNode("feedback"))==null||t.setLowpassCutoff(e),this}connect(e){var t;this.getNode("output").connect(e),"nodeId"in e&&(a(this,an).add(e.nodeId),(t=e.addIncoming)==null||t.call(e,this.nodeId))}disconnect(e){var t;this.getNode("output").disconnect(e),e&&"nodeId"in e?(a(this,an).delete(e.nodeId),(t=e.removeIncoming)==null||t.call(e,this.nodeId)):e||a(this,an).clear()}addIncoming(e){a(this,ti).add(e)}removeIncoming(e){a(this,ti).delete(e)}setParam(e,t){switch(e){case"outputLevel":this.outputLevel=t;break;case"reverbAmount":this.setReverbSize(t);break;case"feedbackAmount":this.setFeedbackAmount(t);break;case"feedbackDecay":this.setFeedbackDecay(t);break;case"drive":this.setDrive(t);break;case"hpfCutoff":this.setHpfCutoff(t);break;case"lpfCutoff":this.setLpfCutoff(t);break;default:console.warn(`Parameter '${e}' not recognized on InstrumentMasterBus`);break}}getAudioParam(e){var t,n;switch(e){case"outputLevel":return this.getNode("output").getAudioParam("gain");case"hpfCutoff":return((t=this.getNode("hpf"))==null?void 0:t.getAudioParam("frequency"))||null;case"lpfCutoff":return((n=this.getNode("lpf"))==null?void 0:n.getAudioParam("frequency"))||null;default:return null}}getInput(){return this.getNode("input")}getOutput(){return this.getNode("output")}getLpf(){return this.getNode("lpf")}getHpf(){return this.getNode("hpf")}getDryMix(){return this.getNode("dryMix")}getWetMix(){return this.getNode("wetMix")}getCompressor(){return this.getNode("compressor")}getLimiter(){return this.getNode("limiter")}getDistortion(){return this.getNode("distortion")}getReverb(){return this.getNode("reverb")}getFeedback(){return this.getNode("feedback")}dispose(){for(const e of Object.keys(a(this,Pe)))b(this,Ze,ra).call(this,e);u(this,Pe,{}),a(this,ue).clear(),a(this,qe).clear(),Ge(this.nodeId)}get audioNode(){return this.getNode("output").audioNode}get context(){return a(this,N)}get connections(){return{outgoing:Array.from(a(this,an)),incoming:Array.from(a(this,ti))}}get input(){var e;return(e=this.getNode("input"))==null?void 0:e.audioNode}get output(){var e;return(e=this.getNode("output"))==null?void 0:e.audioNode}get now(){return a(this,N).currentTime}set outputLevel(e){const t=Math.max(0,Math.min(1,e));this.getNode("output").setParam("gain",t)}get outputLevel(){const e=this.getNode("output").getAudioParam("gain");return(e==null?void 0:e.value)||0}get initialized(){return a(this,ei)}get dryWetMix(){var e,t,n,s;return{dry:((t=(e=this.getNode("dryMix"))==null?void 0:e.getAudioParam("gain"))==null?void 0:t.value)||0,wet:((s=(n=this.getNode("wetMix"))==null?void 0:n.getAudioParam("gain"))==null?void 0:s.value)||0}}getSendAmount(e){var t;const n=a(this,qe).get(e);return((t=n==null?void 0:n.getAudioParam("gain"))==null?void 0:t.value)??0}getRoutingMap(){const e={};for(const[t,n]of a(this,ue))e[t]=[...n];return e}debugRouting(){console.debug("=== Bus Routing Map ===");for(const[e,t]of a(this,ue))t.length>0&&console.debug(`${e} -> ${t.join(", ")}`);console.debug("======================")}debugSends(){console.debug("=== Sends ===");for(const[e]of a(this,qe)){const t=this.getSendAmount(e);console.debug(`${e}: Send=${t.toFixed(2)}}`)}console.debug("=================================")}listNodes(){return Object.keys(a(this,Pe))}startLevelMonitoring(e=1e3,t=1024,n=!1){this.stopLevelMonitoring(),u(this,ht,new xa(a(this,N),this.getNode("input").audioNode,this.getNode("output").audioNode,t)),a(this,ht).start(e,void 0,n),console.log("Level monitoring started")}stopLevelMonitoring(){a(this,ht)&&(a(this,ht).stop(),u(this,ht,null),console.log("Level monitoring stopped"))}logLevels(){let e=a(this,ht);e===null&&(e=new xa(a(this,N),this.getNode("input").audioNode,this.getNode("output").audioNode));const t=e.getLevels();console.log(`Levels: Input RMS ${t.input.rmsDB.toFixed(1)} dB | Output RMS ${t.output.rmsDB.toFixed(1)} dB`)}onMessage(e,t){return a(this,ji).onMessage(e,t)}}ji=new WeakMap,N=new WeakMap,ei=new WeakMap,sn=new WeakMap,Pe=new WeakMap,ue=new WeakMap,qe=new WeakMap,an=new WeakMap,ti=new WeakMap,lt=new WeakMap,Ze=new WeakSet,Wr=function(){a(this,lt).call(this,["input","hpf","feedback","dryMix"]),a(this,lt).call(this,["feedback","delay_send","delay","wetMix"]),a(this,lt).call(this,["delay","reverb_send"]),a(this,lt).call(this,["feedback","reverb_send","reverb","wetMix"]),a(this,lt).call(this,["wetMix","distortion"]),b(this,Ze,aa).call(this,"dryMix","distortion"),a(this,lt).call(this,["distortion","compressor","lpf","limiter","output"])},aa=function(i,e){const t=i.endsWith("_send")?this.getNode(i):this.getNode(i),n=e.endsWith("_send")?this.getNode(e):this.getNode(e);if(!t||!n)return console.warn(`Cannot connect ${i} -> ${e}: node not found`),this;t.connect(n);const s=a(this,ue).get(i)||[];return s.includes(e)||(s.push(e),a(this,ue).set(i,s)),this},ra=function(i,e){const t=a(this,Pe)[i];if(!t)return this;if(e){const n=a(this,Pe)[e];if(n){t.disconnect(n);const s=a(this,ue).get(i)||[],r=s.indexOf(e);r>-1&&(s.splice(r,1),a(this,ue).set(i,s))}}else t.disconnect(),a(this,ue).set(i,[]);return this},Ki=new WeakMap,ja=function(i,e){a(this,Pe)[i]=e,a(this,ue).set(i,[])},Gr=function(i){return Object.keys(i).forEach(e=>{const t=i[e];t!==void 0&&b(this,Ze,ja).call(this,e,t)}),this},ht=new WeakMap;async function rh(i){const e=new ah(i);return await e.init(),e}const z={NOT_READY:"NOT_READY",LOADED:"LOADED",PLAYING:"PLAYING",RELEASING:"RELEASING",STOPPING:"STOPPING",STOPPED:"STOPPED"};var En,Pt,Dn,re,q,Ve,Be,k,U,Ms,L,Yi,vi,Zi,bt,rn,ge,be,Sn,oa,yt,la,Qi,Xi,R,Ur,zr,ha,$r,Hr,ct,ut,on,ln,Ji,qr,Ka,jr;class oh{constructor(e=Bt(),t={}){p(this,R),y(this,"nodeId"),y(this,"nodeType","sample-voice"),p(this,En),p(this,Pt,null),p(this,Dn),p(this,re),p(this,q,null),p(this,Ve,null),p(this,Be,null),p(this,k,new Map),p(this,U,z.NOT_READY),p(this,Ms,!1),p(this,L,null),p(this,Yi,-1),p(this,vi,0),p(this,Zi,0),p(this,bt),p(this,rn,!1),p(this,ge,null),p(this,be,null),p(this,Sn,40),p(this,oa,.5),p(this,yt,18e3),p(this,la,.707),p(this,Qi,0),p(this,Xi,.5),p(this,$r,()=>{console.table("Available worklet params:",Array.from(a(this,re).parameters.keys()))}),p(this,ct,null),p(this,ut,null),y(this,"enableEnvelope",n=>{var s;(s=a(this,k).get(n))==null||s.enable()}),y(this,"disableEnvelope",n=>{var s;if((s=a(this,k).get(n))==null||s.disable(),n==="filter-env"&&a(this,bt)){const r=this.getParam("lpf");r==null||r.cancelScheduledValues(this.now),r==null||r.setValueAtTime(a(this,yt),this.now+.01)}}),y(this,"setEnvelopeTimeScale",(n,s)=>{var r;(r=a(this,k).get(n))==null||r.setTimeScale(s)}),y(this,"setEnvelopeSustainPoint",(n,s)=>{const r=a(this,k).get(n);r!=null&&r.isEnabled&&r.setSustainPoint(s)}),y(this,"setEnvelopeReleasePoint",(n,s)=>{const r=a(this,k).get(n);r!=null&&r.isEnabled&&r.setReleasePoint(s)}),y(this,"getEnvelope",n=>a(this,k).get(n)),y(this,"setStartPoint",(n,s=this.now)=>{this.setParam("startPoint",n,s)}),y(this,"setEndPoint",(n,s=this.now)=>{this.setParam("endPoint",n,s)}),y(this,"disablePitch",()=>{var n;u(this,rn,!0);const s=this.now,r=.1;(n=this.getParam("playbackRate"))==null||n.linearRampToValueAtTime(1,s+r),b(this,R,on).call(this,1,s,{glideTime:r}),b(this,R,ln).call(this,1,s,{glideTime:r})}),y(this,"enablePitch",()=>{var n;u(this,rn,!1);const s=this.now,r=.1;if(a(this,L)){const o=Cs(a(this,L));(n=this.getParam("playbackRate"))==null||n.linearRampToValueAtTime(o,this.context.currentTime+.01),b(this,R,on).call(this,o,s,{glideTime:r}),b(this,R,ln).call(this,o,s,{glideTime:r})}}),y(this,"setEnvelopeLoop",(n,s,r="normal")=>{const o=a(this,k).get(n);return o==null||o.setLoopEnabled(s,r),this}),y(this,"syncEnvelopeToPlaybackRate",(n,s)=>{const r=a(this,k).get(n);return r==null||r.syncToPlaybackRate(s),this}),y(this,"setPanDriftEnabled",n=>this.sendToProcessor({type:"setPanDriftEnabled",value:n})),y(this,"setTimestretchEnabled",n=>this.sendToProcessor({type:"setPreserveDuration",value:n})),this.context=e,this.nodeId=We(this.nodeType,this),u(this,En,wt(this.nodeId)),u(this,bt,t.enableFilters??!0),u(this,Dn,new GainNode(e,{gain:1})),u(this,re,new AudioWorkletNode(e,"sample-player-processor",{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:t.processorOptions||{}}))}async init(){return a(this,Pt)?a(this,Pt):(u(this,Pt,(async()=>{try{a(this,bt)&&b(this,R,zr).call(this),u(this,Be,new Br(this.context)),u(this,Ve,new GainNode(this.context,{gain:1})),b(this,R,Ji).call(this),this.setParam("loopStart",0,this.now),this.setParam("loopEnd",0,this.now),b(this,R,Ur).call(this),b(this,R,ha).call(this),b(this,R,jr).call(this),a(this,re).port.start()}catch(e){throw this.dispose(),u(this,Pt,null),e}})()),a(this,Pt))}async loadBuffer(e,t){if(u(this,U,z.NOT_READY),e.sampleRate!==this.context.sampleRate)return console.warn(`Sample rate mismatch - buffer: ${e.sampleRate}, context: ${this.context.sampleRate}`),!1;const n=Array.from({length:e.numberOfChannels},(s,r)=>e.getChannelData(r).slice());return this.sendToProcessor({type:"voice:setBuffer",buffer:n,durationSeconds:e.duration}),t!=null&&t.length&&(b(this,R,Hr).call(this,t),this.sendToProcessor({type:"voice:setZeroCrossings",zeroCrossings:t})),!0}freeze(e){return console.info(`SampleVoice: freeze(${e}) called. 
      Spectral freeze not implemented yet`),this}setGlideTime(e){u(this,Zi,e)}trigger(e){var t,n,s,r;const{midiNote:o=60,velocity:l=100,secondsFromNow:h=0}={...e},c=this.now+h;if(a(this,U)===z.PLAYING||a(this,U)===z.RELEASING)return console.log(`had to stop a playing voice, midinote: ${o}`),this.stop(c),null;u(this,U,z.PLAYING),u(this,Yi,c),u(this,L,o);const f=(((t=e.glide)==null?void 0:t.glideTime)??a(this,Zi))/8;let d=1,m=1;if(a(this,rn)||(d=Cs(o),e.glide&&(m=Cs(e.glide.prevMidiNote)),b(this,R,on).call(this,d,c,{glideTime:f}),b(this,R,ln).call(this,d,c,{glideTime:f})),!a(this,rn)&&e.glide&&f>0){const v=this.getParam("playbackRate");m>0&&v.setValueAtTime(m,c),this.getParam("playbackRate").setTargetAtTime(d,c,f)}else this.setParam("playbackRate",d,c);return this.setParam("velocity",l,c),this.sendToProcessor({type:"voice:start",timestamp:c}),this.applyEnvelopes(c,d,l,o),(n=a(this,Be))==null||n.trigger(o,{velocity:l,secondsFromNow:h,glideTime:f,triggerDecay:!0}),(r=a(this,q))==null||r.setMusicalNote(o,{divisor:1,glideTime:f,glideFromMidiNote:(s=e==null?void 0:e.glide)==null?void 0:s.prevMidiNote,timestamp:c}),a(this,L)}applyEnvelopes(e,t,n,s){a(this,k).forEach((h,c)=>{if(!h.isEnabled)return;const f=this.getParam(h.param);if(!f||c==="pitch-env"&&!h.hasVariation())return;const d=(()=>{switch(c){case"amp-env":return n?n/127:1;case"pitch-env":return t;case"filter-env":return a(this,yt);default:return 1}})();h.triggerEnvelope(f,e,{baseValue:d,playbackRate:t,voiceId:this.nodeId,midiNote:s??60})});const r=a(this,k).get("amp-env"),o=a(this,k).get("pitch-env"),l=a(this,k).get("filter-env");this.sendUpstreamMessage("sample-envelopes:trigger",{voiceId:this.nodeId,midiNote:a(this,L),envDurations:{"amp-env":r.syncedToPlaybackRate?r.baseDuration/t/r.timeScale:r.baseDuration/r.timeScale,"pitch-env":o.syncedToPlaybackRate?o.baseDuration/t/o.timeScale:o.baseDuration/o.timeScale,"filter-env":l.syncedToPlaybackRate?l.baseDuration/t/l.timeScale:l.baseDuration/l.timeScale},loopEnabled:{"amp-env":r.loopEnabled,"pitch-env":o.loopEnabled,"filter-env":l.loopEnabled}})}release({releaseTime:e=this.releaseTime,secondsFromNow:t=0}){var n;if(a(this,U)===z.RELEASING)return this;if(!this.getParam("envGain"))throw new Error("Cannot release - envGain parameter is null");u(this,U,z.RELEASING);const s=this.now+t,r=((n=this.getParam("playbackRate"))==null?void 0:n.value)??1;if(a(this,k).forEach(h=>{if(!h.isEnabled)return;const c=this.getParam(h.param);c&&h.releaseEnvelope(c,s,{playbackRate:r,voiceId:this.nodeId,midiNote:a(this,L)??60})}),e<=0)return this.stop(s);this.sendToProcessor({type:"voice:release",timestamp:s});const o=Array.from(a(this,k).values()).filter(h=>h.isEnabled),l=o.length>0?Math.max(...o.map(h=>h.effectiveReleaseDuration)):e;return a(this,ct)&&clearTimeout(a(this,ct)),u(this,ct,setTimeout(()=>{try{(a(this,U)===z.RELEASING||a(this,U)===z.PLAYING)&&this.stop()}finally{u(this,ct,null)}},l*1e3+50)),this}stop(e=this.now){if(a(this,U)===z.STOPPED||a(this,U)===z.STOPPING)return this;u(this,U,z.STOPPING);const t=.005,n=Math.max(e,this.now),s=this.getParam("envGain");return s&&(Ii(s,n),s.linearRampToValueAtTime(0,n+t)),a(this,ut)&&clearTimeout(a(this,ut)),u(this,ut,setTimeout(()=>{this.sendToProcessor({type:"voice:stop",timestamp:n}),u(this,ut,null)},Math.max(0,(n+t-this.now)*1e3))),this}setModulationAmount(e,t){var n;const s=Ne(t,0,1,0,.95,{warn:!0,name:"sampleVoice.setModulationAmount"});return e==="AM"?(a(this,q)||b(this,R,Ji).call(this,s),(n=a(this,q))==null||n.setDepth(s)):e==="FM"&&console.warn("SampleVoice: FM modulation not implemented yet"),this}setModulationWaveform(e="AM",t="triangle",n={}){var s;return e==="AM"?(a(this,q)||b(this,R,Ji).call(this),(s=a(this,q))==null||s.setWaveform(t,n)):e==="FM"&&console.info("SampleVoice: FM modulation not implemented yet"),this}addEnvelopePoint(e,t,n){const s=a(this,k).get(e);s!=null&&s.isEnabled&&s.addPoint(t,n)}updateEnvelopePoint(e,t,n,s){const r=a(this,k).get(e);r!=null&&r.isEnabled&&r.updatePoint(t,n,s)}deleteEnvelopePoint(e,t){const n=a(this,k).get(e);n!=null&&n.isEnabled&&n.deletePoint(t)}get envelopes(){return a(this,k)}setParam(e,t,n=this.now,s={}){const r=this.getParam(e);if(!r||r.value===t)return this;const{glideTime:o=0,cancelPrevious:l=!0}=s;return l&&r.cancelScheduledValues(n),o<=0?r.setValueAtTime(t,Math.max(n,this.now+.001)):r.linearRampToValueAtTime(t,n+Math.max(o,.001)),this}setParams(e,t,n={}){const s=e.filter(r=>this.getParam(r.name)!==null);return s.length===0?this:(s.forEach(({name:r,value:o})=>{this.setParam(r,o,t,{...n})}),this)}setLoopPoints(e,t,n=this.now,s=0){return e>=t?this:(e!==void 0&&this.setParam("loopStart",e,n,{glideTime:s,cancelPrevious:!0}),t!==void 0&&this.setParam("loopEnd",t,n,{glideTime:s,cancelPrevious:!0}),this)}syncLoopToTempo(e){return this.sendToProcessor({type:"syncLoopToTempo",value:e}),this}setKeytrackLoopAmount(e){return this.sendToProcessor({type:"setKeytrackLoopAmount",value:e}),this}setTempo(e){return this.setParam("tempo",e,this.now),this}setAllowedPeriods(e){return this.sendToProcessor({type:"setAllowedPeriods",allowedPeriods:e}),this}connect(e,t,n){return e instanceof He?this.out.connect(e.input,t):e instanceof AudioParam?this.out.connect(e,t):e instanceof AudioNode?this.out.connect(e,t,n):console.warn(`SampleVoice: Unsupported destination: ${e}`),e}disconnect(e="main",t){return e==="alt"?(console.warn('SampleVoice has no "alt" output to disconnect'),this):(t?t instanceof AudioNode?this.out.disconnect(t):t instanceof AudioParam&&this.out.disconnect(t):this.out.disconnect(),this)}onMessage(e,t){return a(this,En).onMessage(e,t)}sendToProcessor(e){return a(this,re).port.postMessage(e),this}sendUpstreamMessage(e,t){return a(this,En).sendMessage(e,t),this}getPlaybackDuration(){const e=this.getParam("startPoint").value;return this.getParam("endPoint").value-e}get isActive(){return a(this,L)!==null}get feedback(){return a(this,Be)}get currMidiNote(){return a(this,L)}get hpf(){return a(this,ge)}get lpf(){return a(this,be)}get in(){return null}get out(){return a(this,Dn)}get state(){return a(this,U)}get initialized(){return a(this,Ms)}get now(){return this.context.currentTime}get activeNoteId(){return a(this,L)}get triggerTimestamp(){return a(this,Yi)}get sampleDurationSeconds(){return a(this,vi)}get startPoint(){return this.getParam("startPoint").value}get endPoint(){return this.getParam("endPoint").value}get releaseTime(){return a(this,k).get("amp-env").effectiveReleaseDuration}setMasterGain(e){const t=a(this,re).parameters.get("masterGain");t.cancelScheduledValues(this.context.currentTime),t.setTargetAtTime(e,this.context.currentTime,.006)}enablePositionTracking(e){return this.sendToProcessor({type:"voice:usePlaybackPosition",value:e}),this}setLoopEnabled(e){return this.sendToProcessor({type:"setLoopEnabled",value:e}),!e&&a(this,L)&&this.release({}),this}setPlaybackRate(e,t=this.now,n){return this.setParam("playbackRate",e,t,n),b(this,R,on).call(this,e,t,n),b(this,R,ln).call(this,e,t,n),this}setHpfCutoff(e,t=this.now,n={}){var s;const r=G(e,20,this.context.sampleRate/2-1e3);if(u(this,Sn,r),a(this,ge)){this.setParam("hpf",r,t,{glideTime:0});const o=((s=this.getParam("playbackRate"))==null?void 0:s.value)??1;b(this,R,on).call(this,o,t,n)}return this}setLpfCutoff(e,t=this.now,n={}){var s;const r=G(e,20,this.context.sampleRate/2-1e3);if(u(this,yt,r),a(this,be)){this.setParam("lpf",r,t,{glideTime:0,cancelPrevious:!0});const o=((s=this.getParam("playbackRate"))==null?void 0:s.value)??1;b(this,R,ln).call(this,o,t,n)}return this}setPlaybackDirection(e){return this.sendToProcessor({type:"voice:setPlaybackDirection",playbackDirection:e}),this}setLoopDurationDriftAmount(e){if(e===0)return this.setParam("loopDurationDriftAmount",0,this.now),this;const t=Ll(e,{inputRange:{min:0,max:1},outputRange:{min:1e-4,max:1},blend:1,curve:"linear"});return this.setParam("loopDurationDriftAmount",t,this.now),this}debugDuration(){console.info(`
      sample duration: ${this.sampleDurationSeconds}, 
      startPoint: ${this.getParam("startPoint").value}, 
      endPoint: ${this.getParam("endPoint").value}, 
      playback duration: ${this.getPlaybackDuration()}
      `)}dispose(){this.stop(),this.disconnect(),b(this,R,qr).call(this),a(this,k).forEach(e=>e.dispose()),a(this,re).port.close(),a(this,ct)&&clearTimeout(a(this,ct)),a(this,ut)&&clearTimeout(a(this,ut)),Ge(this.nodeId)}getParam(e){var t,n,s,r;if(a(this,re)&&a(this,re).parameters.has(e))return a(this,re).parameters.get(e)??null;if(a(this,bt))switch(e){case"highpass":case"hpf":return((t=a(this,ge))==null?void 0:t.frequency)||null;case"lowpass":case"lpf":return((n=a(this,be))==null?void 0:n.frequency)||null;case"hpfQ":return((s=a(this,ge))==null?void 0:s.Q)||null;case"lpfQ":return((r=a(this,be))==null?void 0:r.Q)||null}return null}}En=new WeakMap,Pt=new WeakMap,Dn=new WeakMap,re=new WeakMap,q=new WeakMap,Ve=new WeakMap,Be=new WeakMap,k=new WeakMap,U=new WeakMap,Ms=new WeakMap,L=new WeakMap,Yi=new WeakMap,vi=new WeakMap,Zi=new WeakMap,bt=new WeakMap,rn=new WeakMap,ge=new WeakMap,be=new WeakMap,Sn=new WeakMap,oa=new WeakMap,yt=new WeakMap,la=new WeakMap,Qi=new WeakMap,Xi=new WeakMap,R=new WeakSet,Ur=function(){Ee(a(this,Be),"SampleVoice: Feedback not initialized!"),Ee(a(this,Ve),"SampleVoice: AM mod not initialized!"),a(this,bt)?(Ee(a(this,ge)&&a(this,be),"SampleVoice: Filters not initialized!"),a(this,re).connect(a(this,Be).input),a(this,Be).output.connect(a(this,Ve)),a(this,Ve).connect(a(this,ge)),a(this,ge).connect(a(this,be)),a(this,be).connect(a(this,Dn))):(a(this,re).connect(a(this,Be).input),a(this,Be).output.connect(a(this,Ve)),a(this,Ve).connect(a(this,Dn)))},zr=function(){u(this,Sn,40),u(this,yt,this.context.sampleRate/2-1e3),a(this,ge)||u(this,ge,new BiquadFilterNode(this.context,{type:"highpass",frequency:a(this,Sn),Q:a(this,oa)})),a(this,be)||u(this,be,new BiquadFilterNode(this.context,{type:"lowpass",frequency:a(this,yt),Q:a(this,la)}))},ha=function(){a(this,k).forEach(n=>n.dispose()),a(this,k).clear();const i=a(this,vi)||void 0,e=Os(this.context,"amp-env",{durationSeconds:i});a(this,k).set("amp-env",e);const t=Os(this.context,"pitch-env",{durationSeconds:i});if(a(this,k).set("pitch-env",t),a(this,bt)){const n=Os(this.context,"filter-env",{durationSeconds:i,envPointValueRange:[0,1],initEnable:!1});a(this,k).set("filter-env",n)}b(this,R,Ka).call(this)},$r=new WeakMap,Hr=function(i){return this.sendToProcessor({type:"voice:set_zero_crossings",zeroCrossings:i}),this},ct=new WeakMap,ut=new WeakMap,on=function(i,e=this.now,t={}){if(!a(this,L)||!a(this,ge)||a(this,Xi)<=0)return;const n=a(this,ge).frequency,{glideTime:s=0,cancelPrevious:r=!0}=t||{};r&&n.cancelScheduledValues(e);const o=a(this,Sn)*i*a(this,Xi),l=G(o,20,this.context.sampleRate/2-1e3);s>0?n.setTargetAtTime(l,e,s):n.setValueAtTime(l,Math.max(e,this.now+.001))},ln=function(i,e=this.now,t={}){if(!a(this,L)||!a(this,be)||a(this,Qi)<=0)return;const n=a(this,be).frequency,{glideTime:s=0,cancelPrevious:r=!0}=t||{};r&&n.cancelScheduledValues(e);const o=a(this,yt)*i*a(this,Qi),l=G(o,20,this.context.sampleRate/2-1e3);s>0?n.setTargetAtTime(l,e,s):n.setValueAtTime(l,Math.max(e,this.now+.001))},Ji=function(i=0,e="square",t={}){if(a(this,q)===null)if(u(this,q,new Xs(this.context)),a(this,q).setWaveform(e,t),a(this,q).setDepth(i),a(this,q).setMusicalNote(a(this,L)??60),a(this,Ve))a(this,q).connect(a(this,Ve).gain);else throw console.error("Missing gain node for AM-LFO in SampleVoice"),new Error("Missing gain node for AM-LFO in SampleVoice");else console.debug("setupAmpModLFO: LFO already setup: ",a(this,q));return this},qr=function(){if(a(this,q))return a(this,q).dispose(),u(this,q,null),this},Ka=function(){a(this,k).forEach((i,e)=>{a(this,En).forwardFrom(i,[`${e}:trigger`,`${e}:release`,`${e}:trigger:loop`,`${e}:created`],t=>({...t,voiceId:this.nodeId,midiNote:a(this,L)}))})},jr=function(){a(this,re).port.onmessage=i=>{var e;let{type:t,...n}=i.data;switch(t){case"initialized":u(this,Ms,!0),u(this,U,z.NOT_READY),this.sendUpstreamMessage("voice:initialized",{voice:this,voiceId:this.nodeId});break;case"voice:loaded":u(this,L,null),n.durationSeconds&&(u(this,vi,n.durationSeconds),b(this,R,ha).call(this),this.setStartPoint(0),this.setEndPoint(n.durationSeconds)),u(this,U,z.LOADED);break;case"voice:started":u(this,U,z.PLAYING),n={voice:this,midiNote:a(this,L)};break;case"voice:stopped":u(this,U,z.STOPPED),n={voiceId:this.nodeId,voice:this,midiNote:a(this,L)},u(this,L,null);break;case"voice:releasing":u(this,U,z.RELEASING),n={voiceId:this.nodeId,voice:this,midiNote:a(this,L)};break;case"loop:enabled":break;case"voice:looped":break;case"voice:playbackDirectionChange":break;case"voice:position":(e=this.getParam("playbackPosition"))==null||e.setValueAtTime(n.position,this.context.currentTime);break;case"debug:params":console.debug("Debug params: ",{loopStart:n.loopStart},{loopStartSamples:n.loopStartSamples},{loopEnd:n.loopEnd},{loopEndSamples:n.loopEndSamples});break;case"debug:release":console.debug("SampleVoice release debug:",n);break;case"debug:loop":console.log("Loop debug:",n);break;default:console.warn(`Unhandled message type: ${t}`);break}this.sendUpstreamMessage(t,n)}};async function lh(i,e){const t=new oh(i,e);return await t.init(),t}async function hh(i,e,t){const n=Array.from({length:i},()=>lh(e,t));return Promise.all(n)}var An,es,hn,dt,ni,$,Rn,oe,ke,De,le,ii,ts,si,Pn,Kr,ca,Ya,Ls;class ch{constructor(e,t){p(this,Pn),y(this,"nodeId"),y(this,"nodeType","pool"),p(this,An),p(this,es),p(this,hn,!1),p(this,dt,null),p(this,ni),p(this,$,[]),p(this,Rn,new Set),p(this,oe,new Set),p(this,ke,new Set),p(this,De,new Set),p(this,le,new Map),p(this,ii,1),p(this,ts,new Set),p(this,si,new Map),y(this,"prevMidiNote",60),p(this,ca,.4),this.nodeId=We(this.nodeType,this),u(this,An,wt(this.nodeId)),u(this,es,e),u(this,ni,t)}async init(){if(!a(this,hn))return a(this,dt)?a(this,dt):(u(this,dt,(async()=>{try{u(this,$,await hh(a(this,ni),a(this,es))),a(this,$).forEach(e=>{a(this,oe).add(e),b(this,Pn,Kr).call(this,e)}),u(this,hn,!0)}catch(e){a(this,$).forEach(n=>n.dispose()),u(this,$,[]),a(this,oe).clear(),u(this,dt,null);const t=e instanceof Error?e.message:String(e);throw new Error(`Failed to initialize SamplePlayer: ${t}`)}})()),a(this,dt))}connect(e){a(this,$).forEach(t=>{t.connect(e)})}disconnect(){a(this,$).forEach(e=>{e.disconnect()})}onMessage(e,t){return a(this,An).onMessage(e,t)}sendUpstreamMessage(e,t){return a(this,An).sendMessage(e,t),this}setBuffer(e,t){return a(this,Rn).clear(),a(this,$).forEach(n=>n.loadBuffer(e,t)),this}allocate(e=a(this,oe),t=a(this,De)){let n;return e.size?n=Wa(e):t.size&&(n=Wa(t),n==null||n.stop()),n||console.warn("Could not allocate voice"),n}noteOn(e,t=100,n=0,s=0){if(this.playingVoicesCount>=a(this,ni))return console.log("Pool noteON(): Max polyphony reached, cannot play new note"),null;const r=this.allocate();return r!=null&&r.trigger({midiNote:e,velocity:t,secondsFromNow:n,glide:{prevMidiNote:this.prevMidiNote,glideTime:s}})&&r?(a(this,le).set(e,r),this.prevMidiNote=e,e):null}noteOff(e,t=0,n){const s=a(this,le).get(e);if(s)return(s==null?void 0:s.state)===z.PLAYING&&s.release({secondsFromNow:t,releaseTime:n}),this}allNotesOff(e=0){return a(this,le).forEach(t=>{t.release({releaseTime:e})}),a(this,le).clear(),this}applyToAllVoices(e){a(this,$).forEach(t=>e(t))}applyToActiveVoices(e){a(this,le).forEach(t=>e(t))}applyToInactiveVoices(e){a(this,oe).forEach(t=>e(t))}applyToActiveNote(e,t){const n=a(this,le).get(e);n?t(n):console.warn(`No active voice found for midiNote: ${e}`)}debug(){console.debug(`
      releasing: ${a(this,De).size}
      playing: ${a(this,ke).size}
      available: ${a(this,oe).size}
      Sum: ${a(this,De).size+a(this,ke).size+a(this,oe).size}
      Sum should be: ${this.allVoicesCount}
      `,{midiToVoiceMap:a(this,le)})}dispose(){this.applyToAllVoices(e=>e.dispose()),u(this,$,[]),a(this,le).clear(),a(this,oe).clear(),a(this,De).clear(),a(this,ke).clear(),a(this,Rn).clear(),u(this,hn,!1),u(this,dt,null),Ge(this.nodeId)}get initialized(){return a(this,hn)}get availableVoices(){return a(this,oe)}get playingVoicesCount(){return a(this,ke).size}get releasingVoicesCount(){return a(this,De).size}get availableVoicesCount(){return a(this,oe).size}get allVoices(){return a(this,$)}get allVoicesCount(){return a(this,$).length}get assignedVoicesMidiMap(){return a(this,le)}}An=new WeakMap,es=new WeakMap,hn=new WeakMap,dt=new WeakMap,ni=new WeakMap,$=new WeakMap,Rn=new WeakMap,oe=new WeakMap,ke=new WeakMap,De=new WeakMap,le=new WeakMap,ii=new WeakMap,ts=new WeakMap,si=new WeakMap,Pn=new WeakSet,Kr=function(i){i.onMessage("voice:started",e=>{a(this,oe).delete(e.voice),a(this,De).delete(e.voice),a(this,ke).add(e.voice),b(this,Pn,Ls).call(this),a(this,le).set(e.midiNote,e.voice)}),i.onMessage("voice:releasing",e=>{a(this,oe).delete(e.voice),a(this,ke).delete(e.voice),a(this,De).add(e.voice)}),i.onMessage("voice:stopped",e=>{a(this,ke).delete(e.voice),a(this,De).delete(e.voice),b(this,Pn,Ls).call(this),a(this,oe).add(e.voice),e.midiNote!==void 0&&a(this,le).get(e.midiNote)===e.voice&&a(this,le).delete(e.midiNote)}),i.onMessage("voice:initialized",e=>{a(this,ts).add(e.voice),a(this,ts).size===a(this,$).length&&this.sendUpstreamMessage("voice-pool:initialized",{voiceCount:a(this,$).length})}),["amp-env","pitch-env","filter-env"].forEach(e=>{i.onMessage(`${e}:created`,t=>{a(this,si).has(e)||a(this,si).set(e,new Set);const n=a(this,si).get(e);n.add(t.voice),n.size===a(this,$).length&&this.sendUpstreamMessage(`${e}:created`,{envType:e,voiceCount:a(this,$).length})})}),a(this,An).forwardFrom(i,["voice:initialized","voice:started","voice:stopped","voice:releasing","voice:loaded","amp-env:trigger","amp-env:trigger:loop","amp-env:release","pitch-env:trigger","pitch-env:trigger:loop","pitch-env:release","filter-env:trigger","filter-env:trigger:loop","filter-env:release","amp-env:created","pitch-env:created","filter-env:created"],e=>e.type==="voice:loaded"?(a(this,Rn).add(e.senderId),a(this,Rn).size===a(this,$).length?{...e,type:"sample:loaded"}:null):e)},ca=new WeakMap,Ya=function(){const i=a(this,ke).size+a(this,De).size;if(i===0){u(this,ii,1);return}u(this,ii,1/(1+Math.log10(i)*a(this,ca))),[...a(this,ke)].forEach(e=>{e.setMasterGain(a(this,ii))})},Ls=function(){b(this,Pn,Ya).call(this)};async function uh(i,e){const t=new ch(i,e);return await t.init(),t}var _n,cn,un,Tn,ns,ai,dn,ri,pn,Ot,_t,fn,oi,Tt,li,ae,K,Y,_e,Me,Nt,mn,is,ss,as,rs,os,ls,ua,da,hs,cs,kt,us,pa,pt,Ke,Yr,Zr,Qr,fa,Xr,Za,hi,ci,Dt;class dh{constructor(e,t=16,n){p(this,Ke),y(this,"nodeId"),y(this,"nodeType","sample-player"),y(this,"context"),p(this,_n),p(this,cn,!1),p(this,un,null),p(this,Tn,!1),p(this,ns),p(this,ai,null),p(this,dn,new Set),p(this,ri,new Set),p(this,pn,null),p(this,Ot,0),p(this,_t,!1),p(this,fn,!1),p(this,oi,!1),p(this,Tt,!1),p(this,li,!1),p(this,ae),p(this,K),p(this,Y),p(this,_e,null),p(this,Me,null),p(this,Nt,0),p(this,mn,120),p(this,is,Ut.glide.defaultValue),p(this,ss,Ut.loopRampDuration.defaultValue),p(this,as,Ut.keytrackLoop.defaultValue),p(this,rs,Ut.highpassFilter.defaultValue),p(this,os,Ut.lowpassFilter.defaultValue),p(this,ls,!1),p(this,ua,300),p(this,da,20),p(this,hs,!1),p(this,cs,!1),p(this,kt,[]),p(this,us,!0),p(this,pa,!0),y(this,"randomizeVelocity",!1),y(this,"voicePool"),y(this,"outBus"),p(this,pt,new Set),y(this,"setModulationAmount",(s,r)=>this.voicePool.applyToAllVoices(o=>o.setModulationAmount(s,r))),p(this,hi,!1),y(this,"panic",s=>this.releaseAll(s)),p(this,ci,!1),y(this,"sustainPedalOn",()=>this.setSustainPedal(!0)),y(this,"sustainPedalOff",()=>this.setSustainPedal(!1)),y(this,"setPanDriftEnabled",s=>(this.voicePool.applyToAllVoices(r=>r.setPanDriftEnabled(s)),this)),y(this,"setTimestretchEnabled",s=>(this.voicePool.applyToAllVoices(r=>r.setTimestretchEnabled(s)),this)),y(this,"isNormalized",(s,r=[0,1])=>s>=r[0]&&s<=r[1]),y(this,"MIN_LOOP_DURATION_SECONDS",1/523.25),y(this,"setLoopStart",(s,r=this.getLoopRampDuration())=>this.setLoopPoint("start",s,this.loopEnd,r)),y(this,"setLoopEnd",(s,r=this.getLoopRampDuration())=>this.setLoopPoint("end",this.loopStart,s,r)),y(this,"setLoopDuration",(s,r=this.getLoopRampDuration())=>this.setLoopPoint("end",this.loopStart,this.loopStart+s,r)),y(this,"debugcounter",0),y(this,"getKeytrackLoopAmount",()=>a(this,as)),y(this,"getHpfCutoff",()=>a(this,rs)),y(this,"getLpfCutoff",()=>a(this,os)),y(this,"enablePitch",()=>this.voicePool.allVoices.forEach(s=>s.enablePitch())),y(this,"disablePitch",()=>this.voicePool.allVoices.forEach(s=>s.disablePitch())),y(this,"enableEnvelope",s=>{this.voicePool.applyToAllVoices(r=>r.enableEnvelope(s))}),y(this,"disableEnvelope",s=>{this.voicePool.applyToAllVoices(r=>r.disableEnvelope(s))}),y(this,"setEnvelopeLoop",(s,r,o="normal")=>{this.voicePool.applyToAllVoices(l=>l.setEnvelopeLoop(s,r,o))}),y(this,"setEnvelopeSync",(s,r)=>{this.voicePool.applyToAllVoices(o=>o.syncEnvelopeToPlaybackRate(s,r))}),y(this,"setEnvelopeTimeScale",(s,r)=>{this.voicePool.applyToAllVoices(o=>o.setEnvelopeTimeScale(s,r))}),y(this,"setDryWetMix",s=>{this.outBus.setDryWetMix(s)}),y(this,"sendToFx",(s,r)=>{this.outBus.setSendAmount(s,r)}),y(this,"setLpfCutoff",(s,r="pre")=>{u(this,os,s),r==="pre"?this.voicePool.applyToAllVoices(o=>{o.setLpfCutoff(s)}):r==="post"&&this.outBus.setLpfCutoff(s)}),y(this,"setHpfCutoff",(s,r="pre")=>{u(this,rs,s),r==="pre"?this.voicePool.applyToAllVoices(o=>{o.setHpfCutoff(s)}):r==="post"&&this.outBus.setHpfCutoff(s)}),y(this,"setReverbAmount",s=>{this.outBus.setReverbSize(s)}),y(this,"setFeedbackAmount",s=>{s=G(s,0,1),(a(this,Dt)==="monophonic"||a(this,Dt)==="double-trouble")&&this.outBus.setFeedbackAmount(s),(a(this,Dt)==="polyphonic"||a(this,Dt)==="double-trouble")&&this.voicePool.applyToAllVoices(r=>{var o;(o=r.feedback)==null||o.setAmountMacro(s)})}),p(this,Dt,"monophonic"),this.nodeId=We("sample-player",this),this.context=e,u(this,_n,wt(this.nodeId)),u(this,ae,new GainNode(this.context,{gain:.5})),u(this,K,new Ha(this.context,0)),u(this,Y,new Ha(this.context,0)),u(this,ns,t),u(this,ai,n||null)}async init(){if(!a(this,cn))return a(this,un)?a(this,un):(u(this,un,(async()=>{var e,t,n;try{this.outBus=await rh(this.context),this.voicePool=await uh(this.context,a(this,ns)),b(this,Ke,fa).call(this),b(this,Ke,Yr).call(this),b(this,Ke,Qr).call(this),b(this,Ke,Xr).call(this),b(this,Ke,Zr).call(this),a(this,ai)&&await this.loadSample(a(this,ai),void 0,{skipPreProcessing:!0}),u(this,cn,!0)}catch(s){(e=this.voicePool)==null||e.dispose(),(t=a(this,K))==null||t.dispose(),(n=a(this,Y))==null||n.dispose();const r=s instanceof Error?s.message:String(s);throw new Error(`Failed to initialize SamplePlayer: ${r}`)}})()),a(this,un))}onMessage(e,t){return a(this,_n).onMessage(e,t)}sendUpstreamMessage(e,t){return a(this,_n).sendMessage(e,t),this}connect(e){var t;const n="input"in e&&e.input?e.input:e;a(this,ae).connect(n),"nodeId"in e&&(a(this,dn).add(e.nodeId),(t=e.addIncoming)==null||t.call(e,this.nodeId))}disconnect(e){var t;if(e){const n="input"in e?e.input:e;a(this,ae).disconnect(n),"nodeId"in e&&(a(this,dn).delete(e.nodeId),(t=e.removeIncoming)==null||t.call(e,this.nodeId))}else a(this,ae).disconnect(),a(this,dn).clear()}addIncoming(e){a(this,ri).add(e.nodeId)}removeIncoming(e){a(this,ri).delete(e.nodeId)}get connections(){return{outgoing:Array.from(a(this,dn)),incoming:Array.from(a(this,ri))}}get audioNode(){return a(this,ae)}get input(){return this.outBus.input}get output(){return a(this,ae)}get now(){return this.context.currentTime}get initialized(){return a(this,cn)}getMacrosAudioParam(e){switch(e){case"loopStart":return a(this,K).audioParam;case"loopEnd":return a(this,Y).audioParam;default:const t=e;throw new Error(`Unknown macro parameter: ${t}`)}}getMacro(e){switch(e){case"loopStart":return a(this,K);case"loopEnd":return a(this,Y);default:const t=e;throw new Error(`Unknown macro parameter: ${t}`)}}setModulationWaveform(e="AM",t="triangle",n={}){this.voicePool.applyToAllVoices(s=>s.setModulationWaveform(e,t,n))}syncLFOsToNoteFreq(e,t){var n,s,r,o,l,h;if(e==="gain-lfo"){if(t===!0)(n=a(this,_e))==null||n.storeCurrentValues();else{const c=(s=a(this,_e))==null?void 0:s.getStoredValues();c&&((r=a(this,_e))==null||r.setFrequency(c.rate))}u(this,hs,t)}if(e==="pitch-lfo"){if(t===!0)(o=a(this,Me))==null||o.storeCurrentValues();else{const c=(l=a(this,Me))==null?void 0:l.getStoredValues();c&&((h=a(this,Me))==null||h.setFrequency(c.rate))}u(this,cs,t)}}freezeActiveVoices(e){return console.info(`SamplePlayer: freezeActiveVoices(${e}). Spectral freeze not implemented yet`),this}async loadSample(e,t,n){if(a(this,hi))throw new Error("A sample load is already in progress");u(this,hi,!0);let s;try{if(e instanceof ArrayBuffer&&(e=await this.context.decodeAudioData(e.slice(0))),!el(e))return console.error("Invalid AudioBuffer provided to loadSample"),null;if(e.sampleRate!==this.context.sampleRate)throw new RangeError(`Sample rate mismatch: buffer rate ${e.sampleRate}, context rate ${this.context.sampleRate}`);t&&this.context.sampleRate!==t&&console.warn(`Sample rate mismatch: context rate ${this.context.sampleRate}, requested rate ${t}`),this.releaseAll(0),this.transposeSemitones=0,u(this,Tn,!1),u(this,pn,null);let r;a(this,pa)&&(r=await _r(this.context,e,n),e=r.audiobuffer,a(this,us)&&r.zeroCrossings&&u(this,kt,r.zeroCrossings)),u(this,pn,e),u(this,Ot,e.duration);const o=new Promise(h=>{s=this.voicePool.onMessage("sample:loaded",()=>{h()})});this.voicePool.setBuffer(e,a(this,kt)),b(this,Ke,fa).call(this);const l={rootNote:"C",scale:[0],lowestOctave:0,highestOctave:5,tuningOffset:0,normalize:!1};return this.setScale(l),await o,e}finally{s==null||s(),u(this,hi,!1)}}async cropSample(e=this.getStartPoint(),t=this.getEndPoint(),n=4){const s=a(this,pn);if(!s||!Number.isFinite(e)||!Number.isFinite(t))return null;const r=Math.max(0,Math.floor(e*s.sampleRate)),o=Math.min(s.length,Math.ceil(t*s.sampleRate));if(o<=r)return null;const l=Pr(this.context,s,r,o,n);return this.loadSample(l,void 0,{skipPreProcessing:!0})}async detectPitch(e){const t=await Ar(e),n=Er(t.frequency),s=69+12*Math.log2(t.frequency/440),r=n.frequency/t.frequency;return console.table({pitchSource:t,targetNoteInfo:n,playbackRateMultiplier:r,midiFloat:s}),this.sendUpstreamMessage("sample:pitch-detected",{pitchResults:t,closestNoteInfo:n}),{frequency:t.frequency,confidence:t.confidence,midiFloat:s,targetNoteInfo:n}}detectedPitchToTransposition(e,t){let n=t-e;for(;n>6;)n-=12;for(;n<-6;)n+=12;return n}play(e,t=100,n=this.getGlideTime()){var s,r;const o=La(t)?t:100,l=e+a(this,Nt);return La(l)?(a(this,hs)&&((s=a(this,_e))==null||s.setMusicalNote(l)),a(this,cs)&&((r=a(this,Me))==null||r.setMusicalNote(l,{divisor:4})),this.outBus.noteOn(l,o,0,n),this.voicePool.noteOn(l,o,0,n)):(console.warn(`Invalid midiNote: ${l}`),null)}release(e){if(this.holdEnabled||a(this,Tt))return this;const t=e+a(this,Nt);return a(this,li)?(a(this,pt).add(t),this):(a(this,pt).delete(t),this.voicePool.noteOff(t),this.sendUpstreamMessage("note:off",{transposedMidiNote:t}),this)}releaseAll(e){var t;return a(this,pt).clear(),(t=this.voicePool)==null||t.allNotesOff(e),this}get transposedBySemitones(){return a(this,Nt)}set transposeSemitones(e){a(this,Nt)!==e&&u(this,Nt,e)}setScale(e){return a(this,K).setScale({snapToZeroCrossings:a(this,kt),...e}),a(this,Y).setScale({snapToZeroCrossings:a(this,kt),...e}),this}setRootNote(e){const t=Ri[e];let n=t===0?0:t-12;return this.transposedBySemitones===n?this:(this.transposeSemitones=n,a(this,Y).setRootNote(e),a(this,K).setRootNote(e),this)}setVolume(e){return e=G(e,0,1),a(this,ae).gain.setValueAtTime(e,this.now),this}setSampleStartPoint(e){return this.voicePool.applyToAllVoices(t=>t.setStartPoint(e)),this.sendUpstreamMessage("start-point:updated",{startPoint:e}),this}setSampleEndPoint(e){return this.voicePool.applyToAllVoices(t=>t.setEndPoint(e)),this.sendUpstreamMessage("end-point:updated",{endPoint:e}),this}setLoopRampDuration(e){return u(this,ss,e),this}setGlideTime(e){return u(this,is,e),this}setLoopEnabled(e){return a(this,_t)===e?this:a(this,fn)&&!e?this:(this.voicePool.allVoices.forEach(t=>t.setLoopEnabled(e)),u(this,_t,e),this.sendUpstreamMessage("loop:enabled",{enabled:e}),this)}setLoopLocked(e){return a(this,fn)===e?this:(u(this,fn,e),this.setLoopEnabled(e),this.sendUpstreamMessage("loop:locked",{locked:e}),this)}setHoldEnabled(e){return a(this,oi)===e?this:a(this,Tt)&&!e?this:(u(this,oi,e),e||this.releaseAll(.1),this.sendUpstreamMessage("hold:enabled",{enabled:e}),this)}setHoldLocked(e){return a(this,Tt)===e?this:(u(this,Tt,e),e===!1&&this.releaseAll(),this.sendUpstreamMessage("hold:locked",{locked:e}),this)}setSustainPedal(e){if(a(this,li)===e)return this;if(u(this,li,e),a(this,fn)||(a(this,ci)&&!e?(u(this,ci,!1),this.setLoopEnabled(!1)):e&&!a(this,_t)&&(this.setLoopEnabled(!0),u(this,ci,!0))),a(this,Tt)||this.setHoldEnabled(e),!e){for(const t of a(this,pt))this.voicePool.noteOff(t),this.sendUpstreamMessage("note:off",{transposedMidiNote:t});a(this,pt).clear()}return this}setPlaybackDirection(e){return this.voicePool.applyToAllVoices(t=>t.setPlaybackDirection(e)),this}setLoopDurationDriftAmount(e){return this.voicePool.applyToAllVoices(t=>t.setLoopDurationDriftAmount(e)),this}setTempo(e){if(!(e<a(this,da)||e>a(this,ua)))return u(this,mn,e),this.voicePool.applyToAllVoices(t=>t.setTempo(e)),this.sendUpstreamMessage("tempo:updated",{bpm:e}),this}syncLoopToTempo(e){return this.voicePool.applyToAllVoices(t=>t.syncLoopToTempo(e)),this}setKeytrackLoopAmount(e){const t=Math.max(0,Math.min(1,e));return u(this,as,t),this.voicePool.applyToAllVoices(n=>n.setKeytrackLoopAmount(t)),this}get tempo(){return a(this,mn)}setLoopPoint(e,t,n,s=this.getLoopRampDuration()){let r=e==="start"?G(t,this.MIN_LOOP_DURATION_SECONDS/2,n):t;if(e==="start"&&r===this.loopStart)return this;let o=G(n,r,a(this,Ot)-this.MIN_LOOP_DURATION_SECONDS/2);if(e==="end"&&o===this.loopEnd)return this;const l=o-r,h=s*1;if(e==="start"&&r!==this.loopStart){if(a(this,ls)){const c=60/a(this,mn),f=Math.round(l/c);r=o-f*c}l<this.MIN_LOOP_DURATION_SECONDS&&(r=o-this.MIN_LOOP_DURATION_SECONDS),a(this,K).ramp(r,h,o)}else if(e==="end"&&o!==this.loopEnd){if(a(this,ls)){const c=60/a(this,mn),f=Math.round(l/c);o=r+f*c}l<this.MIN_LOOP_DURATION_SECONDS&&(o=r+this.MIN_LOOP_DURATION_SECONDS),a(this,Y).ramp(o,h,r)}return this.sendUpstreamMessage("loop-points:updated",{loopStart:this.loopStart,loopEnd:this.loopEnd}),this}scrollLoopPoints(e,t){const n=this.context.currentTime;return a(this,K).setValue(e,n),a(this,Y).setValue(t,n),this.sendUpstreamMessage("loop-points:updated",{loopStart:this.loopStart,loopEnd:this.loopEnd}),this}setParam(e,t){switch(e){case"startPoint":this.setSampleStartPoint(t);break;case"endPoint":this.setSampleEndPoint(t);break;case"glideTime":this.setGlideTime(t);break;case"loopStart":this.setLoopStart(t);break;case"loopEnd":this.setLoopEnd(t);break;case"loopRampDuration":this.setLoopRampDuration(t);break;default:console.warn(`Unknown parameter: ${e}`)}return this}applyParams(e){return Object.entries(e).forEach(([t,n])=>{const s=Ut[t];!s||!Xl(s,n)||s.apply(this,n)}),this}getAudioParam(e){switch(e){case"loopStart":return a(this,K).audioParam;case"loopEnd":return a(this,Y).audioParam;default:return console.warn(`Parameter '${e}' not found on SamplePlayer`),null}}getStartPoint(){var e,t;return((t=(e=this.voicePool)==null?void 0:e.allVoices[0])==null?void 0:t.startPoint)??0}getEndPoint(){var e,t;return((t=(e=this.voicePool)==null?void 0:e.allVoices[0])==null?void 0:t.endPoint)??this.sampleDuration}getLoopRampDuration(){return a(this,ss)}getGlideTime(){return a(this,is)}getParameterValue(e){switch(e){case"loopStart":return this.loopStart;case"loopEnd":return this.loopEnd;case"loopRampDuration":return this.getLoopRampDuration();case"startPoint":return this.getStartPoint();case"endPoint":return this.getEndPoint();case"glideTime":return this.getGlideTime();case"hpfCutoff":return this.getHpfCutoff();case"lpfCutoff":return this.getLpfCutoff();default:console.warn(`Unknown parameter: ${e}`);return}}getEnvelope(e){const t=this.voicePool.allVoices[0];if(!t)throw new Error("No voices available in voice pool");const n=t.getEnvelope(e);if(!n)throw new Error(`Envelope type '${e}' not found`);return n}setEnvelopeSustainPoint(e,t){this.voicePool.applyToAllVoices(n=>n.setEnvelopeSustainPoint(e,t))}setEnvelopeReleasePoint(e,t){this.voicePool.applyToAllVoices(n=>n.setEnvelopeReleasePoint(e,t))}updateEnvelopePoint(e,t,n,s){this.voicePool.applyToAllVoices(r=>r.updateEnvelopePoint(e,t,n,s))}addEnvelopePoint(e,t,n){this.voicePool.applyToAllVoices(s=>s.addEnvelopePoint(e,t,n))}deleteEnvelopePoint(e,t){this.voicePool.applyToAllVoices(n=>n.deleteEnvelopePoint(e,t))}startLevelMonitoring(e){this.outBus.startLevelMonitoring(e)}setFeedbackDecay(e){this.outBus.setFeedbackDecay(e),this.voicePool.applyToAllVoices(t=>{var n;(n=t.feedback)==null||n.setDecay(e)})}setFeedbackLowpassCutoff(e){this.outBus.setFeedbackLowpassCutoff(e),this.voicePool.applyToAllVoices(t=>{var n;(n=t.feedback)==null||n.setLowpassCutoff(e)})}setFeedbackMode(e){var t;if(u(this,Dt,e),e==="monophonic"){let n=((t=this.voicePool.allVoices[0].feedback)==null?void 0:t.currentAmount)??0;this.voicePool.applyToAllVoices(s=>{var r;(r=s.feedback)==null||r.setAmountMacro(0)}),this.outBus.setFeedbackAmount(n)}else if(e==="polyphonic"){const n=this.outBus.getFeedback().currentAmount;this.outBus.setFeedbackAmount(0),this.voicePool.applyToAllVoices(s=>{var r;(r=s.feedback)==null||r.setAmountMacro(n)})}else console.info("Feedback mode set to double-trouble, radical!")}setFeedbackPitchScale(e){this.outBus.setFeedbackPitchScale(e),this.voicePool.applyToAllVoices(t=>{var n;(n=t.feedback)==null||n.setDelayMultiplier(e)})}get mainOut(){return a(this,ae)}get outputBus(){return this.outBus}get sampleDuration(){return a(this,Ot)}get volume(){return a(this,ae).gain.value}set volume(e){a(this,ae).gain.setValueAtTime(e,this.context.currentTime)}get loopEnabled(){return a(this,_t)}get holdEnabled(){return a(this,oi)}get gainLFO(){return a(this,_e)}get pitchLFO(){return a(this,Me)}get loopStart(){return a(this,K).targetValue}get loopEnd(){return a(this,Y).targetValue}get isLoaded(){return a(this,Tn)}get audiobuffer(){return a(this,pn)}dispose(){var e,t,n,s;try{this.releaseAll(),a(this,pt).clear(),this.voicePool&&(this.voicePool.dispose(),this.voicePool=null),this.outBus&&(this.outBus.dispose(),this.outBus=null),(e=a(this,K))==null||e.dispose(),(t=a(this,Y))==null||t.dispose(),u(this,K,null),u(this,Y,null),(n=a(this,_e))==null||n.dispose(),(s=a(this,Me))==null||s.dispose(),this.disconnect(),u(this,Ot,0),u(this,cn,!1),u(this,Tn,!1),u(this,kt,[]),u(this,us,!1),u(this,_t,!1),Ge(this.nodeId)}catch(r){console.error(`Error disposing Sampler ${this.nodeId}:`,r)}}}_n=new WeakMap,cn=new WeakMap,un=new WeakMap,Tn=new WeakMap,ns=new WeakMap,ai=new WeakMap,dn=new WeakMap,ri=new WeakMap,pn=new WeakMap,Ot=new WeakMap,_t=new WeakMap,fn=new WeakMap,oi=new WeakMap,Tt=new WeakMap,li=new WeakMap,ae=new WeakMap,K=new WeakMap,Y=new WeakMap,_e=new WeakMap,Me=new WeakMap,Nt=new WeakMap,mn=new WeakMap,is=new WeakMap,ss=new WeakMap,as=new WeakMap,rs=new WeakMap,os=new WeakMap,ls=new WeakMap,ua=new WeakMap,da=new WeakMap,hs=new WeakMap,cs=new WeakMap,kt=new WeakMap,us=new WeakMap,pa=new WeakMap,pt=new WeakMap,Ke=new WeakSet,Yr=function(){this.voicePool.connect(this.outBus.input),this.outBus.connect(a(this,ae)),a(this,ae).connect(this.context.destination)},Zr=function(){return this.voicePool.onMessage("sample:loaded",i=>{u(this,Tn,!0)}),this.voicePool.onMessage("voice-pool:initialized",()=>{this.sendUpstreamMessage("sample-player:initialized",{})}),a(this,_n).forwardFrom(this.voicePool,["voice-pool:initialized","voice:started","voice:stopped","voice:releasing","sample:loaded","amp-env:created","amp-env:trigger","amp-env:trigger:loop","amp-env:release","pitch-env:created","pitch-env:trigger","pitch-env:trigger:loop","pitch-env:release","filter-env:created","filter-env:trigger","filter-env:trigger:loop","filter-env:release"]),this},Qr=function(){return this.voicePool.allVoices.forEach((i,e)=>{const t=i.getParam("loopStart"),n=i.getParam("loopEnd");t?a(this,K).addTarget(t,"loopStart"):console.error("loopStart param is null!"),n?a(this,Y).addTarget(n,"loopEnd"):console.error("loopEnd param is null!")}),this},fa=function(){return a(this,K).setValue(0),a(this,Y).setValue(a(this,Ot)),this},Xr=function(){u(this,_e,new Xs(this.context)),a(this,_e).setWaveform("sine"),u(this,Me,new Xs(this.context));const i=a(this,Me).getPitchWobbleWaveform();a(this,Me).setWaveform(i),b(this,Ke,Za).call(this,a(this,Me),"playbackRate"),a(this,_e).connect(this.outBus.input.gain)},Za=function(i,e){this.voicePool.applyToAllVoices(t=>{const n=t.getParam(e);n&&i.connect(n)})},hi=new WeakMap,ci=new WeakMap,Dt=new WeakMap;const ph=`var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _SamplePlayerProcessor_instances, handleMessage_fn, resetState_fn, stop_fn, smoothLoopWrap_fn, _clamp, _clampZeroCrossing, findNearestZeroCrossing_fn, normalizedToSamples_fn, samplesToNormalized_fn, midiVelocityToGain_fn, getBufferDurationSeconds_fn, getMusicalNoteDurations_fn, quantizeLoopDuration_fn, extractPositionParams_fn, calculatePlaybackRange_fn, calculateLoopRange_fn, getSafeParam_fn, getConstantFlags_fn, resetDurationPreservation_fn, isDurationPreservationActive_fn, prepareDurationPreservingSample_fn, advanceDurationPreservingPlayback_fn, generateLoopDrift_fn, analyzeLoopAmplitude_fn;
function findClosestIdx(sortedArray, target, direction = "any", getValue = (x) => x, getDistance = (a, b) => Math.abs(a - b)) {
  if (sortedArray.length === 0) {
    throw new Error("Array cannot be empty");
  }
  if (sortedArray.length === 1) {
    return 0;
  }
  const targetValue = target;
  const firstValue = getValue(sortedArray[0]);
  const lastValue = getValue(sortedArray[sortedArray.length - 1]);
  if (targetValue <= firstValue) return 0;
  if (targetValue >= lastValue) return sortedArray.length - 1;
  let left = 0;
  let right = sortedArray.length - 1;
  while (left < right - 1) {
    const mid = Math.floor((left + right) / 2);
    const midValue = getValue(sortedArray[mid]);
    if (midValue === targetValue) {
      return mid;
    } else if (midValue < targetValue) {
      left = mid;
    } else {
      right = mid;
    }
  }
  if (direction === "left") return left;
  if (direction === "right") return right;
  const leftDistance = getDistance(getValue(sortedArray[left]), targetValue);
  const rightDistance = getDistance(getValue(sortedArray[right]), targetValue);
  return leftDistance <= rightDistance ? left : right;
}
function findClosest(sortedArray, target, direction = "any", getValue = (x) => x, getDistance = (a, b) => Math.abs(a - b)) {
  const index = findClosestIdx(
    sortedArray,
    target,
    direction,
    getValue,
    getDistance
  );
  return sortedArray[index];
}
const SAMPLE_PLAYER_WORKLET_AUDIOPARAMS = {
  masterGain: {
    name: "masterGain",
    defaultValue: 1,
    minValue: 0,
    maxValue: 2,
    automationRate: "k-rate"
  },
  envGain: {
    name: "envGain",
    defaultValue: 0,
    minValue: 0,
    maxValue: 1,
    automationRate: "a-rate"
  },
  velocity: {
    name: "velocity",
    defaultValue: 100,
    minValue: 0,
    maxValue: 127,
    automationRate: "k-rate"
  },
  pan: {
    name: "pan",
    defaultValue: 0,
    minValue: -1,
    // -1 hard left
    maxValue: 1,
    // 1 hard right
    automationRate: "k-rate"
  },
  playbackRate: {
    name: "playbackRate",
    defaultValue: 1,
    minValue: 0.1,
    maxValue: 24,
    automationRate: "a-rate"
  },
  // NOTE: Time based params use seconds
  loopStart: {
    name: "loopStart",
    defaultValue: 0,
    minValue: 0,
    maxValue: 99999,
    // Max sample length in seconds
    automationRate: "k-rate"
  },
  loopEnd: {
    name: "loopEnd",
    defaultValue: 99999,
    // Will be set to actual buffer duration when loaded
    minValue: 0,
    maxValue: 99999,
    automationRate: "k-rate"
  },
  startPoint: {
    name: "startPoint",
    defaultValue: 0,
    minValue: 0,
    maxValue: 9999,
    // Max sample length in seconds
    automationRate: "k-rate"
  },
  endPoint: {
    name: "endPoint",
    defaultValue: 9999,
    // Will be set to actual buffer duration when loaded
    minValue: 0,
    maxValue: 9999,
    automationRate: "k-rate"
  },
  playbackPosition: {
    name: "playbackPosition",
    defaultValue: 0,
    minValue: 0,
    maxValue: 99999,
    automationRate: "k-rate"
  },
  loopDurationDriftAmount: {
    name: "loopDurationDriftAmount",
    defaultValue: 0,
    minValue: 0,
    maxValue: 1,
    // 0 = no drift, 1 = max drift (up to 100% of loop duration)
    automationRate: "k-rate"
  },
  maxLoopCount: {
    name: "maxLoopCount",
    defaultValue: 999999,
    minValue: 1,
    maxValue: 999999,
    automationRate: "k-rate"
  },
  tempo: {
    name: "tempo",
    defaultValue: 120,
    minValue: 20,
    maxValue: 300,
    automationRate: "k-rate"
  }
};
const SAMPLE_PLAYER_WORKLET_AUDIOPARAM_DESCRIPTORS = Object.values(
  SAMPLE_PLAYER_WORKLET_AUDIOPARAMS
);
class SamplePlayerProcessor extends AudioWorkletProcessor {
  // ===== CONSTRUCTOR =====
  constructor() {
    super();
    __privateAdd(this, _SamplePlayerProcessor_instances);
    __privateAdd(this, _clamp, (value, min, max) => Math.max(min, Math.min(max, value)));
    __privateAdd(this, _clampZeroCrossing, (value) => __privateGet(this, _clamp).call(this, value, this.minZeroCrossing, this.maxZeroCrossing));
    this.buffer = null;
    this.minZeroCrossing = 0;
    this.maxZeroCrossing = 0;
    this.usePlaybackPosition = false;
    this.enableLoopSmoothing = true;
    this.enableAdaptiveDrift = true;
    this.enableAmplitudeCompensation = true;
    this.syncLoopToTempo = false;
    this.keytrackLoopAmount = 0;
    this.durationPreservation = {
      enabled: false,
      maxDriftSamples: Math.floor(sampleRate * 0.04),
      timelinePosition: 0,
      resetPending: false
    };
    this.PITCH_PRESERVATION_THRESHOLD = Math.floor(sampleRate * 0.061);
    this.AMPLITUDE_COMPENSATION_THRESHOLD = Math.floor(sampleRate / 16.35);
    this.port.onmessage = __privateMethod(this, _SamplePlayerProcessor_instances, handleMessage_fn).bind(this);
    __privateMethod(this, _SamplePlayerProcessor_instances, resetState_fn).call(this);
    this.port.postMessage({ type: "initialized" });
  }
  // ===== PARAMETER DESCRIPTORS =====
  static get parameterDescriptors() {
    return SAMPLE_PLAYER_WORKLET_AUDIOPARAM_DESCRIPTORS;
  }
  // ===== MAIN PROCESS METHOD =====
  process(inputs, outputs, parameters) {
    var _a, _b, _c;
    const output = outputs[0];
    this.debugCounter++;
    if (!output || !this.isPlaying || !((_b = (_a = this.buffer) == null ? void 0 : _a[0]) == null ? void 0 : _b.length)) {
      return true;
    }
    const masterGain = parameters.masterGain[0];
    const positionParams = __privateMethod(this, _SamplePlayerProcessor_instances, extractPositionParams_fn).call(this, parameters);
    const playbackRange = __privateMethod(this, _SamplePlayerProcessor_instances, calculatePlaybackRange_fn).call(this, positionParams);
    const effectivePlaybackRate = parameters.playbackRate[0] * this.transpositionPlaybackrate;
    const tempo = parameters.tempo[0];
    const loopRange = __privateMethod(this, _SamplePlayerProcessor_instances, calculateLoopRange_fn).call(this, positionParams, playbackRange, parameters.loopDurationDriftAmount[0], tempo, effectivePlaybackRate);
    const amplitudeGain = __privateMethod(this, _SamplePlayerProcessor_instances, analyzeLoopAmplitude_fn).call(this, loopRange.loopStartSamples, loopRange.loopEndSamples);
    const velocityGain = __privateMethod(this, _SamplePlayerProcessor_instances, midiVelocityToGain_fn).call(this, parameters.velocity[0]) * this.velocitySensitivity;
    const basePan = parameters.pan[0];
    const effectivePan = this.panDriftEnabled ? Math.max(-1, Math.min(1, basePan + this.currentPanDrift)) : basePan;
    let outputChannels;
    if (output instanceof Float32Array) {
      outputChannels = [output];
    } else if (Array.isArray(output) && output.every((ch) => ch instanceof Float32Array)) {
      outputChannels = output;
    } else {
      console.error("Unexpected output structure:", {
        outputType: typeof output,
        isArray: Array.isArray(output),
        constructor: (_c = output == null ? void 0 : output.constructor) == null ? void 0 : _c.name,
        length: output == null ? void 0 : output.length
      });
      return true;
    }
    const numChannels = outputChannels.length;
    const isConstant = __privateMethod(this, _SamplePlayerProcessor_instances, getConstantFlags_fn).call(this, parameters);
    const silencePadTail = loopRange.loopEndSamples > playbackRange.endSamples;
    const TAIL_FADE_SAMPLES = 64;
    if (this.playbackPosition === 0) {
      this.playbackPosition = this.reversePlayback ? playbackRange.endSamples - 1 : playbackRange.startSamples;
      __privateMethod(this, _SamplePlayerProcessor_instances, resetDurationPreservation_fn).call(this, this.playbackPosition);
    }
    for (let sample = 0; sample < outputChannels[0].length; sample++) {
      const envelopeGain = __privateMethod(this, _SamplePlayerProcessor_instances, getSafeParam_fn).call(this, parameters.envGain, sample, isConstant.envGain);
      const baseRate = __privateMethod(this, _SamplePlayerProcessor_instances, getSafeParam_fn).call(this, parameters.playbackRate, sample, isConstant.playbackRate);
      const effectiveRate = this.reversePlayback ? -Math.abs(baseRate) : Math.abs(baseRate);
      const playbackStep = effectiveRate * this.transpositionPlaybackrate;
      const canWrapLoop = this.loopEnabled && this.loopCount < parameters.maxLoopCount[0];
      if (canWrapLoop) {
        if (!this.reversePlayback && this.playbackPosition >= loopRange.loopEndSamples) {
          __privateMethod(this, _SamplePlayerProcessor_instances, smoothLoopWrap_fn).call(this, silencePadTail ? 0 : this.buffer[0][Math.floor(this.playbackPosition - 1)] || 0, this.buffer[0][Math.floor(loopRange.loopStartSamples)] || 0);
          this.playbackPosition = loopRange.loopStartSamples;
          this.loopCount++;
          this.nextDriftGenerated = false;
        } else if (this.reversePlayback && this.playbackPosition <= loopRange.loopStartSamples) {
          __privateMethod(this, _SamplePlayerProcessor_instances, smoothLoopWrap_fn).call(this, this.buffer[0][Math.floor(loopRange.loopStartSamples)] || 0, silencePadTail ? 0 : this.buffer[0][Math.floor(loopRange.loopEndSamples) - 1] || 0);
          this.playbackPosition = loopRange.loopEndSamples;
          this.loopCount++;
          this.nextDriftGenerated = false;
        }
      }
      const durationResetTarget = __privateMethod(this, _SamplePlayerProcessor_instances, prepareDurationPreservingSample_fn).call(this, playbackStep, loopRange);
      const shouldStopForward = !this.reversePlayback && (__privateMethod(this, _SamplePlayerProcessor_instances, isDurationPreservationActive_fn).call(this, loopRange) ? this.durationPreservation.timelinePosition : this.playbackPosition) >= playbackRange.endSamples;
      const shouldStopReverse = this.reversePlayback && (__privateMethod(this, _SamplePlayerProcessor_instances, isDurationPreservationActive_fn).call(this, loopRange) ? this.durationPreservation.timelinePosition : this.playbackPosition) <= playbackRange.startSamples;
      const isWithinLoop = this.loopEnabled && this.playbackPosition >= loopRange.loopStartSamples && this.playbackPosition <= loopRange.loopEndSamples;
      if ((shouldStopForward || shouldStopReverse) && !(this.loopEnabled && isWithinLoop)) {
        __privateMethod(this, _SamplePlayerProcessor_instances, stop_fn).call(this);
        return true;
      }
      let tailGain = 1;
      if (silencePadTail) {
        const distToEnd = playbackRange.endSamples - this.playbackPosition;
        if (distToEnd < TAIL_FADE_SAMPLES) {
          tailGain = Math.max(0, distToEnd / TAIL_FADE_SAMPLES);
        }
      }
      const currentPosition = Math.floor(this.playbackPosition);
      const positionOffset = this.playbackPosition - currentPosition;
      let nextPosition, interpWeight;
      if (this.reversePlayback) {
        nextPosition = Math.max(
          currentPosition - 1,
          playbackRange.startSamples
        );
        interpWeight = 1 - positionOffset;
      } else {
        nextPosition = Math.min(
          currentPosition + 1,
          playbackRange.endSamples - 1
        );
        interpWeight = positionOffset;
      }
      for (let channel = 0; channel < numChannels; channel++) {
        if (!outputChannels[channel]) {
          console.warn(
            \`Output channel \${channel} does not exist. Available channels:\`,
            outputChannels.length
          );
          continue;
        }
        const bufferChannelIndex = Math.min(channel, this.buffer.length - 1);
        const bufferChannel = this.buffer[bufferChannelIndex];
        const currentSample = bufferChannel[currentPosition] || 0;
        const nextSample = bufferChannel[nextPosition] || 0;
        let interpolatedSample = currentSample + interpWeight * (nextSample - currentSample);
        if (this.applyClickCompensation) {
          interpolatedSample += this.loopClickCompensation;
          if (this.compensationDecay) {
            this.loopClickCompensation *= this.compensationDecay;
            if (Math.abs(this.loopClickCompensation) < 1e-3) {
              this.applyClickCompensation = false;
            }
          } else {
            this.applyClickCompensation = false;
          }
        }
        const finalSample = interpolatedSample * velocityGain * envelopeGain * masterGain * amplitudeGain * tailGain;
        let panAdjustedSample = finalSample;
        if (outputChannels.length === 2) {
          if (channel === 0) {
            panAdjustedSample = finalSample * (1 - Math.max(0, effectivePan));
          } else if (channel === 1) {
            panAdjustedSample = finalSample * (1 - Math.max(0, -effectivePan));
          }
        }
        outputChannels[channel][sample] = Math.max(
          -1,
          Math.min(1, isFinite(panAdjustedSample) ? panAdjustedSample : 0)
        );
      }
      __privateMethod(this, _SamplePlayerProcessor_instances, advanceDurationPreservingPlayback_fn).call(this, playbackStep, durationResetTarget, loopRange, canWrapLoop);
    }
    if (this.usePlaybackPosition) {
      const normalizedPosition = __privateMethod(this, _SamplePlayerProcessor_instances, samplesToNormalized_fn).call(this, this.playbackPosition);
      this.port.postMessage({
        type: "voice:position",
        position: normalizedPosition
      });
    }
    return true;
  }
}
_SamplePlayerProcessor_instances = new WeakSet();
// ===== MESSAGE HANDLING =====
handleMessage_fn = function(event) {
  const {
    type,
    value,
    buffer,
    timestamp,
    durationSeconds,
    zeroCrossings,
    semitones,
    allowedPeriods,
    playbackDirection
  } = event.data;
  switch (type) {
    case "voice:reset":
      __privateMethod(this, _SamplePlayerProcessor_instances, resetState_fn).call(this);
      this.port.postMessage({ type: "voice:reset" });
      break;
    case "voice:setBuffer":
      __privateMethod(this, _SamplePlayerProcessor_instances, resetState_fn).call(this);
      this.zeroCrossings = [];
      this.minZeroCrossing = 0;
      this.maxZeroCrossing = 0;
      this.buffer = null;
      this.buffer = buffer;
      this.port.postMessage({
        type: "voice:loaded",
        durationSeconds,
        time: currentTime
      });
      break;
    case "transpose":
      this.transpositionPlaybackrate = Math.pow(2, semitones / 12);
      this.port.postMessage({
        type: "voice:transposed",
        semitones,
        time: currentTime
      });
      break;
    case "voice:setZeroCrossings":
      this.zeroCrossings = (zeroCrossings || []).map(
        (timeSec) => timeSec * sampleRate
      );
      if (this.zeroCrossings.length > 0) {
        this.minZeroCrossing = this.zeroCrossings[0];
        this.maxZeroCrossing = this.zeroCrossings[this.zeroCrossings.length - 1];
      }
      break;
    case "voice:start":
      this.isReleasing = false;
      this.isPlaying = true;
      this.loopCount = 0;
      this.playbackPosition = 0;
      this.port.postMessage({
        type: "voice:started",
        time: timestamp || currentTime
      });
      break;
    case "voice:release":
      this.isReleasing = true;
      this.port.postMessage({
        type: "voice:releasing",
        time: currentTime
      });
      break;
    case "voice:stop":
      __privateMethod(this, _SamplePlayerProcessor_instances, stop_fn).call(this);
      break;
    case "setLoopEnabled":
      this.loopEnabled = value;
      this.port.postMessage({
        type: "loop:enabled",
        enabled: value
      });
      break;
    case "setPanDriftEnabled":
      this.panDriftEnabled = value;
      break;
    case "voice:setPlaybackDirection": {
      const reverse = playbackDirection === "reverse";
      if (reverse !== this.reversePlayback && this.playbackPosition > 0) {
        this.playbackPosition += reverse ? 1 : -1;
      }
      this.reversePlayback = reverse;
      this.port.postMessage({
        type: "voice:playbackDirectionChange",
        playbackDirection
      });
      break;
    }
    case "voice:usePlaybackPosition":
      this.usePlaybackPosition = value;
      break;
    case "syncLoopToTempo":
      this.syncLoopToTempo = value;
      this.port.postMessage({
        type: "loop:syncToTempo",
        enabled: value
      });
      break;
    case "setKeytrackLoopAmount":
      this.keytrackLoopAmount = Math.max(0, Math.min(1, value));
      break;
    case "setPreserveDuration":
      this.durationPreservation.enabled = Boolean(value);
      __privateMethod(this, _SamplePlayerProcessor_instances, resetDurationPreservation_fn).call(this, this.playbackPosition);
      break;
  }
};
// ===== METHODS =====
resetState_fn = function() {
  this.isPlaying = false;
  this.isReleasing = false;
  this.loopEnabled = false;
  this.transpositionPlaybackrate = 1;
  this.velocitySensitivity = 1;
  this.reversePlayback = false;
  this.playbackPosition = 0;
  this.debugCounter = 0;
  this.loopCount = 0;
  this.applyClickCompensation = false;
  this.loopClickCompensation = 0;
  this.driftUpdateCounter = 0;
  this.currentLoopDrift = 0;
  this.currentPanDrift = 0;
  this.panDriftEnabled = true;
  this.nextDriftGenerated = false;
  this.loopAmplitudeGain = 1;
  this.lastAnalyzedLoopStart = -1;
  this.lastAnalyzedLoopEnd = -1;
  __privateMethod(this, _SamplePlayerProcessor_instances, resetDurationPreservation_fn).call(this);
};
stop_fn = function() {
  this.isPlaying = false;
  this.isReleasing = false;
  this.playbackPosition = 0;
  this.port.postMessage({ type: "voice:stopped" });
};
// Arm click compensation for a loop-wrap discontinuity between the sample
// just emitted and the first sample of the next pass.
smoothLoopWrap_fn = function(lastLoopSample, newFirstSample) {
  const discontinuity = lastLoopSample - newFirstSample;
  if (this.enableLoopSmoothing && Math.abs(discontinuity) > 0.01) {
    this.loopClickCompensation = discontinuity * 0.5;
    this.compensationDecay = 0.9;
    this.applyClickCompensation = true;
  }
};
_clamp = new WeakMap();
_clampZeroCrossing = new WeakMap();
findNearestZeroCrossing_fn = function(position, direction = "any", maxDistance = null) {
  if (!this.zeroCrossings || this.zeroCrossings.length === 0) {
    return position;
  }
  const closestValue = findClosest(this.zeroCrossings, position, direction);
  if (maxDistance !== null && Math.abs(closestValue - position) > maxDistance) {
    return position;
  }
  return closestValue;
};
// ===== CONVERSION UTILITIES =====
/**
 * Convert normalized position (0-1) to sample index
 * @param {number} normalizedPosition - Position as 0-1 value
 * @returns {number} - Sample index
 */
normalizedToSamples_fn = function(normalizedPosition) {
  if (!this.buffer || !this.buffer[0]) return 0;
  return normalizedPosition * this.buffer[0].length;
};
/**
 * Convert sample index to normalized position (0-1)
 * @param {number} sampleIndex - Sample index
 * @returns {number} - Normalized position 0-1
 */
samplesToNormalized_fn = function(sampleIndex) {
  if (!this.buffer || !this.buffer[0]) return 0;
  return sampleIndex / this.buffer[0].length;
};
/**
 * Convert MIDI velocity (0-127) to gain multiplier (0-1)
 * @param {number} midiVelocity - MIDI velocity 0-127
 * @returns {number} - Gain multiplier 0-1
 */
midiVelocityToGain_fn = function(midiVelocity) {
  return Math.max(0, Math.min(1, midiVelocity / 127));
};
/**
 * Get buffer duration in seconds
 * @returns {number} - Buffer duration in seconds
 */
getBufferDurationSeconds_fn = function() {
  var _a, _b;
  return (((_b = (_a = this.buffer) == null ? void 0 : _a[0]) == null ? void 0 : _b.length) || 0) / sampleRate;
};
/**
 * Calculate musical note durations in samples for given tempo
 * @param {number} tempo - BPM
 * @returns {Object} - Musical note durations in samples
 */
getMusicalNoteDurations_fn = function(tempo) {
  const beatsPerSecond = tempo / 60;
  const samplesPerBeat = sampleRate / beatsPerSecond;
  return {
    // Standard notes
    whole: samplesPerBeat * 4,
    half: samplesPerBeat * 2,
    quarter: samplesPerBeat,
    eighth: samplesPerBeat / 2,
    sixteenth: samplesPerBeat / 4,
    thirtySecond: samplesPerBeat / 8,
    // Triplets (divide by 3/2 = multiply by 2/3)
    quarterTriplet: samplesPerBeat * 2 / 3,
    eighthTriplet: samplesPerBeat / 2 * 2 / 3,
    sixteenthTriplet: samplesPerBeat / 4 * 2 / 3
  };
};
/**
 * Quantize loop duration to nearest musical interval (skips if below the smallest quantize option)
 * @param {number} loopDurationSamples - Current loop duration in samples
 * @param {number} tempo - Current tempo in BPM
 * @param {number} playbackRate - Current playback rate
 * @returns {number} - Quantized loop duration in samples
 */
quantizeLoopDuration_fn = function(loopDurationSamples, tempo, playbackRate) {
  if (!this.syncLoopToTempo) {
    return loopDurationSamples;
  }
  const noteDurations = __privateMethod(this, _SamplePlayerProcessor_instances, getMusicalNoteDurations_fn).call(this, tempo);
  const effectiveDuration = loopDurationSamples / Math.abs(playbackRate);
  const smallestInterval = noteDurations.thirtySecond;
  if (effectiveDuration < smallestInterval) {
    return loopDurationSamples;
  }
  const intervals = Object.values(noteDurations);
  let closestInterval = intervals[0];
  let smallestDiff = Math.abs(effectiveDuration - closestInterval);
  for (const interval of intervals) {
    const diff = Math.abs(effectiveDuration - interval);
    if (diff < smallestDiff) {
      smallestDiff = diff;
      closestInterval = interval;
    }
  }
  return Math.floor(closestInterval * Math.abs(playbackRate));
};
/**
 * Extract and convert all position parameters from seconds to samples
 * @param {Object} parameters - AudioWorkletProcessor parameters
 * @returns {Object} - Converted parameters in samples
 */
extractPositionParams_fn = function(parameters) {
  const samples = {
    startPointSamples: Math.floor(parameters.startPoint[0] * sampleRate),
    endPointSamples: Math.floor(parameters.endPoint[0] * sampleRate),
    loopStartSamples: Math.floor(parameters.loopStart[0] * sampleRate),
    loopEndSamples: Math.floor(parameters.loopEnd[0] * sampleRate)
  };
  return samples;
};
/**
 * Calculate effective playback range in samples
 * @param {Object} params - Position parameters from #extractPositionParams
 * @returns {Object} - Effective start and end positions
 */
calculatePlaybackRange_fn = function(params) {
  var _a, _b;
  const bufferLength = ((_b = (_a = this.buffer) == null ? void 0 : _a[0]) == null ? void 0 : _b.length) || 0;
  const start = Math.max(0, params.startPointSamples);
  const end = params.endPointSamples > start ? Math.min(bufferLength, params.endPointSamples) : bufferLength;
  const snappedStart = __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, start, "right");
  const snappedEnd = __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, end, "left");
  return {
    startSamples: snappedStart,
    endSamples: snappedEnd,
    durationSamples: snappedEnd - snappedStart
  };
};
/**
 * Calculate effective loop range in samples with optional drift
 * @param {Object} params - Position parameters from #extractPositionParams
 * @param {Object} playbackRange - Range from #calculatePlaybackRange
 * @param {number} driftAmount - Loop duration drift amount (0-1)
 * @param {number} tempo - Current tempo in BPM
 * @param {number} playbackRate - Current playback rate
 * @returns {Object} - Effective loop start and end positions with drift applied
 */
calculateLoopRange_fn = function(params, playbackRange, driftAmount = 0, tempo = 120, playbackRate = 1) {
  const lpStart = params.loopStartSamples;
  const lpEnd = params.loopEndSamples;
  let calcLoopStart = lpStart < lpEnd && lpStart >= 0 ? lpStart : playbackRange.startSamples;
  let calcLoopEnd = lpEnd > lpStart && lpEnd <= playbackRange.endSamples ? lpEnd : playbackRange.endSamples;
  let baseDuration = calcLoopEnd - calcLoopStart;
  if (this.syncLoopToTempo) {
    const quantizedDuration = __privateMethod(this, _SamplePlayerProcessor_instances, quantizeLoopDuration_fn).call(this, baseDuration, tempo, playbackRate);
    calcLoopEnd = calcLoopStart + quantizedDuration;
    calcLoopEnd = Math.min(calcLoopEnd, playbackRange.endSamples);
  }
  if (baseDuration > this.PITCH_PRESERVATION_THRESHOLD && this.keytrackLoopAmount > 0 && !this.syncLoopToTempo) {
    const scale = 1 + this.keytrackLoopAmount * (Math.abs(playbackRate) - 1);
    baseDuration = Math.max(1, Math.floor(baseDuration * scale));
    calcLoopEnd = calcLoopStart + baseDuration;
  }
  baseDuration = calcLoopEnd - calcLoopStart;
  if (baseDuration > this.PITCH_PRESERVATION_THRESHOLD) {
    calcLoopStart = __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, calcLoopStart, "right");
  }
  if (driftAmount > 0 && this.loopEnabled) {
    if (!this.nextDriftGenerated || this.loopCount === 0) {
      const updateInterval = baseDuration <= this.PITCH_PRESERVATION_THRESHOLD ? Math.max(
        1,
        Math.floor(this.PITCH_PRESERVATION_THRESHOLD / baseDuration)
      ) : 1;
      const shouldUpdateDrift = this.driftUpdateCounter % updateInterval === 0;
      if (shouldUpdateDrift) {
        this.currentLoopDrift = __privateMethod(this, _SamplePlayerProcessor_instances, generateLoopDrift_fn).call(this, driftAmount, baseDuration);
        if (this.panDriftEnabled && driftAmount > 0 && this.loopCount > 0) {
          const panDriftAmountScalar = 1e-4;
          this.currentPanDrift = this.currentLoopDrift * panDriftAmountScalar;
        } else {
          this.currentPanDrift = 0;
        }
      }
      this.driftUpdateCounter++;
      this.nextDriftGenerated = true;
    }
    const driftedLoopEnd = calcLoopEnd + this.currentLoopDrift;
    const minLoopDuration = Math.max(1, Math.floor(baseDuration * 0.1));
    const maxLoopEnd = Math.max(playbackRange.endSamples, calcLoopEnd);
    calcLoopEnd = Math.max(
      calcLoopStart + minLoopDuration,
      Math.min(maxLoopEnd, driftedLoopEnd)
    );
  } else {
    this.currentPanDrift = 0;
  }
  if (baseDuration > this.PITCH_PRESERVATION_THRESHOLD && calcLoopEnd <= playbackRange.endSamples) {
    calcLoopEnd = Math.max(
      calcLoopStart + 1,
      __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, calcLoopEnd, "left")
    );
  }
  const loopDuration = calcLoopEnd - calcLoopStart;
  return {
    loopStartSamples: calcLoopStart,
    loopEndSamples: calcLoopEnd,
    loopDurationSamples: loopDuration
  };
};
getSafeParam_fn = function(paramArray, index, isConstant) {
  return isConstant ? paramArray[0] : paramArray[Math.min(index, paramArray.length - 1)];
};
getConstantFlags_fn = function(parameters) {
  this.constantFlags ?? (this.constantFlags = {
    envGain: true,
    playbackRate: true
  });
  this.constantFlags.envGain = parameters.envGain.length === 1;
  this.constantFlags.playbackRate = parameters.playbackRate.length === 1;
  return this.constantFlags;
};
// ===== DURATION PRESERVATION =====
resetDurationPreservation_fn = function(position = 0) {
  this.durationPreservation.timelinePosition = position;
  this.durationPreservation.resetPending = false;
};
isDurationPreservationActive_fn = function(loopRange) {
  var _a;
  return this.durationPreservation.enabled && Boolean((_a = this.zeroCrossings) == null ? void 0 : _a.length) && (!this.loopEnabled || loopRange.loopDurationSamples > this.PITCH_PRESERVATION_THRESHOLD);
};
prepareDurationPreservingSample_fn = function(playbackRate, loopRange) {
  const state = this.durationPreservation;
  if (!__privateMethod(this, _SamplePlayerProcessor_instances, isDurationPreservationActive_fn).call(this, loopRange)) return null;
  if (Math.abs(this.playbackPosition - state.timelinePosition) > state.maxDriftSamples) {
    state.resetPending = true;
  }
  if (!state.resetPending) return null;
  const direction = playbackRate < 0 ? "left" : "right";
  const outgoingZero = __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, this.playbackPosition, direction);
  if (Math.abs(outgoingZero - this.playbackPosition) > Math.abs(playbackRate)) {
    return null;
  }
  this.playbackPosition = outgoingZero;
  state.resetPending = false;
  return __privateMethod(this, _SamplePlayerProcessor_instances, findNearestZeroCrossing_fn).call(this, state.timelinePosition, "any", state.maxDriftSamples);
};
advanceDurationPreservingPlayback_fn = function(playbackRate, resetTarget, loopRange, canWrapLoop) {
  const state = this.durationPreservation;
  this.playbackPosition = resetTarget === null ? this.playbackPosition + playbackRate : resetTarget;
  if (__privateMethod(this, _SamplePlayerProcessor_instances, isDurationPreservationActive_fn).call(this, loopRange)) {
    state.timelinePosition += playbackRate < 0 ? -1 : 1;
    if (canWrapLoop && playbackRate >= 0 && state.timelinePosition >= loopRange.loopEndSamples) {
      state.timelinePosition = loopRange.loopStartSamples;
    } else if (canWrapLoop && playbackRate < 0 && state.timelinePosition <= loopRange.loopStartSamples) {
      state.timelinePosition = loopRange.loopEndSamples - 1;
    }
  } else {
    __privateMethod(this, _SamplePlayerProcessor_instances, resetDurationPreservation_fn).call(this, this.playbackPosition);
  }
};
/**
 * Generate a new drift amount for the current loop iteration
 * @param {number} driftAmount - Maximum drift amount (0-1)
 * @param {number} baseDuration - Base loop duration in samples
 * @returns {number} - Drift amount in samples
 */
generateLoopDrift_fn = function(driftAmount, baseDuration) {
  if (driftAmount <= 0) return 0;
  const randomFactor = (Math.random() - 0.5) * 2;
  let effectiveDriftAmount = driftAmount;
  if (this.enableAdaptiveDrift) {
    const shortThreshold = 1024;
    const longThreshold = 8192;
    if (baseDuration < shortThreshold) {
      effectiveDriftAmount *= 0.1;
    } else if (baseDuration < longThreshold) {
      const scaleFactor = 0.1 + 0.9 * (baseDuration - shortThreshold) / (longThreshold - shortThreshold);
      effectiveDriftAmount *= scaleFactor;
    }
  }
  const maxDriftSamples = effectiveDriftAmount * baseDuration;
  return Math.floor(randomFactor * maxDriftSamples);
};
/**
 * Analyze loop amplitude and calculate makeup gain for short loops
 * @param {number} loopStart - Loop start position in samples
 * @param {number} loopEnd - Loop end position in samples
 * @returns {number} - Makeup gain multiplier (1.0 = no change)
 */
analyzeLoopAmplitude_fn = function(loopStart, loopEnd) {
  if (!this.enableAmplitudeCompensation || !this.buffer || !this.buffer[0]) {
    return 1;
  }
  const loopDuration = loopEnd - loopStart;
  if (loopDuration >= this.AMPLITUDE_COMPENSATION_THRESHOLD) {
    return 1;
  }
  if (loopStart === this.lastAnalyzedLoopStart && loopEnd === this.lastAnalyzedLoopEnd) {
    return this.loopAmplitudeGain;
  }
  let sumSquares = 0;
  let sampleCount = 0;
  const channel = this.buffer[0];
  const startIndex = Math.floor(loopStart);
  const endIndex = Math.floor(loopEnd);
  for (let i = startIndex; i < endIndex && i < channel.length; i++) {
    const sample = channel[i];
    sumSquares += sample * sample;
    sampleCount++;
  }
  if (sampleCount === 0) return 1;
  const rmsAmplitude = Math.sqrt(sumSquares / sampleCount);
  const targetAmplitude = 0.3;
  let makeupGain = 1;
  if (rmsAmplitude < targetAmplitude) {
    const safeRms = Math.max(rmsAmplitude, 1e-3);
    makeupGain = targetAmplitude / safeRms;
    makeupGain = Math.min(2, makeupGain);
  }
  this.lastAnalyzedLoopStart = loopStart;
  this.lastAnalyzedLoopEnd = loopEnd;
  this.loopAmplitudeGain = makeupGain;
  return makeupGain;
};
registerProcessor("sample-player-processor", SamplePlayerProcessor);
class RandomNoiseProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.previousNoise = 0;
    this.previousFiltered = 0;
    this.hpfHz = 150;
    this.alpha = this.hpfHz / (this.hpfHz + sampleRate / (2 * Math.PI));
    this.port.onmessage = (event) => {
      if (event.data.type === "setHpfHz") {
        this.hpfHz = event.data.value;
        this.alpha = this.calculateAlpha(this.hpfHz);
      }
    };
    this.port.postMessage({ type: "initialized" });
  }
  calculateAlpha(frequency) {
    return frequency / (frequency + sampleRate / (2 * Math.PI));
  }
  process(inputs, outputs, parameters) {
    const output = outputs[0];
    output.forEach((channel) => {
      for (let i = 0; i < channel.length; i++) {
        const noise = Math.random() * 2 - 1;
        const filtered = this.alpha * (noise - this.previousNoise) + this.previousFiltered;
        this.previousNoise = noise;
        this.previousFiltered = filtered;
        channel[i] = filtered;
      }
    });
    return true;
  }
}
registerProcessor("random-noise-processor", RandomNoiseProcessor);
const cheapSoftClipSingleSample = (sample, max = 0.9) => {
  const a = Math.abs(sample);
  if (a <= max) return sample;
  const x = a / max;
  const compressed = x / (1 + x);
  return Math.sign(sample) * max * compressed;
};
const compressSingleSample = (input, threshold = 0.75, ratio = 4, limiter = { enabled: true, type: "soft", outputRange: { min: -1, max: 1 } }) => {
  const { min, max } = limiter.outputRange;
  let x = input;
  if (Math.abs(x) > threshold) {
    x = Math.sign(x) * (threshold + (Math.abs(x) - threshold) / ratio);
  }
  if (limiter.enabled) {
    if (limiter.type === "soft") {
      x = cheapSoftClipSingleSample(x, Math.abs(max));
    } else if (limiter.type === "hard") {
      x = Math.max(min, Math.min(max, x));
    }
  }
  return x;
};
class DelayBuffer {
  constructor(maxDelaySamples) {
    this.buffer = new Float32Array(maxDelaySamples);
    this.writePtr = 0;
    this.readPtr = 0;
  }
  write(sample) {
    this.buffer[this.writePtr] = sample;
  }
  read() {
    return this.buffer[this.readPtr];
  }
  updatePointers(delaySamples) {
    this.writePtr = (this.writePtr + 1) % this.buffer.length;
    this.readPtr = (this.writePtr - delaySamples + this.buffer.length) % this.buffer.length;
  }
}
const AUTO_GAIN_THRESHOLD = 0.8;
const SAFETY_GAIN_COMPENSATION = 0.2;
class FeedbackDelay {
  constructor(sampleRate2) {
    this.sampleRate = sampleRate2;
    this.buffers = [];
    this.initialized = false;
    this.autoGainEnabled = false;
    this.gainCompensation = SAFETY_GAIN_COMPENSATION;
    this.lowpassStates = [];
    this.highpassStates = [];
    this.highpassInputStates = [];
  }
  initializeBuffers(channelCount) {
    this.buffers = [];
    this.lowpassStates = [];
    this.highpassStates = [];
    this.highpassInputStates = [];
    const maxSamples = Math.floor(this.sampleRate * 2);
    for (let c = 0; c < channelCount; c++) {
      this.buffers[c] = new DelayBuffer(maxSamples);
      this.lowpassStates[c] = 0;
      this.highpassStates[c] = 0;
      this.highpassInputStates[c] = 0;
    }
    this.initialized = true;
  }
  /** Simple one-pole lowpass filter */
  lowpass(input, cutoffFreq, channelIndex) {
    if (cutoffFreq >= this.sampleRate * 0.4) {
      return input;
    }
    const omega = 2 * Math.PI * cutoffFreq / this.sampleRate;
    const alpha = Math.max(
      0,
      Math.min(0.99, Math.sin(omega) / (Math.sin(omega) + Math.cos(omega)))
    );
    this.lowpassStates[channelIndex] = alpha * input + (1 - alpha) * this.lowpassStates[channelIndex];
    return this.lowpassStates[channelIndex];
  }
  /** Simple one-pole highpass filter */
  highpass(input, cutoffFreq, channelIndex) {
    if (cutoffFreq < 5) return input;
    const omega = 2 * Math.PI * cutoffFreq / this.sampleRate;
    const alpha = Math.max(
      0,
      Math.min(0.99, Math.sin(omega) / (Math.sin(omega) + Math.cos(omega)))
    );
    const lowpassOutput = alpha * input + (1 - alpha) * this.highpassStates[channelIndex];
    const highpassOutput = input - lowpassOutput;
    this.highpassStates[channelIndex] = lowpassOutput;
    return highpassOutput;
  }
  process(inputSample, channelIndex, feedbackAmount, delayTime, lowpassFreq = 1e4, highpassFreq = 100) {
    if (!this.initialized) return inputSample;
    const buffer = this.buffers[channelIndex] || this.buffers[0];
    const delaySamples = Math.floor(this.sampleRate * delayTime);
    const delayedSample = buffer.read();
    let filteredDelay = this.highpass(
      delayedSample,
      highpassFreq,
      channelIndex
    );
    filteredDelay = this.lowpass(filteredDelay, lowpassFreq, channelIndex);
    const feedbackSample = feedbackAmount * filteredDelay + inputSample;
    let outputSample = feedbackSample;
    const compressedFeedback = compressSingleSample(feedbackSample, 0.5, 4, {
      enabled: true,
      // limiter enabled
      outputRange: { min: -0.99, max: 0.99 },
      type: "soft"
      // soft clip
    });
    if (this.autoGainEnabled && feedbackAmount > AUTO_GAIN_THRESHOLD) {
      const safetyReduction = 1 - (feedbackAmount - AUTO_GAIN_THRESHOLD) * this.gainCompensation;
      outputSample = compressedFeedback * safetyReduction;
    }
    return { outputSample, feedbackSample: compressedFeedback, delaySamples };
  }
  updateBuffer(channelIndex, sample, delaySamples) {
    const buffer = this.buffers[channelIndex] || this.buffers[0];
    buffer.write(sample);
    buffer.updatePointers(delaySamples);
  }
  setAutoGain(enabled, compensation = SAFETY_GAIN_COMPENSATION) {
    this.autoGainEnabled = enabled;
    this.gainCompensation = compensation;
  }
}
registerProcessor(
  "feedback-delay-processor",
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: "feedbackAmount",
          defaultValue: 0.5,
          minValue: 0,
          maxValue: 1,
          automationRate: "k-rate"
        },
        {
          name: "delayTime",
          defaultValue: 0.5,
          minValue: 12656238799684143e-20,
          // <- B8 natural in seconds (highest note period that works)
          maxValue: 2,
          automationRate: "k-rate"
        },
        {
          name: "decay",
          // feedback decay time factor
          defaultValue: 1,
          minValue: 0,
          maxValue: 1,
          automationRate: "k-rate"
        },
        {
          name: "lowpass",
          defaultValue: 1e4,
          minValue: 100,
          maxValue: 16e3,
          automationRate: "k-rate"
        }
      ];
    }
    constructor() {
      super();
      this.feedbackDelay = new FeedbackDelay(sampleRate);
      this.decayStartTime = null;
      this.decayActive = false;
      this.baseFeedbackAmount = 0.5;
      this.setupMessageHandling();
      this.port.postMessage({ type: "initialized" });
    }
    setupMessageHandling() {
      this.port.onmessage = (event) => {
        switch (event.data.type) {
          case "setAutoGain":
            this.feedbackDelay.setAutoGain(
              event.data.enabled,
              event.data.amount
            );
            break;
          case "triggerDecay":
            this.decayStartTime = currentTime;
            this.decayActive = true;
            this.baseFeedbackAmount = event.data.baseFeedbackAmount || 0.5;
            break;
          case "stopDecay":
            this.decayActive = false;
            this.decayStartTime = null;
            break;
        }
      };
    }
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
      if (!input || !output) return true;
      if (!this.feedbackDelay.initialized || this.feedbackDelay.buffers.length !== input.length) {
        this.feedbackDelay.initializeBuffers(input.length);
      }
      const baseFeedbackAmount = parameters.feedbackAmount[0];
      const delayTime = parameters.delayTime[0];
      const decay = parameters.decay[0];
      const lowpassFreq = parameters.lowpass[0];
      const channelCount = Math.min(input.length, output.length);
      const frameCount = output[0].length;
      for (let i = 0; i < frameCount; ++i) {
        let effectiveFeedbackAmount = baseFeedbackAmount;
        if (this.decayActive && this.decayStartTime !== null) {
          const elapsedTime = currentTime - this.decayStartTime + i / sampleRate;
          const delayCompensation = Math.min(100, 0.5 / delayTime);
          const timeConstant = Math.pow(decay, 5) * 1e3 * delayCompensation + 0.5;
          const decayFactor = Math.exp(-elapsedTime / timeConstant);
          effectiveFeedbackAmount = baseFeedbackAmount * decayFactor;
          if (effectiveFeedbackAmount < 0.01) {
            this.decayActive = false;
            effectiveFeedbackAmount = 0;
          }
        }
        for (let c = 0; c < channelCount; c++) {
          const processed = this.feedbackDelay.process(
            input[c][i],
            c,
            effectiveFeedbackAmount,
            delayTime,
            lowpassFreq
          );
          output[c][i] = processed.outputSample;
          this.feedbackDelay.updateBuffer(
            c,
            processed.feedbackSample,
            processed.delaySamples
          );
        }
      }
      return true;
    }
  }
);
const DEFAULT_DELAY_CONFIG = {
  CHARACTER: ["filtered"],
  // 'clean' | 'bitCrushed' | 'filtered' or combo
  // Smoothing factor for delay time interpolation
  SMOOTHING_FACTOR: {
    slowest: 1e-4
  }
};
const DEFAULT_CHARACTER_CONFIG = {
  bitCrushed: {
    bits: 11,
    // bits for bit reduction (e.g. 4 = 16 levels)
    downsample: 3
    // downsample factor (1 = no downsampling, 4 = 1/4 samplerate)
  },
  filtered: {
    freq: 900,
    // Hz
    Q: 0.15
    // very subtle / broad
  }
};
registerProcessor(
  "delay-processor",
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: "delayTime",
          defaultValue: 0.5,
          minValue: 1e-3,
          maxValue: 2,
          automationRate: "k-rate"
        },
        {
          name: "feedbackAmount",
          defaultValue: 0,
          minValue: 0,
          maxValue: 0.99,
          automationRate: "k-rate"
        }
      ];
    }
    constructor() {
      super();
      this.buffers = [];
      this.smoothedDelaySamples = [];
      this.smoothingFactor = DEFAULT_DELAY_CONFIG.SMOOTHING_FACTOR.slowest;
      this.characterModes = [...DEFAULT_DELAY_CONFIG.CHARACTER];
      this._bpState = [];
      this._bpFreq = DEFAULT_CHARACTER_CONFIG.filtered.freq;
      this._bpQ = DEFAULT_CHARACTER_CONFIG.filtered.Q;
      this._bpCoeffs = null;
      this._lastBpFreq = -1;
      this._lastBpQ = -1;
      this.lofiBits = DEFAULT_CHARACTER_CONFIG["bitCrushed"].bits;
      this.lofiDownsample = DEFAULT_CHARACTER_CONFIG["bitCrushed"].downsample;
      this._lofiSampleHold = [];
      this._lofiSampleCount = [];
      this.initialized = false;
      this.port.onmessage = (event) => {
        if (event.data && event.data.type === "setCharacter" && Array.isArray(event.data.modes)) {
          this.characterModes = [...event.data.modes];
        }
        if (event.data && event.data.type === "setBandpassFreq" && typeof event.data.hz === "number") {
          this.setBandpassFreq(event.data.hz);
        }
        if (event.data && event.data.type === "trigger") ;
      };
      this.port.postMessage({ type: "initialized" });
    }
    setBandpassFreq(hz) {
      this._bpFreq = hz;
      this._lastBpFreq = -1;
    }
    _updateBandpassCoeffs() {
      if (this._lastBpFreq === this._bpFreq && this._lastBpQ === this._bpQ) {
        return;
      }
      const bpFreq = this._bpFreq;
      const bpQ = this._bpQ;
      const omega = 2 * Math.PI * bpFreq / sampleRate;
      const alpha = Math.sin(omega) / (2 * bpQ);
      const cosw = Math.cos(omega);
      const b0 = alpha;
      const b1 = 0;
      const b2 = -alpha;
      const a0 = 1 + alpha;
      const a1 = -2 * cosw;
      const a2 = 1 - alpha;
      this._bpCoeffs = {
        b0: b0 / a0,
        b1: b1 / a0,
        b2: b2 / a0,
        a1: a1 / a0,
        a2: a2 / a0
      };
      this._lastBpFreq = bpFreq;
      this._lastBpQ = bpQ;
    }
    initializeBuffers(channelCount) {
      const maxSamples = Math.floor(sampleRate * 2);
      this.buffers = [];
      this.smoothedDelaySamples = [];
      this._lofiSampleHold = [];
      this._lofiSampleCount = [];
      for (let c = 0; c < channelCount; c++) {
        this.buffers[c] = new DelayBuffer(maxSamples);
        this.smoothedDelaySamples[c] = Math.floor(sampleRate * 0.5);
        this._lofiSampleHold[c] = 0;
        this._lofiSampleCount[c] = 0;
      }
      this.initialized = true;
    }
    _processLoFi(delayed, c) {
      if (this._lofiSampleCount[c] % this.lofiDownsample === 0) {
        const levels = Math.pow(2, this.lofiBits);
        delayed = Math.round(delayed * levels) / levels;
        this._lofiSampleHold[c] = delayed;
      } else {
        delayed = this._lofiSampleHold[c];
      }
      this._lofiSampleCount[c]++;
      return delayed;
    }
    _processBandpass(delayed, c) {
      if (!this._bpState) this._bpState = [];
      if (!this._bpState[c]) {
        this._bpState[c] = { x1: 0, x2: 0, y1: 0, y2: 0 };
      }
      this._updateBandpassCoeffs();
      if (!this._bpCoeffs) {
        return delayed;
      }
      const { b0, b1, b2, a1, a2 } = this._bpCoeffs;
      const s = this._bpState[c];
      const y = b0 * delayed + b1 * s.x1 + b2 * s.x2 - a1 * s.y1 - a2 * s.y2;
      s.x2 = s.x1;
      s.x1 = delayed;
      s.y2 = s.y1;
      s.y1 = y;
      return y;
    }
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
      if (!input || !output || input.length === 0 || output.length === 0) {
        return true;
      }
      if (!input[0] || !output[0] || input[0].length === 0 || output[0].length === 0) {
        return true;
      }
      if (!this.initialized || this.buffers.length !== input.length) {
        this.initializeBuffers(input.length);
      }
      const delayTime = parameters.delayTime[0];
      const feedbackAmount = parameters.feedbackAmount[0];
      const targetDelaySamples = sampleRate * delayTime;
      const channelCount = Math.min(input.length, output.length);
      const frameCount = output[0].length;
      const smoothing = this.smoothingFactor;
      for (let i = 0; i < frameCount; ++i) {
        for (let c = 0; c < channelCount; c++) {
          const buf = this.buffers[c];
          if (!buf) {
            continue;
          }
          this.smoothedDelaySamples[c] += (targetDelaySamples - this.smoothedDelaySamples[c]) * smoothing;
          const smoothedDelay = this.smoothedDelaySamples[c];
          const intDelay = Math.floor(smoothedDelay);
          const frac = smoothedDelay - intDelay;
          const readPtrA = (buf.writePtr - intDelay + buf.buffer.length) % buf.buffer.length;
          const readPtrB = (readPtrA - 1 + buf.buffer.length) % buf.buffer.length;
          const sampleA = buf.buffer[readPtrA];
          const sampleB = buf.buffer[readPtrB];
          let delayed = sampleA * (1 - frac) + sampleB * frac;
          for (const mode of this.characterModes) {
            if (mode === "bitCrushed") {
              delayed = this._processLoFi(delayed, c);
            } else if (mode === "filtered") {
              delayed = this._processBandpass(delayed, c);
            }
          }
          output[c][i] = compressSingleSample(delayed, 0.75, 4, {
            enabled: true,
            type: "soft",
            outputRange: { min: -0.9, max: 0.9 }
          });
          const inputSample = input[c] && input[c][i] !== void 0 ? input[c][i] : 0;
          buf.write(inputSample + delayed * feedbackAmount);
          buf.updatePointers(intDelay);
        }
      }
      return true;
    }
  }
);
class DattorroReverb extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      ["preDelay", 0, 0, sampleRate - 1, "k-rate"],
      ["bandwidth", 0.9999, 0, 1, "k-rate"],
      ["inputDiffusion1", 0.75, 0, 1, "k-rate"],
      ["inputDiffusion2", 0.625, 0, 1, "k-rate"],
      ["decay", 0.5, 0, 1, "k-rate"],
      ["decayDiffusion1", 0.7, 0, 0.999999, "k-rate"],
      ["decayDiffusion2", 0.5, 0, 0.999999, "k-rate"],
      ["damping", 5e-3, 0, 1, "k-rate"],
      ["excursionRate", 0.5, 0, 2, "k-rate"],
      ["excursionDepth", 0.7, 0, 2, "k-rate"],
      ["wet", 0.3, 0, 1, "k-rate"],
      ["dry", 0.6, 0, 1, "k-rate"]
    ].map(
      (x) => new Object({
        name: x[0],
        defaultValue: x[1],
        minValue: x[2],
        maxValue: x[3],
        automationRate: x[4]
      })
    );
  }
  constructor(options) {
    super(options);
    this._Delays = [];
    this._pDLength = sampleRate + (128 - sampleRate % 128);
    this._preDelay = new Float32Array(this._pDLength);
    this._pDWrite = 0;
    this._lp1 = 0;
    this._lp2 = 0;
    this._lp3 = 0;
    this._excPhase = 0;
    const SHORT_DELAY_SCALE = 0.5;
    [
      4771345e-9,
      3595309e-9,
      0.012734787,
      9307483e-9,
      0.022579886,
      0.149625349,
      0.060481839,
      0.1249958,
      0.030509727,
      0.141695508,
      0.089244313,
      0.106280031
    ].map((x) => x * SHORT_DELAY_SCALE).forEach((x) => this.makeDelay(x));
    this._taps = Int16Array.from(
      [
        8937872e-9,
        0.099929438,
        0.064278754,
        0.067067639,
        0.066866033,
        6283391e-9,
        0.035818689,
        0.011861161,
        0.121870905,
        0.041262054,
        0.08981553,
        0.070931756,
        0.011256342,
        4065724e-9
      ],
      (x) => Math.round(x * sampleRate)
    );
    this.port.postMessage({ type: "initialized" });
  }
  makeDelay(length) {
    let len = Math.round(length * sampleRate);
    let nextPow2 = 2 ** Math.ceil(Math.log2(len));
    this._Delays.push([
      new Float32Array(nextPow2),
      len - 1,
      // ? or should be 0 ?
      0 | 0,
      // ? or should be len - 1 ?
      nextPow2 - 1
    ]);
  }
  writeDelay(index, data) {
    return this._Delays[index][0][this._Delays[index][1]] = data;
  }
  readDelay(index) {
    return this._Delays[index][0][this._Delays[index][2]];
  }
  readDelayAt(index, i) {
    let d = this._Delays[index];
    return d[0][d[2] + i & d[3]];
  }
  // cubic interpolation
  // O. Niemitalo: https://www.musicdsp.org/en/latest/Other/49-cubic-interpollation.html
  readDelayCAt(index, i) {
    let d = this._Delays[index], frac = i - ~~i, int = ~~i + d[2] - 1, mask = d[3];
    let x0 = d[0][int++ & mask], x1 = d[0][int++ & mask], x2 = d[0][int++ & mask], x3 = d[0][int & mask];
    let a = (3 * (x1 - x2) - x0 + x3) / 2, b = 2 * x2 + x0 - (5 * x1 + x3) / 2, c = (x2 - x0) / 2;
    return ((a * frac + b) * frac + c) * frac + x1;
  }
  // First input will be downmixed to mono if number of channels is not 2
  // Outputs Stereo.
  process(inputs, outputs, parameters) {
    const TWO_PI = 6.283185307179586;
    const TWO_PI_DETUNE = 6.284702653297906;
    const pd = ~~parameters.preDelay[0], bw = parameters.bandwidth[0], fi = parameters.inputDiffusion1[0], si = parameters.inputDiffusion2[0], dc = parameters.decay[0], ft = parameters.decayDiffusion1[0], st = parameters.decayDiffusion2[0], dp = 1 - parameters.damping[0], ex = parameters.excursionRate[0] / sampleRate, ed = parameters.excursionDepth[0] * sampleRate / 1e3, we = parameters.wet[0] * 0.6, dr = parameters.dry[0];
    if (inputs[0].length == 2) {
      for (let i2 = 127; i2 >= 0; i2--) {
        this._preDelay[this._pDWrite + i2] = (inputs[0][0][i2] + inputs[0][1][i2]) * 0.5;
        outputs[0][0][i2] = inputs[0][0][i2] * dr;
        outputs[0][1][i2] = inputs[0][1][i2] * dr;
      }
    } else if (inputs[0].length > 0) {
      this._preDelay.set(inputs[0][0], this._pDWrite);
      for (let i2 = 127; i2 >= 0; i2--)
        outputs[0][0][i2] = outputs[0][1][i2] = inputs[0][0][i2] * dr;
    } else {
      this._preDelay.set(new Float32Array(128), this._pDWrite);
    }
    let i = 0 | 0;
    while (i < 128) {
      let lo = 0, ro = 0;
      this._lp1 += bw * (this._preDelay[(this._pDLength + this._pDWrite - pd + i) % this._pDLength] - this._lp1);
      let pre = this.writeDelay(0, this._lp1 - fi * this.readDelay(0));
      pre = this.writeDelay(
        1,
        fi * (pre - this.readDelay(1)) + this.readDelay(0)
      );
      pre = this.writeDelay(
        2,
        fi * pre + this.readDelay(1) - si * this.readDelay(2)
      );
      pre = this.writeDelay(
        3,
        si * (pre - this.readDelay(3)) + this.readDelay(2)
      );
      let split = si * pre + this.readDelay(3);
      let exc = ed * (1 + Math.cos(this._excPhase * TWO_PI));
      let exc2 = ed * (1 + Math.sin(this._excPhase * TWO_PI_DETUNE));
      let temp = this.writeDelay(
        4,
        split + dc * this.readDelay(11) + ft * this.readDelayCAt(4, exc)
      );
      this.writeDelay(5, this.readDelayCAt(4, exc) - ft * temp);
      this._lp2 += dp * (this.readDelay(5) - this._lp2);
      temp = this.writeDelay(6, dc * this._lp2 - st * this.readDelay(6));
      this.writeDelay(7, this.readDelay(6) + st * temp);
      temp = this.writeDelay(
        8,
        split + dc * this.readDelay(7) + ft * this.readDelayCAt(8, exc2)
      );
      this.writeDelay(9, this.readDelayCAt(8, exc2) - ft * temp);
      this._lp3 += dp * (this.readDelay(9) - this._lp3);
      temp = this.writeDelay(10, dc * this._lp3 - st * this.readDelay(10));
      this.writeDelay(11, this.readDelay(10) + st * temp);
      lo = this.readDelayAt(9, this._taps[0]) + this.readDelayAt(9, this._taps[1]) - this.readDelayAt(10, this._taps[2]) + this.readDelayAt(11, this._taps[3]) - this.readDelayAt(5, this._taps[4]) - this.readDelayAt(6, this._taps[5]) - this.readDelayAt(7, this._taps[6]);
      ro = this.readDelayAt(5, this._taps[7]) + this.readDelayAt(5, this._taps[8]) - this.readDelayAt(6, this._taps[9]) + this.readDelayAt(7, this._taps[10]) - this.readDelayAt(9, this._taps[11]) - this.readDelayAt(10, this._taps[12]) - this.readDelayAt(11, this._taps[13]);
      outputs[0][0][i] += lo * we;
      outputs[0][1][i] += ro * we;
      this._excPhase += ex;
      if (this._excPhase >= 1) this._excPhase -= 1;
      i++;
      const delays = this._Delays;
      for (let j = 0; j < delays.length; j++) {
        const d = delays[j];
        d[1] = d[1] + 1 & d[3];
        d[2] = d[2] + 1 & d[3];
      }
    }
    this._pDWrite = (this._pDWrite + 128) % this._pDLength;
    return true;
  }
}
registerProcessor("dattorro-reverb-processor", DattorroReverb);
class Distortion {
  constructor() {
    this.limitingMode = "hard-clipping";
  }
  applyDrive(sample, driveAmount) {
    if (driveAmount <= 0) return sample;
    const driveMultiplier = 1 + driveAmount * 3;
    const drivenSample = sample * driveMultiplier;
    return drivenSample;
  }
  applyClipping(sample, clippingAmount, clipThreshold) {
    if (clippingAmount <= 0) return sample;
    let clippedSample;
    switch (this.limitingMode) {
      case "soft-clipping":
        clippedSample = clipThreshold * Math.tanh(sample / clipThreshold);
        break;
      case "hard-clipping":
        clippedSample = Math.max(
          -clipThreshold,
          Math.min(clipThreshold, sample)
        );
        break;
      case "bypass":
      default:
        clippedSample = sample;
        break;
    }
    if (clipThreshold < 0.08) {
      const makeupGain = Math.min(2, Math.pow(0.1 / clipThreshold, 0.5));
      clippedSample *= makeupGain;
    }
    const blended = sample * (1 - clippingAmount) + clippedSample * clippingAmount;
    return blended;
  }
  setLimitingMode(mode) {
    this.limitingMode = mode;
  }
}
registerProcessor(
  "distortion-processor",
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: "distortionDrive",
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          automationRate: "a-rate"
        },
        {
          name: "clippingAmount",
          defaultValue: 0,
          minValue: 0,
          maxValue: 1,
          automationRate: "a-rate"
        },
        {
          name: "clippingThreshold",
          defaultValue: 0.5,
          minValue: 0,
          maxValue: 1,
          automationRate: "k-rate"
        }
      ];
    }
    constructor() {
      super();
      this.distortion = new Distortion();
      this.setupMessageHandling();
      this.port.postMessage({ type: "initialized" });
    }
    setupMessageHandling() {
      this.port.onmessage = (event) => {
        switch (event.data.type) {
          case "setLimitingMode":
            this.distortion.setLimitingMode(event.data.mode);
            break;
          default:
            console.warn("distortion-processor: Unsupported message");
            break;
        }
      };
    }
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
      if (!input || !output) return true;
      const clipThreshold = parameters.clippingThreshold[0];
      for (let i = 0; i < output[0].length; ++i) {
        const distortionDrive = parameters.distortionDrive[Math.min(i, parameters.distortionDrive.length - 1)];
        const clippingAmount = parameters.clippingAmount[Math.min(i, parameters.clippingAmount.length - 1)];
        for (let c = 0; c < Math.min(input.length, output.length); c++) {
          let sample = input[c][i];
          sample = this.distortion.applyDrive(sample, distortionDrive);
          sample = this.distortion.applyClipping(
            sample,
            clippingAmount,
            clipThreshold
          );
          output[c][i] = Math.max(-0.999, Math.min(0.999, sample));
        }
      }
      return true;
    }
  }
);
registerProcessor(
  "envelope-follower-processor",
  class extends AudioWorkletProcessor {
    static get parameterDescriptors() {
      return [
        {
          name: "inputGain",
          // linear gain (1.0 = unity)
          defaultValue: 1,
          minValue: 0,
          maxValue: 10,
          automationRate: "k-rate"
        },
        {
          name: "outputGain",
          // linear gain (1.0 = unity)
          defaultValue: 1,
          minValue: 0,
          maxValue: 10,
          automationRate: "k-rate"
        },
        {
          name: "attack",
          // seconds
          defaultValue: 3e-3,
          minValue: 1e-3,
          maxValue: 1,
          automationRate: "k-rate"
        },
        {
          name: "release",
          // seconds
          defaultValue: 0.05,
          minValue: 1e-3,
          maxValue: 5,
          automationRate: "k-rate"
        }
      ];
    }
    constructor() {
      super();
      this.envelope = 0;
      this.gateThreshold = 5e-3;
      this.debugCounter = 0;
      this.port.postMessage({ type: "initialized" });
    }
    process(inputs, outputs, parameters) {
      const input = inputs[0];
      const output = outputs[0];
      const channel = inputs[0][0];
      if (!input || !output || !channel || input.length === 0 || output.length === 0 || channel.length === 0) {
        return true;
      }
      const inChannel = input[0];
      if (!inChannel || inChannel.length === 0) return true;
      const attack = parameters.attack[0];
      const release = parameters.release[0];
      const inputGain = parameters.inputGain[0];
      const outputGain = parameters.outputGain[0];
      const attackCoeff = Math.exp(-1 / (attack * sampleRate));
      const releaseCoeff = Math.exp(-1 / (release * sampleRate));
      for (let sample = 0; sample < output[0].length; sample++) {
        const inputLevel = Math.abs((input[0][sample] || 0) * inputGain);
        if (inputLevel > 1e-6) {
          if (inputLevel > this.envelope) {
            this.envelope = inputLevel + (this.envelope - inputLevel) * attackCoeff;
          } else {
            this.envelope = inputLevel + (this.envelope - inputLevel) * releaseCoeff;
          }
        } else {
          this.envelope *= releaseCoeff;
        }
        if (this.envelope < this.gateThreshold) this.envelope = 0;
        const finalOutput = this.envelope * outputGain;
        for (let channel2 = 0; channel2 < output.length; channel2++) {
          output[channel2][sample] = finalOutput;
        }
      }
      return true;
    }
  }
);
`;let Qa=!1;async function fh(i){if(Qa)return console.info("AudioWorklet processors already initialized, skipping"),{success:!0,loadedPath:"already-initialized",timestamp:new Date().toISOString()};if(!i.audioWorklet)return console.warn("AudioWorklet API is not fully supported on this browser."),console.warn("The audio sampler requires AudioWorklet support. Please try:"),console.warn("1. Using Chrome, Firefox, or Edge on desktop"),console.warn("2. Updating your mobile browser to the latest version"),console.warn("3. Using a different browser on mobile (Chrome or Firefox)"),{success:!1,loadedPath:"none-worklet-not-supported",timestamp:new Date().toISOString(),error:"AudioWorklet not supported on this browser"};const e=URL.createObjectURL(new Blob([ph],{type:"application/javascript"}));try{await i.audioWorklet.addModule(e)}finally{URL.revokeObjectURL(e)}return Qa=!0,console.info("Audiolib: AudioWorklet module loaded."),{success:!0,loadedPath:"blob-url",timestamp:new Date().toISOString()}}async function tc(i,e=16,t=Bt()){if(await _a(),Ee(t,"Audio context is not available"),!(await fh(t)).success)throw new Error("AudioWorklet is required but not supported on this browser. Please use a modern desktop browser (Chrome, Firefox, Edge) or update your mobile browser.");let n;if(i instanceof AudioBuffer)n=i;else if(i instanceof ArrayBuffer)try{n=await t.decodeAudioData(i)}catch(r){throw console.error("Failed to decode sample audiodata when creating SamplePlayer:",r),r}else throw new Error("createSamplePlayer requires an AudioBuffer or ArrayBuffer. No default sample is bundled.");const s=new dh(t,e,n);return await s.init(),s}async function mh(){const i=await navigator.mediaDevices.getDisplayMedia({audio:!0,video:!0}),e=new MediaStream(i.getAudioTracks());return i.getVideoTracks().forEach(t=>t.stop()),e}const Z={IDLE:"IDLE",ARMED:"ARMED",RECORDING:"RECORDING",STOPPED:"STOPPED"},Jr={mimeType:"audio/webm"},gh={mediaRecorderOptions:Jr,useThreshold:!0,startThreshold:-30,autoStop:!1,stopThreshold:-40,silenceTimeoutMs:1e3,preprocess:!1,preprocessOptions:{}};var ie,me,ne,gn,Qe,C,Rt,Se,Ct,It,W,ft,bn,I,eo,to,Es,Fs,Xa,Ja,wi,ma,no,io,er,Ss;class bh{constructor(e){p(this,I),y(this,"nodeId"),y(this,"nodeType","recorder"),p(this,ie),p(this,me,null),p(this,ne,null),p(this,gn),p(this,Qe,null),p(this,C,Z.IDLE),p(this,Rt,null),p(this,Se,null),p(this,Ct,null),p(this,It,null),p(this,W,null),p(this,ft,null),p(this,bn,null),this.nodeId=We(this.nodeType,this),u(this,ie,e),u(this,gn,wt(this.nodeId))}async init(){return console.warn("Recorder: init() method is deprecated and will be removed in a future version."),this}async start(e={}){a(this,ie).state==="suspended"&&await a(this,ie).resume(),a(this,me)&&(a(this,me).getTracks().forEach(o=>o.stop()),u(this,me,null)),b(this,I,Ss).call(this);const{input:t={type:"microphone"},...n}=e,s={...gh,...n};t.type==="display"&&e.startThreshold===void 0&&(s.startThreshold=-60),u(this,W,s);let r;if(t.type==="audio-node"?(r=await Ci(()=>b(this,I,eo).call(this,t.node)),Ee(!r.error,`Failed to create audio-node stream: ${r.error}`,r)):t.type==="display"?(r=await Ci(async()=>(a(this,ie).state==="suspended"&&await a(this,ie).resume(),mh())),Ee(!r.error,`Failed to get browser audio: ${r.error}`,r)):(r=await Ci(()=>$o(void 0,t.deviceId)),Ee(!r.error,`Failed to get audio input: ${r.error}`,r)),u(this,me,r.data),u(this,ne,new MediaRecorder(a(this,me),a(this,W)?a(this,W).mediaRecorderOptions:Jr)),!a(this,ne))throw new Error("Recorder not initialized");if(a(this,C)===Z.RECORDING)return this;try{return!a(this,W)||!a(this,W).useThreshold?b(this,I,Es).call(this):b(this,I,to).call(this),this}catch(o){throw console.error("Error starting recording:",o),o}}forceStart(){return a(this,C)!==Z.ARMED||!this.initialized?(console.warn("Recorder must be initialized and armed before calling forceStart. Current state:",a(this,C)),!1):a(this,W)?(a(this,W).autoStop=!1,b(this,I,Es).call(this),!0):(console.error("Recorder config is null, cannot force start"),!1)}cancel(){return a(this,C)!==Z.ARMED&&a(this,C)!==Z.RECORDING?!1:(b(this,I,wi).call(this),a(this,ne)&&a(this,ne).state!=="inactive"&&a(this,ne).stop(),u(this,C,Z.STOPPED),console.info(`Recorder state: ${a(this,C)} (cancelled)`),this.sendMessage("record:cancelled",{}),b(this,I,ma).call(this),!0)}async stop(){var e;if(!a(this,ne))throw new Error("Recorder not initialized");if(a(this,C)===Z.ARMED)throw this.cancel(),new Error("Recording was armed but never triggered");if(a(this,C)!==Z.RECORDING)throw new Error("Not recording");b(this,I,wi).call(this);const t=await b(this,I,no).call(this);let n=await b(this,I,io).call(this,t),s;return(e=a(this,W))!=null&&e.preprocess&&(s=await _r(a(this,ie),n,a(this,W).preprocessOptions),n=s.audiobuffer),a(this,Qe)&&await a(this,Qe).loadSample(n),u(this,C,Z.STOPPED),console.info(`Recorder state: ${a(this,C)}`),this.sendMessage("record:stop",{duration:n.duration}),b(this,I,ma).call(this),n}onMessage(e,t){return a(this,gn).onMessage(e,t)}sendMessage(e,t){a(this,gn).sendMessage(e,t),e.startsWith("record:")&&a(this,gn).sendMessage("state-change",{state:a(this,C),event:e,...t})}connect(e){return u(this,Qe,e),this}disconnect(){u(this,Qe,null)}dispose(){var e;b(this,I,wi).call(this),b(this,I,Ss).call(this),(e=a(this,me))==null||e.getTracks().forEach(t=>t.stop()),u(this,me,null),u(this,ne,null),u(this,C,Z.IDLE),u(this,W,null),Ge(this.nodeId)}get isArmed(){return a(this,C)===Z.ARMED}get isRecording(){return a(this,C)===Z.RECORDING}get state(){return a(this,C)}get initialized(){return a(this,ne)!==null&&a(this,me)!==null}get now(){return a(this,ie).currentTime}get destination(){return a(this,Qe)}}ie=new WeakMap,me=new WeakMap,ne=new WeakMap,gn=new WeakMap,Qe=new WeakMap,C=new WeakMap,Rt=new WeakMap,Se=new WeakMap,Ct=new WeakMap,It=new WeakMap,W=new WeakMap,ft=new WeakMap,bn=new WeakMap,I=new WeakSet,eo=async function(i){return u(this,ft,a(this,ie).createMediaStreamDestination()),u(this,bn,i),i.connect(a(this,ft)),a(this,ft).stream},to=function(){if(!b(this,I,er).call(this,a(this,W).startThreshold)){console.warn(`Threshold ${a(this,W).startThreshold}dB out of range (-60 to 0)`);return}u(this,C,Z.ARMED),console.info("Recorder state: ARMED"),this.sendMessage("record:armed",{threshold:a(this,W).startThreshold,destination:a(this,Qe)}),b(this,I,Fs).call(this)},Es=function(){var i;a(this,ne).start(),u(this,C,Z.RECORDING),console.info(`Recorder state: ${a(this,C)}`),this.sendMessage("record:start",{destination:a(this,Qe)}),(i=a(this,W))!=null&&i.autoStop&&b(this,I,Fs).call(this)},Fs=async function(){u(this,Rt,a(this,ie).createMediaStreamSource(a(this,me))),u(this,Se,a(this,ie).createAnalyser()),a(this,Se).fftSize=1024,a(this,Rt).connect(a(this,Se));const i=new Float32Array(a(this,Se).fftSize);a(this,ie).state==="suspended"&&await a(this,ie).resume();const e=async()=>{if(!a(this,Se))return;a(this,Se).getFloatTimeDomainData(i);const t=Math.max(...i.map(Math.abs)),n=t>1e-7?20*Math.log10(t):-100;if(a(this,C)===Z.ARMED)b(this,I,Xa).call(this,n);else if(a(this,C)===Z.RECORDING)b(this,I,Ja).call(this,n);else{b(this,I,wi).call(this);return}u(this,Ct,requestAnimationFrame(e))};u(this,Ct,requestAnimationFrame(e))},Xa=function(i){i>=a(this,W).startThreshold&&b(this,I,Es).call(this)},Ja=function(i){if(!a(this,W).autoStop)return;const e=performance.now();i<a(this,W).stopThreshold?a(this,It)===null?u(this,It,e):e-a(this,It)>=a(this,W).silenceTimeoutMs&&(this.sendMessage("record:stopping",{}),this.stop().catch(t=>console.error("Error auto-stopping:",t))):u(this,It,null)},wi=function(){a(this,Ct)!==null&&(cancelAnimationFrame(a(this,Ct)),u(this,Ct,null)),a(this,Rt)&&(a(this,Rt).disconnect(),u(this,Rt,null)),a(this,Se)&&(a(this,Se).disconnect(),u(this,Se,null)),u(this,It,null)},ma=function(){var i;(i=a(this,me))==null||i.getTracks().forEach(e=>e.stop()),u(this,me,null),u(this,ne,null),b(this,I,Ss).call(this)},no=function(){return new Promise(i=>{var e,t,n;((e=a(this,ne))==null?void 0:e.state)!=="inactive"&&((t=a(this,ne))==null||t.addEventListener("dataavailable",s=>i(s.data),{once:!0}),(n=a(this,ne))==null||n.stop())})},io=async function(i){const e=await i.arrayBuffer();return await a(this,ie).decodeAudioData(e)},er=function(i){return i>-60&&i<0},Ss=function(){a(this,ft)&&a(this,bn)&&(a(this,bn).disconnect(a(this,ft)),u(this,ft,null),u(this,bn,null))};async function nc(i){const e=i||Bt();return new bh(e)}const ic={timestretch:{label:"Timestretch",defaultValue:!1,format:i=>i?"Warp":"RePitch",apply:(i,e)=>i.setTimestretchEnabled(e)},panDrift:{label:"Pan drift",defaultValue:!0,format:i=>i?"◐":"○",apply:(i,e)=>i.setPanDriftEnabled(e)},feedbackMode:{label:"Feedback mode",defaultValue:!0,format:i=>i?"Poly":"Mono",apply:(i,e)=>i.setFeedbackMode(e?"polyphonic":"monophonic")},gainLFOSync:{label:"Amp LFO sync",defaultValue:!1,format:i=>i?"Sync":"Free",apply:(i,e)=>i.syncLFOsToNoteFreq("gain-lfo",e)},pitchLFOSync:{label:"Pitch LFO sync",defaultValue:!1,format:i=>i?"Sync":"Free",apply:(i,e)=>i.syncLFOsToNoteFreq("pitch-lfo",e)}};var yh=Object.defineProperty,vh=(i,e,t)=>e in i?yh(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t,Ae=(i,e,t)=>vh(i,typeof e!="symbol"?e+"":e,t);const so=class pe extends HTMLElement{constructor(){super(),Ae(this,"pathElement"),Ae(this,"config",{minValue:0,maxValue:100,defaultValue:0,minRotation:-170,maxRotation:170,snapIncrement:1,curve:1,disabled:!1,borderStyle:"currentState"}),Ae(this,"currentValue",0),Ae(this,"currentRotation",0),Ae(this,"rotationToValue"),Ae(this,"valueToRotation"),Ae(this,"applySnapping"),Ae(this,"dragHandlers"),Ae(this,"lastClickTime",0),Ae(this,"DOUBLE_CLICK_THRESHOLD",300)}static mapRange(e,t,n,s,r){return t===e?n:(r-e)*(s-n)/(t-e)+n}static clamp(e,t,n){return Math.min(Math.max(e,t),n)}static get observedAttributes(){return["min-value","max-value","default-value","min-rotation","max-rotation","snap-increment","allowed-values","value","disabled","width","height","border-style","curve","color"]}connectedCallback(){this.injectGlobalStyles(),this.createUtilityFunctions(),this.render(),this.updateColorFromAttribute(),this.setValue(this.config.defaultValue??this.config.minValue),this.createDraggable()}disconnectedCallback(){this.cleanup()}attributeChangedCallback(e,t,n){if(t!==n){if(e==="max-value"||e==="min-value"){const s=this.config.minValue,r=this.config.maxValue;this.updateConfigFromAttributes(),this.updateBorder();let o;e==="max-value"?o=pe.mapRange(s,parseFloat(t),this.config.minValue,this.config.maxValue,this.currentValue):o=pe.mapRange(parseFloat(t),r,this.config.minValue,this.config.maxValue,this.currentValue),this.createUtilityFunctions(),this.setValue(o);return}if(this.updateConfigFromAttributes(),this.updateBorder(),e==="width"||e==="height"||e==="border-style")return;if(e==="color"){this.updateColorFromAttribute();return}if(e==="curve"){this.createUtilityFunctions(),this.setValue(this.currentValue);return}}}injectGlobalStyles(){if(pe.stylesInjected)return;const e=document.createElement("style");e.id="knob-element-styles",e.textContent=`
      knob-element {
        display: block;
        box-sizing: border-box;
        --knob-size: 120px;
        --knob-stroke: rgb(234, 234, 234);

        width: var(--knob-size, 120px); 
        height: var(--knob-size, 120px);

        touch-action: none; /* Prevents browser touch gestures */
        user-select: none; /* Prevents text selection during drag */
        border-radius: 50%;
        cursor: grab;
      }
      
      knob-element[disabled] {
        opacity: 0.5;
        pointer-events: none; 
      }
    
      knob-element:active {
        cursor: grabbing;
      }
    `,document.head.appendChild(e),pe.stylesInjected=!0}updateConfigFromAttributes(){const e=(l,h)=>{const c=this.getAttribute(l);return c!==null?parseFloat(c):h},t=(l,h)=>this.getAttribute(l)||h,n=l=>{const h=this.getAttribute(l);if(h)try{return JSON.parse(h)}catch{console.warn(`KnobElement: Invalid ${l} JSON:`,h);return}},s=n("allowed-values");let r=e("min-value",0),o=e("max-value",100);if(s&&s.length>0){const l=[...s].sort((f,d)=>f-d),h=l[0],c=l[l.length-1];this.hasAttribute("min-value")&&r!==h&&console.debug(`KnobElement: min-value (${r}) doesn't match first allowedValue (${h}). Using ${h}.`),this.hasAttribute("max-value")&&o!==c&&console.debug(`KnobElement: max-value (${o}) doesn't match last allowedValue (${c}). Using ${c}.`),this.hasAttribute("snap-thresholds")&&console.debug("KnobElement: allowedValues overrides snap-increment and snap-thresholds."),r=h,o=c}this.config={minValue:r,maxValue:o,defaultValue:e("default-value",0),minRotation:e("min-rotation",-150),maxRotation:e("max-rotation",150),snapIncrement:e("snap-increment",1),curve:e("curve",1),borderStyle:t("border-style","currentState"),allowedValues:s?[...s].sort((l,h)=>l-h):void 0,snapThresholds:n("snap-thresholds"),disabled:this.hasAttribute("disabled")},this.updateDimensions()}updateDimensions(){const e=this.getAttribute("width"),t=this.getAttribute("height");if(e||t){const n=e||t||"120";this.style.setProperty("--knob-size",`${n}px`)}}updateColorFromAttribute(){const e=this.getAttribute("color");e&&this.style.setProperty("--knob-stroke",e)}render(){this.innerHTML=`
      <svg class="ac-knob" width="100%" height="100%" viewBox="0 0 100 100">
          <path class="knob-path" 
                fill="none" 
                stroke="var(--knob-stroke)" 
                stroke-width="5" 
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M50,50 L50,2"
                />
      </svg>
  `,this.pathElement=this.querySelector(".knob-path")}cleanup(){this.dragHandlers&&(this.removeEventListener("mousedown",this.dragHandlers.start),this.removeEventListener("touchstart",this.dragHandlers.start),document.removeEventListener("mousemove",this.dragHandlers.move),document.removeEventListener("mouseup",this.dragHandlers.end),document.removeEventListener("touchmove",this.dragHandlers.move),document.removeEventListener("touchend",this.dragHandlers.end))}createUtilityFunctions(){const e=this.config.curve||1;this.rotationToValue=t=>{const n=pe.mapRange(this.config.minRotation,this.config.maxRotation,0,1,t),s=Math.pow(n,e);return pe.mapRange(0,1,this.config.minValue,this.config.maxValue,s)},this.valueToRotation=t=>{const n=pe.mapRange(this.config.minValue,this.config.maxValue,0,1,t),s=Math.pow(n,1/e);return pe.mapRange(0,1,this.config.minRotation,this.config.maxRotation,s)},this.applySnapping=t=>{if(this.config.allowedValues&&this.config.allowedValues.length>0)return this.config.allowedValues.reduce((s,r)=>Math.abs(r-t)<Math.abs(s-t)?r:s);if(this.config.snapIncrement<=0)return t;let n=this.config.snapIncrement;if(this.config.snapThresholds){for(const{maxValue:s,increment:r}of this.config.snapThresholds)if(t<s){n=r;break}}return Math.round(t/n)*n}}createDraggable(){const e="pointerLockElement"in document&&"requestPointerLock"in HTMLElement.prototype;let t=!1,n=0,s=0,r=0,o=!1;const l=d=>{n=d.clientY,o=document.pointerLockElement===this,!(!e||document.pointerLockElement)&&this.requestPointerLock().then(()=>{o=document.pointerLockElement===this},()=>{o=!1})},h=d=>{if(this.config.disabled)return;const m=Date.now(),v=m-this.lastClickTime;if(v<this.DOUBLE_CLICK_THRESHOLD&&v>0){this.resetToDefault();return}this.lastClickTime=m,t=!0,s=this.currentRotation,r=0,"touches"in d?(n=d.touches[0].clientY,o=!1):l(d)},c=d=>{if(!t)return;let m;const v=2;if(o&&document.pointerLockElement)r+=d.movementY,m=-r*v;else{const O="touches"in d?d.touches[0].clientY:d.clientY;m=(n-O)*v}const E=s+m,S=pe.clamp(E,this.config.minRotation,this.config.maxRotation),A=this.rotationToValue(S),P=this.applySnapping(A);this.currentValue=P,P!==A?this.currentRotation=this.valueToRotation(P):this.currentRotation=S,this.updateBorder(),this.dispatchChangeEvent("user"),d.preventDefault()},f=()=>{t=!1,o&&document.pointerLockElement&&document.exitPointerLock(),o=!1};this.dragHandlers={start:h,move:c,end:f},this.addEventListener("mousedown",h),this.addEventListener("touchstart",h,{passive:!1}),document.addEventListener("mousemove",c),document.addEventListener("mouseup",f),document.addEventListener("touchmove",c,{passive:!1}),document.addEventListener("touchend",f)}updateBorder(){if(this.pathElement)if((this.getAttribute("border-style")||"currentState")==="currentState"){const e=(this.config.minRotation-90)*Math.PI/180,t=(this.currentRotation-90)*Math.PI/180,n=48*Math.cos(e)+50,s=48*Math.sin(e)+50,r=48*Math.cos(t)+50,o=48*Math.sin(t)+50,l=this.currentRotation-this.config.minRotation,h=Math.abs(l)>180?1:0,c=`M50,50 L${n},${s} A48,48,0,${h},1,${r},${o} Z`;this.pathElement.setAttribute("d",c)}else this.pathElement.setAttribute("d","M50,2 A48,48,0,1,1,49.9,2 Z")}dispatchChangeEvent(e="programmatic"){const t=pe.mapRange(this.config.minValue,this.config.maxValue,0,100,this.currentValue),n=new CustomEvent("knob-change",{detail:{value:this.currentValue,rotation:this.currentRotation,percentage:t,source:e},bubbles:!0});this.dispatchEvent(n)}setValue(e){!this.valueToRotation||!this.pathElement||(this.currentValue=pe.clamp(e,this.config.minValue,this.config.maxValue),this.currentRotation=this.valueToRotation(this.currentValue),this.updateBorder(),this.dispatchChangeEvent())}setValueNormalized(e){const{minRotation:t,maxRotation:n}=this.config,s=Math.max(0,Math.min(1,e)),r=t+s*(n-t),o=this.rotationToValue(r);this.setValue(o)}getValueNormalized(){return(this.currentRotation-this.config.minRotation)/(this.config.maxRotation-this.config.minRotation)}resetToDefault(){this.setValue(this.config.defaultValue)}getValue(){return this.currentValue}setCurve(e){this.config.curve=e,this.createUtilityFunctions(),this.setValue(this.currentValue)}getCurve(){return this.config.curve||1}setDisabled(e){e?this.setAttribute("disabled",""):this.removeAttribute("disabled")}isDisabled(){return this.hasAttribute("disabled")}getPercentage(){return pe.mapRange(this.config.minValue,this.config.maxValue,0,100,this.currentValue)}get value(){return this.getValue()}set value(e){this.setValue(e)}get disabled(){return this.isDisabled()}set disabled(e){this.setDisabled(e)}};Ae(so,"stylesInjected",!1);let wh=so;const Mh={KNOB:"knob-element"};function Eh(i,e){typeof customElements>"u"||customElements.get(i)||customElements.define(i,e)}function sc(){Eh(Mh.KNOB,wh)}const ga=Symbol("store-raw"),Cn=Symbol("store-node"),Xe=Symbol("store-has"),ao=Symbol("store-self");function ro(i){let e=i[Lt];if(!e&&(Object.defineProperty(i,Lt,{value:e=new Proxy(i,Ph)}),!Array.isArray(i))){const t=Object.keys(i),n=Object.getOwnPropertyDescriptors(i);for(let s=0,r=t.length;s<r;s++){const o=t[s];n[o].get&&Object.defineProperty(i,o,{enumerable:n[o].enumerable,get:n[o].get.bind(e)})}}return e}function As(i){let e;return i!=null&&typeof i=="object"&&(i[Lt]||!(e=Object.getPrototypeOf(i))||e===Object.prototype||Array.isArray(i))}function Pi(i,e=new Set){let t,n,s,r;if(t=i!=null&&i[ga])return t;if(!As(i)||e.has(i))return i;if(Array.isArray(i)){Object.isFrozen(i)?i=i.slice(0):e.add(i);for(let o=0,l=i.length;o<l;o++)s=i[o],(n=Pi(s,e))!==s&&(i[o]=n)}else{Object.isFrozen(i)?i=Object.assign({},i):e.add(i);const o=Object.keys(i),l=Object.getOwnPropertyDescriptors(i);for(let h=0,c=o.length;h<c;h++)r=o[h],!l[r].get&&(s=i[r],(n=Pi(s,e))!==s&&(i[r]=n))}return i}function Ps(i,e){let t=i[e];return t||Object.defineProperty(i,e,{value:t=Object.create(null)}),t}function _i(i,e,t){if(i[e])return i[e];const[n,s]=Ma(t,{equals:!1,internal:!0});return n.$=s,i[e]=n}function Sh(i,e){const t=Reflect.getOwnPropertyDescriptor(i,e);return!t||t.get||!t.configurable||e===Lt||e===Cn||(delete t.value,delete t.writable,t.get=()=>i[Lt][e]),t}function oo(i){$s()&&_i(Ps(i,Cn),ao)()}function Ah(i){return oo(i),Reflect.ownKeys(i)}const Ph={get(i,e,t){if(e===ga)return i;if(e===Lt)return t;if(e===Us)return oo(i),t;const n=Ps(i,Cn),s=n[e];let r=s?s():i[e];if(e===Cn||e===Xe||e==="__proto__")return r;if(!s){const o=Object.getOwnPropertyDescriptor(i,e);$s()&&(typeof r!="function"||i.hasOwnProperty(e))&&!(o&&o.get)&&(r=_i(n,e,r)())}return As(r)?ro(r):r},has(i,e){return e===ga||e===Lt||e===Us||e===Cn||e===Xe||e==="__proto__"?!0:($s()&&_i(Ps(i,Xe),e)(),e in i)},set(){return!0},deleteProperty(){return!0},ownKeys:Ah,getOwnPropertyDescriptor:Sh};function _s(i,e,t,n=!1){if(!n&&i[e]===t)return;const s=i[e],r=i.length;t===void 0?(delete i[e],i[Xe]&&i[Xe][e]&&s!==void 0&&i[Xe][e].$()):(i[e]=t,i[Xe]&&i[Xe][e]&&s===void 0&&i[Xe][e].$());let o=Ps(i,Cn),l;if((l=_i(o,e,s))&&l.$(()=>t),Array.isArray(i)&&i.length!==r){for(let h=i.length;h<r;h++)(l=o[h])&&l.$();(l=_i(o,"length",r))&&l.$(i.length)}(l=o[ao])&&l.$()}function lo(i,e){const t=Object.keys(e);for(let n=0;n<t.length;n+=1){const s=t[n];_s(i,s,e[s])}}function _h(i,e){if(typeof e=="function"&&(e=e(i)),e=Pi(e),Array.isArray(e)){if(i===e)return;let t=0,n=e.length;for(;t<n;t++){const s=e[t];i[t]!==s&&_s(i,t,s)}_s(i,"length",n)}else lo(i,e)}function ui(i,e,t=[]){let n,s=i;if(e.length>1){n=e.shift();const o=typeof n,l=Array.isArray(i);if(Array.isArray(n)){for(let h=0;h<n.length;h++)ui(i,[n[h]].concat(e),t);return}else if(l&&o==="function"){for(let h=0;h<i.length;h++)n(i[h],h)&&ui(i,[h].concat(e),t);return}else if(l&&o==="object"){const{from:h=0,to:c=i.length-1,by:f=1}=n;for(let d=h;d<=c;d+=f)ui(i,[d].concat(e),t);return}else if(e.length>1){ui(i[n],e,[n].concat(t));return}s=i[n],t=[n].concat(t)}let r=e[0];typeof r=="function"&&(r=r(s,t),r===s)||n===void 0&&r==null||(r=Pi(r),n===void 0||As(s)&&As(r)&&!Array.isArray(r)?lo(s,r):_s(i,n,r))}function ac(...[i,e]){const t=Pi(i||{}),n=Array.isArray(t),s=ro(t);function r(...o){go(()=>{n&&o.length===1?_h(t,o[0]):ui(t,o)})}return[s,r]}class Ce{constructor(e=!1){this.eventMap={},this.eventsSuspended=e==!0}addListener(e,t,n={}){if(typeof e=="string"&&e.length<1||e instanceof String&&e.length<1||typeof e!="string"&&!(e instanceof String)&&e!==Ce.ANY_EVENT)throw new TypeError("The 'event' parameter must be a string or EventEmitter.ANY_EVENT.");if(typeof t!="function")throw new TypeError("The callback must be a function.");const s=new tr(e,this,t,n);return this.eventMap[e]||(this.eventMap[e]=[]),n.prepend?this.eventMap[e].unshift(s):this.eventMap[e].push(s),s}addOneTimeListener(e,t,n={}){n.remaining=1,this.addListener(e,t,n)}static get ANY_EVENT(){return Symbol.for("Any event")}hasListener(e,t){return e===void 0?this.eventMap[Ce.ANY_EVENT]&&this.eventMap[Ce.ANY_EVENT].length>0?!0:Object.entries(this.eventMap).some(([,n])=>n.length>0):this.eventMap[e]&&this.eventMap[e].length>0?t instanceof tr?this.eventMap[e].filter(s=>s===t).length>0:typeof t=="function"?this.eventMap[e].filter(s=>s.callback===t).length>0:t==null:!1}get eventNames(){return Object.keys(this.eventMap)}getListeners(e){return this.eventMap[e]||[]}suspendEvent(e){this.getListeners(e).forEach(t=>{t.suspended=!0})}unsuspendEvent(e){this.getListeners(e).forEach(t=>{t.suspended=!1})}getListenerCount(e){return this.getListeners(e).length}emit(e,...t){if(typeof e!="string"&&!(e instanceof String))throw new TypeError("The 'event' parameter must be a string.");if(this.eventsSuspended)return;let n=[],s=this.eventMap[Ce.ANY_EVENT]||[];return this.eventMap[e]&&(s=s.concat(this.eventMap[e])),s.forEach(r=>{if(r.suspended)return;let o=[...t];Array.isArray(r.arguments)&&(o=o.concat(r.arguments)),r.remaining>0&&(n.push(r.callback.apply(r.context,o)),r.count++),--r.remaining<1&&r.remove()}),n}removeListener(e,t,n={}){if(e===void 0){this.eventMap={};return}else if(!this.eventMap[e])return;let s=this.eventMap[e].filter(r=>t&&r.callback!==t||n.remaining&&n.remaining!==r.remaining||n.context&&n.context!==r.context);s.length?this.eventMap[e]=s:delete this.eventMap[e]}async waitFor(e,t={}){return t.duration=parseInt(t.duration),(isNaN(t.duration)||t.duration<=0)&&(t.duration=1/0),new Promise((n,s)=>{let r,o=this.addListener(e,()=>{clearTimeout(r),n()},{remaining:1});t.duration!==1/0&&(r=setTimeout(()=>{o.remove(),s("The duration expired before the event was emitted.")},t.duration))})}get eventCount(){return Object.keys(this.eventMap).length}}class tr{constructor(e,t,n,s={}){if(typeof e!="string"&&!(e instanceof String)&&e!==Ce.ANY_EVENT)throw new TypeError("The 'event' parameter must be a string or EventEmitter.ANY_EVENT.");if(!t)throw new ReferenceError("The 'target' parameter is mandatory.");if(typeof n!="function")throw new TypeError("The 'callback' must be a function.");s.arguments!==void 0&&!Array.isArray(s.arguments)&&(s.arguments=[s.arguments]),s=Object.assign({context:t,remaining:1/0,arguments:void 0,duration:1/0},s),s.duration!==1/0&&setTimeout(()=>this.remove(),s.duration),this.arguments=s.arguments,this.callback=n,this.context=s.context,this.count=0,this.event=e,this.remaining=parseInt(s.remaining)>=1?parseInt(s.remaining):1/0,this.suspended=!1,this.target=t}remove(){this.target.removeListener(this.event,this.callback,{context:this.context,remaining:this.remaining})}}/**
 * The `Enumerations` class contains enumerations and arrays of elements used throughout the
 * library. All its properties are static and should be referenced using the class name. For
 * example: `Enumerations.CHANNEL_MESSAGES`.
 *
 * @license Apache-2.0
 * @since 3.0.0
 */class g{static get MIDI_CHANNEL_MESSAGES(){return this.validation&&console.warn("The MIDI_CHANNEL_MESSAGES enum has been deprecated. Use the Enumerations.CHANNEL_MESSAGES enum instead."),g.CHANNEL_MESSAGES}static get CHANNEL_MESSAGES(){return{noteoff:8,noteon:9,keyaftertouch:10,controlchange:11,programchange:12,channelaftertouch:13,pitchbend:14}}static get CHANNEL_NUMBERS(){return[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]}static get MIDI_CHANNEL_NUMBERS(){return this.validation&&console.warn("The MIDI_CHANNEL_NUMBERS array has been deprecated. Use the Enumerations.CHANNEL_NUMBERS array instead."),[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16]}static get CHANNEL_MODE_MESSAGES(){return{allsoundoff:120,resetallcontrollers:121,localcontrol:122,allnotesoff:123,omnimodeoff:124,omnimodeon:125,monomodeon:126,polymodeon:127}}static get MIDI_CHANNEL_MODE_MESSAGES(){return this.validation&&console.warn("The MIDI_CHANNEL_MODE_MESSAGES enum has been deprecated. Use the Enumerations.CHANNEL_MODE_MESSAGES enum instead."),g.CHANNEL_MODE_MESSAGES}static get MIDI_CONTROL_CHANGE_MESSAGES(){return this.validation&&console.warn("The MIDI_CONTROL_CHANGE_MESSAGES enum has been deprecated. Use the Enumerations.CONTROL_CHANGE_MESSAGES array instead."),{bankselectcoarse:0,modulationwheelcoarse:1,breathcontrollercoarse:2,controller3:3,footcontrollercoarse:4,portamentotimecoarse:5,dataentrycoarse:6,volumecoarse:7,balancecoarse:8,controller9:9,pancoarse:10,expressioncoarse:11,effectcontrol1coarse:12,effectcontrol2coarse:13,controller14:14,controller15:15,generalpurposeslider1:16,generalpurposeslider2:17,generalpurposeslider3:18,generalpurposeslider4:19,controller20:20,controller21:21,controller22:22,controller23:23,controller24:24,controller25:25,controller26:26,controller27:27,controller28:28,controller29:29,controller30:30,controller31:31,bankselectfine:32,modulationwheelfine:33,breathcontrollerfine:34,controller35:35,footcontrollerfine:36,portamentotimefine:37,dataentryfine:38,volumefine:39,balancefine:40,controller41:41,panfine:42,expressionfine:43,effectcontrol1fine:44,effectcontrol2fine:45,controller46:46,controller47:47,controller48:48,controller49:49,controller50:50,controller51:51,controller52:52,controller53:53,controller54:54,controller55:55,controller56:56,controller57:57,controller58:58,controller59:59,controller60:60,controller61:61,controller62:62,controller63:63,holdpedal:64,portamento:65,sustenutopedal:66,softpedal:67,legatopedal:68,hold2pedal:69,soundvariation:70,resonance:71,soundreleasetime:72,soundattacktime:73,brightness:74,soundcontrol6:75,soundcontrol7:76,soundcontrol8:77,soundcontrol9:78,soundcontrol10:79,generalpurposebutton1:80,generalpurposebutton2:81,generalpurposebutton3:82,generalpurposebutton4:83,controller84:84,controller85:85,controller86:86,controller87:87,controller88:88,controller89:89,controller90:90,reverblevel:91,tremololevel:92,choruslevel:93,celestelevel:94,phaserlevel:95,databuttonincrement:96,databuttondecrement:97,nonregisteredparametercoarse:98,nonregisteredparameterfine:99,registeredparametercoarse:100,registeredparameterfine:101,controller102:102,controller103:103,controller104:104,controller105:105,controller106:106,controller107:107,controller108:108,controller109:109,controller110:110,controller111:111,controller112:112,controller113:113,controller114:114,controller115:115,controller116:116,controller117:117,controller118:118,controller119:119,allsoundoff:120,resetallcontrollers:121,localcontrol:122,allnotesoff:123,omnimodeoff:124,omnimodeon:125,monomodeon:126,polymodeon:127}}static get CONTROL_CHANGE_MESSAGES(){return[{number:0,name:"bankselectcoarse",description:"Bank Select (Coarse)",position:"msb"},{number:1,name:"modulationwheelcoarse",description:"Modulation Wheel (Coarse)",position:"msb"},{number:2,name:"breathcontrollercoarse",description:"Breath Controller (Coarse)",position:"msb"},{number:3,name:"controller3",description:"Undefined",position:"msb"},{number:4,name:"footcontrollercoarse",description:"Foot Controller (Coarse)",position:"msb"},{number:5,name:"portamentotimecoarse",description:"Portamento Time (Coarse)",position:"msb"},{number:6,name:"dataentrycoarse",description:"Data Entry (Coarse)",position:"msb"},{number:7,name:"volumecoarse",description:"Channel Volume (Coarse)",position:"msb"},{number:8,name:"balancecoarse",description:"Balance (Coarse)",position:"msb"},{number:9,name:"controller9",description:"Controller 9 (Coarse)",position:"msb"},{number:10,name:"pancoarse",description:"Pan (Coarse)",position:"msb"},{number:11,name:"expressioncoarse",description:"Expression Controller (Coarse)",position:"msb"},{number:12,name:"effectcontrol1coarse",description:"Effect Control 1 (Coarse)",position:"msb"},{number:13,name:"effectcontrol2coarse",description:"Effect Control 2 (Coarse)",position:"msb"},{number:14,name:"controller14",description:"Undefined",position:"msb"},{number:15,name:"controller15",description:"Undefined",position:"msb"},{number:16,name:"generalpurposecontroller1",description:"General Purpose Controller 1 (Coarse)",position:"msb"},{number:17,name:"generalpurposecontroller2",description:"General Purpose Controller 2 (Coarse)",position:"msb"},{number:18,name:"generalpurposecontroller3",description:"General Purpose Controller 3 (Coarse)",position:"msb"},{number:19,name:"generalpurposecontroller4",description:"General Purpose Controller 4 (Coarse)",position:"msb"},{number:20,name:"controller20",description:"Undefined",position:"msb"},{number:21,name:"controller21",description:"Undefined",position:"msb"},{number:22,name:"controller22",description:"Undefined",position:"msb"},{number:23,name:"controller23",description:"Undefined",position:"msb"},{number:24,name:"controller24",description:"Undefined",position:"msb"},{number:25,name:"controller25",description:"Undefined",position:"msb"},{number:26,name:"controller26",description:"Undefined",position:"msb"},{number:27,name:"controller27",description:"Undefined",position:"msb"},{number:28,name:"controller28",description:"Undefined",position:"msb"},{number:29,name:"controller29",description:"Undefined",position:"msb"},{number:30,name:"controller30",description:"Undefined",position:"msb"},{number:31,name:"controller31",description:"Undefined",position:"msb"},{number:32,name:"bankselectfine",description:"Bank Select (Fine)",position:"lsb"},{number:33,name:"modulationwheelfine",description:"Modulation Wheel (Fine)",position:"lsb"},{number:34,name:"breathcontrollerfine",description:"Breath Controller (Fine)",position:"lsb"},{number:35,name:"controller35",description:"Undefined",position:"lsb"},{number:36,name:"footcontrollerfine",description:"Foot Controller (Fine)",position:"lsb"},{number:37,name:"portamentotimefine",description:"Portamento Time (Fine)",position:"lsb"},{number:38,name:"dataentryfine",description:"Data Entry (Fine)",position:"lsb"},{number:39,name:"channelvolumefine",description:"Channel Volume (Fine)",position:"lsb"},{number:40,name:"balancefine",description:"Balance (Fine)",position:"lsb"},{number:41,name:"controller41",description:"Undefined",position:"lsb"},{number:42,name:"panfine",description:"Pan (Fine)",position:"lsb"},{number:43,name:"expressionfine",description:"Expression Controller (Fine)",position:"lsb"},{number:44,name:"effectcontrol1fine",description:"Effect control 1 (Fine)",position:"lsb"},{number:45,name:"effectcontrol2fine",description:"Effect control 2 (Fine)",position:"lsb"},{number:46,name:"controller46",description:"Undefined",position:"lsb"},{number:47,name:"controller47",description:"Undefined",position:"lsb"},{number:48,name:"controller48",description:"General Purpose Controller 1 (Fine)",position:"lsb"},{number:49,name:"controller49",description:"General Purpose Controller 2 (Fine)",position:"lsb"},{number:50,name:"controller50",description:"General Purpose Controller 3 (Fine)",position:"lsb"},{number:51,name:"controller51",description:"General Purpose Controller 4 (Fine)",position:"lsb"},{number:52,name:"controller52",description:"Undefined",position:"lsb"},{number:53,name:"controller53",description:"Undefined",position:"lsb"},{number:54,name:"controller54",description:"Undefined",position:"lsb"},{number:55,name:"controller55",description:"Undefined",position:"lsb"},{number:56,name:"controller56",description:"Undefined",position:"lsb"},{number:57,name:"controller57",description:"Undefined",position:"lsb"},{number:58,name:"controller58",description:"Undefined",position:"lsb"},{number:59,name:"controller59",description:"Undefined",position:"lsb"},{number:60,name:"controller60",description:"Undefined",position:"lsb"},{number:61,name:"controller61",description:"Undefined",position:"lsb"},{number:62,name:"controller62",description:"Undefined",position:"lsb"},{number:63,name:"controller63",description:"Undefined",position:"lsb"},{number:64,name:"damperpedal",description:"Damper Pedal On/Off"},{number:65,name:"portamento",description:"Portamento On/Off"},{number:66,name:"sostenuto",description:"Sostenuto On/Off"},{number:67,name:"softpedal",description:"Soft Pedal On/Off"},{number:68,name:"legatopedal",description:"Legato Pedal On/Off"},{number:69,name:"hold2",description:"Hold 2 On/Off"},{number:70,name:"soundvariation",description:"Sound Variation",position:"lsb"},{number:71,name:"resonance",description:"Resonance",position:"lsb"},{number:72,name:"releasetime",description:"Release Time",position:"lsb"},{number:73,name:"attacktime",description:"Attack Time",position:"lsb"},{number:74,name:"brightness",description:"Brightness",position:"lsb"},{number:75,name:"decaytime",description:"Decay Time",position:"lsb"},{number:76,name:"vibratorate",description:"Vibrato Rate",position:"lsb"},{number:77,name:"vibratodepth",description:"Vibrato Depth",position:"lsb"},{number:78,name:"vibratodelay",description:"Vibrato Delay",position:"lsb"},{number:79,name:"controller79",description:"Undefined",position:"lsb"},{number:80,name:"generalpurposecontroller5",description:"General Purpose Controller 5",position:"lsb"},{number:81,name:"generalpurposecontroller6",description:"General Purpose Controller 6",position:"lsb"},{number:82,name:"generalpurposecontroller7",description:"General Purpose Controller 7",position:"lsb"},{number:83,name:"generalpurposecontroller8",description:"General Purpose Controller 8",position:"lsb"},{number:84,name:"portamentocontrol",description:"Portamento Control",position:"lsb"},{number:85,name:"controller85",description:"Undefined"},{number:86,name:"controller86",description:"Undefined"},{number:87,name:"controller87",description:"Undefined"},{number:88,name:"highresolutionvelocityprefix",description:"High Resolution Velocity Prefix",position:"lsb"},{number:89,name:"controller89",description:"Undefined"},{number:90,name:"controller90",description:"Undefined"},{number:91,name:"effect1depth",description:"Effects 1 Depth (Reverb Send Level)"},{number:92,name:"effect2depth",description:"Effects 2 Depth"},{number:93,name:"effect3depth",description:"Effects 3 Depth (Chorus Send Level)"},{number:94,name:"effect4depth",description:"Effects 4 Depth"},{number:95,name:"effect5depth",description:"Effects 5 Depth"},{number:96,name:"dataincrement",description:"Data Increment"},{number:97,name:"datadecrement",description:"Data Decrement"},{number:98,name:"nonregisteredparameterfine",description:"Non-Registered Parameter Number (Fine)",position:"lsb"},{number:99,name:"nonregisteredparametercoarse",description:"Non-Registered Parameter Number (Coarse)",position:"msb"},{number:100,name:"registeredparameterfine",description:"Registered Parameter Number (Fine)",position:"lsb"},{number:101,name:"registeredparametercoarse",description:"Registered Parameter Number (Coarse)",position:"msb"},{number:102,name:"controller102",description:"Undefined"},{number:103,name:"controller103",description:"Undefined"},{number:104,name:"controller104",description:"Undefined"},{number:105,name:"controller105",description:"Undefined"},{number:106,name:"controller106",description:"Undefined"},{number:107,name:"controller107",description:"Undefined"},{number:108,name:"controller108",description:"Undefined"},{number:109,name:"controller109",description:"Undefined"},{number:110,name:"controller110",description:"Undefined"},{number:111,name:"controller111",description:"Undefined"},{number:112,name:"controller112",description:"Undefined"},{number:113,name:"controller113",description:"Undefined"},{number:114,name:"controller114",description:"Undefined"},{number:115,name:"controller115",description:"Undefined"},{number:116,name:"controller116",description:"Undefined"},{number:117,name:"controller117",description:"Undefined"},{number:118,name:"controller118",description:"Undefined"},{number:119,name:"controller119",description:"Undefined"},{number:120,name:"allsoundoff",description:"All Sound Off"},{number:121,name:"resetallcontrollers",description:"Reset All Controllers"},{number:122,name:"localcontrol",description:"Local Control On/Off"},{number:123,name:"allnotesoff",description:"All Notes Off"},{number:124,name:"omnimodeoff",description:"Omni Mode Off"},{number:125,name:"omnimodeon",description:"Omni Mode On"},{number:126,name:"monomodeon",description:"Mono Mode On"},{number:127,name:"polymodeon",description:"Poly Mode On"}]}static get REGISTERED_PARAMETERS(){return{pitchbendrange:[0,0],channelfinetuning:[0,1],channelcoarsetuning:[0,2],tuningprogram:[0,3],tuningbank:[0,4],modulationrange:[0,5],azimuthangle:[61,0],elevationangle:[61,1],gain:[61,2],distanceratio:[61,3],maximumdistance:[61,4],maximumdistancegain:[61,5],referencedistanceratio:[61,6],panspreadangle:[61,7],rollangle:[61,8]}}static get MIDI_REGISTERED_PARAMETERS(){return this.validation&&console.warn("The MIDI_REGISTERED_PARAMETERS enum has been deprecated. Use the Enumerations.REGISTERED_PARAMETERS enum instead."),g.MIDI_REGISTERED_PARAMETERS}static get SYSTEM_MESSAGES(){return{sysex:240,timecode:241,songposition:242,songselect:243,tunerequest:246,tuningrequest:246,sysexend:247,clock:248,start:250,continue:251,stop:252,activesensing:254,reset:255,midimessage:0,unknownsystemmessage:-1}}static get MIDI_SYSTEM_MESSAGES(){return this.validation&&console.warn("The MIDI_SYSTEM_MESSAGES enum has been deprecated. Use the Enumerations.SYSTEM_MESSAGES enum instead."),g.SYSTEM_MESSAGES}static get CHANNEL_EVENTS(){return["noteoff","controlchange","noteon","keyaftertouch","programchange","channelaftertouch","pitchbend","allnotesoff","allsoundoff","localcontrol","monomode","omnimode","resetallcontrollers","nrpn","nrpn-dataentrycoarse","nrpn-dataentryfine","nrpn-dataincrement","nrpn-datadecrement","rpn","rpn-dataentrycoarse","rpn-dataentryfine","rpn-dataincrement","rpn-datadecrement","nrpn-databuttonincrement","nrpn-databuttondecrement","rpn-databuttonincrement","rpn-databuttondecrement"]}}/**
 * The `Note` class represents a single musical note such as `"D3"`, `"G#4"`, `"F-1"`, `"Gb7"`, etc.
 *
 * `Note` objects can be played back on a single channel by calling
 * [`OutputChannel.playNote()`]{@link OutputChannel#playNote} or, on multiple channels of the same
 * output, by calling [`Output.playNote()`]{@link Output#playNote}.
 *
 * The note has [`attack`](#attack) and [`release`](#release) velocities set at `0.5` by default.
 * These can be changed by passing in the appropriate option. It is also possible to set a
 * system-wide default for attack and release velocities by using the
 * [`WebMidi.defaults`](WebMidi#defaults) property.
 *
 * If you prefer to work with raw MIDI values (`0` to `127`), you can use [`rawAttack`](#rawAttack) and
 * [`rawRelease`](#rawRelease) to both get and set the values.
 *
 * The note may have a [`duration`](#duration). If it does, playback will be automatically stopped
 * when the duration has elapsed by sending a `"noteoff"` event. By default, the duration is set to
 * `Infinity`. In this case, it will never stop playing unless explicitly stopped by calling a
 * method such as [`OutputChannel.stopNote()`]{@link OutputChannel#stopNote},
 * [`Output.stopNote()`]{@link Output#stopNote} or similar.
 *
 * @license Apache-2.0
 * @since 3.0.0
 */class Nn{constructor(e,t={}){this.duration=M.defaults.note.duration,this.attack=M.defaults.note.attack,this.release=M.defaults.note.release,t.duration!=null&&(this.duration=t.duration),t.attack!=null&&(this.attack=t.attack),t.rawAttack!=null&&(this.attack=w.from7bitToFloat(t.rawAttack)),t.release!=null&&(this.release=t.release),t.rawRelease!=null&&(this.release=w.from7bitToFloat(t.rawRelease)),Number.isInteger(e)?this.identifier=w.toNoteIdentifier(e):this.identifier=e}get identifier(){return this._name+(this._accidental||"")+this._octave}set identifier(e){const t=w.getNoteDetails(e);if(M.validation&&!e)throw new Error("Invalid note identifier");this._name=t.name,this._accidental=t.accidental,this._octave=t.octave}get name(){return this._name}set name(e){if(M.validation&&(e=e.toUpperCase(),!["C","D","E","F","G","A","B"].includes(e)))throw new Error("Invalid name value");this._name=e}get accidental(){return this._accidental}set accidental(e){if(M.validation&&(e=e.toLowerCase(),!["#","##","b","bb"].includes(e)))throw new Error("Invalid accidental value");this._accidental=e}get octave(){return this._octave}set octave(e){if(M.validation&&(e=parseInt(e),isNaN(e)))throw new Error("Invalid octave value");this._octave=e}get duration(){return this._duration}set duration(e){if(M.validation&&(e=parseFloat(e),isNaN(e)||e===null||e<0))throw new RangeError("Invalid duration value.");this._duration=e}get attack(){return this._attack}set attack(e){if(M.validation&&(e=parseFloat(e),isNaN(e)||!(e>=0&&e<=1)))throw new RangeError("Invalid attack value.");this._attack=e}get release(){return this._release}set release(e){if(M.validation&&(e=parseFloat(e),isNaN(e)||!(e>=0&&e<=1)))throw new RangeError("Invalid release value.");this._release=e}get rawAttack(){return w.fromFloatTo7Bit(this._attack)}set rawAttack(e){this._attack=w.from7bitToFloat(e)}get rawRelease(){return w.fromFloatTo7Bit(this._release)}set rawRelease(e){this._release=w.from7bitToFloat(e)}get number(){return w.toNoteNumber(this.identifier)}getOffsetNumber(e=0,t=0){return M.validation&&(e=parseInt(e)||0,t=parseInt(t)||0),Math.min(Math.max(this.number+e*12+t,0),127)}}/**
 * The `Utilities` class contains general-purpose utility methods. All methods are static and
 * should be called using the class name. For example: `Utilities.getNoteDetails("C4")`.
 *
 * @license Apache-2.0
 * @since 3.0.0
 */class w{static toNoteNumber(e,t=0){if(t=t==null?0:parseInt(t),isNaN(t))throw new RangeError("Invalid 'octaveOffset' value");typeof e!="string"&&(e="");const n=this.getNoteDetails(e);if(!n)throw new TypeError("Invalid note identifier");const s={C:0,D:2,E:4,F:5,G:7,A:9,B:11};let r=(n.octave+1+t)*12;if(r+=s[n.name],n.accidental&&(n.accidental.startsWith("b")?r-=n.accidental.length:r+=n.accidental.length),r<0||r>127)throw new RangeError("Invalid octaveOffset value");return r}static getNoteDetails(e){Number.isInteger(e)&&(e=this.toNoteIdentifier(e));const t=e.match(/^([CDEFGAB])(#{0,2}|b{0,2})(-?\d+)$/i);if(!t)throw new TypeError("Invalid note identifier");const n=t[1].toUpperCase(),s=parseInt(t[3]);let r=t[2].toLowerCase();return r=r===""?void 0:r,{accidental:r,identifier:n+(r||"")+s,name:n,octave:s}}static sanitizeChannels(e){let t;if(M.validation){if(e==="all")t=["all"];else if(e==="none")return[]}return Array.isArray(e)?t=e:t=[e],t.indexOf("all")>-1&&(t=g.MIDI_CHANNEL_NUMBERS),t.map(function(n){return parseInt(n)}).filter(function(n){return n>=1&&n<=16})}static toTimestamp(e){let t=!1;const n=parseFloat(e);return isNaN(n)?!1:(typeof e=="string"&&e.substring(0,1)==="+"?n>=0&&(t=M.time+n):n>=0&&(t=n),t)}static guessNoteNumber(e,t){t=parseInt(t)||0;let n=!1;if(Number.isInteger(e)&&e>=0&&e<=127)n=parseInt(e);else if(parseInt(e)>=0&&parseInt(e)<=127)n=parseInt(e);else if(typeof e=="string"||e instanceof String)try{n=this.toNoteNumber(e.trim(),t)}catch{return!1}return n}static toNoteIdentifier(e,t){if(e=parseInt(e),isNaN(e)||e<0||e>127)throw new RangeError("Invalid note number");if(t=t==null?0:parseInt(t),isNaN(t))throw new RangeError("Invalid octaveOffset value");const n=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],s=Math.floor(e/12-1)+t;return n[e%12]+s.toString()}static buildNote(e,t={}){if(t.octaveOffset=parseInt(t.octaveOffset)||0,e instanceof Nn)return e;let n=this.guessNoteNumber(e,t.octaveOffset);if(n===!1)throw new TypeError(`The input could not be parsed as a note (${e})`);return t.octaveOffset=void 0,new Nn(n,t)}static buildNoteArray(e,t={}){let n=[];return Array.isArray(e)||(e=[e]),e.forEach(s=>{n.push(this.buildNote(s,t))}),n}static from7bitToFloat(e){return e===1/0&&(e=127),e=parseInt(e)||0,Math.min(Math.max(e/127,0),1)}static fromFloatTo7Bit(e){return e===1/0&&(e=1),e=parseFloat(e)||0,Math.min(Math.max(Math.round(e*127),0),127)}static fromMsbLsbToFloat(e,t=0){M.validation&&(e=Math.min(Math.max(parseInt(e)||0,0),127),t=Math.min(Math.max(parseInt(t)||0,0),127));const n=((e<<7)+t)/16383;return Math.min(Math.max(n,0),1)}static fromFloatToMsbLsb(e){M.validation&&(e=Math.min(Math.max(parseFloat(e)||0,0),1));const t=Math.round(e*16383);return{msb:t>>7,lsb:t&127}}static offsetNumber(e,t=0,n=0){if(M.validation){if(e=parseInt(e),isNaN(e))throw new Error("Invalid note number");t=parseInt(t)||0,n=parseInt(n)||0}return Math.min(Math.max(e+t*12+n,0),127)}static getPropertyByValue(e,t){return Object.keys(e).find(n=>e[n]===t)}static getCcNameByNumber(e){if(!(M.validation&&(e=parseInt(e),!(e>=0&&e<=127))))return g.CONTROL_CHANGE_MESSAGES[e].name}static getCcNumberByName(e){let t=g.CONTROL_CHANGE_MESSAGES.find(n=>n.name===e);return t?t.number:g.MIDI_CONTROL_CHANGE_MESSAGES[e]}static getChannelModeByNumber(e){if(!(e>=120&&e<=127))return!1;for(let t in g.CHANNEL_MODE_MESSAGES)if(g.CHANNEL_MODE_MESSAGES.hasOwnProperty(t)&&e===g.CHANNEL_MODE_MESSAGES[t])return t;return!1}static get isNode(){return typeof process<"u"&&process.versions!=null&&process.versions.node!=null}static get isBrowser(){return typeof window<"u"&&typeof window.document<"u"}}/**
 * The `OutputChannel` class represents a single output MIDI channel. `OutputChannel` objects are
 * provided by an [`Output`](Output) port which, itself, is made available by a device. The
 * `OutputChannel` object is derived from the host's MIDI subsystem and should not be instantiated
 * directly.
 *
 * All 16 `OutputChannel` objects can be found inside the parent output's
 * [`channels`]{@link Output#channels} property.
 *
 * @param {Output} output The [`Output`](Output) this channel belongs to.
 * @param {number} number The MIDI channel number (`1` - `16`).
 *
 * @extends EventEmitter
 * @license Apache-2.0
 * @since 3.0.0
 */class Th extends Ce{constructor(e,t){super(),this._output=e,this._number=t,this._octaveOffset=0}destroy(){this._output=null,this._number=null,this._octaveOffset=0,this.removeListener()}send(e,t={time:0}){return this.output.send(e,t),this}sendKeyAftertouch(e,t,n={}){if(M.validation){if(n.useRawValue&&(n.rawValue=n.useRawValue),isNaN(parseFloat(t)))throw new RangeError("Invalid key aftertouch value.");if(n.rawValue){if(!(t>=0&&t<=127&&Number.isInteger(t)))throw new RangeError("Key aftertouch raw value must be an integer between 0 and 127.")}else if(!(t>=0&&t<=1))throw new RangeError("Key aftertouch value must be a float between 0 and 1.")}n.rawValue||(t=w.fromFloatTo7Bit(t));const s=M.octaveOffset+this.output.octaveOffset+this.octaveOffset;return Array.isArray(e)||(e=[e]),w.buildNoteArray(e).forEach(r=>{this.send([(g.CHANNEL_MESSAGES.keyaftertouch<<4)+(this.number-1),r.getOffsetNumber(s),t],{time:w.toTimestamp(n.time)})}),this}sendControlChange(e,t,n={}){if(typeof e=="string"&&(e=w.getCcNumberByName(e)),Array.isArray(t)||(t=[t]),M.validation){if(e===void 0)throw new TypeError("Control change must be identified with a valid name or an integer between 0 and 127.");if(!Number.isInteger(e)||!(e>=0&&e<=127))throw new TypeError("Control change number must be an integer between 0 and 127.");if(t=t.map(s=>{const r=Math.min(Math.max(parseInt(s),0),127);if(isNaN(r))throw new TypeError("Values must be integers between 0 and 127");return r}),t.length===2&&e>=32)throw new TypeError("To use a value array, the controller must be between 0 and 31")}return t.forEach((s,r)=>{this.send([(g.CHANNEL_MESSAGES.controlchange<<4)+(this.number-1),e+r*32,t[r]],{time:w.toTimestamp(n.time)})}),this}_selectNonRegisteredParameter(e,t={}){return this.sendControlChange(99,e[0],t),this.sendControlChange(98,e[1],t),this}_deselectRegisteredParameter(e={}){return this.sendControlChange(101,127,e),this.sendControlChange(100,127,e),this}_deselectNonRegisteredParameter(e={}){return this.sendControlChange(101,127,e),this.sendControlChange(100,127,e),this}_selectRegisteredParameter(e,t={}){return this.sendControlChange(101,e[0],t),this.sendControlChange(100,e[1],t),this}_setCurrentParameter(e,t={}){return e=[].concat(e),this.sendControlChange(6,e[0],t),e.length<2?this:(this.sendControlChange(38,e[1],t),this)}sendRpnDecrement(e,t={}){if(Array.isArray(e)||(e=g.REGISTERED_PARAMETERS[e]),M.validation){if(e===void 0)throw new TypeError("The specified registered parameter is invalid.");let n=!1;if(Object.getOwnPropertyNames(g.REGISTERED_PARAMETERS).forEach(s=>{g.REGISTERED_PARAMETERS[s][0]===e[0]&&g.REGISTERED_PARAMETERS[s][1]===e[1]&&(n=!0)}),!n)throw new TypeError("The specified registered parameter is invalid.")}return this._selectRegisteredParameter(e,t),this.sendControlChange(97,0,t),this._deselectRegisteredParameter(t),this}sendRpnIncrement(e,t={}){if(Array.isArray(e)||(e=g.REGISTERED_PARAMETERS[e]),M.validation){if(e===void 0)throw new TypeError("The specified registered parameter is invalid.");let n=!1;if(Object.getOwnPropertyNames(g.REGISTERED_PARAMETERS).forEach(s=>{g.REGISTERED_PARAMETERS[s][0]===e[0]&&g.REGISTERED_PARAMETERS[s][1]===e[1]&&(n=!0)}),!n)throw new TypeError("The specified registered parameter is invalid.")}return this._selectRegisteredParameter(e,t),this.sendControlChange(96,0,t),this._deselectRegisteredParameter(t),this}playNote(e,t={}){this.sendNoteOn(e,t);const n=Array.isArray(e)?e:[e];for(let s of n)if(parseInt(s.duration)>0){const r={time:(w.toTimestamp(t.time)||M.time)+parseInt(s.duration),release:s.release,rawRelease:s.rawRelease};this.sendNoteOff(s,r)}else if(parseInt(t.duration)>0){const r={time:(w.toTimestamp(t.time)||M.time)+parseInt(t.duration),release:t.release,rawRelease:t.rawRelease};this.sendNoteOff(s,r)}return this}sendNoteOff(e,t={}){if(M.validation){if(t.rawRelease!=null&&!(t.rawRelease>=0&&t.rawRelease<=127))throw new RangeError("The 'rawRelease' option must be an integer between 0 and 127");if(t.release!=null&&!(t.release>=0&&t.release<=1))throw new RangeError("The 'release' option must be an number between 0 and 1");t.rawVelocity&&(t.rawRelease=t.velocity,console.warn("The 'rawVelocity' option is deprecated. Use 'rawRelease' instead.")),t.velocity&&(t.release=t.velocity,console.warn("The 'velocity' option is deprecated. Use 'attack' instead."))}let n=64;t.rawRelease!=null?n=t.rawRelease:isNaN(t.release)||(n=Math.round(t.release*127));const s=M.octaveOffset+this.output.octaveOffset+this.octaveOffset;return w.buildNoteArray(e,{rawRelease:parseInt(n)}).forEach(r=>{this.send([(g.CHANNEL_MESSAGES.noteoff<<4)+(this.number-1),r.getOffsetNumber(s),r.rawRelease],{time:w.toTimestamp(t.time)})}),this}stopNote(e,t={}){return this.sendNoteOff(e,t)}sendNoteOn(e,t={}){if(M.validation){if(t.rawAttack!=null&&!(t.rawAttack>=0&&t.rawAttack<=127))throw new RangeError("The 'rawAttack' option must be an integer between 0 and 127");if(t.attack!=null&&!(t.attack>=0&&t.attack<=1))throw new RangeError("The 'attack' option must be an number between 0 and 1");t.rawVelocity&&(t.rawAttack=t.velocity,t.rawRelease=t.release,console.warn("The 'rawVelocity' option is deprecated. Use 'rawAttack' or 'rawRelease'.")),t.velocity&&(t.attack=t.velocity,console.warn("The 'velocity' option is deprecated. Use 'attack' instead."))}let n=64;t.rawAttack!=null?n=t.rawAttack:isNaN(t.attack)||(n=Math.round(t.attack*127));const s=M.octaveOffset+this.output.octaveOffset+this.octaveOffset;return w.buildNoteArray(e,{rawAttack:n}).forEach(r=>{this.send([(g.CHANNEL_MESSAGES.noteon<<4)+(this.number-1),r.getOffsetNumber(s),r.rawAttack],{time:w.toTimestamp(t.time)})}),this}sendChannelMode(e,t=0,n={}){if(typeof e=="string"&&(e=g.CHANNEL_MODE_MESSAGES[e]),M.validation){if(e===void 0)throw new TypeError("Invalid channel mode message name or number.");if(isNaN(e)||!(e>=120&&e<=127))throw new TypeError("Invalid channel mode message number.");if(isNaN(parseInt(t))||t<0||t>127)throw new RangeError("Value must be an integer between 0 and 127.")}return this.send([(g.CHANNEL_MESSAGES.controlchange<<4)+(this.number-1),e,t],{time:w.toTimestamp(n.time)}),this}sendOmniMode(e,t={}){return e===void 0||e?this.sendChannelMode("omnimodeon",0,t):this.sendChannelMode("omnimodeoff",0,t),this}sendChannelAftertouch(e,t={}){if(M.validation){if(isNaN(parseFloat(e)))throw new RangeError("Invalid channel aftertouch value.");if(t.rawValue){if(!(e>=0&&e<=127&&Number.isInteger(e)))throw new RangeError("Channel aftertouch raw value must be an integer between 0 and 127.")}else if(!(e>=0&&e<=1))throw new RangeError("Channel aftertouch value must be a float between 0 and 1.")}return t.rawValue||(e=w.fromFloatTo7Bit(e)),this.send([(g.CHANNEL_MESSAGES.channelaftertouch<<4)+(this.number-1),Math.round(e)],{time:w.toTimestamp(t.time)}),this}sendMasterTuning(e,t={}){if(e=parseFloat(e)||0,M.validation&&!(e>-65&&e<64))throw new RangeError("The value must be a decimal number larger than -65 and smaller than 64.");let n=Math.floor(e)+64,s=e-Math.floor(e);s=Math.round((s+1)/2*16383);let r=s>>7&127,o=s&127;return this.sendRpnValue("channelcoarsetuning",n,t),this.sendRpnValue("channelfinetuning",[r,o],t),this}sendModulationRange(e,t,n={}){if(M.validation){if(!Number.isInteger(e)||!(e>=0&&e<=127))throw new RangeError("The semitones value must be an integer between 0 and 127.");if(t!=null&&(!Number.isInteger(t)||!(t>=0&&t<=127)))throw new RangeError("If specified, the cents value must be an integer between 0 and 127.")}return t>=0&&t<=127||(t=0),this.sendRpnValue("modulationrange",[e,t],n),this}sendNrpnValue(e,t,n={}){if(t=[].concat(t),M.validation){if(!Array.isArray(e)||!Number.isInteger(e[0])||!Number.isInteger(e[1]))throw new TypeError("The specified NRPN is invalid.");if(!(e[0]>=0&&e[0]<=127))throw new RangeError("The first byte of the NRPN must be between 0 and 127.");if(!(e[1]>=0&&e[1]<=127))throw new RangeError("The second byte of the NRPN must be between 0 and 127.");t.forEach(s=>{if(!(s>=0&&s<=127))throw new RangeError("The data bytes of the NRPN must be between 0 and 127.")})}return this._selectNonRegisteredParameter(e,n),this._setCurrentParameter(t,n),this._deselectNonRegisteredParameter(n),this}sendPitchBend(e,t={}){if(M.validation)if(t.rawValue&&Array.isArray(e)){if(!(e[0]>=0&&e[0]<=127))throw new RangeError("The pitch bend MSB must be an integer between 0 and 127.");if(!(e[1]>=0&&e[1]<=127))throw new RangeError("The pitch bend LSB must be an integer between 0 and 127.")}else if(t.rawValue&&!Array.isArray(e)){if(!(e>=0&&e<=127))throw new RangeError("The pitch bend MSB must be an integer between 0 and 127.")}else{if(isNaN(e)||e===null)throw new RangeError("Invalid pitch bend value.");if(!(e>=-1&&e<=1))throw new RangeError("The pitch bend value must be a float between -1 and 1.")}let n=0,s=0;if(t.rawValue&&Array.isArray(e))n=e[0],s=e[1];else if(t.rawValue&&!Array.isArray(e))n=e;else{const r=w.fromFloatToMsbLsb((e+1)/2);n=r.msb,s=r.lsb}return this.send([(g.CHANNEL_MESSAGES.pitchbend<<4)+(this.number-1),s,n],{time:w.toTimestamp(t.time)}),this}sendPitchBendRange(e,t,n={}){if(M.validation){if(!Number.isInteger(e)||!(e>=0&&e<=127))throw new RangeError("The semitones value must be an integer between 0 and 127.");if(!Number.isInteger(t)||!(t>=0&&t<=127))throw new RangeError("The cents value must be an integer between 0 and 127.")}return this.sendRpnValue("pitchbendrange",[e,t],n),this}sendProgramChange(e,t={}){if(e=parseInt(e)||0,M.validation&&!(e>=0&&e<=127))throw new RangeError("The program number must be between 0 and 127.");return this.send([(g.CHANNEL_MESSAGES.programchange<<4)+(this.number-1),e],{time:w.toTimestamp(t.time)}),this}sendRpnValue(e,t,n={}){if(Array.isArray(e)||(e=g.REGISTERED_PARAMETERS[e]),M.validation){if(!Number.isInteger(e[0])||!Number.isInteger(e[1]))throw new TypeError("The specified NRPN is invalid.");if(!(e[0]>=0&&e[0]<=127))throw new RangeError("The first byte of the RPN must be between 0 and 127.");if(!(e[1]>=0&&e[1]<=127))throw new RangeError("The second byte of the RPN must be between 0 and 127.");[].concat(t).forEach(s=>{if(!(s>=0&&s<=127))throw new RangeError("The data bytes of the RPN must be between 0 and 127.")})}return this._selectRegisteredParameter(e,n),this._setCurrentParameter(t,n),this._deselectRegisteredParameter(n),this}sendTuningBank(e,t={}){if(M.validation&&(!Number.isInteger(e)||!(e>=0&&e<=127)))throw new RangeError("The tuning bank number must be between 0 and 127.");return this.sendRpnValue("tuningbank",e,t),this}sendTuningProgram(e,t={}){if(M.validation&&(!Number.isInteger(e)||!(e>=0&&e<=127)))throw new RangeError("The tuning program number must be between 0 and 127.");return this.sendRpnValue("tuningprogram",e,t),this}sendLocalControl(e,t={}){return e?this.sendChannelMode("localcontrol",127,t):this.sendChannelMode("localcontrol",0,t)}sendAllNotesOff(e={}){return this.sendChannelMode("allnotesoff",0,e)}sendAllSoundOff(e={}){return this.sendChannelMode("allsoundoff",0,e)}sendResetAllControllers(e={}){return this.sendChannelMode("resetallcontrollers",0,e)}sendPolyphonicMode(e,t={}){return e==="mono"?this.sendChannelMode("monomodeon",0,t):this.sendChannelMode("polymodeon",0,t)}get octaveOffset(){return this._octaveOffset}set octaveOffset(e){if(this.validation&&(e=parseInt(e),isNaN(e)))throw new TypeError("The 'octaveOffset' property must be an integer.");this._octaveOffset=e}get output(){return this._output}get number(){return this._number}}/**
 * The `Output` class represents a single MIDI output port (not to be confused with a MIDI channel).
 * A port is made available by a MIDI device. A MIDI device can advertise several input and output
 * ports. Each port has 16 MIDI channels which can be accessed via the [`channels`](#channels)
 * property.
 *
 * The `Output` object is automatically instantiated by the library according to the host's MIDI
 * subsystem and should not be directly instantiated.
 *
 * You can access all available `Output` objects by referring to the
 * [`WebMidi.outputs`](WebMidi#outputs) array or by using methods such as
 * [`WebMidi.getOutputByName()`](WebMidi#getOutputByName) or
 * [`WebMidi.getOutputById()`](WebMidi#getOutputById).
 *
 * @fires Output#opened
 * @fires Output#disconnected
 * @fires Output#closed
 *
 * @extends EventEmitter
 * @license Apache-2.0
 */class ba extends Ce{constructor(e){super(),this._midiOutput=e,this._octaveOffset=0,this.channels=[];for(let t=1;t<=16;t++)this.channels[t]=new Th(this,t);this._midiOutput.onstatechange=this._onStateChange.bind(this)}async destroy(){this.removeListener(),this.channels.forEach(e=>e.destroy()),this.channels=[],this._midiOutput&&(this._midiOutput.onstatechange=null),await this.close(),this._midiOutput=null}_onStateChange(e){let t={timestamp:M.time};e.port.connection==="open"?(t.type="opened",t.target=this,t.port=t.target,this.emit("opened",t)):e.port.connection==="closed"&&e.port.state==="connected"?(t.type="closed",t.target=this,t.port=t.target,this.emit("closed",t)):e.port.connection==="closed"&&e.port.state==="disconnected"?(t.type="disconnected",t.port={connection:e.port.connection,id:e.port.id,manufacturer:e.port.manufacturer,name:e.port.name,state:e.port.state,type:e.port.type},this.emit("disconnected",t)):e.port.connection==="pending"&&e.port.state==="disconnected"||console.warn("This statechange event was not caught:",e.port.connection,e.port.state)}async open(){try{return await this._midiOutput.open(),Promise.resolve(this)}catch(e){return Promise.reject(e)}}async close(){this._midiOutput?await this._midiOutput.close():await Promise.resolve()}send(e,t={time:0},n=0){if(e instanceof ho&&(e=w.isNode?e.data:e.rawData),e instanceof Uint8Array&&w.isNode&&(e=Array.from(e)),M.validation){if(!Array.isArray(e)&&!(e instanceof Uint8Array)&&(e=[e],Array.isArray(t)&&(e=e.concat(t)),t=isNaN(n)?{time:0}:{time:n}),!(parseInt(e[0])>=128&&parseInt(e[0])<=255))throw new RangeError("The first byte (status) must be an integer between 128 and 255.");e.slice(1).forEach(s=>{if(s=parseInt(s),!(s>=0&&s<=255))throw new RangeError("Data bytes must be integers between 0 and 255.")}),t||(t={time:0})}return this._midiOutput.send(e,w.toTimestamp(t.time)),this}sendSysex(e,t=[],n={}){if(e=[].concat(e),t instanceof Uint8Array){const s=new Uint8Array(1+e.length+t.length+1);s[0]=g.SYSTEM_MESSAGES.sysex,s.set(Uint8Array.from(e),1),s.set(t,1+e.length),s[s.length-1]=g.SYSTEM_MESSAGES.sysexend,this.send(s,{time:n.time})}else{const s=e.concat(t,g.SYSTEM_MESSAGES.sysexend);this.send([g.SYSTEM_MESSAGES.sysex].concat(s),{time:n.time})}return this}clear(){return this._midiOutput.clear?this._midiOutput.clear():M.validation&&console.warn("The 'clear()' method has not yet been implemented in your environment."),this}sendTimecodeQuarterFrame(e,t={}){if(M.validation&&(e=parseInt(e),isNaN(e)||!(e>=0&&e<=127)))throw new RangeError("The value must be an integer between 0 and 127.");return this.send([g.SYSTEM_MESSAGES.timecode,e],{time:t.time}),this}sendSongPosition(e=0,t={}){e=Math.floor(e)||0;var n=e>>7&127,s=e&127;return this.send([g.SYSTEM_MESSAGES.songposition,n,s],{time:t.time}),this}sendSongSelect(e=0,t={}){if(M.validation&&(e=parseInt(e),isNaN(e)||!(e>=0&&e<=127)))throw new RangeError("The program value must be between 0 and 127");return this.send([g.SYSTEM_MESSAGES.songselect,e],{time:t.time}),this}sendTuneRequest(e={}){return this.send([g.SYSTEM_MESSAGES.tunerequest],{time:e.time}),this}sendClock(e={}){return this.send([g.SYSTEM_MESSAGES.clock],{time:e.time}),this}sendStart(e={}){return this.send([g.SYSTEM_MESSAGES.start],{time:e.time}),this}sendContinue(e={}){return this.send([g.SYSTEM_MESSAGES.continue],{time:e.time}),this}sendStop(e={}){return this.send([g.SYSTEM_MESSAGES.stop],{time:e.time}),this}sendActiveSensing(e={}){return this.send([g.SYSTEM_MESSAGES.activesensing],{time:e.time}),this}sendReset(e={}){return this.send([g.SYSTEM_MESSAGES.reset],{time:e.time}),this}sendTuningRequest(e={}){return M.validation&&console.warn("The sendTuningRequest() method has been deprecated. Use sendTuningRequest() instead."),this.sendTuneRequest(e)}sendKeyAftertouch(e,t,n={}){return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].sendKeyAftertouch(e,t,n)}),this}sendControlChange(e,t,n={},s={}){if(M.validation&&(Array.isArray(n)||Number.isInteger(n)||n==="all")){const r=n;n=s,n.channels=r,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)}return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(n.channels).forEach(r=>{this.channels[r].sendControlChange(e,t,n)}),this}sendPitchBendRange(e=0,t=0,n={}){return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].sendPitchBendRange(e,t,n)}),this}setPitchBendRange(e=0,t=0,n="all",s={}){return M.validation&&(console.warn("The setPitchBendRange() method is deprecated. Use sendPitchBendRange() instead."),s.channels=n,s.channels==="all"&&(s.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendPitchBendRange(e,t,s)}sendRpnValue(e,t,n={}){return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].sendRpnValue(e,t,n)}),this}setRegisteredParameter(e,t=[],n="all",s={}){return M.validation&&(console.warn("The setRegisteredParameter() method is deprecated. Use sendRpnValue() instead."),s.channels=n,s.channels==="all"&&(s.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendRpnValue(e,t,s)}sendChannelAftertouch(e,t={},n={}){if(M.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendChannelAftertouch(e,t)}),this}sendPitchBend(e,t={},n={}){if(M.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendPitchBend(e,t)}),this}sendProgramChange(e=0,t={},n={}){if(M.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendProgramChange(e,t)}),this}sendModulationRange(e,t,n={}){return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].sendModulationRange(e,t,n)}),this}setModulationRange(e=0,t=0,n="all",s={}){return M.validation&&(console.warn("The setModulationRange() method is deprecated. Use sendModulationRange() instead."),s.channels=n,s.channels==="all"&&(s.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendModulationRange(e,t,s)}sendMasterTuning(e,t={}){return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(n=>{this.channels[n].sendMasterTuning(e,t)}),this}setMasterTuning(e,t={},n={}){return M.validation&&(console.warn("The setMasterTuning() method is deprecated. Use sendMasterTuning() instead."),n.channels=t,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendMasterTuning(e,n)}sendTuningProgram(e,t={}){return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(n=>{this.channels[n].sendTuningProgram(e,t)}),this}setTuningProgram(e,t="all",n={}){return M.validation&&(console.warn("The setTuningProgram() method is deprecated. Use sendTuningProgram() instead."),n.channels=t,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendTuningProgram(e,n)}sendTuningBank(e=0,t={}){return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(n=>{this.channels[n].sendTuningBank(e,t)}),this}setTuningBank(e,t="all",n={}){return M.validation&&(console.warn("The setTuningBank() method is deprecated. Use sendTuningBank() instead."),n.channels=t,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendTuningBank(e,n)}sendChannelMode(e,t=0,n={},s={}){if(M.validation&&(Array.isArray(n)||Number.isInteger(n)||n==="all")){const r=n;n=s,n.channels=r,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)}return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(n.channels).forEach(r=>{this.channels[r].sendChannelMode(e,t,n)}),this}sendAllSoundOff(e={}){return e.channels==null&&(e.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(e.channels).forEach(t=>{this.channels[t].sendAllSoundOff(e)}),this}sendAllNotesOff(e={}){return e.channels==null&&(e.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(e.channels).forEach(t=>{this.channels[t].sendAllNotesOff(e)}),this}sendResetAllControllers(e={},t={}){if(M.validation&&(Array.isArray(e)||Number.isInteger(e)||e==="all")){const n=e;e=t,e.channels=n,e.channels==="all"&&(e.channels=g.MIDI_CHANNEL_NUMBERS)}return e.channels==null&&(e.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(e.channels).forEach(n=>{this.channels[n].sendResetAllControllers(e)}),this}sendPolyphonicMode(e,t={},n={}){if(M.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendPolyphonicMode(e,t)}),this}sendLocalControl(e,t={},n={}){if(M.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendLocalControl(e,t)}),this}sendOmniMode(e,t={},n={}){if(M.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendOmniMode(e,t)}),this}sendNrpnValue(e,t,n={}){return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].sendNrpnValue(e,t,n)}),this}setNonRegisteredParameter(e,t=[],n="all",s={}){return M.validation&&(console.warn("The setNonRegisteredParameter() method is deprecated. Use sendNrpnValue() instead."),s.channels=n,s.channels==="all"&&(s.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendNrpnValue(e,t,s)}sendRpnIncrement(e,t={}){return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(n=>{this.channels[n].sendRpnIncrement(e,t)}),this}incrementRegisteredParameter(e,t="all",n={}){return M.validation&&(console.warn("The incrementRegisteredParameter() method is deprecated. Use sendRpnIncrement() instead."),n.channels=t,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendRpnIncrement(e,n)}sendRpnDecrement(e,t={}){return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(n=>{this.channels[n].sendRpnDecrement(e,t)}),this}decrementRegisteredParameter(e,t="all",n={}){return M.validation&&(console.warn("The decrementRegisteredParameter() method is deprecated. Use sendRpnDecrement() instead."),n.channels=t,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendRpnDecrement(e,n)}sendNoteOff(e,t={},n={}){if(M.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendNoteOff(e,t)}),this}stopNote(e,t){return this.sendNoteOff(e,t)}playNote(e,t={},n={}){if(M.validation&&(t.rawVelocity&&console.warn("The 'rawVelocity' option is deprecated. Use 'rawAttack' instead."),t.velocity&&console.warn("The 'velocity' option is deprecated. Use 'velocity' instead."),Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].playNote(e,t)}),this}sendNoteOn(e,t={},n={}){if(M.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendNoteOn(e,t)}),this}get name(){return this._midiOutput.name}get id(){return this._midiOutput.id}get connection(){return this._midiOutput.connection}get manufacturer(){return this._midiOutput.manufacturer}get state(){return this._midiOutput.state}get type(){return this._midiOutput.type}get octaveOffset(){return this._octaveOffset}set octaveOffset(e){if(this.validation&&(e=parseInt(e),isNaN(e)))throw new TypeError("The 'octaveOffset' property must be an integer.");this._octaveOffset=e}}/**
 * The `Forwarder` class allows the forwarding of MIDI messages to predetermined outputs. When you
 * call its [`forward()`](#forward) method, it will send the specified [`Message`](Message) object
 * to all the outputs listed in its [`destinations`](#destinations) property.
 *
 * If specific channels or message types have been defined in the [`channels`](#channels) or
 * [`types`](#types) properties, only messages matching the channels/types will be forwarded.
 *
 * While it can be manually instantiated, you are more likely to come across a `Forwarder` object as
 * the return value of the [`Input.addForwarder()`](Input#addForwarder) method.
 *
 * @license Apache-2.0
 * @since 3.0.0
 */class nr{constructor(e=[],t={}){this.destinations=[],this.types=[...Object.keys(g.SYSTEM_MESSAGES),...Object.keys(g.CHANNEL_MESSAGES)],this.channels=g.MIDI_CHANNEL_NUMBERS,this.suspended=!1,Array.isArray(e)||(e=[e]),t.types&&!Array.isArray(t.types)&&(t.types=[t.types]),t.channels&&!Array.isArray(t.channels)&&(t.channels=[t.channels]),M.validation&&(e.forEach(n=>{if(!(n instanceof ba))throw new TypeError("Destinations must be of type 'Output'.")}),t.types!==void 0&&t.types.forEach(n=>{if(!g.SYSTEM_MESSAGES.hasOwnProperty(n)&&!g.CHANNEL_MESSAGES.hasOwnProperty(n))throw new TypeError("Type must be a valid message type.")}),t.channels!==void 0&&t.channels.forEach(n=>{if(!g.MIDI_CHANNEL_NUMBERS.includes(n))throw new TypeError("MIDI channel must be between 1 and 16.")})),this.destinations=e,t.types&&(this.types=t.types),t.channels&&(this.channels=t.channels)}forward(e){this.suspended||this.types.includes(e.type)&&(e.channel&&!this.channels.includes(e.channel)||this.destinations.forEach(t=>{M.validation&&!(t instanceof ba)||t.send(e)}))}}/**
 * The `InputChannel` class represents a single MIDI input channel (1-16) from a single input
 * device. This object is derived from the host's MIDI subsystem and should not be instantiated
 * directly.
 *
 * All 16 `InputChannel` objects can be found inside the input's [`channels`](Input#channels)
 * property.
 *
 * @fires InputChannel#midimessage
 * @fires InputChannel#unknownmessage
 *
 * @fires InputChannel#noteoff
 * @fires InputChannel#noteon
 * @fires InputChannel#keyaftertouch
 * @fires InputChannel#programchange
 * @fires InputChannel#channelaftertouch
 * @fires InputChannel#pitchbend
 *
 * @fires InputChannel#allnotesoff
 * @fires InputChannel#allsoundoff
 * @fires InputChannel#localcontrol
 * @fires InputChannel#monomode
 * @fires InputChannel#omnimode
 * @fires InputChannel#resetallcontrollers
 *
 * @fires InputChannel#event:nrpn
 * @fires InputChannel#event:nrpn-dataentrycoarse
 * @fires InputChannel#event:nrpn-dataentryfine
 * @fires InputChannel#event:nrpn-dataincrement
 * @fires InputChannel#event:nrpn-datadecrement
 * @fires InputChannel#event:rpn
 * @fires InputChannel#event:rpn-dataentrycoarse
 * @fires InputChannel#event:rpn-dataentryfine
 * @fires InputChannel#event:rpn-dataincrement
 * @fires InputChannel#event:rpn-datadecrement
 *
 * @fires InputChannel#controlchange
 * @fires InputChannel#event:controlchange-controllerxxx
 * @fires InputChannel#event:controlchange-bankselectcoarse
 * @fires InputChannel#event:controlchange-modulationwheelcoarse
 * @fires InputChannel#event:controlchange-breathcontrollercoarse
 * @fires InputChannel#event:controlchange-footcontrollercoarse
 * @fires InputChannel#event:controlchange-portamentotimecoarse
 * @fires InputChannel#event:controlchange-dataentrycoarse
 * @fires InputChannel#event:controlchange-volumecoarse
 * @fires InputChannel#event:controlchange-balancecoarse
 * @fires InputChannel#event:controlchange-pancoarse
 * @fires InputChannel#event:controlchange-expressioncoarse
 * @fires InputChannel#event:controlchange-effectcontrol1coarse
 * @fires InputChannel#event:controlchange-effectcontrol2coarse
 * @fires InputChannel#event:controlchange-generalpurposecontroller1
 * @fires InputChannel#event:controlchange-generalpurposecontroller2
 * @fires InputChannel#event:controlchange-generalpurposecontroller3
 * @fires InputChannel#event:controlchange-generalpurposecontroller4
 * @fires InputChannel#event:controlchange-bankselectfine
 * @fires InputChannel#event:controlchange-modulationwheelfine
 * @fires InputChannel#event:controlchange-breathcontrollerfine
 * @fires InputChannel#event:controlchange-footcontrollerfine
 * @fires InputChannel#event:controlchange-portamentotimefine
 * @fires InputChannel#event:controlchange-dataentryfine
 * @fires InputChannel#event:controlchange-channelvolumefine
 * @fires InputChannel#event:controlchange-balancefine
 * @fires InputChannel#event:controlchange-panfine
 * @fires InputChannel#event:controlchange-expressionfine
 * @fires InputChannel#event:controlchange-effectcontrol1fine
 * @fires InputChannel#event:controlchange-effectcontrol2fine
 * @fires InputChannel#event:controlchange-damperpedal
 * @fires InputChannel#event:controlchange-portamento
 * @fires InputChannel#event:controlchange-sostenuto
 * @fires InputChannel#event:controlchange-softpedal
 * @fires InputChannel#event:controlchange-legatopedal
 * @fires InputChannel#event:controlchange-hold2
 * @fires InputChannel#event:controlchange-soundvariation
 * @fires InputChannel#event:controlchange-resonance
 * @fires InputChannel#event:controlchange-releasetime
 * @fires InputChannel#event:controlchange-attacktime
 * @fires InputChannel#event:controlchange-brightness
 * @fires InputChannel#event:controlchange-decaytime
 * @fires InputChannel#event:controlchange-vibratorate
 * @fires InputChannel#event:controlchange-vibratodepth
 * @fires InputChannel#event:controlchange-vibratodelay
 * @fires InputChannel#event:controlchange-generalpurposecontroller5
 * @fires InputChannel#event:controlchange-generalpurposecontroller6
 * @fires InputChannel#event:controlchange-generalpurposecontroller7
 * @fires InputChannel#event:controlchange-generalpurposecontroller8
 * @fires InputChannel#event:controlchange-portamentocontrol
 * @fires InputChannel#event:controlchange-highresolutionvelocityprefix
 * @fires InputChannel#event:controlchange-effect1depth
 * @fires InputChannel#event:controlchange-effect2depth
 * @fires InputChannel#event:controlchange-effect3depth
 * @fires InputChannel#event:controlchange-effect4depth
 * @fires InputChannel#event:controlchange-effect5depth
 * @fires InputChannel#event:controlchange-dataincrement
 * @fires InputChannel#event:controlchange-datadecrement
 * @fires InputChannel#event:controlchange-nonregisteredparameterfine
 * @fires InputChannel#event:controlchange-nonregisteredparametercoarse
 * @fires InputChannel#event:controlchange-registeredparameterfine
 * @fires InputChannel#event:controlchange-registeredparametercoarse
 * @fires InputChannel#event:controlchange-allsoundoff
 * @fires InputChannel#event:controlchange-resetallcontrollers
 * @fires InputChannel#event:controlchange-localcontrol
 * @fires InputChannel#event:controlchange-allnotesoff
 * @fires InputChannel#event:controlchange-omnimodeoff
 * @fires InputChannel#event:controlchange-omnimodeon
 * @fires InputChannel#event:controlchange-monomodeon
 * @fires InputChannel#event:controlchange-polymodeon
 * @fires InputChannel#event:
 *
 * @extends EventEmitter
 * @license Apache-2.0
 * @since 3.0.0
 */class Nh extends Ce{constructor(e,t){super(),this._input=e,this._number=t,this._octaveOffset=0,this._nrpnBuffer=[],this._rpnBuffer=[],this.parameterNumberEventsEnabled=!0,this.notesState=new Array(128).fill(!1)}destroy(){this._input=null,this._number=null,this._octaveOffset=0,this._nrpnBuffer=[],this.notesState=new Array(128).fill(!1),this.parameterNumberEventsEnabled=!1,this.removeListener()}_processMidiMessageEvent(e){const t=Object.assign({},e);t.port=this.input,t.target=this,t.type="midimessage",this.emit(t.type,t),this._parseEventForStandardMessages(t)}_parseEventForStandardMessages(e){const t=Object.assign({},e);t.type=t.message.type||"unknownmessage";const n=e.message.dataBytes[0],s=e.message.dataBytes[1];if(t.type==="noteoff"||t.type==="noteon"&&s===0)this.notesState[n]=!1,t.type="noteoff",t.note=new Nn(w.offsetNumber(n,this.octaveOffset+this.input.octaveOffset+M.octaveOffset),{rawAttack:0,rawRelease:s}),t.value=w.from7bitToFloat(s),t.rawValue=s,t.velocity=t.note.release,t.rawVelocity=t.note.rawRelease;else if(t.type==="noteon")this.notesState[n]=!0,t.note=new Nn(w.offsetNumber(n,this.octaveOffset+this.input.octaveOffset+M.octaveOffset),{rawAttack:s}),t.value=w.from7bitToFloat(s),t.rawValue=s,t.velocity=t.note.attack,t.rawVelocity=t.note.rawAttack;else if(t.type==="keyaftertouch")t.note=new Nn(w.offsetNumber(n,this.octaveOffset+this.input.octaveOffset+M.octaveOffset)),t.value=w.from7bitToFloat(s),t.rawValue=s,t.identifier=t.note.identifier,t.key=t.note.number,t.rawKey=n;else if(t.type==="controlchange"){t.controller={number:n,name:g.CONTROL_CHANGE_MESSAGES[n].name,description:g.CONTROL_CHANGE_MESSAGES[n].description,position:g.CONTROL_CHANGE_MESSAGES[n].position},t.subtype=t.controller.name||"controller"+n,t.value=w.from7bitToFloat(s),t.rawValue=s;const r=Object.assign({},t);r.type=`${t.type}-controller${n}`,delete r.subtype,this.emit(r.type,r);const o=Object.assign({},t);o.type=`${t.type}-`+g.CONTROL_CHANGE_MESSAGES[n].name,delete o.subtype,o.type.indexOf("controller")!==0&&this.emit(o.type,o),t.message.dataBytes[0]>=120&&this._parseChannelModeMessage(t),this.parameterNumberEventsEnabled&&this._isRpnOrNrpnController(t.message.dataBytes[0])&&this._parseEventForParameterNumber(t)}else t.type==="programchange"?(t.value=n,t.rawValue=t.value):t.type==="channelaftertouch"?(t.value=w.from7bitToFloat(n),t.rawValue=n):t.type==="pitchbend"?(t.value=((s<<7)+n-8192)/8192,t.rawValue=(s<<7)+n):t.type="unknownmessage";this.emit(t.type,t)}_parseChannelModeMessage(e){const t=Object.assign({},e);t.type=t.controller.name,t.type==="localcontrol"&&(t.value=t.message.data[2]===127,t.rawValue=t.message.data[2]),t.type==="omnimodeon"?(t.type="omnimode",t.value=!0,t.rawValue=t.message.data[2]):t.type==="omnimodeoff"&&(t.type="omnimode",t.value=!1,t.rawValue=t.message.data[2]),t.type==="monomodeon"?(t.type="monomode",t.value=!0,t.rawValue=t.message.data[2]):t.type==="polymodeon"&&(t.type="monomode",t.value=!1,t.rawValue=t.message.data[2]),this.emit(t.type,t)}_parseEventForParameterNumber(e){const t=e.message.dataBytes[0],n=e.message.dataBytes[1];t===99||t===101?(this._nrpnBuffer=[],this._rpnBuffer=[],t===99?this._nrpnBuffer=[e.message]:n!==127&&(this._rpnBuffer=[e.message])):t===98||t===100?t===98?(this._rpnBuffer=[],this._nrpnBuffer.length===1?this._nrpnBuffer.push(e.message):this._nrpnBuffer=[]):(this._nrpnBuffer=[],this._rpnBuffer.length===1&&n!==127?this._rpnBuffer.push(e.message):this._rpnBuffer=[]):(t===6||t===38||t===96||t===97)&&(this._rpnBuffer.length===2?this._dispatchParameterNumberEvent("rpn",this._rpnBuffer[0].dataBytes[1],this._rpnBuffer[1].dataBytes[1],e):this._nrpnBuffer.length===2?this._dispatchParameterNumberEvent("nrpn",this._nrpnBuffer[0].dataBytes[1],this._nrpnBuffer[1].dataBytes[1],e):(this._nrpnBuffer=[],this._rpnBuffer=[]))}_isRpnOrNrpnController(e){return e===6||e===38||e===96||e===97||e===98||e===99||e===100||e===101}_dispatchParameterNumberEvent(e,t,n,s){e=e==="nrpn"?"nrpn":"rpn";const r={target:s.target,timestamp:s.timestamp,message:s.message,parameterMsb:t,parameterLsb:n,value:w.from7bitToFloat(s.message.dataBytes[1]),rawValue:s.message.dataBytes[1]};e==="rpn"?r.parameter=Object.keys(g.REGISTERED_PARAMETERS).find(h=>g.REGISTERED_PARAMETERS[h][0]===t&&g.REGISTERED_PARAMETERS[h][1]===n):r.parameter=(t<<7)+n;const o=g.CONTROL_CHANGE_MESSAGES[s.message.dataBytes[0]].name;r.type=`${e}-${o}`,this.emit(r.type,r);const l=Object.assign({},r);l.type==="nrpn-dataincrement"?l.type="nrpn-databuttonincrement":l.type==="nrpn-datadecrement"?l.type="nrpn-databuttondecrement":l.type==="rpn-dataincrement"?l.type="rpn-databuttonincrement":l.type==="rpn-datadecrement"&&(l.type="rpn-databuttondecrement"),this.emit(l.type,l),r.type=e,r.subtype=o,this.emit(r.type,r)}getChannelModeByNumber(e){return M.validation&&(console.warn("The 'getChannelModeByNumber()' method has been moved to the 'Utilities' class."),e=Math.floor(e)),w.getChannelModeByNumber(e)}getCcNameByNumber(e){if(M.validation&&(console.warn("The 'getCcNameByNumber()' method has been moved to the 'Utilities' class."),e=parseInt(e),!(e>=0&&e<=127)))throw new RangeError("Invalid control change number.");return w.getCcNameByNumber(e)}getNoteState(e){e instanceof Nn&&(e=e.identifier);const t=w.guessNoteNumber(e,M.octaveOffset+this.input.octaveOffset+this.octaveOffset);return this.notesState[t]}get octaveOffset(){return this._octaveOffset}set octaveOffset(e){if(this.validation&&(e=parseInt(e),isNaN(e)))throw new TypeError("The 'octaveOffset' property must be an integer.");this._octaveOffset=e}get input(){return this._input}get number(){return this._number}get nrpnEventsEnabled(){return this.parameterNumberEventsEnabled}set nrpnEventsEnabled(e){this.validation&&(e=!!e),this.parameterNumberEventsEnabled=e}}/**
 * The `Message` class represents a single MIDI message. It has several properties that make it
 * easy to make sense of the binary data it contains.
 *
 * @license Apache-2.0
 * @since 3.0.0
 */class ho{constructor(e){this.rawData=e,this.data=Array.from(this.rawData),this.statusByte=this.rawData[0],this.rawDataBytes=this.rawData.slice(1),this.dataBytes=this.data.slice(1),this.isChannelMessage=!1,this.isSystemMessage=!1,this.command=void 0,this.channel=void 0,this.manufacturerId=void 0,this.type=void 0,this.statusByte<240?(this.isChannelMessage=!0,this.command=this.statusByte>>4,this.channel=(this.statusByte&15)+1):(this.isSystemMessage=!0,this.command=this.statusByte),this.isChannelMessage?this.type=w.getPropertyByValue(g.CHANNEL_MESSAGES,this.command):this.isSystemMessage&&(this.type=w.getPropertyByValue(g.SYSTEM_MESSAGES,this.command)),this.statusByte===g.SYSTEM_MESSAGES.sysex&&(this.dataBytes[0]===0?(this.manufacturerId=this.dataBytes.slice(0,3),this.dataBytes=this.dataBytes.slice(3,this.rawDataBytes.length-1),this.rawDataBytes=this.rawDataBytes.slice(3,this.rawDataBytes.length-1)):(this.manufacturerId=[this.dataBytes[0]],this.dataBytes=this.dataBytes.slice(1,this.dataBytes.length-1),this.rawDataBytes=this.rawDataBytes.slice(1,this.rawDataBytes.length-1)))}}/**
 * The `Input` class represents a single MIDI input port. This object is automatically instantiated
 * by the library according to the host's MIDI subsystem and does not need to be directly
 * instantiated. Instead, you can access all `Input` objects by referring to the
 * [`WebMidi.inputs`](WebMidi#inputs) array. You can also retrieve inputs by using methods such as
 * [`WebMidi.getInputByName()`](WebMidi#getInputByName) and
 * [`WebMidi.getInputById()`](WebMidi#getInputById).
 *
 * Note that a single MIDI device may expose several inputs and/or outputs.
 *
 * **Important**: the `Input` class does not directly fire channel-specific MIDI messages
 * (such as [`noteon`](InputChannel#event:noteon) or
 * [`controlchange`](InputChannel#event:controlchange), etc.). The [`InputChannel`](InputChannel)
 * object does that. However, you can still use the
 * [`Input.addListener()`](#addListener) method to listen to channel-specific events on multiple
 * [`InputChannel`](InputChannel) objects at once.
 *
 * @fires Input#opened
 * @fires Input#disconnected
 * @fires Input#closed
 * @fires Input#midimessage
 *
 * @fires Input#sysex
 * @fires Input#timecode
 * @fires Input#songposition
 * @fires Input#songselect
 * @fires Input#tunerequest
 * @fires Input#clock
 * @fires Input#start
 * @fires Input#continue
 * @fires Input#stop
 * @fires Input#activesensing
 * @fires Input#reset
 *
 * @fires Input#unknownmidimessage
 *
 * @extends EventEmitter
 * @license Apache-2.0
 */class kh extends Ce{constructor(e){super(),this._midiInput=e,this._octaveOffset=0,this.channels=[];for(let t=1;t<=16;t++)this.channels[t]=new Nh(this,t);this._forwarders=[],this._midiInput.onstatechange=this._onStateChange.bind(this),this._midiInput.onmidimessage=this._onMidiMessage.bind(this)}async destroy(){this.removeListener(),this.channels.forEach(e=>e.destroy()),this.channels=[],this._forwarders=[],this._midiInput&&(this._midiInput.onstatechange=null,this._midiInput.onmidimessage=null),await this.close(),this._midiInput=null}_onStateChange(e){let t={timestamp:M.time,target:this,port:this};e.port.connection==="open"?(t.type="opened",this.emit("opened",t)):e.port.connection==="closed"&&e.port.state==="connected"?(t.type="closed",this.emit("closed",t)):e.port.connection==="closed"&&e.port.state==="disconnected"?(t.type="disconnected",t.port={connection:e.port.connection,id:e.port.id,manufacturer:e.port.manufacturer,name:e.port.name,state:e.port.state,type:e.port.type},this.emit("disconnected",t)):e.port.connection==="pending"&&e.port.state==="disconnected"||console.warn("This statechange event was not caught: ",e.port.connection,e.port.state)}_onMidiMessage(e){const t=new ho(e.data),n={port:this,target:this,message:t,timestamp:e.timeStamp,type:"midimessage",data:t.data,rawData:t.data,statusByte:t.data[0],dataBytes:t.dataBytes};this.emit("midimessage",n),t.isSystemMessage?this._parseEvent(n):t.isChannelMessage&&this.channels[t.channel]._processMidiMessageEvent(n),this._forwarders.forEach(s=>s.forward(t))}_parseEvent(e){const t=Object.assign({},e);t.type=t.message.type||"unknownmidimessage",t.type==="songselect"&&(t.song=e.data[1]+1,t.value=e.data[1],t.rawValue=t.value),this.emit(t.type,t)}async open(){try{await this._midiInput.open()}catch(e){return Promise.reject(e)}return Promise.resolve(this)}async close(){if(!this._midiInput)return Promise.resolve(this);try{await this._midiInput.close()}catch(e){return Promise.reject(e)}return Promise.resolve(this)}getChannelModeByNumber(){M.validation&&console.warn("The 'getChannelModeByNumber()' method has been moved to the 'Utilities' class.")}addListener(e,t,n={}){if(M.validation&&typeof n=="function"){let s=t!=null?[].concat(t):void 0;t=n,n={channels:s}}if(g.CHANNEL_EVENTS.includes(e)){n.channels===void 0&&(n.channels=g.MIDI_CHANNEL_NUMBERS);let s=[];return w.sanitizeChannels(n.channels).forEach(r=>{s.push(this.channels[r].addListener(e,t,n))}),s}else return super.addListener(e,t,n)}addOneTimeListener(e,t,n={}){return n.remaining=1,this.addListener(e,t,n)}on(e,t,n,s){return this.addListener(e,t,n,s)}hasListener(e,t,n={}){if(M.validation&&typeof n=="function"){let s=[].concat(t);t=n,n={channels:s}}return g.CHANNEL_EVENTS.includes(e)?(n.channels===void 0&&(n.channels=g.MIDI_CHANNEL_NUMBERS),w.sanitizeChannels(n.channels).every(s=>this.channels[s].hasListener(e,t))):super.hasListener(e,t)}removeListener(e,t,n={}){if(M.validation&&typeof n=="function"){let s=[].concat(t);t=n,n={channels:s}}if(n.channels===void 0&&(n.channels=g.MIDI_CHANNEL_NUMBERS),e==null)return w.sanitizeChannels(n.channels).forEach(s=>{this.channels[s]&&this.channels[s].removeListener()}),super.removeListener();g.CHANNEL_EVENTS.includes(e)?w.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].removeListener(e,t,n)}):super.removeListener(e,t,n)}addForwarder(e,t={}){let n;return e instanceof nr?n=e:n=new nr(e,t),this._forwarders.push(n),n}removeForwarder(e){this._forwarders=this._forwarders.filter(t=>t!==e)}hasForwarder(e){return this._forwarders.includes(e)}get name(){return this._midiInput.name}get id(){return this._midiInput.id}get connection(){return this._midiInput.connection}get manufacturer(){return this._midiInput.manufacturer}get octaveOffset(){return this._octaveOffset}set octaveOffset(e){if(this.validation&&(e=parseInt(e),isNaN(e)))throw new TypeError("The 'octaveOffset' property must be an integer.");this._octaveOffset=e}get state(){return this._midiInput.state}get type(){return this._midiInput.type}get nrpnEventsEnabled(){return M.validation&&console.warn("The 'nrpnEventsEnabled' property has been moved to the 'InputChannel' class."),!1}}/**
 * The `WebMidi` object makes it easier to work with the low-level Web MIDI API. Basically, it
 * simplifies sending outgoing MIDI messages and reacting to incoming MIDI messages.
 *
 * When using the WebMidi.js library, you should know that the `WebMidi` class has already been
 * instantiated. You cannot instantiate it yourself. If you use the **IIFE** version, you should
 * simply use the global object called `WebMidi`. If you use the **CJS** (CommonJS) or **ESM** (ES6
 * module) version, you get an already-instantiated object when you import the module.
 *
 * @fires WebMidi#connected
 * @fires WebMidi#disabled
 * @fires WebMidi#disconnected
 * @fires WebMidi#enabled
 * @fires WebMidi#error
 * @fires WebMidi#midiaccessgranted
 * @fires WebMidi#portschanged
 *
 * @extends EventEmitter
 * @license Apache-2.0
 */class Dh extends Ce{constructor(){super(),this.defaults={note:{attack:w.from7bitToFloat(64),release:w.from7bitToFloat(64),duration:1/0}},this.interface=null,this.validation=!0,this._inputs=[],this._disconnectedInputs=[],this._outputs=[],this._disconnectedOutputs=[],this._stateChangeQueue=[],this._octaveOffset=0}async enable(e={},t=!1){if(w.isNode)try{window.navigator}catch{let l=await Object.getPrototypeOf(async function(){}).constructor(`
        let jzz = await import("jzz");
        return jzz.default;
        `)();global.navigator||(global.navigator={}),Object.assign(global.navigator,l)}if(this.validation=e.validation!==!1,this.validation&&(typeof e=="function"&&(e={callback:e,sysex:t}),t&&(e.sysex=!0)),this.enabled)return typeof e.callback=="function"&&e.callback(),Promise.resolve();const n={timestamp:this.time,target:this,type:"error",error:void 0},s={timestamp:this.time,target:this,type:"midiaccessgranted"},r={timestamp:this.time,target:this,type:"enabled"};try{typeof e.requestMIDIAccessFunction=="function"?this.interface=await e.requestMIDIAccessFunction({sysex:e.sysex,software:e.software}):this.interface=await navigator.requestMIDIAccess({sysex:e.sysex,software:e.software})}catch(o){return n.error=o,this.emit("error",n),typeof e.callback=="function"&&e.callback(o),Promise.reject(o)}this.emit("midiaccessgranted",s),this.interface.onstatechange=this._onInterfaceStateChange.bind(this);try{await this._updateInputsAndOutputs()}catch(o){return n.error=o,this.emit("error",n),typeof e.callback=="function"&&e.callback(o),Promise.reject(o)}return this.emit("enabled",r),typeof e.callback=="function"&&e.callback(),Promise.resolve(this)}async disable(){return this.interface&&(this.interface.onstatechange=void 0),this._destroyInputsAndOutputs().then(()=>{navigator&&typeof navigator.close=="function"&&navigator.close(),this.interface=null;let e={timestamp:this.time,target:this,type:"disabled"};this.emit("disabled",e),this.removeListener()})}getInputById(e,t={disconnected:!1}){if(this.validation){if(!this.enabled)throw new Error("WebMidi is not enabled.");if(!e)return}if(t.disconnected){for(let n=0;n<this._disconnectedInputs.length;n++)if(this._disconnectedInputs[n]._midiInput&&this._disconnectedInputs[n].id===e.toString())return this._disconnectedInputs[n]}else for(let n=0;n<this.inputs.length;n++)if(this.inputs[n]._midiInput&&this.inputs[n].id===e.toString())return this.inputs[n]}getInputByName(e,t={disconnected:!1}){if(this.validation){if(!this.enabled)throw new Error("WebMidi is not enabled.");if(!e)return;e=e.toString()}if(t.disconnected){for(let n=0;n<this._disconnectedInputs.length;n++)if(~this._disconnectedInputs[n].name.indexOf(e))return this._disconnectedInputs[n]}else for(let n=0;n<this.inputs.length;n++)if(~this.inputs[n].name.indexOf(e))return this.inputs[n]}getOutputByName(e,t={disconnected:!1}){if(this.validation){if(!this.enabled)throw new Error("WebMidi is not enabled.");if(!e)return;e=e.toString()}if(t.disconnected){for(let n=0;n<this._disconnectedOutputs.length;n++)if(~this._disconnectedOutputs[n].name.indexOf(e))return this._disconnectedOutputs[n]}else for(let n=0;n<this.outputs.length;n++)if(~this.outputs[n].name.indexOf(e))return this.outputs[n]}getOutputById(e,t={disconnected:!1}){if(this.validation){if(!this.enabled)throw new Error("WebMidi is not enabled.");if(!e)return}if(t.disconnected){for(let n=0;n<this._disconnectedOutputs.length;n++)if(this._disconnectedOutputs[n]._midiOutput&&this._disconnectedOutputs[n].id===e.toString())return this._disconnectedOutputs[n]}else for(let n=0;n<this.outputs.length;n++)if(this.outputs[n]._midiOutput&&this.outputs[n].id===e.toString())return this.outputs[n]}noteNameToNumber(e){return this.validation&&console.warn("The noteNameToNumber() method is deprecated. Use Utilities.toNoteNumber() instead."),w.toNoteNumber(e,this.octaveOffset)}getOctave(e){return this.validation&&(console.warn("The getOctave()is deprecated. Use Utilities.getNoteDetails() instead"),e=parseInt(e)),!isNaN(e)&&e>=0&&e<=127?w.getNoteDetails(w.offsetNumber(e,this.octaveOffset)).octave:!1}sanitizeChannels(e){return this.validation&&console.warn("The sanitizeChannels() method has been moved to the utilities class."),w.sanitizeChannels(e)}toMIDIChannels(e){return this.validation&&console.warn("The toMIDIChannels() method has been deprecated. Use Utilities.sanitizeChannels() instead."),w.sanitizeChannels(e)}guessNoteNumber(e){return this.validation&&console.warn("The guessNoteNumber() method has been deprecated. Use Utilities.guessNoteNumber() instead."),w.guessNoteNumber(e,this.octaveOffset)}getValidNoteArray(e,t={}){return this.validation&&console.warn("The getValidNoteArray() method has been moved to the Utilities.buildNoteArray()"),w.buildNoteArray(e,t)}convertToTimestamp(e){return this.validation&&console.warn("The convertToTimestamp() method has been moved to Utilities.toTimestamp()."),w.toTimestamp(e)}async _destroyInputsAndOutputs(){let e=[];return this.inputs.forEach(t=>e.push(t.destroy())),this.outputs.forEach(t=>e.push(t.destroy())),Promise.all(e).then(()=>{this._inputs=[],this._outputs=[]})}_onInterfaceStateChange(e){if(!this.enabled)return;this._updateInputsAndOutputs();let t={timestamp:e.timeStamp,type:e.port.state,target:this};if(e.port.state==="connected"&&e.port.connection==="open"){e.port.type==="output"?t.port=this.getOutputById(e.port.id):e.port.type==="input"&&(t.port=this.getInputById(e.port.id)),this.emit(e.port.state,t);const n=Object.assign({},t);n.type="portschanged",this.emit(n.type,n)}else if(e.port.state==="disconnected"&&e.port.connection==="pending"){e.port.type==="input"?t.port=this.getInputById(e.port.id,{disconnected:!0}):e.port.type==="output"&&(t.port=this.getOutputById(e.port.id,{disconnected:!0})),this.emit(e.port.state,t);const n=Object.assign({},t);n.type="portschanged",this.emit(n.type,n)}}async _updateInputsAndOutputs(){return Promise.all([this._updateInputs(),this._updateOutputs()])}async _updateInputs(){if(!this.interface)return;for(let t=this._inputs.length-1;t>=0;t--){const n=this._inputs[t];Array.from(this.interface.inputs.values()).find(r=>r===n._midiInput)||(this._disconnectedInputs.push(n),this._inputs.splice(t,1))}let e=[];return this.interface.inputs.forEach(t=>{if(!this._inputs.find(n=>n._midiInput===t)){let n=this._disconnectedInputs.find(s=>s._midiInput===t);n||(n=new kh(t)),this._inputs.push(n),e.push(n.open())}}),Promise.all(e)}async _updateOutputs(){if(!this.interface)return;for(let t=this._outputs.length-1;t>=0;t--){const n=this._outputs[t];Array.from(this.interface.outputs.values()).find(r=>r===n._midiOutput)||(this._disconnectedOutputs.push(n),this._outputs.splice(t,1))}let e=[];return this.interface.outputs.forEach(t=>{if(!this._outputs.find(n=>n._midiOutput===t)){let n=this._disconnectedOutputs.find(s=>s._midiOutput===t);n||(n=new ba(t)),this._outputs.push(n),e.push(n.open())}}),Promise.all(e)}get enabled(){return this.interface!==null}get inputs(){return this._inputs}get isNode(){return this.validation&&console.warn("WebMidi.isNode has been deprecated. Use Utilities.isNode instead."),w.isNode}get isBrowser(){return this.validation&&console.warn("WebMidi.isBrowser has been deprecated. Use Utilities.isBrowser instead."),w.isBrowser}get octaveOffset(){return this._octaveOffset}set octaveOffset(e){if(this.validation&&(e=parseInt(e),isNaN(e)))throw new TypeError("The 'octaveOffset' property must be an integer.");this._octaveOffset=e}get outputs(){return this._outputs}get supported(){return typeof navigator<"u"&&!!navigator.requestMIDIAccess}get sysexEnabled(){return!!(this.interface&&this.interface.sysexEnabled)}get time(){return performance.now()}get version(){return"3.1.16"}get flavour(){return"esm"}get CHANNEL_EVENTS(){return this.validation&&console.warn("The CHANNEL_EVENTS enum has been moved to Enumerations.CHANNEL_EVENTS."),g.CHANNEL_EVENTS}get MIDI_SYSTEM_MESSAGES(){return this.validation&&console.warn("The MIDI_SYSTEM_MESSAGES enum has been moved to Enumerations.SYSTEM_MESSAGES."),g.SYSTEM_MESSAGES}get MIDI_CHANNEL_MODE_MESSAGES(){return this.validation&&console.warn("The MIDI_CHANNEL_MODE_MESSAGES enum has been moved to Enumerations.CHANNEL_MODE_MESSAGES."),g.CHANNEL_MODE_MESSAGES}get MIDI_CONTROL_CHANGE_MESSAGES(){return this.validation&&console.warn("The MIDI_CONTROL_CHANGE_MESSAGES enum has been replaced by the Enumerations.CONTROL_CHANGE_MESSAGES array."),g.MIDI_CONTROL_CHANGE_MESSAGES}get MIDI_REGISTERED_PARAMETER(){return this.validation&&console.warn("The MIDI_REGISTERED_PARAMETER enum has been moved to Enumerations.REGISTERED_PARAMETERS."),g.REGISTERED_PARAMETERS}get NOTES(){return this.validation&&console.warn("The NOTES enum has been deprecated."),["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]}}const M=new Dh;M.constructor=null;var co=i=>{throw TypeError(i)},Ta=(i,e,t)=>e.has(i)||co("Cannot "+t),X=(i,e,t)=>(Ta(i,e,"read from private field"),t?t.call(i):e.get(i)),zt=(i,e,t)=>e.has(i)?co("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(i):e.set(i,t),Rh=(i,e,t,n)=>(Ta(i,e,"write to private field"),e.set(i,t),t),Je=(i,e,t)=>(Ta(i,e,"access private method"),t);function ya(){return typeof navigator<"u"&&typeof navigator.requestMIDIAccess=="function"}function ir(){const i=navigator.userAgent,e=/Chrome/.test(i)&&/Google Inc/.test(navigator.vendor||""),t=/Edg/.test(i),n=/OPR/.test(i),s=/Safari/.test(i)&&!/Chrome/.test(i),r=/Firefox/.test(i);let o="Unknown";e?o="Chrome":t?o="Edge":n?o="Opera":s?o="Safari":r&&(o="Firefox");const l=ya();let h="";return l||(s?h="Safari doesn't support Web MIDI API. Use Chrome, Edge, or Opera for MIDI functionality.":r?h="Firefox has limited Web MIDI API support. Use Chrome, Edge, or Opera for full MIDI functionality.":h="Web MIDI API not supported in this browser."),{supported:l,browserName:o,message:h}}var di,Mi,Ei,In,xn,Re,uo,Bs,sr,ar,pi;class Ch{constructor(){zt(this,Re),zt(this,di,!1),zt(this,Mi,new Set),zt(this,Ei,new Set),zt(this,In,new Set),zt(this,xn,new Set)}async init(){if(X(this,di))return!0;if(!ya()){const{browserName:e,message:t}=ir();return console.warn(`InputController: ${t} (Browser: ${e})`),!1}try{await M.enable()}catch(e){return console.warn("InputController: WebMIDI enable failed",e),!1}return M.enabled?(Rh(this,di,!0),Je(this,Re,uo).call(this),!0):(console.warn("InputController: WebMIDI not enabled"),!1)}onNoteOn(e){return X(this,Mi).add(e),()=>X(this,Mi).delete(e)}onNoteOff(e){return X(this,Ei).add(e),()=>X(this,Ei).delete(e)}onControlChange(e){return X(this,In).add(e),()=>X(this,In).delete(e)}onSustainPedal(e){return X(this,xn).add(e),()=>X(this,xn).delete(e)}registerNoteTarget(e,t="all"){const n=this.onNoteOn(r=>{Je(this,Re,pi).call(this,t,r.channel)&&e.play(r.note,r.velocity??0)}),s=this.onNoteOff(r=>{Je(this,Re,pi).call(this,t,r.channel)&&e.release(r.note)});return()=>{n(),s()}}registerControlTarget(e,t){const n=Array.isArray(e)?e:[e],s=Array.isArray(t.controller)?t.controller:[t.controller],r=t.channel??"all",o=t.transformValue??(l=>l.normalizedValue);return this.onControlChange(l=>{if(!s.includes(l.controller)||!Je(this,Re,pi).call(this,r,l.channel))return;const h=o(l);n.forEach(c=>{typeof c=="function"?c(h,l):"onControlChange"in c?c.onControlChange(h,l):"setValueNormalized"in c&&c.setValueNormalized?c.setValueNormalized(h):"setValue"in c&&c.setValue&&c.setValue(h)})})}registerSustainPedalTarget(e,t="all"){return this.onSustainPedal(n=>{Je(this,Re,pi).call(this,t,n.channel)&&e.setSustainPedal(n.pressed)})}get initialized(){return X(this,di)}get midiSupported(){return ya()}get supportInfo(){return ir()}}di=new WeakMap,Mi=new WeakMap,Ei=new WeakMap,In=new WeakMap,xn=new WeakMap,Re=new WeakSet,uo=function(){M.inputs.forEach(i=>{i&&(i.addListener("noteon",e=>{Je(this,Re,Bs).call(this,X(this,Mi),e,"noteon")}),i.addListener("noteoff",e=>{Je(this,Re,Bs).call(this,X(this,Ei),e,"noteoff")}),i.addListener("controlchange",e=>{var t,n;(((t=e.controller)==null?void 0:t.number)??((n=e.controller)==null?void 0:n.value)??0)===64?Je(this,Re,ar).call(this,e):Je(this,Re,sr).call(this,e)}))})},Bs=function(i,e,t){var n,s,r,o;if(!i.size)return;const l={type:t,note:((n=e.note)==null?void 0:n.number)??0,velocity:((s=e.note)==null?void 0:s.rawAttack)??(typeof e.velocity=="number"?e.velocity:((r=e.note)==null?void 0:r.attack)??0),channel:((o=e.message)==null?void 0:o.channel)??1,raw:e};i.forEach(h=>h(l))},sr=function(i){var e,t,n;if(!X(this,In).size)return;const s={type:"controlchange",controller:((e=i.controller)==null?void 0:e.number)??((t=i.controller)==null?void 0:t.value)??(typeof i.controller=="number"?i.controller:0),normalizedValue:typeof i.value=="number"?i.value:typeof i.rawValue=="number"?i.rawValue/127:0,midiValue:typeof i.rawValue=="number"?i.rawValue:typeof i.value=="number"?Math.round(i.value*127):0,channel:((n=i.message)==null?void 0:n.channel)??1,raw:i};X(this,In).forEach(r=>r(s))},ar=function(i){var e;if(!X(this,xn).size)return;const t={type:"sustainpedal",pressed:(typeof i.rawValue=="number"?i.rawValue:typeof i.value=="number"?Math.round(i.value*127):0)>=64,channel:((e=i.message)==null?void 0:e.channel)??1,raw:i};X(this,xn).forEach(n=>n(t))},pi=function(i,e){return i==="all"?!0:typeof e!="number"?!1:i===e};const rc=new Ch;try{self["workbox:window:7.2.0"]&&_()}catch{}function va(i,e){return new Promise(function(t){var n=new MessageChannel;n.port1.onmessage=function(s){t(s.data)},i.postMessage(e,[n.port2])})}function Ih(i){var e=function(t,n){if(typeof t!="object"||!t)return t;var s=t[Symbol.toPrimitive];if(s!==void 0){var r=s.call(t,n);if(typeof r!="object")return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(i,"string");return typeof e=="symbol"?e:e+""}function xh(i,e){for(var t=0;t<e.length;t++){var n=e[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(i,Ih(n.key),n)}}function wa(i,e){return wa=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,n){return t.__proto__=n,t},wa(i,e)}function rr(i,e){(e==null||e>i.length)&&(e=i.length);for(var t=0,n=new Array(e);t<e;t++)n[t]=i[t];return n}function Oh(i,e){var t=typeof Symbol<"u"&&i[Symbol.iterator]||i["@@iterator"];if(t)return(t=t.call(i)).next.bind(t);if(Array.isArray(i)||(t=function(s,r){if(s){if(typeof s=="string")return rr(s,r);var o=Object.prototype.toString.call(s).slice(8,-1);return o==="Object"&&s.constructor&&(o=s.constructor.name),o==="Map"||o==="Set"?Array.from(s):o==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o)?rr(s,r):void 0}}(i))||e){t&&(i=t);var n=0;return function(){return n>=i.length?{done:!0}:{done:!1,value:i[n++]}}}throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}try{self["workbox:core:7.2.0"]&&_()}catch{}var Ws=function(){var i=this;this.promise=new Promise(function(e,t){i.resolve=e,i.reject=t})};function Gs(i,e){var t=location.href;return new URL(i,t).href===new URL(e,t).href}var yn=function(i,e){this.type=i,Object.assign(this,e)};function nt(i,e,t){return t?e?e(i):i:(i&&i.then||(i=Promise.resolve(i)),e?i.then(e):i)}function Vh(){}var Lh={type:"SKIP_WAITING"};function or(i,e){return i&&i.then?i.then(Vh):Promise.resolve()}var Fh=function(i){function e(l,h){var c,f;return h===void 0&&(h={}),(c=i.call(this)||this).nn={},c.tn=0,c.rn=new Ws,c.en=new Ws,c.on=new Ws,c.un=0,c.an=new Set,c.cn=function(){var d=c.fn,m=d.installing;c.tn>0||!Gs(m.scriptURL,c.sn.toString())||performance.now()>c.un+6e4?(c.vn=m,d.removeEventListener("updatefound",c.cn)):(c.hn=m,c.an.add(m),c.rn.resolve(m)),++c.tn,m.addEventListener("statechange",c.ln)},c.ln=function(d){var m=c.fn,v=d.target,E=v.state,S=v===c.vn,A={sw:v,isExternal:S,originalEvent:d};!S&&c.mn&&(A.isUpdate=!0),c.dispatchEvent(new yn(E,A)),E==="installed"?c.wn=self.setTimeout(function(){E==="installed"&&m.waiting===v&&c.dispatchEvent(new yn("waiting",A))},200):E==="activating"&&(clearTimeout(c.wn),S||c.en.resolve(v))},c.yn=function(d){var m=c.hn,v=m!==navigator.serviceWorker.controller;c.dispatchEvent(new yn("controlling",{isExternal:v,originalEvent:d,sw:m,isUpdate:c.mn})),v||c.on.resolve(m)},c.gn=(f=function(d){var m=d.data,v=d.ports,E=d.source;return nt(c.getSW(),function(){c.an.has(E)&&c.dispatchEvent(new yn("message",{data:m,originalEvent:d,ports:v,sw:E}))})},function(){for(var d=[],m=0;m<arguments.length;m++)d[m]=arguments[m];try{return Promise.resolve(f.apply(this,d))}catch(v){return Promise.reject(v)}}),c.sn=l,c.nn=h,navigator.serviceWorker.addEventListener("message",c.gn),c}var t,n;n=i,(t=e).prototype=Object.create(n.prototype),t.prototype.constructor=t,wa(t,n);var s,r,o=e.prototype;return o.register=function(l){var h=(l===void 0?{}:l).immediate,c=h!==void 0&&h;try{var f=this;return nt(function(d,m){var v=d();return v&&v.then?v.then(m):m(v)}(function(){if(!c&&document.readyState!=="complete")return or(new Promise(function(d){return window.addEventListener("load",d)}))},function(){return f.mn=!!navigator.serviceWorker.controller,f.dn=f.pn(),nt(f.bn(),function(d){f.fn=d,f.dn&&(f.hn=f.dn,f.en.resolve(f.dn),f.on.resolve(f.dn),f.dn.addEventListener("statechange",f.ln,{once:!0}));var m=f.fn.waiting;return m&&Gs(m.scriptURL,f.sn.toString())&&(f.hn=m,Promise.resolve().then(function(){f.dispatchEvent(new yn("waiting",{sw:m,wasWaitingBeforeRegister:!0}))}).then(function(){})),f.hn&&(f.rn.resolve(f.hn),f.an.add(f.hn)),f.fn.addEventListener("updatefound",f.cn),navigator.serviceWorker.addEventListener("controllerchange",f.yn),f.fn})}))}catch(d){return Promise.reject(d)}},o.update=function(){try{return this.fn?nt(or(this.fn.update())):nt()}catch(l){return Promise.reject(l)}},o.getSW=function(){return this.hn!==void 0?Promise.resolve(this.hn):this.rn.promise},o.messageSW=function(l){try{return nt(this.getSW(),function(h){return va(h,l)})}catch(h){return Promise.reject(h)}},o.messageSkipWaiting=function(){this.fn&&this.fn.waiting&&va(this.fn.waiting,Lh)},o.pn=function(){var l=navigator.serviceWorker.controller;return l&&Gs(l.scriptURL,this.sn.toString())?l:void 0},o.bn=function(){try{var l=this;return nt(function(h,c){try{var f=h()}catch(d){return c(d)}return f&&f.then?f.then(void 0,c):f}(function(){return nt(navigator.serviceWorker.register(l.sn,l.nn),function(h){return l.un=performance.now(),h})},function(h){throw h}))}catch(h){return Promise.reject(h)}},s=e,(r=[{key:"active",get:function(){return this.en.promise}},{key:"controlling",get:function(){return this.on.promise}}])&&xh(s.prototype,r),Object.defineProperty(s,"prototype",{writable:!1}),s}(function(){function i(){this.Pn=new Map}var e=i.prototype;return e.addEventListener=function(t,n){this.jn(t).add(n)},e.removeEventListener=function(t,n){this.jn(t).delete(n)},e.dispatchEvent=function(t){t.target=this;for(var n,s=Oh(this.jn(t.type));!(n=s()).done;)(0,n.value)(t)},e.jn=function(t){return this.Pn.has(t)||this.Pn.set(t,new Set),this.Pn.get(t)},i}());const oc=Object.freeze(Object.defineProperty({__proto__:null,Workbox:Fh,WorkboxEvent:yn,messageSW:va},Symbol.toStringTag,{value:"Module"}));export{Zh as A,nc as B,sc as C,$h as D,oc as E,Gh as F,Jh as J,Qh as K,ir as O,Kh as P,Uh as S,rc as U,Xh as X,Ma as a,cr as b,ac as c,zs as d,Hh as e,Si as f,xo as g,jh as h,qs as i,Ro as j,Wh as k,bo as l,zh as m,Oo as n,Bh as o,qh as p,Fl as q,kn as r,Hs as s,Ut as t,Fo as u,ec as v,ic as w,Lo as x,Yh as y,tc as z};
//# sourceMappingURL=vendor-BQ3w_JD8.js.map
