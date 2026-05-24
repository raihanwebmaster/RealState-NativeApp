import Ionicons from '@expo/vector-icons/Ionicons';
import { Icon, Label, NativeTabs, VectorIcon } from 'expo-router/unstable-native-tabs';

export default function TabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Label>Home</Label>
        <Icon sf="house.fill" androidSrc={<VectorIcon family={Ionicons} name="home" />} />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf="magnifyingglass" androidSrc={<VectorIcon family={Ionicons} name="search" />} />
        <Label>Search</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="saved">
        <Icon sf="heart.fill" androidSrc={<VectorIcon family={Ionicons} name="heart" />} />
        <Label>Saved</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <Icon sf="person.fill" androidSrc={<VectorIcon family={Ionicons} name="person" />} />
        <Label>Profile</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
