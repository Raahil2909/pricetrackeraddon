console.log('[+] script.js');
let targetPageUrl = '';
let serverUrl = 'http://127.0.0.1:5000/amazon';
let trackBtn = document.querySelector('#track-btn');
let removeBtns = document.querySelectorAll('.remove-item-btns');
let trashIcon = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 30 30" width="24px" height="24px"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>'

chrome.tabs.query( { active: true, currentWindow: true }, function(tabs){
    targetPageUrl = tabs[0].url;
});

function getDataObj(targetPageUrl, threshold, price){
    return {url: targetPageUrl, threshold: threshold, prices: [price]};
}

function storeJSON(dataJSON){
    chrome.storage.sync.set({'dataitems':dataJSON},function(){
        console.log('[+] stored data');
    });
}

function storeList(dataItemsList){
    storeJSON(JSON.stringify(dataItemsList));
}

trackBtn.addEventListener("click",async ()=>{
    threshold = parseFloat(document.querySelector('#threshold-price').value);
    document.body.style.backgroundColor = "blue"; // for debugging purposes
    chrome.alarms.getAll(function(alarms){
        // add alarm only if one doesnt exist alredy i.e goes in this if only when user adds first item
        if(alarms.length==0){
            chrome.alarms.create('check-price', {periodInMinutes: 1.0}); // modify this to 1 hour later keep it 1 min during testing
        }
    });
    
    // add the url in our storage
    // later on add validation here to see if a valid url is being saved
    document.body.style.backgroundColor = "green"; // for debugging purposes
    await fetch(serverUrl,{
        method: "post",
        body: `url=${targetPageUrl}`,
        headers:{
            "Content-Type": "application/x-www-form-urlencoded"
        }
    }).then(function(resp){return resp.json();}).then(function(resp){
        document.body.style.backgroundColor = "grey"; // for debugging purposes
        chrome.storage.sync.get(['dataitems'], function(res){
            let dataitems = [];
            if(res?.dataitems){
                dataitems = JSON.parse(res?.dataitems);
            } 
            let newObj = getDataObj(targetPageUrl,threshold,resp.price);
            dataitems.push(newObj);
            storeList(dataitems);
        });
    });
    
    
});

function fillTable(){ 
    chrome.storage.sync.get(['dataitems'],function(res){
        if(res.dataitems){
            let dataitems = JSON.parse(res.dataitems);
            let itemsTable = document.querySelector('#items-table');
            let i = 1;
            for(let data of dataitems){
                // console.info(`data from popup: ${JSON.stringify(data)}`);
                newrow = `<tr>
                    <th scope="row">${i}</th>
                    <td><a href="${data.url}">Link</a></td>
                    <td>${data.prices[data.prices.length-1]}</td>
                    <td>${data.threshold}</td>

                    <td><button id="${i-1}" class="remove-item-btns" style="border:0; background-color:white;">${trashIcon}</button></td>
                </tr>`
                itemsTable.innerHTML += newrow;
                i++;
            }
        }
        removeBtns = document.querySelectorAll('.remove-item-btns');
        for(let i=0;i<removeBtns.length; i++){
            removeBtns[i].addEventListener('click',function(e){
                let removeItemNo = e.target.id; 
                removeItem(removeItemNo);
            });
        }
    });
}
fillTable();



function removeItem(itemNo){
    console.log('[-] In remove item function')
    chrome.storage.sync.get(['dataitems'],function(res){
        if(res.dataitems){
            let dataitems = JSON.parse(res.dataitems);
            if(dataitems.length <= itemNo){
                return;
            }
            console.log(`old items -> ${dataitems}`);
            dataitems.splice(itemNo,1); // removes subarray of items at itemNo index and length 1
            if(dataitems.length ==0){
                //remove the alarm as nothing stored
                chrome.alarms.clearAll();
                console.log('[+] removed the alarm');
            }
            console.log(`new items -> ${dataitems}`);
            storeList(dataitems);
        }
    });
}