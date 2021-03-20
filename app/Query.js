export class CQuery {
    constructor(options) {
        const o = options || {};
        this.m_aCondition = o.conditions || [];
        this.m_aCondition.forEach(o => {
            if (o.operator === undefined)
                o.operator = 0;
        });
    }
    CONDITIONAdd(_1, _2, _3, _4 = 0, _5, _6) {
        let oCondition = {};
        let sTable, sId, _value, iOperator;
        if (typeof _1 === "string") {
            oCondition.table = _1;
            oCondition.operator = _4;
            if (typeof _2 === "string")
                oCondition.id = _2;
            if (_3 !== undefined) {
                oCondition.value = _3;
            }
            if (typeof _5 === "string") {
                oCondition.simple = _5;
            }
            if (typeof _6 === "string") {
                oCondition.group = _6;
            }
        }
        else {
            oCondition = _1;
            if (oCondition.operator === undefined)
                oCondition.operator = 0;
        }
        this.m_aCondition.push(oCondition);
    }
    CONDITIONGetXml(oOptions, doc) {
        oOptions = oOptions || {};
        let xml = CQuery.CONDITIONGetDocument(this.m_aCondition, oOptions, doc);
        if (oOptions.document)
            return xml;
        const sXml = (new XMLSerializer()).serializeToString(xml);
        return sXml;
    }
    static CONDITIONGetDocument(aCondition, oOptions, doc) {
        doc = doc || (new DOMParser()).parseFromString("<document/>", "text/xml");
        let xml = doc.documentElement;
        const sConditions = oOptions.conditions || "conditions";
        const sCondition = oOptions.condition || "condition";
        let eConditions = doc.createElement(sConditions);
        xml.appendChild(eConditions);
        aCondition.forEach(o => {
            let eCondition = eConditions.appendChild(doc.createElement(sCondition));
            eCondition.setAttribute("table", o.table);
            eCondition.setAttribute("id", o.id);
            eCondition.setAttribute("value", o.value.toString());
            eCondition.setAttribute("operator", o.operator.toString());
            if (o.simple)
                eCondition.setAttribute("simple", o.simple);
            if (o.group)
                eCondition.setAttribute("simple", o.group);
        });
        return doc;
    }
}
