## 手写 webpack mini 版

webpack 是一个现代 js 应用程序的静态模块打包器

当 webpack 处理应用程序的时候，它会递归的构建一个依赖关系图，其中包含应用程序所需的每个模块，然后将所有这些模块打包成一个或多个 bundle。

### 概览

1. 找到一个入口文件
2. 解析这个入口文件，提取它的依赖

```js
/**
 * 分析 ast, 思考如何能够解析出entry.js的依赖  工具[link][https://astexplorer.net/]
 *    1. File下有个program
 *    2. program下有个body 里面是我们各种语法的描述
 *    3. ImportDeclaration 引入的声明
 *    4. ImportDeclaration 下的source属性， source.value 就是引入文件的地址
 *
 * 生成enter.js代码的ast  需要的工具（babylon 一个基于babel的js解析工具）
 *
 * 还需要使用 babel-traverse 插件来格式化ast
 */
```

3. 解析入口文件依赖的依赖，递归的去创建一个文件间的依赖涂，描述所有文件的依赖关系
4. 把所有文件打包成一个文件
