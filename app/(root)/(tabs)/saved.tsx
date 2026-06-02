import { useSupabase } from '@/hooks/useSuperbase';
import { Property } from '@/types';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SavedProperty {
  id: string;
  property_id: string;
  property: Property;
}

export default function Saved() {
  const {userId} = useAuth();
  const authSupabase = useSupabase();
  const router = useRouter();

  const [saved, setSaved]= useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Saved</Text>
      </View>
    </SafeAreaView>
  )
}