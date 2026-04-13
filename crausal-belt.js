(function() {
      const carousel = document.getElementById('carousel');
      const track = document.getElementById('track');
      const prevBtn = document.getElementById('prev');
      const nextBtn = document.getElementById('next');
      const dotsContainer = document.getElementById('dots');

      // Original slides (3)
      const originalSlides = Array.from(track.children);
      const totalOriginal = originalSlides.length; // should be 3

      // Create clones for infinite effect:
      // cloneLast -> at beginning, cloneFirst -> at end
      const cloneFirst = originalSlides[0].cloneNode(true);
      const cloneLast = originalSlides[totalOriginal - 1].cloneNode(true);

      // Prepend cloneLast and append cloneFirst
      track.insertBefore(cloneLast, track.firstChild);
      track.appendChild(cloneFirst);

      // After cloning, slides in DOM = totalOriginal + 2
      const slides = Array.from(track.children);
      const total = slides.length; // totalOriginal + 2

      // Start index at 1 (the real first slide is at index 1 because index 0 is cloneLast)
      let index = 1;
      let isTransitioning = false;
      let autoInterval = null;

      // Set initial position
      function setTranslateNoTransition() {
        track.style.transition = 'none';
        track.style.transform = `translateX(-${index * 100}%)`;
        // force reflow so next transition works
        void track.offsetWidth;
        track.style.transition = '';
      }

      setTranslateNoTransition();

      // Create dots for the real slides (3)
      for (let i = 0; i < totalOriginal; i++) {
        const dot = document.createElement('span');
        dot.className = 'dot';
        if (i === 0) dot.classList.add('active');
        dot.dataset.slide = i + 1; // mapping to real slide index (1..totalOriginal)
        dot.addEventListener('click', () => {
          goTo(i + 1); // real slide index
        });
        dotsContainer.appendChild(dot);
      }

      function updateDots() {
        const dots = dotsContainer.querySelectorAll('.dot');
        // map current index (including clones) to real slide index 1..totalOriginal
        let real = index;
        if (real === 0) real = totalOriginal;            // cloneLast -> last real
        else if (real === totalOriginal + 1) real = 1;   // cloneFirst -> first real
        // convert to 0-based for dots
        const dotIndex = real - 1;
        dots.forEach((d, i) => d.classList.toggle('active', i === dotIndex));
      }

      function goTo(realSlideIndex) {
        // realSlideIndex is 1..totalOriginal
        if (isTransitioning) return;
        index = realSlideIndex; // because real slides are at positions 1..totalOriginal
        moveTrack();
        resetAuto();
      }

      function moveTrack() {
        isTransitioning = true;
        track.style.transition = 'transform 0.45s ease';
        track.style.transform = `translateX(-${index * 100}%)`;
      }

      // Next & Prev mapped to movement over the cloned structure
      function next() {
        if (isTransitioning) return;
        index++;
        moveTrack();
        resetAuto();
      }
      function prev() {
        if (isTransitioning) return;
        index--;
        moveTrack();
        resetAuto();
      }

      nextBtn.addEventListener('click', next);
      prevBtn.addEventListener('click', prev);

      // When transition ends, if we're on a clone, jump to the matching real slide without transition
      track.addEventListener('transitionend', () => {
        isTransitioning = false;
        // If at appended cloneFirst (index === totalOriginal + 1) -> jump to index = 1
        if (index === totalOriginal + 1) {
          index = 1;
          setTranslateNoTransition();
        }
        // If at prepended cloneLast (index === 0) -> jump to index = totalOriginal
        if (index === 0) {
          index = totalOriginal;
          setTranslateNoTransition();
        }
        updateDots();
      });

      // Auto play
      function startAuto() {
        stopAuto();
        autoInterval = setInterval(() => {
          next();
        }, 3000);
      }
      function stopAuto() {
        if (autoInterval) {
          clearInterval(autoInterval);
          autoInterval = null;
        }
      }
      function resetAuto() {
        stopAuto();
        startAuto();
      }
      startAuto();

      /* ===========================
         Touch / Swipe with dragging
         =========================== */
      let startX = 0;
      let currentTranslate = 0;
      let dragging = false;
      let animationFrameId = null;

      carousel.addEventListener('touchstart', touchStart, {passive:true});
      carousel.addEventListener('mousedown', mouseStart); // optional: support mouse drag on desktop

      function touchStart(e) {
        if (isTransitioning) return;
        stopAuto();
        startX = e.touches[0].clientX;
        dragging = true;
        currentTranslate = -index * carousel.offsetWidth;
        track.style.transition = 'none';
      }

      function mouseStart(e) {
        // left-button only
        if (e.button !== 0) return;
        if (isTransitioning) return;
        stopAuto();
        startX = e.clientX;
        dragging = true;
        currentTranslate = -index * carousel.offsetWidth;
        track.style.transition = 'none';
        window.addEventListener('mousemove', mouseMove);
        window.addEventListener('mouseup', mouseEnd);
      }

      carousel.addEventListener('touchmove', touchMove, {passive:false});
      function touchMove(e) {
        if (!dragging) return;
        const x = e.touches[0].clientX;
        const dx = x - startX;
        const translate = currentTranslate + dx;
        // update transform directly
        track.style.transform = `translateX(${translate}px)`;
        // prevent page scrolling horizontal when dragging horizontally
        if (Math.abs(dx) > 10) e.preventDefault();
      }

      function mouseMove(e) {
        if (!dragging) return;
        const x = e.clientX;
        const dx = x - startX;
        const translate = currentTranslate + dx;
        track.style.transform = `translateX(${translate}px)`;
      }

      carousel.addEventListener('touchend', touchEnd);
      carousel.addEventListener('touchcancel', touchEnd);

      function mouseEnd(e) {
        window.removeEventListener('mousemove', mouseMove);
        window.removeEventListener('mouseup', mouseEnd);
        touchEnd();
      }

      function touchEnd(e) {
        if (!dragging) return;
        dragging = false;
        // compute swipe distance relative to width
        const endTransform = getCurrentTranslateX();
        const movedPx = endTransform + index * carousel.offsetWidth; // negative values: moved left negative
        // movedPx = currentTranslate + dx + index*width ??? easier: compute dx using last touch position if available
        // We'll instead compute dx from the final transform and intended position:
        const dx = endTransform + index * carousel.offsetWidth; // equals translate - (-index*width) => dx
        // threshold in px
        const threshold = Math.max(50, carousel.offsetWidth * 0.18);

        // If dx < -threshold -> moved left enough => go next
        // If dx > threshold -> moved right enough => go prev
        if (dx < -threshold) {
          // user swiped left -> move to next
          index++;
        } else if (dx > threshold) {
          // user swiped right -> move to prev
          index--;
        }
        // animate to the final slot
        track.style.transition = 'transform 0.45s ease';
        track.style.transform = `translateX(-${index * 100}%)`;

        // restart autoplay after a pause
        resetAuto();
      }

      function getCurrentTranslateX() {
        // returns current translateX in px (from style)
        const st = window.getComputedStyle(track);
        const matrix = new WebKitCSSMatrix(st.transform || st.webkitTransform);
        return matrix.m41; // translateX in px
      }

      // Pause on hover (desktop), resume on leave
      carousel.addEventListener('mouseenter', stopAuto);
      carousel.addEventListener('mouseleave', startAuto);

      // Keyboard accessibility
      window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      });

      // initial dot update (in case)
      updateDots();

      // Expose some helpers for debugging (optional)
      window._carousel = { goTo, next, prev, startAuto, stopAuto };
    })();