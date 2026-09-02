import React from 'react';
import { Redirect } from 'expo-router';

export default function HistoryRouteRedirect() {
  return <Redirect href="/(tabs)/history" />;
}
