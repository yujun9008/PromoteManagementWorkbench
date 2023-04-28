import { Client } from "@notionhq/client"
import { cloneDeep } from "lodash"

export async function fetchFromNotion(options: { apiKey: string; databaseId: string }) {
    let { databaseId: database_id, apiKey } = options

    let defineMap: any = {}
    const subTypeMap: any = {
        普通: "normal",
        风格: "style",
        质量: "quality",
        命令: "command",
        负面: "eg",
    }

    const notion = new Client({
        auth: apiKey,
        baseUrl: `https://cloudy-toad-cors-dgvpb2704n30.deno.dev/https://api.notion.com`,
    })

    let i = 0
    await once()
    async function once(start_cursor?: string) {
        let re = await notion.databases.query({ database_id, start_cursor })
        console.log(`[notion] get page${i} :${start_cursor ?? "init"}`)
        re.results.forEach((page: any) => {
            debugger
            let name = page.properties?.name.title?.[0]?.text?.content
            let prompt = page.properties?.prompt?.rich_text?.[0]?.text?.content
            let remark = page.properties?.remark?.rich_text?.[0]?.text?.content
            let type = page.properties?.type?.select?.name
            let item = { name, prompt, remark, type }
            if (!name) return
            defineMap[item?.text?.toLowerCase()] = item
            if (typeof alias === "string") {
                alias.split(/[,，]/).forEach((text) => {
                    text = text.trim()
                    if (text != "") {
                        let cloneItem = cloneDeep(item)
                        cloneItem.text = text
                        ;(cloneItem as any).isAlias = true
                        defineMap[text.toLowerCase()] = cloneItem
                    }
                })
            }
        })
        if (re.has_more) {
            await once(re.next_cursor!)
        }
    }
    console.log(`[notion] import ${Object.keys(defineMap).length} items.`)

    let databaseInfo: any = await notion.databases.retrieve({ database_id })
    let me = {
        name: databaseInfo?.title?.[0]?.text?.content,
        url: databaseInfo?.url,
    }
    return { defineMap, me }
}
