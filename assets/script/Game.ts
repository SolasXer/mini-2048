import {
    _decorator,
    Component,
    EventKeyboard,
    Input,
    input,
    instantiate,
    KeyCode,
    Label,
    Node,
    Prefab,
    random
} from "cc";
import { Number } from "./Number";
const { ccclass, property } = _decorator;

const MaxRow = 4;
const MaxCol = 4;

enum Direction {
    Left,
    Right,
    Up,
    Down,
}

@ccclass("Game")
export class Game extends Component {
    @property(Node)
    result: Node;

    @property(Node)
    resultText: Node;

    @property(Node)
    grids: Node;

    @property(Node)
    numbers: Node;

    @property(Prefab)
    prefNumber: Prefab;

    numberMatrix: Number[][] = [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
    ];

    protected onEnable(): void {
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    protected onDisable(): void {
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
    }

    start() {
        this.result.active = false;
        this.createNextNumbers();
    }

    private onKeyDown(event: EventKeyboard) {
        switch (event.keyCode) {
            case KeyCode.ARROW_UP:
                this.mergeAndJustify(Direction.Up)
                break;
            case KeyCode.ARROW_DOWN:
                this.mergeAndJustify(Direction.Down);
                break;
            case KeyCode.ARROW_LEFT:
                this.mergeAndJustify(Direction.Left);
                break;
            case KeyCode.ARROW_RIGHT:
                this.mergeAndJustify(Direction.Right);
                break;
            default:
                break;
        }
    }

    private createNextNumbers() {
        const coords: [number, number][] = [];
        for (let i = 0; i < MaxRow; i++) {
            for (let j = 0; j < MaxCol; j++) {
                if (this.numberMatrix[i][j] === null) {
                    coords.push([i, j]);
                }
            }
        }
        coords.sort(() => random() - 0.5);

        if (coords.length > 1) {
            this.createNumberAt(coords[0][0], coords[0][1]);
            random() > 0.5 && this.createNumberAt(coords[1][0], coords[1][1]);
        } else if (coords.length === 1) {
            this.createNumberAt(coords[0][0], coords[0][1]);
        }
    }

    private onGameOver() {
        this.result.active = true;
        this.resultText.getComponent(Label).string = "游戏结束";
    }

    private onWinner() {
        this.result.active = true;
        this.resultText.getComponent(Label).string = "2048"
    }

    onRestart() {
        this.numbers.destroyAllChildren();
        for (let i = 0; i < MaxRow; i++) {
            for (let j = 0; j < MaxCol; j++) {
                this.numberMatrix[i][j] = null;
            }
        }
        this.createNextNumbers();
        this.result.active = false;
    }

    private mergeAndJustify(direction: Direction) {
        this.justify(direction);
        this.merge(direction);
        this.justify(direction);
        this.resetMergedState();
        this.createNextNumbers();

        if (this.checkIfWinner()) {
            this.onWinner();
            return;
        }

        this.checkIfGameOver() && this.onGameOver();
    }

    private createNumberAt(i: number, j: number) {
        const newNumber = instantiate(this.prefNumber);
        newNumber.parent = this.numbers;
        newNumber.setWorldPosition(
            this.grids.children[MaxCol * i + j].worldPosition,
        );

        this.numberMatrix[i][j] = newNumber.getComponent(Number);
        this.numberMatrix[i][j].value = random() < 0.9 ? 2 : 4;
    }

    private updateNumberPosition(target: Number, i: number, j: number) {
        target.node.setWorldPosition(
            this.grids.children[MaxCol * i + j].worldPosition,
        );
    }

    private checkIfWinner(): boolean {
        const index = this.numbers.children.findIndex(
            chilld => chilld.getComponent(Number).value >= 2048);
        return index > -1;
    }

    private checkIfGameOver(): boolean {
        for (let rowIndex = 0; rowIndex < MaxRow; rowIndex++) {
            for (let columnIndex = 0; columnIndex < MaxCol; columnIndex++) {
                if (this.numberMatrix[rowIndex][columnIndex] === null) {
                    return false;
                }
            }
        }

        for (let rowIndex = 0; rowIndex < MaxRow; rowIndex++) {
            for (let columnIndex = 0; columnIndex < MaxCol - 1; columnIndex++) {
                const current = this.numberMatrix[rowIndex][columnIndex];
                const next = this.numberMatrix[rowIndex][columnIndex + 1];

                if (current && next && current.value === next.value) {
                    return false;
                }
            }
        }

        for (let columnIndex = 0; columnIndex < MaxCol; columnIndex++) {
            for (let rowIndex = 0; rowIndex < MaxRow - 1; rowIndex++) {
                const current = this.numberMatrix[rowIndex][columnIndex];
                const below = this.numberMatrix[rowIndex + 1][columnIndex];

                if (current && below && current.value === below.value) {
                    return false;
                }
            }
        }

        return true;
    }

    private resetMergedState() {
        for (let i = 0; i < this.numberMatrix.length; i++) {
            for (let j = 0; j < this.numberMatrix[i].length; j++) {
                if (this.numberMatrix[i][j]) {
                    this.numberMatrix[i][j].hasMerged = false;
                }
            }
        }
    }

    private justify(direction: Direction) {
        switch (direction) {
            case Direction.Left:
                for (let rowIndex = 0; rowIndex < MaxRow; rowIndex++) {
                    const currentRow = this.numberMatrix[rowIndex];
                    let firstEmptyPosition = -1;
                    for (let columnIndex = 0; columnIndex < MaxCol; columnIndex++) {
                        if (currentRow[columnIndex] === null) {
                            firstEmptyPosition = columnIndex;
                            break;
                        }
                    }

                    if (firstEmptyPosition === -1) {
                        continue;
                    }

                    let searchIndex = firstEmptyPosition + 1;
                    while (searchIndex < MaxCol) {
                        if (currentRow[searchIndex] !== null) {
                            currentRow[firstEmptyPosition] = currentRow[searchIndex];
                            currentRow[searchIndex] = null;
                            this.updateNumberPosition(currentRow[firstEmptyPosition], rowIndex, firstEmptyPosition);
                            firstEmptyPosition++;
                        }
                        searchIndex++;
                    }
                }
                break;

            case Direction.Right:
                for (let rowIndex = 0; rowIndex < MaxRow; rowIndex++) {
                    const currentRow = this.numberMatrix[rowIndex];
                    let rightmostEmptyPosition = -1;
                    for (let columnIndex = MaxCol - 1; columnIndex >= 0; columnIndex--) {
                        if (currentRow[columnIndex] === null) {
                            rightmostEmptyPosition = columnIndex;
                            break;
                        }
                    }

                    if (rightmostEmptyPosition === -1) {
                        continue;
                    }

                    let searchIndex = rightmostEmptyPosition - 1;
                    while (searchIndex >= 0) {
                        if (currentRow[searchIndex] !== null) {
                            currentRow[rightmostEmptyPosition] = currentRow[searchIndex];
                            currentRow[searchIndex] = null;
                            this.updateNumberPosition(currentRow[rightmostEmptyPosition], rowIndex, rightmostEmptyPosition);
                            rightmostEmptyPosition--;
                        }
                        searchIndex--;
                    }
                }
                break;

            case Direction.Up:
                for (let columnIndex = 0; columnIndex < MaxCol; columnIndex++) {
                    let topEmptyPosition = -1;
                    for (let rowIndex = 0; rowIndex < MaxRow; rowIndex++) {
                        if (this.numberMatrix[rowIndex][columnIndex] === null) {
                            topEmptyPosition = rowIndex;
                            break;
                        }
                    }

                    if (topEmptyPosition === -1) {
                        continue;
                    }

                    let searchIndex = topEmptyPosition + 1;
                    while (searchIndex < MaxRow) {
                        if (this.numberMatrix[searchIndex][columnIndex] !== null) {
                            this.numberMatrix[topEmptyPosition][columnIndex] = this.numberMatrix[searchIndex][columnIndex];
                            this.numberMatrix[searchIndex][columnIndex] = null;
                            this.updateNumberPosition(this.numberMatrix[topEmptyPosition][columnIndex], topEmptyPosition, columnIndex);
                            topEmptyPosition++;
                        }
                        searchIndex++;
                    }
                }
                break;

            case Direction.Down:
                for (let columnIndex = 0; columnIndex < MaxCol; columnIndex++) {
                    let bottomEmptyPosition = -1;
                    for (let rowIndex = MaxRow - 1; rowIndex >= 0; rowIndex--) {
                        if (this.numberMatrix[rowIndex][columnIndex] === null) {
                            bottomEmptyPosition = rowIndex;
                            break;
                        }
                    }

                    if (bottomEmptyPosition === -1) {
                        continue;
                    }

                    let searchIndex = bottomEmptyPosition - 1;
                    while (searchIndex >= 0) {
                        if (this.numberMatrix[searchIndex][columnIndex] !== null) {
                            this.numberMatrix[bottomEmptyPosition][columnIndex] = this.numberMatrix[searchIndex][columnIndex];
                            this.numberMatrix[searchIndex][columnIndex] = null;
                            this.updateNumberPosition(this.numberMatrix[bottomEmptyPosition][columnIndex], bottomEmptyPosition, columnIndex);
                            bottomEmptyPosition--;
                        }
                        searchIndex--;
                    }
                }
                break;

            default:
                break;
        }
    }

    private merge(direction: Direction) {
        switch (direction) {
            case Direction.Left:
                for (let rowIndex = 0; rowIndex < MaxRow; rowIndex++) {
                    const currentRow = this.numberMatrix[rowIndex];
                    for (let first = 0, second = 1; first < MaxCol && second < MaxCol; first++, second++) {
                        if (currentRow[first] === null || currentRow[second] === null) {
                            continue;
                        }

                        if (currentRow[first].hasMerged || currentRow[second].hasMerged) {
                            continue;
                        }

                        if (currentRow[first].value === currentRow[second].value) {
                            currentRow[first].hasMerged = true;
                            currentRow[first].value *= 2;
                            currentRow[second].hasMerged = true;
                            currentRow[second].node.destroy();
                            currentRow[second] = null;
                        }
                    }
                }
                break;

            case Direction.Right:
                for (let rowIndex = 0; rowIndex < MaxRow; rowIndex++) {
                    const currentRow = this.numberMatrix[rowIndex];
                    for (let first = MaxCol - 1, second = MaxCol - 2; first >= 0 && second >= 0; first--, second--) {
                        if (currentRow[first] === null || currentRow[second] === null) {
                            continue;
                        }

                        if (currentRow[first].hasMerged || currentRow[second].hasMerged) {
                            continue;
                        }

                        if (currentRow[first].value === currentRow[second].value) {
                            currentRow[first].hasMerged = true;
                            currentRow[first].value *= 2;
                            currentRow[second].hasMerged = true;
                            currentRow[second].node.destroy();
                            currentRow[second] = null;
                        }
                    }
                }
                break;

            case Direction.Up:
                for (let columnIndex = 0; columnIndex < MaxCol; columnIndex++) {
                    for (let first = 0, second = 1; first < MaxRow && second < MaxRow; first++, second++) {
                        if (this.numberMatrix[first][columnIndex] === null || this.numberMatrix[second][columnIndex] === null) {
                            continue;
                        }

                        if (this.numberMatrix[first][columnIndex].hasMerged || this.numberMatrix[second][columnIndex].hasMerged) {
                            continue;
                        }

                        if (this.numberMatrix[first][columnIndex].value === this.numberMatrix[second][columnIndex].value) {
                            this.numberMatrix[first][columnIndex].hasMerged = true;
                            this.numberMatrix[first][columnIndex].value *= 2;
                            this.numberMatrix[second][columnIndex].hasMerged = true;
                            this.numberMatrix[second][columnIndex].node.destroy();
                            this.numberMatrix[second][columnIndex] = null;
                        }
                    }
                }
                break;

            case Direction.Down:
                for (let columnIndex = 0; columnIndex < MaxCol; columnIndex++) {
                    for (let first = MaxRow - 1, second = MaxRow - 2; first >= 0 && second >= 0; first--, second--) {
                        if (this.numberMatrix[first][columnIndex] === null || this.numberMatrix[second][columnIndex] === null) {
                            continue;
                        }

                        if (this.numberMatrix[first][columnIndex].hasMerged || this.numberMatrix[second][columnIndex].hasMerged) {
                            continue;
                        }

                        if (this.numberMatrix[first][columnIndex].value === this.numberMatrix[second][columnIndex].value) {
                            this.numberMatrix[first][columnIndex].hasMerged = true;
                            this.numberMatrix[first][columnIndex].value *= 2;
                            this.numberMatrix[second][columnIndex].hasMerged = true;
                            this.numberMatrix[second][columnIndex].node.destroy();
                            this.numberMatrix[second][columnIndex] = null;
                        }
                    }
                }
                break;

            default:
                break;
        }
    }

}
