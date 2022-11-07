console.log('[+] script.js');

let targetPageUrl = '';
let serverUrl = 'http://127.0.0.1:5000/amazon';

let trackBtn = document.querySelector('#track-btn');
let removeBtns = document.querySelectorAll('.remove-item-btns');
let refreshBtn = document.querySelector('#refresh-btn');

let refreshIcon = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 30 30" width="24px" height="24px"><path d="M 15 3 C 12.031398 3 9.3028202 4.0834384 7.2070312 5.875 A 1.0001 1.0001 0 1 0 8.5058594 7.3945312 C 10.25407 5.9000929 12.516602 5 15 5 C 20.19656 5 24.450989 8.9379267 24.951172 14 L 22 14 L 26 20 L 30 14 L 26.949219 14 C 26.437925 7.8516588 21.277839 3 15 3 z M 4 10 L 0 16 L 3.0507812 16 C 3.562075 22.148341 8.7221607 27 15 27 C 17.968602 27 20.69718 25.916562 22.792969 24.125 A 1.0001 1.0001 0 1 0 21.494141 22.605469 C 19.74593 24.099907 17.483398 25 15 25 C 9.80344 25 5.5490109 21.062074 5.0488281 16 L 8 16 L 4 10 z"/></svg>'
let trashIcon = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 30 30" width="24px" height="24px"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>'
let itemid = 0; // get this from storage

chrome.storage.sync.get(['itemid'],function(res){
    if(res?.itemid) itemid = res.itemid;
});

fillTable();

chrome.tabs.query( { active: true, currentWindow: true }, function(tabs){
    targetPageUrl = tabs[0].url;
});


function storeJSON(dataJSON){
    chrome.storage.sync.set({'dataitems':dataJSON},function(){
        console.log(`[+] stored data: ${dataJSON}`);
    });
}

function storeMap(dataItemsMap){
    let finalJSON = JSON.stringify(dataItemsMap,replacer);
    // console.info(`storing: ${finalJSON}`);
    storeJSON(finalJSON);
}

function storeId(){
    chrome.storage.sync.set({'itemid':itemid});
}

function getDataObj(targetPageUrl, threshold, curPrice, initPrice, productName){
    return {url: targetPageUrl, threshold: threshold, curPrice: curPrice, initPrice: initPrice, productName:productName};
}

trackBtn.addEventListener("click",async ()=>{
    threshold = parseFloat(document.querySelector('#threshold-price').value);
    
    //////////// TODO: validate targetPageUrl ////////////////

    // add the row in frontend
    let newObj = getDataObj(targetPageUrl,threshold,0,-1,"link"); // price , name of object are just place holders until we get actual names in backgroundjs
    addRowInTable(newObj,itemid);
    // cant delete this row before closing and reoping the popup as no event listener is added
    
    // add data in browser storage
    chrome.storage.sync.get(['dataitems'], function(res){
        let dataItemsMap = new Map();

        if(res?.dataitems){
            dataItemsMap = JSON.parse(res?.dataitems,reviver);
        } 
        dataItemsMap.set(itemid,newObj);
        itemid++;
        storeMap(dataItemsMap);
        storeId();
    });
    
    console.log('telling background to fetch prices....')
    // fire the alarm instantly as we added new element in storage
    chrome.runtime.sendMessage({
        msg: "updatePrices", 
        data: {
            subject: "updateAllPrices",
            content: "updateAllPrices"
        }
    });
    
    // add alarm only if one doesnt exist alredy i.e goes in this if only when user adds first item
    chrome.alarms.getAll(function(alarms){
        if(alarms.length==0){
            console.log('adding alarm');
            chrome.alarms.create('check-price', {periodInMinutes: 1.0}); // modify this to 1 hour later keep it 1 min during testing
        } else{
            console.log('alarms already there');
        }
    });
});


chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
        if (request.msg === "updatePrices") {
            console.log("Update popup HTML to reflect prices");
            refreshTable();
        }
    }
);

refreshBtn.addEventListener("click",refreshTable);

function refreshTable(){
    console.log('refreshing....\n');
    clearTable();
    fillTable();
}

function clearTable(){
    let itemsTableBody = document.querySelector('#items-table-body');
    itemsTableBody.innerHTML = '';
}

function addRowInTable(rowdata,rid){
    // <td scope="row">${i}</th>
    let newrow = `<tr id="row-items-${rid}">
                    <td><a href="${rowdata.url}" class="name-hidden">${rowdata.productName}</a></td>
                    <td>${rowdata.curPrice}</td>
                    <td>${rowdata.initPrice}</td>
                    <td>${rowdata.threshold}</td>
                    <td><button id="${rid}" class="remove-item-btns" style="border:0; background-color:white;">${trashIcon}</button></td>
                  </tr>`
    let itemsTableBody = document.querySelector('#items-table-body');
    itemsTableBody.innerHTML += newrow;
}

function fillTable(){ 
    console.log('in fill table...');
    chrome.storage.sync.get(['dataitems'],async function(res){
        let dataItemsMap = new Map();
        if(res.dataitems){
            dataItemsMap = JSON.parse(res.dataitems,reviver);
            for(let kv of dataItemsMap.entries()){
                addRowInTable(kv[1],kv[0]);
            }
        }
        removeBtns = document.querySelectorAll('.remove-item-btns');
        // console.info(removeBtns);
        for(let i=0;i<removeBtns.length; i++){
            removeBtns[i].addEventListener('click',function(e){
                let removeItemId = parseInt(removeBtns[i].id);
                console.log(`removing item .${removeItemId}.`);
                removeItem(removeItemId,dataItemsMap);
            });
        }
    });
}

function removeItem(itemId,dataItemsMap){
    // remove from table frontend
    console.log(`[-] In remove item function for item ${itemId}`);
    let toBeRemoved = document.querySelector(`#row-items-${itemId}`);
    console.log(`to be removed: ${toBeRemoved}`);
    toBeRemoved?.remove();

    // remove data from browser storage
    dataItemsMap.delete(itemId);
    console.info(`dataitems: ${JSON.stringify(dataItemsMap,replacer)}`)
    storeMap(dataItemsMap);
    if(dataItemsMap.size == 0){
        //remove the alarm as nothing stored
        chrome.alarms.clearAll();
        console.log('[+] removed the alarm');
    }
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