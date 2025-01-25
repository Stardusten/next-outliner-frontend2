<template>
  <div class="flex-1 space-y-4 p-8 pt-6">
    <div class="flex items-center justify-between space-y-2">
      <div class="flex items-baseline">
        <h2 class="text-3xl font-bold tracking-tight">
          {{ $t("adminDashboard.title") }}
        </h2>
        <div class="text-muted-foreground ml-4">
          {{ serverUrl }}
        </div>
      </div>
      <div class="flex items-center space-x-2">
        <Button variant="outline" @click="logout">
          <LogOut class="size-4 mr-2" />
          {{ $t("adminDashboard.logout") }}</Button
        >
      </div>
    </div>
    <Tabs default-value="kbManagement" class="space-y-4">
      <TabsList>
        <TabsTrigger value="kbManagement">
          {{ $t("adminDashboard.tabs.kbManagement") }}
        </TabsTrigger>
        <TabsTrigger value="logsAndAnalytics">
          {{ $t("adminDashboard.tabs.logsAndAnalytics") }}
        </TabsTrigger>
      </TabsList>
      <TabsContent value="kbManagement" class="space-y-4">
        <Card>
          <CardHeader class="flex flex-row items-center justify-between">
            <div class="flex flex-col space-y-2">
              <CardTitle>{{ $t("adminDashboard.kbManagement.allKbs") }}</CardTitle>
              <CardDescription>
                {{ $t("adminDashboard.kbManagement.allKbsDescription") }}
              </CardDescription>
            </div>
            <div class="flex items-center space-x-2">
              <Button size="sm" variant="outline" @click="refreshKbList">
                <RefreshCcw class="size-4 mr-2" />
                {{ $t("adminDashboard.kbManagement.kbActions.refreshKbList") }}
              </Button>
              <NewKbDialog>
                <Button size="sm">
                  <Plus class="size-4 mr-2" />
                  {{ $t("adminDashboard.kbManagement.kbActions.addKb") }}
                </Button>
              </NewKbDialog>
            </div>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div
                v-if="Object.keys(kbs).length === 0"
                class="flex flex-col items-center justify-center py-8 text-center space-y-2"
              >
                <div class="text-2xl font-semibold text-muted-foreground">
                  {{ $t("adminDashboard.kbManagement.noKbs") }}
                </div>
                <div class="text-sm text-muted-foreground">
                  {{ $t("adminDashboard.kbManagement.noKbsDescription") }}
                </div>
              </div>

              <div
                v-else
                v-for="(info, location) in kbs"
                :key="location"
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="space-y-1">
                  <h4 class="font-medium">{{ info.name }}</h4>
                  <p class="text-sm text-muted-foreground">{{ location }}</p>
                </div>
                <div class="flex space-x-2">
                  <Button variant="outline" size="sm">
                    <Pencil class="size-4 mr-2" />
                    {{ $t("adminDashboard.kbManagement.kbActions.edit") }}
                  </Button>
                  <ShrinkDialog :location="location" :name="info.name">
                    <Button variant="outline" size="sm">
                      <ChevronsRightLeft class="size-4 mr-2" />
                      {{ $t("adminDashboard.kbManagement.kbActions.shrink") }}
                    </Button>
                  </ShrinkDialog>
                  <DeleteKbDialog :location="location" :name="info.name">
                    <Button variant="destructive" size="sm">
                      <Trash2 class="size-4 mr-2" />
                      {{ $t("adminDashboard.kbManagement.kbActions.delete") }}
                    </Button>
                  </DeleteKbDialog>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="logsAndAnalytics" class="space-y-4"> </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { KbInfoContext } from "@/context/kbinfo";
import ServerInfoContext from "@/context/serverInfo";
import { ChevronsRightLeft, LogOut, Pencil, Plus, RefreshCcw, Trash2 } from "lucide-vue-next";
import { watch } from "vue";
import DeleteKbDialog from "./DeleteKbDialog.vue";
import NewKbDialog from "./NewKbDialog.vue";
import ShrinkDialog from "./ShrinkDialog.vue";

const { serverUrl, logout } = ServerInfoContext.useContext()!;
const { kbs, refreshKbList } = KbInfoContext.useContext()!;

watch(
  serverUrl,
  () => {
    refreshKbList(serverUrl.value);
  },
  { immediate: true },
);
</script>
