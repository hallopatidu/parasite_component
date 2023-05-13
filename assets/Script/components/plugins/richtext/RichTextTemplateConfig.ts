// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import ParasiteComponent, { override } from "../../core/ParasiteComponent";

const {ccclass, property} = cc._decorator;

@ccclass
export default class RichTextTemplateConfig extends ParasiteComponent<cc.RichText> {

    @property({
        type:cc.Node
    })
    template:cc.Node = null;



    @override
    _applyTextAttribute (labelNode:cc.Node, string:string, force:boolean) {
        this.super['_applyTextAttribute'](labelNode, string, force)
        // const labelComponent:cc.Label = labelNode.getComponent(cc.Label);
        this.cloneAttributeFromeTemplate(labelNode);
    }

    // ---------------------------------------

    protected cloneAttributeFromeTemplate(toLabelNode:cc.Node){
        if(this.template && toLabelNode){
            const labelTemplate:cc.Label = this.template.getComponent(cc.Label);
            if(labelTemplate){


            }
        }
    }
    
}
