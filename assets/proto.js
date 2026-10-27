/* ============================================================
   Walmart AI Lens — shared prototype state-machine
   Each prototype page defines WM_STEPS = [{id,label,desc,duration}]
   and calls WMProto.init() on DOMContentLoaded.
   ============================================================ */
(function(){
  "use strict";

  function $(sel, root){ return (root||document).querySelector(sel); }
  function $all(sel, root){ return Array.prototype.slice.call((root||document).querySelectorAll(sel)); }

  var state = {
    steps: [],
    current: 0,
    playing: false,
    timer: null
  };

  function render(){
    state.steps.forEach(function(step, i){
      var screenEl = document.getElementById(step.id);
      var flowEl = document.getElementById("flow-" + step.id);
      var dotEl = document.getElementById("dot-" + step.id);
      var isActive = i === state.current;
      var isDone = i < state.current;

      if(screenEl){
        screenEl.classList.toggle("active", isActive);
        screenEl.classList.toggle("leaving", !isActive);
      }
      if(flowEl){
        flowEl.classList.toggle("active", isActive);
        flowEl.classList.toggle("done", isDone);
      }
      if(dotEl){
        dotEl.classList.toggle("current", isActive);
        dotEl.classList.toggle("done", isDone);
      }
    });
    var label = $(".step-label");
    if(label && state.steps[state.current]){
      label.textContent = (state.current+1) + " / " + state.steps.length + " — " + state.steps[state.current].label;
    }
    var playBtn = $("#playBtn");
    if(playBtn){
      playBtn.innerHTML = state.playing ? ICONS.pause + " Pause" : ICONS.play + " Play demo";
    }
  }

  function goTo(index, opts){
    opts = opts || {};
    if(index < 0 || index >= state.steps.length) return;
    state.current = index;
    render();
    if(typeof state.steps[index].onEnter === "function"){
      state.steps[index].onEnter();
    }
    if(!opts.silent && window.__wmOnStep){ window.__wmOnStep(index); }
  }

  function next(){
    if(state.current < state.steps.length - 1){
      goTo(state.current + 1);
      return true;
    }
    return false;
  }

  function clearTimer(){
    if(state.timer){ clearTimeout(state.timer); state.timer = null; }
  }

  function scheduleNext(){
    clearTimer();
    var step = state.steps[state.current];
    var dur = (step && step.duration) || 2200;
    state.timer = setTimeout(function(){
      if(!state.playing) return;
      var advanced = next();
      if(advanced){
        scheduleNext();
      } else {
        state.playing = false;
        render();
      }
    }, dur);
  }

  function play(){
    if(state.current >= state.steps.length - 1){
      goTo(0);
    }
    state.playing = true;
    render();
    scheduleNext();
  }

  function pause(){
    state.playing = false;
    clearTimer();
    render();
  }

  function togglePlay(){
    if(state.playing){ pause(); } else { play(); }
  }

  function replay(){
    pause();
    goTo(0);
  }

  var ICONS = {
    play:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
    pause:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>'
  };

  function buildChrome(){
    // step dots
    var dotsWrap = $(".steps");
    if(dotsWrap){
      dotsWrap.innerHTML = state.steps.map(function(s){
        return '<div class="step-dot" id="dot-' + s.id + '"></div>';
      }).join("");
    }
    // flow list
    var flowWrap = $(".flow-list");
    if(flowWrap){
      flowWrap.innerHTML = state.steps.map(function(s, i){
        return (
          '<div class="flow-item" id="flow-' + s.id + '" data-index="' + i + '">' +
            '<div class="flow-num">' + (i+1) + '</div>' +
            '<div class="flow-body"><h4>' + s.label + '</h4><p>' + s.desc + '</p></div>' +
          '</div>'
        );
      }).join("");
      $all(".flow-item", flowWrap).forEach(function(el){
        el.addEventListener("click", function(){
          pause();
          goTo(parseInt(el.getAttribute("data-index"), 10));
        });
      });
    }
  }

  var WMProto = {
    init: function(steps){
      state.steps = steps;
      state.current = 0;
      state.playing = false;
      buildChrome();
      render();

      var playBtn = $("#playBtn");
      if(playBtn){ playBtn.addEventListener("click", togglePlay); }
      var replayBtn = $("#replayBtn");
      if(replayBtn){ replayBtn.addEventListener("click", replay); }

      $all("[data-advance]").forEach(function(el){
        el.addEventListener("click", function(e){
          pause();
          var ripple = document.createElement("div");
          ripple.className = "tap-ripple go";
          var rect = el.getBoundingClientRect();
          var x = (e.clientX - rect.left);
          var y = (e.clientY - rect.top);
          ripple.style.left = x + "px";
          ripple.style.top = y + "px";
          el.appendChild(ripple);
          setTimeout(function(){ ripple.remove(); }, 700);
          next();
        });
      });

      $all("[data-goto]").forEach(function(el){
        el.addEventListener("click", function(){
          pause();
          goTo(parseInt(el.getAttribute("data-goto"), 10));
        });
      });

      var params = new URLSearchParams(window.location.search);
      if(params.get("autoplay") === "1"){
        setTimeout(play, 600);
      }
    },
    goTo: goTo,
    next: next,
    play: play,
    pause: pause,
    replay: replay
  };

  window.WMProto = WMProto;
})();
