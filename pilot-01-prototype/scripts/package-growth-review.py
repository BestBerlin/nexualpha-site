"""Create a separate, offline local review bundle; never touch the live deploy package."""
import hashlib, json, pathlib, shutil, zipfile, os
root=pathlib.Path(__file__).resolve().parents[1]
target=root.parent.parent/('nexuAlpha-local-review-20260908'+os.environ.get('REVIEW_SUFFIX',''))
if target.exists():
    raise SystemExit(f'Review directory already exists: {target}; choose a fresh candidate before packaging again.')
for relative in ['dist/client','dist/server','dist/.openai','src']:
    source=root/relative
    if source.exists():shutil.copytree(source,target/relative)
for relative in ['server/local-sites-preview.mjs','server/asset-path.mjs','server/cta-collector.mjs','src/data/partner-registry.js','src/data/growth-context.js','server/growth-report.mjs']:
    destination=target/relative;destination.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/relative,destination)
(target/'package.json').write_text(json.dumps({'name':'nexualpha-local-review','private':True,'type':'module','scripts':{'preview':'node server/local-sites-preview.mjs'}},indent=2)+'\n')
(target/'README.md').write_text('''# NexuAlpha 本地审阅包

此目录与线上发布包分离。未部署 VPS。

运行：`PORT=4200 node server/local-sites-preview.mjs`，打开 http://127.0.0.1:4200/br 。当前环境验证使用 Node v26.0.0，不需要 npm install。

`dist/client` 与 `dist/server/index.js` 是本轮候选产物。外层 `server/` 是本地预览与私有点击采集适配器，`.private/analytics` 在本地接收访问、决策与推荐点击事件后产生。它不是生产统计后端，不包含佣金，也不把点击当注册。

原有中英正文预渲染保留；新增五个 /br 葡语原创页面独立预渲染，其余界面语言沿用客户端渲染；清单、正文与新闻快照均随包保存。上线前另行确定生产采集存储，并经业主审阅。

私有统计命令：`node server/growth-report.mjs --help`。生成的访问和点击不能证明已注册。媒体嵌入预览：`/embed/calculator?market=BR&locale=pt-BR&publisher=preview`。
''')
manifest={str(p.relative_to(target)):hashlib.sha256(p.read_bytes()).hexdigest() for p in sorted(target.rglob('*')) if p.is_file()}
(target/'SHA256.json').write_text(json.dumps(manifest,indent=2)+'\n')
archive=target.parent/f'{target.name}.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED) as bundle:
    for p in target.rglob('*'):
        if p.is_file():bundle.write(p,str(p.relative_to(target.parent)))
print(json.dumps({'directory':str(target),'zip':str(archive),'bytes':archive.stat().st_size,'sha256':hashlib.sha256(archive.read_bytes()).hexdigest()},indent=2))
