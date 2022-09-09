let trackBtn = document.querySelector('#track-btn');
let url = ''
console.log('[+] script.js');

trackBtn.addEventListener("click",()=>{
    initialPrice = document.querySelector('#threshold-price').value;
    console.log(`price:${initialPrice}`)
    document.body.style.backgroundColor = "blue";
    getDetails(initialPrice);

});

function getDetails(price){
    console.log(`href: ${url}, threshold: ${price}`)
}
let f;
chrome.runtime.onMessage.addListener(function(request,sender,sendResponse){
    console.log(request.message)
    url = request.message.url
})

