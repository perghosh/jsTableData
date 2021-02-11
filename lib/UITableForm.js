export class CUITableForm {
    constructor(options) {
        const o = options || {};
        this.m_acallOnAction = [];
        if (o.action)
            this.m_acallOnAction = Array.isArray(o.action) ? o.action : [o.action];
        this.m_aBody = o.body || [];
        this.m_iColumnCount = 0;
        this.m_eComponent = null;
        this.m_sId = o.id || CUITableForm.s_sWidgetName + (new Date()).getUTCMilliseconds();
        this.m_aOrder = [];
        this.m_eParent = o.parent || null;
        this.m_iRowCount = 0;
        this.m_aSection = o.section || ["toolbar", "title", "header", "body", "footer", "statusbar"]; // sections "header" and "body" are required
        this.m_oTableData = o.table || null;
        if (this.m_eParent) {
            this.Create(o.callback_create);
        }
    }
    OnAction(sType, e, sSection) {
        if (this.m_acallOnAction) {
            let i = 0, iTo = this.m_acallOnAction.length;
            let callback = this.m_acallOnAction[i];
            while (i++ < iTo) {
                let bResult = callback.call(this, sType, e, sSection);
                if (bResult === false)
                    return;
            }
        }
        if (sSection === "header") {
            //this.GetRowCol(<HTMLElement>e.srcElement);
        }
        else if (sSection === "body") {
        }
    }
    Create(callback, eParent) {
        let eComponent = this.GetComponent(true); // create component in not created
        if (eComponent.firstChild === null) {
            this.create_sections(eComponent, callback);
            this.m_eParent.appendChild(eComponent);
        }
    }
    /** BLOG: children, childNodes and dataset
     *
     * @param bCreate
     */
    GetComponent(bCreate) {
        if (this.m_eComponent)
            return this.m_eComponent;
        let aChildren = this.m_eParent.children;
        let i = aChildren.length;
        while (--i >= 0) {
            let e = aChildren[i];
            if (e.tagName === "SECTION" && e.dataset.id === this.id() && e.dataset.section === "section")
                return e;
        }
        if (bCreate === true) {
            let eComponent = document.createElement("section");
            eComponent.dataset.section = "component";
            eComponent.dataset.id = this.id();
            this.m_eComponent = eComponent;
        }
        return this.m_eComponent;
    }
    /**
     * Return id
     */
    id() { return this.m_sId; }
    /**
     * Get table data object that manages table data logic
     */
    table_data() { return this.m_oTableData; }
    /**
     * Creates section elements for parts used by `CUITableText`.
     * Sections rendered are found in member m_aSection
     * @param {HTMLElement} [eComponent] Container section
     * @param {(eSection: HTMLElement, sName: string) => boolean )} [callback] method called when element is created. if false is returned then section isn't added to component
     */
    create_sections(eComponent, callback) {
        eComponent = eComponent || this.m_eComponent;
        let self = this;
        let append_section = (eComponent, sName) => {
            let eSection = document.createElement("section"); // create section
            eSection.dataset.section = sName; // set section name, used to access section
            eSection.dataset.widget = CUITableForm.s_sWidgetName;
            // configure event listeners
            eSection.addEventListener("click", (e) => {
                let eSink = e.currentTarget;
                while (eSink && eSink.tagName !== "SECTION" && eSink.dataset.widget !== CUITableForm.s_sWidgetName)
                    eSink = eSink.parentElement;
                if (!eSink)
                    return;
                self.OnAction("click", e, eSink.dataset.section);
            });
            // add to component if no callback or if callback do not return false
            if (!callback || (callback && callback(eSection, "section") !== false))
                eComponent.appendChild(eSection);
            return eSection;
        };
        // Create elements for sections that do not have elements stored
        for (let i = 0; i < this.m_aSection.length; i++) {
            let _Name = this.m_aSection[i];
            if (typeof _Name === "string") {
                this.m_aSection[i] = [_Name, append_section(eComponent, _Name)];
            }
        }
        return eComponent;
    }
}
CUITableForm.s_sWidgetName = "uitableform";
