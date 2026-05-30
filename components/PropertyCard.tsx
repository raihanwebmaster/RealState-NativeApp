import { formatAreaSqft, formatPrice } from "@/lib/utils";
import { Property } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Text, TouchableOpacity, View } from "react-native";

export default function PropertyCard({ property }: { property: Property }) {
  const router = useRouter();
  const imageUri = property.images?.[0];

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/(root)/property/[id]",
          params: { id: property.id },
        })
      }
      className="flex-row bg-white rounded-2xl mb-4 overflow-hidden"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
        opacity: property.is_sold ? 0.5 : 1,
      }}
    >
      <Image
        source={
          imageUri ? { uri: imageUri } : require("../assets/images/realstate.png")
        }
        className="w-28 h-28"
        resizeMode="cover"
      />

      <View className="flex-1 p-3 justify-between">
        <View>
          <Text
            className="text-sm font-bold text-gray-800 mb-1"
            numberOfLines={1}
          >
            {property.title}
          </Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="location-outline" size={11} color="#6B7280" />
            <Text className="text-xs text-gray-500" numberOfLines={1}>
              {property.city}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-blue-600 font-bold text-sm">
            {formatPrice(property.price)}
          </Text>
          {property.is_sold && (
            <View className="bg-red-50 px-2 py-0.5 rounded-full">
              <Text className="text-red-500 text-xs font-semibold">Sold</Text>
            </View>
          )}
          <View className="flex-row gap-3">
            <View className="flex-row items-center gap-1">
              <Ionicons name="bed-outline" size={11} color="#6B7280" />
              <Text className="text-xs text-gray-500">
                {property.bedrooms} bd
              </Text>
            </View>
            <View className="flex-row items-center gap-1">
              <Ionicons name="expand-outline" size={11} color="#6B7280" />
              <Text className="text-xs text-gray-500">
                {formatAreaSqft(property.area_sqft)}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}
