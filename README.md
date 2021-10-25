# Chromium bug report for JS Self Profiling API:
Bug: Samples of a trace falsely report an empty stack

Hardware: M1 macbook air (2020)

Tested in
Chrome Version 95.0.4638.54
Chrome Canary Version 97.0.4681.0
Firefox 93.0 (64-bit) (API not supported)
Safari 14.1.2 (API not supported)

This bug was originally reported on Github under the JS Self Profiling repository ([link](https://github.com/WICG/js-self-profiling/issues/59)).

## What does the code in the example do?
We start a trace and call an expensive function that blocks the main thread, after the function returns, we print the trace on screen for ease of debugging.

## Bug #1: Samples of a trace falsely report an empty stack
Immediately after a trace is started, we execute a function called `blockMainThread`, after that function returns, we print the stack - we can observe that for the stack samples at indexes 8 and 9 (varies between executions), the sample property stackId is not set which per spec, indicates that the [stack is empty](https://wicg.github.io/js-self-profiling/#dfn-get-a-stack-id), however if we see consecutive stack samples, we can see that they are associated to our `blockMainThread` which falsely indicates that this function was at some point throughout the duration of our trace popped from the stack. 

If we look at the implementation of `blockMainThread` (./src/app.ts L15), that is not the case as it is only called once.

One thing that I eliminated was a potential leak of the addEventListener in my code and hot module replacement from parcel triggering two addEventListeners on the button, which could cause our blocking code to be called twice when seemingly called only once, so when you are serving the file with parcel and modifying the source, make sure to hard refresh the page before starting a trace to ensure a clean setup.

## Question about lowest sampling value supported by UA
In our test case, the sampling interval that is passed to the constructor is 1, meaning the stack samples should be collected at best at 1ms or the [lowest supported value by UA](https://wicg.github.io/js-self-profiling/#profiling-sessions). Since we can see that for a trace duration of ~150ms, we collect about 15 samples, the sampling interval in reality seems to be 10ms. If we increase the sampling interval to 20, we obtain about 7 samples as expected. My question here as a developer, is there a way to know the minimum sampling rate before.

### Running the example
Clone the project and install it's dependencies via yarn or npm, to start and serve it run `yarn start` or `parcel src/index.html`, the project should then be served on `localhost:1234`. To collect a trace, click on the start button, the trace will automatically be ended after `blockMainThread` function returns and a trace output will be printed.

Example of a successfully collected trace: