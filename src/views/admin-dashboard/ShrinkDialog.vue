<template>
  <AlertDialog v-model:open="open">
    <AlertDialogTrigger asChild>
      <slot />
    </AlertDialogTrigger>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>
          {{ $t("adminDashboard.kbManagement.shrinkKbDialog.title") }}
        </AlertDialogTitle>
        <AlertDialogDescription>
          {{
            $t("adminDashboard.kbManagement.shrinkKbDialog.description", {
              location: props.location,
              name: props.name,
            })
          }}
        </AlertDialogDescription>
      </AlertDialogHeader>

      <div v-if="status === 'shrinkSuccess'" class="py-4">
        <div class="text-sm space-y-2">
          <p class="text-muted-foreground">
            {{
              $t("adminDashboard.kbManagement.shrinkKbDialog.beforeSize", {
                size: formatFileSize(result.beforeSize),
              })
            }}
          </p>
          <p class="text-muted-foreground">
            {{
              $t("adminDashboard.kbManagement.shrinkKbDialog.afterSize", {
                size: formatFileSize(result.afterSize),
              })
            }}
          </p>
        </div>
      </div>

      <AlertDialogFooter>
        <AlertDialogCancel :disabled="status === 'shrinking'">
          {{ $t("adminDashboard.kbManagement.shrinkKbDialog.cancelBtn") }}
        </AlertDialogCancel>
        <Button variant="default" :disabled="status === 'shrinking'" @click="handleShrink">
          <Loader2 v-if="status === 'shrinking'" class="size-4 mr-2 animate-spin" />
          <Check v-else-if="status === 'shrinkSuccess'" class="size-4 mr-2" />
          <X v-else-if="status === 'shrinkFailed'" class="size-4 mr-2" />
          {{ $t(`adminDashboard.kbManagement.shrinkKbDialog.status.${status}`) }}
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
</template>

<script setup lang="ts">
import { ref } from "vue";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { shrinkKb } from "@/common/api-call/kb";
import { Check, Loader2, X } from "lucide-vue-next";

const props = defineProps<{
  location: string;
  name: string;
}>();

const open = ref(false);
const status = ref<"idle" | "shrinking" | "shrinkSuccess" | "shrinkFailed">("idle");
const result = ref<{ beforeSize: number; afterSize: number }>({ beforeSize: 0, afterSize: 0 });

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

async function handleShrink() {
  if (status.value === "shrinking") return;
  if (status.value === "shrinkSuccess" || status.value === "shrinkFailed") {
    status.value = "idle";
    open.value = false;
    return;
  }

  status.value = "shrinking";
  try {
    const res = await shrinkKb({ location: props.location });
    if (res.success) {
      result.value = {
        beforeSize: res.data.beforeSize,
        afterSize: res.data.afterSize,
      };
      status.value = "shrinkSuccess";
      setTimeout(() => {
        status.value = "idle";
        open.value = false;
      }, 2000);
    } else {
      status.value = "shrinkFailed";
      setTimeout(() => {
        status.value = "idle";
      }, 2000);
    }
  } catch {
    status.value = "shrinkFailed";
    setTimeout(() => {
      status.value = "idle";
    }, 2000);
  }
}
</script>
