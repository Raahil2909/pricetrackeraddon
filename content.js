console.log('[+] content.js');

chrome.runtime.sendMessage({
    message:{url:location.href}
})

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
        console.log(request.message.hi)
    }
)