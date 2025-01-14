import { backupKb, listAllBackups } from "@/common/api-call/kb";
import type { DataType } from "@/common/api-call/utils";
import { useToast } from "@/components/ui/toast";
import { createContext } from "@/utils/createContext";
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { KbInfoContext } from "./kbinfo";
import SettingsContext from "./settings";

type Backup = DataType<typeof listAllBackups>[number];

export const TimeMachineContext = createContext(() => {
  const { registerSettingGroup } = SettingsContext.useContext()!;
  const { location } = KbInfoContext.useContext()!;
  const { toast } = useToast();
  const { t } = useI18n();

  registerSettingGroup({
    key: "timeMachine",
    label: {
      zh: "时光机",
    },
  });

  const timeMachineOpen = ref(false);
  const backups = ref<Backup[]>([]);

  const refreshBackups = async () => {
    if (location.value == null) return;
    const res = await listAllBackups({ location: location.value });
    if (res.success) {
      backups.value = res.data;
    }
  };

  watch(location, refreshBackups, { immediate: true });

  const createBackup = async () => {
    if (location.value == null) return;
    const res = await backupKb({ location: location.value });
    if (res.success) {
      refreshBackups();
      toast({
        title: res.success
          ? t("kbView.backup.createBackupSuccess")
          : t("kbView.backup.createBackupFailed"),
        description: res.data.backupPath,
      });
    }
  };

  return {
    timeMachineOpen,
    backups,
    refreshBackups,
    createBackup,
  };
});

export default TimeMachineContext;
