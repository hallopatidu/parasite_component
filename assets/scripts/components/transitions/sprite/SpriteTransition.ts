import { _decorator, Component, log, Node, Sprite, SpriteFrame } from 'cc';
import { override, ParasiteComponent } from '../../core/ParasiteComponent';
const { ccclass, property } = _decorator;

@ccclass('SpriteTransition')
export class SpriteTransition extends ParasiteComponent<Sprite> {
    // start() {

    // }

    // update(deltaTime: number) {
    //     this.super.spriteFrame
    // }

    @override
    set spriteFrame (value:SpriteFrame) {
        log('new update')
        this.super.spriteFrame = value
    }
}

