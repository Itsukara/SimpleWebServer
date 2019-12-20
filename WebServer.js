var http = require('http');
var fs = require('fs');
var path = require('path');
const GET_PORT = 3001;
const DEFAULT_FILE = "index.html"
const ASK_NOT_FOUND = '2001-01-01T00:00:00.000Z'
const ASK_SYMBOL = "?"

const get_server = http.createServer();

var fileContent = {};
var fileLastModified = {};

var {PythonShell} = require('python-shell');
var options = {
  mode: 'text',
  pythonPath: 'C:/Users/iitsu/Anaconda3/python.exe',
  pythonOptions: ['-u'], 
}

var watch_config = [
    {filePath: "./web01-input.txt", python_file: "./web01.py"},
    {filePath: "./web01.html"     , python_file: ""},
    {filePath: "./web02.html"     , python_file: ""},
]

watch_config.forEach(function({ filePath, python_file}) {
    console.log(`filePath=${filePath}, python_file=${python_file}`)
    fs.watch(filePath, function(eventType, filename) {
        console.log(`CHANGED: ${filePath}`)
        if (python_file) {
            PythonShell.run(python_file, options, function (err, result) {
                console.log(`EXECUTED: ${python_file}`)
                if (err) {
                    console.log(`ERROR: ${err}`)
                } else {
                    console.log(`RESULT: \n${result}\n`)
                }
            })
        } else {
            fs.readFile(filePath, function(error, content) {
                fileContent[filePath] = content;
                console.log(`UPDATED: fileContent[${filePath}]`)
                fs.stat(filePath, function(err, stats) {
                    var { mtime } = stats;
                    fileLastModified[filePath] = mtime.toISOString();
                    console.log(`UPDATED: fileLastModified[${filePath}]`)
                })
            })
        }
    })
})

get_server.on('request', function (request, response) {
    let filePath = '.' + request.url;
    if (filePath == './') {
        filePath = './' + DEFAULT_FILE;
    }
    
    if (filePath.indexOf(ASK_SYMBOL) != -1) {
        filePath = filePath.replace(ASK_SYMBOL, "")
        let ip = response.socket.remoteAddress;
        let  port = response.socket.remotePort;
        console.log('ASK from ', ip + ":" + port + " ", filePath)
    
        
        let lastModified = fileLastModified[filePath] || ASK_NOT_FOUND;
        response.end(lastModified, 'utf-8');
    } else {
        let ip = response.socket.remoteAddress;
        let  port = response.socket.remotePort;
        console.log('GET from ', ip + ":" + port + " ", filePath)

        let extname = String(path.extname(filePath)).toLowerCase();
        let mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpg',
            '.gif': 'image/gif',
            '.wav': 'audio/wav',
            '.mp4': 'video/mp4',
            '.woff': 'application/font-woff',
            '.ttf': 'application/font-ttf',
            '.eot': 'application/vnd.ms-fontobject',
            '.otf': 'application/font-otf',
            '.svg': 'application/image/svg+xml'
        };

        let contentType = mimeTypes[extname] || 'application/octet-stream';
        let content = fileContent[filePath]

        if (!content) {
            console.log("readFile: " + filePath)
            fs.readFile(filePath, function(error, content) {
                if (error) {
                    if(error.code == 'ENOENT') {
                        fs.readFile('./404.html', function(error, content) {
                            response.writeHead(200, { 'Content-Type': contentType });
                            response.end(content, 'utf-8');
                        });
                    }
                    else {
                        response.writeHead(500);
                        response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                        response.end();
                    }
                }
                else {
                    fileContent[filePath] = content;
                    fs.stat(filePath, function(err, stats) {
                        let { mtime } = stats;
                        fileLastModified[filePath] = mtime.toISOString();
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    })
                }
            });
        } else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    }
})

var dns = require('dns');
var os = require('os')
var hostname = os.hostname();
dns.lookup(hostname, function (err, address, family) {
    get_server.listen(GET_PORT, address);
    console.log('GET Server running at http://' + address + ':' + GET_PORT + '/');
})

