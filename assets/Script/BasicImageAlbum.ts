import signalR = require("../../packages/@microsoft/signalr/dist/esm");

const {ccclass, property} = cc._decorator;

@ccclass
export default class BasicImageAlbum extends cc.Component {

    @property({
        type:cc.Sprite
    })
    imageAlbum:cc.Sprite = null
    
    @property({
        type:[cc.SpriteFrame]
    })
    imageDatas:cc.SpriteFrame[] = []

    nextImageHandler(){
        if(this.imageDatas.length){
            const spriteFrame:cc.SpriteFrame = this.imageDatas[0];
            this.imageAlbum.spriteFrame = spriteFrame
            this.imageDatas.push(this.imageDatas.shift())            
            
        }
    }
}
