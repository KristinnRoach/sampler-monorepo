import{g as l,D as u}from"./vendor-gsap-DSz2Z63p.js";import{A as g}from"./audio-components-QmEQdijw.js";import"./audiolib-CaYg0Z-n.js";(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))n(e);new MutationObserver(e=>{for(const o of e)if(o.type==="childList")for(const i of o.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&n(i)}).observe(document,{childList:!0,subtree:!0});function a(e){const o={};return e.integrity&&(o.integrity=e.integrity),e.referrerPolicy&&(o.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?o.credentials="include":e.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function n(e){if(e.ep)return;e.ep=!0;const o=a(e);fetch(e.href,o)}})();const d=(r,t)=>document.querySelector(r),m=(r,t)=>document.querySelectorAll(r);l.registerPlugin(u);const c=(r={},t={})=>{const{element:a,handleElement:n,className:e="",handleClassName:o=""}=r,{axis:i}=t||null;let s=null;if(a?s=a:e&&(s=d(e)),!(s instanceof Element)){console.warn("makeDraggable: Invalid Element.");return}return u.create(s,{type:i||"x,y",trigger:n??s.querySelector(o||".drag-handle")??s,...t})};g();const f=()=>{l.set('[target-node-id="test-sampler"] > div, computer-keyboard > *, piano-keyboard > *',{opacity:0,scale:.75,y:25,x:0});const r=l.timeline();r.to("sampler-element > div",{opacity:1,scale:1,y:0,x:0,duration:.6,ease:"back.out(1.7)"}),r.to('[target-node-id="test-sampler"] > div',{opacity:1,scale:1,y:0,x:0,duration:.4,ease:"back.out(1.7)",stagger:.05},"-=0.3"),r.to("computer-keyboard > *, piano-keyboard > *",{opacity:1,scale:1,y:0,x:0,duration:.5,ease:"back.out(1.7)",stagger:.2},"-=0.1")};function p(r){if(!r||r.querySelector(".drag-handle"))return;const t=document.createElement("div");t.className="drag-handle",t.setAttribute("aria-label","Drag to move this control group"),r.appendChild(t)}function y(){p(d(".top-bar")),m(".control-group").forEach(p)}document.addEventListener("DOMContentLoaded",()=>{if(console.debug("playground initialized"),!d("sampler-element")){console.error("Sampler element not found");return}document.addEventListener("sampler-error",t=>{if(console.error("Sampler error:",t.detail),t.detail.error==="AudioWorklet not supported"){const a=document.createElement("div");a.style.cssText=`
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        text-align: center;
        z-index: 10000;
        max-width: 90%;
        font-family: system-ui, -apple-system, sans-serif;
      `,a.innerHTML=`
        <h2 style="margin: 0 0 10px 0;">Browser Not Supported</h2>
        <p style="margin: 10px 0;">${t.detail.message}</p>
        <p style="margin: 10px 0; font-size: 0.9em;">Your browser does not fully support AudioWorklet API.</p>
        <button onclick="this.parentElement.remove()" style="
          background: white;
          color: black;
          border: none;
          padding: 10px 20px;
          border-radius: 5px;
          cursor: pointer;
          margin-top: 10px;
        ">Close</button>
      `,document.body.appendChild(a)}}),document.addEventListener("sampler-ready",()=>{f(),y();const t=m(".control-group"),a=d(".top-bar");a&&c({element:a,handleClassName:".drag-handle"},{type:"x,y"}),t.forEach((n,e)=>{l.to(n,{rotateX:0,rotateY:0,rotateZ:0,ease:"back.inOut"}),c({element:n,handleClassName:".drag-handle"},{type:"x,y",onDragStart:()=>{n.classList.add("dragging")},onDragEnd:()=>{n.classList.remove("dragging")}})})})});
//# sourceMappingURL=index-DjBVXjM0.js.map
