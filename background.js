chrome.runtime.onInstalled.addListener(()=>{
    console.info('[+] background.js');
})

chrome.alarms.onAlarm.addListener(function(alarm){
    console.info(alarm);
    chrome.storage.sync.get(['url'],function(res){
        
        // make a web request to our server get the current price of the object
        // serverurl = 'http://127.0.0.1:5000/amazon/';
        let serverurl = res.url;
        console.info(`url : ${serverurl}`);
        fetch(serverurl).then(function(resp){return resp.json();}).then(function(resp){
            console.info(`price: ${resp.price}`);
        });
    })
});

