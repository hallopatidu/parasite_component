import { _decorator, Component, instantiate, log, Node, Sprite, SpriteFrame, tween, UITransform, v3, Vec3 } from 'cc';
import { override, ParasiteComponent } from '../../core/ParasiteComponent';
const { ccclass, property } = _decorator;

const EffectLayerName:string = 'effect_layer';

@ccclass('BasicTransition')
export class BasicTransition extends ParasiteComponent<Sprite> {

    protected isReady:boolean = true
   
    @override
    set spriteFrame (value:SpriteFrame) {
        if(this.isReady){
            this.isReady = false
            log('new update')
            let effectNode:Node = this.getEffectNode()
            const effecSprite:Sprite = effectNode.getComponent(Sprite);
            effecSprite.spriteFrame = this.super.spriteFrame;
            const startPos:Vec3 = this.node.getPosition();
            const targetPos:Vec3 = startPos.clone().add(v3(0,500,0));
            tween(effectNode).set({position:startPos}).to(0.5, {position:targetPos})
            .call(()=>{
                effecSprite.spriteFrame = null;
                effectNode.active = false;
                this.isReady = true
            })
            .start();
            this.super.spriteFrame = value;
        }
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
        return effectNode
    }
}

