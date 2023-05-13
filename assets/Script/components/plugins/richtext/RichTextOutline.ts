import ParasiteComponent, { override } from "../../core/ParasiteComponent";

const {ccclass, property, executeInEditMode} = cc._decorator;

@ccclass
@executeInEditMode
export default class RichTextOutline extends ParasiteComponent<cc.RichText> {

    @property
    get color():cc.Color{
        return this._color
    }

    set color(value:cc.Color){
        this._color = value;
        this.applyAllTextAttributes(this.applyLabelAttributes.bind(this));
    }

    @property
    get width():number{
        return this._width
    }

    set width(value:number){
        this._width = value;
        this.applyAllTextAttributes(this.applyLabelAttributes.bind(this));
    }

    @property({
        // serializable:true,
        visible:false
    })
    _color:cc.Color = new cc.Color(0,0,0,255);
    
    @property({
        visible:false
    })
    _width:number = 1;


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
        let labelOutline:cc.LabelOutline = labelNode.getComponent(cc.LabelOutline);
        if(!labelOutline){
            labelOutline = labelNode.addComponent(cc.LabelOutline);            
        }
        labelOutline.width = this.width;
        labelOutline.color = this.color;
    }
    
    protected onEnable(): void {
        if(this.super){
            this.applyAllTextAttributes((labelNode:cc.Node)=>{
                const labelOutline:cc.LabelOutline = labelNode.getComponent(cc.LabelOutline);
                if(labelOutline) labelOutline.enabled = true;
            })
        }
    }

    protected onDisable(): void {
        if(this.super){
            this.applyAllTextAttributes((labelNode:cc.Node)=>{
                const labelOutline:cc.LabelOutline = labelNode.getComponent(cc.LabelOutline);
                if(labelOutline) labelOutline.enabled = false;
            })
        }
    }

    protected onDestroy(): void {
        if(this.super){
            this.applyAllTextAttributes((labelNode:cc.Node)=>{
                labelNode.getComponent(cc.LabelOutline) && labelNode.removeComponent(cc.LabelOutline);
            })
        }
    }
    
}
