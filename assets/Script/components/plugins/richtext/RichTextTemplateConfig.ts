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
export default class RichTextTemplateConfig extends ParasiteComponent<cc.RichText> {

    @property({
        type:cc.Node,
        visible() {
            return !this.prefabTemplate;
        },
    })
    nodeTemplate:cc.Node = null;    
    
    @property({
        type:cc.Prefab,
        visible() {
            return !this.nodeTemplate;
        },
    })
    prefabTemplate:cc.Prefab = null;

    @property({
        // serializable:true,
        visible:false
    })
    patternNode:cc.Node = null;

    protected _currentImageStyleIndex:number = 0;
    protected _currentLabelStyleIndex:number = 0;

    /**
     * At Runtime, this method override _needsUpdateTextLayout method of native RichText Component.
     * @param newTextArray 
     * @returns 
     */
    @override
    _needsUpdateTextLayout (newTextArray:any[]):boolean {
        // Reset style
        this._currentImageStyleIndex = 0;
        this._currentLabelStyleIndex = 0;
        return  this.super['_needsUpdateTextLayout'](newTextArray);
    }

    @override
    _applyTextAttribute (labelNode:cc.Node, string:string, force:boolean) {
        this.super['_applyTextAttribute'](labelNode, string, force)
        if(this.enabled){
            this.applyLabelAttibuteFromTemplate(labelNode)
        }
    }

    

    /**
     * Runtime override _addRichTextImageElement method of native RichText Component.
     * @param richTextElement 
     * @returns 
     */
    @override
    _addRichTextImageElement (richTextElement:any) {        
        const numOfSegment:number = this.super['_labelSegments'].length;
        this.super['_addRichTextImageElement'](richTextElement);        
        if(this.enabled && this.super['_labelSegments'].length == (numOfSegment + 1)){            
            const spriteNode:cc.Node = this.super['_labelSegments'][numOfSegment];
            this.applyImageAttibuteFromTemplate(spriteNode);
        }
    }

    // ---------------------------------------

    /**
     * 
     * @returns 
     */
    protected getPatternSprite():cc.Sprite{
        const patternNode:cc.Node = this.nodeTemplate || this.prefabTemplate?.data;
        if(patternNode){
            const currentIndex:number = this._currentImageStyleIndex;
            this._currentImageStyleIndex++;
            const sprites:cc.Sprite[] = patternNode.getComponentsInChildren(cc.Sprite);
            this._currentImageStyleIndex = this._currentImageStyleIndex%sprites.length;            
            return sprites[currentIndex];
        }
        return
    }

    /**
     * 
     * @returns 
     */
    protected getPatternLabel():cc.Label{
        const patternNode:cc.Node = this.nodeTemplate || this.prefabTemplate?.data;
        if(patternNode){
            const currentIndex:number = this._currentLabelStyleIndex;
            this._currentLabelStyleIndex++;
            const labels:cc.Label[] = patternNode.getComponentsInChildren(cc.Label);
            this._currentLabelStyleIndex = this._currentLabelStyleIndex%labels.length;
            return labels[currentIndex];
        }
        return
    }

    /**
     * 
     * @param spriteNode 
     */
    protected applyImageAttibuteFromTemplate(spriteNode:cc.Node){
        const patternSprite:cc.Sprite = this.getPatternSprite();
        if(patternSprite){
            const patternNode:cc.Node = patternSprite.node;
            if(patternNode && spriteNode){
                // 
                spriteNode.scale = patternNode.scale;
                spriteNode.color = patternNode.color;
                spriteNode.opacity = patternNode.opacity;
                spriteNode.skewX = patternNode.skewX;
                spriteNode.skewY = patternNode.skewY;
                spriteNode.setAnchorPoint(new cc.Vec2(spriteNode.getAnchorPoint().x, patternNode.getAnchorPoint().y));
                // 
                let quat:cc.Quat = new cc.Quat();
                patternNode.getRotation(quat);
                spriteNode.setRotation(quat)                
                spriteNode.setContentSize(patternNode.getContentSize());
                // 
                const spriteSegment:cc.Sprite = spriteNode.getComponent(cc.Sprite);
                spriteSegment.srcBlendFactor = patternSprite.srcBlendFactor;
                spriteSegment.dstBlendFactor = patternSprite.dstBlendFactor;
                spriteSegment.trim = patternSprite.trim;
                spriteSegment.type = patternSprite.type;
                spriteSegment.sizeMode = patternSprite.sizeMode;
                patternSprite.getMaterials().forEach((material:cc.MaterialVariant, index:number)=>{
                    spriteSegment.setMaterial(index, material)
                });            
                // 
            }
        }
    }

    /**
     * 
     * @param spriteNode 
     */
    protected applyLabelAttibuteFromTemplate(labelNode:cc.Node){
        const patternLabel:cc.Label = this.getPatternLabel();
        if(patternLabel){
            const patternNode:cc.Node = patternLabel.node;
            if(patternNode && patternLabel && labelNode){
                const labelSegment:cc.Label = labelNode.getComponent(cc.Label);                
                labelSegment.horizontalAlign = patternLabel.horizontalAlign;
                labelSegment.verticalAlign = patternLabel.verticalAlign;
                labelSegment.fontSize = patternLabel.fontSize;
                labelSegment.lineHeight = patternLabel.lineHeight;
                labelSegment.overflow = patternLabel.overflow;
                labelSegment.font = patternLabel.font;
                labelSegment.enableBold = patternLabel.enableBold;
                labelSegment.enableItalic = patternLabel.enableItalic;
                labelSegment.enableUnderline = patternLabel.enableUnderline;
                labelSegment.useSystemFont = patternLabel.useSystemFont;
                if(labelSegment.useSystemFont){
                    labelSegment.fontFamily = patternLabel.fontFamily;
                }
                labelSegment.cacheMode = patternLabel.cacheMode;
                patternLabel.getMaterials().forEach((material:cc.MaterialVariant, index:number)=>{
                    labelSegment.setMaterial(index, material)
                }); 
                // 
            }
        }
    }
    
}
