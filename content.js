console.log('[+] content.js');

chrome.runtime.sendMessage({
    message:{url:location.href}
})

chrome.runtime.onMessage.addListener((request,sender,sendResponse)=>{
        // console.log(request.message.hi)
        if(request.message.trigger=='track'){
            content = fetchPage();
            console.log(content)
        }
    }
)

async function fetchPage() {
	const resp = await fetch(location.href);
	console.log(await resp.json());
}

