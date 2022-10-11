console.log('[+] script.js');
let targetPageUrl = '';
let serverUrl = 'http://127.0.0.1:5000/amazon';
let trackBtn = document.querySelector('#track-btn');
let removeBtns = document.querySelectorAll('.remove-item-btns');
let trashIcon = '<svg xmlns="http://www.w3.org/2000/svg"  viewBox="0 0 30 30" width="24px" height="24px"><path d="M 13 3 A 1.0001 1.0001 0 0 0 11.986328 4 L 6 4 A 1.0001 1.0001 0 1 0 6 6 L 24 6 A 1.0001 1.0001 0 1 0 24 4 L 18.013672 4 A 1.0001 1.0001 0 0 0 17 3 L 13 3 z M 6 8 L 6 24 C 6 25.105 6.895 26 8 26 L 22 26 C 23.105 26 24 25.105 24 24 L 24 8 L 6 8 z"/></svg>'
let itemid = 0; // get this from storage

// import  {replacer,reviver} from '../serialize/serializer';

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

function addRowInTable(rowdata,rid){
    // <td scope="row">${i}</th>
    let newrow = `<tr id="row-items-${rid}">
                    <td><a href="${rowdata.url}" class="name-hidden">${rowdata.productName}</a></td>
                    <td>${rowdata.curPrice}</td>
                    <td>${rowdata.initPrice}</td>
                    <td>${rowdata.threshold}</td>
                    <td><button id="${rid}" class="remove-item-btns" style="border:0; background-color:white;">${trashIcon}</button></td>
                  </tr>`
    let itemsTable = document.querySelector('#items-table-body');
    itemsTable.innerHTML += newrow;
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