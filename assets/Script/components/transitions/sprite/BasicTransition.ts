// Learn TypeScript:
//  - https://docs.cocos.com/creator/manual/en/scripting/typescript.html
// Learn Attribute:
//  - https://docs.cocos.com/creator/manual/en/scripting/reference/attributes.html
// Learn life-cycle callbacks:
//  - https://docs.cocos.com/creator/manual/en/scripting/life-cycle-callbacks.html



import ParasiteComponent, {override} from "../../core/ParasiteComponent";

const {ccclass, property, executeInEditMode} = cc._decorator;
const EffectLayerName:string = 'effect_layer_node'

@ccclass
@executeInEditMode
export default class BasicTransition extends ParasiteComponent<cc.Sprite> {

    protected isReady:boolean = true
   
    @override
    set spriteFrame (value:cc.SpriteFrame) {
        const lastSpriteFrame:cc.SpriteFrame = this.super.spriteFrame
        if(this.isReady && lastSpriteFrame){
            this.isReady = false
            let effectNode:cc.Node = this.getEffectNode();
            const effecSprite:cc.Sprite = effectNode.getComponent(cc.Sprite);
            const asuper:any = this.super;
            effecSprite.spriteFrame = this.super.spriteFrame;
            const startPos:cc.Vec3 = this.node.position.clone();
            const targetPos:cc.Vec3 = startPos.clone().add(new cc.Vec3(0,500,0));
            cc.tween(effectNode).set({position:startPos})
            .to(0.5, {position:targetPos})
            .call(()=>{
                effecSprite.spriteFrame = null;
                effectNode.active = false;
                this.isReady = true
            })
            .start();
            this.super.spriteFrame = value;
        }else{
            this.super.spriteFrame = value;
        }
    }
    

    protected getEffectNode():cc.Node{
        const startPos:cc.Vec3 = this.node.position.clone();
        let effectNode:cc.Node = this.node.getChildByName(EffectLayerName);
        if(!effectNode){
            effectNode = cc.instantiate<cc.Node>(this.node);
            effectNode.getComponent(BasicTransition)?.destroy();
            effectNode.parent = this.node;            
        }
        effectNode.active = true;
        effectNode.setPosition(startPos);
        return effectNode
    }
}
