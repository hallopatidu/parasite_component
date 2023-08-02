import { _decorator, Color, Component, Label, LabelShadow, Node, RichText, Sprite, Vec2 } from 'cc';
import ParasiteComponent, { override } from "../../core/ParasiteComponent";

const { ccclass, property, executeInEditMode } = _decorator;

// interface ISegment {
//     node: Node;
//     comp: Label | Sprite | null;
//     lineCount: number;
//     styleIndex: number;
//     imageOffset: string;
//     clickParam: string;
//     clickHandler: string;
//     type: string,
// }

@ccclass('RichTextShadow')
@executeInEditMode
export class RichTextShadow extends ParasiteComponent<RichText> {
    
    @property
    get color():Color{
        return this._color
    }

    set color(value:Color){
        this._color = value;
        if(this.super){
            this.super['_updateRichTextStatus']();
        }
    }

    @property
    get offset():Vec2{
        return this._offset
    }

    set offset(value:Vec2){
        this._offset = value;
        if(this.super){
            this.super['_updateRichTextStatus']();
        }
    }
    
    @property
    get blur():number{
        return this._blur
    }

    set blur(value:number){
        this._blur = value;
        if(this.super){
            this.super['_updateRichTextStatus']();
        }
    }


    @property({
        // serializable:true,
        visible:false
    })
    _offset:Vec2 = new Vec2(2,2);

    @property({
        // serializable:true,
        visible:false
    })
    _blur:number = 1;

    @property({
        // serializable:true,
        visible:false
    })
    _color:Color = new Color(0,0,0,255);

    // ------------
    @override
    _applyTextAttribute (labelSeg: any) {        
        this.super['_applyTextAttribute'](labelSeg);
        let labelShadow:LabelShadow = labelSeg.node.getComponent(LabelShadow) 
        if(this.enabled){
            labelShadow = labelShadow || labelSeg.node.addComponent(LabelShadow);
        }
        if(labelShadow){
            labelShadow.enabled = this.enabled;
            labelShadow.color = this.color;
            labelShadow.offset = this.offset;
            labelShadow.blur = this.blur;
        }
    }

    protected onEnable(): void {
        if(this.super){
            this.super['_updateRichTextStatus']();
        }
    }

    protected onDisable(): void {
        if(this.super){
            this.super['_updateRichTextStatus']();
        }
    }
    
    // protected onLoad(): void {
    //     this.super['_updateRichTextStatus']();
    // }

    protected onDestroy(): void {
        if(this.super && this.super['_segments']){            
            this.super['_segments'].forEach((item:any) => {
                let labelShadow:LabelShadow = item.node.getComponent(LabelShadow);
                if(labelShadow && labelShadow.isValid){
                    labelShadow.enabled = false;
                    labelShadow.destroy();
                }
            });
        }
    }
}

