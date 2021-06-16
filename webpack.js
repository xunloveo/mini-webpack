// 1. 找到一个入口文件
// 2. 解析这个入口文件，提取它的依赖
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
 *
 * 优化createAsset 使其能够区分文件
 *    因为要获取所有文件的依赖，所有加入一个id来标识所有文件
 *    这里使用自增number模拟
 *    先获取到entry.js的id filenmae 以及dependencies
 */

// 3. 解析入口文件依赖的依赖，递归的去创建一个文件间的依赖涂，描述所有文件的依赖关系
/**
 *  新增一个createGraph, 把createAsset调用移入createGraph
 *
 *  entry的路径需要是动态的，所以createGraph需要接收一个参数 entry
 *
 *  把相对路径改为绝对路径
 *
 *  需要一个map,记录depend中的相对路径 和childAsset的对应关系
 *  因为后面需要做依赖的引入，需要这样的一个对应关系
 *
 *  接下来开始遍历所有文件
 */
// 4. 把所有文件打包成一个文件
/**
 * 新增一个bundle方法
 *
 * 编译源代码  需要 babel-core babel-preset-env
 *
 * 把编译后的代码加入 result
 *
 * CommonJs的规范要求：
 *  1. module变量代表当前模块
 *    这个变量是一个对象，它的exports属性是对外的接口 module.exports 加载某个模块，其实就是加载该模块的 module.export
 *  2. require方法用于加载模块
 */

const fs = require('fs')
const babylon = require('babylon')
const traverse = require('babel-traverse').default
const path = require('path')
const babel = require('babel-core')

let ID = 0

function createAsset(filename) {
  const content = fs.readFileSync(filename, 'utf-8')

  const ast = babylon.parse(content, {
    sourceType: 'module',
  })

  const dependencies = [] // 所有依赖

  traverse(ast, {
    ImportDeclaration: ({ node }) => {
      dependencies.push(node.source.value)
    },
  })

  const id = ID++

  // 编译ast
  const { code } = babel.transformFromAst(ast, null, {
    presets: ['env'],
  })

  return {
    id,
    filename,
    dependencies,
    code,
  }
}

/**
 * 创建依赖图
 * @param {*} entry
 */
function createGraph(entry) {
  const mianAsset = createAsset(entry)

  const allAsset = [mianAsset]

  for (let asset of allAsset) {
    // 文件所在目录名
    const dirname = path.dirname(asset.filename)

    asset.mapping = {}

    // 遍历所有依赖
    asset.dependencies.forEach(relaticePath => {
      // 转换为绝对路径
      const absolutePath = path.join(dirname, relaticePath)

      const childAsset = createAsset(absolutePath)

      asset.mapping[relaticePath] = childAsset.id

      // 接下来开始遍历所有文件
      allAsset.push(childAsset)
    })
  }

  return allAsset
}

// 打包文件
function bundle(graph) {
  let modules = ''

  /*
   * CommonJs的规范要求：
   *  1. module变量代表当前模块
   *    这个变量是一个对象，它的exports属性是对外的接口 module.exports 加载某个模块，其实就是加载该模块的 module.export
   *  2. require方法用于加载模块
   */

  graph.forEach(module => {
    modules += `${module.id}:[
      function(require, module, exports) {
        ${module.code}
      },
      ${JSON.stringify(module.mapping)},
    ],`
  })

  // 自执行函数 实现require方法
  const result = `
    (function(modules){
      function require(id) {
        const [fn, mapping] = modules[id]

        function localRequire(relativePath) {
          return require(mapping[relativePath])
        }

        const module = { exports: {}}

        fn(localRequire, module, module.exports)

        return module.exports
      }
      require(0)
    })({${modules}})
  `

  return result
}

const graph = createGraph('./source/entry.js')
const result = bundle(graph)

console.log(result)
