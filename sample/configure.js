
function SetTriggerName() {
   CTableDataTrigger.s_aTriggerName = [
      "Unknown",
      "BeforeCreate",
      "AfterCreate",
      "BeforeLoadNew",
      "AfterLoadNew",
      "BeforeLoad",
      "AfterLoad",
      "BeforeSetValue",
      "AfterSetValue",
      "BeforeSetRange",
      "AfterSetRange",
      "BeforeSetRow",
      "AfterSetRow",
      "BeforeRemoveRow",
      "AfterRemoveRow",
      
      "OnSetValueError",
      "OnResize",
      "END",

      "UpdateDataNew",
      "UpdateData",
      "UpdateRowNew",
      "UpdateRowDelete",
      "UpdateRow",
      "UpdateCell",
   ];
}



// ^\s\s\s\s\s\s\s*([a-zA-Z]*).*$
// "$1",\n