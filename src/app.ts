const output = document.getElementById("output");
const start = document.getElementById("start");

const supported = "Profiler" in window;

const SAMPLING_INTERVAL_HZ = 1;
const SAMPLING_BUFFER_SIZE = Number.MAX_SAFE_INTEGER;

let profiler: Window["Profiler"] | null = null;

/**
 * This it essentially the code that blocks the main thread.
 * On my m1 macbook air 2020 (16GB memory), this code blocks for ~170ms
 */
function blockMainThread() {
  performance.mark("start");
  const arr = [];

  for (let i = 0; i < 1e7; i++) {
    arr.push(arr[i - 1] === undefined ? 0 : arr[i - 1] + 1);
  }

  console.warn(
    "Main thread was blocked for",
    performance.measure("block duration", "start").duration.toFixed(2),
    "ms"
  );
}

// Boilerplate for starting/ending a trace, we pass the end trace callback function so that we can
// terminate profiling as close to the actual blocking code as possible to avoid noise
function startTrace(endCallback: () => void) {
  return () => {
    if (!window.Profiler)
      throw new Error(
        "JS Self profiling is either not supported or disabled by the browser"
      );

    profiler = new window.Profiler({
      sampleInterval: SAMPLING_INTERVAL_HZ,
      maxBufferSize: SAMPLING_BUFFER_SIZE,
    });

    blockMainThread();

    endCallback();
  };
}

function endTrace() {
  if (!profiler || profiler.stopped)
    throw new Error(
      "No active profiler session or session was already stopped"
    );

  profiler.stop().then((trace) => {
    printTraceHelper(trace);
  });

  profiler = null;
}

if (!supported) {
  output.innerHTML = "Tracing is not supported";
  start.setAttribute("disabled", "true");
} else {
  start.addEventListener("click", startTrace(endTrace));
}

// Helper function to resolve the stack frames from the trace format
// walks up by parentId from trace.frames[trace.stacks[stackId]]
// where trace.stacks[stackId] is the starting node
function resolveStack(
  trace: JSSelfProfiling.ProfilerTrace,
  stackId: number
): JSSelfProfiling.ProfilerFrame[] {
  const stack = [];
  let node: JSSelfProfiling.ProfilerStack | null = trace.stacks[stackId];

  while (node) {
    const current = trace.frames[node.frameId];
    stack.unshift(current);

    if (node.parentId !== undefined) {
      node = trace.stacks[node.parentId];
    } else {
      node = null;
    }
  }

  return stack;
}

function printTraceHelper(trace: JSSelfProfiling.ProfilerTrace) {
  output.innerHTML = "\n";

  const start = trace.samples[0].timestamp;
  const end = trace.samples[trace.samples.length - 1].timestamp;

  output.innerHTML += `Trace started at ${start.toFixed(
    2
  )}ms, ended at ${end.toFixed(2)}ms, duration: ${(end - start).toFixed(
    2
  )}ms \n`;

  output.innerHTML += `Target sampling rate: ${SAMPLING_INTERVAL_HZ}, Average sampling rate: ${(
    (end - start) /
    trace.samples.length
  ).toFixed(2)}\n`;

  output.innerHTML += "\nPrinted stack \n";

  for (let i = 0; i < trace.samples.length; i++) {
    // If we have no stack id, push [] to indicate empty stack
    let stack =
      trace.samples[i].stackId === undefined
        ? []
        : resolveStack(trace, trace.samples[i].stackId);

    let elapsedFromPreviousSample: number = 0;

    if (trace.samples[i - 1]?.timestamp !== undefined) {
      elapsedFromPreviousSample =
        trace.samples[i].timestamp - trace.samples[i - 1].timestamp;
    }

    let outputString = `Sample ${i} (elapsed: ${elapsedFromPreviousSample.toFixed(
      2
    )}ms) \n`;
    const stackElement = document.createElement("pre");

    if (stack.length > 0) {
      for (let i = 0; i < stack.length; i++) {
        if (i > 0) outputString += `\n${new Array(i).fill("\t").join("")}  → `;
        outputString += stack[i].name || "unknown frame/native code";
      }
    } else {
      outputString = `Sample ${i} EMPTY STACK`;
    }

    stackElement.innerHTML = outputString;

    output.appendChild(stackElement);
  }
}
