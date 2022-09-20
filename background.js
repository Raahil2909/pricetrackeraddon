chrome.runtime.onInstalled.addListener(()=>{
    console.info('[+] background.js');
});

let serverUrl = "http://127.0.0.1:5000/amazon";
// let serverUrl = 'http://172.16.115.48:5000/amazon';

chrome.alarms.onAlarm.addListener(function(alarm){
    console.info(alarm);
    chrome.storage.sync.get(['dataitems'],async function(res){
        
        // make a web request to our server get the current price of the object
        // serverurl = 'http://127.0.0.1:5000/amazon/';
        if(res.dataitems){
            let dataitems = JSON.parse(res.dataitems);
            console.info(`data : ${JSON.stringify(dataitems)}`);
            for(let data of dataitems){
                console.log(`in for loop.., url:${data.url}`)
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
                    console.log(`cur: ${resp.price}, threshold: ${data.threshold}, types: ${typeof(resp.price)}, ${typeof(data.threshold)}`);
                    if(resp.price && data.threshold && resp.price <= data.threshold){
                        notify();
                    } else{
                        console.log('[-] sed life no tracked object has gone below threshold price!!')
                    }
                });
            }
            chrome.storage.sync.set({'dataitems':JSON.stringify(dataitems)},function(res){
                console.log('updated prices of items');
                console.info(`dataitems: ${JSON.stringify(dataitems)}`);
            });
        }
    });
});


function notify(){
    let opts = {
        type:"basic",
        title: "Price Below Threshold!!",
        message: "The Price of the item marked by you has gone below the threshold!\n Hurry up and grab the deal!",
        iconUrl:"https://www.google.com/favicon.ico"
    }
    chrome.notifications.create(opts);
}