
# magic-toolkit 

## 安装

```shell
npm install -g magic-toolkit
```

## 使用

### 输出 ipfs 信息

```shell
mt ipfs README.md

# 输出
{
  absolutePath: '/Users/skypesky/workSpaces/javascript/github/magic-toolkit/README.md',
  cidV0: 'QmVC6tf4UzaEiUn1a5h7FMXQjwjMcTXenL1kFgydVvFFCV',
  cidV1: 'bafybeidf2exwpis5jr44ecrv5auvultxefyxw7feiijns3tbuucrzbqwsi',
  size: '133 bytes(133.00 B)',
  duration: '11ms'
}
```

### 输出 md5 信息

```shell
mt md5 README.md

# 输出
{
  absolutePath: '/Users/skypesky/workSpaces/javascript/github/magic-toolkit/README.md',
  md5: '348d2a96dafd688b25e1c40f33b52c68',
  size: '758 bytes(758.00 B)',
  duration: '3ms'
}
```


### github 备份与还原

```shell
mt github backup -o $orgName -t $githubToken # 备份 github 的组织
mt github backup -o $orgName -t $githubToken -r demo1,demo2 # 备份 github 的组织下的 demo1 和 demo2 仓库

mt github restore -o $orgName -t $githubToken # 还原 github 的组织
mt github restore -o $orgName -t $githubToken -r demo1,demo2 # 还原 github 的组织下的 demo1 和 demo2 仓库
```

  执行 github 的备份还原后,你还可以通过 .$orgName.json 这个文件查看备份的一些信息.