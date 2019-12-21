# SimpleWebServer
This is an example of simple WebServer and Self-Updating Web Page not using complex framework.
So, it will be very easy to read, understand and change the source code for your self.


All the content are cached in memory of WebServer.
In WebServer, the lastModified of files are store and updated when the change detected by fs.watch().
WebServer return the lastModified of file when the web-page reqeust "file_name?".
The client web-page gets lastModified of its file from WebServer and self-refresh if its lastModified is newer than its load time. 

