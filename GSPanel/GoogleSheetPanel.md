# Panel：Google sheet + 「表格」功能
> why need panel? 隔離cente database，避免使用者直接操作；並在資料庫基礎上建立控制板，不浪費資源在多餘前端設計

### 需求
- 隔離目前web直接access的那一個center database(google sheet)
- 使用者雙方（老闆、教練）都有直觀可視化資料介面，by google sheet架設
    - **(先做出來) 老闆sheet：薪資統計（先做）**、教室數據（開課數、上課人數、售出....）等統計（之後）
    - (後續延伸) 教練sheet：筍包架的東西，每月可看自己的薪資（不用為每個教練單開，直接全部開在一張即可）(附圖片)

### 要有一個「每月統計薪資數據」的功能
- 第一功能-生成**每月薪資統計table**，for老闆：開一份新的google sheet"數據統計表", 每月資料存成一張table；每月按下按鈕後就會生成新的table，方便老闆發薪
- 次要功能-生成其他統計數據：擴充上述"數據統計表"，一樣是在每月生成的table裡面，增加更多表格記錄更多數據，如：二三樓教室上課人數、二三樓售課數、....
- how to 實作：實現功能by **Google Appscript** in Google sheet。先做第一功能，後續再延伸次要功能
- 問題點1：自動化＆測試問題
    - （以老闆sheet為例）原則上，每月要按時間自動生成「**每月薪資統計table**」（生成時間：center database之中”Setting“內設定的(PaymentDay, ___)資料pair）
    - 每月生成新的資料table之後，希望能實時更新其中資料（一樣先實作「薪資」部分）。問題在於，因為每月是一張新的table，必須確保生成時有設定好Appscript(or Appscript is base on sheet, instead of table? If so, that not a problem)
    - Deploy之後確實是要每月自動生成；但是testing時要怎麼測？原想像是有個按鈕不過Google sheet可以做按鈕嗎？
- 問題點2：Google Appscript的極限
    - 我不知道Google Appscript是否能實現「按照template生成一張新table」的效果。我希望這邊的自動化停留在Google sheet，目前想像中如果只能複製得話，是可以在要自動化的shee開template，然後複製下去。（沒辦法的話，先分析是哪個功能沒辦法？再討論要不要用其他方法實作/替換/移除，外接到n8n是最後手段）



### 要實作的東西：Google sheet的表格＆公式

### center database & column
- Teachers:ID	Name	Email	Phone	CreatedAt
- Courses:ID	Name	Description	CreatedAt
- SalaryRules:ID	EffectiveMonth	BaseRateZero	BaseRate1toN	TierStartAtNplus1	TierStep	TierBonus	Bonus5Card	Bonus10Card	IsLocked	LockedAt	CreatedAt
- Products:ID	ProductName	UnitPrice
- Attendances:ID	Date	CoachID	教練名稱	CourseID	課程名稱	StudentCount	CalculatedSalary	CreatedAt																			
- Sales:ID	Date	CoachID	教練名稱	ProductName	Quantity	UnitPrice	總金額	commission	CreatedAt																		
- Settings:Key	Value	Description	UpdatedAt																						
PS:only "Attendances" and "Sales" are record that update day by day; the other tables are both ling of setting, basically they won't change

### Payment Calculation = Attandances + Sales
- Attandences: must calculate by data of specialized month in "Attandances", base on rules in "MonthlySalaryRules"
- Sales : must add by data of specialized month in "Sales"'s "commission" 