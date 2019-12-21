const ASK_SYMBOL = "?"
var ask_url = location.href + ASK_SYMBOL

var load_time =  (new Date(Date.now())).toISOString()
console.log("load_time    =" + load_time)
function f_interval() {
    axios.get(ask_url).then(res => {
        let lastModified =  res.data
        if (lastModified > load_time) {
            console.log("load_time    = " + load_time)
            console.log("lastModified = " + lastModified)
            console.log("Self-refresh")
            location.href = location.href
        }
    })
}
var f_delay = 2 * 1000
setInterval(f_interval, f_delay)
