let scrollTop = document.getElementById("scroll-top");
let consultantFloatBtn = document.getElementById("consultant-float-btn");

function toggleScrollTop() {
  if (scrollTop) {
    window.scrollY > 100 ? scrollTop.style.display = "block" : scrollTop.style.display = "none";   
  }

  if(scrollTop){
    if(window.scrollY > 3500) {
      consultantFloatBtn.style.display = "none";
    } else if (window.scrollY < 100) {
      consultantFloatBtn.style.display = "none";
    } else {
      consultantFloatBtn.style.display = "block";
    }
  }


}



window.addEventListener('load', toggleScrollTop);
document.addEventListener('scroll', toggleScrollTop);
