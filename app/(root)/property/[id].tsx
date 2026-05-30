import { formatAreaSqft, formatPrice } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { Property } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchProperty = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (error) {
        console.error("Error fetching property:", error);
        setProperty(null);
      } else {
        setProperty((data as Property | null) ?? null);
      }

      setLoading(false);
    };

    void fetchProperty();

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!property) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-gray-900 text-lg font-bold mb-2">
          Property not found
        </Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-blue-600 font-semibold">Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const imageUri = property.images?.[0];

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View>
          <Image
            source={
              imageUri
                ? { uri: imageUri }
                : require("../../../assets/images/realstate.png")
            }
            className="w-full h-80"
            resizeMode="cover"
          />
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-4 left-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center"
          >
            <Ionicons name="chevron-back" size={22} color="#111827" />
          </TouchableOpacity>
          {property.is_sold && (
            <View className="absolute top-4 right-4 bg-red-500 px-3 py-1 rounded-full">
              <Text className="text-xs font-semibold text-white">Sold</Text>
            </View>
          )}
        </View>

        <View className="px-5 py-5">
          <View className="flex-row items-start justify-between gap-4 mb-3">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {property.title}
              </Text>
              <View className="flex-row items-center gap-1 mt-2">
                <Ionicons name="location-outline" size={15} color="#6B7280" />
                <Text className="text-sm text-gray-500 flex-1">
                  {property.address}, {property.city}
                </Text>
              </View>
            </View>
            <Text className="text-blue-600 text-xl font-bold">
              {formatPrice(property.price)}
            </Text>
          </View>

          <View className="flex-row gap-3 py-4 border-y border-gray-100">
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Type</Text>
              <Text className="text-sm font-semibold text-gray-900 capitalize">
                {property.type}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Beds</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {property.bedrooms}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Baths</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {property.bathrooms}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500">Area</Text>
              <Text className="text-sm font-semibold text-gray-900">
                {formatAreaSqft(property.area_sqft)}
              </Text>
            </View>
          </View>

          <View className="mt-5">
            <Text className="text-lg font-bold text-gray-900 mb-2">
              Description
            </Text>
            <Text className="text-sm leading-6 text-gray-600">
              {property.description}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
