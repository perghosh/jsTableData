export declare type DispatchMessage = {
    source?: string;
    command: string;
    target?: string | string[];
    data?: any;
};
export interface IDispatch {
    id?: string | (() => string);
    name?: string;
    on?: ((oMessage: DispatchMessage, sender: string | IDispatch) => any);
    destroy?: (() => void);
}
/**
 * Object used to connect objects for communication
 * Objects needs to implement "on" and "destroy" methods to work with dispatch
 */
export declare class CDispatch {
    m_aListeners: IDispatch[];
    m_oChain: {
        [key_name: string]: IDispatch[];
    };
    constructor();
    /**
     * Check array for false values
     * @param {unknown[]} aResult array with anything that is checked for false values
     */
    static IsCancel(aResult: unknown[]): boolean;
    /**
     * Return id for dispatch interface
     * @param oListener
     */
    static GetId(_Listener: string | IDispatch): string;
    /**
     * Add listener to list of listeners
     * @param oListener listener to add
     * @param aChain if chain is added for id
     */
    AddListener(oListener: IDispatch, aChain: any): IDispatch;
    /**
     * Append chain to listener chain if there is one, otherwise chain is created
     * @param {CListener} listener listener chain is added to
     * @param {IDispatch | IDispatch[]} aChain array with listeners
     */
    AddChain(_Id: string | IDispatch, aChain: IDispatch | IDispatch[]): void;
    /**
     * Notify connected items found in chain.
     * @param sId to chain with connected items
     * @param {DispatchMessage} oMessage message object sent to items in chain
     */
    NotifyConnected(_Id: string | IDispatch, oMessage: DispatchMessage): unknown[];
    /**
     * [SendMessage description]
     * @param {CListener} source Listener object that sends message to connected m_aListeners
     * @param {object} message sent message { source: "source object name", command: "command name", "target object name", data: {message data}, xml: xml_object }
     */
    SendMessage(oMessage: DispatchMessage, source?: IDispatch): void;
    /**
     * Remove listener from dispatch
     * @param {string|IDispatch} sId id for component that is removed
     */
    Remove(sId: string | IDispatch, bDestroy?: boolean): void;
    /**
     * Remove chain from chain list
     * @param sId {string} id for chain to remove
     */
    RemoveChain(sId: string): void;
}
