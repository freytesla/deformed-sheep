# 旧牧场 · 畸形羊

一个 PS2 风格 low poly 的 3D 牧场小品。夜里走进旧牧场，看几只形态不太对劲的羊——原型、双头、八腿，各是一只独立建模的羊。

纯静态页面，用 three.js 手写场景，没有构建步骤。

**在线试玩：** https://freytesla.github.io/deformed-sheep/

![旧牧场 · 八腿羊](docs/screenshot.png)

## 玩法

| 操作 | 说明 |
| --- | --- |
| 拖动 / 滚轮 | 环绕观察、拉近拉远 |
| `W` `A` `S` `D` | 走进牧场后自由行走 |
| `E` | 与羊或食槽互动（抚摸、添草） |
| `C` | 呼唤羊 / 咩叫 |
| `F` | 开/关夜里的手电 |
| `V` | 回到全景视角 |
| `Esc` | 释放鼠标 |

左下角面板可以在三种形态间切换：**普通羊**（原型参照）、**双头羊**（暖白厚毛）、**八腿羊**（灰毛长躯）。

点「控制羊」进入第三人称控制：`W` 前进、`S` 缓慢后退，`A` / `D` 在行进中转弯并沿弧线移动；控制期间自动行走会停止，围栏、食槽和牧场内登记的障碍会挡住羊。点「近看人物」可以去看牧场里那个没有脸的牧场主人。

## 本地运行

因为要用 `fetch` 读取模型，直接双击 `index.html` 在部分浏览器下会被本地文件策略拦住，建议起一个静态服务器：

```bash
python -m http.server 8000
# 然后打开 http://127.0.0.1:8000/
```

## 结构

```
index.html                  页面与 UI
scene.js                    场景、光照、玩家控制、相机
materials.js                地面/木头/金属/干草的程序化材质贴图
sheep-motion.js             羊的骨架步态（腿的摆动与落蹄）
sheep-navigation.js         羊的寻路与移动
sheep-variants.js           三种形态的装载、切换与骨骼驱动
assets/faceless-caretaker.glb   无脸牧场主人
assets/sheep-double.glb     双头羊
assets/sheep-eight.glb      八腿羊
sheep/source/sheep.glb      原型羊（自带一段约 8.4 秒的动画）
materials/*.png             材质贴图
vendor/                     three.js r128 与 GLTFLoader（MIT）
```

## 三种形态是怎么做出来的

每只羊都是一只完整、连续蒙皮的模型，各自带骨骼：

- **双头羊**的第二个头用独立的骨骼前缀（`head0*` / `head1*`）驱动，运行时把这些骨骼相对原型头部骨骼的位移与旋转差值镜像过去，所以两颗头共享呼吸、转向和进食动作，同时各自保留轻微的独立摆动。
- **八腿羊**在腹部多出两对腿，用额外的步态求解器并错开相位（`phaseOffset`），避免八条腿同时起落；关节仍保留前后弯曲限制，不会向侧面折。
- 切换形态只是切换可见性并复位步态，不做运行时网格拼接。

Blender 源文件（`.blend`）、albedo 贴图和 topology 中间产物**没有**放进仓库——网页运行时用不到，三个 `glb` 的贴图与缓冲区都是内嵌的。

## 许可

场景代码为本项目所有。随仓库分发的 three.js 及其 GLTFLoader 遵循 MIT 许可，见 `vendor/THREE-LICENSE.txt`。
