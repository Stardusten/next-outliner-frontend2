import attachmentsManager from "./attachmentsManager";
import commands from "./commands";
import fieldSettings from "./fieldSettings";
import headerBar from "./headerBar";
import imageContent from "./imageContent";
import keybindings from "./keybindings";
import misc from "./misc";
import settingItems from "./settingItems";
import blockProperties from "./blockProperties";

const kbView = {
  attachmentsManager,
  commands,
  fieldSettings,
  headerBar,
  imageContent,
  keybindings,
  settingItems,
  ...misc,
  blockProperties,
};

export default kbView;
