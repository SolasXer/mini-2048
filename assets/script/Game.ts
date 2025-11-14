import {
    _decorator,
    Component,
    EventKeyboard,
    Input,
    input,
    instantiate,
    KeyCode,
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
        coords.sort(() => random() - 0.5); //随机排序

        if (coords.length > 1) {
            this.createNumberAt(coords[0][0], coords[0][1]);
            this.createNumberAt(coords[1][0], coords[1][1]);
        } else if (coords.length === 1) {
            this.createNumberAt(coords[0][0], coords[0][1]);
        }
    }

    private gameOver() {
        console.log("Game Over");
    }

    private mergeAndJustify(direction: Direction) {
        this.justify(direction);
        this.merge(direction);
        this.justify(direction);
        this.resetMergedState();
        this.createNextNumbers();
        this.testIfGameOver() && this.gameOver();
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

    private updateNumberPosition(num: Number, i: number, j: number) {
        num.node.setWorldPosition(
            this.grids.children[MaxCol * i + j].worldPosition,
        );
    }

    /**
     * 检查游戏是否结束
     * 游戏结束条件：上下左右四个方向都没有可以两两合并的数字了
     * @returns 如果游戏结束返回true，否则返回false
     */
    private testIfGameOver(): boolean {
        // 检查是否有空位
        for (let rowIndex = 0; rowIndex < MaxRow; rowIndex++) {
            for (let columnIndex = 0; columnIndex < MaxCol; columnIndex++) {
                if (this.numberMatrix[rowIndex][columnIndex] === null) {
                    return false; // 还有空位，游戏继续
                }
            }
        }

        // 检查水平方向（左右）是否有可合并的相邻方块
        for (let rowIndex = 0; rowIndex < MaxRow; rowIndex++) {
            for (let columnIndex = 0; columnIndex < MaxCol - 1; columnIndex++) {
                const current = this.numberMatrix[rowIndex][columnIndex];
                const next = this.numberMatrix[rowIndex][columnIndex + 1];

                if (current && next && current.value === next.value) {
                    return false; // 有可合并的相邻方块，游戏继续
                }
            }
        }

        // 检查垂直方向（上下）是否有可合并的相邻方块
        for (let columnIndex = 0; columnIndex < MaxCol; columnIndex++) {
            for (let rowIndex = 0; rowIndex < MaxRow - 1; rowIndex++) {
                const current = this.numberMatrix[rowIndex][columnIndex];
                const below = this.numberMatrix[rowIndex + 1][columnIndex];

                if (current && below && current.value === below.value) {
                    return false; // 有可合并的相邻方块，游戏继续
                }
            }
        }

        // 所有条件都不满足，游戏结束
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
                // 向右合并：从右向左遍历，合并相邻相同方块
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
                // 向上合并：按列处理，从上向下合并相邻相同方块
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
                // 向下合并：按列处理，从下向上合并相邻相同方块
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
