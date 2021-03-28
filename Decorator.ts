import 'reflect-metadata'

export class Decorator<T> {


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
        const token = Symbol.for(`${Math.random()}`)
        const hooks = this.hooks
        const classWrapper = this.classWrapper

        const decorator = (options?: T) => C => {
            const D = {
                [C.name]: class extends C {
                    constructor(...args) {
                        super(...args)
                        for (const hook of hooks) hook(this)
                        classWrapper(this, options)
                    }
                }
            }
            Reflect.defineMetadata(token, options, D[C.name])
            return D[C.name] as any
        }

        const get_options = C => Reflect.getMetadata(token, C) as T
        return [decorator, get_options] as [typeof decorator, typeof get_options]
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