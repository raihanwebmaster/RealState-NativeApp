import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/utils";
import { PropertyType, useFilterStore } from "@/store/filterStore";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type FilterOption<T> = {
  label: string;
  value: T;
};

type FilterSourceRow = {
  type: string | null;
  price: number | string | null;
};

type PricePreset = {
  min: number | null;
  max: number | null;
};

const DEFAULT_TYPE_OPTIONS: FilterOption<PropertyType>[] = [
  { label: "All", value: null },
];

const BED_OPTIONS: FilterOption<number | null>[] = [
  { label: "Any", value: null },
  { label: "1", value: 1 },
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4+", value: 4 },
];

const EURO_SYMBOL = "\u20AC";

const formatOptionLabel = (value: string): string =>
  value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");

const formatPricePresetLabel = ({ min, max }: PricePreset) => {
  if (min !== null && max !== null) {
    return `${formatPrice(min)} - ${formatPrice(max)}`;
  }

  if (min !== null) {
    return `Above ${formatPrice(min)}`;
  }

  if (max !== null) {
    return `Under ${formatPrice(max)}`;
  }

  return "Any price";
};

const getUniqueNumbers = (values: (number | null)[]): number[] =>
  Array.from(
    new Set(
      values.filter((value): value is number =>
        typeof value === "number" && Number.isFinite(value) && value > 0,
      ),
    ),
  ).sort((a, b) => a - b);

const getQuantile = (values: number[], quantile: number): number => {
  const position = (values.length - 1) * quantile;
  const baseIndex = Math.floor(position);
  const remainder = position - baseIndex;
  const baseValue = values[baseIndex];
  const nextValue = values[baseIndex + 1];

  if (nextValue === undefined) {
    return baseValue;
  }

  return baseValue + remainder * (nextValue - baseValue);
};

const roundToNicePrice = (value: number): number => {
  if (value <= 0) {
    return 0;
  }

  const magnitude = 10 ** Math.floor(Math.log10(value));
  const candidates = [1, 2, 5, 10].map((step) => step * magnitude);

  return candidates.reduce((best, current) => {
    const bestDistance = Math.abs(value - best);
    const currentDistance = Math.abs(value - current);

    return currentDistance <= bestDistance ? current : best;
  });
};

