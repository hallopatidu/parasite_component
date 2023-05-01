import { _decorator, Component, Node, Sprite, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('GradualTransitionalAlbum')
export class GradualTransitionalAlbum extends Component {

    @property({
        type:Sprite
    })
    imageAlbum:Sprite = null
    
    @property({
        type:[SpriteFrame]
    })
    imageDatas:SpriteFrame[] = []

    nextImageHandler(){
        if(this.imageDatas.length){
            const spriteFrame:SpriteFrame = this.imageDatas[0];
            this.imageAlbum.spriteFrame = spriteFrame
            this.imageDatas.push(this.imageDatas.shift())
            
        }
    }

}

