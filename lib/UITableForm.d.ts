import { CTableData } from "./TableData.js";
declare namespace details {
    type construct = {
        action?: ((sType: string, e: Event, sSection: string) => boolean) | ((sType: string, e: Event, sSection: string) => boolean)[];
        body?: unknown[][];
        callback_create?: (eSection: HTMLElement, sName: string) => void | boolean;
        id?: string;
        table?: CTableData;
        parent?: HTMLElement;
        section?: string[];
        style?: {
            label?: string;
            value?: string;
            class_label?: string;
            class_value?: string;
        };
        width?: {
            max_value_width?: number;
            max_row_width?: number;
        };
    };
}
export declare class CUITableForm {
    m_acallOnAction: ((sType: string, e: Event, sSection: string) => boolean)[];
    m_aBody: unknown[][];
    m_aCellFocus: [number, number];
    m_iColumnCount: number;
    m_eComponent: HTMLElement;
    m_sId: string;
    m_aOrder: [number | string, number][];
    m_eParent: HTMLElement;
    m_iRowCount: number;
    m_oTableData: CTableData;
    m_aSection: string[] | [string, HTMLElement][];
    static s_sWidgetName: string;
    constructor(options: details.construct);
    OnAction(sType: string, e: Event, sSection: string): void;
    Create(callback?: ((eSection: HTMLElement, sName: string) => void | boolean), eParent?: HTMLElement): void;
    /** BLOG: children, childNodes and dataset
     *
     * @param bCreate
     */
    GetComponent(bCreate?: boolean): HTMLElement;
    /**
     * Return id
     */
    id(): string;
    /**
     * Get table data object that manages table data logic
     */
    table_data(): CTableData;
    /**
     * Creates section elements for parts used by `CUITableText`.
     * Sections rendered are found in member m_aSection
     * @param {HTMLElement} [eComponent] Container section
     * @param {(eSection: HTMLElement, sName: string) => boolean )} [callback] method called when element is created. if false is returned then section isn't added to component
     */
    create_sections(eComponent?: HTMLElement, callback?: ((eSection: HTMLElement, sSection: string) => void | boolean)): HTMLElement;
}
export {};
