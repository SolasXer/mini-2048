import { _decorator, Color, Component, Label, Node, Sprite } from "cc";
import { NumberColor } from "./Const";
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
        this.getComponent(Sprite).color = new Color(NumberColor[value])
    }

    hasMerged: boolean = false;
}
