# FuckHosts

### FuckHosts 是什么
虽然有 SwitchHost! 可以很方便的对 hosts 进行分组，但由于浏览器缓存的原因，hosts 设置往往并不能立即生效，FuckHosts 就是为解决这个痛点而生。开发测试灰度环境切换即时生效，实乃 web 开发人员的居家必备良器。

### 安装使用
```
git clone https://github.com/upliu/FuckHosts.git
cd FuckHosts
npm install
node index.js
```

设置浏览器代理为 127.0.0.1:8890

打开网址 https://127.0.0.1:8891 进行 host 配置

运行示例：

![image](http://github.com/upliu/FuckHosts/raw/master/example.png)

###@todo
- 代理转发
- 错误处理