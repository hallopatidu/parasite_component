/**
 * Instance Inheritance Component | Implemented of Parasite Component.
 * - Extending this class to modify these methods of super class.
 * - Super Class would be a Class of the previous component in the same node.
 * - Instance is created by sub class of this class which can be extended the previous component in the same node (call by Inheritance Chain).
 * - The order of extending depend on the 'executionOrder' property of these components added to the node.
 * - All of methods are create by ParasiteComponent would be merged to the first component in the Inheritance Chain.
 * - Just using in the same node with super class
 * - Using with override decorator.
 * Author by hallopatidu@gmail.com
 */

const {ccclass, property} = cc._decorator;
const OVERRIDE_METHOD_MAP:string = '__$OverrideMethodMap__';
function getSuperMethod(target:any, methodName:string):Function{
    if(!target._$super || !target._root){
        return null
    }
    // In the case, this component is a first parasite component, we get function method from prototype of super.
    // In other case, these funtions would be get from the super instance.
    
    const superTarget:any = (target._$super === target._root) ? Object.getPrototypeOf(target['_$super']) : target._$super;    
    const superFuntion:Function = superTarget[methodName];
    if(superFuntion){
        return superFuntion.bind(target._$super);
    }else{
        return getSuperMethod(target._$super, methodName);
    }
}

/**
     * Can add override method for this method.
     * @param target 
     * @param propertyKey 
     * @param descriptor 
     */
export function override(target: cc.Component, propertyKey: string, descriptor: PropertyDescriptor){
    if(propertyKey === 'onLoad') {
        cc.error('Do not support overriding ' + propertyKey + ' method');
        return;
    }     
    if(CC_DEV){
        // if(!(js.getSuper(target.constructor) == ParasiteComponent)){
        if(!cc.js.isChildClassOf(target.constructor, ParasiteComponent)){
            cc.error('You should extending ParasiteComponent Class for this class to use @override');
        }
    }
    const methodName:string = propertyKey;
    let hasNewParasiteClass:boolean = false;
    let hasNewParasiteMethod:boolean = false;
    let listOfOverrideMethods:Set<string> = target[OVERRIDE_METHOD_MAP];       
    if(!listOfOverrideMethods){
        listOfOverrideMethods = target[OVERRIDE_METHOD_MAP] = new Set<string>();
        hasNewParasiteClass = true
    } 
    if(!listOfOverrideMethods.has(propertyKey)){
        listOfOverrideMethods.add(propertyKey);
        hasNewParasiteMethod = true
    }
    if(hasNewParasiteClass && hasNewParasiteMethod ){
        target['onLoad'] = ((previousOnLoad:Function)=> function(){
            if(!this.enabled) return;
            if(!this.super){
                const comps:cc.Component[] = this.node.getComponents(cc.Component);
                let lastComponent:cc.Component;
                for (let index = 0; index < comps.length; index++) {  
                    const comp:any = comps[index];
                    if(!comp) continue;
                    if(lastComponent && comp === this){
                        if(lastComponent && lastComponent['_$super']){
                            this._root = lastComponent['_root'] 
                        }else{
                            this._root = lastComponent
                        }                        
                        this._$super = lastComponent;
                        this._$superName = cc.js.getClassName(this._$super) + ' <' + this._root['node']?.name + '>';
                        // Initianizing the inheritance instance with 'this.super' property
                        if(this._$super && this._root){
                            // override all of methods has @override decorator tag.
                            listOfOverrideMethods.forEach((methodName:string)=>{
                                const originMethodName:string = '__$super'+ methodName + '__';
                                const originSuperMethod:Function = this[originMethodName];
                                if(!originSuperMethod){
                                    const thisDesc:PropertyDescriptor = cc.js.getPropertyDescriptor(this, methodName);                                    
                                    if(thisDesc){
                                        const descriptor:PropertyDescriptor = cc.js.getPropertyDescriptor(this._root, methodName);
                                        if(descriptor.get || descriptor.set){                                        
                                            cc.js.getset(this, originMethodName, descriptor.get.bind(this._root), descriptor.set.bind(this._root), descriptor.enumerable, descriptor.configurable);                                        
                                            cc.js.getset(this._root, methodName, thisDesc.get ? thisDesc.get.bind(this) : descriptor.get.bind(this._root) , thisDesc.set ? thisDesc.set.bind(this):descriptor.set.bind(this._root), thisDesc.enumerable, thisDesc.configurable)
                                        }else if(typeof descriptor.value == 'function'){
                                            // Save previous inheritance method with name ['__$super'+ methodName + '__']                                    
                                            this[originMethodName] = getSuperMethod(this, methodName);
                                            // Rewrite the origin super root method by this[methodName].
                                            this._root[methodName] = this[methodName].bind(this);
                                        }else{
                                            Object.defineProperty(this, originMethodName, descriptor);
                                            Object.defineProperty(this._root, methodName, thisDesc);
                                        }
                                    }
                                }
                            })
                        }
                        // 
                        const defaultFuntion:Function = function(){};
                        // Define this.super with proxy
                        if(!this.super && this._root && this._$super){                        
                            const superProxy = new Proxy(this._root, {
                                get: (target:any, prop:string) => {                                    
                                    if (Object.prototype.hasOwnProperty.call(target, prop)) {                                
                                        if (typeof target[prop] === 'function' ) {
                                            if(listOfOverrideMethods && listOfOverrideMethods.has(prop)){                                                    
                                                return this['__$super'+ prop + '__'];
                                            }
                                            return target[prop].bind(target);
                                        } else {
                                            return target[prop];
                                        }
                                    }else{
                                        return this['__$super'+ prop + '__'] || defaultFuntion;
                                    }
                                },
                                set:(target:any, prop:string, value:any):boolean => {
                                    if (typeof target[prop] !== 'function' ) {
                                        if(listOfOverrideMethods && listOfOverrideMethods.has(prop)){                                                    
                                            this['__$super'+ prop + '__'] = value;                                            
                                        }else{
                                            target[prop] = value
                                        }
                                        return true
                                    }
                                    return false
                                }
                            });
                            Object.defineProperty(this, 'super', {
                                get:()=>superProxy
                            })
                        }                            
                        break;
                    }else if(comp.enabled){                    
                        lastComponent = comp;
                    }
                    
                }// end for
            }

            return previousOnLoad ? previousOnLoad.call(this) : null;
        })(target['onLoad']);
        // 
        target['onDestroy'] = ((previousDestroy:Function)=>function(){            
            previousDestroy ? previousDestroy.call(this) : null;
            listOfOverrideMethods.forEach((methodName:string)=>{
                const originMethodName:string = '__$super'+ methodName + '__';
                delete this[originMethodName];
            })       
            this._$super = null;
            this._root = null;
            this.super = null;
        })(target['onDestroy'])
    }

}

@ccclass
export default abstract class ParasiteComponent<SuperComponent=cc.Component> extends cc.Component {

    @property({
        displayName: 'Extends',        
        readonly:true
    })
    get superName():string{
        return this._$superName
    }

    protected _root:cc.Component = null;
    protected _$super:SuperComponent = null;    
    protected _$superName:string = '';
    protected super:SuperComponent&cc.Component = null;
}
