import type { FieldMetadataType } from "@/context/fieldsManager";

export type FieldInfo = {
  id: string;
  displayText: string;
  metadata: FieldMetadataType;
};
