import{D as fo}from"./vendor-dexie-CRVYvTkI.js";const mo=!1,go=(i,e)=>i===e,Bt=Symbol("solid-proxy"),Hs=Symbol("solid-track"),ps={equals:go};let rr=ur;const vt=1,fs=2,or={owned:null,cleanups:null,context:null,owner:null};var U=null;let Rs=null,yo=null,V=null,ee=null,tt=null,Ds=0;function Ii(i,e){const t=V,n=U,s=i.length===0,r=e===void 0?n:e,o=s?or:{owned:null,cleanups:null,context:r?r.context:null,owner:r},l=s?i:()=>i(()=>nt(()=>Si(o)));U=o,V=null;try{return On(l,!0)}finally{V=t,U=n}}function lr(i,e){e=e?Object.assign({},ps,e):ps;const t={value:i,observers:null,observerSlots:null,comparator:e.equals||void 0},n=s=>(typeof s=="function"&&(s=s(t.value)),cr(t,s));return[hr.bind(t),n]}function Mi(i,e,t){const n=wa(i,e,!1,vt);Ni(n)}function bo(i,e,t){rr=Mo;const n=wa(i,e,!1,vt);n.user=!0,tt?tt.push(n):Ni(n)}function fi(i,e,t){t=t?Object.assign({},ps,t):ps;const n=wa(i,e,!0,0);return n.observers=null,n.observerSlots=null,n.comparator=t.equals||void 0,Ni(n),hr.bind(n)}function Ao(i){return On(i,!1)}function nt(i){if(V===null)return i();const e=V;V=null;try{return i()}finally{V=e}}function Kh(i){bo(()=>nt(i))}function vo(i){return U===null||(U.cleanups===null?U.cleanups=[i]:U.cleanups.push(i)),i}function js(){return V}function Qh(){return U}function hr(){if(this.sources&&this.state)if(this.state===vt)Ni(this);else{const i=ee;ee=null,On(()=>gs(this),!1),ee=i}if(V){const i=this.observers?this.observers.length:0;V.sources?(V.sources.push(this),V.sourceSlots.push(i)):(V.sources=[this],V.sourceSlots=[i]),this.observers?(this.observers.push(V),this.observerSlots.push(V.sources.length-1)):(this.observers=[V],this.observerSlots=[V.sources.length-1])}return this.value}function cr(i,e,t){let n=i.value;return(!i.comparator||!i.comparator(n,e))&&(i.value=e,i.observers&&i.observers.length&&On(()=>{for(let s=0;s<i.observers.length;s+=1){const r=i.observers[s],o=Rs&&Rs.running;o&&Rs.disposed.has(r),(o?!r.tState:!r.state)&&(r.pure?ee.push(r):tt.push(r),r.observers&&dr(r)),o||(r.state=vt)}if(ee.length>1e6)throw ee=[],new Error},!1)),e}function Ni(i){if(!i.fn)return;Si(i);const e=Ds;wo(i,i.value,e)}function wo(i,e,t){let n;const s=U,r=V;V=U=i;try{n=i.fn(e)}catch(o){return i.pure&&(i.state=vt,i.owned&&i.owned.forEach(Si),i.owned=null),i.updatedAt=t+1,pr(o)}finally{V=r,U=s}(!i.updatedAt||i.updatedAt<=t)&&(i.updatedAt!=null&&"observers"in i?cr(i,n):i.value=n,i.updatedAt=t)}function wa(i,e,t,n=vt,s){const r={fn:i,state:n,updatedAt:null,owned:null,sources:null,sourceSlots:null,cleanups:null,value:e,owner:U,context:U?U.context:null,pure:t};return U===null||U!==or&&(U.owned?U.owned.push(r):U.owned=[r]),r}function ms(i){if(i.state===0)return;if(i.state===fs)return gs(i);if(i.suspense&&nt(i.suspense.inFallback))return i.suspense.effects.push(i);const e=[i];for(;(i=i.owner)&&(!i.updatedAt||i.updatedAt<Ds);)i.state&&e.push(i);for(let t=e.length-1;t>=0;t--)if(i=e[t],i.state===vt)Ni(i);else if(i.state===fs){const n=ee;ee=null,On(()=>gs(i,e[0]),!1),ee=n}}function On(i,e){if(ee)return i();let t=!1;e||(ee=[]),tt?t=!0:tt=[],Ds++;try{const n=i();return Eo(t),n}catch(n){t||(tt=null),ee=null,pr(n)}}function Eo(i){if(ee&&(ur(ee),ee=null),i)return;const e=tt;tt=null,e.length&&On(()=>rr(e),!1)}function ur(i){for(let e=0;e<i.length;e++)ms(i[e])}function Mo(i){let e,t=0;for(e=0;e<i.length;e++){const n=i[e];n.user?i[t++]=n:ms(n)}for(e=0;e<t;e++)ms(i[e])}function gs(i,e){i.state=0;for(let t=0;t<i.sources.length;t+=1){const n=i.sources[t];if(n.sources){const s=n.state;s===vt?n!==e&&(!n.updatedAt||n.updatedAt<Ds)&&ms(n):s===fs&&gs(n,e)}}}function dr(i){for(let e=0;e<i.observers.length;e+=1){const t=i.observers[e];t.state||(t.state=fs,t.pure?ee.push(t):tt.push(t),t.observers&&dr(t))}}function Si(i){let e;if(i.sources)for(;i.sources.length;){const t=i.sources.pop(),n=i.sourceSlots.pop(),s=t.observers;if(s&&s.length){const r=s.pop(),o=t.observerSlots.pop();n<s.length&&(r.sourceSlots[o]=n,s[n]=r,t.observerSlots[n]=o)}}if(i.tOwned){for(e=i.tOwned.length-1;e>=0;e--)Si(i.tOwned[e]);delete i.tOwned}if(i.owned){for(e=i.owned.length-1;e>=0;e--)Si(i.owned[e]);i.owned=null}if(i.cleanups){for(e=i.cleanups.length-1;e>=0;e--)i.cleanups[e]();i.cleanups=null}i.state=0}function So(i){return i instanceof Error?i:new Error(typeof i=="string"?i:"Unknown error",{cause:i})}function pr(i,e=U){throw So(i)}const Po=Symbol("fallback");function Ta(i){for(let e=0;e<i.length;e++)i[e]()}function To(i,e,t={}){let n=[],s=[],r=[],o=0,l=e.length>1?[]:null;return vo(()=>Ta(r)),()=>{let h=i()||[],c=h.length,f,d;return h[Hs],nt(()=>{let A,E,M,S,D,K,ae,T,te;if(c===0)o!==0&&(Ta(r),r=[],n=[],s=[],o=0,l&&(l=[])),t.fallback&&(n=[Po],s[0]=Ii(Gt=>(r[0]=Gt,t.fallback())),o=1);else if(o===0){for(s=new Array(c),d=0;d<c;d++)n[d]=h[d],s[d]=Ii(m);o=c}else{for(M=new Array(c),S=new Array(c),l&&(D=new Array(c)),K=0,ae=Math.min(o,c);K<ae&&n[K]===h[K];K++);for(ae=o-1,T=c-1;ae>=K&&T>=K&&n[ae]===h[T];ae--,T--)M[T]=s[ae],S[T]=r[ae],l&&(D[T]=l[ae]);for(A=new Map,E=new Array(T+1),d=T;d>=K;d--)te=h[d],f=A.get(te),E[d]=f===void 0?-1:f,A.set(te,d);for(f=K;f<=ae;f++)te=n[f],d=A.get(te),d!==void 0&&d!==-1?(M[d]=s[f],S[d]=r[f],l&&(D[d]=l[f]),d=E[d],A.set(te,d)):r[f]();for(d=K;d<c;d++)d in M?(s[d]=M[d],r[d]=S[d],l&&(l[d]=D[d],l[d](d))):s[d]=Ii(m);s=s.slice(0,o=c),n=h.slice(0)}return s});function m(A){if(r[d]=A,l){const[E,M]=lr(d);return l[d]=M,e(h[d],E)}return e(h[d])}}}function Yh(i,e){return nt(()=>i(e||{}))}const No=i=>`Stale read from <${i}>.`;function Zh(i){const e="fallback"in i&&{fallback:()=>i.fallback};return fi(To(()=>i.each,i.children,e||void 0))}function Xh(i){const e=i.keyed,t=fi(()=>i.when,void 0,void 0),n=e?t:fi(t,void 0,{equals:(s,r)=>!s==!r});return fi(()=>{const s=n();if(s){const r=i.children;return typeof r=="function"&&r.length>0?nt(()=>r(e?s:()=>{if(!nt(n))throw No("Show");return t()})):r}return i.fallback},void 0,void 0)}const ko=new Set(["innerHTML","textContent","innerText","children"]),Do=Object.assign(Object.create(null),{className:"class",htmlFor:"for"}),Co=new Set(["beforeinput","click","dblclick","contextmenu","focusin","focusout","input","keydown","keyup","mousedown","mousemove","mouseout","mouseover","mouseup","pointerdown","pointermove","pointerout","pointerover","pointerup","touchend","touchmove","touchstart"]),Io={xlink:"http://www.w3.org/1999/xlink",xml:"http://www.w3.org/XML/1998/namespace"},Jh=i=>fi(()=>i());function Ro(i,e,t){let n=t.length,s=e.length,r=n,o=0,l=0,h=e[s-1].nextSibling,c=null;for(;o<s||l<r;){if(e[o]===t[l]){o++,l++;continue}for(;e[s-1]===t[r-1];)s--,r--;if(s===o){const f=r<n?l?t[l-1].nextSibling:t[r-l]:h;for(;l<r;)i.insertBefore(t[l++],f)}else if(r===l)for(;o<s;)(!c||!c.has(e[o]))&&e[o].remove(),o++;else if(e[o]===t[r-1]&&t[l]===e[s-1]){const f=e[--s].nextSibling;i.insertBefore(t[l++],e[o++].nextSibling),i.insertBefore(t[--r],f),e[s]=t[r]}else{if(!c){c=new Map;let d=l;for(;d<r;)c.set(t[d],d++)}const f=c.get(e[o]);if(f!=null)if(l<f&&f<r){let d=o,m=1,A;for(;++d<s&&d<r&&!((A=c.get(e[d]))==null||A!==f+m);)m++;if(m>f-l){const E=e[o];for(;l<f;)i.insertBefore(t[l++],E)}else i.replaceChild(t[l++],e[o++])}else o++;else e[o++].remove()}}}const Na="_$DX_DELEGATE";function $h(i,e,t,n={}){let s;return Ii(r=>{s=r,e===document?i():_o(e,i(),e.firstChild?null:void 0,t)},n.owner),()=>{s(),e.textContent=""}}function ec(i,e,t,n){let s;const r=()=>{const l=n?document.createElementNS("http://www.w3.org/1998/Math/MathML","template"):document.createElement("template");return l.innerHTML=i,t?l.content.firstChild.firstChild:n?l.firstChild:l.content.firstChild},o=e?()=>nt(()=>document.importNode(s||(s=r()),!0)):()=>(s||(s=r())).cloneNode(!0);return o.cloneNode=o,o}function xo(i,e=window.document){const t=e[Na]||(e[Na]=new Set);for(let n=0,s=i.length;n<s;n++){const r=i[n];t.has(r)||(t.add(r),e.addEventListener(r,Ho))}}function qs(i,e,t){t==null?i.removeAttribute(e):i.setAttribute(e,t)}function Oo(i,e,t,n){n==null?i.removeAttributeNS(e,t):i.setAttributeNS(e,t,n)}function Vo(i,e,t){t?i.setAttribute(e,""):i.removeAttribute(e)}function Lo(i,e){e==null?i.removeAttribute("class"):i.className=e}function Fo(i,e,t,n){if(n)Array.isArray(t)?(i[`$$${e}`]=t[0],i[`$$${e}Data`]=t[1]):i[`$$${e}`]=t;else if(Array.isArray(t)){const s=t[0];i.addEventListener(e,t[0]=r=>s.call(i,t[1],r))}else i.addEventListener(e,t,typeof t!="function"&&t)}function Bo(i,e,t={}){const n=Object.keys(e||{}),s=Object.keys(t);let r,o;for(r=0,o=s.length;r<o;r++){const l=s[r];!l||l==="undefined"||e[l]||(ka(i,l,!1),delete t[l])}for(r=0,o=n.length;r<o;r++){const l=n[r],h=!!e[l];!l||l==="undefined"||t[l]===h||!h||(ka(i,l,!0),t[l]=h)}return t}function Uo(i,e,t){if(!e)return t?qs(i,"style"):e;const n=i.style;if(typeof e=="string")return n.cssText=e;typeof t=="string"&&(n.cssText=t=void 0),t||(t={}),e||(e={});let s,r;for(r in t)e[r]==null&&n.removeProperty(r),delete t[r];for(r in e)s=e[r],s!==t[r]&&(n.setProperty(r,s),t[r]=s);return t}function tc(i,e,t){t!=null?i.style.setProperty(e,t):i.style.removeProperty(e)}function nc(i,e={},t,n){const s={};return Mi(()=>typeof e.ref=="function"&&Go(e.ref,i)),Mi(()=>Wo(i,e,t,!0,s,!0)),s}function Go(i,e,t){return nt(()=>i(e,t))}function _o(i,e,t,n){if(t!==void 0&&!n&&(n=[]),typeof e!="function")return ys(i,e,n,t);Mi(s=>ys(i,e(),s,t),n)}function Wo(i,e,t,n,s={},r=!1){e||(e={});for(const o in s)if(!(o in e)){if(o==="children")continue;s[o]=Da(i,o,null,s[o],t,r,e)}for(const o in e){if(o==="children")continue;const l=e[o];s[o]=Da(i,o,l,s[o],t,r,e)}}function zo(i){return i.toLowerCase().replace(/-([a-z])/g,(e,t)=>t.toUpperCase())}function ka(i,e,t){const n=e.trim().split(/\s+/);for(let s=0,r=n.length;s<r;s++)i.classList.toggle(n[s],t)}function Da(i,e,t,n,s,r,o){let l,h,c,f;if(e==="style")return Uo(i,t,n);if(e==="classList")return Bo(i,t,n);if(t===n)return n;if(e==="ref")r||t(i);else if(e.slice(0,3)==="on:"){const d=e.slice(3);n&&i.removeEventListener(d,n,typeof n!="function"&&n),t&&i.addEventListener(d,t,typeof t!="function"&&t)}else if(e.slice(0,10)==="oncapture:"){const d=e.slice(10);n&&i.removeEventListener(d,n,!0),t&&i.addEventListener(d,t,!0)}else if(e.slice(0,2)==="on"){const d=e.slice(2).toLowerCase(),m=Co.has(d);if(!m&&n){const A=Array.isArray(n)?n[0]:n;i.removeEventListener(d,A)}(m||t)&&(Fo(i,d,t,m),m&&xo([d]))}else if(e.slice(0,5)==="attr:")qs(i,e.slice(5),t);else if(e.slice(0,5)==="bool:")Vo(i,e.slice(5),t);else if((f=e.slice(0,5)==="prop:")||(c=ko.has(e))||(l=i.nodeName.includes("-")||"is"in o))f&&(e=e.slice(5),h=!0),e==="class"||e==="className"?Lo(i,t):l&&!h&&!c?i[zo(e)]=t:i[e]=t;else{const d=e.indexOf(":")>-1&&Io[e.split(":")[0]];d?Oo(i,d,e,t):qs(i,Do[e]||e,t)}return t}function Ho(i){let e=i.target;const t=`$$${i.type}`,n=i.target,s=i.currentTarget,r=h=>Object.defineProperty(i,"target",{configurable:!0,value:h}),o=()=>{const h=e[t];if(h&&!e.disabled){const c=e[`${t}Data`];if(c!==void 0?h.call(e,c,i):h.call(e,i),i.cancelBubble)return}return e.host&&typeof e.host!="string"&&!e.host._$host&&e.contains(i.target)&&r(e.host),!0},l=()=>{for(;o()&&(e=e._$host||e.parentNode||e.host););};if(Object.defineProperty(i,"currentTarget",{configurable:!0,get(){return e||document}}),i.composedPath){const h=i.composedPath();r(h[0]);for(let c=0;c<h.length-2&&(e=h[c],!!o());c++){if(e._$host){e=e._$host,l();break}if(e.parentNode===s)break}}else l();r(n)}function ys(i,e,t,n,s){for(;typeof t=="function";)t=t();if(e===t)return t;const r=typeof e,o=n!==void 0;if(i=o&&t[0]&&t[0].parentNode||i,r==="string"||r==="number"){if(r==="number"&&(e=e.toString(),e===t))return t;if(o){let l=t[0];l&&l.nodeType===3?l.data!==e&&(l.data=e):l=document.createTextNode(e),t=_t(i,t,n,l)}else t!==""&&typeof t=="string"?t=i.firstChild.data=e:t=i.textContent=e}else if(e==null||r==="boolean")t=_t(i,t,n);else{if(r==="function")return Mi(()=>{let l=e();for(;typeof l=="function";)l=l();t=ys(i,l,t,n)}),()=>t;if(Array.isArray(e)){const l=[],h=t&&Array.isArray(t);if(Ks(l,e,t,s))return Mi(()=>t=ys(i,l,t,n,!0)),()=>t;if(l.length===0){if(t=_t(i,t,n),o)return t}else h?t.length===0?Ca(i,l,n):Ro(i,t,l):(t&&_t(i),Ca(i,l));t=l}else if(e.nodeType){if(Array.isArray(t)){if(o)return t=_t(i,t,n,e);_t(i,t,null,e)}else t==null||t===""||!i.firstChild?i.appendChild(e):i.replaceChild(e,i.firstChild);t=e}}return t}function Ks(i,e,t,n){let s=!1;for(let r=0,o=e.length;r<o;r++){let l=e[r],h=t&&t[i.length],c;if(!(l==null||l===!0||l===!1))if((c=typeof l)=="object"&&l.nodeType)i.push(l);else if(Array.isArray(l))s=Ks(i,l,h)||s;else if(c==="function")if(n){for(;typeof l=="function";)l=l();s=Ks(i,Array.isArray(l)?l:[l],Array.isArray(h)?h:[h])||s}else i.push(l),s=!0;else{const f=String(l);h&&h.nodeType===3&&h.data===f?i.push(h):i.push(document.createTextNode(f))}}return s}function Ca(i,e,t=null){for(let n=0,s=e.length;n<s;n++)i.insertBefore(e[n],t)}function _t(i,e,t,n){if(t===void 0)return i.textContent="";const s=n||document.createTextNode("");if(e.length){let r=!1;for(let o=e.length-1;o>=0;o--){const l=e[o];if(s!==l){const h=l.parentNode===i;!r&&!o?h?i.replaceChild(s,l):i.insertBefore(s,t):h&&l.remove()}else r=!0}}else i.insertBefore(s,t);return[s]}async function jo(i={echoCancellation:!1,noiseSuppression:!0,autoGainControl:!0},e=""){try{return await navigator.mediaDevices.getUserMedia({audio:e?{...i,deviceId:{exact:e}}:i})}catch(t){if(e&&t.name==="OverconstrainedError")return console.warn("Requested audio input device unavailable, falling back to default"),navigator.mediaDevices.getUserMedia({audio:i});throw t}}const qo={KeyZ:48,KeyS:49,KeyX:50,KeyD:51,KeyC:52,KeyV:53,KeyG:54,KeyB:55,KeyH:56,KeyN:57,KeyJ:58,KeyM:59,Comma:60,KeyL:61,Period:62,Semicolon:63,Slash:64,KeyQ:60,Digit2:61,KeyW:62,Digit3:63,KeyE:64,KeyR:65,Digit5:66,KeyT:67,Digit6:68,KeyY:69,Digit7:70,KeyU:71,KeyI:72,Digit9:73,KeyO:74,Digit0:75,KeyP:76,BracketLeft:77,Equal:78,BracketRight:79,Numpad1:60,Numpad2:62,Numpad3:64,Numpad4:65,Numpad5:67,Numpad6:69,Numpad7:71,Numpad8:72,Numpad9:74};function Cs(i){const{baseNote:e,scale:t}=i;if(t.length===0)throw new RangeError("scale must contain at least one interval");const n=[["KeyZ","KeyX","KeyC","KeyV","KeyB","KeyN","KeyM","Comma","Period","Slash"],["KeyA","KeyS","KeyD","KeyF","KeyG","KeyH","KeyJ","KeyK","KeyL","Semicolon","Quote","Backslash"],["KeyQ","KeyW","KeyE","KeyR","KeyT","KeyY","KeyU","KeyI","KeyO","KeyP","BracketLeft","BracketRight"],["Digit1","Digit2","Digit3","Digit4","Digit5","Digit6","Digit7","Digit8","Digit9","Digit0","Minus","Equal"]],s={};return n.forEach((r,o)=>{const l=e+o*12;r.forEach((h,c)=>{const f=c%t.length,d=Math.floor(c/t.length);s[h]=l+d*12+t[f]})}),["Numpad1","Numpad2","Numpad3","Numpad4","Numpad5","Numpad6","Numpad7","Numpad8","Numpad9"].forEach((r,o)=>{const l=o%t.length,h=Math.floor(o/t.length);s[r]=e+36+h*12+t[l]}),s}const Ko=Cs({baseNote:36,scale:[0,2,4,5,7,9,11]}),Qo=Cs({baseNote:36,scale:[0,2,3,5,7,8,10]}),Yo=Cs({baseNote:36,scale:[0,2,4,7,9]}),Zo=Cs({baseNote:48,scale:[0,1,2,3,4,5,6,7,8,9,10,11]}),ic="major",sc={piano:qo,major:Ko,minor:Qo,pentatonic:Yo,chromatic:Zo};var Xo=Object.defineProperty,fr=i=>{throw TypeError(i)},Jo=(i,e,t)=>e in i?Xo(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t,b=(i,e,t)=>Jo(i,typeof e!="symbol"?e+"":e,t),Ea=(i,e,t)=>e.has(i)||fr("Cannot "+t),a=(i,e,t)=>(Ea(i,e,"read from private field"),t?t.call(i):e.get(i)),p=(i,e,t)=>e.has(i)?fr("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(i):e.set(i,t),u=(i,e,t,n)=>(Ea(i,e,"write to private field"),e.set(i,t),t),y=(i,e,t)=>(Ea(i,e,"access private method"),t),xs=(i,e,t,n)=>({set _(s){u(i,e,s)},get _(){return a(i,e,n)}});const $o=48e3,mr={sampleRate:$o};function el(i,e=!1){if(i==null)return!1;const t=.001,n=240,s=1,r=2;if(i.duration<t)return console.warn(`Audio duration is too short: ${i.duration} seconds. Must be longer than ${t} seconds`),!1;if(i.duration>n)return console.warn(`Audio duration is too long: ${i.duration} seconds. Must be shorter than ${n} seconds`),!1;if(i.numberOfChannels<s||i.numberOfChannels>r)return console.warn("Invalid number of audio channels."),!1;let o=!1,l=0,h=0;for(let c=0;c<i.numberOfChannels;c++)try{const f=i.getChannelData(c);if(!f||f.length===0)return!1;let d=0;for(let A=0;A<f.length;A++){const E=Math.abs(f[A]);E>0&&(o=!0),E>l&&(l=E),d+=E*E}const m=Math.sqrt(d/f.length);if(m>h&&(h=m),o)break}catch{return!1}if(o){if(e){const c=20*Math.log10(l),f=20*Math.log10(h);console.log(`AudioBuffer Analysis:
      Duration: ${i.duration} seconds
      Peak amplitude: ${l.toFixed(4)} (${c.toFixed(1)} dB)
      RMS amplitude: ${h.toFixed(4)} (${f.toFixed(1)} dB)
    `)}}else console.warn("Invalid Buffer: No non-zero data.");return o}var mi,bs,De,gt,Ue,Ht,jt,qt,gi,An,ge,gr,Ia,yr,Qs,Ys,Ln;class Ra{constructor(e,t,n,s=1024){p(this,ge),p(this,mi),p(this,bs),p(this,De),p(this,gt),p(this,Ue),p(this,Ht),p(this,jt),p(this,qt,null),p(this,gi,new Map),p(this,An,null),u(this,mi,e),u(this,bs,t),u(this,De,n),u(this,gt,e.createAnalyser()),u(this,Ue,e.createAnalyser()),a(this,gt).fftSize=s,a(this,Ue).fftSize=s,u(this,Ht,new Float32Array(a(this,gt).fftSize)),u(this,jt,new Float32Array(a(this,Ue).fftSize))}start(e=1e3,t,n=!1){return this.stop(),y(this,ge,gr).call(this),u(this,qt,window.setInterval(()=>{const s=this.getLevels();t&&t(s),n&&y(this,ge,yr).call(this,s)},e)),this}getLevels(){a(this,gt).getFloatTimeDomainData(a(this,Ht)),a(this,Ue).getFloatTimeDomainData(a(this,jt));const e=y(this,ge,Qs).call(this,a(this,Ht)),t=y(this,ge,Qs).call(this,a(this,jt)),n=y(this,ge,Ys).call(this,a(this,Ht)),s=y(this,ge,Ys).call(this,a(this,jt)),r=y(this,ge,Ln).call(this,e),o=y(this,ge,Ln).call(this,t),l=y(this,ge,Ln).call(this,n),h=y(this,ge,Ln).call(this,s),c=l-h;return{input:{rms:e,peak:n,rmsDB:r,peakDB:l},output:{rms:t,peak:s,rmsDB:o,peakDB:h},gainChange:c,gainChangeDB:c}}stop(){if(a(this,qt)){window.clearInterval(a(this,qt)),u(this,qt,null);try{a(this,gt).disconnect(),a(this,Ue).disconnect(),a(this,An)&&(a(this,An).disconnect(),u(this,An,null));const e=a(this,gi).get(a(this,De));if(e){a(this,De).disconnect();for(const t of e)t.node instanceof AudioNode?a(this,De).connect(t.node,t.output,t.input):t.node instanceof AudioParam&&a(this,De).connect(t.node,t.output)}a(this,gi).clear()}catch(e){console.error("Error removing level monitoring:",e)}}}}mi=new WeakMap,bs=new WeakMap,De=new WeakMap,gt=new WeakMap,Ue=new WeakMap,Ht=new WeakMap,jt=new WeakMap,qt=new WeakMap,gi=new WeakMap,An=new WeakMap,ge=new WeakSet,gr=function(){try{const i=y(this,ge,Ia).call(this,a(this,De));a(this,gi).set(a(this,De),i);const e=a(this,mi).createGain();e.gain.value=1,a(this,bs).connect(e),e.connect(a(this,gt)),a(this,De).disconnect(),a(this,De).connect(a(this,Ue));for(const t of i)t.node instanceof AudioNode?a(this,Ue).connect(t.node,t.output,t.input):t.node instanceof AudioParam&&a(this,Ue).connect(t.node,t.output);u(this,An,e)}catch(i){console.error("Error setting up level monitoring:",i)}},Ia=function(i){return[{node:a(this,mi).destination,output:0,input:0}]},yr=function(i){console.log(`Audio Levels:
       Input:  RMS ${i.input.rmsDB.toFixed(1)} dB | Peak ${i.input.peakDB.toFixed(1)} dB
       Output: RMS ${i.output.rmsDB.toFixed(1)} dB | Peak ${i.output.peakDB.toFixed(1)} dB
       Gain Change: ${i.gainChangeDB>0?"+":""}${i.gainChangeDB.toFixed(1)} dB`)},Qs=function(i){let e=0;for(let t=0;t<i.length;t++)e+=i[t]*i[t];return Math.sqrt(e/i.length)},Ys=function(i){let e=0;for(let t=0;t<i.length;t++){const n=Math.abs(i[t]);n>e&&(e=n)}return e},Ln=function(i){return i<1e-7?-100:20*Math.log10(i)};function xa(i,e,t=.9){const n=e.numberOfChannels,s=e.length,r=e.sampleRate;let o=0;for(let c=0;c<n;c++){const f=e.getChannelData(c);for(let d=0;d<s;d++){const m=Math.abs(f[d]);m>o&&(o=m)}}if(o===0)return e;const l=t/o,h=i.createBuffer(n,s,r);for(let c=0;c<n;c++){const f=e.getChannelData(c),d=h.getChannelData(c);for(let m=0;m<s;m++)d[m]=f[m]*l}return h}const tl=1e-4;function Oa(i,e=tl){const t=i.getChannelData(0),n=i.sampleRate,s=[];for(let r=1;r<t.length;r++)if(Math.abs(t[r])<e)s.push(r/n);else if(Math.sign(t[r])!==Math.sign(t[r-1])){const o=-t[r-1]/(t[r]-t[r-1]),l=(r-1+o)/n;s.push(l)}return s}const br=["pulse","bandlimited-sawtooth","supersaw","warm-pad","metallic","formant","white-noise","pink-noise","brown-noise","colored-noise","random-harmonic","custom-function"],ac=["sine","sawtooth","square","triangle",...br];function nl(i){return br.includes(i)}function il(i,e,t={}){switch(e){case"pulse":return sl(i,{dutyCycle:t.dutyCycle,harmonics:t.harmonics});case"bandlimited-sawtooth":return al(i,{harmonics:t.harmonics,rolloff:t.rolloff});case"supersaw":return rl(i,{voices:t.voices,detune:t.detune,harmonics:t.harmonics});case"warm-pad":return ol(i,{brightness:t.brightness,harmonics:t.harmonics});case"metallic":return ll(i,{inharmonicity:t.inharmonicity,harmonics:t.harmonics});case"formant":return hl(i,{formantFreqs:t.formantFreqs,formantBandwidths:t.formantBandwidths,fundamentalFreq:t.fundamentalFreq,harmonics:t.harmonics});case"white-noise":return ul(i,{harmonics:t.harmonics,seed:t.seed});case"pink-noise":return dl(i,{harmonics:t.harmonics,seed:t.seed});case"brown-noise":return pl(i,{harmonics:t.harmonics,seed:t.seed});case"colored-noise":return fl(i,{slope:t.slope,harmonics:t.harmonics,seed:t.seed});case"random-harmonic":return ml(i,{chaos:t.chaos,harmonicDensity:t.harmonicDensity,harmonics:t.harmonics,seed:t.seed});case"custom-function":return cl(i,t.waveFunction||(n=>Math.sin(n)),{harmonics:t.harmonics});default:throw new Error(`Invalid waveform type: ${e}`)}}function sl(i,e={}){const{dutyCycle:t=.5,harmonics:n=32}=e,s=new Float32Array(n+1),r=new Float32Array(n+1);for(let o=1;o<=n;o++)s[o]=0,r[o]=2/Math.PI*Math.sin(o*Math.PI*t)/o;return i.createPeriodicWave(s,r,{disableNormalization:!1})}function al(i,e={}){const{harmonics:t=32,rolloff:n=1}=e,s=new Float32Array(t+1),r=new Float32Array(t+1);for(let o=1;o<=t;o++)s[o]=0,r[o]=1/o*Math.pow(o,-n+1),o%2===0&&(r[o]*=-1);return i.createPeriodicWave(s,r,{disableNormalization:!1})}function rl(i,e={}){const{voices:t=7,detune:n=25,harmonics:s=16}=e,r=new Float32Array(s+1),o=new Float32Array(s+1);for(let l=0;l<t;l++){const h=l===0?0:(l%2===1?1:-1)*Math.ceil(l/2)*(n/Math.ceil(t/2)),c=Math.pow(2,h/1200);for(let f=1;f<=s;f++){const d=f*c;if(d<=s){const m=1/t*(1/f);o[Math.floor(d)]+=m*(f%2===1?1:-1)}}}return i.createPeriodicWave(r,o,{disableNormalization:!1})}function ol(i,e={}){const{brightness:t=.3,harmonics:n=64}=e,s=new Float32Array(n+1),r=new Float32Array(n+1);for(let o=1;o<=n;o++){const l=1/o*Math.exp(-o*(1-t)*.1);o%2===1&&(r[o]=l),o%2===0&&o<=n/2&&(r[o]=l*.3)}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function ll(i,e={}){const{inharmonicity:t=.2,harmonics:n=32}=e,s=new Float32Array(n+1),r=new Float32Array(n+1);for(let o=1;o<=n;o++){const l=Math.sqrt(1+t*o*o),h=Math.round(o*l);if(h<=n){const c=1/(o*o);s[h]+=c*.3,r[h]+=c*.7}}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function hl(i,e={}){const{formantFreqs:t=[800,1200,2600],formantBandwidths:n=[80,120,260],fundamentalFreq:s=440,harmonics:r=64}=e,o=new Float32Array(r+1),l=new Float32Array(r+1);for(let h=1;h<=r;h++){const c=h*s;let f=1/h;for(let d=0;d<t.length;d++){const m=t[d],A=n[d]||100,E=Math.abs(c-m),M=1/(1+Math.pow(E/A,2));f*=1+M*2}l[h]=f*(h%2===1?1:-1)}return i.createPeriodicWave(o,l,{disableNormalization:!1})}function cl(i,e,t={}){const{harmonics:n=32}=t,s=new Float32Array(n+1),r=new Float32Array(n+1),o=2048,l=new Float32Array(o);for(let h=0;h<o;h++){const c=h/o*2*Math.PI;l[h]=e(c)}for(let h=1;h<=n;h++){let c=0,f=0;for(let d=0;d<o;d++){const m=d/o*2*Math.PI*h;c+=l[d]*Math.cos(m),f+=l[d]*Math.sin(m)}s[h]=c/o,r[h]=f/o}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function ul(i,e={}){const{harmonics:t=64,seed:n}=e,s=new Float32Array(t+1),r=new Float32Array(t+1);let o=n!==void 0?n:Math.random()*1e6;const l=()=>(o=(o*9301+49297)%233280,o/233280);for(let h=1;h<=t;h++){const c=1/Math.sqrt(t),f=l()*2*Math.PI;s[h]=c*Math.cos(f),r[h]=c*Math.sin(f)}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function dl(i,e={}){const{harmonics:t=64,seed:n}=e,s=new Float32Array(t+1),r=new Float32Array(t+1);let o=n!==void 0?n:Math.random()*1e6;const l=()=>(o=(o*9301+49297)%233280,o/233280);for(let h=1;h<=t;h++){const c=1/Math.sqrt(h*t),f=l()*2*Math.PI;s[h]=c*Math.cos(f),r[h]=c*Math.sin(f)}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function pl(i,e={}){const{harmonics:t=64,seed:n}=e,s=new Float32Array(t+1),r=new Float32Array(t+1);let o=n!==void 0?n:Math.random()*1e6;const l=()=>(o=(o*9301+49297)%233280,o/233280);for(let h=1;h<=t;h++){const c=1/(h*Math.sqrt(t)),f=l()*2*Math.PI;s[h]=c*Math.cos(f),r[h]=c*Math.sin(f)}return i.createPeriodicWave(s,r,{disableNormalization:!1})}function fl(i,e={}){const{slope:t=0,harmonics:n=64,seed:s}=e,r=new Float32Array(n+1),o=new Float32Array(n+1);let l=s!==void 0?s:Math.random()*1e6;const h=()=>(l=(l*9301+49297)%233280,l/233280);for(let c=1;c<=n;c++){const f=1/(Math.pow(c,t/2)*Math.sqrt(n)),d=h()*2*Math.PI;r[c]=f*Math.cos(d),o[c]=f*Math.sin(d)}return i.createPeriodicWave(r,o,{disableNormalization:!1})}function ml(i,e={}){const{chaos:t=.5,harmonicDensity:n=.7,harmonics:s=32,seed:r}=e,o=new Float32Array(s+1),l=new Float32Array(s+1);let h=r!==void 0?r:Math.random()*1e6;const c=()=>(h=(h*9301+49297)%233280,h/233280);for(let f=1;f<=s;f++)if(c()<n){const d=1/f,m=1+(c()-.5)*2*t,A=d*m,E=c()*2*Math.PI;c()>.5?o[f]=A*Math.cos(E):l[f]=A*Math.sin(E)}return i.createPeriodicWave(o,l,{disableNormalization:!1})}const Ar=[["C"],["C#","Db"],["D"],["D#","Eb"],["E"],["F"],["F#","Gb"],["G"],["G#","Ab"],["A"],["A#","Bb"],["B"]],gl={C:0,"C#":1,Db:1,D:2,"D#":3,Eb:3,E:4,F:5,"F#":6,Gb:6,G:7,"G#":8,Ab:8,A:9,"A#":10,Bb:10,B:11},yl={chromatic:[0,1,2,3,4,5,6,7,8,9,10,11],major:[0,2,4,5,7,9,11],minor:[0,2,3,5,7,8,10],harmonic_minor:[0,2,3,5,7,8,11],melodic_minor:[0,2,3,5,7,9,11],lydian:[0,2,4,6,7,9,10],dorian:[0,2,3,5,7,9,10],phrygian:[0,1,3,5,7,8,10],mixolydian:[0,2,4,5,7,9,10],locrian:[0,1,3,5,6,8,10],diminished:[0,2,3,5,6,8,9,11],augmented:[0,3,4,8,9],major_pentatonic:[0,2,4,7,9],minor_pentatonic:[0,2,3,7,8],blues:[0,3,5,6,7,10],whole_tone:[0,2,4,6,8,10]};function bl(i,e=440){return e*Math.pow(2,(i-69)/12)}function Al(i,e="semitones",t=440,n){const s=12*Math.log2(i/t)+69;return e==="semitones"?Math.round(s):s}function vl(i=0,e=9,t=440,n=4){const s=[],r=Math.pow(2,.08333333333333333),o=57;for(let l=i*12;l<=e*12+(e===8?0:11);l++){const h=t*Math.pow(r,l-o);s.push(Number(h.toFixed(n)))}return s}function Va(i){return typeof i=="number"&&Number.isInteger(i)&&i>=0&&i<=127}function Os(i,e=60){return Math.pow(2,(i-e)/12)}const Ma=vl(0,9),wl=Ma.map(i=>1/i),El=Array.from({length:Ma.length},(i,e)=>{const t=Math.floor(e/12)-1,n=e%12;return`${Ar[n][0]}${t}`}),Ml=Ar,Ri=gl,As=Ma,Sl=wl,vr=El,wr=yl,Er=i=>{const e=As.reduce((n,s)=>Math.abs(s-i)<Math.abs(n-i)?s:n),t=Al(e);return Pl(t)};function Pl(i){const e=bl(i),t=Math.floor(i/12)-1,n=i%12;return{name:Ml[n][0],octave:t,midiNote:i,frequency:e,period:1/e}}function Tl(){const i={};return vr.forEach((e,t)=>{i[e]=As[t]}),Nl(i),kl(i)}function Nl(i){const e=[["C#","Db"],["D#","Eb"],["F#","Gb"],["G#","Ab"],["A#","Bb"]];for(let t=0;t<=8;t++)for(const[n,s]of e){const r=`${n}${t}`,o=`${s}${t}`;r in i&&!(o in i)?i[o]=i[r]:o in i&&!(r in i)&&(i[r]=i[o])}}function kl(i){return Object.fromEntries(Object.entries(i).sort((e,t)=>e[1]-t[1]))}const Dl=Tl();Object.fromEntries(Object.entries(Dl).map(([i,e])=>[i,1/e]));function Cl(i,e,t=0,n=8){if(!Ri[i]&&Ri[i]!==0)throw new Error(`Unknown root note: ${i}`);const s=[...typeof e=="string"?wr[e]:e],r=Ri[i],o=[],l=[],h=[];for(let c=t;c<=n;c++)s.forEach(f=>{const d=c*12+(r+f)%12;d<As.length&&(o.push(As[d]),l.push(Sl[d]),h.push(vr[d]))});return{rootIdx:r,frequencies:o,periodsInSec:l,scalePattern:s,noteNames:h}}function Il(i,e){const t=Math.pow(2,e/12);return i.map(n=>n/t)}function Se(i,e,t){if(!i){const n=t?`
Context: ${JSON.stringify(t)}`:"";throw new Error(`Assertion failed${e?`: ${e}`:""}${n}`)}}function Rl(i){return typeof i=="object"&&i!==null&&typeof i.then=="function"}async function xi(i,e,t=!0){if(typeof i!="function")throw new Error("tryCatch argument must be a function");try{const n=i();if(Rl(n))try{return{data:await n,error:null}}catch(s){return La(s,e,t)}return{data:n,error:null}}catch(n){return La(n,e,t)}}function La(i,e,t=!0){if(t){const n=i.message??i;console.error(n)}return{data:null,error:i}}var Fn;class xl{constructor(){p(this,Fn,null);try{if(typeof window>"u"||typeof AudioContext>"u"){console.error("Environment util: Window or AudioContext is undefined");return}const e=window.AudioContext||window.webkitAudioContext,t=new e,n=t.createGain().gain,s=typeof navigator<"u"&&"keyboard"in navigator,r=typeof KeyboardEvent<"u"&&typeof KeyboardEvent.prototype.getModifierState=="function";u(this,Fn,{cancelAndHoldSupported:typeof n.cancelAndHoldAtTime=="function",workletSupported:typeof t.audioWorklet=="object",keyboardAPISupported:s,modifierStateSupported:r}),t.close().catch(console.error)}catch{u(this,Fn,{cancelAndHoldSupported:!1,workletSupported:!1,keyboardAPISupported:!1,modifierStateSupported:!1})}}get capabilities(){return a(this,Fn)}}Fn=new WeakMap;const Fa=new xl,Ol=()=>{var i;return!!((i=Fa==null?void 0:Fa.capabilities)!=null&&i.cancelAndHoldSupported)};function Oi(i,e,t){const n=t??i.value;i.cancelScheduledValues(e),i.setValueAtTime(n,e)}function yi(i,e,t){(Array.isArray(i)?i:[i]).forEach(n=>{Ol()?n.cancelAndHoldAtTime(e):(n.cancelScheduledValues(e),n.setValueAtTime(n.value,e))})}function Vl(i,e,t="any",n=r=>r,s=(r,o)=>Math.abs(r-o)){if(i.length===0)throw new Error("Array cannot be empty");if(i.length===1)return 0;const r=e,o=n(i[0]),l=n(i[i.length-1]);if(r<=o)return 0;if(r>=l)return i.length-1;let h=0,c=i.length-1;for(;h<c-1;){const m=Math.floor((h+c)/2),A=n(i[m]);if(A===r)return m;A<r?h=m:c=m}if(t==="left")return h;if(t==="right")return c;const f=s(n(i[h]),r),d=s(n(i[c]),r);return f<=d?h:c}function ki(i,e,t="any",n=r=>r,s=(r,o)=>Math.abs(r-o)){const r=Vl(i,e,t,n,s);return i[r]}const G=(i,e,t,n={warn:!1})=>{if(n.warn&&(i<e||i>t)){const s=n.name?`(${n.name})`:"";console.warn(`Value${s} ${i} is outside range [${e}, ${t}], clamping to ${i<e?e:t}`)}return Math.max(e,Math.min(t,i))},Ce=(i,e,t,n,s,r={warn:!0})=>{if(i<e||i>t){const l=r.name?`(${r.name})`:"";r.warn&&console.warn(`Input value${l} ${i} is outside nominal range [${e}, ${t}]`),i=G(i,e,t)}const o=(i-e)*(s-n)/(t-e)+n;return G(o,Math.min(n,s),Math.max(n,s))};function Ll(i,e){const{inputRange:t,outputRange:n,curve:s="linear"}=e;(i>t.max||i<t.min)&&console.warn("interpolate: Value outside of input range, will be clamped");let r=(Math.max(t.min,Math.min(i,t.max))-t.min)/(t.max-t.min);switch(s){case"linear":break;case"power1":r=Math.pow(r,1/1.5);break;case"power2":r=Math.pow(r,1/2);break;case"power3":r=Math.pow(r,1/3);break;case"power4":r=Math.pow(r,1/4);break;case"expo":r=r===0?0:Math.pow(2,10*(r-1));break;case"log":r=Math.log(1+9*r)/Math.log(10);break;case"sine":r=1-Math.cos(r*Math.PI/2);break;case"circ":r=1-Math.sqrt(1-r*r);break;default:typeof s=="number"&&(r=Math.pow(r,1/s));break}return n.min+r*(n.max-n.min)}function Fl(i,e){const{inputRange:t,outputRange:n,blend:s=1,curve:r="linear"}=e;(i>t.max||i<t.min)&&console.warn("interpolateLinearToExp: Value outside of input range, will be clamped"),n.min<=0&&console.warn("interpolateLinearToExp: Output min must be > 0 for exponential interpolation");let o=(Math.max(t.min,Math.min(i,t.max))-t.min)/(t.max-t.min);const l=Math.max(0,Math.min(s,1)),h=typeof r=="number"?r:r==="smooth"?2:r==="steep"?3:r==="gentle"?1.5:1;h!==1&&(o=Math.pow(o,1/h));const c=n.min+o*(n.max-n.min),f=n.min*Math.pow(n.max/n.min,o);return(1-l)*c+l*f}const Ba=i=>{const e=i.values().next();if(!e.done)return i.delete(e.value),e.value};let Ft=null,bi=null;function Ut(i){return Ft||(Ft=new AudioContext({sampleRate:mr.sampleRate,latencyHint:"interactive"}),Ft.state==="suspended"&&(bi=bi||Mr())),Ft}async function Sa(i){const e=Ut();if(e.state==="running")return e;if(e.state==="closed"){Ft=null;const t=await xi(()=>Sa(i));return Se(t.data instanceof AudioContext&&!t.error,"failed to re-created closed audio context",t.error),t.data}return bi=bi||Mr(),await bi,e}function Mr(){if(typeof document>"u")return Promise.resolve();const i=["click","touchstart","keydown"];return new Promise(e=>{const t=async()=>{Ft&&(await Ft.resume(),i.forEach(n=>document.removeEventListener(n,t)),e())};i.forEach(n=>document.addEventListener(n,t,{once:!0}))})}function Bl(){return typeof AudioContext<"u"&&"setSinkId"in AudioContext.prototype}async function rc(){return(await navigator.mediaDevices.enumerateDevices()).filter(i=>i.kind==="audiooutput")}async function oc(){return(await navigator.mediaDevices.enumerateDevices()).filter(i=>i.kind==="audioinput")}async function lc(i){Se(Bl(),"AudioContext.setSinkId is not supported in this browser"),await(await Sa()).setSinkId(i==="default"?"":i)}const Ul=30,Gl=1e3,_l={off:0,low:.1,medium:.2,high:.3};async function Sr(i,e="medium"){const t=i.getChannelData(0),n=_l[e];let s=0;for(let T=0;T<t.length;T++){const te=Math.abs(t[T]);te>s&&(s=te)}const r=n>0?t.map(T=>Math.abs(T)>n*s?T:0):t,o=Math.floor(i.sampleRate/Gl),l=Math.floor(i.sampleRate/Ul);let h=new Float32Array(l);for(let T=o;T<h.length;T++){let te=0;for(let Gt=0;Gt<r.length-T;Gt++)te+=r[Gt]*r[Gt+T];h[T]=te}let c=o;for(let T=o;T<l;T++)h[T]>h[c]&&(c=T);const f=c,d=h[f-1],m=h[f],A=h[f+1],E=2*(2*m-d-A),M=Math.abs(E)<1e-6?0:(A-d)/E,S=h[c],D=Math.sqrt(r.reduce((T,te)=>T+te*te,0)/r.length),K=S/(D*D*r.length),ae=Math.max(0,Math.min(1,K));return{frequency:i.sampleRate/(f+M),confidence:ae}}function Ua(i,e,t,n){const s=Math.min(e+t,i.length);for(let r=e;r<s;r++){const o=(r-e)/t,l=n==="in"?o:1-o;i[r]*=l}}function Pr(i,e,t,n,s=4){const r=e.numberOfChannels,o=n-t,l=i.createBuffer(r,o,e.sampleRate),h=Math.floor(s/1e3*e.sampleRate);for(let c=0;c<r;c++){const f=e.getChannelData(c),d=l.getChannelData(c);for(let m=0;m<o;m++)d[m]=f[t+m];o>h*2&&h>0&&(Ua(d,0,h,"in"),Ua(d,o-h,h,"out"))}return l}function Wl(i,e,t=.5,n=4,s=1){const r=e.numberOfChannels,o=e.length,l=e.sampleRate;let h=0;for(let d=0;d<r;d++){const m=e.getChannelData(d);for(let A=0;A<o;A++){const E=Math.abs(m[A]);E>h&&(h=E)}}let c=s;if(h>0){const d=.95/(h<=t?h:t+(h-t)/n);c=Math.min(s,d),h>.9&&(c=Math.min(c,1.2))}const f=i.createBuffer(r,o,l);for(let d=0;d<r;d++){const m=e.getChannelData(d),A=f.getChannelData(d);for(let E=0;E<o;E++){const M=m[E],S=Math.abs(M);let D;if(S<=t)D=M*c;else{const K=(S-t)/n,ae=t+K;D=(M<0?-1:1)*ae*c}A[E]=Math.max(-.99,Math.min(.99,D))}}return f}function zl(i){let e=0,t=0,n=0;for(let o=0;o<i.numberOfChannels;o++){const l=i.getChannelData(o);for(let h=0;h<l.length;h++){const c=Math.abs(l[h]);c>e&&(e=c),t+=l[h]*l[h],n++}}const s=n>0?Math.sqrt(t/n):0,r=s>0?e/s:0;return r<5.5?{shouldCompress:!1,crestFactor:r}:r<7?{shouldCompress:!0,crestFactor:r,suggestedSettings:{threshold:.5,ratio:2,makeupGain:1}}:{shouldCompress:!0,crestFactor:r,suggestedSettings:{threshold:.3,ratio:4,makeupGain:1}}}function Hl(i,e,t="samples"){const n=i.numberOfChannels,s=i.sampleRate,r=Array.from({length:n},(c,f)=>i.getChannelData(f));if(r.length===0||!r[0])throw new Error("AudioBuffer must contain at least one audio channel");const o=r[0].length;function l(){for(let c=0;c<o;c++)if(Math.max(...r.map(f=>Math.abs(f[c])))>e)return t==="seconds"?c/s:c;return 0}function h(){for(let c=o-1;c>=0;c--)if(Math.max(...r.map(f=>Math.abs(f[c])))>e)return t==="seconds"?c/s:c;return t==="seconds"?(o-1)/s:o-1}return{start:l(),end:h()}}const Et={normalize:{enabled:!0,maxAmplitudePeak:.99},compress:{enabled:!0},trimSilence:{enabled:!0,threshold:.005},fadeInOutMs:1,tune:{detectPitch:!0,autotune:!0,targetMidiNote:60},hpf:{auto:!0},getZeroCrossings:!0};async function Tr(i,e,t={}){var n,s;const{fadeInOutMs:r=Et.fadeInOutMs,hpf:o=Et.hpf,getZeroCrossings:l=Et.getZeroCrossings}=t;if(t.skipPreProcessing){const M={audiobuffer:e};if(l){const S=Oa(e);M.zeroCrossings=S}return M}const h={...Et.normalize,...t.normalize||{}},c={...Et.compress,...t.compress||{}},f={...Et.trimSilence,...t.trimSilence||{}},d={...Et.tune,...t.tune||{}};let m=e,A={};const E=.35;if(f!=null&&f.enabled){const{start:M,end:S}=Hl(m,f.threshold??.01);m=Pr(i,m,M,S,r)}if(o){if("cutoff"in o)m=await _a(m,o.cutoff??80);else if("auto"in o&&o.auto){const M=await Ga(m);if(M.confidence>=E){const S=M.frequency>30&&M.frequency<350?M.frequency:80;m=await _a(m,S)}}}if(h!=null&&h.enabled&&(m=xa(i,m,h.maxAmplitudePeak)),c!=null&&c.enabled){const M=zl(m);if(M.shouldCompress){const S=c.threshold!==void 0||c.ratio!==void 0||c.makeupGain!==void 0;let D;S&&c.threshold!==void 0?D={threshold:c.threshold??.5,ratio:c.ratio??2,makeupGain:c.makeupGain??1}:D=M.suggestedSettings,m=Wl(i,m,D.threshold,D.ratio,D.makeupGain)}}if(d!=null&&d.detectPitch||d!=null&&d.autotune||o&&"auto"in o&&o.auto){const M=await Ga(m),S=(d==null?void 0:d.targetMidiNote)||60,D=ql(M.midiFloat,S);A.detectedPitch={fundamentalHz:M.frequency,transpositionSemitones:D,confidence:M.confidence}}if(d!=null&&d.autotune&&(!((n=A.detectedPitch)!=null&&n.transpositionSemitones)||A.detectedPitch.confidence<E?console.info("Skipped autotune due to unreliable pitch detection"):Math.abs(((s=A.detectedPitch)==null?void 0:s.transpositionSemitones)??0)<.1?console.info("Skipped autotune - detected pitch is already C"):m=jl(i,m,A.detectedPitch.transpositionSemitones)),h!=null&&h.enabled&&(m=xa(i,m,h.maxAmplitudePeak)),l){const M=Oa(m);A.zeroCrossings=M}return{...A,audiobuffer:m}}function jl(i,e,t){const n=Math.pow(2,t/12),s=e.length,r=Math.round(s/n),o=i.createBuffer(e.numberOfChannels,r,e.sampleRate);for(let l=0;l<e.numberOfChannels;l++){const h=e.getChannelData(l),c=o.getChannelData(l);for(let f=0;f<r;f++){const d=f*n,m=Math.floor(d),A=d-m;m+1<s?c[f]=h[m]*(1-A)+h[m+1]*A:c[f]=h[m]}}return o}async function Ga(i,e=!1){const t=await Sr(i),n=Er(t.frequency),s=69+12*Math.log2(t.frequency/440),r=n.frequency/t.frequency;return e&&console.table({pitchSource:t,targetNoteInfo:n,playbackRateMultiplier:r,midiFloat:s}),{frequency:t.frequency,confidence:t.confidence,midiFloat:s,targetNoteInfo:n}}function ql(i,e){let t=e-i;for(;t>6;)t-=12;for(;t<-6;)t+=12;return t}async function _a(i,e,t=.5){const n=new OfflineAudioContext(i.numberOfChannels,i.length,i.sampleRate),s=n.createBufferSource(),r=n.createBiquadFilter();return r.type="highpass",r.frequency.value=e,r.Q.value=t,s.buffer=i,s.connect(r),r.connect(n.destination),s.start(0),await n.startRendering()}let Kl=-1;const Nr=new Map,We=(i,e)=>{const t=`${++Kl}-${i}`;return Nr.set(t,e),t},ze=i=>{Nr.delete(i)||console.debug("Attempted to unregister a non-existent Node ID: ",i)};function wt(i){const e=new Map;return{sendMessage(t,n){const s=e.get(t);if(s){const r={type:t,senderId:i,...n};s.forEach(o=>o(r))}},onMessage(t,n){e.has(t)||e.set(t,new Set);const s=e.get(t);return s.add(n),()=>s.delete(n)},forwardFrom(t,n,s){const r=s||(l=>({...l})),o=n.map(l=>t.onMessage(l,h=>{const c=r(h);c!==null&&this.sendMessage(c.type,c)}));return()=>o.forEach(l=>l())}}}var Kt,vn,vs,st,He,j,Q,Bn,Vi;class Ql{constructor(e=[],t=[0,1],n,s,r){p(this,Bn),p(this,Kt),p(this,vn,0),p(this,vs,!1),p(this,st),p(this,He,null),p(this,j),p(this,Q),b(this,"updateStartPoint",(o,l)=>{this.updatePoint(a(this,st),o,l)}),b(this,"updateEndPoint",(o,l)=>{this.updatePoint(a(this,Q),o,l)}),b(this,"setValueRange",o=>u(this,Kt,o)),this.points=e,Se(e.length>=2,"EnvelopeData needs at least two points to initialize"),u(this,vn,n),u(this,Kt,t),u(this,st,0),u(this,Q,e.length-1),u(this,He,s!==void 0&&e[s]?s:null),u(this,j,r!==void 0&&e[r]?r:Math.max(0,a(this,Q)-1))}addPoint(e,t,n="exponential"){const s={time:e,value:t,curve:n};if(this.points.length>=2){const o=this.points[this.startPointIndex].time,l=this.points[a(this,Q)].time;if(e<o||e>l){console.warn(`Cannot add point at time ${e}. Must be between ${o} and ${l}`);return}}const r=this.points.findIndex(o=>o.time>e);r===-1?(this.points.push(s),u(this,Q,this.points.length-1)):(this.points.splice(r,0,s),u(this,Q,this.points.length-1),a(this,He)!==null&&r<=a(this,He)&&xs(this,He)._++,a(this,j)!==null&&r<=a(this,j)&&xs(this,j)._++),y(this,Bn,Vi).call(this)}updatePoint(e,t,n){if(e>=0&&e<this.points.length){const s=this.points[e];let r=t??s.time;if(e===1&&r<=this.points[a(this,st)].time||e===a(this,Q)-1&&r>=this.points[a(this,Q)].time)return;this.points[e]={...s,time:r,value:n??s.value}}y(this,Bn,Vi).call(this)}deletePoint(e){this.points.length>2&&e>a(this,st)&&e<a(this,Q)&&(this.points.splice(e,1),u(this,Q,this.points.length-1)),a(this,j)!==null&&(e<a(this,j)?xs(this,j)._--:e===a(this,j)&&u(this,j,a(this,Q)>a(this,j)+1?a(this,j)+1:Math.max(0,a(this,Q)-1))),y(this,Bn,Vi).call(this)}interpolateValueAtTime(e){if(this.points.length===0)return a(this,Kt)[0];if(this.points.length===1)return this.points[0].value;const t=[...this.points].sort((s,r)=>s.time-r.time);let n=0;if(e<=t[0].time)n=t[0].value;else if(e>=t[t.length-1].time)n=t[t.length-1].value;else{n=0;for(let s=0;s<t.length-1;s++){const r=t[s],o=t[s+1];if(e>=r.time&&e<=o.time){const l=o.time-r.time,h=l===0?0:(e-r.time)/l;r.curve==="exponential"&&r.value>0&&o.value>0?n=r.value*Math.pow(o.value/r.value,h):n=r.value+(o.value-r.value)*h;break}}}return n}setSustainPoint(e){if(e==null){u(this,He,null);return}e>=0&&e<this.points.length&&u(this,He,e)}setReleasePoint(e){e>=0&&e<this.points.length?u(this,j,e):console.error("EnvelopeData.setReleasePoint: invalid index")}get startPointIndex(){return a(this,st)}get sustainPointIndex(){return a(this,He)}get releasePointIndex(){return a(this,j)>=this.points.length&&u(this,j,Math.max(0,this.points.length-2)),a(this,j)}get endPointIndex(){return a(this,Q)}get pointValueRange(){return a(this,Kt)}get startTime(){var e;return((e=this.points[a(this,st)])==null?void 0:e.time)??0}get endTime(){var e;return((e=this.points[a(this,Q)])==null?void 0:e.time)??a(this,vn)}get durationSeconds(){return this.endTime-this.startTime}setDurationSeconds(e){u(this,vn,e)}get hasSharpTransitions(){return a(this,vs)}}Kt=new WeakMap,vn=new WeakMap,vs=new WeakMap,st=new WeakMap,He=new WeakMap,j=new WeakMap,Q=new WeakMap,Bn=new WeakSet,Vi=function(){const i=.02*a(this,vn);u(this,vs,this.points.some((e,t)=>t>0&&Math.abs(e.time-this.points[t-1].time)<i))};var Li,de,Un,P,at,Qt,rt,Ge,Qe,J,x,Vt,Vs,Vn,kr,Ve,ue,yt,ot,Ee,Dr,Fi,Cr,Ir,Rr,Bi;class Ls{constructor(e,t,n,s=[],r=[0,1],o=1,l=!0){switch(p(this,x),b(this,"nodeId"),b(this,"nodeType","default-env"),p(this,Li,!1),p(this,de),p(this,Un),p(this,P),p(this,at),b(this,"envelopeType"),p(this,Qt),p(this,rt,!1),p(this,Ge,!1),p(this,Qe,1),p(this,J,1),b(this,"addPoint",(h,c,f)=>{a(this,P).addPoint(h,c,f),a(this,ue)&&u(this,yt,!0)}),b(this,"deletePoint",h=>{a(this,P).deletePoint(h),a(this,ue)&&u(this,yt,!0)}),b(this,"updatePoint",(h,c,f)=>{a(this,P).updatePoint(h,c,f),a(this,ue)&&u(this,yt,!0)}),b(this,"setValueRange",h=>a(this,P).setValueRange(h)),b(this,"enable",()=>u(this,Qt,!0)),b(this,"disable",()=>u(this,Qt,!1)),p(this,Ve,!1),p(this,ue,!1),p(this,yt,!1),p(this,ot,()=>a(this,rt)&&!a(this,Ve)),p(this,Ee,null),p(this,Fi,navigator.userAgent.includes("Firefox")),b(this,"setTimeScale",h=>{u(this,J,h),a(this,ue)&&u(this,yt,!0)}),b(this,"setLoopEnabled",(h,c="normal")=>{c!=="normal"&&console.info("Only default env loop mode implemented. Other modes coming soon!"),u(this,rt,h)}),b(this,"syncToPlaybackRate",h=>{u(this,Ge,h)}),b(this,"setSustainPoint",h=>{a(this,P).setSustainPoint(h),a(this,Ee)&&!a(this,rt)&&!a(this,Ve)&&y(this,x,Rr).call(this)}),b(this,"setReleasePoint",h=>a(this,P).setReleasePoint(h)),this.envelopeType=t,this.nodeType=t,this.nodeId=We(this.envelopeType,this),u(this,de,e),u(this,Un,wt(this.nodeId)),t){case"amp-env":u(this,at,"envGain");break;case"pitch-env":u(this,at,"playbackRate");break;case"filter-env":u(this,at,"lpf");break;case"loop-env":u(this,at,"loopEnd"),console.warn("CustomEnvelope not implemented for type: loop-env");break;default:console.error(`CustomEnvelope not implemented for type: ${t}`),u(this,at,"default");break}u(this,Qt,l),u(this,P,n||new Ql([...s],r,o)),u(this,Li,!0),this.sendUpstreamMessage(`${this.envelopeType}:created`,{})}setSampleDuration(e){return a(this,P).setDurationSeconds(e),this}get initialized(){return a(this,Li)}get data(){return a(this,P)}get param(){return a(this,at)}get isEnabled(){return a(this,Qt)}get points(){return a(this,P).points}get baseDuration(){return a(this,P).endTime-a(this,P).startTime}get effectiveDuration(){return y(this,x,Vt).call(this)}get timeScale(){return a(this,J)}get envPointValueRange(){return a(this,P).pointValueRange}get loopEnabled(){return a(this,rt)}get syncedToPlaybackRate(){return a(this,Ge)}get numPoints(){return a(this,P).points.length}getEffectivePointTime(e){return Se(e>=0&&e<=this.points.length-1),y(this,x,Vt).call(this,a(this,P).startPointIndex,e)}triggerEnvelope(e,t,n={baseValue:1,playbackRate:1}){if(a(this,Fi)){try{const s=a(this,de).currentTime,r=Math.max(s+.001,t);yi(e,r),e.linearRampToValueAtTime(n.baseValue*.8,r+.01),e.linearRampToValueAtTime(n.baseValue*.5,r+.1),console.debug("Firefox trigger envelope - simple linear ramps")}catch(s){console.debug("Firefox trigger envelope failed silently:",s)}u(this,Ve,!1),u(this,Qe,n.playbackRate);return}if(u(this,Ve,!1),u(this,Qe,n.playbackRate),u(this,Ee,{audioParam:e,startTime:t,options:n}),a(this,rt)?y(this,x,Dr).call(this,e,t,n):y(this,x,kr).call(this,e,t,n),!this.releasePoint){console.error("Release point not set, ensure supported by envelope");return}setTimeout(()=>{this.sustainEnabled||a(this,Ve)||(u(this,Ve,!0),n.voiceId!==void 0&&this.sendUpstreamMessage(`${this.envelopeType}:release`,{voiceId:n.voiceId,midiNote:n.midiNote,releasePoint:this.releasePoint,remainingDuration:this.effectiveReleaseDuration}))},this.effectiveReleaseStartTime*1e3)}releaseEnvelope(e,t,n,s=!1){if(a(this,Ve))return;const r=a(this,Ee);if(u(this,Ve,!0),u(this,Ee,null),a(this,Fi)){try{const f=a(this,de).currentTime;e.cancelScheduledValues(f),setTimeout(()=>{try{const d=a(this,de).currentTime;yi(e,d),e.linearRampToValueAtTime(0,d+.1),console.debug("Firefox delayed release envelope - linear ramp to 0")}catch(d){console.debug("Firefox delayed release also failed:",d)}},10)}catch(f){console.debug("Firefox immediate release failed:",f),setTimeout(()=>{try{const d=a(this,de).currentTime;e.setValueAtTime(0,d+.05)}catch(d){console.debug("Firefox very delayed release failed:",d)}},50)}return}const o=Math.max(a(this,de).currentTime,t),l=r?Math.max(0,o-r.startTime):void 0,h=l!==void 0?Math.min(this.baseDuration,l*(a(this,Ge)?r.options.playbackRate:1)*a(this,J)):void 0,c=this.envelopeType==="amp-env"&&(r==null?void 0:r.audioParam)===e&&h!==void 0?y(this,x,Bi).call(this,a(this,P).interpolateValueAtTime(h)*r.options.baseValue):void 0;s&&y(this,x,Cr).call(this,{audioParamValue:e.value,elapsedSeconds:l,envelopeTime:h,releaseStartValue:c,safeStart:o,startTime:t,activeStartTime:r==null?void 0:r.startTime}),y(this,x,Ir).call(this,e,t,this.releasePointIndex,{baseValue:e.value,playbackRate:a(this,Qe),releaseStartValue:c,curveScale:this.envelopeType==="amp-env"?r==null?void 0:r.options.baseValue:void 0,...n})}get sustainPointIndex(){return a(this,P).sustainPointIndex}get releasePointIndex(){return a(this,P).releasePointIndex}get releasePoint(){return this.points[this.releasePointIndex]||null}get effectiveReleaseStartTime(){return this.getEffectivePointTime(this.releasePointIndex)}get baseReleaseDuration(){return this.points[a(this,P).endPointIndex].time-this.points[this.releasePointIndex].time}get effectiveReleaseDuration(){return a(this,Ge)?this.baseReleaseDuration/a(this,Qe)/a(this,J):this.baseReleaseDuration/a(this,J)}get sustainEnabled(){return this.sustainPoint!==null&&!this.loopEnabled}get sustainPoint(){return this.sustainPointIndex!==null?this.points[this.sustainPointIndex]:null}get currentPlaybackRate(){return a(this,Qe)}setCurrentPlaybackRate(e){u(this,Qe,e),a(this,Ge)&&a(this,ue)&&u(this,yt,!0)}onMessage(e,t){return a(this,Un).onMessage(e,t)}sendUpstreamMessage(e,t){return a(this,Un).sendMessage(e,t),this}hasVariation(){var e;const t=((e=this.points[0])==null?void 0:e.value)??0;return this.points.some(n=>Math.abs(n.value-t)>.001)}static getDefaults(e,t=1){switch(e){case"amp-env":return{points:[{time:0,value:0,curve:"exponential"},{time:Math.min(.005,.1*t),value:1,curve:"exponential"},{time:.25*t,value:.75,curve:"exponential"},{time:.9*t,value:.5,curve:"exponential"},{time:t,value:0,curve:"exponential"}],envPointValueRange:[0,1],initEnable:!0,sustainPointIndex:null,releasePointIndex:3};case"pitch-env":return{points:[{time:0,value:1,curve:"exponential"},{time:t,value:1,curve:"exponential"}],envPointValueRange:[.5,1.5],initEnable:!1,sustainPointIndex:null,releasePointIndex:1};case"filter-env":return{points:[{time:0,value:0,curve:"exponential"},{time:.02*t,value:1,curve:"exponential"},{time:.3*t,value:.2,curve:"exponential"},{time:t,value:0,curve:"exponential"}],envPointValueRange:[0,1],initEnable:!1,sustainPointIndex:null,releasePointIndex:2};default:return{points:[{time:0,value:0,curve:"linear"},{time:.1*t,value:1,curve:"linear"},{time:t,value:0,curve:"linear"}],envPointValueRange:[0,1],initEnable:!0,sustainPointIndex:null,releasePointIndex:1}}}dispose(){u(this,rt,!1),ze(this.nodeId)}}Li=new WeakMap,de=new WeakMap,Un=new WeakMap,P=new WeakMap,at=new WeakMap,Qt=new WeakMap,rt=new WeakMap,Ge=new WeakMap,Qe=new WeakMap,J=new WeakMap,x=new WeakSet,Vt=function(i=a(this,P).startPointIndex,e=a(this,P).endPointIndex,t=a(this,Qe),n=a(this,J)){if(i<a(this,P).startPointIndex||e>a(this,P).endPointIndex||i>=e)return 0;const s=this.points[i].time;let r=this.points[e].time-s;return a(this,Ge)&&(r=r/t),r/n},Vs=function(i){return this.envelopeType==="filter-env"?i<1?1e3:750:a(this,P).hasSharpTransitions?1e3:i<1?500:250},Vn=function(i,e=this.baseDuration,t){const n=y(this,x,Vs).call(this,i),s=Math.max(2,Math.floor(i*n)),r=new Float32Array(s),{baseValue:o,minValue:l,maxValue:h,startFromValue:c}=t;let f,d,m;this.envelopeType==="filter-env"&&(f=Math.log(o),d=Math.log(h),m=d-f);for(let A=0;A<s;A++){const E=A/(s-1)*e;let M=a(this,P).interpolateValueAtTime(E);this.envelopeType==="filter-env"&&f&&m?M=Math.exp(f+m*M):o!==1?M=M*o:c!==void 0&&A===0&&(M=c),r[A]=G(M,l,h)}return r},kr=function(i,e,t){var n;const s=this.sustainEnabled?this.sustainPointIndex??this.points.length-1:this.points.length-1,r=y(this,x,Vt).call(this,0,s,t.playbackRate,a(this,J)),o=y(this,x,Vn).call(this,r,this.sustainEnabled?((n=this.sustainPoint)==null?void 0:n.time)??this.baseDuration:this.baseDuration,{...t,minValue:i.minValue,maxValue:i.maxValue,startFromValue:i.value});t.voiceId!==void 0&&this.sendUpstreamMessage(`${this.envelopeType}:trigger`,{voiceId:t.voiceId,midiNote:t.midiNote,duration:r,sustainEnabled:this.sustainEnabled,loopEnabled:!1,sustainPoint:this.sustainPoint,releasePoint:this.releasePoint});const l=a(this,de).currentTime,h=Math.max(l,e);if(r<.005){i.linearRampToValueAtTime(o[o.length-1],h+r);return}try{yi(i,h),i.setValueCurveAtTime(o,h,r),this.sustainEnabled||setTimeout(()=>{u(this,Ee,null)},r*1e3+100)}catch{console.debug("Failed to apply envelope curve due to rapid fire.");try{yi(i,h),i.linearRampToValueAtTime(o[o.length-1],h+r),this.sustainEnabled||setTimeout(()=>{u(this,Ee,null)},r*1e3+100)}catch{try{i.setValueAtTime(o[o.length-1],h),u(this,Ee,null)}catch{u(this,Ee,null)}}}},Ve=new WeakMap,ue=new WeakMap,yt=new WeakMap,ot=new WeakMap,Ee=new WeakMap,Dr=function(i,e,t){if(!a(this,ot).call(this)){u(this,ue,!1);return}let n=y(this,x,Vt).call(this,a(this,P).startPointIndex,a(this,P).endPointIndex,t.playbackRate,a(this,J)),s=y(this,x,Vn).call(this,n,this.baseDuration,{...t,minValue:i.minValue,maxValue:i.maxValue,startFromValue:i.value});t.voiceId!==void 0&&this.sendUpstreamMessage(`${this.envelopeType}:trigger`,{voiceId:t.voiceId,midiNote:t.midiNote,duration:n,sustainEnabled:!1,loopEnabled:!0,sustainPoint:this.sustainPoint,releasePoint:this.releasePoint});let r=Math.max(a(this,de).currentTime,e);const o=Math.max(.15,Math.min(n*3,.5)),l=.005;let h=0,c=0;u(this,ue,!0);let f=!1,d=null;const m=()=>{if(!a(this,ot).call(this)){u(this,ue,!1);return}if(d!==null&&(clearTimeout(d),d=null),!f){f=!0;try{for(a(this,yt)&&(n=y(this,x,Vt).call(this,a(this,P).startPointIndex,a(this,P).endPointIndex,t.playbackRate,a(this,J)),s=y(this,x,Vn).call(this,n,this.baseDuration,{...t,minValue:i.minValue,maxValue:i.maxValue,startFromValue:i.value}));r<a(this,de).currentTime+o&&r>=h;){if(!a(this,ot).call(this)){u(this,ue,!1);return}const A=n-l;try{i.setValueCurveAtTime(s,r,A)}catch{c++,c>=100&&(console.debug(`Multiple curve overlaps in looping envelope, nr of overlaps: ${c} 
                (loop duration: ${n.toFixed(3)}s, buffer: ${l})`),c=0)}if(r+=n+l,h=r,t.voiceId!==void 0){const E=a(this,de).getOutputTimestamp();if(E.contextTime!==void 0&&E.performanceTime!==void 0){const M=r-E.contextTime,S=E.performanceTime+M*1e3,D=Math.max(0,S-performance.now());setTimeout(()=>{if(!a(this,ot).call(this)){u(this,ue,!1);return}this.sendUpstreamMessage(`${this.envelopeType}:trigger:loop`,{voiceId:t.voiceId,midiNote:t.midiNote,duration:n})},D)}else{if(!a(this,ot).call(this)){u(this,ue,!1);return}this.sendUpstreamMessage(`${this.envelopeType}:trigger:loop`,{voiceId:t.voiceId,midiNote:t.midiNote,duration:n})}}}d=setTimeout(()=>{if(!a(this,ot).call(this)){u(this,ue,!1);return}m()},100)}finally{f=!1}}};m()},Fi=new WeakMap,Cr=function(i){console.debug("CustomEnvelope release debug:",{envelopeType:this.envelopeType,...i})},Ir=function(i,e,t,n){const s=n.curveScale??1,r=this.points[t],o=this.points[this.points.length-1],l=Math.max(a(this,de).currentTime,e),h=o.time-r.time,c=y(this,x,Vt).call(this,t,this.points.length-1,n.playbackRate,a(this,J)),f=y(this,x,Bi).call(this,a(this,P).interpolateValueAtTime(o.time)*s);if(c<=1e-4){Oi(i,l,n.releaseStartValue),i.linearRampToValueAtTime(f,l+.005);return}const d=y(this,x,Vs).call(this,c),m=Math.max(2,Math.floor(c*d)),A=new Float32Array(m);for(let E=0;E<m;E++){const M=E/(m-1),S=r.time+M*h;A[E]=y(this,x,Bi).call(this,a(this,P).interpolateValueAtTime(S)*s)}n.voiceId!==void 0&&this.sendUpstreamMessage(`${this.envelopeType}:release`,{voiceId:n.voiceId,midiNote:n.midiNote,releasePoint:this.releasePoint,remainingDuration:c});try{const E=n.releaseStartValue??i.value;Oi(i,l,E);const M=new Float32Array(A.length);for(let S=0;S<A.length;S++){const D=S/(A.length-1);M[S]=E+D*(A[S]-E)}M[0]=E,i.setValueCurveAtTime(M,l+.001,c)}catch{try{Oi(i,l,n.releaseStartValue),i.linearRampToValueAtTime(f,l+c)}catch(E){console.warn("Fallback linear ramp also failed:",E);try{i.setValueAtTime(f,l)}catch(M){console.warn("All AudioParam operations failed:",M)}}}},Rr=function(){if(!a(this,Ee)||!this.sustainEnabled)return;const{audioParam:i,startTime:e,options:t}=a(this,Ee),n=a(this,de).currentTime,s=n-Math.max(e,n),r=a(this,Ge)?s*t.playbackRate*a(this,J):s*a(this,J),o=this.sustainPoint;if(!(!o||r>=o.time))try{yi(i,n);const l=o.time-r,h=a(this,Ge)?l/t.playbackRate/a(this,J):l/a(this,J);if(h>.001){const c=y(this,x,Vn).call(this,h,o.time,{...t,minValue:i.minValue,maxValue:i.maxValue,startFromValue:i.value});i.setValueCurveAtTime(c,n,h)}}catch{console.debug("Dynamic sustain reschedule failed, envelope will continue normally")}},Bi=function(i){const[e,t]=a(this,P).pointValueRange;return Math.max(e,Math.min(t,i))};function Fs(i,e,t={}){const{durationSeconds:n=2,points:s,sustainPointIndex:r,releasePointIndex:o,envPointValueRange:l,initEnable:h,sharedData:c}=t;if(c)return new Ls(i,e,c);const f=Ls.getDefaults(e,n),d=s||f.points;let m=l||f.envPointValueRange;const A=h!==void 0?h:f.initEnable,E=r!==void 0?r:f.sustainPointIndex,M=o!==void 0?o:f.releasePointIndex,S=new Ls(i,e,void 0,d,m,n,A);return S.setSustainPoint(E),M&&S.setReleasePoint(M),S}class Yl{constructor(){b(this,"timers",new Map)}debounce(e,t,n){const s=n??e.name??"default";return(...r)=>{this.timers.has(s)&&clearTimeout(this.timers.get(s)),this.timers.set(s,setTimeout(()=>{e(...r),this.timers.delete(s)},t))}}cancel(e){this.timers.has(e)&&(clearTimeout(this.timers.get(e)),this.timers.delete(e))}}var Mt,Le,Yt,Gn,St;const xr=class Zs{constructor(e,t=Zs.MIN_EXPONENTIAL_RAMP_VALUE){b(this,"nodeId"),b(this,"nodeType","audio-param-controller"),p(this,Mt),p(this,Le),p(this,Yt,[]),p(this,Gn,!1),p(this,St),u(this,Mt,e),this.nodeId=We(this.nodeType,this),u(this,Le,e.createConstantSource()),a(this,Le).offset.setValueAtTime(t,e.currentTime),u(this,St,t),a(this,Le).start(),u(this,Gn,!0)}addTarget(e,t=1){if(t===1)a(this,Le).connect(e),a(this,Yt).push({param:e});else{const n=new GainNode(a(this,Mt),{gain:t});a(this,Le).connect(n),n.connect(e),a(this,Yt).push({param:e,scaler:n})}return this}ramp(e,t,n="exponential",s=!0){const r=a(this,Mt).currentTime;s&&this.param.cancelScheduledValues(r);const o=this.param.value;if(this.param.setValueAtTime(o,r),n==="exponential"){const l=Math.max(e,Zs.MIN_EXPONENTIAL_RAMP_VALUE);this.param.exponentialRampToValueAtTime(l,r+t),u(this,St,l)}else this.param.linearRampToValueAtTime(e,r+t),u(this,St,e);return this}setValue(e,t=this.now,n=!0){return n&&this.param.cancelScheduledValues(t),this.param.setValueAtTime(e,t),u(this,St,e),this}get targets(){return a(this,Yt)}get context(){return a(this,Mt)}get now(){return a(this,Mt).currentTime}get param(){return a(this,Le).offset}get value(){return a(this,St)}get initialized(){return a(this,Gn)}dispose(){u(this,Gn,!1);try{a(this,Le).stop(),a(this,Le).disconnect(),a(this,Yt).forEach(({scaler:e})=>e&&e.disconnect())}catch{}ze(this.nodeId)}};Mt=new WeakMap,Le=new WeakMap,Yt=new WeakMap,Gn=new WeakMap,St=new WeakMap,b(xr,"MIN_EXPONENTIAL_RAMP_VALUE",1e-6);let Zl=xr;const Wa=(i,e)=>{const{from:t,to:n}=e,[s,r]=t,[o,l]=n,h=(l-o)/(r-s);if(Array.isArray(i))return i.map(c=>{const f=Math.max(s,Math.min(r,c));return o+(f-s)*h});{const c=Math.max(s,Math.min(r,i));return o+(c-s)*h}};var Zt,fe,_n,Ui,Wn,Or;class Xl{constructor(){p(this,Or),p(this,Zt,[]),p(this,fe,[]),p(this,_n,0),p(this,Ui,"C"),p(this,Wn,[]),b(this,"paramType",null)}setScale(e,t,n=0,s=0,r=6,o,l=!1){const h=[...t];let c=Cl(e,h,s,r).periodsInSec.sort((f,d)=>f-d);return n!==0&&(c=Il(c,-n)),u(this,Ui,e),u(this,Wn,h),this.setAllowedPeriods(c,o,l)}setRootNote(e){this.setScale(e,a(this,Wn),0,0,6,!1,!1)}setAllowedPeriods(e,t,n=!1,s="any"){let r=t?Wa([...e],t):e;return u(this,fe,[...r].sort((o,l)=>o-l)),u(this,_n,a(this,fe).length-1),a(this,fe)}snapToValue(e,t=a(this,Zt),n,s="any"){if(t.length===0)return e;if(n===void 0)return ki(t,e);const r=t.filter(o=>Math.abs(o-e)<=n);if(r.length>0)return ki(r,e,s);if(n!==void 0){const o=ki(t,e,s),l=Math.sign(o-e);return e+l*n}return e}snapToMusicalPeriod(e,t=a(this,fe)){if(t.length===0||e>this.longestPeriod)return e;if(e<=this.shortestPeriod)return this.shortestPeriod;const n=a(this,fe)[a(this,_n)];if(e===n)return e;const s=e>n?"right":"left",r=ki(t,e,s);return u(this,_n,a(this,fe).indexOf(r)),r}setAllowedValues(e,t){const n=t?Wa(e,t):e;return u(this,Zt,[...n].sort((s,r)=>s-r)),a(this,Zt)}get rootNote(){return a(this,Ui)}get scalePattern(){return a(this,Wn)}get periods(){return a(this,fe)}get shortestPeriod(){return a(this,fe)[0]}get longestPeriod(){const e=a(this,fe).length-1;return a(this,fe)[e]}get hasValueSnapping(){return a(this,Zt).length>0}get hasPeriodSnapping(){return a(this,fe).length>0}}Zt=new WeakMap,fe=new WeakMap,_n=new WeakMap,Ui=new WeakMap,Wn=new WeakMap,Or=new WeakSet;var ve,F,Gi,zn,Ze,_i,Pt,Xs,Vr,Lr;class za{constructor(e,t){p(this,Xs),b(this,"nodeType","macro"),b(this,"nodeId"),p(this,ve),p(this,F),p(this,Gi),p(this,zn),p(this,Ze,""),p(this,_i,!1),p(this,Pt),b(this,"getValue",()=>a(this,ve).value),p(this,Lr,(n,s,r,o,l)=>{console.debug("adjusting param: ",a(this,Ze),"targetValue",n,"constant",s,"targetPeriod",r,"quantizedPeriod",o,"result",l)}),u(this,ve,new Zl(e,t)),u(this,F,new Xl),u(this,Gi,new Yl),u(this,zn,wt(a(this,ve).nodeId)),this.nodeId=a(this,ve).nodeId,u(this,Pt,t),u(this,_i,!0)}async init(){}addTarget(e,t,n=1){return a(this,Ze)||u(this,Ze,t),Se(t===a(this,Ze),"Macros only support a single ParamType"),a(this,ve).addTarget(e,n),this}ramp(e,t,n,s={}){const r=y(this,Xs,Vr).call(this,e,n);if(r===a(this,Pt))return this;u(this,Pt,r);const{method:o="exponential",debounceMs:l=20,onComplete:h,onCompleteDelayMs:c=30}=s,f=()=>{a(this,ve).ramp(r,t,o,!0),h&&setTimeout(h,t*1e3+c)};return l===0?f():a(this,Gi).debounce(f,l,this.nodeId)(),this}debugProcessVal(e,t,n){console.log("MacroParam.#processValue input:",{value:e,constant:t,targetPeriod:n,hasValueSnapping:a(this,F).hasValueSnapping,hasPeriodSnapping:a(this,F).hasPeriodSnapping,longestPeriod:a(this,F).longestPeriod})}setAllowedParamValues(e,t){return a(this,F).setAllowedValues(e,t)}setAllowedPeriods(e,t,n=!1){return a(this,F).setAllowedPeriods(e,t,n)}setScale(e){const{rootNote:t,scale:n,tuningOffset:s=0,lowestOctave:r=0,highestOctave:o=8}=e,l=Array.isArray(n)?n:wr[n];return a(this,F).setScale(t,l,s,r,o,e.normalize,e.snapToZeroCrossings)}setValue(e,t){return a(this,ve).setValue(e,t),u(this,Pt,e),this}get targetValue(){return a(this,Pt)}get targets(){return a(this,ve).targets}get snapper(){return a(this,F)}get rootNote(){return a(this,F).rootNote}setRootNote(e){a(this,F).setRootNote(e)}get scalePattern(){return a(this,F).scalePattern}get isReady(){return a(this,_i)}get now(){throw new Error("Not implemented")}get audioParam(){return a(this,ve).param}get type(){return a(this,Ze)}get longestPeriod(){return a(this,F).longestPeriod}onChange(e){return this.onMessage("value:changed",e)}onMessage(e,t){return a(this,zn).onMessage(e,t)}sendMessage(e,t){a(this,zn).sendMessage(e,t)}dispose(){a(this,ve).dispose()}connect(e,t,n){return this.addTarget(e,t,n),this}disconnect(e){throw new Error("Not implemented")}}ve=new WeakMap,F=new WeakMap,Gi=new WeakMap,zn=new WeakMap,Ze=new WeakMap,_i=new WeakMap,Pt=new WeakMap,Xs=new WeakSet,Vr=function(i,e){if(!Number.isFinite(i)||!Number.isFinite(e))return i;const t=Math.abs(i-e);if(a(this,F).hasPeriodSnapping&&t<a(this,F).longestPeriod){const n=a(this,F).snapToMusicalPeriod(t);let s;if(a(this,Ze)==="loopEnd"&&(s=e+n),a(this,Ze)==="loopStart"&&(s=Math.max(0,e-n),s>=e-.001)){const r=a(this,F).periods.filter(o=>o<n);if(r.length>0){const o=Math.max(...r);s=e-o}else s=Math.max(0,e-.001)}if(s!==void 0)return s}else if(a(this,F).hasValueSnapping)return a(this,F).snapToValue(i);return i},Lr=new WeakMap;function Jl(i,e){return typeof e=="number"&&Number.isFinite(e)&&e>=i.min&&e<=i.max&&(!i.allowedValues||i.allowedValues.includes(e))}const Di=i=>`${(i*100).toFixed(0)}%`,Bs=i=>`${i.toFixed(0)} Hz`,Ci=(i,e)=>`${(i*e).toFixed(2)} s`,Wt={volume:{label:"Volume",min:0,max:1,defaultValue:.75,apply:(i,e)=>i.setVolume(e)},dryWet:{label:"Dry/Wet",min:0,max:1,defaultValue:.5,apply:(i,e)=>i.setDryWetMix({dry:1-e,wet:e})},glide:{label:"Glide",min:0,max:1,defaultValue:0,step:.001,format:i=>i.toFixed(3),apply:(i,e)=>i.setGlideTime(e)},tempo:{label:"Tempo",min:20,max:300,defaultValue:120,step:1,format:i=>`${i.toFixed(0)} BPM`,apply:(i,e)=>i.setTempo(e)},lowpassFilter:{label:"LPF",min:40,max:2e4,defaultValue:2e4,curve:5,format:Bs,apply:(i,e)=>i.setLpfCutoff(e)},highpassFilter:{label:"HPF",min:20,max:2e4,defaultValue:40,curve:5,format:Bs,apply:(i,e)=>i.setHpfCutoff(e)},feedback:{label:"Feedback",min:0,max:1,defaultValue:0,step:.001,curve:2.5,format:i=>i.toFixed(3),apply:(i,e)=>i.setFeedbackAmount(e)},feedbackPitch:{label:"FB-Pitch",min:.25,max:4,defaultValue:1,allowedValues:[.25,.5,1,2,3,4],curve:2,apply:(i,e)=>i.setFeedbackPitchScale(e)},feedbackDecay:{label:"FB-Decay",min:.01,max:1,defaultValue:.75,curve:1.5,apply:(i,e)=>i.setFeedbackDecay(e)},feedbackLpf:{label:"FB-LPF",min:400,max:16e3,defaultValue:1e4,curve:5,format:Bs,apply:(i,e)=>i.setFeedbackLowpassCutoff(e)},distortion:{label:"Distortion",min:0,max:1,defaultValue:0,curve:1.5,apply:(i,e)=>i.outputBus.setDistortionMacro(e)},drive:{label:"Drive",min:0,max:1,defaultValue:0,apply:(i,e)=>i.outputBus.setDrive(e)},clipping:{label:"Clipping",min:0,max:1,defaultValue:0,apply:(i,e)=>i.outputBus.setClippingMacro(e)},amMod:{label:"AM",min:0,max:1,defaultValue:0,apply:(i,e)=>i.setModulationAmount("AM",e)},reverbSend:{label:"Reverb Send",min:0,max:1,defaultValue:0,format:Di,apply:(i,e)=>i.sendToFx("reverb",e)},reverbSize:{label:"Reverb Size",min:0,max:1,defaultValue:.7,apply:(i,e)=>i.setReverbAmount(e)},delaySend:{label:"Delay Send",min:0,max:1,defaultValue:0,curve:2,format:Di,apply:(i,e)=>i.sendToFx("delay",e)},delayTime:{label:"Delay Time",min:.005,max:1.5,defaultValue:.1,curve:2,format:i=>`${i.toFixed(3)} s`,apply:(i,e)=>i.outputBus.setDelayTime(e)},delayFeedback:{label:"Delay Feedback",min:0,max:1,defaultValue:.25,curve:1.5,format:Di,apply:(i,e)=>i.outputBus.setDelayFeedback(e)},gainLFORate:{label:"Amp LFO Rate",min:0,max:1,defaultValue:.1,curve:5,apply:(i,e)=>{var t;return(t=i.gainLFO)==null?void 0:t.setFrequency(e*100+.1)}},gainLFODepth:{label:"Amp LFO Depth",min:0,max:1,defaultValue:0,curve:1.5,apply:(i,e)=>{var t;return(t=i.gainLFO)==null?void 0:t.setDepth(e)}},pitchLFORate:{label:"Pitch LFO Rate",min:0,max:1,defaultValue:.01,curve:5,apply:(i,e)=>{var t;return(t=i.pitchLFO)==null?void 0:t.setFrequency(e*100+.1)}},pitchLFODepth:{label:"Pitch LFO Depth",min:0,max:1,defaultValue:0,curve:1.5,apply:(i,e)=>{var t;return(t=i.pitchLFO)==null?void 0:t.setDepth(e/10)}},trimStart:{label:"Start",min:0,max:1,defaultValue:0,step:.001,format:Ci,apply:(i,e)=>i.setSampleStartPoint(e*i.sampleDuration)},trimEnd:{label:"End",min:0,max:1,defaultValue:1,step:.001,format:Ci,apply:(i,e)=>i.setSampleEndPoint(e*i.sampleDuration)},loopStart:{label:"Loop Start",min:0,max:1,defaultValue:0,step:.001,format:Ci,apply:(i,e)=>i.setLoopStart(e*i.sampleDuration)},loopDuration:{label:"Loop Length",min:0,max:1,defaultValue:1,curve:4,format:(i,e)=>{const t=i*e;return t<=.061?`${(t*1e3).toFixed(0)}ms`:`${t.toFixed(2)} s`},apply:(i,e)=>i.setLoopDuration(e*i.sampleDuration)},loopEnd:{label:"Loop End",min:0,max:1,defaultValue:1,step:.001,format:Ci,apply:(i,e)=>i.setLoopEnd(e*i.sampleDuration)},loopRampDuration:{label:"Loop Ramp",min:.001,max:1,defaultValue:.5,step:.001,apply:(i,e)=>i.setLoopRampDuration(e)},loopDurationDrift:{label:"Loop Drift",min:0,max:1,defaultValue:.3,step:.001,curve:.5,format:i=>`${(i*100).toFixed(1)}%`,apply:(i,e)=>i.setLoopDurationDriftAmount(e)},keytrackLoop:{label:"KeyTrack",min:0,max:1,defaultValue:0,format:Di,apply:(i,e)=>i.setKeytrackLoopAmount(e)}};var Xt,re,Fe,Jt,Hn;class Js{constructor(e){p(this,Xt),p(this,re),p(this,Fe),p(this,Jt,new Set),p(this,Hn,null),b(this,"storeCurrentValues",()=>{u(this,Hn,{rate:a(this,re).frequency.value,depth:a(this,Fe).gain.value})}),b(this,"getStoredValues",()=>a(this,Hn)),u(this,Xt,e),u(this,re,e.createOscillator()),u(this,Fe,e.createGain()),a(this,re).frequency.value=1,a(this,Fe).gain.value=0,a(this,re).connect(a(this,Fe)),a(this,re).start()}setFrequency(e,t=this.now){a(this,re).frequency.setValueAtTime(e,t)}setDepth(e,t=this.now){a(this,Fe).gain.setValueAtTime(e,t)}setWaveform(e,t){if(e instanceof PeriodicWave)a(this,re).setPeriodicWave(e);else if(typeof e=="string"&&nl(e)){const n=il(a(this,Xt),e,t);a(this,re).setPeriodicWave(n)}else a(this,re).type=e}setPeriodicWave(e){a(this,re).setPeriodicWave(e)}connect(e){a(this,Fe).connect(e),a(this,Jt).add(e)}disconnect(e){e?(a(this,Fe).disconnect(e),a(this,Jt).delete(e)):(a(this,Fe).disconnect(),a(this,Jt).clear())}setMusicalNote(e,t={}){const{divisor:n=1,glideTime:s=0,timestamp:r=this.now}=t,o=440*Math.pow(2,(e-69)/12)/n;if(s<=.001)return this.setFrequency(o,r),this;if(t.glideFromMidiNote){const l=440*Math.pow(2,(t.glideFromMidiNote-69)/12)/n;this.setFrequency(l,r)}a(this,re).frequency.setTargetAtTime(o,r+.001,s)}getPitchWobbleWaveform(){const e=new Float32Array(8),t=new Float32Array(8);e[0]=0,t[0]=0;for(let n=1;n<8;n++)e[n]=Math.random()*.5,t[n]=Math.random()*.5;return a(this,Xt).createPeriodicWave(e,t,{disableNormalization:!0})}get now(){return a(this,Xt).currentTime}dispose(){a(this,re).stop(),a(this,Jt).clear(),u(this,Hn,null),this.disconnect()}}Xt=new WeakMap,re=new WeakMap,Fe=new WeakMap,Jt=new WeakMap,Hn=new WeakMap;var jn,Wi,we,$t,je,en,qn;class qe{constructor(e,t,n,s={}){b(this,"nodeId"),b(this,"nodeType"),p(this,jn),p(this,Wi,!1),p(this,we),p(this,$t),p(this,je),p(this,en,new Set),p(this,qn,new Set),this.nodeType=n,this.nodeId=We(n,this),u(this,jn,wt(this.nodeId)),u(this,we,e),s.createIOGains?(u(this,$t,new GainNode(t,{gain:1})),u(this,je,new GainNode(t,{gain:1})),a(this,$t).connect(a(this,we)),a(this,we).connect(a(this,je))):(u(this,$t,e),u(this,je,e)),u(this,Wi,!0)}onMessage(e,t){return a(this,jn).onMessage(e,t)}sendUpstreamMessage(e,t){return a(this,jn).sendMessage(e,t),this}connect(e){var t;const n="input"in e?e.input:e;a(this,je).connect(n),"nodeId"in e&&(a(this,en).add(e.nodeId),(t=e.addIncoming)==null||t.call(e,this.nodeId))}disconnect(e){var t;if(e){const n="input"in e?e.input:e;a(this,je).disconnect(n),"nodeId"in e&&(a(this,en).delete(e.nodeId),(t=e.removeIncoming)==null||t.call(e,this.nodeId))}else a(this,je).disconnect(),a(this,en).clear()}addIncoming(e){a(this,qn).add(e)}removeIncoming(e){a(this,qn).delete(e)}get connections(){return{outgoing:Array.from(a(this,en)),incoming:Array.from(a(this,qn))}}setParam(e,t,n=this.now){if("parameters"in a(this,we)){const r=a(this,we).parameters.get(e);if(r){r.setValueAtTime(t,n);return}}const s=a(this,we)[e];if(s!=null&&s.setValueAtTime){s.setValueAtTime(t,n);return}console.warn(`Parameter '${e}' not found on node`)}getAudioParam(e){return a(this,we)[e]||null}get audioNode(){return a(this,we)}get input(){return a(this,$t)}get output(){return a(this,je)}get context(){return a(this,we).context}get now(){return a(this,we).context.currentTime}get initialized(){return a(this,Wi)}dispose(){this.disconnect(),ze(this.nodeId)}}jn=new WeakMap,Wi=new WeakMap,we=new WeakMap,$t=new WeakMap,je=new WeakMap,en=new WeakMap,qn=new WeakMap;const $l={threshold:-13,knee:6,ratio:4,attack:.003,release:.05},eh={threshold:-1,ratio:20,attack:.001,release:.01,knee:0};var $s,zi,tn,Kn,L,Qn;const Fr=class ea{constructor(e=Ut()){b(this,"nodeId"),b(this,"nodeType","dattorro-reverb"),p(this,$s,!1),p(this,zi),p(this,tn,new Set),p(this,Kn,new Set),p(this,L),p(this,Qn,"default"),this.nodeId=We(this.nodeType,this),u(this,zi,e),u(this,L,new AudioWorkletNode(e,"dattorro-reverb-processor",{outputChannelCount:[2]})),this.setParam("dry",0),this.setAmountMacro(.01)}connect(e){var t;const n="input"in e?e.input:e;a(this,L).connect(n),"nodeId"in e&&(a(this,tn).add(e.nodeId),(t=e.addIncoming)==null||t.call(e,this.nodeId))}disconnect(e){var t;if(e){const n="input"in e?e.input:e;a(this,L).disconnect(n),"nodeId"in e&&(a(this,tn).delete(e.nodeId),(t=e.removeIncoming)==null||t.call(e,this.nodeId))}else a(this,L).disconnect(),a(this,tn).clear()}addIncoming(e){a(this,Kn).add(e.nodeId)}removeIncoming(e){a(this,Kn).delete(e.nodeId)}setParam(e,t,n=this.now){var s;if(!isFinite(t)){console.warn(`Skipping non-finite value for ${e}:`,t);return}if(e==="size"){this.setAmountMacro(t);return}if(e==="diffusion"){this.setDiffusionMacro(t);return}(s=a(this,L).parameters.get(e))==null||s.setValueAtTime(t,n)}getAudioParam(e){return e==="diffusion"?{value:this.getDiffusionMacroValue(),setValueAtTime:(t,n)=>this.setDiffusionMacro(t)}:a(this,L).parameters.get(e)||null}setAmountMacro(e){var t;if(e<0||e>1){console.warn("Reverb amount must be 0-1 range");return}const n=ea.PRESETS[a(this,Qn)],s=Ce(e,0,1,n.decay,.93),r=Ce(e,0,1,n.excursionRate,2),o=Ce(e,0,1,n.excursionDepth,2),l=Ce(e,0,1,n.damping,.65),h=Ce(e,0,1,n.bandwidth,.2),c=Ce(e,0,1,.3,1);this.setDiffusionMacro(c),(t=this.getAudioParam("decay"))==null||t.setTargetAtTime(s,this.now,.1),this.setParam("excursionRate",r),this.setParam("excursionDepth",o),this.setParam("damping",l),this.setParam("bandwidth",h)}setPreset(e="default",t=.5){u(this,Qn,e);const n=ea.PRESETS[e],s=a(this,L).context.currentTime;Object.entries(n).forEach(([r,o])=>{const l=a(this,L).parameters.get(r);l?l.linearRampToValueAtTime(o,s+t):console.warn(`Parameter '${r}' not found in reverb node`)})}setDiffusionMacro(e){const t=Math.max(.1,e*.75),n=Math.max(.1,e*.625),s=Math.min(.7,Math.max(.1,e*.6)),r=Math.max(.2,e*.4);this.setParam("inputDiffusion1",t),this.setParam("inputDiffusion2",n),this.setParam("decayDiffusion1",s),this.setParam("decayDiffusion2",r)}getDiffusionMacroValue(){var e;return((((e=this.getAudioParam("inputDiffusion1"))==null?void 0:e.value)??.75)-.1)/(.75-.1)}getCurrentSettings(){const e={};return Array.from(a(this,L).parameters.keys()).forEach(t=>{var n;e[t]=((n=a(this,L).parameters.get(t))==null?void 0:n.value)??0}),e}get audioNode(){return a(this,L)}get context(){return a(this,zi)}get input(){return a(this,L)}get output(){return a(this,L)}get now(){return a(this,L).context.currentTime}get initialized(){return a(this,$s)}get currentPreset(){return a(this,Qn)}get connections(){return{outgoing:Array.from(a(this,tn)),incoming:Array.from(a(this,Kn))}}get numberOfInputs(){return this.input.numberOfInputs}get numberOfOutputs(){return this.output.numberOfOutputs}get workletInfo(){return{numberOfInputs:a(this,L).numberOfInputs,numberOfOutputs:a(this,L).numberOfOutputs,channelCount:a(this,L).channelCount,channelCountMode:a(this,L).channelCountMode}}dispose(){this.disconnect(),ze(this.nodeId)}};$s=new WeakMap,zi=new WeakMap,tn=new WeakMap,Kn=new WeakMap,L=new WeakMap,Qn=new WeakMap,b(Fr,"PRESETS",{room:{preDelay:1525,bandwidth:.5683,inputDiffusion1:.4666,inputDiffusion2:.5853,decay:.3226,decayDiffusion1:.6954,decayDiffusion2:.6022,damping:.6446,excursionRate:0,excursionDepth:0},church:{preDelay:0,bandwidth:.928,inputDiffusion1:.7331,inputDiffusion2:.4534,decay:.7,decayDiffusion1:.7839,decayDiffusion2:.1992,damping:.5975,excursionRate:0,excursionDepth:0},freeze:{preDelay:0,bandwidth:.999,inputDiffusion1:.75,inputDiffusion2:.625,decay:1,decayDiffusion1:.5,decayDiffusion2:.711,damping:.005,excursionRate:.3,excursionDepth:1.4},ether:{preDelay:0,bandwidth:.999,inputDiffusion1:.23,inputDiffusion2:.667,decay:.45,decayDiffusion1:.7,decayDiffusion2:.5,damping:.3,excursionRate:.85,excursionDepth:1.2},default:{preDelay:0,bandwidth:.85,inputDiffusion1:.4,inputDiffusion2:.45,decay:.1,decayDiffusion1:.5,decayDiffusion2:.45,damping:.25,excursionRate:.3,excursionDepth:.3}});let th=Fr;class Is extends AudioWorkletNode{constructor(e,t,n){super(e,t,n),b(this,"_processorReady",!1),b(this,"_messageQueue",[]),b(this,"_onProcessorMessage"),this.port.onmessage=s=>{if(s.data&&s.data.type==="initialized"){this._processorReady=!0;for(const r of this._messageQueue)this.port.postMessage(r);this._messageQueue=[]}this._onProcessorMessage&&this._onProcessorMessage(s)}}setParam(e,t){const n=this.parameters.get(e);return n?(n.setValueAtTime(t,this.context.currentTime),this):(console.warn(`Parameter '${String(e)}' not found on worklet node`),this)}getParam(e){return this.parameters.get(e)}sendProcessorMessage(e){return this._processorReady?this.port.postMessage(e):this._messageQueue.push(e),this}onProcessorMessage(e){return this._onProcessorMessage=e,this}dispose(){this.disconnect(),this.port.onmessage=null,this.port.close()}}function nh(i){return new Is(i,"feedback-delay-processor")}function ih(i){return new Is(i,"distortion-processor")}function sh(i){return new Is(i,"delay-processor")}var Hi,Yn,ne,Zn,lt,nn,Xn,Jn,ji,wn,ta,na,ia,sa,$n,qi,Ki,ws,Br,Ha;class Ur{constructor(e=Ut()){p(this,ws),b(this,"nodeId"),b(this,"nodeType","harmonic-feedback"),p(this,Hi,!1),p(this,Yn),p(this,ne),p(this,Zn),p(this,lt),p(this,nn,new Set),p(this,Xn,new Set),p(this,Jn),p(this,ji,1),p(this,wn,!1),p(this,ta,0),p(this,na,.999),p(this,ia,.15),p(this,sa,1),p(this,$n,.00012656238799684143),p(this,qi,2),p(this,Ki,0),this.nodeId=We(this.nodeType,this),u(this,Yn,e),u(this,ne,nh(e)),u(this,Zn,new GainNode(e,{gain:1})),u(this,lt,new GainNode(e,{gain:1})),a(this,Zn).connect(a(this,ne)).connect(a(this,lt));const t=this.setPitch(60);u(this,Jn,t),u(this,Hi,!0)}trigger(e,t={}){const{secondsFromNow:n=0,cents:s=0,velocity:r=100,glideTime:o=0,triggerDecay:l=!0}=t,h=this.now+n;return this.setPitch(e,s,h,o),l&&y(this,ws,Br).call(this),this}setAmountMacro(e){const t=G(e,0,1);return this.setFeedbackAmount(t),u(this,Ki,t),this}get currentAmount(){return a(this,Ki)}setPitch(e,t=0,n=this.now,s=0){const r=440*Math.pow(2,(e-69)/12),o=1/(t!==0?r*Math.pow(2,t/1200):r),l=a(this,$n),h=Math.max(l,o);return this.setDelay(h,n,s),h}setDelay(e,t=this.now,n=0){u(this,Jn,e);const s=e*a(this,ji),r=G(s,a(this,$n),a(this,qi));return n===0||!isFinite(n)?(this.getAudioParam("delayTime").setValueAtTime(r,t),this):(this.getAudioParam("delayTime").linearRampToValueAtTime(r,t+n),this)}setDelayMultiplier(e,t=this.now,n=.75){if(typeof e!="number"||!isFinite(e)){console.warn("setDelayMultiplier:Invalid multiplier:",e);return}const s=G(e,.25,4,{warn:!0,name:"pitchDelayMultiplier"}),r=this.getAudioParam("delayTime");u(this,ji,s);const o=G(s*a(this,Jn),a(this,$n),a(this,qi));return n===0||!isFinite(n)?(r.setValueAtTime(o,t),this):(r.setTargetAtTime(o,t,n/3),this)}setFeedbackAmount(e,t=this.now){const n=Ll(e,{inputRange:{min:0,max:1},outputRange:{min:Math.max(.001,a(this,ta)),max:a(this,na)},curve:"power4"});return a(this,ne).parameters.get("feedbackAmount").setValueAtTime(n,t),this}setAutoGain(e,t){return a(this,ne).port.postMessage({type:"setAutoGain",enabled:e,amount:t}),this}setDecay(e,t=this.now){const n=Ce(e,0,1,a(this,ia),a(this,sa));return this.getAudioParam("decay").setValueAtTime(n,t),this}setLowpassCutoff(e){if(e>16e3||e<100){console.warn("Feedback lowpass cutoff out of bounds");return}this.getAudioParam("lowpass").setTargetAtTime(e,this.now,.1)}connect(e){var t;const n="input"in e?e.input:e;a(this,lt).connect(n),"nodeId"in e&&(a(this,nn).add(e.nodeId),(t=e.addIncoming)==null||t.call(e,this.nodeId))}disconnect(e){var t;if(e){const n="input"in e?e.input:e;a(this,lt).disconnect(n),"nodeId"in e&&(a(this,nn).delete(e.nodeId),(t=e.removeIncoming)==null||t.call(e,this.nodeId))}else a(this,lt).disconnect(),a(this,nn).clear()}addIncoming(e){a(this,Xn).add(e.nodeId)}removeIncoming(e){a(this,Xn).delete(e.nodeId)}setParam(e,t,n=this.now){var s;switch(e){case"feedback":this.setFeedbackAmount(t,n);break;case"delayTime":this.setDelay(t,n);break;case"amount":this.setAmountMacro(t);break;case"decay":this.setDecay(t,n);break;default:(s=a(this,ne).parameters.get(e))==null||s.setValueAtTime(t,n);break}}getAudioParam(e){return a(this,ne).parameters.get(e)||null}get audioNode(){return a(this,ne)}get context(){return a(this,Yn)}get now(){return a(this,Yn).currentTime}get input(){return a(this,Zn)}get output(){return a(this,lt)}get connections(){return{outgoing:Array.from(a(this,nn)),incoming:Array.from(a(this,Xn))}}get initialized(){return a(this,Hi)}get decayActive(){return a(this,wn)}get numberOfInputs(){return this.input.numberOfInputs}get numberOfOutputs(){return this.output.numberOfOutputs}get workletInfo(){return{numberOfInputs:a(this,ne).numberOfInputs,numberOfOutputs:a(this,ne).numberOfOutputs,channelCount:a(this,ne).channelCount,channelCountMode:a(this,ne).channelCountMode}}dispose(){this.disconnect(),ze(this.nodeId)}}Hi=new WeakMap,Yn=new WeakMap,ne=new WeakMap,Zn=new WeakMap,lt=new WeakMap,nn=new WeakMap,Xn=new WeakMap,Jn=new WeakMap,ji=new WeakMap,wn=new WeakMap,ta=new WeakMap,na=new WeakMap,ia=new WeakMap,sa=new WeakMap,$n=new WeakMap,qi=new WeakMap,Ki=new WeakMap,ws=new WeakSet,Br=function(){a(this,wn)&&y(this,ws,Ha).call(this),u(this,wn,!0);const i=this.getAudioParam("feedbackAmount").value;return a(this,ne).port.postMessage({type:"triggerDecay",baseFeedbackAmount:i}),this},Ha=function(){return u(this,wn,!1),a(this,ne).port.postMessage({type:"stopDecay"}),this};var Qi,N,ei,sn,Ne,pe,Ke,an,ti,ht,Xe,Gr,aa,ra,Yi,ja,_r,ct;class ah{constructor(e){p(this,Xe),b(this,"nodeId"),b(this,"nodeType","InstrumentBus"),p(this,Qi),p(this,N),p(this,ei,!1),p(this,sn,null),p(this,Ne,{}),p(this,pe,new Map),p(this,Ke,new Map),p(this,an,new Set),p(this,ti,new Set),p(this,ht,t=>{for(let n=0;n<t.length-1;n++)y(this,Xe,aa).call(this,t[n],t[n+1]);return this}),p(this,Yi,(t,n={})=>{const{initGain:s=0}=n,r=new qe(new GainNode(a(this,N),{gain:s}),a(this,N),"gain");return a(this,Ke).set(t,r),r}),b(this,"getSendNode",t=>a(this,Ke).get(t)),p(this,ct,null),this.nodeId=We(this.nodeType,this),u(this,N,e||Ut()),u(this,Qi,wt(this.nodeId))}createGainNode(e,t={}){const{initialGain:n=1}=t;return new qe(new GainNode(a(this,N),{gain:n}),e,"gain")}async init(){if(!a(this,ei))return a(this,sn)?a(this,sn):(u(this,sn,(async()=>{try{const e=this.createGainNode(a(this,N),{initialGain:1}),t=this.createGainNode(a(this,N),{initialGain:1}),n=this.createGainNode(a(this,N),{initialGain:1}),s=this.createGainNode(a(this,N),{initialGain:1}),r=new qe(new BiquadFilterNode(a(this,N),{type:"lowpass",Q:.5,frequency:a(this,N).sampleRate/2-1e3}),a(this,N),"lpf"),o=new qe(new BiquadFilterNode(a(this,N),{type:"highpass",Q:.707,frequency:20}),a(this,N),"hpf"),l=new qe(new DynamicsCompressorNode(a(this,N),$l),a(this,N),"compressor"),h=new qe(new DynamicsCompressorNode(a(this,N),eh),a(this,N),"limiter"),c=new qe(ih(a(this,N)),a(this,N),"distortion"),f=new qe(sh(a(this,N)),a(this,N),"Delay",{createIOGains:!1}),d=new th(a(this,N)),m=new Ur(a(this,N));y(this,Xe,_r).call(this,{input:e,lpf:r,hpf:o,dryMix:t,wetMix:n,output:s,compressor:l,limiter:h,feedback:m,distortion:c,reverb:d,delay:f}),a(this,Yi).call(this,"reverb"),a(this,Yi).call(this,"delay"),y(this,Xe,Gr).call(this),u(this,ei,!0)}catch{}})()),a(this,sn))}getNode(e){if(e.endsWith("_send")){const t=e.replace("_send","");return a(this,Ke).get(t)}return a(this,Ne)[e]}removeNode(e){if(a(this,Ne)[e]){y(this,Xe,ra).call(this,e);for(const[t,n]of a(this,pe)){const s=n.indexOf(e);s>-1&&(n.splice(s,1),a(this,pe).set(t,n))}delete a(this,Ne)[e],a(this,pe).delete(e)}return this}noteOn(e,t=100,n=0,s=0){const r=this.getNode("feedback");r&&"trigger"in r&&typeof r.trigger=="function"&&r.trigger(e,{velocity:t,secondsFromNow:n,glideTime:s});const o=this.getNode("delay");return o==null||o.audioNode.sendProcessorMessage({type:"trigger"}),this}setSendAmount(e,t){const n=a(this,Ke).get(e);if(!n)return console.warn(`Send effect ${e} not found`),this;const s=Math.max(0,Math.min(1,t));return n.setParam("gain",s),this}setHpfCutoff(e){var t;const n=G(e,20,this.context.sampleRate/2-1e3);return(t=this.getNode("hpf"))==null||t.audioNode.frequency.setTargetAtTime(n,this.now,.1),this}setLpfCutoff(e){var t;const n=G(e,20,this.context.sampleRate/2-1e3);return(t=this.getNode("lpf"))==null||t.audioNode.frequency.setTargetAtTime(n,this.now,.1),this}setCompressorParams(e){var t;const n=(t=this.getNode("compressor"))==null?void 0:t.audioNode;return e.threshold!==void 0&&n.threshold.setValueAtTime(e.threshold,this.now),e.knee!==void 0&&n.knee.setValueAtTime(e.knee,this.now),e.ratio!==void 0&&n.ratio.setValueAtTime(e.ratio,this.now),e.attack!==void 0&&n.attack.setValueAtTime(e.attack,this.now),e.release!==void 0&&n.release.setValueAtTime(e.release,this.now),this}setDryWetMix(e){var t,n;if(e.dry!==void 0){const s=Math.max(0,Math.min(1,e.dry));(t=this.getNode("dryMix"))==null||t.setParam("gain",s)}if(e.wet!==void 0){const s=Math.max(0,Math.min(1,e.wet));(n=this.getNode("wetMix"))==null||n.setParam("gain",s)}return this}setDelayTime(e){var t;const n=G(e,0,5);return(t=this.getNode("delay"))==null||t.setParam("delayTime",n),this}setDelayFeedback(e){var t;const n=Ce(e,0,1,0,.99);return(t=this.getNode("delay"))==null||t.setParam("feedbackAmount",n),this}setDelayCharacter(e){const t=this.getNode("delay");return t==null||t.audioNode.sendProcessorMessage({type:"setCharacter",modes:e}),this}setReverbSize(e){const t=this.getNode("reverb");return t&&"setAmountMacro"in t&&typeof t.setAmountMacro=="function"&&t.setAmountMacro(e),this}setReverbDecay(e){var t;return(t=this.getNode("reverb"))==null||t.setParam("decay",e),this}setDistortionMacro(e){const t=G(e,0,1);this.setDrive(t);const n=Ce(t,0,1,0,.95);this.setClippingMacro(n)}setDrive(e){var t;return(t=this.getNode("distortion"))==null||t.setParam("distortionDrive",e),this}setClippingMacro(e){const t=G(e,0,1),n=this.getNode("distortion");n==null||n.setParam("clippingAmount",t);const s=Ce(t,0,1,.25,.03);return n==null||n.setParam("clippingThreshold",s),this}setClippingMode(e){const t=this.getNode("distortion");t instanceof Is&&t.sendProcessorMessage({type:"setLimitingMode",mode:e})}setFeedbackAmount(e){const t=this.getNode("feedback");return t&&"setAmountMacro"in t&&typeof t.setAmountMacro=="function"&&t.setAmountMacro(e),this}setFeedbackPitchScale(e){const t=this.getNode("feedback");return t&&"setDelayMultiplier"in t&&typeof t.setDelayMultiplier=="function"&&t.setDelayMultiplier(e),this}setFeedbackDecay(e){var t;return(t=this.getNode("feedback"))==null||t.setDecay(e),this}setFeedbackLowpassCutoff(e){var t;return(t=this.getNode("feedback"))==null||t.setLowpassCutoff(e),this}connect(e){var t;this.getNode("output").connect(e),"nodeId"in e&&(a(this,an).add(e.nodeId),(t=e.addIncoming)==null||t.call(e,this.nodeId))}disconnect(e){var t;this.getNode("output").disconnect(e),e&&"nodeId"in e?(a(this,an).delete(e.nodeId),(t=e.removeIncoming)==null||t.call(e,this.nodeId)):e||a(this,an).clear()}addIncoming(e){a(this,ti).add(e)}removeIncoming(e){a(this,ti).delete(e)}setParam(e,t){switch(e){case"outputLevel":this.outputLevel=t;break;case"reverbAmount":this.setReverbSize(t);break;case"feedbackAmount":this.setFeedbackAmount(t);break;case"feedbackDecay":this.setFeedbackDecay(t);break;case"drive":this.setDrive(t);break;case"hpfCutoff":this.setHpfCutoff(t);break;case"lpfCutoff":this.setLpfCutoff(t);break;default:console.warn(`Parameter '${e}' not recognized on InstrumentMasterBus`);break}}getAudioParam(e){var t,n;switch(e){case"outputLevel":return this.getNode("output").getAudioParam("gain");case"hpfCutoff":return((t=this.getNode("hpf"))==null?void 0:t.getAudioParam("frequency"))||null;case"lpfCutoff":return((n=this.getNode("lpf"))==null?void 0:n.getAudioParam("frequency"))||null;default:return null}}getInput(){return this.getNode("input")}getOutput(){return this.getNode("output")}getLpf(){return this.getNode("lpf")}getHpf(){return this.getNode("hpf")}getDryMix(){return this.getNode("dryMix")}getWetMix(){return this.getNode("wetMix")}getCompressor(){return this.getNode("compressor")}getLimiter(){return this.getNode("limiter")}getDistortion(){return this.getNode("distortion")}getReverb(){return this.getNode("reverb")}getFeedback(){return this.getNode("feedback")}dispose(){for(const e of Object.keys(a(this,Ne)))y(this,Xe,ra).call(this,e);u(this,Ne,{}),a(this,pe).clear(),a(this,Ke).clear(),ze(this.nodeId)}get audioNode(){return this.getNode("output").audioNode}get context(){return a(this,N)}get connections(){return{outgoing:Array.from(a(this,an)),incoming:Array.from(a(this,ti))}}get input(){var e;return(e=this.getNode("input"))==null?void 0:e.audioNode}get output(){var e;return(e=this.getNode("output"))==null?void 0:e.audioNode}get now(){return a(this,N).currentTime}set outputLevel(e){const t=Math.max(0,Math.min(1,e));this.getNode("output").setParam("gain",t)}get outputLevel(){const e=this.getNode("output").getAudioParam("gain");return(e==null?void 0:e.value)||0}get initialized(){return a(this,ei)}get dryWetMix(){var e,t,n,s;return{dry:((t=(e=this.getNode("dryMix"))==null?void 0:e.getAudioParam("gain"))==null?void 0:t.value)||0,wet:((s=(n=this.getNode("wetMix"))==null?void 0:n.getAudioParam("gain"))==null?void 0:s.value)||0}}getSendAmount(e){var t;const n=a(this,Ke).get(e);return((t=n==null?void 0:n.getAudioParam("gain"))==null?void 0:t.value)??0}getRoutingMap(){const e={};for(const[t,n]of a(this,pe))e[t]=[...n];return e}debugRouting(){console.debug("=== Bus Routing Map ===");for(const[e,t]of a(this,pe))t.length>0&&console.debug(`${e} -> ${t.join(", ")}`);console.debug("======================")}debugSends(){console.debug("=== Sends ===");for(const[e]of a(this,Ke)){const t=this.getSendAmount(e);console.debug(`${e}: Send=${t.toFixed(2)}}`)}console.debug("=================================")}listNodes(){return Object.keys(a(this,Ne))}startLevelMonitoring(e=1e3,t=1024,n=!1){this.stopLevelMonitoring(),u(this,ct,new Ra(a(this,N),this.getNode("input").audioNode,this.getNode("output").audioNode,t)),a(this,ct).start(e,void 0,n),console.log("Level monitoring started")}stopLevelMonitoring(){a(this,ct)&&(a(this,ct).stop(),u(this,ct,null),console.log("Level monitoring stopped"))}logLevels(){let e=a(this,ct);e===null&&(e=new Ra(a(this,N),this.getNode("input").audioNode,this.getNode("output").audioNode));const t=e.getLevels();console.log(`Levels: Input RMS ${t.input.rmsDB.toFixed(1)} dB | Output RMS ${t.output.rmsDB.toFixed(1)} dB`)}onMessage(e,t){return a(this,Qi).onMessage(e,t)}}Qi=new WeakMap,N=new WeakMap,ei=new WeakMap,sn=new WeakMap,Ne=new WeakMap,pe=new WeakMap,Ke=new WeakMap,an=new WeakMap,ti=new WeakMap,ht=new WeakMap,Xe=new WeakSet,Gr=function(){a(this,ht).call(this,["input","hpf","feedback","dryMix"]),a(this,ht).call(this,["feedback","delay_send","delay","wetMix"]),a(this,ht).call(this,["delay","reverb_send"]),a(this,ht).call(this,["feedback","reverb_send","reverb","wetMix"]),a(this,ht).call(this,["wetMix","distortion"]),y(this,Xe,aa).call(this,"dryMix","distortion"),a(this,ht).call(this,["distortion","compressor","lpf","limiter","output"])},aa=function(i,e){const t=i.endsWith("_send")?this.getNode(i):this.getNode(i),n=e.endsWith("_send")?this.getNode(e):this.getNode(e);if(!t||!n)return console.warn(`Cannot connect ${i} -> ${e}: node not found`),this;t.connect(n);const s=a(this,pe).get(i)||[];return s.includes(e)||(s.push(e),a(this,pe).set(i,s)),this},ra=function(i,e){const t=a(this,Ne)[i];if(!t)return this;if(e){const n=a(this,Ne)[e];if(n){t.disconnect(n);const s=a(this,pe).get(i)||[],r=s.indexOf(e);r>-1&&(s.splice(r,1),a(this,pe).set(i,s))}}else t.disconnect(),a(this,pe).set(i,[]);return this},Yi=new WeakMap,ja=function(i,e){a(this,Ne)[i]=e,a(this,pe).set(i,[])},_r=function(i){return Object.keys(i).forEach(e=>{const t=i[e];t!==void 0&&y(this,Xe,ja).call(this,e,t)}),this},ct=new WeakMap;async function rh(i){const e=new ah(i);return await e.init(),e}const z={NOT_READY:"NOT_READY",LOADED:"LOADED",PLAYING:"PLAYING",RELEASING:"RELEASING",STOPPING:"STOPPING",STOPPED:"STOPPED"};var En,Tt,Dn,le,q,Be,_e,k,W,Es,O,Zi,Ai,Xi,bt,rn,be,Ae,Mn,oa,At,la,Ji,$i,C,Wr,zr,ha,Hr,jr,ut,dt,on,ln,es,qr,qa,Kr;class oh{constructor(e=Ut(),t={}){p(this,C),b(this,"nodeId"),b(this,"nodeType","sample-voice"),p(this,En),p(this,Tt,null),p(this,Dn),p(this,le),p(this,q,null),p(this,Be,null),p(this,_e,null),p(this,k,new Map),p(this,W,z.NOT_READY),p(this,Es,!1),p(this,O,null),p(this,Zi,-1),p(this,Ai,0),p(this,Xi,0),p(this,bt),p(this,rn,!1),p(this,be,null),p(this,Ae,null),p(this,Mn,40),p(this,oa,.5),p(this,At,18e3),p(this,la,.707),p(this,Ji,0),p(this,$i,.5),p(this,Hr,()=>{console.table("Available worklet params:",Array.from(a(this,le).parameters.keys()))}),p(this,ut,null),p(this,dt,null),b(this,"enableEnvelope",n=>{var s;(s=a(this,k).get(n))==null||s.enable()}),b(this,"disableEnvelope",n=>{var s;if((s=a(this,k).get(n))==null||s.disable(),n==="filter-env"&&a(this,bt)){const r=this.getParam("lpf");r==null||r.cancelScheduledValues(this.now),r==null||r.setValueAtTime(a(this,At),this.now+.01)}}),b(this,"setEnvelopeTimeScale",(n,s)=>{var r;(r=a(this,k).get(n))==null||r.setTimeScale(s)}),b(this,"setEnvelopeSustainPoint",(n,s)=>{const r=a(this,k).get(n);r!=null&&r.isEnabled&&r.setSustainPoint(s)}),b(this,"setEnvelopeReleasePoint",(n,s)=>{const r=a(this,k).get(n);r!=null&&r.isEnabled&&r.setReleasePoint(s)}),b(this,"getEnvelope",n=>a(this,k).get(n)),b(this,"setStartPoint",(n,s=this.now)=>{this.setParam("startPoint",n,s)}),b(this,"setEndPoint",(n,s=this.now)=>{this.setParam("endPoint",n,s)}),b(this,"disablePitch",()=>{var n;u(this,rn,!0);const s=this.now,r=.1;(n=this.getParam("playbackRate"))==null||n.linearRampToValueAtTime(1,s+r),y(this,C,on).call(this,1,s,{glideTime:r}),y(this,C,ln).call(this,1,s,{glideTime:r})}),b(this,"enablePitch",()=>{var n;u(this,rn,!1);const s=this.now,r=.1;if(a(this,O)){const o=Os(a(this,O));(n=this.getParam("playbackRate"))==null||n.linearRampToValueAtTime(o,this.context.currentTime+.01),y(this,C,on).call(this,o,s,{glideTime:r}),y(this,C,ln).call(this,o,s,{glideTime:r})}}),b(this,"setEnvelopeLoop",(n,s,r="normal")=>{const o=a(this,k).get(n);return o==null||o.setLoopEnabled(s,r),this}),b(this,"syncEnvelopeToPlaybackRate",(n,s)=>{const r=a(this,k).get(n);return r==null||r.syncToPlaybackRate(s),this}),b(this,"setPanDriftEnabled",n=>this.sendToProcessor({type:"setPanDriftEnabled",value:n})),b(this,"setTimestretchEnabled",n=>this.sendToProcessor({type:"setPreserveDuration",value:n})),this.context=e,this.nodeId=We(this.nodeType,this),u(this,En,wt(this.nodeId)),u(this,bt,t.enableFilters??!0),u(this,Dn,new GainNode(e,{gain:1})),u(this,le,new AudioWorkletNode(e,"sample-player-processor",{numberOfInputs:0,numberOfOutputs:1,outputChannelCount:[2],processorOptions:t.processorOptions||{}}))}async init(){return a(this,Tt)?a(this,Tt):(u(this,Tt,(async()=>{try{a(this,bt)&&y(this,C,zr).call(this),u(this,_e,new Ur(this.context)),u(this,Be,new GainNode(this.context,{gain:1})),y(this,C,es).call(this),this.setParam("loopStart",0,this.now),this.setParam("loopEnd",0,this.now),y(this,C,Wr).call(this),y(this,C,ha).call(this),y(this,C,Kr).call(this),a(this,le).port.start()}catch(e){throw this.dispose(),u(this,Tt,null),e}})()),a(this,Tt))}async loadBuffer(e,t){if(u(this,W,z.NOT_READY),e.sampleRate!==this.context.sampleRate)return console.warn(`Sample rate mismatch - buffer: ${e.sampleRate}, context: ${this.context.sampleRate}`),!1;const n=Array.from({length:e.numberOfChannels},(s,r)=>e.getChannelData(r).slice());return this.sendToProcessor({type:"voice:setBuffer",buffer:n,durationSeconds:e.duration}),t!=null&&t.length&&(y(this,C,jr).call(this,t),this.sendToProcessor({type:"voice:setZeroCrossings",zeroCrossings:t})),!0}freeze(e){return console.info(`SampleVoice: freeze(${e}) called. 
      Spectral freeze not implemented yet`),this}setGlideTime(e){u(this,Xi,e)}trigger(e){var t,n,s,r;const{midiNote:o=60,velocity:l=100,secondsFromNow:h=0}={...e},c=this.now+h;if(a(this,W)===z.PLAYING||a(this,W)===z.RELEASING)return console.log(`had to stop a playing voice, midinote: ${o}`),this.stop(c),null;u(this,W,z.PLAYING),u(this,Zi,c),u(this,O,o);const f=(((t=e.glide)==null?void 0:t.glideTime)??a(this,Xi))/8;let d=1,m=1;if(a(this,rn)||(d=Os(o),e.glide&&(m=Os(e.glide.prevMidiNote)),y(this,C,on).call(this,d,c,{glideTime:f}),y(this,C,ln).call(this,d,c,{glideTime:f})),!a(this,rn)&&e.glide&&f>0){const A=this.getParam("playbackRate");m>0&&A.setValueAtTime(m,c),this.getParam("playbackRate").setTargetAtTime(d,c,f)}else this.setParam("playbackRate",d,c);return this.setParam("velocity",l,c),this.sendToProcessor({type:"voice:start",timestamp:c}),this.applyEnvelopes(c,d,o),(n=a(this,_e))==null||n.trigger(o,{velocity:l,secondsFromNow:h,glideTime:f,triggerDecay:!0}),(r=a(this,q))==null||r.setMusicalNote(o,{divisor:1,glideTime:f,glideFromMidiNote:(s=e==null?void 0:e.glide)==null?void 0:s.prevMidiNote,timestamp:c}),a(this,O)}applyEnvelopes(e,t,n,s){a(this,k).forEach((h,c)=>{if(!h.isEnabled)return;const f=this.getParam(h.param);if(!f||c==="pitch-env"&&!h.hasVariation())return;const d=(()=>{switch(c){case"amp-env":return n?n/127:1;case"pitch-env":return t;case"filter-env":return a(this,At);default:return 1}})();h.triggerEnvelope(f,e,{baseValue:d,playbackRate:t,voiceId:this.nodeId,midiNote:s??60})});const r=a(this,k).get("amp-env"),o=a(this,k).get("pitch-env"),l=a(this,k).get("filter-env");this.sendUpstreamMessage("sample-envelopes:trigger",{voiceId:this.nodeId,midiNote:a(this,O),envDurations:{"amp-env":r.syncedToPlaybackRate?r.baseDuration/t/r.timeScale:r.baseDuration/r.timeScale,"pitch-env":o.syncedToPlaybackRate?o.baseDuration/t/o.timeScale:o.baseDuration/o.timeScale,"filter-env":l.syncedToPlaybackRate?l.baseDuration/t/l.timeScale:l.baseDuration/l.timeScale},loopEnabled:{"amp-env":r.loopEnabled,"pitch-env":o.loopEnabled,"filter-env":l.loopEnabled}})}release({releaseTime:e=this.releaseTime,secondsFromNow:t=0}){var n;if(a(this,W)===z.RELEASING)return this;if(!this.getParam("envGain"))throw new Error("Cannot release - envGain parameter is null");u(this,W,z.RELEASING);const s=this.now+t,r=((n=this.getParam("playbackRate"))==null?void 0:n.value)??1;if(a(this,k).forEach(h=>{if(!h.isEnabled)return;const c=this.getParam(h.param);c&&h.releaseEnvelope(c,s,{playbackRate:r,voiceId:this.nodeId,midiNote:a(this,O)??60})}),e<=0)return this.stop(s);this.sendToProcessor({type:"voice:release",timestamp:s});const o=Array.from(a(this,k).values()).filter(h=>h.isEnabled),l=o.length>0?Math.max(...o.map(h=>h.effectiveReleaseDuration)):e;return a(this,ut)&&clearTimeout(a(this,ut)),u(this,ut,setTimeout(()=>{try{(a(this,W)===z.RELEASING||a(this,W)===z.PLAYING)&&this.stop()}finally{u(this,ut,null)}},l*1e3+50)),this}stop(e=this.now){if(a(this,W)===z.STOPPED||a(this,W)===z.STOPPING)return this;u(this,W,z.STOPPING);const t=.005,n=Math.max(e,this.now),s=this.getParam("envGain");return s&&(Oi(s,n),s.linearRampToValueAtTime(0,n+t)),a(this,dt)&&clearTimeout(a(this,dt)),u(this,dt,setTimeout(()=>{this.sendToProcessor({type:"voice:stop",timestamp:n}),u(this,dt,null)},Math.max(0,(n+t-this.now)*1e3))),this}setModulationAmount(e,t){var n;const s=Ce(t,0,1,0,.95,{warn:!0,name:"sampleVoice.setModulationAmount"});return e==="AM"?(a(this,q)||y(this,C,es).call(this,s),(n=a(this,q))==null||n.setDepth(s)):e==="FM"&&console.warn("SampleVoice: FM modulation not implemented yet"),this}setModulationWaveform(e="AM",t="triangle",n={}){var s;return e==="AM"?(a(this,q)||y(this,C,es).call(this),(s=a(this,q))==null||s.setWaveform(t,n)):e==="FM"&&console.info("SampleVoice: FM modulation not implemented yet"),this}addEnvelopePoint(e,t,n){const s=a(this,k).get(e);s!=null&&s.isEnabled&&s.addPoint(t,n)}updateEnvelopePoint(e,t,n,s){const r=a(this,k).get(e);r!=null&&r.isEnabled&&r.updatePoint(t,n,s)}deleteEnvelopePoint(e,t){const n=a(this,k).get(e);n!=null&&n.isEnabled&&n.deletePoint(t)}get envelopes(){return a(this,k)}setParam(e,t,n=this.now,s={}){const r=this.getParam(e);if(!r||r.value===t)return this;const{glideTime:o=0,cancelPrevious:l=!0}=s;return l&&r.cancelScheduledValues(n),o<=0?r.setValueAtTime(t,Math.max(n,this.now+.001)):r.linearRampToValueAtTime(t,n+Math.max(o,.001)),this}setParams(e,t,n={}){const s=e.filter(r=>this.getParam(r.name)!==null);return s.length===0?this:(s.forEach(({name:r,value:o})=>{this.setParam(r,o,t,{...n})}),this)}setLoopPoints(e,t,n=this.now,s=0){return e>=t?this:(e!==void 0&&this.setParam("loopStart",e,n,{glideTime:s,cancelPrevious:!0}),t!==void 0&&this.setParam("loopEnd",t,n,{glideTime:s,cancelPrevious:!0}),this)}syncLoopToTempo(e){return this.sendToProcessor({type:"syncLoopToTempo",value:e}),this}setKeytrackLoopAmount(e){return this.sendToProcessor({type:"setKeytrackLoopAmount",value:e}),this}setTempo(e){return this.setParam("tempo",e,this.now),this}setAllowedPeriods(e){return this.sendToProcessor({type:"setAllowedPeriods",allowedPeriods:e}),this}connect(e,t,n){return e instanceof qe?this.out.connect(e.input,t):e instanceof AudioParam?this.out.connect(e,t):e instanceof AudioNode?this.out.connect(e,t,n):console.warn(`SampleVoice: Unsupported destination: ${e}`),e}disconnect(e="main",t){return e==="alt"?(console.warn('SampleVoice has no "alt" output to disconnect'),this):(t?t instanceof AudioNode?this.out.disconnect(t):t instanceof AudioParam&&this.out.disconnect(t):this.out.disconnect(),this)}onMessage(e,t){return a(this,En).onMessage(e,t)}sendToProcessor(e){return a(this,le).port.postMessage(e),this}sendUpstreamMessage(e,t){return a(this,En).sendMessage(e,t),this}getPlaybackDuration(){const e=this.getParam("startPoint").value;return this.getParam("endPoint").value-e}get isActive(){return a(this,O)!==null}get feedback(){return a(this,_e)}get currMidiNote(){return a(this,O)}get hpf(){return a(this,be)}get lpf(){return a(this,Ae)}get in(){return null}get out(){return a(this,Dn)}get state(){return a(this,W)}get initialized(){return a(this,Es)}get now(){return this.context.currentTime}get activeNoteId(){return a(this,O)}get triggerTimestamp(){return a(this,Zi)}get sampleDurationSeconds(){return a(this,Ai)}get startPoint(){return this.getParam("startPoint").value}get endPoint(){return this.getParam("endPoint").value}get releaseTime(){return a(this,k).get("amp-env").effectiveReleaseDuration}setMasterGain(e){const t=a(this,le).parameters.get("masterGain");t.cancelScheduledValues(this.context.currentTime),t.setTargetAtTime(e,this.context.currentTime,.006)}enablePositionTracking(e){return this.sendToProcessor({type:"voice:usePlaybackPosition",value:e}),this}setLoopEnabled(e){return this.sendToProcessor({type:"setLoopEnabled",value:e}),!e&&a(this,O)&&this.release({}),this}setPlaybackRate(e,t=this.now,n){return this.setParam("playbackRate",e,t,n),y(this,C,on).call(this,e,t,n),y(this,C,ln).call(this,e,t,n),this}setHpfCutoff(e,t=this.now,n={}){var s;const r=G(e,20,this.context.sampleRate/2-1e3);if(u(this,Mn,r),a(this,be)){this.setParam("hpf",r,t,{glideTime:0});const o=((s=this.getParam("playbackRate"))==null?void 0:s.value)??1;y(this,C,on).call(this,o,t,n)}return this}setLpfCutoff(e,t=this.now,n={}){var s;const r=G(e,20,this.context.sampleRate/2-1e3);if(u(this,At,r),a(this,Ae)){this.setParam("lpf",r,t,{glideTime:0,cancelPrevious:!0});const o=((s=this.getParam("playbackRate"))==null?void 0:s.value)??1;y(this,C,ln).call(this,o,t,n)}return this}setPlaybackDirection(e){return this.sendToProcessor({type:"voice:setPlaybackDirection",playbackDirection:e}),this}setLoopDurationDriftAmount(e){if(e===0)return this.setParam("loopDurationDriftAmount",0,this.now),this;const t=Fl(e,{inputRange:{min:0,max:1},outputRange:{min:1e-4,max:1},blend:1,curve:"linear"});return this.setParam("loopDurationDriftAmount",t,this.now),this}debugDuration(){console.info(`
      sample duration: ${this.sampleDurationSeconds}, 
      startPoint: ${this.getParam("startPoint").value}, 
      endPoint: ${this.getParam("endPoint").value}, 
      playback duration: ${this.getPlaybackDuration()}
      `)}dispose(){this.stop(),this.disconnect(),y(this,C,qr).call(this),a(this,k).forEach(e=>e.dispose()),a(this,le).port.close(),a(this,ut)&&clearTimeout(a(this,ut)),a(this,dt)&&clearTimeout(a(this,dt)),ze(this.nodeId)}getParam(e){var t,n,s,r;if(a(this,le)&&a(this,le).parameters.has(e))return a(this,le).parameters.get(e)??null;if(a(this,bt))switch(e){case"highpass":case"hpf":return((t=a(this,be))==null?void 0:t.frequency)||null;case"lowpass":case"lpf":return((n=a(this,Ae))==null?void 0:n.frequency)||null;case"hpfQ":return((s=a(this,be))==null?void 0:s.Q)||null;case"lpfQ":return((r=a(this,Ae))==null?void 0:r.Q)||null}return null}}En=new WeakMap,Tt=new WeakMap,Dn=new WeakMap,le=new WeakMap,q=new WeakMap,Be=new WeakMap,_e=new WeakMap,k=new WeakMap,W=new WeakMap,Es=new WeakMap,O=new WeakMap,Zi=new WeakMap,Ai=new WeakMap,Xi=new WeakMap,bt=new WeakMap,rn=new WeakMap,be=new WeakMap,Ae=new WeakMap,Mn=new WeakMap,oa=new WeakMap,At=new WeakMap,la=new WeakMap,Ji=new WeakMap,$i=new WeakMap,C=new WeakSet,Wr=function(){Se(a(this,_e),"SampleVoice: Feedback not initialized!"),Se(a(this,Be),"SampleVoice: AM mod not initialized!"),a(this,bt)?(Se(a(this,be)&&a(this,Ae),"SampleVoice: Filters not initialized!"),a(this,le).connect(a(this,_e).input),a(this,_e).output.connect(a(this,Be)),a(this,Be).connect(a(this,be)),a(this,be).connect(a(this,Ae)),a(this,Ae).connect(a(this,Dn))):(a(this,le).connect(a(this,_e).input),a(this,_e).output.connect(a(this,Be)),a(this,Be).connect(a(this,Dn)))},zr=function(){u(this,Mn,40),u(this,At,this.context.sampleRate/2-1e3),a(this,be)||u(this,be,new BiquadFilterNode(this.context,{type:"highpass",frequency:a(this,Mn),Q:a(this,oa)})),a(this,Ae)||u(this,Ae,new BiquadFilterNode(this.context,{type:"lowpass",frequency:a(this,At),Q:a(this,la)}))},ha=function(){a(this,k).forEach(n=>n.dispose()),a(this,k).clear();const i=a(this,Ai)||void 0,e=Fs(this.context,"amp-env",{durationSeconds:i});a(this,k).set("amp-env",e);const t=Fs(this.context,"pitch-env",{durationSeconds:i});if(a(this,k).set("pitch-env",t),a(this,bt)){const n=Fs(this.context,"filter-env",{durationSeconds:i,envPointValueRange:[0,1],initEnable:!1});a(this,k).set("filter-env",n)}y(this,C,qa).call(this)},Hr=new WeakMap,jr=function(i){return this.sendToProcessor({type:"voice:set_zero_crossings",zeroCrossings:i}),this},ut=new WeakMap,dt=new WeakMap,on=function(i,e=this.now,t={}){if(!a(this,O)||!a(this,be)||a(this,$i)<=0)return;const n=a(this,be).frequency,{glideTime:s=0,cancelPrevious:r=!0}=t||{};r&&n.cancelScheduledValues(e);const o=a(this,Mn)*i*a(this,$i),l=G(o,20,this.context.sampleRate/2-1e3);s>0?n.setTargetAtTime(l,e,s):n.setValueAtTime(l,Math.max(e,this.now+.001))},ln=function(i,e=this.now,t={}){if(!a(this,O)||!a(this,Ae)||a(this,Ji)<=0)return;const n=a(this,Ae).frequency,{glideTime:s=0,cancelPrevious:r=!0}=t||{};r&&n.cancelScheduledValues(e);const o=a(this,At)*i*a(this,Ji),l=G(o,20,this.context.sampleRate/2-1e3);s>0?n.setTargetAtTime(l,e,s):n.setValueAtTime(l,Math.max(e,this.now+.001))},es=function(i=0,e="square",t={}){if(a(this,q)===null)if(u(this,q,new Js(this.context)),a(this,q).setWaveform(e,t),a(this,q).setDepth(i),a(this,q).setMusicalNote(a(this,O)??60),a(this,Be))a(this,q).connect(a(this,Be).gain);else throw console.error("Missing gain node for AM-LFO in SampleVoice"),new Error("Missing gain node for AM-LFO in SampleVoice");else console.debug("setupAmpModLFO: LFO already setup: ",a(this,q));return this},qr=function(){if(a(this,q))return a(this,q).dispose(),u(this,q,null),this},qa=function(){a(this,k).forEach((i,e)=>{a(this,En).forwardFrom(i,[`${e}:trigger`,`${e}:release`,`${e}:trigger:loop`,`${e}:created`],t=>({...t,voiceId:this.nodeId,midiNote:a(this,O)}))})},Kr=function(){a(this,le).port.onmessage=i=>{var e;let{type:t,...n}=i.data;switch(t){case"initialized":u(this,Es,!0),u(this,W,z.NOT_READY),this.sendUpstreamMessage("voice:initialized",{voice:this,voiceId:this.nodeId});break;case"voice:loaded":u(this,O,null),n.durationSeconds&&(u(this,Ai,n.durationSeconds),y(this,C,ha).call(this),this.setStartPoint(0),this.setEndPoint(n.durationSeconds)),u(this,W,z.LOADED);break;case"voice:started":u(this,W,z.PLAYING),n={voice:this,midiNote:a(this,O)};break;case"voice:stopped":u(this,W,z.STOPPED),n={voiceId:this.nodeId,voice:this,midiNote:a(this,O)},u(this,O,null);break;case"voice:releasing":u(this,W,z.RELEASING),n={voiceId:this.nodeId,voice:this,midiNote:a(this,O)};break;case"loop:enabled":break;case"voice:looped":break;case"voice:playbackDirectionChange":break;case"voice:position":(e=this.getParam("playbackPosition"))==null||e.setValueAtTime(n.position,this.context.currentTime);break;case"debug:params":console.debug("Debug params: ",{loopStart:n.loopStart},{loopStartSamples:n.loopStartSamples},{loopEnd:n.loopEnd},{loopEndSamples:n.loopEndSamples});break;case"debug:release":console.debug("SampleVoice release debug:",n);break;case"debug:loop":console.log("Loop debug:",n);break;default:console.warn(`Unhandled message type: ${t}`);break}this.sendUpstreamMessage(t,n)}};async function lh(i,e){const t=new oh(i,e);return await t.init(),t}async function hh(i,e,t){const n=Array.from({length:i},()=>lh(e,t));return Promise.all(n)}var Sn,ts,hn,pt,ni,H,Cn,he,Ie,Re,ce,ii,ns,si,Pn,Qr,ca,Ka,Us;class ch{constructor(e,t){p(this,Pn),b(this,"nodeId"),b(this,"nodeType","pool"),p(this,Sn),p(this,ts),p(this,hn,!1),p(this,pt,null),p(this,ni),p(this,H,[]),p(this,Cn,new Set),p(this,he,new Set),p(this,Ie,new Set),p(this,Re,new Set),p(this,ce,new Map),p(this,ii,1),p(this,ns,new Set),p(this,si,new Map),b(this,"prevMidiNote",60),p(this,ca,.4),this.nodeId=We(this.nodeType,this),u(this,Sn,wt(this.nodeId)),u(this,ts,e),u(this,ni,t)}async init(){if(!a(this,hn))return a(this,pt)?a(this,pt):(u(this,pt,(async()=>{try{u(this,H,await hh(a(this,ni),a(this,ts))),a(this,H).forEach(e=>{a(this,he).add(e),y(this,Pn,Qr).call(this,e)}),u(this,hn,!0)}catch(e){a(this,H).forEach(n=>n.dispose()),u(this,H,[]),a(this,he).clear(),u(this,pt,null);const t=e instanceof Error?e.message:String(e);throw new Error(`Failed to initialize SamplePlayer: ${t}`)}})()),a(this,pt))}connect(e){a(this,H).forEach(t=>{t.connect(e)})}disconnect(){a(this,H).forEach(e=>{e.disconnect()})}onMessage(e,t){return a(this,Sn).onMessage(e,t)}sendUpstreamMessage(e,t){return a(this,Sn).sendMessage(e,t),this}setBuffer(e,t){return a(this,Cn).clear(),a(this,H).forEach(n=>n.loadBuffer(e,t)),this}allocate(e=a(this,he),t=a(this,Re)){let n;return e.size?n=Ba(e):t.size&&(n=Ba(t),n==null||n.stop()),n||console.warn("Could not allocate voice"),n}noteOn(e,t=100,n=0,s=0){if(this.playingVoicesCount>=a(this,ni))return console.log("Pool noteON(): Max polyphony reached, cannot play new note"),null;const r=this.allocate();return r!=null&&r.trigger({midiNote:e,velocity:t,secondsFromNow:n,glide:{prevMidiNote:this.prevMidiNote,glideTime:s}})&&r?(a(this,ce).set(e,r),this.prevMidiNote=e,e):null}noteOff(e,t=0,n){const s=a(this,ce).get(e);if(s)return(s==null?void 0:s.state)===z.PLAYING&&s.release({secondsFromNow:t,releaseTime:n}),this}allNotesOff(e=0){return a(this,ce).forEach(t=>{t.release({releaseTime:e})}),a(this,ce).clear(),this}applyToAllVoices(e){a(this,H).forEach(t=>e(t))}applyToActiveVoices(e){a(this,ce).forEach(t=>e(t))}applyToInactiveVoices(e){a(this,he).forEach(t=>e(t))}applyToActiveNote(e,t){const n=a(this,ce).get(e);n?t(n):console.warn(`No active voice found for midiNote: ${e}`)}debug(){console.debug(`
      releasing: ${a(this,Re).size}
      playing: ${a(this,Ie).size}
      available: ${a(this,he).size}
      Sum: ${a(this,Re).size+a(this,Ie).size+a(this,he).size}
      Sum should be: ${this.allVoicesCount}
      `,{midiToVoiceMap:a(this,ce)})}dispose(){this.applyToAllVoices(e=>e.dispose()),u(this,H,[]),a(this,ce).clear(),a(this,he).clear(),a(this,Re).clear(),a(this,Ie).clear(),a(this,Cn).clear(),u(this,hn,!1),u(this,pt,null),ze(this.nodeId)}get initialized(){return a(this,hn)}get availableVoices(){return a(this,he)}get playingVoicesCount(){return a(this,Ie).size}get releasingVoicesCount(){return a(this,Re).size}get availableVoicesCount(){return a(this,he).size}get allVoices(){return a(this,H)}get allVoicesCount(){return a(this,H).length}get assignedVoicesMidiMap(){return a(this,ce)}}Sn=new WeakMap,ts=new WeakMap,hn=new WeakMap,pt=new WeakMap,ni=new WeakMap,H=new WeakMap,Cn=new WeakMap,he=new WeakMap,Ie=new WeakMap,Re=new WeakMap,ce=new WeakMap,ii=new WeakMap,ns=new WeakMap,si=new WeakMap,Pn=new WeakSet,Qr=function(i){i.onMessage("voice:started",e=>{a(this,he).delete(e.voice),a(this,Re).delete(e.voice),a(this,Ie).add(e.voice),y(this,Pn,Us).call(this),a(this,ce).set(e.midiNote,e.voice)}),i.onMessage("voice:releasing",e=>{a(this,he).delete(e.voice),a(this,Ie).delete(e.voice),a(this,Re).add(e.voice)}),i.onMessage("voice:stopped",e=>{a(this,Ie).delete(e.voice),a(this,Re).delete(e.voice),y(this,Pn,Us).call(this),a(this,he).add(e.voice),e.midiNote!==void 0&&a(this,ce).get(e.midiNote)===e.voice&&a(this,ce).delete(e.midiNote)}),i.onMessage("voice:initialized",e=>{a(this,ns).add(e.voice),a(this,ns).size===a(this,H).length&&this.sendUpstreamMessage("voice-pool:initialized",{voiceCount:a(this,H).length})}),["amp-env","pitch-env","filter-env"].forEach(e=>{i.onMessage(`${e}:created`,t=>{a(this,si).has(e)||a(this,si).set(e,new Set);const n=a(this,si).get(e);n.add(t.voice),n.size===a(this,H).length&&this.sendUpstreamMessage(`${e}:created`,{envType:e,voiceCount:a(this,H).length})})}),a(this,Sn).forwardFrom(i,["voice:initialized","voice:started","voice:stopped","voice:releasing","voice:loaded","amp-env:trigger","amp-env:trigger:loop","amp-env:release","pitch-env:trigger","pitch-env:trigger:loop","pitch-env:release","filter-env:trigger","filter-env:trigger:loop","filter-env:release","amp-env:created","pitch-env:created","filter-env:created"],e=>e.type==="voice:loaded"?(a(this,Cn).add(e.senderId),a(this,Cn).size===a(this,H).length?{...e,type:"sample:loaded"}:null):e)},ca=new WeakMap,Ka=function(){const i=a(this,Ie).size+a(this,Re).size;if(i===0){u(this,ii,1);return}u(this,ii,1/(1+Math.log10(i)*a(this,ca))),[...a(this,Ie)].forEach(e=>{e.setMasterGain(a(this,ii))})},Us=function(){y(this,Pn,Ka).call(this)};async function uh(i,e){const t=new ch(i,e);return await t.init(),t}var Tn,cn,un,Nn,is,ai,dn,ri,pn,Lt,Nt,fn,oi,kt,li,oe,Y,Z,ke,Me,Dt,mn,ss,as,rs,os,ls,hs,ua,da,cs,us,Ct,ds,pa,ft,Ye,Yr,Zr,Xr,fa,Jr,Qa,hi,ci,It;class dh{constructor(e,t=16,n){p(this,Ye),b(this,"nodeId"),b(this,"nodeType","sample-player"),b(this,"context"),p(this,Tn),p(this,cn,!1),p(this,un,null),p(this,Nn,!1),p(this,is),p(this,ai,null),p(this,dn,new Set),p(this,ri,new Set),p(this,pn,null),p(this,Lt,0),p(this,Nt,!1),p(this,fn,!1),p(this,oi,!1),p(this,kt,!1),p(this,li,!1),p(this,oe),p(this,Y),p(this,Z),p(this,ke,null),p(this,Me,null),p(this,Dt,0),p(this,mn,120),p(this,ss,Wt.glide.defaultValue),p(this,as,Wt.loopRampDuration.defaultValue),p(this,rs,Wt.keytrackLoop.defaultValue),p(this,os,Wt.highpassFilter.defaultValue),p(this,ls,Wt.lowpassFilter.defaultValue),p(this,hs,!1),p(this,ua,300),p(this,da,20),p(this,cs,!1),p(this,us,!1),p(this,Ct,[]),p(this,ds,!0),p(this,pa,!0),b(this,"randomizeVelocity",!1),b(this,"voicePool"),b(this,"outBus"),p(this,ft,new Set),b(this,"setModulationAmount",(s,r)=>this.voicePool.applyToAllVoices(o=>o.setModulationAmount(s,r))),p(this,hi,!1),b(this,"panic",s=>this.releaseAll(s)),p(this,ci,!1),b(this,"sustainPedalOn",()=>this.setSustainPedal(!0)),b(this,"sustainPedalOff",()=>this.setSustainPedal(!1)),b(this,"setPanDriftEnabled",s=>(this.voicePool.applyToAllVoices(r=>r.setPanDriftEnabled(s)),this)),b(this,"setTimestretchEnabled",s=>(this.voicePool.applyToAllVoices(r=>r.setTimestretchEnabled(s)),this)),b(this,"isNormalized",(s,r=[0,1])=>s>=r[0]&&s<=r[1]),b(this,"MIN_LOOP_DURATION_SECONDS",1/523.25),b(this,"setLoopStart",(s,r=this.getLoopRampDuration())=>this.setLoopPoint("start",s,this.loopEnd,r)),b(this,"setLoopEnd",(s,r=this.getLoopRampDuration())=>this.setLoopPoint("end",this.loopStart,s,r)),b(this,"setLoopDuration",(s,r=this.getLoopRampDuration())=>this.setLoopPoint("end",this.loopStart,this.loopStart+s,r)),b(this,"debugcounter",0),b(this,"getKeytrackLoopAmount",()=>a(this,rs)),b(this,"getHpfCutoff",()=>a(this,os)),b(this,"getLpfCutoff",()=>a(this,ls)),b(this,"enablePitch",()=>this.voicePool.allVoices.forEach(s=>s.enablePitch())),b(this,"disablePitch",()=>this.voicePool.allVoices.forEach(s=>s.disablePitch())),b(this,"enableEnvelope",s=>{this.voicePool.applyToAllVoices(r=>r.enableEnvelope(s))}),b(this,"disableEnvelope",s=>{this.voicePool.applyToAllVoices(r=>r.disableEnvelope(s))}),b(this,"setEnvelopeLoop",(s,r,o="normal")=>{this.voicePool.applyToAllVoices(l=>l.setEnvelopeLoop(s,r,o))}),b(this,"setEnvelopeSync",(s,r)=>{this.voicePool.applyToAllVoices(o=>o.syncEnvelopeToPlaybackRate(s,r))}),b(this,"setEnvelopeTimeScale",(s,r)=>{this.voicePool.applyToAllVoices(o=>o.setEnvelopeTimeScale(s,r))}),b(this,"setDryWetMix",s=>{this.outBus.setDryWetMix(s)}),b(this,"sendToFx",(s,r)=>{this.outBus.setSendAmount(s,r)}),b(this,"setLpfCutoff",(s,r="pre")=>{u(this,ls,s),r==="pre"?this.voicePool.applyToAllVoices(o=>{o.setLpfCutoff(s)}):r==="post"&&this.outBus.setLpfCutoff(s)}),b(this,"setHpfCutoff",(s,r="pre")=>{u(this,os,s),r==="pre"?this.voicePool.applyToAllVoices(o=>{o.setHpfCutoff(s)}):r==="post"&&this.outBus.setHpfCutoff(s)}),b(this,"setReverbAmount",s=>{this.outBus.setReverbSize(s)}),b(this,"setFeedbackAmount",s=>{s=G(s,0,1),(a(this,It)==="monophonic"||a(this,It)==="double-trouble")&&this.outBus.setFeedbackAmount(s),(a(this,It)==="polyphonic"||a(this,It)==="double-trouble")&&this.voicePool.applyToAllVoices(r=>{var o;(o=r.feedback)==null||o.setAmountMacro(s)})}),p(this,It,"monophonic"),this.nodeId=We("sample-player",this),this.context=e,u(this,Tn,wt(this.nodeId)),u(this,oe,new GainNode(this.context,{gain:.5})),u(this,Y,new za(this.context,0)),u(this,Z,new za(this.context,0)),u(this,is,t),u(this,ai,n||null)}async init(){if(!a(this,cn))return a(this,un)?a(this,un):(u(this,un,(async()=>{var e,t,n;try{this.outBus=await rh(this.context),this.voicePool=await uh(this.context,a(this,is)),y(this,Ye,fa).call(this),y(this,Ye,Yr).call(this),y(this,Ye,Xr).call(this),y(this,Ye,Jr).call(this),y(this,Ye,Zr).call(this),a(this,ai)&&await this.loadSample(a(this,ai),void 0,{skipPreProcessing:!0}),u(this,cn,!0)}catch(s){(e=this.voicePool)==null||e.dispose(),(t=a(this,Y))==null||t.dispose(),(n=a(this,Z))==null||n.dispose();const r=s instanceof Error?s.message:String(s);throw new Error(`Failed to initialize SamplePlayer: ${r}`)}})()),a(this,un))}onMessage(e,t){return a(this,Tn).onMessage(e,t)}sendUpstreamMessage(e,t){return a(this,Tn).sendMessage(e,t),this}connect(e){var t;const n="input"in e&&e.input?e.input:e;a(this,oe).connect(n),"nodeId"in e&&(a(this,dn).add(e.nodeId),(t=e.addIncoming)==null||t.call(e,this.nodeId))}disconnect(e){var t;if(e){const n="input"in e?e.input:e;a(this,oe).disconnect(n),"nodeId"in e&&(a(this,dn).delete(e.nodeId),(t=e.removeIncoming)==null||t.call(e,this.nodeId))}else a(this,oe).disconnect(),a(this,dn).clear()}addIncoming(e){a(this,ri).add(e.nodeId)}removeIncoming(e){a(this,ri).delete(e.nodeId)}get connections(){return{outgoing:Array.from(a(this,dn)),incoming:Array.from(a(this,ri))}}get audioNode(){return a(this,oe)}get input(){return this.outBus.input}get output(){return a(this,oe)}get now(){return this.context.currentTime}get initialized(){return a(this,cn)}getMacrosAudioParam(e){switch(e){case"loopStart":return a(this,Y).audioParam;case"loopEnd":return a(this,Z).audioParam;default:const t=e;throw new Error(`Unknown macro parameter: ${t}`)}}getMacro(e){switch(e){case"loopStart":return a(this,Y);case"loopEnd":return a(this,Z);default:const t=e;throw new Error(`Unknown macro parameter: ${t}`)}}setModulationWaveform(e="AM",t="triangle",n={}){this.voicePool.applyToAllVoices(s=>s.setModulationWaveform(e,t,n))}syncLFOsToNoteFreq(e,t){var n,s,r,o,l,h;if(e==="gain-lfo"){if(t===!0)(n=a(this,ke))==null||n.storeCurrentValues();else{const c=(s=a(this,ke))==null?void 0:s.getStoredValues();c&&((r=a(this,ke))==null||r.setFrequency(c.rate))}u(this,cs,t)}if(e==="pitch-lfo"){if(t===!0)(o=a(this,Me))==null||o.storeCurrentValues();else{const c=(l=a(this,Me))==null?void 0:l.getStoredValues();c&&((h=a(this,Me))==null||h.setFrequency(c.rate))}u(this,us,t)}}freezeActiveVoices(e){return console.info(`SamplePlayer: freezeActiveVoices(${e}). Spectral freeze not implemented yet`),this}async loadSample(e,t,n){if(a(this,hi))throw new Error("A sample load is already in progress");u(this,hi,!0);let s;try{if(e instanceof ArrayBuffer&&(e=await this.context.decodeAudioData(e.slice(0))),!el(e))return console.error("Invalid AudioBuffer provided to loadSample"),null;if(e.sampleRate!==this.context.sampleRate)throw new RangeError(`Sample rate mismatch: buffer rate ${e.sampleRate}, context rate ${this.context.sampleRate}`);t&&this.context.sampleRate!==t&&console.warn(`Sample rate mismatch: context rate ${this.context.sampleRate}, requested rate ${t}`),this.releaseAll(0),this.transposeSemitones=0,u(this,Nn,!1),u(this,pn,null);let r;a(this,pa)&&(r=await Tr(this.context,e,n),e=r.audiobuffer,a(this,ds)&&r.zeroCrossings&&u(this,Ct,r.zeroCrossings)),u(this,pn,e),u(this,Lt,e.duration);const o=new Promise(h=>{s=this.voicePool.onMessage("sample:loaded",()=>{h()})});this.voicePool.setBuffer(e,a(this,Ct)),y(this,Ye,fa).call(this);const l={rootNote:"C",scale:[0],lowestOctave:0,highestOctave:5,tuningOffset:0,normalize:!1};return this.setScale(l),await o,e}finally{s==null||s(),u(this,hi,!1)}}async cropSample(e=this.getStartPoint(),t=this.getEndPoint(),n=4){const s=a(this,pn);if(!s||!Number.isFinite(e)||!Number.isFinite(t))return null;const r=Math.max(0,Math.floor(e*s.sampleRate)),o=Math.min(s.length,Math.ceil(t*s.sampleRate));if(o<=r)return null;const l=Pr(this.context,s,r,o,n);return this.loadSample(l,void 0,{skipPreProcessing:!0})}async detectPitch(e){const t=await Sr(e),n=Er(t.frequency),s=69+12*Math.log2(t.frequency/440),r=n.frequency/t.frequency;return console.table({pitchSource:t,targetNoteInfo:n,playbackRateMultiplier:r,midiFloat:s}),this.sendUpstreamMessage("sample:pitch-detected",{pitchResults:t,closestNoteInfo:n}),{frequency:t.frequency,confidence:t.confidence,midiFloat:s,targetNoteInfo:n}}detectedPitchToTransposition(e,t){let n=t-e;for(;n>6;)n-=12;for(;n<-6;)n+=12;return n}play(e,t=100,n=this.getGlideTime()){var s,r;const o=Va(t)?t:100,l=e+a(this,Dt);return Va(l)?(a(this,cs)&&((s=a(this,ke))==null||s.setMusicalNote(l)),a(this,us)&&((r=a(this,Me))==null||r.setMusicalNote(l,{divisor:4})),this.outBus.noteOn(l,o,0,n),this.voicePool.noteOn(l,o,0,n)):(console.warn(`Invalid midiNote: ${l}`),null)}release(e){if(this.holdEnabled||a(this,kt))return this;const t=e+a(this,Dt);return a(this,li)?(a(this,ft).add(t),this):(a(this,ft).delete(t),this.voicePool.noteOff(t),this.sendUpstreamMessage("note:off",{transposedMidiNote:t}),this)}releaseAll(e){var t;return a(this,ft).clear(),(t=this.voicePool)==null||t.allNotesOff(e),this}get transposedBySemitones(){return a(this,Dt)}set transposeSemitones(e){a(this,Dt)!==e&&u(this,Dt,e)}setScale(e){return a(this,Y).setScale({snapToZeroCrossings:a(this,Ct),...e}),a(this,Z).setScale({snapToZeroCrossings:a(this,Ct),...e}),this}setRootNote(e){const t=Ri[e];let n=t===0?0:t-12;return this.transposedBySemitones===n?this:(this.transposeSemitones=n,a(this,Z).setRootNote(e),a(this,Y).setRootNote(e),this)}setVolume(e){return e=G(e,0,1),a(this,oe).gain.setValueAtTime(e,this.now),this}setSampleStartPoint(e){return this.voicePool.applyToAllVoices(t=>t.setStartPoint(e)),this.sendUpstreamMessage("start-point:updated",{startPoint:e}),this}setSampleEndPoint(e){return this.voicePool.applyToAllVoices(t=>t.setEndPoint(e)),this.sendUpstreamMessage("end-point:updated",{endPoint:e}),this}setLoopRampDuration(e){return u(this,as,e),this}setGlideTime(e){return u(this,ss,e),this}setLoopEnabled(e){return a(this,Nt)===e?this:a(this,fn)&&!e?this:(this.voicePool.allVoices.forEach(t=>t.setLoopEnabled(e)),u(this,Nt,e),this.sendUpstreamMessage("loop:enabled",{enabled:e}),this)}setLoopLocked(e){return a(this,fn)===e?this:(u(this,fn,e),this.setLoopEnabled(e),this.sendUpstreamMessage("loop:locked",{locked:e}),this)}setHoldEnabled(e){return a(this,oi)===e?this:a(this,kt)&&!e?this:(u(this,oi,e),e||this.releaseAll(.1),this.sendUpstreamMessage("hold:enabled",{enabled:e}),this)}setHoldLocked(e){return a(this,kt)===e?this:(u(this,kt,e),e===!1&&this.releaseAll(),this.sendUpstreamMessage("hold:locked",{locked:e}),this)}setSustainPedal(e){if(a(this,li)===e)return this;if(u(this,li,e),a(this,fn)||(a(this,ci)&&!e?(u(this,ci,!1),this.setLoopEnabled(!1)):e&&!a(this,Nt)&&(this.setLoopEnabled(!0),u(this,ci,!0))),a(this,kt)||this.setHoldEnabled(e),!e){for(const t of a(this,ft))this.voicePool.noteOff(t),this.sendUpstreamMessage("note:off",{transposedMidiNote:t});a(this,ft).clear()}return this}setPlaybackDirection(e){return this.voicePool.applyToAllVoices(t=>t.setPlaybackDirection(e)),this}setLoopDurationDriftAmount(e){return this.voicePool.applyToAllVoices(t=>t.setLoopDurationDriftAmount(e)),this}setTempo(e){if(!(e<a(this,da)||e>a(this,ua)))return u(this,mn,e),this.voicePool.applyToAllVoices(t=>t.setTempo(e)),this.sendUpstreamMessage("tempo:updated",{bpm:e}),this}syncLoopToTempo(e){return this.voicePool.applyToAllVoices(t=>t.syncLoopToTempo(e)),this}setKeytrackLoopAmount(e){const t=Math.max(0,Math.min(1,e));return u(this,rs,t),this.voicePool.applyToAllVoices(n=>n.setKeytrackLoopAmount(t)),this}get tempo(){return a(this,mn)}setLoopPoint(e,t,n,s=this.getLoopRampDuration()){let r=e==="start"?G(t,this.MIN_LOOP_DURATION_SECONDS/2,n):t;if(e==="start"&&r===this.loopStart)return this;let o=G(n,r,a(this,Lt)-this.MIN_LOOP_DURATION_SECONDS/2);if(e==="end"&&o===this.loopEnd)return this;const l=o-r,h=s*1;if(e==="start"&&r!==this.loopStart){if(a(this,hs)){const c=60/a(this,mn),f=Math.round(l/c);r=o-f*c}l<this.MIN_LOOP_DURATION_SECONDS&&(r=o-this.MIN_LOOP_DURATION_SECONDS),a(this,Y).ramp(r,h,o)}else if(e==="end"&&o!==this.loopEnd){if(a(this,hs)){const c=60/a(this,mn),f=Math.round(l/c);o=r+f*c}l<this.MIN_LOOP_DURATION_SECONDS&&(o=r+this.MIN_LOOP_DURATION_SECONDS),a(this,Z).ramp(o,h,r)}return this.sendUpstreamMessage("loop-points:updated",{loopStart:this.loopStart,loopEnd:this.loopEnd}),this}scrollLoopPoints(e,t){const n=this.context.currentTime;return a(this,Y).setValue(e,n),a(this,Z).setValue(t,n),this.sendUpstreamMessage("loop-points:updated",{loopStart:this.loopStart,loopEnd:this.loopEnd}),this}setParam(e,t){switch(e){case"startPoint":this.setSampleStartPoint(t);break;case"endPoint":this.setSampleEndPoint(t);break;case"glideTime":this.setGlideTime(t);break;case"loopStart":this.setLoopStart(t);break;case"loopEnd":this.setLoopEnd(t);break;case"loopRampDuration":this.setLoopRampDuration(t);break;default:console.warn(`Unknown parameter: ${e}`)}return this}applyParams(e){return Object.entries(e).forEach(([t,n])=>{const s=Wt[t];!s||!Jl(s,n)||s.apply(this,n)}),this}getAudioParam(e){switch(e){case"loopStart":return a(this,Y).audioParam;case"loopEnd":return a(this,Z).audioParam;default:return console.warn(`Parameter '${e}' not found on SamplePlayer`),null}}getStartPoint(){var e,t;return((t=(e=this.voicePool)==null?void 0:e.allVoices[0])==null?void 0:t.startPoint)??0}getEndPoint(){var e,t;return((t=(e=this.voicePool)==null?void 0:e.allVoices[0])==null?void 0:t.endPoint)??this.sampleDuration}getLoopRampDuration(){return a(this,as)}getGlideTime(){return a(this,ss)}getParameterValue(e){switch(e){case"loopStart":return this.loopStart;case"loopEnd":return this.loopEnd;case"loopRampDuration":return this.getLoopRampDuration();case"startPoint":return this.getStartPoint();case"endPoint":return this.getEndPoint();case"glideTime":return this.getGlideTime();case"hpfCutoff":return this.getHpfCutoff();case"lpfCutoff":return this.getLpfCutoff();default:console.warn(`Unknown parameter: ${e}`);return}}getEnvelope(e){const t=this.voicePool.allVoices[0];if(!t)throw new Error("No voices available in voice pool");const n=t.getEnvelope(e);if(!n)throw new Error(`Envelope type '${e}' not found`);return n}setEnvelopeSustainPoint(e,t){this.voicePool.applyToAllVoices(n=>n.setEnvelopeSustainPoint(e,t))}setEnvelopeReleasePoint(e,t){this.voicePool.applyToAllVoices(n=>n.setEnvelopeReleasePoint(e,t))}updateEnvelopePoint(e,t,n,s){this.voicePool.applyToAllVoices(r=>r.updateEnvelopePoint(e,t,n,s))}addEnvelopePoint(e,t,n){this.voicePool.applyToAllVoices(s=>s.addEnvelopePoint(e,t,n))}deleteEnvelopePoint(e,t){this.voicePool.applyToAllVoices(n=>n.deleteEnvelopePoint(e,t))}startLevelMonitoring(e){this.outBus.startLevelMonitoring(e)}setFeedbackDecay(e){this.outBus.setFeedbackDecay(e),this.voicePool.applyToAllVoices(t=>{var n;(n=t.feedback)==null||n.setDecay(e)})}setFeedbackLowpassCutoff(e){this.outBus.setFeedbackLowpassCutoff(e),this.voicePool.applyToAllVoices(t=>{var n;(n=t.feedback)==null||n.setLowpassCutoff(e)})}setFeedbackMode(e){var t;if(u(this,It,e),e==="monophonic"){let n=((t=this.voicePool.allVoices[0].feedback)==null?void 0:t.currentAmount)??0;this.voicePool.applyToAllVoices(s=>{var r;(r=s.feedback)==null||r.setAmountMacro(0)}),this.outBus.setFeedbackAmount(n)}else if(e==="polyphonic"){const n=this.outBus.getFeedback().currentAmount;this.outBus.setFeedbackAmount(0),this.voicePool.applyToAllVoices(s=>{var r;(r=s.feedback)==null||r.setAmountMacro(n)})}else console.info("Feedback mode set to double-trouble, radical!")}setFeedbackPitchScale(e){this.outBus.setFeedbackPitchScale(e),this.voicePool.applyToAllVoices(t=>{var n;(n=t.feedback)==null||n.setDelayMultiplier(e)})}get mainOut(){return a(this,oe)}get outputBus(){return this.outBus}get sampleDuration(){return a(this,Lt)}get volume(){return a(this,oe).gain.value}set volume(e){a(this,oe).gain.setValueAtTime(e,this.context.currentTime)}get loopEnabled(){return a(this,Nt)}get holdEnabled(){return a(this,oi)}get gainLFO(){return a(this,ke)}get pitchLFO(){return a(this,Me)}get loopStart(){return a(this,Y).targetValue}get loopEnd(){return a(this,Z).targetValue}get isLoaded(){return a(this,Nn)}get audiobuffer(){return a(this,pn)}dispose(){var e,t,n,s;try{this.releaseAll(),a(this,ft).clear(),this.voicePool&&(this.voicePool.dispose(),this.voicePool=null),this.outBus&&(this.outBus.dispose(),this.outBus=null),(e=a(this,Y))==null||e.dispose(),(t=a(this,Z))==null||t.dispose(),u(this,Y,null),u(this,Z,null),(n=a(this,ke))==null||n.dispose(),(s=a(this,Me))==null||s.dispose(),this.disconnect(),u(this,Lt,0),u(this,cn,!1),u(this,Nn,!1),u(this,Ct,[]),u(this,ds,!1),u(this,Nt,!1),ze(this.nodeId)}catch(r){console.error(`Error disposing Sampler ${this.nodeId}:`,r)}}}Tn=new WeakMap,cn=new WeakMap,un=new WeakMap,Nn=new WeakMap,is=new WeakMap,ai=new WeakMap,dn=new WeakMap,ri=new WeakMap,pn=new WeakMap,Lt=new WeakMap,Nt=new WeakMap,fn=new WeakMap,oi=new WeakMap,kt=new WeakMap,li=new WeakMap,oe=new WeakMap,Y=new WeakMap,Z=new WeakMap,ke=new WeakMap,Me=new WeakMap,Dt=new WeakMap,mn=new WeakMap,ss=new WeakMap,as=new WeakMap,rs=new WeakMap,os=new WeakMap,ls=new WeakMap,hs=new WeakMap,ua=new WeakMap,da=new WeakMap,cs=new WeakMap,us=new WeakMap,Ct=new WeakMap,ds=new WeakMap,pa=new WeakMap,ft=new WeakMap,Ye=new WeakSet,Yr=function(){this.voicePool.connect(this.outBus.input),this.outBus.connect(a(this,oe)),a(this,oe).connect(this.context.destination)},Zr=function(){return this.voicePool.onMessage("sample:loaded",i=>{u(this,Nn,!0)}),this.voicePool.onMessage("voice-pool:initialized",()=>{this.sendUpstreamMessage("sample-player:initialized",{})}),a(this,Tn).forwardFrom(this.voicePool,["voice-pool:initialized","voice:started","voice:stopped","voice:releasing","sample:loaded","amp-env:created","amp-env:trigger","amp-env:trigger:loop","amp-env:release","pitch-env:created","pitch-env:trigger","pitch-env:trigger:loop","pitch-env:release","filter-env:created","filter-env:trigger","filter-env:trigger:loop","filter-env:release"]),this},Xr=function(){return this.voicePool.allVoices.forEach((i,e)=>{const t=i.getParam("loopStart"),n=i.getParam("loopEnd");t?a(this,Y).addTarget(t,"loopStart"):console.error("loopStart param is null!"),n?a(this,Z).addTarget(n,"loopEnd"):console.error("loopEnd param is null!")}),this},fa=function(){return a(this,Y).setValue(0),a(this,Z).setValue(a(this,Lt)),this},Jr=function(){u(this,ke,new Js(this.context)),a(this,ke).setWaveform("sine"),u(this,Me,new Js(this.context));const i=a(this,Me).getPitchWobbleWaveform();a(this,Me).setWaveform(i),y(this,Ye,Qa).call(this,a(this,Me),"playbackRate"),a(this,ke).connect(this.outBus.input.gain)},Qa=function(i,e){this.voicePool.applyToAllVoices(t=>{const n=t.getParam(e);n&&i.connect(n)})},hi=new WeakMap,ci=new WeakMap,It=new WeakMap;const ph=`var __typeError = (msg) => {
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
`;let Ya=!1;async function fh(i){if(Ya)return console.info("AudioWorklet processors already initialized, skipping"),{success:!0,loadedPath:"already-initialized",timestamp:new Date().toISOString()};if(!i.audioWorklet)return console.warn("AudioWorklet API is not fully supported on this browser."),console.warn("The audio sampler requires AudioWorklet support. Please try:"),console.warn("1. Using Chrome, Firefox, or Edge on desktop"),console.warn("2. Updating your mobile browser to the latest version"),console.warn("3. Using a different browser on mobile (Chrome or Firefox)"),{success:!1,loadedPath:"none-worklet-not-supported",timestamp:new Date().toISOString(),error:"AudioWorklet not supported on this browser"};const e=URL.createObjectURL(new Blob([ph],{type:"application/javascript"}));try{await i.audioWorklet.addModule(e)}finally{URL.revokeObjectURL(e)}return Ya=!0,console.info("Audiolib: AudioWorklet module loaded."),{success:!0,loadedPath:"blob-url",timestamp:new Date().toISOString()}}class mh extends fo{constructor(){super("AudioSampleDB"),b(this,"samples"),this.version(1).stores({samples:"id, url, dateAdded, isDefaultInitSample, isFromDefaultLib"}),this.samples=this.table("samples")}}const Ms=new mh;async function gh(i,e,t,n=0,s=0){try{if(await Ms.samples.get(i))return console.warn(`Sample with ID ${i} already exists. Cancelled.`),i;const r=t.numberOfChannels,o=t.length,l=new Float32Array(r*o);for(let d=0;d<r;d++){const m=t.getChannelData(d);l.set(m,d*o)}const h=l.buffer,c={duration:t.duration,sampleRate:t.sampleRate,channels:r},f={id:i,url:e,audioData:h,dateAdded:new Date,metadata:c,isDefaultInitSample:n,isFromDefaultLib:s};return await Ms.samples.put(f),i}catch(r){throw console.error("Failed to store audio sample:",r),new Error(`Failed to store audio sample: ${r instanceof Error?r.message:String(r)}`)}}const yh="data:video/webm;base64,GkXfo59ChoEBQveBAULygQRC84EIQoKEd2VibUKHgQRChYECGFOAZwEAAAAAAIgdEU2bdLpNu4tTq4QVSalmU6yBoU27i1OrhBZUrmtTrIHWTbuMU6uEElTDZ1OsggFATbuMU6uEHFO7a1OsgogH7AEAAAAAAABZAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAVSalmsCrXsYMPQkBNgIxMYXZmNjEuNy4xMDBXQYxMYXZmNjEuNy4xMDBEiYhAnEgAAAAAABZUrmvlrgEAAAAAAABc14EBc8WIGaH8HEctQJ+cgQAitZyDdW5kiIEAhoZBX09QVVNWqoNjLqBWu4QExLQAg4EC4ZGfgQG1iEDncAAAAAAAYmSBEGOik09wdXNIZWFkAQE4AYC7AAAAAAASVMNn/HNzn2PAgGfImUWjh0VOQ09ERVJEh4xMYXZmNjEuNy4xMDBzc9djwItjxYgZofwcRy1An2fIokWjh0VOQ09ERVJEh5VMYXZjNjEuMTkuMTAxIGxpYm9wdXNnyKFFo4hEVVJBVElPTkSHkzAwOjAwOjAxLjgxMDAwMDAwMAAfQ7Z1IIY/54EAo0IggQAAgPi1SeoyaPp6kgteriSYO9+t5Q+jJotGSKwrl/m5Ggu6hgATfQbcXMMuUv1f8/sxTi+YGPxELOcwYMSUUt992GMICQqWPAP/aK12Xg4fBz4B9ECXTB8C/YJIXn95l2GNa3GsVaq6CUx3CC0vKV2sE0hXvpwBZ/5g8rYS/bf0acVLPpBYm2FjwJilGro+qmxJ+Rl+nK5/YFKeFAryhZ/ToncOihyhD2zEEn6Qn/YFY6xaRS/4p9iUy0EwlG3Eg/vz/rsPYoaO+FQ78EOWCrrliiXzZqXeIa9uTN8C+6nNnDnL+DoelKmBZZOuUJ3MMmjYfwypVOSFmbhrQDQuY6UfBiBkc2IyyeprQESAAAAAAAAAAAAAAAACAzeyYaJw710u/i0eGoaLSBXicZItDmCJMb94RDMHxn9QXmgP0Z92odT12qboUBU9YlSLBVT84DPDt655h6xI2oQJXc2x95w1UF4XrHzzG68UdaPNi3Xj4luz85SuobEPIt20CQRHHilr+6l0UR9kwxam56nw39/1Yj2TRYMI92jd97LiI2ohennHlLzTMsWyFums7pWjswOF/le6euwpaVBl1E4mNVx55RaXb5HZszPcsttPLdrkbPwadw2J8tnh9qbw4fXFnKEVJD0Ss30akZ5W501Hhf7zNj79L99N9GHXf6SNEeRtaJANe3XGLxWwr58GLZoTxCxDy3dyYSOz5aKJCF4pG6NBXIEAFYD4rbQmNg3zBNPyB2URIErC8ICJTkpJyDx9FyxIyaIvsN2TMwgQZZ0cqyUnT49RwjXRvpJmreztajmq0bmSQFLbBFL9djFBx1SzSp41+STZi7DZUnMsUEZTY+njc1nZdlpZ8YbUk7GU8Klqw84PRTQqkoLNxC3dXmg+i11NcqbnxontPywcNJK5TltoI9U3b3i/bzrpPMJ7/HPIKQ9+buNsbVOJ8wSHuDq31iRhaUFoPvuPVqHdAeUZoN7NCa2iZYQwQxa5DkheraKxiNrWqO/xRlqsj5i7PRZancYfWvrtFEzWgzEZtrzZMw3lLL5sjjtfesKLPUMy6lSFyHbe40M9truUx+wazN6dBFNW+d1foaF3TE2kGTmgVrysnuicS2ZFoH6VQMuXXhRNZlJN377OYwg4PLqFgzWrfCqe7kMzCs9/C81ikmFL///56BqOLtlhElORsPWbnKNBWoEAKYD4rmR5TZXsgUci7ik9w9h7qpMYX2comNGK+b1g/F7TDZ8+56eNUBh1vlBqonujepD8tAFVt105XjNjiCwAA665C7TR787L76PUn3+4fYvUPY50hYIwFmRKOoGSO8ghx1TGUXM06H8GFlVRD5yy0Qa38gaI5khRdKCHppjbhw61NVnoIY9FOAfphDxdtpAT4oGkFgJs6wTUfb8+lF7wbbllRFQyJXx28fGYGdkbDC7Zke4CDkuBJJ/ha4Za5Uv908kq//7w2otVl+2op0RndcNjxB9qzyCEabP4BUpUGF2n0asc+gUoaLylj/R4WA2kVhDkTrrYHQtIIFYL0em+QZKu9aHTg3L9rQrBDPcMOUoYpFNe5c5jbOHW0kRqnlO5BvW6vFWxUC2go1YKQdhZ5qgrbYQb2xytMmp5XoV5LxO1hp2RBUJQTHwqmxcTfhlkzTghKtIbm5yjQYCBAD2A+KsmH/4VC8I5/SKsecpbW13QRcyggAQBJMbu1DXsdii+kpwJFmtJDm3Ejqz8aCNZu4pygDlWcOtKjm4Miyn13XGxI6Czz+mOvc8kUxuXWNdIzpOi8odJBeDOJmJfVg2KrWqbPD+kYGc9gbS1Kj+si2DxgYUHgR0IXOj0uyaMqjtagz8KTlRb0zdOpMbuk38t8IFJc5Rjuqu/aZSqdr+SUXDoe4WRPP91T9Y/xLa4G1ScelF8WoYGHMzTv/tQndWRDSSCx6NJJ+isrD0t4w3q+e6rHWFe+5BQ5/gcZpzbII94r06h3OPY1GPxJMjrLvi0zDDSYkYZoqD3gz5ANP/4lBhA7i4yEdmHVQ6mfGPlH3T2uVC5HsNi5WFUZSz7B60cQCE99TprgsTQ2PDEMYnQDiiye/neL682VUDFcQdgXse3PTtGUncXwhZzMOale//3ADr/8vkS6uiEQJQCfSKZVfhQQss1s38oheK/H+YeIKebBVp0wiebGYfHy5yjQXCBAFGA+K5DFYRpg1LUpdEvFAYJa89Nn/aB6711QxmPBm/Au2AAHCYmcQfnEKG1/6mFPXFWuK+8Q+3POtHRJr2rb9MYoL2vZVGjTb8VmGDxWWBewkttSQ/nBewLJfaT1A2w5G4NWw6aunChoCUUoJ8iO9sK9aRNY3DIjcHzUWQAely8HBIQ61SO/+VFhNy5SU7G8vqaL3CKbOzjS0oCxou+rokMASDQwT4diCJaCwH5kw/QDerRziE1em4kneR9WYKn+lVbu4JkbaQGMhy8c8y/r2FWDx/QhH6EBxohJkArB7ZVMI8Sh7csRd0M+ofQxJ4yyQpPTv5nxQbcMYL3kpxzEumOUCdjumOUJpGxolQUMw4BStldW/LmvdpPSe6CI0jZW8x6eeBT4cSkFF4qiAxzer4f8Wkko3TfX6e0LqOQPxYEvipV8l2iCRsLS7n+kD1Jehvt2kE2oh2WJTzusPxDqF9H3JvjXaS9KT2QAvNPnKNBeYEAZYD4rlgGaTakluezNZlGmY7qCeegb9Kamq90QC3yKhtxwO176BraQjTntMUT+f7EeFTDSweaxSI5YnYkfKsTPhzIosoEQUaTpBGnrPQHlOUoUaO8KlUNu9mZgOGZ8Ley7+7wMCX/UJKDosU0BM/umk836ZAgZI9VOXAWWBcj+Bj2cpN74hKFpwOHZPu6G6dV1uQumQoGWJKZsvLbC9ue8P48hvB4CUKnDoz0nn9+oERUFwHScu3wPkfm8vI80ziKbiWeDIKUD4iaAF7rKjyH3TV6UBFEshmsJbw+bs0mXliamAMMScaPLl9irFbb+dOIop8OB/SZR0Uq76H+dX2EbTfewoHvL3UweHwcVj20HOrLuNJkMg5o5S5C/0+L8RtXiq7fLPwZrLfR2P0d24BU/+ufPIyghgJWX/Gjb9a2JhhKXjYH1TblQF3rRSy2mslrC27W8yXEge2Bc4oSlEqBpUv7h4n6ztB+hICfU91R7wgF2GVW1Keco0F2gQB5gPiuSuKEOHPX97mNhHnK3Xf5pUukuofHwxYp8lS9zGOok2wA/Dq4eIq5CEmSz3/mItEFZCdjXyfADm95YMbBnKKOLX0+PHtEXmwUSCBFkLuYXMNBBi9ScI2nIjMeD/QLx72JUXwflPBckgp/lDXWjSsB4CLnNmo2huJ9ddMYqg1qwX/oQ9y11x8zCC0/HWxTw/m20nhYfaZVVnwbzoUQWG/5Njr+UjdQrcTkZaO1zeMGjTIw53EMPXJgn2LhTXROpR0MY3Ei1xmZrFPjBzozXu85jXCPlnGgn265eo2xVLWVJeu4vbA6xdmDUxoZJZniRs1gkUjMpdYWML8MwyOIlprbGTaZ4MhU2xumdZoc34tKRfV8k5eUCCgZOqe/X9NgRC+inBURIFrkZgcOK9I5RJTsq28AxknZ5JXMVzvefS6wzeVy1ujvwGMT/45NxlN6+kVemAHJ8de8nFkooLgkqNPzOhL3srF0kKuq2Cugn4LjE5yjQXWBAI2A+K5XpHGJkVjPU5sttAl8JBXznvh4ktbKgveROAaRELkld9HfUeTYO8QL2G4YfCplVE3kOiAAAovqdEAxHe7epEdh9ZFC/EiEl/C6pu5Ri0HK9wcCNdObtnoBfjXeHvTHPVZauZBQvoQy/5OI6y7drE63n0Uy62RmBfwtTS10PbjQtLcqFyz27rv5J+R9wchLPwLf7SvGTaJzf44yFvQKrUOJtQyiMkWU8zsK9ddPz+tUxEPUXMGzJQ9QgbgRKEG9bCSDzxyPmEPVBrfZb0HiflqKDxXMOgygqUVl4Y0imNbi4Bpmx1PBrnTV4xvjuJUtJBE6s+7iNHftDts2mBHKedXy05KcezMhqA7b4V0oPQUGfWp6d0ezB7kLHh0kigFQ2IbNphzu7ag8+3Kvp/SFm4MZA+8UcMfERAHaWu+0zlb0vZqeDU+opcGbyO6JxjsVsWj6izf2ykQdOOAG3hi/0kphUuK/USLbtXk2KfI93k2do0F5gQChgPirJcG8NsDzW3I8DidPu5TsGy2UFlcipGJAYejvr/PJYoheYggUKPylX4Qd01fVqbHRSogvfwzmdw+O0DP3bfgSskFitEIl+3V49hMTF/GgWkJyhxtyMy/3gVb9/BHIX7rbmT4XihYqRiAzlVn/ow4dFMukTEnIdZ36bXfDQoU6TBjbdGV4PVrz0QZUfk5u+G/pBJTwJ/t2Frj9jlNAqPH9AYRuiAFl7c9M5DQfO8/ITmhAfGVX+7y5I9b6f67Gn7JJeKlzapvgstYtwaJHFPiS4aivCOa7ZQqcMz80FHhJMa/bCZE8hiDD/c21BFgHHfZnI94z4NdQbb0SutISueUgOWLCE/6TMP+X9EFaRM4xBa3H2zROqxAYEIaln+IfRrDBx7gNn5hP2dXSXFhYkaI21y5xrPYLktG/8ZIoWy+qFtQazoDqj8pNqp9uh+SiYMjcdTzneg+O2GLAyBx/4VhlWKqtmZssDoYTWohIhEasc32FiZyjQXOBALWA+Ku5sgAlnkg2PkPwYTqSnDMje/uITb3tYPMzAj7m2eB775fWS+Oivrwcp08FMw8Z7PEzW9mW1jv+82TlR1eh17mSeuPnsZA3xzZqpHxDQeiulniJ4lNDJJ4qbjYeixbA43V7oR5mCe6avUmZ3u4DGoeKuqOhJhXo3Yu1jR/YVqdlJ4eiteKmyGaUcjdV+B43YTDKAoXWE8kAMPHpf9MrU5s0LMnIb3a2Er80zNofQNGfWDQIKVHGaVB2nvl7giMbtiXUZYrTpP5rbzlH+uWPUmId1EDiMvgC5SVAQQWZC/NH8aZMKqabV0eVqFtXIoLydXZj3vlmwqXzqxVL0Jq3jeA1ha0guU50SB2BklIM3G+61yJ6PI62w9wHWprT/LcqnuQ20nFeB4Z9B/Qk/GKj48vHCpdVvkFqTWRpORNw/coXSrjLSjPuEYlVdBNLa97FlnhrnttPNqRrODaErtWSzQ0ZJa9FKYesnsu19NzpnaNBc4EAyYD4ruCgY6Z+WGP2DqQSEMcK+a+qI34w1hX9+Q9vt42bWqEJ2sDXKQmfmTO1YEdtKWKhb80/bepJB8RQ7BMAx5l0P+5TyttmPqP+CPFzmTrxqcJUjH6pzwdEIKzcmEPtbmksxg796C1JtyYmrZ9HTUZA8cN25FQ9uPrg6IpjBtdBgzoiVz6yJs+eaFsgvJo3vvpl+Ov9FiOx+TYZDLYf6BSXYkERJqvsG918UArEABAzVxCKGCri9leacvyFsbF9CyvtKANyAru2/dVJHZk6ETCy6FVyI01687kL53OQs2UpEiMo6DSCISgQRd2Iv8Z5hcdfkS0NJh4/3ZyVhN9TlijpmAZzSew/Np79JVHZGshaftdNj20eJNM1jwIudT2alyQhBFOtfpmmmK9p25XsYnbY7fbJGiuJL2OhQwKwTA58xjols/7EtpsrSR3LGSolUNGUQchL+uV52N9S2knW08IG8xLKplXU5Won1foTA2Wco0F7gQDdgPitfv6uqT/xXZcNu4cAkRiAqQ/ZHCPzPhhP3rvKYHV9jKYxgHyHMAPSrGgee56koUOCPDNFMQyC3hf0sivHtdf91GoAjob5+0QPaldg8eRHMz00Knsr6qqHs3xJtUwhCMxwcH0JV01Fq7MVe8wotcedLJwB3vsA92/cscsA0sbu5rnfqEEGsTjGzxzquQJ96FGtVY8zpVP4P6/b0Y6A8EJ7Nw3FVRtNO6FwawB+qDoOI/p9V5+RFsNcYnEc05fK8FxxKjAgG7CfwDlooKUILCL0iI0D8BMeyCnglPkFNSpMnBgpcxjFxqXwNyR54K4bScF2DQJq8Dq6KyK7O3XTqLXWdkSsaHrc6gdub4F/9/HPG/dXZjcmyrrmwBwTTheC+Ihyn2a0Gejy3nK2pYnGhofwJNyB11RM6EO6Sbm7G/gVXa53uRRcQDPdrvo5MmxhTgh1D8PvicUjUjnd49ewjQUWDqxac7O08xAegacOgUT5v883mH2XnaNBg4EA8YD4rmWunXxAAwmZxr2h0yHrb000kqz1/G8OdHCfrjIcne7gG1F66ktnO2YNZVA3golWG5Yom4pizHSeyDj6mkaDW4odJKi/M8VePXxtU5Xs5r9MvEe6nv6TqV2Fzcdp0C1Q8PYCbhJ4lFn4bGBYPcYmGbKojyPCU9L9eCv8Qfee66s+fq7j4eOdSCncWppWaTqLSWEzu7RVi0o83OwTMGK06DGulcwL4pn52hlA/vWI2kWgagIkXBNKBTMsbuefkJSjEGJN17MCeQx0vjUpqIecFbbAGgvqrZ6hAm1uCp8372P1vktHL3ypbB72gRw6uEf70DAliDxmIZ62IlggjzAjae0Fm+e30vN3nwlgQea1R9n4FmG/UQoUqmbha7eNdNb81O601Lc9rXAqk5dmUJ6kRSjviKjhSLHlCT8KShTeTtPQQGsjT9nZ/Jv9bDOYfF5OIFtoiylM1Ga1eHkzQlnXaWj9vmv0DrLYSodfY/6dTjP/i7Tk9QpbMz5ovrAvnKNBf4EBBYD4qyYbSs4Bybedz7wfTj2lFhxAwLIQWChZjvpTeAgbDtpoHLjIZBD0w+4Zcf8Zj2ZwfgRGcmWREFGaz1FP3RzVMBa8vI6i1wPEozvgDLqAC4CRLu6z0FoEPGDEMnwlTmjBF9LrG99oSkz4kcj11FOcJ5Eb6YfFdDLQyhcWDPI0t0hmfrTr6k35T693AB71FzGy3Zfba6xKq+/U80ZCwQCfPUXGuameW3H5mW3u3DUQRYvKdKMaIfK6Q0OF/hCQ4osc+zSAjtEwLdFk6e/t5B2uaL2h9tpUMNbXXCby57eVS3c0y4yKnjkg+BuQZYEFLeWiZwx1H7Bz7f8QtenTx23LIdTbKcnY/EZgpRXjxZnlra26GIeY0qRTdc4/yKO3H8pBjWvFSDNDp6W7FKxUfrzKC5qJRx8py+vDhKwbUd6Z0+ZA2nckSLKESD6LlsLpiLuLux+nTIVPBymOLRUS78Ub9xKoYRVa/RlGnP3op/nSKQx9v6oDVHUoxeGco0F+gQEZgPirt7RUfZ4U7xSknbSA2cHCq5d5OyzlumTZ4qEulLnEVM0VpRcYwi4Pv0UUTYZ9t0DhWAj8qTxx+/dVEJl6RNZZvIdW17tDEY19kzKRzh9aOJXgp2TiSxo8hFmv8Lq7PxpQFrGdSKcyYuaX9zxtbC48SrfocRHCPS+nEzXzoIYi4amxtaqdDxPdbIkl3ITDV9CL02bDP5gXWf6zbwMf9pd8irEXbNpW+ZaYni7A/0QnlCw37iMdtKMCuJowZhwJEux91BOk+ANkLB5tByMNrgEAYh0xG0FylccrmVYgZfQRoyvK27KD6ICpS2/NRpoz1mxGz4wxOcNeiLhH9YbrNI+MF7Dc32oZenEaMAqUegKtQAFqbd84Z8NuuONSDwqfvtoanwuLxDNdKhhFAUntV4z0lT8wJ3sUQ/tuk7Md3n4N9s/DLSeul1K7TDxd/fCuExNmnVk+LvPgF8NFSNGyQhhW5/y+yv1ju1GjgPUFhUrjG3tThHKSVZJrnKNBfYEBLYD4ruDuzfOaUQkI8rYE+tX7cxDbw6pZut7pg31Tq/8wLfNoVzG9M0QkZOH27UQ925WiLhHDxa/g4O58Al/ShdOMtaMAyJMEjT5TCyvFfA+1BNFVH1pjy6sUScLoipv44/i1TTPvKbcesDKEtGtx9Tg6KLODGiE0LzKgn+czRk7cMqjcUbpborBDTUkRjlSPKcAYDXKb/uKthsiswH1YJhl74RLMvRukc2UUuZX4u15e+WhSKCs1Ji014J7MCxrxIyvWbIBaiuYVYOotvthrV6qT1iZsuNoinf4UOoTvXrANloXF9SGL0n7YWLchNcltjy97pjV/5J/RlmV3UvxB/DmtGGLbWeXynBxITUb8Dqz7sU/0SiFeqxsorTJnklEldgaIru76lEbTEuape3EhscexkEeFEJU+p9rwMbT2PTfGQ1FIuHHdqSIQKOuunEm/LSZeA3XQgrGOnF+vlxlvLo3o9Q5PxCwkGbqvhV/ksesyODDfMAgekkOrnKNBe4EBQYD4qyWKnBysdL7nWpLzT7HEY9Hx7EwRW7c9Wb85w7a1lkEnBAiICdOiSyvQYU3bjRJf+MCTx0+DgjJNvAprYGb1UL2AW7FMKIusNlKIrOjs3//pe7ojGxumFcEVLPCyPAZppGf8Oq0xFi/SOqhOfjpImX536tbTeC344NM0LzAWVMzW93aSf86GaArrfOAZ1JreUNiz76d4EULwF6lnf4KsCuDU445zqL7UsUysMILsqglguDhItUnqQU8zPyvRsuBBcLCijWT4GzcSTBPELu/+TsMwBoAJhLfsGeLE52E27URGXlr7x6QCGoyIxrNgVRKW0uxWIgNRkhCXxMU4szQfj9PZ8GaLhGqcC5txA6MX54zB4ZcGYc9M+FLdaWcVJjWPtzZZdnTompHSUJodEUqrou7we/gM5NG/zdWvGOdS+y9qGvomc13hF+cbyBNDKZ4F83Fcen6I/vl6nIc9xjrMBjakhSHQcpYpBt7aUSIW66Fhq1M7qZyjQXmBAVWA+KsmcmAY+Vh7Pno5dxIgoSoQuKcrY9QGFBEmkcEa4t2C4Ky+b/2evEtswHDfWKg4JNCLcxzeOH8x5cw9ZLnKqRU3G0+iP12NQTOUTpCAYlXRzZZUZWiKAhxxdlUkjeJvvqV5a6/3wj6vvkdTIKoQV5OIDqJv7zxcfdfugNoj7ByJW5M1k0Qh21DciZAhOPfGyeJfyoLBkMWx4bgbU1GavQJTxttX0NyLytZbXqxK/gDQJH0pOYJVc55sFQQVkZ2SitQ/EuLSuPuV6Uqw4bN3lxts2HFEVoYO5K+BIu/TcUYc99PmP3zoyN1FK7QEsCXvjDcBTdlFoOekRN3Jbu/Kyo8vsfrsSvjf6biNk9zAEz2lVTQd7F67FsKk5T18ydE/d+HNo6i4HtJZMDnVRweprKqojzh4QUseOPXYatt7p7iN2mHZV2u7XOlvfqxziyabdNxgyE9HDEnAqFSGn1Rkf3sYZbu5Qtc72lKapvpPOWKEyyXrnKNBf4EBaYD4rX6J7Si6AyV9o29UnKrlgK+NZ+lCnF1nYzE34mHxpXAToLK3umlnIv57Hg4f3bcDUqeZN0rt5M3Lir5AOK79GInxch+gTQEPt/4zBq/fGU3y+HVJBsbouN0Y/Ydt0zxySPLFvh5YHrh8CCNZN5p4DC2CYkUhsxH2o63oaoqPQpGcEekyH0bZTI0ZX4/YF7NUGnNCwcdgeMya83/FSgySH7mNGuA5ke05DS+AZqG4ewpl8Pk7rPQCJnznHytd8DIUwo95FmvRHMQPJyBkU8tDFjYV7ErdqBUYPbz3DxL97YyijuSt7Fd1vGU+TGgsTl8bSqkWve4FXPpXrt7zsJ+i5nO2c8ZLfg/WiMNXYbRFZRT43bU7JZsFo7hSrpXJnxxTXwQMrdpDAZFY2Q90qaoX9WOE9t+NYpcy8qVggHjc4EiGVdG0IHIBXWkwuFxVbtdZh6iAVppPe3amsfMHazcRiAj3wcSox/W7dxUrjaZHolAKZfNBnJHwD1uco0F5gQF9gPiu4HJ5yhlJ0ahSQpJYKuu3/7nowis8jR5I/u+uoqPPHEHhHtl/AnLqDrhK9BvZyU92CX2Y3W0ZjSiMhTnD76UfWb0ZMOoZvYZOdPuSiTbTW/dIWusQlyB5wfrHIZGjDEzrDM5n8oxgTYolwWY7e/DuknbRkDV55U+zHswcdFZ+bxwgba0GnNnoKDnmWGD1vyQpX1CQ+2Tn0yxv4s2lH3U37CCNuFiU5LGR/10aXo9pmS9Bs3jXUaiAYeVjDGBI/HCGc9fuawr3mvtguTzNgv1IAV5IeLnn+6IrSR2FoGdtcssBwGOsVUkoWJZaYlcnUATx6r7hB6OlO+InTKEHOQCeED4TRe2PVA8Qt/KmdqAdzP0AwhYWye3DBBLjd87iAjj1cj+IaaKpwW6aw9fskLtZBVKBsxm9pn88Pz3acEm9XRrGlR/l6ec76uDOjmH0ngAYm4I7i0J3rYtBuZQDohEMz7tvsgSNcYLcEVHxNhQCyMsGJZyjQXiBAZGA+KsNzkgOLsx547z4rhB5P53yzu/OQnoDAwtDTOHeezy5GIz5/FBsS0zZRrxazmS7ICCJNBR/pJUOLFImIcQJz1YNyY9LdZnk+vBE85w+zJHDk3m3OOA+KNqmnMbtzQfbx4Z0lA62k/DFF3xOa4SJwvGui3v3yBIZ3JBANxzqm61dFh2aJ/3y/WgXKQakchHtQKC8DXd3bHPIH330TtH9PMnWu8dl/+8v4uvBA8+OA3qfinYxEjbZbiTasPKTmt8eAspE/HT6WxEgk9wKLjnsvkCQke7QCwQz6a2PpVI69OhO6fdsONytppf2517oqHXQHXz1IkIzRXO+qg6FIoi4Spp8GcCzcCXq7TI5on8fVNPgjVemQXVkilPN9R9HCJzVC7r/EI3VaVDWMxMnMRGzCt5D/Rc7mmHgJwBjvx71nJFg6O+hFI2Net7ZrQ9HdWdqAGKLvsUoVBAAGGX/a/PSD3a6M5KOfPZS4QYL7PdZxWNf9a+co0F6gQGlgPirD/Hhb4EmD7AFnGcW1BCSDmlllwx5gGE5XQ5kkuh5nHUypVvR/jxCihfpdbf0TAwekER1x+6T73V/09e5r7xgZJf68M3hb6fppMI2KmZL0JzWR0dm0u99C7wK22JknEg4tg8DPZtqVdIX78nfgyi9bG3uFoUoumbMbRJw0HmVAE6tAWQkO46CEYVWHzkcH1s0rM3Enh1eeH9xScAJY7E7m1fyCOKczNIcaNXFAdGLpJk1FKSit7OPdeZJw+i0uWYMk7mBwu06SHr9LieBlD2BX0geNcRls1nl0065CmodeVtXctZvMt5CtBmgsH5v8VVjNuojy/EM3CPl+6+9bPyBq1UpNQSGBaG2CCZ5ETzpn/YMGrlvEMwV3sNcWcO9A6ITKYBafFcAd6Jgi/h20TjjJ2sp2Mw+I0UxtNYJoSXCFvEhXvdbvXF42pC45Y1rRZOE4cJ6z2JkDBKkgGJaEulIn0kmk//pCllRYzL2yf9VpEDM4QOco0F0gQG5gPirEJqov1JRxhyNsDOyhvE6WbjuNEsuKQH71OPPCoYiyIllKyd394iMMxi5LKe+Q/cg4FRXYA4jFNaI20zF2Ypm25TdXbPqBYDbI5anlimQG1I1C6QN5cpr7cGAUNRMiwsBR5osyrz0Q4Vdbxf/v4YyTw5FG1RDkQopX8ImRZMhQO/sxGcHXHJL0fV8F1qoXPfbaJYl6g7wGzDgokCf0PcOk/1LLDa+hbWzEm6iZTuPnT6y2pUVSkCpcTAmlNlMRptBREPy7EEyjS5FSw5XF15tFyguL3YuzhnfYZi33ZrugF1Q7JiSaHp/y8rbV0Dr4v5K5UWyLYa9z5XtgGR3ooDG0T+ojRYtD4mKxQINaJh7G2eMAUlUehcCf7yT33mSad7zWnoRb/t8H5Dl/q8ZX0PVfAKAxrrucP7EAfPUI5pcE3X8OmPzta0P6EpSbTaX5DbSmP2y5LtGqgG1jAoEYCzZ7Vji1UiQBP7j8f401Huco0F4gQHNgPirEy3T9a+pOuj5sQR1i+T4noWPs16DBwijys0c0G5eI42tkgD55gKjp1Fna6Ekq8hYu5MuVL7MtDhskGEKz8jh+SStn0Rpgi0ZIb0QHVXPR2FUb8P0Lu2IM4aTcRvv38Plg6GeIJRBPXKSRUmCwrbeNSm38rMITP1LpwOS0P//kfHj/bcQuNXiMQO8/QEA+oWUNG8IhIuqt5WHEOr4yHno+091V+S7WJ14hFERdmCKqjtc0g7O9YRL+FgIqMhn0QQnSjFWoetS6lm1spOzSWP21PVtZgI3yrbNnKLNHSE19kdqUS7o1Ye8GQGYa9ej1AbA+aW4sAAlBoY6AaqxUBMBqSI9GxAei8NbOqzi4jatPkifKOn8N1GvC053hNFi2s8WMwani9ZsdhjTnswZejd2QS735Putmr11rAxmKWiC1jcP19As11JTmnB/WVdmyk6l+5YTmnHtW7MpKae42HNxJZ6GiHOwwqUv98bN62OPZ883nKNBeoEB4YD4qxvUWsyedhPZ8Ks85e7YB7cVFrd27ql3WfdsHMSUOioBExVzBioO+xDrHXyZXcJou/ZL6QfLdPYTjIzk262FhTESiFLgEvABKdjUYyBCGGCesuhSLk+bH/dqNDpomS0j+oZXxxXi96Aa/bSbihZUGNcpklzJuLDsHETJ9Pf/7sQDUi/no0cLS1OvWEjZK5cTTjBced7EcNd4LeAXKd0CA/bqSr/sRj1tK9e+A1jtjWVpN3KTNbbjTG733fOQsRxo9kk6mqhdvKVAyeuDMc0KzBbEabKuBoBU1BZ2CLB22FaTg1VJKzCcZUKSOv9KKZQvOuJpvpN7aFyaiLr3jyPm73bTkHBInJHwwImOZGUqcyJyniPXivmlPPvSStIRJXZKHIIRzIqHm/GrfY41lkpSGc858j6NL4xn6qa9sBu12BjdOWNNRocHo0Z3J6go/3Z2ohTfPQUC3XdENVflwo2rAMJfv9XbOO2na5cMWfhlkBM7HNGTmqNBfoEB9YD4rKaPQ+b6CDvrWr18p7YZIEGmebOOtVnvSwmbUkBRnx4FqW+16+fbcOqlCV9dsdL/YFPtyUnrGduCadoRW4b7oWwDB5Mpgj49X/RYE5KNSxidAdZToqhGqHSuVVZV5Dp4QBEPtdib9SATaPQvmofRm1VlPtHIBaZTx2eGZFMXoPONqA0RC/tFDNCn0bGpgngSenHSgsRsh8xPahcPmn1gEFRDGYhnPru0jTJwctldXKtD0fT7nyh7g2q0pe9A7t22q8X0x15lNBd27ZkxWU98wwY6YAFfSUFRM26vRvMTE03YOHI9vNrAE9l94bWAdqM2TuLQbxueZShMbqhYfD4jNA36vZH1VFNdsF65/g5m8NyxGPF+EEVOc8YX3ajcsCBWfj0z+8g5ZAyhVLHgkvtEIaj77C7eaGAedldeRLir0Vj1fUIoJZVhAVHhWBFjLHr+/qW0p8Refq6PX5p36YmUNlXHnen+cGtt6uvz/Ety2d/ovEkvlqVc+5yjQXiBAgmA+KsNUoqg5TFyxCFp+2tfoxKD9dby9E2ehTP3UQbUPUL2wr4jSECO22d81NoMqfqAJX/aooSDIBDASOiirnPoZLpEfi2Er7nEtFQ1MN/xXwp1Ts0kKTG6igESUS75N38O9ednQ30dWEtVm/8MqdWj0Bo0Ax2pPe0ooh2i1E2oPo8F1Eyer2OazLkRyxIXD4OrLRrhq9zyebhcZV6fwP2wwPlCsCE4ary/Wd2ndtRDDYmKq+ynYWkDrzTScEvkW8IQ5Sb/UmZUmxP/4FQW521g5HwhsRg21f7myw6oUMsfC0h6vpS2Ck6SI+Ex1a2b4IXFUkFJDfJXyZSBt5OxpQ0HFr27EfQPCLo9ZZ6WQhnr2LhNRkMkqyC2pgDlcT2pkkuvp0jPXodEDrqUW2qUM52y1cOT1R/YJZi0DWchBxi3YPm8gShcmF68CmqRjs+4UEDTjB133LjTE84gQ9k8XMJj8qQZVoFQKBtnguHPv1NXLZsGmYmco0F3gQIdgPitb2z4hwVNarCqF4TZZ8FgSs7IcE4Llb9eTQRsd18IfJMg52WQVOCxsDk85B4vUo5HE0iH0HhuAvgkx3WMaL9ZxlYs4lr7zALBMdekrPNnxmP8uSyZjW2HUE5+IIXDfvvNE/e25D0wnRXRihAl5m+0KzQjAI422xIvUxLQeRkJ5Xy3Pz3m5aODAG521RmiK6WX4O+yEAmtIfqtieduK38/HmOMvzkcXHTsq4F0jYOkd7xnKTevKN7eNG3ExA2O9WgSAQgPGMgYGaTJgtj+B1EEnrIlj7w8JHqI3nE0+EMTbwjBaDp4agZRQrEzVbZUsMJ/MH68AxZNLV/4fIb6T9c/29ZhZ/yjEO4vIYBOPzKnmZJIURy0cBczkfoPJFzbtgT4wPcOFv3o0VAe04iv+LgOG+qDokPfy0NtOm4F8WBc5Dtl7j2k8I9KsW9g91Er8MB0yzTC7IEuh7sptjVZwysf7+EIXH/TyzQNRtf30FX5ftOco0F0gQIxgPirDHVI4djwHYFezIL8tmDm34LRTIgODk7Q06d2jW4jm4If075DhCc39niR8yOZVkjW/5LnHs8azOz+p2i8iubQ87PYmS3r/O0tp+sxnL4JQaAL21SI2AzXNhxO+RkgHEz3TJ+Ilxo7rtF+jMhBrWu+8TdERVyfPeuTjjSzkRUYFFVE1BM836BqqbjGO3xDPqIQhe0bVH0+E/zaJbFyl2HAtkTzyBGAcQA0sefv/NNHarJIugpoGpBf06v09UlaQGLvUbeLhrcFnfWIF05rIfYe4hUM9Sw/+i4RwLHZ9nl7vQhFh7/JNve1FGQBbGLlrC8eUxPmm9qaDrskUqwjWYZRdGzeyU6hwtj5p3TDIgJE8+xo+woJ+PMWCONuI98uxDW/XO/39k7PFptmajcEsgcQY77kqdT7nrY7vgqGmU3syUU29Kj2X5his7Xvif4MN9jafpo6eiPmSE1Hbf7+BeYczHvEtjzxMPXvcHs8P6Gco0F3gQJFgPirdzdXK/5ipvh4F3kZGwrCOdq9S5rvnzWkuL2Ecao0HOt27l0IUWjN0gIiHT0Cb4xs0KPJV0enTwXJUA1nhYWNK+HIDqjBzlN69utuRiYecb8wfEtVx30orPea+0Zmct+nQdM30IeCmNuXRJUgxjGQUFWF6z0vMlfsZwkKophdGFVAwK5//uQQUgFM1hXigP6SPoQRCNk+2it8WTF1G8n5wg0v99v1AoZyCVPMV/nOm157glMswt1TCECvbluNT4e6ItjXojUfWJGr1SY2ozyDBR3c3HdnikhHB3FJYUP/uKd7LqWdVeSThqgO9iQVGH/Yt0arb0ZISEr/9WLxC2ILxODGmKIW2qGXUHfSTgjIL4G9xM/fX/EXAD8KRfLzlgLiq/uc11F4r8Pyq4NqLH6/FnfMO45z5b1D5Dxfwb2pWN0SWUCGycN4++Blu9ODkqxdQ/pFBH3qV5A0YUs72oi97pk/W3uzyZgxAaDmvLu5Nq+co0F1gQJZgPisp6EJaa6P5XlFiaiLbNzMsavM+dJqS74frCpUv6cZhCgN9GWk8g+IBCSr8iWRZGyCkN9pwRAC16qEUs69xi/Vpl1iMM4OSg2jMvagVKOmjkmXCWTF+OOBgtpSJhVX1EgW2AQ+GuG6CBhlbamqeXgtIGnpU0pIdqJEbGv/89OdtDqzL4rv8e5MriFNebQLaUSpvlbbTCnR1aDmGWzUoTPUQiJmv45rHGrQAIo16QAdhheNWOFjq6mSAruMkUCw4c+Urf7bkC5pzH5VOABld5ibbz5n910B9kaCgl5Zv8WJwcgkCUt6WLw3ahAcBtPdGQp/blIiNUtxQUlzxhCJfu7Q/W7Fb7Cg/+3dHwIO4qzo82mzxdNoP1v6tRKPV+lTE1vDdsgyi4w13MG8ouDfHuGgHJ2BlsR363xbSYnR7Juxf4FlSr6p0XcgwHdpjNIGO1f7b5Ch3//b4uQsqOrb2lwjIUZS1x2MP3cSuiPjxibtnKNBdIECbYD4rffizm34BVpGbqW7J59HD+2w3CEuUoCnf7f/gSCn2xL35m6titc9cyZZArLoq3oXyFtEE09RlZv1btUEQ61n60FSSCMbrLx1m4mlrOG5oVwC+y40DDurp5Dw88qMUNqo13niQKVGXj9FsWVTiZnLzPKIJtjl2NZvYc7tNz7S6MLP9axxr/EGTd9rDU94eH1A3yRw0Gu6rGHtDf0z7hJ1HDNtYsPWtvoslufeb207ojLYrOYpZ9OEbt1LdrABcAKT+Ar88rRYxDRo5g8RrdSXy0Y3olAU02XMghkai33S+XqDABDwpw51EIRcDaIluqU4Aggh/egNn6RHmRh0PJOTPpxomWDTQMgGP1r5vMSlS5eE81VvOHbucU9XMxzupDNkFnH57tLc/ppDqArUuAgWMV/Kj8gncyf+LpPBdWsHVbF/f2v2j5rb41WJVzqXSv/SMFaMaT/bz/qrWbhiX+F5TB9goremIECQ2cTx5MeDnKNBcYECgYD4sGa5kwbWJdXFan1C+tdU+32dGq8IAI7+Ek2jg5hmiGVnTlAEihKUtNKR8/nZqUyUpuLmUTUg9FRZCVZej1rV93rB6PDL9y9hqshuq89E8JqcGjyRJhWqcuhgNLJB/EgNCpvXBkHYehNRtK7mex+5SFu3y76xGdYENJhtgy5yjN4Tc3nAHzA90OOZD25M2wmdw6PumRHOpsU2DBo+9efLg0WkiYOfj9SQewCyfK1z/NrVWv62bQ1qQ+t9jIi4QJPpML2o4ZsnCBhA5kEG4lDqgEPNOZ1NThOmg96tYMMPMJclWYaTFOstZ8UDsI0x8mQyYFoPBcvT89gxBu8/xk6jpMItknRfEVSzbPMkXuJWqyIZ42FOF0E4lClBF8gpKXl4F8kw9Qzy3PKk0hDC7BKeQ0JhzZzEvD3R5ZBTwJeDR5+FmCLDKenKqzOYpl6nVcQTgxoe0CDHCDA5AZFK9XgC3Jvm6k+1/diSlKEDnKNBdYEClYD4q3c6Nhy7oJqpk2SvwNa/ugaw+kUfOQm5KWvAR0OH5rO4+j4Yj04yJH81c7Krf2pIGrr/CtaauO8PTNR9buPOCDRUge9bFKk3ymmRDEc8xDuBiqTp62IHkvTun1r+U+6c8v4MMp6WK8ShX8xhsgP+05mfVLdWbLqkwJqapJowNcjVRWOqqq1ygs+9tpJCXsywnN/yKS9S5vqtEuF94nMlt7JUmG9A6rR8uak4yeriO00OnWLpry3dNMJAQcHgZez0KWQwwmrzFfPMLcCNv21ZQO2y1qDd6g+EsBbv9WAZzSigybt6To0LowaoK7Wp70DIhQNORTxgIbOa1OKZ4w2tEl2aKkZw5xySN2amlvPUHSowGVPEIQHNbEjTvTQWIpy7wjmu42GwKfxmyhgQZDny3o+P+a1hCKZ5/bUvFdRyh1EOXeDSLrYODc/9MXN4TFBKbTfa4UwnjfHohUVdLR1FbR819aPYZ/5Ms3nwA/EYb5yjQXeBAqmA+Kt4SmzSD9W1ez5r4WJLYzPJCAPutMG025tHruJJqOe4V2LydnMUAU16HEhuAbO90sdyE6nBby6TyRaZfkCeywk5HlxNt+WaFIpUyOVEKXclGIIWgIV4hHlcjiKyM6jkH+/k/83cX3ppS0HyW3B5ms2fWpYivkVoZs3zStBC3BGV+zMQgkGTPv1kiTM5mcH40x1fiN15VE3MVFTzhzGFLUMXi1G5CwwwUoevrSCBLP+0EWQDHqdqyum4kM5kjBH90UWXGovoblAONjZ8odBMnDycMDg2YkoZUN2uE5rjflyvtHTBQ6ghKT+gri4ZZYYmmgcmFj646Si95ruO9s5zZUjVO8jECj/a0sfUmIYj0j3/vTsq3vwS8AvnW3jnNL6+MiSOTSAief5LPz1S+8PrxaW5Z2iwNA2NFGb6TaVvFiKP2XjB7QziMloiyoAi2CptCLVGi5PvnZTtWANn+0PjwJlaTUZzhdbBRVr4UopxBR0Tt5yjQXSBAr2A+KsPX44Rx6oRmf3+gGxcxxXna50wfDPSltP10gu8WIZ9qYAg6yGdrF41S3QSu/nFdoJ8aLi2janiqv+TfjQzqr2ux//V4QFr6GoxR7MxxIATrh7nvrXoLi2XfX0S4Ib7PdjXO2DjsJKnLCNFEk2f7/DF9XMp+fEVxO6hCiERAKVHS8HG5lHL/SwVdYEiBRhl9EZ9MEkFpV/TlfCoMa/0PwCx7SHGyGTIdt7R4Pvyg/Tz1oE972nfaIHI+MILOqEV/9RAP5SxsttITOx25XkSsP7vIg/XVD8nASLLO+bdOlpD56pUdKSB+6gC/7YopuLdBBTZfzQ1eTrN1TB+Xb2/U5eq9ZLrnoszJqP/kB2kInzULSWsm13jnNSQhtBNwtfvlXZnykIDo7hAod/n0t79vR2ir7y9m1xWyrlSJQCRmmeCgvYJXIkYrc+u9A5DdFyWWzioHXTYPAqSYyrCFgCzbGdsobJ4YZFRuok8pCKnYZyjQXWBAtGA+KyqCRW13yxGxwC3AtMEGXwhmnOYeeBozO7/bO6I+l7skQJWZ0PmqeOHZe5sk3LQfeA2w8Ksq0/4S0vhTD4LvSa+pEZ5ZBTGAhxImpLBAr7+iwg2wumDyuAiEM1tBlzT7WooMG1heFDxp6pMa1ODXayJ95NCCGOoIoeiVOgdTU1uygDpVgol+XMS7nja/XYRegYA71aDQN/MZTgAQhiM9/D+NSMn/9p8byYUTOpIziffdBI5IPmhwCxO/fqscwWcjMIQyVP9XfJTLZbomA4uVLqySCBG7aJBKtDBZBoguvCZT8EU4UJ30nKKYTRnfPnzdUbuiqRcfeFPan5flbiI7JGuKvz2+vcf4VTqyqbYocEeh5hhkPWgy/KIzQKfrYY5sAKTlSE3/PlNRzYLj1VTK18dAdouKOvuDOAB4Jd6yR8ir2NvxBO9lh5c4qvGou2Xr9zrFaXdwuXn1FITsRCFAANY06faVZJlRlvMUYrPh9mco0F0gQLlgPirDweTEco9mr//BeDOhllMEs6LtpL1wEv3JJzP/oj4z+Gyi0bSR7muStbG/vjtMxYW/OBWOwvT2KnoU5sSVN3K2HUn+0oJDVAVdyGkLR3JRjFGayx76ukByXSTLvFLwkHzdbK3XFO0w0rX3uwcZ+u4OijoB3iP9glD/6D8vQnFfmcgS260w3MwVbgg1Tq6KSXQVWSS4lA61OtN9xosxIskh3CAkhyDE/rsEI55HYOHp81/O8ewn+MlRyl009PQdqMHJN2IJhPB5cAtenhKTQkCxH7qjBo1dU0WJJJYABrxUkxSdQQZ6TJZ2hRxBFn5RltxSLYDf+2nopK4j5IFL7Y9eJ9SjZvDrnb5D9EwOwGZOyHa2MCl+UGCgHCUcE/V5qenZmf2/ekIONIvgXlC04bbiZ7EsxcS2u1K79wKogk1wIL+a7oaK/fnkEQNUZG9Pp8NUorW0GV1VQbxvXU7IbPwdZ/Fy2wMtP4soVITI0mdo0FygQL5gPireFfEm+kmBEkAhnNDvGvYsjcxowfoqB72WdVeSvEpSwvsJgIBqFsjWN6ZKCNX4FmFin8bZ6sVy5RTBUwhOD9vVUNtQmy5+3G7vJj6ZAhplZR3X6Ye2VWbgfO0DfukrwA5rRsomP1sTK3jmB8/1f705EBAULMziL+L7BY/G56QXq1/96nQw9GlJaDqBlMPHohvm5a4/3V5S4+As6fobsHBHr8lNjoqQ9UmHPBaoneTxWJYcolCWeSc2pyApFxie/eyKG6ASEiKpQCXxc0g3al9aBKBxjUKcEMl4lgakoenu3PxbycKj5cKB/SdtNl9vQftM3oMR2JBklcJwwX6aLtzRmo/17Fu+1kIB5ONfqX3GuI0UHzd9KZ5RLi4ursJqer9nrssRz0iLTDzVoz/Rv66PO9zm8Xtjq/NyvQkUDhahGJBNxd1RkCkrlXQmcV6foxIapI+nPT7vSL8c1r8ixchpddGzDFZaMa0rxJjnKNBcYEDDYD4rKe5S/k1vqaBLiymQHNCl24Sk/H/hiFqscmZxaDAR4bOc5zH0wqBpBYwg/P5tFuORyXHluCUeP7tVGddryMCqul2l1SzHZl1mva/Kw6Jlqw88snE0KZsAhNBAiArlzOdoKuapJ3N4w8E6GKidGNCyBlHqnf1f5pUNEdY2tmj7AlwOJDjrOtbzqBCZf73tGV0AG4P7k9PWDOXNXM9rfbwGuwwjoGDwUu8jCfCCXJ0YWFzSqSIDO9Z9cqhFoWfoDVAk7ywXwn/u9DTw6uxkAAXeCM973RHuZbwrgXNKr5MwPCiic1vqeq/Ed2AFWXW9cVU/rNevkXNqIUFlAf1y6JZYkV5nsNtTeavNwDLYDVwE6Cr6KcpmC/EjYgiSJTwJVk6l3GWHg63XW3oNKk6SUmo0g/plncAuQFLNfUVyES5ekZ8nqmJON4qUXkVrvzjNygDXbw/6DaPFRv/bMUb6EcyxNQt3x/ryHhPwQsnnKNBcoEDIYD4rWxEOWVN16hmhZIoyaLODu2s2AY35ufko+WPP8kJRSxoHx4Et/SreL5x1O32zAK/Fz2ibFXK6XnUM4jLSsJLLnOsX2gDEzdxgmAblARSHch5QiAG6dO7s+ko4rkyrk20XV+Ug/ppR0Shn+52svJtF3/k1V63XM9gvULJCd9axJgJbX1YgtJNhiqAW0fRAKm5fOiKl+iCJ6BzDrA4HH9gUHE5dQdS0ISVu0wOoBEK+3VdWxrtPKI0U6e3q+7wamnEW10woLe6JlQJJI9+9GN46NgsjJcABQxSx/Gme6GffyBOn20SZbakPTHJRYfRUystalY1BLI8IWUhc5rIBOKRhArXejOIddmNMN13L6hzKiQPzuBqtkgOAHJM1/jO3SBs+i/h7t6zU6l6iE4ue8O2PqAL/6akqSScB7DJNFUwPy8Tx4xOIJfhmz7QzOViNnQ/sH+w+cMRc1H/SoUkZ3DfNNLG0enqCsSVMZ4Td5yjQW6BAzWA+K1tyvNXxBHvwH7BUhV+PQp5rMRRB/r5r5QN+QIjER+3B858o75I0B2oqyDONBXYG/NILQLe9RIH26A3YpOD6cD/71FtxCDQyMwy+QAILD/+aRYT7G3eiGGgCXvIiVOZQJKTJ6oEY1UPr2ra4uRVQtvfmCOb0rmECM7U9Bc9MikKM3564sOiTU6gU3oMrB3dUutOa8FpG59x9hQC+dim9LsSRVGKKgsm2xbN1FohvNbUJ2QPpFR4naiYwELjwqs4TS8v9fXaIwESugfonscKu0Gu8/mGpu0TaF59SvqvFdjU5ilBT5chohFnFRy3l/GUSeY8gU3k3JZrNvzMF+KQ9kADY42YPzJtDJ45XPRjY8aXOGLqi+LLHYXPMJqIqG2/NG9JIE4qyr7xoDpuW3+f1pOPC6CGIHpAng25Qt1PLW34ZJZJ/rHEyCtnuD12QG5sqBSXp6/Dt1//sTSCztreUETfDnSDKXkgC52jQXOBA0mA+Kt3CL8V5N+TQ5ae9gjCoCVS66D6dlUL2+oI47gl6291TAQW2tH1wrF/F69HXYzDuibifA0EVZ+69cyrmGCRSbc4arUACE+vwmLNwm8v3SQYEjKnIsyT/szexr0jzRrJgOe7Nm83cweVRetdCFQSA2qYzu6yxLdf50YOqKjiooGhDl37I5Mf87FI0zmoJ8alEDw8V8bsWP0KtwmVOoCFzVNbpKTjGod1TGgUuGjaZhOxN83LJTE4xi3YjlIzq4eTdaouUhlJ9UMRZWeyp+dmh46UjDGV0Oy/Cm0Sj4Wei7SXdZlDQfQ4HQaTmljnH1cqWncZQQrJPLyXvCriUaKjduCsLI8NW83YA8K0P4gGnWDUu83romLxta7/PIxdGtk/PN8k18U6cQt5izhsYibNKpzbjgMJYhsEdR9pDf0CQiwulxhvzKu6rpUU1B3RShFHBO1f6BtEuBUu+eCiBw6DO7E+Jryt15zaFZTWfBRjnKNBcYEDXYD4rKoJFbh3a/UiCMM4KWVdV+eQWk7wT6tgyUXhP1fT82gczCwDTdSmda5uJZk8Rt39MPGffRrXmI1x+F0Vo8pBL5ETHlb0Mjfoy2ulbFSuoYhfMHgPelPRlhOydaPBbCvGXsk+Oz1mka5NE3w4WvAkcZtC5kjw2NfrIXh9X/zodJdLyz8vTOmnlrVKKLhV6P+MpK1f9yKP2TGpcTWPnFXju+h+F6p84I+ESheAnjPOGLxAnOIVgC8YwoJWCkjIxlD8I4ziMfwII9WZEG0w7J4fqf2cwudUo26nNs19XyvgV8owCMQ+qrOSqpa/IWVJDO/XDH+7cJoNr9MN9pZFsd/r4UmfRQSy6ebT6fef0U72F85b6efbrdK1FyQz2xBvu2zRimj7XMNyDY5mwTzVc8xx6RqtvNZBOvSNc9Cf8M0s4lRLkW3F7nPKPkUeWpabGXZ56q6gF6PKHP//LMnLuA7SjmHI3qeqzZpWLw89nKNBboEDcYD4rKc5QsjXrGKrjFi590ug69e+sd22WRgvt1nlql2njQszmm/2KZ9nX3yBrljw15tIgtasThz16OHga/Rq59wHU+Aj0q73SRetxjBR3d4erPE+AeGS055F3LeD1HCL8dEU9EqKH3bQ0xOjvmQyf5m9ZbouF/HNayGdnqd+01Vp/k4Ji2xvkaH+i0FlAp4NuT2LoqTpzixbbNYaEU4eHe9JvXCgCJNGr4qMcYw5ZiCycAtRcIlGYhe3RSPoVOJ2FsqQZyeUy2iwiZphuLohHdIi7Eq/HVU0YUFchL9DDgfUtWMcRPzmBtxRpsfJw3t7Tu+anhCa5R2v27n8rBxNniLINR5oID7MWyrXyss1Z4rTwQDzQDYeRQxcDFQOH1Wvsjc4jxYZ2i+CIKBxva6YTO5yrYgPId6SZ2cFxffBAPKc6ZVxC5QcgcZCqhTYz40BoRL4tudutmx8SEU2rvIRVgsz/pwKZ2LWehnFnKNBdoEDhYD4rKe5S/TRRYQUL4qyuJ1ZmCk/qOJCY1gn8JmH+/wUr6k1Vw4az3Mjfu0jc9VzWeDs0HrFTP6XZob3spvnSxG+HqiYhhV2u3STxPqUaAP9gyES3X0SRHwVSlhj/2OmedImiRcD/hwcdRgkY+bygMO+r7MVE7xXi8h9oLPRRjWsZVkb6acT9Ka6WjTML0RNqFCwHFf1zBUxaGn1nqrqBHTg0PSJZVqMD481wMEOZZD5b0TAaywqJsEeXvmWUY+YQJLgo3Ohz6kcCISlEDA1RttqL7LddHV9g0N8VnU2o9s2CWBmlzkhxoorF+UVZRsa8FEU2cfBKLTKEz/hXOf0c2cJCoqwTtPHSaHsusxSx7XU5zU0jWUVcW/qpLgzbO+M4dHrmrL3OPod7uxTMWYAwUfOKUx8w0kYfRyTASVDFqb9nR3X5CWYFH/i2IAXZp7D3qt6+nKLQUIbUjRzRYGgtmRT2mZc7wjjuXBda+2CxlpzHTOco0FugQOZgPispzskr8BTtzhalmITpzKKJXqi+F0HMyxsVqXqXHnF3QynxDJnpKfEuLSet/QBfdeSZAOLvZUT4OQaTp3e9WxXVp8tbNRLb9M0PqRrMntSZ0q0lVyhTij0Z2xovYFObhFpwHpaoFJ/EeO2LKcV76vP8xOtZVOc2qY4IdFAMiilDHhcDd5mT8od1cTNtW7cda/WfLskCsAAKymqwF/vTVzNHZPgYt4osw/CPfb63597yhJetYKTZx7KScgEXUrtyVk0b/qa7r0PtZDRpdnYS65NIyWxwja028zjsosfkXWM7RVY+6AXYnOQGa47wG90BjxCCn1pveVszYHv40fQa5lCNYNH2+ihATgvSR/razazbQQH538HSG9lhl8v9S82rhHAZzu//F6KwtAEMX7Hw6SJPwwjTanngbjIesm19LxmY8rH1vJCIdYa5Y7lByCsp1FrIpf0WWjbWB0+H8kr3KED/2vrqGTtD/Wco0FxgQOtgPireEps0xpt7xzA0dP0R0q5XVVgkm0S1x5cRBY2sJ/UBPvbKTvlNU0wIxSPQEhWvMYzp0wJrEv/HmeP9Y+ALdZQp3fP02ZN8xUwIKsFyl+H44vfmOSQGnKIlQkvVsX19wnknLyqyMSTCmbMWEYjahNUxzQDotsJJ9T9SB9FjOvWv3F5qhVwRt5lTOzBcmfq709TsoSw+OSqQ9cxsnF861gj9dekXEwwZ+fpf8lrJWWH9igLLlex0cjnJYoQEQI5bQRLrOKL7puWwZN4vfOklb4whtDL6gx8TmoEnsVoADR5TTcx0TSAa0z8KrpYjFvGzeQSCf2l1IlCI87VgacmElIFgjC1IxW3XL1YFovxSLti9q6tnvGw85iNUyiAeEJ1yW1Y/h9WUhimj0o+Gp0VNAuPmKDcnXqw4lAQzTkTujKfBVgdJrypv9kkP9JviVhU+zUp9FGdwXDGHrSY2kjxJBNqa7d1PXwAOlY/HIGco0FugQPBgPispzlXBXvagv7AqXQWilZSeKw3geUfxLBxuz9ypA9U1vLZY6/jCl5+mhzkj8o2AdSw46k3fLJso5WqFaJ4dfvB7ktthDbnwKI+LNuA7nwxtlOwfz4d5tVMWAC2qhLqr+w1mZu1XHMlooLqdarNzWR2YvSuAWzhszUVuUB8Br3XcY0BceYuFJyg3l61DpUzPLidI/fmt1Z6bvVBBsUQGBypUb+nNpb+RmWGb5S0Wsilso1BzfRfApsB8vhxZVqRcu8LdgBAKcU2T09bO2GdLkEP8jOBkh3A3zudZK89ZM58jMZIwZqrOBLZP69M+zbloSrrvFKSylGdRmGt875HQu4+XV/dsS6aPslflOat0Z1XtTBRKwUNaq5b9t6v7CxNSskb5o9yrdQecybgc/kiLxVkpB//PDYRw5TqaMlBI7pRn9AYqnftAVrCiyMwX11nIWmMj7v+4HewW0+piT7R07n5w3YZALSZISeco0FvgQPVgPitbcvG9qfUmkjVFJaI+odrN//EQ2ewSoSHCsqUERjF8bTFnRBHP206kC0TycGO7Tuy9AOhGvHE3uw8QItxii7QI6J0UNdY+hl0Zk4i0dIB+9A04MWSqx8K5Huk4uYiP+nYS2v1ECvSoaqimphRKcP65hw3R9yrjtc0Qr5hv7vgfdAGihvLL/83EVk7u7Lktj79Q5u7f6BZtNCE4ZO1dSdYzVmlPNE167D9uflf9QDHMnyTABTxIVF80SVbljVgvHQla4OZTcHu+dvYUW/9pI2uoAM1rGZ7HkdnhwgO9g+Q6sG4ZSAdJdDe9dEe06Bpq7HNyrj/H6uPfJpg5hUwb7ND/VeaQrcW+NosQoO8nk5i8LvvWBcn8ARIAW9KPAUtRnewXvsx28S+y3OlTy6LbE7dDoYXCJTDQqw11b0UzKVItNyrNok2GWGdJzdgsViQRPmfTHPZMvb/rQ2jtgvIkBqES6HQvCiNorqBnKNBdYED6YD4q3hXLTJuAg7kjfrnIzMoZOkFXqwK7o7oprVoZ40/xu/njxQAqQsiTS1FyGK471KtO/xeme2NY9MKsOmkOBDA/K6oEyapbTybjdFWvFpPR//9FEOnO7u8xx/enOxBYYOoClkOKNtPj3dXCZVwlFGVnQPP2R0HLjDNMVeMAVTOYBzj+C+kt6MXo+lm5j3ycvV+NDoeYlSqynBnhPEXsbmJar7WOe9uLipycELsJkiUBHOg2Y+CUGKpz6kyKXP0GzU5J9aKBnuoL+u0sZnHhm5Jgp4WYvOWLBKLAtSAmsP5MbrWi5YjQx7ap/YbzCCKa7B+OixxPp8ZGdG0UTF4UPrb8D9yyEF1HrEoobZlE+obu3861ieN/KWfHbDQVpr5k5W3C5yi1q+8st3myMvlafCcclZU+btgOQGfdV3+aSQSvHIQnnwjmHcT+zOJsF9kgmw7H5TEmvBEz9H/OuYr0l/qQByqyq5TkFekAMJhGTlEl5qjQXOBA/2A+LBNb2llUdcnpGPX83/zuGBceaK0FX8XSeYw95E+APyVzY3/PrjGCsLAnXslu9PPqOhlCjJ4/O2Z+RCvYgj7L614ghXoRQOw+yBn+mOfMY6O208rERN4ke0taplKPLE4YEEHrWc///ljodKMpEickJbUUzQATFDTVy2h/vvUwV5EaTK3MBX/2MOEfWLJzswc/sGcq+AC6pNrbw/lQ9vrDKjEg2tLY1EhdbqzDg/7REqq/VyIZmx+zxEw/1FJLdUeLJ/7NRR/OeUIG5slyEKqcTbGORGec/SD45aQ7Mywm3SZnst1lqRZtXvKGevl5r5R1+x1+2w1FCMo3YxFLhB83zi/g75Pnp01AmR1B0z6kPvLDLgpEwno+8A8jlBnfEvAyVy0r44+V2s2ENQwCIEweLqoCEBQ0SvubnUyqbIpZT+UWLQFQZz/q0D944CNexWnuzGGO+uIIrR3NOy+3AtVC8M69NdU+mfn1MINRBNHnaNBc4EEEYD4q3hXPU9k4y+aekUH8EGjE+vXeslWoLebzpSnOkwI90LK9aPOF0T3g2FhE1y7gZShxuqi5hxNSZg1lFP+q0q5ct4x5LOKLYtglm0FCFvI872Hlxj1Rdzt/IgMbO4DmcFlPJTrbe/+5pC15CWikQh9UrJD8r5xcuW5O7eF+pfCkr+pY9hs3XuYZSlDFcfIv5cnM8EK+quLt2HaF2DNi58Y02MVAFHCPu/ojqEwnT0w21q3Fz2m5dVWZB8uyGhTzVD5X/Zb/PNPlEWuaOnyJSy/5qVIB8BI1qvVaj25uXCr/a/UUn0EDiL5Vj7YdKle+iKFSZAkJ452uiH6/8ec7SurnB/MlCeKhWz7qKd2TifVRMbMR4hmhOsoGrkC0Q/UzLlDm2Iv8RnaLzttneGanppX4Aw7pfrSY45AI3Ala2emJWV/wf8AXi71LJVJ/wWhzI7jUYhoIOV6TiP6UoPdrbdyj3TI248eBzm4hyh0NQ2co0FwgQQlgPisp60O50lvPii4ECcr62LpJefBGQwHokDvvX5FimsY4SIXYqVi0EUNOsUtlzbSzc3mxjLsOp7tyzwyxRFwWUOvyMbHf+79AKnEMp1/pFV1m5/TiqUkqaAlCNtMU6mUD44e2bBasok25bYsfGFX83+CXNW5UMog0FSQzjRJunrMnxkW+VvQfwwDgeZc6DypeKn/pwu6CvEgoaTSj05CwGpKLMteJk3Oa4o9mxBX5XiCFwkaDmfGapS80rOhyVYSg5bVcCp/eqCQqj1BWkDwJ8+8CVI+yTxx+K63ZidlrPjIKCULj61MNo+0OEfYYbqcnFM9dii5sSPU5ScF9dWRGj25v0nDH4w2qWnuOvCOc5ITM0EMh7HJV+RUeC8sgvR1x9Tj5+wW2sUt/pC+tFg3K2tiHM+gxn9Qe1LiHmmfVMZp6azS1fUtpAatt/Z6vNlClPvHD6z2DcXp8USvRzv+ifLjOpyqkvhT/gkxr5yjQW2BBDmA+KynSzq59eD0oRWw6LeDlzPf7jfAl2btLh6oVobzOxaR5RSuHLfkHkwmhNK2mhetu957e/lTFyNhB4zz9kTLo8fn37Ym5jIHMA0IeUZQTl8+diIKAeEFAWBROsBt8WF8GNAq+aGLoPsPu+ePrwQTvvdtYRKLAjdZ06u1oAXXhMZ4H4mmOeDi8hT3MVtI+rZOexRxOwasovtazv/wIWS2hT8Fj/H8EU+caqTsCGggXYJx5lhagqLF4M+0TUfPc6+K2ooulPUP/Q3h2KhN3wWh3tm5YJiqRG2Wuh3v41/8+43fFl3B23i70XrQwczSeHP5Tw7nKvCMnrVdGjnW8dnLhp3Ik8JNbmXINksCvWQ4N/ngH0bWo0LriE8WOyN07I4ARQEY+mhGnbfLHTIbwwaesENWh14UYVbslTcqzLxU7iApQWL5ekzQIgzkFdQLyqdg9O7Yc4qktecjllzIYtsZTtAadlZNNyqnnKNBcIEETYD4rKetDuVZtcngctczwQK5ndp8SovU1QcM/rzG5PBXSfGSwJqFpqsIYCXfg5/2tUDspOEeTSZ9fltipwmUgGDz1bUxL0kMGlM0p8itSN7G1NMJZL3fM17GB3FToZvTsaKqDGBSF150jrULeVWqs5bWK6dqDFTywZBpXcXAnyK1FqaJf0raUbulwDix0cWYvSSia5BkMEdrb/rtBvFCB3PTM0XF9dPd06xS7vEEpSY6/DoxFXVf/l2NtgBp4sPONFDMPSC9HkAsDqddlQHOlcvg/VLqJx1pV/jM5sijeqyvw9dPHxqS0ZL4av37f2QJU25ISUyFEMMUqzN+iZzSeUW6nzADBbdJgmYc1v/V+vwrjrxYRUgPZISmfrmYhJsrqfPYfZfxh2tV0CSrClTjXk+ySS0o8PHsV8z4xpZxxTGWjxgi9yktLECCcEgRsb914EXlgY3vNc7rJ/CrZoOa5eHJvyftEm2FZcGGLLWco0FwgQRhgPisp0v0ej4bHRGdEjZ/CbgOlqi7eygex6/K8IGz9GrRT3dCE6qkQvFY/e5v99vVDkPyyds2sxkQMA1QrVX4pjjhoO2DI3xOTs4pXeTNktGwCS4x9DEG8RvTHC2vLoGVahWvjg3VkVPnBZQHbZNDsL4IIk/rQdPrKZnNWKjEy26YsSNuXzdAgJUjNz2Y+PjE5hWeR0mXXTW9af7O2Hi8zPvFtAE/cYUqFmGujDrpoInlDFjMITT0/w4C7vaqSPYssWcPoGpbqtxqbh9GDFymS3F6zuVtnv62SFOE4KlT9XBh4kb7YIeNrDABEZNNmqFw93uN+JtiTH+Q0RZpWfLlDGrtjYhkspyaEzZ5QJoKUo6lURnjtYJApIFLWarpvYcvgMJrAFDET4HtEWjZKHgikgVfoaqlrynGV1Tj4Xarn/wADZYrI9+h3G7u/3QU7f6qKYnPKSkUPl0YFlnsTvPk1NnLuow+giGwHakvk5yjQXCBBHWA+K0TrMqty+Jx/qNteYfwXWL4rnmsNUKE7qmurdPI0sCrmIIEeDiIzWzRYNBC17qFr8Vw2Ts0lqOq2BtlTfxRa2IoPSxaTjx+2gOwIRymfkG9SkS65n4gDzkFsnKFuslZRc/tdAgCMBBs0zTqT55oSCvFhAwYPQ8Ec5DxoXQOVLBw88TRzizjc7HyDmQfd/QEAnejE7JDBxGtYtQvFMe1MoLTjpOPa39wVQav2NwrcXZHn4xDbSNhja4eGGmfU754P4CbFBEh+tnNVwp2sT9tcMDvKyffe8MAbudB23dV08BK3fy39In9zKawGQYo3QvHZXsEucBZroPQh5Mtn9upoW5fDoE8bfjZ5uDPMJsdvPKJO452KqFGrJcqAGTLdG60lJmD0UhvgpjCtITsOMEa6Bn8KgKu6C3t4p5XF5ClpOO9DXchzBPxx7f21iYK+GyP9iik6wbkkvK8l/ltvRnQxPgbr37jZEES9PvLnaNBcYEEiYD4sE2OBLz2IwQk38fBu0yHJ/ekSa868a75WQ6fT91C0VAj4pUxjzx9s5fR+bQ2yCOuqqUbqp6Y6l+2gtnQmGtiFqSCiKM+oljQky4sHDYvaJgcKAbT7qLFtReeLxJWgBcaznjh4gLhM+6QhpXzd8nSMOpzWq3QlLAkffhozY61PCGYLbXHq6o8wF4VuIBOmsSvHkE4SEi1xxKuZxzz3P8lJnNj9Qn0OKmr+u+2sMv50bH8/rco2ytVwvFhuvlSDZMX45g0a14s4z4ZnbhRqg3DVRUMBUPrzyEKayGP5UKRD1hudeNRsJGqHJrXbepY7u3GQfwv3Vr2ni+1sAjXNSrcdum7s/4i/79UnYL1It/7WGaAnp51fJkEmKyrYMPF/2cwKoO2xF9QJ4wdyxnt27SWuO7bd8jx2rAzHWudYL7grOuRuEVC95vOuGA0dYmiu+KnyOye9igYmFcyjRXwLebdZ5EFrOzGBLvnEmIPnKNBc4EEnYD4rKgp5GZgnsPu1XrY/bkA+2z3Xhhn1SBg8klvHDxgI0eSzuKu+3T/o84Voe/hpQ3P1NKZET7BiY/Q7FeO8ZvlH8DgXp7KDhPZ5y35yCu+WUkEBzLgrEKHoWW8MiAONeHD4dmIlEGdX3J4IDK55kbGXUFTRkbNTrEHLQUYVN4k1U4ZW0IMHaeBKFVM7oFNvwPkWkMlz0vdMzLOy8nZYxVTypuE+PY92SseX3CeE1qOdmzIoQQtKaQ65Ngs7T8oIamwbjlIhTgQZwoSb3tGn2QhM9VFjJHfnmCm4sdEckyhL45fnTBB4mIyNxAm9orC5T5UgKZoKMgn1hriIf20Nrf55T8p0oovCWl+CqieCEItyvHilmnNWalcohfp+1G+9J6tf3rDH9qsSBOrp/m8/3Mmny/vqJnZf171D7RnCFKqf67rnqtBHkBLvMg+BQI74o0im/sMZHpI5yNSwVOiKROD1tamuZplkJFIAqd0LxWco0FtgQSxgPiv6ir6IhnDah92/VKcvOGzV9vjKUNBTbxrwt3bVQhg6k32pSScA7MXk/hsIlFQ6vpSfsg2IYM/juruuphQUg3idlSbFcYhdmvkNzM5ALeCE5v0MBHIUY6cs8UJMyIhHejgwgTGmNy7IIGKT6YjBTPuN/wXU2fYmepR54v0bPeHRuCUSnton9i02z7bNhB1KQNmdgG9eYDNQWNUx1znbY8ozg9BBr7cV3bdJHdVglQ2KxjsDpc3imrmU/6XS18jXKjHXNTlwNCzdeyzoDBFBwmygug9vO70PtVLxOxQcZ3+wRUEPCev7cVF3E7IC5YEQye+t4o+DXnQmKhAGH4FRyBksQaC1VOhgrAO5fFmAX52DolE/omDDrGuH8KgA7zX2EnSC7zgdNPxpSf6Evb0Pc7LJqEOBuFq1AUGB54mjk08yQfbsUJ4Tk1L6pw3T1QE90rbfrJgPyEWSfCkRw7dzq/GS9I3hnIDGZ2jQW6BBMWA+KynsxEALlkgm9b1wJqHdHMxTL1MtQuSReoWyU/lbdPEVU3USrjk+3P+dgjsXNAcj3wzGDVjqbmG9DLct2iIWBeGKVNslXiyAgJQ2PZDXzN970z0GEOU/1d8doZ8w6Ciu9QNT/FedO5Kblj3X8W+F4jxfncxoJWQq3JbhgYVC1j8D0r/lsHMUs/xmN1YQr6f/T7tqyVzGeoiLLpBwctvDwEVGs1lo2ivtM8nfTibPL500f/oOrg//Ze02NVS1hGyGXembGVGAmKonVw7PfDMfokg1e/eqv6O+Z/mZj1W2xPUoSA5hwKpG5jAUxJ7FvJtpgvXtDKI+Cue5wECMoX3GAq+4nSwyUrPYJwAdnB/tJ70Fayh7om1p1sfNVLL9PxHW3/Uo3BgY8plbz4oll2XXaUWwEQvBpwJ6C7MsBRsS1a3KGSw3bniUdPzva4Kcv0VOInmMTdvb3jym5q6TVaUby5e800kuAphuZyjQXCBBNmA+LBNzJyzpvL6A2AO1S6qs7lhWKce4ONZQgBL5y6ZsGLtyK7i12rlUC0BEfganMLmQfzid56AFRhVIRKZ4a3a/jeB+r6wM0RzAMfGfgYUAn3S56gu94S8MZMZpvutPJ/i2SrG21R7wwx9uIFyn0enJojhohoYy6t68peeGtweOUSCmEDyHrmVSnBgbdVTki6f6DlTYu5/dusrX47nk86DYkUpB1hYfvllDSd1Nf3U8ASewYFZnpiFItQmD/sKXq05EeVvsq/KF6z+BEEnF/aZyK30rPohBufRWQKliAz3cR4IqDUbjJNR1NEE6YdY8lbNP+l7roPkCIUUVnWNpva4w2YLsbwOp3cDY07Bur5or/6iTTjNlstQTBQphSYlYwFKNxoo7IjAM4f0bBlAOlQAXsIXIxnxJqBsK3vAMEPGoKTVHnXpErkpOwUH6pNtbsxMIjYnoMIsDR8KDPggKb4fFui3HsIzlJlfKGeRnKNBc4EE7YD4rKgn1i0AEXF087yWU384q0INeRrNjqC9kYzlmqEvHV20YNMjOcQ/I2+/xmYGUjWatxaZsD2UJ0WUrdkkFxkTY30vtQRc2/9kP9B9X4r0VAPSqMAz9TMDmzETg5HaQJHdknqr2YE31ZZe5EdzUPUz11xpS+MNkbX4BA4iiR/SC3LoFTe8FoOvXRlkQk1f7P5hl6ti7vXC1vEudHm7Sd4AprnWd060JA6A9W7a6UKHzvpCrezAKgjwSnTYgO+AXP33IhjFz3X8Y2Jyr2Wjr+OK9BTiLP21g5bWAt/I5gwWmrVz0sXROviI+dSQoLkbOIdt2v36R4HCBTLdZbz0tKqguofX2Ydf71CrBFMcMth6w8Fl3vUdWtgrOZC4zgdHT2ygEm3OXQNR46y2U0V9iHPqhbfeToglRBtH3UUJMzvErgd2Km/h2GfFT9fTWnaSuvXfaWG+uKBlqjXbfVJFl8O9hzPHMIIczrfkdesULAOdo0FzgQUBgPispvGv7K5v3aRCdCXbTo3Ad1ptnPOHfuVYykl6LuTxHp4iWn3zuufNhwlybrH9xau3YkART1uS3kRK0wOlLpmNmVK08TuYtshJ8qEHwRjSt/DdFlYTQm9tZqtxkY2+Sh6TraWEH/wgnYOkdlDjMNT1vwNJRcB1BRWpOYKBNpeHg1TLkX+8Wj9xYmi/BqqrAH2eowBTBzX8FmBT0zGRgAuu4YtDkFLg4k7b64QV3+jzK2tzy0mrTX24K7L0haw1qMsc30+ERUC38HLlu5Y5uX2Cm1VRd2qXQC7q/CjgpwDWBrxgvxoRqY8ndrm6UC6at9iADYFtLljLjjSaL59pq/4fSLOy0D6pFbN1oY74wL05krk0+3u3F7ByiP01rGKi3XA9U1p8AU+L6lYRTrsdZcW1CADO4ovq7/cGoqWE5EfaYmOkgnHCsA0uY38dDYztvKLYN8y5dseW/s2GZLOxMXnrFWexB++ZDma3ZgA5k5yjQXGBBRWA+LBOgMPO57Up7n5j6bl0mOGX33MpbvflnF6JmiyaVMiAYNMkIQlwAxNzckScJf9Ul4Z1kDKUrff7gyEyI+KDcBs8++fUilWhwOgC2Cw75o/N5M7j7Rx/84hXuwQLNOM5iHRzVn/dX2IrQYbsQNEKJ7gr8jAag25PzDUVF/hHw4hVlTmnMwjfxHPr1c5/M+QtOCy/q+JWBCafoXDu9NMG+x9EzqSgY95KaZCZtdE3CzDtm5pdKR2e/OTzKtK+auIZt3ljq7aIfkRaUPpt4Qwgjaz83APS9fwKB3/PBaR+38sullnLNM8nQNXQFI6TEcL4SkdPEwYDHJ79YIwWjXKEfhmZeYUdVpjSv10OQWXcrGWYpDv3GV7GpHzsuG07ft3TyxjlqXrV1s5oL5mwJ1DIO639v0PPlwKXUkBXnBlX3+BJjiLlmVRi8TIvI/j+1yspjhTJJe23coFuyBG66qMqms3UVHsnFwvze1xfeZyjQWuBBSmA+K/mx86DN+UfuDHFQFrMj7srbJikR2K84NxO9zXQthei0vm6yCyrUEXkbAKfDyh7FD/SaXLCXkNzeBiTasjn2zLe7mscmQkNUcNCRLHhfP/FIFWHkaGRcfE/cn5GuktzUlQwRYvthetEmCoJZ5tBeJbt+yshDM1g1VR4v8VTAFbj37dTsddjFSTLbG0D1qIL1SKPYlFxhxBmgaau8XpVrU2H8amnlY+uDPV3v0mcRdjg45cNpqRis1CIpC3i5p1AVkwOrb5lq0XzCzwybPRMg7zQw5OqGcHERROv4KiUvMSXrvTFciI6RAVsXiA4QYzzCLhYyQ8Z+51Pi3Rr+tYNTZ/5G6cPzbnOXKyGYhMEA2pux0jfL/U1wc+YuR9KV6zQJvnjTyQ5lBo2+IDX8Sb4bRDhjuPCRa2K5gX52HB0pmc/MHbUCi0NxmDpVq3gaTQizwoWLXGQYhE8QaeYvclGjWuD4JvfjZyjQWmBBT2A+KsRKsAlguJDHxYLv8YrDfpb7wy+j0pglPjHoh84nAP1mSQWsi/9E3NzzY3rWFllXzfSokcLZ/7ptGnPIxmNobScJC46gc9ZOeMSijz3nFV6dH7RZ2YvQxw7FZYV3VmLkuU892ZXVL5NUORATjLcgNgCxiPZQv3koLUqV62+NxAl+1rIsMGyIPAg7t4Gs5g8K59zao0ylMZ3SmDXUUCBm8ncsZXXkkZNJhQPR9Wyofig3JeHyYRq7ix/Whv2oXgGc/Zt9H35y6iY7b5j+qh8zlq2hKMxV4OA+/BwR2e8d91/UrMREOdcHwGb2YCvNAGFFQ8POMSSCw8vp8TJrIVErIV/JG6oVUrHoK6LpVL1+4/gs/OfLUQSUPvjLl5JQ7pgaTi4Qjyg7450dOYCWLjY7E/VOvt9XMc5/cn7lt1E3mvA/QMEGYV/CdKxMZ6xl9G4tqmwVSn4L7tRU2F2kns5zIV4Wpedo0FxgQVRgPiwTfCNqPKf05NwXodAvoFDJ6sPffbhAoACKOvpndhXL2ccvmMVduqTlc07cuOt9Bdw3l1QrFv8GkSD5nWBnbAytNkJYOv/vdFsY1fEEuAcfNKStVwNZ5yD1eTdZ0VrFUG0RTYB1H+n1wrYw9cuOeQQaumOLZgcc7rb28X2aMmQKAuSfvJzbfnigU9FoWWWwcCKT6fVMUe3RA1H0TOXqGxwwmj8RPLxDy62eNJ+7TOa4wcmu5QF+M+BYVXDqYMreCY9391n3ddxweXH3tDSnYlReJEVGDf3mEPTL2yg9jus+tRhEJ1AFin23DhvriDPzpj4irITyf5XdzS7yN0ifGQUmdv/p+WSVl3D2boflBnxPuBvhhQ7xvUaC/rl4ST7MBTjSaB9tj4xKWkntWJkVue8eCeXnM0XdQGu3V3fIruZGkW4p6XU7nQ8Yome9ApdIaiANFjGvbB8WxSDEg49SuGHjhzrzbbIc8awIpudo0FzgQVlgPispvGv9fx7jNkvuWhghrwsazvl6rgIq7T7wmVBi/2hT7o4PAm1lYlGQjO9lxc0LOuic9uB1D2B13BYRQTMRm891x6HCVbBeiudgSI6CCP0g8vq4WCRpx/H3JNU1KgZLWGj2MDLvPoUf4bbwPh4/tfmHpEAJV+yasll8Xxfw0yfGu7w4me6H0q6wsDFU5D3x/NLs8xkpnUhJUW1McLDwooRe30B1gHml93/Eh76Kg1T5cwlcZRNZw7OpJHd7BBXYMEnI3qCI4fsPySICIKfks3Dm+ZFXFHmyNkoq3laYzuEp5xvIFrprXiKObqrjgN/pPEmt8uKcl3EZrY2up4vJDcabKEwy4KhDmDuZh8pTwPnysQoNECgF3f/41xkjPNeyIxz9PHL4Dpkbrf7PUd3t6tMnXL5GIdlV4ftpqIWUtD/0pX+JF+H1oSkP4B+k/udKAZEOeQAepB1HdV1l8n2eagOmtbgRgKvrUqhuKpLE52jQXWBBXmA+K0TrMrk3g+EkE2SmKDXLxQ/sLfj1THasvAH1isrFrYpGNqNxgxeOjMTrA5zMseh/rTH+Xtd5j6FmxT6Cw7LHMWyNf+OhCPwV4OGK+yNrowscqIm/+X2v/D6JCQHk6rtdqJwZE5h06vc4yK2cE88YgdlQ8AFz8It1uC0ZMeICUyA0PwKxIB/tdmDdnPWgwWvDSvHfqhL5TxthzQPxhOaiThJAsHYUATRi1wkhCgLihTGt0zVDXSMqKFuNv/xSkdqH5SkkMc7Yc2uxRzN9ImQcNs/dCIiDGJnJ1hX+ehnQBOMtgz70uUZJ4jb2GXRGPAXZcqujdDP1daaCB+41tI0QyypdIeaw7LWZ3ZHNl5nZiF0m6hL8bDy7954zVjDp/XYQb56I14uu4hFUR9Rqj+R8pJ8XunaltyhY+a44t5JgCDzY+OaLQDFtIpvRZ9V/72Pv2cgqkUuwL/yXHLcLZZeGonutpr9hsAuppZryC/h2u2do0FvgQWNgPiwTZYUkdK95jMaVZhMHH9kj8LLUDyq186AyMXXRmFtFnkTMEv67Fmp4xWo50XfS/78dUNJ36FaAi7Ni/5RXXcYGULaMVLaIVLJntShLeNFrRjSdoK6AFArqiiiJz5k+dJ9HR9z/nsXn9pUf82gdRfJAO0eHV1bhVVkDgbe4KlcP2VNcQJmrEYEVYrEkMdZQNYAvcwI5v2lJUjrRJ7WpYHy3YbfhM3/uNDTaSETjfxqJM3VfpJM869QKzQU2KBNIvcc2t8itD99eOvtFyAScjna50wmEFsViMFAy8KAaoA8uFsnisGazHJd/R+iLVBHrQd0OT2sIhmSMM6BLq5km8GRS9O+HKbhlSSK22Wd3ad47SYKMfPnrApgRnbFMF3AdpmKkgIm2vVdtzvZraCNVh9H3NySrrW4xFCw27hDMTq5Gl7sXA+HdyYphZAkpfDeH4AgOBtL97tHg7Pp5naBtal2iaV8QGKO1Rj7nKNBcYEFoYD4rKgpwXUdNqbPCg8he8mFxcv2VNExrIaBkassXDl5p706KQ2Q4rQkvjIZeovsfWkAysq7FWB4cSkWEPZQFn7x8apBqeOqRB4d8+v+4E+k7+w27dED5iPiCu+sbnQB9my7BkGzBOSL+YxIGSvEF+gm5//YNsBVyOokwua2V0qgR6MmHliils5Ba4CtT7vYv4DnOIqquKDdiu3rWt1JtB406qaUCh8hY6cyzHBrLB1rnahmw3I2yXyJPJ1gzdk98TIY6wOufXjaL2n9YQQ3N2sRlIcr9xImnRvD0WYIUhrEXAoC72V4aVj6rIy+Tq46y24kw4DTJqIPqb5CObN3msdKe2Fcv/znn/uhBjY81cKa2pQG0KX0dNGtFhp6Pf2p2PDgyqIk9scqoOip3qLHLClpW6yPi1DisI82vR6FRCla+Cfi+GQ27a5HDnE2CC4vwEr+H+mPs4voKSFlS4rO5r9ey2FANd/s0cxepBlDnKNBcIEFtYD4rRJOodTivR+Ckm7Odjrq+J4ARlAfrSaYnqh1n1WReyoSlK5k7PsHLm2Pj7ug9tXdY0SBeBupwJ0Vbf0c0oMZFAx2w6jl/l4vqMJ5hk2zwT+KFz4a0DjU4wI5OQGJ5+d+D3G5xUIzYIKFMOLqMjr/lyelQl9pGCz0lUu/woOvazKEz9AlbU0gocbuXI7FAInSAGNZaNMlqmtVnLz0wVnTi5CUWbltIu5ZNL44QvKV9TqelCT2T4ZOuGuLs16JDaQpSDXq5FPFawBBGmMAM1B4BmQ970j4sqm/B6oNkCPWRNQFs4kIX1T7eB+80TtLFHviqQBl6g2/3gKtFOPJbGi1dWB6ODBVxphnr7LUdJSdH4GQ85sgA5SvTRlxetzgAEeA0sZ6LDVOSjFLcrnISJWyUN7D9lE35COdf/zpZ21uJFj8PMOV+8UKB/6FiSGqhT9NhXJCy5QjuzGPhzdQ2UrRnYvdJ7mB2W5vx8Gdo0FygQXJgPixrnW+aFNkC5hUseJoFxIqyTMVDP6233QfBrDuVgYegXPYTFs4x2bjkjA3j+2RSBEF8q7UIi0hX5hiYE0tlekgfLwas4tplj5ZFCgCIS2hP4oI9NWGXHvoAC/9bJ5XSGLU866EARZod2bHfAkdn+QiIDyiEiUFXjj85rgrvSMANlxWGG+R2KhGqYN26i1FIfMruzvXp40v+fmu+VI0KKUsJaxE/HwmJwqIijB2c3keQGyVzqVoSu4U5u/BRJ3QHa9c5mf8dQrGgvL53R7lZBC49HyasGNtTKHDurNlgmlR0+Fx/R7nPblMvxr/FXJxDgdOv4D0JcawrCuUy2CJOX3bYhX+Efm59mD3f2VOsYWb18xWnZ/H8N7PyUzO2uIrdBmaMaZ4V+O6KlXHFk/ofSbuLSWj2XOrUpHCajL/brUMUND0he30nY/Kq2iNM8N8rppAvuyo6nsUDT7S6Oh5HiJ1nkj29zvpeIqqkFJdnaNBcYEF3YD4sE2V8rux7ur68fd0EgYyUhfMrBiXqMC+qOvEV/0RNQuj6ZK5aXd4qnGYacgDC5vLlMt0YEl8EhV5dwWRjgWmnyGhy7Em4gVa4ChnoCTn5UubMNOhSedsmAFgYZfq4nDXrFazEiulr/rOVqfPNO6VBco97cwp8DIBdPpPnyibDUzggQWOGSdXCDLxvi0dLwHUtpLgOVDTs7oBVqz8kiFBdVaoJDj4yEndTwK1zVXkAUN0ujQpGtXC77TwG55XxqOBElrl2GiA+gSQISQLFPRKq2j/s5uyr96z2iy72Eyq7OcAatvWLdfshfIOjF67iXTyuvmGJKevWRPh0DACECi1t7wA479lRnpI2gldB+4t3xeZalLt3zkOzFoN86psAZzVlqDHtlmCjKm7Jy10sdP2h19qbx7jEANYrk/2x/kfU7BhqHhz0NVrgrufvB6ppA9ftAaCftabjSTLJw66290MXTXrUDan3P61yGQLnKNBbIEF8YD4q3hIlBc4GdRzSk+1bIp6pZ8TTj2qXUcd/BT0WZjh5gSqr7O+st0eg0E1NzCqhWLcwhsgFl3qCN93gC0/+93XtUBhfDupTME9HslLtk7SVITFLM1lb549XmbjmmpFPmlhpjrv8lapjmLboOos+NurOMFutxOUQFOAJKf6yom/jLxwl0iNhGwB/GO4nfnACGEyuN/faOWESsJ2bFzRHQLBNQfM+SE2elhgpjXo/00vgLbOLGrIaejncoC63Pl88hcOKdJBuLdgfF5QctCUsMF17BhczOAszb1+Jhtx2uAKIDcS76ki3Y1WqE3WTVYvpDfVM2xMNqdlBIeCrmJTV8+jkCFHlXXfcpYFVrj+Dnn4GG3hLOyUN1cZkGA9vHztOkHOrNP2pZda7e5POwuAUFk+lavJZreEIkWd9jGyhzP3pfaHgtNtM4ia/x/Uik1Uc0Xq7AVRPT32p31fB7Ut/u7Sm/g4yCkFBZ2jQW2BBgWA+Kym8TxZoxd3rO46gN27egFnlveeTHKHwYGaTy0ZnWYzB0+KI/1Yue846gQ0w77cP5gx4BWmaY2P3WAHKjef2A9xYy0CSj5AVy/vf7+X0BLhm8xwSLtHofA5hwkT3fpUzfWcj6RzhSkvKenS39j0+Am2+/CIub6jM1YtxQv9Qx1Eg8WHLtjtaacg0dIwTK2DBUAYmE3x04WKMpaACdEpoTHd/iRQxf3k+1KAjrwHOpWN4nDOcn1nXVUHhC88kFaFHYYQovAKxk+MD8mQuXbnXSXxUynZsm7zMnbE/Q8ZtkREiDrsUc3BVRaPcHwjF8pnP/HZc8GobDiP6jkSRbsFduj5txTs2bjodMmSk8YUjlJEVT8DthObV3/UuWXlapMt3w9FTgSI21DDIsSEth2wEsGzQVFsQiLhKRCy5k+hN0ulZtM/SO+aLYQ6pXt3/LLgWb8Y0qJQCQaO/lFVZ7FoVS812TXUygknnaNBa4EGGYD4rIjWqpeMX/37kHLgwX4dIukKiDrVcrafP2uom3gearVeNROWsaNowdufQXs7hczjuBRLdD0vzC/9hUlhJCGXalMzu/pf41ElFkjg0dm3drxYA84RuU3yGLKII7rxrAVd1xFyZt5owyaVoiM+eVadw7zO+jfkwoVpxUDBHIUOvFNuWPfqVFX+kxg7/qJEkwFGwaHI6pycIX7I4K9Uwr8bBgx9zTlAmGIeAuIXGY2RbTnKFi11DBjlY3kyvQIjj32v/fv6lzN/YWS/hlgZk+JqPL+AwIZ6m/z0zDpueImp6IWNiPjEHh4D4XLuLK8oHg1NHeshq1a0KXpA512Vi/yir7VMjtJkNKLgR49Znv6rVY9pice/Vm0u8n2/kogNbyQ4C1uvTDrT1pAQyVweziN2Wn1ndASD4xqRtLjptbkWlczXnvUsqJ2Fd9f75AFCLSHrlv6CGCS57r1Kra5h1US+H2Fct/innaNBbIEGLYD4rIlLRIatcxQ7gLEA+TAmys6tZ/X7L+blOG4ptkaOEVMnMCeTpXsM7hMtqZFjVexUUT6aD1/hgrQxY+rUCZevuJQqj4G5zLTzP06VnsLuTXQJT+epRgkpIZBBWbST09VTjRum73Gzq2BdRRhlUXy5QAfizou2lbh2s5IbfJ/hedEagECXhYoY40ohZsqMMucOFY7IIJJKepih6p5UBKXGkC1OXgai+cbkr+IwM+dR+6h59fKYvCBuvOCCE1Nby7xFAub1a/aCohaSxSEVNrw9EuoZ+ZUV1yVOBut8TCIfxrAqGHG1bBdwEMW+Nf+RAYdP/94LCpMdTTk2lzVMK74jU2j8nWUH3lTaNaPBGmVGzGeaGm1j/HEKCcxrhmO2PgwQMZWSrTbQVKgnhV1sP/D64ZDaufeijudTHj0tlf2WqV4nb3VYTVhQVNmnnus8Pahcsdy1Tkv0GCz+YNOrkva2Tx1st274xZ2jQWiBBkGA+K/nyla4p6mYECmcV8A0Bx7ceOiipvQNFpJFX8ifZRxP5fdus24Y1LG7ghIF1Op5oyFo1MjsUmcDpk8qAZtV8ZQVl8wrITYfsz/Qk8nx2abT5yG5WHkeSchVNSq12YxNA6U20m6Uy/QtmG56THX4XolrYsQYjmtIdbaCirJQA63Lgk50KT5DDxeDnkCScT5SysBXfdrHq4uN1yqvFyk/t2witnSQZx5sae4/swdXEKFfn/aA5rySHGs6WjJbhhCBpuOJoEs6CvwCABL2/Olkosm9Kcrn6w7DoHBkuhkq6xjeGfYAzYg1wZW1P6DGWbCAM/4kTD92SZZeDQbLYM4Xg65PPsM6Pizx/g5rGt527Yq1Y7x0QztwXxFyLpjfWURgPKW/HjjxU3PVwJs2ntpE/0DzSmUt5oAKbd+yhd64FA10tjxB5zqrKPOfo53OUKLx3pKZiu6QUVV5GMwi9l+xilN6fZyjQWqBBlWA+LBFrleK9LzVGCVBshinGXZ+GWyFluH0nVewUObijVEVv8tnIWpf647CPFyI7KV59fnh71uVJh5tLm1ZCy5j2gJ7ZmGZZvkuhlAH5Hq/jk7fqSO8n2ioY8AK0Wdw+PiibgwhbIW7e8L92iKXVgzujlftl2lRL6IQrnkA2gdLgPMWA61O15g9KF3+3Bw8Gwtjo9elUJEH4F7GxP1w84PeGv36mbZ5TqU9dRqp93glJMCW8wwEA5APdXDREYk7KEX7Pqk0CBpniok/OCgP/LMhwea4yOVyaJfdMeeG+RnYgLA526twg6U2ka7B0Nt/761+Ez1tT4QOsK1nUEaYcis6e6ts99/YRqIhuu4O/keyBcfwlWbJPTlKJCCX9rJnuEQAHBhoXuH+0i+eno9O8lrBSAwcFjBGzAveAhvfa2D18pE9rT/zSjte9XSMTdGcl2+Tans4Vt4kJeqpdOU+YdqiQb59y9T3nKNBZIEGaYD4r+b79ug07+xNHO+kX50rydW5zL+wRtISLp7nxEGSgKDBZYfOrfjo4KprQQUEQZfLC4Gq1D6M4G6GPcn/7I+r4MurgA+w1eOdJvxl/X+Y9IktrOQ2PsmcmIfdS9druIY6mzVqtwchtFpIwRAUcCHLaTQLut831bZE+J04OrOLwn20HN5//mekjb9+y9qh24hCVNGRzP4KD7JI0JmxYucCATDuVdHGWRF1qx2f4dHJDW0/Pynw9RgGaw3nempmX6blGM3o99+cLVwZJJHMIc9lSRxDTRVV/2cTenrcRFCrgn9IG7R3ubC3HMhqkBeBufnCv0pA5CSDHcrbj7zK7eCrAb3x0ZNK+i5m3BJcE+2yi6ZohS6K+6pVqTSD0e73HbSugJ/j0oGbafHAlZF8jzfeA8Rz8FZ/BzoJWiULHP50O2o+agT0jTDdveIzM+die/9ZX+MsqP9wmMFaaZlGdPGdo0FogQZ9gPisiNzt+uR+7Tkzm/fxysueAmA6xPOSTu5MGdks32pw0E6/030txdNcMGPHmvNYXigP+R30OFW8T0OWVqRKVEAKCIibZfsSTbo1vzH/IZogx8m72sQxitdpJOS+Vtwv8bydA1yKUn6abekzXYoDSWvCYGx0W2rDEJ4Y8aPvmQ9BtJufKLNaGgrF3s02IEZC87t5OJImnT/FQz3ZQh2AeK9pTnRIgzm9/zedpnSPpV+VNaUyQy+avPl3gF59uXQeV6LM+VYtHvfpK81YgRipADbjhMJlA4AQxzEEIEKu0zROovo0Mtwh98iQpcIOj+7z5qSNsyGyCHzegkxv8slbQDXypBHeFSeTw4NlnlHlvZWV/TpnwJpS5rMHg7vSoHkMq3RZ7WQ9aOmpDvclwzUo0PGiNJvVpSMjHEpLT5ivHQe9RpPW+SloH66ek9ti0eJymyRa/XXDFW5W0hcxktAysOXFCCGco0FxgQaRgPiv58ssS6rtAl7CVDNJvXmKuqGhT3x9Ec6TkYCG7uMo+OpxD6MTjZXjijwxyyqOBST+zyk7VzJcN3ZVwnO4VDc+zIarLprm0IubR/YSDMxIbHKDhLg8p8+koLfwPakX/ggQ0UiYIfNkRfqw1YN+g6/WvG1cwfE/erjfpBDXeIgEzeu6oQufMZLVFJFf3mymJXj5Uex/xkz0mFG/Vt2XgGORyR9LcIS53jhVVMtCfil7LgNEAAUgzioVcL0IcyQp2z/GnJl5wwXc0mTz/XhvcAV58t5gmR7hAA8zShqHIUb4jLvzehF8LX3Tp0zchYUElvJO/UJmt2zq1an4epOOlueEuK9pgdNIrqlLGurOL+u5S/0vwYj8o9gGXXen68wQG+Ap8ltgtuytLumMhiuya+m3WNZDFvodwNHQqJXI5EU9wMy4HmiFAMB0XutWIsJtQRQiLS9SplpYli9fqH9iSIewgphYGdvUWtBYXieco0FtgQalgPiv1PVTDI7u7OeLPWkcmMdm9Zv/KB61Asui+97YqvdY+1QhiZ/zueeHzzpOJzHCxf5Lx6COCQPiZGZlJDR45PaZrCEimBB+6JIOrM0Qtniq9onGKLz3WPPuC5L+WCJf43Kj+I3y8lwfyY6A5EFfcmcJp0/T1Nz6YdPp+j477+Rlka8SL5vGAFZygzBKiXFQQcn0tk1P8I5fUNGv17DumrI4++9IjjI7Ox4gXLw63KnzO/yYnjEXCX46QM+S3/MdnsssVYxTzgzeF8zIn0MgsRZ4CNhGUWNU/2gcKaB5iezbS3VkH/W1fMSP6vMViprvdhMXhVHvVYp9eF6+a7ujxUd2H7K5A0vCyYbx9oU6pXWOk+zBbbHwG0YTC0ijarVjN/TibAGVHTnoktQ4cdDzEMKPj2NOcFnLUXz9nCuCcoIjqfx98hORg5Aa6xE2ozA21TncN8ntQBe36yFlYrFx+1oFdzi2EAP8EZ2jQW6BBrmA+LJCM9AjzumkKz2H9MoxfrFi9UCAC/mwD9DIZyM9ss2qa7feeCUtAqz4eNEYNwwcfW7hQVGeKqUPDYu4JMhwOUSC7dr74temp8vBLUwE1o1SNRNm+Eb195ujWdQDJxlUWyW0o8/hEUlFoZEkz8RAsInnQ8FrmI+fMUvTmKc691Yp+lqsVyp0xQ8n+kS6+D2iELlDYug0JgH+AFjCqa4qHZhtSBZda4+h7dH531A3UhLLjCzzw6AIMMQyYFSLViZeCitHlmNSurUMh6RQ+m86wFpsd9njTj7zfrAZMuNsvlcKtMsLn9OFM0X6bqAmku1zOMLTqJ8Nzpl1GPEbBARvfQHOoc/Ud7odOhiywi7f02mKSfnV4vgx398NTyq2zKkVNSU71HNNBwd2aFQZ6dHjK1OCmf07vUuUfOu3XPEiTbZkxLmEhryxk5UMx6+oQI/n4ta3bYiHJ33GHsrIvnofsN0DEyoMAD4qlZ2jQXKBBs2A+LFxV95UCbHlrkldu1ZwCFMcqFVvT3/JypUMOUNGrxm1WLGFtZQ4UCjIVL7ZbreQHyPHhavza3jBZtMIm16k54/02bkFhvLCdD1SaNMCSsERtuL9pa4KNnh9+FZZeQI3zlsAgsKLDGFpTNlDMrPDHM3L8qxGa70DOCQKDa/CitG/YeRHGzxrRU9GjEtfnlrExpabgw8jDtMbS3CqPZLI0VzJJVsZ6d10NmavHHPp3dMeLjxEd8GYDsKZzUGW7TwmdCin9NqeY01nx2ycUlnYOrAkH6fVihTJ8sJgoBB87D+eFNFXQsd8kTNkWckuci2mP6FIZ6YdPLGXWjrFAeBBUOrPtvjCQJNkZ6C8UFFv+undZ7VfnMgUWK1GqLO8te6sWAmwAgsoVMOuPmJeHZD9g5FDKgGhzzdmExCvSvvmWkYL1w3c7GdGua3HjJnEoFNkoCg5ksoDRrFR53peDq/y0MLGOeBesaHEAezPNvleo0FzgQbhgPiyQiZdIOwQwqf4tKRNjV0sn8f726I3Btj1DV27zEeSYqBh8dRnEShEY00nQlK0s9VRl0gKVZ5sA1loGYagJY4JUnIo65vuWAUXyOEAYBgXnffKU++lsFgt6AITn9Ckd4pD71iT1980Qicl+/BgB1Uv0T4CjRB3APbbDsJ6GkaKEyb2/Jql+X/ZODPPCwEVvN6OMo9LvQXq7LrprRdqx9173thSCYJmq+O2xPMHH3OlnIMkc7jqScVh214HgQ+yECKDCcpSHrmKhMxGXQGX8VvVxNWeCZx9PcBYJghejiUywBKXUKUo63p18hqX9JNH0IJi8EaoF0wPP4HntEhMY7TCCFWHDtdktM0rA1eg8AUvbg7smF8tFW5hIHMFZ0oySo0vf0rgBCzP4TJdhOHj8UTJOR/75/FdMydjAspDWzqZ2ttdxWkLWhh1INOQ/OGOIRTKwtEoG4H8MJgocM++SrYIPRi4nmsJkPNqODiDp1yjQXqBBvWA+LI3QZOwVQXD6komQu6QO5M+VVKVp30hdz9vAeoeZ1PiMBKCNwRlFXKCN222rEFdp4AcbKIjAXp39ezdxjJBYOg9RVQV14IX8vk2OqtCT6PFbZ2nBbFbetglMhp/yB46BgfFWxuOgG2KgqoBa+L9nKUJPPlbQlwuA927hdotd5ZQSwE+zfyW1BCPGndvx2GKq5qazS5sgUazSjSg++VK3Qktfk/UkrP8FvSqBVzy0KNTjqV9M2WVy4pUGUoRZuPJOp/Wfr6bsCHnGge+w74zfdzXVSq4vF3emXbeeTpsgE9sV5BPx88V1Lwoe3++Hx9iwyIHKpZpDD0eWbCHbgjxwN7UTZA9yRv1CCnBX0BleioZLCUFlqBapkiSX5pO8sxBLOkIUGhM8b3QFIpZAusVKDoo8zShuIlpsg8/c3AK6b7lH7lAAt/cVg3Kg7t5Ki/Df3U0X5EaY1SuimSqowtnO0juKclufq2H7YusESPrlx/QpxqngN2gQj2hQjOBBwkA+HiF4OY67QebAK2Rma+v2pvzI3sA4ovAip0p9B6oyKBzuj0nJ0NeysGYHsqXSQttWQ3cXjZD2OKaRkpcgxxx6DwSSzOXIfAdIfgCgjFRU/Ckc+4sfGzSFM6Lkc8PHe0iVqQGnhHgKLgWGoSckORm5O9gNmnQC8GMSId8/oEmCkVJ44w4PHJIfzkZ41fPATZ9AM+fFAXWAqEd1NEaYYgGv5C3TwNbZIy1m7bbAZ45ls4do9x/Db76JFN2B1TYjKxeAYnA5xC6pj8wjKRsztma7MM/IgLB5zfJrkAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAK9MvlUgw4EE19hhZTR7Mx0luksGBuII9m+FBlgKyW2DG8tK3RX/7GlH8TjHLDRqUGzlTl9cZmjqlXZfmOSRycYqTXRgpDD1G5zOPlCDGP1KE7OtVTqnfa8SVx0qtnlkXR9gzhphrFQoFQIcEhBS8nxkn53KJEdUY5FcRhZKysxIAuiy4vSnEp5jnrxYlXHLFEuh3WihACt4vkcU7trkbuPs4EAt4r3gQHxggHB8IED";async function $r(){const i=await fetch(yh);if(!i.ok)throw new Error(`Failed to fetch init sample: ${i.statusText}`);const e=await i.arrayBuffer(),t=new(window.AudioContext||window.webkitAudioContext)({sampleRate:mr.sampleRate}),n=await t.decodeAudioData(e);return await t.close(),n}const bh="../assets/",Ah="init_sample.wav";async function vh(){try{await Ms.open(),await wh()}catch(i){console.error("Error opening IndexedDB:",i)}}async function wh(){try{const i="default-init-sample",e=`${bh}${Ah}`;if(await Ms.samples.get(i))return;console.info("Init sample not in idb, fetching from source url..");const t=await $r();if(!t||t.length<=0){console.warn("Failed to decode init sample");return}const n=await gh(i,e,t,1,1);console.info(`Storing init sample in idb, stored sample ID: ${n}`)}catch(i){console.warn("Error ensuring init sample in IndexedDB:",i)}}async function hc(i,e=16,t=Ut()){if(await Sa(),Se(t,"Audio context is not available"),!(await fh(t)).success)throw new Error("AudioWorklet is required but not supported on this browser. Please use a modern desktop browser (Chrome, Firefox, Edge) or update your mobile browser.");let n;if(i instanceof AudioBuffer)n=i;else if(i instanceof ArrayBuffer)try{n=await t.decodeAudioData(i)}catch(r){throw console.error("Failed to decode sample audiodata when creating SamplePlayer:",r),r}else await vh(),n=await $r();const s=new dh(t,e,n);return await s.init(),s}async function Eh(){const i=await navigator.mediaDevices.getDisplayMedia({audio:!0,video:!0}),e=new MediaStream(i.getAudioTracks());return i.getVideoTracks().forEach(t=>t.stop()),e}const X={IDLE:"IDLE",ARMED:"ARMED",RECORDING:"RECORDING",STOPPED:"STOPPED"},eo={mimeType:"audio/webm"},Mh={mediaRecorderOptions:eo,useThreshold:!0,startThreshold:-30,autoStop:!1,stopThreshold:-40,silenceTimeoutMs:1e3,preprocess:!1,preprocessOptions:{}};var se,ye,ie,gn,Je,I,Rt,Pe,xt,Ot,B,mt,yn,R,to,no,Ss,Gs,Za,Xa,vi,ma,io,so,Ja,Ps;class Sh{constructor(e){p(this,R),b(this,"nodeId"),b(this,"nodeType","recorder"),p(this,se),p(this,ye,null),p(this,ie,null),p(this,gn),p(this,Je,null),p(this,I,X.IDLE),p(this,Rt,null),p(this,Pe,null),p(this,xt,null),p(this,Ot,null),p(this,B,null),p(this,mt,null),p(this,yn,null),this.nodeId=We(this.nodeType,this),u(this,se,e),u(this,gn,wt(this.nodeId))}async init(){return console.warn("Recorder: init() method is deprecated and will be removed in a future version."),this}async start(e={}){a(this,se).state==="suspended"&&await a(this,se).resume(),a(this,ye)&&(a(this,ye).getTracks().forEach(o=>o.stop()),u(this,ye,null)),y(this,R,Ps).call(this);const{input:t={type:"microphone"},...n}=e,s={...Mh,...n};t.type==="display"&&e.startThreshold===void 0&&(s.startThreshold=-60),u(this,B,s);let r;if(t.type==="audio-node"?(r=await xi(()=>y(this,R,to).call(this,t.node)),Se(!r.error,`Failed to create audio-node stream: ${r.error}`,r)):t.type==="display"?(r=await xi(async()=>(a(this,se).state==="suspended"&&await a(this,se).resume(),Eh())),Se(!r.error,`Failed to get browser audio: ${r.error}`,r)):(r=await xi(()=>jo(void 0,t.deviceId)),Se(!r.error,`Failed to get audio input: ${r.error}`,r)),u(this,ye,r.data),u(this,ie,new MediaRecorder(a(this,ye),a(this,B)?a(this,B).mediaRecorderOptions:eo)),!a(this,ie))throw new Error("Recorder not initialized");if(a(this,I)===X.RECORDING)return this;try{return!a(this,B)||!a(this,B).useThreshold?y(this,R,Ss).call(this):y(this,R,no).call(this),this}catch(o){throw console.error("Error starting recording:",o),o}}forceStart(){return a(this,I)!==X.ARMED||!this.initialized?(console.warn("Recorder must be initialized and armed before calling forceStart. Current state:",a(this,I)),!1):a(this,B)?(a(this,B).autoStop=!1,y(this,R,Ss).call(this),!0):(console.error("Recorder config is null, cannot force start"),!1)}cancel(){return a(this,I)!==X.ARMED&&a(this,I)!==X.RECORDING?!1:(y(this,R,vi).call(this),a(this,ie)&&a(this,ie).state!=="inactive"&&a(this,ie).stop(),u(this,I,X.STOPPED),console.info(`Recorder state: ${a(this,I)} (cancelled)`),this.sendMessage("record:cancelled",{}),y(this,R,ma).call(this),!0)}async stop(){var e;if(!a(this,ie))throw new Error("Recorder not initialized");if(a(this,I)===X.ARMED)throw this.cancel(),new Error("Recording was armed but never triggered");if(a(this,I)!==X.RECORDING)throw new Error("Not recording");y(this,R,vi).call(this);const t=await y(this,R,io).call(this);let n=await y(this,R,so).call(this,t),s;return(e=a(this,B))!=null&&e.preprocess&&(s=await Tr(a(this,se),n,a(this,B).preprocessOptions),n=s.audiobuffer),a(this,Je)&&await a(this,Je).loadSample(n),u(this,I,X.STOPPED),console.info(`Recorder state: ${a(this,I)}`),this.sendMessage("record:stop",{duration:n.duration}),y(this,R,ma).call(this),n}onMessage(e,t){return a(this,gn).onMessage(e,t)}sendMessage(e,t){a(this,gn).sendMessage(e,t),e.startsWith("record:")&&a(this,gn).sendMessage("state-change",{state:a(this,I),event:e,...t})}connect(e){return u(this,Je,e),this}disconnect(){u(this,Je,null)}dispose(){var e;y(this,R,vi).call(this),y(this,R,Ps).call(this),(e=a(this,ye))==null||e.getTracks().forEach(t=>t.stop()),u(this,ye,null),u(this,ie,null),u(this,I,X.IDLE),u(this,B,null),ze(this.nodeId)}get isArmed(){return a(this,I)===X.ARMED}get isRecording(){return a(this,I)===X.RECORDING}get state(){return a(this,I)}get initialized(){return a(this,ie)!==null&&a(this,ye)!==null}get now(){return a(this,se).currentTime}get destination(){return a(this,Je)}}se=new WeakMap,ye=new WeakMap,ie=new WeakMap,gn=new WeakMap,Je=new WeakMap,I=new WeakMap,Rt=new WeakMap,Pe=new WeakMap,xt=new WeakMap,Ot=new WeakMap,B=new WeakMap,mt=new WeakMap,yn=new WeakMap,R=new WeakSet,to=async function(i){return u(this,mt,a(this,se).createMediaStreamDestination()),u(this,yn,i),i.connect(a(this,mt)),a(this,mt).stream},no=function(){if(!y(this,R,Ja).call(this,a(this,B).startThreshold)){console.warn(`Threshold ${a(this,B).startThreshold}dB out of range (-60 to 0)`);return}u(this,I,X.ARMED),console.info("Recorder state: ARMED"),this.sendMessage("record:armed",{threshold:a(this,B).startThreshold,destination:a(this,Je)}),y(this,R,Gs).call(this)},Ss=function(){var i;a(this,ie).start(),u(this,I,X.RECORDING),console.info(`Recorder state: ${a(this,I)}`),this.sendMessage("record:start",{destination:a(this,Je)}),(i=a(this,B))!=null&&i.autoStop&&y(this,R,Gs).call(this)},Gs=async function(){u(this,Rt,a(this,se).createMediaStreamSource(a(this,ye))),u(this,Pe,a(this,se).createAnalyser()),a(this,Pe).fftSize=1024,a(this,Rt).connect(a(this,Pe));const i=new Float32Array(a(this,Pe).fftSize);a(this,se).state==="suspended"&&await a(this,se).resume();const e=async()=>{if(!a(this,Pe))return;a(this,Pe).getFloatTimeDomainData(i);const t=Math.max(...i.map(Math.abs)),n=t>1e-7?20*Math.log10(t):-100;if(a(this,I)===X.ARMED)y(this,R,Za).call(this,n);else if(a(this,I)===X.RECORDING)y(this,R,Xa).call(this,n);else{y(this,R,vi).call(this);return}u(this,xt,requestAnimationFrame(e))};u(this,xt,requestAnimationFrame(e))},Za=function(i){i>=a(this,B).startThreshold&&y(this,R,Ss).call(this)},Xa=function(i){if(!a(this,B).autoStop)return;const e=performance.now();i<a(this,B).stopThreshold?a(this,Ot)===null?u(this,Ot,e):e-a(this,Ot)>=a(this,B).silenceTimeoutMs&&(this.sendMessage("record:stopping",{}),this.stop().catch(t=>console.error("Error auto-stopping:",t))):u(this,Ot,null)},vi=function(){a(this,xt)!==null&&(cancelAnimationFrame(a(this,xt)),u(this,xt,null)),a(this,Rt)&&(a(this,Rt).disconnect(),u(this,Rt,null)),a(this,Pe)&&(a(this,Pe).disconnect(),u(this,Pe,null)),u(this,Ot,null)},ma=function(){var i;(i=a(this,ye))==null||i.getTracks().forEach(e=>e.stop()),u(this,ye,null),u(this,ie,null),y(this,R,Ps).call(this)},io=function(){return new Promise(i=>{var e,t,n;((e=a(this,ie))==null?void 0:e.state)!=="inactive"&&((t=a(this,ie))==null||t.addEventListener("dataavailable",s=>i(s.data),{once:!0}),(n=a(this,ie))==null||n.stop())})},so=async function(i){const e=await i.arrayBuffer();return await a(this,se).decodeAudioData(e)},Ja=function(i){return i>-60&&i<0},Ps=function(){a(this,mt)&&a(this,yn)&&(a(this,yn).disconnect(a(this,mt)),u(this,mt,null),u(this,yn,null))};async function cc(i){const e=i||Ut();return new Sh(e)}const uc={timestretch:{label:"Timestretch",defaultValue:!1,format:i=>i?"Warp":"RePitch",apply:(i,e)=>i.setTimestretchEnabled(e)},panDrift:{label:"Pan drift",defaultValue:!0,format:i=>i?"◐":"○",apply:(i,e)=>i.setPanDriftEnabled(e)},feedbackMode:{label:"Feedback mode",defaultValue:!0,format:i=>i?"Poly":"Mono",apply:(i,e)=>i.setFeedbackMode(e?"polyphonic":"monophonic")},gainLFOSync:{label:"Amp LFO sync",defaultValue:!1,format:i=>i?"Sync":"Free",apply:(i,e)=>i.syncLFOsToNoteFreq("gain-lfo",e)},pitchLFOSync:{label:"Pitch LFO sync",defaultValue:!1,format:i=>i?"Sync":"Free",apply:(i,e)=>i.syncLFOsToNoteFreq("pitch-lfo",e)}};var Ph=Object.defineProperty,Th=(i,e,t)=>e in i?Ph(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t,Te=(i,e,t)=>Th(i,typeof e!="symbol"?e+"":e,t);const ao=class me extends HTMLElement{constructor(){super(),Te(this,"pathElement"),Te(this,"config",{minValue:0,maxValue:100,defaultValue:0,minRotation:-170,maxRotation:170,snapIncrement:1,curve:1,disabled:!1,borderStyle:"currentState"}),Te(this,"currentValue",0),Te(this,"currentRotation",0),Te(this,"rotationToValue"),Te(this,"valueToRotation"),Te(this,"applySnapping"),Te(this,"dragHandlers"),Te(this,"lastClickTime",0),Te(this,"DOUBLE_CLICK_THRESHOLD",300)}static mapRange(e,t,n,s,r){return t===e?n:(r-e)*(s-n)/(t-e)+n}static clamp(e,t,n){return Math.min(Math.max(e,t),n)}static get observedAttributes(){return["min-value","max-value","default-value","min-rotation","max-rotation","snap-increment","allowed-values","value","disabled","width","height","border-style","curve","color"]}connectedCallback(){this.injectGlobalStyles(),this.createUtilityFunctions(),this.render(),this.updateColorFromAttribute(),this.setValue(this.config.defaultValue??this.config.minValue),this.createDraggable()}disconnectedCallback(){this.cleanup()}attributeChangedCallback(e,t,n){if(t!==n){if(e==="max-value"||e==="min-value"){const s=this.config.minValue,r=this.config.maxValue;this.updateConfigFromAttributes(),this.updateBorder();let o;e==="max-value"?o=me.mapRange(s,parseFloat(t),this.config.minValue,this.config.maxValue,this.currentValue):o=me.mapRange(parseFloat(t),r,this.config.minValue,this.config.maxValue,this.currentValue),this.createUtilityFunctions(),this.setValue(o);return}if(this.updateConfigFromAttributes(),this.updateBorder(),e==="width"||e==="height"||e==="border-style")return;if(e==="color"){this.updateColorFromAttribute();return}if(e==="curve"){this.createUtilityFunctions(),this.setValue(this.currentValue);return}}}injectGlobalStyles(){if(me.stylesInjected)return;const e=document.createElement("style");e.id="knob-element-styles",e.textContent=`
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
    `,document.head.appendChild(e),me.stylesInjected=!0}updateConfigFromAttributes(){const e=(l,h)=>{const c=this.getAttribute(l);return c!==null?parseFloat(c):h},t=(l,h)=>this.getAttribute(l)||h,n=l=>{const h=this.getAttribute(l);if(h)try{return JSON.parse(h)}catch{console.warn(`KnobElement: Invalid ${l} JSON:`,h);return}},s=n("allowed-values");let r=e("min-value",0),o=e("max-value",100);if(s&&s.length>0){const l=[...s].sort((f,d)=>f-d),h=l[0],c=l[l.length-1];this.hasAttribute("min-value")&&r!==h&&console.debug(`KnobElement: min-value (${r}) doesn't match first allowedValue (${h}). Using ${h}.`),this.hasAttribute("max-value")&&o!==c&&console.debug(`KnobElement: max-value (${o}) doesn't match last allowedValue (${c}). Using ${c}.`),this.hasAttribute("snap-thresholds")&&console.debug("KnobElement: allowedValues overrides snap-increment and snap-thresholds."),r=h,o=c}this.config={minValue:r,maxValue:o,defaultValue:e("default-value",0),minRotation:e("min-rotation",-150),maxRotation:e("max-rotation",150),snapIncrement:e("snap-increment",1),curve:e("curve",1),borderStyle:t("border-style","currentState"),allowedValues:s?[...s].sort((l,h)=>l-h):void 0,snapThresholds:n("snap-thresholds"),disabled:this.hasAttribute("disabled")},this.updateDimensions()}updateDimensions(){const e=this.getAttribute("width"),t=this.getAttribute("height");if(e||t){const n=e||t||"120";this.style.setProperty("--knob-size",`${n}px`)}}updateColorFromAttribute(){const e=this.getAttribute("color");e&&this.style.setProperty("--knob-stroke",e)}render(){this.innerHTML=`
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
  `,this.pathElement=this.querySelector(".knob-path")}cleanup(){this.dragHandlers&&(this.removeEventListener("mousedown",this.dragHandlers.start),this.removeEventListener("touchstart",this.dragHandlers.start),document.removeEventListener("mousemove",this.dragHandlers.move),document.removeEventListener("mouseup",this.dragHandlers.end),document.removeEventListener("touchmove",this.dragHandlers.move),document.removeEventListener("touchend",this.dragHandlers.end))}createUtilityFunctions(){const e=this.config.curve||1;this.rotationToValue=t=>{const n=me.mapRange(this.config.minRotation,this.config.maxRotation,0,1,t),s=Math.pow(n,e);return me.mapRange(0,1,this.config.minValue,this.config.maxValue,s)},this.valueToRotation=t=>{const n=me.mapRange(this.config.minValue,this.config.maxValue,0,1,t),s=Math.pow(n,1/e);return me.mapRange(0,1,this.config.minRotation,this.config.maxRotation,s)},this.applySnapping=t=>{if(this.config.allowedValues&&this.config.allowedValues.length>0)return this.config.allowedValues.reduce((s,r)=>Math.abs(r-t)<Math.abs(s-t)?r:s);if(this.config.snapIncrement<=0)return t;let n=this.config.snapIncrement;if(this.config.snapThresholds){for(const{maxValue:s,increment:r}of this.config.snapThresholds)if(t<s){n=r;break}}return Math.round(t/n)*n}}createDraggable(){const e="pointerLockElement"in document&&"requestPointerLock"in HTMLElement.prototype;let t=!1,n=0,s=0,r=0,o=!1;const l=d=>{n=d.clientY,o=document.pointerLockElement===this,!(!e||document.pointerLockElement)&&this.requestPointerLock().then(()=>{o=document.pointerLockElement===this},()=>{o=!1})},h=d=>{if(this.config.disabled)return;const m=Date.now(),A=m-this.lastClickTime;if(A<this.DOUBLE_CLICK_THRESHOLD&&A>0){this.resetToDefault();return}this.lastClickTime=m,t=!0,s=this.currentRotation,r=0,"touches"in d?(n=d.touches[0].clientY,o=!1):l(d)},c=d=>{if(!t)return;let m;const A=2;if(o&&document.pointerLockElement)r+=d.movementY,m=-r*A;else{const K="touches"in d?d.touches[0].clientY:d.clientY;m=(n-K)*A}const E=s+m,M=me.clamp(E,this.config.minRotation,this.config.maxRotation),S=this.rotationToValue(M),D=this.applySnapping(S);this.currentValue=D,D!==S?this.currentRotation=this.valueToRotation(D):this.currentRotation=M,this.updateBorder(),this.dispatchChangeEvent("user"),d.preventDefault()},f=()=>{t=!1,o&&document.pointerLockElement&&document.exitPointerLock(),o=!1};this.dragHandlers={start:h,move:c,end:f},this.addEventListener("mousedown",h),this.addEventListener("touchstart",h,{passive:!1}),document.addEventListener("mousemove",c),document.addEventListener("mouseup",f),document.addEventListener("touchmove",c,{passive:!1}),document.addEventListener("touchend",f)}updateBorder(){if(this.pathElement)if((this.getAttribute("border-style")||"currentState")==="currentState"){const e=(this.config.minRotation-90)*Math.PI/180,t=(this.currentRotation-90)*Math.PI/180,n=48*Math.cos(e)+50,s=48*Math.sin(e)+50,r=48*Math.cos(t)+50,o=48*Math.sin(t)+50,l=this.currentRotation-this.config.minRotation,h=Math.abs(l)>180?1:0,c=`M50,50 L${n},${s} A48,48,0,${h},1,${r},${o} Z`;this.pathElement.setAttribute("d",c)}else this.pathElement.setAttribute("d","M50,2 A48,48,0,1,1,49.9,2 Z")}dispatchChangeEvent(e="programmatic"){const t=me.mapRange(this.config.minValue,this.config.maxValue,0,100,this.currentValue),n=new CustomEvent("knob-change",{detail:{value:this.currentValue,rotation:this.currentRotation,percentage:t,source:e},bubbles:!0});this.dispatchEvent(n)}setValue(e){!this.valueToRotation||!this.pathElement||(this.currentValue=me.clamp(e,this.config.minValue,this.config.maxValue),this.currentRotation=this.valueToRotation(this.currentValue),this.updateBorder(),this.dispatchChangeEvent())}setValueNormalized(e){const{minRotation:t,maxRotation:n}=this.config,s=Math.max(0,Math.min(1,e)),r=t+s*(n-t),o=this.rotationToValue(r);this.setValue(o)}getValueNormalized(){return(this.currentRotation-this.config.minRotation)/(this.config.maxRotation-this.config.minRotation)}resetToDefault(){this.setValue(this.config.defaultValue)}getValue(){return this.currentValue}setCurve(e){this.config.curve=e,this.createUtilityFunctions(),this.setValue(this.currentValue)}getCurve(){return this.config.curve||1}setDisabled(e){e?this.setAttribute("disabled",""):this.removeAttribute("disabled")}isDisabled(){return this.hasAttribute("disabled")}getPercentage(){return me.mapRange(this.config.minValue,this.config.maxValue,0,100,this.currentValue)}get value(){return this.getValue()}set value(e){this.setValue(e)}get disabled(){return this.isDisabled()}set disabled(e){this.setDisabled(e)}};Te(ao,"stylesInjected",!1);let Nh=ao;const kh={KNOB:"knob-element"};function Dh(i,e){typeof customElements>"u"||customElements.get(i)||customElements.define(i,e)}function dc(){Dh(kh.KNOB,Nh)}const ga=Symbol("store-raw"),In=Symbol("store-node"),$e=Symbol("store-has"),ro=Symbol("store-self");function oo(i){let e=i[Bt];if(!e&&(Object.defineProperty(i,Bt,{value:e=new Proxy(i,Rh)}),!Array.isArray(i))){const t=Object.keys(i),n=Object.getOwnPropertyDescriptors(i);for(let s=0,r=t.length;s<r;s++){const o=t[s];n[o].get&&Object.defineProperty(i,o,{enumerable:n[o].enumerable,get:n[o].get.bind(e)})}}return e}function Ts(i){let e;return i!=null&&typeof i=="object"&&(i[Bt]||!(e=Object.getPrototypeOf(i))||e===Object.prototype||Array.isArray(i))}function Pi(i,e=new Set){let t,n,s,r;if(t=i!=null&&i[ga])return t;if(!Ts(i)||e.has(i))return i;if(Array.isArray(i)){Object.isFrozen(i)?i=i.slice(0):e.add(i);for(let o=0,l=i.length;o<l;o++)s=i[o],(n=Pi(s,e))!==s&&(i[o]=n)}else{Object.isFrozen(i)?i=Object.assign({},i):e.add(i);const o=Object.keys(i),l=Object.getOwnPropertyDescriptors(i);for(let h=0,c=o.length;h<c;h++)r=o[h],!l[r].get&&(s=i[r],(n=Pi(s,e))!==s&&(i[r]=n))}return i}function Ns(i,e){let t=i[e];return t||Object.defineProperty(i,e,{value:t=Object.create(null)}),t}function Ti(i,e,t){if(i[e])return i[e];const[n,s]=lr(t,{equals:!1,internal:!0});return n.$=s,i[e]=n}function Ch(i,e){const t=Reflect.getOwnPropertyDescriptor(i,e);return!t||t.get||!t.configurable||e===Bt||e===In||(delete t.value,delete t.writable,t.get=()=>i[Bt][e]),t}function lo(i){js()&&Ti(Ns(i,In),ro)()}function Ih(i){return lo(i),Reflect.ownKeys(i)}const Rh={get(i,e,t){if(e===ga)return i;if(e===Bt)return t;if(e===Hs)return lo(i),t;const n=Ns(i,In),s=n[e];let r=s?s():i[e];if(e===In||e===$e||e==="__proto__")return r;if(!s){const o=Object.getOwnPropertyDescriptor(i,e);js()&&(typeof r!="function"||i.hasOwnProperty(e))&&!(o&&o.get)&&(r=Ti(n,e,r)())}return Ts(r)?oo(r):r},has(i,e){return e===ga||e===Bt||e===Hs||e===In||e===$e||e==="__proto__"?!0:(js()&&Ti(Ns(i,$e),e)(),e in i)},set(){return!0},deleteProperty(){return!0},ownKeys:Ih,getOwnPropertyDescriptor:Ch};function ks(i,e,t,n=!1){if(!n&&i[e]===t)return;const s=i[e],r=i.length;t===void 0?(delete i[e],i[$e]&&i[$e][e]&&s!==void 0&&i[$e][e].$()):(i[e]=t,i[$e]&&i[$e][e]&&s===void 0&&i[$e][e].$());let o=Ns(i,In),l;if((l=Ti(o,e,s))&&l.$(()=>t),Array.isArray(i)&&i.length!==r){for(let h=i.length;h<r;h++)(l=o[h])&&l.$();(l=Ti(o,"length",r))&&l.$(i.length)}(l=o[ro])&&l.$()}function ho(i,e){const t=Object.keys(e);for(let n=0;n<t.length;n+=1){const s=t[n];ks(i,s,e[s])}}function xh(i,e){if(typeof e=="function"&&(e=e(i)),e=Pi(e),Array.isArray(e)){if(i===e)return;let t=0,n=e.length;for(;t<n;t++){const s=e[t];i[t]!==s&&ks(i,t,s)}ks(i,"length",n)}else ho(i,e)}function ui(i,e,t=[]){let n,s=i;if(e.length>1){n=e.shift();const o=typeof n,l=Array.isArray(i);if(Array.isArray(n)){for(let h=0;h<n.length;h++)ui(i,[n[h]].concat(e),t);return}else if(l&&o==="function"){for(let h=0;h<i.length;h++)n(i[h],h)&&ui(i,[h].concat(e),t);return}else if(l&&o==="object"){const{from:h=0,to:c=i.length-1,by:f=1}=n;for(let d=h;d<=c;d+=f)ui(i,[d].concat(e),t);return}else if(e.length>1){ui(i[n],e,[n].concat(t));return}s=i[n],t=[n].concat(t)}let r=e[0];typeof r=="function"&&(r=r(s,t),r===s)||n===void 0&&r==null||(r=Pi(r),n===void 0||Ts(s)&&Ts(r)&&!Array.isArray(r)?ho(s,r):ks(i,n,r))}function pc(...[i,e]){const t=Pi(i||{}),n=Array.isArray(t),s=oo(t);function r(...o){Ao(()=>{n&&o.length===1?xh(t,o[0]):ui(t,o)})}return[s,r]}class Oe{constructor(e=!1){this.eventMap={},this.eventsSuspended=e==!0}addListener(e,t,n={}){if(typeof e=="string"&&e.length<1||e instanceof String&&e.length<1||typeof e!="string"&&!(e instanceof String)&&e!==Oe.ANY_EVENT)throw new TypeError("The 'event' parameter must be a string or EventEmitter.ANY_EVENT.");if(typeof t!="function")throw new TypeError("The callback must be a function.");const s=new $a(e,this,t,n);return this.eventMap[e]||(this.eventMap[e]=[]),n.prepend?this.eventMap[e].unshift(s):this.eventMap[e].push(s),s}addOneTimeListener(e,t,n={}){n.remaining=1,this.addListener(e,t,n)}static get ANY_EVENT(){return Symbol.for("Any event")}hasListener(e,t){return e===void 0?this.eventMap[Oe.ANY_EVENT]&&this.eventMap[Oe.ANY_EVENT].length>0?!0:Object.entries(this.eventMap).some(([,n])=>n.length>0):this.eventMap[e]&&this.eventMap[e].length>0?t instanceof $a?this.eventMap[e].filter(s=>s===t).length>0:typeof t=="function"?this.eventMap[e].filter(s=>s.callback===t).length>0:t==null:!1}get eventNames(){return Object.keys(this.eventMap)}getListeners(e){return this.eventMap[e]||[]}suspendEvent(e){this.getListeners(e).forEach(t=>{t.suspended=!0})}unsuspendEvent(e){this.getListeners(e).forEach(t=>{t.suspended=!1})}getListenerCount(e){return this.getListeners(e).length}emit(e,...t){if(typeof e!="string"&&!(e instanceof String))throw new TypeError("The 'event' parameter must be a string.");if(this.eventsSuspended)return;let n=[],s=this.eventMap[Oe.ANY_EVENT]||[];return this.eventMap[e]&&(s=s.concat(this.eventMap[e])),s.forEach(r=>{if(r.suspended)return;let o=[...t];Array.isArray(r.arguments)&&(o=o.concat(r.arguments)),r.remaining>0&&(n.push(r.callback.apply(r.context,o)),r.count++),--r.remaining<1&&r.remove()}),n}removeListener(e,t,n={}){if(e===void 0){this.eventMap={};return}else if(!this.eventMap[e])return;let s=this.eventMap[e].filter(r=>t&&r.callback!==t||n.remaining&&n.remaining!==r.remaining||n.context&&n.context!==r.context);s.length?this.eventMap[e]=s:delete this.eventMap[e]}async waitFor(e,t={}){return t.duration=parseInt(t.duration),(isNaN(t.duration)||t.duration<=0)&&(t.duration=1/0),new Promise((n,s)=>{let r,o=this.addListener(e,()=>{clearTimeout(r),n()},{remaining:1});t.duration!==1/0&&(r=setTimeout(()=>{o.remove(),s("The duration expired before the event was emitted.")},t.duration))})}get eventCount(){return Object.keys(this.eventMap).length}}class $a{constructor(e,t,n,s={}){if(typeof e!="string"&&!(e instanceof String)&&e!==Oe.ANY_EVENT)throw new TypeError("The 'event' parameter must be a string or EventEmitter.ANY_EVENT.");if(!t)throw new ReferenceError("The 'target' parameter is mandatory.");if(typeof n!="function")throw new TypeError("The 'callback' must be a function.");s.arguments!==void 0&&!Array.isArray(s.arguments)&&(s.arguments=[s.arguments]),s=Object.assign({context:t,remaining:1/0,arguments:void 0,duration:1/0},s),s.duration!==1/0&&setTimeout(()=>this.remove(),s.duration),this.arguments=s.arguments,this.callback=n,this.context=s.context,this.count=0,this.event=e,this.remaining=parseInt(s.remaining)>=1?parseInt(s.remaining):1/0,this.suspended=!1,this.target=t}remove(){this.target.removeListener(this.event,this.callback,{context:this.context,remaining:this.remaining})}}/**
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
 */class kn{constructor(e,t={}){this.duration=w.defaults.note.duration,this.attack=w.defaults.note.attack,this.release=w.defaults.note.release,t.duration!=null&&(this.duration=t.duration),t.attack!=null&&(this.attack=t.attack),t.rawAttack!=null&&(this.attack=v.from7bitToFloat(t.rawAttack)),t.release!=null&&(this.release=t.release),t.rawRelease!=null&&(this.release=v.from7bitToFloat(t.rawRelease)),Number.isInteger(e)?this.identifier=v.toNoteIdentifier(e):this.identifier=e}get identifier(){return this._name+(this._accidental||"")+this._octave}set identifier(e){const t=v.getNoteDetails(e);if(w.validation&&!e)throw new Error("Invalid note identifier");this._name=t.name,this._accidental=t.accidental,this._octave=t.octave}get name(){return this._name}set name(e){if(w.validation&&(e=e.toUpperCase(),!["C","D","E","F","G","A","B"].includes(e)))throw new Error("Invalid name value");this._name=e}get accidental(){return this._accidental}set accidental(e){if(w.validation&&(e=e.toLowerCase(),!["#","##","b","bb"].includes(e)))throw new Error("Invalid accidental value");this._accidental=e}get octave(){return this._octave}set octave(e){if(w.validation&&(e=parseInt(e),isNaN(e)))throw new Error("Invalid octave value");this._octave=e}get duration(){return this._duration}set duration(e){if(w.validation&&(e=parseFloat(e),isNaN(e)||e===null||e<0))throw new RangeError("Invalid duration value.");this._duration=e}get attack(){return this._attack}set attack(e){if(w.validation&&(e=parseFloat(e),isNaN(e)||!(e>=0&&e<=1)))throw new RangeError("Invalid attack value.");this._attack=e}get release(){return this._release}set release(e){if(w.validation&&(e=parseFloat(e),isNaN(e)||!(e>=0&&e<=1)))throw new RangeError("Invalid release value.");this._release=e}get rawAttack(){return v.fromFloatTo7Bit(this._attack)}set rawAttack(e){this._attack=v.from7bitToFloat(e)}get rawRelease(){return v.fromFloatTo7Bit(this._release)}set rawRelease(e){this._release=v.from7bitToFloat(e)}get number(){return v.toNoteNumber(this.identifier)}getOffsetNumber(e=0,t=0){return w.validation&&(e=parseInt(e)||0,t=parseInt(t)||0),Math.min(Math.max(this.number+e*12+t,0),127)}}/**
 * The `Utilities` class contains general-purpose utility methods. All methods are static and
 * should be called using the class name. For example: `Utilities.getNoteDetails("C4")`.
 *
 * @license Apache-2.0
 * @since 3.0.0
 */class v{static toNoteNumber(e,t=0){if(t=t==null?0:parseInt(t),isNaN(t))throw new RangeError("Invalid 'octaveOffset' value");typeof e!="string"&&(e="");const n=this.getNoteDetails(e);if(!n)throw new TypeError("Invalid note identifier");const s={C:0,D:2,E:4,F:5,G:7,A:9,B:11};let r=(n.octave+1+t)*12;if(r+=s[n.name],n.accidental&&(n.accidental.startsWith("b")?r-=n.accidental.length:r+=n.accidental.length),r<0||r>127)throw new RangeError("Invalid octaveOffset value");return r}static getNoteDetails(e){Number.isInteger(e)&&(e=this.toNoteIdentifier(e));const t=e.match(/^([CDEFGAB])(#{0,2}|b{0,2})(-?\d+)$/i);if(!t)throw new TypeError("Invalid note identifier");const n=t[1].toUpperCase(),s=parseInt(t[3]);let r=t[2].toLowerCase();return r=r===""?void 0:r,{accidental:r,identifier:n+(r||"")+s,name:n,octave:s}}static sanitizeChannels(e){let t;if(w.validation){if(e==="all")t=["all"];else if(e==="none")return[]}return Array.isArray(e)?t=e:t=[e],t.indexOf("all")>-1&&(t=g.MIDI_CHANNEL_NUMBERS),t.map(function(n){return parseInt(n)}).filter(function(n){return n>=1&&n<=16})}static toTimestamp(e){let t=!1;const n=parseFloat(e);return isNaN(n)?!1:(typeof e=="string"&&e.substring(0,1)==="+"?n>=0&&(t=w.time+n):n>=0&&(t=n),t)}static guessNoteNumber(e,t){t=parseInt(t)||0;let n=!1;if(Number.isInteger(e)&&e>=0&&e<=127)n=parseInt(e);else if(parseInt(e)>=0&&parseInt(e)<=127)n=parseInt(e);else if(typeof e=="string"||e instanceof String)try{n=this.toNoteNumber(e.trim(),t)}catch{return!1}return n}static toNoteIdentifier(e,t){if(e=parseInt(e),isNaN(e)||e<0||e>127)throw new RangeError("Invalid note number");if(t=t==null?0:parseInt(t),isNaN(t))throw new RangeError("Invalid octaveOffset value");const n=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],s=Math.floor(e/12-1)+t;return n[e%12]+s.toString()}static buildNote(e,t={}){if(t.octaveOffset=parseInt(t.octaveOffset)||0,e instanceof kn)return e;let n=this.guessNoteNumber(e,t.octaveOffset);if(n===!1)throw new TypeError(`The input could not be parsed as a note (${e})`);return t.octaveOffset=void 0,new kn(n,t)}static buildNoteArray(e,t={}){let n=[];return Array.isArray(e)||(e=[e]),e.forEach(s=>{n.push(this.buildNote(s,t))}),n}static from7bitToFloat(e){return e===1/0&&(e=127),e=parseInt(e)||0,Math.min(Math.max(e/127,0),1)}static fromFloatTo7Bit(e){return e===1/0&&(e=1),e=parseFloat(e)||0,Math.min(Math.max(Math.round(e*127),0),127)}static fromMsbLsbToFloat(e,t=0){w.validation&&(e=Math.min(Math.max(parseInt(e)||0,0),127),t=Math.min(Math.max(parseInt(t)||0,0),127));const n=((e<<7)+t)/16383;return Math.min(Math.max(n,0),1)}static fromFloatToMsbLsb(e){w.validation&&(e=Math.min(Math.max(parseFloat(e)||0,0),1));const t=Math.round(e*16383);return{msb:t>>7,lsb:t&127}}static offsetNumber(e,t=0,n=0){if(w.validation){if(e=parseInt(e),isNaN(e))throw new Error("Invalid note number");t=parseInt(t)||0,n=parseInt(n)||0}return Math.min(Math.max(e+t*12+n,0),127)}static getPropertyByValue(e,t){return Object.keys(e).find(n=>e[n]===t)}static getCcNameByNumber(e){if(!(w.validation&&(e=parseInt(e),!(e>=0&&e<=127))))return g.CONTROL_CHANGE_MESSAGES[e].name}static getCcNumberByName(e){let t=g.CONTROL_CHANGE_MESSAGES.find(n=>n.name===e);return t?t.number:g.MIDI_CONTROL_CHANGE_MESSAGES[e]}static getChannelModeByNumber(e){if(!(e>=120&&e<=127))return!1;for(let t in g.CHANNEL_MODE_MESSAGES)if(g.CHANNEL_MODE_MESSAGES.hasOwnProperty(t)&&e===g.CHANNEL_MODE_MESSAGES[t])return t;return!1}static get isNode(){return typeof process<"u"&&process.versions!=null&&process.versions.node!=null}static get isBrowser(){return typeof window<"u"&&typeof window.document<"u"}}/**
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
 */class Oh extends Oe{constructor(e,t){super(),this._output=e,this._number=t,this._octaveOffset=0}destroy(){this._output=null,this._number=null,this._octaveOffset=0,this.removeListener()}send(e,t={time:0}){return this.output.send(e,t),this}sendKeyAftertouch(e,t,n={}){if(w.validation){if(n.useRawValue&&(n.rawValue=n.useRawValue),isNaN(parseFloat(t)))throw new RangeError("Invalid key aftertouch value.");if(n.rawValue){if(!(t>=0&&t<=127&&Number.isInteger(t)))throw new RangeError("Key aftertouch raw value must be an integer between 0 and 127.")}else if(!(t>=0&&t<=1))throw new RangeError("Key aftertouch value must be a float between 0 and 1.")}n.rawValue||(t=v.fromFloatTo7Bit(t));const s=w.octaveOffset+this.output.octaveOffset+this.octaveOffset;return Array.isArray(e)||(e=[e]),v.buildNoteArray(e).forEach(r=>{this.send([(g.CHANNEL_MESSAGES.keyaftertouch<<4)+(this.number-1),r.getOffsetNumber(s),t],{time:v.toTimestamp(n.time)})}),this}sendControlChange(e,t,n={}){if(typeof e=="string"&&(e=v.getCcNumberByName(e)),Array.isArray(t)||(t=[t]),w.validation){if(e===void 0)throw new TypeError("Control change must be identified with a valid name or an integer between 0 and 127.");if(!Number.isInteger(e)||!(e>=0&&e<=127))throw new TypeError("Control change number must be an integer between 0 and 127.");if(t=t.map(s=>{const r=Math.min(Math.max(parseInt(s),0),127);if(isNaN(r))throw new TypeError("Values must be integers between 0 and 127");return r}),t.length===2&&e>=32)throw new TypeError("To use a value array, the controller must be between 0 and 31")}return t.forEach((s,r)=>{this.send([(g.CHANNEL_MESSAGES.controlchange<<4)+(this.number-1),e+r*32,t[r]],{time:v.toTimestamp(n.time)})}),this}_selectNonRegisteredParameter(e,t={}){return this.sendControlChange(99,e[0],t),this.sendControlChange(98,e[1],t),this}_deselectRegisteredParameter(e={}){return this.sendControlChange(101,127,e),this.sendControlChange(100,127,e),this}_deselectNonRegisteredParameter(e={}){return this.sendControlChange(101,127,e),this.sendControlChange(100,127,e),this}_selectRegisteredParameter(e,t={}){return this.sendControlChange(101,e[0],t),this.sendControlChange(100,e[1],t),this}_setCurrentParameter(e,t={}){return e=[].concat(e),this.sendControlChange(6,e[0],t),e.length<2?this:(this.sendControlChange(38,e[1],t),this)}sendRpnDecrement(e,t={}){if(Array.isArray(e)||(e=g.REGISTERED_PARAMETERS[e]),w.validation){if(e===void 0)throw new TypeError("The specified registered parameter is invalid.");let n=!1;if(Object.getOwnPropertyNames(g.REGISTERED_PARAMETERS).forEach(s=>{g.REGISTERED_PARAMETERS[s][0]===e[0]&&g.REGISTERED_PARAMETERS[s][1]===e[1]&&(n=!0)}),!n)throw new TypeError("The specified registered parameter is invalid.")}return this._selectRegisteredParameter(e,t),this.sendControlChange(97,0,t),this._deselectRegisteredParameter(t),this}sendRpnIncrement(e,t={}){if(Array.isArray(e)||(e=g.REGISTERED_PARAMETERS[e]),w.validation){if(e===void 0)throw new TypeError("The specified registered parameter is invalid.");let n=!1;if(Object.getOwnPropertyNames(g.REGISTERED_PARAMETERS).forEach(s=>{g.REGISTERED_PARAMETERS[s][0]===e[0]&&g.REGISTERED_PARAMETERS[s][1]===e[1]&&(n=!0)}),!n)throw new TypeError("The specified registered parameter is invalid.")}return this._selectRegisteredParameter(e,t),this.sendControlChange(96,0,t),this._deselectRegisteredParameter(t),this}playNote(e,t={}){this.sendNoteOn(e,t);const n=Array.isArray(e)?e:[e];for(let s of n)if(parseInt(s.duration)>0){const r={time:(v.toTimestamp(t.time)||w.time)+parseInt(s.duration),release:s.release,rawRelease:s.rawRelease};this.sendNoteOff(s,r)}else if(parseInt(t.duration)>0){const r={time:(v.toTimestamp(t.time)||w.time)+parseInt(t.duration),release:t.release,rawRelease:t.rawRelease};this.sendNoteOff(s,r)}return this}sendNoteOff(e,t={}){if(w.validation){if(t.rawRelease!=null&&!(t.rawRelease>=0&&t.rawRelease<=127))throw new RangeError("The 'rawRelease' option must be an integer between 0 and 127");if(t.release!=null&&!(t.release>=0&&t.release<=1))throw new RangeError("The 'release' option must be an number between 0 and 1");t.rawVelocity&&(t.rawRelease=t.velocity,console.warn("The 'rawVelocity' option is deprecated. Use 'rawRelease' instead.")),t.velocity&&(t.release=t.velocity,console.warn("The 'velocity' option is deprecated. Use 'attack' instead."))}let n=64;t.rawRelease!=null?n=t.rawRelease:isNaN(t.release)||(n=Math.round(t.release*127));const s=w.octaveOffset+this.output.octaveOffset+this.octaveOffset;return v.buildNoteArray(e,{rawRelease:parseInt(n)}).forEach(r=>{this.send([(g.CHANNEL_MESSAGES.noteoff<<4)+(this.number-1),r.getOffsetNumber(s),r.rawRelease],{time:v.toTimestamp(t.time)})}),this}stopNote(e,t={}){return this.sendNoteOff(e,t)}sendNoteOn(e,t={}){if(w.validation){if(t.rawAttack!=null&&!(t.rawAttack>=0&&t.rawAttack<=127))throw new RangeError("The 'rawAttack' option must be an integer between 0 and 127");if(t.attack!=null&&!(t.attack>=0&&t.attack<=1))throw new RangeError("The 'attack' option must be an number between 0 and 1");t.rawVelocity&&(t.rawAttack=t.velocity,t.rawRelease=t.release,console.warn("The 'rawVelocity' option is deprecated. Use 'rawAttack' or 'rawRelease'.")),t.velocity&&(t.attack=t.velocity,console.warn("The 'velocity' option is deprecated. Use 'attack' instead."))}let n=64;t.rawAttack!=null?n=t.rawAttack:isNaN(t.attack)||(n=Math.round(t.attack*127));const s=w.octaveOffset+this.output.octaveOffset+this.octaveOffset;return v.buildNoteArray(e,{rawAttack:n}).forEach(r=>{this.send([(g.CHANNEL_MESSAGES.noteon<<4)+(this.number-1),r.getOffsetNumber(s),r.rawAttack],{time:v.toTimestamp(t.time)})}),this}sendChannelMode(e,t=0,n={}){if(typeof e=="string"&&(e=g.CHANNEL_MODE_MESSAGES[e]),w.validation){if(e===void 0)throw new TypeError("Invalid channel mode message name or number.");if(isNaN(e)||!(e>=120&&e<=127))throw new TypeError("Invalid channel mode message number.");if(isNaN(parseInt(t))||t<0||t>127)throw new RangeError("Value must be an integer between 0 and 127.")}return this.send([(g.CHANNEL_MESSAGES.controlchange<<4)+(this.number-1),e,t],{time:v.toTimestamp(n.time)}),this}sendOmniMode(e,t={}){return e===void 0||e?this.sendChannelMode("omnimodeon",0,t):this.sendChannelMode("omnimodeoff",0,t),this}sendChannelAftertouch(e,t={}){if(w.validation){if(isNaN(parseFloat(e)))throw new RangeError("Invalid channel aftertouch value.");if(t.rawValue){if(!(e>=0&&e<=127&&Number.isInteger(e)))throw new RangeError("Channel aftertouch raw value must be an integer between 0 and 127.")}else if(!(e>=0&&e<=1))throw new RangeError("Channel aftertouch value must be a float between 0 and 1.")}return t.rawValue||(e=v.fromFloatTo7Bit(e)),this.send([(g.CHANNEL_MESSAGES.channelaftertouch<<4)+(this.number-1),Math.round(e)],{time:v.toTimestamp(t.time)}),this}sendMasterTuning(e,t={}){if(e=parseFloat(e)||0,w.validation&&!(e>-65&&e<64))throw new RangeError("The value must be a decimal number larger than -65 and smaller than 64.");let n=Math.floor(e)+64,s=e-Math.floor(e);s=Math.round((s+1)/2*16383);let r=s>>7&127,o=s&127;return this.sendRpnValue("channelcoarsetuning",n,t),this.sendRpnValue("channelfinetuning",[r,o],t),this}sendModulationRange(e,t,n={}){if(w.validation){if(!Number.isInteger(e)||!(e>=0&&e<=127))throw new RangeError("The semitones value must be an integer between 0 and 127.");if(t!=null&&(!Number.isInteger(t)||!(t>=0&&t<=127)))throw new RangeError("If specified, the cents value must be an integer between 0 and 127.")}return t>=0&&t<=127||(t=0),this.sendRpnValue("modulationrange",[e,t],n),this}sendNrpnValue(e,t,n={}){if(t=[].concat(t),w.validation){if(!Array.isArray(e)||!Number.isInteger(e[0])||!Number.isInteger(e[1]))throw new TypeError("The specified NRPN is invalid.");if(!(e[0]>=0&&e[0]<=127))throw new RangeError("The first byte of the NRPN must be between 0 and 127.");if(!(e[1]>=0&&e[1]<=127))throw new RangeError("The second byte of the NRPN must be between 0 and 127.");t.forEach(s=>{if(!(s>=0&&s<=127))throw new RangeError("The data bytes of the NRPN must be between 0 and 127.")})}return this._selectNonRegisteredParameter(e,n),this._setCurrentParameter(t,n),this._deselectNonRegisteredParameter(n),this}sendPitchBend(e,t={}){if(w.validation)if(t.rawValue&&Array.isArray(e)){if(!(e[0]>=0&&e[0]<=127))throw new RangeError("The pitch bend MSB must be an integer between 0 and 127.");if(!(e[1]>=0&&e[1]<=127))throw new RangeError("The pitch bend LSB must be an integer between 0 and 127.")}else if(t.rawValue&&!Array.isArray(e)){if(!(e>=0&&e<=127))throw new RangeError("The pitch bend MSB must be an integer between 0 and 127.")}else{if(isNaN(e)||e===null)throw new RangeError("Invalid pitch bend value.");if(!(e>=-1&&e<=1))throw new RangeError("The pitch bend value must be a float between -1 and 1.")}let n=0,s=0;if(t.rawValue&&Array.isArray(e))n=e[0],s=e[1];else if(t.rawValue&&!Array.isArray(e))n=e;else{const r=v.fromFloatToMsbLsb((e+1)/2);n=r.msb,s=r.lsb}return this.send([(g.CHANNEL_MESSAGES.pitchbend<<4)+(this.number-1),s,n],{time:v.toTimestamp(t.time)}),this}sendPitchBendRange(e,t,n={}){if(w.validation){if(!Number.isInteger(e)||!(e>=0&&e<=127))throw new RangeError("The semitones value must be an integer between 0 and 127.");if(!Number.isInteger(t)||!(t>=0&&t<=127))throw new RangeError("The cents value must be an integer between 0 and 127.")}return this.sendRpnValue("pitchbendrange",[e,t],n),this}sendProgramChange(e,t={}){if(e=parseInt(e)||0,w.validation&&!(e>=0&&e<=127))throw new RangeError("The program number must be between 0 and 127.");return this.send([(g.CHANNEL_MESSAGES.programchange<<4)+(this.number-1),e],{time:v.toTimestamp(t.time)}),this}sendRpnValue(e,t,n={}){if(Array.isArray(e)||(e=g.REGISTERED_PARAMETERS[e]),w.validation){if(!Number.isInteger(e[0])||!Number.isInteger(e[1]))throw new TypeError("The specified NRPN is invalid.");if(!(e[0]>=0&&e[0]<=127))throw new RangeError("The first byte of the RPN must be between 0 and 127.");if(!(e[1]>=0&&e[1]<=127))throw new RangeError("The second byte of the RPN must be between 0 and 127.");[].concat(t).forEach(s=>{if(!(s>=0&&s<=127))throw new RangeError("The data bytes of the RPN must be between 0 and 127.")})}return this._selectRegisteredParameter(e,n),this._setCurrentParameter(t,n),this._deselectRegisteredParameter(n),this}sendTuningBank(e,t={}){if(w.validation&&(!Number.isInteger(e)||!(e>=0&&e<=127)))throw new RangeError("The tuning bank number must be between 0 and 127.");return this.sendRpnValue("tuningbank",e,t),this}sendTuningProgram(e,t={}){if(w.validation&&(!Number.isInteger(e)||!(e>=0&&e<=127)))throw new RangeError("The tuning program number must be between 0 and 127.");return this.sendRpnValue("tuningprogram",e,t),this}sendLocalControl(e,t={}){return e?this.sendChannelMode("localcontrol",127,t):this.sendChannelMode("localcontrol",0,t)}sendAllNotesOff(e={}){return this.sendChannelMode("allnotesoff",0,e)}sendAllSoundOff(e={}){return this.sendChannelMode("allsoundoff",0,e)}sendResetAllControllers(e={}){return this.sendChannelMode("resetallcontrollers",0,e)}sendPolyphonicMode(e,t={}){return e==="mono"?this.sendChannelMode("monomodeon",0,t):this.sendChannelMode("polymodeon",0,t)}get octaveOffset(){return this._octaveOffset}set octaveOffset(e){if(this.validation&&(e=parseInt(e),isNaN(e)))throw new TypeError("The 'octaveOffset' property must be an integer.");this._octaveOffset=e}get output(){return this._output}get number(){return this._number}}/**
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
 */class ya extends Oe{constructor(e){super(),this._midiOutput=e,this._octaveOffset=0,this.channels=[];for(let t=1;t<=16;t++)this.channels[t]=new Oh(this,t);this._midiOutput.onstatechange=this._onStateChange.bind(this)}async destroy(){this.removeListener(),this.channels.forEach(e=>e.destroy()),this.channels=[],this._midiOutput&&(this._midiOutput.onstatechange=null),await this.close(),this._midiOutput=null}_onStateChange(e){let t={timestamp:w.time};e.port.connection==="open"?(t.type="opened",t.target=this,t.port=t.target,this.emit("opened",t)):e.port.connection==="closed"&&e.port.state==="connected"?(t.type="closed",t.target=this,t.port=t.target,this.emit("closed",t)):e.port.connection==="closed"&&e.port.state==="disconnected"?(t.type="disconnected",t.port={connection:e.port.connection,id:e.port.id,manufacturer:e.port.manufacturer,name:e.port.name,state:e.port.state,type:e.port.type},this.emit("disconnected",t)):e.port.connection==="pending"&&e.port.state==="disconnected"||console.warn("This statechange event was not caught:",e.port.connection,e.port.state)}async open(){try{return await this._midiOutput.open(),Promise.resolve(this)}catch(e){return Promise.reject(e)}}async close(){this._midiOutput?await this._midiOutput.close():await Promise.resolve()}send(e,t={time:0},n=0){if(e instanceof co&&(e=v.isNode?e.data:e.rawData),e instanceof Uint8Array&&v.isNode&&(e=Array.from(e)),w.validation){if(!Array.isArray(e)&&!(e instanceof Uint8Array)&&(e=[e],Array.isArray(t)&&(e=e.concat(t)),t=isNaN(n)?{time:0}:{time:n}),!(parseInt(e[0])>=128&&parseInt(e[0])<=255))throw new RangeError("The first byte (status) must be an integer between 128 and 255.");e.slice(1).forEach(s=>{if(s=parseInt(s),!(s>=0&&s<=255))throw new RangeError("Data bytes must be integers between 0 and 255.")}),t||(t={time:0})}return this._midiOutput.send(e,v.toTimestamp(t.time)),this}sendSysex(e,t=[],n={}){if(e=[].concat(e),t instanceof Uint8Array){const s=new Uint8Array(1+e.length+t.length+1);s[0]=g.SYSTEM_MESSAGES.sysex,s.set(Uint8Array.from(e),1),s.set(t,1+e.length),s[s.length-1]=g.SYSTEM_MESSAGES.sysexend,this.send(s,{time:n.time})}else{const s=e.concat(t,g.SYSTEM_MESSAGES.sysexend);this.send([g.SYSTEM_MESSAGES.sysex].concat(s),{time:n.time})}return this}clear(){return this._midiOutput.clear?this._midiOutput.clear():w.validation&&console.warn("The 'clear()' method has not yet been implemented in your environment."),this}sendTimecodeQuarterFrame(e,t={}){if(w.validation&&(e=parseInt(e),isNaN(e)||!(e>=0&&e<=127)))throw new RangeError("The value must be an integer between 0 and 127.");return this.send([g.SYSTEM_MESSAGES.timecode,e],{time:t.time}),this}sendSongPosition(e=0,t={}){e=Math.floor(e)||0;var n=e>>7&127,s=e&127;return this.send([g.SYSTEM_MESSAGES.songposition,n,s],{time:t.time}),this}sendSongSelect(e=0,t={}){if(w.validation&&(e=parseInt(e),isNaN(e)||!(e>=0&&e<=127)))throw new RangeError("The program value must be between 0 and 127");return this.send([g.SYSTEM_MESSAGES.songselect,e],{time:t.time}),this}sendTuneRequest(e={}){return this.send([g.SYSTEM_MESSAGES.tunerequest],{time:e.time}),this}sendClock(e={}){return this.send([g.SYSTEM_MESSAGES.clock],{time:e.time}),this}sendStart(e={}){return this.send([g.SYSTEM_MESSAGES.start],{time:e.time}),this}sendContinue(e={}){return this.send([g.SYSTEM_MESSAGES.continue],{time:e.time}),this}sendStop(e={}){return this.send([g.SYSTEM_MESSAGES.stop],{time:e.time}),this}sendActiveSensing(e={}){return this.send([g.SYSTEM_MESSAGES.activesensing],{time:e.time}),this}sendReset(e={}){return this.send([g.SYSTEM_MESSAGES.reset],{time:e.time}),this}sendTuningRequest(e={}){return w.validation&&console.warn("The sendTuningRequest() method has been deprecated. Use sendTuningRequest() instead."),this.sendTuneRequest(e)}sendKeyAftertouch(e,t,n={}){return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].sendKeyAftertouch(e,t,n)}),this}sendControlChange(e,t,n={},s={}){if(w.validation&&(Array.isArray(n)||Number.isInteger(n)||n==="all")){const r=n;n=s,n.channels=r,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)}return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(n.channels).forEach(r=>{this.channels[r].sendControlChange(e,t,n)}),this}sendPitchBendRange(e=0,t=0,n={}){return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].sendPitchBendRange(e,t,n)}),this}setPitchBendRange(e=0,t=0,n="all",s={}){return w.validation&&(console.warn("The setPitchBendRange() method is deprecated. Use sendPitchBendRange() instead."),s.channels=n,s.channels==="all"&&(s.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendPitchBendRange(e,t,s)}sendRpnValue(e,t,n={}){return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].sendRpnValue(e,t,n)}),this}setRegisteredParameter(e,t=[],n="all",s={}){return w.validation&&(console.warn("The setRegisteredParameter() method is deprecated. Use sendRpnValue() instead."),s.channels=n,s.channels==="all"&&(s.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendRpnValue(e,t,s)}sendChannelAftertouch(e,t={},n={}){if(w.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendChannelAftertouch(e,t)}),this}sendPitchBend(e,t={},n={}){if(w.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendPitchBend(e,t)}),this}sendProgramChange(e=0,t={},n={}){if(w.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendProgramChange(e,t)}),this}sendModulationRange(e,t,n={}){return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].sendModulationRange(e,t,n)}),this}setModulationRange(e=0,t=0,n="all",s={}){return w.validation&&(console.warn("The setModulationRange() method is deprecated. Use sendModulationRange() instead."),s.channels=n,s.channels==="all"&&(s.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendModulationRange(e,t,s)}sendMasterTuning(e,t={}){return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(n=>{this.channels[n].sendMasterTuning(e,t)}),this}setMasterTuning(e,t={},n={}){return w.validation&&(console.warn("The setMasterTuning() method is deprecated. Use sendMasterTuning() instead."),n.channels=t,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendMasterTuning(e,n)}sendTuningProgram(e,t={}){return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(n=>{this.channels[n].sendTuningProgram(e,t)}),this}setTuningProgram(e,t="all",n={}){return w.validation&&(console.warn("The setTuningProgram() method is deprecated. Use sendTuningProgram() instead."),n.channels=t,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendTuningProgram(e,n)}sendTuningBank(e=0,t={}){return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(n=>{this.channels[n].sendTuningBank(e,t)}),this}setTuningBank(e,t="all",n={}){return w.validation&&(console.warn("The setTuningBank() method is deprecated. Use sendTuningBank() instead."),n.channels=t,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendTuningBank(e,n)}sendChannelMode(e,t=0,n={},s={}){if(w.validation&&(Array.isArray(n)||Number.isInteger(n)||n==="all")){const r=n;n=s,n.channels=r,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)}return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(n.channels).forEach(r=>{this.channels[r].sendChannelMode(e,t,n)}),this}sendAllSoundOff(e={}){return e.channels==null&&(e.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(e.channels).forEach(t=>{this.channels[t].sendAllSoundOff(e)}),this}sendAllNotesOff(e={}){return e.channels==null&&(e.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(e.channels).forEach(t=>{this.channels[t].sendAllNotesOff(e)}),this}sendResetAllControllers(e={},t={}){if(w.validation&&(Array.isArray(e)||Number.isInteger(e)||e==="all")){const n=e;e=t,e.channels=n,e.channels==="all"&&(e.channels=g.MIDI_CHANNEL_NUMBERS)}return e.channels==null&&(e.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(e.channels).forEach(n=>{this.channels[n].sendResetAllControllers(e)}),this}sendPolyphonicMode(e,t={},n={}){if(w.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendPolyphonicMode(e,t)}),this}sendLocalControl(e,t={},n={}){if(w.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendLocalControl(e,t)}),this}sendOmniMode(e,t={},n={}){if(w.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendOmniMode(e,t)}),this}sendNrpnValue(e,t,n={}){return n.channels==null&&(n.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].sendNrpnValue(e,t,n)}),this}setNonRegisteredParameter(e,t=[],n="all",s={}){return w.validation&&(console.warn("The setNonRegisteredParameter() method is deprecated. Use sendNrpnValue() instead."),s.channels=n,s.channels==="all"&&(s.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendNrpnValue(e,t,s)}sendRpnIncrement(e,t={}){return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(n=>{this.channels[n].sendRpnIncrement(e,t)}),this}incrementRegisteredParameter(e,t="all",n={}){return w.validation&&(console.warn("The incrementRegisteredParameter() method is deprecated. Use sendRpnIncrement() instead."),n.channels=t,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendRpnIncrement(e,n)}sendRpnDecrement(e,t={}){return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(n=>{this.channels[n].sendRpnDecrement(e,t)}),this}decrementRegisteredParameter(e,t="all",n={}){return w.validation&&(console.warn("The decrementRegisteredParameter() method is deprecated. Use sendRpnDecrement() instead."),n.channels=t,n.channels==="all"&&(n.channels=g.MIDI_CHANNEL_NUMBERS)),this.sendRpnDecrement(e,n)}sendNoteOff(e,t={},n={}){if(w.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendNoteOff(e,t)}),this}stopNote(e,t){return this.sendNoteOff(e,t)}playNote(e,t={},n={}){if(w.validation&&(t.rawVelocity&&console.warn("The 'rawVelocity' option is deprecated. Use 'rawAttack' instead."),t.velocity&&console.warn("The 'velocity' option is deprecated. Use 'velocity' instead."),Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].playNote(e,t)}),this}sendNoteOn(e,t={},n={}){if(w.validation&&(Array.isArray(t)||Number.isInteger(t)||t==="all")){const s=t;t=n,t.channels=s,t.channels==="all"&&(t.channels=g.MIDI_CHANNEL_NUMBERS)}return t.channels==null&&(t.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(t.channels).forEach(s=>{this.channels[s].sendNoteOn(e,t)}),this}get name(){return this._midiOutput.name}get id(){return this._midiOutput.id}get connection(){return this._midiOutput.connection}get manufacturer(){return this._midiOutput.manufacturer}get state(){return this._midiOutput.state}get type(){return this._midiOutput.type}get octaveOffset(){return this._octaveOffset}set octaveOffset(e){if(this.validation&&(e=parseInt(e),isNaN(e)))throw new TypeError("The 'octaveOffset' property must be an integer.");this._octaveOffset=e}}/**
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
 */class er{constructor(e=[],t={}){this.destinations=[],this.types=[...Object.keys(g.SYSTEM_MESSAGES),...Object.keys(g.CHANNEL_MESSAGES)],this.channels=g.MIDI_CHANNEL_NUMBERS,this.suspended=!1,Array.isArray(e)||(e=[e]),t.types&&!Array.isArray(t.types)&&(t.types=[t.types]),t.channels&&!Array.isArray(t.channels)&&(t.channels=[t.channels]),w.validation&&(e.forEach(n=>{if(!(n instanceof ya))throw new TypeError("Destinations must be of type 'Output'.")}),t.types!==void 0&&t.types.forEach(n=>{if(!g.SYSTEM_MESSAGES.hasOwnProperty(n)&&!g.CHANNEL_MESSAGES.hasOwnProperty(n))throw new TypeError("Type must be a valid message type.")}),t.channels!==void 0&&t.channels.forEach(n=>{if(!g.MIDI_CHANNEL_NUMBERS.includes(n))throw new TypeError("MIDI channel must be between 1 and 16.")})),this.destinations=e,t.types&&(this.types=t.types),t.channels&&(this.channels=t.channels)}forward(e){this.suspended||this.types.includes(e.type)&&(e.channel&&!this.channels.includes(e.channel)||this.destinations.forEach(t=>{w.validation&&!(t instanceof ya)||t.send(e)}))}}/**
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
 */class Vh extends Oe{constructor(e,t){super(),this._input=e,this._number=t,this._octaveOffset=0,this._nrpnBuffer=[],this._rpnBuffer=[],this.parameterNumberEventsEnabled=!0,this.notesState=new Array(128).fill(!1)}destroy(){this._input=null,this._number=null,this._octaveOffset=0,this._nrpnBuffer=[],this.notesState=new Array(128).fill(!1),this.parameterNumberEventsEnabled=!1,this.removeListener()}_processMidiMessageEvent(e){const t=Object.assign({},e);t.port=this.input,t.target=this,t.type="midimessage",this.emit(t.type,t),this._parseEventForStandardMessages(t)}_parseEventForStandardMessages(e){const t=Object.assign({},e);t.type=t.message.type||"unknownmessage";const n=e.message.dataBytes[0],s=e.message.dataBytes[1];if(t.type==="noteoff"||t.type==="noteon"&&s===0)this.notesState[n]=!1,t.type="noteoff",t.note=new kn(v.offsetNumber(n,this.octaveOffset+this.input.octaveOffset+w.octaveOffset),{rawAttack:0,rawRelease:s}),t.value=v.from7bitToFloat(s),t.rawValue=s,t.velocity=t.note.release,t.rawVelocity=t.note.rawRelease;else if(t.type==="noteon")this.notesState[n]=!0,t.note=new kn(v.offsetNumber(n,this.octaveOffset+this.input.octaveOffset+w.octaveOffset),{rawAttack:s}),t.value=v.from7bitToFloat(s),t.rawValue=s,t.velocity=t.note.attack,t.rawVelocity=t.note.rawAttack;else if(t.type==="keyaftertouch")t.note=new kn(v.offsetNumber(n,this.octaveOffset+this.input.octaveOffset+w.octaveOffset)),t.value=v.from7bitToFloat(s),t.rawValue=s,t.identifier=t.note.identifier,t.key=t.note.number,t.rawKey=n;else if(t.type==="controlchange"){t.controller={number:n,name:g.CONTROL_CHANGE_MESSAGES[n].name,description:g.CONTROL_CHANGE_MESSAGES[n].description,position:g.CONTROL_CHANGE_MESSAGES[n].position},t.subtype=t.controller.name||"controller"+n,t.value=v.from7bitToFloat(s),t.rawValue=s;const r=Object.assign({},t);r.type=`${t.type}-controller${n}`,delete r.subtype,this.emit(r.type,r);const o=Object.assign({},t);o.type=`${t.type}-`+g.CONTROL_CHANGE_MESSAGES[n].name,delete o.subtype,o.type.indexOf("controller")!==0&&this.emit(o.type,o),t.message.dataBytes[0]>=120&&this._parseChannelModeMessage(t),this.parameterNumberEventsEnabled&&this._isRpnOrNrpnController(t.message.dataBytes[0])&&this._parseEventForParameterNumber(t)}else t.type==="programchange"?(t.value=n,t.rawValue=t.value):t.type==="channelaftertouch"?(t.value=v.from7bitToFloat(n),t.rawValue=n):t.type==="pitchbend"?(t.value=((s<<7)+n-8192)/8192,t.rawValue=(s<<7)+n):t.type="unknownmessage";this.emit(t.type,t)}_parseChannelModeMessage(e){const t=Object.assign({},e);t.type=t.controller.name,t.type==="localcontrol"&&(t.value=t.message.data[2]===127,t.rawValue=t.message.data[2]),t.type==="omnimodeon"?(t.type="omnimode",t.value=!0,t.rawValue=t.message.data[2]):t.type==="omnimodeoff"&&(t.type="omnimode",t.value=!1,t.rawValue=t.message.data[2]),t.type==="monomodeon"?(t.type="monomode",t.value=!0,t.rawValue=t.message.data[2]):t.type==="polymodeon"&&(t.type="monomode",t.value=!1,t.rawValue=t.message.data[2]),this.emit(t.type,t)}_parseEventForParameterNumber(e){const t=e.message.dataBytes[0],n=e.message.dataBytes[1];t===99||t===101?(this._nrpnBuffer=[],this._rpnBuffer=[],t===99?this._nrpnBuffer=[e.message]:n!==127&&(this._rpnBuffer=[e.message])):t===98||t===100?t===98?(this._rpnBuffer=[],this._nrpnBuffer.length===1?this._nrpnBuffer.push(e.message):this._nrpnBuffer=[]):(this._nrpnBuffer=[],this._rpnBuffer.length===1&&n!==127?this._rpnBuffer.push(e.message):this._rpnBuffer=[]):(t===6||t===38||t===96||t===97)&&(this._rpnBuffer.length===2?this._dispatchParameterNumberEvent("rpn",this._rpnBuffer[0].dataBytes[1],this._rpnBuffer[1].dataBytes[1],e):this._nrpnBuffer.length===2?this._dispatchParameterNumberEvent("nrpn",this._nrpnBuffer[0].dataBytes[1],this._nrpnBuffer[1].dataBytes[1],e):(this._nrpnBuffer=[],this._rpnBuffer=[]))}_isRpnOrNrpnController(e){return e===6||e===38||e===96||e===97||e===98||e===99||e===100||e===101}_dispatchParameterNumberEvent(e,t,n,s){e=e==="nrpn"?"nrpn":"rpn";const r={target:s.target,timestamp:s.timestamp,message:s.message,parameterMsb:t,parameterLsb:n,value:v.from7bitToFloat(s.message.dataBytes[1]),rawValue:s.message.dataBytes[1]};e==="rpn"?r.parameter=Object.keys(g.REGISTERED_PARAMETERS).find(h=>g.REGISTERED_PARAMETERS[h][0]===t&&g.REGISTERED_PARAMETERS[h][1]===n):r.parameter=(t<<7)+n;const o=g.CONTROL_CHANGE_MESSAGES[s.message.dataBytes[0]].name;r.type=`${e}-${o}`,this.emit(r.type,r);const l=Object.assign({},r);l.type==="nrpn-dataincrement"?l.type="nrpn-databuttonincrement":l.type==="nrpn-datadecrement"?l.type="nrpn-databuttondecrement":l.type==="rpn-dataincrement"?l.type="rpn-databuttonincrement":l.type==="rpn-datadecrement"&&(l.type="rpn-databuttondecrement"),this.emit(l.type,l),r.type=e,r.subtype=o,this.emit(r.type,r)}getChannelModeByNumber(e){return w.validation&&(console.warn("The 'getChannelModeByNumber()' method has been moved to the 'Utilities' class."),e=Math.floor(e)),v.getChannelModeByNumber(e)}getCcNameByNumber(e){if(w.validation&&(console.warn("The 'getCcNameByNumber()' method has been moved to the 'Utilities' class."),e=parseInt(e),!(e>=0&&e<=127)))throw new RangeError("Invalid control change number.");return v.getCcNameByNumber(e)}getNoteState(e){e instanceof kn&&(e=e.identifier);const t=v.guessNoteNumber(e,w.octaveOffset+this.input.octaveOffset+this.octaveOffset);return this.notesState[t]}get octaveOffset(){return this._octaveOffset}set octaveOffset(e){if(this.validation&&(e=parseInt(e),isNaN(e)))throw new TypeError("The 'octaveOffset' property must be an integer.");this._octaveOffset=e}get input(){return this._input}get number(){return this._number}get nrpnEventsEnabled(){return this.parameterNumberEventsEnabled}set nrpnEventsEnabled(e){this.validation&&(e=!!e),this.parameterNumberEventsEnabled=e}}/**
 * The `Message` class represents a single MIDI message. It has several properties that make it
 * easy to make sense of the binary data it contains.
 *
 * @license Apache-2.0
 * @since 3.0.0
 */class co{constructor(e){this.rawData=e,this.data=Array.from(this.rawData),this.statusByte=this.rawData[0],this.rawDataBytes=this.rawData.slice(1),this.dataBytes=this.data.slice(1),this.isChannelMessage=!1,this.isSystemMessage=!1,this.command=void 0,this.channel=void 0,this.manufacturerId=void 0,this.type=void 0,this.statusByte<240?(this.isChannelMessage=!0,this.command=this.statusByte>>4,this.channel=(this.statusByte&15)+1):(this.isSystemMessage=!0,this.command=this.statusByte),this.isChannelMessage?this.type=v.getPropertyByValue(g.CHANNEL_MESSAGES,this.command):this.isSystemMessage&&(this.type=v.getPropertyByValue(g.SYSTEM_MESSAGES,this.command)),this.statusByte===g.SYSTEM_MESSAGES.sysex&&(this.dataBytes[0]===0?(this.manufacturerId=this.dataBytes.slice(0,3),this.dataBytes=this.dataBytes.slice(3,this.rawDataBytes.length-1),this.rawDataBytes=this.rawDataBytes.slice(3,this.rawDataBytes.length-1)):(this.manufacturerId=[this.dataBytes[0]],this.dataBytes=this.dataBytes.slice(1,this.dataBytes.length-1),this.rawDataBytes=this.rawDataBytes.slice(1,this.rawDataBytes.length-1)))}}/**
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
 */class Lh extends Oe{constructor(e){super(),this._midiInput=e,this._octaveOffset=0,this.channels=[];for(let t=1;t<=16;t++)this.channels[t]=new Vh(this,t);this._forwarders=[],this._midiInput.onstatechange=this._onStateChange.bind(this),this._midiInput.onmidimessage=this._onMidiMessage.bind(this)}async destroy(){this.removeListener(),this.channels.forEach(e=>e.destroy()),this.channels=[],this._forwarders=[],this._midiInput&&(this._midiInput.onstatechange=null,this._midiInput.onmidimessage=null),await this.close(),this._midiInput=null}_onStateChange(e){let t={timestamp:w.time,target:this,port:this};e.port.connection==="open"?(t.type="opened",this.emit("opened",t)):e.port.connection==="closed"&&e.port.state==="connected"?(t.type="closed",this.emit("closed",t)):e.port.connection==="closed"&&e.port.state==="disconnected"?(t.type="disconnected",t.port={connection:e.port.connection,id:e.port.id,manufacturer:e.port.manufacturer,name:e.port.name,state:e.port.state,type:e.port.type},this.emit("disconnected",t)):e.port.connection==="pending"&&e.port.state==="disconnected"||console.warn("This statechange event was not caught: ",e.port.connection,e.port.state)}_onMidiMessage(e){const t=new co(e.data),n={port:this,target:this,message:t,timestamp:e.timeStamp,type:"midimessage",data:t.data,rawData:t.data,statusByte:t.data[0],dataBytes:t.dataBytes};this.emit("midimessage",n),t.isSystemMessage?this._parseEvent(n):t.isChannelMessage&&this.channels[t.channel]._processMidiMessageEvent(n),this._forwarders.forEach(s=>s.forward(t))}_parseEvent(e){const t=Object.assign({},e);t.type=t.message.type||"unknownmidimessage",t.type==="songselect"&&(t.song=e.data[1]+1,t.value=e.data[1],t.rawValue=t.value),this.emit(t.type,t)}async open(){try{await this._midiInput.open()}catch(e){return Promise.reject(e)}return Promise.resolve(this)}async close(){if(!this._midiInput)return Promise.resolve(this);try{await this._midiInput.close()}catch(e){return Promise.reject(e)}return Promise.resolve(this)}getChannelModeByNumber(){w.validation&&console.warn("The 'getChannelModeByNumber()' method has been moved to the 'Utilities' class.")}addListener(e,t,n={}){if(w.validation&&typeof n=="function"){let s=t!=null?[].concat(t):void 0;t=n,n={channels:s}}if(g.CHANNEL_EVENTS.includes(e)){n.channels===void 0&&(n.channels=g.MIDI_CHANNEL_NUMBERS);let s=[];return v.sanitizeChannels(n.channels).forEach(r=>{s.push(this.channels[r].addListener(e,t,n))}),s}else return super.addListener(e,t,n)}addOneTimeListener(e,t,n={}){return n.remaining=1,this.addListener(e,t,n)}on(e,t,n,s){return this.addListener(e,t,n,s)}hasListener(e,t,n={}){if(w.validation&&typeof n=="function"){let s=[].concat(t);t=n,n={channels:s}}return g.CHANNEL_EVENTS.includes(e)?(n.channels===void 0&&(n.channels=g.MIDI_CHANNEL_NUMBERS),v.sanitizeChannels(n.channels).every(s=>this.channels[s].hasListener(e,t))):super.hasListener(e,t)}removeListener(e,t,n={}){if(w.validation&&typeof n=="function"){let s=[].concat(t);t=n,n={channels:s}}if(n.channels===void 0&&(n.channels=g.MIDI_CHANNEL_NUMBERS),e==null)return v.sanitizeChannels(n.channels).forEach(s=>{this.channels[s]&&this.channels[s].removeListener()}),super.removeListener();g.CHANNEL_EVENTS.includes(e)?v.sanitizeChannels(n.channels).forEach(s=>{this.channels[s].removeListener(e,t,n)}):super.removeListener(e,t,n)}addForwarder(e,t={}){let n;return e instanceof er?n=e:n=new er(e,t),this._forwarders.push(n),n}removeForwarder(e){this._forwarders=this._forwarders.filter(t=>t!==e)}hasForwarder(e){return this._forwarders.includes(e)}get name(){return this._midiInput.name}get id(){return this._midiInput.id}get connection(){return this._midiInput.connection}get manufacturer(){return this._midiInput.manufacturer}get octaveOffset(){return this._octaveOffset}set octaveOffset(e){if(this.validation&&(e=parseInt(e),isNaN(e)))throw new TypeError("The 'octaveOffset' property must be an integer.");this._octaveOffset=e}get state(){return this._midiInput.state}get type(){return this._midiInput.type}get nrpnEventsEnabled(){return w.validation&&console.warn("The 'nrpnEventsEnabled' property has been moved to the 'InputChannel' class."),!1}}/**
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
 */class Fh extends Oe{constructor(){super(),this.defaults={note:{attack:v.from7bitToFloat(64),release:v.from7bitToFloat(64),duration:1/0}},this.interface=null,this.validation=!0,this._inputs=[],this._disconnectedInputs=[],this._outputs=[],this._disconnectedOutputs=[],this._stateChangeQueue=[],this._octaveOffset=0}async enable(e={},t=!1){if(v.isNode)try{window.navigator}catch{let l=await Object.getPrototypeOf(async function(){}).constructor(`
        let jzz = await import("jzz");
        return jzz.default;
        `)();global.navigator||(global.navigator={}),Object.assign(global.navigator,l)}if(this.validation=e.validation!==!1,this.validation&&(typeof e=="function"&&(e={callback:e,sysex:t}),t&&(e.sysex=!0)),this.enabled)return typeof e.callback=="function"&&e.callback(),Promise.resolve();const n={timestamp:this.time,target:this,type:"error",error:void 0},s={timestamp:this.time,target:this,type:"midiaccessgranted"},r={timestamp:this.time,target:this,type:"enabled"};try{typeof e.requestMIDIAccessFunction=="function"?this.interface=await e.requestMIDIAccessFunction({sysex:e.sysex,software:e.software}):this.interface=await navigator.requestMIDIAccess({sysex:e.sysex,software:e.software})}catch(o){return n.error=o,this.emit("error",n),typeof e.callback=="function"&&e.callback(o),Promise.reject(o)}this.emit("midiaccessgranted",s),this.interface.onstatechange=this._onInterfaceStateChange.bind(this);try{await this._updateInputsAndOutputs()}catch(o){return n.error=o,this.emit("error",n),typeof e.callback=="function"&&e.callback(o),Promise.reject(o)}return this.emit("enabled",r),typeof e.callback=="function"&&e.callback(),Promise.resolve(this)}async disable(){return this.interface&&(this.interface.onstatechange=void 0),this._destroyInputsAndOutputs().then(()=>{navigator&&typeof navigator.close=="function"&&navigator.close(),this.interface=null;let e={timestamp:this.time,target:this,type:"disabled"};this.emit("disabled",e),this.removeListener()})}getInputById(e,t={disconnected:!1}){if(this.validation){if(!this.enabled)throw new Error("WebMidi is not enabled.");if(!e)return}if(t.disconnected){for(let n=0;n<this._disconnectedInputs.length;n++)if(this._disconnectedInputs[n].id===e.toString())return this._disconnectedInputs[n]}else for(let n=0;n<this.inputs.length;n++)if(this.inputs[n].id===e.toString())return this.inputs[n]}getInputByName(e,t={disconnected:!1}){if(this.validation){if(!this.enabled)throw new Error("WebMidi is not enabled.");if(!e)return;e=e.toString()}if(t.disconnected){for(let n=0;n<this._disconnectedInputs.length;n++)if(~this._disconnectedInputs[n].name.indexOf(e))return this._disconnectedInputs[n]}else for(let n=0;n<this.inputs.length;n++)if(~this.inputs[n].name.indexOf(e))return this.inputs[n]}getOutputByName(e,t={disconnected:!1}){if(this.validation){if(!this.enabled)throw new Error("WebMidi is not enabled.");if(!e)return;e=e.toString()}if(t.disconnected){for(let n=0;n<this._disconnectedOutputs.length;n++)if(~this._disconnectedOutputs[n].name.indexOf(e))return this._disconnectedOutputs[n]}else for(let n=0;n<this.outputs.length;n++)if(~this.outputs[n].name.indexOf(e))return this.outputs[n]}getOutputById(e,t={disconnected:!1}){if(this.validation){if(!this.enabled)throw new Error("WebMidi is not enabled.");if(!e)return}if(t.disconnected){for(let n=0;n<this._disconnectedOutputs.length;n++)if(this._disconnectedOutputs[n].id===e.toString())return this._disconnectedOutputs[n]}else for(let n=0;n<this.outputs.length;n++)if(this.outputs[n].id===e.toString())return this.outputs[n]}noteNameToNumber(e){return this.validation&&console.warn("The noteNameToNumber() method is deprecated. Use Utilities.toNoteNumber() instead."),v.toNoteNumber(e,this.octaveOffset)}getOctave(e){return this.validation&&(console.warn("The getOctave()is deprecated. Use Utilities.getNoteDetails() instead"),e=parseInt(e)),!isNaN(e)&&e>=0&&e<=127?v.getNoteDetails(v.offsetNumber(e,this.octaveOffset)).octave:!1}sanitizeChannels(e){return this.validation&&console.warn("The sanitizeChannels() method has been moved to the utilities class."),v.sanitizeChannels(e)}toMIDIChannels(e){return this.validation&&console.warn("The toMIDIChannels() method has been deprecated. Use Utilities.sanitizeChannels() instead."),v.sanitizeChannels(e)}guessNoteNumber(e){return this.validation&&console.warn("The guessNoteNumber() method has been deprecated. Use Utilities.guessNoteNumber() instead."),v.guessNoteNumber(e,this.octaveOffset)}getValidNoteArray(e,t={}){return this.validation&&console.warn("The getValidNoteArray() method has been moved to the Utilities.buildNoteArray()"),v.buildNoteArray(e,t)}convertToTimestamp(e){return this.validation&&console.warn("The convertToTimestamp() method has been moved to Utilities.toTimestamp()."),v.toTimestamp(e)}async _destroyInputsAndOutputs(){let e=[];return this.inputs.forEach(t=>e.push(t.destroy())),this.outputs.forEach(t=>e.push(t.destroy())),Promise.all(e).then(()=>{this._inputs=[],this._outputs=[]})}_onInterfaceStateChange(e){this._updateInputsAndOutputs();let t={timestamp:e.timeStamp,type:e.port.state,target:this};if(e.port.state==="connected"&&e.port.connection==="open"){e.port.type==="output"?t.port=this.getOutputById(e.port.id):e.port.type==="input"&&(t.port=this.getInputById(e.port.id)),this.emit(e.port.state,t);const n=Object.assign({},t);n.type="portschanged",this.emit(n.type,n)}else if(e.port.state==="disconnected"&&e.port.connection==="pending"){e.port.type==="input"?t.port=this.getInputById(e.port.id,{disconnected:!0}):e.port.type==="output"&&(t.port=this.getOutputById(e.port.id,{disconnected:!0})),this.emit(e.port.state,t);const n=Object.assign({},t);n.type="portschanged",this.emit(n.type,n)}}async _updateInputsAndOutputs(){return Promise.all([this._updateInputs(),this._updateOutputs()])}async _updateInputs(){if(!this.interface)return;for(let t=this._inputs.length-1;t>=0;t--){const n=this._inputs[t];Array.from(this.interface.inputs.values()).find(r=>r===n._midiInput)||(this._disconnectedInputs.push(n),this._inputs.splice(t,1))}let e=[];return this.interface.inputs.forEach(t=>{if(!this._inputs.find(n=>n._midiInput===t)){let n=this._disconnectedInputs.find(s=>s._midiInput===t);n||(n=new Lh(t)),this._inputs.push(n),e.push(n.open())}}),Promise.all(e)}async _updateOutputs(){if(!this.interface)return;for(let t=this._outputs.length-1;t>=0;t--){const n=this._outputs[t];Array.from(this.interface.outputs.values()).find(r=>r===n._midiOutput)||(this._disconnectedOutputs.push(n),this._outputs.splice(t,1))}let e=[];return this.interface.outputs.forEach(t=>{if(!this._outputs.find(n=>n._midiOutput===t)){let n=this._disconnectedOutputs.find(s=>s._midiOutput===t);n||(n=new ya(t)),this._outputs.push(n),e.push(n.open())}}),Promise.all(e)}get enabled(){return this.interface!==null}get inputs(){return this._inputs}get isNode(){return this.validation&&console.warn("WebMidi.isNode has been deprecated. Use Utilities.isNode instead."),v.isNode}get isBrowser(){return this.validation&&console.warn("WebMidi.isBrowser has been deprecated. Use Utilities.isBrowser instead."),v.isBrowser}get octaveOffset(){return this._octaveOffset}set octaveOffset(e){if(this.validation&&(e=parseInt(e),isNaN(e)))throw new TypeError("The 'octaveOffset' property must be an integer.");this._octaveOffset=e}get outputs(){return this._outputs}get supported(){return typeof navigator<"u"&&!!navigator.requestMIDIAccess}get sysexEnabled(){return!!(this.interface&&this.interface.sysexEnabled)}get time(){return performance.now()}get version(){return"3.1.13"}get flavour(){return"esm"}get CHANNEL_EVENTS(){return this.validation&&console.warn("The CHANNEL_EVENTS enum has been moved to Enumerations.CHANNEL_EVENTS."),g.CHANNEL_EVENTS}get MIDI_SYSTEM_MESSAGES(){return this.validation&&console.warn("The MIDI_SYSTEM_MESSAGES enum has been moved to Enumerations.SYSTEM_MESSAGES."),g.SYSTEM_MESSAGES}get MIDI_CHANNEL_MODE_MESSAGES(){return this.validation&&console.warn("The MIDI_CHANNEL_MODE_MESSAGES enum has been moved to Enumerations.CHANNEL_MODE_MESSAGES."),g.CHANNEL_MODE_MESSAGES}get MIDI_CONTROL_CHANGE_MESSAGES(){return this.validation&&console.warn("The MIDI_CONTROL_CHANGE_MESSAGES enum has been replaced by the Enumerations.CONTROL_CHANGE_MESSAGES array."),g.MIDI_CONTROL_CHANGE_MESSAGES}get MIDI_REGISTERED_PARAMETER(){return this.validation&&console.warn("The MIDI_REGISTERED_PARAMETER enum has been moved to Enumerations.REGISTERED_PARAMETERS."),g.REGISTERED_PARAMETERS}get NOTES(){return this.validation&&console.warn("The NOTES enum has been deprecated."),["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"]}}const w=new Fh;w.constructor=null;var uo=i=>{throw TypeError(i)},Pa=(i,e,t)=>e.has(i)||uo("Cannot "+t),$=(i,e,t)=>(Pa(i,e,"read from private field"),t?t.call(i):e.get(i)),zt=(i,e,t)=>e.has(i)?uo("Cannot add the same private member more than once"):e instanceof WeakSet?e.add(i):e.set(i,t),Bh=(i,e,t,n)=>(Pa(i,e,"write to private field"),e.set(i,t),t),et=(i,e,t)=>(Pa(i,e,"access private method"),t);function ba(){return typeof navigator<"u"&&typeof navigator.requestMIDIAccess=="function"}function tr(){const i=navigator.userAgent,e=/Chrome/.test(i)&&/Google Inc/.test(navigator.vendor||""),t=/Edg/.test(i),n=/OPR/.test(i),s=/Safari/.test(i)&&!/Chrome/.test(i),r=/Firefox/.test(i);let o="Unknown";e?o="Chrome":t?o="Edge":n?o="Opera":s?o="Safari":r&&(o="Firefox");const l=ba();let h="";return l||(s?h="Safari doesn't support Web MIDI API. Use Chrome, Edge, or Opera for MIDI functionality.":r?h="Firefox has limited Web MIDI API support. Use Chrome, Edge, or Opera for full MIDI functionality.":h="Web MIDI API not supported in this browser."),{supported:l,browserName:o,message:h}}var di,wi,Ei,Rn,xn,xe,po,_s,nr,ir,pi;class Uh{constructor(){zt(this,xe),zt(this,di,!1),zt(this,wi,new Set),zt(this,Ei,new Set),zt(this,Rn,new Set),zt(this,xn,new Set)}async init(){if($(this,di))return!0;if(!ba()){const{browserName:e,message:t}=tr();return console.warn(`InputController: ${t} (Browser: ${e})`),!1}try{await w.enable()}catch(e){return console.warn("InputController: WebMIDI enable failed",e),!1}return w.enabled?(Bh(this,di,!0),et(this,xe,po).call(this),!0):(console.warn("InputController: WebMIDI not enabled"),!1)}onNoteOn(e){return $(this,wi).add(e),()=>$(this,wi).delete(e)}onNoteOff(e){return $(this,Ei).add(e),()=>$(this,Ei).delete(e)}onControlChange(e){return $(this,Rn).add(e),()=>$(this,Rn).delete(e)}onSustainPedal(e){return $(this,xn).add(e),()=>$(this,xn).delete(e)}registerNoteTarget(e,t="all"){const n=this.onNoteOn(r=>{et(this,xe,pi).call(this,t,r.channel)&&e.play(r.note,r.velocity??0)}),s=this.onNoteOff(r=>{et(this,xe,pi).call(this,t,r.channel)&&e.release(r.note)});return()=>{n(),s()}}registerControlTarget(e,t){const n=Array.isArray(e)?e:[e],s=Array.isArray(t.controller)?t.controller:[t.controller],r=t.channel??"all",o=t.transformValue??(l=>l.normalizedValue);return this.onControlChange(l=>{if(!s.includes(l.controller)||!et(this,xe,pi).call(this,r,l.channel))return;const h=o(l);n.forEach(c=>{typeof c=="function"?c(h,l):"onControlChange"in c?c.onControlChange(h,l):"setValueNormalized"in c&&c.setValueNormalized?c.setValueNormalized(h):"setValue"in c&&c.setValue&&c.setValue(h)})})}registerSustainPedalTarget(e,t="all"){return this.onSustainPedal(n=>{et(this,xe,pi).call(this,t,n.channel)&&e.setSustainPedal(n.pressed)})}get initialized(){return $(this,di)}get midiSupported(){return ba()}get supportInfo(){return tr()}}di=new WeakMap,wi=new WeakMap,Ei=new WeakMap,Rn=new WeakMap,xn=new WeakMap,xe=new WeakSet,po=function(){w.inputs.forEach(i=>{i&&(i.addListener("noteon",e=>{et(this,xe,_s).call(this,$(this,wi),e,"noteon")}),i.addListener("noteoff",e=>{et(this,xe,_s).call(this,$(this,Ei),e,"noteoff")}),i.addListener("controlchange",e=>{var t,n;(((t=e.controller)==null?void 0:t.number)??((n=e.controller)==null?void 0:n.value)??0)===64?et(this,xe,ir).call(this,e):et(this,xe,nr).call(this,e)}))})},_s=function(i,e,t){var n,s,r,o;if(!i.size)return;const l={type:t,note:((n=e.note)==null?void 0:n.number)??0,velocity:((s=e.note)==null?void 0:s.rawAttack)??(typeof e.velocity=="number"?e.velocity:((r=e.note)==null?void 0:r.attack)??0),channel:((o=e.message)==null?void 0:o.channel)??1,raw:e};i.forEach(h=>h(l))},nr=function(i){var e,t,n;if(!$(this,Rn).size)return;const s={type:"controlchange",controller:((e=i.controller)==null?void 0:e.number)??((t=i.controller)==null?void 0:t.value)??(typeof i.controller=="number"?i.controller:0),normalizedValue:typeof i.value=="number"?i.value:typeof i.rawValue=="number"?i.rawValue/127:0,midiValue:typeof i.rawValue=="number"?i.rawValue:typeof i.value=="number"?Math.round(i.value*127):0,channel:((n=i.message)==null?void 0:n.channel)??1,raw:i};$(this,Rn).forEach(r=>r(s))},ir=function(i){var e;if(!$(this,xn).size)return;const t={type:"sustainpedal",pressed:(typeof i.rawValue=="number"?i.rawValue:typeof i.value=="number"?Math.round(i.value*127):0)>=64,channel:((e=i.message)==null?void 0:e.channel)??1,raw:i};$(this,xn).forEach(n=>n(t))},pi=function(i,e){return i==="all"?!0:typeof e!="number"?!1:i===e};const fc=new Uh;try{self["workbox:window:7.2.0"]&&_()}catch{}function Aa(i,e){return new Promise(function(t){var n=new MessageChannel;n.port1.onmessage=function(s){t(s.data)},i.postMessage(e,[n.port2])})}function Gh(i){var e=function(t,n){if(typeof t!="object"||!t)return t;var s=t[Symbol.toPrimitive];if(s!==void 0){var r=s.call(t,n);if(typeof r!="object")return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(i,"string");return typeof e=="symbol"?e:e+""}function _h(i,e){for(var t=0;t<e.length;t++){var n=e[t];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(i,Gh(n.key),n)}}function va(i,e){return va=Object.setPrototypeOf?Object.setPrototypeOf.bind():function(t,n){return t.__proto__=n,t},va(i,e)}function sr(i,e){(e==null||e>i.length)&&(e=i.length);for(var t=0,n=new Array(e);t<e;t++)n[t]=i[t];return n}function Wh(i,e){var t=typeof Symbol<"u"&&i[Symbol.iterator]||i["@@iterator"];if(t)return(t=t.call(i)).next.bind(t);if(Array.isArray(i)||(t=function(s,r){if(s){if(typeof s=="string")return sr(s,r);var o=Object.prototype.toString.call(s).slice(8,-1);return o==="Object"&&s.constructor&&(o=s.constructor.name),o==="Map"||o==="Set"?Array.from(s):o==="Arguments"||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(o)?sr(s,r):void 0}}(i))||e){t&&(i=t);var n=0;return function(){return n>=i.length?{done:!0}:{done:!1,value:i[n++]}}}throw new TypeError(`Invalid attempt to iterate non-iterable instance.
In order to be iterable, non-array objects must have a [Symbol.iterator]() method.`)}try{self["workbox:core:7.2.0"]&&_()}catch{}var Ws=function(){var i=this;this.promise=new Promise(function(e,t){i.resolve=e,i.reject=t})};function zs(i,e){var t=location.href;return new URL(i,t).href===new URL(e,t).href}var bn=function(i,e){this.type=i,Object.assign(this,e)};function it(i,e,t){return t?e?e(i):i:(i&&i.then||(i=Promise.resolve(i)),e?i.then(e):i)}function zh(){}var Hh={type:"SKIP_WAITING"};function ar(i,e){return i&&i.then?i.then(zh):Promise.resolve()}var jh=function(i){function e(l,h){var c,f;return h===void 0&&(h={}),(c=i.call(this)||this).nn={},c.tn=0,c.rn=new Ws,c.en=new Ws,c.on=new Ws,c.un=0,c.an=new Set,c.cn=function(){var d=c.fn,m=d.installing;c.tn>0||!zs(m.scriptURL,c.sn.toString())||performance.now()>c.un+6e4?(c.vn=m,d.removeEventListener("updatefound",c.cn)):(c.hn=m,c.an.add(m),c.rn.resolve(m)),++c.tn,m.addEventListener("statechange",c.ln)},c.ln=function(d){var m=c.fn,A=d.target,E=A.state,M=A===c.vn,S={sw:A,isExternal:M,originalEvent:d};!M&&c.mn&&(S.isUpdate=!0),c.dispatchEvent(new bn(E,S)),E==="installed"?c.wn=self.setTimeout(function(){E==="installed"&&m.waiting===A&&c.dispatchEvent(new bn("waiting",S))},200):E==="activating"&&(clearTimeout(c.wn),M||c.en.resolve(A))},c.yn=function(d){var m=c.hn,A=m!==navigator.serviceWorker.controller;c.dispatchEvent(new bn("controlling",{isExternal:A,originalEvent:d,sw:m,isUpdate:c.mn})),A||c.on.resolve(m)},c.gn=(f=function(d){var m=d.data,A=d.ports,E=d.source;return it(c.getSW(),function(){c.an.has(E)&&c.dispatchEvent(new bn("message",{data:m,originalEvent:d,ports:A,sw:E}))})},function(){for(var d=[],m=0;m<arguments.length;m++)d[m]=arguments[m];try{return Promise.resolve(f.apply(this,d))}catch(A){return Promise.reject(A)}}),c.sn=l,c.nn=h,navigator.serviceWorker.addEventListener("message",c.gn),c}var t,n;n=i,(t=e).prototype=Object.create(n.prototype),t.prototype.constructor=t,va(t,n);var s,r,o=e.prototype;return o.register=function(l){var h=(l===void 0?{}:l).immediate,c=h!==void 0&&h;try{var f=this;return it(function(d,m){var A=d();return A&&A.then?A.then(m):m(A)}(function(){if(!c&&document.readyState!=="complete")return ar(new Promise(function(d){return window.addEventListener("load",d)}))},function(){return f.mn=!!navigator.serviceWorker.controller,f.dn=f.pn(),it(f.bn(),function(d){f.fn=d,f.dn&&(f.hn=f.dn,f.en.resolve(f.dn),f.on.resolve(f.dn),f.dn.addEventListener("statechange",f.ln,{once:!0}));var m=f.fn.waiting;return m&&zs(m.scriptURL,f.sn.toString())&&(f.hn=m,Promise.resolve().then(function(){f.dispatchEvent(new bn("waiting",{sw:m,wasWaitingBeforeRegister:!0}))}).then(function(){})),f.hn&&(f.rn.resolve(f.hn),f.an.add(f.hn)),f.fn.addEventListener("updatefound",f.cn),navigator.serviceWorker.addEventListener("controllerchange",f.yn),f.fn})}))}catch(d){return Promise.reject(d)}},o.update=function(){try{return this.fn?it(ar(this.fn.update())):it()}catch(l){return Promise.reject(l)}},o.getSW=function(){return this.hn!==void 0?Promise.resolve(this.hn):this.rn.promise},o.messageSW=function(l){try{return it(this.getSW(),function(h){return Aa(h,l)})}catch(h){return Promise.reject(h)}},o.messageSkipWaiting=function(){this.fn&&this.fn.waiting&&Aa(this.fn.waiting,Hh)},o.pn=function(){var l=navigator.serviceWorker.controller;return l&&zs(l.scriptURL,this.sn.toString())?l:void 0},o.bn=function(){try{var l=this;return it(function(h,c){try{var f=h()}catch(d){return c(d)}return f&&f.then?f.then(void 0,c):f}(function(){return it(navigator.serviceWorker.register(l.sn,l.nn),function(h){return l.un=performance.now(),h})},function(h){throw h}))}catch(h){return Promise.reject(h)}},s=e,(r=[{key:"active",get:function(){return this.en.promise}},{key:"controlling",get:function(){return this.on.promise}}])&&_h(s.prototype,r),Object.defineProperty(s,"prototype",{writable:!1}),s}(function(){function i(){this.Pn=new Map}var e=i.prototype;return e.addEventListener=function(t,n){this.jn(t).add(n)},e.removeEventListener=function(t,n){this.jn(t).delete(n)},e.dispatchEvent=function(t){t.target=this;for(var n,s=Wh(this.jn(t.type));!(n=s()).done;)(0,n.value)(t)},e.jn=function(t){return this.Pn.has(t)||this.Pn.set(t,new Set),this.Pn.get(t)},i}());const mc=Object.freeze(Object.defineProperty({__proto__:null,Workbox:jh,WorkboxEvent:bn,messageSW:Aa},Symbol.toStringTag,{value:"Module"}));export{uc as A,sc as B,dc as C,hc as D,cc as E,Zh as F,ac as G,$h as H,mc as I,tr as O,Xh as S,fc as U,lr as a,bo as b,pc as c,vo as d,Mi as e,qs as f,Lo as g,nc as h,_o as i,xo as j,Qh as k,Fo as l,Jh as m,Yh as n,Kh as o,tc as p,Bl as q,fi as r,Wt as s,ec as t,Go as u,rc as v,lc as w,oc as x,Uo as y,ic as z};
//# sourceMappingURL=vendor-D8-Od87N.js.map
