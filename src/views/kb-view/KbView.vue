<template>
  <kbViewRegistry.Provider>
    <MainTreeContext.Provider>
      <MenubarContext.Provider>
        <ImageEditorContext.Provider>
          <SettingsContext.Provider>
            <BasicSettingsContext.Provider>
              <SearchSettingsContext.Provider>
                <PathsContext.Provider>
                  <TimeMachineContext.Provider>
                    <BlockTreeContext.Provider>
                      <PasteDialogContext.Provider>
                        <FocusModeContext.Provider>
                          <TimeMachineContext.Provider>
                            <FloatingMathInputContext.Provider>
                              <LastFocusContext.Provider>
                                <BlocksContext.Provider>
                                  <ExporterContext.Provider>
                                    <CreateNewTreeDialogContext.Provider>
                                      <IndexContext.Provider>
                                        <AttachmentViewerContext.Provider>
                                          <AttachmentsManagerContext.Provider>
                                            <ImagesContext.Provider>
                                              <SidebarContext.Provider>
                                                <HistoryContext.Provider>
                                                  <BlockSelectDragContext.Provider>
                                                    <BlockMoverContext.Provider>
                                                      <SettingsPanelContext.Provider>
                                                        <FavoriteContext.Provider>
                                                          <FieldsManagerContext.Provider>
                                                            <BacklinksContext.Provider>
                                                              <QuickAddContext.Provider>
                                                                <RefSuggestionsContext.Provider>
                                                                  <FieldValueInspectorContext.Provider>
                                                                    <DailyNoteContext.Provider>
                                                                      <FusionCommandContext.Provider>
                                                                        <CommandsContext.Provider>
                                                                          <KeymapContext.Provider>
                                                                            <BlockContextMenuContext.Provider>
                                                                              <BlockRefContextmenuContext.Provider>
                                                                                <FieldSettingsDialogContext.Provider>
                                                                                  <BlockRefTagSettingsDialog.Provider>
                                                                                    <KbViewContent />
                                                                                  </BlockRefTagSettingsDialog.Provider>
                                                                                </FieldSettingsDialogContext.Provider>
                                                                              </BlockRefContextmenuContext.Provider>
                                                                            </BlockContextMenuContext.Provider>
                                                                          </KeymapContext.Provider>
                                                                        </CommandsContext.Provider>
                                                                      </FusionCommandContext.Provider>
                                                                    </DailyNoteContext.Provider>
                                                                  </FieldValueInspectorContext.Provider>
                                                                </RefSuggestionsContext.Provider>
                                                              </QuickAddContext.Provider>
                                                            </BacklinksContext.Provider>
                                                          </FieldsManagerContext.Provider>
                                                        </FavoriteContext.Provider>
                                                      </SettingsPanelContext.Provider>
                                                    </BlockMoverContext.Provider>
                                                  </BlockSelectDragContext.Provider>
                                                </HistoryContext.Provider>
                                              </SidebarContext.Provider>
                                            </ImagesContext.Provider>
                                          </AttachmentsManagerContext.Provider>
                                        </AttachmentViewerContext.Provider>
                                      </IndexContext.Provider>
                                    </CreateNewTreeDialogContext.Provider>
                                  </ExporterContext.Provider>
                                </BlocksContext.Provider>
                              </LastFocusContext.Provider>
                            </FloatingMathInputContext.Provider>
                          </TimeMachineContext.Provider>
                        </FocusModeContext.Provider>
                      </PasteDialogContext.Provider>
                    </BlockTreeContext.Provider>
                  </TimeMachineContext.Provider>
                </PathsContext.Provider>
              </SearchSettingsContext.Provider>
            </BasicSettingsContext.Provider>
          </SettingsContext.Provider>
        </ImageEditorContext.Provider>
      </MenubarContext.Provider>
    </MainTreeContext.Provider>
  </kbViewRegistry.Provider>
</template>

<script setup lang="ts">
import BlocksContext from "@/context/blocks/blocks";
import BlockTreeContext from "@/context/blockTree";
import FocusModeContext from "@/context/focusMode";
import FusionCommandContext from "@/context/fusionCommand";
import KeymapContext from "@/context/keymap";
import LastFocusContext from "@/context/lastFocus";
import SidebarContext from "@/context/sidebar";
import TimeMachineContext from "@/context/timeMachine";
import FloatingMathInputContext from "@/context/floatingMathInput";
import KbViewContent from "./KbViewContent.vue";
import RefSuggestionsContext from "@/context/refSuggestions";
import AttachmentsManagerContext from "@/context/attachmentsManager";
import ImagesContext from "@/context/images";
import PathsContext from "@/context/paths";
import MainTreeContext from "@/context/mainTree";
import BlockSelectDragContext from "@/context/blockSelect";
import SettingsContext from "@/context/settings";
import SettingsPanelContext from "@/context/settingsPanel";
// import GtdContext from "@/context/gtd";
import BlockMoverContext from "@/context/blockMover";
import FavoriteContext from "@/context/favorite";
import IndexContext from "@/context";
import BasicSettingsContext from "@/context/basicSettings";
import FieldsManagerContext from "@/context/fieldsManager";
import BacklinksContext from "@/context/backlinks";
import PasteDialogContext from "@/context/pasteDialog";
import CreateNewTreeDialogContext from "@/context/createNewTreeDialog";
import ExporterContext from "@/context/exporter";
import FieldValueInspectorContext from "@/context/fieldValueInspector";
import DailyNoteContext from "@/context/dailynote";
import ImageEditorContext from "@/context/imageEditor";
import HistoryContext from "@/context/history";
import MenubarContext from "@/context/menubar";
import kbViewRegistry from "@/context/kbViewRegistry";
import BlockContextMenuContext from "@/context/blockContextMenu";
import CommandsContext from "@/context/commands/commands";
import AttachmentViewerContext from "@/context/attachmentViewer";
import BlockRefContextmenuContext from "@/context/blockRefContextmenu";
import { FieldSettingsDialogContext } from "@/context/fieldSettingsDialog";
import BlockRefTagSettingsDialog from "@/context/blockRefTagSettingsDialog";
import SearchSettingsContext from "@/context/searchSettings";
import QuickAddContext from "@/context/quick-add";
</script>
