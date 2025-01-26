<template>
  <Hash v-if="type === 'decimal'" :class="class" />
  <Hash v-else-if="type === 'float'" :class="class" />
  <Text v-else-if="type === 'plaintext'" :class="class" />
  <LetterText v-else-if="type === 'richtext'" :class="class" />
  <Calendar v-else-if="type === 'date'" :class="class" />
  <Clock3 v-else-if="type === 'datetime'" :class="class" />
  <ListCheck v-else-if="type === 'select'" :class="class" />
  <ListChecks v-else-if="type === 'multiselect'" :class="class" />
  <SquareCheckBig v-else-if="type === 'checkbox'" :class="class" />
  <Mail v-else-if="type === 'email'" :class="class" />
  <Phone v-else-if="type === 'phone'" :class="class" />
</template>

<script setup lang="ts">
import type { BlockProperties } from "@/common/type-and-schemas/block/block-properties";
import Field from "../icons/Field.vue";
import {
  Clock3,
  Hash,
  Text,
  LetterText,
  ListCheck,
  ListChecks,
  Mail,
  Phone,
  SquareCheckBig,
  Calendar,
} from "lucide-vue-next";

defineProps<{ class?: string; type: BlockProperties[any]["type"] }>();
</script>
