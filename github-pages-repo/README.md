# 毛概题库 GitHub Pages

这个目录是单独发布到 GitHub Pages 的静态站点产物。

## 发布目标

- 仓库建议名：`maogai-quiz-site`
- 站点地址：`https://xueh0635-design.github.io/maogai-quiz-site/`

## 使用方式

1. 在 GitHub 创建一个公开仓库：`maogai-quiz-site`
2. 把本目录内容推送到该仓库默认分支根目录
3. 在 GitHub Pages 设置里选择 `Deploy from a branch`
4. 选择默认分支和 `/ (root)`

## 更新站点

在原项目根目录运行：

```bash
./tools/prepare_github_pages_repo.sh
```

然后把本目录最新内容重新推送到 GitHub。
