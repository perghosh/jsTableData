import { CTableDataTrigger } from "./TableDataTrigger.js";
export function SetTriggerName() {
    let aTrigger = [
        [1 /* BeforeCreate_ */, "BeforeCreate"],
        [2 /* AfterCreate_ */, "AfterCreate"],
        [3 /* BeforeLoadNew_ */, "BeforeLoadNew"],
        [4 /* AfterLoadNew_ */, "AfterLoadNew"],
        [5 /* BeforeLoad_ */, "BeforeLoad"],
        [6 /* AfterLoad_ */, "AfterLoad"],
        [8 /* BeforeSetValue_ */, "BeforeSetValue"],
        [9 /* AfterSetValue_ */, "AfterSetValue"],
        [10 /* BeforeSetRange_ */, "BeforeSetRange"],
        [11 /* AfterSetRange_ */, "AfterSetRange"],
        [12 /* BeforeSetRow_ */, "BeforeSetRow"],
        [13 /* AfterSetRow_ */, "AfterSetRow"],
        [14 /* BeforeRemoveRow_ */, "BeforeRemoveRow"],
        [15 /* AfterRemoveRow_ */, "AfterRemoveRow"],
        [16 /* BeforeSetCellError_ */, "BeforeSetCellError"],
        [17 /* AfterSetCellError_ */, "AfterSetCellError"],
        [20 /* UpdateDataNew */, "UpdateDataNew"],
        [21 /* UpdateData */, "UpdateData"],
        [22 /* UpdateRowNew */, "UpdateRowNew"],
        [23 /* UpdateRowDelete */, "UpdateRowDelete"],
        [24 /* UpdateRow */, "UpdateRow"],
        [25 /* UpdateCell */, "UpdateCell"],
    ];
    CTableDataTrigger.SetTriggerName(aTrigger);
}
