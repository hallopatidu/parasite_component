
import { Label, _decorator, log } from 'cc';
import ParasiteComponent, { override } from '../../core/ParasiteComponent';

const { ccclass, property, executeInEditMode } = _decorator;

@ccclass('LabelStylizing')
@executeInEditMode(true)
export class LabelStylizing extends ParasiteComponent<Label> {

    @override
    set string(value:string){        
        this.super.string = value + ' ok ';
    }

    @override
    nonfunc(){
        log('--------- ' + Math.random())
        this.super['nonfunc']()
    }

    start() {
        
    }

    update(deltaTime: number) {
        
    }
}

