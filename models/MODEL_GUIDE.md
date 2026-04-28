# MagicaVoxel → NiX Garden 模型導入指南

## 快速流程

1. 在 MagicaVoxel 做好模型
2. 點右下 **Export → obj** (會產生 `xxx.obj` + `xxx.mtl` + `xxx.png`)
3. 把這 **三個檔案** 一起拉進 `NiX_Garden/models/` 資料夾
4. 檔名必須跟下表的 ID 一致（例如櫻花樹 → `sakura.obj` + `sakura.mtl` + `sakura.png`）
5. 重新整理瀏覽器 → 自動載入你的模型

## MagicaVoxel 匯出設定

- Export format: **obj**
- MagicaVoxel 會自動生成 `.mtl`（材質）和 `.png`（調色盤貼圖）
- 三個檔案要放在同一個 `models/` 資料夾

## MagicaVoxel 建模注意

- 畫布建議: 植物 32×32×32，大樹/家具 64×64×64
- 模型中心放在畫布底部中央（遊戲會自動置中）
- 顏色直接在 MagicaVoxel 調色盤上畫，匯出會自動帶出來

## 檔名對照表

### 植物 (Plants)
| ID | 名稱 | 檔名 |
|----|------|------|
| carrot | 胡蘿蔔 | `carrot.obj` |
| scallion | 蔥 | `scallion.obj` |
| onion | 洋蔥 | `onion.obj` |
| tomato | 番茄 | `tomato.obj` |
| strawberry | 草莓 | `strawberry.obj` |
| blueberry | 藍莓 | `blueberry.obj` |
| corn | 玉米 | `corn.obj` |
| sunflowerB | 向日葵 | `sunflowerB.obj` |
| pumpkin | 南瓜 | `pumpkin.obj` |
| sakura | 櫻花樹 | `sakura.obj` |
| pinecone | 松果 | `pinecone.obj` |
| willow | 柳樹 | `willow.obj` |
| giantSakura | 巨大櫻花樹 | `giantSakura.obj` |
| giantPine | 巨大松樹 | `giantPine.obj` |
| butterfly | 蝴蝶草 | `butterfly.obj` |
| demonFruit | 惡魔果實 | `demonFruit.obj` |
| moonLotus | 月蓮 | `moonLotus.obj` |
| hemp | 大麻樹 | `hemp.obj` |

### 家具 (Furniture)
| ID | 名稱 | 檔名 |
|----|------|------|
| chair | 椅子 | `chair.obj` |
| table | 桌子 | `table.obj` |
| window | 窗戶 | `window.obj` |
| door | 門 | `door.obj` |
| cobble | 石子路 | `cobble.obj` |
| pond | 池塘 | `pond.obj` |
| japanese_house | 和風小屋 | `japanese_house.obj` |
| tea_house | 茶室 | `tea_house.obj` |
| jump_ramp | 小跳台 | `jump_ramp.obj` |
| big_jump | 大跳台 | `big_jump.obj` |
| chairlift | 纜車椅 | `chairlift.obj` |
| snow_cannon | 造雪機 | `snow_cannon.obj` |

### 動物 (Animals)
| LV | 名稱 | 檔名 |
|----|------|------|
| 1 | 兔 | `animal_lv1.obj` |
| 2 | 狐狸 | `animal_lv2.obj` |
| 3 | 鷹 | `animal_lv3.obj` |
| 4 | 芬尼爾 | `animal_lv4.obj` |

## 模型尺寸參考

遊戲內 1 格 = 1.0 單位。MagicaVoxel 的 1 voxel ≈ 0.05 遊戲單位。

| 類型 | MagicaVoxel 建議畫布 | 遊戲內大約尺寸 |
|------|---------------------|---------------|
| D 級小菜 | 16×16×16 | 0.8 × 0.8 |
| C/B 級植物 | 24×24×24 | 1.2 × 1.2 |
| A 級樹木 | 32×32×48 | 1.6 × 2.4 |
| S/SS 級巨樹 | 48×48×64 | 2.4 × 3.2 |
| 小家具 | 16×16×16 | 0.8 × 0.8 |
| 大建築 | 64×64×64 | 3.2 × 3.2 |
| 動物 | 16×16×16 | 0.8 × 0.8 |
