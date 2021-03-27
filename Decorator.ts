import 'reflect-metadata'

export class Decorator<T> {

    static createMetadataStorage = <T>() => {
        const token = Symbol()
        const decorator = (options: T) => (target, method) => {
            const list: Array<{ options: T, method: string }> = Reflect.getMetadata(token, target) || []
            list.push({ method, options })
            Reflect.defineMetadata(token, list, target)
        }
        const list_metadata = target => (Reflect.getMetadata(token, target) || []) as Array<{ options: T, method: string }>
        return [decorator, list_metadata] as [typeof decorator, typeof list_metadata]
    }

    private hooks: Function[] = []

    constructor(private classWrapper: (target, options: T) => any = () => { }) { }

    createPropertyOrMethodDecorator<T>(methodWrapper?: (target: any, method: string, options: T) => any) {
        const token = Symbol()
        const decorator = (options?: T) => (target, method, descriptor) => {
            const list = Reflect.getMetadata(token, target) || []
            list.push({ options, method })
            Reflect.defineMetadata(token, list, target)
        }
        methodWrapper && this.hooks.push(target => {
            const list = Reflect.getMetadata(token, target) as Array<{ options: T, method: string }> || []
            for (const { method, options } of list) methodWrapper(target, method, options)
        })
        const list_metadata = target => (Reflect.getMetadata(token, target) || []) as Array<{ method: string, options: T }>
        return [decorator, list_metadata] as [typeof decorator, typeof list_metadata]
    }

    getClassDecorator() {
        const hooks = this.hooks
        const classWrapper = this.classWrapper
        return (options?: T) => C => {
            const D = {
                [C.name]: class extends C {
                    constructor(...args) {
                        super(...args)
                        for (const hook of hooks) hook(this)
                        classWrapper(this, options)
                    }
                }
            }

            return D[C.name]
        }
    }

    getExtendableClass() {
        const hooks = this.hooks
        const classWrapper = this.classWrapper
        return (options: T = {} as any, C: { new(...args: any[]): any } = class { }) => new class extends C {
            constructor(...args) {
                super(...args)
                for (const hook of hooks) hook(this)
                classWrapper(this, options)
            }
        }
    }


    getActivatorFunction() {
        const hooks = this.hooks
        const classWrapper = this.classWrapper
        return (target, options?: T) => {
            for (const hook of hooks) hook(target)
            classWrapper(target, options)
        }
    }
}