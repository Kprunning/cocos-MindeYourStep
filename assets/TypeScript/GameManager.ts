import {_decorator, Component, instantiate, Label, Node, Prefab, Vec3} from 'cc'
import {PlayerController} from './PlayerController'

const {ccclass, property} = _decorator

// 赛道格子类型,坑(BT_NONE)或者实路(BT_STONE)
enum BlockType {
  BT_NONE,
  BT_STONE
}

// 游戏状态
// 初始化（Init）：显示游戏菜单，初始化一些资源。
// 游戏进行中（Playing）：隐藏游戏菜单，玩家可以操作角色进行游戏。
// 结束（End）：游戏结束，显示结束菜单。
enum GameState {
  GS_INIT,
  GS_PLAYING,
  GS_END
}

@ccclass('GameManager')
export class GameManager extends Component {
  // 赛道预制
  @property({type: Prefab})
  public cubePrefab: Prefab | null = null

  // 赛道长度
  @property
  public roadLength = 50

  @property({type: PlayerController})
  public playerCtrl: PlayerController | null = null

  @property({type: Node})
  public startMenu: Node | null = null

  @property({type: Label})
  public stepsLabel: Label | null = null

  private _road: BlockType[] = []


  generateRoad() {
    // 防止游戏重开时,赛道还是旧的赛道
    // 因此需要移出旧赛道数据
    this.node.removeAllChildren()
    this._road = []
    // 确保游戏运行时,人物一定站在实路上
    this._road.push(BlockType.BT_STONE)

    // 确定好每一格赛道类型
    for (let i = 1; i < this.roadLength; i++) {
      // 如果上一格赛道是坑,下一格一定不能为坑
      if (this._road[i - 1] === BlockType.BT_NONE) {
        this._road.push(BlockType.BT_STONE)
      } else {
        this._road.push(Math.floor(Math.random() * 2))
      }
    }

    // 根据赛道类型生成赛道
    for (let i = 0; i < this._road.length; i++) {
      let block: Node = this.spawnBlockByType(this._road[i])
      // 判断是否生成了道路,因为spawnBlockByType有可能返回坑(值为null)
      if (block) {
        this.node.addChild(block)
        block.setPosition(i, -1.5, 0)
      }
    }
  }

  spawnBlockByType(type: BlockType) {
    if (!this.cubePrefab) {
      return null
    }

    let block: Node | null = null
    // 赛道类型为实路才生成
    switch (type) {
      case BlockType.BT_STONE:
        block = instantiate(this.cubePrefab)
        break
    }
    return block
  }

  init() {
    // 激活主界面
    if (this.startMenu) {
      this.startMenu.active = true
    }
    // 生成赛道
    this.generateRoad()
    if (this.playerCtrl) {
      // 禁止接受用户操作任务移动指令
      this.playerCtrl.setInputActive(false)
      // 重置人物位置
      this.playerCtrl.node.setPosition(Vec3.ZERO)
    }
    this.playerCtrl.reset()
  }

  set curState(value: GameState) {
    switch (value) {
      case GameState.GS_INIT:
        this.init()
        break
      case GameState.GS_PLAYING:
        if (this.startMenu) {
          this.startMenu.active = false
        }
        // 清空上局分数
        if (this.stepsLabel) {
          this.stepsLabel.string = '0'
        }
        // 设置active为true时会直接开始监听鼠标事件,此时鼠标抬起事件还未派发
        // 会出现的现象就是,游戏开始的瞬间人物已经开始移动
        // 因此,这里需要做有延迟处理
        setTimeout(() => {
          if (this.playerCtrl) {
            this.playerCtrl.setInputActive(true)
          }
        }, 0.1)
        break
      case GameState.GS_END:
        break
    }
  }

  // 开始按钮事件
  onStartButtonClicked() {
    this.curState = GameState.GS_PLAYING
  }

  // 监听角色跳跃结束事件,并根据规则判断输赢,增加失败和结束判断,
  // 如果跳到空方块或是超过了最大长度值都结束
  checkResult(moveIndex: number) {
    if (moveIndex < this.roadLength) {
      // 跳到了坑上
      if (this._road[moveIndex] == BlockType.BT_NONE) {
        this.curState = GameState.GS_INIT
      }
    } else {
      this.curState = GameState.GS_INIT
    }
  }

  onPlayJumpEnd(moveIndex: number) {
    if (this.stepsLabel) {
      this.stepsLabel.string = '' + (moveIndex > this.roadLength ? this.roadLength : moveIndex)
    }
    this.checkResult(moveIndex)
  }


  start() {
    this.curState = GameState.GS_INIT
    // 监听角色跳跃消息,并调用判断函数, ?.可选链接写法
    this.playerCtrl?.node.on('JumpEnd', this.onPlayJumpEnd, this)
  }


  update(deltaTime: number) {

  }
}


