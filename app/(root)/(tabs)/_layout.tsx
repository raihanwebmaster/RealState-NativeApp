import { useUserStore } from '@/store/userStore';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

function IOSTabs() {
  const isAdmin = useUserStore((state) => state.isAdmin);
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf="magnifyingglass" />
        <Label>Search</Label>
      </NativeTabs.Trigger>

      {
        isAdmin && (
          <NativeTabs.Trigger name="create">
            <Icon sf="plus.circle.fill" />
            <Label>Add Property</Label>
          </NativeTabs.Trigger>
        )
      }

      <NativeTabs.Trigger name="saved">
        <Icon sf="heart.fill" />
        <Label>Saved</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function AndroidTabs() {
  const isAdmin = useUserStore((state) => state.isAdmin);
  return (
    <Tabs screenOptions={{ headerShown: false, }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
          tabBarLabel: 'Home'
        }} />
      <Tabs.Screen
        name="search"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="search" size={size} color={color} />,
          tabBarLabel: 'Search'
        }} />
      {
        isAdmin && (
          <Tabs.Screen
            name="create"
            options={{
              tabBarIcon: ({ color, size }) => <Ionicons name="add" size={size} color={color} />,
              tabBarLabel: 'Add Property'
            }} />
        )
      }
      <Tabs.Screen
        name="saved"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" size={size} color={color} />,
          tabBarLabel: 'Saved'
        }} />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />,
          tabBarLabel: 'Profile'
        }} />
    </Tabs>
  );
}


export default function TabLayout() {
  return Platform.OS === 'ios' ? <IOSTabs /> : <AndroidTabs />;
}
