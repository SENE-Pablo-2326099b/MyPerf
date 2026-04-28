import { Database } from '@nozbe/watermelondb';
import { NativeModules, Platform, TurboModuleRegistry } from 'react-native';
import { migrations } from './migrations';
import { Exercise, ExerciseInstance, Macrocycle, Mesocycle, ScheduledSession, Session, TemplateExercise, WorkingSet, WorkoutTemplate } from './models';
import { schema } from './schema';

// ── New Architecture / RN 0.81 compatibility ──────────────────────────────
// WMDatabaseBridge can be null in New Arch interop mode (no TurboModule spec).
// Strategy:
//   1. Resolve the bridge via NativeModules or TurboModuleRegistry.
//   2. Patch getDispatcherType to never throw (guard null.initializeJSI).
//   3. Patch makeDispatcher to inject the TurboModule bridge for async mode.
//      If no bridge is found at all, a no-op dispatcher is used so the module
//      loads without crashing — errors surface via onSetUpError instead.
// ─────────────────────────────────────────────────────────────────────────

const _asyncBridge =
  (NativeModules as any).WMDatabaseBridge ??
  (TurboModuleRegistry.get('WMDatabaseBridge') as Record<string, (...a: any[]) => Promise<any>> | null);

const _disp = require('@nozbe/watermelondb/adapters/sqlite/makeDispatcher');
const _origGetDispatcherType = _disp.getDispatcherType as (opts: unknown) => string;
const _origMakeDispatcher = _disp.makeDispatcher as (
  type: string, tag: unknown, dbName: string, opts: unknown,
) => unknown;
const { fromPromise } = require('@nozbe/watermelondb/utils/fp/Result') as {
  fromPromise: (p: Promise<unknown>, cb: (r: { value?: unknown; error?: Error }) => void) => void;
};

// Patch 1 — guard null.initializeJSI: never throw, always fall back to async
_disp.getDispatcherType = (options: unknown): string => {
  try {
    return _origGetDispatcherType(options);
  } catch {
    return 'asynchronous';
  }
};

// Patch 2 — provide a working async dispatcher from whatever bridge is available
_disp.makeDispatcher = (type: string, tag: unknown, dbName: string, opts: any): unknown => {
  if (type !== 'asynchronous') {
    return _origMakeDispatcher(type, tag, dbName, opts);
  }

  if (_asyncBridge) {
    const bridge = _asyncBridge as any;
    const unsafeReuse: boolean = opts?.experimentalUnsafeNativeReuse ?? false;
    return {
      call(name: string, args: any[], callback: (r: { value?: unknown; error?: Error }) => void): void {
        let methodName = name;
        let callArgs: any[] = args;
        if (methodName === 'batch' && bridge.batchJSON) {
          methodName = 'batchJSON';
          callArgs = [JSON.stringify(callArgs[0])];
        } else if (
          ['initialize', 'setUpWithSchema', 'setUpWithMigrations'].includes(methodName) &&
          Platform.OS === 'android'
        ) {
          callArgs = [...callArgs, unsafeReuse];
        }
        fromPromise(bridge[methodName].apply(bridge, [tag, ...callArgs]), callback);
      },
    };
  }

  // No bridge found — no-op dispatcher so the module import never crashes.
  // All DB operations will fail via onSetUpError rather than at startup.
  return {
    call(_name: string, _args: any[], callback: (r: { value?: unknown; error?: Error }) => void): void {
      callback({
        error: new Error(
          '[WatermelonDB] WMDatabaseBridge unavailable. Run `npx expo run:android` to rebuild with WatermelonDBPackage registered.',
        ),
      });
    },
  };
};

// eslint-disable-next-line @typescript-eslint/no-var-requires
const SQLiteAdapter: typeof import('@nozbe/watermelondb/adapters/sqlite').default =
  require('@nozbe/watermelondb/adapters/sqlite').default;

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  jsi: false,
  onSetUpError: (error) => {
    console.error('[DB] Setup failed:', error.message);
  },
});

export const database = new Database({
  adapter,
  modelClasses: [Exercise, Session, ExerciseInstance, WorkingSet, WorkoutTemplate, TemplateExercise, ScheduledSession, Macrocycle, Mesocycle],
});
