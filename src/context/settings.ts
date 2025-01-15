import { createContext } from "@/utils/createContext";
import { readonly, ref, shallowRef, type Component, type WritableComputedRef } from "vue";
import type { z } from "zod";

export type SettingComponentType =
  | { type: "textInput"; validator?: (value: string) => string | undefined }
  | { type: "integerInput"; min?: number; max?: number }
  | { type: "decimalInput"; min?: number; max?: number; step?: number }
  | { type: "textArea"; lang: string }
  | { type: "json"; schema?: z.Schema }
  | { type: "datePicker" }
  | { type: "dateTimePicker" }
  | { type: "select"; options: { label: Record<string, string>; value: string }[] }
  | { type: "switch" }
  | { type: "colorPicker" }
  | { type: "slider"; min?: number; max?: number }
  | { type: "keybindingInput" }
  | { type: "fontSelector" }
  | { type: "blockIdInput" };

export type SettingGroupItem = {
  key: string;
};

export type SettingItem<
  T,
  C extends SettingComponentType["type"] = SettingComponentType["type"],
> = {
  id: string;
  groupKey: string;
  defaultValue: T;
  value: WritableComputedRef<T>;
  componentType: SettingComponentType & { type: C };
};

const SettingsContext = createContext(() => {
  const settingGroups = shallowRef<Record<string, SettingGroupItem>>({});
  const settingItems = shallowRef<Record<string, SettingItem<any>>>({});

  const registerSettingGroup = (group: SettingGroupItem) => {
    if (settingGroups.value[group.key]) {
      console.warn(`Setting group with key ${group.key} already exists, ignored.`);
      return;
    }
    settingGroups.value[group.key] = group;
  };

  const unregisterSettingGroup = (key: string) => {
    if (!settingGroups.value[key]) {
      console.warn(`Setting group with key ${key} not found, ignored.`);
      return;
    }
    delete settingGroups.value[key];
  };

  const registerSettingItem = <T>(item: SettingItem<T>) => {
    if (settingItems.value[item.id]) {
      console.warn(`Setting item with id ${item.id} already exists, ignored.`);
      return;
    }
    if (!settingGroups.value[item.groupKey]) {
      console.warn(`Setting group with key ${item.groupKey} not found, ignored.`);
      return;
    }
    settingItems.value[item.id] = item;
  };

  const unregisterSettingItem = (id: string) => {
    if (!settingItems.value[id]) {
      console.warn(`Setting item with id ${id} not found, ignored.`);
      return;
    }
    delete settingItems.value[id];
  };

  const getAllSettingItemsInGroup = (groupKey: string) => {
    return Object.values(settingItems.value).filter((item) => item.groupKey === groupKey);
  };

  const ctx = {
    settingItems: readonly(settingItems),
    settingGroups: readonly(settingGroups),
    registerSettingGroup,
    unregisterSettingGroup,
    registerSettingItem,
    unregisterSettingItem,
    getAllSettingItemsInGroup,
  };
  return ctx;
});

export default SettingsContext;
