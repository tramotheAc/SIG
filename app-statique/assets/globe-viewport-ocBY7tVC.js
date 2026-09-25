import{A as e,D as t,E as n,F as r,I as i,L as a,R as o,St as s,X as c,c as l,d as u,i as d,k as f,l as p,n as m,o as h,q as g,r as _,s as v,u as y,w as b,x}from"./quaternion-AfNLVqq0.js";import{a as S,d as C,f as w,i as ee,p as T,r as te,u as ne}from"./shader-type-decoder-WXdbD0rZ.js";function re(){let e;if(typeof window<`u`&&window.performance)e=window.performance.now();else if(typeof process<`u`&&process.hrtime){let t=process.hrtime();e=t[0]*1e3+t[1]/1e6}else e=Date.now();return e}var ie=class{constructor(e,t){this.sampleSize=1,this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this.name=e,this.type=t,this.reset()}reset(){return this.time=0,this.count=0,this.samples=0,this.lastTiming=0,this.lastSampleTime=0,this.lastSampleCount=0,this._count=0,this._time=0,this._samples=0,this._startTime=0,this._timerPending=!1,this}setSampleSize(e){return this.sampleSize=e,this}incrementCount(){return this.addCount(1),this}decrementCount(){return this.subtractCount(1),this}addCount(e){return this._count+=e,this._samples++,this._checkSampling(),this}subtractCount(e){return this._count-=e,this._samples++,this._checkSampling(),this}addTime(e){return this._time+=e,this.lastTiming=e,this._samples++,this._checkSampling(),this}timeStart(){return this._startTime=re(),this._timerPending=!0,this}timeEnd(){return this._timerPending?(this.addTime(re()-this._startTime),this._timerPending=!1,this._checkSampling(),this):this}getSampleAverageCount(){return this.sampleSize>0?this.lastSampleCount/this.sampleSize:0}getSampleAverageTime(){return this.sampleSize>0?this.lastSampleTime/this.sampleSize:0}getSampleHz(){return this.lastSampleTime>0?this.sampleSize/(this.lastSampleTime/1e3):0}getAverageCount(){return this.samples>0?this.count/this.samples:0}getAverageTime(){return this.samples>0?this.time/this.samples:0}getHz(){return this.time>0?this.samples/(this.time/1e3):0}_checkSampling(){this._samples===this.sampleSize&&(this.lastSampleTime=this._time,this.lastSampleCount=this._count,this.count+=this._count,this.time+=this._time,this.samples+=this._samples,this._time=0,this._count=0,this._samples=0)}},ae=class{constructor(e){this.stats={},this.id=e.id,this.stats={},this._initializeStats(e.stats),Object.seal(this)}get(e,t=`count`){return this._getOrCreate({name:e,type:t})}get size(){return Object.keys(this.stats).length}reset(){for(let e of Object.values(this.stats))e.reset();return this}forEach(e){for(let t of Object.values(this.stats))e(t)}getTable(){let e={};return this.forEach(t=>{e[t.name]={time:t.time||0,count:t.count||0,average:t.getAverageTime()||0,hz:t.getHz()||0}}),e}_initializeStats(e=[]){e.forEach(e=>this._getOrCreate(e))}_getOrCreate(e){let{name:t,type:n}=e,r=this.stats[t];return r||(r=e instanceof ie?e:new ie(t,n),this.stats[t]=r),r}},oe=new s({id:`deck`}),se={};function ce(e){se=e}function le(e,t,n,r){oe.level>0&&se[e]&&se[e].call(null,t,n,r)}var E=`(?:var<\\s*(uniform|storage(?:\\s*,\\s*[A-Za-z_][A-Za-z0-9_]*)?)\\s*>|var)\\s+([A-Za-z_][A-Za-z0-9_]*)`,D=`\\s*`,ue=[RegExp(`@binding\\(\\s*(auto|\\d+)\\s*\\)${D}@group\\(\\s*(\\d+)\\s*\\)${D}${E}`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)${D}@binding\\(\\s*(auto|\\d+)\\s*\\)${D}${E}`,`g`)],de=[RegExp(`@binding\\(\\s*(auto|\\d+)\\s*\\)${D}@group\\(\\s*(\\d+)\\s*\\)${D}${E}`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)${D}@binding\\(\\s*(auto|\\d+)\\s*\\)${D}${E}`,`g`)],fe=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)${D}@group\\(\\s*(\\d+)\\s*\\)${D}${E}`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)${D}@binding\\(\\s*(\\d+)\\s*\\)${D}${E}`,`g`)],pe=[RegExp(`@binding\\(\\s*(auto)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${E}`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto)\\s*\\)\\s*${E}`,`g`),RegExp(`@binding\\(\\s*(auto)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)(?:[\\s\\n\\r]*@[A-Za-z_][^\\n\\r]*)*[\\s\\n\\r]*${E}`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(auto)\\s*\\)(?:[\\s\\n\\r]*@[A-Za-z_][^\\n\\r]*)*[\\s\\n\\r]*${E}`,`g`)];function me(e){let t=e.split(``),n=0,r=0,i=!1,a=!1,o=!1;for(;n<e.length;){let s=e[n],c=e[n+1];if(a){o?o=!1:s===`\\`?o=!0:s===`"`&&(a=!1),n++;continue}if(i){s===`
`||s===`\r`?i=!1:t[n]=` `,n++;continue}if(r>0){if(s===`/`&&c===`*`){t[n]=` `,t[n+1]=` `,r++,n+=2;continue}if(s===`*`&&c===`/`){t[n]=` `,t[n+1]=` `,r--,n+=2;continue}s!==`
`&&s!==`\r`&&(t[n]=` `),n++;continue}if(s===`"`){a=!0,n++;continue}if(s===`/`&&c===`/`){t[n]=` `,t[n+1]=` `,i=!0,n+=2;continue}if(s===`/`&&c===`*`){t[n]=` `,t[n+1]=` `,r=1,n+=2;continue}n++}return t.join(``)}function O(e,t){let n=me(e),r=[];for(let i of t){i.lastIndex=0;let a;for(a=i.exec(n);a;){let o=i===t[0],s=a.index,c=a[0].length;r.push({match:e.slice(s,s+c),index:s,length:c,bindingToken:a[o?1:2],groupToken:a[o?2:1],accessDeclaration:a[3]?.trim(),name:a[4]}),a=i.exec(n)}}return r.sort((e,t)=>e.index-t.index)}function he(e,t,n){let r=O(e,t);if(!r.length)return e;let i=``,a=0;for(let t of r)i+=e.slice(a,t.index),i+=n(t),a=t.index+t.length;return i+=e.slice(a),i}function ge(e){return/@binding\(\s*auto\s*\)/.test(me(e))}function _e(e,t){return O(e,t===ue||t===de?pe:t).find(e=>e.bindingToken===`auto`)}function ve(e,t={}){let n=ye(e),r=be(n);if(!r)return null;let i=xe(n,r);if(!i)return null;let a=Ce(n,r,i);if(!a)return null;if(t.scanVertexAttributes===!1)return{attributes:[],bindings:a};let o=Se(n,r);if(!o)return null;let s=Oe(n,r,i,o,t.vertexEntryPoint);return s?{attributes:s,bindings:a}:null}function ye(e){let t=me(e),n=/[A-Za-z_][A-Za-z0-9_]*|(?:0[xX][0-9A-Fa-f]+|\d+)|[@(){}<>\[\]:,;=]/g,r=[],i=n.exec(t);for(;i;)r.push({value:i[0],index:i.index}),i=n.exec(t);return r}function be(e){let t=[],n=0;for(let r of e){if(r.value===`}`&&n===0)return null;t.push(n),r.value===`{`?n++:r.value===`}`&&n--}return n===0?t:null}function xe(e,t){let n=new Map;for(let r=0;r<e.length;r++){if(t[r]!==0||e[r].value!==`alias`)continue;let i=e[r+1]?.value;if(!We(i)||e[r+2]?.value!==`=`||n.has(i))return null;let a=Be(e,t,r+3,`;`);if(a<0||a===r+3)return null;n.set(i,Ue(e.slice(r+3,a))),r=a}return n}function Se(e,t){let n=new Map;for(let r=0;r<e.length;r++){if(t[r]!==0||e[r].value!==`struct`)continue;let i=e[r+1]?.value,a=r+2;if(!We(i)||n.has(i)||e[a]?.value!==`{`)return null;let o=Le(e,a,`{`,`}`);if(o<0)return null;n.set(i,e.slice(a+1,o)),r=o}return n}function Ce(e,t,n){let r=[],i=new Set,a=new Set;for(let o=0;o<e.length;o++){if(t[o]!==0||e[o].value!==`var`)continue;let s=Ve(e,t,o),c=e.slice(s,o),l=Pe(c,`group`),u=Pe(c,`binding`);if(l===null||u===null||l===void 0!=(u===void 0))return null;if(l===void 0||u===void 0)continue;let d=o+1,f=[];if(e[d]?.value===`<`){let t=Le(e,d,`<`,`>`);if(t<0)return null;let n=Re(e.slice(d+1,t),`,`);if(!n)return null;f=n.map(Ue),d=t+1}let p=e[d]?.value;if(!We(p)||e[d+1]?.value!==`:`)return null;let m=Be(e,t,d+2,`;`);if(m<0||m===d+2)return null;let h=je(Ue(e.slice(d+2,m)),n);if(!h)return null;let g=we({name:p,group:l,location:u,addressSpace:f,resourceType:h}),_=`${l}:${u}`;if(!g||i.has(_)||a.has(p))return null;r.push(g),i.add(_),a.add(p),o=m}return De(r),r.sort((e,t)=>e.group-t.group||e.location-t.location||e.name.localeCompare(t.name))}function we(e){let{name:t,group:n,location:r,addressSpace:i,resourceType:a}=e,o={name:t,group:n,location:r};if(i[0]===`uniform`&&i.length===1)return{...o,type:`uniform`};if(i[0]===`storage`&&i.length<=2){let e=i[1]||`read`;return e===`read`?{...o,type:`read-only-storage`}:e===`read_write`?{...o,type:`storage`}:null}return i.length>0?null:a===`sampler`||a===`sampler_comparison`?{...o,type:`sampler`,...a===`sampler_comparison`?{samplerType:`comparison`}:{}}:a===`texture_external`?{...o,type:`external-texture`}:Te(o,a)||Ee(o,a)}function Te(e,t){let n=/^texture_storage_(1d|2d|2d_array|3d)<([A-Za-z0-9_]+),(read|write|read_write)>$/.exec(t);if(!n)return null;let r={read:`read-only`,write:`write-only`,read_write:`read-write`}[n[3]];return{...e,type:`storage`,format:n[2],access:r,viewDimension:Ie(n[1])}}function Ee(e,t){let n=/^texture_(multisampled_)?(1d|2d|2d_array|cube|cube_array|3d)<(f32|i32|u32)>$/.exec(t);if(n){if(n[1]&&n[2]!==`2d`)return null;let t={f32:`float`,i32:`sint`,u32:`uint`}[n[3]];return{...e,type:`texture`,viewDimension:Ie(n[2]),sampleType:t,multisampled:!!n[1]}}let r=/^texture_depth_(multisampled_)?(2d|2d_array|cube|cube_array)$/.exec(t);return!r||r[1]&&r[2]!==`2d`?null:{...e,type:`texture`,viewDimension:Ie(r[2]),sampleType:`depth`,multisampled:!!r[1]}}function De(e){for(let t of e){if(t.type!==`sampler`||t.samplerType||!t.name.endsWith(`Sampler`))continue;let n=t.name.slice(0,-7);e.find(e=>e.type===`texture`&&e.name===n&&e.group===t.group)?.sampleType===`depth`&&(t.samplerType=`non-filtering`)}}function Oe(e,t,n,r,i){let a=ke(e,t);if(!a)return null;let o=a.filter(e=>e.vertex),s=i?o.find(e=>e.name===i):o.length===1?o[0]:void 0;if(!s)return o.length===0&&!i?[]:null;let c=Re(s.parameters,`,`);if(!c)return null;let l=[],u=new Set,d=new Set,f=new Set;for(let e of c)if(e.length>0&&!Ae({declaration:e,aliases:n,structures:r,attributes:l,attributeLocations:u,attributeNames:d,visitedStructures:f}))return null;return l.sort((e,t)=>e.location-t.location||e.name.localeCompare(t.name))}function ke(e,t){let n=[],r=new Set;for(let i=0;i<e.length;i++){if(t[i]!==0||e[i].value!==`fn`)continue;let a=e[i+1]?.value,o=i+2;if(!We(a)||r.has(a)||e[o]?.value!==`(`)return null;let s=Le(e,o,`(`,`)`);if(s<0)return null;let c=Ve(e,t,i);n.push({name:a,vertex:Fe(e.slice(c,i),`vertex`),parameters:e.slice(o+1,s)}),r.add(a),i=s}return n}function Ae(e){let{declaration:t,aliases:n,structures:r,attributes:i,attributeLocations:a,attributeNames:o,visitedStructures:s}=e,c=ze(t,`:`);if(c<1||c===t.length-1)return!1;let l=He(t.slice(0,c)),u=Pe(t.slice(0,c),`location`),d=Fe(t.slice(0,c),`builtin`),f=je(Ue(t.slice(c+1)),n);if(!l||u===null||!f||u!==void 0&&d)return!1;if(u!==void 0){let e=Ne(f);return!e||a.has(u)||o.has(l)?!1:(i.push({name:l,location:u,type:e}),a.add(u),o.add(l),!0)}if(d)return!0;let p=r.get(f);if(!p||s.has(f))return!1;let m=Re(p,`,`);if(!m)return!1;s.add(f);for(let t of m)if(t.length>0&&!Ae({...e,declaration:t}))return!1;return s.delete(f),!0}function je(e,t,n=new Set){let r=ye(e),i=``;for(let e of r){let r=t.get(e.value);if(!r){i+=Me(e.value);continue}if(n.has(e.value))return null;let a=new Set(n);a.add(e.value);let o=je(r,t,a);if(!o)return null;i+=o}return i}function Me(e){let t=/^(vec[234]|mat[234]x[234])([fiuh])$/.exec(e);if(!t)return e;let n={f:`f32`,i:`i32`,u:`u32`,h:`f16`}[t[2]];return`${t[1]}<${n}>`}function Ne(e){return/^(?:i32|u32|f32|f16|vec[234]<(?:i32|u32|f32|f16)>)$/.test(e)?e:null}function Pe(e,t){let n;for(let r=0;r<e.length;r++)if(e[r].value===`@`&&e[r+1]?.value===t){if(n!==void 0||e[r+2]?.value!==`(`||!/^\d+$/.test(e[r+3]?.value||``)||e[r+4]?.value!==`)`)return null;n=Number(e[r+3].value)}return n}function Fe(e,t){return e.some((n,r)=>n.value===`@`&&e[r+1]?.value===t)}function Ie(e){return e.replace(`_`,`-`)}function Le(e,t,n,r){let i=0;for(let a=t;a<e.length;a++)if(e[a].value===n)i++;else if(e[a].value===r&&--i===0)return a;return-1}function Re(e,t){let n=[],r=0,i={"(":0,"<":0,"[":0,"{":0},a=Object.keys(i),o={")":`(`,">":`<`,"]":`[`,"}":`{`};for(let s=0;s<e.length;s++){let c=e[s].value;if(c===t&&a.every(e=>i[e]===0)){n.push(e.slice(r,s)),r=s+1;continue}if(c in i)i[c]++;else if(c in o){let e=o[c];if(i[e]--,i[e]<0)return null}}return a.every(e=>i[e]===0)?(n.push(e.slice(r)),n):null}function ze(e,t){let n=Re(e,t);return n&&n.length===2?n[0].length:-1}function Be(e,t,n,r){for(let i=n;i<e.length;i++)if(t[i]===0&&e[i].value===r)return i;return-1}function Ve(e,t,n){for(let r=n-1;r>=0;r--)if(e[r].value===`;`&&t[r]===0||e[r].value===`}`&&t[r]===1)return r+1;return 0}function He(e){for(let t=e.length-1;t>=0;t--)if(We(e[t].value))return e[t].value;return null}function Ue(e){return e.map(e=>e.value).join(``)}function We(e){return!!(e&&/^[A-Za-z_][A-Za-z0-9_]*$/.test(e))}function k(e,t){if(!e){let e=Error(t||`shadertools: assertion failed.`);throw Error.captureStackTrace?.(e,k),e}}var Ge={number:{type:`number`,validate(e,t){return Number.isFinite(e)&&typeof t==`object`&&(t.max===void 0||e<=t.max)&&(t.min===void 0||e>=t.min)}},array:{type:`array`,validate(e,t){return Array.isArray(e)||ArrayBuffer.isView(e)}}};function Ke(e){let t={};for(let[n,r]of Object.entries(e))t[n]=qe(r);return t}function qe(e){let t=Je(e);if(t!==`object`)return{value:e,...Ge[t],type:t};if(typeof e==`object`)return e?e.type===void 0?e.value===void 0?{type:`object`,value:e}:(t=Je(e.value),{...e,...Ge[t],type:t}):{...e,...Ge[e.type],type:e.type}:{type:`object`,value:null};throw Error(`props`)}function Je(e){return Array.isArray(e)||ArrayBuffer.isView(e)?`array`:typeof e}var Ye={vertex:`#ifdef MODULE_LOGDEPTH
  logdepth_adjustPosition(gl_Position);
#endif
`,fragment:`#ifdef MODULE_MATERIAL
  fragColor = material_filterColor(fragColor);
#endif

#ifdef MODULE_LIGHTING
  fragColor = lighting_filterColor(fragColor);
#endif

#ifdef MODULE_FOG
  fragColor = fog_filterColor(fragColor);
#endif

#ifdef MODULE_PICKING
  fragColor = picking_filterHighlightColor(fragColor);
  fragColor = picking_filterPickingColor(fragColor);
#endif

#ifdef MODULE_LOGDEPTH
  logdepth_setFragDepth();
#endif
`},Xe=/void\s+main\s*\([^)]*\)\s*\{\n?/,Ze=/}\n?[^{}]*$/,Qe=[],$e=`__LUMA_INJECT_DECLARATIONS__`;function et(e){let t={vertex:{},fragment:{}};for(let n in e){let r=e[n],i=tt(n);typeof r==`string`&&(r={order:0,injection:r}),t[i][n]=r}return t}function tt(e){let t=e.slice(0,2);switch(t){case`vs`:return`vertex`;case`fs`:return`fragment`;default:throw Error(t)}}function nt(e,t,n,r=!1,i=`glsl`,a={}){let o=t===`vertex`;for(let t in n){let r=n[t];r.sort((e,t)=>e.order-t.order),Qe.length=r.length;for(let e=0,t=r.length;e<t;++e)Qe[e]=r[e].injection;let s=`${Qe.join(`
`)}\n`;switch(t){case`vs:#decl`:(i===`wgsl`||o)&&(e=e.replace($e,s));break;case`vs:#main-start`:(i===`wgsl`||o)&&(e=i===`wgsl`?rt(e,`vertex`,s,`start`,a.vertex):e.replace(Xe,e=>e+s));break;case`vs:#main-end`:(i===`wgsl`||o)&&(e=i===`wgsl`?rt(e,`vertex`,s,`end`,a.vertex):e.replace(Ze,e=>s+e));break;case`fs:#decl`:(i===`wgsl`||!o)&&(e=e.replace($e,s));break;case`fs:#main-start`:(i===`wgsl`||!o)&&(e=i===`wgsl`?rt(e,`fragment`,s,`start`,a.fragment):e.replace(Xe,e=>e+s));break;case`fs:#main-end`:(i===`wgsl`||!o)&&(e=i===`wgsl`?rt(e,`fragment`,s,`end`,a.fragment):e.replace(Ze,e=>s+e));break;default:e=e.replace(t,e=>e+s)}}return e=e.replace($e,``),r&&(e=e.replace(/\}\s*$/,e=>e+Ye[t])),e}function rt(e,t,n,r,i){let a=it(e,t,i);if(!a)return e;if(r===`start`){let t=a.openBraceIndex+1;return`${e.slice(0,t)}\n${n}${e.slice(t)}`}return`${e.slice(0,a.closeBraceIndex)}${n}${e.slice(a.closeBraceIndex)}`}function it(e,t,n){let r=t===`vertex`?`@vertex`:`@fragment`,i=e.indexOf(r);if(i<0)return null;let a=n?e.search(RegExp(`\\bfn\\s+${at(n)}\\s*\\(`)):e.indexOf(`fn`,i);if(a<0)return null;let o=e.indexOf(`{`,a);if(o<0)return null;let s=0;for(let t=o;t<e.length;t++){let n=e[t];if(n===`{`)s++;else if(n===`}`&&(s--,s===0))return{openBraceIndex:o,closeBraceIndex:t}}return null}function at(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function ot(e){e.map(e=>st(e))}function st(e){if(e.instance)return;ot(e.dependencies||[]);let{propTypes:t={},deprecations:n=[],inject:r={}}=e,i={normalizedInjections:et(r),parsedDeprecations:lt(n)};t&&(i.propValidators=Ke(t)),e.instance=i;let a={};t&&(a=Object.entries(t).reduce((e,[t,n])=>{let r=n?.value;return r&&(e[t]=r),e},{})),e.defaultUniforms={...e.defaultUniforms,...a}}function ct(e,t,n){e.deprecations?.forEach(e=>{e.regex?.test(t)&&(e.deprecated?n.deprecated(e.old,e.new)():n.removed(e.old,e.new)())})}function lt(e){return e.forEach(e=>{switch(e.type){case`function`:e.regex=RegExp(`\\b${e.old}\\(`);break;default:e.regex=RegExp(`${e.type} ${e.old};`)}}),e}function ut(e){ot(e);let t={},n={};dt({modules:e,level:0,moduleMap:t,moduleDepth:n});let r=Object.keys(n).sort((e,t)=>n[t]-n[e]).map(e=>t[e]);return ot(r),r}function dt(e){let{modules:t,level:n,moduleMap:r,moduleDepth:i}=e;if(n>=5)throw Error(`Possible loop in shader dependency graph`);for(let e of t)r[e.name]=e,(i[e.name]===void 0||i[e.name]<n)&&(i[e.name]=n);for(let e of t)e.dependencies&&dt({modules:e.dependencies,level:n+1,moduleMap:r,moduleDepth:i})}var ft={id:null,powerPreference:`high-performance`,failIfMajorPerformanceCaveat:!1,featureLevel:void 0,optionalFeatures:[],xrCompatible:!1,createCanvasContext:void 0,webgl:{},onError:(e,t)=>{},onResize:(e,t)=>{let[n,r]=e.getDevicePixelSize();T.log(1,`${e} resized => ${n}x${r}px`)()},onPositionChange:(e,t)=>{let[n,r]=e.getPosition();T.log(1,`${e} repositioned => ${n},${r}`)()},onVisibilityChange:e=>T.log(1,`${e} Visibility changed ${e.isVisible}`)(),onDevicePixelRatioChange:(e,t)=>T.log(1,`${e} DPR changed ${t.oldRatio} => ${e.devicePixelRatio}`)(),debug:mt(),debugGPUTime:!1,debugShaders:T.get(`debug-shaders`)||void 0,debugFramebuffers:!!T.get(`debug-framebuffers`),debugFactories:!!T.get(`debug-factories`),debugWebGL:!!T.get(`debug-webgl`),debugSpectorJS:void 0,debugSpectorJSUrl:void 0,_reuseDevices:!1,_cacheShaders:!0,_destroyShaders:!1,_cachePipelines:!0,_sharePipelines:!0,_destroyPipelines:!1,_initializeFeatures:!0,_disabledFeatures:{"compilation-status-async-webgl":!0},_handle:void 0};function pt(e,t){return e==null?t!==void 0&&t!==`production`:!!e}function mt(){return pt(T.get(`debug`),ht())}function ht(){let e=globalThis.process;if(e?.env)return e.env.NODE_ENV}var gt=`GPU Time and Memory`,_t=[`Adapter`,`GPU`,`GPU Type`,`GPU Backend`,`Frame Rate`,`CPU Time`,`GPU Time`,`GPU Memory`,`Buffer Memory`,`Texture Memory`,`External Buffer Memory`,`External Texture Memory`,`Swap Chain Texture`],vt=new WeakMap,yt=new WeakMap,bt=new class{stats=new Map;getStats(e){return this.get(e)}get(e){this.stats.has(e)||this.stats.set(e,new ae({id:e}));let t=this.stats.get(e);return e===gt&&xt(t,_t),t}};function xt(e,t){let n=e.stats,r=!1;for(let i of t)n[i]||(e.get(i),r=!0);let i=Object.keys(n).length,a=vt.get(e);if(!r&&a?.orderedStatNames===t&&a.statCount===i)return;let o={},s=yt.get(t);s||(s=new Set(t),yt.set(t,s));for(let e of t)n[e]&&(o[e]=n[e]);for(let[e,t]of Object.entries(n))s.has(e)||(o[e]=t);for(let e of Object.keys(n))delete n[e];Object.assign(n,o),vt.set(e,{orderedStatNames:t,statCount:i})}var A=`texture-compression-bc`,j=`texture-compression-astc`,M=`texture-compression-etc2`,St=`texture-compression-etc1-webgl`,Ct=`texture-compression-pvrtc-webgl`,wt=`texture-compression-atc-webgl`,Tt=`float32-renderable-webgl`,Et=`float16-renderable-webgl`,Dt=`rgb9e5ufloat-renderable-webgl`,Ot=`snorm8-renderable-webgl`,N=`norm16-webgl`,kt=`norm16-renderable-webgl`,At=`snorm16-renderable-webgl`,jt=`float32-filterable`,Mt=`float16-filterable-webgl`,P=3,Nt=5,Pt=15,F=19,Ft=31,I=992,It=15360;function Lt(e){let t=Vt[e];if(!t)throw Error(`Unsupported texture format ${e}`);return t}function Rt(){return Vt}var zt={r8unorm:{webgpu:527},rg8unorm:{webgpu:527},"rgb8unorm-webgl":{},rgba8unorm:{webgpu:Ft},"rgba8unorm-srgb":{webgpu:Pt},r8snorm:{render:Ot,webgpu:837},rg8snorm:{render:Ot,webgpu:837},"rgb8snorm-webgl":{},rgba8snorm:{render:Ot,webgpu:341},r8uint:{webgpu:515},rg8uint:{webgpu:515},rgba8uint:{webgpu:F},r8sint:{webgpu:515},rg8sint:{webgpu:515},rgba8sint:{webgpu:F},bgra8unorm:{webgpu:Pt},"bgra8unorm-srgb":{webgpu:It},r16unorm:{f:N,render:kt,webgpu:I},rg16unorm:{f:N,render:kt,webgpu:I},"rgb16unorm-webgl":{f:N,render:!1},rgba16unorm:{f:N,render:kt,webgpu:I},r16snorm:{f:N,render:At,webgpu:I},rg16snorm:{f:N,render:At,webgpu:I},"rgb16snorm-webgl":{f:N,render:!1},rgba16snorm:{f:N,render:At,webgpu:I},r16uint:{webgpu:515},rg16uint:{webgpu:515},rgba16uint:{webgpu:F},r16sint:{webgpu:515},rg16sint:{webgpu:515},rgba16sint:{webgpu:F},r16float:{render:Et,filter:`float16-filterable-webgl`,webgpu:527},rg16float:{render:Et,filter:Mt,webgpu:527},rgba16float:{render:Et,filter:Mt,webgpu:Ft},r32uint:{webgpu:F},rg32uint:{webgpu:16387},rgba32uint:{webgpu:F},r32sint:{webgpu:F},rg32sint:{webgpu:16387},rgba32sint:{webgpu:F},r32float:{render:Tt,filter:jt,webgpu:F},rg32float:{render:!1,filter:jt,webgpu:16387},"rgb32float-webgl":{render:Tt,filter:jt},rgba32float:{render:Tt,filter:jt,webgpu:F},"rgba4unorm-webgl":{channels:`rgba`,bitsPerChannel:[4,4,4,4],packed:!0},"rgb565unorm-webgl":{channels:`rgb`,bitsPerChannel:[5,6,5,0],packed:!0},"rgb5a1unorm-webgl":{channels:`rgba`,bitsPerChannel:[5,5,5,1],packed:!0},rgb9e5ufloat:{channels:`rgb`,packed:!0,render:Dt,webgpu:Nt},rg11b10ufloat:{channels:`rgb`,bitsPerChannel:[11,11,10,0],packed:!0,p:1,render:Tt,webgpu:517},rgb10a2unorm:{channels:`rgba`,bitsPerChannel:[10,10,10,2],packed:!0,p:1,webgpu:527},rgb10a2uint:{channels:`rgba`,bitsPerChannel:[10,10,10,2],packed:!0,p:1,webgpu:515},stencil8:{attachment:`stencil`,bitsPerChannel:[8,0,0,0],dataType:`uint8`,webgpu:P},depth16unorm:{attachment:`depth`,bitsPerChannel:[16,0,0,0],dataType:`uint16`,webgpu:P},depth24plus:{attachment:`depth`,bitsPerChannel:[24,0,0,0],dataType:`uint32`,webgpu:P},depth32float:{attachment:`depth`,bitsPerChannel:[32,0,0,0],dataType:`float32`,webgpu:P},"depth24plus-stencil8":{attachment:`depth-stencil`,bitsPerChannel:[24,8,0,0],packed:!0,webgpu:P},"depth32float-stencil8":{attachment:`depth-stencil`,bitsPerChannel:[32,8,0,0],packed:!0,f:`depth32float-stencil8`,webgpu:P}},Bt={"bc1-rgb-unorm-webgl":{f:A},"bc1-rgb-unorm-srgb-webgl":{f:A},"bc1-rgba-unorm":{f:A},"bc1-rgba-unorm-srgb":{f:A},"bc2-rgba-unorm":{f:A},"bc2-rgba-unorm-srgb":{f:A},"bc3-rgba-unorm":{f:A},"bc3-rgba-unorm-srgb":{f:A},"bc4-r-unorm":{f:A},"bc4-r-snorm":{f:A},"bc5-rg-unorm":{f:A},"bc5-rg-snorm":{f:A},"bc6h-rgb-ufloat":{f:A},"bc6h-rgb-float":{f:A},"bc7-rgba-unorm":{f:A},"bc7-rgba-unorm-srgb":{f:A},"etc2-rgb8unorm":{f:M},"etc2-rgb8unorm-srgb":{f:M},"etc2-rgb8a1unorm":{f:M},"etc2-rgb8a1unorm-srgb":{f:M},"etc2-rgba8unorm":{f:M},"etc2-rgba8unorm-srgb":{f:M},"eac-r11unorm":{f:M},"eac-r11snorm":{f:M},"eac-rg11unorm":{f:M},"eac-rg11snorm":{f:M},"astc-4x4-unorm":{f:j},"astc-4x4-unorm-srgb":{f:j},"astc-5x4-unorm":{f:j},"astc-5x4-unorm-srgb":{f:j},"astc-5x5-unorm":{f:j},"astc-5x5-unorm-srgb":{f:j},"astc-6x5-unorm":{f:j},"astc-6x5-unorm-srgb":{f:j},"astc-6x6-unorm":{f:j},"astc-6x6-unorm-srgb":{f:j},"astc-8x5-unorm":{f:j},"astc-8x5-unorm-srgb":{f:j},"astc-8x6-unorm":{f:j},"astc-8x6-unorm-srgb":{f:j},"astc-8x8-unorm":{f:j},"astc-8x8-unorm-srgb":{f:j},"astc-10x5-unorm":{f:j},"astc-10x5-unorm-srgb":{f:j},"astc-10x6-unorm":{f:j},"astc-10x6-unorm-srgb":{f:j},"astc-10x8-unorm":{f:j},"astc-10x8-unorm-srgb":{f:j},"astc-10x10-unorm":{f:j},"astc-10x10-unorm-srgb":{f:j},"astc-12x10-unorm":{f:j},"astc-12x10-unorm-srgb":{f:j},"astc-12x12-unorm":{f:j},"astc-12x12-unorm-srgb":{f:j},"pvrtc-rgb4unorm-webgl":{f:Ct},"pvrtc-rgba4unorm-webgl":{f:Ct},"pvrtc-rgb2unorm-webgl":{f:Ct},"pvrtc-rgba2unorm-webgl":{f:Ct},"etc1-rbg-unorm-webgl":{f:St},"atc-rgb-unorm-webgl":{f:wt},"atc-rgba-unorm-webgl":{f:wt},"atc-rgbai-unorm-webgl":{f:wt}},Vt={...zt,...Bt},Ht=/^(r|rg|rgb|rgba|bgra)([0-9]*)([a-z]*)(-srgb)?(-webgl)?$/,Ut=[`rgb`,`rgba`,`bgra`],Wt=[`depth`,`stencil`],Gt=5,Kt=[`bc1`,`bc2`,`bc3`,`bc4`,`bc5`,`bc6`,`bc7`,`etc1`,`etc2`,`eac`,`atc`,`astc`,`pvrtc`],L=new class{isColor(e){return Ut.some(t=>e.startsWith(t))}isDepthStencil(e){return Wt.some(t=>e.startsWith(t))}isCompressed(e){return Kt.some(t=>e.startsWith(t))}getInfo(e){return Yt(e)}getCapabilities(e){return Jt(e)}getWebGPUCapabilities(e){let t=Lt(e);return t.webgpu===void 0?this.isCompressed(e)&&!e.endsWith(`-webgl`)?Gt:0:t.webgpu}computeMemoryLayout(e){return qt(e)}};function qt({format:e,width:t,height:n,depth:r,byteAlignment:i}){let{bytesPerPixel:a,bytesPerBlock:o=a,blockWidth:s=1,blockHeight:c=1,compressed:l=!1}=L.getInfo(e),u=l?Math.ceil(t/s):t,d=l?Math.ceil(n/c):n,f=u*o,p=Math.ceil(f/i)*i,m=d,h=p*m*r;return{bytesPerPixel:a,bytesPerRow:p,rowsPerImage:m,depthOrArrayLayers:r,bytesPerImage:p*m,byteLength:h}}function Jt(e){let t=Lt(e),n={format:e,create:t.f??!0,render:t.render??!0,filter:t.filter??!0,blend:t.blend??!0,store:t.store??!0},r=Yt(e),i=e.startsWith(`depth`)||e.startsWith(`stencil`),a=r?.signed,o=r?.integer,s=r?.webgl,c=!!r?.compressed;return n.render&&=!i&&!c,n.filter&&=!i&&!a&&!o&&!s,n}function Yt(e){let t=Xt(e);if(L.isCompressed(e)){t.channels=`rgb`,t.components=3,t.bytesPerPixel=1,t.srgb=!1,t.compressed=!0,t.bytesPerBlock=Qt(e);let n=Zt(e);n&&(t.blockWidth=n.blockWidth,t.blockHeight=n.blockHeight)}let n=t.packed?null:Ht.exec(e);if(n){let[,r,i,a,o,s]=n,c=`${a}${i}`,l=S.getDataTypeInfo(c),u=l.byteLength*8,d=r?.length??1,f=[u,d>=2?u:0,d>=3?u:0,d>=4?u:0];t={format:e,attachment:t.attachment,dataType:l.signedType,components:d,channels:r,integer:l.integer,signed:l.signed,normalized:l.normalized,bitsPerChannel:f,bytesPerPixel:l.byteLength*d,packed:t.packed,srgb:t.srgb},s===`-webgl`&&(t.webgl=!0),o===`-srgb`&&(t.srgb=!0)}return e.endsWith(`-webgl`)&&(t.webgl=!0),e.endsWith(`-srgb`)&&(t.srgb=!0),t}function Xt(e){let t={...Lt(e)},n=t.bytesPerPixel||1,r=t.bitsPerChannel||[8,8,8,8];return delete t.bitsPerChannel,delete t.bytesPerPixel,delete t.f,delete t.render,delete t.filter,delete t.blend,delete t.store,delete t.webgpu,{...t,format:e,attachment:t.attachment||`color`,channels:t.channels||`r`,components:t.components||t.channels?.length||1,bytesPerPixel:n,bitsPerChannel:r,dataType:t.dataType||`uint8`,srgb:t.srgb??!1,packed:t.packed??!1,webgl:t.webgl??!1,integer:t.integer??!1,signed:t.signed??!1,normalized:t.normalized??!1,compressed:t.compressed??!1}}function Zt(e){let t=/.*-(\d+)x(\d+)-.*/.exec(e);if(t){let[,e,n]=t;return{blockWidth:Number(e),blockHeight:Number(n)}}return e.startsWith(`bc`)||e.startsWith(`etc1`)||e.startsWith(`etc2`)||e.startsWith(`eac`)||e.startsWith(`atc`)||e.startsWith(`pvrtc-rgb4`)||e.startsWith(`pvrtc-rgba4`)?{blockWidth:4,blockHeight:4}:e.startsWith(`pvrtc-rgb2`)||e.startsWith(`pvrtc-rgba2`)?{blockWidth:8,blockHeight:4}:null}function Qt(e){return e.startsWith(`bc1`)||e.startsWith(`bc4`)||e.startsWith(`etc1`)||e.startsWith(`etc2-rgb8`)||e.startsWith(`etc2-rgb8a1`)||e.startsWith(`eac-r11`)||e===`atc-rgb-unorm-webgl`?8:e.startsWith(`bc2`)||e.startsWith(`bc3`)||e.startsWith(`bc5`)||e.startsWith(`bc6h`)||e.startsWith(`bc7`)||e.startsWith(`etc2-rgba8`)||e.startsWith(`eac-rg11`)||e.startsWith(`astc`)||e===`atc-rgba-unorm-webgl`||e===`atc-rgbai-unorm-webgl`?16:e.startsWith(`pvrtc`)?8:16}function $t(e){return typeof ImageData<`u`&&e instanceof ImageData||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement||typeof HTMLVideoElement<`u`&&e instanceof HTMLVideoElement||typeof VideoFrame<`u`&&e instanceof VideoFrame||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas}function en(e){if(typeof ImageData<`u`&&e instanceof ImageData||typeof ImageBitmap<`u`&&e instanceof ImageBitmap||typeof HTMLCanvasElement<`u`&&e instanceof HTMLCanvasElement||typeof OffscreenCanvas<`u`&&e instanceof OffscreenCanvas)return{width:e.width,height:e.height};if(typeof HTMLImageElement<`u`&&e instanceof HTMLImageElement)return{width:e.naturalWidth,height:e.naturalHeight};if(typeof HTMLVideoElement<`u`&&e instanceof HTMLVideoElement)return{width:e.videoWidth,height:e.videoHeight};if(typeof VideoFrame<`u`&&e instanceof VideoFrame)return{width:e.displayWidth,height:e.displayHeight};throw Error(`Unknown image type`)}var tn=class{};function nn(e,t){return[rn(e),...t.map(rn).filter(e=>e!==void 0)].filter(e=>e!==void 0)}function rn(e){if(e!==void 0){if(e===null||typeof e==`string`||typeof e==`number`||typeof e==`boolean`)return e;if(e instanceof Error)return e.message;if(Array.isArray(e))return e.map(rn);if(typeof e==`object`){if(an(e)){let t=String(e);if(t!==`[object Object]`)return t}return on(e)?sn(e):e.constructor?.name||`Object`}return String(e)}}function an(e){return`toString`in e&&typeof e.toString==`function`&&e.toString!==Object.prototype.toString}function on(e){return`message`in e&&`type`in e}function sn(e){let t=typeof e.type==`string`?e.type:`message`,n=typeof e.message==`string`?e.message:``,r=typeof e.lineNum==`number`?e.lineNum:null,i=typeof e.linePos==`number`?e.linePos:null;return`${t}${r!==null&&i!==null?` @ ${r}:${i}`:r===null?``:` @ ${r}`}: ${n}`.trim()}var cn=class{features;disabledFeatures;constructor(e=[],t){this.features=new Set(e),this.disabledFeatures=t||{}}*[Symbol.iterator](){yield*this.features}has(e){return!this.disabledFeatures?.[e]&&this.features.has(e)}};function ln(){if(typeof HTMLCanvasElement>`u`)return!1;let e=HTMLCanvasElement.prototype;return`layoutSubtree`in e&&typeof e.requestPaint==`function`}var un=class e{static defaultProps={...ft};get[Symbol.toStringTag](){return`Device`}toString(){return`Device(${this.id})`}toJSON(){return this.toString()}id;props;userData={};statsManager=bt;_factories={};timestamp=0;_reused=!1;_moduleData={};wgslLanguageFeatures=new Set;_textureCaps={};_debugGPUTimeQuery=null;constructor(t){this.props={...e.defaultProps,...t},this.id=this.props.id||w(this[Symbol.toStringTag].toLowerCase())}getVertexFormatInfo(e){return ee.getVertexFormatInfo(e)}isVertexFormatSupported(e){return!0}getTextureFormatInfo(e){return L.getInfo(e)}getTextureFormatCapabilities(e){let t=this._textureCaps[e];if(!t){let n=this._getDeviceTextureFormatCapabilities(e);t=this._getDeviceSpecificTextureFormatCapabilities(n),this._textureCaps[e]=t}return t}getMipLevelCount(e,t,n=1){return 1+Math.floor(Math.log2(Math.max(e,t,n)))}isExternalImage(e){return $t(e)}getExternalImageSize(e){return en(e)}isTextureFormatSupported(e){return this.getTextureFormatCapabilities(e).create}isTextureFormatFilterable(e){return this.getTextureFormatCapabilities(e).filter}isTextureFormatRenderable(e){return this.getTextureFormatCapabilities(e).render}isTextureFormatCompressed(e){return L.isCompressed(e)}getSupportedCompressedTextureFormats(){let e=[];for(let t of Object.keys(Rt()))this.isTextureFormatCompressed(t)&&this.isTextureFormatSupported(t)&&e.push(t);return e}pushDebugGroup(e){this.commandEncoder.pushDebugGroup(e)}popDebugGroup(){this.commandEncoder?.popDebugGroup()}insertDebugMarker(e){this.commandEncoder?.insertDebugMarker(e)}loseDevice(){return!1}incrementTimestamp(){return this.timestamp++}reportError(e,t,...n){if(!this.props.onError(e,t)){let r=nn(t,n);return T.error(this.type===`webgl`?`%cWebGL`:`%cWebGPU`,`color: white; background: red; padding: 2px 6px; border-radius: 3px;`,e.message,...r)}return()=>{}}debug(){if(this.props.debug)debugger;else T.once(0,`'Type luma.log.set({debug: true}) in console to enable debug breakpoints',
or create a device with the 'debug: true' prop.`)()}getDefaultCanvasContext(){if(!this.canvasContext)throw Error(`Device has no default CanvasContext. See props.createCanvasContext`);return this.canvasContext}createFence(){throw Error(`createFence() not implemented`)}beginRenderPass(e){return this.commandEncoder.beginRenderPass(e)}beginComputePass(e){return this.commandEncoder.beginComputePass(e)}writeBufferViaCommandEncoder(e,t,n,r=0){throw Error(`writeBufferViaCommandEncoder() not implemented`)}generateMipmapsWebGPU(e){throw Error(`not implemented`)}_createSharedRenderPipelineWebGL(e){throw Error(`_createSharedRenderPipelineWebGL() not implemented`)}_createBindGroupLayoutWebGPU(e,t){throw Error(`_createBindGroupLayoutWebGPU() not implemented`)}_createBindGroupWebGPU(e,t,n,r,i){throw Error(`_createBindGroupWebGPU() not implemented`)}_supportsDebugGPUTime(){return this.features.has(`timestamp-query`)&&!!(this.props.debug||this.props.debugGPUTime)}_enableDebugGPUTime(e=256){if(!this._supportsDebugGPUTime())return null;if(this._debugGPUTimeQuery)return this._debugGPUTimeQuery;try{this._debugGPUTimeQuery=this.createQuerySet({type:`timestamp`,count:e}),this.commandEncoder=this.createCommandEncoder({id:this.commandEncoder.props.id,timeProfilingQuerySet:this._debugGPUTimeQuery})}catch{this._debugGPUTimeQuery=null}return this._debugGPUTimeQuery}_disableDebugGPUTime(){this._debugGPUTimeQuery&&=(this.commandEncoder.getTimeProfilingQuerySet()===this._debugGPUTimeQuery&&(this.commandEncoder=this.createCommandEncoder({id:this.commandEncoder.props.id})),this._debugGPUTimeQuery.destroy(),null)}_isDebugGPUTimeEnabled(){return this._debugGPUTimeQuery!==null}getCanvasContext(){return this.getDefaultCanvasContext()}readPixelsToArrayWebGL(e,t){throw Error(`not implemented`)}readPixelsToBufferWebGL(e,t){throw Error(`not implemented`)}setParametersWebGL(e){throw Error(`not implemented`)}getParametersWebGL(e){throw Error(`not implemented`)}withParametersWebGL(e,t){throw Error(`not implemented`)}clearWebGL(e){throw Error(`not implemented`)}resetWebGL(){throw Error(`not implemented`)}getModuleData(e){return this._moduleData[e]||={},this._moduleData[e]}static _getCanvasContextProps(e){return e.createCanvasContext===!0?{}:e.createCanvasContext}_getDeviceTextureFormatCapabilities(e){let t=L.getCapabilities(e),n=e=>(typeof e==`string`?this.features.has(e):e)??!0,r=n(t.create);return{format:e,create:r,render:r&&n(t.render),filter:r&&n(t.filter),blend:r&&n(t.blend),store:r&&n(t.store)}}_normalizeBufferProps(e){(e instanceof ArrayBuffer||ArrayBuffer.isView(e))&&(e={data:e});let t={...e};if((e.usage||0)&ne.INDEX&&(e.indexType||(e.data instanceof Uint32Array?t.indexType=`uint32`:e.data instanceof Uint16Array?t.indexType=`uint16`:e.data instanceof Uint8Array&&(t.data=new Uint16Array(e.data),t.indexType=`uint16`)),!t.indexType))throw Error(`indices buffer content must be of type uint16 or uint32`);return t}},dn=class e extends C{static defaultProps={...C.defaultProps,type:`color-sampler`,addressModeU:`clamp-to-edge`,addressModeV:`clamp-to-edge`,addressModeW:`clamp-to-edge`,magFilter:`nearest`,minFilter:`nearest`,mipmapFilter:`none`,lodMinClamp:0,lodMaxClamp:32,compare:`less-equal`,maxAnisotropy:1};get[Symbol.toStringTag](){return`Sampler`}constructor(t,n){n=e.normalizeProps(t,n),super(t,n,e.defaultProps)}static normalizeProps(e,t){return t}},fn={"1d":`1d`,"2d":`2d`,"2d-array":`2d`,cube:`2d`,"cube-array":`2d`,"3d":`3d`},pn=class e extends C{static SAMPLE=4;static STORAGE=8;static RENDER=16;static COPY_SRC=1;static COPY_DST=2;static TEXTURE=4;static RENDER_ATTACHMENT=16;dimension;baseDimension;format;width;height;depth;mipLevels;samples;byteAlignment;ready=Promise.resolve(this);isReady=!0;updateTimestamp;get[Symbol.toStringTag](){return`Texture`}toString(){return`Texture(${this.id},${this.format},${this.width}x${this.height})`}constructor(t,n,r){if(n=e.normalizeProps(t,n),super(t,n,e.defaultProps),this.dimension=this.props.dimension,this.baseDimension=fn[this.dimension],this.format=this.props.format,this.width=this.props.width,this.height=this.props.height,this.depth=this.props.depth,this.mipLevels=this.props.mipLevels,this.samples=this.props.samples||1,this.dimension===`cube`&&(this.depth=6),this.props.width===void 0||this.props.height===void 0){if(t.isExternalImage(n.data)){let e=t.getExternalImageSize(n.data);this.width=e?.width||1,this.height=e?.height||1}else this.width=1,this.height=1,(this.props.width===void 0||this.props.height===void 0)&&T.warn(`${this} created with undefined width or height. This is deprecated. Use DynamicTexture instead.`)()}this.byteAlignment=r?.byteAlignment||1,this.updateTimestamp=t.incrementTimestamp()}clone(e){return this.device.createTexture({...this.props,...e})}setSampler(e){this.sampler=e instanceof dn?e:this.device.createSampler(e)}copyImageData(e){let{data:t,depth:n,...r}=e;this.writeData(t,{...r,depthOrArrayLayers:r.depthOrArrayLayers??n})}computeMemoryLayout(e={}){let{width:t=this.width,height:n=this.height,depthOrArrayLayers:r=this.depth}=this._normalizeTextureReadOptions(e),{format:i,byteAlignment:a}=this;return L.computeMemoryLayout({format:i,width:t,height:n,depth:r,byteAlignment:a})}readBuffer(e,t){throw Error(`readBuffer not implemented`)}readDataAsync(e){throw Error(`readBuffer not implemented`)}writeBuffer(e,t){throw Error(`readBuffer not implemented`)}writeData(e,t){throw Error(`readBuffer not implemented`)}readDataSyncWebGL(e){throw Error(`readDataSyncWebGL not available`)}generateMipmapsWebGL(){throw Error(`generateMipmapsWebGL not available`)}static normalizeProps(e,t){let n={...t},{width:r,height:i}=n;return typeof r==`number`&&(n.width=Math.max(1,Math.ceil(r))),typeof i==`number`&&(n.height=Math.max(1,Math.ceil(i))),n}_initializeData(e){this.device.isExternalImage(e)?this.copyExternalImage({image:e,width:this.width,height:this.height,depth:this.depth,mipLevel:0,x:0,y:0,z:0,aspect:`all`,colorSpace:`srgb`,premultipliedAlpha:!1,flipY:!1}):e&&this.copyImageData({data:e,mipLevel:0,x:0,y:0,z:0,aspect:`all`})}_normalizeCopyImageDataOptions(e){let{data:t,depth:n,...r}=e,i=this._normalizeTextureWriteOptions({...r,depthOrArrayLayers:r.depthOrArrayLayers??n});return{data:t,depth:i.depthOrArrayLayers,...i}}_normalizeCopyExternalImageOptions(t){let n=e._omitUndefined(t),r=n.mipLevel??0,i=this._getMipLevelSize(r),a=this.device.getExternalImageSize(t.image),o={...e.defaultCopyExternalImageOptions,...i,...a,...n};return o.width=Math.min(o.width,i.width-o.x),o.height=Math.min(o.height,i.height-o.y),o.depth=Math.min(o.depth,i.depthOrArrayLayers-o.z),o}_normalizeCopyElementImageOptions(t){let n=e._omitUndefined(t),r=n.mipLevel??0,i=this._getMipLevelSize(r),a={...e.defaultCopyElementImageOptions,...i,...n};return a.width=Math.min(a.width,i.width-a.x),a.height=Math.min(a.height,i.height-a.y),a.depth=Math.min(a.depth,i.depthOrArrayLayers-a.z),a}_normalizeTextureReadOptions(t){let n=e._omitUndefined(t),r=n.mipLevel??0,i=this._getMipLevelSize(r),a={...e.defaultTextureReadOptions,...i,...n};return a.width=Math.min(a.width,i.width-a.x),a.height=Math.min(a.height,i.height-a.y),a.depthOrArrayLayers=Math.min(a.depthOrArrayLayers,i.depthOrArrayLayers-a.z),a}_getSupportedColorReadOptions(e){let t=this._normalizeTextureReadOptions(e),n=L.getInfo(this.format);switch(this._validateColorReadAspect(t),this._validateColorReadFormat(n),this.dimension){case`2d`:case`cube`:case`cube-array`:case`2d-array`:case`3d`:return t;default:throw Error(`${this} color readback does not support ${this.dimension} textures`)}}_validateColorReadAspect(e){if(e.aspect!==`all`)throw Error(`${this} color readback only supports aspect 'all'`)}_validateColorReadFormat(e){if(e.compressed)throw Error(`${this} color readback does not support compressed formats (${this.format})`);switch(e.attachment){case`color`:return;case`depth`:throw Error(`${this} color readback does not support depth formats (${this.format})`);case`stencil`:throw Error(`${this} color readback does not support stencil formats (${this.format})`);case`depth-stencil`:throw Error(`${this} color readback does not support depth-stencil formats (${this.format})`);default:throw Error(`${this} color readback does not support format ${this.format}`)}}_normalizeTextureWriteOptions(t){let n=e._omitUndefined(t),r=n.mipLevel??0,i=this._getMipLevelSize(r),a={...e.defaultTextureWriteOptions,...i,...n};a.width=Math.min(a.width,i.width-a.x),a.height=Math.min(a.height,i.height-a.y),a.depthOrArrayLayers=Math.min(a.depthOrArrayLayers,i.depthOrArrayLayers-a.z);let o=L.computeMemoryLayout({format:this.format,width:a.width,height:a.height,depth:a.depthOrArrayLayers,byteAlignment:this.byteAlignment}),s=o.bytesPerPixel*a.width;if(a.bytesPerRow=n.bytesPerRow??o.bytesPerRow,a.rowsPerImage=n.rowsPerImage??a.height,a.bytesPerRow<s)throw Error(`bytesPerRow (${a.bytesPerRow}) must be at least ${s} for ${this.format}`);if(a.rowsPerImage<a.height)throw Error(`rowsPerImage (${a.rowsPerImage}) must be at least ${a.height} for ${this.format}`);let c=this.device.getTextureFormatInfo(this.format).bytesPerPixel;if(c&&a.bytesPerRow%c!==0)throw Error(`bytesPerRow (${a.bytesPerRow}) must be a multiple of bytesPerPixel (${c}) for ${this.format}`);return a}_getMipLevelSize(e){return{width:Math.max(1,this.width>>e),height:this.baseDimension===`1d`?1:Math.max(1,this.height>>e),depthOrArrayLayers:this.dimension===`3d`?Math.max(1,this.depth>>e):this.depth}}getAllocatedByteLength(){let e=0;for(let t=0;t<this.mipLevels;t++){let{width:n,height:r,depthOrArrayLayers:i}=this._getMipLevelSize(t);e+=L.computeMemoryLayout({format:this.format,width:n,height:r,depth:i,byteAlignment:1}).byteLength}return e*this.samples}static _omitUndefined(e){return Object.fromEntries(Object.entries(e).filter(([,e])=>e!==void 0))}static defaultProps={...C.defaultProps,data:null,dimension:`2d`,format:`rgba8unorm`,usage:e.SAMPLE|e.RENDER|e.COPY_DST,width:void 0,height:void 0,depth:1,mipLevels:1,samples:void 0,sampler:{},view:void 0};static defaultCopyDataOptions={data:void 0,byteOffset:0,bytesPerRow:void 0,rowsPerImage:void 0,width:void 0,height:void 0,depthOrArrayLayers:void 0,depth:1,mipLevel:0,x:0,y:0,z:0,aspect:`all`};static defaultCopyExternalImageOptions={image:void 0,sourceX:0,sourceY:0,width:void 0,height:void 0,depth:1,mipLevel:0,x:0,y:0,z:0,aspect:`all`,colorSpace:`srgb`,premultipliedAlpha:!1,flipY:!1};static defaultCopyElementImageOptions={element:void 0,width:void 0,height:void 0,sourceX:0,sourceY:0,sourceWidth:void 0,sourceHeight:void 0,depth:1,mipLevel:0,x:0,y:0,z:0,aspect:`all`,colorSpace:`srgb`,premultipliedAlpha:!1,flipY:!1};static defaultTextureReadOptions={x:0,y:0,z:0,width:void 0,height:void 0,depthOrArrayLayers:1,mipLevel:0,aspect:`all`};static defaultTextureWriteOptions={byteOffset:0,bytesPerRow:void 0,rowsPerImage:void 0,x:0,y:0,z:0,width:void 0,height:void 0,depthOrArrayLayers:1,mipLevel:0,aspect:`all`}},mn=/^(?:uniform\s+)?(?:(?:lowp|mediump|highp)\s+)?[A-Za-z0-9_]+(?:<[^>]+>)?\s+([A-Za-z0-9_]+)(?:\s*\[[^\]]+\])?\s*;/,hn=/((?:layout\s*\([^)]*\)\s*)*)uniform\s+([A-Za-z_][A-Za-z0-9_]*)\s*\{([\s\S]*?)\}\s*([A-Za-z_][A-Za-z0-9_]*)?\s*;/g;function gn(e){return`${e.name}Uniforms`}function _n(e,t){let n=t===`wgsl`?e.source:t===`vertex`?e.vs:e.fs;if(!n)return null;let r=gn(e);return Sn(n,t===`wgsl`?`wgsl`:`glsl`,r)}function vn(e,t){let n=Object.keys(e.uniformTypes||{});if(!n.length)return null;let r=_n(e,t);return r?{moduleName:e.name,uniformBlockName:gn(e),stage:t,expectedUniformNames:n,actualUniformNames:r,matches:Tn(n,r)}:null}function yn(e,t,n={}){let r=vn(e,t);if(!r||r.matches)return r;let i=En(r);return n.log?.error?.(i,r)(),n.throwOnError!==!1&&k(!1,i),r}function bn(e){let t=[],n=Dn(e);for(let e of n.matchAll(hn)){let n=e[1]?.trim()||null;t.push({blockName:e[2],body:e[3],instanceName:e[4]||null,layoutQualifier:n,hasLayoutQualifier:!!n,isStd140:!!(n&&/\blayout\s*\([^)]*\bstd140\b[^)]*\)/.exec(n))})}return t}function xn(e,t,n,r){let i=bn(e).filter(e=>!e.isStd140),a=new Set;for(let e of i){if(a.has(e.blockName))continue;a.add(e.blockName);let i=r?.label?`${r.label} `:``,o=e.hasLayoutQualifier?`declares ${On(e.layoutQualifier)} instead of layout(std140)`:`does not declare layout(std140)`,s=`${i}${t} shader uniform block ${e.blockName} ${o}. luma.gl host-side shader block packing assumes explicit layout(std140) for GLSL uniform blocks. Add \`layout(std140)\` to the block declaration.`;n?.warn?.(s,e)()}return i}function Sn(e,t,n){let r=t===`wgsl`?Cn(e,n):wn(e,n);if(!r)return null;let i=[];for(let e of r.split(`
`)){let n=e.replace(/\/\/.*$/,``).trim();if(!n||n.startsWith(`#`))continue;let r=t===`wgsl`?n.match(/^([A-Za-z0-9_]+)\s*:/):n.match(mn);r&&i.push(r[1])}return i}function Cn(e,t){let n=RegExp(`\\bstruct\\s+${t}\\b`,`m`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index);if(r<0)return null;let i=0;for(let t=r;t<e.length;t++){let n=e[t];if(n===`{`){i++;continue}if(n===`}`&&(i--,i===0))return e.slice(r+1,t)}return null}function wn(e,t){return bn(e).find(e=>e.blockName===t)?.body||null}function Tn(e,t){if(e.length!==t.length)return!1;for(let n=0;n<e.length;n++)if(e[n]!==t[n])return!1;return!0}function En(e){let{expectedUniformNames:t,actualUniformNames:n}=e,r=t.filter(e=>!n.includes(e)),i=n.filter(e=>!t.includes(e)),a=[`Expected ${t.length} fields, found ${n.length}.`],o=kn(t,n);return o&&a.push(o),r.length&&a.push(`Missing from shader block (${r.length}): ${An(r)}.`),i.length&&a.push(`Unexpected in shader block (${i.length}): ${An(i)}.`),t.length<=12&&n.length<=12&&(r.length||i.length)&&(a.push(`Expected: ${t.join(`, `)}.`),a.push(`Actual: ${n.join(`, `)}.`)),`${e.moduleName}: ${e.stage} shader uniform block ${e.uniformBlockName} does not match module.uniformTypes. ${a.join(` `)}`}function Dn(e){return e.replace(/\/\*[\s\S]*?\*\//g,``).replace(/\/\/.*$/gm,``)}function On(e){return e.replace(/\s+/g,` `).trim()}function kn(e,t){let n=Math.min(e.length,t.length);for(let r=0;r<n;r++)if(e[r]!==t[r])return`First mismatch at field ${r+1}: expected ${e[r]}, found ${t[r]}.`;return e.length>t.length?`Shader block ends after field ${t.length}; expected next field ${e[t.length]}.`:t.length>e.length?`Shader block has extra field ${t.length}: ${t[e.length]}.`:null}function An(e,t=8){if(e.length<=t)return e.join(`, `);let n=e.length-t;return`${e.slice(0,t).join(`, `)}, ... (${n} more)`}function jn(e){switch(e?.gpu.toLowerCase()){case`apple`:return`#define APPLE_GPU
// Apple optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case`nvidia`:return`#define NVIDIA_GPU
// Nvidia optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
`;case`intel`:return`#define INTEL_GPU
// Intel optimizes away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Intel's built-in 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// Intel GPU doesn't have full 32 bits precision in same cases, causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`;case`amd`:return`#define AMD_GPU
`;default:return`#define DEFAULT_GPU
// Prevent driver from optimizing away the calculation necessary for emulated fp64
#define LUMA_FP64_CODE_ELIMINATION_WORKAROUND 1
// Headless Chrome's software shader 'tan' function doesn't have acceptable precision
#define LUMA_FP32_TAN_PRECISION_WORKAROUND 1
// If the GPU doesn't have full 32 bits precision, will causes overflow
#define LUMA_FP64_HIGH_BITS_OVERFLOW_WORKAROUND 1
`}}function Mn(e,t){if(Number(e.match(/^#version[ \t]+(\d+)/m)?.[1]||100)!==300)throw Error(`luma.gl v9 only supports GLSL 3.00 shader sources`);switch(t){case`vertex`:return e=In(e,Pn),e;case`fragment`:return e=In(e,Fn),e;default:throw Error(t)}}var Nn=[[/^(#version[ \t]+(100|300[ \t]+es))?[ \t]*\n/,`#version 300 es
`],[/\btexture(2D|2DProj|Cube)Lod(EXT)?\(/g,`textureLod(`],[/\btexture(2D|2DProj|Cube)(EXT)?\(/g,`texture(`]],Pn=[...Nn,[Ln(`attribute`),`in $1`],[Ln(`varying`),`out $1`]],Fn=[...Nn,[Ln(`varying`),`in $1`]];function In(e,t){for(let[n,r]of t)e=e.replace(n,r);return e}function Ln(e){return RegExp(`\\b${e}[ \\t]+(\\w+[ \\t]+\\w+(\\[\\w+\\])?;)`,`g`)}function Rn(e,t,n=`glsl`){let r=``;for(let i in e){let a=e[i];if(r+=`${n===`wgsl`?`fn`:`void`} ${a.signature} {\n`,a.header&&(r+=`  ${a.header}`),t[i]){let e=t[i];e.sort((e,t)=>e.order-t.order);for(let t of e)r+=`  ${t.injection}\n`}a.footer&&(r+=`  ${a.footer}`),r+=`}
`}return r}function zn(e){let t={vertex:{},fragment:{}};for(let n of e){let e,r;typeof n==`string`?(e={},r=n):(e=n,r=e.hook),r=r.trim();let i=r.indexOf(`:`),a=r.slice(0,i),o=r.slice(i+1),s=r.replace(/\(.+/,``),c=Object.assign(e,{signature:o});switch(a){case`vs`:t.vertex[s]=c;break;case`fs`:t.fragment[s]=c;break;default:throw Error(a)}}return t}function Bn(e,t){return{name:Vn(e,t),language:`glsl`,version:Hn(e)}}function Vn(e,t=`unnamed`){let n=/#define[^\S\r\n]*SHADER_NAME[^\S\r\n]*([A-Za-z0-9_-]+)\s*/.exec(e);return n?n[1]:t}function Hn(e){let t=100,n=e.match(/[^\s]+/g);if(n&&n.length>=2&&n[0]===`#version`){let e=parseInt(n[1],10);Number.isFinite(e)&&(t=e)}if(t!==100&&t!==300)throw Error(`Invalid GLSL version ${t}`);return t}var Un=[RegExp(`@binding\\(\\s*(\\d+)\\s*\\)\\s*@group\\(\\s*(\\d+)\\s*\\)\\s*${E}\\s*:\\s*([^;]+);`,`g`),RegExp(`@group\\(\\s*(\\d+)\\s*\\)\\s*@binding\\(\\s*(\\d+)\\s*\\)\\s*${E}\\s*:\\s*([^;]+);`,`g`)];function Wn(e,t=[]){let n=me(e),r=new Map;for(let e of t)r.set(Kn(e.name,e.group,e.location),e.moduleName);let i=[];for(let e of Un){e.lastIndex=0;let t;for(t=e.exec(n);t;){let a=e===Un[0],o=Number(t[a?1:2]),s=Number(t[a?2:1]),c=t[3]?.trim(),l=t[4],u=t[5].trim(),d=r.get(Kn(l,s,o));i.push(Gn({name:l,group:s,binding:o,owner:d?`module`:`application`,moduleName:d,accessDeclaration:c,resourceType:u})),t=e.exec(n)}}return i.sort((e,t)=>e.group===t.group?e.binding===t.binding?e.name.localeCompare(t.name):e.binding-t.binding:e.group-t.group)}function Gn(e){let t={name:e.name,group:e.group,binding:e.binding,owner:e.owner,kind:`unknown`,moduleName:e.moduleName,resourceType:e.resourceType};if(e.accessDeclaration){let n=e.accessDeclaration.split(`,`).map(e=>e.trim());if(n[0]===`uniform`)return{...t,kind:`uniform`,access:`uniform`};if(n[0]===`storage`){let e=n[1]||`read_write`;return{...t,kind:e===`read`?`read-only-storage`:`storage`,access:e}}}return e.resourceType===`sampler`||e.resourceType===`sampler_comparison`?{...t,kind:`sampler`,samplerKind:e.resourceType===`sampler_comparison`?`comparison`:`filtering`}:e.resourceType.startsWith(`texture_storage_`)?{...t,kind:`storage-texture`,access:Yn(e.resourceType),viewDimension:qn(e.resourceType)}:e.resourceType.startsWith(`texture_`)?{...t,kind:`texture`,viewDimension:qn(e.resourceType),sampleType:Jn(e.resourceType),multisampled:e.resourceType.startsWith(`texture_multisampled_`)}:t}function Kn(e,t,n){return`${t}:${n}:${e}`}function qn(e){if(e.includes(`cube_array`))return`cube-array`;if(e.includes(`2d_array`))return`2d-array`;if(e.includes(`cube`))return`cube`;if(e.includes(`3d`))return`3d`;if(e.includes(`2d`))return`2d`;if(e.includes(`1d`))return`1d`}function Jn(e){if(e.startsWith(`texture_depth_`))return`depth`;if(e.includes(`<i32>`))return`sint`;if(e.includes(`<u32>`))return`uint`;if(e.includes(`<f32>`))return`float`}function Yn(e){return/,\s*([A-Za-z_][A-Za-z0-9_]*)\s*>$/.exec(e)?.[1]}var R=`([a-zA-Z_][a-zA-Z0-9_]*)`,Xn=/^\s*\#\s*if\s+(.+?)\s*(?:\/\/.*)?$/,Zn=RegExp(`^\\s*\\#\\s*ifdef\\s*${R}\\s*$`),Qn=RegExp(`^\\s*\\#\\s*ifndef\\s*${R}\\s*(?:\\/\\/.*)?$`),$n=/^\s*\#\s*else\s*(?:\/\/.*)?$/,er=/^\s*\#\s*endif\s*$/,tr=RegExp(`^\\s*\\#\\s*ifdef\\s*${R}\\s*(?:\\/\\/.*)?$`),nr=/^\s*\#\s*endif\s*(?:\/\/.*)?$/;function rr(e,t){let n=e.split(`
`),r=[],i=[],a=!0;for(let e of n){let n=e.match(Xn),o=e.match(tr)||e.match(Zn),s=e.match(Qn),c=e.match($n),l=e.match(nr)||e.match(er);if(n){let e=ir(n[1],t?.defines||{}),r=a&&e;i.push({parentActive:a,branchTaken:e,active:r}),a=r}else if(o||s){let e=(o||s)?.[1],n=!!t?.defines?.[e],r=o?n:!n,c=a&&r;i.push({parentActive:a,branchTaken:r,active:c}),a=c}else if(c){let e=i[i.length-1];if(!e)throw Error(`Encountered #else without matching #if, #ifdef or #ifndef`);e.active=e.parentActive&&!e.branchTaken,e.branchTaken=!0,a=e.active}else l?(i.pop(),a=!i.length||i[i.length-1].active):a&&r.push(e)}if(i.length>0)throw Error(`Unterminated conditional block in shader source`);return r.join(`
`)}function ir(e,t){let n=e.trim();if(/^[+-]?\d+(?:\.\d+)?$/.test(n))return Number(n)!==0;if(n===`true`)return!0;if(n===`false`)return!1;let r=n.match(RegExp(`^!\\s*${R}$`));if(r)return!t[r[1]];let i=n.match(RegExp(`^${R}$`));if(i)return!!t[i[1]];let a=n.match(RegExp(`^defined\\s*\\(\\s*${R}\\s*\\)$`));if(a)return t[a[1]]!==void 0;let o=n.match(RegExp(`^!\\s*defined\\s*\\(\\s*${R}\\s*\\)$`));if(o)return t[o[1]]===void 0;throw Error(`Unsupported #if expression "${e}"`)}function ar(e,t){let n=[];for(let[r,i]of Object.entries(t))cr(e,r),n.push(`in ${sr(i)} ${r};`);return n.join(`
`)}function or(e,t,n){let r=Object.entries(n);if(r.length===0)return{source:e,declarations:``,initialization:``};let i=lr(e,t),a=e.slice(i.openParenthesis+1,i.closeParenthesis),o=ur(e,a),s=new Set(o.locations),c=[],l=[],u=[];for(let[t,n]of r){if(o.names.has(t)||hr(e,t))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing WGSL shader input or variable`);let r=gr(s);s.add(r);let i=`_luma_${t}`;c.push(`@location(${r}) ${i}: ${n}`),l.push(`var<private> ${t}: ${n};`),u.push(`${t} = ${i};`)}let d=a.trim()?`,
  `:`
  `,f=a.trim()?``:`
`,p=`${a}${d}${c.join(`,
  `)}${f}`;return{source:e.slice(0,i.openParenthesis+1)+p+e.slice(i.closeParenthesis),declarations:l.join(`
`),initialization:u.join(`
`)}}function sr(e){let{primitiveType:t,components:n}=te.getAttributeShaderTypeInfo(e),r=t===`i32`?`int`:t===`u32`?`uint`:`float`;return n===1?r:`${r===`int`?`i`:r===`uint`?`u`:``}vec${n}`}function cr(e,t){let n=yr(t);if(RegExp(`\\b(?:in|attribute)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${n}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin vertex input "${t}" conflicts with an existing GLSL input`)}function lr(e,t){let n=RegExp(`\\bfn\\s+${yr(t)}\\s*\\(`,`g`).exec(e);if(!n)throw Error(`ShaderPlugin vertex inputs require WGSL vertex entry point "${t}"`);let r=e.indexOf(`(`,n.index),i=_r(e,r,`(`,`)`);if(i<0)throw Error(`Unable to parse WGSL vertex entry point "${t}" parameters`);return{openParenthesis:r,closeParenthesis:i}}function ur(e,t){let n=dr(t),r=new Set(fr(t)),i=pr(t);for(let t of i){let i=mr(e,t);if(i!==null){n.push(...dr(i));for(let e of fr(i))r.add(e)}}return{locations:n,names:r}}function dr(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function fr(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function pr(e){let t=[],n=/:\s*([A-Za-z_][\w]*)\b/g,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function mr(e,t){let n=RegExp(`\\bstruct\\s+${yr(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=_r(e,r,`{`,`}`);return i<0?null:e.slice(r+1,i)}function hr(e,t){let n=yr(t),r=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${n}\\b`,`g`),i=r.exec(e);for(;i;){if(vr(e,i.index)===0)return!0;i=r.exec(e)}return!1}function gr(e){let t=0;for(;e.has(t);)t++;return t}function _r(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function vr(e,t){let n=0,r=0,i=!1;for(let a=0;a<t;a++){let t=e[a],o=e[a+1];if(i){t===`
`&&(i=!1);continue}if(r>0){t===`/`&&o===`*`?(r++,a++):t===`*`&&o===`/`&&(r--,a++);continue}t===`/`&&o===`/`?(i=!0,a++):t===`/`&&o===`*`?(r=1,a++):t===`{`?n++:t===`}`&&n--}return n}function yr(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}function br(e,t,n){let r=[],i=[];for(let[a,o]of Object.entries(n)){Br(e,a);let n=o.interpolation===`flat`?`flat `:``,s=t===`vertex`?`out`:`in`;r.push(`${n}${s} ${sr(o.type)} ${a};`),t===`vertex`&&i.push(`${a} = ${Rr(o.type)};`)}return{declarations:r.join(`
`),initialization:i.join(`
`)}}function xr(e,t,n,r){let i=Object.entries(r);if(i.length===0)return{source:e,declarations:``,vertexInitialization:``,fragmentInitialization:``};let a=e,o=Sr(a,t,`vertex`),s=Cr(a,o),c=Sr(a,n,`fragment`),l=wr(a,c),u=Tr(a,s),d=Tr(a,l.type),f=new Set([...Fr(o.parameters),...Fr(u.body),...Fr(c.parameters),...Fr(d.body)]),p=new Set([...Pr(u.body),...Pr(d.body)]),m=[],h=[],g=[],_=[];for(let[e,t]of i){if(f.has(e)||Ir(a,e))throw Error(`ShaderPlugin varying "${e}" conflicts with existing WGSL stage I/O or a module variable`);let n=Lr(p);p.add(n);let r=t.interpolation===`flat`?` @interpolate(flat)`:``;m.push(`  @location(${n})${r} ${e}: ${t.type},`),h.push(`var<private> ${e}: ${t.type};`),g.push(`${e} = ${zr(t.type)};`),_.push(`${e} = ${l.name}.${e};`)}Dr(a,s,o.openBrace,o.closeBrace),a=Or(a,s,o,i.map(([e])=>e)),o=Sr(a,t,`vertex`),a=kr(a,o,i.map(([e])=>e));let v=(s===l.type?[s]:[s,l.type]).map(e=>Tr(a,e).closeBrace).sort((e,t)=>t-e);for(let e of v)a=a.slice(0,e)+`${m.join(`
`)}\n`+a.slice(e);if(c=Sr(a,n,`fragment`),!RegExp(`\\b${z(l.name)}\\s*:`).test(c.parameters))throw Error(`Unable to preserve WGSL fragment input "${l.name}"`);return{source:a,declarations:h.join(`
`),vertexInitialization:g.join(`
`),fragmentInitialization:_.join(`
`)}}function Sr(e,t,n){let r=RegExp(`\\bfn\\s+${z(t)}\\s*\\(`,`g`).exec(e);if(!r)throw Error(`ShaderPlugin varyings require WGSL ${n} entry point "${t}"`);let i=e.indexOf(`(`,r.index),a=Vr(e,i,`(`,`)`),o=e.indexOf(`{`,a),s=Vr(e,o,`{`,`}`);if(a<0||o<0||s<0)throw Error(`Unable to parse WGSL ${n} entry point "${t}"`);return{openParenthesis:i,closeParenthesis:a,openBrace:o,closeBrace:s,parameters:e.slice(i+1,a)}}function Cr(e,t){let n=e.slice(t.closeParenthesis+1,t.openBrace),r=/->\s*([A-Za-z_][\w]*)\s*$/.exec(n.trim());if(!r||Er(e,r[1])===null)throw Error(`ShaderPlugin varyings require the WGSL vertex entry point to return a named struct`);return r[1]}function wr(e,t){let n=[];for(let r of Nr(t.parameters,`,`)){let t=/(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:\s*([A-Za-z_][\w]*)\s*$/.exec(r.trim());t&&Er(e,t[2])&&n.push({name:t[1],type:t[2]})}if(n.length!==1)throw Error(`ShaderPlugin varyings require exactly one named WGSL fragment input struct; found ${n.length}`);return n[0]}function Tr(e,t){let n=Er(e,t);if(!n)throw Error(`Unable to find WGSL stage I/O struct "${t}"`);return n}function Er(e,t){let n=RegExp(`\\bstruct\\s+${z(t)}\\s*\\{`,`g`).exec(e);if(!n)return null;let r=e.indexOf(`{`,n.index),i=Vr(e,r,`{`,`}`);return i<0?null:{openBrace:r,closeBrace:i,body:e.slice(r+1,i)}}function Dr(e,t,n,r){let i=RegExp(`\\b${z(t)}\\s*\\(`,`g`),a=i.exec(e);for(;a;){if(a.index<n||a.index>r)throw Error(`ShaderPlugin varying output struct "${t}" is constructed outside the selected vertex entry point`);a=i.exec(e)}}function Or(e,t,n,r){let i=RegExp(`\\b${z(t)}\\s*\\(`,`g`),a=[],o=i.exec(e);for(;o;){if(o.index>n.openBrace&&o.index<n.closeBrace){let r=e.indexOf(`(`,o.index),i=Vr(e,r,`(`,`)`);if(i<0||i>n.closeBrace)throw Error(`Unable to parse WGSL output constructor "${t}"`);a.push({openParenthesis:r,closeParenthesis:i})}o=i.exec(e)}for(let t of a.sort((e,t)=>t.closeParenthesis-e.closeParenthesis)){let n=e.slice(t.openParenthesis+1,t.closeParenthesis).trim()?`, `:``;e=e.slice(0,t.closeParenthesis)+n+r.join(`, `)+e.slice(t.closeParenthesis)}return e}function kr(e,t,n){let r=Ar(e,t.openBrace+1,t.closeBrace);for(let t=r.length-1;t>=0;t--){let i=r[t],a=e.slice(i.expressionStart,i.semicolon).trim();if(!a)throw Error(`ShaderPlugin varying vertex entry point cannot use an empty return`);let o=`_luma_vertexOutput${t}`,s=`{\nvar ${o} = ${a};\n${n.map(e=>`${o}.${e} = ${e};`).join(`
`)}\nreturn ${o};\n}`;e=e.slice(0,i.start)+s+e.slice(i.semicolon+1)}return e}function Ar(e,t,n){let r=[],i=t;for(;i<n;)if(i=Mr(e,i,n),e.slice(i,i+6)===`return`&&!/[A-Za-z0-9_]/.test(e[i+6]||``)){let t=i+6,a=jr(e,t,n);if(a<0)throw Error(`Unable to parse WGSL return statement in selected vertex entry point`);r.push({start:i,expressionStart:t,semicolon:a}),i=a+1}else i++;return r}function jr(e,t,n){let r=0,i=0;for(let a=t;a<n;a++){let t=Mr(e,a,n);if(t!==a){a=t-1;continue}let o=e[a];if(o===`(`&&r++,o===`)`&&r--,o===`[`&&i++,o===`]`&&i--,o===`;`&&r===0&&i===0)return a}return-1}function Mr(e,t,n){let r=t;if(e[r]===`/`&&e[r+1]===`/`){let t=e.indexOf(`
`,r+2);return t<0||t>n?n:t+1}if(e[r]===`/`&&e[r+1]===`*`){let t=1;for(r+=2;r<n&&t>0;)e[r]===`/`&&e[r+1]===`*`?(t++,r+=2):e[r]===`*`&&e[r+1]===`/`?(t--,r+=2):r++}return r}function Nr(e,t){let n=[],r=0,i=0,a=0;for(let o=0;o<e.length;o++){let s=e[o];s===`(`&&i++,s===`)`&&i--,s===`<`&&a++,s===`>`&&a--,s===t&&i===0&&a===0&&(n.push(e.slice(r,o)),r=o+1)}return n.push(e.slice(r)),n}function Pr(e){let t=[],n=/@location\s*\(\s*(\d+)\s*\)/g,r=n.exec(e);for(;r;)t.push(Number(r[1])),r=n.exec(e);return t}function Fr(e){let t=[],n=/(?:^|,)\s*(?:@[A-Za-z_][\w]*(?:\([^)]*\))?\s*)*([A-Za-z_][\w]*)\s*:/gm,r=n.exec(e);for(;r;)t.push(r[1]),r=n.exec(e);return t}function Ir(e,t){let n=RegExp(`\\b(?:var(?:<[^>]+>)?|let|const)\\s+${z(t)}\\b`,`g`),r=n.exec(e);for(;r;){if(Hr(e,r.index)===0)return!0;r=n.exec(e)}return!1}function Lr(e){let t=0;for(;e.has(t);)t++;return t}function Rr(e){let{primitiveType:t,components:n}=te.getAttributeShaderTypeInfo(e),r=t===`u32`?`0u`:t===`i32`?`0`:`0.0`;return n===1?r:`${sr(e)}(${r})`}function zr(e){let{primitiveType:t,components:n}=te.getAttributeShaderTypeInfo(e),r=`${t}(0)`;return n===1?r:`${e}(${r})`}function Br(e,t){if(RegExp(`\\b(?:flat\\s+|smooth\\s+)?(?:in|out|varying)\\s+(?:(?:lowp|mediump|highp)\\s+)?[A-Za-z_][A-Za-z0-9_]*\\s+${z(t)}\\s*(?:\\[|;)`).test(e))throw Error(`ShaderPlugin varying "${t}" conflicts with existing GLSL stage I/O`)}function Vr(e,t,n,r){let i=0,a=0,o=!1;for(let s=t;s<e.length;s++){let t=e[s],c=e[s+1];if(o){t===`
`&&(o=!1);continue}if(a>0){t===`/`&&c===`*`?(a++,s++):t===`*`&&c===`/`&&(a--,s++);continue}if(t===`/`&&c===`/`){o=!0,s++;continue}if(t===`/`&&c===`*`){a=1,s++;continue}if(t===n&&i++,t===r&&--i===0)return s}return-1}function Hr(e,t){let n=0;for(let r=0;r<t;r++){let i=Mr(e,r,t);if(i!==r){r=i-1;continue}e[r]===`{`&&n++,e[r]===`}`&&n--}return n}function z(e){return e.replace(/[.*+?^${}()|[\]\\]/g,`\\$&`)}var Ur=`\n\n${$e}\n`,Wr=100,Gr=`precision highp float;
`;function Kr(e){let t=ut(e.modules||[]),{source:n,bindingAssignments:r}=Jr(e.platformInfo,{...e,source:e.source,stage:`vertex`,modules:t});return{source:n,getUniforms:Xr(t),bindingAssignments:r,bindingTable:Wn(n,r),shaderLayout:ve(n,{vertexEntryPoint:e.vertexEntryPoint,scanVertexAttributes:e.scanVertexAttributes})}}function qr(e){let{vs:t,fs:n}=e,r=ut(e.modules||[]);return{vs:Yr(e.platformInfo,{...e,source:t,stage:`vertex`,modules:r}),fs:Yr(e.platformInfo,{...e,source:n,stage:`fragment`,modules:r}),getUniforms:Xr(r)}}function Jr(e,t){let{source:n,stage:r,modules:i,defines:a={},hookFunctions:o=[],inject:s={},pluginInjections:c={},pluginVertexInputs:l={},pluginVaryings:u={},vertexEntryPoint:d=`vertexMain`,fragmentEntryPoint:f=`fragmentMain`,log:p}=t;k(typeof n==`string`,`shader source must be a string`);let m=or(rr(n,{defines:a}),d,l),h=xr(m.source,d,f,u),g=h.source,_=``,v=zn(o),y={},b={},x={};Zr(c,y,b,x);for(let e in s){let t=typeof s[e]==`string`?{injection:s[e],order:0}:s[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?b[e]=[t]:x[e]=[t]:y[e]=[t]}else x[e]=[t]}Qr(m.declarations,m.initialization,b,x),$r(h,b,x);let S=i,C=oi(g),w=ai(C.source),ee=ui(S,t._bindingRegistry,w,a),T=[];for(let e of S){p&&ct(e,g,p);let n=si(rr(ii(e,`wgsl`,p),{defines:a}),e,{usedBindingsByGroup:w,bindingRegistry:t._bindingRegistry,reservedBindingKeysByGroup:ee});T.push(...n.bindingAssignments);let r=n.source;_+=r;let i=ei(e);for(let e in i){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let n=t[2]===`decl`?b:x;n[e]=n[e]||[],n[e].push(i[e])}else y[e]=y[e]||[],y[e].push(i[e])}}return _+=Ur,_=nt(_,r,ti(b),!1,`wgsl`,{vertex:d,fragment:f}),_+=ni(v,y),_+=vi(T),_+=C.source,_=nt(_,r,x,!1,`wgsl`,{vertex:d,fragment:f}),_i(_),{source:_,bindingAssignments:T}}function Yr(e,t){let{source:n,stage:r,language:i=`glsl`,modules:a,defines:o={},hookFunctions:s=[],inject:c={},pluginInjections:l={},pluginVertexInputs:u={},pluginVaryings:d={},prologue:f=!0,log:p}=t;k(typeof n==`string`,`shader source must be a string`);let m=i===`glsl`?Bn(n).version:-1,h=e.shaderLanguageVersion,g=m===100?`#version 100`:`#version 300 es`,_=n.split(`
`).slice(1).join(`
`),v={};a.forEach(e=>{Object.assign(v,e.defines)}),Object.assign(v,o);let y=``;switch(i){case`wgsl`:break;case`glsl`:y=f?`\
${g}

// ----- PROLOGUE -------------------------
${`#define SHADER_TYPE_${r.toUpperCase()}`}

${jn(e)}
${r===`fragment`?Gr:``}

// ----- APPLICATION DEFINES -------------------------

${ri(v)}

`:`${g}
`}let b=zn(s),x={},S={},C={};Zr(l,x,S,C);for(let e in c){let t=typeof c[e]==`string`?{injection:c[e],order:0}:c[e],n=/^(v|f)s:(#)?([\w-]+)$/.exec(e);if(n){let r=n[2],i=n[3];r?i===`decl`?S[e]=[t]:C[e]=[t]:x[e]=[t]}else C[e]=[t]}if(r===`vertex`){let e=ar(_,u);e&&(S[`vs:#decl`]=S[`vs:#decl`]||[],S[`vs:#decl`].push({injection:e,order:-(2**53-1)}))}let w=br(_,r,d);if(w.declarations){let e=r===`vertex`?`vs:#decl`:`fs:#decl`;S[e]=S[e]||[],S[e].push({injection:w.declarations,order:-(2**53-1)})}w.initialization&&(C[`vs:#main-start`]=C[`vs:#main-start`]||[],C[`vs:#main-start`].push({injection:w.initialization,order:-(2**53-1)}));for(let e of a){p&&ct(e,_,p);let t=ii(e,r,p);y+=t;let n=e.instance?.normalizedInjections[r]||{};for(let e in n){let t=/^(v|f)s:#([\w-]+)$/.exec(e);if(t){let r=t[2]===`decl`?S:C;r[e]=r[e]||[],r[e].push(n[e])}else x[e]=x[e]||[],x[e].push(n[e])}}return y+=`// ----- MAIN SHADER SOURCE -------------------------`,y+=Ur,y=nt(y,r,S),y+=Rn(b[r],x),y+=_,y=nt(y,r,C),i===`glsl`&&m!==h&&(y=Mn(y,r)),i===`glsl`&&xn(y,r,p),y.trim()}function Xr(e){return function(t){let n={};for(let r of e){let e=r.getUniforms?.(t,n);Object.assign(n,e)}return n}}function Zr(e,t,n,r){for(let i in e){let a=/^(v|f)s:(#)?([\w-]+)$/.exec(i);if(a){let o=a[2],s=a[3],c=o?s===`decl`?n:r:t;c[i]=c[i]||[],c[i].push(...e[i])}else r[i]=r[i]||[],r[i].push(...e[i])}}function Qr(e,t,n,r){e&&(n[`vs:#decl`]=n[`vs:#decl`]||[],n[`vs:#decl`].push({injection:e,order:-(2**53-1)})),t&&(r[`vs:#main-start`]=r[`vs:#main-start`]||[],r[`vs:#main-start`].push({injection:t,order:-(2**53-1)}))}function $r(e,t,n){e.declarations&&(t[`vs:#decl`]=t[`vs:#decl`]||[],t[`vs:#decl`].push({injection:e.declarations,order:-(2**53-1)})),e.vertexInitialization&&(n[`vs:#main-start`]=n[`vs:#main-start`]||[],n[`vs:#main-start`].push({injection:e.vertexInitialization,order:-(2**53-1)})),e.fragmentInitialization&&(n[`fs:#main-start`]=n[`fs:#main-start`]||[],n[`fs:#main-start`].push({injection:e.fragmentInitialization,order:-(2**53-1)}))}function ei(e){return{...e.instance?.normalizedInjections.vertex||{},...e.instance?.normalizedInjections.fragment||{}}}function ti(e){let t=[...e[`vs:#decl`]||[],...e[`fs:#decl`]||[]];return t.length?{"vs:#decl":t}:{}}function ni(e,t){return Rn(e.vertex,t,`wgsl`)+Rn(e.fragment,t,`wgsl`)}function ri(e={}){let t=``;for(let n in e){let r=e[n];(r||Number.isFinite(r))&&(t+=`#define ${n.toUpperCase()} ${e[n]}\n`)}return t}function ii(e,t,n){let r;switch(t){case`vertex`:r=e.vs||``;break;case`fragment`:r=e.fs||``;break;case`wgsl`:r=e.source||``;break;default:k(!1)}if(!e.name)throw Error(`Shader module must have a name`);yn(e,t,{log:n});let i=e.name.toUpperCase().replace(/[^0-9a-z]/gi,`_`),a=`\
// ----- MODULE ${e.name} ---------------

`;return t!==`wgsl`&&(a+=`#define MODULE_${i}\n`),a+=`${r}\n`,a}function ai(e){let t=new Map;for(let n of O(e,fe)){let e=Number(n.bindingToken),r=Number(n.groupToken);pi(r,e,n.name),B(t,r,e,`application binding "${n.name}"`)}return t}function oi(e){let t=O(e,de),n=new Map;for(let e of t){if(e.bindingToken===`auto`)continue;let t=Number(e.bindingToken),r=Number(e.groupToken);pi(r,t,e.name),B(n,r,t,`application binding "${e.name}"`)}let r={sawSupportedBindingDeclaration:t.length>0},i=he(e,de,e=>li(e,n,r));if(ge(e)&&!r.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in application WGSL. Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:i}}function si(e,t,n){let r=[],i={sawSupportedBindingDeclaration:O(e,ue).length>0,nextHintedBindingLocation:typeof t.firstBindingSlot==`number`?t.firstBindingSlot:null},a=he(e,ue,e=>ci(e,{module:t,context:n,bindingAssignments:r,relocationState:i}));if(ge(e)&&!i.sawSupportedBindingDeclaration)throw Error(`Unsupported @binding(auto) declaration form in module "${t.name}". Use adjacent "@group(N)" and "@binding(auto)" decorators followed by a bindable "var" declaration.`);return{source:a,bindingAssignments:r}}function ci(e,t){let{module:n,context:r,bindingAssignments:i,relocationState:a}=t,{match:o,bindingToken:s,groupToken:c,name:l}=e,u=Number(c);if(s===`auto`){let e=yi(u,n.name,l),t=r.bindingRegistry?.get(e),s=t===void 0?hi(u,r.usedBindingsByGroup,n.name,a.nextHintedBindingLocation??void 0,r.bindingRegistry):t;return mi(n.name,u,s,l),t!==void 0&&di(r.reservedBindingKeysByGroup,u,s,e)?(i.push({moduleName:n.name,name:l,group:u,location:s}),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`)):(B(r.usedBindingsByGroup,u,s,`module "${n.name}" binding "${l}"`),r.bindingRegistry?.set(e,s),i.push({moduleName:n.name,name:l,group:u,location:s}),a.nextHintedBindingLocation!==null&&t===void 0&&(a.nextHintedBindingLocation=s+1),o.replace(/@binding\(\s*auto\s*\)/,`@binding(${s})`))}let d=Number(s);return mi(n.name,u,d,l),B(r.usedBindingsByGroup,u,d,`module "${n.name}" binding "${l}"`),i.push({moduleName:n.name,name:l,group:u,location:d}),o}function li(e,t,n){let{match:r,bindingToken:i,groupToken:a,name:o}=e,s=Number(a);if(i===`auto`){let e=gi(s,t);return pi(s,e,o),B(t,s,e,`application binding "${o}"`),r.replace(/@binding\(\s*auto\s*\)/,`@binding(${e})`)}return n.sawSupportedBindingDeclaration=!0,r}function ui(e,t,n,r){let i=new Map;if(!t)return i;for(let a of e)for(let e of fi(a,r)){let r=yi(e.group,a.name,e.name),o=t.get(r);if(o!==void 0){let t=i.get(e.group)||new Map,a=t.get(o);if(a&&a!==r)throw Error(`Duplicate WGSL binding reservation for modules "${a}" and "${r}": group ${e.group}, binding ${o}.`);B(n,e.group,o,`registered module binding "${r}"`),t.set(o,r),i.set(e.group,t)}}return i}function di(e,t,n,r){let i=e.get(t);if(!i)return!1;let a=i.get(n);if(!a)return!1;if(a!==r)throw Error(`Registered module binding "${r}" collided with "${a}": group ${t}, binding ${n}.`);return!0}function fi(e,t){let n=[],r=rr(e.source||``,{defines:t});for(let e of O(r,ue))n.push({name:e.name,group:Number(e.groupToken)});return n}function pi(e,t,n){if(e===0&&t>=Wr)throw Error(`Application binding "${n}" in group 0 uses reserved binding ${t}. Application-owned explicit group-0 bindings must stay below ${Wr}.`)}function mi(e,t,n,r){if(t===0&&n<Wr)throw Error(`Module "${e}" binding "${r}" in group 0 uses reserved application binding ${n}. Module-owned explicit group-0 bindings must be ${Wr} or higher.`)}function B(e,t,n,r){let i=e.get(t)||new Set;if(i.has(n))throw Error(`Duplicate WGSL binding assignment for ${r}: group ${t}, binding ${n}.`);i.add(n),e.set(t,i)}function hi(e,t,n,r,i){let a=t.get(e)||new Set,o=new Set,s=`${e}:`,c=`${s}${n}:`;for(let[e,t]of i||[])e.startsWith(c)&&o.add(t);let l=r??(e===0?Wr:a.size>0?Math.max(...a)+1:0);for(;a.has(l)||o.has(l);)l++;for(let[e,t]of i||[])t===l&&e.startsWith(s)&&i?.delete(e);return l}function gi(e,t){let n=t.get(e)||new Set,r=0;for(;n.has(r);)r++;return r}function _i(e){let t=_e(e,ue);if(!t)return;let n=bi(e,t.index);throw n?Error(`Unresolved @binding(auto) for module "${n}" binding "${t.name}" remained in assembled WGSL source.`):xi(e,t.index)?Error(`Unresolved @binding(auto) for application binding "${t.name}" remained in assembled WGSL source.`):Error(`Unresolved @binding(auto) remained in assembled WGSL source near "${Si(t.match)}".`)}function vi(e){if(e.length===0)return``;let t=`// ----- MODULE WGSL BINDING ASSIGNMENTS ---------------
`;for(let n of e)t+=`// ${n.moduleName}.${n.name} -> @group(${n.group}) @binding(${n.location})\n`;return t+=`
`,t}function yi(e,t,n){return`${e}:${t}:${n}`}function bi(e,t){let n=/^\/\/ ----- MODULE ([^\n]+) ---------------$/gm,r,i;for(i=n.exec(e);i&&i.index<=t;)r=i[1],i=n.exec(e);return r}function xi(e,t){let n=e.indexOf(Ur);return n>=0?t>n:!0}function Si(e){return e.replace(/\s+/g,` `).trim()}var Ci=class e{static defaultShaderAssemblers={};_hookFunctions=[];_defaultModules=[];static getDefaultShaderAssembler(t){return k(t===`glsl`||t===`wgsl`),t===`wgsl`?(e.defaultShaderAssemblers.wgsl=e.defaultShaderAssemblers.wgsl||new Ti,e.defaultShaderAssemblers.wgsl):(e.defaultShaderAssemblers.glsl=e.defaultShaderAssemblers.glsl||new wi,e.defaultShaderAssemblers.glsl)}addDefaultModule(e){this._defaultModules.find(t=>t.name===(typeof e==`string`?e:e.name))||this._defaultModules.push(e)}removeDefaultModule(e){let t=typeof e==`string`?e:e.name;this._defaultModules=this._defaultModules.filter(e=>e.name!==t)}addShaderHook(e,t){t&&(e=Object.assign(t,{hook:e})),this._hookFunctions.push(e)}_getModuleList(e=[]){let t=Array(this._defaultModules.length+e.length),n={},r=0;for(let e=0,i=this._defaultModules.length;e<i;++e){let i=this._defaultModules[e],a=i.name;t[r++]=i,n[a]=!0}for(let i=0,a=e.length;i<a;++i){let a=e[i],o=a.name;n[o]||(t[r++]=a,n[o]=!0)}return t.length=r,ot(t),t}},wi=class extends Ci{shaderLanguage=`glsl`;assembleGLSLShaderPair(e){let t=this._getModuleList(e.modules),n=this._hookFunctions;return{...qr({...e,vs:e.vs,fs:e.fs,modules:t,hookFunctions:n}),modules:t}}},Ti=class e extends Ci{shaderLanguage=`wgsl`;_wgslBindingRegistry=new Map;assembleWGSLShader(t){let n=this._getModuleList(t.modules),r=this._hookFunctions,i=e.getShaderPreprocessorDefines(t,n),a=t.platformInfo.shaderLanguage===`wgsl`&&t.source?rr(t.source,{defines:i}):t.source,{source:o,getUniforms:s,bindingAssignments:c}=Kr({...t,source:a,defines:i,_bindingRegistry:this._wgslBindingRegistry,modules:n,hookFunctions:r}),l=t.platformInfo.shaderLanguage===`wgsl`?rr(o,{defines:i}):o;return{source:l,getUniforms:s,modules:n,bindingAssignments:c,bindingTable:Wn(l,c),shaderLayout:ve(l,{vertexEntryPoint:t.vertexEntryPoint,scanVertexAttributes:t.scanVertexAttributes})}}static getShaderPreprocessorDefines(t,n){return{...e.getPlatformPreprocessorDefines(t.platformInfo),...n.reduce((e,t)=>(Object.assign(e,t.defines),e),{}),...t.defines}}static getPlatformPreprocessorDefines(e){let t=e.limits||{};return{LUMA_SUPPORTS_VERTEX_STORAGE_BUFFERS:e.type===`webgpu`&&(t.maxStorageBuffersInVertexStage||0)>0,LUMA_FP32_TAN_PRECISION_WORKAROUND:e.type===`webgpu`&&e.gpu.toLowerCase()!==`nvidia`&&e.gpu.toLowerCase()!==`amd`,LUMA_FP64_INTEGER_ARITHMETIC:e.type===`webgpu`&&e.gpu.toLowerCase()===`apple`}}},Ei={name:`fp32`,source:`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
const FP32_TWO_PI: f32 = 6.2831854820251465;
const FP32_PI_2: f32 = 1.5707963705062866;
const FP32_PI_16: f32 = 0.1963495463132858;

const FP32_SIN_TABLE_0: f32 = 0.19509032368659973;
const FP32_SIN_TABLE_1: f32 = 0.3826834261417389;
const FP32_SIN_TABLE_2: f32 = 0.5555702447891235;
const FP32_SIN_TABLE_3: f32 = 0.7071067690849304;

const FP32_COS_TABLE_0: f32 = 0.9807852506637573;
const FP32_COS_TABLE_1: f32 = 0.9238795042037964;
const FP32_COS_TABLE_2: f32 = 0.8314695954322815;
const FP32_COS_TABLE_3: f32 = 0.7071067690849304;

const FP32_INVERSE_FACTORIAL_3: f32 = 1.666666716337204e-01;
const FP32_INVERSE_FACTORIAL_5: f32 = 8.333333767950535e-03;
const FP32_INVERSE_FACTORIAL_7: f32 = 1.9841270113829523e-04;
const FP32_INVERSE_FACTORIAL_9: f32 = 2.75573188446287533e-06;
const FP32_OVERFLOW: f32 = 3.402823466e+38;

fn sin_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let x = -a * a;
  var sum = a;
  var term = a;

  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_3;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_5;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_7;
  term = term * x;
  sum = sum + term * FP32_INVERSE_FACTORIAL_9;

  return sum;
}

fn tan_taylor_fp32(a: f32) -> f32 {
  if (a == 0.0) {
    return 0.0;
  }

  let z = floor(a / FP32_TWO_PI);
  let reduced = a - FP32_TWO_PI * z;

  var quadrantValue = floor(reduced / FP32_PI_2 + 0.5);
  let quadrant = i32(quadrantValue);
  if (quadrant < -2 || quadrant > 2) {
    return FP32_OVERFLOW;
  }

  var angle = reduced - FP32_PI_2 * quadrantValue;
  quadrantValue = floor(angle / FP32_PI_16 + 0.5);
  let tableIndex = i32(quadrantValue);
  let absoluteTableIndex = abs(tableIndex);
  if (absoluteTableIndex > 4) {
    return FP32_OVERFLOW;
  }

  angle = angle - FP32_PI_16 * quadrantValue;
  let sinAngle = sin_taylor_fp32(angle);
  let cosAngle = sqrt(1.0 - sinAngle * sinAngle);

  var tableCos = 0.0;
  var tableSin = 0.0;
  if (absoluteTableIndex == 1) {
    tableCos = FP32_COS_TABLE_0;
    tableSin = FP32_SIN_TABLE_0;
  } else if (absoluteTableIndex == 2) {
    tableCos = FP32_COS_TABLE_1;
    tableSin = FP32_SIN_TABLE_1;
  } else if (absoluteTableIndex == 3) {
    tableCos = FP32_COS_TABLE_2;
    tableSin = FP32_SIN_TABLE_2;
  } else if (absoluteTableIndex == 4) {
    tableCos = FP32_COS_TABLE_3;
    tableSin = FP32_SIN_TABLE_3;
  }

  var sinReduced = sinAngle;
  var cosReduced = cosAngle;
  if (tableIndex > 0) {
    sinReduced = tableCos * sinAngle + tableSin * cosAngle;
    cosReduced = tableCos * cosAngle - tableSin * sinAngle;
  } else if (tableIndex < 0) {
    sinReduced = tableCos * sinAngle - tableSin * cosAngle;
    cosReduced = tableCos * cosAngle + tableSin * sinAngle;
  }

  var sinValue = 0.0;
  var cosValue = 0.0;
  if (quadrant == 0) {
    sinValue = sinReduced;
    cosValue = cosReduced;
  } else if (quadrant == 1) {
    sinValue = cosReduced;
    cosValue = -sinReduced;
  } else if (quadrant == -1) {
    sinValue = -cosReduced;
    cosValue = sinReduced;
  } else {
    sinValue = -sinReduced;
    cosValue = -cosReduced;
  }

  return sinValue / cosValue;
}

fn tan_fp32(a: f32) -> f32 {
  return tan_taylor_fp32(a);
}
#else
fn tan_fp32(a: f32) -> f32 {
  return tan(a);
}
#endif
`,vs:`#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND

// All these functions are for substituting tan() function from Intel GPU only
const float TWO_PI = 6.2831854820251465;
const float PI_2 = 1.5707963705062866;
const float PI_16 = 0.1963495463132858;

const float SIN_TABLE_0 = 0.19509032368659973;
const float SIN_TABLE_1 = 0.3826834261417389;
const float SIN_TABLE_2 = 0.5555702447891235;
const float SIN_TABLE_3 = 0.7071067690849304;

const float COS_TABLE_0 = 0.9807852506637573;
const float COS_TABLE_1 = 0.9238795042037964;
const float COS_TABLE_2 = 0.8314695954322815;
const float COS_TABLE_3 = 0.7071067690849304;

const float INVERSE_FACTORIAL_3 = 1.666666716337204e-01; // 1/3!
const float INVERSE_FACTORIAL_5 = 8.333333767950535e-03; // 1/5!
const float INVERSE_FACTORIAL_7 = 1.9841270113829523e-04; // 1/7!
const float INVERSE_FACTORIAL_9 = 2.75573188446287533e-06; // 1/9!

float sin_taylor_fp32(float a) {
  float r, s, t, x;

  if (a == 0.0) {
    return 0.0;
  }

  x = -a * a;
  s = a;
  r = a;

  r = r * x;
  t = r * INVERSE_FACTORIAL_3;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_5;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_7;
  s = s + t;

  r = r * x;
  t = r * INVERSE_FACTORIAL_9;
  s = s + t;

  return s;
}

void sincos_taylor_fp32(float a, out float sin_t, out float cos_t) {
  if (a == 0.0) {
    sin_t = 0.0;
    cos_t = 1.0;
  }
  sin_t = sin_taylor_fp32(a);
  cos_t = sqrt(1.0 - sin_t * sin_t);
}

float tan_taylor_fp32(float a) {
    float sin_a;
    float cos_a;

    if (a == 0.0) {
        return 0.0;
    }

    // 2pi range reduction
    float z = floor(a / TWO_PI);
    float r = a - TWO_PI * z;

    float t;
    float q = floor(r / PI_2 + 0.5);
    int j = int(q);

    if (j < -2 || j > 2) {
        return 1.0 / 0.0;
    }

    t = r - PI_2 * q;

    q = floor(t / PI_16 + 0.5);
    int k = int(q);
    int abs_k = int(abs(float(k)));

    if (abs_k > 4) {
        return 1.0 / 0.0;
    } else {
        t = t - PI_16 * q;
    }

    float u = 0.0;
    float v = 0.0;

    float sin_t, cos_t;
    float s, c;
    sincos_taylor_fp32(t, sin_t, cos_t);

    if (k == 0) {
        s = sin_t;
        c = cos_t;
    } else {
        if (abs(float(abs_k) - 1.0) < 0.5) {
            u = COS_TABLE_0;
            v = SIN_TABLE_0;
        } else if (abs(float(abs_k) - 2.0) < 0.5) {
            u = COS_TABLE_1;
            v = SIN_TABLE_1;
        } else if (abs(float(abs_k) - 3.0) < 0.5) {
            u = COS_TABLE_2;
            v = SIN_TABLE_2;
        } else if (abs(float(abs_k) - 4.0) < 0.5) {
            u = COS_TABLE_3;
            v = SIN_TABLE_3;
        }
        if (k > 0) {
            s = u * sin_t + v * cos_t;
            c = u * cos_t - v * sin_t;
        } else {
            s = u * sin_t - v * cos_t;
            c = u * cos_t + v * sin_t;
        }
    }

    if (j == 0) {
        sin_a = s;
        cos_a = c;
    } else if (j == 1) {
        sin_a = c;
        cos_a = -s;
    } else if (j == -1) {
        sin_a = -c;
        cos_a = s;
    } else {
        sin_a = -s;
        cos_a = -c;
    }
    return sin_a / cos_a;
}
#endif

float tan_fp32(float a) {
#ifdef LUMA_FP32_TAN_PRECISION_WORKAROUND
  return tan_taylor_fp32(a);
#else
  return tan(a);
#endif
}
`},Di=`const SMOOTH_EDGE_RADIUS: f32 = 0.5;

struct VertexGeometry {
  position: vec4<f32>,
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry_: VertexGeometry = VertexGeometry(
  vec4<f32>(0.0, 0.0, 1.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0),
  vec2<f32>(0.0, 0.0),
  vec3<f32>(0.0, 0.0, 0.0)
);

struct FragmentGeometry {
  uv: vec2<f32>,
};

var<private> fragmentGeometry: FragmentGeometry;

fn smoothedge(edge: f32, x: f32) -> f32 {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`,Oi=`#define SMOOTH_EDGE_RADIUS 0.5`,ki={name:`geometry`,source:Di,vs:`\
${Oi}

struct VertexGeometry {
  vec4 position;
  vec3 worldPosition;
  vec3 worldPositionAlt;
  vec3 normal;
  vec2 uv;
  vec3 pickingColor;
} geometry = VertexGeometry(
  vec4(0.0, 0.0, 1.0, 0.0),
  vec3(0.0),
  vec3(0.0),
  vec3(0.0),
  vec2(0.0),
  vec3(0.0)
);
`,fs:`\
${Oi}

struct FragmentGeometry {
  vec2 uv;
};
FragmentGeometry geometry;

float smoothedge(float edge, float x) {
  return smoothstep(edge - SMOOTH_EDGE_RADIUS, edge + SMOOTH_EDGE_RADIUS, x);
}
`},V;(function(e){e[e.Start=1]=`Start`,e[e.Move=2]=`Move`,e[e.End=4]=`End`,e[e.Cancel=8]=`Cancel`})(V||={});var H;(function(e){e[e.None=0]=`None`,e[e.Left=1]=`Left`,e[e.Right=2]=`Right`,e[e.Up=4]=`Up`,e[e.Down=8]=`Down`,e[e.Horizontal=3]=`Horizontal`,e[e.Vertical=12]=`Vertical`,e[e.All=15]=`All`})(H||={});var U;(function(e){e[e.Possible=1]=`Possible`,e[e.Began=2]=`Began`,e[e.Changed=4]=`Changed`,e[e.Ended=8]=`Ended`,e[e.Recognized=8]=`Recognized`,e[e.Cancelled=16]=`Cancelled`,e[e.Failed=32]=`Failed`})(U||={});var Ai=`auto`,ji=`manipulation`,Mi=`none`,Ni=`pan-x`,Pi=`pan-y`;function Fi(e){if(e.includes(`none`))return Mi;let t=e.includes(Ni),n=e.includes(Pi);return t&&n?Mi:t||n?t?Ni:Pi:e.includes(`manipulation`)?ji:Ai}var Ii=class{constructor(e,t){this.actions=``,this.manager=e,this.set(t)}set(e){e===`compute`&&(e=this.compute()),this.manager.element&&(this.manager.element.style.touchAction=e,this.actions=e)}update(){this.set(this.manager.options.touchAction)}compute(){let e=[];for(let t of this.manager.recognizers)t.options.enable&&(e=e.concat(t.getTouchAction()));return Fi(e.join(` `))}};function Li(e){return e.trim().split(/\s+/g)}function Ri(e,t,n){if(e)for(let r of Li(t))e.addEventListener(r,n,!1)}function zi(e,t,n){if(e)for(let r of Li(t))e.removeEventListener(r,n,!1)}function Bi(e){return(e.ownerDocument||e).defaultView}function Vi(e,t){let n=e;for(;n;){if(n===t)return!0;n=n.parentNode}return!1}function Hi(e){let t=e.length;if(t===1)return{x:Math.round(e[0].clientX),y:Math.round(e[0].clientY)};let n=0,r=0,i=0;for(;i<t;)n+=e[i].clientX,r+=e[i].clientY,i++;return{x:Math.round(n/t),y:Math.round(r/t)}}function Ui(e){let t=[],n=0;for(;n<e.pointers.length;)t[n]={clientX:Math.round(e.pointers[n].clientX),clientY:Math.round(e.pointers[n].clientY)},n++;return{timeStamp:Date.now(),pointers:t,center:Hi(t),deltaX:e.deltaX,deltaY:e.deltaY}}function Wi(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.sqrt(n*n+r*r)}function Gi(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.sqrt(n*n+r*r)}function Ki(e,t){let n=t.x-e.x,r=t.y-e.y;return Math.atan2(r,n)*180/Math.PI}function qi(e,t){let n=t.clientX-e.clientX,r=t.clientY-e.clientY;return Math.atan2(r,n)*180/Math.PI}function Ji(e,t){return e===t?H.None:Math.abs(e)>=Math.abs(t)?e<0?H.Left:H.Right:t<0?H.Up:H.Down}function Yi(e,t){let n=t.center,r=e.offsetDelta,i=e.prevDelta,a=e.prevInput;return(t.eventType===V.Start||a?.eventType===V.End)&&(i=e.prevDelta={x:a?.deltaX||0,y:a?.deltaY||0},r=e.offsetDelta={x:n.x,y:n.y}),{deltaX:i.x+(n.x-r.x),deltaY:i.y+(n.y-r.y)}}function Xi(e,t,n){return{x:t/e||0,y:n/e||0}}function Zi(e,t){return Gi(t[0],t[1])/Gi(e[0],e[1])}function Qi(e,t){return qi(t[1],t[0])-qi(e[1],e[0])}function $i(e,t){let n=e.lastInterval||t,r=t.timeStamp-n.timeStamp,i,a,o,s;if(t.eventType!==V.Cancel&&(r>25||n.velocity===void 0)){let c=t.deltaX-n.deltaX,l=t.deltaY-n.deltaY,u=Xi(r,c,l);a=u.x,o=u.y,i=Math.abs(u.x)>Math.abs(u.y)?u.x:u.y,s=Ji(c,l),e.lastInterval=t}else i=n.velocity,a=n.velocityX,o=n.velocityY,s=n.direction;t.velocity=i,t.velocityX=a,t.velocityY=o,t.direction=s}function ea(e,t){return`pointerId`in e?e.pointerId:t}function ta(e,t){e.movementOrigin=new Map(t.map((e,t)=>[ea(e,t),{clientX:e.clientX,clientY:e.clientY}])),e.firstMovementTime=void 0}function na(e,t){let n=t.pointers.map(ea);if(e.movementOrigin?.size===n.length&&n.every(t=>e.movementOrigin.has(t))||ta(e,t.pointers),t.distancePerPointer=t.pointers.map((t,r)=>Gi(e.movementOrigin.get(n[r]),t)),t.eventType&V.Move&&t.distancePerPointer.some(e=>e>0)&&(e.firstMovementTime??=t.timeStamp),t.movementDeltaTime=e.firstMovementTime===void 0?0:t.timeStamp-e.firstMovementTime,t.eventType&(V.End|V.Cancel)){let r=t.changedPointers.map(e=>ea(e,t.pointers.indexOf(e)));ta(e,t.pointers.filter((e,t)=>!r.includes(n[t])))}}function ra(e,t){let{session:n}=e,{pointers:r}=t,{length:i}=r;n.firstInput||=Ui(t),i>1&&!n.firstMultiple?n.firstMultiple=Ui(t):i===1&&(n.firstMultiple=!1);let{firstInput:a,firstMultiple:o}=n,s=o?o.center:a.center,c=t.center=Hi(r);t.timeStamp=Date.now(),t.deltaTime=t.timeStamp-a.timeStamp,na(n,t),t.angle=Ki(s,c),t.distance=Wi(s,c);let{deltaX:l,deltaY:u}=Yi(n,t);t.deltaX=l,t.deltaY=u,t.offsetDirection=Ji(t.deltaX,t.deltaY);let d=Xi(t.deltaTime,t.deltaX,t.deltaY);t.overallVelocityX=d.x,t.overallVelocityY=d.y,t.overallVelocity=Math.abs(d.x)>Math.abs(d.y)?d.x:d.y,t.scale=o?Zi(o.pointers,r):1,t.rotation=o?Qi(o.pointers,r):0,t.maxPointers=n.prevInput?t.pointers.length>n.prevInput.maxPointers?t.pointers.length:n.prevInput.maxPointers:t.pointers.length;let f=e.element;return Vi(t.srcEvent.target,f)&&(f=t.srcEvent.target),t.target=f,$i(n,t),t}function ia(e,t,n){let r=n.pointers.length,i=n.changedPointers.length,a=t&V.Start&&r-i===0,o=t&(V.End|V.Cancel)&&r-i===0;n.isFirst=!!a,n.isFinal=!!o,a&&(e.session={}),n.eventType=t;let s=ra(e,n);e.emit(`hammer.input`,s),e.recognize(s),e.session.prevInput=s}var aa=class{constructor(e){this.evEl=``,this.evWin=``,this.evTarget=``,this.domHandler=e=>{this.manager.options.enable&&this.handler(e)},this.manager=e,this.element=e.element,this.target=e.options.inputTarget||e.element}callback(e,t){ia(this.manager,e,t)}init(){Ri(this.element,this.evEl,this.domHandler),Ri(this.target,this.evTarget,this.domHandler),Ri(Bi(this.element),this.evWin,this.domHandler)}destroy(){zi(this.element,this.evEl,this.domHandler),zi(this.target,this.evTarget,this.domHandler),zi(Bi(this.element),this.evWin,this.domHandler)}},oa={pointerdown:V.Start,pointermove:V.Move,pointerup:V.End,pointercancel:V.Cancel,pointerout:V.Cancel},sa=`pointerdown`,ca=`pointermove pointerup pointercancel`,la=class extends aa{constructor(e){super(e),this.evEl=sa,this.evWin=ca,this.store=this.manager.session.pointerEvents=[],this.init()}handler(e){let{store:t}=this,n=!1,r=oa[e.type],i=e.pointerType,a=i===`touch`,o=t.findIndex(t=>t.pointerId===e.pointerId);r&V.Start&&(e.buttons||a)?o<0&&(t.push(e),o=t.length-1):r&(V.End|V.Cancel)&&(n=!0),!(o<0)&&(t[o]=e,this.callback(r,{pointers:t,changedPointers:[e],eventType:r,pointerType:i,srcEvent:e}),n&&t.splice(o,1))}},ua=[``,`webkit`,`Moz`,`MS`,`ms`,`o`];function da(e,t){let n=t[0].toUpperCase()+t.slice(1);for(let r of ua){let i=r?r+n:t;if(i in e)return i}}var fa=1,pa=2,ma={touchAction:`compute`,enable:!0,inputTarget:null,cssProps:{userSelect:`none`,userDrag:`none`,touchCallout:`none`,tapHighlightColor:`rgba(0,0,0,0)`}},ha=class{constructor(e,t){this.options={...ma,...t,cssProps:{...ma.cssProps,...t.cssProps},inputTarget:t.inputTarget||e},this.handlers={},this.session={},this.recognizers=[],this.oldCssProps={},this.element=e,this.input=new la(this),this.touchAction=new Ii(this,this.options.touchAction),this.toggleCssProps(!0)}set(e){return Object.assign(this.options,e),e.touchAction&&this.touchAction.update(),e.inputTarget&&(this.input.destroy(),this.input.target=e.inputTarget,this.input.init()),this}stop(e){this.session.stopped=e?pa:fa}recognize(e){let{session:t}=this;if(t.stopped)return;this.session.prevented&&e.srcEvent.preventDefault();let n,{recognizers:r}=this,{curRecognizer:i}=t;(!i||i&&i.state&U.Recognized)&&(i=t.curRecognizer=null);let a=0;for(;a<r.length;)n=r[a],t.stopped!==pa&&(!i||n===i||n.canRecognizeWith(i))?n.recognize(e):n.reset(),!i&&n.state&(U.Began|U.Changed|U.Ended)&&(i=t.curRecognizer=n),a++}get(e){let{recognizers:t}=this;for(let n=0;n<t.length;n++)if(t[n].options.event===e)return t[n];return null}add(e){if(Array.isArray(e)){for(let t of e)this.add(t);return this}let t=this.get(e.options.event);return t&&this.remove(t),this.recognizers.push(e),e.manager=this,this.touchAction.update(),e}remove(e){if(Array.isArray(e)){for(let t of e)this.remove(t);return this}let t=typeof e==`string`?this.get(e):e;if(t){let{recognizers:e}=this,n=e.indexOf(t);n!==-1&&(e.splice(n,1),this.touchAction.update())}return this}on(e,t){if(!e||!t)return;let{handlers:n}=this;for(let r of Li(e))n[r]=n[r]||[],n[r].push(t)}off(e,t){if(!e)return;let{handlers:n}=this;for(let r of Li(e))t?n[r]&&n[r].splice(n[r].indexOf(t),1):delete n[r]}emit(e,t){let n=this.handlers[e]&&this.handlers[e].slice();if(!n||!n.length)return;let r=t;r.type=e,r.preventDefault=function(){t.srcEvent.preventDefault()};let i=0;for(;i<n.length;)n[i](r),i++}destroy(){this.toggleCssProps(!1),this.handlers={},this.session={},this.input.destroy(),this.element=null}toggleCssProps(e){let{element:t}=this;if(t){for(let[n,r]of Object.entries(this.options.cssProps)){let i=da(t.style,n);e?(this.oldCssProps[i]=t.style[i],t.style[i]=r):t.style[i]=this.oldCssProps[i]||``}e||(this.oldCssProps={})}}},ga=1;function _a(){return ga++}function va(e){return e&U.Cancelled?`cancel`:e&U.Ended?`end`:e&U.Changed?`move`:e&U.Began?`start`:``}var ya=class{constructor(e){this.options=e,this.id=_a(),this.state=U.Possible,this.simultaneous={},this.requireFail=[]}set(e){return Object.assign(this.options,e),this.manager.touchAction.update(),this}recognizeWith(e){if(Array.isArray(e)){for(let t of e)this.recognizeWith(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{simultaneous:n}=this;return n[t.id]||(n[t.id]=t,t.recognizeWith(this)),this}dropRecognizeWith(e){if(Array.isArray(e)){for(let t of e)this.dropRecognizeWith(t);return this}let t;return t=typeof e==`string`?this.manager.get(e):e,t&&delete this.simultaneous[t.id],this}requireFailure(e){if(Array.isArray(e)){for(let t of e)this.requireFailure(t);return this}let t;if(typeof e==`string`){if(t=this.manager.get(e),!t)throw Error(`Cannot find recognizer ${e}`)}else t=e;let{requireFail:n}=this;return n.indexOf(t)===-1&&(n.push(t),t.requireFailure(this)),this}dropRequireFailure(e){if(Array.isArray(e)){for(let t of e)this.dropRequireFailure(t);return this}let t;if(t=typeof e==`string`?this.manager.get(e):e,t){let e=this.requireFail.indexOf(t);e>-1&&this.requireFail.splice(e,1)}return this}hasRequireFailures(){return!!this.requireFail.find(e=>e.options.enable)}canRecognizeWith(e){return!!this.simultaneous[e.id]}emit(e){if(!e)return;let{state:t}=this;t<U.Ended&&this.manager.emit(this.options.event+va(t),e),this.manager.emit(this.options.event,e),e.additionalEvent&&this.manager.emit(e.additionalEvent,e),t>=U.Ended&&this.manager.emit(this.options.event+va(t),e)}tryEmit(e){this.canEmit()?this.emit(e):this.state=U.Failed}canEmit(){let e=0;for(;e<this.requireFail.length;){if(!(this.requireFail[e].state&(U.Failed|U.Possible)))return!1;e++}return!0}recognize(e){let t={...e};if(!this.options.enable){this.reset(),this.state=U.Failed;return}this.state&(U.Recognized|U.Cancelled|U.Failed)&&(this.state=U.Possible),this.state=this.process(t),this.state&(U.Began|U.Changed|U.Ended|U.Cancelled)&&this.tryEmit(t)}getEventNames(){return[this.options.event]}reset(){}};function ba(e){return Math.abs(((e+180)%360+360)%360-180)}function xa(e,t){return(t.distance===void 0||e.distance>=t.distance)&&(t.distancePerPointer===void 0||e.distancePerPointer.length>0&&e.distancePerPointer.every(e=>e>=t.distancePerPointer))&&(t.movementDeltaTime===void 0||e.movementDeltaTime>=t.movementDeltaTime)&&(t.rotation===void 0||ba(e.rotation)>=t.rotation)&&(t.scale===void 0||Math.abs(e.scale-1)>=t.scale)}var Sa=class extends ya{attrTest(e){let t=this.options.pointers;return t===0||e.pointers.length===t}coherentTest(e){let t=this.options.coherent;return!t?.length||t.some(t=>xa(e,t))}process(e){let{state:t}=this,{eventType:n}=e,r=t&(U.Began|U.Changed),i=this.attrTest(e);return r&&(n&V.Cancel||!i)?t|U.Cancelled:r||i?n&V.End?t|U.Ended:t&U.Began?t|U.Changed:U.Began:U.Failed}},Ca=[``,`start`,`move`,`end`,`cancel`],wa=class extends ya{constructor(e={}){super({enable:!0,event:`doubleclickdrag`,pointers:1,interval:500,time:350,threshold:28,dragThreshold:1,pixelsPerScale:120,...e}),this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}getTouchAction(){return[ji]}getEventNames(){return Ca.map(e=>this.options.event+e)}process(e){let{options:t}=this;return e.pointers.length===t.pointers?e.eventType&V.Start?this._handleStart(e):e.eventType&V.Move?this._handleMove(e):e.eventType&V.Cancel?this._handleEnd(e,!0):e.eventType&V.End?this._handleEnd(e,!1):U.Failed:(this.reset(),U.Failed)}reset(){this._tapStart=null,this._lastTap=null,this._drag=null,this._emittedStart=!1}emit(e){if(e){if(this.state===U.Began){if(!this._drag?.active||this._emittedStart)return;this._emittedStart=!0,this.manager.emit(`${this.options.event}start`,e),this.manager.emit(this.options.event,e);return}if(this.state===U.Changed){if(!this._emittedStart)return;this.manager.emit(`${this.options.event}move`,e),this.manager.emit(this.options.event,e);return}if(this.state===U.Ended){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}end`,e),this._emittedStart=!1;return}if(this.state===U.Cancelled){if(!this._emittedStart)return;this.manager.emit(this.options.event,e),this.manager.emit(`${this.options.event}cancel`,e),this._emittedStart=!1}}}_handleStart(e){let t=this._getPointerId(e);return this._lastTap&&this._isTapMatch(e,this._lastTap)?(this._tapStart=null,this._lastTap=null,this._drag={startCenter:e.center,pointerId:t,active:!1},this._emittedStart=!1,U.Began):(this._tapStart={center:e.center,timeStamp:e.timeStamp,pointerId:t},this._lastTap=null,this._drag=null,this._emittedStart=!1,U.Failed)}_handleMove(e){if(!this._drag||!this._isSamePointer(e,this._drag.pointerId))return U.Failed;let t=this._drag.startCenter.y-e.center.y;return!this._drag.active&&Math.abs(t)<this.options.dragThreshold?U.Began:(this._drag.active=!0,e.scale=2**(t/this.options.pixelsPerScale),this._emittedStart?U.Changed:U.Began)}_handleEnd(e,t){if(this._drag&&this._isSamePointer(e,this._drag.pointerId)){let{active:n,startCenter:r}=this._drag;return this._drag=null,this._tapStart=null,this._lastTap=null,n?(e.scale=2**((r.y-e.center.y)/this.options.pixelsPerScale),t?U.Cancelled:U.Ended):(this._emittedStart=!1,U.Failed)}return!this._tapStart||!this._isSamePointer(e,this._tapStart.pointerId)?(t&&this.reset(),U.Failed):(this._lastTap=this._isValidTap(e)?{center:e.center,timeStamp:e.timeStamp,pointerId:this._tapStart.pointerId}:null,this._tapStart=null,U.Failed)}_isTapMatch(e,t){return e.timeStamp-t.timeStamp<=this.options.interval&&Wi(e.center,t.center)<=this.options.threshold}_isValidTap(e){return e.deltaTime<=this.options.time&&e.distance<=this.options.threshold}_getPointerId(e){return`pointerId`in e.srcEvent?e.srcEvent.pointerId:null}_isSamePointer(e,t){return t===null||this._getPointerId(e)===t}},Ta=class extends ya{constructor(e={}){super({enable:!0,event:`tap`,pointers:1,taps:1,interval:300,time:250,threshold:9,posThreshold:10,...e}),this.pTime=null,this.pCenter=null,this._timer=null,this._input=null,this.count=0}getTouchAction(){return[ji]}process(e){let{options:t}=this,n=e.pointers.length===t.pointers,r=e.distance<t.threshold,i=e.deltaTime<t.time;if(this.reset(),e.eventType&V.Start&&this.count===0)return this.failTimeout();if(r&&i&&n){if(e.eventType!==V.End)return this.failTimeout();let n=!this.pTime||e.timeStamp-this.pTime<t.interval,r=!this.pCenter||Wi(this.pCenter,e.center)<t.posThreshold;if(this.pTime=e.timeStamp,this.pCenter=e.center,!r||!n?this.count=1:this.count+=1,this._input=e,this.count%t.taps===0)return this.hasRequireFailures()?(this._timer=setTimeout(()=>{this.state=U.Recognized,this.tryEmit(this._input)},t.interval),U.Began):U.Recognized}return U.Failed}failTimeout(){return this._timer=setTimeout(()=>{this.state=U.Failed},this.options.interval),U.Failed}reset(){clearTimeout(this._timer)}emit(e){this.state===U.Recognized&&(e.tapCount=this.count,this.manager.emit(this.options.event,e))}},Ea=class extends Sa{constructor(){super(...arguments),this.wheelSession=null,this.wheelSessionUnsubscribe=null,this.handleWheelSessionEvent=e=>{e.device===`trackpad`&&this.handleTrackpadEvent(e)}}set(e){let{wheelSession:t,...n}=e;return t&&t!==this.wheelSession&&(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=null,this.wheelSession=t),super.set(n),this.updateWheelSessionSubscription(),this}getTrackpadInput(e,t={}){let{srcEvent:n}=e,r=t.deltaX??e.deltaX,i=t.deltaY??e.deltaY,a=Ji(r,i),o=Math.sqrt(e.deltaX*e.deltaX+e.deltaY*e.deltaY),s=n;return{pointers:[s,s],changedPointers:[s,s],pointerType:`trackpad`,srcEvent:s,eventType:e.eventType,timeStamp:e.timeStamp,deltaTime:e.deltaTime,center:e.center,deltaX:r,deltaY:i,angle:Math.atan2(i,r)*180/Math.PI,distance:Math.sqrt(r*r+i*i),distancePerPointer:[o,o],movementDeltaTime:e.deltaTime,scale:1,rotation:0,direction:a,offsetDirection:a,velocity:e.velocity,velocityX:e.velocityX,velocityY:e.velocityY,overallVelocity:e.overallVelocity,overallVelocityX:e.overallVelocityX,overallVelocityY:e.overallVelocityY,maxPointers:2,target:n.target||this.manager.element,additionalEvent:``,...t}}updateWheelSessionSubscription(){let e=!!(this.wheelSession&&this.options.enable&&this.options.trackpad&&this.options.pointers===2);e&&!this.wheelSessionUnsubscribe?this.wheelSessionUnsubscribe=this.wheelSession.on(this.handleWheelSessionEvent):!e&&this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe(),this.wheelSessionUnsubscribe=null)}},Da=[``,`start`,`move`,`end`,`cancel`,`up`,`down`,`left`,`right`],Oa=class extends Ea{constructor(e={}){super({enable:!0,pointers:1,event:`pan`,threshold:10,direction:H.All,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1,this.pX=null,this.pY=null}getTouchAction(){let{options:{direction:e}}=this,t=[];return e&H.Horizontal&&t.push(Pi),e&H.Vertical&&t.push(Ni),t}getEventNames(){return Da.map(e=>this.options.event+e)}directionTest(e){let{options:t}=this,n=!0,{distance:r}=e,{direction:i}=e,a=e.deltaX,o=e.deltaY;return i&t.direction||(t.direction&H.Horizontal?(i=a===0?H.None:a<0?H.Left:H.Right,n=a!==this.pX,r=Math.abs(e.deltaX)):(i=o===0?H.None:o<0?H.Up:H.Down,n=o!==this.pY,r=Math.abs(e.deltaY))),e.direction=i,n&&r>t.threshold&&!!(i&t.direction)}attrTest(e){let t=!!(this.state&U.Began),n=!(this.options.coherent?.length&&e.eventType&(V.End|V.Cancel));return super.attrTest(e)&&(t||n&&this.coherentTest(e)&&this.directionTest(e))}emit(e){this.pX=e.deltaX,this.pY=e.deltaY;let t=H[e.direction].toLowerCase();t&&(e.additionalEvent=this.options.event+t),super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=!e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(U.Recognized|U.Cancelled|U.Failed)&&(this.state=U.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:-e.deltaX,deltaY:-e.deltaY,velocity:-e.velocity,velocityX:-e.velocityX,velocityY:-e.velocityY,overallVelocity:-e.overallVelocity,overallVelocityX:-e.overallVelocityX,overallVelocityY:-e.overallVelocityY})),e.isFinal&&(this.trackpadGesture=!1))}},ka=[``,`start`,`move`,`end`,`cancel`,`in`,`out`],Aa=class extends Ea{constructor(e={}){super({enable:!0,event:`pinch`,threshold:0,pointers:2,trackpad:!1,coherent:[],...e}),this.trackpadGesture=!1}getTouchAction(){return[Mi]}getEventNames(){return ka.map(e=>this.options.event+e)}attrTest(e){let t=!!this.options.coherent?.length,n=!!(this.state&U.Began),r=!(t&&e.eventType&(V.End|V.Cancel));return super.attrTest(e)&&(n||r&&(t?this.coherentTest(e):Math.abs(e.scale-1)>this.options.threshold))}emit(e){if(e.scale!==1){let t=e.scale<1?`in`:`out`;e.additionalEvent=this.options.event+t}super.emit(e)}handleTrackpadEvent(e){e.isFirst&&(this.trackpadGesture=e.srcEvent.ctrlKey,!this.trackpadGesture&&this.state&(U.Recognized|U.Cancelled|U.Failed)&&(this.state=U.Possible)),this.trackpadGesture&&(this.recognize(this.getTrackpadInput(e,{deltaX:0,deltaY:0,velocity:0,velocityX:0,velocityY:0,overallVelocity:0,overallVelocityX:0,overallVelocityY:0,scale:Math.exp(-e.deltaY/100)})),e.isFinal&&(this.trackpadGesture=!1))}},ja=class{constructor(e,t,n){this.element=e,this.callback=t,this.options=n}listen(e,t){t?this.element.addEventListener(e,this.handleEvent,{passive:!1}):this.element.removeEventListener(e,this.handleEvent)}},Ma=(typeof navigator<`u`&&navigator.userAgent?navigator.userAgent.toLowerCase():``).indexOf(`firefox`)!==-1,Na=40,Pa=.25,Fa=class extends ja{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{if(!this.options.enable)return;let t=e.deltaY;globalThis.WheelEvent&&(Ma&&e.deltaMode===globalThis.WheelEvent.DOM_DELTA_PIXEL&&(t/=globalThis.devicePixelRatio),e.deltaMode===globalThis.WheelEvent.DOM_DELTA_LINE&&(t*=Na)),e.shiftKey&&t&&(t*=Pa),this.callback({type:`wheel`,center:{x:e.clientX,y:e.clientY},delta:-t,device:this.options.wheelSession?.device??`unknown`,srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{}),this.listen(`wheel`,!0))}destroy(){this.listen(`wheel`,!1),this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0}enableEventType(e,t){e===`wheel`&&this.options.enable!==t&&(this.options.enable=t,t&&!this.wheelSessionUnsubscribe&&(this.wheelSessionUnsubscribe=this.options.wheelSession?.on(()=>{})),this.listen(`wheel`,t),t||(this.wheelSessionUnsubscribe?.(),this.wheelSessionUnsubscribe=void 0))}},Ia=4.000244140625,La=40,Ra=0,za=1,Ba=40,Va=40,Ha=120,Ua={classificationDelay:32,endDelay:80},Wa=class{constructor(e,t={}){this.subscriptions=new Map,this.session=null,this.classificationTimer=null,this.endTimer=null,this.pressedControlKeys=new Set,this.listeningForControlKeys=!1,this.handleEvent=e=>{if(!this.hasSubscribers)return`unknown`;let t=Ka(e,this.pressedControlKeys.size>0),n=this.session;if(n&&t.timeStamp-n.lastTimeStamp>=this.options.endDelay){if(this.end(),!this.hasSubscribers)return`unknown`;n=null}n?(this.scheduleEnd(),this.addSample(n,t)):(n=this.startPendingSession(t),this.scheduleEnd());let{device:r}=n;return r===`unknown`&&(r=qa(n.samples,!1),r!==`unknown`&&this.begin(n,r)),r},this.finishClassification=()=>{if(this.classificationTimer=null,!this.session||this.session.device!==`unknown`)return;let e=this.session,t=qa(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)},this.end=()=>{if(!this.session)return;if(this.session.device===`unknown`){let e=this.session,t=qa(e.samples,!0);this.begin(e,t===`unknown`?`mouse`:t)}if(!this.session)return;let e=this.session;this.emit(V.End,e.lastEvent),this.reset()},this.handleKeyDown=e=>{e.key===`Control`&&this.pressedControlKeys.add(e.code||e.key)},this.handleKeyUp=e=>{e.key===`Control`&&(e.code?this.pressedControlKeys.delete(e.code):this.pressedControlKeys.clear())},this.handleWindowBlur=()=>{this.pressedControlKeys.clear()},this.element=e,this.options={...Ua,...t},this.element?.addEventListener(`wheel`,this.handleEvent,{passive:!0})}get hasSubscribers(){return this.subscriptions.size>0}get device(){return this.session?.device??`unknown`}on(e){let t={listener:e};return this.subscriptions.set(e,t),this.updateControlKeyEventListeners(),()=>{this.subscriptions.get(e)===t&&this.off(e)}}off(e){this.subscriptions.delete(e),this.updateControlKeyEventListeners(),this.hasSubscribers||this.reset()}cancel(){let e=this.session;e&&e.device!==`unknown`&&this.emit(V.Cancel,e.lastEvent),this.reset()}destroy(){this.cancel(),this.subscriptions.clear(),this.updateControlKeyEventListeners(),this.element?.removeEventListener(`wheel`,this.handleEvent)}startPendingSession(e){let t={samples:[e],device:`unknown`,firstTimeStamp:e.timeStamp,lastTimeStamp:e.timeStamp,totalDeltaX:e.deltaX,totalDeltaY:e.deltaY,velocityX:0,velocityY:0,lastEvent:e.event};return this.session=t,this.classificationTimer=globalThis.setTimeout(this.finishClassification,this.options.classificationDelay),t}addSample(e,t){if(e.samples.push(t),e.lastTimeStamp=t.timeStamp,e.lastEvent=t.event,e.totalDeltaX+=t.deltaX,e.totalDeltaY+=t.deltaY,e.device!==`unknown`){let n=e.samples[e.samples.length-2],r=t.timeStamp-n.timeStamp;e.velocityX=r>0?t.deltaX/r:0,e.velocityY=r>0?t.deltaY/r:0,this.emit(V.Move,t.event,{velocityX:e.velocityX,velocityY:e.velocityY})}}begin(e,t){e.device=t,this.clearClassificationTimer(),this.emit(V.Start,e.samples[0].event);let n=e.lastTimeStamp-e.firstTimeStamp;e.velocityX=n>0?e.totalDeltaX/n:0,e.velocityY=n>0?e.totalDeltaY/n:0,this.emit(V.Move,e.lastEvent,{velocityX:e.velocityX,velocityY:e.velocityY})}scheduleEnd(){this.clearEndTimer(),this.endTimer=globalThis.setTimeout(this.end,this.options.endDelay)}emit(e,t,n){let r=this.session;if(!r||r.device===`unknown`)return;let i=e===V.Start,a=e===V.End||e===V.Cancel,o=i?r.firstTimeStamp:r.lastTimeStamp,s=i?0:Math.max(0,o-r.firstTimeStamp),c=i?0:r.totalDeltaX,l=i?0:r.totalDeltaY,u=s>0?c/s:0,d=s>0?l/s:0,f=i?0:n?.velocityX??r.velocityX,p=i?0:n?.velocityY??r.velocityY,m={eventType:e,device:r.device,srcEvent:t,timeStamp:o,center:{x:t.clientX,y:t.clientY},deltaX:c,deltaY:l,deltaTime:s,velocity:Math.abs(f)>Math.abs(p)?f:p,velocityX:f,velocityY:p,overallVelocity:Math.abs(u)>Math.abs(d)?u:d,overallVelocityX:u,overallVelocityY:d,isFirst:i,isFinal:a};for(let{listener:e}of[...this.subscriptions.values()])e(m)}reset(){this.clearClassificationTimer(),this.clearEndTimer(),this.session=null}clearClassificationTimer(){this.classificationTimer!==null&&(globalThis.clearTimeout(this.classificationTimer),this.classificationTimer=null)}clearEndTimer(){this.endTimer!==null&&(globalThis.clearTimeout(this.endTimer),this.endTimer=null)}updateControlKeyEventListeners(){let e=this.hasSubscribers,t=Ga();t&&e!==this.listeningForControlKeys&&(this.listeningForControlKeys=e,e?(t.addEventListener(`keydown`,this.handleKeyDown,!0),t.addEventListener(`keyup`,this.handleKeyUp,!0),t.addEventListener(`blur`,this.handleWindowBlur)):(t.removeEventListener(`keydown`,this.handleKeyDown,!0),t.removeEventListener(`keyup`,this.handleKeyUp,!0),t.removeEventListener(`blur`,this.handleWindowBlur),this.pressedControlKeys.clear()))}};function Ga(){return typeof window<`u`?window:globalThis.document?.defaultView}function Ka(e,t){let n=e.deltaX,r=e.deltaY;return e.deltaMode===za&&(n*=La,r*=La),{event:e,timeStamp:e.timeStamp,deltaX:n,deltaY:r,isControlKeyDown:t}}function qa(e,t){return e.some(({event:e,isControlKeyDown:t})=>e.ctrlKey&&!t)?`trackpad`:e.some(({event:e})=>e.deltaMode!==Ra)||e.some(Ja)||e.every(({event:e})=>{let t=e.wheelDelta;return t!==void 0&&Math.abs(t)%40==0})?`mouse`:e.some(({deltaX:e})=>e!==0)||e.length>1&&Ya(e)?`trackpad`:t?`mouse`:`unknown`}function Ja({event:e,deltaX:t,deltaY:n}){if(t!==0||n===0)return!1;let r=Math.abs(n/Ia);if(Number.isInteger(r))return!0;let i=e.wheelDelta;return typeof i==`number`&&i!==0&&i%Ha===0}function Ya(e){for(let t=0;t<e.length;t++){let n=e[t];if(Math.abs(n.deltaX)>Va||Math.abs(n.deltaY)>Va||t>0&&n.timeStamp-e[t-1].timeStamp>Ba)return!1}return!0}var Xa=[`mousedown`,`mousemove`,`mouseup`,`mouseover`,`mouseout`,`mouseenter`,`mouseleave`],Za=class extends ja{constructor(e,t,n){super(e,t,{enable:!0,...n}),this.handleEvent=e=>{this.handleOverEvent(e),this.handleOutEvent(e),this.handleEnterEvent(e),this.handleLeaveEvent(e),this.handleMoveEvent(e)},this.pressed=!1;let{enable:r=!1}=this.options;this.enableMoveEvent=r,this.enableLeaveEvent=r,this.enableEnterEvent=r,this.enableOutEvent=r,this.enableOverEvent=r,r&&Xa.forEach(e=>this.listen(e,!0))}destroy(){Xa.forEach(e=>this.listen(e,!1))}enableEventType(e,t){switch(e){case`pointermove`:this.enableMoveEvent!==t&&(this.enableMoveEvent=t,this.listen(`mousedown`,t),this.listen(`mousemove`,t),this.listen(`mouseup`,t));break;case`pointerover`:this.enableOverEvent!==t&&(this.enableOverEvent=t,this.listen(`mouseover`,t));break;case`pointerout`:this.enableOutEvent!==t&&(this.enableOutEvent=t,this.listen(`mouseout`,t));break;case`pointerenter`:this.enableEnterEvent!==t&&(this.enableEnterEvent=t,this.listen(`mouseenter`,t));break;case`pointerleave`:this.enableLeaveEvent!==t&&(this.enableLeaveEvent=t,this.listen(`mouseleave`,t))}}handleOverEvent(e){this.enableOverEvent&&e.type===`mouseover`&&this._emit(`pointerover`,e)}handleOutEvent(e){this.enableOutEvent&&e.type===`mouseout`&&this._emit(`pointerout`,e)}handleEnterEvent(e){this.enableEnterEvent&&e.type===`mouseenter`&&this._emit(`pointerenter`,e)}handleLeaveEvent(e){this.enableLeaveEvent&&e.type===`mouseleave`&&this._emit(`pointerleave`,e)}handleMoveEvent(e){if(this.enableMoveEvent)switch(e.type){case`mousedown`:e.button>=0&&(this.pressed=!0);break;case`mousemove`:e.buttons===0&&(this.pressed=!1),this.pressed||this._emit(`pointermove`,e);break;case`mouseup`:this.pressed=!1}}_emit(e,t){this.callback({type:e,center:{x:t.clientX,y:t.clientY},srcEvent:t,pointerType:`mouse`,target:t.target})}},Qa=[`keydown`,`keyup`],$a=class extends ja{constructor(e,t,n){super(e,t,{enable:!0,tabIndex:0,...n}),this.handleEvent=e=>{let t=e.target||e.srcElement;t.tagName===`INPUT`&&t.type===`text`||t.tagName===`TEXTAREA`||(this.enableDownEvent&&e.type===`keydown`&&this.callback({type:`keydown`,srcEvent:e,key:e.key,target:e.target}),this.enableUpEvent&&e.type===`keyup`&&this.callback({type:`keyup`,srcEvent:e,key:e.key,target:e.target}))};let{enable:r=!1}=this.options;this.enableDownEvent=r,this.enableUpEvent=r,e.tabIndex=this.options.tabIndex,e.style.outline=`none`,r&&Qa.forEach(e=>this.listen(e,!0))}destroy(){Qa.forEach(e=>this.listen(e,!1))}enableEventType(e,t){e===`keydown`&&this.enableDownEvent!==t&&(this.enableDownEvent=t,this.listen(e,t)),e===`keyup`&&this.enableUpEvent!==t&&(this.enableUpEvent=t,this.listen(e,t))}},eo=class extends ja{constructor(e,t,n){n.enable=n.enable??!1,super(e,t,n),this.handleEvent=e=>{this.options.enable&&this.callback({type:`contextmenu`,center:{x:e.clientX,y:e.clientY},srcEvent:e,pointerType:`mouse`,target:e.target})},n.enable&&this.listen(`contextmenu`,!0)}destroy(){this.listen(`contextmenu`,!1)}enableEventType(e,t){e===`contextmenu`&&this.options.enable!==t&&(this.options.enable=t,this.listen(`contextmenu`,t))}},to=1,no=2,ro=4,io={pointerdown:to,pointermove:no,pointerup:ro,mousedown:to,mousemove:no,mouseup:ro},ao=0,oo=1,so=2,co=1,lo=2,uo=4;function fo(e){let t=io[e.srcEvent.type];if(!t)return null;let{buttons:n,button:r}=e.srcEvent,i=!1,a=!1,o=!1;return t===no?(i=!!(n&co),a=!!(n&uo),o=!!(n&lo)):(i=r===ao,a=r===oo,o=r===so),{leftButton:i,middleButton:a,rightButton:o}}function po(e,t){let n=e.center;if(!n)return null;let r=t.getBoundingClientRect(),i=r.width/t.offsetWidth||1,a=r.height/t.offsetHeight||1;return{center:n,offsetCenter:{x:(n.x-r.left-t.clientLeft)/i,y:(n.y-r.top-t.clientTop)/a}}}var mo={srcElement:`root`,priority:0},ho=class{constructor(e,t){this.handleEvent=e=>{if(this.isEmpty())return;let t=this._normalizeEvent(e),n=e.srcEvent.target;for(;n&&n!==t.rootElement;){if(this._emit(t,n),t.handled)return;n=n.parentNode}this._emit(t,`root`)},this.eventManager=e,this.recognizerName=t,this.handlers=[],this.handlersByElement=new Map,this._active=!1}isEmpty(){return!this._active}add(e,t,n,r=!1,i=!1){let{handlers:a,handlersByElement:o}=this,s={...mo,...n},c=o.get(s.srcElement);c||(c=[],o.set(s.srcElement,c));let l={type:e,handler:t,srcElement:s.srcElement,priority:s.priority};r&&(l.once=!0),i&&(l.passive=!0),a.push(l),this._active=this._active||!l.passive;let u=c.length-1;for(;u>=0&&!(c[u].priority>=l.priority);)u--;c.splice(u+1,0,l)}remove(e,t){let{handlers:n,handlersByElement:r}=this;for(let i=n.length-1;i>=0;i--){let a=n[i];if(a.type===e&&a.handler===t){n.splice(i,1);let e=r.get(a.srcElement);e.splice(e.indexOf(a),1),e.length===0&&r.delete(a.srcElement)}}this._active=n.some(e=>!e.passive)}_emit(e,t){let n=this.handlersByElement.get(t);if(n){let t=!1,r=()=>{e.handled=!0},i=()=>{e.handled=!0,t=!0},a=[];for(let o=0;o<n.length;o++){let{type:s,handler:c,once:l}=n[o];if(c({...e,type:s,stopPropagation:r,stopImmediatePropagation:i}),l&&a.push(n[o]),t)break}for(let e=0;e<a.length;e++){let{type:t,handler:n}=a[e];this.remove(t,n)}}}_normalizeEvent(e){let t=this.eventManager.getElement();return{...e,...fo(e),...po(e,t),preventDefault:()=>{e.srcEvent.preventDefault()},stopImmediatePropagation:null,stopPropagation:null,handled:!1,rootElement:t}}};function go(e){if(`recognizer`in e)return e;let t,n=Array.isArray(e)?[...e]:[e];return t=typeof n[0]==`function`?new(n.shift())(n.shift()||{}):n.shift(),{recognizer:t,recognizeWith:typeof n[0]==`string`?[n[0]]:n[0],requireFailure:typeof n[1]==`string`?[n[1]]:n[1]}}var _o=class{constructor(e=null,t={}){if(this._onBasicInput=e=>{this.manager.emit(e.srcEvent.type,e)},this._onOtherEvent=e=>{this.manager.emit(e.type,e)},this.options={recognizers:[],events:{},touchAction:`compute`,tabIndex:0,cssProps:{},...t},this.events=new Map,this.element=e,this.wheelSession=new Wa(e),e){this.manager=new ha(e,this.options);for(let e of this.options.recognizers){let{recognizer:t,recognizeWith:n,requireFailure:r}=go(e);this.manager.add(t),n&&t.recognizeWith(n),r&&t.requireFailure(r)}this.manager.on(`hammer.input`,this._onBasicInput),this.wheelInput=new Fa(e,this._onOtherEvent,{enable:!1,wheelSession:this.wheelSession}),this.moveInput=new Za(e,this._onOtherEvent,{enable:!1}),this.keyInput=new $a(e,this._onOtherEvent,{enable:!1,tabIndex:t.tabIndex}),this.contextmenuInput=new eo(e,this._onOtherEvent,{enable:!1}),this.on(this.options.events)}}getElement(){return this.element}destroy(){if(!this.element){this.wheelSession.destroy();return}this.wheelInput.destroy(),this.wheelSession.destroy(),this.moveInput.destroy(),this.keyInput.destroy(),this.contextmenuInput.destroy(),this.manager.destroy()}on(e,t,n){this._addEventHandler(e,t,n,!1)}once(e,t,n){this._addEventHandler(e,t,n,!0)}watch(e,t,n){this._addEventHandler(e,t,n,!1,!0)}off(e,t){this._removeEventHandler(e,t)}emit(e){this.manager?.emit(e.type,e)}_toggleRecognizer(e,t){let{manager:n}=this;if(!n)return;let r=n.get(e);r&&(r.set({enable:t,wheelSession:this.wheelSession}),n.touchAction.update()),this.wheelInput?.enableEventType(e,t),this.moveInput?.enableEventType(e,t),this.keyInput?.enableEventType(e,t),this.contextmenuInput?.enableEventType(e,t)}_addEventHandler(e,t,n,r,i){if(typeof e!=`string`){n=t;for(let[t,a]of Object.entries(e))this._addEventHandler(t,a,n,r,i);return}let{manager:a,events:o}=this;if(!a)return;let s=o.get(e);if(!s){let t=this._getRecognizerName(e)||e;s=new ho(this,t),o.set(e,s),a&&a.on(e,s.handleEvent)}s.add(e,t,n,r,i),s.isEmpty()||this._toggleRecognizer(s.recognizerName,!0)}_removeEventHandler(e,t){if(typeof e!=`string`){for(let[t,n]of Object.entries(e))this._removeEventHandler(t,n);return}let{events:n}=this,r=n.get(e);if(r&&(r.remove(e,t),r.isEmpty())){let{recognizerName:e}=r,t=!1;for(let r of n.values())if(r.recognizerName===e&&!r.isEmpty()){t=!0;break}t||this._toggleRecognizer(e,!1)}}_getRecognizerName(e){return this.manager.recognizers.find(t=>t.getEventNames().includes(e))?.options.event}},vo={DEFAULT:`default`,LNGLAT:`lnglat`,METER_OFFSETS:`meter-offsets`,LNGLAT_OFFSETS:`lnglat-offsets`,CARTESIAN:`cartesian`};Object.defineProperty(vo,"IDENTITY",{get:()=>(oe.deprecated(`COORDINATE_SYSTEM.IDENTITY`,`COORDINATE_SYSTEM.CARTESIAN`)(),vo.CARTESIAN)});var W={WEB_MERCATOR:1,GLOBE:2,WEB_MERCATOR_AUTO_OFFSET:4,IDENTITY:0},yo={common:0,meters:1,pixels:2},bo={click:`onClick`,dblclick:`onClick`,panstart:`onDragStart`,panmove:`onDrag`,panend:`onDragEnd`},xo={multipan:[Oa,{threshold:10,pointers:2,trackpad:!0}],pinch:[Aa,{trackpad:!0},null,[`multipan`]],pan:[Oa,{threshold:1},[`pinch`],[`multipan`]],dblclick:[Ta,{event:`dblclick`,taps:2,enable:!1}],dblclickdrag:[wa,{event:`dblclickdrag`,enable:!1},[`dblclick`],null],click:[Ta,{event:`click`},[`dblclickdrag`],[`dblclick`,`dblclickdrag`]]};function So(e,t){if(e===t)return!0;if(Array.isArray(e)){let n=e.length;if(!t||t.length!==n)return!1;for(let r=0;r<n;r++)if(e[r]!==t[r])return!1;return!0}return!1}function Co(e){let t={},n;return r=>{for(let i in r)if(!So(r[i],t[i])){n=e(r),t=r;break}return n}}var wo=[0,0,0,0],To=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,0],Eo=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],Do=[0,0,0],Oo=[0,0,0],ko={default:-1,cartesian:0,lnglat:1,"meter-offsets":2,"lnglat-offsets":3};function Ao(e){let t=ko[e];if(t===void 0)throw Error(`Invalid coordinateSystem: ${e}`);return t}var jo=Co(Fo);function Mo(e,t,n=Oo){n.length<3&&(n=[n[0],n[1],0]);let r=n,i,a=!0;switch(i=t===`lnglat-offsets`||t===`meter-offsets`?n:e.isGeospatial?[Math.fround(e.longitude),Math.fround(e.latitude),0]:null,e.projectionMode){case W.WEB_MERCATOR:(t===`lnglat`||t===`cartesian`)&&(i=[0,0,0],a=!1);break;case W.WEB_MERCATOR_AUTO_OFFSET:t===`lnglat`?r=i:t===`cartesian`&&(r=[Math.fround(e.center[0]),Math.fround(e.center[1]),0],i=e.unprojectPosition(r),r[0]-=n[0],r[1]-=n[1],r[2]-=n[2]);break;case W.IDENTITY:r=e.position.map(Math.fround),r[2]=r[2]||0;break;case W.GLOBE:a=!1,i=null;break;default:a=!1}return{geospatialOrigin:i,shaderCoordinateOrigin:r,offsetMode:a}}function No(e,t,n){let{viewMatrixUncentered:r,projectionMatrix:i}=e,{viewMatrix:a,viewProjectionMatrix:o}=e,s=wo,c=wo,l=e.cameraPosition,{geospatialOrigin:u,shaderCoordinateOrigin:f,offsetMode:p}=Mo(e,t,n);return p&&(c=e.projectPosition(u||f),l=[l[0]-c[0],l[1]-c[1],l[2]-c[2]],c[3]=1,s=d([],c,o),a=r||a,o=v([],i,a),o=v([],o,To)),{viewMatrix:a,viewProjectionMatrix:o,projectionCenter:s,originCommon:c,cameraPosCommon:l,shaderCoordinateOrigin:f,geospatialOrigin:u}}function Po({viewport:e,devicePixelRatio:t=1,modelMatrix:n=null,coordinateSystem:r=`default`,coordinateOrigin:i=Oo,autoWrapLongitude:a=!1}){r==="default"&&(r=e.isGeospatial?`lnglat`:`cartesian`);let o=jo({viewport:e,devicePixelRatio:t,coordinateSystem:r,coordinateOrigin:i});return o.wrapLongitude=a,o.modelMatrix=n||Eo,o}function Fo({viewport:e,devicePixelRatio:t,coordinateSystem:n,coordinateOrigin:r}){let{projectionCenter:i,viewProjectionMatrix:a,originCommon:o,cameraPosCommon:s,shaderCoordinateOrigin:c,geospatialOrigin:l}=No(e,n,r),u=e.getDistanceScales(),f=[e.width*t,e.height*t],p=d([],[0,0,-e.focalDistance,1],e.projectionMatrix)[3]||1,m={coordinateSystem:Ao(n),projectionMode:e.projectionMode,coordinateOrigin:c,commonOrigin:o.slice(0,3),center:i,pseudoMeters:!!e._pseudoMeters,viewportSize:f,devicePixelRatio:t,focalDistance:p,commonUnitsPerMeter:u.unitsPerMeter,commonUnitsPerWorldUnit:u.unitsPerMeter,commonUnitsPerWorldUnit2:Do,scale:e.scale,wrapLongitude:!1,viewProjectionMatrix:a,modelMatrix:Eo,cameraPosition:s};if(l){let t=e.getDistanceScales(l);switch(n){case`meter-offsets`:m.commonUnitsPerWorldUnit=t.unitsPerMeter,m.commonUnitsPerWorldUnit2=t.unitsPerMeter2;break;case`lnglat`:case`lnglat-offsets`:e._pseudoMeters||(m.commonUnitsPerMeter=t.unitsPerMeter),m.commonUnitsPerWorldUnit=t.unitsPerDegree,m.commonUnitsPerWorldUnit2=t.unitsPerDegree2;break;case`cartesian`:m.commonUnitsPerWorldUnit=[1,1,t.unitsPerMeter[2]],m.commonUnitsPerWorldUnit2=[0,0,t.unitsPerMeter2[2]]}}if(e.projectionMode===W.GLOBE&&n===`meter-offsets`){let e=r[0]*Math.PI/180,t=r[1]*Math.PI/180,n=Math.cos(t),i=((r[2]||0)/6370972+1)*256;m.commonOrigin=[Math.sin(e)*n*i,-Math.cos(e)*n*i,Math.sin(t)*i]}return m}var Io=`\
${`\
${[`default`,`lnglat`,`meter-offsets`,`lnglat-offsets`,`cartesian`].map(e=>`const COORDINATE_SYSTEM_${e.toUpperCase().replaceAll(`-`,`_`)}: i32 = ${Ao(e)};`).join(``)}
${Object.keys(W).map(e=>`const PROJECTION_MODE_${e}: i32 = ${W[e]};`).join(``)}
${Object.keys(yo).map(e=>`const UNIT_${e.toUpperCase()}: i32 = ${yo[e]};`).join(``)}

