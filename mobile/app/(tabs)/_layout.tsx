import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { colors } from '@/lib/theme';

const Icon = ({ glyph, active }: { glyph: string; active: boolean }) => <Text style={{ fontSize: 20, color: active ? colors.ink : colors.muted }}>{glyph}</Text>;

export default function TabsLayout() {
  return <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.ink, tabBarInactiveTintColor: colors.muted, tabBarStyle: { height: 76, paddingTop: 8, paddingBottom: 12, backgroundColor: colors.surface, borderTopColor: colors.blush }, tabBarLabelStyle: { fontSize: 11, fontWeight: '700' }, tabBarItemStyle: { borderRadius: 22 } }}>
    <Tabs.Screen name="index" options={{ title: 'Overview', tabBarIcon: ({ focused }) => <Icon glyph="⌂" active={focused} /> }} />
    <Tabs.Screen name="calendar" options={{ title: 'Calendar', tabBarIcon: ({ focused }) => <Icon glyph="□" active={focused} /> }} />
    <Tabs.Screen name="training" options={{ title: 'Training', tabBarIcon: ({ focused }) => <Icon glyph="△" active={focused} /> }} />
    <Tabs.Screen name="ai" options={{ title: 'AI', tabBarIcon: ({ focused }) => <Icon glyph="✦" active={focused} /> }} />
    <Tabs.Screen name="more" options={{ title: 'More', tabBarIcon: ({ focused }) => <Icon glyph="•••" active={focused} /> }} />
  </Tabs>;
}
