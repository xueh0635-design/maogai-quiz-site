# V44 Mobile-safe Runtime 复盘与修复记录

## 用户现场缺陷
- iPhone 内嵌浏览器持续停留在“正在进入 V43 · 系统级 CAD 显隐 / 重复件实例化 / 交互回归…”启动遮罩。
- 现场截图表明顶层 V43 boot overlay 未被移除。

## 根因定位
- V43 运行链仍为 V43 → V42 → V41 → V34 → V32 → V25，多层 iframe 均具有自己的全屏 boot overlay。
- V43 只有在深层 V42 debug 与 Three.js 场景均就绪后才移除顶层 boot；移动 Safari / 内嵌浏览器中任一深层初始化延迟都会导致顶层遮罩长期阻塞，即使底层 canvas 已经可以渲染。
- 这是启动流程的 fail-closed 设计缺陷：增强层未完全初始化时，用户无法看到已经可用的基础 3D 页面。

## V44 实施改进
1. 新增 `versions/v44-mobile-safe-runtime.html`。
2. V44 对同源 iframe 链进行轮询，一旦检测到任一深层 `#canvas3d` 已建立，即判定基础三维界面可呈现。
3. 检测到可渲染 canvas 后，不等待所有增强层 debug 完成，立即隐藏各层阻塞式 `#boot`，让用户先进入可交互页面；增强逻辑继续后台初始化。
4. 隐藏而不是删除深层 boot DOM，避免旧版脚本后续访问 `#boot` 时发生空引用。
5. 移动端 12 秒、桌面端 18 秒仍未出现 canvas 时，自动切换到 `v25-direct.html` 稳定内核，避免无限停留在启动页。
6. 增加 `window.__v44MobileSafe`，记录启动原因、fallback 状态、iframe 深度、canvas 检测结果和耗时。
7. `diesel-engine-3d-sim/index.html` 默认入口已切换到 V44；V43 及全部历史版本保留。

## 验证
- V44 内联 JavaScript 已在写入 GitHub 前执行 `node --check`，语法检查通过。
- GitHub 文件创建成功，默认入口更新成功。
- 本轮仍没有独立 iOS Safari / Chromium WebGL 屏幕级自动化证据，因此不能宣称移动端问题已经百分之百验证关闭；需要用户刷新最新入口进行现场确认。

## GitHub 提交
- V44 新版本：`4925ecc54b8c2784abf55b53d8e60c9745005f96`
- 默认入口切换 V44：`fa9537ab61bbe653c0e40c3ad11ce88c2171fc89`

## 当前结论
V43 的无限阻塞启动机制已从代码层修复为 fail-open + 超时稳定内核 fallback。若增强层可建立 canvas，V44 会优先展示现有复杂模型；若增强链完全失败，移动端不会再永久停留“正在进入”。
