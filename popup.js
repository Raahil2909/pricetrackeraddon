console.log('[+] script.js');
let url = '';
chrome.tabs.query( { active: true, currentWindow: true }, function(tabs){
    url = tabs[0].url;
})
// chrome.storage.sync.set({'data': 'bye'}, function() {
//     console.log('Value is set to bye');
// });

let trackBtn = document.querySelector('#track-btn');
trackBtn.addEventListener("click",()=>{
    thresholdPrice = document.querySelector('#threshold-price').value;
    console.log(`price:${thresholdPrice}`);
    document.body.style.backgroundColor = "blue";
    
    chrome.alarms.create('check-price', {periodInMinutes: 1.0}); // modify this to 1 hour later keep it 1 min during testing
    
    // add the url in our storage
    // later on add validation here to see if a valid url is being saved
    let serverurl = 'http://127.0.0.1:5000/amazon/' + btoa(url)
    chrome.storage.sync.set({'url':serverurl}, function(){
        console.log(`setting the url : ${serverurl}`)
    });

    console.info(`url : ${serverurl}`);
    fetch(serverurl).then(function(resp){return resp.json();}).then(function(resp){
        console.log(`price: ${resp.price}`);
    });

    
});