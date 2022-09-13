import { FirebaseAlertData, getEndpointAnnotation } from '.';
import { CloudEvent, CloudFunction } from '../../core';
import { EventHandlerOptions } from '../../options';

/**
 * The internal payload object for a performance threshold alert.
 * Payload is wrapped inside a `FirebaseAlertData` object.
 */
export interface ThresholdAlertPayload {
  // Name of the trace or network request this alert is for (e.g. my_custom_trace, firebase.com/api/123)
  eventName: string;
  // The resource type this alert is for (i.e. trace, network request, screen rendering, etc.)
  eventType: string;
  // The metric type this alert is for (i.e. success rate, response time, duration, etc.)
  metricType: string;
  // The number of events checked for this alert condition
  numSamples: number;
  // The threshold value of the alert condition without units (e.g. "75", "2.1")
  thresholdValue: number;
  // The unit for the alert threshold (e.g. "percent", "seconds")
  thresholdUnit: string;
  // The percentile of the alert condition, can be 0 if percentile is not
  // applicable to the alert condition; range: [0, 100]
  conditionPercentile: number;
  // The app version this alert was triggered for, can be empty if the alert is for a network request (because the alert was checked against data from all versions of app) or a web app (where the app is versionless)
  appVersion: string;
  // The value that violated the alert condition (e.g. "76.5", "3")
  violationValue: number;
  // The unit for the violation value (e.g. "percent", "seconds")
  violationUnit: string;
  // The link to Fireconsole to investigate more into this alert
  investigateUri: string;
}

/**
 * A custom CloudEvent for Firebase Alerts (with custom extension attributes).
 * @typeParam T - the data type for performance alerts that is wrapped in a `FirebaseAlertData` object.
 */
export interface PerformanceEvent<T> extends CloudEvent<FirebaseAlertData<T>> {
  /** The type of the alerts that got triggered. */
  alertType: string;
  /** The Firebase App ID that’s associated with the alert. */
  appId: string;
}

/** @internal */
export const thresholdAlert = 'performance.threshold';

/**
 * Configuration for app distribution functions.
 */
export interface PerformanceOptions extends EventHandlerOptions {
  // Scope the function to trigger on a specific application.
  appId?: string;
}

export function onThresholdAlertPublished(
  handler: (
    event: PerformanceEvent<ThresholdAlertPayload>
  ) => any | Promise<any>
): CloudFunction<PerformanceEvent<ThresholdAlertPayload>>;

export function onThresholdAlertPublished(
  appId: string,
  handler: (
    event: PerformanceEvent<ThresholdAlertPayload>
  ) => any | Promise<any>
): CloudFunction<PerformanceEvent<ThresholdAlertPayload>>;

export function onThresholdAlertPublished(
  opts: PerformanceOptions,
  handler: (
    event: PerformanceEvent<ThresholdAlertPayload>
  ) => any | Promise<any>
): CloudFunction<PerformanceEvent<ThresholdAlertPayload>>;

export function onThresholdAlertPublished(
  appIdOrOptsOrHandler:
    | string
    | PerformanceOptions
    | ((event: PerformanceEvent<ThresholdAlertPayload>) => any | Promise<any>),
  handler?: (
    event: PerformanceEvent<ThresholdAlertPayload>
  ) => any | Promise<any>
): CloudFunction<PerformanceEvent<ThresholdAlertPayload>> {
  if (typeof appIdOrOptsOrHandler === 'function') {
    handler = appIdOrOptsOrHandler as (
      event: PerformanceEvent<ThresholdAlertPayload>
    ) => any | Promise<any>;
    appIdOrOptsOrHandler = {};
  }

  const [opts, appId] = getOptsAndApp(appIdOrOptsOrHandler);

  const func = (raw: CloudEvent<unknown>) => {
    return handler(raw as PerformanceEvent<ThresholdAlertPayload>);
  };

  func.run = handler;
  func.__endpoint = getEndpointAnnotation(opts, thresholdAlert, appId);

  return func;
}

/**
 * Helper function to parse the function opts and appId.
 * @internal
 */
export function getOptsAndApp(
  appIdOrOpts: string | PerformanceOptions
): [EventHandlerOptions, string | undefined] {
  let opts: EventHandlerOptions;
  let appId: string | undefined;
  if (typeof appIdOrOpts === 'string') {
    opts = {};
    appId = appIdOrOpts;
  } else {
    appId = appIdOrOpts.appId;
    opts = { ...appIdOrOpts };
    delete (opts as any).appId;
  }
  return [opts, appId];
}