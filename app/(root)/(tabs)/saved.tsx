import { useSupabase } from '@/hooks/useSuperbase';
import { Property } from '@/types';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SavedProperty {
  id: string;
  property_id: string;
  property: Property;
}

export default function Saved() {
  const { userId } = useAuth();
  const authSupabase = useSupabase();
  const router = useRouter();

  const [saved, setSaved] = useState<SavedProperty[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSavedProperties = useCallback(async () => {
    setLoading(true);

    const { data, error } = await authSupabase
      .from("saved_properties")
      .select("id, property_id, property:properties(*)")
      .eq("user_clerk_id", userId)
      .order("id", { ascending: false });

    if (error) {
      console.error("Error fetching saved properties:", error);
    } else {
      setSaved(data as SavedProperty[]);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchSavedProperties();
  }, [fetchSavedProperties]);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="px-5 pt-4 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Saved</Text>
      </View>
    </SafeAreaView>
  )
}