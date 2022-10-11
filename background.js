chrome.runtime.onInstalled.addListener(()=>{
    console.info('[+] background.js');
});

let serverUrl = "http://127.0.0.1:5000/amazon";
// let serverUrl = 'http://172.16.115.48:5000/amazon';

chrome.alarms.onAlarm.addListener(function(alarm){
    console.info(alarm);
    updatePrices();
});

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "updatePrices") {
            console.log("Instantly Update Prices")
            updatePrices();
        }
    }
);

function updatePrices(){
    chrome.storage.sync.get(['dataitems'],async function(res){
        
        // make a web request to our server get the current price of the object
        // serverurl = 'http://127.0.0.1:5000/amazon/';
        if(res.dataitems){
            let dataitems = JSON.parse(res.dataitems,reviver);
            console.info(`data t=0 : ${JSON.stringify(dataitems,replacer)}`);
            for(let datakv of dataitems.entries()){
                let data = datakv[1]
                console.log(`in for loop.., url:${data.url}`)
                let resp = await fetch(serverUrl,{
                    method: "post",
                    body: `url=${data.url}`,
                    headers:{
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                });
                resp = await resp.json();
                
                console.info(`curprice: ${resp.price}, name:${resp.productName}`);
                if(data.initPrice == -1){
                    data.initPrice = resp.price ?? data.initPrice;
                }
                data.curPrice = resp.price ?? data.curPrice;
                data.productName = resp.productName ?? data.productName;
                console.log(`cur: ${resp.price}, init: ${data.initPrice} threshold: ${data.threshold}, types: ${typeof(resp.price)}, ${typeof(data.threshold)}`);
                if(resp.price && data.threshold && resp.price <= data.threshold){
                    notify();
                } else{
                    console.log('[-] sed life no tracked object has gone below threshold price!!')
                }
            }
            console.info(`data t=1 : ${JSON.stringify(dataitems,replacer)}`);
            chrome.storage.sync.set({'dataitems':JSON.stringify(dataitems,replacer)},function(res){
                console.log('updated prices of items');
                // console.info(`dataitems: ${JSON.stringify(dataitems)}`);
            });
        }
    });
}

function notify(){
    let opts = {
        type:"basic",
        title: "Price Below Threshold!!",
        message: "The Price of the item marked by you has gone below the threshold!\n Hurry up and grab the deal!",
        iconUrl:"https://www.google.com/favicon.ico"
    }
    chrome.notifications.create(opts);
}

// helper functions to jsonize map
function replacer(key, value) {
    if(value instanceof Map) {
        return {
        dataType: 'Map',
        value: Array.from(value.entries()), // or with spread: value: [...value]
        };
    } else {
        return value;
    }
}
function reviver(key, value) {
    if(typeof value === 'object' && value !== null) {
        if (value.dataType === 'Map') {
        return new Map(value.value);
        }
    }
    return value;
}