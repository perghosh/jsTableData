import { CTableData } from "./TableData.js";
import { CDispatch } from "./Dispatch.js";
export class CUIPagerPreviousNext {
    constructor(options) {
        const o = options || {};
        this.m_acallAction = [];
        if (o.callback_action)
            this.m_acallAction = Array.isArray(o.callback_action) ? o.callback_action : [o.callback_action];
        this.m_oDispatch = o.dispatch || null;
        this.m_sId = o.id || CUIPagerPreviousNext.s_sWidgetName + (new Date()).getUTCMilliseconds() + ++CUIPagerPreviousNext.s_iIdNext;
        this.m_sName = o.name || CUIPagerPreviousNext.s_sWidgetName;
        this.m_oMembers = { page: 0, page_count: 0, page_max_count: 10 };
        this.m_eParent = o.parent || null;
        Object.assign(this.m_oMembers, o.members || {});
        this.m_oStyle = {};
        Object.assign(this.m_oStyle, CUIPagerPreviousNext.s_oStyle, o.style || {});
        if (o.create !== false) {
            if (this.m_eParent) {
                this.Create();
            }
        }
    }
    get dispatch() { return this.m_oDispatch; }
    set dispatch(oDispatch) { this.m_oDispatch = oDispatch; }
    get name() { return this.m_sName; }
    get id() { return this.m_sId; }
    get component() { return this.m_eComponent; }
    Create(eParent, bCreate) {
        eParent = eParent || this.m_eParent;
        let eComponent = document.createElement("section");
        Object.assign(eComponent.dataset, { section: "component", id: this.id });
        eComponent.className = CUIPagerPreviousNext.s_sWidgetName;
        eParent.appendChild(eComponent);
        if (!this.m_eComponent)
            this.m_eComponent = eComponent;
        if (bCreate !== false) {
            this.create(eComponent);
        }
        return eComponent;
    }
    Render() {
    }
    MovePrevious() {
        this.Move(-1, "move.previous");
    }
    MoveNext() {
        this.Move(1, "move.next");
    }
    Move(iOffset, sCommand) {
        let iPage = this.m_oMembers.page + iOffset;
        if (iPage < 0)
            iPage = 0;
        if (iPage === this.m_oMembers.page)
            return;
        if (this.dispatch) {
            let aResult = this.dispatch.NotifyConnected(this, { command: sCommand, data: { page: this.m_oMembers.page, trigger: 65546 /* BeforeSetValue */ } });
            if (CDispatch.IsCancel(aResult) === true)
                return;
        }
        if (this.m_acallAction && this.m_acallAction.length > 0) {
            let i = 0, iTo = this.m_acallAction.length;
            let callback = this.m_acallAction[i];
            while (i++ < iTo) {
                let bResult = callback.call(this, sCommand);
                if (bResult === false)
                    return;
            }
        }
        this.m_oMembers.page = iPage;
        if (this.dispatch) {
            this.dispatch.NotifyConnected(this, { command: sCommand, data: { page: this.m_oMembers.page, trigger: 131083 /* AfterSetValue */ } });
        }
    }
    /**
     * General update method where operation depends on the iType value
     * @param iType
     */
    update(iType) {
        switch (iType) {
            case 28 /* UpdateDataNew */: {
                this.Render();
            }
        }
    }
    /**
     *
     * @param oMessage
     * @param sender
     */
    on(oMessage, sender) {
        const sCommand = oMessage.command;
        switch (sCommand) {
            case "update":
                this.Render();
                break;
        }
    }
    create(eComponent) {
        eComponent = eComponent || this.m_eComponent;
        let sClass;
        let sHtml = CTableData.GetPropertyValue(this.m_oStyle, false, "html_button");
        let sStyle = CTableData.GetPropertyValue(this.m_oStyle, false, "style_button") || "";
        if (!sHtml)
            sHtml = "button";
        else {
            let a = sHtml.split(".");
            if (a.length > 1)
                [sHtml, sClass] = a;
        }
        let self = this;
        let add_button = function (sHtml, sStyle, sClass, sType) {
            let e = document.createElement(sHtml);
            if (sStyle)
                e.style.cssText = sStyle;
            if (sClass)
                e.className = sClass;
            e.dataset.type = sType;
            return e;
        };
        let e = add_button(sHtml, sStyle, sClass, "previous");
        eComponent.appendChild(e);
        e.addEventListener("click", (eEvent) => {
            if (self._on_action("click", eEvent, "move.previous") !== false)
                this.MovePrevious();
        });
        e = add_button(sHtml, sStyle, sClass, "next");
        eComponent.appendChild(e);
        e.addEventListener("click", (eEvent) => {
            if (self._on_action("click", eEvent, "move.next") !== false)
                this.MoveNext();
        });
    }
    /**
     * Handle element events for ui table text. Events from elements calls this method that will dispatch it.
     * @param {string} sType event name
     * @param {Event} e event data
     * @param {string} sSection section name, table text has container elements with a name (section name)
     */
    _on_action(sType, e, sCommand) {
        if (this.m_acallAction && this.m_acallAction.length > 0) {
            let i = 0, iTo = this.m_acallAction.length;
            let callback = this.m_acallAction[i];
            while (i++ < iTo) {
                let bResult = callback.call(this, sType, e, sCommand);
                if (bResult === false)
                    return false;
            }
        }
    }
}
CUIPagerPreviousNext.s_sWidgetName = "uipagerpreviousnext";
CUIPagerPreviousNext.s_iIdNext = 0;
CUIPagerPreviousNext.s_oStyle = {
    html_button: "button"
};
