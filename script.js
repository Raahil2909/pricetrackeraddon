let trackBtn = document.querySelector('#track-btn');

console.log('[+] script.js');

trackBtn.addEventListener("click",()=>{
    initialPrice = document.querySelector('#threshold-price').value;
    console.log(`price:${initialPrice}`)
    document.body.style.backgroundColor = "blue";

});