const buildTypeOptions = (
  rows: FilterSourceRow[],
): FilterOption<PropertyType>[] => {
  const types = Array.from(
    new Set(
      rows
        .map((row) => row.type?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return [
    ...DEFAULT_TYPE_OPTIONS,
    ...types.map((value) => ({
      label: formatOptionLabel(value),
      value,
    })),
  ];
};

const buildPricePresets = (rows: FilterSourceRow[]): PricePreset[] => {
  const prices = getUniqueNumbers(
    rows.map((row) => {
      const value = Number(row.price);
      return Number.isFinite(value) ? value : null;
    }),
  );

  if (prices.length < 2) {
    return [];
  }

  const minPrice = prices[0];
  const maxPrice = prices[prices.length - 1];

  if (minPrice === maxPrice) {
    return [];
  }

  const boundaries = Array.from(
    new Set(
      [0.25, 0.5, 0.75]
        .map((quantile) => roundToNicePrice(getQuantile(prices, quantile)))
        .filter((value) => value > minPrice && value < maxPrice),
    ),
  ).sort((a, b) => a - b);

  if (boundaries.length === 0) {
    return [];
  }

  return boundaries.reduce<PricePreset[]>((presets, boundary, index) => {
    if (index === 0) {
      presets.push({ min: null, max: boundary });
      return presets;
    }

    presets.push({ min: boundaries[index - 1], max: boundary });
    return presets;
  }, []).concat({ min: boundaries[boundaries.length - 1], max: null });
};

const parsePriceInput = (value: string): number | null => {
  if (!value.trim()) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : null;
};

const chip = (active: boolean) =>
  `px-4 py-2 rounded-full border ${
    active ? "bg-blue-600 border-blue-600" : "bg-white border-gray-200"
  }`;

const chipText = (active: boolean) =>
  `text-sm font-semibold ${active ? "text-white" : "text-gray-600"}`;

export default function FilterModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const {
    type,
    bedrooms,
    minPrice,
    maxPrice,
    setType,
    setBedrooms,
    setMinPrice,
    setMaxPrice,
    resetFilters,
  } = useFilterStore();

  const [typeOptions, setTypeOptions] = useState(DEFAULT_TYPE_OPTIONS);
  const [pricePresets, setPricePresets] = useState<PricePreset[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [localMin, setLocalMin] = useState(
    minPrice !== null ? String(minPrice) : "",
  );
  const [localMax, setLocalMax] = useState(
    maxPrice !== null ? String(maxPrice) : "",
  );

  useEffect(() => {
    if (!visible) {
      return;
    }

    setLocalMin(minPrice !== null ? String(minPrice) : "");
    setLocalMax(maxPrice !== null ? String(maxPrice) : "");
  }, [maxPrice, minPrice, visible]);

  useEffect(() => {
    if (!visible) {
      return;
    }

    let isActive = true;

    const fetchFilterOptions = async () => {
      setOptionsLoading(true);

      const { data, error } = await supabase
        .from("properties")
        .select("type, price");

      if (!isActive) {
        return;
      }

      if (error) {
        console.error("Error fetching filter options:", error);
        setTypeOptions(DEFAULT_TYPE_OPTIONS);
        setPricePresets([]);
      } else {
        const rows = (data ?? []) as FilterSourceRow[];
        setTypeOptions(buildTypeOptions(rows));
        setPricePresets(buildPricePresets(rows));
      }

      setOptionsLoading(false);
    };

    void fetchFilterOptions();

    return () => {
      isActive = false;
    };
  }, [visible]);

  const activeCount = [type, bedrooms, minPrice, maxPrice].filter(
    (value) => value !== null,
  ).length;

  const handleApply = () => {
    setMinPrice(parsePriceInput(localMin));
    setMaxPrice(parsePriceInput(localMax));
    onClose();
  };

  const handleReset = () => {
    resetFilters();
    setLocalMin("");
    setLocalMax("");
    onClose();
  };

  const shadow = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-gray-50">
        <View className="flex-row items-center justify-between px-5 pt-6 pb-4 bg-white border-b border-gray-100">
          <TouchableOpacity onPress={onClose} className="p-1">
            <Ionicons name="close" size={22} color="#374151" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text className="text-blue-600 font-semibold text-sm">Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {optionsLoading && (
            <View className="flex-row items-center gap-2 mb-4">
              <ActivityIndicator size="small" color="#2563EB" />
              <Text className="text-xs text-gray-500">
                Loading filter options...
              </Text>
            </View>
          )}

          <Text className="text-base font-bold text-gray-800 mb-3">
            Property Type
          </Text>
          <View className="flex-row flex-wrap gap-2 mb-6">
            {typeOptions.map((item) => (
              <TouchableOpacity
                key={String(item.value)}
                onPress={() => setType(item.value)}
                className={chip(type === item.value)}
                style={shadow}
              >
                <Text className={chipText(type === item.value)}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-base font-bold text-gray-800 mb-3">
            Bedrooms
          </Text>
          <View className="flex-row gap-2 mb-6">
            {BED_OPTIONS.map((item) => (
              <TouchableOpacity
                key={String(item.value)}
                onPress={() => setBedrooms(item.value)}
                className={`flex-1 items-center py-3 rounded-2xl border ${
                  bedrooms === item.value
                    ? "bg-blue-600 border-blue-600"
                    : "bg-white border-gray-200"
                }`}
                style={shadow}
              >
                <Text
                  className={`text-sm font-bold ${
                    bedrooms === item.value ? "text-white" : "text-gray-600"
                  }`}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text className="text-base font-bold text-gray-800 mb-3">
            Price Range ({EURO_SYMBOL})
          </Text>
          <View className="flex-row gap-3 mb-3">
            {[
              {
                label: "Min Price",
                value: localMin,
                onChange: setLocalMin,
                placeholder: "0",
              },
              {
                label: "Max Price",
                value: localMax,
                onChange: setLocalMax,
                placeholder: "Any",
              },
            ].map(({ label, value, onChange, placeholder }) => (
              <View key={label} className="flex-1">
                <Text className="text-xs text-gray-500 mb-1.5 font-medium">
                  {label}
                </Text>
                <View
                  className="flex-row items-center bg-white rounded-2xl px-3 border border-gray-200"
                  style={shadow}
                >
                  <Text className="text-gray-400 text-sm mr-1">
                    {EURO_SYMBOL}
                  </Text>
                  <TextInput
                    className="flex-1 py-3 text-gray-800"
                    placeholder={placeholder}
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={value}
                    onChangeText={onChange}
                  />
                </View>
              </View>
            ))}
          </View>

          {pricePresets.length > 0 && (
            <View className="flex-row flex-wrap gap-2">
              {pricePresets.map((preset) => {
                const active =
                  minPrice === preset.min && maxPrice === preset.max;
                return (
                  <TouchableOpacity
                    key={`${preset.min ?? "min"}-${preset.max ?? "max"}`}
                    onPress={() => {
                      setLocalMin(
                        preset.min !== null ? String(preset.min) : "",
                      );
                      setLocalMax(
                        preset.max !== null ? String(preset.max) : "",
                      );
                      setMinPrice(preset.min);
                      setMaxPrice(preset.max);
                    }}
                    className={`px-3 py-1.5 rounded-full border ${
                      active
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white border-gray-200"
                    }`}
                  >
                    <Text
                      className={`text-xs font-medium ${
                        active ? "text-blue-600" : "text-gray-500"
                      }`}
                    >
                      {formatPricePresetLabel(preset)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </ScrollView>

        <View className="px-5 pb-8 pt-4 bg-white border-t border-gray-100">
          <TouchableOpacity
            onPress={handleApply}
            className="bg-blue-600 rounded-2xl py-4 items-center"
            style={{
              shadowColor: "#2563EB",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            <Text className="text-white font-bold text-base">
              Apply Filters{activeCount > 0 ? ` (${activeCount})` : ""}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
