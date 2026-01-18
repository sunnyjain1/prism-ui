export interface Entity {
    id: string;
}

export interface IRepository<T extends Entity> {
    create(item: T): Promise<T>;
    findAll(params?: any): Promise<T[]>;
    findById(id: string): Promise<T | null>;
    update(id: string, item: Partial<T>): Promise<T>;
    delete(id: string): Promise<void>;
}
