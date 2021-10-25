export {};

declare global {
  interface Window {
    Profiler?: JSSelfProfiling.Profiler;
  }

  namespace JSSelfProfiling {
    interface ProfilerSample {
      timestamp: number;
      stackId?: number;
    }

    interface ProfilerStack {
      parentId?: number;
      frameId: number;
    }

    interface ProfilerFrame {
      name: string;
      resourceId: number;
      line: number;
      column: number;
    }

    type ProfilerResource = string;

    interface ProfilerTrace {
      resources: ProfilerResource[];
      frames: ProfilerFrame[];
      stacks: ProfilerStack[];
      samples: ProfilerSample[];
    }

    interface Profiler {
      sampleInterval: number;
      stopped: boolean;

      // eslint-disable-next-line @typescript-eslint/no-misused-new, @typescript-eslint/no-unused-vars
      new (options: {
        sampleInterval: number;
        maxBufferSize: number;
      }): Profiler;
      addEventListener(
        event: "samplebufferfull",
        fn: (trace: ProfilerTrace) => void
      );
      stop: () => Promise<ProfilerTrace>;
    }
  }
}
