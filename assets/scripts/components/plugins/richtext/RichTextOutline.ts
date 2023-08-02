import { Color, LabelOutline, RichText, _decorator } from "cc";
import ParasiteComponent, { override } from "../../core/ParasiteComponent";

const { ccclass, property , executeInEditMode } = _decorator;

@ccclass('RichTextOutline')
@executeInEditMode(true)
export class RichTextOutline extends ParasiteComponent<RichText> {
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
    get width():number{
        return this._width
    }

    set width(value:number){
        this._width = value;
        if(this.super){
            this.super['_updateRichTextStatus']();
        }
    }

    @property({
        // serializable:true,
        visible:false
    })
    _color:Color = new Color(0,0,0,255);
    
    @property({
        visible:false
    })
    _width:number = 1;


    // ------------
    @override
    _applyTextAttribute (labelSeg: any) {        
        this.super['_applyTextAttribute'](labelSeg);
        let labelOutline:LabelOutline = labelSeg.node.getComponent(LabelOutline) 
        if(this.enabled){
            labelOutline = labelOutline || labelSeg.node.addComponent(LabelOutline);
        }
        if(labelOutline){
            labelOutline.width = this.width;
            labelOutline.color = this.color;
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

    protected onDestroy(): void {
        if(this.super){            
            this.super['_segments'].forEach((item:any) => {
                let labelOutline:LabelOutline = item.node.getComponent(LabelOutline);
                if(labelOutline){
                    labelOutline.enabled = false;
                    labelOutline.destroy();
                }
            });
        }
    }
}

