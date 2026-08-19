import { reactive } from 'vue';

export const appState = reactive({
  activeTab: 'optimizer',
  cleanIp: '',
  cleanPort: '',
  customSni: '',
  transferredNodes: '',
  selectedNode: null,
  activeNodes: [],
  optimizedOutput: '',
  scannedIps: [],
  notifications: []
});

export function notify(message, type = 'info') {
  const id = Date.now();
  appState.notifications.push({ id, message, type });
  setTimeout(() => {
    appState.notifications = appState.notifications.filter(n => n.id !== id);
  }, 4000);
}
