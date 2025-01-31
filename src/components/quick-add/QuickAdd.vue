<template>
  <Dialog v-model:open="open">
    <DialogTrigger class="hidden"></DialogTrigger>
    <DialogContent v-if="tempBlockId">
      <DialogHeader>
        <DialogTitle>Quick Add</DialogTitle>
        <DialogDescription>Capture your thoughts, ideas, and tasks in seconds</DialogDescription>
      </DialogHeader>

      <div>
        <BlockTree
          id="quick-add"
          :root-block-ids="[tempBlockId]"
          :root-block-level="0"
          :enlarge-root-block="false"
          :show-backlinks="false"
          :show-potential-links="false"
          :show-block-properties="true"
          :padding-top="0"
          :padding-bottom="0"
        ></BlockTree>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="handleCancel">Cancel</Button>
        <Button @click="handleAdd">Add</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import QuickAddContext from "@/context/quick-add";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import BlockTree from "../BlockTree.vue";

const { open, tempBlockId, insertPos, handleAdd, handleCancel } = QuickAddContext.useContext()!;
</script>
