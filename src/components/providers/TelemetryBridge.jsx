'use client';
import useEngagementHeartbeat from '../../hooks/useEngagementHeartbeat';
import useResponsiveBreakpoints from '../../hooks/useResponsiveBreakpoints';
import useScrollDepth from '../../hooks/useScrollDepth';
import useFrictionTelemetry from '../../hooks/useFrictionTelemetry';
import useWebVitals from '../../hooks/useWebVitals';

/**
 * Headless component mounted inside AnalyticsProvider to run real-time
 * telemetry monitors (heartbeat, breakpoints, scroll depth, friction, web vitals).
 */
export default function TelemetryBridge() {
  useEngagementHeartbeat();
  useResponsiveBreakpoints();
  useScrollDepth();
  useFrictionTelemetry();
  useWebVitals();

  return null;
}