const TILE_SIZE: f32 = 512.0;
const PI: f32 = 3.1415926536;
const WORLD_SCALE: f32 = TILE_SIZE / (PI * 2.0);
const ZERO_64_LOW: vec3<f32> = vec3<f32>(0.0, 0.0, 0.0);
const EARTH_RADIUS: f32 = 6370972.0; // meters
const GLOBE_RADIUS: f32 = 256.0;

// -----------------------------------------------------------------------------
// Uniform block (converted from GLSL uniform block)
// -----------------------------------------------------------------------------
struct ProjectUniforms {
  wrapLongitude: i32,
  coordinateSystem: i32,
  commonUnitsPerMeter: vec3<f32>,
  projectionMode: i32,
  scale: f32,
  commonUnitsPerWorldUnit: vec3<f32>,
  commonUnitsPerWorldUnit2: vec3<f32>,
  center: vec4<f32>,
  modelMatrix: mat4x4<f32>,
  viewProjectionMatrix: mat4x4<f32>,
  viewportSize: vec2<f32>,
  devicePixelRatio: f32,
  focalDistance: f32,
  cameraPosition: vec3<f32>,
  coordinateOrigin: vec3<f32>,
  commonOrigin: vec3<f32>,
  pseudoMeters: i32,
};

@group(0) @binding(auto)
var<uniform> project: ProjectUniforms;

