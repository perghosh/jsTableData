class input_form_fields {
    constructor(fields) {
        fields = fields || [];
        this.m_aField = [];
    }
    empty() { return this.m_aField.length === 0; }
    append(_field) {
        if (Array.isArray(_field) === true) {
            this.m_aField = this.m_aField.concat(_field);
        }
        else {
            this.m_aField.push(_field);
        }
        return this.m_aField.length;
    }
    /**
     *
     * @param  f
     */
    get_element(f) {
        let s = "<div part='field'>", sEnd = "/>";
        if ((f.type & 262144 /* string */) === 262144 /* string */) {
            s += "<input type='text'";
        }
        s += `placeholder="${f.simple || f.alias || ""}" title="${f.title || ""}" data-name="${f.name}" value="${f.value || ""}" ${sEnd}</div>`;
        return s;
    }
    get_pages(bSetPage) {
        let a = [];
        for (let f of this.m_aField) {
            let page = f?.position?.page || 0;
            if (a.find(p => p === page) === undefined)
                a.push(page);
            if (bSetPage === true && page !== 0) { // if page !== 0 then key is found in position
                if (!f?.position)
                    f.position = {};
                f.position.page = page;
            }
        }
        return a;
    }
    //get_elements() : [number|string,declare.input_form.field][]  {
    get_elements() {
        let a = [];
        return a;
        // TODO: complete this, should return fields sorted in pages prepared to render
    }
    get_html() {
        let sHtml = "", f;
        for (f of this.m_aField) {
            sHtml += this.get_element(f);
        }
        return sHtml;
    }
}
const eSelectInputFormTemplate = document.createElement('template');
eSelectInputFormTemplate.innerHTML = `
<style>
   :host { display: block; font-family: sans-serif; }
   input { width: 100%; }
</style>
<div id="plate">
<section id="fields">
</section>
</div>
`;
export class CSelectInputForm extends HTMLElement {
    constructor(fields) {
        super();
        this.m_eRoot = this.attachShadow({ mode: 'open' });
        this.m_oIFF = new input_form_fields(fields);
        this.m_eRoot.appendChild(eSelectInputFormTemplate.content.cloneNode(true));
        this.m_eFields = this.m_eRoot.getElementById("fields");
    }
    connectedCallback() { this.render(); }
    Append(_field, convert) {
        let a = _field;
        if (typeof convert === "function") {
            if (!Array.isArray(a))
                a = [a];
            for (let i = 0; i < a.length; i++) {
                a[i] = convert(a[i]);
            }
        }
        this.m_oIFF.append(a);
        this.render();
    }
    render() {
        if (!this.m_eFields)
            return;
        let s = this.m_oIFF.get_html();
        this.m_eFields.innerHTML = s;
    }
}
window.customElements.define('select-form', CSelectInputForm);
