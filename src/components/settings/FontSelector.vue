<template>
  <div class="flex items-center gap-2">
    <Select v-model="item.value.value">
      <SelectTrigger>
        <span class="text-muted-foreground" :style="{ fontFamily: currFontName }">
          {{ currFontName }}
        </span>
      </SelectTrigger>
      <SelectContent class="max-h-[var(--radix-select-content-available-height)]">
        <SelectGroup>
          <SelectItem
            v-for="(font, index) in FONT_NAMES"
            :key="index"
            :value="font"
            :style="{ fontFamily: font }"
          >
            <div class="flex items-center">
              <div>{{ font }}</div>
              <div v-if="!fontAvailability[index]" class="text-muted-foreground ml-2">
                {{ $t("kbView.fontSelector.notAvailable") }}
              </div>
            </div>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>

    <Tooltip>
      <TooltipTrigger>
        <Button variant="ghost" size="icon" @click="openAddFontDialog">
          <Plus class="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {{ $t("kbView.fontSelector.addCustomFont") }}
      </TooltipContent>
    </Tooltip>

    <ResetButton :item="item" />

    <Dialog :open="showAddFontDialog" @update:open="showAddFontDialog = $event">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{{ $t("kbView.fontSelector.addCustomFontTitle") }}</DialogTitle>
          <DialogDescription>
            {{ $t("kbView.fontSelector.addCustomFontDesc") }}
          </DialogDescription>
        </DialogHeader>
        <div>
          <div class="mt-2">
            <div
              v-if="isCustomFontAvailable"
              class="flex items-center gap-2 text-green-500 text-sm mb-3"
            >
              <CircleCheck class="size-4" />
              <span>{{ $t("kbView.fontSelector.fontInstalled") }}</span>
            </div>
            <div v-else class="flex items-center gap-2 text-yellow-500 text-sm mb-3">
              <AlertTriangle class="size-4" />
              <span>{{ $t("kbView.fontSelector.fontNotInstalled") }}</span>
            </div>

            <div
              v-if="customFontName"
              class="text-base mb-4"
              :style="{ fontFamily: customFontName }"
            >
              AbCdEfGh 中文字体 あいうえお ÀàÈèÙù
            </div>
          </div>

          <Input
            v-model="customFontName"
            :placeholder="$t('kbView.fontSelector.fontNamePlaceholder')"
            @input="checkCustomFont"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showAddFontDialog = false">
            {{ $t("kbView.fontSelector.cancel") }}
          </Button>
          <Button @click="addCustomFont" :disabled="!customFontName">
            {{ $t("kbView.fontSelector.confirm") }}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import type { SettingItem } from "@/context/settings";
import ResetButton from "./ResetButton.vue";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
  SelectGroup,
} from "../ui/select";
import { checkFontAvailability } from "@/utils/font";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import { Plus } from "lucide-vue-next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { AlertTriangle, CircleCheck } from "lucide-vue-next";
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";

const props = defineProps<{
  item: SettingItem<string, "fontSelector">;
  fontList?: string[];
}>();
const { t } = useI18n();

const currFontName = computed(() => {
  const value = props.item.value.value;
  if (!value || value.trim().length === 0) {
    return t("kbView.fontSelector.notSpecified");
  }
  return value;
});

const FONT_NAMES = [
  // 系统常见字体
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Tahoma",
  "Trebuchet MS",
  "Georgia",
  "Impact",
  "Palatino Linotype",
  "Century Gothic",
  "Gill Sans",
  "Lucida Sans Unicode",
  "Lucida Console",
  "Comic Sans MS",
  "Arial Black",
  "Garamond",
  "Franklin Gothic Medium",
  "Book Antiqua",
  "Calibri",
  "Cambria",
  "Candara",
  "Consolas",
  "Constantia",
  "Corbel",
  "Segoe UI",
  "Segoe Print",
  "Segoe Script",
  "Optima",
  "Rockwell",
  "Baskerville",
  "Didot",
  "Futura",
  "Geneva",
  "Courier",
  "Brush Script MT",
  "Hobo Std",
  "Papyrus",
  "MS Serif",
  "MS Sans Serif",

  // Google Fonts
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Source Sans Pro",
  "Poppins",
  "Raleway",
  "Merriweather",
  "Nunito",
  "Playfair Display",
  "Ubuntu",
  "Noto Sans",
  "Oswald",
  "PT Sans",
  "PT Serif",
  "Work Sans",
  "Cabin",
  "Quicksand",
  "Josefin Sans",
  "Droid Sans",
  "Inconsolata",
  "Lobster",
  "Pacifico",
  "Indie Flower",
  "Amatic SC",
  "Anton",
  "Abril Fatface",
  "Bitter",
  "Dancing Script",
  "Exo 2",
  "Fjalla One",
  "Karla",
  "Mulish",
  "Righteous",
  "Satisfy",
  "Shadows Into Light",
  "Signika",
  "Slabo 27px",
  "Zilla Slab",
  "Overpass",

  // 中文字体
  "Microsoft YaHei",
  "SimSun",
  "SimHei",
  "FangSong",
  "NSimSun",
  "STXihei",
  "STKaiti",
  "STSong",
  "STZhongsong",
  "STHupo",
  "STXinwei",
  "STLiti",
  "FangSong_GB2312",
  "YouYuan",
  "FZHei-B01S",
  "FZShuSong-Z01",
  "Source Han Sans",
  "Source Han Serif",

  // 特殊用途字体
  "Monospace",
  "Cursive",
];

const fontAvailability = checkFontAvailability(FONT_NAMES);

const showAddFontDialog = ref(false);
const customFontName = ref("");
const isCustomFontAvailable = ref(false);

const openAddFontDialog = () => {
  showAddFontDialog.value = true;
  customFontName.value = "";
  isCustomFontAvailable.value = false;
};

const checkCustomFont = () => {
  if (customFontName.value) {
    const [isAvailable] = checkFontAvailability([customFontName.value]);
    isCustomFontAvailable.value = isAvailable;
  }
};

const addCustomFont = () => {
  if (customFontName.value) {
    if (!FONT_NAMES.includes(customFontName.value)) {
      FONT_NAMES.push(customFontName.value);
    }
    props.item.value.value = customFontName.value;
    showAddFontDialog.value = false;
  }
};
</script>
