import { _decorator, Component, instantiate, log, Node, Size, Sprite, SpriteFrame, Tween, tween, UITransform, v3, Vec3 } from 'cc';
import ParasiteComponent, { override } from '../../core/ParasiteComponent';

const { ccclass, property, executeInEditMode } = _decorator;

const EffectLayerName:string = 'effect_layer';

@ccclass('BasicTransition')
@executeInEditMode(true)
export class BasicTransition extends ParasiteComponent<Sprite> {

    protected isReady:boolean = true
   
    @override
    set spriteFrame (value:SpriteFrame) {        
        if(this.enabled && this.isReady){
            this.isReady = false;
            let effectNode:Node = this.getEffectNode()
            const effecSprite:Sprite = effectNode.getComponent(Sprite);
            effecSprite.spriteFrame = this.super.spriteFrame;
            const startPos:Vec3 = this.node.getPosition();   
            const uiTranform:UITransform = this.node.getComponent(UITransform)         
            const targetPos:Vec3 = startPos.clone().add(v3(uiTranform.contentSize.width,0,0));
            const tweenNode:Tween<Node> = tween(effectNode).set({position:startPos}).to(0.5, {position:targetPos})
            .call(()=>{
                effecSprite.spriteFrame = null;
                effectNode.active = false;
                effectNode.removeFromParent();
                tweenNode.removeSelf()
                this.isReady = true;                
            })
            .start();
        }        
        this.super.spriteFrame = value;
    }

    protected getEffectNode():Node{
        const startPos:Vec3 = this.node.getPosition();
        let effectNode:Node = this.node.getChildByName(EffectLayerName);
        if(!effectNode){
            effectNode = instantiate<Node>(this.node);            
            effectNode.getComponent(BasicTransition).destroy();
            effectNode.parent = this.node;
        }
        effectNode.active = true;
        effectNode.setPosition(startPos);
        const uiTranform:UITransform = effectNode.getComponent(UITransform)      
        uiTranform.setContentSize(this.aligning(effectNode, this.node));
        return effectNode;
    }

    protected aligning(targetNode:Node, patternNode:Node, isCover:boolean = false):Size{
        const target:Size = (targetNode.getComponent(UITransform) || targetNode.addComponent(UITransform)).contentSize;
        const pattern:Size = (patternNode.getComponent(UITransform) || patternNode.addComponent(UITransform)).contentSize;
        const heightRatio:number = target.height/pattern.height;
        const widthRatio:number = target.width/pattern.width;
        return (widthRatio > heightRatio)!==isCover ? new Size(pattern.width, target.height*(1/widthRatio)) : new Size(target.width*(1/heightRatio), pattern.height);        
    }
}

