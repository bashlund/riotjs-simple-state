//eslint-disable-next-line @typescript-eslint/no-explicit-any
type SharedObject = Record<string, any>;

export class StateController {
    /**
     * ref object is shared directly by its reference and can be used to share things such as
     * database connection objects, etc.
     */
    public ref: Record<string, any> = {};  //eslint-disable-line @typescript-eslint/no-explicit-any

    /**
     * Central repo for all shared objects been published.
     */
    protected repo: {[name: string]: SharedObject} = {};

    protected triggers: {[name: string]: ((sharedObject: SharedObject) => void)[]} = {};

    /**
     * Create a new SharedObject with given unique name.
     *
     * If a SharedObject by that name already exists then do nothing,
     * default values are not set in such case.
     *
     * Events are triggered upon creation, also if object already existed.
     *
     * @param name of the shared object
     * @param sharedObject optional default values to set (if object does not already exist)
     */
    public async create(name: string, sharedObject: SharedObject = {}) {
        if (!this.repo[name]) {
            this.set(name, sharedObject);
        }

        this.trigger(name);
    }

    /**
     * Delete created shared object.
     * No triggers are being emitted when deleting and all triggers will be void
     * and must we reregistered when applicable.
     *
     * @param name of the shared object
     */
    public delete(name: string) {
        delete this.repo[name];
        delete this.triggers[name];
    }

    /**
     * Load shared object from central repo.
     * If not available then wait until it is available.
     */
    public async load(name: string): Promise<SharedObject> {
        return new Promise<SharedObject>( (resolve) => {
            if (this.repo[name]) {
                resolve(this.get(name));

                return;
            }

            const fn = () => {
                this.triggerOff(name, fn);

                resolve(this.repo[name]);
            };

            this.triggerOn(name, fn);
        });
    }

    /**
     * Watch for new publish events for given shared object and trigger callback.
     * If shared object already exists then callback is first triggered with that object,
     * then each time the object is republished.
     *
     * Note that if the state object is deleted then all triggers will be removed
     * without any last trigger being sent.
     *
     * @returns unwatch function can be used to remove the watch
     */
    public watch(name: string, cb: (sharedObject: SharedObject) => void): () => void {
        this.triggerOn(name, cb);

        if (this.repo[name]) {
            cb(this.get(name));
        }

        const unwatchFn = () => {
            this.unwatch(name, cb);
        };

        return unwatchFn;
    }

    /**
     * Remove event trigger previously setup with watch().
     */
    public unwatch(name: string, cb: (sharedObject: SharedObject) => void) {
        this.triggerOff(name, cb);
    }

    /**
     * Publish an object to central repo and trigger all watchers.
     * @throws if state object does not exist
     */
    public async publish(name: string, sharedObject: SharedObject) {
        const existingSharedObject = this.repo[name];

        if (!existingSharedObject) {
            throw new Error(`SharedObject ${name} must exist prior to publishing update`);
        }

        if (JSON.stringify(existingSharedObject) === JSON.stringify(sharedObject)) {
            // Do not trigger for non updates.
            //
            return;
        }

        this.set(name, sharedObject);

        this.trigger(name);
    }

    protected trigger(name: string) {
        const fns = this.triggers[name] ?? [];

        fns.forEach( cb => cb(this.get(name)) );
    }

    protected triggerOn(name: string, cb: (sharedObject: SharedObject) => void) {
        const fns = this.triggers[name] ?? [];

        fns.push(cb);

        this.triggers[name] = fns;
    }

    protected triggerOff(name: string, cb: (sharedObject: SharedObject) => void) {
        const fns = this.triggers[name] ?? [];

        this.triggers[name] = fns.filter( cb2 => cb !== cb2 );
    }

    protected set(name: string, sharedObject: SharedObject) {
        this.repo[name] = JSON.parse(JSON.stringify(sharedObject));
    }

    protected get(name: string): SharedObject {
        return JSON.parse(JSON.stringify(this.repo[name]));
    }
}
