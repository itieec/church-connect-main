import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { FOLLOW_UP_CONFIG_DEFAULTS } from '@ieec/shared';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Request push permission (practical wiring for first-contact / weekly reminders). */
export async function ensureNotificationPermissions(): Promise<boolean> {
  const settings = await Notifications.getPermissionsAsync();
  if (settings.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

/**
 * Local reminder helpers. Server-driven FCM tasks/notifications collections
 * remain the long-term source; these cover MVP practical reminders on-device.
 */
export async function scheduleFirstContactReminder(params: {
  newcomerName: string;
  assignmentId: string;
  hoursFromNow?: number;
}) {
  const granted = await ensureNotificationPermissions();
  if (!granted) return null;
  const hours =
    params.hoursFromNow ?? FOLLOW_UP_CONFIG_DEFAULTS.firstContactDeadlineHours;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'First contact due',
      body: `Reach out to ${params.newcomerName} (assignment ${params.assignmentId}).`,
      data: { assignmentId: params.assignmentId, type: 'first_contact' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, hours * 3600),
      repeats: false,
    },
  });
}

export async function scheduleWeeklyReportReminder(params: {
  newcomerName: string;
  assignmentId: string;
}) {
  const granted = await ensureNotificationPermissions();
  if (!granted) return null;
  // Friday 9:00 AM local as a practical default cue
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly report reminder',
      body: `Submit report for ${params.newcomerName}. Attendance is separate.`,
      data: { assignmentId: params.assignmentId, type: 'weekly_report' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 6, // Friday in expo-notifications (1=Sunday)
      hour: 9,
      minute: 0,
    },
  });
}

export function notificationsPlatformNote(): string {
  return Platform.OS === 'android'
    ? 'Android requires a development/EAS build for React Native Firebase + push.'
    : 'iOS requires a development/EAS build and Apple push credentials.';
}
