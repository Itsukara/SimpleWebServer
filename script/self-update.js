function self_update(interval) {
    const ASK_SYMBOL = "?"
    var ask_url = location.href + ASK_SYMBOL
    var firstFetched = '2001-01-01T00:00:00.000Z'
 
    function check_and_self_update() {
        axios.get(ask_url).then(function(res) {
            let lastModified =  res.data
            // console.log("firstFetched = " + firstFetched)
            // console.log("lastModified = " + lastModified)
            if (lastModified > firstFetched) {
                console.log("Self-refresh")
                location.href = location.href
            }
        }).catch(function (error) {
            console.log(error)
        })
    }

    var interval_ms = interval * 1000
    axios.get(ask_url).then(function(res) {
        firstFetched = res.data
        console.log("firstFetched = " + firstFetched)
        setInterval(check_and_self_update, interval_ms)
    })
}