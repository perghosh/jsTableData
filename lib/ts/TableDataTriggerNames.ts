import { CTableDataTrigger, enumTrigger } from "./TableDataTrigger.js";

export function SetTriggerName() {
   let aTrigger: [number,string][] = [
      [enumTrigger.BeforeCreate_,"BeforeCreate"],
      [enumTrigger.AfterCreate_,"AfterCreate"],
      [enumTrigger.BeforeLoadNew_,"BeforeLoadNew"],
      [enumTrigger.AfterLoadNew_,"AfterLoadNew"],
      [enumTrigger.BeforeLoad_,"BeforeLoad"],
      [enumTrigger.AfterLoad_,"AfterLoad"],
      [enumTrigger.BeforeSetValue_,"BeforeSetValue"],
      [enumTrigger.AfterSetValue_,"AfterSetValue"],
      [enumTrigger.BeforeSetRange_,"BeforeSetRange"],
      [enumTrigger.AfterSetRange_,"AfterSetRange"],
      [enumTrigger.BeforeSetRow_,"BeforeSetRow"],
      [enumTrigger.AfterSetRow_,"AfterSetRow"],
      [enumTrigger.BeforeRemoveRow_,"BeforeRemoveRow"],
      [enumTrigger.AfterRemoveRow_,"AfterRemoveRow"],
      [enumTrigger.BeforeSetCellError_,"BeforeSetCellError"],
      [enumTrigger.AfterSetCellError_,"AfterSetCellError"]
   ];

   CTableDataTrigger.SetTriggerName( aTrigger );
}