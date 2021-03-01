import { CTableDataTrigger } from "./TableDataTrigger.js";
export function SetTriggerName() {
    let aTrigger = [
        [1 /* BeforeCreate_ */, "BeforeCreate"],
        [2 /* AfterCreate_ */, "AfterCreate"],
        [3 /* BeforeDestroy_ */, "BeforeDestroy"],
        [4 /* AfterDestroy_ */, "AfterDestroy"],
        [5 /* BeforeLoadNew_ */, "BeforeLoadNew"],
        [6 /* AfterLoadNew_ */, "AfterLoadNew"],
        [7 /* BeforeLoad_ */, "BeforeLoad"],
        [8 /* AfterLoad_ */, "AfterLoad"],
        [9 /* BeforeValidateValue_ */, "BeforeValidateValue"],
        [10 /* BeforeSetValue_ */, "BeforeSetValue"],
        [11 /* AfterSetValue_ */, "AfterSetValue"],
        [12 /* BeforeSetRange_ */, "BeforeSetRange"],
        [13 /* AfterSetRange_ */, "AfterSetRange"],
        [14 /* BeforeSetRow_ */, "BeforeSetRow"],
        [15 /* AfterSetRow_ */, "AfterSetRow"],
        [16 /* BeforeSetSort_ */, "BeforeSetSort"],
        [17 /* AfterSetSort_ */, "AfterSetSort"],
        [18 /* BeforeRemoveRow_ */, "BeforeRemoveRow"],
        [19 /* AfterRemoveRow_ */, "AfterRemoveRow"],
        [20 /* BeforeSetCellError_ */, "BeforeSetCellError"],
        [21 /* AfterSetCellError_ */, "AfterSetCellError"],
        [24 /* UpdateDataNew */, "UpdateDataNew"],
        [25 /* UpdateData */, "UpdateData"],
        [26 /* UpdateRowNew */, "UpdateRowNew"],
        [27 /* UpdateRowDelete */, "UpdateRowDelete"],
        [28 /* UpdateRow */, "UpdateRow"],
        [29 /* UpdateCell */, "UpdateCell"],
    ];
    CTableDataTrigger.SetTriggerName(aTrigger);
}
