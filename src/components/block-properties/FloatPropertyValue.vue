<template>
  <div class="flex items-center group">
    <Button variant="outline" class="p-0 size-4" @click="value !== undefined && value--">
      <Minus class="size-3" />
    </Button>
    <Input
      type="number"
      step="0.1"
      v-model="value"
      class="p-0 min-w-[1.5ch] max-w-[4ch] h-[unset] border-none focus-visible:ring-transparent text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
    <Button variant="outline" class="p-0 size-4" @click="value !== undefined && value++">
      <Plus class="size-3" />
    </Button>
  </div>
</template>

<script setup lang="ts">
import { Minus, Plus } from "lucide-vue-next";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const value = defineModel<number>("model-value");
</script>
