import {_decorator, Animation, Component, EventMouse, Input, input, Vec3} from 'cc'

const {ccclass, property} = _decorator


@ccclass('PlayerController')
export class PlayerController extends Component {
  // 是否接受到跳跃指令
  private _startJump: boolean = false
  // 跳跃步长
  private _jumpStep: number = 0
  // 当前跳跃时间
  private _curJumpTime: number = 0
  // 每次跳跃时长
  private _jumpTime: number = 0.3
  // 当前跳跃速度
  private _curJumpSpeed: number = 0
  // 当前角色位置
  private _curPos: Vec3 = new Vec3()
  // 每次跳跃过程中,当前帧移动位置差
  private _deltaPos: Vec3 = new Vec3(0, 0, 0)
  // 角色目标位置
  private _targetPos: Vec3 = new Vec3()
  // 累计跳的步数
  private _curMoveIndex: number = 0


  @property({type: Animation})
  public BodyAnim: Animation | null = null


  setInputActive(active: boolean) {
    if (active) {
      input.on(Input.EventType.MOUSE_UP, this.onMouseUp, this)
    } else {
      input.off(Input.EventType.MOUSE_UP, this.onMouseUp, this)
    }
  }


  onMouseUp(event: EventMouse) {
    if (event.getButton() === 0) {
      this.jumpByStep(1)
    } else if (event.getButton() === 2) {
      this.jumpByStep(2)
    }
  }

  jumpByStep(step: number) {
    if (this._startJump) {
      return
    }
    if (this.BodyAnim) {
      if (step === 1) {
        this.BodyAnim.play('oneStep')
      } else if (step === 2) {
        this.BodyAnim.play('twoStep')
      }
    }
    this._startJump = true
    this._jumpStep = step
    this._curJumpTime = 0
    this._curJumpSpeed = this._jumpStep / this._jumpTime
    this.node.getPosition(this._curPos)
    Vec3.add(this._targetPos, this._curPos, new Vec3(this._jumpStep, 0, 0))
    this._curMoveIndex += step
  }

  onOnceJumpEnd() {
    this.node.emit('JumpEnd', this._curMoveIndex)
  }

  // 游戏重开,重置属性
  reset() {
    this._curMoveIndex = 0
  }

  update(deltaTime: number) {
    if (this._startJump) {
      this._curJumpTime += deltaTime
      if (this._curJumpTime > this._jumpTime) {
        this.node.setPosition(this._targetPos)
        this._startJump = false
        this.onOnceJumpEnd()
      } else {
        this.node.getPosition(this._curPos)
        this._deltaPos.x = this._curJumpSpeed * deltaTime
        Vec3.add(this._curPos, this._curPos, this._deltaPos)
        this.node.setPosition(this._curPos)
      }
    }
  }
}


