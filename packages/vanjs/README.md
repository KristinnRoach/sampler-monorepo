# 🍦 **VanJS**: The Smallest Reactive UI Framework in the World

📣 [Introducing VanX →](https://github.com/vanjs-org/van/discussions/144) <br>

<div align="center">
  <table>
    <tbody>
      <tr>
        <td>
          <a href="https://vanjs.org/start">🖊️ Get Started</a>
        </td>
        <td>
          <a href="https://vanjs.org/tutorial">📖 Tutorial</a>
        </td>
        <td>
          <a href="https://vanjs.org/demo">📚 Examples</a>
        </td>
        <td>
          <a href="https://vanjs.org/convert">📝 HTML/MD to VanJS Converter</a>
        </td>
        <td>
          <a href="https://vanjs.org/x">⚔️ VanX</a>
        </td>
        <td>
          <a href="https://github.com/vanjs-org/van/discussions">💬 Discuss</a>
        </td>
      </tr>
    </tbody>
  </table>
</div>

> Enable everyone to build useful UI apps with a few lines of code, anywhere, any time, on any device.

**VanJS** is an **_ultra-lightweight_**, **_zero-dependency_** and **_unopinionated_** Reactive UI framework based on pure vanilla JavaScript and DOM. Programming with **VanJS** feels like building React apps in a [scripting language](https://vanjs.org/about#story), without JSX. Check-out the `Hello World` code below:

```javascript
// Reusable components can be just pure vanilla JavaScript functions.
// Here we capitalize the first letter to follow React conventions.
const Hello = () =>
  div(
    p('👋Hello'),
    ul(li('🗺️World'), li(a({ href: 'https://vanjs.org/' }, '🍦VanJS')))
  );

van.add(document.body, Hello());
// Alternatively, you can write:
// document.body.appendChild(Hello())
```

[Try on jsfiddle](https://jsfiddle.net/gh/get/library/pure/vanjs-org/vanjs-org.github.io/tree/master/jsfiddle/home/hello)

You can convert any HTML or MD snippet into **VanJS** code with our online [converter](https://vanjs.org/convert).

**VanJS** helps you manage states and UI bindings as well, with a more natural API:

```javascript
const Counter = () => {
  const counter = van.state(0);
  return div(
    '❤️ ',
    counter,
    ' ',
    button({ onclick: () => ++counter.val }, '👍'),
    button({ onclick: () => --counter.val }, '👎')
  );
};

van.add(document.body, Counter());
```

[Try on jsfiddle](https://jsfiddle.net/gh/get/library/pure/vanjs-org/vanjs-org.github.io/tree/master/jsfiddle/home/counter)

## Why VanJS?

### Reactive Programming without React/JSX

Declarative DOM tree composition, reusable components, reactive state binding - **VanJS** offers every good aspect that React does, but without the need of React, JSX, transpiling, virtual DOM, or any hidden logic. Everything is built with simple JavaScript functions and DOM.

### Grab 'n Go

**_No installation_**, **_no configuration_**, **_no dependencies_**, **_no transpiling_**, **_no IDE setups_**. Adding a line to your script or HTML file is all you need to start coding. And any code with **VanJS** can be pasted and executed directly in your browser's developer console. **VanJS** allows you to focus on the business logic of your application, rather than getting bogged down in frameworks and tools.

### Ultra-Lightweight

**VanJS** is the smallest reactive UI framework in the world, with just 1.0kB in the gzipped minified bundle. It's **50~100 times** smaller than most popular alternatives. Guess what you can get from this 1.0kB framework? All essential features of modern web frameworks - DOM templating, state, state binding, state derivation, effect, SPA, client-side routing and even hydration!

![Size comparison](doc/size_comp.png)

> _Perfection is achieved, not when there is nothing more to add, but when there is nothing left to take away._
>
> _-- Antoine de Saint-Exupéry, Airman's Odyssey_

### Easy to Learn

Simplicity at its core. Only 5 functions (`van.tags`, `van.add`, `van.state`, `van.derive`, `van.hydrate`). The entire tutorial plus the API reference is [just one single web page](https://vanjs.org/tutorial), and can be learned within 1 hour for most developers.

### Performance

**VanJS** is among the fastest web frameworks, according to the [results](https://krausest.github.io/js-framework-benchmark/2023/table_chrome_117.0.5938.62.html) by [krausest/js-framework-benchmark](https://github.com/krausest/js-framework-benchmark). For SSR, **Mini-Van** is [**1.75X** to **2.25X** more efficient](https://github.com/vanjs-org/mini-van/tree/main/bench#react-vs-mini-van) compared to React.

### TypeScript Support

**VanJS** provides first-class support for TypeScript. With the `.d.ts` file in place, you'll be able to take advantage of type-checking, IntelliSense, large-scale refactoring provided by your preferred development environment. Refer to the [Download Table](https://vanjs.org/start#download-table) to find the right `.d.ts` file to work with.

## Want to Learn More?

- [Get Started](https://vanjs.org/start) (CDN, NPM or local download)
- Learn from the [Tutorial](https://vanjs.org/tutorial)
- Learn by [Examples](https://vanjs.org/demo) (and also [Community Examples](https://vanjs.org/demo#community-examples))
- Get bored? [Play a fun game](https://vanjs.org/demo#game) built with **VanJS** under 60 lines
- Convert HTML or MD snippet to **VanJS** code with our online [HTML/MD to **VanJS** Converter](https://vanjs.org/convert)
- Check out [**VanUI**](https://github.com/vanjs-org/van/tree/main/components) - A collection of grab 'n go reusable utility and UI components for **VanJS**
- Want reactive list, global app state, server-driven UI, serialization and more? Check out [**VanX**](https://vanjs.org/x) - The 1.2kB official **VanJS** extension
- Want server-side rendering? Check out [**Mini-Van**](https://github.com/vanjs-org/mini-van) and [Hydration](https://vanjs.org/ssr) (the entire [vanjs.org](https://vanjs.org/) site is built on top of **Mini-Van**)
- Debugging complex dependencies in your app? checkout [**VanGraph**](https://github.com/vanjs-org/van/tree/main/graph)
- For questions, feedback or general discussions, visit our [Discussions](https://github.com/vanjs-org/van/discussions) page
- [How did **VanJS** get its name?](https://vanjs.org/about#name)
- ✨ [Ask **VanJS** Guru](https://gurubase.io/g/vanjs) - a **VanJS**-focused AI to answer your questions

## IDE Plug-ins

- [VS Code Extension](https://marketplace.visualstudio.com/items?itemName=TaoXin.vanjs-importtag)

## See Also

[A Guide to Reading **VanJS** Codebase](https://vanjs.org/about#source-guide)

## Support & Feedback

🙏 **VanJS** aims to build a better world by reducing the entry barrier of UI programming, with no intention or plan on commercialization whatsoever. If you find **VanJS** interesting, or could be useful for you some day, please consider starring the project. It takes just a few seconds but your support means the world to us and helps spread **VanJS** to a wider audience.

> In the name of **Van**illa of the House **J**ava**S**cript, [the First of its name](https://vanjs.org/about#name), Smallest Reactive UI Framework, 1.0kB JSX-free Grab 'n Go Library, [Scripting Language](https://vanjs.org/about#story) for GUI, [GPT-Empowered](https://chat.openai.com/g/g-7tcSHUu27-vanjs-app-builder) Toolkit, by the word of Tao of the House Xin, Founder and Maintainer of **VanJS**, I do hereby grant you the permission of **VanJS** under [MIT License](https://github.com/vanjs-org/van/blob/main/LICENSE).

Contact us: [@taoxin](https://twitter.com/intent/follow?region=follow_link&screen_name=taoxin) / [tao@vanjs.org](mailto:tao@vanjs.org) / [Tao Xin](https://www.linkedin.com/in/taoxin/)

## Community Add-ons

**VanJS** can be extended via add-ons. Add-ons add more features to **VanJS** and/or provide an alternative styled API. Below is a curated list of add-ons built by **VanJS** community:

| Add-on                                                               | Description                                                                                                  | Author                                                    |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| [Van Cone](https://medium-tech.github.io/van-cone-website/)          | An SPA framework add-on for **VanJS**                                                                        | [b-rad-c](https://github.com/b-rad-c)                     |
| [van_element](/addons/van_element/)                                  | Web Components with **VanJS**                                                                                | [Atmos4](https://github.com/Atmos4)                       |
| [VanJS Feather](https://thednp.github.io/vanjs-feather/)             | Feather Icons for **VanJS**                                                                                  | [thednp](https://github.com/thednp)                       |
| [van_dml.js](/addons/van_dml)                                        | A new flavour of composition for **VanJS**                                                                   | [Eckehard](https://github.com/efpage)                     |
| [van-jsx](/addons/van_jsx)                                           | A JSX wrapper for **VanJS**, for people who like the JSX syntax more                                         | [cqh963852](https://github.com/cqh963852)                 |
| [vanjs-router](https://github.com/iuroc/vanjs-router)                | A router solution for **VanJS** (`README.md` in simplified Chinese)                                          | [欧阳鹏](https://github.com/iuroc)                        |
| [VanJS Routing](https://github.com/kwameopareasiedu/vanjs-routing)   | Yet another routing solution for **VanJS**                                                                   | [Kwame Opare Asiedu](https://github.com/kwameopareasiedu) |
| [VanJS Form](https://github.com/kwameopareasiedu/vanjs-form)         | Fully typed form state management library (with validation) for **VanJS**                                    | [Kwame Opare Asiedu](https://github.com/kwameopareasiedu) |
| [vanjs-bootstrap](https://github.com/WilliCommer/vanjs-bootstrap)    | **VanJS** Bootstrap Components                                                                               | [Willi Commer](https://github.com/WilliCommer)            |
| [vanrx](https://github.com/MeddahAbdellah/vanrx)                     | An ultra-lightweight Redux addon for **VanJS**                                                               | [Meddah Abdallah](https://github.com/MeddahAbdellah)      |
| [VanFS](https://github.com/ken-okabe/vanfs)                          | 1:1 bindings from F# to **VanJS**                                                                            | [Ken Okabe](https://github.com/ken-okabe)                 |
| [Van-wrapper](https://github.com/zakarialaoui10/van-wrapper)         | A tool that facilitates the rendering of **VanJS** elements within other popular frameworks                  | [Zakaria Elalaoui](https://github.com/zakarialaoui10)     |
| [Create VanJS](https://github.com/thednp/create-vanjs)               | The fastest way to kickstart your first **VanJS** Project: `npm create vanjs@latest`                         | [thednp](https://github.com/thednp)                       |
| [Vite Plugin for VanJS](https://github.com/thednp/vite-plugin-vanjs) | A mini meta-framework for **VanJS** featuring routing, metadata, isomorphic rendering and JSX transformation | [thednp](https://github.com/thednp)                       |
| [Vite VanJS SVG](https://github.com/thednp/vite-vanjs-svg)           | A Vite plugin to transform SVG files to **VanJS** components on the fly                                      | [thednp](https://github.com/thednp)                       |
| [VanJS Lucide](https://thednp.github.io/vanjs-lucide)                | Lucide Icons for **VanJS**                                                                                   | [thednp](https://github.com/thednp)                       |
