const start = document.getElementById("start");
const end = document.getElementById("end");

const supported = "Profiler" in window;

if (!supported) {
  start.setAttribute("disabled", "true");
  end.setAttribute("disabled", "true");
}

function startTrace() {}

function endTrace() {}
