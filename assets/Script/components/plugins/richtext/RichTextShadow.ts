import ParasiteComponent from "../../core/ParasiteComponent";
import { override } from "../../core/ParasiteComponent";
const {ccclass, property, executeInEditMode} = cc._decorator;

type ImageFakeAtlas = {
    getSpriteFrame:Function
} & cc.SpriteAtlas;

@ccclass
@executeInEditMode
export default class RichTextShadow extends ParasiteComponent<cc.RichText> {
    
    @property
    get color():cc.Color{
        return this._color
    }

    set color(value:cc.Color){
        this._color = value;
        this.applyAllTextAttributes(this.applyLabelAttributes.bind(this));
    }

    @property
    get offset():cc.Vec2{
        return this._offset
    }

    set offset(value:cc.Vec2){
        this._offset = value;
        this.applyAllTextAttributes(this.applyLabelAttributes.bind(this));
    }
    
    @property
    get blur():number{
        return this._blur
    }

    set blur(value:number){
        this._blur = value;
        this.applyAllTextAttributes(this.applyLabelAttributes.bind(this));
    }


    @property({
        // serializable:true,
        visible:false
    })
    _offset:cc.Vec2 = new cc.Vec2(2,2);

    @property({
        // serializable:true,
        visible:false
    })
    _blur:number = 1;

    @property({
        // serializable:true,
        visible:false
    })
    _color:cc.Color = new cc.Color(0,0,0,255);

    @override
    _applyTextAttribute (labelNode:cc.Node, string:string, force:boolean) {
        this.super['_applyTextAttribute'](labelNode, string, force);
        this.applyLabelAttributes(labelNode);
    }

    // ---------------------------------------

    /**
     * 
     */
    protected applyAllTextAttributes(handler:Function){
        for (let i = 0; i < this.super['_labelSegments'].length; ++i) {
            const node:cc.Node = this.super['_labelSegments'][i] as cc.Node;
            if(node && node.isValid){
                handler(node)
            }
        }
    }

    /**
     * 
     * @param labelNode 
     */
    protected applyLabelAttributes(labelNode:cc.Node){
        let labelShadow:cc.LabelShadow = labelNode.getComponent(cc.LabelShadow);
        if(!labelShadow){
            labelShadow = labelNode.addComponent(cc.LabelShadow);            
        }
        labelShadow.color = this.color;
        labelShadow.offset = this.offset;
        labelShadow.blur = this.blur;
    }
    
    protected onEnable(): void {
        if(this.super){
            this.applyAllTextAttributes((labelNode:cc.Node)=>{
                const labelShadow:cc.LabelShadow = labelNode.getComponent(cc.LabelShadow);
                if(labelShadow) labelShadow.enabled = true;
            })
        }
    }

    protected onDisable(): void {
        if(this.super){
            this.applyAllTextAttributes((labelNode:cc.Node)=>{
                const labelShadow:cc.LabelShadow = labelNode.getComponent(cc.LabelShadow);
                if(labelShadow) labelShadow.enabled = false;
            })
        }
    }

    protected onDestroy(): void {
        if(this.super){
            this.applyAllTextAttributes((labelNode:cc.Node)=>{
                labelNode.getComponent(cc.LabelShadow) && labelNode.removeComponent(cc.LabelShadow);
            })
        }
    }

}
