let moreBtn = document.getElementById('more-btn');
let blankDiv = document.getElementById('blank-div');
let sndNav = document.getElementById('snd-nav');
let sndNavCross = document.getElementById('snd-nav-cross');
let sndNavList = document.getElementsByClassName('snd-nav-list');

blankDiv.style.zIndex = "1";

moreBtn.addEventListener('click', ()=> {
    blankDiv.style.display = "block";
})

blankDiv.addEventListener('click', ()=> {
    blankDiv.style.display = 'none';
})

sndNav.addEventListener('click', (event)=> {
    event.stopPropagation();
})

sndNavCross.addEventListener('click', ()=> {
    blankDiv.style.display = 'none';
})

for (let i = 0; i <= sndNavList.length -1; i++){
    sndNavList[i].addEventListener('click', ()=> {
        blankDiv.style.display = 'none';
    })
}