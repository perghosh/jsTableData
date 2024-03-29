/**
 * Object used to connect objects for communication
 * Objects needs to implement "on" and "destroy" methods to work with dispatch
 */
export class CDispatch {
    m_aListeners; // Connected listeners
    m_oChain; // chains of items if a message is sent to selected objects
    constructor() {
        this.m_aListeners = [];
        this.m_oChain = {};
    }
    /**
     * Check array for false values
     * @param {unknown[]} aResult array with anything that is checked for false values
     */
    static IsCancel(aResult) {
        let i = aResult.length;
        while (--i >= 0) {
            if (aResult[i] === false)
                return true;
        }
        return false;
    }
    /**
     * Return id for dispatch interface
     * @param oListener
     */
    static GetId(_Listener) {
        let sSourceId = "";
        if (typeof _Listener == "string") {
            sSourceId = _Listener;
        }
        else if (_Listener && _Listener.id) {
            sSourceId = typeof _Listener.id === "function" ? _Listener.id() : _Listener.id;
        }
        return sSourceId;
    }
    /**
     * Add listener to list of listeners
     * @param oListener listener to add
     * @param aChain if chain is added for id
     */
    AddListener(oListener, aChain) {
        if (!oListener)
            throw "Unknown listener added!";
        const sId = CDispatch.GetId(oListener);
        this.Remove(sId);
        this.m_aListeners.push(oListener);
        if (aChain) {
            this.m_oChain[sId] = aChain;
        }
        return oListener;
    }
    /**
     * Append chain to listener chain if there is one, otherwise chain is created
     * @param {CListener} listener listener chain is added to
     * @param {IDispatch | IDispatch[]} aChain array with listeners
     */
    AddChain(_Id, aChain) {
        let bAdded = false;
        if (Array.isArray(aChain) === false)
            aChain = [aChain];
        const sId = CDispatch.GetId(_Id);
        for (var i = 0; i < this.m_aListeners.length; i++) {
            if (this.m_aListeners[i].id === sId) {
                if (!this.m_oChain[sId]) {
                    this.m_oChain[sId] = aChain;
                }
                else {
                    this.m_oChain[sId] = this.m_oChain[sId].concat(aChain);
                }
                bAdded = true;
            }
        }
        if (bAdded === false) {
            this.m_oChain[sId] = aChain;
        }
    }
    /**
     * Notify connected items found in chain.
     * @param sId to chain with connected items
     * @param {DispatchMessage} oMessage message object sent to items in chain
     */
    NotifyConnected(_Id, oMessage) {
        const sId = CDispatch.GetId(_Id);
        let oListener, // listener item in chain list
        aResult = []; // result from calling listeners
        if (this.m_oChain.hasOwnProperty(sId)) {
            const aListener = this.m_oChain[sId]; // get chain with listeners
            for (let i = 0; i < aListener.length; i++) {
                oListener = aListener[i];
                const _result = oListener.on(oMessage, _Id);
                if (_result !== undefined) {
                    aResult.push(_result);
                }
            }
        }
        return aResult;
    }
    /**
     * [SendMessage description]
     * @param {CListener} source Listener object that sends message to connected m_aListeners
     * @param {object} message sent message { source: "source object name", command: "command name", "target object name", data: {message data}, xml: xml_object }
     */
    SendMessage(oMessage, source) {
        let sSourceId = CDispatch.GetId(source);
        var i, oListener;
        if (Array.isArray(oMessage.target) === true) {
            var aTarget = oMessage.target;
            for (i = 0; i < aTarget.length; i++) {
                oMessage.target = aTarget[i];
                this.SendMessage(oMessage, source);
            }
            oMessage.target = aTarget;
        }
        else {
            for (i = 0; i < this.m_aListeners.length; i++) {
                oListener = this.m_aListeners[i];
                if (!source || (oListener.id !== source.id)) {
                    if (oListener.SendSignal && oListener.SendSignal(oMessage) === false) {
                        continue;
                    }
                    try {
                        oListener.on(oMessage, source);
                    }
                    catch (e) {
                        var sError;
                        if (typeof e === "string") {
                            sError = e;
                        }
                        else {
                            if (oListener.on === undefined) {
                                sError = oListener.id + ": Method Signal was not found!";
                            }
                        }
                        let sMessage = "CDispatch.SendMessage: id=" + oListener.id + ", source=" + (oMessage.source || "") + ", command=" + (oMessage.command || "") + "\n";
                        sMessage += "Error: " + (sError || "unknown");
                        console.assert(false, sMessage);
                    }
                }
            }
        }
    }
    /**
     * Remove listener from dispatch
     * @param {string|IDispatch} sId id for component that is removed
     */
    Remove(sId, bDestroy) {
        var sName;
        var i, oListener;
        if (typeof sId === "object") {
            if (sId.name) {
                sName = sId.name;
            }
            else {
                sId = CDispatch.GetId(sId);
            }
        }
        if (typeof sId === "string") {
            for (i = 0; i < this.m_aListeners.length; i++) {
                oListener = this.m_aListeners[i];
                if (oListener.id() === sId) {
                    this.RemoveChain(oListener.id());
                    this.m_aListeners.splice(i, 1); // remove from array
                    if (bDestroy && typeof oListener.destroy === "function") {
                        oListener.destroy();
                    }
                    return oListener; // return item removed from dispatch list
                }
            }
        }
        else {
            if (typeof sName === "string") {
                for (i = 0; i < this.m_aListeners.length; i++) {
                    oListener = this.m_aListeners[i];
                    if (oListener.name && oListener.name() === sName) {
                        this.RemoveChain(oListener.id());
                        this.m_aListeners.splice(i, 1); // remove from array
                        i--; // decrease one when one is removed
                        if (bDestroy && typeof oListener.destroy === "function") {
                            oListener.destroy();
                        }
                    } // if
                } // for
            } // if
        }
        return null;
    }
    /**
     * Remove chain from chain list
     * @param sId {string} id for chain to remove
     */
    RemoveChain(sId) {
        if (this.m_oChain.hasOwnProperty(sId)) {
            delete this.m_oChain[sId];
        }
    }
}
