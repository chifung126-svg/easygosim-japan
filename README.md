# EasyGoSim Japan Landing Page V1

以 UI Guide 為視覺基準製作的日本市場第一版產品 Landing Page prototype。

## 已包含

- 全日文 UI、SEO title/meta/canonical
- `マレーシア eSIM` 核心 H1
- `現地電話番号付き` 核心 SEO 賣點
- 7日間50GB、15日間150GB、30日間300GB 套餐選擇器
- 首屏 CTA、Proof Strip、Why EasyGoSim、規格表、三步安裝、FAQ、Mobile Sticky Buy Bar
- Product JSON-LD 基礎結構化資料
- 可連接 Rainway / Supabase 的 data attribute 與 variant 位置

## 尚待接入

- Supabase product / variant / order data
- Airwallex checkout session
- Airwallex webhook
- eSIM API provisioning
- Email API QR delivery
- Rainway hosting / admin UI

## 重要資料規則

目前只使用已確認的 7日間50GB、¥1,980，以及「現地電話番号・通話付き」賣點。15日間及30日間的價格保留為 `data-price` 空值，待 Supabase 或 eSIM API 提供正式價格後再顯示，避免前台出現未核實資料。
