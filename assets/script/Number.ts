import { _decorator, Component, Node, Label, Sprite, Color } from "cc";
const { ccclass, property } = _decorator;

@ccclass("Number")
export class Number extends Component {
    @property(Node)
    private text: Node;

    private _value: number = 0;

    get value() {
        return this._value;
    }

    set value(value: number) {
        this._value = value;
        this.text.getComponent(Label).string = `${value}`;
        // this.node.getComponent(Sprite).color 
    }

    hasMerged: boolean = false;
}
