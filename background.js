chrome.runtime.onInstalled.addListener(()=>{
    console.info('[+] background.js');
});

let serverUrl = "http://127.0.0.1:5000/amazon";

chrome.alarms.onAlarm.addListener(function(alarm){
    console.info(alarm);
    chrome.storage.sync.get(['dataitems'],async function(res){
        
        // make a web request to our server get the current price of the object
        // serverurl = 'http://127.0.0.1:5000/amazon/';
        if(res.dataitems){
            let dataitems = JSON.parse(res.dataitems);
            console.info(`data : ${JSON.stringify(dataitems)}`);
            for(let data of dataitems){
                console.log('in for loop..')
                await fetch(serverUrl,{
                    method: "post",
                    body: `url=${data.url}`,
                    headers:{
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                }).then(function(resp){return resp.json();}).then(function(resp){
                    console.info(`curprice: ${resp.price}`);
                    if(resp.price != null)
                        data.prices.push(resp.price);
                    console.log(`prices: ${data.prices}`)
                });
            }
            console.info(`data : ${JSON.stringify(dataitems)}`);
            chrome.storage.sync.set({'dataitems':JSON.stringify(dataitems)},function(res){
                console.log('updated prices of items');
                console.info(`dataitems: ${JSON.stringify(dataitems)}`);
            });
        }
    });
});
