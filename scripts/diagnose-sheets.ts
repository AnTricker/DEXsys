import { google } from 'googleapis'

/**
 * 診斷 Google Sheets 連線和資料格式
 * 執行: npx tsx scripts/diagnose-sheets.ts
 */

async function diagnoseSheets() {
    console.log('🔍 開始診斷 Google Sheets 連線...\n')

    // 1. 檢查環境變數
    console.log('📋 步驟 1: 檢查環境變數')
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL
    const privateKey = process.env.GOOGLE_PRIVATE_KEY

    if (!spreadsheetId) {
        console.error('❌ GOOGLE_SPREADSHEET_ID 未設定')
        return
    }
    console.log(`✅ GOOGLE_SPREADSHEET_ID: ${spreadsheetId}`)

    if (!serviceAccountEmail) {
        console.error('❌ GOOGLE_SERVICE_ACCOUNT_EMAIL 未設定')
        return
    }
    console.log(`✅ GOOGLE_SERVICE_ACCOUNT_EMAIL: ${serviceAccountEmail}`)

    if (!privateKey) {
        console.error('❌ GOOGLE_PRIVATE_KEY 未設定')
        return
    }
    console.log(`✅ GOOGLE_PRIVATE_KEY: 已設定 (${privateKey.length} 字元)`)

    // 2. 測試認證
    console.log('\n📋 步驟 2: 測試 Google Sheets API 認證')
    try {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: serviceAccountEmail,
                private_key: privateKey.replace(/\\n/g, '\n'),
            },
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        })

        const authClient = await auth.getClient()
        console.log('✅ 認證成功')

        // 3. 測試讀取試算表
        console.log('\n📋 步驟 3: 測試讀取試算表')
        const sheets = google.sheets({ version: 'v4', auth })

        // 讀取 Teachers 工作表
        console.log('\n--- Teachers 工作表 ---')
        try {
            const teachersResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Teachers!A1:C10',
            })
            const teachersRows = teachersResponse.data.values || []
            console.log(`✅ 成功讀取 ${teachersRows.length} 列`)
            console.log('前 3 列資料:')
            teachersRows.slice(0, 3).forEach((row, i) => {
                console.log(`  列 ${i + 1}: ${JSON.stringify(row)}`)
            })
        } catch (error: any) {
            console.error(`❌ 讀取失敗: ${error.message}`)
        }

        // 讀取 Courses 工作表
        console.log('\n--- Courses 工作表 ---')
        try {
            const coursesResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Courses!A1:C10',
            })
            const coursesRows = coursesResponse.data.values || []
            console.log(`✅ 成功讀取 ${coursesRows.length} 列`)
            console.log('前 3 列資料:')
            coursesRows.slice(0, 3).forEach((row, i) => {
                console.log(`  列 ${i + 1}: ${JSON.stringify(row)}`)
            })
        } catch (error: any) {
            console.error(`❌ 讀取失敗: ${error.message}`)
        }

        // 讀取 Attendances 工作表
        console.log('\n--- Attendances 工作表 ---')
        try {
            const attendancesResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: 'Attendances!A1:G10',
            })
            const attendancesRows = attendancesResponse.data.values || []
            console.log(`✅ 成功讀取 ${attendancesRows.length} 列`)
            console.log('前 3 列資料:')
            attendancesRows.slice(0, 3).forEach((row, i) => {
                console.log(`  列 ${i + 1}: ${JSON.stringify(row)}`)
            })
        } catch (error: any) {
            console.error(`❌ 讀取失敗: ${error.message}`)
        }

        // 4. 測試寫入
        console.log('\n📋 步驟 4: 測試寫入 (新增測試資料到 Attendances)')
        try {
            const testData = [
                [
                    'TEST' + Date.now(),
                    new Date().toISOString().split('T')[0],
                    'TEST_COACH',
                    'TEST_COURSE',
                    5,
                    500,
                    new Date().toISOString(),
                ]
            ]

            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range: 'Attendances!A:G',
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: testData,
                },
            })
            console.log('✅ 寫入測試資料成功')
            console.log('測試資料:', JSON.stringify(testData[0]))
        } catch (error: any) {
            console.error(`❌ 寫入失敗: ${error.message}`)
            if (error.errors) {
                console.error('詳細錯誤:', JSON.stringify(error.errors, null, 2))
            }
        }

        console.log('\n✅ 診斷完成!')
        console.log('\n建議:')
        console.log('1. 確認 Teachers 和 Courses 工作表中有資料')
        console.log('2. 確認工作表名稱正確 (Teachers, Courses, Attendances, Sales)')
        console.log('3. 確認試算表已分享給 Service Account: ' + serviceAccountEmail)

    } catch (error: any) {
        console.error('\n❌ 認證失敗:', error.message)
        if (error.code === 'ERR_OSSL_UNSUPPORTED') {
            console.error('\n可能原因: GOOGLE_PRIVATE_KEY 格式錯誤')
            console.error('請參考 PRIVATE_KEY_FIX.md 修正')
        }
    }
}

diagnoseSheets()
