// Web stub — expo-notifications is native-only
export const AndroidImportance = { MAX: 5 };
export const SchedulableTriggerInputTypes = { DATE: 'date' };
export async function getPermissionsAsync() { return { status: 'denied' }; }
export async function requestPermissionsAsync() { return { status: 'denied' }; }
export async function getExpoPushTokenAsync() { return { data: '' }; }
export async function setNotificationChannelAsync() {}
export async function setNotificationHandler() {}
export async function scheduleNotificationAsync() { return ''; }
export async function cancelScheduledNotificationAsync() {}
export function addNotificationResponseReceivedListener() { return { remove: () => {} }; }
