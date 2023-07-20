// Learn TypeScript:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/2.4/manual/en/scripting/life-cycle-callbacks.html

import ParasiteComponent, { override } from "../../core/ParasiteComponent";

const {ccclass, property, executeInEditMode} = cc._decorator;

@ccclass
@executeInEditMode
export default class LabelStylizing extends ParasiteComponent<cc.Label> {

    @override
    set string(value:string){
        cc.log('Inject to label !!!!' + Math.random()*2000 )
        this.super.string = value + ' --- injected';
    }

    protected onLoad(): void {
        cc.log('------------' + cc.js.getClassName(this))
    }
    
}