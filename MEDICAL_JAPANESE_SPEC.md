# Medical Japanese Content Specification

## 1. Purpose

This file defines what medical Japanese content must exist in the product.

The objective is not merely vocabulary recognition.

The learner should be able to:
- understand Japanese patients,
- ask clinically useful questions,
- explain care clearly,
- and recognize Japanese medical terminology used by staff and documents.

---

# 2. Every clinical topic should teach three registers

## Register A: Medical professional term

Example:
- 心筋梗塞

## Register B: Standard patient-facing Japanese

Example:
- 心臓の血管が詰まる病気

## Register C: Everyday patient expression

Example:
- 胸が締め付けられる感じがします

The UI should display these separately.

---

# 3. Core history-taking phrases

The database should eventually include multiple natural variants for every intent.

## Opening

- 本日担当する医師の〇〇です。
- 今日はどうされましたか。
- 一番つらい症状は何ですか。
- 日本語での診察で大丈夫ですか。
- 必要であれば通訳を手配できます。

## Onset

- いつからですか。
- いつ頃から症状が始まりましたか。
- 急に始まりましたか、それとも徐々にですか。

## Location

- どこが痛みますか。
- 指で一番痛い場所を示していただけますか。
- 痛みは他の場所に広がりますか。

## Severity

- 痛みを0から10で表すと、今はいくつくらいですか。
- 一番ひどい時はどのくらいですか。

## Character

- どのような痛みですか。
- ズキズキしますか。
- 締め付けられる感じですか。
- 刺すような痛みですか。
- 焼けるような感じですか。

## Timing

- 症状はずっと続いていますか。
- 良くなったり悪くなったりしますか。
- 一回の症状はどのくらい続きますか。

## Aggravating / relieving

- 何をすると悪化しますか。
- 何をすると楽になりますか。
- 食事と関係がありますか。
- 運動すると悪化しますか。

---

# 4. Past medical history

Content categories:
- hypertension
- diabetes
- dyslipidemia
- heart disease
- stroke
- asthma
- COPD
- kidney disease
- liver disease
- tuberculosis
- cancer
- surgery
- hospitalization

Example patterns:

- 今までに大きな病気をされたことはありますか。
- 高血圧と言われたことはありますか。
- 糖尿病はありますか。
- 手術を受けたことはありますか。
- 入院したことはありますか。

---

# 5. Medication and allergy

## Medication

- 現在飲んでいる薬はありますか。
- 毎日飲んでいる薬はありますか。
- お薬手帳はお持ちですか。
- 最後に薬を飲んだのはいつですか。

## Allergy

- 薬のアレルギーはありますか。
- 食べ物のアレルギーはありますか。
- 以前、薬を飲んで発疹や息苦しさが出たことはありますか。

---

# 6. Social history

- タバコは吸いますか。
- 一日に何本くらい吸いますか。
- お酒は飲みますか。
- 普段どのくらい飲みますか。
- お仕事は何をされていますか。
- 最近海外に行かれましたか。

---

# 7. Physical examination instructions

The content database should include polite and short clinical commands.

Examples:

- ベッドに横になってください。
- 仰向けになってください。
- うつ伏せになってください。
- 座ってください。
- 深呼吸してください。
- 息を吸ってください。
- 息を吐いてください。
- 息を止めてください。
- 口を大きく開けてください。
- 力を抜いてください。
- 痛いところがあれば教えてください。
- ここは痛いですか。
- 手を握ってください。
- 腕を上げてください。
- 足を曲げてください。
- 目で指を追ってください。

---

# 8. Investigations

Must include terminology and explanations for:

### Basic
- 血液検査
- 尿検査
- 便検査

### Cardiac
- 心電図
- 心エコー
- 心筋マーカー

### Imaging
- レントゲン
- 超音波検査
- CT検査
- MRI検査

### Procedures
- 内視鏡
- 生検
- 腰椎穿刺

Example explanation pattern:

- 原因を調べるために血液検査を行います。
- 心臓の状態を確認するために心電図を取ります。
- CT検査で体の中を詳しく確認します。

---

# 9. Diagnosis explanation framework

Every disease page should include a plain-language explanation template:

1. What the condition is
2. What may have caused it
3. How certain the diagnosis is
4. What tests support it
5. What treatment is recommended
6. What the patient should watch for

Useful patterns:

- 検査の結果、〇〇の可能性が高いです。
- 現時点では〇〇が最も考えられます。
- ただし、〇〇の可能性もあるため追加検査が必要です。
- この病気は〜によって起こります。
- 今のところ重症な所見はありません。

---

# 10. Treatment explanation

Examples:

- 痛み止めを使います。
- 抗菌薬を開始します。
- 点滴を行います。
- 水分を十分に取ってください。
- 安静にしてください。
- 状態を観察するため入院をおすすめします。
- 緊急の処置が必要です。

---

# 11. Side effects and consent

Core patterns:

- この薬で眠気が出ることがあります。
- 吐き気が出ることがあります。
- まれにアレルギー反応が起こることがあります。
- 処置の目的は〜です。
- 主なリスクは〜です。
- ご不明な点はありますか。
- この方針でよろしいでしょうか。

---

# 12. Safety-netting

- 症状が悪化した場合はすぐに受診してください。
- 息苦しさが出た場合は救急受診してください。
- 強い胸痛が出た場合はすぐに医療機関を受診してください。
- 意識が悪くなった場合は救急車を呼んでください。

---

# 13. Discharge

- 本日は帰宅していただいて大丈夫です。
- 処方した薬を指示通りに飲んでください。
- 〇日後に外来を受診してください。
- 症状が改善しない場合は再度受診してください。

---

# 14. Essential disease vocabulary packs

The first implementation should prioritize common hospital and emergency conditions.

## Cardiovascular
- 高血圧
- 狭心症
- 心筋梗塞
- 心不全
- 不整脈
- 心房細動

## Respiratory
- 上気道炎
- 肺炎
- 気管支炎
- 喘息
- COPD
- 気胸
- 肺塞栓症

## Gastrointestinal
- 胃炎
- 胃腸炎
- 虫垂炎
- 胆石症
- 胆嚢炎
- 膵炎
- 消化管出血

## Neurological
- 脳梗塞
- 脳出血
- てんかん
- 片頭痛
- めまい

## Endocrine
- 糖尿病
- 低血糖
- 甲状腺機能亢進症
- 甲状腺機能低下症

## Infection
- インフルエンザ
- COVID-19
- デング熱
- 腸チフス
- 結核
- 尿路感染症
- 敗血症

## Musculoskeletal
- 骨折
- 捻挫
- 脱臼
- 腰痛
- 関節炎
- 変形性関節症

## Dermatology
- 蕁麻疹
- 湿疹
- 蜂窩織炎
- 帯状疱疹

## Pediatrics
- 発熱
- 脱水
- 肺炎
- 下痢
- 嘔吐
- けいれん

---

# 15. Emergency phrases

The system must prioritize these for rapid recall:

- 意識はありますか。
- 聞こえますか。
- 息はできますか。
- 胸が痛いですか。
- いつからですか。
- 手足は動かせますか。
- しびれはありますか。
- 救急処置を行います。
- 今すぐ検査が必要です。
- 状態が不安定です。
- 緊急で治療を開始します。

---

# 16. Cultural and communication notes

Include brief notes on:

- polite but concise questioning,
- avoiding excessively casual speech,
- confirming understanding,
- use of お薬手帳,
- Japanese date format,
- age counting conventions,
- medication naming differences,
- common Japanese hospital terminology,
- respectful communication with family.

Do not overgeneralize Japanese people or culture.