// -----------------------------------------------------------------------------
// Geometry data shared across the project helpers.
// The active layer shader is responsible for populating this private module
// state before calling the project functions below.
// -----------------------------------------------------------------------------

// Structure to carry additional geometry data used by deck.gl filters.
struct Geometry {
  worldPosition: vec3<f32>,
  worldPositionAlt: vec3<f32>,
  position: vec4<f32>,
  normal: vec3<f32>,
  uv: vec2<f32>,
  pickingColor: vec3<f32>,
};

var<private> geometry: Geometry;
`}

// -----------------------------------------------------------------------------
// Functions
// -----------------------------------------------------------------------------

// Returns an adjustment factor for commonUnitsPerMeter
fn _project_size_at_latitude(lat: f32) -> f32 {
  let y = clamp(lat, -89.9, 89.9);
  return 1.0 / cos(radians(y));
}

// Overloaded version: scales a value in meters at a given latitude.
fn _project_size_at_latitude_m(meters: f32, lat: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * _project_size_at_latitude(lat);
}

// Computes a non-linear scale factor based on geometry.
// (Note: This function relies on "geometry" being provided.)
fn project_size() -> f32 {
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
      project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
      project.pseudoMeters == 0) {
    if (geometry.position.w == 0.0) {
      return _project_size_at_latitude(geometry.worldPosition.y);
    }
    let y: f32 = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
    let y2 = y * y;
    let y4 = y2 * y2;
    let y6 = y4 * y2;
    return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
  }
  return 1.0;
}

// Overloads to scale offsets (meters to world units)
fn project_size_float(meters: f32) -> f32 {
  return meters * project.commonUnitsPerMeter.z * project_size();
}

fn project_size_vec2(meters: vec2<f32>) -> vec2<f32> {
  return meters * project.commonUnitsPerMeter.xy * project_size();
}

fn project_size_vec3(meters: vec3<f32>) -> vec3<f32> {
  return meters * project.commonUnitsPerMeter * project_size();
}

fn project_size_vec4(meters: vec4<f32>) -> vec4<f32> {
  return vec4<f32>(meters.xyz * project.commonUnitsPerMeter, meters.w);
}

// Returns a rotation matrix aligning the z‑axis with the given up vector.
fn project_get_orientation_matrix(up: vec3<f32>) -> mat3x3<f32> {
  let uz = normalize(up);
  let ux = select(
    vec3<f32>(1.0, 0.0, 0.0),
    normalize(vec3<f32>(uz.y, -uz.x, 0.0)),
    abs(uz.z) == 1.0
  );
  let uy = cross(uz, ux);
  return mat3x3<f32>(ux, uy, uz);
}

// Since WGSL does not support "out" parameters, we return a struct.
struct RotationResult {
  needsRotation: bool,
  transform: mat3x3<f32>,
};

fn project_needs_rotation(commonPosition: vec3<f32>) -> RotationResult {
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    return RotationResult(true, project_get_orientation_matrix(commonPosition));
  } else {
    return RotationResult(false, mat3x3<f32>());  // identity alternative if needed
  };
}

// Projects a normal vector from the current coordinate system to world space.
fn project_normal(vector: vec3<f32>) -> vec3<f32> {
  let normal_modelspace = project.modelMatrix * vec4<f32>(vector, 0.0);
  var n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
  let rotResult = project_needs_rotation(geometry.position.xyz);
  if (rotResult.needsRotation) {
    n = rotResult.transform * n;
  }
  return n;
}

// Applies a scale offset based on y-offset (dy)
fn project_offset_(offset: vec4<f32>) -> vec4<f32> {
  let dy: f32 = offset.y;
  let commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
  return vec4<f32>(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}

// Projects lng/lat coordinates to a unit tile [0,1]
fn project_mercator_(lnglat: vec2<f32>) -> vec2<f32> {
  var x = lnglat.x;
  if (project.wrapLongitude != 0) {
    x = ((x + 180.0) % 360.0) - 180.0;
  }
  let y = clamp(lnglat.y, -89.9, 89.9);
  return vec2<f32>(
    radians(x) + PI,
    PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
  ) * WORLD_SCALE;
}

// Projects lng/lat/z coordinates for a globe projection.
fn project_globe_(lnglatz: vec3<f32>) -> vec3<f32> {
  let lambda = radians(lnglatz.x);
  let phi = radians(lnglatz.y);
  let cosPhi = cos(phi);
  let D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
  return vec3<f32>(
    sin(lambda) * cosPhi,
    -cos(lambda) * cosPhi,
    sin(phi)
  ) * D;
}

// Projects positions (with an optional 64-bit low part) from the input
// coordinate system to the common space.
fn project_position_vec4_f64(position: vec4<f32>, position64Low: vec3<f32>) -> vec4<f32> {
  var position_world = project.modelMatrix * position;

  // Work around for a Mac+NVIDIA bug:
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_mercator_(position_world.xy),
        _project_size_at_latitude_m(position_world.z, position_world.y),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
      position_world = vec4f(position_world.xyz + project.coordinateOrigin, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_GLOBE) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      return vec4<f32>(
        project_globe_(position_world.xyz),
        position_world.w
      );
    }
    if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
      let enuMatrix = project_get_orientation_matrix(project.commonOrigin);
      let metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
      let offsetCommon = (enuMatrix * vec3<f32>(-position_world.x, -position_world.y, position_world.z)) * metersToCommon;
      return vec4<f32>(project.commonOrigin + offsetCommon, position_world.w);
    }
  }
  if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
    if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
      if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
        return vec4<f32>(
          project_mercator_(position_world.xy) - project.commonOrigin.xy,
          project_size_float(position_world.z),
          position_world.w
        );
      }
    }
  }
  if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
      (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
       (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
        project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
    position_world = vec4f(position_world.xyz - project.coordinateOrigin, position_world.w);
  }

  return project_offset_(position_world) +
         project_offset_(project.modelMatrix * vec4<f32>(position64Low, 0.0));
}

// Overloaded versions for different input types.
fn project_position_vec4_f32(position: vec4<f32>) -> vec4<f32> {
  return project_position_vec4_f64(position, ZERO_64_LOW);
}

fn project_position_vec3_f64(position: vec3<f32>, position64Low: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), position64Low);
  return projected_position.xyz;
}

fn project_position_vec3_f32(position: vec3<f32>) -> vec3<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 1.0), ZERO_64_LOW);
  return projected_position.xyz;
}

fn project_position_vec2_f32(position: vec2<f32>) -> vec2<f32> {
  let projected_position = project_position_vec4_f64(vec4<f32>(position, 0.0, 1.0), ZERO_64_LOW);
  return projected_position.xy;
}

// Transforms a common space position to clip space.
fn project_common_position_to_clipspace_with_projection(position: vec4<f32>, viewProjectionMatrix: mat4x4<f32>, center: vec4<f32>) -> vec4<f32> {
  var clipPosition = viewProjectionMatrix * position + center;
  // deck.gl projection matrices use WebGL's [-w, w] depth range; WebGPU clips z to [0, w].
  clipPosition.z = (clipPosition.z + clipPosition.w) * 0.5;
  return clipPosition;
}

// Uses the project viewProjectionMatrix and center.
fn project_common_position_to_clipspace(position: vec4<f32>) -> vec4<f32> {
  return project_common_position_to_clipspace_with_projection(position, project.viewProjectionMatrix, project.center);
}

// Returns a clip space offset corresponding to a given number of screen pixels.
fn project_pixel_size_to_clipspace(pixels: vec2<f32>) -> vec2<f32> {
  let offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
  return offset * project.focalDistance;
}

fn project_meter_size_to_pixel(meters: f32) -> f32 {
  return project_size_float(meters) * project.scale;
}

fn project_unit_size_to_pixel(size: f32, unit: i32) -> f32 {
  if (unit == UNIT_METERS) {
    return project_meter_size_to_pixel(size);
  } else if (unit == UNIT_COMMON) {
    return size * project.scale;
  }
  // UNIT_PIXELS: no scaling applied.
  return size;
}

fn project_pixel_size_float(pixels: f32) -> f32 {
  return pixels / project.scale;
}

fn project_pixel_size_vec2(pixels: vec2<f32>) -> vec2<f32> {
  return pixels / project.scale;
}
`,Lo=`\
${[`default`,`lnglat`,`meter-offsets`,`lnglat-offsets`,`cartesian`].map(e=>`const int COORDINATE_SYSTEM_${e.toUpperCase().replaceAll(`-`,`_`)} = ${Ao(e)};`).join(``)}
${Object.keys(W).map(e=>`const int PROJECTION_MODE_${e} = ${W[e]};`).join(``)}
${Object.keys(yo).map(e=>`const int UNIT_${e.toUpperCase()} = ${yo[e]};`).join(``)}
layout(std140) uniform projectUniforms {
bool wrapLongitude;
int coordinateSystem;
vec3 commonUnitsPerMeter;
int projectionMode;
float scale;
vec3 commonUnitsPerWorldUnit;
vec3 commonUnitsPerWorldUnit2;
vec4 center;
mat4 modelMatrix;
mat4 viewProjectionMatrix;
vec2 viewportSize;
float devicePixelRatio;
float focalDistance;
vec3 cameraPosition;
vec3 coordinateOrigin;
vec3 commonOrigin;
bool pseudoMeters;
} project;
const float TILE_SIZE = 512.0;
const float PI = 3.1415926536;
const float WORLD_SCALE = TILE_SIZE / (PI * 2.0);
const vec3 ZERO_64_LOW = vec3(0.0);
const float EARTH_RADIUS = 6370972.0;
const float GLOBE_RADIUS = 256.0;
float project_size_at_latitude(float lat) {
float y = clamp(lat, -89.9, 89.9);
return 1.0 / cos(radians(y));
}
float project_size() {
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR &&
project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT &&
project.pseudoMeters == false) {
if (geometry.position.w == 0.0) {
return project_size_at_latitude(geometry.worldPosition.y);
}
float y = geometry.position.y / TILE_SIZE * 2.0 - 1.0;
float y2 = y * y;
float y4 = y2 * y2;
float y6 = y4 * y2;
return 1.0 + 4.9348 * y2 + 4.0587 * y4 + 1.5642 * y6;
}
return 1.0;
}
float project_size_at_latitude(float meters, float lat) {
return meters * project.commonUnitsPerMeter.z * project_size_at_latitude(lat);
}
float project_size(float meters) {
return meters * project.commonUnitsPerMeter.z * project_size();
}
vec2 project_size(vec2 meters) {
return meters * project.commonUnitsPerMeter.xy * project_size();
}
vec3 project_size(vec3 meters) {
return meters * project.commonUnitsPerMeter * project_size();
}
vec4 project_size(vec4 meters) {
return vec4(meters.xyz * project.commonUnitsPerMeter, meters.w);
}
mat3 project_get_orientation_matrix(vec3 up) {
vec3 uz = normalize(up);
vec3 ux = abs(uz.z) == 1.0 ? vec3(1.0, 0.0, 0.0) : normalize(vec3(uz.y, -uz.x, 0));
vec3 uy = cross(uz, ux);
return mat3(ux, uy, uz);
}
bool project_needs_rotation(vec3 commonPosition, out mat3 transform) {
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
transform = project_get_orientation_matrix(commonPosition);
return true;
}
return false;
}
vec3 project_normal(vec3 vector) {
vec4 normal_modelspace = project.modelMatrix * vec4(vector, 0.0);
vec3 n = normalize(normal_modelspace.xyz * project.commonUnitsPerMeter);
mat3 rotation;
if (project_needs_rotation(geometry.position.xyz, rotation)) {
n = rotation * n;
}
return n;
}
vec4 project_offset_(vec4 offset) {
float dy = offset.y;
vec3 commonUnitsPerWorldUnit = project.commonUnitsPerWorldUnit + project.commonUnitsPerWorldUnit2 * dy;
return vec4(offset.xyz * commonUnitsPerWorldUnit, offset.w);
}
vec2 project_mercator_(vec2 lnglat) {
float x = lnglat.x;
if (project.wrapLongitude) {
x = mod(x + 180., 360.0) - 180.;
}
float y = clamp(lnglat.y, -89.9, 89.9);
return vec2(
radians(x) + PI,
PI + log(tan_fp32(PI * 0.25 + radians(y) * 0.5))
) * WORLD_SCALE;
}
vec3 project_globe_(vec3 lnglatz) {
float lambda = radians(lnglatz.x);
float phi = radians(lnglatz.y);
float cosPhi = cos(phi);
float D = (lnglatz.z / EARTH_RADIUS + 1.0) * GLOBE_RADIUS;
return vec3(
sin(lambda) * cosPhi,
-cos(lambda) * cosPhi,
sin(phi)
) * D;
}
vec4 project_position(vec4 position, vec3 position64Low) {
vec4 position_world = project.modelMatrix * position;
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_mercator_(position_world.xy),
project_size_at_latitude(position_world.z, position_world.y),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN) {
position_world.xyz += project.coordinateOrigin;
}
}
if (project.projectionMode == PROJECTION_MODE_GLOBE) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
return vec4(
project_globe_(position_world.xyz),
position_world.w
);
}
if (project.coordinateSystem == COORDINATE_SYSTEM_METER_OFFSETS) {
mat3 enuMatrix = project_get_orientation_matrix(project.commonOrigin);
float metersToCommon = GLOBE_RADIUS / EARTH_RADIUS;
vec3 offsetCommon = (enuMatrix * vec3(-position_world.xy, position_world.z)) * metersToCommon;
return vec4(project.commonOrigin + offsetCommon, position_world.w);
}
}
if (project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET) {
if (project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT) {
if (abs(position_world.y - project.coordinateOrigin.y) > 0.25) {
return vec4(
project_mercator_(position_world.xy) - project.commonOrigin.xy,
project_size(position_world.z),
position_world.w
);
}
}
}
if (project.projectionMode == PROJECTION_MODE_IDENTITY ||
(project.projectionMode == PROJECTION_MODE_WEB_MERCATOR_AUTO_OFFSET &&
(project.coordinateSystem == COORDINATE_SYSTEM_LNGLAT ||
project.coordinateSystem == COORDINATE_SYSTEM_CARTESIAN))) {
position_world.xyz -= project.coordinateOrigin;
}
return project_offset_(position_world) + project_offset_(project.modelMatrix * vec4(position64Low, 0.0));
}
vec4 project_position(vec4 position) {
return project_position(position, ZERO_64_LOW);
}
vec3 project_position(vec3 position, vec3 position64Low) {
vec4 projected_position = project_position(vec4(position, 1.0), position64Low);
return projected_position.xyz;
}
vec3 project_position(vec3 position) {
vec4 projected_position = project_position(vec4(position, 1.0), ZERO_64_LOW);
return projected_position.xyz;
}
vec2 project_position(vec2 position) {
vec4 projected_position = project_position(vec4(position, 0.0, 1.0), ZERO_64_LOW);
return projected_position.xy;
}
vec4 project_common_position_to_clipspace(vec4 position, mat4 viewProjectionMatrix, vec4 center) {
return viewProjectionMatrix * position + center;
}
vec4 project_common_position_to_clipspace(vec4 position) {
return project_common_position_to_clipspace(position, project.viewProjectionMatrix, project.center);
}
vec2 project_pixel_size_to_clipspace(vec2 pixels) {
vec2 offset = pixels / project.viewportSize * project.devicePixelRatio * 2.0;
return offset * project.focalDistance;
}
float project_size_to_pixel(float meters) {
return project_size(meters) * project.scale;
}
vec2 project_size_to_pixel(vec2 meters) {
return project_size(meters) * project.scale;
}
float project_size_to_pixel(float size, int unit) {
if (unit == UNIT_METERS) return project_size_to_pixel(size);
if (unit == UNIT_COMMON) return size * project.scale;
return size;
}
float project_pixel_size(float pixels) {
return pixels / project.scale;
}
vec2 project_pixel_size(vec2 pixels) {
return pixels / project.scale;
}
`,Ro={};function zo(e=Ro){return`viewport`in e?Po(e):{}}var Bo={name:`project`,dependencies:[Ei,ki],source:Io,vs:Lo,getUniforms:zo,uniformTypes:{wrapLongitude:`f32`,coordinateSystem:`i32`,commonUnitsPerMeter:`vec3<f32>`,projectionMode:`i32`,scale:`f32`,commonUnitsPerWorldUnit:`vec3<f32>`,commonUnitsPerWorldUnit2:`vec3<f32>`,center:`vec4<f32>`,modelMatrix:`mat4x4<f32>`,viewProjectionMatrix:`mat4x4<f32>`,viewportSize:`vec2<f32>`,devicePixelRatio:`f32`,focalDistance:`f32`,cameraPosition:`vec3<f32>`,coordinateOrigin:`vec3<f32>`,commonOrigin:`vec3<f32>`,pseudoMeters:`f32`}};function Vo(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function G(e,t){let n=d([],t,e);return _(n,n,1/n[3]),n}function Ho(e,t,n){return e<t?t:e>n?n:e}function Uo(e){return Math.log(e)*Math.LOG2E}var Wo=Math.log2||Uo;function K(e,t){if(!e)throw Error(t||`@math.gl/web-mercator: assertion failed.`)}var q=Math.PI,Go=q/4,J=q/180,Ko=180/q,Y=512,qo=4003e4,X=85.051129,Jo=1.5;function Yo(e){return Wo(e)}function Xo(e){let[t,n]=e;K(Number.isFinite(t)),K(Number.isFinite(n)&&n>=-90&&n<=90,`invalid latitude`);let r=t*J,i=n*J;return[Y*(r+q)/(2*q),Y*(q+Math.log(Math.tan(Go+i*.5)))/(2*q)]}function Zo(e){let[t,n]=e,r=t/Y*(2*q)-q,i=2*(Math.atan(Math.exp(n/Y*(2*q)-q))-Go);return[r*Ko,i*Ko]}function Qo(e){let{latitude:t}=e;return K(Number.isFinite(t)),Yo(qo*Math.cos(t*J))-9}function $o(e){let t=Math.cos(e*J);return Y/qo/t}function es(e){let{latitude:t,longitude:n,highPrecision:r=!1}=e;K(Number.isFinite(t)&&Number.isFinite(n));let i=Y,a=Math.cos(t*J),o=i/360,s=o/a,c=i/qo/a,l={unitsPerMeter:[c,c,c],metersPerUnit:[1/c,1/c,1/c],unitsPerDegree:[o,s,c],degreesPerUnit:[1/o,1/s,1/c]};if(r){let e=J*Math.tan(t*J)/a,n=o*e/2,r=i/qo*e,u=r/s*c;l.unitsPerDegree2=[0,n,r],l.unitsPerMeter2=[u,0,u]}return l}function ts(e,t){let[n,r,i]=e,[a,o,s]=t,{unitsPerMeter:c,unitsPerMeter2:l}=es({longitude:n,latitude:r,highPrecision:!0}),u=Xo(e);u[0]+=a*(c[0]+l[0]*o),u[1]+=o*(c[1]+l[1]*o);let d=Zo(u),f=(i||0)+(s||0);return Number.isFinite(i)||Number.isFinite(s)?[d[0],d[1],f]:d}function ns(e){let{height:n,pitch:r,bearing:i,altitude:a,scale:o,center:s}=e,c=Vo();u(c,c,[0,0,-a]),l(c,c,-r*J),p(c,c,i*J);let d=o/n;return y(c,c,[d,d,d]),s&&u(c,c,t([],s)),c}function rs(e){let{width:t,height:n,altitude:r,pitch:i=0,offset:a,center:o,scale:s,nearZMultiplier:c=1,farZMultiplier:l=1}=e,{fovy:u=is(Jo)}=e;r!==void 0&&(u=is(r));let d=u*J,f=i*J,p=as(u),m=p;o&&(m+=o[2]*s/Math.cos(f)/n);let h=d*(.5+(a?a[1]:0)/n),g=Math.sin(h)*m/Math.sin(Ho(Math.PI/2-f-h,.01,Math.PI-.01)),_=Math.sin(f)*g+m,v=m*10,y=Math.min(_*l,v);return{fov:d,aspect:t/n,focalDistance:p,near:c,far:y}}function is(e){return 2*Math.atan(.5/e)*Ko}function as(e){return .5/Math.tan(.5*e*J)}function os(e,t){let[n,r,i=0]=e;return K(Number.isFinite(n)&&Number.isFinite(r)&&Number.isFinite(i)),G(t,[n,r,i,1])}function ss(e,t,n=0){let[r,a,o]=e;if(K(Number.isFinite(r)&&Number.isFinite(a),`invalid pixel coordinate`),Number.isFinite(o))return G(t,[r,a,o,1]);let s=G(t,[r,a,0,1]),c=G(t,[r,a,1,1]),l=s[2],u=c[2],d=l===u?0:((n||0)-l)/(u-l);return i([],s,c,d)}function cs(e){let{width:t,height:n,bounds:r,minExtent:i=0,maxZoom:a=24,offset:o=[0,0]}=e,[[s,c],[l,u]]=r,d=ls(e.padding),f=Xo([s,Ho(u,-X,X)]),p=Xo([l,Ho(c,-X,X)]),m=[Math.max(Math.abs(p[0]-f[0]),i),Math.max(Math.abs(p[1]-f[1]),i)],h=[t-d.left-d.right-Math.abs(o[0])*2,n-d.top-d.bottom-Math.abs(o[1])*2];K(h[0]>0&&h[1]>0);let g=h[0]/m[0],_=h[1]/m[1],v=(d.right-d.left)/2/g,y=(d.top-d.bottom)/2/_,b=Zo([(p[0]+f[0])/2+v,(p[1]+f[1])/2+y]),x=Math.min(a,Wo(Math.abs(Math.min(g,_))));return K(Number.isFinite(x)),{longitude:b[0],latitude:b[1],zoom:x}}function ls(e=0){return typeof e==`number`?{top:e,bottom:e,left:e,right:e}:(K(Number.isFinite(e.top)&&Number.isFinite(e.bottom)&&Number.isFinite(e.left)&&Number.isFinite(e.right)),e)}var us=Math.PI/180;function ds(e,t=0){let{width:n,height:r,unproject:i}=e,a={targetZ:t},o=i([0,r],a),s=i([n,r],a),c,l;return(e.fovy?.5*e.fovy*us:Math.atan(.5/e.altitude))>(90-e.pitch)*us-.01?(c=fs(e,0,t),l=fs(e,n,t)):(c=i([0,0],a),l=i([n,0],a)),[o,s,l,c]}function fs(e,t,n){let{pixelUnprojectionMatrix:r}=e,a=G(r,[t,0,1,1]),o=G(r,[t,e.height,1,1]),s=(n*e.distanceScales.unitsPerMeter[2]-a[2])/(o[2]-a[2]),c=Zo(i([],a,o,s));return c.push(n),c}var ps=new class{constructor(e={}){this._pool=[],this.opts={overAlloc:2,poolSize:100},this.setOptions(e)}setOptions(e){Object.assign(this.opts,e)}allocate(e,t,{size:n=1,type:r,padding:i=0,copy:a=!1,initialize:o=!1,maxCount:s}){let c=r||e&&e.constructor||Float32Array,l=t*n+i;if(ArrayBuffer.isView(e)){if(l<=e.length)return e;if(l*e.BYTES_PER_ELEMENT<=e.buffer.byteLength)return new c(e.buffer,0,l)}let u=1/0;s&&(u=s*n+i);let d=this._allocate(c,l,o,u);return e&&a?d.set(e):o||d.fill(0,0,4),this._release(e),d}release(e){this._release(e)}_allocate(e,t,n,r){let i=Math.max(Math.ceil(t*this.opts.overAlloc),1);i>r&&(i=r);let a=this._pool,o=e.BYTES_PER_ELEMENT*i,s=a.findIndex(e=>e.byteLength>=o);if(s>=0){let t=new e(a.splice(s,1)[0],0,i);return n&&t.fill(0),t}return new e(i)}_release(e){if(!ArrayBuffer.isView(e))return;let t=this._pool,{buffer:n}=e,{byteLength:r}=n,i=t.findIndex(e=>e.byteLength>=r);i<0?t.push(n):(i>0||t.length<this.opts.poolSize)&&t.splice(i,0,n),t.length>this.opts.poolSize&&t.shift()}};function ms(){return[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]}function hs(e,t){let n=e%t;return n<0?t+n:n}function gs(e){return[e[12],e[13],e[14]]}function _s(e){return{left:Z(e[3]+e[0],e[7]+e[4],e[11]+e[8],e[15]+e[12]),right:Z(e[3]-e[0],e[7]-e[4],e[11]-e[8],e[15]-e[12]),bottom:Z(e[3]+e[1],e[7]+e[5],e[11]+e[9],e[15]+e[13]),top:Z(e[3]-e[1],e[7]-e[5],e[11]-e[9],e[15]-e[13]),near:Z(e[3]+e[2],e[7]+e[6],e[11]+e[10],e[15]+e[14]),far:Z(e[3]-e[2],e[7]-e[6],e[11]-e[10],e[15]-e[14])}}var vs=new x;function Z(e,t,n,r){vs.set(e,t,n);let i=vs.len();return{distance:r/i,normal:new x(-e/i,-t/i,-n/i)}}function ys(e){return e-Math.fround(e)}var bs;function xs(e,t){let{size:n=1,startIndex:r=0}=t,i=t.endIndex===void 0?e.length:t.endIndex,a=(i-r)/n;bs=ps.allocate(bs,a,{type:Float32Array,size:n*2});let o=r,s=0;for(;o<i;){for(let t=0;t<n;t++){let r=e[o++];bs[s+t]=r,bs[s+t+n]=ys(r)}s+=n*2}return bs.subarray(0,a*n*2)}function Ss(e){let t=null,n=!1;for(let r of e)r&&(t?(n||=(t=[[t[0][0],t[0][1]],[t[1][0],t[1][1]]],!0),t[0][0]=Math.min(t[0][0],r[0][0]),t[0][1]=Math.min(t[0][1],r[0][1]),t[1][0]=Math.max(t[1][0],r[1][0]),t[1][1]=Math.max(t[1][1],r[1][1])):t=r);return t}var Cs=Math.PI/180,ws=ms(),Ts=[0,0,0],Es={unitsPerMeter:[1,1,1],metersPerUnit:[1,1,1]};function Ds({width:e,height:t,orthographic:n,fovyRadians:r,focalDistance:i,padding:a,near:o,far:s}){let c=e/t,l=n?new m().orthographic({fovy:r,aspect:c,focalDistance:i,near:o,far:s}):new m().perspective({fovy:r,aspect:c,near:o,far:s});if(a){let{left:n=0,right:r=0,top:i=0,bottom:o=0}=a,s=g((n+e-r)/2,0,e)-e/2,c=g((i+t-o)/2,0,t)-t/2;l[8]-=s*2/e,l[9]+=c*2/t}return l}var Os=class e{constructor(e={}){this._frustumPlanes={},this.id=e.id||this.constructor.displayName||`viewport`,this.x=e.x||0,this.y=e.y||0,this.width=e.width||1,this.height=e.height||1,this.zoom=e.zoom||0,this.padding=e.padding,this.distanceScales=e.distanceScales||Es,this.focalDistance=e.focalDistance||1,this.position=e.position||Ts,this.modelMatrix=e.modelMatrix||null;let{longitude:t,latitude:n}=e;this.isGeospatial=Number.isFinite(n)&&Number.isFinite(t),this._initProps(e),this._initMatrices(e),this.equals=this.equals.bind(this),this.project=this.project.bind(this),this.unproject=this.unproject.bind(this),this.projectPosition=this.projectPosition.bind(this),this.unprojectPosition=this.unprojectPosition.bind(this),this.projectFlat=this.projectFlat.bind(this),this.unprojectFlat=this.unprojectFlat.bind(this)}get subViewports(){return null}get metersPerPixel(){return this.distanceScales.metersPerUnit[2]/this.scale}get projectionMode(){return this.isGeospatial?this.zoom<12?W.WEB_MERCATOR:W.WEB_MERCATOR_AUTO_OFFSET:W.IDENTITY}equals(t){return t instanceof e?this===t||t.width===this.width&&t.height===this.height&&t.scale===this.scale&&t.projectionMode===this.projectionMode&&t.resolution===this.resolution&&c(t.distanceScales.unitsPerMeter,this.distanceScales.unitsPerMeter)&&c(t.projectionMatrix,this.projectionMatrix)&&c(t.viewMatrix,this.viewMatrix):!1}project(e,{topLeft:t=!0}={}){let n=os(this.projectPosition(e),this.pixelProjectionMatrix),[r,i]=n,a=t?i:this.height-i;return e.length===2?[r,a]:[r,a,n[2]]}unproject(e,{topLeft:t=!0,targetZ:n}={}){let[r,i,a]=e,o=t?i:this.height-i,s=n&&n*this.distanceScales.unitsPerMeter[2],c=ss([r,o,a],this.pixelUnprojectionMatrix,s),[l,u,d]=this.unprojectPosition(c);return Number.isFinite(a)?[l,u,d]:Number.isFinite(n)?[l,u,n]:[l,u]}projectPosition(e){let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.unitsPerMeter[2]]}unprojectPosition(e){let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)*this.distanceScales.metersPerUnit[2]]}projectFlat(e){if(this.isGeospatial){let t=Xo(e);return t[1]=g(t[1],-318,830),t}return e}unprojectFlat(e){return this.isGeospatial?Zo(e):e}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,0],t),r=this.unproject([this.width,0],t),i=this.unproject([0,this.height],t),a=this.unproject([this.width,this.height],t);return[Math.min(n[0],r[0],i[0],a[0]),Math.min(n[1],r[1],i[1],a[1]),Math.max(n[0],r[0],i[0],a[0]),Math.max(n[1],r[1],i[1],a[1])]}getDistanceScales(e){return e&&this.isGeospatial?es({longitude:e[0],latitude:e[1],highPrecision:!0}):this.distanceScales}containsPixel({x:e,y:t,width:n=1,height:r=1}){return e<this.x+this.width&&this.x<e+n&&t<this.y+this.height&&this.y<t+r}getFrustumPlanes(){return this._frustumPlanes.near||Object.assign(this._frustumPlanes,_s(this.viewProjectionMatrix)),this._frustumPlanes}panByPosition(e,t,n){return null}_initProps(e){let t=e.longitude,n=e.latitude;this.isGeospatial&&(Number.isFinite(e.zoom)||(this.zoom=Qo({latitude:n})+Math.log2(this.focalDistance)),this.distanceScales=e.distanceScales||es({latitude:n,longitude:t}));let r=2**this.zoom;this.scale=r;let{position:i,modelMatrix:a}=e,o=Ts;if(i&&(o=a?new m(a).transformAsVector(i,[]):i),this.isGeospatial){let e=this.projectPosition([t,n,0]);this.center=new x(o).scale(this.distanceScales.unitsPerMeter).add(e)}else this.center=this.projectPosition(o)}_initMatrices(e){let{viewMatrix:t=ws,projectionMatrix:n=null,orthographic:r=!1,fovyRadians:i,fovy:a=75,near:o=.1,far:s=1e3,padding:c=null,focalDistance:l=1}=e;this.viewMatrixUncentered=t,this.viewMatrix=new m().multiplyRight(t).translate(new x(this.center).negate()),this.projectionMatrix=n||Ds({width:this.width,height:this.height,orthographic:r,fovyRadians:i||a*Cs,focalDistance:l,padding:c,near:o,far:s});let d=ms();v(d,d,this.projectionMatrix),v(d,d,this.viewMatrix),this.viewProjectionMatrix=d,this.viewMatrixInverse=h([],this.viewMatrix)||this.viewMatrix,this.cameraPosition=gs(this.viewMatrixInverse);let f=ms(),p=ms();y(f,f,[this.width/2,-this.height/2,1]),u(f,f,[1,-1,0]),v(p,f,this.viewProjectionMatrix),this.pixelProjectionMatrix=p,this.pixelUnprojectionMatrix=h(ms(),this.pixelProjectionMatrix),this.pixelUnprojectionMatrix||oe.warn(`Pixel project matrix not invertible`)()}};Os.displayName=`Viewport`;var ks=class e extends Os{constructor(e={}){let{latitude:t=0,longitude:n=0,zoom:r=0,pitch:i=0,bearing:a=0,nearZMultiplier:o=.1,farZMultiplier:s=1.01,nearZ:c,farZ:l,orthographic:u=!1,projectionMatrix:d,repeat:f=!1,worldOffset:p=0,position:h,padding:_,legacyMeterSizes:v=!1}=e,{width:y,height:b,altitude:x=1.5}=e,S=2**r;y||=1,b||=1;let C,w=null;if(d)x=d[5]/2,C=is(x);else{e.fovy?(C=e.fovy,x=as(C)):C=is(x);let n;if(_){let{top:e=0,bottom:t=0}=_;n=[0,g((e+b-t)/2,0,b)-b/2]}w=rs({width:y,height:b,scale:S,center:h&&[0,0,h[2]*$o(t)],offset:n,pitch:i,fovy:C,nearZMultiplier:o,farZMultiplier:s}),Number.isFinite(c)&&(w.near=c),Number.isFinite(l)&&(w.far=l)}let ee=ns({height:b,pitch:i,bearing:a,scale:S,altitude:x});p&&(ee=new m().translate([512*p,0,0]).multiplyLeft(ee)),super({...e,width:y,height:b,viewMatrix:ee,longitude:n,latitude:t,zoom:r,...w,fovy:C,focalDistance:x}),this.latitude=t,this.longitude=n,this.zoom=r,this.pitch=i,this.bearing=a,this.altitude=x,this.fovy=C,this.orthographic=u,this._subViewports=f?[]:null,this._pseudoMeters=v,Object.freeze(this)}get subViewports(){if(this._subViewports&&!this._subViewports.length){let t=this.getBounds(),n=Math.floor((t[0]+180)/360),r=Math.ceil((t[2]-180)/360);for(let t=n;t<=r;t++){let n=t?new e({...this,worldOffset:t}):this;this._subViewports.push(n)}}return this._subViewports}equals(t){return t instanceof e&&t._pseudoMeters===this._pseudoMeters&&super.equals(t)}projectPosition(e){if(this._pseudoMeters)return super.projectPosition(e);let[t,n]=this.projectFlat(e);return[t,n,(e[2]||0)*$o(e[1])]}unprojectPosition(e){if(this._pseudoMeters)return super.unprojectPosition(e);let[t,n]=this.unprojectFlat(e);return[t,n,(e[2]||0)/$o(n)]}addMetersToLngLat(e,t){return ts(e,t)}panByPosition(e,t,n){let i=ss(t,this.pixelUnprojectionMatrix),o=this.projectFlat(e),s=r([],o,a([],i)),c=r([],this.center,s),[l,u]=this.unprojectFlat(c);return{longitude:l,latitude:u}}panByPosition3D(e,t){let n=e[2]||0,r=o([],e,this.unproject(t,{targetZ:n}));return{longitude:this.longitude+r[0],latitude:this.latitude+r[1]}}getBounds(e={}){let t=ds(this,e.z||0);return[Math.min(t[0][0],t[1][0],t[2][0],t[3][0]),Math.min(t[0][1],t[1][1],t[2][1],t[3][1]),Math.max(t[0][0],t[1][0],t[2][0],t[3][0]),Math.max(t[0][1],t[1][1],t[2][1],t[3][1])]}fitBounds(t,n={}){let{width:r,height:i}=this,{longitude:a,latitude:o,zoom:s}=cs({width:r,height:i,bounds:t,...n});return new e({width:r,height:i,longitude:a,latitude:o,zoom:s})}};ks.displayName=`WebMercatorViewport`;var As={NO_STATE:`Awaiting state`,MATCHED:`Matched. State transferred from previous layer`,INITIALIZED:`Initialized`,AWAITING_GC:`Discarded. Awaiting garbage collection`,AWAITING_FINALIZATION:`No longer matched. Awaiting garbage collection`,FINALIZED:`Finalized! Awaiting garbage collection`},js=Symbol.for(`component`),Ms=Symbol.for(`propTypes`),Ns=Symbol.for(`deprecatedProps`),Ps=Symbol.for(`asyncPropDefaults`),Fs=Symbol.for(`asyncPropOriginal`),Is=Symbol.for(`asyncPropResolved`);function Ls(e,t=()=>!0){return Array.isArray(e)?Rs(e,t,[]):t(e)?[e]:[]}function Rs(e,t,n){let r=-1;for(;++r<e.length;){let i=e[r];Array.isArray(i)?Rs(i,t,n):t(i)&&n.push(i)}return n}function zs({target:e,source:t,start:n=0,count:r=1}){let i=t.length,a=r*i,o=0;for(let r=n;o<i;o++)e[r++]=t[o];for(;o<a;)o<a-o?(e.copyWithin(n+o,n,n+o),o*=2):(e.copyWithin(n+o,n,n+a-o),o=a);return e}function Bs(e,t,n){if(e===t)return!0;if(!n||!e||!t)return!1;if(Array.isArray(e)){if(!Array.isArray(t)||e.length!==t.length)return!1;for(let r=0;r<e.length;r++)if(!Bs(e[r],t[r],n-1))return!1;return!0}if(Array.isArray(t))return!1;if(typeof e==`object`&&typeof t==`object`){let r=Object.keys(e),i=Object.keys(t);if(r.length!==i.length)return!1;for(let i of r)if(!t.hasOwnProperty(i)||!Bs(e[i],t[i],n-1))return!1;return!0}return!1}var Vs=class{constructor(e){this._inProgress=!1,this._handle=null,this.time=0,this.settings={duration:0},this._timeline=e}get inProgress(){return this._inProgress}start(e){this.cancel(),this.settings=e,this._inProgress=!0,this.settings.onStart?.(this)}end(){this._inProgress&&(this._timeline.removeChannel(this._handle),this._handle=null,this._inProgress=!1,this.settings.onEnd?.(this))}cancel(){this._inProgress&&=(this.settings.onInterrupt?.(this),this._timeline.removeChannel(this._handle),this._handle=null,!1)}update(){if(!this._inProgress)return!1;if(this._handle===null){let{_timeline:e,settings:t}=this;this._handle=e.addChannel({delay:e.getTime(),duration:t.duration})}return this.time=this._timeline.getTime(this._handle),this._onUpdate(),this.settings.onUpdate?.(this),this._timeline.isFinished(this._handle)&&this.end(),!0}_onUpdate(){}};function Hs(e,t){if(!e)throw Error(t||`deck.gl: assertion failed.`)}var Us=null,Ws=!1;async function Gs(){Ys()}function Ks(e,t){return Ys(),e}async function qs(e){Ys()}function Js(e){return Us?.initialize(e)||null}function Ys(){Ws||(Ws=!0,T.warn(`Import @luma.gl/webgl/debug before enabling WebGL debugging.`)())}var Q=Math.PI/180,Xs=180/Math.PI,Zs=1,Qs=6370972,$s=.75,ec=1.15;function tc(e){let t=hs(e+180,360)-180;return Math.abs(t)<Zs}function nc(){let e=256/Qs,t=Math.PI/180*256;return{unitsPerMeter:[e,e,e],unitsPerMeter2:[0,0,0],metersPerUnit:[1/e,1/e,1/e],unitsPerDegree:[t,t,e],unitsPerDegree2:[0,0,0],degreesPerUnit:[1/t,1/t,1/e]}}var rc=class extends Os{constructor(e={}){let{longitude:t=0,bearing:n=0,pitch:r=0,zoom:i=0,nearZMultiplier:a=.5,farZMultiplier:o=1,resolution:s=10}=e,{latitude:c=0,height:l,altitude:u=1.5,fovy:d}=e;c=Math.max(Math.min(c,90),-90),l||=1,d?u=as(d):d=is(u);let f=2**(i-$(Math.max(Math.min(c,X),-X))),p=r*Q,h=e.nearZ??a,g=e.farZ??(u+512*f/l/Math.max(Math.cos(p),.1))*o,_=new m().lookAt({eye:[0,-u,0],up:[0,0,1]}).rotateX(-p).rotateY(-n*Q).rotateX(c*Q).rotateZ(-t*Q).scale(f/l);super({...e,height:l,viewMatrix:_,longitude:t,latitude:c,zoom:i,distanceScales:nc(),fovy:d,focalDistance:u,near:h,far:g}),this.scale=f,this.latitude=c,this.longitude=t,this.bearing=n,this.pitch=r,this.fovy=d,this.resolution=s}get projectionMode(){return W.GLOBE}getDistanceScales(){return this.distanceScales}getBounds(e={}){let t={targetZ:e.z||0},n=this.unproject([0,this.height/2],t),r=this.unproject([this.width/2,0],t),i=this.unproject([this.width,this.height/2],t),a=this.unproject([this.width/2,this.height],t);return i[0]<this.longitude&&(i[0]+=360),n[0]>this.longitude&&(n[0]-=360),[Math.min(n[0],i[0],r[0],a[0]),Math.min(n[1],i[1],r[1],a[1]),Math.max(n[0],i[0],r[0],a[0]),Math.max(n[1],i[1],r[1],a[1])]}_getRayToGlobe(t,{topLeft:n=!0,targetZ:r}={}){let[i,a]=t,o=n?a:this.height-a,{pixelUnprojectionMatrix:s}=this,c=ic(s,[i,o,-1,1]),l=ic(s,[i,o,1,1]),u=((r||0)/Qs+1)*256,d=f(e([],c,l)),p=f(c),m=f(l);return{rayStartPosition:c,rayEndPosition:l,radius:u,rayLengthSquared:d,rayStartDistanceSquared:p,distanceToCenterSquared:4*((4*p*m-(d-p-m)**2)/16)/d}}_getRayDistanceToGlobeCenterRatio(e,t){let{distanceToCenterSquared:n,radius:r}=this._getRayToGlobe(e,t);return Math.sqrt(Math.max(0,n))/r}getZoomAnchorStrength(e){let t=this._getRayDistanceToGlobeCenterRatio(e);if(t>=ec)return 0;let n=Math.max(0,Math.min(1,(t-$s)/.3999999999999999));return 1-n*n*(3-2*n)}unproject(e,{topLeft:t=!0,targetZ:r}={}){let[i,a,o]=e,s=t?a:this.height-a,{pixelUnprojectionMatrix:c}=this,l;if(Number.isFinite(o))l=ic(c,[i,s,o,1]);else{let{rayStartPosition:i,rayEndPosition:a,radius:o,rayLengthSquared:s,rayStartDistanceSquared:c,distanceToCenterSquared:u}=this._getRayToGlobe(e,{topLeft:t,targetZ:r}),d=(Math.sqrt(c-u)-Math.sqrt(Math.max(0,o*o-u)))/Math.sqrt(s);l=n([],i,a,d)}let[u,d,f]=this.unprojectPosition(l);return Number.isFinite(o)?[u,d,f]:Number.isFinite(r)?[u,d,r]:[u,d]}projectPosition(e){let[t,n,r=0]=e,i=t*Q,a=n*Q,o=Math.cos(a),s=(r/Qs+1)*256;return[Math.sin(i)*o*s,-Math.cos(i)*o*s,Math.sin(a)*s]}unprojectPosition(e){let[t,n,r]=e,i=b(e),a=Math.asin(r/i);return[Math.atan2(t,-n)*Xs,a*Xs,(i/256-1)*Qs]}projectFlat(e){return e}unprojectFlat(e){return e}panByPosition(e,t,n){if(!n){let n=this.getZoomAnchorStrength(t);if(n===0)return{longitude:this.longitude,latitude:this.latitude};let r=this.unproject(t),i=hs(e[0]-r[0]+180,360)-180,a=e[1]-r[1],o=Math.abs(r[1])>85.051129||Math.abs(i)>90;if(tc(this.bearing)&&o)return{longitude:this.longitude,latitude:this.latitude};if(tc(this.bearing)&&a!==0){let e=((a>0?X:-X)-this.latitude)/a;n=Math.min(n,Math.max(0,e))}return{longitude:this.longitude+i*n,latitude:Math.max(Math.min(this.latitude+a*n,90),-90)}}let[r,i,a]=e,o=.25/2**(this.zoom-$(this.latitude)),s=r+o*(n[0]-t[0]),c=i-o*(n[1]-t[1]);c=Math.max(Math.min(c,90),-90);let l={longitude:s,latitude:c,zoom:a-$(i)};return l.zoom+=$(l.latitude),l}};rc.displayName=`GlobeViewport`;function $(e,t){t&&(e=Math.max(Math.min(e,X),-X));let n=Math.PI*Math.cos(e*Math.PI/180);return Math.log2(n)}function ic(e,t){let n=d([],t,e);return _(n,n,1/n[3]),n}export{ln as $,os as A,_o as B,xs as C,ss as D,Xo as E,vo as F,Ti as G,Ei as H,bo as I,pn as J,bn as K,W as L,Mo as M,Ao as N,$o as O,Co as P,tn as Q,xo as R,hs as S,ts as T,wi as U,ki as V,Ci as W,un as X,dn as Y,cn as Z,As as _,Gs as a,ut as at,Os as b,Vs as c,oe as ct,Ls as d,en as et,Ps as f,Ns as g,js as h,qs as i,ft as it,Bo as j,Zo as k,Bs as l,ae as lt,Is as m,$ as n,L as nt,Ks as o,le as ot,Fs as p,gn as q,Js as r,bt as rt,Hs as s,ce as st,rc as t,$t as tt,zs as u,Ms as v,ps as w,Ss as x,ks as y,yo as z};