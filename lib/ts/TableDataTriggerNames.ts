import { CTableDataTrigger, enumTrigger } from "./TableDataTrigger.js";

export function SetTriggerName() {
   let aTrigger: [number,string][] = [
      [enumTrigger.BeforeCreate_,"BeforeCreate"],
      [enumTrigger.AfterCreate_,"AfterCreate"],
      [enumTrigger.BeforeDestroy_,"BeforeDestroy"],
      [enumTrigger.AfterDestroy_,"AfterDestroy"],
      [enumTrigger.BeforeLoadNew_,"BeforeLoadNew"],
      [enumTrigger.AfterLoadNew_,"AfterLoadNew"],
      [enumTrigger.BeforeLoad_,"BeforeLoad"],
      [enumTrigger.AfterLoad_,"AfterLoad"],
      [enumTrigger.BeforeValidateValue_,"BeforeValidateValue"],
      [enumTrigger.BeforeSetValue_,"BeforeSetValue"],
      [enumTrigger.AfterSetValue_,"AfterSetValue"],
      [enumTrigger.BeforeSelect_,"BeforeSelect"],
      [enumTrigger.AfterSelect_,"AfterSelect"],
      [enumTrigger.BeforeSetRange_,"BeforeSetRange"],
      [enumTrigger.AfterSetRange_,"AfterSetRange"],
      [enumTrigger.BeforeSetRow_,"BeforeSetRow"],
      [enumTrigger.AfterSetRow_,"AfterSetRow"],
      [enumTrigger.BeforeSetSort_,"BeforeSetSort"],
      [enumTrigger.AfterSetSort_,"AfterSetSort"],
      [enumTrigger.BeforeRemoveRow_,"BeforeRemoveRow"],
      [enumTrigger.AfterRemoveRow_,"AfterRemoveRow"],
      [enumTrigger.BeforeSetCellError_,"BeforeSetCellError"],
      [enumTrigger.AfterSetCellError_,"AfterSetCellError"],
      [enumTrigger.OnResize_,"OnResize"],
      [enumTrigger.UpdateDataNew,"UpdateDataNew"],
      [enumTrigger.UpdateData,"UpdateData"],
      [enumTrigger.UpdateRowNew,"UpdateRowNew"],
      [enumTrigger.UpdateRowDelete,"UpdateRowDelete"],
      [enumTrigger.UpdateRow,"UpdateRow"],
      [enumTrigger.UpdateCell,"UpdateCell"],
   ];

   CTableDataTrigger.SetTriggerName( aTrigger );
}