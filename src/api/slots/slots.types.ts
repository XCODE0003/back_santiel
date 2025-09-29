export interface ISlot {
    id: number
    slug: string
    name: string
    url: string
    typeId: 'slot' | 'game'
}

export interface SlotItem {
    id: number
    slug: string
    name: string
    link: string
    image: string | null
}

export interface SlotListResponse {
    items: SlotItem[]
    pages: number
    count?: number
}
