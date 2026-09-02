import React from 'react';
import { Redirect } from 'expo-router';

export default function SettingsRouteRedirect() {
  return <Redirect href="/(tabs)/settings" />;
}
