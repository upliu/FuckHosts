var https = require('https'),
    http = require('http'),
    util = require('util'),
    fs   = require('fs'),
    path = require('path'),
    url = require('url'),
    net = require('net'),
    httpProxy = require('http-proxy')
    , express = require('express')
    , bodyParser = require('body-parser')
    , app = express();

var PORT = 8890
var GUI_PORT = 8891

var HostMap = []
var HostMapParsed = {}

//
// Create the proxy server listening on port 8010
//
// var proxy = httpProxy.createServer().listen(PORT)
var proxy = http.createServer(function (req, res) {
    var parsed = url.parse(req.url)
        , port = parsed.port || (parsed.protocol === 'https://' ? 443 : 80)
        , hostname = parsed.hostname
        , ip = get_host_ip(hostname)
console.log(ip, req.url)
    var proxy = httpProxy.createServer()
    var proxyOptions = {
        target: {
            host: ip,
            port: port
        }
    };
    proxy.web(req, res, proxyOptions)
}).listen(PORT)

proxy.on('error', function (err, req, res) {
    console.err('Something went wrong.' . err)
});

// 转发 https 请求
// directly forward https request
proxy.on('connect', function(req, cltSocket, head) {
    // connect to an origin server
    var srvUrl = require('url').parse('http://' + req.url);
    var srvSocket = net.connect(srvUrl.port, srvUrl.hostname, function() {
        cltSocket.write('HTTP/1.1 200 Connection Established\r\n' +
            'Proxy-agent: MyProxy\r\n' +
            '\r\n');
        srvSocket.write(head);
        srvSocket.pipe(cltSocket);
        cltSocket.pipe(srvSocket);
    });
    srvSocket.on('error', function() {
        console.log('[https connect error]: ' + req.url);
    });
});

// directly forward websocket
proxy.on('upgrade', function(req, socket, head) {
    socket.write('HTTP/1.1 101 Web Socket Protocol Handshake\r\n' +
        'Upgrade: WebSocket\r\n' +
        'Connection: Upgrade\r\n' +
        '\r\n');

    socket.pipe(socket); // echo back
});

// parse application/json
app.use(bodyParser.json())
app.use(express.static('public'))
app.get('/hosts', function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8'});
    res.end( JSON.stringify( HostMap ) );
})
app.post('/hosts', function (req, res) {
    saveHosts(req.body)
    res.writeHead(200, {'Content-Type': 'application/json; charset=UTF-8'});
    res.end('OK');
})
app.listen(GUI_PORT)

loadHosts()

console.log('http proxy server started on port ' + PORT);
console.log('gui listening at http://localhost:' + GUI_PORT);



function get_host_ip(hostname) {
    return HostMapParsed[hostname] || hostname
}

function parseHostMap() {
    HostMapParsed = {}
    HostMap.forEach(function (group) {
        if (group.checked > 0) {
            var text = group.text
                , lines = text.split('\n')
            lines.forEach(function (line) {
                if (line.match(/^\s*#/)) {
                    return;
                }
                var items = line.split(/\s+/)
                    , ip = items.shift()
                items.forEach(function (domain) {
                    HostMapParsed[domain] = ip
                })
            })
        }
    })
}

function loadHosts() {
    try {
        HostMap = JSON.parse(fs.readFileSync('hosts/hosts.dat'))
    } catch (e) {
        HostMap = []
    }
    parseHostMap()
}

function saveHosts(data) {
    HostMap = data
    // 自动备份
    fs.writeFile('hosts/hosts.dat.bak.'+Date.now(), JSON.stringify(HostMap))
    fs.writeFile('hosts/hosts.dat', JSON.stringify(HostMap))
    parseHostMap()
}
