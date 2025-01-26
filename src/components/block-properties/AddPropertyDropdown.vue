<template>
  <DropdownMenu>
    <DropdownMenuTrigger>
      <button class="ml-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
        {{ $t("kbView.blockProperties.addProperty") }}
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent
      class="max-h-[calc(var(--radix-dropdown-menu-content-available-height)-10px)] overflow-y-auto w-[200px]"
    >
      <DropdownMenuItem @click="emit('addProperty', 'decimal')">
        <PropertyIcon type="decimal" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.decimal") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addProperty', 'float')">
        <PropertyIcon type="float" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.float") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addProperty', 'plaintext')">
        <PropertyIcon type="plaintext" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.plaintext") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addProperty', 'richtext')">
        <PropertyIcon type="richtext" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.richtext") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addProperty', 'date')">
        <PropertyIcon type="date" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.date") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addProperty', 'datetime')">
        <PropertyIcon type="datetime" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.datetime") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addProperty', 'select')">
        <PropertyIcon type="select" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.select") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addProperty', 'multiselect')">
        <PropertyIcon type="multiselect" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.multiselect") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addProperty', 'checkbox')">
        <PropertyIcon type="checkbox" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.checkbox") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addProperty', 'email')">
        <PropertyIcon type="email" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.email") }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="emit('addProperty', 'phone')">
        <PropertyIcon type="phone" class="size-4 mr-2" />
        {{ $t("kbView.blockProperties.propertyTypes.phone") }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>

<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import PropertyIcon from "./PropertyIcon.vue";

const emit = defineEmits(["addProperty"]);
</script>
