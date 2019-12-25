var http = require('http');
var fs = require('fs');
var path = require('path');
const GET_PORT = 3001;
const DEFAULT_FILE = "index.html"
const ASK_NOT_FOUND = '2001-01-01T00:00:00.000Z'
const ASK_SYMBOL = "?"
const ROOT = ".."
const ROOTD = ROOT + "/"

const get_server = http.createServer();

var fileContent = {};
var fileLastModified = {};
var fsWait = {};
const fsWaitTime = 500

var {PythonShell} = require('python-shell');
var options = {
  mode: 'text',
  pythonPath: 'C:/Users/iitsu/Anaconda3/python.exe',
  pythonOptions: ['-u'], 
}

var watch_list = []

var watch_config = [
    {filePath: "dir01/web01-input.txt", python_file: "dir01/web01.py"},
    {filePath: "dir02/web02-input.txt", python_file: "dir02/web02.py"},
]

function update_fileLastModified(filePath) {
    return new Promise(function (resolve) {
        fs.stat(filePath, function(err, stats) {
            var { mtime } = stats;
            let lastModified = mtime.toISOString();
            fileLastModified[filePath] = lastModified
            console.log(`SET: fileLastModified[${filePath}] = ${lastModified}`)
            resolve(lastModified);
        })
    })
}

watch_config.forEach(function({ filePath, python_file}) {
    filePath = ROOTD +  filePath
    python_file = ROOTD + python_file
    console.log(`WATCH: filePath=${filePath}, python_file=${python_file}`)

    update_fileLastModified(filePath).then(function(lastModified) {
        watch_list.push(filePath)
        fs.watch(filePath, function(eventType, filename) {
            if (fsWait[filePath]) return
            fsWait[filePath] = true
            setTimeout(() => fsWait[filePath] = false, fsWaitTime);
            console.log(`CHANGED: ${filePath} eventType:${eventType}`)
     
            update_fileLastModified(filePath).then(function(lastModified) {
                PythonShell.run(python_file, options, function (error, result) {
                    console.log(`EXECUTED: ${python_file}`)
                    if (error) {
                        console.log(`ERROR: ${error}`)
                    } else {
                        console.log(`RESULT: \n${result}\n`)
                    }
                })
            })
        })
    })
})

function watch_file(filePath) {
    console.log(`WATCH: filePath=${filePath}`)
    update_fileLastModified(filePath).then(function(lastModified) {
        watch_list.push(filePath)
        fs.watch(filePath, function(eventType, filename) {
            if (fsWait[filePath]) return
            fsWait[filePath] = true
            setTimeout(() => fsWait[filePath] = false, fsWaitTime);
            console.log(`CHANGED: ${filePath} eventType:${eventType}`)

            update_fileLastModified(filePath).then(function(lastModified) {
                fs.readFile(filePath, function(error, content) {
                    if (error) {
                        console.log(`ERROR: ${error}`)
                    } else {
                        fileContent[filePath] = content;
                        console.log(`UPDATED: fileContent[${filePath}]`)
                    }           
                })
            })
        })
    })
}

get_server.on('request', function (request, response) {
    let filePath = ROOT + request.url;
    if (filePath == ROOTD) {
        filePath = ROOTD + DEFAULT_FILE;
    }
    
    if (filePath.indexOf(ASK_SYMBOL) != -1) {
        filePath = filePath.replace(ASK_SYMBOL, "")
        let ip = response.socket.remoteAddress;
        let port = response.socket.remotePort;
        console.log('ASK from ', ip + ":" + port + " ", filePath)

        let lastModified = fileLastModified[filePath] || ASK_NOT_FOUND;
        response.end(lastModified, 'utf-8');
    } else {
        let ip = response.socket.remoteAddress;
        let port = response.socket.remotePort;
        console.log('GET from ', ip + ":" + port + " ", filePath)

        let extname = String(path.extname(filePath)).toLowerCase();
        let mimeTypes = {
            '.txt' : 'text/plain',
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
            if (filePath == ROOTD + "watch_list") {
                response.writeHead(200, { 'Content-Type': 'text/plain' });
                list = []
                watch_list.forEach(f => {
                    list.push(fileLastModified[f] + ": " + f )
                });
                list.sort()
                content = list.join("\n")
                response.end(content, 'utf-8');
            } else {
                console.log("READFILE: " + filePath)
                fs.readFile(filePath, function(error, content) {
                    if (error) {
                        if(error.code == 'ENOENT') {
                            fs.readFile('./404.html', function(error, content) {
                                response.writeHead(200, { 'Content-Type': 'text/html' });
                                response.end(content, 'utf-8');
                            });
                        }
                        else {
                            response.writeHead(500);
                            response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                            response.end();
                        }
                    } else {
                        watch_file(filePath);
                        fileContent[filePath] = content;
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    }
                });
            }
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

