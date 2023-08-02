import { _decorator, Component, Label, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('InfectedHostLabel')
export class InfectedHostLabel extends Component {

    @property(Label)
    hostLabel:Label = null;

    onTouch(){
        if(this.hostLabel){
            this.hostLabel.string = 'Label is infected !';
        }
    }

    start() {
        
    }

    update(deltaTime: number) {
        
    }
}

